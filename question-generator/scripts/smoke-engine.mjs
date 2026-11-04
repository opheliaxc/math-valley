/**
 * Manual smoke check for Step 6 (public engine).
 * Run from question-generator/:  node scripts/smoke-engine.mjs
 */
import { generateQuestion } from '../src/engine.ts'

function show(label, q) {
  console.log('\n── ' + label + ' ──')
  console.log('standard:', q.standard, '| grade:', q.grade, '| difficulty:', q.difficulty)
  console.log('type:', q.type)
  console.log('prompt:', q.prompt)
  if (q.options) console.log('options:', q.options.join(' | '))
  console.log('answer:', q.correctAnswer)
}

const a = generateQuestion({
  grade: 3,
  standard: 'NY-3.NBT.2',
  difficulty: 'beginner',
  seed: 42,
})
const b = generateQuestion({
  grade: 3,
  standard: 'NY-3.NBT.2',
  difficulty: 'beginner',
  seed: 42,
})
show('auto type, seed 42 (first)', a)
show('auto type, seed 42 (second — should match first)', b)
console.log(
  '\nreproducible?',
  a.type === b.type && a.prompt === b.prompt && a.correctAnswer === b.correctAnswer,
)

show(
  'forced short-answer',
  generateQuestion({
    grade: 1,
    standard: 'NY-1.OA.6',
    difficulty: 'advanced',
    type: 'short-answer',
    seed: 7,
  }),
)

console.log('\n── expected errors ──')
const failures = [
  ['grade mismatch', () => generateQuestion({ grade: 2, standard: 'NY-3.NBT.2', difficulty: 'beginner' })],
  ['unknown standard', () => generateQuestion({ grade: 1, standard: 'NY-9.FAKE.1', difficulty: 'beginner' })],
  [
    'unsupported type',
    () =>
      generateQuestion({
        grade: 1,
        standard: 'NY-1.MD.3a',
        difficulty: 'beginner',
        type: 'true-false',
      }),
  ],
]

for (const [label, run] of failures) {
  try {
    run()
    console.log(label + ': UNEXPECTED SUCCESS')
  } catch (err) {
    console.log(label + ': ok —', err.message)
  }
}

console.log('\nEngine smoke check finished.')
