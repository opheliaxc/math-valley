/**
 * Students repository — create, lookup by grade/avatar/(name), update fields.
 */
import { randomUUID } from 'node:crypto'
import { sql, type Kysely, type Transaction } from 'kysely'
import { DUPLICATE_PROFILE_MESSAGE } from '../../storage.ts'
import type { DB, GradeLevel, StudentsTable } from '../schema-types.ts'

export type StudentsDb = Kysely<DB> | Transaction<DB>

export type StudentRow = StudentsTable

export type CreateStudentInput = {
  name: string
  grade: GradeLevel
  avatarId: string
  /** Defaults to grade when omitted. */
  contentLevel?: GradeLevel
  xp?: number
  id?: string
}

export type UpdateStudentFields = {
  grade?: GradeLevel
  contentLevel?: GradeLevel
  xp?: number
}

export class StudentConflictError extends Error {
  readonly code = 'CONFLICT' as const

  constructor(message: string) {
    super(message)
    this.name = 'StudentConflictError'
  }
}

export class StudentNotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const

  constructor(message: string) {
    super(message)
    this.name = 'StudentNotFoundError'
  }
}

function newStudentId(): string {
  return `stu_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function createStudent(
  db: StudentsDb,
  input: CreateStudentInput,
): Promise<StudentRow> {
  const name = input.name.trim()
  if (!name) {
    throw new Error('Student name must be a non-empty string')
  }

  const id = input.id ?? newStudentId()
  const contentLevel = input.contentLevel ?? input.grade
  const xp = input.xp ?? 0
  const now = nowIso()

  try {
    await db
      .insertInto('students')
      .values({
        id,
        name,
        grade: input.grade,
        avatar_id: input.avatarId,
        content_level: contentLevel,
        xp,
        created_at: now,
        updated_at: now,
      })
      .execute()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/UNIQUE|unique/i.test(message)) {
      throw new StudentConflictError(DUPLICATE_PROFILE_MESSAGE)
    }
    throw err
  }

  const row = await findStudentById(db, id)
  if (!row) {
    throw new Error(`Student insert succeeded but row missing: ${id}`)
  }
  return row
}

export async function findStudentById(
  db: StudentsDb,
  id: string,
): Promise<StudentRow | undefined> {
  return db
    .selectFrom('students')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}

/**
 * Profile picker lookup: grade + avatar, optionally name (case-insensitive).
 * Without name, returns every match for that grade + avatar.
 */
export async function findByGradeAvatar(
  db: StudentsDb,
  grade: GradeLevel,
  avatarId: string,
  name?: string,
): Promise<StudentRow[]> {
  let query = db
    .selectFrom('students')
    .selectAll()
    .where('grade', '=', grade)
    .where('avatar_id', '=', avatarId)

  if (name !== undefined) {
    const trimmed = name.trim()
    query = query.where(sql`name COLLATE NOCASE`, '=', trimmed)
  }

  return query.orderBy('created_at', 'asc').execute()
}

/**
 * Update grade, content_level, and/or xp. At least one field required.
 */
export async function updateStudentFields(
  db: StudentsDb,
  id: string,
  fields: UpdateStudentFields,
): Promise<StudentRow> {
  const patch: {
    grade?: GradeLevel
    content_level?: GradeLevel
    xp?: number
    updated_at: string
  } = { updated_at: nowIso() }

  if (fields.grade !== undefined) patch.grade = fields.grade
  if (fields.contentLevel !== undefined) patch.content_level = fields.contentLevel
  if (fields.xp !== undefined) {
    if (!Number.isFinite(fields.xp) || fields.xp < 0) {
      throw new Error('xp must be a non-negative number')
    }
    patch.xp = fields.xp
  }

  if (
    fields.grade === undefined &&
    fields.contentLevel === undefined &&
    fields.xp === undefined
  ) {
    throw new Error('updateStudentFields requires at least one of: grade, contentLevel, xp')
  }

  try {
    const result = await db
      .updateTable('students')
      .set(patch)
      .where('id', '=', id)
      .executeTakeFirst()

    const changes = Number(result.numUpdatedRows ?? 0n)
    if (changes === 0) {
      throw new StudentNotFoundError(`Student not found: ${id}`)
    }
  } catch (err) {
    if (err instanceof StudentNotFoundError) throw err
    const message = err instanceof Error ? err.message : String(err)
    if (/UNIQUE|unique/i.test(message)) {
      throw new StudentConflictError(DUPLICATE_PROFILE_MESSAGE)
    }
    throw err
  }

  const row = await findStudentById(db, id)
  if (!row) {
    throw new StudentNotFoundError(`Student not found: ${id}`)
  }
  return row
}
