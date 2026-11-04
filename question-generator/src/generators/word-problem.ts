import { createRng, type Rng } from '../rng.ts'
import { NAMES, OBJECTS, SETTINGS } from '../vocabulary.ts'
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

interface Core {
  prompt: string
  correct: string
  explanation: string
  distractors: string[]
}

export function generateWordProblem(args: GeneratorArgs): GeneratedQuestion {
  const { config, difficulty, type, seed } = args
  if (config.generatorId !== 'word-problem') {
    throw new Error(`word-problem cannot handle generatorId "${config.generatorId}"`)
  }
  assertTypeSupported(config, type)

  const rng = createRng(seed)
  const params = config.difficultyParams[difficulty]
  const core = rollWordProblem(config.code, params, rng)
  const topic = pickTopic(config, 'operations-algebraic-thinking')
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

  return {
    ...base,
    prompt: core.prompt,
    correctAnswer: core.correct,
    explanation: core.explanation,
  }
}

function rollWordProblem(
  code: string,
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  switch (code) {
    case 'NY-1.OA.1':
    case 'NY-2.OA.1a':
      return oneStepAddSub(params, rng)
    case 'NY-1.OA.2':
      return threeAddends(params, rng)
    case 'NY-2.OA.1b':
    case 'NY-3.OA.8':
      return twoStepMixed(params, rng)
    case 'NY-3.OA.3':
      return multDivWord(params, rng)
    case 'NY-4.OA.2':
      return multCompareWord(params, rng)
    case 'NY-4.OA.3':
      return multiStepWord(params, rng)
    default:
      throw new Error(`word-problem does not support "${code}"`)
  }
}

function oneStepAddSub(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxResult = paramNum(params, 'maxResult')
  const name = rng.pick(NAMES)
  const obj = rng.pick(OBJECTS)
  const setting = rng.pick(SETTINGS)
  const add = rng.chance()

  if (add) {
    const a = rng.int(1, Math.max(1, maxResult - 1))
    const b = rng.int(1, maxResult - a)
    const result = a + b
    return {
      prompt: `${name} has ${a} ${obj} ${setting}. Then ${name} gets ${b} more. How many ${obj} does ${name} have now?`,
      correct: String(result),
      explanation: `${a} + ${b} = ${result}.`,
      distractors: near(result, [a, b, Math.abs(a - b)], rng),
    }
  }

  const start = rng.int(2, maxResult)
  const take = rng.int(1, start - 1)
  const result = start - take
  return {
    prompt: `${name} has ${start} ${obj} ${setting}. ${name} gives away ${take}. How many ${obj} are left?`,
    correct: String(result),
    explanation: `${start} − ${take} = ${result}.`,
    distractors: near(result, [start + take, take, start], rng),
  }
}

function threeAddends(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxResult = paramNum(params, 'maxResult')
  const name = rng.pick(NAMES)
  const obj = rng.pick(OBJECTS)
  let a = 0
  let b = 0
  let c = 0
  for (let i = 0; i < 40; i += 1) {
    a = rng.int(1, Math.floor(maxResult / 2))
    b = rng.int(1, Math.floor(maxResult / 2))
    c = rng.int(1, Math.floor(maxResult / 2))
    if (a + b + c <= maxResult) break
  }
  const result = a + b + c
  return {
    prompt: `${name} finds ${a} ${obj}, then ${b} more, then ${c} more. How many ${obj} in all?`,
    correct: String(result),
    explanation: `${a} + ${b} + ${c} = ${result}.`,
    distractors: near(result, [a + b, a + c, b + c], rng),
  }
}

function twoStepMixed(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxResult = paramNum(params, 'maxResult')
  const name = rng.pick(NAMES)
  const obj = rng.pick(OBJECTS)
  const start = rng.int(5, Math.floor(maxResult * 0.6))
  const add = rng.int(1, Math.floor(maxResult * 0.3))
  let after = start + add
  if (after > maxResult) after = maxResult
  const takeMax = Math.min(after - 1, Math.floor(maxResult / 3))
  const take = rng.int(1, Math.max(1, takeMax))
  const result = after - take
  return {
    prompt: `${name} has ${start} ${obj}, gets ${add} more, then gives away ${take}. How many ${obj} does ${name} have now?`,
    correct: String(result),
    explanation: `${start} + ${add} = ${after}, then ${after} − ${take} = ${result}.`,
    distractors: near(result, [start + add, start - take, after + take], rng),
  }
}

