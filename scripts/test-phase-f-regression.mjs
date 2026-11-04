/**
 * Phase F — full curriculum-domain restructure regression.
 *
 * Covers grades 1–4: island names/order/counts, standard lists,
 * Beginner → Advanced → next-item unlock, island-to-island unlock,
 * content-level advance with re-lock, and question generation.
 *
 * Run from repo root:
 *   node scripts/test-phase-f-regression.mjs
 */
import {
  CURRICULUM_MAP,
  getPracticeableZoneTopicIdsForGrade,
  getStandardsForTopic,
  getZoneTopicIdsForGrade,
} from '../src/data/curriculum-map.ts'
import {
  advanceContentLevelIfNeeded,
  isContentLevelMastered,
} from '../src/data/contentLevelAdvance.ts'
import {
  createInitialStudentProgress,
  generateSessionQuestion,
  resolveQuestionTarget,
} from '../src/data/practiceSession.ts'
import {
  advanceActiveStandardIfNeeded,
  isStandardMastered,
  recordAttempt,
} from '../src/data/studentProgress.ts'
import { applyTopicUnlocksIfNeeded } from '../src/data/topicUnlock.ts'
import { getZone, getZonesForGrade } from '../src/data/zones.ts'
import { generateQuestion } from '../question-generator/src/engine.ts'
import { migrateStudentProgressToDomains } from '../src/data/migrateDomainProgress.ts'

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

function masterDifficulty(progress, code, difficulty) {
  let p = progress
  for (let i = 0; i < 8; i++) {
    p = recordAttempt(p, code, difficulty, true, `${code}-${difficulty}-${i}`, 'ok')
  }
  return p
}

function masterStandard(progress, code) {
  let p = masterDifficulty(progress, code, 'beginner')
  p = masterDifficulty(p, code, 'advanced')
  return p
}

function masterTopic(progress, topicId) {
  let p = progress
  for (const code of p.topics[topicId].standardOrder) {
    p = masterStandard(p, code)
    p = advanceActiveStandardIfNeeded(p, topicId)
    p = applyTopicUnlocksIfNeeded(p, topicId).progress
  }
  return p
}

function masterAllPracticeableZones(progress) {
  let p = progress
  for (const topicId of getPracticeableZoneTopicIdsForGrade(p.contentLevel)) {
    p = masterTopic(p, topicId)
  }
  return p
}

const EXPECTED_NAMES = {
  1: [
    'Hatchling Hollow',
    'Pebble Hoard Den',
    'Sundrop Nest',
    'Hatchling Shape Cove',
  ],
  2: [
    'Ember Grove',
    'Glimmer Hoard Caverns',
    'Ticktock Treehouse',
    'Ember Shapes Quarry',
  ],
  3: [
    'Stormwing Peaks',
    "Dragon's Vault",
    'Sundial Bazaar',
    'Fraction Falls',
    "Dragon's Forge",
  ],
  4: [
    'Skyfire Summit',
    "Elder's Treasury",
    'Chrono Exchange',
    'Crystal Shard Falls',
    'Skyfire Observatory',
  ],
}

const DOMAIN_ORDER = [
  'operations-algebraic-thinking',
  'number-operations-base-ten',
  'measurement-data',
  'number-operations-fractions',
  'geometry',
]

const EXPECTED_COUNTS = { 1: 4, 2: 4, 3: 5, 4: 5 }

console.log('\n══ 1. Islands: count, names, order (grades 1–4) ══')
for (const grade of [1, 2, 3, 4]) {
  const zones = getZonesForGrade(grade)
  const ids = getZoneTopicIdsForGrade(grade)
  const expectedCount = EXPECTED_COUNTS[grade]
  assert(`G${grade}: ${expectedCount} islands`, zones.length === expectedCount)
  assert(
    `G${grade}: no Fractions when grade < 3`,
    grade >= 3 || !ids.includes('number-operations-fractions'),
  )
  assert(
    `G${grade}: Geometry present for grades 1–4`,
    ids.includes('geometry'),
  )
  assert(
    `G${grade}: names match spec §7`,
    JSON.stringify(zones.map((z) => z.name)) ===
      JSON.stringify(EXPECTED_NAMES[grade]),
  )
  const orderSuffix = grade <= 2 ? '→G' : '→NF→G'
  assert(
    `G${grade}: domain order OA→NBT→MD${orderSuffix}`,
    JSON.stringify(ids) ===
      JSON.stringify(DOMAIN_ORDER.filter((id) => ids.includes(id))),
  )
  assert(
    `G${grade}: all listed islands practiceable`,
    zones.every((z) => z.practiceable),
  )
}

