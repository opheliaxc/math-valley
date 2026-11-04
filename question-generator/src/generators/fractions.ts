/**
 * Fraction generators for Grade 3–4 Number & Operations — Fractions.
 *
 * Parent codes only (NY-3.NF.1/2/3, NY-4.NF.1–7). Lettered sub-skills
 * (2a/2b, 3a–d, etc.) are sampled as variety inside each parent.
 */
import { createRng, type Rng } from '../rng.ts'
import type { DifficultyParamValue, GeneratedQuestion } from '../types.ts'
import {
  assertTypeSupported,
  baseFields,
  buildOptions,
  type GeneratorArgs,
  paramNum,
  pickTopic,
} from './shared.ts'

const G3_DENOMS = [2, 3, 4, 6, 8] as const
const G4_DENOMS = [2, 3, 4, 5, 6, 8, 10, 12] as const

type Core = {
  prompt: string
  correct: string
  explanation: string
  distractors: string[]
}

export function generateFractions(args: GeneratorArgs): GeneratedQuestion {
  const { config, difficulty, type, seed } = args
  if (config.generatorId !== 'fractions') {
    throw new Error(`fractions cannot handle generatorId "${config.generatorId}"`)
  }
  assertTypeSupported(config, type)

  const rng = createRng(seed)
  const params = config.difficultyParams[difficulty]
  const core = rollCore(config.code, params, rng)
  const base = baseFields(args, pickTopic(config, 'number-operations-fractions'))

  if (type === 'multiple-choice') {
    const { options, correctOptionIndex } = buildOptions(
      core.correct,
      core.distractors,
      rng,
    )
    return {
      ...base,
      prompt: core.prompt,
      correctAnswer: core.correct,
      options: options.map(markFrac),
      correctOptionIndex,
      explanation: core.explanation,
    }
  }

  if (type === 'true-false') {
    return buildTrueFalse(base, core, rng)
  }

  return {
    ...base,
    prompt: core.prompt,
    correctAnswer: core.correct,
    explanation: core.explanation,
  }
}

function rollCore(
  code: string,
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  switch (code) {
    case 'NY-3.NF.1':
      return nf3UnitFraction(params, rng)
    case 'NY-3.NF.2':
      return nf3NumberLine(params, rng)
    case 'NY-3.NF.3':
      return nf3EquivalenceCompare(params, rng)
    case 'NY-4.NF.1':
      return nf4Equivalent(params, rng)
    case 'NY-4.NF.2':
      return nf4Compare(params, rng)
    case 'NY-4.NF.3':
      return nf4AddSubLike(params, rng)
    case 'NY-4.NF.4':
      return nf4MultiplyWhole(params, rng)
    case 'NY-4.NF.5':
      return nf4TenthsHundredths(params, rng)
    case 'NY-4.NF.6':
      return nf4DecimalNotation(params, rng)
    case 'NY-4.NF.7':
      return nf4CompareDecimals(params, rng)
    default:
      throw new Error(`fractions does not support "${code}"`)
  }
}

// ── helpers ──────────────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x === 0 ? 1 : x
}

function simplify(n: number, d: number): [number, number] {
  const g = gcd(n, d)
  return [n / g, d / g]
}

function fmt(n: number, d: number): string {
  if (d === 1) return String(n)
  return `${n}/${d}`
}

/** Stacked-fraction marker for display only. Data stays `n/d` via fmt(). */
function show(n: number, d: number): string {
  if (d === 1) return String(n)
  return `[[${n}/${d}]]`
}

function showMixed(whole: number, n: number, d: number): string {
  return `[[${whole} ${n}/${d}]]`
}

function markFrac(value: string): string {
  if (/^\[\[[^\]]+\]\]$/.test(value)) return value
  if (/^\d+\/\d+$/.test(value) || /^\d+\s+\d+\/\d+$/.test(value)) {
    return `[[${value}]]`
  }
  return value
}

function denomsUpTo(maxDenom: number, pool: readonly number[]): number[] {
  return pool.filter((d) => d <= maxDenom)
}

