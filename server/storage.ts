/**
 * Math Valley storage types, validation, and shared errors.
 * Persistence is SQLite via `server/storage/sqlite-store.ts`.
 * JSON import/export scripts still reuse `validateMathValleyData`.
 */

export const SCHEMA_VERSION = 1

/** Shared copy for duplicate grade+avatar+name (case-insensitive). */
export const DUPLICATE_PROFILE_MESSAGE =
  'That name is taken for this avatar. Try another avatar or add a letter.'

export type StorageErrorCode =
  | 'MALFORMED_JSON'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'FILESYSTEM'
  | 'WRITE_FAILED'

export class StorageError extends Error {
  readonly code: StorageErrorCode
  readonly cause: unknown

  constructor(code: StorageErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'StorageError'
    this.code = code
    this.cause = cause
  }
}

export type StudentProfile = {
  name: string
  grade: 1 | 2 | 3 | 4
  avatarId: string
}

/** Progress blob — mirrors app PlayerState fields (without nested profile). */
export type PlayerProgress = {
  topicProgress: unknown
  studentProgress: unknown
  contentLevel: 1 | 2 | 3 | 4
  xp: number
  zoneXp: unknown
  unlockedZones: unknown
}

export type SessionAnswerRecord = {
  submitted: string
  correct: boolean
  answeredAt: string
}

export type ActiveSession = {
  id: string
  status: 'in_progress'
  topicId: string
  startedAt: string
  updatedAt: string
  questionIndex: number
  correctCount: number
  phase: 'question' | 'feedback' | 'summary'
  activeTopicId: string
  sessionUnlockId: string | null
  contentLevelAdvanced: boolean
  answers: SessionAnswerRecord[]
  /** Snapshot of only the current question; null if not needed. */
  currentQuestion: unknown | null
}

export type SessionHistoryEntry = {
  id: string
  topicId: string
  startedAt: string
  completedAt: string
  total: number
  correctCount: number
  xpEarned: number
}

export type StudentRecord = {
  id: string
  createdAt: string
  updatedAt: string
  profile: StudentProfile
  player: PlayerProgress
  sessionHistory: SessionHistoryEntry[]
  activeSession: ActiveSession | null
}

export type MathValleyData = {
  schemaVersion: number
  students: Record<string, StudentRecord>
  meta: {
    activeStudentIdByDefault: string | null
  }
}

