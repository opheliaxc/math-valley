/**
 * Phase 2 Geometry — Section 9 path test (Grade 2).
 *
 * Run from repo root:
 *   node scripts/test-geometry-phase2.mjs
 */
import {
  domainIsPracticeable,
  getPracticeableZoneTopicIdsForGrade,
  getStandardsForTopic,
  getZoneTopicIdsForGrade,
} from '../src/data/curriculum-map.ts'
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
import { createPlayerState, isZoneEnterable } from '../src/data/playerState.ts'
import { syncPlayerZonesFromMastery } from '../src/data/masteryWorldMap.ts'
import { getZone, getZonesForGrade, getNextZoneId } from '../src/data/zones.ts'
import { generateQuestion } from '../question-generator/src/engine.ts'
import { validateQuestion, runValidationSuite } from '../question-generator/src/validate.ts'
import { isPictureOption } from '../question-generator/src/visual.ts'

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

console.log('\n1. Islands: names, order, Geometry last')
{
  const zones = getZonesForGrade(2)
  const ids = getZoneTopicIdsForGrade(2)
  assert('4 islands at grade 2', zones.length === 4)
  assert(
    'order OA→NBT→MD→Geometry',
    JSON.stringify(ids) ===
      JSON.stringify([
        'operations-algebraic-thinking',
        'number-operations-base-ten',
        'measurement-data',
        'geometry',
      ]),
  )
  assert(
    'names match',
    JSON.stringify(zones.map((z) => z.name)) ===
      JSON.stringify([
        'Ember Grove',
        'Glimmer Hoard Caverns',
        'Ticktock Treehouse',
        'Ember Shapes Quarry',
      ]),
  )
  assert('Geometry is last', ids[ids.length - 1] === 'geometry')
  assert(
    'Ember Shapes Quarry',
    getZone('geometry', 2).name === 'Ember Shapes Quarry',
  )
  assert('geometry practiceable', domainIsPracticeable('geometry', 2) === true)
  assert('no next after geometry', getNextZoneId('geometry', 2) === null)
  assert(
    'G1 still has Hatchling Shape Cove',
    getZone('geometry', 1).name === 'Hatchling Shape Cove',
  )
  assert(
    'G3 has Dragon\'s Forge after Phase 3 wire',
    getZone('geometry', 3).name === "Dragon's Forge",
  )
}

console.log('\n2. Standards generate + validate (beginner & advanced)')
{
  const codes = getStandardsForTopic('geometry', 2)
  assert(
    'G2 geometry standards',
    JSON.stringify(codes) ===
      JSON.stringify(['NY-2.G.1', 'NY-2.G.2', 'NY-2.G.3']),
  )

  for (const code of codes) {
    const types =
      code === 'NY-2.G.1'
        ? ['multiple-choice', 'true-false']
        : ['multiple-choice', 'true-false', 'short-answer']
    for (const difficulty of ['beginner', 'advanced']) {
      for (const type of types) {
        let visualHits = 0
        let failReasons = 0
        const prompts = new Set()
        for (let i = 0; i < 20; i++) {
          const q = generateQuestion({
            grade: 2,
            standard: code,
            difficulty,
            type,
            seed: 7000 + i * 37 + code.length + type.length,
          })
          prompts.add(q.prompt)
          const reasons = validateQuestion(q)
          if (reasons.length) failReasons += 1
          if (
            q.visual ||
            q.options?.some((o) => isPictureOption(o) && o.visual)
          ) {
            visualHits += 1
          }
          if (q.visual && !q.altText?.trim()) failReasons += 1
          if (q.options) {
            for (const opt of q.options) {
              if (isPictureOption(opt) && opt.visual && !opt.altText?.trim()) {
                failReasons += 1
              }
            }
          }
        }
        assert(
          `${code} ${difficulty} ${type}: 20/20 validate`,
          failReasons === 0,
        )
        assert(
          `${code} ${difficulty} ${type}: pictured`,
          visualHits >= 12,
        )
        assert(
          `${code} ${difficulty} ${type}: prompt variety`,
          prompts.size >= 1,
        )
      }
    }
  }
}

