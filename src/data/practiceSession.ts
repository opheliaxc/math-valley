/**
 * Practice session integration — Phase 2.
 * Uses curriculum map + student progress + Question Generator (call-only).
 * Content selection uses contentLevel (not Profile.grade).
 */
import { generateQuestion } from '../../question-generator/src/engine.ts'
import type { GeneratedQuestion } from '../../question-generator/src/types.ts'
import { TOPIC_UNLOCK_ORDER } from './curriculum-map.ts'
import { advanceContentLevelIfNeeded } from './contentLevelAdvance.ts'
import type { Grade } from './profile.ts'
import { SESSION_LENGTH } from './session.ts'
import {
  advanceActiveStandardIfNeeded,
  recordAttempt,
  type MasteryDifficulty,
  type StudentProgress,
  type TopicProgress,
} from './studentProgress.ts'
import { applyTopicUnlocksIfNeeded } from './topicUnlock.ts'
import { createTopicProgress } from './topicProgressInit.ts'
import type { TopicId } from './topics.ts'

export { createTopicProgress }

export { SESSION_LENGTH }

export type QuestionTarget = {
  /** Generator grade param = active contentLevel band. */
  grade: Grade
  standard: string
  difficulty: MasteryDifficulty
}

export function createInitialStudentProgress(
  profileId: string,
  contentLevel: Grade,
): StudentProgress {
  const topics: Record<string, TopicProgress> = {}
  for (const topicId of TOPIC_UNLOCK_ORDER) {
    topics[topicId] = createTopicProgress(topicId, contentLevel)
  }
  return {
    profileId,
    contentLevel,
    topics,
    standards: {},
    missedQuestions: [],
  }
}

/** Ensure a TopicProgress row exists for this topic (locked/unlocked per unlock order). */
export function ensureTopicProgress(
  progress: StudentProgress,
  topicId: TopicId,
): StudentProgress {
  if (progress.topics[topicId]) return progress
  return {
    ...progress,
    topics: {
      ...progress.topics,
      [topicId]: createTopicProgress(topicId, progress.contentLevel),
    },
  }
}

/**
 * Which standard + difficulty to serve next for this topic.
 * Beginner until that difficulty is mastered; then advanced.
 */
export function resolveQuestionTarget(
  progress: StudentProgress,
  topicId: TopicId,
): QuestionTarget {
  const withTopic = ensureTopicProgress(progress, topicId)
  const topic = withTopic.topics[topicId]
  if (!topic) {
    throw new Error(`Missing topic progress for "${topicId}"`)
  }
  if (topic.status === 'locked') {
    throw new Error(`Topic "${topicId}" is locked`)
  }
  if (topic.standardOrder.length === 0) {
    throw new Error(
      `Topic "${topicId}" has no standards at content level ${withTopic.contentLevel}`,
    )
  }

  const standard = topic.standardOrder[topic.activeStandardIndex]
  if (!standard) {
    throw new Error(
      `Invalid activeStandardIndex ${topic.activeStandardIndex} for "${topicId}"`,
    )
  }

  const standardProgress = withTopic.standards[standard]
  const difficulty: MasteryDifficulty =
    standardProgress?.beginner.mastered ? 'advanced' : 'beginner'

  return {
    grade: withTopic.contentLevel,
    standard,
    difficulty,
  }
}

/**
 * Short map label for an unlocked zone: which standard + difficulty is next,
 * or "Mastered" when the topic is done at this content level.
 */
export function describeTopicProgress(
  progress: StudentProgress,
  topicId: TopicId,
): string {
  const topic = progress.topics[topicId]
  if (!topic || topic.status === 'locked') return 'Locked'
  if (topic.status === 'mastered' || topic.standardOrder.length === 0) {
    return 'Mastered'
  }
  try {
    const target = resolveQuestionTarget(progress, topicId)
    const step = topic.activeStandardIndex + 1
    const total = topic.standardOrder.length
    return `${target.standard} · ${target.difficulty} (${step}/${total})`
  } catch {
    return 'Ready to practice'
  }
}

/** Compare a student's submitted text to a generator question. */
export function checkGeneratedAnswer(
  question: GeneratedQuestion,
  submitted: string,
): boolean {
  const given = submitted.trim().toLowerCase()
  const expected = question.correctAnswer.trim().toLowerCase()
  if (given.length === 0) return false
  if (given === expected) return true

  const givenNum = Number(submitted.trim())
  const expectedNum = Number(question.correctAnswer.trim())
  return (
    Number.isFinite(givenNum) &&
    Number.isFinite(expectedNum) &&
    givenNum === expectedNum
  )
}

/** Generate one question for whatever standard/difficulty is currently active. */
export function generateSessionQuestion(
  progress: StudentProgress,
  topicId: TopicId,
): GeneratedQuestion {
  const target = resolveQuestionTarget(progress, topicId)
  return generateQuestion({
    grade: target.grade,
    standard: target.standard,
    difficulty: target.difficulty,
  })
}

/**
 * Record the answer, advance the active standard if needed, unlock the next
 * topic if this one is mastered, then bump contentLevel if every zone at this
 * level is mastered (Phase 4).
 */
export type SessionAnswerResult = {
  progress: StudentProgress
  newlyMasteredTopicId: TopicId | null
  newlyUnlockedTopicId: TopicId | null
  contentLevelAdvanced: boolean
  previousContentLevel: Grade
  contentLevel: Grade
}

export function applySessionAnswer(
  progress: StudentProgress,
  topicId: TopicId,
  question: GeneratedQuestion,
  correct: boolean,
): SessionAnswerResult {
  const afterAttempt = recordAttempt(
    progress,
    question.standard,
    question.difficulty,
    correct,
    question.id,
    question.prompt,
  )
  const afterAdvance = advanceActiveStandardIfNeeded(afterAttempt, topicId)
  const unlock = applyTopicUnlocksIfNeeded(afterAdvance, topicId)
  const level = advanceContentLevelIfNeeded(unlock.progress)
  return {
    progress: level.progress,
    newlyMasteredTopicId: unlock.newlyMasteredTopicId,
    newlyUnlockedTopicId: level.advanced ? null : unlock.newlyUnlockedTopicId,
    contentLevelAdvanced: level.advanced,
    previousContentLevel: level.previousContentLevel,
    contentLevel: level.contentLevel,
  }
}
