/**
 * Phase E test — master MD at Grade 3, unlock Fraction Falls, serve NF questions.
 *
 * Run from repo root:
 *   node scripts/test-fractions-unlock.mjs
 */
import { domainIsPracticeable } from '../src/data/curriculum-map.ts'
import {
  applySessionAnswer,
  createInitialStudentProgress,
  generateSessionQuestion,
  resolveQuestionTarget,
} from '../src/data/practiceSession.ts'
import { recordAttempt } from '../src/data/studentProgress.ts'
import { applyTopicUnlocksIfNeeded } from '../src/data/topicUnlock.ts'
import { createPlayerState, isZoneEnterable } from '../src/data/playerState.ts'
import { syncPlayerZonesFromMastery } from '../src/data/masteryWorldMap.ts'
import { getZone, getZonesForGrade } from '../src/data/zones.ts'

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

function masterTopic(progress, topicId) {
  let p = progress
  const order = p.topics[topicId].standardOrder
  for (const code of order) {
    p = masterStandard(p, code)
    p = applyTopicUnlocksIfNeeded(p, topicId).progress
  }
  return p
}

console.log('\n1. Grade 3 map shows Fraction Falls as practiceable')
{
  const zones = getZonesForGrade(3)
  const nf = zones.find((z) => z.id === 'number-operations-fractions')
  assert('4 islands at grade 3', zones.length === 4)
  assert('named Fraction Falls', nf?.name === 'Fraction Falls')
  assert('practiceable', nf?.practiceable === true)
  assert(
    'domainIsPracticeable NF@3',
    domainIsPracticeable('number-operations-fractions', 3) === true,
  )
}

console.log('\n2. Master OA → NBT → MD, then NF unlocks')
{
  let p = createInitialStudentProgress('fractions-tester', 3)
  assert(
    'NF starts locked',
    p.topics['number-operations-fractions'].status === 'locked',
  )

  p = masterTopic(p, 'operations-algebraic-thinking')
  p = masterTopic(p, 'number-operations-base-ten')
  assert(
    'NF still locked before MD done',
    p.topics['number-operations-fractions'].status === 'locked',
  )

  p = masterTopic(p, 'measurement-data')
  assert(
    'NF unlocked after MD mastered',
    p.topics['number-operations-fractions'].status === 'unlocked',
  )
  assert(
    'NF starts at NY-3.NF.1',
    p.topics['number-operations-fractions'].standardOrder[0] === 'NY-3.NF.1',
  )

  const player = createPlayerState({
    name: 'Fractions Tester',
    grade: 3,
    avatarId: 'ember',
  })
  const synced = syncPlayerZonesFromMastery(
    { ...player, contentLevel: 3, studentProgress: p },
    p,
  )
  assert(
    'Fraction Falls enterable on map',
    isZoneEnterable(synced.player, 'number-operations-fractions') === true,
  )
  assert(
    'banner name is Fraction Falls',
    getZone('number-operations-fractions', 3).name === 'Fraction Falls',
  )

  const target = resolveQuestionTarget(p, 'number-operations-fractions')
  assert('serves NY-3.NF.1 beginner', target.standard === 'NY-3.NF.1')
  assert('difficulty beginner', target.difficulty === 'beginner')

  const q1 = generateSessionQuestion(p, 'number-operations-fractions')
  const q2 = generateSessionQuestion(p, 'number-operations-fractions')
  assert('question has prompt', Boolean(q1.prompt && q1.correctAnswer))
  assert('standard is NF', q1.standard.startsWith('NY-3.NF.'))
  assert(
    'variety across two rolls (or same seed-independent prompts differ often)',
    q1.prompt !== q2.prompt || q1.correctAnswer !== q2.correctAnswer || q1.id !== q2.id,
  )

  const after = applySessionAnswer(p, 'number-operations-fractions', q1, true)
  assert(
    'answering NF records attempt',
    after.progress.standards[q1.standard]?.beginner.attempts.length >= 1,
  )
}

console.log('\n3. Grade 4 Crystal Shard Falls practiceable')
{
  const zones = getZonesForGrade(4)
  const nf = zones.find((z) => z.id === 'number-operations-fractions')
  assert('named Crystal Shard Falls', nf?.name === 'Crystal Shard Falls')
  assert('practiceable at grade 4', nf?.practiceable === true)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('Phase E fractions unlock OK')
