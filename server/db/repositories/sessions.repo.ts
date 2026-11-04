/**
 * Sessions repository — active session (with current question snapshot + answers)
 * and completed session history. No multi-row session_questions table.
 */
import type { Kysely, Transaction } from 'kysely'
import type { DB, SessionPhase } from '../schema-types.ts'

export type SessionsDb = Kysely<DB> | Transaction<DB>

export type SessionAnswerBlob = {
  submitted: string
  correct: boolean
  answeredAt: string
}

export type ActiveSessionBlob = {
  id: string
  status: 'in_progress'
  topicId: string
  startedAt: string
  updatedAt: string
  questionIndex: number
  correctCount: number
  phase: SessionPhase
  activeTopicId: string
  sessionUnlockId: string | null
  contentLevelAdvanced: boolean
  answers: SessionAnswerBlob[]
  currentQuestion: unknown | null
}

export type SessionHistoryBlob = {
  id: string
  topicId: string
  startedAt: string
  completedAt: string
  total: number
  correctCount: number
  xpEarned: number
}

async function deleteSessionAnswers(
  db: SessionsDb,
  sessionId: string,
): Promise<void> {
  await db
    .deleteFrom('session_answers')
    .where('session_id', '=', sessionId)
    .execute()
}

async function writeSessionAnswers(
  db: SessionsDb,
  sessionId: string,
  answers: SessionAnswerBlob[],
): Promise<void> {
  await deleteSessionAnswers(db, sessionId)
  for (let i = 0; i < answers.length; i += 1) {
    const a = answers[i]
    await db
      .insertInto('session_answers')
      .values({
        session_id: sessionId,
        position: i,
        submitted: a.submitted,
        is_correct: a.correct ? 1 : 0,
        answered_at: a.answeredAt,
      })
      .execute()
  }
}

async function loadSessionAnswers(
  db: SessionsDb,
  sessionId: string,
): Promise<SessionAnswerBlob[]> {
  const rows = await db
    .selectFrom('session_answers')
    .selectAll()
    .where('session_id', '=', sessionId)
    .orderBy('position', 'asc')
    .execute()
  return rows.map((r) => ({
    submitted: r.submitted,
    correct: r.is_correct === 1,
    answeredAt: r.answered_at,
  }))
}

/** Remove the in-progress session for a student (and its answers). */
export async function clearActiveSession(
  db: SessionsDb,
  studentId: string,
): Promise<void> {
  const active = await db
    .selectFrom('sessions')
    .select('id')
    .where('student_id', '=', studentId)
    .where('status', '=', 'in_progress')
    .execute()
  for (const row of active) {
    await deleteSessionAnswers(db, row.id)
    await db.deleteFrom('sessions').where('id', '=', row.id).execute()
  }
}

/** Upsert the single in-progress session (replaces any previous one). */
export async function setActiveSession(
  db: SessionsDb,
  studentId: string,
  session: ActiveSessionBlob,
): Promise<void> {
  await clearActiveSession(db, studentId)

  let currentQuestionJson: string | null = null
  if (session.currentQuestion !== null && session.currentQuestion !== undefined) {
    currentQuestionJson = JSON.stringify(session.currentQuestion)
  }

  await db
    .insertInto('sessions')
    .values({
      id: session.id,
      student_id: studentId,
      topic_id: session.topicId,
      status: 'in_progress',
      question_index: session.questionIndex,
      total_questions: null,
      correct_count: session.correctCount,
      xp_earned: null,
      phase: session.phase,
      active_topic_id: session.activeTopicId,
      session_unlock_id: session.sessionUnlockId,
      content_level_advanced: session.contentLevelAdvanced ? 1 : 0,
      current_question_json: currentQuestionJson,
      started_at: session.startedAt,
      updated_at: session.updatedAt,
      completed_at: null,
    })
    .execute()

  await writeSessionAnswers(db, session.id, session.answers)
}

export async function getActiveSession(
  db: SessionsDb,
  studentId: string,
): Promise<ActiveSessionBlob | null> {
  const row = await db
    .selectFrom('sessions')
    .selectAll()
    .where('student_id', '=', studentId)
    .where('status', '=', 'in_progress')
    .executeTakeFirst()

  if (!row) return null
  if (
    row.phase !== 'question' &&
    row.phase !== 'feedback' &&
    row.phase !== 'summary'
  ) {
    return null
  }
  if (!row.active_topic_id || !row.updated_at) return null

  let currentQuestion: unknown | null = null
  if (row.current_question_json) {
    try {
      currentQuestion = JSON.parse(row.current_question_json)
    } catch {
      currentQuestion = null
    }
  }

  return {
    id: row.id,
    status: 'in_progress',
    topicId: row.topic_id,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    questionIndex: row.question_index,
    correctCount: row.correct_count,
    phase: row.phase,
    activeTopicId: row.active_topic_id,
    sessionUnlockId: row.session_unlock_id,
    contentLevelAdvanced: row.content_level_advanced === 1,
    answers: await loadSessionAnswers(db, row.id),
    currentQuestion,
  }
}

/** Replace completed-session history for a student. */
export async function replaceSessionHistory(
  db: SessionsDb,
  studentId: string,
  history: SessionHistoryBlob[],
): Promise<void> {
  const completed = await db
    .selectFrom('sessions')
    .select('id')
    .where('student_id', '=', studentId)
    .where('status', '=', 'completed')
    .execute()

  for (const row of completed) {
    await deleteSessionAnswers(db, row.id)
    await db.deleteFrom('sessions').where('id', '=', row.id).execute()
  }

  for (const entry of history) {
    await db
      .insertInto('sessions')
      .values({
        id: entry.id,
        student_id: studentId,
        topic_id: entry.topicId,
        status: 'completed',
        question_index: entry.total,
        total_questions: entry.total,
        correct_count: entry.correctCount,
        xp_earned: entry.xpEarned,
        phase: null,
        active_topic_id: null,
        session_unlock_id: null,
        content_level_advanced: 0,
        current_question_json: null,
        started_at: entry.startedAt,
        updated_at: entry.completedAt,
        completed_at: entry.completedAt,
      })
      .execute()
  }
}

export async function listSessionHistory(
  db: SessionsDb,
  studentId: string,
): Promise<SessionHistoryBlob[]> {
  const rows = await db
    .selectFrom('sessions')
    .selectAll()
    .where('student_id', '=', studentId)
    .where('status', '=', 'completed')
    .orderBy('completed_at', 'asc')
    .execute()

  return rows.map((row) => ({
    id: row.id,
    topicId: row.topic_id,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? row.started_at,
    total: row.total_questions ?? row.question_index,
    correctCount: row.correct_count,
    xpEarned: row.xp_earned ?? 0,
  }))
}

/** Write active session + full history for a student. */
export async function replaceStudentSessions(
  db: SessionsDb,
  studentId: string,
  activeSession: ActiveSessionBlob | null,
  history: SessionHistoryBlob[],
): Promise<void> {
  await clearActiveSession(db, studentId)
  await replaceSessionHistory(db, studentId, history)
  if (activeSession) {
    await setActiveSession(db, studentId, activeSession)
  }
}
