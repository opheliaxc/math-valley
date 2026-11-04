/**
 * Phase B test helper — print island names / count / practiceable flag per grade.
 *
 * Run from repo root:
 *   node scripts/print-zone-names.mjs
 */
import { getZonesForGrade } from '../src/data/zones.ts'

for (const grade of [1, 2, 3, 4]) {
  const zones = getZonesForGrade(/** @type {1|2|3|4} */ (grade))
  console.log(`\n════════ Grade ${grade} (${zones.length} islands) ════════`)
  zones.forEach((zone, i) => {
    const flag = zone.practiceable ? 'enterable when unlocked' : 'LOCKED-VISIBLE (not enterable)'
    console.log(`  ${i + 1}. ${zone.name}`)
    console.log(`     id: ${zone.id}`)
    console.log(`     ${flag}`)
  })
}
