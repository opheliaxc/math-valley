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

interface Core {
  prompt: string
  correct: string
  explanation: string
  distractors: string[]
}

export function generateTime(args: GeneratorArgs): GeneratedQuestion {
  const { config, difficulty, type, seed } = args
  if (config.generatorId !== 'time') {
    throw new Error(`time cannot handle generatorId "${config.generatorId}"`)
  }
  assertTypeSupported(config, type)

  const rng = createRng(seed)
  const params = config.difficultyParams[difficulty]
  const core = rollTime(config.code, params, rng)
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

function rollTime(
  code: string,
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  switch (code) {
    case 'NY-1.MD.3a':
      return tellTime(params, rng, false)
    case 'NY-2.MD.7':
      return tellTime(params, rng, true)
    case 'NY-3.MD.1':
      return grade3Time(params, rng)
    default:
      throw new Error(`time does not support "${code}"`)
  }
}

function formatTime(hours24: number, minutes: number, withAmPm: boolean): string {
  const hh = ((hours24 - 1) % 12) + 1
  const mm = String(minutes).padStart(2, '0')
  if (!withAmPm) return `${hh}:${mm}`
  const suffix = hours24 < 12 ? 'a.m.' : 'p.m.'
  return `${hh}:${mm} ${suffix}`
}

function tellTime(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
  withAmPm: boolean,
): Core {
  const step = paramNum(params, 'minuteStep')
  const hour = rng.int(1, 11)
  const slots = Math.floor(60 / step)
  const minutes = rng.int(0, slots - 1) * step
  const hours24 = withAmPm ? (rng.chance() ? hour : hour + 12) % 24 : hour
  const correct = formatTime(withAmPm ? hours24 : hour, minutes, withAmPm)

  const distractors: string[] = []
  distractors.push(formatTime(withAmPm ? hours24 : hour, (minutes + step) % 60, withAmPm))
  distractors.push(formatTime(withAmPm ? hours24 : hour, (minutes + 30) % 60, withAmPm))
  const altHour = hour === 11 ? 1 : hour + 1
  distractors.push(
    formatTime(withAmPm ? (hours24 < 12 ? altHour : altHour + 12) % 24 : altHour, minutes, withAmPm),
  )

  return {
    prompt: withAmPm
      ? `What time is shown: ${hour} hours and ${minutes} minutes (${hours24 < 12 ? 'morning' : 'afternoon'})? Write it with a.m. or p.m.`
      : `The clock shows ${hour} hour${hour === 1 ? '' : 's'} and ${minutes} minutes. What time is it?`,
    correct,
    explanation: `The time is ${correct}.`,
    distractors,
  }
}

function grade3Time(
  params: Record<string, DifficultyParamValue>,
  rng: Rng,
): Core {
  const elapsed = paramNum(params, 'elapsed', 0) === 1
  if (!elapsed) {
    const hour = rng.int(1, 12)
    const minutes = rng.int(0, 59)
    const correct = `${hour}:${String(minutes).padStart(2, '0')}`
    return {
      prompt: `A digital clock shows ${hour} hours and ${minutes} minutes. What time is it?`,
      correct,
      explanation: `The time is ${correct}.`,
      distractors: [
        `${hour}:${String((minutes + 1) % 60).padStart(2, '0')}`,
        `${hour}:${String((minutes + 5) % 60).padStart(2, '0')}`,
        `${(hour % 12) + 1}:${String(minutes).padStart(2, '0')}`,
      ],
    }
  }

  const maxElapsed = paramNum(params, 'maxElapsedMinutes', 60)
  const startH = rng.int(1, 10)
  const startM = rng.int(0, 59)
  const delta = rng.int(5, maxElapsed)
  const total = startH * 60 + startM + delta
  const endH = Math.floor(total / 60)
  const endM = total % 60
  const correct = `${endH}:${String(endM).padStart(2, '0')}`
  const start = `${startH}:${String(startM).padStart(2, '0')}`

  return {
    prompt: `A movie starts at ${start} and lasts ${delta} minutes. What time does it end?`,
    correct,
    explanation: `${start} plus ${delta} minutes is ${correct}.`,
    distractors: [
      `${endH}:${String((endM + 5) % 60).padStart(2, '0')}`,
      `${startH}:${String((startM + delta) % 60).padStart(2, '0')}`,
      `${endH - 1}:${String(endM).padStart(2, '0')}`,
    ],
  }
}
