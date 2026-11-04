/**
 * SQLite adapter implementing MathValleyStorage.
 * Nothing in the app wires this in yet (Step 7).
 */
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Kysely } from 'kysely'
import { createKysely } from '../db/kysely.ts'
import { migrateSync } from '../db/migrate.ts'
import { loadDbConfig } from '../db/connection.ts'
import type { DB, GradeLevel } from '../db/schema-types.ts'
import {
  loadPlayerProgress,
  playerPartsToApiPlayer,
  replacePlayerProgress,
} from '../db/repositories/progress.repo.ts'
import {
  getActiveSession,
  listSessionHistory,
  replaceStudentSessions,
  type ActiveSessionBlob,
  type SessionHistoryBlob,
} from '../db/repositories/sessions.repo.ts'
import {
  SCHEMA_VERSION,
  StorageError,
  validateMathValleyData,
  type MathValleyData,
  type MathValleyStorage,
  type StudentRecord,
} from '../storage.ts'

const META_ACTIVE_STUDENT = 'active_student_id_by_default'

export type SqliteStorageOptions = {
  /** Path to the SQLite file. Defaults to DB_PATH / math-valley.db. */
  dbPath?: string
  /**
   * Use an existing better-sqlite3 handle (shared process connection).
   * When set, the store does not open or close its own file.
   */
  database?: Database.Database
  /** Skip migrate (caller already migrated this file). */
  skipMigrate?: boolean
  /**
   * Test hook: called inside the write transaction after each student is written.
   * Throw to abort and roll back the whole transaction (submit-answer failure sim).
   */
  afterStudentWrite?: (info: {
    studentId: string
    index: number
    total: number
  }) => void
}

function applyPragmas(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
}

function emptyData(): MathValleyData {
  return {
    schemaVersion: SCHEMA_VERSION,
    students: {},
    meta: { activeStudentIdByDefault: null },
  }
}

function asGrade(value: number): GradeLevel {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value
  throw new StorageError('VALIDATION', `Invalid grade/content_level: ${value}`)
}

function toActiveBlob(
  session: StudentRecord['activeSession'],
): ActiveSessionBlob | null {
  if (!session) return null
  return {
    id: session.id,
    status: 'in_progress',
    topicId: session.topicId,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    questionIndex: session.questionIndex,
    correctCount: session.correctCount,
    phase: session.phase,
    activeTopicId: session.activeTopicId,
    sessionUnlockId: session.sessionUnlockId,
    contentLevelAdvanced: session.contentLevelAdvanced,
    answers: session.answers,
    currentQuestion: session.currentQuestion,
  }
}

function toHistoryBlob(
  history: StudentRecord['sessionHistory'],
): SessionHistoryBlob[] {
  return history.map((h) => ({
    id: h.id,
    topicId: h.topicId,
    startedAt: h.startedAt,
    completedAt: h.completedAt,
    total: h.total,
    correctCount: h.correctCount,
    xpEarned: h.xpEarned,
  }))
}

async function readDocument(db: Kysely<DB>): Promise<MathValleyData> {
  const metaRow = await db
    .selectFrom('app_meta')
    .selectAll()
    .where('key', '=', META_ACTIVE_STUDENT)
    .executeTakeFirst()

  const studentRows = await db
    .selectFrom('students')
    .selectAll()
    .orderBy('created_at', 'asc')
    .execute()

  const students: Record<string, StudentRecord> = {}

  for (const row of studentRows) {
    const parts = await loadPlayerProgress(
      db,
      row.id,
      asGrade(row.content_level),
      row.xp,
    )
    const active = await getActiveSession(db, row.id)
    const history = await listSessionHistory(db, row.id)

    students[row.id] = {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      profile: {
        name: row.name,
        grade: asGrade(row.grade),
        avatarId: row.avatar_id,
      },
      player: playerPartsToApiPlayer(parts),
      sessionHistory: history,
      activeSession: active,
    }
  }

  let activeStudentIdByDefault: string | null = metaRow?.value ?? null
  if (activeStudentIdByDefault && !(activeStudentIdByDefault in students)) {
    activeStudentIdByDefault = null
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    students,
    meta: { activeStudentIdByDefault },
  }
}

