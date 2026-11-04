/**
 * Active quiz session helpers — save/restore without storing a full question bank.
 */
import type { GeneratedQuestion } from '../../question-generator/src/types.ts'
import { TOPICS, type TopicId } from './topics.ts'

export type SessionPhase = 'question' | 'feedback' | 'summary'

export type SessionAnswerRecord = {
  submitted: string
  correct: boolean
  answeredAt: string
}

export type ActiveSessionState = {
  id: string
  status: 'in_progress'
  topicId: TopicId
  startedAt: string
  updatedAt: string
  questionIndex: number
  correctCount: number
  phase: SessionPhase
  activeTopicId: TopicId
  sessionUnlockId: TopicId | null
  contentLevelAdvanced: boolean
  answers: SessionAnswerRecord[]
  currentQuestion: GeneratedQuestion | null
}

function isTopicId(value: unknown): value is TopicId {
  return typeof value === 'string' && (TOPICS as readonly string[]).includes(value)
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

/** Lightweight check — enough to resume UI; generators produce richer objects. */
export function isGeneratedQuestion(value: unknown): value is GeneratedQuestion {
  if (!value || typeof value !== 'object') return false
  const q = value as Record<string, unknown>
  return (
    typeof q.id === 'string' &&
    typeof q.prompt === 'string' &&
    typeof q.correctAnswer === 'string' &&
    typeof q.standard === 'string' &&
    (q.difficulty === 'beginner' || q.difficulty === 'advanced') &&
    typeof q.type === 'string' &&
    typeof q.explanation === 'string'
  )
}

export function parseActiveSession(value: unknown): ActiveSessionState | null {
  if (!value || typeof value !== 'object') return null
  const s = value as Record<string, unknown>

  if (typeof s.id !== 'string' || !s.id.trim()) return null
  if (s.status !== 'in_progress') return null
  if (!isTopicId(s.topicId) || !isTopicId(s.activeTopicId)) return null
  if (!isIsoTimestamp(s.startedAt) || !isIsoTimestamp(s.updatedAt)) return null
  if (
    typeof s.questionIndex !== 'number' ||
    !Number.isInteger(s.questionIndex) ||
    s.questionIndex < 0
  ) {
    return null
  }
  if (
    typeof s.correctCount !== 'number' ||
    !Number.isInteger(s.correctCount) ||
    s.correctCount < 0
  ) {
    return null
  }
  if (
    s.phase !== 'question' &&
    s.phase !== 'feedback' &&
    s.phase !== 'summary'
  ) {
    return null
  }
  if (s.sessionUnlockId !== null && !isTopicId(s.sessionUnlockId)) return null
  if (typeof s.contentLevelAdvanced !== 'boolean') return null
  if (!Array.isArray(s.answers)) return null

  const answers: SessionAnswerRecord[] = []
  for (const entry of s.answers) {
    if (!entry || typeof entry !== 'object') return null
    const a = entry as Record<string, unknown>
    if (typeof a.submitted !== 'string') return null
    if (typeof a.correct !== 'boolean') return null
    if (!isIsoTimestamp(a.answeredAt)) return null
    answers.push({
      submitted: a.submitted,
      correct: a.correct,
      answeredAt: a.answeredAt,
    })
  }

  const currentQuestion =
    s.currentQuestion === null || s.currentQuestion === undefined
      ? null
      : isGeneratedQuestion(s.currentQuestion)
        ? s.currentQuestion
        : null

  // Feedback/question resume needs a usable current question snapshot.
  if (
    (s.phase === 'question' || s.phase === 'feedback') &&
    !currentQuestion
  ) {
    return null
  }

  return {
    id: s.id,
    status: 'in_progress',
    topicId: s.topicId,
    startedAt: s.startedAt,
    updatedAt: s.updatedAt,
    questionIndex: s.questionIndex,
    correctCount: s.correctCount,
    phase: s.phase,
    activeTopicId: s.activeTopicId,
    sessionUnlockId: s.sessionUnlockId,
    contentLevelAdvanced: s.contentLevelAdvanced,
    answers,
    currentQuestion,
  }
}

export function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `sess_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`
  }
  return `sess_${Date.now().toString(36)}`
}

export function toActiveSessionPayload(
  session: ActiveSessionState,
): ActiveSessionState {
  return {
    ...session,
    status: 'in_progress',
    updatedAt: new Date().toISOString(),
  }
}