function isGrade(value: unknown): value is 1 | 2 | 3 | 4 {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export function validateProfile(value: unknown, path: string): StudentProfile {
  if (!value || typeof value !== 'object') {
    throw new StorageError('VALIDATION', `${path} must be an object`)
  }
  const p = value as Record<string, unknown>
  if (!isNonEmptyString(p.name)) {
    throw new StorageError('VALIDATION', `${path}.name must be a non-empty string`)
  }
  if (!isGrade(p.grade)) {
    throw new StorageError('VALIDATION', `${path}.grade must be 1, 2, 3, or 4`)
  }
  if (!isNonEmptyString(p.avatarId)) {
    throw new StorageError('VALIDATION', `${path}.avatarId must be a non-empty string`)
  }
  return {
    name: p.name.trim(),
    grade: p.grade,
    avatarId: p.avatarId,
  }
}

export function validatePlayer(value: unknown, path: string): PlayerProgress {
  if (!value || typeof value !== 'object') {
    throw new StorageError('VALIDATION', `${path} must be an object`)
  }
  const p = value as Record<string, unknown>
  if (!isGrade(p.contentLevel)) {
    throw new StorageError(
      'VALIDATION',
      `${path}.contentLevel must be 1, 2, 3, or 4`,
    )
  }
  if (typeof p.xp !== 'number' || !Number.isFinite(p.xp) || p.xp < 0) {
    throw new StorageError('VALIDATION', `${path}.xp must be a non-negative number`)
  }
  if (p.topicProgress === undefined || p.topicProgress === null) {
    throw new StorageError('VALIDATION', `${path}.topicProgress is required`)
  }
  if (p.studentProgress === undefined || p.studentProgress === null) {
    throw new StorageError('VALIDATION', `${path}.studentProgress is required`)
  }
  if (p.zoneXp === undefined || p.zoneXp === null) {
    throw new StorageError('VALIDATION', `${path}.zoneXp is required`)
  }
  if (p.unlockedZones === undefined || p.unlockedZones === null) {
    throw new StorageError('VALIDATION', `${path}.unlockedZones is required`)
  }
  return {
    topicProgress: p.topicProgress,
    studentProgress: p.studentProgress,
    contentLevel: p.contentLevel,
    xp: p.xp,
    zoneXp: p.zoneXp,
    unlockedZones: p.unlockedZones,
  }
}

function validateAnswers(
  value: unknown,
  path: string,
): SessionAnswerRecord[] {
  if (!Array.isArray(value)) {
    throw new StorageError('VALIDATION', `${path} must be an array`)
  }
  return value.map((entry, i) => {
    if (!entry || typeof entry !== 'object') {
      throw new StorageError('VALIDATION', `${path}[${i}] must be an object`)
    }
    const a = entry as Record<string, unknown>
    if (typeof a.submitted !== 'string') {
      throw new StorageError(
        'VALIDATION',
        `${path}[${i}].submitted must be a string`,
      )
    }
    if (typeof a.correct !== 'boolean') {
      throw new StorageError(
        'VALIDATION',
        `${path}[${i}].correct must be a boolean`,
      )
    }
    if (!isIsoTimestamp(a.answeredAt)) {
      throw new StorageError(
        'VALIDATION',
        `${path}[${i}].answeredAt must be an ISO timestamp`,
      )
    }
    return {
      submitted: a.submitted,
      correct: a.correct,
      answeredAt: a.answeredAt,
    }
  })
}

export function validateActiveSession(
  value: unknown,
  path: string,
): ActiveSession | null {
  if (value === null) return null
  if (!value || typeof value !== 'object') {
    throw new StorageError('VALIDATION', `${path} must be an object or null`)
  }
  const s = value as Record<string, unknown>
  if (!isNonEmptyString(s.id)) {
    throw new StorageError('VALIDATION', `${path}.id must be a non-empty string`)
  }
  if (s.status !== 'in_progress') {
    throw new StorageError(
      'VALIDATION',
      `${path}.status must be "in_progress"`,
    )
  }
  if (!isNonEmptyString(s.topicId)) {
    throw new StorageError('VALIDATION', `${path}.topicId must be a non-empty string`)
  }
  if (!isIsoTimestamp(s.startedAt) || !isIsoTimestamp(s.updatedAt)) {
    throw new StorageError(
      'VALIDATION',
      `${path}.startedAt and updatedAt must be ISO timestamps`,
    )
  }
  if (
    typeof s.questionIndex !== 'number' ||
    !Number.isInteger(s.questionIndex) ||
    s.questionIndex < 0
  ) {
    throw new StorageError(
      'VALIDATION',
      `${path}.questionIndex must be a non-negative integer`,
    )
  }
  if (
    typeof s.correctCount !== 'number' ||
    !Number.isInteger(s.correctCount) ||
    s.correctCount < 0
  ) {
    throw new StorageError(
      'VALIDATION',
      `${path}.correctCount must be a non-negative integer`,
    )
  }
  if (
    s.phase !== 'question' &&
    s.phase !== 'feedback' &&
    s.phase !== 'summary'
  ) {
    throw new StorageError(
      'VALIDATION',
      `${path}.phase must be question, feedback, or summary`,
    )
  }
  if (!isNonEmptyString(s.activeTopicId)) {
    throw new StorageError(
      'VALIDATION',
      `${path}.activeTopicId must be a non-empty string`,
    )
  }
  if (s.sessionUnlockId !== null && typeof s.sessionUnlockId !== 'string') {
    throw new StorageError(
      'VALIDATION',
      `${path}.sessionUnlockId must be a string or null`,
    )
  }
  if (typeof s.contentLevelAdvanced !== 'boolean') {
    throw new StorageError(
      'VALIDATION',
      `${path}.contentLevelAdvanced must be a boolean`,
    )
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
    sessionUnlockId: s.sessionUnlockId as string | null,
    contentLevelAdvanced: s.contentLevelAdvanced,
    answers: validateAnswers(s.answers, `${path}.answers`),
    currentQuestion: s.currentQuestion ?? null,
  }
}

export function validateSessionHistory(
  value: unknown,
  path: string,
): SessionHistoryEntry[] {
  if (!Array.isArray(value)) {
    throw new StorageError('VALIDATION', `${path} must be an array`)
  }
  return value.map((entry, i) => {
    if (!entry || typeof entry !== 'object') {
      throw new StorageError('VALIDATION', `${path}[${i}] must be an object`)
    }
    const h = entry as Record<string, unknown>
    if (!isNonEmptyString(h.id) || !isNonEmptyString(h.topicId)) {
      throw new StorageError(
        'VALIDATION',
        `${path}[${i}] needs id and topicId strings`,
      )
    }
    if (!isIsoTimestamp(h.startedAt) || !isIsoTimestamp(h.completedAt)) {
      throw new StorageError(
        'VALIDATION',
        `${path}[${i}] needs valid startedAt and completedAt`,
      )
    }
    for (const key of ['total', 'correctCount', 'xpEarned'] as const) {
      if (typeof h[key] !== 'number' || !Number.isFinite(h[key]) || h[key] < 0) {
        throw new StorageError(
          'VALIDATION',
          `${path}[${i}].${key} must be a non-negative number`,
        )
      }
    }
    return {
      id: h.id,
      topicId: h.topicId,
      startedAt: h.startedAt,
      completedAt: h.completedAt,
      total: h.total as number,
      correctCount: h.correctCount as number,
      xpEarned: h.xpEarned as number,
    }
  })
}

function validateStudent(value: unknown, path: string): StudentRecord {
  if (!value || typeof value !== 'object') {
    throw new StorageError('VALIDATION', `${path} must be an object`)
  }
  const s = value as Record<string, unknown>
  if (!isNonEmptyString(s.id)) {
    throw new StorageError('VALIDATION', `${path}.id must be a non-empty string`)
  }
  if (!isIsoTimestamp(s.createdAt) || !isIsoTimestamp(s.updatedAt)) {
    throw new StorageError(
      'VALIDATION',
      `${path}.createdAt and updatedAt must be ISO timestamps`,
    )
  }
  return {
    id: s.id,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    profile: validateProfile(s.profile, `${path}.profile`),
    player: validatePlayer(s.player, `${path}.player`),
    sessionHistory: validateSessionHistory(
      s.sessionHistory ?? [],
      `${path}.sessionHistory`,
    ),
    activeSession: validateActiveSession(
      s.activeSession ?? null,
      `${path}.activeSession`,
    ),
  }
}

/** Validate and normalize a full data document. Throws StorageError on failure. */
export function validateMathValleyData(value: unknown): MathValleyData {
  if (!value || typeof value !== 'object') {
    throw new StorageError('VALIDATION', 'Root data must be an object')
  }
  const root = value as Record<string, unknown>

  if (typeof root.schemaVersion !== 'number' || !Number.isInteger(root.schemaVersion)) {
    throw new StorageError('VALIDATION', 'schemaVersion must be an integer')
  }
  if (root.schemaVersion !== SCHEMA_VERSION) {
    throw new StorageError(
      'VALIDATION',
      `Unsupported schemaVersion ${root.schemaVersion} (expected ${SCHEMA_VERSION}). Original file was not modified.`,
    )
  }

  if (!root.students || typeof root.students !== 'object' || Array.isArray(root.students)) {
    throw new StorageError('VALIDATION', 'students must be an object map')
  }

  const students: Record<string, StudentRecord> = {}
  for (const [key, student] of Object.entries(
    root.students as Record<string, unknown>,
  )) {
    const validated = validateStudent(student, `students.${key}`)
    if (validated.id !== key) {
      throw new StorageError(
        'VALIDATION',
        `students.${key}: map key must match student.id ("${validated.id}")`,
      )
    }
    students[key] = validated
  }

  // Match SQLite uq_students_grade_avatar_name (case-insensitive name).
  const profileKeys = new Map<string, string>()
  for (const student of Object.values(students)) {
    const key = [
      student.profile.grade,
      student.profile.avatarId,
      student.profile.name.trim().toLowerCase(),
    ].join('|')
    const existingId = profileKeys.get(key)
    if (existingId) {
      throw new StorageError(
        'CONFLICT',
        DUPLICATE_PROFILE_MESSAGE,
      )
    }
    profileKeys.set(key, student.id)
  }

  let activeStudentIdByDefault: string | null = null
  if (root.meta !== undefined && root.meta !== null) {
    if (typeof root.meta !== 'object' || Array.isArray(root.meta)) {
      throw new StorageError('VALIDATION', 'meta must be an object')
    }
    const meta = root.meta as Record<string, unknown>
    const active = meta.activeStudentIdByDefault
    if (active !== null && active !== undefined) {
      if (typeof active !== 'string' || !(active in students)) {
        throw new StorageError(
          'VALIDATION',
          'meta.activeStudentIdByDefault must be null or an existing student id',
        )
      }
      activeStudentIdByDefault = active
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    students,
    meta: { activeStudentIdByDefault },
  }
}

export type MathValleyStorage = {
  /** Database path (SQLite) — kept as `dataFilePath` for the storage interface. */
  dataFilePath: string
  ensureDataFile: () => Promise<MathValleyData>
  loadData: () => Promise<MathValleyData>
  saveData: (data: MathValleyData) => Promise<void>
  /** Load → mutate → validate → save (SQLite transaction in the adapter). */
  updateData: (
    mutator: (data: MathValleyData) => MathValleyData,
  ) => Promise<MathValleyData>
}