function pickDenom(params: Record<string, DifficultyParamValue>, rng: Rng, pool: readonly number[]): number {
  const maxDenom = paramNum(params, 'maxDenom', pool[pool.length - 1]!)
  const allowed = denomsUpTo(maxDenom, pool)
  return rng.pick(allowed.length > 0 ? allowed : [...pool])
}

function fractionDistractors(
  n: number,
  d: number,
  rng: Rng,
  extras: string[] = [],
): string[] {
  const [sn, sd] = simplify(n, d)
  const out = [
    ...extras,
    fmt(n + 1, d),
    fmt(Math.max(1, n - 1), d),
    fmt(n, d + 1),
    fmt(d, n === 0 ? d : n),
    fmt(sn, sd === 1 ? d : sd),
    fmt(1, d),
    fmt(n, Math.max(2, d - 1)),
  ]
  return rng.shuffle(out.filter((s) => s !== fmt(n, d)))
}

function buildTrueFalse(
  base: ReturnType<typeof baseFields>,
  core: Core,
  rng: Rng,
): GeneratedQuestion {
  // Flip to a false statement half the time by swapping the answer in the prompt.
  const makeTrue = rng.chance()
  if (makeTrue) {
    return {
      ...base,
      type: 'true-false',
      prompt: `Is this true or false? ${core.prompt.replace(/\?$/, '')} equals ${markFrac(core.correct)}.`,
      correctAnswer: 'true',
      explanation: core.explanation,
    }
  }

  const wrong =
    core.distractors.find((d) => d !== core.correct) ??
    `${core.correct}'`
  return {
    ...base,
    type: 'true-false',
    prompt: `Is this true or false? ${core.prompt.replace(/\?$/, '')} equals ${markFrac(wrong)}.`,
    correctAnswer: 'false',
    explanation: `That is false. ${core.explanation}`,
  }
}

// ── Grade 3 ──────────────────────────────────────────────────────────────

/** NF.1 — unit fraction / a/b as a copies of 1/b */
function nf3UnitFraction(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const d = pickDenom(params, rng, G3_DENOMS)
  const maxN = Math.min(paramNum(params, 'maxNumerator', d), d)
  const n = rng.int(1, Math.max(1, maxN))

  if (rng.chance()) {
    return {
      prompt: `A whole is split into ${d} equal parts. What fraction is one part?`,
      correct: fmt(1, d),
      explanation: `One of ${d} equal parts is ${show(1, d)}.`,
      distractors: fractionDistractors(1, d, rng, [fmt(1, d + 1), fmt(d, 1)]),
    }
  }

  return {
    prompt: `A whole is split into ${d} equal parts. What fraction is ${n} of those parts?`,
    correct: fmt(n, d),
    explanation: `${n} of ${d} equal parts is ${show(n, d)}.`,
    distractors: fractionDistractors(n, d, rng),
  }
}

/** NF.2 — fraction as a point / length on a number line (2a/2b variety) */
function nf3NumberLine(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const d = pickDenom(params, rng, G3_DENOMS)
  const maxN = Math.min(paramNum(params, 'maxNumerator', d), d)
  const n = rng.int(1, Math.max(1, maxN))

  if (rng.chance()) {
    return {
      prompt: `On a number line from 0 to 1 divided into ${d} equal segments, which fraction marks the end of ${n} segment${n === 1 ? '' : 's'}?`,
      correct: fmt(n, d),
      explanation: `Starting at 0, ${n} equal jumps of size ${show(1, d)} land at ${show(n, d)}.`,
      distractors: fractionDistractors(n, d, rng),
    }
  }

  return {
    prompt: `A number line from 0 to 1 is divided into ${d} equal parts. What fraction names the point ${n} tick${n === 1 ? '' : 's'} after 0?`,
    correct: fmt(n, d),
    explanation: `Each tick is ${show(1, d)}, so ${n} ticks is ${show(n, d)}.`,
    distractors: fractionDistractors(n, d, rng, [fmt(n, d + 1)]),
  }
}

