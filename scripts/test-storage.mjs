/**
 * Storage validation checks (document shape — no JSON file adapter).
 *
 *   npm run test:storage
 */
import {
  SCHEMA_VERSION,
  StorageError,
  validateMathValleyData,
  validateProfile,
} from '../server/storage.ts'

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

function minimalStudent(id, xp = 0) {
  const now = new Date().toISOString()
  return {
    id,
    createdAt: now,
    updatedAt: now,
    profile: { name: 'Test Kid', grade: 2, avatarId: 'sage' },
    player: {
      topicProgress: {},
      studentProgress: {
        profileId: id,
        contentLevel: 2,
        topics: {},
        standards: {},
        missedQuestions: [],
      },
      contentLevel: 2,
      xp,
      zoneXp: {},
      unlockedZones: [],
    },
    sessionHistory: [],
    activeSession: null,
  }
}

async function main() {
  console.log('Math Valley storage validation tests')

  const ok = validateMathValleyData({
    schemaVersion: SCHEMA_VERSION,
    students: { stu_a: minimalStudent('stu_a', 3) },
    meta: { activeStudentIdByDefault: 'stu_a' },
  })
  assert('valid document accepted', ok.students.stu_a.player.xp === 3)
  assert('schemaVersion preserved', ok.schemaVersion === SCHEMA_VERSION)

  let rejected = false
  try {
    validateMathValleyData({ schemaVersion: 1, students: { x: { id: 'y' } } })
  } catch (err) {
    rejected = err instanceof StorageError && err.code === 'VALIDATION'
  }
  assert('invalid student rejected', rejected)

  let badProfile = false
  try {
    validateProfile({ name: '', grade: 2, avatarId: 'sage' }, 'profile')
  } catch (err) {
    badProfile = err instanceof StorageError && err.code === 'VALIDATION'
  }
  assert('empty name rejected', badProfile)

  let badActive = false
  try {
    validateMathValleyData({
      schemaVersion: 1,
      students: { stu_a: minimalStudent('stu_a') },
      meta: { activeStudentIdByDefault: 'missing' },
    })
  } catch (err) {
    badActive = err instanceof StorageError && err.code === 'VALIDATION'
  }
  assert('unknown activeStudentId rejected', badActive)

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
