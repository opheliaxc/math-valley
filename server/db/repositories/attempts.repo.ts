/**
 * Attempts repository — insert + rolling mastery window.
 */
import type { Kysely, Transaction } from 'kysely'
import type { DB, MasteryDifficulty } from '../schema-types.ts'

export type AttemptsDb = Kysely<DB> | Transaction<DB>

export type AttemptInsert = {
  studentId: string
  sessionId?: string | null
  standardCode: string
  difficulty: MasteryDifficulty
  questionId?: string | null
  questionType?: string
  givenAnswer?: string
  correctAnswer?: string
  isCorrect: boolean
  /** ISO-8601 UTC. Defaults to now. */
  createdAt?: string
}

export type AttemptWindowRow = {
  id: number
  is_correct: number
  question_id: string | null
  created_at: string
  given_answer: string
  correct_answer: string
  question_type: string
  session_id: string | null
}

const MASTERY_WINDOW = 10

/**
 * Insert one attempt. Autoincrement id preserves insert order.
 */
export async function insertAttempt(
  db: AttemptsDb,
  input: AttemptInsert,
): Promise<number> {
  const result = await db
    .insertInto('attempts')
    .values({
      student_id: input.studentId,
      session_id: input.sessionId ?? null,
      standard_code: input.standardCode,
      difficulty: input.difficulty,
      question_id: input.questionId ?? null,
      question_type: (input.questionType ?? '') as '' | 'multiple-choice' | 'true-false' | 'short-answer',
      given_answer: input.givenAnswer ?? '',
      correct_answer: input.correctAnswer ?? '',
      is_correct: input.isCorrect ? 1 : 0,
      created_at: input.createdAt ?? new Date().toISOString(),
    })
    .executeTakeFirstOrThrow()

  return Number(result.insertId)
}

/**
 * Last N attempts for (student, standard, difficulty), newest first.
 */
export async function recentWindow(
  db: AttemptsDb,
  studentId: string,
  standardCode: string,
  difficulty: MasteryDifficulty,
  limit: number = MASTERY_WINDOW,
): Promise<AttemptWindowRow[]> {
  return db
    .selectFrom('attempts')
    .select([
      'id',
      'is_correct',
      'question_id',
      'created_at',
      'given_answer',
      'correct_answer',
      'question_type',
      'session_id',
    ])
    .where('student_id', '=', studentId)
    .where('standard_code', '=', standardCode)
    .where('difficulty', '=', difficulty)
    .orderBy('id', 'desc')
    .limit(limit)
    .execute()
}

/** Delete all attempts for a student (used when replacing progress wholesale). */
export async function deleteAttemptsForStudent(
  db: AttemptsDb,
  studentId: string,
): Promise<void> {
  await db.deleteFrom('attempts').where('student_id', '=', studentId).execute()
}

/**
 * Insert many attempts in chronological order (oldest first) so ids match time order.
 */
export async function insertAttemptsInOrder(
  db: AttemptsDb,
  rows: AttemptInsert[],
): Promise<void> {
  for (const row of rows) {
    await insertAttempt(db, row)
  }
}
