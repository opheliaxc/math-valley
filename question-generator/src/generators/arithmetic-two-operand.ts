import { createRng, type Rng } from '../rng.ts'
import type { DifficultyParamValue, GeneratedQuestion } from '../types.ts'
import {
  assertTypeSupported,
  baseFields,
  buildOptions,
  type GeneratorArgs,
  numericDistractorsNear,
  paramNum,
  pickTopic,
} from './shared.ts'

type Op = 'add' | 'subtract' | 'multiply' | 'divide'

interface Core {
  prompt: string
  correct: string
  explanation: string
  distractors: string[]
  /** For true/false equation form when applicable */
  equationLeft?: string
  equationRight?: string
}

export function generateArithmeticTwoOperand(
  args: GeneratorArgs,
): GeneratedQuestion {
  const { config, difficulty, type, seed } = args
  if (config.generatorId !== 'arithmetic-two-operand') {
    throw new Error(
      `arithmetic-two-operand cannot handle generatorId "${config.generatorId}"`,
    )
  }
  assertTypeSupported(config, type)

  const rng = createRng(seed)
  const params = config.difficultyParams[difficulty]
  const core = rollCore(config.code, params, rng)
  const topic = pickTopic(
    config,
    config.mathValleyTopics.includes('operations-algebraic-thinking')
      ? 'operations-algebraic-thinking'
      : 'number-operations-base-ten',
  )
  const base = baseFields(args, topic)

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
      options,
      correctOptionIndex,
      explanation: core.explanation,
    }
  }

  if (type === 'true-false') {
    return { ...base, ...buildTrueFalse(core, rng) }
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
    case 'NY-1.OA.6':
    case 'NY-2.OA.2a':
      return coreAddSubWithin(params, rng)
    case 'NY-1.NBT.4':
      return coreNbt4(params, rng)
    case 'NY-1.NBT.6':
      return coreNbt6(params, rng)
    case 'NY-2.NBT.5':
    case 'NY-2.NBT.7':
    case 'NY-3.NBT.2':
    case 'NY-4.NBT.4':
      return coreAddSubRegroup(params, rng)
    case 'NY-2.NBT.6':
      return coreMultiAddend(params, rng)
    case 'NY-2.OA.4':
      return coreArray(params, rng)
    case 'NY-3.OA.1':
      return coreProductInterpret(params, rng)
    case 'NY-3.OA.2':
      return coreQuotientInterpret(params, rng)
    case 'NY-3.OA.7':
      return coreMultDivFluent(params, rng)
    case 'NY-4.OA.1':
      return coreMultComparison(params, rng)
    case 'NY-4.NBT.5':
      return coreMultiDigitMult(params, rng)
    case 'NY-4.NBT.6':
      return coreLongDivision(params, rng)
    default:
      throw new Error(`arithmetic-two-operand does not support "${code}"`)
  }
}

// ── Add / subtract cores ─────────────────────────────────────────────────────

function coreAddSubWithin(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const op: Op = rng.chance() ? 'add' : 'subtract'
  const minOperand = paramNum(params, 'minOperand', 0)
  const maxOperand = paramNum(params, 'maxOperand')
  const maxResult = paramNum(params, 'maxResult')
  let a = 0
  let b = 0
  let result = 0

  for (let i = 0; i < 80; i += 1) {
    if (op === 'add') {
      a = rng.int(Math.max(minOperand, 1), maxOperand)
      const bMax = Math.min(maxOperand, maxResult - a)
      if (bMax < 1) continue
      b = rng.int(1, bMax)
      result = a + b
      if (result <= maxResult) break
    } else {
      a = rng.int(Math.max(minOperand, 2), Math.min(maxOperand, maxResult))
      b = rng.int(1, a - 1)
      result = a - b
      break
    }
  }

  return equationCore(a, b, op, result, rng)
}

function coreNbt4(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minA = paramNum(params, 'minA')
  const maxA = paramNum(params, 'maxA')
  const minB = paramNum(params, 'minB')
  const maxB = paramNum(params, 'maxB')
  const bMultipleOf10 = paramNum(params, 'bMultipleOf10', 0) === 1

  const a = rng.int(minA, maxA)
  let b: number
  if (bMultipleOf10) {
    const lo = Math.ceil(minB / 10) * 10
    const hi = Math.floor(maxB / 10) * 10
    b = rng.int(lo / 10, hi / 10) * 10
  } else {
    b = rng.int(minB, maxB)
  }
  const result = a + b
  return equationCore(a, b, 'add', result, rng)
}

function coreNbt6(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minM = paramNum(params, 'minMultiple')
  const maxM = paramNum(params, 'maxMultiple')
  const lo = Math.ceil(minM / 10)
  const hi = Math.floor(maxM / 10)
  let tensA = rng.int(lo, hi)
  let tensB = rng.int(lo, hi)
  if (tensA === tensB) tensB = tensA > lo ? tensA - 1 : tensA + 1
  const a = Math.max(tensA, tensB) * 10
  const b = Math.min(tensA, tensB) * 10
  return equationCore(a, b, 'subtract', a - b, rng)
}