console.log('\n══ 2. Standard lists per island match curriculum map ══')
for (const grade of [1, 2, 3, 4]) {
  for (const topicId of getZoneTopicIdsForGrade(grade)) {
    const expected = [...getStandardsForTopic(topicId, grade)]
    const fromMap = [...CURRICULUM_MAP[topicId][grade]]
    assert(
      `G${grade} ${topicId}: standards match`,
      JSON.stringify(expected) === JSON.stringify(fromMap) && expected.length > 0,
    )
    // Every standard generates at least one beginner + advanced question
    for (const code of expected) {
      try {
        const b = generateQuestion({
          grade,
          standard: code,
          difficulty: 'beginner',
          seed: 11,
        })
        const a = generateQuestion({
          grade,
          standard: code,
          difficulty: 'advanced',
          seed: 22,
        })
        assert(
          `G${grade} ${code}: generates beginner+advanced`,
          Boolean(b.prompt && b.correctAnswer && a.prompt && a.correctAnswer),
        )
      } catch (err) {
        assert(
          `G${grade} ${code}: generates beginner+advanced`,
          false,
        )
        console.error(`      ${err.message}`)
      }
    }
  }
}

console.log('\n══ 3. Beginner → Advanced → next standard (Grade 1 OA) ══')
{
  let p = createInitialStudentProgress('reg', 1)
  const topicId = 'operations-algebraic-thinking'
  assert('OA unlocked at start', p.topics[topicId].status === 'unlocked')

  let target = resolveQuestionTarget(p, topicId)
  assert('starts NY-1.OA.6 beginner', target.standard === 'NY-1.OA.6')
  assert('starts beginner', target.difficulty === 'beginner')

  p = masterDifficulty(p, 'NY-1.OA.6', 'beginner')
  target = resolveQuestionTarget(p, topicId)
  assert('after beginner → advanced', target.difficulty === 'advanced')
  assert('still on OA.6', target.standard === 'NY-1.OA.6')

  p = masterDifficulty(p, 'NY-1.OA.6', 'advanced')
  assert('OA.6 fully mastered', isStandardMastered(p, 'NY-1.OA.6'))
  p = advanceActiveStandardIfNeeded(p, topicId)
  target = resolveQuestionTarget(p, topicId)
  assert('next standard NY-1.OA.1', target.standard === 'NY-1.OA.1')
  assert('next starts beginner', target.difficulty === 'beginner')
}

console.log('\n══ 4. Island-to-island unlock (each grade) ══')
for (const grade of [1, 2, 3, 4]) {
  let p = createInitialStudentProgress(`isle-${grade}`, grade)
  const zones = getPracticeableZoneTopicIdsForGrade(grade)
  assert(`G${grade}: first zone unlocked`, p.topics[zones[0]].status === 'unlocked')
  for (let i = 1; i < zones.length; i++) {
    assert(
      `G${grade}: ${zones[i]} starts locked`,
      p.topics[zones[i]].status === 'locked',
    )
  }

  for (let i = 0; i < zones.length - 1; i++) {
    p = masterTopic(p, zones[i])
    assert(
      `G${grade}: ${zones[i]} mastered`,
      p.topics[zones[i]].status === 'mastered',
    )
    assert(
      `G${grade}: unlocks ${zones[i + 1]}`,
      p.topics[zones[i + 1]].status === 'unlocked',
    )
    const q = generateSessionQuestion(p, zones[i + 1])
    assert(
      `G${grade}: can practice newly unlocked ${zones[i + 1]}`,
      q.standard.startsWith(`NY-${grade}.`),
    )
  }

  // Finish last island
  p = masterTopic(p, zones[zones.length - 1])
  assert(
    `G${grade}: last island mastered`,
    p.topics[zones[zones.length - 1]].status === 'mastered',
  )
  assert(`G${grade}: content level mastered`, isContentLevelMastered(p) === true)
}

