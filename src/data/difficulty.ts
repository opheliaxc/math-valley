import type { Grade } from './profile.ts'
import {
  getStartingTierIndex,
  getTierId,
  TIERS,
  type AnyTierId,
} from './tiers.ts'
import type { TopicId } from './topics.ts'
import { TOPICS } from './topics.ts'

export type TopicProgress = {
  tierIndex: number
  correctStreak: number
  incorrectStreak: number
}

export type TopicProgressMap = Record<TopicId, TopicProgress>

export type DifficultyEvent = 'tier-up' | 'tier-down' | 'none'

export type AnswerResult = {
  progress: TopicProgress
  event: DifficultyEvent
  tierId: AnyTierId
}

export function createInitialTopicProgress(grade: Grade): TopicProgressMap {
  return Object.fromEntries(
    TOPICS.map((topic) => [
      topic,
      {
        tierIndex: getStartingTierIndex(topic, grade),
        correctStreak: 0,
        incorrectStreak: 0,
      },
    ]),
  ) as TopicProgressMap
}

export function getTopicTierId(topic: TopicId, progress: TopicProgress): AnyTierId {
  return getTierId(topic, progress.tierIndex)
}

/**
 * Rule-based difficulty:
 * - 3 correct in a row → up one tier (reset streaks)
 * - 2 incorrect in a row → down one tier, never below grade floor (reset streaks)
 */
export function applyAnswerResult(
  topic: TopicId,
  progress: TopicProgress,
  grade: Grade,
  correct: boolean,
): AnswerResult {
  const floor = getStartingTierIndex(topic, grade)
  const maxIndex = TIERS[topic].length - 1
  let { tierIndex, correctStreak, incorrectStreak } = progress
  let event: DifficultyEvent = 'none'

  if (correct) {
    incorrectStreak = 0
    correctStreak += 1
    if (correctStreak >= 3 && tierIndex < maxIndex) {
      tierIndex += 1
      correctStreak = 0
      event = 'tier-up'
    } else if (correctStreak >= 3) {
      // Already at top — keep streak from runaway growth
      correctStreak = 0
    }
  } else {
    correctStreak = 0
    incorrectStreak += 1
    if (incorrectStreak >= 2 && tierIndex > floor) {
      tierIndex -= 1
      incorrectStreak = 0
      event = 'tier-down'
    } else if (incorrectStreak >= 2) {
      incorrectStreak = 0
    }
  }

  const next: TopicProgress = { tierIndex, correctStreak, incorrectStreak }
  return {
    progress: next,
    event,
    tierId: getTierId(topic, tierIndex),
  }
}
