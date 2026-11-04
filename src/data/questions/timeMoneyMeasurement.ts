import { pickOne, randomInt, shuffle } from '../../utils/random'
import type { CoinValue, Question } from './types'

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
  return shuffle([correct, ...wrong])
}

type TmmTier =
  | 'hour-half-coins'
  | 'time-5min-money'
  | 'elapsed-money-totals'
  | 'units-conversions'

const COINS: CoinValue[] = [1, 5, 10, 25]

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatTime(hour: number, minute: number): string {
  const h = ((hour - 1) % 12) + 1
  return `${h}:${minute.toString().padStart(2, '0')}`
}

export function generateTimeMoneyMeasurement(tier: TmmTier): Question {
  if (tier === 'hour-half-coins') {
    if (Math.random() < 0.5) {
      const hour = randomInt(1, 12)
      const minute = pickOne([0, 30] as const)
      const correctAnswer = minute === 0 ? hour : hour * 100 + minute
      return {
        id: makeId('tmm'),
        topic: 'time-money-measurement',
        tier,
        prompt:
          minute === 0
            ? `Set the clock to ${formatTime(hour, 0)}. What hour is shown? (1–12)`
            : `Set the clock to ${formatTime(hour, 30)}. Enter the time like ${hour}30.`,
        correctAnswer,
        answerFormat: 'drag-drop',
        dragDrop: {
          kind: 'clock',
          targetHour: hour,
          targetMinute: minute,
        },
      }
    }

    const targetCents = pickOne([10, 15, 25, 30, 35, 40, 50])
    return {
      id: makeId('tmm'),
      topic: 'time-money-measurement',
      tier,
      prompt: `Make exactly ${targetCents}¢ by choosing coins.`,
      correctAnswer: targetCents,
      answerFormat: 'drag-drop',
      dragDrop: {
        kind: 'coins',
        targetCents,
        availableCoins: [...COINS],
      },
    }
  }

  if (tier === 'time-5min-money') {
    if (Math.random() < 0.5) {
      const hour = randomInt(1, 12)
      const minute = randomInt(0, 11) * 5
      const correctAnswer = hour * 100 + minute
      return {
        id: makeId('tmm'),
        topic: 'time-money-measurement',
        tier,
        prompt: `A clock shows ${formatTime(hour, minute)}. Enter it like ${correctAnswer} (hour then minutes).`,
        correctAnswer,
        answerFormat: 'multiple-choice',
        choices: uniqueChoices(correctAnswer, () => {
          const h = randomInt(1, 12)
          const m = randomInt(0, 11) * 5
          return h * 100 + m
        }),
      }
    }

    const dollars = randomInt(1, 5)
    const cents = randomInt(0, 3) * 25
    const total = dollars * 100 + cents
    return {
      id: makeId('tmm'),
      topic: 'time-money-measurement',
      tier,
      prompt: `How many cents are in ${formatMoney(total)}?`,
      correctAnswer: total,
      answerFormat: 'typed',
    }
  }

  if (tier === 'elapsed-money-totals') {
    if (Math.random() < 0.5) {
      const startHour = randomInt(1, 10)
      const startMin = pickOne([0, 15, 30, 45])
      const elapsed = pickOne([15, 30, 45, 60, 90])
      const endTotal = startHour * 60 + startMin + elapsed
      const endHour = Math.floor(endTotal / 60)
      const endMin = endTotal % 60
      const correctAnswer = endHour * 100 + endMin
      return {
        id: makeId('tmm'),
        topic: 'time-money-measurement',
        tier,
        prompt: `A show starts at ${formatTime(startHour, startMin)} and lasts ${elapsed} minutes. What time does it end? Enter like ${correctAnswer}.`,
        correctAnswer,
        answerFormat: 'typed',
      }
    }

    const priceA = randomInt(50, 250)
    const priceB = randomInt(25, 200)
    return {
      id: makeId('tmm'),
      topic: 'time-money-measurement',
      tier,
      prompt: `You buy items costing ${formatMoney(priceA)} and ${formatMoney(priceB)}. What is the total in cents?`,
      correctAnswer: priceA + priceB,
      answerFormat: 'multiple-choice',
      choices: uniqueChoices(priceA + priceB, () =>
        Math.max(1, priceA + priceB + pickOne([-50, -25, -10, 10, 25, 50])),
      ),
    }
  }

  if (Math.random() < 0.5) {
    const feet = randomInt(2, 9)
    return {
      id: makeId('tmm'),
      topic: 'time-money-measurement',
      tier: 'units-conversions',
      prompt: `How many inches are in ${feet} feet? (1 foot = 12 inches)`,
      correctAnswer: feet * 12,
      answerFormat: 'typed',
    }
  }

  const startHour = randomInt(1, 8)
  const elapsedHours = randomInt(1, 3)
  const end = startHour + elapsedHours
  return {
    id: makeId('tmm'),
    topic: 'time-money-measurement',
    tier: 'units-conversions',
    prompt: `A train leaves at ${startHour}:00 and travels for ${elapsedHours} hour(s). What hour does it arrive?`,
    correctAnswer: end,
    answerFormat: 'multiple-choice',
    choices: uniqueChoices(end, () => randomInt(1, 12)),
  }
}
