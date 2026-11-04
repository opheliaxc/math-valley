/**
 * SQLite connection for Math Valley.
 * Opens one in-process database used by the app storage layer.
 */
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DB_DIR = dirname(fileURLToPath(import.meta.url))
const SERVER_DATA_DIR = join(DB_DIR, '..', 'data')

export const DEFAULT_DB_PATH = join(SERVER_DATA_DIR, 'math-valley.db')
export const DEFAULT_BACKUP_DIR = join(SERVER_DATA_DIR, 'backups')

export type DbConfig = {
  dbPath: string
  backupDir: string
  backupIntervalHours: number
  backupRetention: number
}

let db: Database.Database | null = null

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return fallback
  return n
}

export function loadDbConfig(env: NodeJS.ProcessEnv = process.env): DbConfig {
  return {
    dbPath: env.DB_PATH?.trim() || DEFAULT_DB_PATH,
    backupDir: env.BACKUP_DIR?.trim() || DEFAULT_BACKUP_DIR,
    backupIntervalHours: parsePositiveInt(env.BACKUP_INTERVAL_HOURS, 24),
    backupRetention: parsePositiveInt(env.BACKUP_RETENTION, 14),
  }
}

export function isDatabaseOpen(): boolean {
  return db !== null
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database is not open')
  }
  return db
}

/**
 * Open the shared connection once. Safe to call again; returns the existing db.
 */
export function openDatabase(dbPath?: string): Database.Database {
  if (db) return db

  const path = dbPath ?? loadDbConfig().dbPath
  mkdirSync(dirname(path), { recursive: true })

  const opened = new Database(path)
  opened.pragma('journal_mode = WAL')
  opened.pragma('foreign_keys = ON')
  opened.pragma('busy_timeout = 5000')
  opened.pragma('synchronous = NORMAL')

  db = opened
  return db
}

/** PRAGMA user_version — migration count after Phase 2; 0 on a fresh file. */
export function getSchemaVersion(): number {
  const row = getDatabase().pragma('user_version', { simple: true }) as number
  return row
}

/**
 * Checkpoint WAL into the main file, then close. Idempotent if already closed.
 */
export function closeDatabase(): void {
  if (!db) return
  const handle = db
  db = null
  // Kysely.destroy() may have already closed the underlying handle.
  if (!handle.open) return
  try {
    handle.pragma('wal_checkpoint(TRUNCATE)')
  } catch (err) {
    console.error('[math-valley-db] wal_checkpoint failed during shutdown:', err)
  }
  try {
    handle.close()
  } catch (err) {
    console.error('[math-valley-db] close failed during shutdown:', err)
  }
}
