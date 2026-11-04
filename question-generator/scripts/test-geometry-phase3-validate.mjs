/**
 * Phase 3 Validate — Grade 3 Geometry + geometric MD (NY-3.G.*, NY-3.MD.5–8).
 *
 * Run from question-generator/:
 *   node scripts/test-geometry-phase3-validate.mjs
 */
import { generateQuestion } from '../src/engine.ts'
import { runValidationSuite, validateQuestion } from '../src/validate.ts'
import {
  evaluateVisualPredicate,
  isNGon,
  rectCompositeArea,
} from '../src/visual-predicates.ts'
import { makeLabeledRect, makeNGon } from '../src/generators/geometry-shapes.ts'
import { createRng } from '../src/rng.ts'

const PHASE3 = [
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

console.log('\n1. New Grade 3 predicates')
{
  const rng = createRng(7)
  const hex = makeNGon(6, rng, { advanced: false })
  const pent = makeNGon(5, rng, { advanced: true })
  const quad = makeNGon(4, rng, { advanced: true })
  assert('is-hexagon on hexagon', evaluateVisualPredicate('is-hexagon', hex) === true)
  assert('is-pentagon on pentagon', evaluateVisualPredicate('is-pentagon', pent) === true)
  assert('is-quadrilateral on quad', evaluateVisualPredicate('is-quadrilateral', quad) === true)
  assert('isNGon(6) helper', isNGon(hex, 6) === true)
  assert('isNGon(5) rejects hex', isNGon(hex, 5) === false)

  const rect = makeLabeledRect(4, 6)
  assert('rect-composite-area 4×6 = 24', rectCompositeArea(rect) === 24)
  assert(
    'rect-composite-area predicate',
    evaluateVisualPredicate('rect-composite-area', rect) === 24,
  )
}

console.log('\n2. Generate + validateQuestion for Phase 3 standards (N=40)')
{
  let ok = 0
  let bad = 0
  let seed = 100
  for (const code of PHASE3) {
    for (const difficulty of ['beginner', 'advanced']) {
      for (const type of ['multiple-choice', 'true-false', 'short-answer']) {
        // Skip unsupported types via try/catch on engine
        for (let i = 0; i < 40; i += 1) {
          seed += 1
          try {
            const q = generateQuestion({
              grade: 3,
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
            // Unsupported type for this standard — skip
            if (String(err).includes('does not support')) continue
            bad += 1
            if (bad <= 3) console.error(`   throw ${code}:`, err)
          }
        }
      }
    }
  }
  assert(`Phase 3 samples green (ok=${ok}, bad=${bad})`, bad === 0 && ok > 0)
}

console.log('\n3. Full suite — Phase 3 + Grade 1–2 geometry still green')
{
  const report = runValidationSuite({ samplesPerCombo: 25, seedBase: 21 })
  const phase3 = report.byStandard.filter((s) => PHASE3.includes(s.standard))
  const geo1 = report.byStandard.filter((s) => s.standard.startsWith('NY-1.G.'))
  const geo2 = report.byStandard.filter((s) => s.standard.startsWith('NY-2.G.'))

  assert('six Phase 3 standards in report', phase3.length === 6)
  assert(
    'Phase 3 all pass',
    phase3.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    'Grade 1 geometry still pass',
    geo1.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    'Grade 2 geometry still pass',
    geo2.every((s) => s.passed && s.failureCount === 0),
  )
  assert('full suite still green', report.totalFailed === 0)
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('Phase 3 validate FAILED')
  process.exit(1)
}
console.log('Phase 3 validate OK')
