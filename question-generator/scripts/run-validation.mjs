/**
 * Run the full validation suite from the CLI.
 * Usage: node scripts/run-validation.mjs
 * Optional: SAMPLES=10 node scripts/run-validation.mjs
 */
import { runValidationSuite } from '../src/validate.ts'

const samples = Number(process.env.SAMPLES ?? 50)
const report = runValidationSuite({ samplesPerCombo: samples })

console.log(
  `Validation: ${report.totalPassed} passed, ${report.totalFailed} failed of ${report.totalSamples} (N=${samples} per combo)\n`,
)

for (const row of report.byStandard) {
  const mark = row.passed ? 'PASS' : 'FAIL'
  console.log(`${mark}  ${row.standard.padEnd(12)}  failures=${row.failureCount}`)
  if (!row.passed) {
    for (const f of row.failures) {
      console.log(`      • ${f.reason}`)
      console.log(`        ${f.question.prompt}`)
      console.log(`        answer=${f.question.correctAnswer}`)
    }
  }
}

process.exit(report.totalFailed > 0 ? 1 : 0)