function multDivWord(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minF = paramNum(params, 'minFactor')
  const maxF = paramNum(params, 'maxFactor')
  const maxProduct = paramNum(params, 'maxProduct', maxF * maxF)
  const name = rng.pick(NAMES)
  const obj = rng.pick(OBJECTS)

  if (rng.chance()) {
    let groups = rng.int(minF, maxF)
    let each = rng.int(minF, maxF)
    while (groups * each > maxProduct) {
      groups = rng.int(minF, maxF)
      each = rng.int(minF, Math.min(maxF, Math.floor(maxProduct / groups)))
    }
    const result = groups * each
    return {
      prompt: `${name} has ${groups} bags with ${each} ${obj} in each bag. How many ${obj} in total?`,
      correct: String(result),
      explanation: `${groups} × ${each} = ${result}.`,
      distractors: near(result, [groups + each, groups * (each + 1)], rng),
    }
  }

  const groups = rng.int(minF, maxF)
  const each = rng.int(minF, maxF)
  const total = groups * each
  return {
    prompt: `${name} has ${total} ${obj} and shares them equally into ${groups} bags. How many ${obj} in each bag?`,
    correct: String(each),
    explanation: `${total} ÷ ${groups} = ${each}.`,
    distractors: near(each, [groups, total - groups, each + 1], rng),
  }
}

function multCompareWord(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minF = paramNum(params, 'minFactor')
  const maxF = paramNum(params, 'maxFactor')
  const maxProduct = paramNum(params, 'maxProduct', maxF * maxF)
  const [nameA, nameB] = twoNames(rng)
  const obj = rng.pick(OBJECTS)
  let times = rng.int(minF, maxF)
  let base = rng.int(minF, maxF)
  while (times * base > maxProduct) {
    times = rng.int(minF, maxF)
    base = rng.int(minF, Math.min(maxF, Math.floor(maxProduct / times)))
  }
  const result = times * base
  return {
    prompt: `${nameA} has ${base} ${obj}. ${nameB} has ${times} times as many. How many ${obj} does ${nameB} have?`,
    correct: String(result),
    explanation: `${times} × ${base} = ${result}.`,
    distractors: near(result, [times + base, base, times], rng),
  }
}

function multiStepWord(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxResult = paramNum(params, 'maxResult')
  const steps = paramNum(params, 'steps', 2)
  const name = rng.pick(NAMES)
  const obj = rng.pick(OBJECTS)

  if (steps >= 3) {
    const a = rng.int(2, 8)
    const b = rng.int(2, 8)
    const c = rng.int(1, 20)
    let product = a * b
    if (product + c > maxResult) product = Math.max(4, maxResult - c)
    const result = product + c
    return {
      prompt: `${name} packs ${a} boxes with ${b} ${obj} each, then finds ${c} more. How many ${obj} in all?`,
      correct: String(result),
      explanation: `${a} × ${b} = ${a * b}, then add ${c} to get ${result}.`,
      distractors: near(result, [a * b, a + b + c, result - c], rng),
    }
  }

  return twoStepMixed(params, rng)
}

function twoNames(rng: Rng): [string, string] {
  const first = rng.pick(NAMES)
  let second = rng.pick(NAMES)
  let guard = 0
  while (second === first && guard < 20) {
    second = rng.pick(NAMES)
    guard += 1
  }
  if (second === first) {
    const idx = NAMES.indexOf(first)
    second = NAMES[(idx + 1) % NAMES.length]!
  }
  return [first, second]
}

function near(correct: number, extras: number[], rng: Rng): string[] {
  return numericDistractorsNear(correct, extras, rng).map(String)
}
