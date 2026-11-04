/**
 * Phase 4 helpers — contentLevel mastery & advance (re-lock A).
 *
 * Run from repo root:
 *   node scripts/test-content-level-advance.mjs
 */
import {
  advanceContentLevelIfNeeded,
  isContentLevelMastered,
} from '../src/data/contentLevelAdvance.ts'
import { applySessionAnswer, createInitialStudentProgress } from '../src/data/practiceSession.ts'
import { recordAttempt } from '../src/data/studentProgress.ts'
import { applyTopicUnlocksIfNeeded } from '../src/data/topicUnlock.ts'
import { getPracticeableZoneTopicIdsForGrade } from '../src/data/curriculum-map.ts'
import { createPlayerState } from '../src/data/playerState.ts'
import { syncPlayerZonesFromMastery } from '../src/data/masteryWorldMap.ts'

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

function masterAllZonesAtLevel(progress) {
  let p = progress
  for (const topicId of getPracticeableZoneTopicIdsForGrade(p.contentLevel)) {
    p = masterTopic(p, topicId)
  }
  return p
}

console.log('\n1. Not mastered until all zones done')
{
  let p = createInitialStudentProgress('t', 1)
  assert('fresh → false', isContentLevelMastered(p) === false)
  p = masterTopic(p, 'operations-algebraic-thinking')
  assert('only OA → false', isContentLevelMastered(p) === false)
}

console.log('\n2. Advance 1 → 2 with re-lock')
{
  let p = createInitialStudentProgress('t', 1)
  p = masterAllZonesAtLevel(p)
  assert('all G1 zones mastered → true', isContentLevelMastered(p) === true)

  const result = advanceContentLevelIfNeeded(p)
  assert('advanced flag', result.advanced === true)
  assert('contentLevel is 2', result.contentLevel === 2)
  assert('profile-agnostic previous was 1', result.previousContentLevel === 1)

  const topics = result.progress.topics
  assert(
    'OA unlocked at L2',
    topics['operations-algebraic-thinking'].status === 'unlocked',
  )
  assert(
    'NBT locked (re-lock A)',
    topics['number-operations-base-ten'].status === 'locked',
  )
  assert(
    'MD locked',
    topics['measurement-data'].status === 'locked',
  )
  assert(
    'NF not a zone at L2 (empty)',
    topics['number-operations-fractions'].standardOrder.length === 0,
  )
  assert(
    'L2 OA starts with grade-2 fluency',
    topics['operations-algebraic-thinking'].standardOrder[0] === 'NY-2.OA.2a',
  )
  assert(
    'activeStandardIndex reset',
    topics['operations-algebraic-thinking'].activeStandardIndex === 0,
  )
}

console.log('\n3. Cap at 4')
{
  let p = createInitialStudentProgress('t', 4)
  p = masterAllZonesAtLevel(p)
  assert('L4 mastered → true', isContentLevelMastered(p) === true)
  const result = advanceContentLevelIfNeeded(p)
  assert('does not advance past 4', result.advanced === false)
  assert('stays at 4', result.contentLevel === 4)
}

console.log('\n4. No advance when not mastered')
{
  const p = createInitialStudentProgress('t', 2)
  const result = advanceContentLevelIfNeeded(p)
  assert('not advanced', result.advanced === false)
  assert('stays 2', result.contentLevel === 2)
}

console.log('\n5. Session answer + map sync after mastering a full level')
{
  let p = createInitialStudentProgress('t', 1)
  p = masterAllZonesAtLevel(p)

  const dummy = {
    id: 'dummy-advance',
    standard: 'NY-1.OA.1',
    grade: 1,
    topic: 'operations-algebraic-thinking',
    difficulty: 'advanced',
    type: 'short-answer',
    prompt: 'advance check',
    correctAnswer: '1',
    explanation: 'n/a',
  }

  const session = applySessionAnswer(p, 'operations-algebraic-thinking', dummy, true)
  assert('applySessionAnswer advanced', session.contentLevelAdvanced === true)
  assert('session contentLevel is 2', session.contentLevel === 2)
  assert(
    'only first L2 zone unlocked in progress',
    session.progress.topics['operations-algebraic-thinking'].status === 'unlocked' &&
      session.progress.topics['number-operations-base-ten'].status === 'locked' &&
      session.progress.topics['measurement-data'].status === 'locked',
  )

  const player = createPlayerState({ name: 'Ada', grade: 1, avatarId: 'ember' })
  assert('profile.grade stays 1 on create', player.profile.grade === 1)
  const synced = syncPlayerZonesFromMastery(
    {
      ...player,
      unlockedZones: [
        'operations-algebraic-thinking',
        'measurement-data',
      ],
    },
    session.progress,
  )
  assert('player.contentLevel now 2', synced.player.contentLevel === 2)
  assert('profile.grade still 1 after sync', synced.player.profile.grade === 1)
  assert(
    'map re-locked to first zone only',
    JSON.stringify(synced.player.unlockedZones) ===
      JSON.stringify(['operations-algebraic-thinking']),
  )
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('Phase 4 content-level advance helpers OK')