console.log('\n══ 5. Content-level advance + re-lock (1→2, 2→3, 3→4) ══')
for (const from of [1, 2, 3]) {
  const to = /** @type {1|2|3|4} */ (from + 1)
  let p = createInitialStudentProgress(`adv-${from}`, from)
  p = masterAllPracticeableZones(p)
  const result = advanceContentLevelIfNeeded(p)
  assert(`L${from}→L${to}: advanced`, result.advanced === true)
  assert(`L${from}→L${to}: contentLevel=${to}`, result.contentLevel === to)

  const nextZones = getPracticeableZoneTopicIdsForGrade(to)
  const topics = result.progress.topics
  assert(
    `L${from}→L${to}: first zone unlocked only`,
    topics[nextZones[0]].status === 'unlocked' &&
      nextZones.slice(1).every((id) => topics[id].status === 'locked'),
  )
  assert(
    `L${from}→L${to}: first zone has grade-${to} standards`,
    topics[nextZones[0]].standardOrder[0]?.startsWith(`NY-${to}.`) === true,
  )
  assert(
    `L${from}→L${to}: activeStandardIndex reset`,
    topics[nextZones[0]].activeStandardIndex === 0,
  )

  // Map island count for new level
  const mapZones = getZonesForGrade(to)
  assert(
    `L${from}→L${to}: map shows ${EXPECTED_COUNTS[to]} islands`,
    mapZones.length === EXPECTED_COUNTS[to],
  )
  assert(
    `L${from}→L${to}: first island name ${EXPECTED_NAMES[to][0]}`,
    mapZones[0].name === EXPECTED_NAMES[to][0],
  )
}

console.log('\n══ 6. Cap at level 4 ══')
{
  let p = createInitialStudentProgress('cap', 4)
  p = masterAllPracticeableZones(p)
  const result = advanceContentLevelIfNeeded(p)
  assert('no advance past 4', result.advanced === false)
  assert('stays at 4', result.contentLevel === 4)
}

console.log('\n══ 7. Migration still preserves mastery ══')
{
  let legacy = {
    profileId: 'mig',
    contentLevel: /** @type {1} */ (1),
    topics: {
      'addition-subtraction': {
        topicId: 'addition-subtraction',
        contentLevel: 1,
        standardOrder: ['NY-1.OA.6', 'NY-1.OA.1', 'NY-1.OA.2', 'NY-1.NBT.4'],
        activeStandardIndex: 1,
        status: 'unlocked',
      },
      'word-problems': {
        topicId: 'word-problems',
        contentLevel: 1,
        standardOrder: ['NY-1.OA.1'],
        activeStandardIndex: 0,
        status: 'locked',
      },
    },
    standards: {},
    missedQuestions: [],
  }
  legacy = masterStandard(legacy, 'NY-1.OA.6')
  const migrated = migrateStudentProgressToDomains(legacy)
  assert('migrated OA.6 still mastered', isStandardMastered(migrated, 'NY-1.OA.6'))
  assert(
    'migrated onto domain keys',
    'operations-algebraic-thinking' in migrated.topics &&
      !('addition-subtraction' in migrated.topics),
  )
}

console.log('\n══ 8. Zone display names escalate with grade ══')
{
  assert(
    'OA name changes G1→G4',
    getZone('operations-algebraic-thinking', 1).name === 'Hatchling Hollow' &&
      getZone('operations-algebraic-thinking', 4).name === 'Skyfire Summit',
  )
  assert(
    'NF name changes G3→G4',
    getZone('number-operations-fractions', 3).name === 'Fraction Falls' &&
      getZone('number-operations-fractions', 4).name === 'Crystal Shard Falls',
  )
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('Phase F full regression OK')
