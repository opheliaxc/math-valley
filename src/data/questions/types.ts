import type { AnyTierId } from '../tiers'

export type AnswerFormat = 'multiple-choice' | 'typed' | 'drag-drop'

export type CoinValue = 1 | 5 | 10 | 25

export type DragDropCoinsPayload = {
  kind: 'coins'
  targetCents: number
  availableCoins: CoinValue[]
}

export type DragDropClockPayload = {
  kind: 'clock'
  targetHour: number
  targetMinute: 0 | 30
}

export type DragDropPayload = DragDropCoinsPayload | DragDropClockPayload

type QuestionBase = {
  id: string
  /** Legacy static-bank topic key (pre-domain islands). */
  topic: string
  tier: AnyTierId | string
  prompt: string
  /** Canonical numeric answer used for checking. */
  correctAnswer: number
}

export type MultipleChoiceQuestion = QuestionBase & {
  answerFormat: 'multiple-choice'
  choices: number[]
}

export type TypedQuestion = QuestionBase & {
  answerFormat: 'typed'
}

export type DragDropQuestion = QuestionBase & {
  answerFormat: 'drag-drop'
  dragDrop: DragDropPayload
}

export type Question =
  | MultipleChoiceQuestion
  | TypedQuestion
  | DragDropQuestion

export function checkAnswer(question: Question, answer: number): boolean {
  return answer === question.correctAnswer
}