console.log('\n3. Extended validation suite — G.2 green; G.1 still green')
{
  const report = runValidationSuite({ samplesPerCombo: 50, seedBase: 11 })
  const geo2 = report.byStandard.filter((s) => s.standard.startsWith('NY-2.G.'))
  const geo1 = report.byStandard.filter((s) => s.standard.startsWith('NY-1.G.'))
  assert('three grade-2 geometry standards', geo2.length === 3)
  assert(
    'grade-2 geometry all pass',
    geo2.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    'grade-1 geometry still pass',
    geo1.every((s) => s.passed && s.failureCount === 0),
  )
  assert('full suite still green', report.totalFailed === 0)
}

console.log('\n4. Unlock path: MD → Ember Shapes Quarry; nothing beyond')
{
  let p = createInitialStudentProgress('geometry-g2-tester', 2)
  assert('geometry starts locked', p.topics.geometry.status === 'locked')
  assert(
    'geometry standard order',
    JSON.stringify(p.topics.geometry.standardOrder) ===
      JSON.stringify(['NY-2.G.1', 'NY-2.G.2', 'NY-2.G.3']),
  )

  p = masterTopic(p, 'operations-algebraic-thinking')
  p = masterTopic(p, 'number-operations-base-ten')
  assert('geometry still locked before MD', p.topics.geometry.status === 'locked')

  p = masterTopic(p, 'measurement-data')
  assert(
    'geometry unlocked after MD',
    p.topics.geometry.status === 'unlocked',
  )

  const player = createPlayerState({
    name: 'Geometry G2 Tester',
    grade: 2,
    avatarId: 'ember',
  })
  const synced = syncPlayerZonesFromMastery(
    { ...player, contentLevel: 2, studentProgress: p },
    p,
  )
  assert(
    'Ember Shapes Quarry enterable',
    isZoneEnterable(synced.player, 'geometry') === true,
  )

  let sessionP = p
  assert(
    'starts on NY-2.G.1 beginner',
    resolveQuestionTarget(sessionP, 'geometry').standard === 'NY-2.G.1' &&
      resolveQuestionTarget(sessionP, 'geometry').difficulty === 'beginner',
  )

  sessionP = masterStandard(sessionP, 'NY-2.G.1')
  sessionP = advanceActiveStandardIfNeeded(sessionP, 'geometry')
  sessionP = applyTopicUnlocksIfNeeded(sessionP, 'geometry').progress
  assert('NY-2.G.1 mastered', isStandardMastered(sessionP, 'NY-2.G.1'))
  assert(
    'active moves toward G.2',
    sessionP.topics.geometry.activeStandardIndex >= 1 ||
      resolveQuestionTarget(sessionP, 'geometry').standard === 'NY-2.G.2',
  )

  sessionP = masterStandard(sessionP, 'NY-2.G.2')
  sessionP = advanceActiveStandardIfNeeded(sessionP, 'geometry')
  sessionP = masterStandard(sessionP, 'NY-2.G.3')
  sessionP = advanceActiveStandardIfNeeded(sessionP, 'geometry')
  const unlock = applyTopicUnlocksIfNeeded(sessionP, 'geometry')
  sessionP = unlock.progress
  assert('geometry topic mastered', sessionP.topics.geometry.status === 'mastered')
  assert(
    'no zone unlocked beyond geometry',
    unlock.newlyUnlockedTopicId === null,
  )
  assert(
    'practiceable zones end at geometry',
    getPracticeableZoneTopicIdsForGrade(2).at(-1) === 'geometry',
  )

  const served = generateSessionQuestion(p, 'geometry')
  assert('session serves NY-2.G.*', served.standard.startsWith('NY-2.G.'))
  assert('session question has prompt', Boolean(served.prompt?.trim()))
}

console.log('\n5. Prior Grade 2 domains + Grade 1 Geometry unchanged')
{
  const g2 = getZonesForGrade(2)
  assert('first still Ember Grove', g2[0].name === 'Ember Grove')
  assert(
    'OA standards unchanged',
    JSON.stringify(getStandardsForTopic('operations-algebraic-thinking', 2)) ===
      JSON.stringify(['NY-2.OA.2a', 'NY-2.OA.1a', 'NY-2.OA.1b', 'NY-2.OA.4']),
  )
  assert(
    'G1 geometry standards unchanged',
    JSON.stringify(getStandardsForTopic('geometry', 1)) ===
      JSON.stringify(['NY-1.G.1', 'NY-1.G.2', 'NY-1.G.3']),
  )
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('Phase 2 Geometry path test FAILED')
  process.exit(1)
}
console.log('Phase 2 Geometry Section 9 path OK')
