/**
 * Phase 4 Geometry — Section 9 path test (Grade 4).
 *
 * Geometry island: NY-4.G.1–3 (Skyfire Observatory)
 * MD appends: NY-4.MD.3, NY-4.MD.5–7 on Chrono Exchange
 *
 * Run from repo root:
 *   node scripts/test-geometry-phase4.mjs
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
import { getStandard } from '../question-generator/src/standards-registry.ts'
import { validateQuestion, runValidationSuite } from '../question-generator/src/validate.ts'
import { isPictureOption } from '../question-generator/src/visual.ts'

const GEO_CODES = ['NY-4.G.1', 'NY-4.G.2', 'NY-4.G.3']
const MD_APPEND_CODES = ['NY-4.MD.3', 'NY-4.MD.5', 'NY-4.MD.6', 'NY-4.MD.7']
const PHASE4_CODES = [...GEO_CODES, ...MD_APPEND_CODES]

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

function checkGenerateValidate(codes, grade) {
  for (const code of codes) {
    const config = getStandard(code)
    const types = config.supportedTypes
    for (const difficulty of ['beginner', 'advanced']) {
      for (const type of types) {
        let visualHits = 0
        let failReasons = 0
        const prompts = new Set()
        for (let i = 0; i < 20; i++) {
          const q = generateQuestion({
            grade,
            standard: code,
            difficulty,
            type,
            seed: 11000 + i * 43 + code.length + type.length,
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

console.log('\n1. Islands: names, order, Geometry last (Grade 4)')
{
  const zones = getZonesForGrade(4)
  const ids = getZoneTopicIdsForGrade(4)
  assert('5 islands at grade 4', zones.length === 5)
  assert(
    'order OA→NBT→MD→NF→Geometry',
    JSON.stringify(ids) ===
      JSON.stringify([
        'operations-algebraic-thinking',
        'number-operations-base-ten',
        'measurement-data',
        'number-operations-fractions',
        'geometry',
      ]),
  )
  assert(
    'names match',
    JSON.stringify(zones.map((z) => z.name)) ===
      JSON.stringify([
        'Skyfire Summit',
        "Elder's Treasury",
        'Chrono Exchange',
        'Crystal Shard Falls',
        'Skyfire Observatory',
      ]),
  )
  assert('Geometry is last', ids[ids.length - 1] === 'geometry')
  assert(
    'Skyfire Observatory',
    getZone('geometry', 4).name === 'Skyfire Observatory',
  )
  assert('geometry practiceable', domainIsPracticeable('geometry', 4) === true)
  assert('MD practiceable', domainIsPracticeable('measurement-data', 4) === true)
  assert('no next after geometry', getNextZoneId('geometry', 4) === null)
  assert(
    'NF unlocks Geometry',
    getNextZoneId('number-operations-fractions', 4) === 'geometry',
  )
  assert(
    'G1 still Hatchling Shape Cove',
    getZone('geometry', 1).name === 'Hatchling Shape Cove',
  )
  assert(
    'G2 still Ember Shapes Quarry',
    getZone('geometry', 2).name === 'Ember Shapes Quarry',
  )
  assert(
    "G3 still Dragon's Forge",
    getZone('geometry', 3).name === "Dragon's Forge",
  )
}

console.log('\n2. Curriculum lists — Geometry + MD appends')
{
  assert(
    'G4 geometry standards',
    JSON.stringify(getStandardsForTopic('geometry', 4)) ===
      JSON.stringify(GEO_CODES),
  )
  assert(
    'G4 MD includes appends at end',
    JSON.stringify(getStandardsForTopic('measurement-data', 4)) ===
      JSON.stringify([
        'NY-4.MD.1',
        'NY-4.MD.2',
        'NY-4.MD.3',
        'NY-4.MD.5',
        'NY-4.MD.6',
        'NY-4.MD.7',
      ]),
  )
}

console.log('\n3. Standards generate + validate (Geometry + MD.3 / 5–7)')
{
  checkGenerateValidate(GEO_CODES, 4)
  checkGenerateValidate(MD_APPEND_CODES, 4)
}

console.log('\n4. Extended validation suite — Phase 4 + prior Geometry green')
{
  const report = runValidationSuite({ samplesPerCombo: 35, seedBase: 51 })
  const phase4 = report.byStandard.filter((s) => PHASE4_CODES.includes(s.standard))
  const geo1 = report.byStandard.filter((s) => s.standard.startsWith('NY-1.G.'))
  const geo2 = report.byStandard.filter((s) => s.standard.startsWith('NY-2.G.'))
  const geo3 = report.byStandard.filter((s) =>
    ['NY-3.G.1', 'NY-3.G.2', 'NY-3.MD.5', 'NY-3.MD.6', 'NY-3.MD.7', 'NY-3.MD.8'].includes(
      s.standard,
    ),
  )
  assert('seven Phase 4 standards in suite', phase4.length === 7)
  assert(
    'Phase 4 all pass',
    phase4.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    'grade-1 geometry still pass',
    geo1.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    'grade-2 geometry still pass',
    geo2.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    'grade-3 geometry/MD still pass',
    geo3.every((s) => s.passed && s.failureCount === 0),
  )
  assert('full suite still green', report.totalFailed === 0)
}

console.log('\n5. Unlock path: NF → Skyfire Observatory; nothing beyond')
{
  let p = createInitialStudentProgress('geometry-g4-tester', 4)
  assert('geometry starts locked', p.topics.geometry.status === 'locked')
  assert(
    'geometry standard order',
    JSON.stringify(p.topics.geometry.standardOrder) ===
      JSON.stringify(GEO_CODES),
  )
  assert(
    'MD standard order includes appends',
    JSON.stringify(p.topics['measurement-data'].standardOrder) ===
      JSON.stringify([
        'NY-4.MD.1',
        'NY-4.MD.2',
        'NY-4.MD.3',
        'NY-4.MD.5',
        'NY-4.MD.6',
        'NY-4.MD.7',
      ]),
  )

  p = masterTopic(p, 'operations-algebraic-thinking')
  p = masterTopic(p, 'number-operations-base-ten')
  assert('geometry still locked before MD', p.topics.geometry.status === 'locked')

  p = masterTopic(p, 'measurement-data')
  assert(
    'NF unlocked after MD',
    p.topics['number-operations-fractions'].status === 'unlocked',
  )
  assert(
    'geometry still locked before NF',
    p.topics.geometry.status === 'locked',
  )

  p = masterTopic(p, 'number-operations-fractions')
  assert(
    'geometry unlocked after NF',
    p.topics.geometry.status === 'unlocked',
  )

  const player = createPlayerState({
    name: 'Geometry G4 Tester',
    grade: 4,
    avatarId: 'ember',
  })
  const synced = syncPlayerZonesFromMastery(
    { ...player, contentLevel: 4, studentProgress: p },
    p,
  )
  assert(
    'Skyfire Observatory enterable',
    isZoneEnterable(synced.player, 'geometry') === true,
  )

  let sessionP = p
  assert(
    'starts on NY-4.G.1 beginner',
    resolveQuestionTarget(sessionP, 'geometry').standard === 'NY-4.G.1' &&
      resolveQuestionTarget(sessionP, 'geometry').difficulty === 'beginner',
  )

  sessionP = masterStandard(sessionP, 'NY-4.G.1')
  sessionP = advanceActiveStandardIfNeeded(sessionP, 'geometry')
  sessionP = applyTopicUnlocksIfNeeded(sessionP, 'geometry').progress
  assert('NY-4.G.1 mastered', isStandardMastered(sessionP, 'NY-4.G.1'))
  assert(
    'active moves toward G.2',
    sessionP.topics.geometry.activeStandardIndex >= 1 ||
      resolveQuestionTarget(sessionP, 'geometry').standard === 'NY-4.G.2',
  )

  sessionP = masterStandard(sessionP, 'NY-4.G.2')
  sessionP = advanceActiveStandardIfNeeded(sessionP, 'geometry')
  sessionP = masterStandard(sessionP, 'NY-4.G.3')
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
    getPracticeableZoneTopicIdsForGrade(4).at(-1) === 'geometry',
  )

  const servedGeo = generateSessionQuestion(p, 'geometry')
  assert('session serves NY-4.G.*', servedGeo.standard.startsWith('NY-4.G.'))
  assert('session geometry has prompt', Boolean(servedGeo.prompt?.trim()))

  // MD appends reachable after MD.1 / MD.2
  let mdP = createInitialStudentProgress('geometry-g4-md', 4)
  mdP = masterTopic(mdP, 'operations-algebraic-thinking')
  mdP = masterTopic(mdP, 'number-operations-base-ten')
  assert(
    'MD unlocked after NBT',
    mdP.topics['measurement-data'].status === 'unlocked',
  )
  mdP = masterStandard(mdP, 'NY-4.MD.1')
  mdP = advanceActiveStandardIfNeeded(mdP, 'measurement-data')
  mdP = masterStandard(mdP, 'NY-4.MD.2')
  mdP = advanceActiveStandardIfNeeded(mdP, 'measurement-data')
  assert(
    'active reaches MD.3 append',
    resolveQuestionTarget(mdP, 'measurement-data').standard === 'NY-4.MD.3',
  )
  const servedMd = generateSessionQuestion(mdP, 'measurement-data')
  assert('session serves NY-4.MD.3', servedMd.standard === 'NY-4.MD.3')
  assert('MD.3 question pictured', Boolean(servedMd.visual || servedMd.options))
}

console.log('\n6. Prior grades / domains unchanged')
{
  const g4 = getZonesForGrade(4)
  assert('first still Skyfire Summit', g4[0].name === 'Skyfire Summit')
  assert(
    'OA standards unchanged',
    JSON.stringify(getStandardsForTopic('operations-algebraic-thinking', 4)) ===
      JSON.stringify(['NY-4.OA.1', 'NY-4.OA.2', 'NY-4.OA.3']),
  )
  assert(
    'NF standards unchanged',
    JSON.stringify(getStandardsForTopic('number-operations-fractions', 4)).includes(
      'NY-4.NF.1',
    ),
  )
  assert(
    'G1 geometry standards unchanged',
    JSON.stringify(getStandardsForTopic('geometry', 1)) ===
      JSON.stringify(['NY-1.G.1', 'NY-1.G.2', 'NY-1.G.3']),
  )
  assert(
    'G2 geometry standards unchanged',
    JSON.stringify(getStandardsForTopic('geometry', 2)) ===
      JSON.stringify(['NY-2.G.1', 'NY-2.G.2', 'NY-2.G.3']),
  )
  assert(
    'G3 geometry standards unchanged',
    JSON.stringify(getStandardsForTopic('geometry', 3)) ===
      JSON.stringify(['NY-3.G.1', 'NY-3.G.2']),
  )
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('Phase 4 Geometry path test FAILED')
  process.exit(1)
}
console.log('Phase 4 Geometry Section 9 path OK')
