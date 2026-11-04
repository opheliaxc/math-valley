/**
 * Storage contract tests (SQLite adapter).
 *
 *   npm run test:storage-contract
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import {
  DUPLICATE_PROFILE_MESSAGE,
  SCHEMA_VERSION,
} from '../server/storage.ts'
import { createSqliteStorage } from '../server/storage/sqlite-store.ts'
import { SCHEMA_COLUMNS } from '../server/db/schema-types.ts'
import {
  insertAttempt,
  recentWindow,
} from '../server/db/repositories/attempts.repo.ts'
import { createKysely } from '../server/db/kysely.ts'

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

function nowIso() {
  return new Date().toISOString()
}

function basePlayer(id, overrides = {}) {
  return {
    topicProgress: {
      geometry: { tierIndex: 0, correctStreak: 0, incorrectStreak: 0 },
    },
    studentProgress: {
      profileId: id,
      contentLevel: 2,
      topics: {
        geometry: {
          topicId: 'geometry',
          contentLevel: 2,
          standardOrder: ['NY-2.G.1'],
          activeStandardIndex: 0,
          status: 'unlocked',
        },
      },
      standards: {
        'NY-2.G.1': {
          standardCode: 'NY-2.G.1',
          status: 'active',
          beginner: { mastered: false, attempts: [] },
          advanced: { mastered: false, attempts: [] },
        },
      },
      missedQuestions: [],
    },
    contentLevel: 2,
    xp: 0,
    zoneXp: { geometry: 0 },
    unlockedZones: ['geometry'],
    ...overrides,
  }
}

function makeStudent(id, profile, playerOverrides = {}) {
  const t = nowIso()
  return {
    id,
    createdAt: t,
    updatedAt: t,
    profile,
    player: basePlayer(id, playerOverrides),
    sessionHistory: [],
    activeSession: null,
  }
}

function emptyDoc(students = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    students,
    meta: { activeStudentIdByDefault: null },
  }
}

function activeSession(partial = {}) {
  const t = nowIso()
  return {
    id: 'sess_active',
    status: 'in_progress',
    topicId: 'geometry',
    startedAt: t,
    updatedAt: t,
    questionIndex: 0,
    correctCount: 0,
    phase: 'question',
    activeTopicId: 'geometry',
    sessionUnlockId: null,
    contentLevelAdvanced: false,
    answers: [],
    currentQuestion: {
      id: 'q1',
      prompt: '1+1?',
      correctAnswer: '2',
      standard: 'NY-2.G.1',
      difficulty: 'beginner',
      type: 'short-answer',
      explanation: 'add',
    },
    ...partial,
  }
}

async function runContractSuite(label, createAdapter) {
  console.log(`\n=== ${label} ===`)
  const dir = await mkdtemp(join(tmpdir(), `mv-contract-${label}-`))
  try {
    const storage = createAdapter(dir)

    // --- profile create + lookup ---
    const alex = makeStudent('stu_alex', {
      name: 'Alex',
      grade: 3,
      avatarId: 'rose',
    })
    await storage.saveData(emptyDoc({ stu_alex: alex }))
    let data = await storage.loadData()
    assert(`${label}: create stores profile`, data.students.stu_alex?.profile.name === 'Alex')

    const matches = Object.values(data.students).filter(
      (s) => s.profile.grade === 3 && s.profile.avatarId === 'rose',
    )
    assert(`${label}: lookup by grade+avatar`, matches.length === 1)

    const sam = makeStudent('stu_sam', {
      name: 'Sam',
      grade: 3,
      avatarId: 'rose',
    })
    await storage.saveData(emptyDoc({ stu_alex: alex, stu_sam: sam }))
    data = await storage.loadData()
    assert(
      `${label}: two names same grade+avatar`,
      Object.keys(data.students).length === 2,
    )

    // --- duplicate name (case-insensitive) ---
    const alexDup = makeStudent('stu_alex2', {
      name: 'ALEX',
      grade: 3,
      avatarId: 'rose',
    })
    let dupThrew = false
    let dupMessage = ''
    try {
      await storage.saveData(
        emptyDoc({ stu_alex: alex, stu_alex2: alexDup }),
      )
    } catch (err) {
      dupThrew = true
      dupMessage = err instanceof Error ? err.message : String(err)
    }
    assert(`${label}: duplicate name rejected`, dupThrew)
    assert(
      `${label}: duplicate message`,
      dupMessage === DUPLICATE_PROFILE_MESSAGE ||
        dupMessage.includes('That name is taken'),
    )

    // --- session start / advance / complete / resume ---
    const withSession = {
      ...alex,
      activeSession: activeSession({ questionIndex: 0, correctCount: 0 }),
    }
    await storage.saveData(emptyDoc({ stu_alex: withSession }))
    data = await storage.loadData()
    assert(
      `${label}: session start`,
      data.students.stu_alex.activeSession?.id === 'sess_active',
    )

    await storage.updateData((current) => {
      const s = current.students.stu_alex
      return {
        ...current,
        students: {
          ...current.students,
          stu_alex: {
            ...s,
            activeSession: {
              ...s.activeSession,
              questionIndex: 1,
              correctCount: 1,
              answers: [
                {
                  submitted: '2',
                  correct: true,
                  answeredAt: nowIso(),
                },
              ],
              updatedAt: nowIso(),
            },
            updatedAt: nowIso(),
          },
        },
      }
    })
    data = await storage.loadData()
    assert(
      `${label}: session advance`,
      data.students.stu_alex.activeSession?.questionIndex === 1 &&
        data.students.stu_alex.activeSession?.answers.length === 1,
    )

    const resumeQuestion =
      data.students.stu_alex.activeSession?.currentQuestion?.id
    assert(`${label}: session resume keeps currentQuestion`, resumeQuestion === 'q1')

    await storage.updateData((current) => {
      const s = current.students.stu_alex
      const completedAt = nowIso()
      return {
        ...current,
        students: {
          ...current.students,
          stu_alex: {
            ...s,
            activeSession: null,
            sessionHistory: [
              {
                id: 'sess_active',
                topicId: 'geometry',
                startedAt: s.activeSession.startedAt,
                completedAt,
                total: 8,
                correctCount: 1,
                xpEarned: 10,
              },
            ],
            player: { ...s.player, xp: 10 },
            updatedAt: completedAt,
          },
        },
      }
    })
    data = await storage.loadData()
    assert(
      `${label}: session complete`,
      data.students.stu_alex.activeSession === null &&
        data.students.stu_alex.sessionHistory.length === 1 &&
        data.students.stu_alex.player.xp === 10,
    )

    // --- mastery flags + island state ---
    const mastered = makeStudent(
      'stu_master',
      { name: 'Morgan', grade: 2, avatarId: 'sage' },
      {
        xp: 50,
        studentProgress: {
          profileId: 'stu_master',
          contentLevel: 2,
          topics: {
            geometry: {
              topicId: 'geometry',
              contentLevel: 2,
              standardOrder: ['NY-2.G.1'],
              activeStandardIndex: 0,
              status: 'mastered',
            },
          },
          standards: {
            'NY-2.G.1': {
              standardCode: 'NY-2.G.1',
              status: 'mastered',
              beginner: {
                mastered: true,
                attempts: Array.from({ length: 8 }, (_, i) => ({
                  questionId: `qb${i}`,
                  correct: true,
                  timestamp: Date.parse('2026-01-01T00:00:00.000Z') + i * 1000,
                })),
              },
              advanced: {
                mastered: true,
                attempts: Array.from({ length: 8 }, (_, i) => ({
                  questionId: `qa${i}`,
                  correct: true,
                  timestamp: Date.parse('2026-01-02T00:00:00.000Z') + i * 1000,
                })),
              },
            },
          },
          missedQuestions: [],
        },
        unlockedZones: ['geometry', 'measurement-data'],
      },
    )
    await storage.saveData(emptyDoc({ stu_master: mastered }))
    data = await storage.loadData()
    const sp = data.students.stu_master.player.studentProgress
    assert(
      `${label}: mastery flags`,
      sp.standards['NY-2.G.1'].beginner.mastered === true &&
        sp.standards['NY-2.G.1'].advanced.mastered === true,
    )
    assert(
      `${label}: island/topic status`,
      sp.topics.geometry.status === 'mastered',
    )
    assert(
      `${label}: unlocked zones`,
      data.students.stu_master.player.unlockedZones.includes('measurement-data'),
    )

    // --- attempt window order (via full document + for sqlite also recentWindow) ---
    const attemptsOldestFirst =
      sp.standards['NY-2.G.1'].beginner.attempts.map((a) => a.questionId)
    assert(
      `${label}: attempt blob oldest-first`,
      attemptsOldestFirst[0] === 'qb0' &&
        attemptsOldestFirst[attemptsOldestFirst.length - 1] === 'qb7',
    )

    // --- submit-answer rollback simulation ---
    await runRollbackTest(label, dir, createAdapter)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function runRollbackTest(label, dir, _createAdapter) {
  // Throw inside the write transaction after the student row is written
  const path = join(dir, 'rollback.db')
  const baseline = createSqliteStorage({ dbPath: path })
  const student = makeStudent('stu_rb', {
    name: 'Riley',
    grade: 1,
    avatarId: 'ember',
  })
  await baseline.saveData(emptyDoc({ stu_rb: student }))

  const failing = createSqliteStorage({
    dbPath: path,
    skipMigrate: true,
    afterStudentWrite: () => {
      throw new Error('simulated submit-answer failure')
    },
  })
  let threw = false
  try {
    await failing.updateData((current) => {
      const s = current.students.stu_rb
      return {
        ...current,
        students: {
          stu_rb: {
            ...s,
            player: { ...s.player, xp: 999 },
            activeSession: activeSession(),
            updatedAt: nowIso(),
          },
        },
      }
    })
  } catch {
    threw = true
  }
  assert(`${label}: submit-answer failure throws`, threw)

  const after = createSqliteStorage({ dbPath: path, skipMigrate: true })
  const data = await after.loadData()
  assert(
    `${label}: submit-answer rollback keeps xp`,
    data.students.stu_rb.player.xp === 0,
  )
  assert(
    `${label}: submit-answer rollback keeps no session`,
    data.students.stu_rb.activeSession === null,
  )
}

async function runSqliteExtras() {
  console.log('\n=== sqlite extras ===')
  const dir = await mkdtemp(join(tmpdir(), 'mv-contract-extra-'))
  const dbPath = join(dir, 'extra.db')
  try {
    const storage = createSqliteStorage({ dbPath })
    const student = makeStudent('stu_win', {
      name: 'Win',
      grade: 2,
      avatarId: 'gold',
    })
    await storage.saveData(emptyDoc({ stu_win: student }))

    const sqlite = new Database(dbPath)
    sqlite.pragma('foreign_keys = ON')
    const db = createKysely(sqlite)
    for (let i = 0; i < 12; i += 1) {
      await insertAttempt(db, {
        studentId: 'stu_win',
        standardCode: 'NY-2.G.1',
        difficulty: 'beginner',
        questionId: `w${i}`,
        isCorrect: i % 2 === 0,
        createdAt: new Date(Date.parse('2026-03-01T00:00:00.000Z') + i * 1000).toISOString(),
      })
    }
    const window = await recentWindow(db, 'stu_win', 'NY-2.G.1', 'beginner')
    assert('sqlite: recentWindow length 10', window.length === 10)
    assert(
      'sqlite: recentWindow newest-first',
      window[0].question_id === 'w11' && window[9].question_id === 'w2',
    )
    await db.destroy()

    // schema-types.ts vs PRAGMA table_info
    const checkDb = new Database(dbPath, { readonly: true })
    const tables = checkDb
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
      )
      .all()
      .map((r) => r.name)

    const expectedTables = Object.keys(SCHEMA_COLUMNS).sort()
    const actualTables = [...tables].sort()
    assert(
      'schema: table set matches schema-types',
      JSON.stringify(expectedTables) === JSON.stringify(actualTables),
    )

    for (const table of expectedTables) {
      const info = checkDb.prepare(`PRAGMA table_info(${table})`).all()
      const actualCols = info.map((c) => c.name).sort()
      const expectedCols = [...SCHEMA_COLUMNS[table]].sort()
      assert(
        `schema: ${table} columns`,
        JSON.stringify(actualCols) === JSON.stringify(expectedCols),
      )
    }
    checkDb.close()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function main() {
  console.log('Math Valley storage contract tests')

  await runContractSuite('sqlite', (dir) =>
    createSqliteStorage({ dbPath: join(dir, 'data.db') }),
  )

  await runSqliteExtras()

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
