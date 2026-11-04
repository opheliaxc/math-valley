/**
 * Hand-written Kysely DB types matching server/db/migrations/001_init.sql.
 * Keep in sync by hand; Phase 4 tests compare against PRAGMA table_info.
 */
import type { Generated } from 'kysely'

/** ISO-8601 UTC timestamps stored as TEXT. */
export type IsoTimestamp = string

export type GradeLevel = 1 | 2 | 3 | 4

export type TopicUnlockStatus = 'locked' | 'unlocked' | 'mastered'
export type StandardStatus = 'locked' | 'active' | 'mastered'
export type MasteryDifficulty = 'beginner' | 'advanced'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'
export type SessionPhase = 'question' | 'feedback' | 'summary'
export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | ''

export type AppMetaTable = {
  key: string
  value: string
}

export type StudentsTable = {
  id: string
  name: string
  grade: GradeLevel
  avatar_id: string
  content_level: GradeLevel
  xp: number
  created_at: IsoTimestamp
  updated_at: IsoTimestamp
}

export type TopicTierProgressTable = {
  student_id: string
  topic_id: string
  tier_index: number
  correct_streak: number
  incorrect_streak: number
}

export type ZoneXpTable = {
  student_id: string
  topic_id: string
  xp: number
}

export type UnlockedZonesTable = {
  student_id: string
  zone_id: string
}

export type TopicProgressTable = {
  student_id: string
  topic_id: string
  content_level: GradeLevel
  standard_order_json: string
  active_standard_index: number
  status: TopicUnlockStatus
  updated_at: IsoTimestamp
}

export type StandardMetaTable = {
  student_id: string
  standard_code: string
  status: StandardStatus
  updated_at: IsoTimestamp
}

export type StandardProgressTable = {
  student_id: string
  standard_code: string
  difficulty: MasteryDifficulty
  mastered: number
  mastered_at: IsoTimestamp | null
  updated_at: IsoTimestamp
}

export type SessionsTable = {
  id: string
  student_id: string
  topic_id: string
  status: SessionStatus
  question_index: number
  total_questions: number | null
  correct_count: number
  xp_earned: number | null
  phase: SessionPhase | null
  active_topic_id: string | null
  session_unlock_id: string | null
  content_level_advanced: number
  current_question_json: string | null
  started_at: IsoTimestamp
  updated_at: IsoTimestamp | null
  completed_at: IsoTimestamp | null
}

export type SessionAnswersTable = {
  session_id: string
  position: number
  submitted: string
  is_correct: number
  answered_at: IsoTimestamp
}

export type AttemptsTable = {
  id: Generated<number>
  student_id: string
  session_id: string | null
  standard_code: string
  difficulty: MasteryDifficulty
  question_id: string | null
  question_type: QuestionType
  given_answer: string
  correct_answer: string
  is_correct: number
  created_at: IsoTimestamp
}

export type MissedQuestionsTable = {
  id: Generated<number>
  student_id: string
  standard_code: string
  difficulty: MasteryDifficulty
  prompt: string
  created_at: IsoTimestamp
}

/** Full database schema for Kysely. */
export type DB = {
  app_meta: AppMetaTable
  students: StudentsTable
  topic_tier_progress: TopicTierProgressTable
  zone_xp: ZoneXpTable
  unlocked_zones: UnlockedZonesTable
  topic_progress: TopicProgressTable
  standard_meta: StandardMetaTable
  standard_progress: StandardProgressTable
  sessions: SessionsTable
  session_answers: SessionAnswersTable
  attempts: AttemptsTable
  missed_questions: MissedQuestionsTable
}

/**
 * Column lists mirroring the table types above.
 * Contract tests compare these to PRAGMA table_info (ignore order).
 */
export const SCHEMA_COLUMNS: Record<keyof DB, readonly string[]> = {
  app_meta: ['key', 'value'],
  students: [
    'id',
    'name',
    'grade',
    'avatar_id',
    'content_level',
    'xp',
    'created_at',
    'updated_at',
  ],
  topic_tier_progress: [
    'student_id',
    'topic_id',
    'tier_index',
    'correct_streak',
    'incorrect_streak',
  ],
  zone_xp: ['student_id', 'topic_id', 'xp'],
  unlocked_zones: ['student_id', 'zone_id'],
  topic_progress: [
    'student_id',
    'topic_id',
    'content_level',
    'standard_order_json',
    'active_standard_index',
    'status',
    'updated_at',
  ],
  standard_meta: ['student_id', 'standard_code', 'status', 'updated_at'],
  standard_progress: [
    'student_id',
    'standard_code',
    'difficulty',
    'mastered',
    'mastered_at',
    'updated_at',
  ],
  sessions: [
    'id',
    'student_id',
    'topic_id',
    'status',
    'question_index',
    'total_questions',
    'correct_count',
    'xp_earned',
    'phase',
    'active_topic_id',
    'session_unlock_id',
    'content_level_advanced',
    'current_question_json',
    'started_at',
    'updated_at',
    'completed_at',
  ],
  session_answers: [
    'session_id',
    'position',
    'submitted',
    'is_correct',
    'answered_at',
  ],
  attempts: [
    'id',
    'student_id',
    'session_id',
    'standard_code',
    'difficulty',
    'question_id',
    'question_type',
    'given_answer',
    'correct_answer',
    'is_correct',
    'created_at',
  ],
  missed_questions: [
    'id',
    'student_id',
    'standard_code',
    'difficulty',
    'prompt',
    'created_at',
  ],
}
