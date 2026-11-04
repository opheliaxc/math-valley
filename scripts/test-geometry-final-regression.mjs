/**
 * Geometry Final Regression — Grades 1–4 (spec §10 item 6).
 *
 * Runs island/order checks, curriculum lists, generate+validate samples,
 * full validation suite, and unlock paths for every geometry grade.
 *
 * Run from repo root:
 *   node scripts/test-geometry-final-regression.mjs
 *
 * Also recommended (already covered in outline below):
 *   node scripts/test-geometry-phase1.mjs
 *   node scripts/test-geometry-phase2.mjs
 *   node scripts/test-geometry-phase3.mjs
 *   node scripts/test-geometry-phase4.mjs
 *   node scripts/test-phase-f-regression.mjs
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  domainIsPracticeable,
  getPracticeableZoneTopicIdsForGrade,
  getStandardsForTopic,
  getZoneTopicIdsForGrade,
} from '../src/data/curriculum-map.ts'
import { getZone, getZonesForGrade, getNextZoneId } from '../src/data/zones.ts'
import { generateQuestion } from '../question-generator/src/engine.ts'
import { getStandard } from '../question-generator/src/standards-registry.ts'
import { validateQuestion, runValidationSuite } from '../question-generator/src/validate.ts'
import { isPictureOption } from '../question-generator/src/visual.ts'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')

const EXPECTED = {
  1: {
    count: 4,
    order: [
      'operations-algebraic-thinking',
      'number-operations-base-ten',
      'measurement-data',
      'geometry',
    ],
    names: [
      'Hatchling Hollow',
      'Pebble Hoard Den',
      'Sundrop Nest',
      'Hatchling Shape Cove',
    ],
    geometry: ['NY-1.G.1', 'NY-1.G.2', 'NY-1.G.3'],
    md: ['NY-1.MD.3a', 'NY-1.MD.3b', 'NY-1.MD.3c'],
    geoName: 'Hatchling Shape Cove',
  },
  2: {
    count: 4,
    order: [
      'operations-algebraic-thinking',
      'number-operations-base-ten',
      'measurement-data',
      'geometry',
    ],
    names: [
      'Ember Grove',
      'Glimmer Hoard Caverns',
      'Ticktock Treehouse',
      'Ember Shapes Quarry',
    ],
    geometry: ['NY-2.G.1', 'NY-2.G.2', 'NY-2.G.3'],
    md: ['NY-2.MD.1', 'NY-2.MD.7', 'NY-2.MD.8'],
    geoName: 'Ember Shapes Quarry',
  },
  3: {
    count: 5,
    order: [
      'operations-algebraic-thinking',
      'number-operations-base-ten',
      'measurement-data',
      'number-operations-fractions',
      'geometry',
    ],
    names: [
      'Stormwing Peaks',
      "Dragon's Vault",
      'Sundial Bazaar',
      'Fraction Falls',
      "Dragon's Forge",
    ],
    geometry: ['NY-3.G.1', 'NY-3.G.2'],
    md: [
      'NY-3.MD.1',
      'NY-3.MD.2',
      'NY-3.MD.5',
      'NY-3.MD.6',
      'NY-3.MD.7',
      'NY-3.MD.8',
    ],
    geoName: "Dragon's Forge",
  },
  4: {
    count: 5,
    order: [
      'operations-algebraic-thinking',
      'number-operations-base-ten',
      'measurement-data',
      'number-operations-fractions',
      'geometry',
    ],
    names: [
      'Skyfire Summit',
      "Elder's Treasury",
      'Chrono Exchange',
      'Crystal Shard Falls',
      'Skyfire Observatory',
    ],
    geometry: ['NY-4.G.1', 'NY-4.G.2', 'NY-4.G.3'],
    md: [
      'NY-4.MD.1',
      'NY-4.MD.2',
      'NY-4.MD.3',
      'NY-4.MD.5',
      'NY-4.MD.6',
      'NY-4.MD.7',
    ],
    geoName: 'Skyfire Observatory',
  },
}

const ALL_GEO_MD = [
  ...EXPECTED[1].geometry,
  ...EXPECTED[2].geometry,
  ...EXPECTED[3].geometry,
  ...EXPECTED[3].md.filter((c) => /MD\.[5-8]/.test(c)),
  ...EXPECTED[4].geometry,
  ...EXPECTED[4].md.filter((c) => /MD\.[3567]/.test(c)),
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

function runScript(relPath) {
  const result = spawnSync(process.execPath, [join(REPO, relPath)], {
    cwd: REPO,
    encoding: 'utf8',
  })
  const ok = result.status === 0
  if (!ok) {
    console.error(result.stdout)
    console.error(result.stderr)
  }
  return ok
}

console.log('\n══ A. Islands, names, order (grades 1–4) ══')
for (const grade of [1, 2, 3, 4]) {
  const exp = EXPECTED[grade]
  const zones = getZonesForGrade(grade)
  const ids = getZoneTopicIdsForGrade(grade)
  assert(`G${grade}: ${exp.count} islands`, zones.length === exp.count)
  assert(
    `G${grade}: domain order`,
    JSON.stringify(ids) === JSON.stringify(exp.order),
  )
  assert(
    `G${grade}: names`,
    JSON.stringify(zones.map((z) => z.name)) === JSON.stringify(exp.names),
  )
  assert(`G${grade}: Geometry last`, ids.at(-1) === 'geometry')
  assert(
    `G${grade}: ${exp.geoName}`,
    getZone('geometry', grade).name === exp.geoName,
  )
  assert(
    `G${grade}: geometry practiceable`,
    domainIsPracticeable('geometry', grade),
  )
  assert(
    `G${grade}: no next after geometry`,
    getNextZoneId('geometry', grade) === null,
  )
  assert(
    `G${grade}: practiceable ends at geometry`,
    getPracticeableZoneTopicIdsForGrade(grade).at(-1) === 'geometry',
  )
  assert(
    `G${grade}: geometry standards`,
    JSON.stringify(getStandardsForTopic('geometry', grade)) ===
      JSON.stringify(exp.geometry),
  )
  assert(
    `G${grade}: MD standards`,
    JSON.stringify(getStandardsForTopic('measurement-data', grade)) ===
      JSON.stringify(exp.md),
  )
}

console.log('\n══ B. Spot generate+validate (10× beginner/advanced × types) ══')
{
  let ok = 0
  let bad = 0
  let pictured = 0
  let total = 0
  let seed = 5000
  for (const code of ALL_GEO_MD) {
    const cfg = getStandard(code)
    if (!cfg) {
      bad += 1
      console.error(`   missing registry entry ${code}`)
      continue
    }
    for (const difficulty of ['beginner', 'advanced']) {
      for (const type of cfg.supportedTypes) {
        for (let i = 0; i < 10; i += 1) {
          seed += 1
          total += 1
          try {
            const q = generateQuestion({
              grade: cfg.grade,
              standard: code,
              difficulty,
              type,
              seed,
            })
            const reasons = validateQuestion(q)
            if (
              q.visual ||
              q.options?.some((o) => isPictureOption(o) && o.visual)
            ) {
              pictured += 1
            }
            // Some patterns are text-only by design (e.g. NY-1.G.3 compare-size).
            if (reasons.length) {
              bad += 1
              if (bad <= 5) {
                console.error(
                  `   ${code} ${difficulty} ${type}:`,
                  reasons.join('; '),
                )
              }
            } else {
              ok += 1
            }
          } catch (err) {
            bad += 1
            if (bad <= 5) console.error(`   throw ${code}:`, err)
          }
        }
      }
    }
  }
  const picturedRate = total > 0 ? pictured / total : 0
  assert(`spot samples validate (ok=${ok}, bad=${bad})`, bad === 0 && ok > 0)
  assert(
    `spot samples mostly pictured (${pictured}/${total} = ${(picturedRate * 100).toFixed(0)}%)`,
    picturedRate >= 0.85,
  )
}

console.log('\n══ C. Full validation suite (N=30) ══')
{
  const report = runValidationSuite({ samplesPerCombo: 30, seedBase: 61 })
  const geoRows = report.byStandard.filter((s) => ALL_GEO_MD.includes(s.standard))
  assert(
    `all ${ALL_GEO_MD.length} geometry/MD standards in suite`,
    geoRows.length === ALL_GEO_MD.length,
  )
  assert(
    'all geometry/MD pass',
    geoRows.every((s) => s.passed && s.failureCount === 0),
  )
  assert(
    `full suite green (${report.totalPassed}/${report.totalSamples})`,
    report.totalFailed === 0,
  )
}

console.log('\n══ D. Nested path / Phase F scripts ══')
{
  const scripts = [
    'scripts/test-geometry-phase1.mjs',
    'scripts/test-geometry-phase2.mjs',
    'scripts/test-geometry-phase3.mjs',
    'scripts/test-geometry-phase4.mjs',
    'scripts/test-phase-f-regression.mjs',
  ]
  for (const rel of scripts) {
    const ok = runScript(rel)
    assert(rel, ok)
  }
}

console.log('\n══ E. QG validate helpers ══')
{
  const scripts = [
    'question-generator/scripts/test-geometry-phase3-validate.mjs',
    'question-generator/scripts/test-geometry-phase4-validate.mjs',
    'question-generator/scripts/test-visual-validation.mjs',
    'question-generator/scripts/test-geometry.mjs',
  ]
  for (const rel of scripts) {
    const ok = runScript(rel)
    assert(rel, ok)
  }
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('Geometry final regression FAILED')
  process.exit(1)
}
console.log('Geometry final regression OK — Grades 1–4 complete')
