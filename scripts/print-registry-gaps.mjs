/**
 * Phase A helper — list NYS OA / NBT / MD standards (grades 1–4) from
 * nys-math-standards-grades-1-4.md that are NOT yet in the Question Generator
 * registry. Geometry and NF are excluded from this gap list (NF is tracked
 * separately as curriculum placeholders).
 *
 * Run from repo root:
 *   node scripts/print-registry-gaps.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listStandardCodes } from '../question-generator/src/standards-registry.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const md = readFileSync(join(root, 'nys-math-standards-grades-1-4.md'), 'utf8')

/** @type {RegExp} */
const CODE_RE = /\bNY-([1-4])\.(OA|NBT|MD)\.(\d+[a-z]?)\b/g

/** @type {Map<string, { grade: string, domain: string }>} */
const fromDoc = new Map()
for (const match of md.matchAll(CODE_RE)) {
  const code = match[0]
  if (!fromDoc.has(code)) {
    fromDoc.set(code, { grade: match[1], domain: match[2] })
  }
}

const inRegistry = new Set(listStandardCodes())

/** Parent codes sometimes cover lettered children in the registry (e.g. NY-2.NBT.7). */
function coveredByRegistry(code) {
  if (inRegistry.has(code)) return true
  // If registry has parent without letter and doc has lettered form
  const m = code.match(/^(NY-\d+\.(?:OA|NBT|MD)\.\d+)([a-z])$/)
  if (m && inRegistry.has(m[1])) return true
  // If registry has a lettered form and doc lists bare parent — still a gap for other letters
  return false
}

const gaps = [...fromDoc.entries()]
  .filter(([code]) => !coveredByRegistry(code))
  .sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }))

console.log('NYS OA / NBT / MD standards in the grades 1–4 doc but NOT in the registry')
console.log('(lettered codes count as covered when the registry has the parent code)\n')
console.log(`Doc codes scanned: ${fromDoc.size}`)
console.log(`Registry codes:    ${inRegistry.size}`)
console.log(`Gaps:              ${gaps.length}\n`)

let currentGrade = ''
for (const [code, meta] of gaps) {
  if (meta.grade !== currentGrade) {
    currentGrade = meta.grade
    console.log(`── Grade ${currentGrade} ──`)
  }
  console.log(`  ${code}  (${meta.domain})`)
}
