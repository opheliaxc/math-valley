import type { QuestionOption, VisualSpec } from './visual.ts'

export type { Point2D, PictureOption, QuestionOption, VisualSpec } from './visual.ts'
export {
  isPictureOption,
  optionAnswerValue,
  optionKey,
  optionLabel,
} from './visual.ts'

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer'

export type Difficulty = 'beginner' | 'advanced'

export type Grade = 1 | 2 | 3 | 4

export type DifficultyParamValue = number | [number, number]

export interface StandardConfig {
  code: string
  grade: Grade
  domain: string
  mathValleyTopics: string[]
  supportedTypes: QuestionType[]
  difficultyParams: {
    beginner: Record<string, DifficultyParamValue>
    advanced: Record<string, DifficultyParamValue>
  }
  generatorId: string
}

export interface GeneratedQuestion {
  id: string
  standard: string
  grade: Grade
  topic: string
  difficulty: Difficulty
  type: QuestionType
  prompt: string
  correctAnswer: string
  /**
   * Text options stay plain strings (existing generators).
   * Picture options use `{ id, visual?, altText, text? }`; correctAnswer is the id.
   */
  options?: QuestionOption[]
  correctOptionIndex?: number
  explanation: string
  seed?: number
  /** Optional picture shown with the prompt. */
  visual?: VisualSpec
  /** Alt text for `visual`, generated from the VisualSpec. */
  altText?: string
  /**
   * Optional named predicate for visual validation (Phase 0+).
   * When set, the validator re-derives the answer from VisualSpec(s).
   */
  visualPredicate?: string
}

export interface GenerateQuestionParams {
  grade: Grade
  standard: string
  difficulty: Difficulty
  type?: QuestionType
  seed?: number
}
