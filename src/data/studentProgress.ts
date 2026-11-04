/**
 * Student mastery progress — Phase 1 of question-generator integration.
 *
 * Separate from the older difficulty-tier TopicProgress in ./difficulty.ts
 * (streaks / tierIndex). This model tracks per-standard attempt logs and
 * curriculum-order topic unlock state.
 */
import type { Grade } from './profile'
import type { TopicId } from './topics'

export type MasteryDifficulty = 'beginner' | 'advanced'

export type StandardStatus = 'locked' | 'active' | 'mastered'

export type TopicUnlockStatus = 'locked' | 'unlocked' | 'mastered'

export type AttemptLogEntry = {
  questionId: string
  correct: boolean
  timestamp: number
}

export type DifficultyProgress = {
  attempts: AttemptLogEntry[]
  mastered: boolean
}

export type StandardProgress = {
  standardCode: string
  beginner: DifficultyProgress
  advanced: DifficultyProgress
  status: StandardStatus
}

/**
 * Curriculum progress for one Math Valley topic at the student's content level.
 * Not the same as difficulty.ts TopicProgress (tier streaks).
 */
export type TopicProgress = {
  topicId: TopicId
  /** NYS content band this topic's standardOrder was loaded for (not school grade). */
  contentLevel: Grade
  /** From curriculum-map.ts for this topic + contentLevel */
  standardOrder: string[]
  /** Index into standardOrder — the standard the student is working on */
  activeStandardIndex: number
  status: TopicUnlockStatus
}

export type MissedQuestionEntry = {
  standardCode: string
  difficulty: MasteryDifficulty
  prompt: string
  timestamp: number
}

export type StudentProgress = {
  profileId: string
  /**
   * Which curriculum band (1–4) the student is practicing.
   * Distinct from Profile.grade (real-life school grade).
   */
  contentLevel: Grade
  topics: Record<string, TopicProgress>
  standards: Record<string, StandardProgress>
  missedQuestions: MissedQuestionEntry[]
}

/** Most-recent attempt window used for mastery (integration spec §2 / §3). */
export const MASTERY_WINDOW = 10

/** Correct answers needed inside the window to master a difficulty. */
export const MASTERY_THRESHOLD = 8

function emptyDifficultyProgress(): DifficultyProgress {
  return { attempts: [], mastered: false }
}

function createStandardProgress(standardCode: string): StandardProgress {
  return {
    standardCode,
    beginner: emptyDifficultyProgress(),
    advanced: emptyDifficultyProgress(),
    status: 'active',
  }
}

function isDifficultyMastered(attempts: AttemptLogEntry[]): boolean {
  if (attempts.length < MASTERY_THRESHOLD) return false
  const window = attempts.slice(-MASTERY_WINDOW)
  const correctCount = window.filter((a) => a.correct).length
  return correctCount >= MASTERY_THRESHOLD
}

/**
 * Append one attempt for a (standard, difficulty). Keeps only the most recent
 * MASTERY_WINDOW attempts, recalculates that difficulty's `mastered` flag, and
 * logs to missedQuestions when incorrect (prompt required for the review log).
 */
export function recordAttempt(
  progress: StudentProgress,
  standardCode: string,
  difficulty: MasteryDifficulty,
  correct: boolean,
  questionId: string,
  prompt: string,
): StudentProgress {
  const timestamp = Date.now()
  const existing =
    progress.standards[standardCode] ?? createStandardProgress(standardCode)
  const prior = existing[difficulty]
  const entry: AttemptLogEntry = { questionId, correct, timestamp }
  const attempts = [...prior.attempts, entry].slice(-MASTERY_WINDOW)
  const mastered = isDifficultyMastered(attempts)

  const updatedStandard: StandardProgress = {
    ...existing,
    [difficulty]: { attempts, mastered },
  }

  const standards = {
    ...progress.standards,
    [standardCode]: updatedStandard,
  }

  const missedQuestions = correct
    ? progress.missedQuestions
    : [
        ...progress.missedQuestions,
        { standardCode, difficulty, prompt, timestamp },
      ]

  return {
    ...progress,
    standards,
    missedQuestions,
  }
}

/** True when both beginner and advanced are mastered for that standard. */
export function isStandardMastered(
  progress: StudentProgress,
  standardCode: string,
): boolean {
  const standard = progress.standards[standardCode]
  if (!standard) return false
  return standard.beginner.mastered && standard.advanced.mastered
}

/**
 * True when every standard in that topic's current-grade standardOrder
 * is mastered (both difficulties each).
 */
export function isTopicMastered(
  progress: StudentProgress,
  topicId: string,
): boolean {
  const topic = progress.topics[topicId]
  if (!topic || topic.standardOrder.length === 0) return false
  return topic.standardOrder.every((code) => isStandardMastered(progress, code))
}

/**
 * If the topic's current active standard is fully mastered, move
 * activeStandardIndex to the next standard in standardOrder.
 * No-op if there is no next standard (or the topic/standard isn't ready).
 */
export function advanceActiveStandardIfNeeded(
  progress: StudentProgress,
  topicId: string,
): StudentProgress {
  const topic = progress.topics[topicId]
  if (!topic) return progress

  const { standardOrder, activeStandardIndex } = topic
  const currentCode = standardOrder[activeStandardIndex]
  if (!currentCode) return progress
  if (!isStandardMastered(progress, currentCode)) return progress

  const nextIndex = activeStandardIndex + 1
  if (nextIndex >= standardOrder.length) return progress

  return {
    ...progress,
    topics: {
      ...progress.topics,
      [topicId]: {
        ...topic,
        activeStandardIndex: nextIndex,
      },
    },
  }
}
