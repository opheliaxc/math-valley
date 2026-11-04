/**
 * Step 5 scratch script — SQLite storage round-trip.
 *
 *   npm run db:try-sqlite-store
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SCHEMA_VERSION } from '../server/storage.ts'
import { createSqliteStorage } from '../server/storage/sqlite-store.ts'
import {
  insertAttempt,
  recentWindow,
} from '../server/db/repositories/attempts.repo.ts'
import { createKysely } from '../server/db/kysely.ts'
import Database from 'better-sqlite3'

const dir = await mkdtemp(join(tmpdir(), 'mv-sqlite-store-'))
const dbPath = join(dir, 'store.db')
console.log(`Temp DB: ${dbPath}`)

function minimalStudent(id, xp = 0) {
  const now = new Date().toISOString()
  return {
    id,
    createdAt: now,
    updatedAt: now,
    profile: { name: 'Test Kid', grade: 2, avatarId: 'sage' },
    player: {
      topicProgress: {
        geometry: { tierIndex: 1, correctStreak: 2, incorrectStreak: 0 },
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
            beginner: {
              mastered: false,
              attempts: [
                {
                  questionId: 'q1',
                  correct: true,
                  timestamp: Date.parse('2026-01-01T00:00:00.000Z'),
                },
                {
                  questionId: 'q2',
                  correct: false,
                  timestamp: Date.parse('2026-01-01T00:01:00.000Z'),
                },
              ],
            },
            advanced: { mastered: false, attempts: [] },
          },
        },
        missedQuestions: [
          {
            standardCode: 'NY-2.G.1',
            difficulty: 'beginner',
            prompt: 'What shape?',
            timestamp: Date.parse('2026-01-01T00:01:00.000Z'),
          },
        ],
      },
      contentLevel: 2,
      xp,
      zoneXp: { geometry: 10 },
      unlockedZones: ['geometry'],
    },
    sessionHistory: [
      {
        id: 'sess_hist1',
        topicId: 'geometry',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:10:00.000Z',
        total: 8,
        correctCount: 7,
        xpEarned: 40,
      },
    ],
    activeSession: {
      id: 'sess_active1',
      status: 'in_progress',
      topicId: 'geometry',
      startedAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:05:00.000Z',
      questionIndex: 1,
      correctCount: 1,
      phase: 'question',
      activeTopicId: 'geometry',
      sessionUnlockId: null,
      contentLevelAdvanced: false,
      answers: [
        {
          submitted: '3',
          correct: true,
          answeredAt: '2026-01-02T00:01:00.000Z',
        },
      ],
      currentQuestion: {
        id: 'q-cur',
        prompt: '2+1?',
        correctAnswer: '3',
        standard: 'NY-2.G.1',
        difficulty: 'beginner',
        type: 'short-answer',
        explanation: 'add',
      },
    },
  }
}

try {
  const storage = createSqliteStorage({ dbPath })

  const student = minimalStudent('stu_roundtrip', 25)
  await storage.saveData({
    schemaVersion: SCHEMA_VERSION,
    students: { stu_roundtrip: student },
    meta: { activeStudentIdByDefault: 'stu_roundtrip' },
  })

  const loaded = await storage.loadData()
  const s = loaded.students.stu_roundtrip
  const checks = [
    ['schemaVersion', loaded.schemaVersion === 1],
    ['name', s?.profile.name === 'Test Kid'],
    ['xp', s?.player.xp === 25],
    ['zoneXp', s?.player.zoneXp?.geometry === 10],
    ['unlocked', s?.player.unlockedZones?.[0] === 'geometry'],
    ['topic status', s?.player.studentProgress?.topics?.geometry?.status === 'unlocked'],
    [
      'attempt count',
      s?.player.studentProgress?.standards?.['NY-2.G.1']?.beginner?.attempts
        ?.length === 2,
    ],
    [
      'attempt order oldest-first',
      s?.player.studentProgress?.standards?.['NY-2.G.1']?.beginner?.attempts?.[0]
        ?.questionId === 'q1',
    ],
    ['missed', s?.player.studentProgress?.missedQuestions?.length === 1],
    ['history', s?.sessionHistory?.length === 1 && s.sessionHistory[0].xpEarned === 40],
    ['active phase', s?.activeSession?.phase === 'question'],
    ['active answers', s?.activeSession?.answers?.length === 1],
    ['currentQuestion', s?.activeSession?.currentQuestion?.id === 'q-cur'],
    ['meta', loaded.meta.activeStudentIdByDefault === 'stu_roundtrip'],
  ]

  let failed = 0
  for (const [label, ok] of checks) {
    console.log(ok ? `  ✓ ${label}` : `  ✗ ${label}`)
    if (!ok) failed += 1
  }

  // recentWindow newest-first via attempts repo on the same file
  const sqlite = new Database(dbPath)
  sqlite.pragma('foreign_keys = ON')
  const kysely = createKysely(sqlite)
  await insertAttempt(kysely, {
    studentId: 'stu_roundtrip',
    standardCode: 'NY-2.G.1',
    difficulty: 'beginner',
    questionId: 'q3',
    isCorrect: true,
    createdAt: '2026-01-01T00:02:00.000Z',
  })
  const window = await recentWindow(kysely, 'stu_roundtrip', 'NY-2.G.1', 'beginner')
  const newestFirst = window[0]?.question_id === 'q3'
  console.log(newestFirst ? '  ✓ recentWindow newest-first' : '  ✗ recentWindow newest-first')
  if (!newestFirst) failed += 1
  await kysely.destroy()

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`)
    process.exitCode = 1
  } else {
    console.log('\nOK — sqlite-store round-trip looks good.')
  }
} finally {
  await rm(dir, { recursive: true, force: true })
}
