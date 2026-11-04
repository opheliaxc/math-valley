/**
 * Phase A test — print the domain-based curriculum map for eyeballing against
 * nys-math-standards-grades-1-4.md
 *
 * Run from repo root:
 *   node scripts/print-curriculum-map.mjs
 *   node scripts/print-curriculum-map.mjs 3
 */
import {
  TOPIC_UNLOCK_ORDER,
  getCurriculumForGrade,
  isStandardPracticeable,
} from '../src/data/curriculum-map.ts'
import { TOPIC_LABELS } from '../src/data/topics.ts'

const arg = process.argv[2]
const grades = arg ? [Number(arg)] : [1, 2, 3, 4]

if (arg && ![1, 2, 3, 4].includes(Number(arg))) {
  console.error('Usage: node scripts/print-curriculum-map.mjs [1|2|3|4]')
  process.exit(1)
}

console.log('Domain unlock order:')
console.log('  ' + TOPIC_UNLOCK_ORDER.join(' → '))

for (const grade of grades) {
  console.log(`\n════════ Grade ${grade} ════════`)
  for (const { topicId, standards, practiceable } of getCurriculumForGrade(
    /** @type {1|2|3|4} */ (grade),
  )) {
    const flag = practiceable ? 'practiceable' : 'NOT practiceable yet'
    console.log(`\n${TOPIC_LABELS[topicId]} (${topicId}) — ${flag}`)
    if (standards.length === 0) {
      console.log('  (none at this grade)')
      continue
    }
    standards.forEach((code, i) => {
      const note = isStandardPracticeable(code) ? '' : ' [placeholder]'
      console.log(`  ${i + 1}. ${code}${note}`)
    })
  }
}
