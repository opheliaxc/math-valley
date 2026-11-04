import { pickOne, randomInt } from '../../utils/random'
import type { Question } from './types'

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
  while (wrong.size < 3) wrong.add(correct + wrong.size + 1)
  const choices = [correct, ...wrong]
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i)
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return choices
}

function maybeMc(
  base: {
    id: string
    topic: 'multiplication-division'
    tier: MultDivTier
    prompt: string
    correctAnswer: number
  },
): Question {
  if (Math.random() < 0.5) {
    return {
      ...base,
      answerFormat: 'multiple-choice',
      choices: uniqueChoices(base.correctAnswer, () =>
        Math.max(0, base.correctAnswer + pickOne([-10, -6, -4, -2, -1, 1, 2, 4, 6, 10])),
      ),
    }
  }
  return { ...base, answerFormat: 'typed' }
}

type MultDivTier =
  | 'intro-groups'
  | 'facts-to-5'
  | 'facts-to-10'
  | 'multi-digit-remainders'

export function generateMultDivQuestion(tier: MultDivTier): Question {
  switch (tier) {
    case 'intro-groups': {
      const groups = randomInt(2, 5)
      const perGroup = randomInt(2, 5)
      const answer = groups * perGroup
      const prompt = pickOne([
        `There are ${groups} bags with ${perGroup} apples in each. How many apples in all?`,
        `What is ${groups} groups of ${perGroup}?`,
      ])
      return maybeMc({
        id: makeId('mult-div'),
        topic: 'multiplication-division',
        tier,
        prompt,
        correctAnswer: answer,
      })
    }
    case 'facts-to-5': {
      const a = randomInt(1, 5)
      const b = randomInt(1, 5)
      const isDiv = Math.random() < 0.4
      if (isDiv) {
        const product = a * b
        return maybeMc({
          id: makeId('mult-div'),
          topic: 'multiplication-division',
          tier,
          prompt: `What is ${product} ÷ ${a}?`,
          correctAnswer: b,
        })
      }
      return maybeMc({
        id: makeId('mult-div'),
        topic: 'multiplication-division',
        tier,
        prompt: `What is ${a} × ${b}?`,
        correctAnswer: a * b,
      })
    }
    case 'facts-to-10': {
      const a = randomInt(1, 10)
      const b = randomInt(1, 10)
      const isDiv = Math.random() < 0.45
      if (isDiv) {
        const product = a * b
        return maybeMc({
          id: makeId('mult-div'),
          topic: 'multiplication-division',
          tier,
          prompt: `What is ${product} ÷ ${a}?`,
          correctAnswer: b,
        })
      }
      return maybeMc({
        id: makeId('mult-div'),
        topic: 'multiplication-division',
        tier,
        prompt: `What is ${a} × ${b}?`,
        correctAnswer: a * b,
      })
    }
    case 'multi-digit-remainders': {
      if (Math.random() < 0.5) {
        const a = randomInt(11, 49)
        const b = randomInt(2, 9)
        return maybeMc({
          id: makeId('mult-div'),
          topic: 'multiplication-division',
          tier,
          prompt: `What is ${a} × ${b}?`,
          correctAnswer: a * b,
        })
      }
      const divisor = randomInt(2, 9)
      const quotient = randomInt(3, 12)
      const remainder = randomInt(1, divisor - 1)
      const dividend = divisor * quotient + remainder
      return {
        id: makeId('mult-div'),
        topic: 'multiplication-division',
        tier,
        prompt: `What is the remainder when ${dividend} is divided by ${divisor}?`,
        correctAnswer: remainder,
        answerFormat: 'typed',
      }
    }
  }
}
