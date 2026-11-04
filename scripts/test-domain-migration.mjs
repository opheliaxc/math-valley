/**
 * Phase C test — migrate a legacy-topic profile and confirm mastery is kept.
 *
 * Run from repo root:
 *   node scripts/test-domain-migration.mjs
 */
import { migrateStudentProgressToDomains } from '../src/data/migrateDomainProgress.ts'
import {
  isStandardMastered,
  recordAttempt,
} from '../src/data/studentProgress.ts'

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

function masterStandard(progress, code) {
  let p = progress
  for (const d of ['beginner', 'advanced']) {
    for (let i = 0; i < 8; i++) {
      p = recordAttempt(p, code, d, true, `${code}-${d}-${i}`, 'ok')
    }
  }
  return p
}

/** Fake Grade 1 save shaped like the old topic keys. */
function buildLegacyGrade1Progress() {
  let p = {
    profileId: 'ada',
    contentLevel: /** @type {1} */ (1),
    topics: {
      'addition-subtraction': {
        topicId: 'addition-subtraction',
        contentLevel: 1,
        standardOrder: [
          'NY-1.OA.6',
          'NY-1.OA.1',
          'NY-1.OA.2',
          'NY-1.NBT.4',
          'NY-1.NBT.6',
        ],
        activeStandardIndex: 3,
        status: 'unlocked',
      },
      'multiplication-division': {
        topicId: 'multiplication-division',
        contentLevel: 1,
        standardOrder: [],
        activeStandardIndex: 0,
        status: 'locked',
      },
      'time-money-measurement': {
        topicId: 'time-money-measurement',
        contentLevel: 1,
        standardOrder: ['NY-1.MD.3a', 'NY-1.MD.3b', 'NY-1.MD.3c'],
        activeStandardIndex: 0,
        status: 'locked',
      },
      'word-problems': {
        topicId: 'word-problems',
        contentLevel: 1,
        standardOrder: ['NY-1.OA.1', 'NY-1.OA.2'],
        activeStandardIndex: 0,
        status: 'locked',
      },
    },
    standards: {},
    missedQuestions: [],
  }

  // Mastered all OA items in Addition Orchard; working NBT next.
  p = masterStandard(p, 'NY-1.OA.6')
  p = masterStandard(p, 'NY-1.OA.1')
  p = masterStandard(p, 'NY-1.OA.2')
  // Partial NBT progress (beginner only) — should not be lost.
  for (let i = 0; i < 3; i++) {
    p = recordAttempt(
      p,
      'NY-1.NBT.4',
      'beginner',
      true,
      `NY-1.NBT.4-beginner-${i}`,
      'ok',
    )
  }

  return p
}

console.log('\n1. Legacy → domain migration keeps mastery')
{
  const legacy = buildLegacyGrade1Progress()
  assert('pre: OA.6 mastered', isStandardMastered(legacy, 'NY-1.OA.6') === true)
  assert('pre: OA.1 mastered', isStandardMastered(legacy, 'NY-1.OA.1') === true)
  assert('pre: OA.2 mastered', isStandardMastered(legacy, 'NY-1.OA.2') === true)
  assert(
    'pre: NBT.4 not fully mastered',
    isStandardMastered(legacy, 'NY-1.NBT.4') === false,
  )
  assert(
    'pre: has NBT.4 beginner attempts',
    legacy.standards['NY-1.NBT.4'].beginner.attempts.length === 3,
  )

  const migrated = migrateStudentProgressToDomains(legacy)

  assert(
    'post: legacy topic keys removed',
    !('addition-subtraction' in migrated.topics) &&
      !('word-problems' in migrated.topics),
  )
  assert(
    'post: domain keys present',
    'operations-algebraic-thinking' in migrated.topics &&
      'number-operations-base-ten' in migrated.topics &&
      'measurement-data' in migrated.topics,
  )

  assert('post: OA.6 still mastered', isStandardMastered(migrated, 'NY-1.OA.6'))
  assert('post: OA.1 still mastered', isStandardMastered(migrated, 'NY-1.OA.1'))
  assert('post: OA.2 still mastered', isStandardMastered(migrated, 'NY-1.OA.2'))
  assert(
    'post: NBT.4 attempts preserved',
    migrated.standards['NY-1.NBT.4'].beginner.attempts.length === 3,
  )

  const oa = migrated.topics['operations-algebraic-thinking']
  const nbt = migrated.topics['number-operations-base-ten']
  const md = migrated.topics['measurement-data']

  assert('OA island mastered', oa.status === 'mastered')
  assert(
    'OA standardOrder is domain list',
    JSON.stringify(oa.standardOrder) ===
      JSON.stringify(['NY-1.OA.6', 'NY-1.OA.1', 'NY-1.OA.2']),
  )
  assert('NBT unlocked (prior OA mastered + in progress)', nbt.status === 'unlocked')
  assert(
    'NBT active index on NY-1.NBT.4',
    nbt.standardOrder[nbt.activeStandardIndex] === 'NY-1.NBT.4',
  )
  assert('MD still locked', md.status === 'locked')
}

console.log('\n2. Idempotent on already-migrated progress')
{
  const legacy = buildLegacyGrade1Progress()
  const once = migrateStudentProgressToDomains(legacy)
  const twice = migrateStudentProgressToDomains(once)
  assert(
    'second pass keeps OA mastered',
    twice.topics['operations-algebraic-thinking'].status === 'mastered',
  )
  assert(
    'second pass keeps NBT attempts',
    twice.standards['NY-1.NBT.4'].beginner.attempts.length === 3,
  )
  assert(
    'topic keys stable',
    JSON.stringify(Object.keys(once.topics).sort()) ===
      JSON.stringify(Object.keys(twice.topics).sort()),
  )
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('Phase C domain migration OK')