async function writeDocument(
  db: Kysely<DB>,
  data: MathValleyData,
  afterStudentWrite?: SqliteStorageOptions['afterStudentWrite'],
): Promise<void> {
  const validated = validateMathValleyData(data)
  const studentList = Object.values(validated.students)

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom('students').execute()
    await trx.deleteFrom('app_meta').execute()

    if (validated.meta.activeStudentIdByDefault) {
      await trx
        .insertInto('app_meta')
        .values({
          key: META_ACTIVE_STUDENT,
          value: validated.meta.activeStudentIdByDefault,
        })
        .execute()
    }

    for (let index = 0; index < studentList.length; index += 1) {
      const student = studentList[index]
      await trx
        .insertInto('students')
        .values({
          id: student.id,
          name: student.profile.name,
          grade: student.profile.grade,
          avatar_id: student.profile.avatarId,
          content_level: student.player.contentLevel,
          xp: student.player.xp,
          created_at: student.createdAt,
          updated_at: student.updatedAt,
        })
        .execute()

      await replacePlayerProgress(trx, student.id, student.player)
      await replaceStudentSessions(
        trx,
        student.id,
        toActiveBlob(student.activeSession),
        toHistoryBlob(student.sessionHistory),
      )

      // Keep updated_at from the document (replacePlayerProgress touches it).
      await trx
        .updateTable('students')
        .set({ updated_at: student.updatedAt })
        .where('id', '=', student.id)
        .execute()

      afterStudentWrite?.({
        studentId: student.id,
        index,
        total: studentList.length,
      })
    }
  })
}

/**
 * Create a SQLite-backed storage instance.
 * Opens its own DB file unless `database` is provided (shared process connection).
 */
export function createSqliteStorage(
  options: SqliteStorageOptions = {},
): MathValleyStorage {
  const dbPath = options.dbPath ?? loadDbConfig().dbPath

  let sqlite: Database.Database
  if (options.database) {
    sqlite = options.database
  } else {
    mkdirSync(dirname(dbPath), { recursive: true })
    sqlite = new Database(dbPath)
    applyPragmas(sqlite)
  }

  if (!options.skipMigrate) {
    migrateSync(sqlite)
  }

  const db = createKysely(sqlite)
  const afterStudentWrite = options.afterStudentWrite

  let writeQueue: Promise<unknown> = Promise.resolve()

  function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
    const run = writeQueue.then(task, task)
    writeQueue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  async function ensureDataFile(): Promise<MathValleyData> {
    return enqueueWrite(async () => readDocument(db))
  }

  async function loadData(): Promise<MathValleyData> {
    return enqueueWrite(async () => readDocument(db))
  }

  async function saveData(data: MathValleyData): Promise<void> {
    await enqueueWrite(async () => {
      try {
        await writeDocument(db, data, afterStudentWrite)
      } catch (err) {
        if (err instanceof StorageError) throw err
        throw new StorageError(
          'WRITE_FAILED',
          `SQLite save failed (${dbPath})`,
          err,
        )
      }
    })
  }

  async function updateData(
    mutator: (data: MathValleyData) => MathValleyData,
  ): Promise<MathValleyData> {
    return enqueueWrite(async () => {
      const current = await readDocument(db)
      const next = mutator(current.students ? current : emptyData())
      try {
        await writeDocument(db, next, afterStudentWrite)
      } catch (err) {
        if (err instanceof StorageError) throw err
        throw new StorageError(
          'WRITE_FAILED',
          `SQLite update failed (${dbPath})`,
          err,
        )
      }
      return validateMathValleyData(next)
    })
  }

  return {
    dataFilePath: dbPath,
    ensureDataFile,
    loadData,
    saveData,
    updateData,
  }
}
