/**
 * Manual smoke check for Step 5 (arithmetic add/sub generator).
 * Run from question-generator/:  node scripts/smoke-arithmetic.mjs
 */
import { getStandard } from '../src/standards-registry.ts'
import { generateArithmeticTwoOperand } from '../src/generators/arithmetic-two-operand.ts'

function show(label, q) {
  console.log('\n── ' + label + ' ──')
  console.log('type:', q.type)
  console.log('prompt:', q.prompt)
  if (q.options) console.log('options:', q.options.join(' | '), '(correct index', q.correctOptionIndex + ')')
  console.log('answer:', q.correctAnswer)
  console.log('explanation:', q.explanation)
  if (q.seed !== undefined) console.log('seed:', q.seed)
}

const oa6 = getStandard('NY-1.OA.6')
const nbt2 = getStandard('NY-3.NBT.2')
if (!oa6 || !nbt2) throw new Error('Missing standards in registry')

show(
  'NY-1.OA.6 beginner MC',
  generateArithmeticTwoOperand({
    config: oa6,
    difficulty: 'beginner',
    type: 'multiple-choice',
    seed: 42,
  }),
)

show(
  'NY-1.OA.6 beginner MC (same seed → same numbers)',
  generateArithmeticTwoOperand({
    config: oa6,
    difficulty: 'beginner',
    type: 'multiple-choice',
    seed: 42,
  }),
)

show(
  'NY-1.OA.6 advanced true-false',
  generateArithmeticTwoOperand({
    config: oa6,
    difficulty: 'advanced',
    type: 'true-false',
    seed: 7,
  }),
)

show(
  'NY-3.NBT.2 beginner short-answer',
  generateArithmeticTwoOperand({
    config: nbt2,
    difficulty: 'beginner',
    type: 'short-answer',
    seed: 99,
  }),
)

show(
  'NY-3.NBT.2 advanced MC',
  generateArithmeticTwoOperand({
    config: nbt2,
    difficulty: 'advanced',
    type: 'multiple-choice',
    seed: 123,
  }),
)

console.log('\nSmoke check finished.')
