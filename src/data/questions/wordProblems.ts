import { pickOne, randomInt } from '../../utils/random'
import type { Question } from './types'

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomInt(1000, 9999)}`
}

type WordTier = 'one-step-small' | 'one-step' | 'two-step' | 'two-step-mixed'

const NAMES = ['Sam', 'Ava', 'Leo', 'Mia', 'Noah', 'Zoe'] as const

export function generateWordProblem(tier: WordTier): Question {
  const name = pickOne(NAMES)

  switch (tier) {
    case 'one-step-small': {
      const a = randomInt(1, 10)
      const b = randomInt(1, 10)
      if (Math.random() < 0.5) {
        return {
          id: makeId('word'),
          topic: 'word-problems',
          tier,
          prompt: `${name} has ${a} stickers and gets ${b} more. How many stickers now?`,
          correctAnswer: a + b,
          answerFormat: 'typed',
        }
      }
      const total = a + b
      return {
        id: makeId('word'),
        topic: 'word-problems',
        tier,
        prompt: `${name} has ${total} crayons and gives away ${a}. How many are left?`,
        correctAnswer: b,
        answerFormat: 'typed',
      }
    }
    case 'one-step': {
      const a = randomInt(10, 50)
      const b = randomInt(5, 40)
      if (Math.random() < 0.5) {
        return {
          id: makeId('word'),
          topic: 'word-problems',
          tier,
          prompt: `${name} collected ${a} coins on Monday and ${b} on Tuesday. How many coins in all?`,
          correctAnswer: a + b,
          answerFormat: 'typed',
        }
      }
      const start = a + b
      return {
        id: makeId('word'),
        topic: 'word-problems',
        tier,
        prompt: `${name} had ${start} points and lost ${b}. How many points are left?`,
        correctAnswer: a,
        answerFormat: 'typed',
      }
    }
    case 'two-step': {
      const a = randomInt(5, 20)
      const b = randomInt(5, 20)
      const c = randomInt(2, 15)
      return {
        id: makeId('word'),
        topic: 'word-problems',
        tier,
        prompt: `${name} baked ${a} muffins in the morning and ${b} in the afternoon, then gave away ${c}. How many muffins are left?`,
        correctAnswer: a + b - c,
        answerFormat: 'typed',
      }
    }
    case 'two-step-mixed': {
      const packs = randomInt(2, 6)
      const perPack = randomInt(3, 9)
      const extra = randomInt(2, 12)
      const used = randomInt(1, packs * perPack)
      const total = packs * perPack + extra - used
      return {
        id: makeId('word'),
        topic: 'word-problems',
        tier,
        prompt: `${name} bought ${packs} packs of cards with ${perPack} in each pack, found ${extra} more cards, then used ${used}. How many cards are left?`,
        correctAnswer: total,
        answerFormat: 'typed',
      }
    }
  }
}
