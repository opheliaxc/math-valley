/**
 * Phase 1 Geometry — Section 9 path test (Grade 1 only).
 *
 * Run from repo root:
 *   node scripts/test-geometry-phase1.mjs
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
import { validateQuestion } from '../question-generator/src/validate.ts'
import { isPictureOption } from '../question-generator/src/visual.ts'
import { runValidationSuite } from '../question-generator/src/validate.ts'

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
  const zones = getZonesForGrade(1)
  const ids = getZoneTopicIdsForGrade(1)
  assert('4 islands at grade 1', zones.length === 4)
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
        'Hatchling Hollow',
        'Pebble Hoard Den',
        'Sundrop Nest',
        'Hatchling Shape Cove',
      ]),
  )
  assert('Geometry is last', ids[ids.length - 1] === 'geometry')
  assert(
    'Hatchling Shape Cove',
    getZone('geometry', 1).name === 'Hatchling Shape Cove',
  )
  assert('geometry practiceable', domainIsPracticeable('geometry', 1) === true)
  assert('no next after geometry', getNextZoneId('geometry', 1) === null)
  assert(
    'G2 has geometry zone (Phase 2)',
    getZoneTopicIdsForGrade(2).includes('geometry'),
  )
  assert(
    'G3 has Dragon\'s Forge after Phase 3 wire',
    getZone('geometry', 3).name === "Dragon's Forge",
  )
}

console.log('\n2. Standards generate + validate (beginner & advanced)')
{
  const codes = getStandardsForTopic('geometry', 1)
  assert(
    'G1 geometry standards',
    JSON.stringify(codes) ===
      JSON.stringify(['NY-1.G.1', 'NY-1.G.2', 'NY-1.G.3']),
  )

  for (const code of codes) {
    for (const difficulty of ['beginner', 'advanced']) {
      let visualHits = 0
      let failReasons = 0
      const prompts = new Set()
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion({
          grade: 1,
          standard: code,
          difficulty,
          seed: 5000 + i * 31 + code.length,
        })
        prompts.add(q.prompt)
        const reasons = validateQuestion(q)
        if (reasons.length) failReasons += 1
        if (q.visual || q.options?.some((o) => isPictureOption(o) && o.visual)) {
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
      assert(`${code} ${difficulty}: 20/20 validate`, failReasons === 0)
      assert(`${code} ${difficulty}: mostly pictured`, visualHits >= 12)
      assert(`${code} ${difficulty}: prompt variety`, prompts.size >= 2)
    }
  }
}

console.log('\n3. Extended validation suite includes G.1 with 0 failures')
{
  const report = runValidationSuite({ samplesPerCombo: 50, seedBase: 7 })
  const geo = report.byStandard.filter((s) => s.standard.startsWith('NY-1.G.'))
  assert('three geometry standards in suite', geo.length === 3)
  assert(
    'geometry standards all pass',
    geo.every((s) => s.passed && s.failureCount === 0),
  )
  assert('full suite still green', report.totalFailed === 0)
}

console.log('\n4. Unlock path: MD → Shape Cove; last item unlocks nothing beyond')
{
  let p = createInitialStudentProgress('geometry-tester', 1)
  assert('geometry starts locked', p.topics.geometry.status === 'locked')
  assert(
    'geometry standard order',
    JSON.stringify(p.topics.geometry.standardOrder) ===
      JSON.stringify(['NY-1.G.1', 'NY-1.G.2', 'NY-1.G.3']),
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
    name: 'Geometry Tester',
    grade: 1,
    avatarId: 'ember',
  })
  const synced = syncPlayerZonesFromMastery(
    { ...player, contentLevel: 1, studentProgress: p },
    p,
  )
  assert(
    'Shape Cove enterable on map',
    isZoneEnterable(synced.player, 'geometry') === true,
  )

  // Beginner → advanced → next standard inside geometry
  let sessionP = p
  assert(
    'starts on NY-1.G.1 beginner',
    resolveQuestionTarget(sessionP, 'geometry').standard === 'NY-1.G.1' &&
      resolveQuestionTarget(sessionP, 'geometry').difficulty === 'beginner',
  )

  sessionP = masterStandard(sessionP, 'NY-1.G.1')
  sessionP = advanceActiveStandardIfNeeded(sessionP, 'geometry')
  sessionP = applyTopicUnlocksIfNeeded(sessionP, 'geometry').progress
  assert('NY-1.G.1 mastered', isStandardMastered(sessionP, 'NY-1.G.1'))
  assert(
    'active moves toward G.2',
    sessionP.topics.geometry.activeStandardIndex >= 1 ||
      resolveQuestionTarget(sessionP, 'geometry').standard === 'NY-1.G.2',
  )

  sessionP = masterStandard(sessionP, 'NY-1.G.2')
  sessionP = advanceActiveStandardIfNeeded(sessionP, 'geometry')
  sessionP = masterStandard(sessionP, 'NY-1.G.3')
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
    getPracticeableZoneTopicIdsForGrade(1).at(-1) === 'geometry',
  )

  // Session can serve a geometry picture question (from unlocked state before full mastery)
  const served = generateSessionQuestion(p, 'geometry')
  assert('session serves geometry standard', served.standard.startsWith('NY-1.G.'))
  assert('session question has prompt', Boolean(served.prompt?.trim()))
}

console.log('\n5. Prior domains unchanged (OA still first)')
{
  const zones = getZonesForGrade(1)
  assert('first still Hatchling Hollow', zones[0].name === 'Hatchling Hollow')
  assert(
    'OA standards unchanged',
    JSON.stringify(getStandardsForTopic('operations-algebraic-thinking', 1)) ===
      JSON.stringify(['NY-1.OA.6', 'NY-1.OA.1', 'NY-1.OA.2']),
  )
}

console.log(
  `\n${passed} passed, ${failed} failed`,
)
if (failed > 0) {
  console.error('Phase 1 Geometry path test FAILED')
  process.exit(1)
}
console.log('Phase 1 Geometry Section 9 path OK')
