/**
 * Apply one practice answer to a student record (pure logic + in-memory update).
 * Persistence wraps this inside storage.updateData (one transaction).
 */
import { isGeneratedQuestion } from '../src/data/activeSession.ts'
import { getZoneTopicIdsForGrade } from '../src/data/curriculum-map.ts'
import type { TopicProgressMap } from '../src/data/difficulty.ts'
import { syncPlayerZonesFromMastery } from '../src/data/masteryWorldMap.ts'
import type { PlayerState } from '../src/data/playerState.ts'
import type { Profile } from '../src/data/profile.ts'
import {
  applySessionAnswer,
  checkGeneratedAnswer,
  type SessionAnswerResult,
} from '../src/data/practiceSession.ts'
import type { StudentProgress } from '../src/data/studentProgress.ts'
import { TOPICS, type TopicId } from '../src/data/topics.ts'
import type { ZoneId } from '../src/data/zones.ts'
import { StorageError, type StudentRecord } from './storage.ts'

function isTopicId(value: unknown): value is TopicId {
  return typeof value === 'string' && (TOPICS as readonly string[]).includes(value)
}

function nextTopicAfterAnswer(
  startedTopic: TopicId,
  contentLevelAdvanced: boolean,
  contentLevel: PlayerState['contentLevel'],
): TopicId {
  if (!contentLevelAdvanced) return startedTopic
  return getZoneTopicIdsForGrade(contentLevel)[0] ?? startedTopic
}

function toPlayerState(student: StudentRecord): PlayerState {
  return {
    profile: student.profile as Profile,
    topicProgress: student.player.topicProgress as TopicProgressMap,
    studentProgress: student.player.studentProgress as StudentProgress,
    contentLevel: student.player.contentLevel,
    xp: student.player.xp,
    zoneXp: student.player.zoneXp as PlayerState['zoneXp'],
    unlockedZones: student.player.unlockedZones as ZoneId[],
  }
}

export type SubmitAnswerInput = {
  submitted: string
  /** Defaults to activeSession.currentQuestion */
  question?: unknown
  /** Defaults to activeSession.activeTopicId */
  topicId?: string
}

export type SubmitAnswerOutcome = {
  student: StudentRecord
  correct: boolean
  result: SessionAnswerResult
}

/**
 * Mutate one student in memory for a submitted answer.
 * Caller must persist via storage.updateData.
 */
export function applySubmitAnswer(
  student: StudentRecord,
  input: SubmitAnswerInput,
): SubmitAnswerOutcome {
  const session = student.activeSession
  if (!session) {
    throw new StorageError(
      'VALIDATION',
      'No active session — start a session before submitting an answer',
    )
  }

  const questionRaw =
    input.question !== undefined ? input.question : session.currentQuestion
  if (!isGeneratedQuestion(questionRaw)) {
    throw new StorageError(
      'VALIDATION',
      'Active session has no usable currentQuestion to grade',
    )
  }

  const topicRaw = input.topicId ?? session.activeTopicId
  if (!isTopicId(topicRaw)) {
    throw new StorageError('VALIDATION', `Invalid topicId: ${String(topicRaw)}`)
  }

  const submitted =
    typeof input.submitted === 'string' ? input.submitted : String(input.submitted)
  const correct = checkGeneratedAnswer(questionRaw, submitted)
  const result = applySessionAnswer(
    student.player.studentProgress as StudentProgress,
    topicRaw,
    questionRaw,
    correct,
  )

  const followTopic = nextTopicAfterAnswer(
    topicRaw,
    result.contentLevelAdvanced,
    result.contentLevel,
  )

  const basePlayer: PlayerState = {
    ...toPlayerState(student),
    studentProgress: result.progress,
    contentLevel: result.contentLevel,
  }
  const synced = syncPlayerZonesFromMastery(basePlayer, result.progress)

  const now = new Date().toISOString()
  const nextCorrect = session.correctCount + (correct ? 1 : 0)
  const nextAnswers = [
    ...session.answers,
    { submitted, correct, answeredAt: now },
  ]
  const nextUnlock = result.newlyUnlockedTopicId ?? session.sessionUnlockId
  const nextLevelAdvanced =
    session.contentLevelAdvanced || result.contentLevelAdvanced

  const updated: StudentRecord = {
    ...student,
    player: {
      topicProgress: synced.player.topicProgress,
      studentProgress: synced.player.studentProgress,
      contentLevel: synced.player.contentLevel,
      xp: synced.player.xp,
      zoneXp: synced.player.zoneXp,
      unlockedZones: synced.player.unlockedZones,
    },
    activeSession: {
      ...session,
      questionIndex: session.questionIndex,
      correctCount: nextCorrect,
      phase: 'feedback',
      activeTopicId: followTopic,
      sessionUnlockId: nextUnlock,
      contentLevelAdvanced: nextLevelAdvanced,
      answers: nextAnswers,
      currentQuestion: questionRaw,
      updatedAt: now,
    },
    updatedAt: now,
  }

  return { student: updated, correct, result }
}