function coreAddSubRegroup(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const op: Op = rng.chance() ? 'add' : 'subtract'
  const minOperand = paramNum(params, 'minOperand')
  const maxOperand = paramNum(params, 'maxOperand')
  const requireRegroup = paramNum(params, 'requireRegroup', 0) === 1

  for (let i = 0; i < 120; i += 1) {
    const x = rng.int(minOperand, maxOperand)
    const y = rng.int(minOperand, maxOperand)
    if (op === 'add') {
      if (((x % 10) + (y % 10) >= 10) === requireRegroup) {
        return equationCore(x, y, 'add', x + y, rng)
      }
    } else {
      const a = Math.max(x, y)
      const b = Math.min(x, y)
      if (a === b) continue
      if ((a % 10 < b % 10) === requireRegroup) {
        return equationCore(a, b, 'subtract', a - b, rng)
      }
    }
  }

  const a = rng.int(minOperand, maxOperand)
  const b = rng.int(minOperand, maxOperand)
  if (op === 'add') return equationCore(a, b, 'add', a + b, rng)
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return equationCore(hi, lo, 'subtract', hi - lo, rng)
}

function coreMultiAddend(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const count = paramNum(params, 'addendCount')
  const minAddend = paramNum(params, 'minAddend')
  const maxAddend = paramNum(params, 'maxAddend')
  const addends = Array.from({ length: count }, () =>
    rng.int(minAddend, maxAddend),
  )
  const result = addends.reduce((s, n) => s + n, 0)
  const expr = addends.join(' + ')
  const distractors = numericDistractorsNear(result, [
    result - addends[0]!,
    result + addends[0]!,
    addends.reduce((s, n) => s + (n % 10), 0),
  ], rng).map(String)

  return {
    prompt: `What is ${expr}?`,
    correct: String(result),
    explanation: `${expr} = ${result}.`,
    distractors,
    equationLeft: expr,
    equationRight: String(result),
  }
}

// ── Multiply / divide cores ──────────────────────────────────────────────────

function coreArray(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const rows = rng.int(paramNum(params, 'minRows'), paramNum(params, 'maxRows'))
  const cols = rng.int(paramNum(params, 'minCols'), paramNum(params, 'maxCols'))
  const result = rows * cols
  return {
    prompt: `An array has ${rows} rows and ${cols} columns. How many items are there in all?`,
    correct: String(result),
    explanation: `${rows} rows of ${cols} is ${rows} × ${cols} = ${result}.`,
    distractors: numericDistractorsNear(result, [rows + cols, rows * cols + rows, Math.abs(rows - cols)], rng).map(String),
  }
}

function coreProductInterpret(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const a = rng.int(paramNum(params, 'minFactor'), paramNum(params, 'maxFactor'))
  const b = rng.int(paramNum(params, 'minFactor'), paramNum(params, 'maxFactor'))
  const result = a * b
  const style = rng.chance()
  const prompt = style
    ? `What is ${a} × ${b}?`
    : `${a} groups of ${b} equals how many?`
  return {
    prompt,
    correct: String(result),
    explanation: `${a} × ${b} = ${result}.`,
    distractors: multDistractors(a, b, result, rng),
    equationLeft: `${a} × ${b}`,
    equationRight: String(result),
  }
}

function coreQuotientInterpret(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const divisor = rng.int(paramNum(params, 'minFactor'), paramNum(params, 'maxFactor'))
  const quotient = rng.int(paramNum(params, 'minFactor'), paramNum(params, 'maxFactor'))
  const dividend = divisor * quotient
  const style = rng.chance()
  const prompt = style
    ? `What is ${dividend} ÷ ${divisor}?`
    : `${dividend} items are shared equally among ${divisor} groups. How many in each group?`
  return {
    prompt,
    correct: String(quotient),
    explanation: `${dividend} ÷ ${divisor} = ${quotient}.`,
    distractors: numericDistractorsNear(quotient, [dividend - divisor, divisor, quotient + divisor], rng).map(String),
    equationLeft: `${dividend} ÷ ${divisor}`,
    equationRight: String(quotient),
  }
}

function coreMultDivFluent(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  return rng.chance()
    ? coreProductInterpret(params, rng)
    : coreQuotientInterpret(params, rng)
}

function coreMultComparison(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minF = paramNum(params, 'minFactor')
  const maxF = paramNum(params, 'maxFactor')
  const maxProduct = paramNum(params, 'maxProduct', maxF * maxF)
  let a = rng.int(minF, maxF)
  let b = rng.int(minF, maxF)
  for (let i = 0; i < 40 && a * b > maxProduct; i += 1) {
    a = rng.int(minF, maxF)
    b = rng.int(minF, Math.min(maxF, Math.floor(maxProduct / a)))
  }
  const product = a * b
  return {
    prompt: `${product} is how many times as many as ${b}?`,
    correct: String(a),
    explanation: `${product} = ${a} × ${b}, so ${product} is ${a} times as many as ${b}.`,
    distractors: numericDistractorsNear(a, [b, product, a + b], rng).map(String),
  }
}

