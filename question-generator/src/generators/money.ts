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

interface Coin {
  name: string
  value: number
}

const ALL_COINS: Coin[] = [
  { name: 'penny', value: 1 },
  { name: 'nickel', value: 5 },
  { name: 'dime', value: 10 },
  { name: 'quarter', value: 25 },
]

interface Core {
  prompt: string
  correct: string
  explanation: string
  distractors: string[]
}

export function generateMoney(args: GeneratorArgs): GeneratedQuestion {
  const { config, difficulty, type, seed } = args
  if (config.generatorId !== 'money') {
    throw new Error(`money cannot handle generatorId "${config.generatorId}"`)
  }
  assertTypeSupported(config, type)

  const rng = createRng(seed)
  const params = config.difficultyParams[difficulty]
  const core = rollMoney(config.code, params, rng)
  const base = baseFields(args, pickTopic(config, 'measurement-data'))

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

function rollMoney(
  code: string,
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  switch (code) {
    case 'NY-1.MD.3b':
      return identifyCoin(params, rng)
    case 'NY-1.MD.3c':
      return dimesAndPennies(params, rng)
    case 'NY-2.MD.8':
      return mixedCoins(params, rng)
    default:
      throw new Error(`money does not support "${code}"`)
  }
}

function identifyCoin(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const kinds = paramNum(params, 'coinKinds', 4)
  const pool = ALL_COINS.slice(0, Math.min(kinds, ALL_COINS.length))
  const coin = rng.pick(pool)
  const askValue = rng.chance()

  if (askValue) {
    return {
      prompt: `How many cents is a ${coin.name} worth?`,
      correct: String(coin.value),
      explanation: `A ${coin.name} is worth ${coin.value}¢.`,
      distractors: pool
        .filter((c) => c.value !== coin.value)
        .map((c) => String(c.value)),
    }
  }

  return {
    prompt: `Which coin is worth ${coin.value}¢?`,
    correct: coin.name,
    explanation: `A ${coin.name} is worth ${coin.value}¢.`,
    distractors: pool.filter((c) => c.name !== coin.name).map((c) => c.name),
  }
}

function dimesAndPennies(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxCents = paramNum(params, 'maxCents')
  const maxCoins = paramNum(params, 'maxCoins')
  let dimes = rng.int(0, Math.min(Math.floor(maxCents / 10), maxCoins))
  let pennies = rng.int(0, Math.min(9, maxCoins - dimes))
  let total = dimes * 10 + pennies
  if (total === 0 || total > maxCents) {
    dimes = 1
    pennies = rng.int(0, Math.min(9, maxCents - 10))
    total = dimes * 10 + pennies
  }

  return {
    prompt: `You have ${dimes} dime${dimes === 1 ? '' : 's'} and ${pennies} penn${pennies === 1 ? 'y' : 'ies'}. How many cents is that?`,
    correct: String(total),
    explanation: `${dimes}×10 + ${pennies} = ${total}¢.`,
    distractors: numericDistractorsNear(total, [dimes + pennies, dimes * 10, pennies * 10], rng).map(String),
  }
}

function mixedCoins(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxCents = paramNum(params, 'maxCents')
  const maxCoins = paramNum(params, 'maxCoins')

  let quarters = 0
  let dimes = 0
  let nickels = 0
  let pennies = 0
  let total = 0

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const coinCount = rng.int(2, maxCoins)
    quarters = rng.int(0, Math.min(3, coinCount))
    dimes = rng.int(0, Math.min(5, coinCount - quarters))
    nickels = rng.int(0, Math.min(5, coinCount - quarters - dimes))
    pennies = Math.max(0, coinCount - quarters - dimes - nickels)
    total = quarters * 25 + dimes * 10 + nickels * 5 + pennies
    if (total > 0 && total <= maxCents) break
  }

  const parts: string[] = []
  if (quarters) parts.push(`${quarters} quarter${quarters === 1 ? '' : 's'}`)
  if (dimes) parts.push(`${dimes} dime${dimes === 1 ? '' : 's'}`)
  if (nickels) parts.push(`${nickels} nickel${nickels === 1 ? '' : 's'}`)
  if (pennies) parts.push(`${pennies} penn${pennies === 1 ? 'y' : 'ies'}`)

  return {
    prompt: `Count the coins: ${parts.join(', ')}. How many cents in all?`,
    correct: String(total),
    explanation: `The coins add up to ${total}¢.`,
    distractors: numericDistractorsNear(total, [
      total + 5,
      total - 5,
      quarters * 25 + dimes * 10,
    ], rng).map(String),
  }
}
