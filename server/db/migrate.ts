/**
 * Plain SQL migration runner using PRAGMA user_version.
 *
 *   npm run db:migrate
 *   npm run db:status
 *
 * Also imported at API startup (before listen). On failure or
 * "database newer than code", exits the process.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type Database from 'better-sqlite3'
import { backupBeforeMigration } from './backup.ts'
import {
  closeDatabase,
  getDatabase,
  isDatabaseOpen,
  loadDbConfig,
  openDatabase,
} from './connection.ts'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

export type MigrationFile = {
  version: number
  fileName: string
  path: string
}

const MIGRATION_NAME = /^(\d+)_(.+)\.sql$/

export function listMigrationFiles(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === 'ENOENT') return []
    throw err
  }

  const files: MigrationFile[] = []
  for (const fileName of names) {
    const match = MIGRATION_NAME.exec(fileName)
    if (!match) continue
    const version = Number(match[1])
    if (!Number.isInteger(version) || version < 1) {
      throw new Error(`Invalid migration version in file name: ${fileName}`)
    }
    files.push({
      version,
      fileName,
      path: join(dir, fileName),
    })
  }

  files.sort((a, b) => a.version - b.version)

  for (let i = 0; i < files.length; i += 1) {
    const expected = i + 1
    if (files[i].version !== expected) {
      throw new Error(
        `Migration versions must be contiguous starting at 1; expected ${expected}, found ${files[i].fileName}`,
      )
    }
  }

  return files
}

export function readUserVersion(db: Database.Database): number {
  return db.pragma('user_version', { simple: true }) as number
}

export type MigrateResult = {
  fromVersion: number
  toVersion: number
  applied: string[]
}

export type MigrateOptions = {
  /** Override migrations directory (tests). */
  migrationsDir?: string
  /** When false, skip the pre-migration backup stub (default true). */
  backup?: boolean
}

function prepareMigrationRun(
  db: Database.Database,
  options: MigrateOptions,
): {
  fromVersion: number
  pending: MigrationFile[]
} {
  const files = listMigrationFiles(options.migrationsDir ?? MIGRATIONS_DIR)
  const latestCodeVersion = files.length > 0 ? files[files.length - 1].version : 0
  const fromVersion = readUserVersion(db)

  if (fromVersion > latestCodeVersion) {
    console.error(
      `[math-valley-db] Database schema version ${fromVersion} is newer than code (latest migration ${latestCodeVersion}). Refusing to start.`,
    )
    process.exit(1)
  }

  return {
    fromVersion,
    pending: files.filter((f) => f.version > fromVersion),
  }
}

function applyOneMigration(db: Database.Database, file: MigrationFile): void {
  const sql = readFileSync(file.path, 'utf8')
  const run = db.transaction(() => {
    db.exec(sql)
    db.pragma(`user_version = ${file.version}`)
  })
  try {
    run()
    console.log(`[math-valley-db] Applied migration ${file.fileName}`)
  } catch (err) {
    console.error(
      `[math-valley-db] Migration failed: ${file.fileName}`,
      err instanceof Error ? err.message : err,
    )
    process.exit(1)
  }
}

/**
 * Sync migrate for tests / sqlite-store factory (no pre-migration backup).
 */
export function migrateSync(
  db: Database.Database = getDatabase(),
  options: MigrateOptions = {},
): MigrateResult {
  const { fromVersion, pending } = prepareMigrationRun(db, options)
  const applied: string[] = []
  for (const file of pending) {
    applyOneMigration(db, file)
    applied.push(file.fileName)
  }
  return { fromVersion, toVersion: readUserVersion(db), applied }
}

/**
 * Apply pending migrations. Each file runs in its own transaction.
 * Takes a pre-migration backup when upgrading an existing DB.
 * Exits the process on failure or if the DB is newer than the code.
 */
export async function migrate(
  db: Database.Database = getDatabase(),
  options: MigrateOptions = {},
): Promise<MigrateResult> {
  const { fromVersion, pending } = prepareMigrationRun(db, options)
  const applied: string[] = []

  for (const file of pending) {
    // Skip backup only when the DB is brand new (user_version 0).
    const currentVersion = readUserVersion(db)
    if (options.backup !== false && currentVersion > 0) {
      await backupBeforeMigration(db, file.version)
    }
    applyOneMigration(db, file)
    applied.push(file.fileName)
  }

  return { fromVersion, toVersion: readUserVersion(db), applied }
}

export type StatusResult = {
  userVersion: number
  latestCodeVersion: number
  pending: string[]
  applied: string[]
}

export function migrationStatus(
  db: Database.Database = getDatabase(),
  migrationsDir: string = MIGRATIONS_DIR,
): StatusResult {
  const files = listMigrationFiles(migrationsDir)
  const userVersion = readUserVersion(db)
  const latestCodeVersion = files.length > 0 ? files[files.length - 1].version : 0
  return {
    userVersion,
    latestCodeVersion,
    pending: files.filter((f) => f.version > userVersion).map((f) => f.fileName),
    applied: files.filter((f) => f.version <= userVersion).map((f) => f.fileName),
  }
}

function printStatus(status: StatusResult): void {
  console.log(`user_version:        ${status.userVersion}`)
  console.log(`latest in code:      ${status.latestCodeVersion}`)
  console.log(
    `applied:             ${status.applied.length ? status.applied.join(', ') : '(none)'}`,
  )
  console.log(
    `pending:             ${status.pending.length ? status.pending.join(', ') : '(none)'}`,
  )
}

function ensureOpenFromEnv(): Database.Database {
  if (!isDatabaseOpen()) {
    openDatabase(loadDbConfig().dbPath)
  }
  return getDatabase()
}

async function main(argv: string[]): Promise<void> {
  const command = argv[0] ?? 'migrate'
  ensureOpenFromEnv()

  try {
    if (command === 'status') {
      printStatus(migrationStatus())
      return
    }
    if (command === 'migrate') {
      const before = migrationStatus()
      if (before.pending.length === 0) {
        console.log(
          `[math-valley-db] Already at version ${before.userVersion}; nothing to apply.`,
        )
        return
      }
      const result = await migrate()
      console.log(
        `[math-valley-db] Migrated ${result.fromVersion} → ${result.toVersion}` +
          (result.applied.length ? ` (${result.applied.join(', ')})` : ''),
      )
      return
    }
    console.error(`Unknown command: ${command} (use migrate or status)`)
    process.exit(1)
  } finally {
    // CLI opens its own connection; close so the process can exit cleanly.
    closeDatabase()
  }
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isDirectRun) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err)
    closeDatabase()
    process.exit(1)
  })
}
