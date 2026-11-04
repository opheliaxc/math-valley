/**
 * Phase 0 Step 6 — visual validation checks.
 *
 * Run from question-generator/:
 *   node scripts/test-visual-validation.mjs
 */
import {
  DUMMY_AMBIGUOUS_ANGLE,
  DUMMY_PICTURE_MC,
  DUMMY_PICTURE_MC_TWO_CORRECT,
  DUMMY_PICTURE_SHORT,
  DUMMY_PICTURE_TRUE_FALSE,
} from '../src/dummy-visual-questions.ts'
import { validateQuestion } from '../src/validate.ts'

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

console.log('\n1. Good dummy picture questions pass')
{
  for (const q of [DUMMY_PICTURE_MC, DUMMY_PICTURE_TRUE_FALSE, DUMMY_PICTURE_SHORT]) {
    const reasons = validateQuestion(q)
    assert(
      `${q.id} passes (${reasons.length === 0 ? 'ok' : reasons.join('; ')})`,
      reasons.length === 0,
    )
  }
}

console.log('\n2. Two correct picture options → fail')
{
  const reasons = validateQuestion(DUMMY_PICTURE_MC_TWO_CORRECT)
  assert('reports a failure', reasons.length > 0)
  assert(
    'mentions exactly one / found 2',
    reasons.some(
      (r) =>
        r.includes('exactly one option must satisfy') && r.includes('found 2'),
    ),
  )
  console.log('   reasons:', reasons.join(' | '))
}

console.log('\n3. Ambiguous angle in margin → fail')
{
  const reasons = validateQuestion(DUMMY_AMBIGUOUS_ANGLE)
  assert('reports a failure', reasons.length > 0)
  assert(
    'mentions tolerance margin',
    reasons.some((r) => r.includes('margin')),
  )
  console.log('   reasons:', reasons.join(' | '))
}

console.log('\n4. Duplicate VisualSpec options → fail')
{
  const dup = structuredClone(DUMMY_PICTURE_MC)
  dup.id = 'dummy-dup-visuals'
  // Make option 1 identical to option 0's visual
  dup.options[1] = {
    id: 'triangle-copy',
    altText: 'another triangle copy',
    visual: structuredClone(dup.options[0].visual),
  }
  // Fix correctAnswer uniqueness for ids — still two triangles for predicate too
  const reasons = validateQuestion(dup)
  assert(
    'flags non-distinct VisualSpecs',
    reasons.some((r) => r.includes('not structurally distinct')),
  )
  console.log('   reasons:', reasons.join(' | '))
}

console.log('\n5. Wrong correctAnswer vs re-derived → fail')
{
  const wrong = structuredClone(DUMMY_PICTURE_SHORT)
  wrong.id = 'dummy-wrong-count'
  wrong.correctAnswer = '99'
  const reasons = validateQuestion(wrong)
  assert(
    'flags re-derived mismatch',
    reasons.some((r) => r.includes('re-derived') && r.includes('99')),
  )
  console.log('   reasons:', reasons.join(' | '))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('Visual validation tests FAILED')
  process.exit(1)
}
console.log('Visual validation tests OK')
