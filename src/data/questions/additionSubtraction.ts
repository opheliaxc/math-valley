import { pickOne, randomInt, shuffle } from '../../utils/random'
import type { MultipleChoiceQuestion, Question, TypedQuestion } from './types'

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomInt(1000, 9999)}`
}

function uniqueChoices(correct: number, makeWrong: () => number): number[] {
  const wrong = new Set<number>()
  let guard = 0
  while (wrong.size < 3 && guard < 40) {
    const value = makeWrong()
    if (value !== correct && value >= 0) wrong.add(value)
    guard += 1
  }
  while (wrong.size < 3) {
    wrong.add(correct + wrong.size + 1)
  }
  return shuffle([correct, ...wrong])
}

function maybeMultipleChoice(
  base: Omit<TypedQuestion, 'answerFormat'>,
  makeWrong: () => number,
): Question {
  if (Math.random() < 0.5) {
    const question: MultipleChoiceQuestion = {
      ...base,
      answerFormat: 'multiple-choice',
      choices: uniqueChoices(base.correctAnswer, makeWrong),
    }
    return question
  }
  return { ...base, answerFormat: 'typed' }
}

type AddSubTier =
  | 'sums-to-10'
  | 'sums-to-20'
  | 'sums-to-100'
  | 'regrouping-100'
  | 'multi-digit'
  | 'multi-digit-large'

function pairNoRegroup(maxSum: number): [number, number] {
  const a = randomInt(1, Math.max(1, maxSum - 1))
  const maxB = Math.min(9 - (a % 10), maxSum - a)
  const b = randomInt(0, Math.max(0, maxB))
  return b === 0 && a < maxSum ? [a, randomInt(1, Math.min(9, maxSum - a))] : [a, b]
}

function pairWithRegroup(max: number): [number, number] {
  const onesA = randomInt(1, 9)
  const onesB = randomInt(10 - onesA, 9)
  const tensMax = Math.floor(max / 10) - 1
  const tensA = randomInt(0, Math.max(0, tensMax))
  const tensB = randomInt(0, Math.max(0, tensMax - tensA))
  return [tensA * 10 + onesA, tensB * 10 + onesB]
}

export function generateAddSubQuestion(tier: AddSubTier): Question {
  const isSubtraction = Math.random() < 0.45
  let a = 0
  let b = 0
  let answer = 0

  switch (tier) {
    case 'sums-to-10': {
      if (isSubtraction) {
        a = randomInt(1, 10)
        b = randomInt(0, a)
        answer = a - b
      } else {
        a = randomInt(0, 10)
        b = randomInt(0, 10 - a)
        answer = a + b
      }
      break
    }
    case 'sums-to-20': {
      if (isSubtraction) {
        a = randomInt(1, 20)
        b = randomInt(0, a)
        answer = a - b
      } else {
        a = randomInt(0, 20)
        b = randomInt(0, 20 - a)
        answer = a + b
      }
      break
    }
    case 'sums-to-100': {
      ;[a, b] = pairNoRegroup(100)
      if (isSubtraction) {
        const sum = a + b
        a = sum
        answer = a - b
      } else {
        answer = a + b
      }
      break
    }
    case 'regrouping-100': {
      ;[a, b] = pairWithRegroup(99)
      if (isSubtraction) {
        const sum = a + b
        a = Math.min(sum, 99)
        b = randomInt(1, Math.min(a, 40))
        // Prefer a ones-digit borrow when possible
        if ((a % 10) >= (b % 10) && a > 10) {
          b = (Math.floor(b / 10) * 10) + randomInt((a % 10) + 1, 9)
          if (b > a) b = randomInt(1, a)
        }
        answer = a - b
      } else {
        answer = a + b
      }
      break
    }
    case 'multi-digit': {
      a = randomInt(100, 999)
      b = randomInt(10, 999)
      if (isSubtraction) {
        if (b > a) [a, b] = [b, a]
        answer = a - b
      } else {
        answer = a + b
      }
      break
    }
    case 'multi-digit-large': {
      a = randomInt(1000, 9999)
      b = randomInt(100, 9999)
      if (isSubtraction) {
        if (b > a) [a, b] = [b, a]
        answer = a - b
      } else {
        answer = a + b
      }
      break
    }
  }

  const prompt = isSubtraction ? `What is ${a} − ${b}?` : `What is ${a} + ${b}?`
  const base = {
    id: makeId('add-sub'),
    topic: 'addition-subtraction' as const,
    tier,
    prompt,
    correctAnswer: answer,
  }

  return maybeMultipleChoice(base, () =>
    Math.max(0, answer + pickOne([-12, -8, -5, -3, -2, -1, 1, 2, 3, 5, 8, 12])),
  )
}
