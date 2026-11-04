/**
 * API endpoint checks (temp SQLite database).
 *
 * Run from repo root:
 *   npm run test:api
 */
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { closeDatabase } from '../server/db/connection.ts'
import { createSqliteStorage } from '../server/storage/sqlite-store.ts'
import { startApiServer } from '../server/api.ts'

let passed = 0
let failed = 0

function assert(label, condition) {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${label}`)
  } else {
    failed += 1
    console.error(`  ✗ ${label}`)
  }
}

async function req(base, method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { _raw: text }
  }
  return { status: res.status, json }
}

async function main() {
  console.log('Math Valley API tests')
  const dir = await mkdtemp(join(tmpdir(), 'mv-api-'))
  // Keep the live SQLite file out of the real data dir during API tests.
  const dbPath = join(dir, 'math-valley.db')
  process.env.DB_PATH = dbPath
  const storage = createSqliteStorage({ dbPath })
  const started = await startApiServer({
    storage,
    port: 0,
    host: '127.0.0.1',
    skipBackupScheduler: true,
    skipPidFile: true,
  })
  const addr = started.server.address()
  const port = typeof addr === 'object' && addr ? addr.port : started.port
  const base = `http://127.0.0.1:${port}`
  console.log(`  (temp server on ${base})`)

  try {
    const health = await req(base, 'GET', '/api/health')
    assert(
      'GET /api/health → 200',
      health.status === 200 &&
        health.json.ok === true &&
        typeof health.json.schemaVersion === 'number',
    )

    const invalidCreate = await req(base, 'POST', '/api/students', {
      name: '',
      grade: 99,
      avatarId: 'not-real',
    })
    assert(
      'POST /api/students invalid → 400',
      invalidCreate.status === 400 && typeof invalidCreate.json.error === 'string',
    )

    const created = await req(base, 'POST', '/api/students', {
      name: 'Api Kid',
      grade: 3,
      avatarId: 'ember',
    })
    assert('POST /api/students → 201', created.status === 201)
    const studentId = created.json.id
    assert('create returns id', typeof studentId === 'string' && studentId.startsWith('stu_'))

    const listed = await req(base, 'GET', '/api/students')
    assert('GET /api/students includes new student', listed.json.students.some((s) => s.id === studentId))

    const loaded = await req(base, 'GET', `/api/students/${studentId}`)
    assert('GET /api/students/:id → 200', loaded.status === 200)
    assert('loaded profile name', loaded.json.profile.name === 'Api Kid')

    const progressGet = await req(base, 'GET', `/api/students/${studentId}/progress`)
    assert('GET progress → 200', progressGet.status === 200)
    assert('initial xp 0', progressGet.json.player.xp === 0)

    const nextPlayer = {
      ...progressGet.json.player,
      xp: 25,
    }
    const progressPut = await req(
      base,
      'PUT',
      `/api/students/${studentId}/progress`,
      nextPlayer,
    )
    assert('PUT progress → 200', progressPut.status === 200 && progressPut.json.player.xp === 25)

    const badProgress = await req(base, 'PUT', `/api/students/${studentId}/progress`, {
      xp: -1,
    })
    assert('PUT progress invalid → 400', badProgress.status === 400)

    const now = new Date().toISOString()
    const sessionBody = {
      id: 'sess_test01',
      status: 'in_progress',
      topicId: 'geometry',
      startedAt: now,
      updatedAt: now,
      questionIndex: 2,
      correctCount: 1,
      phase: 'question',
      activeTopicId: 'geometry',
      sessionUnlockId: null,
      contentLevelAdvanced: false,
      answers: [
        { submitted: '4', correct: true, answeredAt: now },
      ],
      currentQuestion: { prompt: '2+2?', answer: '4' },
    }
    const sessionPut = await req(
      base,
      'PUT',
      `/api/students/${studentId}/session`,
      sessionBody,
    )
    assert('PUT session → 200', sessionPut.status === 200)
    assert(
      'session index saved',
      sessionPut.json.activeSession.questionIndex === 2,
    )

    const sessionGet = await req(base, 'GET', `/api/students/${studentId}/session`)
    assert(
      'GET session restores answers',
      sessionGet.json.activeSession.answers.length === 1,
    )

    const complete = await req(
      base,
      'POST',
      `/api/students/${studentId}/session/complete`,
      {
        total: 8,
        correctCount: 5,
        xpEarned: 20,
        player: { ...nextPlayer, xp: 45 },
      },
    )
    assert('POST session/complete → 200', complete.status === 200)
    assert('activeSession cleared', complete.json.activeSession === null)
    assert('history has 1 entry', complete.json.sessionHistory.length === 1)
    assert('final xp applied', complete.json.player.xp === 45)

    const patched = await req(base, 'PATCH', `/api/students/${studentId}/profile`, {
      name: 'Api Kid Renamed',
    })
    assert('PATCH profile → 200', patched.status === 200)
    assert('name updated', patched.json.profile.name === 'Api Kid Renamed')

    const missing = await req(base, 'GET', '/api/students/stu_doesnotexist')
    assert('missing student → 404', missing.status === 404)

    // Same grade+avatar, different name — allowed (name picker).
    const secondSameAvatar = await req(base, 'POST', '/api/students', {
      name: 'Other Kid',
      grade: 3,
      avatarId: 'ember',
    })
    assert(
      'same grade+avatar different name → 201',
      secondSameAvatar.status === 201,
    )
    assert(
      'second student has different id',
      secondSameAvatar.json.id !== studentId,
    )

    // Duplicate name (case-insensitive) on same grade+avatar — rejected.
    const duplicateName = await req(base, 'POST', '/api/students', {
      name: 'other kid',
      grade: 3,
      avatarId: 'ember',
    })
    assert('duplicate name → 409', duplicateName.status === 409)
    assert(
      'duplicate message mentions taken/avatar',
      typeof duplicateName.json.error === 'string' &&
        duplicateName.json.error.toLowerCase().includes('taken'),
    )

    const otherAvatar = await req(base, 'POST', '/api/students', {
      name: 'Other Kid',
      grade: 3,
      avatarId: 'sage',
    })
    assert('same grade different avatar → 201', otherAvatar.status === 201)

    const listedAgain = await req(base, 'GET', '/api/students')
    const resumeMatches = listedAgain.json.students.filter(
      (s) => s.profile.grade === 3 && s.profile.avatarId === 'ember',
    )
    assert('resume lookup finds two ember/g3', resumeMatches.length === 2)

    const resumed = await req(base, 'GET', `/api/students/${studentId}`)
    assert('resume loads same progress xp', resumed.json.player.xp === 45)

    // submit-answer: one transaction updates progress + session
    const forSubmit = await req(base, 'POST', '/api/students', {
      name: 'Submit Kid',
      grade: 2,
      avatarId: 'gold',
    })
    assert('submit-answer fixture student → 201', forSubmit.status === 201)
    const submitId = forSubmit.json.id
    const unlockedTopic =
      forSubmit.json.player.unlockedZones?.[0] ??
      'operations-algebraic-thinking'
    const topicProgress =
      forSubmit.json.player.studentProgress?.topics?.[unlockedTopic]
    const standardCode =
      topicProgress?.standardOrder?.[0] ?? 'NY-2.OA.1'
    const submitSessionPut = await req(
      base,
      'PUT',
      `/api/students/${submitId}/session`,
      {
        id: 'sess_submit1',
        status: 'in_progress',
        topicId: unlockedTopic,
        startedAt: now,
        updatedAt: now,
        questionIndex: 0,
        correctCount: 0,
        phase: 'question',
        activeTopicId: unlockedTopic,
        sessionUnlockId: null,
        contentLevelAdvanced: false,
        answers: [],
        currentQuestion: {
          id: 'q-submit-1',
          prompt: '1+1?',
          correctAnswer: '2',
          standard: standardCode,
          grade: 2,
          topic: unlockedTopic,
          difficulty: 'beginner',
          type: 'short-answer',
          explanation: 'one plus one is two',
        },
      },
    )
    assert(
      'PUT session for submit-answer → 200',
      submitSessionPut.status === 200,
    )

    const submitted = await req(
      base,
      'POST',
      `/api/students/${submitId}/submit-answer`,
      { submitted: '2' },
    )
    assert('POST submit-answer → 200', submitted.status === 200)
    assert('submit-answer marks correct', submitted.json.correct === true)
    assert(
      'submit-answer updates session phase',
      submitted.json.activeSession?.phase === 'feedback',
    )
    const attemptsAfter =
      submitted.json.player?.studentProgress?.standards?.[standardCode]
        ?.beginner?.attempts
    assert(
      'submit-answer logs attempt on standard',
      Array.isArray(attemptsAfter) && attemptsAfter.length >= 1,
    )
  } finally {
    await started.close()
    closeDatabase()
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