function coreMultiDigitMult(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const twoByTwo = paramNum(params, 'twoByTwo', 0) === 1 && rng.chance()
  let a: number
  let b: number
  if (twoByTwo) {
    a = rng.int(10, 99)
    b = rng.int(10, 99)
  } else {
    a = rng.int(paramNum(params, 'minA'), paramNum(params, 'maxA'))
    b = rng.int(paramNum(params, 'minB'), Math.min(paramNum(params, 'maxB'), 9))
  }
  const result = a * b
  return equationCore(a, b, 'multiply', result, rng)
}

function coreLongDivision(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minDigits = paramNum(params, 'minDividendDigits')
  const maxDigits = paramNum(params, 'maxDividendDigits')
  const minDivisor = paramNum(params, 'minDivisor')
  const maxDivisor = paramNum(params, 'maxDivisor')
  const allowRemainder = paramNum(params, 'allowRemainder', 0) === 1

  const digits = rng.int(minDigits, maxDigits)
  const minDividend = 10 ** (digits - 1)
  const maxDividend = 10 ** digits - 1
  const divisor = rng.int(minDivisor, maxDivisor)

  let dividend: number
  let quotient: number
  let remainder: number

  if (allowRemainder && rng.chance()) {
    quotient = rng.int(2, Math.floor(maxDividend / divisor))
    remainder = rng.int(1, divisor - 1)
    dividend = quotient * divisor + remainder
    if (dividend > maxDividend || dividend < minDividend) {
      dividend = Math.min(maxDividend, Math.max(minDividend, quotient * divisor))
      quotient = Math.floor(dividend / divisor)
      remainder = dividend % divisor
    }
  } else {
    quotient = rng.int(2, Math.floor(maxDividend / divisor))
    dividend = quotient * divisor
    if (dividend < minDividend) {
      quotient = Math.ceil(minDividend / divisor)
      dividend = quotient * divisor
    }
    remainder = 0
  }

  const correct =
    remainder === 0 ? String(quotient) : `${quotient} R ${remainder}`
  const distractors = [
    String(quotient + 1),
    String(Math.max(0, quotient - 1)),
    remainder === 0 ? String(dividend - divisor) : String(quotient),
    remainder === 0 ? `${quotient} R 1` : String(quotient * divisor),
  ]

  return {
    prompt: `What is ${dividend} ÷ ${divisor}?`,
    correct,
    explanation:
      remainder === 0
        ? `${dividend} ÷ ${divisor} = ${quotient}.`
        : `${dividend} ÷ ${divisor} = ${quotient} R ${remainder}.`,
    distractors,
  }
}

// ── Shared equation helpers ──────────────────────────────────────────────────

function equationCore(
  a: number,
  b: number,
  op: Op,
  result: number,
  rng: Rng,
): Core {
  const left = `${a} ${sym(op)} ${b}`
  return {
    prompt: `What is ${left}?`,
    correct: String(result),
    explanation: `${left} = ${result}.`,
    distractors: distractorsFor(a, b, op, result, rng),
    equationLeft: left,
    equationRight: String(result),
  }
}

function sym(op: Op): string {
  if (op === 'add') return '+'
  if (op === 'subtract') return '−'
  if (op === 'multiply') return '×'
  return '÷'
}

function distractorsFor(
  a: number,
  b: number,
  op: Op,
  result: number,
  rng: Rng,
): string[] {
  const nums: number[] = [result + 1, result - 1]
  if (op === 'add') {
    nums.push(Math.abs(a - b), result - 10, a + (b % 10))
  } else if (op === 'subtract') {
    nums.push(a + b, result + 10, Math.abs((a % 10) - (b % 10)))
  } else if (op === 'multiply') {
    nums.push(a + b, a * b + a, a * (b - 1), (a - 1) * b)
  } else {
    nums.push(a - b, b, result + b)
  }
  nums.push(result + rng.int(2, 6))
  return [...new Set(nums)].filter((n) => n !== result && n >= 0).map(String)
}

function multDistractors(
  a: number,
  b: number,
  result: number,
  rng: Rng,
): string[] {
  return numericDistractorsNear(result, [a + b, a * b + a, a * (b + 1)], rng).map(String)
}

function buildTrueFalse(
  core: Core,
  rng: Rng,
): { prompt: string; correctAnswer: string; explanation: string } {
  const left = core.equationLeft ?? core.prompt.replace(/^What is |\?$/g, '')
  const right = core.equationRight ?? core.correct
  if (rng.chance()) {
    return {
      prompt: `Is this true or false? ${left} = ${right}`,
      correctAnswer: 'true',
      explanation: `True — ${core.explanation}`,
    }
  }
  const wrongPool = core.distractors.filter((d) => d !== right && d !== core.correct)
  const wrong = rng.pick(
    wrongPool.length > 0 ? wrongPool : [String(Number(right) + 1)],
  )
  return {
    prompt: `Is this true or false? ${left} = ${wrong}`,
    correctAnswer: 'false',
    explanation: `False — ${core.explanation}`,
  }
}