/** NF.3 — equivalence, wholes as fractions, compare same num or den (3a–d) */
function nf3EquivalenceCompare(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const mode = rng.int(0, 2)

  if (mode === 0) {
    // Recognize equivalent fractions (simple doubling within grade-3 denoms)
    const d = rng.pick([2, 3, 4] as const)
    const n = rng.int(1, d - 1)
    const k = 2
    const nd = n * k
    const dd = d * k
    if ((G3_DENOMS as readonly number[]).includes(dd)) {
      return {
        prompt: `Which fraction is equivalent to ${show(n, d)}?`,
        correct: fmt(nd, dd),
        explanation: `Multiply numerator and denominator by ${k}: ${show(n, d)} = ${show(nd, dd)}.`,
        distractors: fractionDistractors(nd, dd, rng, [
          fmt(n + 1, d),
          fmt(n, d * k),
          fmt(n * k, d),
        ]),
      }
    }
  }

  if (mode === 1) {
    // Whole number as fraction
    const whole = rng.int(1, paramNum(params, 'maxWhole', 3))
    const d = pickDenom(params, rng, G3_DENOMS)
    return {
      prompt: `Write ${whole} as a fraction with denominator ${d}.`,
      correct: fmt(whole * d, d),
      explanation: `${whole} = ${show(whole * d, d)} because ${whole} wholes are ${whole * d} parts of size ${show(1, d)}.`,
      distractors: [
        fmt(whole, d),
        fmt(d, whole * d),
        fmt(whole + d, d),
        fmt(whole * d, d + 1),
      ],
    }
  }

  // Compare same numerator or same denominator
  const d = pickDenom(params, rng, G3_DENOMS)
  if (rng.chance()) {
    // same denominator
    let a = rng.int(1, d)
    let b = rng.int(1, d)
    while (a === b) b = rng.int(1, d)
    const correct = a > b ? fmt(a, d) : fmt(b, d)
    const other = a > b ? fmt(b, d) : fmt(a, d)
    return {
      prompt: `Which fraction is greater, ${show(a, d)} or ${show(b, d)}?`,
      correct,
      explanation: `Same denominators: the larger numerator is greater, so ${markFrac(correct)} > ${markFrac(other)}.`,
      distractors: [other, fmt(a + b, d), fmt(1, d), fmt(d, d)],
    }
  }

  // same numerator
  const n = rng.int(1, 3)
  let d1 = pickDenom(params, rng, G3_DENOMS)
  let d2 = pickDenom(params, rng, G3_DENOMS)
  while (d1 === d2) d2 = pickDenom(params, rng, G3_DENOMS)
  const correct = d1 < d2 ? fmt(n, d1) : fmt(n, d2)
  const other = d1 < d2 ? fmt(n, d2) : fmt(n, d1)
  return {
    prompt: `Which fraction is greater, ${show(n, d1)} or ${show(n, d2)}?`,
    correct,
    explanation: `Same numerators: the smaller denominator makes a greater fraction, so ${markFrac(correct)} > ${markFrac(other)}.`,
    distractors: [other, fmt(n + 1, d1), fmt(n, d1 + d2), '1'],
  }
}

// ── Grade 4 ──────────────────────────────────────────────────────────────

function nf4Equivalent(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const d = pickDenom(params, rng, G4_DENOMS.filter((x) => x <= 10))
  const n = rng.int(1, d - 1)
  const k = rng.int(2, paramNum(params, 'maxFactor', 4))
  const nd = n * k
  const dd = d * k
  return {
    prompt: `Find a fraction equivalent to ${show(n, d)} by multiplying the numerator and denominator by the same number.`,
    correct: fmt(nd, dd),
    explanation: `Multiply top and bottom by ${k}: ${show(n, d)} = ${show(nd, dd)}.`,
    distractors: fractionDistractors(nd, dd, rng, [
      fmt(n + k, d + k),
      fmt(n * k, d),
      fmt(n, d * k),
    ]),
  }
}

