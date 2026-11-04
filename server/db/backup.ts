/**
 * SQLite backups: online backup API, integrity check, retention, scheduler.
 *
 *   npm run db:backup
 */
import Database from 'better-sqlite3'
import {
  mkdirSync,
  readdirSync,
  unlinkSync,
  existsSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  closeDatabase,
  getDatabase,
  isDatabaseOpen,
  loadDbConfig,
  openDatabase,
  type DbConfig,
} from './connection.ts'

const META_LAST_BACKUP = 'last_backup_at'

const SCHEDULED_NAME =
  /^math-valley-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?:-\d{3})?Z)\.db$/
const PREMIGRATE_PREFIX = 'math-valley-premigrate-v'

let backupTimer: ReturnType<typeof setInterval> | null = null

function utcStamp(date: Date = new Date()): string {
  // 2026-10-26T14-30-00-000Z (filesystem-safe)
  return date
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')
}

function ensureBackupDir(dir: string): void {
  mkdirSync(dir, { recursive: true })
}

function removeSidecars(filePath: string): void {
  for (const suffix of ['-wal', '-shm']) {
    const side = `${filePath}${suffix}`
    if (existsSync(side)) {
      try {
        unlinkSync(side)
      } catch {
        // ignore
      }
    }
  }
}

function integrityOk(filePath: string): boolean {
  const check = new Database(filePath, { readonly: true, fileMustExist: true })
  try {
    const result = check.pragma('integrity_check', { simple: true })
    return result === 'ok'
  } finally {
    check.close()
    removeSidecars(filePath)
  }
}

function setLastBackupAt(db: Database.Database, iso: string): void {
  db.prepare(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(META_LAST_BACKUP, iso)
}

function getLastBackupAt(db: Database.Database): string | null {
  try {
    const row = db
      .prepare(`SELECT value FROM app_meta WHERE key = ?`)
      .get(META_LAST_BACKUP) as { value: string } | undefined
    return row?.value ?? null
  } catch {
    // app_meta may not exist yet on a brand-new file before migrations
    return null
  }
}

function listScheduledBackups(backupDir: string): string[] {
  if (!existsSync(backupDir)) return []
  return readdirSync(backupDir)
    .filter((name) => SCHEDULED_NAME.test(name))
    .map((name) => join(backupDir, name))
    .sort((a, b) => {
      // oldest first
      return statSync(a).mtimeMs - statSync(b).mtimeMs
    })
}

function pruneScheduledBackups(backupDir: string, retention: number): number {
  const files = listScheduledBackups(backupDir)
  if (files.length <= retention) return 0
  const toDelete = files.slice(0, files.length - retention)
  for (const file of toDelete) {
    try {
      unlinkSync(file)
      removeSidecars(file)
      console.log(`[math-valley-db] Pruned old backup: ${file}`)
    } catch (err) {
      console.error(`[math-valley-db] Could not prune ${file}:`, err)
    }
  }
  return toDelete.length
}

export type BackupKind = 'scheduled' | 'premigrate' | 'manual'

export type BackupResult = {
  path: string
  kind: BackupKind
  at: string
}

/**
 * Create a backup with integrity check. Premigrate files are never pruned.
 */
export async function createBackup(
  db: Database.Database,
  options: {
    kind: BackupKind
    backupDir?: string
    retention?: number
    /** Required when kind === 'premigrate' */
    nextVersion?: number
    recordMeta?: boolean
  },
): Promise<BackupResult> {
  const config = loadDbConfig()
  const backupDir = options.backupDir ?? config.backupDir
  const retention = options.retention ?? config.backupRetention
  ensureBackupDir(backupDir)

  const at = new Date().toISOString()
  const stamp = utcStamp(new Date(at))
  let fileName: string
  if (options.kind === 'premigrate') {
    const v = options.nextVersion ?? 0
    fileName = `${PREMIGRATE_PREFIX}${v}-${stamp}.db`
  } else {
    fileName = `math-valley-${stamp}.db`
  }
  const dest = join(backupDir, fileName)

  await db.backup(dest)

  if (!integrityOk(dest)) {
    try {
      unlinkSync(dest)
    } catch {
      // ignore
    }
    throw new Error(
      `Backup integrity_check failed; removed bad file ${dest}`,
    )
  }

  if (options.recordMeta !== false && options.kind !== 'premigrate') {
    try {
      setLastBackupAt(db, at)
    } catch (err) {
      console.error('[math-valley-db] Could not record last_backup_at:', err)
    }
  }

  if (options.kind !== 'premigrate') {
    pruneScheduledBackups(backupDir, retention)
  }

  console.log(`[math-valley-db] Backup OK (${options.kind}): ${dest}`)
  return { path: dest, kind: options.kind, at }
}

/**
 * Before applying migration N on a non-brand-new DB.
 * Never auto-deleted by retention.
 */
export async function backupBeforeMigration(
  db: Database.Database,
  nextVersion: number,
): Promise<void> {
  await createBackup(db, {
    kind: 'premigrate',
    nextVersion,
    recordMeta: false,
  })
}

/** Take a backup now if last_backup_at is missing or older than the interval. */
export async function backupIfStale(
  db: Database.Database = getDatabase(),
  config: DbConfig = loadDbConfig(),
): Promise<BackupResult | null> {
  const last = getLastBackupAt(db)
  const intervalMs = config.backupIntervalHours * 60 * 60 * 1000
  if (last) {
    const age = Date.now() - Date.parse(last)
    if (Number.isFinite(age) && age < intervalMs) {
      console.log(
        `[math-valley-db] Last backup at ${last} is fresh; skipping startup backup.`,
      )
      return null
    }
  }
  return createBackup(db, { kind: 'scheduled' })
}

export function startBackupScheduler(
  db: Database.Database = getDatabase(),
  config: DbConfig = loadDbConfig(),
): void {
  stopBackupScheduler()
  const intervalMs = config.backupIntervalHours * 60 * 60 * 1000
  backupTimer = setInterval(() => {
    void createBackup(db, { kind: 'scheduled' }).catch((err) => {
      console.error('[math-valley-db] Scheduled backup failed:', err)
    })
  }, intervalMs)
  // Don't keep the process alive solely for backups if everything else stopped.
  if (typeof backupTimer === 'object' && backupTimer && 'unref' in backupTimer) {
    backupTimer.unref()
  }
  console.log(
    `[math-valley-db] Backup scheduler every ${config.backupIntervalHours}h → ${config.backupDir}`,
  )
}

export function stopBackupScheduler(): void {
  if (backupTimer) {
    clearInterval(backupTimer)
    backupTimer = null
  }
}

async function cliBackup(): Promise<void> {
  const config = loadDbConfig()
  if (!isDatabaseOpen()) openDatabase(config.dbPath)
  // Dynamic import avoids a circular dependency with migrate.ts.
  const { migrate } = await import('./migrate.ts')
  await migrate()
  const result = await createBackup(getDatabase(), { kind: 'manual' })
  console.log(`Backup written: ${result.path}`)
  closeDatabase()
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isDirectRun) {
  cliBackup().catch((err) => {
    console.error(err)
    closeDatabase()
    process.exit(1)
  })
}
