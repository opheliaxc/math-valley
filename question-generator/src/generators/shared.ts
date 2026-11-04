import type { Rng } from '../rng.ts'
import type {
  Difficulty,
  DifficultyParamValue,
  GeneratedQuestion,
  PictureOption,
  QuestionType,
  StandardConfig,
} from '../types.ts'

export interface GeneratorArgs {
  config: StandardConfig
  difficulty: Difficulty
  type: QuestionType
  seed?: number
}

export function paramNum(
  params: Record<string, DifficultyParamValue>,
  key: string,
  fallback?: number,
): number {
  const value = params[key]
  if (typeof value === 'number') return value
  if (fallback !== undefined) return fallback
  throw new Error(`Missing numeric difficulty param "${key}"`)
}

export function pickTopic(
  config: StandardConfig,
  preferred?: string,
): string {
  if (preferred && config.mathValleyTopics.includes(preferred)) return preferred
  return config.mathValleyTopics[0] ?? 'general'
}

export function baseFields(
  args: GeneratorArgs,
  topic: string,
): Pick<
  GeneratedQuestion,
  'id' | 'standard' | 'grade' | 'topic' | 'difficulty' | 'type' | 'seed'
> {
  const { config, difficulty, type, seed } = args
  return {
    id: crypto.randomUUID(),
    standard: config.code,
    grade: config.grade,
    topic,
    difficulty,
    type,
    ...(seed !== undefined ? { seed } : {}),
  }
}

export function assertTypeSupported(
  config: StandardConfig,
  type: QuestionType,
): void {
  if (!config.supportedTypes.includes(type)) {
    throw new Error(
      `Standard ${config.code} does not support question type "${type}"`,
    )
  }
}

/** Build 4 unique string options with one correct answer. */
export function buildOptions(
  correct: string,
  distractorCandidates: string[],
  rng: Rng,
): { options: string[]; correctOptionIndex: number } {
  const unique: string[] = []
  for (const d of distractorCandidates) {
    if (d !== correct && !unique.includes(d)) unique.push(d)
    if (unique.length >= 3) break
  }

  let n = 1
  while (unique.length < 3) {
    const candidate = String(Number(correct) + n)
    n = n > 0 ? -n : -n + 1
    if (candidate !== correct && !unique.includes(candidate) && candidate !== 'NaN') {
      unique.push(candidate)
    }
    if (Math.abs(n) > 80) {
      unique.push(`alt-${unique.length}`)
    }
  }

  const options = rng.shuffle([correct, ...unique.slice(0, 3)])
  return { options, correctOptionIndex: options.indexOf(correct) }
}

export function buildNumericOptions(
  correct: number,
  distractorNums: number[],
  rng: Rng,
): { options: string[]; correctOptionIndex: number } {
  const candidates = distractorNums
    .filter((n) => Number.isFinite(n) && n !== correct && n >= 0)
    .map(String)
  return buildOptions(String(correct), candidates, rng)
}

export function numericDistractorsNear(
  correct: number,
  extras: number[],
  rng: Rng,
): number[] {
  return [
    ...extras,
    correct + 1,
    correct - 1,
    correct + rng.int(2, 5),
    Math.max(0, correct - rng.int(2, 5)),
  ]
}

/** Build 4 unique picture options; correctAnswer is the winning option id. */
export function buildPictureOptions(
  correct: PictureOption,
  distractors: PictureOption[],
  rng: Rng,
): { options: PictureOption[]; correctOptionIndex: number; correctAnswer: string } {
  const unique: PictureOption[] = []
  const seen = new Set<string>([correct.id])
  for (const d of distractors) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    unique.push(d)
    if (unique.length >= 3) break
  }
  while (unique.length < 3) {
    const id = `extra-${unique.length}`
    if (seen.has(id)) continue
    seen.add(id)
    unique.push({
      id,
      altText: `option ${unique.length + 1}`,
      text: `Option ${unique.length + 1}`,
    })
  }
  const options = rng.shuffle([correct, ...unique.slice(0, 3)])
  return {
    options,
    correctOptionIndex: options.findIndex((o) => o.id === correct.id),
    correctAnswer: correct.id,
  }
}