function nf4Compare(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const d1 = pickDenom(params, rng, G4_DENOMS)
  let d2 = pickDenom(params, rng, G4_DENOMS)
  while (d2 === d1) d2 = pickDenom(params, rng, G4_DENOMS)
  const n1 = rng.int(1, d1 - 1)
  const n2 = rng.int(1, d2 - 1)
  const left = n1 * d2
  const right = n2 * d1
  // Avoid ties for cleaner MC
  if (left === right) {
    return nf4Compare(params, rng)
  }
  const correct = left > right ? fmt(n1, d1) : fmt(n2, d2)
  const other = left > right ? fmt(n2, d2) : fmt(n1, d1)
  return {
    prompt: `Which fraction is greater, ${show(n1, d1)} or ${show(n2, d2)}?`,
    correct,
    explanation: `Compare using common denominators: ${show(n1, d1)} = ${show(left, d1 * d2)} and ${show(n2, d2)} = ${show(right, d1 * d2)}, so ${markFrac(correct)} is greater.`,
    distractors: [other, fmt(n1 + n2, d1), fmt(n1, d2), '1/2'],
  }
}

function nf4AddSubLike(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const d = pickDenom(params, rng, G4_DENOMS.filter((x) => x <= 12))
  const allowMixed = paramNum(params, 'mixed', 0) === 1

  if (allowMixed && rng.chance(0.35)) {
    const whole1 = rng.int(1, 3)
    const whole2 = rng.int(1, 2)
    const n1 = rng.int(1, d - 1)
    const n2 = rng.int(1, d - 1)
    const sumN = whole1 * d + n1 + whole2 * d + n2
    const answer = fmt(sumN, d)
    return {
      prompt: `Add: ${showMixed(whole1, n1, d)} + ${showMixed(whole2, n2, d)}. Write your answer as a single fraction (improper is OK).`,
      correct: answer,
      explanation: `${showMixed(whole1, n1, d)} + ${showMixed(whole2, n2, d)} = ${show(sumN, d)}.`,
      distractors: [
        fmt(sumN + 1, d),
        fmt(n1 + n2, d),
        fmt(whole1 + whole2, d),
        fmt(sumN, d + 1),
      ],
    }
  }

  const add = rng.chance()
  let a = rng.int(1, d - 1)
  let b = rng.int(1, d - 1)
  if (!add && b > a) {
    ;[a, b] = [b, a]
  }

  if (add) {
    const sum = a + b
    return {
      prompt: `What is ${show(a, d)} + ${show(b, d)}?`,
      correct: fmt(sum, d),
      explanation: `Same denominators: add numerators → ${show(sum, d)}.`,
      distractors: fractionDistractors(sum, d, rng, [
        fmt(a + b, d + d),
        fmt(Math.abs(a - b), d),
        fmt(a + b + d, d),
      ]),
    }
  }

  const diff = a - b
  return {
    prompt: `What is ${show(a, d)} − ${show(b, d)}?`,
    correct: fmt(diff, d),
    explanation: `Same denominators: subtract numerators → ${show(diff, d)}.`,
    distractors: fractionDistractors(diff, d, rng, [
      fmt(a + b, d),
      fmt(Math.abs(a - b), d + 1),
      fmt(a, b === 0 ? d : b),
    ]),
  }
}

function nf4MultiplyWhole(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const d = pickDenom(params, rng, G4_DENOMS.filter((x) => x <= 12))
  const n = rng.int(1, Math.min(d, paramNum(params, 'maxNumerator', 5)))
  const whole = rng.int(2, paramNum(params, 'maxWhole', 5))
  const product = whole * n
  return {
    // Avoid "What is a × b/c?" — the validation suite parses `/` as division.
    prompt: `Find ${whole} × ${show(n, d)}. Write the product as a fraction.`,
    correct: fmt(product, d),
    explanation: `${whole} groups of ${show(n, d)} is ${show(product, d)}.`,
    distractors: fractionDistractors(product, d, rng, [
      fmt(whole + n, d),
      fmt(whole * n, d + 1),
      fmt(whole, d),
    ]),
  }
}

