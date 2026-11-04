/**
 * Smoke: generate one question for every registry standard × difficulty.
 * Run: node scripts/smoke-all-standards.mjs
 */
import { generateQuestion } from '../src/engine.ts'
import { STANDARDS_REGISTRY } from '../src/standards-registry.ts'

let ok = 0
let fail = 0

for (const s of STANDARDS_REGISTRY) {
  for (const difficulty of ['beginner', 'advanced']) {
    try {
      const q = generateQuestion({
        grade: s.grade,
        standard: s.code,
        difficulty,
        type: s.supportedTypes[0],
        seed: 1000 + ok,
      })
      if (!q.prompt || !q.correctAnswer || !q.explanation) {
        throw new Error('missing prompt/answer/explanation')
      }
      if (q.type === 'multiple-choice') {
        if (!q.options || q.options.length !== 4) throw new Error('MC needs 4 options')
        if (new Set(q.options).size !== 4) throw new Error('MC options not unique')
        if (q.options[q.correctOptionIndex] !== q.correctAnswer) {
          throw new Error('correctOptionIndex mismatch')
        }
      }
      ok += 1
      console.log('OK', s.code, difficulty, q.type, '→', q.correctAnswer)
    } catch (err) {
      fail += 1
      console.error('FAIL', s.code, difficulty, '—', err.message)
    }
  }
}

console.log(`\n${ok} passed, ${fail} failed (of ${STANDARDS_REGISTRY.length * 2})`)
process.exit(fail > 0 ? 1 : 0)
