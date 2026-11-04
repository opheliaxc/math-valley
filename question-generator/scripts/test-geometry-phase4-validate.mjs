/**
 * Phase 4 Validate — Grade 4 Geometry + geometric MD
 * (NY-4.G.1–3, NY-4.MD.3, NY-4.MD.5–7).
 *
 * Run from question-generator/:
 *   node scripts/test-geometry-phase4-validate.mjs
 */
import { generateQuestion } from '../src/engine.ts'
import { runValidationSuite, validateQuestion } from '../src/validate.ts'
import {
  evaluateVisualPredicate,
  isParallelogram,
  hasSymmetryAxis,
} from '../src/visual-predicates.ts'
const PHASE4 = [
  'NY-4.G.1',
  'NY-4.G.2',
  'NY-4.G.3',
  'NY-4.MD.3',
  'NY-4.MD.5',
  'NY-4.MD.6',
  'NY-4.MD.7',
]

const PRIOR_GEO = [
  'NY-1.G.1',
  'NY-1.G.2',
  'NY-1.G.3',
  'NY-2.G.1',
  'NY-2.G.2',
  'NY-2.G.3',
  'NY-3.G.1',
  'NY-3.G.2',
  'NY-3.MD.5',
  'NY-3.MD.6',
  'NY-3.MD.7',
  'NY-3.MD.8',
]

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

console.log('\n1. New Grade 4 predicates')
{
  const parallelogram = {
    kind: 'polygon',
    points: [
      { x: 0, y: 60 },
      { x: 80, y: 60 },
      { x: 110, y: 0 },
      { x: 30, y: 0 },
    ],
  }
  const rectangle = {
    kind: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 50 },
      { x: 0, y: 50 },
    ],
  }
  const trap = {
    kind: 'polygon',
    points: [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ],
  }
  assert('parallelogram predicate', isParallelogram(parallelogram) === true)
  assert('rectangle is parallelogram', isParallelogram(rectangle) === true)
  assert('trapezoid not parallelogram', isParallelogram(trap) === false)
  assert(
    'is-right-angle 90°',
    evaluateVisualPredicate('is-right-angle', {
      kind: 'angle',
      vertex: { x: 0, y: 0 },
      from: { x: 70, y: 0 },
      to: { x: 0, y: -70 },
      showArc: true,
    }) === true,
  )
  assert(
    'lines-are-parallel',
    evaluateVisualPredicate('lines-are-parallel', {
      kind: 'lines',
      items: [
        { type: 'line', a: { x: 0, y: 20 }, b: { x: 100, y: 20 } },
        { type: 'line', a: { x: 0, y: 60 }, b: { x: 100, y: 60 } },
      ],
    }) === true,
  )
  const sym = {
    kind: 'symmetry-figure',
    points: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 80 },
      { x: 0, y: 80 },
    ],
    axis: { a: { x: 40, y: -10 }, b: { x: 40, y: 90 } },
    showAxis: true,
  }
  assert('has-symmetry-axis on square midline', hasSymmetryAxis(sym) === true)
  assert(
    'protractor-measure',
    evaluateVisualPredicate('protractor-measure', {
      kind: 'protractor-angle',
      vertex: { x: 0, y: 0 },
      from: { x: 80, y: 0 },
      to: { x: 0, y: -80 },
      measureDeg: 90,
    }) === 90,
  )
}

console.log('\n2. Generate + validateQuestion for Phase 4 standards (N=40)')
{
  let ok = 0
  let bad = 0
  let seed = 200
  for (const code of PHASE4) {
    for (const difficulty of ['beginner', 'advanced']) {
      for (const type of ['multiple-choice', 'true-false', 'short-answer']) {
        for (let i = 0; i < 40; i += 1) {
          seed += 1
          try {
            const q = generateQuestion({
              grade: 4,
              standard: code,
              difficulty,
              type,
              seed,
            })
            const reasons = validateQuestion(q)
            if (reasons.length) {
              bad += 1
              if (bad <= 3) {
                console.error(`   fail ${code} ${difficulty} ${type}:`, reasons.join('; '))
              }
            } else {
              ok += 1
            }
          } catch (err) {
            if (String(err).includes('does not support')) continue
            bad += 1
            if (bad <= 3) console.error(`   throw ${code}:`, err)
          }
        }
      }
    }
  }
  assert(`Phase 4 samples green (ok=${ok}, bad=${bad})`, bad === 0 && ok > 0)
}

console.log('\n3. Full suite — Phase 4 + prior Geometry/MD green')
{
  const report = runValidationSuite({ samplesPerCombo: 25, seedBase: 41 })
  const phase4 = report.byStandard.filter((s) => PHASE4.includes(s.standard))
  const prior = report.byStandard.filter((s) => PRIOR_GEO.includes(s.standard))

  assert('seven Phase 4 standards in report', phase4.length === 7)
  assert(
    'Phase 4 all pass',
    phase4.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    'prior geometry/MD still pass',
    prior.every((s) => s.passed && s.failureCount === 0),
  )
  assert('full suite still green', report.totalFailed === 0)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('Phase 4 validate FAILED')
  process.exit(1)
}
console.log('Phase 4 validate OK')