function nf4TenthsHundredths(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const tenths = rng.int(1, paramNum(params, 'maxTenths', 9))
  if (rng.chance()) {
    return {
      prompt: `Write ${show(tenths, 10)} as an equivalent fraction with denominator 100.`,
      correct: fmt(tenths * 10, 100),
      explanation: `Multiply by ${show(10, 10)}: ${show(tenths, 10)} = ${show(tenths * 10, 100)}.`,
      distractors: [
        fmt(tenths, 100),
        fmt(tenths * 10, 10),
        fmt(tenths + 10, 100),
        '1/100',
      ],
    }
  }

  const a = rng.int(1, 9)
  const b = rng.int(1, 9) * 10
  // a/10 + b/100 = (a*10 + b)/100
  const sum = a * 10 + b
  return {
    prompt: `What is ${show(a, 10)} + ${show(b, 100)}? Write the sum with denominator 100.`,
    correct: fmt(sum, 100),
    explanation: `${show(a, 10)} = ${show(a * 10, 100)}, then ${show(a * 10, 100)} + ${show(b, 100)} = ${show(sum, 100)}.`,
    distractors: [
      fmt(a + b, 100),
      fmt(a + b, 10),
      fmt(sum, 10),
      fmt(a * 10, 100),
    ],
  }
}

function nf4DecimalNotation(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const toDecimal = rng.chance()
  if (toDecimal) {
    if (rng.chance()) {
      const t = rng.int(1, 9)
      return {
        prompt: `Write ${show(t, 10)} as a decimal.`,
        correct: (t / 10).toFixed(1),
        explanation: `${show(t, 10)} = 0.${t}.`,
        distractors: [
          (t / 100).toFixed(2),
          `0.0${t}`,
          String(t),
          (t / 10 + 0.1).toFixed(1),
        ],
      }
    }
    const h = rng.int(1, paramNum(params, 'maxHundredths', 99))
    const decimal = (h / 100).toFixed(2)
    return {
      prompt: `Write ${show(h, 100)} as a decimal.`,
      correct: decimal,
      explanation: `${show(h, 100)} = ${decimal}.`,
      distractors: [
        (h / 10).toFixed(1),
        (h / 1000).toFixed(3),
        String(h),
        (h / 100 + 0.01).toFixed(2),
      ],
    }
  }

  // decimal → fraction
  if (rng.chance()) {
    const t = rng.int(1, 9)
    return {
      prompt: `Write 0.${t} as a fraction with denominator 10.`,
      correct: fmt(t, 10),
      explanation: `0.${t} means ${t} tenths = ${show(t, 10)}.`,
      distractors: [fmt(t, 100), fmt(t, 1), fmt(1, t), fmt(t + 1, 10)],
    }
  }

  const h = rng.int(1, 99)
  return {
    prompt: `Write ${(h / 100).toFixed(2)} as a fraction with denominator 100.`,
    correct: fmt(h, 100),
    explanation: `${(h / 100).toFixed(2)} means ${h} hundredths = ${show(h, 100)}.`,
    distractors: [fmt(h, 10), fmt(h, 1000), fmt(h + 1, 100), `0.${h}`],
  }
}

function nf4CompareDecimals(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxH = paramNum(params, 'maxHundredths', 99)
  let a = rng.int(1, maxH)
  let b = rng.int(1, maxH)
  while (a === b) b = rng.int(1, maxH)
  const da = (a / 100).toFixed(2)
  const db = (b / 100).toFixed(2)
  const correct = a > b ? da : db
  const other = a > b ? db : da
  return {
    prompt: `Which decimal is greater, ${da} or ${db}?`,
    correct,
    explanation: `Compare hundredths: ${correct} > ${other}.`,
    distractors: [other, (Math.min(a, b) / 100).toFixed(2), '1.00', '0.00'],
  }
}
