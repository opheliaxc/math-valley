import { createRng, type Rng } from '../rng.ts'
import { NAMES } from '../vocabulary.ts'
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

const LENGTH_UNITS = ['inches', 'centimeters'] as const
const MASS_UNITS = ['grams', 'kilograms'] as const
const VOLUME_UNITS = ['liters'] as const

const CONVERSIONS: { from: string; to: string; factor: number }[] = [
  { from: 'feet', to: 'inches', factor: 12 },
  { from: 'meters', to: 'centimeters', factor: 100 },
  { from: 'kilograms', to: 'grams', factor: 1000 },
  { from: 'hours', to: 'minutes', factor: 60 },
]

export function generateMeasurement(args: GeneratorArgs): GeneratedQuestion {
  const { config, difficulty, type, seed } = args
  if (config.generatorId !== 'measurement') {
    throw new Error(`measurement cannot handle generatorId "${config.generatorId}"`)
  }
  assertTypeSupported(config, type)

  const rng = createRng(seed)
  const params = config.difficultyParams[difficulty]
  const core = rollMeasurement(config.code, params, rng)
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

function rollMeasurement(
  code: string,
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  switch (code) {
    case 'NY-2.MD.1':
      return lengthMeasure(params, rng)
    case 'NY-3.MD.2':
      return massVolume(params, rng)
    case 'NY-4.MD.1':
      return unitConversion(params, rng)
    case 'NY-4.MD.2':
      return measurementWord(params, rng)
    default:
      throw new Error(`measurement does not support "${code}"`)
  }
}

function lengthMeasure(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minLength = paramNum(params, 'minLength')
  const maxLength = paramNum(params, 'maxLength')
  const length = rng.int(minLength, maxLength)
  const unit = rng.pick(LENGTH_UNITS)
  const name = rng.pick(NAMES)
  return {
    prompt: `${name} measures a pencil. It is ${length} ${unit} long. How long is the pencil?`,
    correct: String(length),
    explanation: `The pencil is ${length} ${unit} long.`,
    distractors: numericDistractorsNear(length, [length + 2, length - 2, length * 2], rng).map(String),
  }
}

function massVolume(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const minM = paramNum(params, 'minMeasure')
  const maxM = paramNum(params, 'maxMeasure')
  const name = rng.pick(NAMES)
  if (rng.chance()) {
    const mass = rng.int(minM, maxM)
    const unit = rng.pick(MASS_UNITS)
    return {
      prompt: `${name} has a bag of flour that has a mass of ${mass} ${unit}. What is the mass?`,
      correct: String(mass),
      explanation: `The mass is ${mass} ${unit}.`,
      distractors: numericDistractorsNear(mass, [mass + 5, mass - 5], rng).map(String),
    }
  }

  const volume = rng.int(minM, maxM)
  const unit = rng.pick(VOLUME_UNITS)
  const a = rng.int(1, Math.max(1, volume - 1))
  const b = volume - a
  return {
    prompt: `${name} pours ${a} ${unit} of water into a jug that already has ${b} ${unit}. How many ${unit} are in the jug now?`,
    correct: String(volume),
    explanation: `${a} + ${b} = ${volume} ${unit}.`,
    distractors: numericDistractorsNear(volume, [a, b, Math.abs(a - b)], rng).map(String),
  }
}

function unitConversion(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxFrom = paramNum(params, 'maxFromValue')
  const conv = rng.pick(CONVERSIONS)
  const fromValue = rng.int(1, maxFrom)
  const result = fromValue * conv.factor
  return {
    prompt: `Convert: ${fromValue} ${conv.from} = ? ${conv.to}`,
    correct: String(result),
    explanation: `${fromValue} × ${conv.factor} = ${result} ${conv.to}.`,
    distractors: numericDistractorsNear(result, [
      fromValue + conv.factor,
      fromValue * (conv.factor - 1),
      Math.floor(fromValue * conv.factor / 10),
    ], rng).map(String),
  }
}

function measurementWord(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const maxResult = paramNum(params, 'maxResult')
  const steps = paramNum(params, 'steps', 1)
  const name = rng.pick(NAMES)
  const unit = rng.pick(['meters', 'minutes', 'grams'] as const)

  if (steps >= 2) {
    const a = rng.int(5, Math.floor(maxResult / 3))
    const b = rng.int(5, Math.floor(maxResult / 3))
    const c = rng.int(1, Math.floor(maxResult / 4))
    const result = a + b - c
    if (result <= 0 || result > maxResult) {
      return measurementWord({ ...params, steps: 1 }, rng)
    }
    return {
      prompt: `${name} walks ${a} ${unit}, then ${b} more, then rests after going back ${c} ${unit}. How many ${unit} has ${name} traveled net?`,
      correct: String(result),
      explanation: `${a} + ${b} − ${c} = ${result}.`,
      distractors: numericDistractorsNear(result, [a + b, a + b + c, a - c], rng).map(String),
    }
  }

  const a = rng.int(2, Math.floor(maxResult / 2))
  const b = rng.int(2, maxResult - a)
  const result = a + b
  return {
    prompt: `${name} has a ribbon ${a} ${unit} long and another ${b} ${unit} long. What is the total length?`,
    correct: String(result),
    explanation: `${a} + ${b} = ${result} ${unit}.`,
    distractors: numericDistractorsNear(result, [Math.abs(a - b), a, b], rng).map(String),
  }
}
