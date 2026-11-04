/**
 * Restore the SQLite database from a backup file.
 *
 *   npm run db:restore -- <backup-file>
 *
 * Refuses if the API server appears to be running (PID file).
 * Copies the current DB aside before replacing it.
 */
import Database from 'better-sqlite3'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadDbConfig } from './connection.ts'
import { isServerPidAlive } from './pidfile.ts'

function utcStamp(date: Date = new Date()): string {
  return date
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-')
}

function removeSidecars(dbPath: string): void {
  for (const suffix of ['-wal', '-shm']) {
    const side = `${dbPath}${suffix}`
    if (existsSync(side)) {
      unlinkSync(side)
      console.log(`Removed ${side}`)
    }
  }
}

function integrityOk(filePath: string): string {
  const check = new Database(filePath, { readonly: true, fileMustExist: true })
  try {
    return String(check.pragma('integrity_check', { simple: true }))
  } finally {
    check.close()
  }
}

function schemaVersion(filePath: string): number {
  const db = new Database(filePath, { readonly: true, fileMustExist: true })
  try {
    return db.pragma('user_version', { simple: true }) as number
  } finally {
    db.close()
  }
}

async function main(): Promise<void> {
  const backupPath = process.argv[2]
  if (!backupPath || backupPath.startsWith('-')) {
    console.error('Usage: npm run db:restore -- <backup-file>')
    process.exit(1)
  }

  if (!existsSync(backupPath)) {
    console.error(`Backup file not found: ${backupPath}`)
    process.exit(1)
  }

  if (isServerPidAlive()) {
    console.error(
      'Math Valley server appears to be running (PID file is live).',
    )
    console.error('Stop the server (Ctrl+C), then run restore again.')
    process.exit(1)
  }

  const config = loadDbConfig()
  const dbPath = config.dbPath
  mkdirSync(dirname(dbPath), { recursive: true })

  const stamp = utcStamp()
  if (existsSync(dbPath)) {
    const aside = join(dirname(dbPath), `math-valley.db.before-restore-${stamp}`)
    copyFileSync(dbPath, aside)
    console.log(`Current database copied aside:\n  ${aside}`)
  } else {
    console.log(`No existing database at ${dbPath}; restoring into place.`)
  }

  copyFileSync(backupPath, dbPath)
  removeSidecars(dbPath)

  const check = integrityOk(dbPath)
  if (check !== 'ok') {
    console.error(`integrity_check failed after restore: ${check}`)
    process.exit(1)
  }

  const version = schemaVersion(dbPath)
  console.log(`Restore complete.`)
  console.log(`  database:       ${dbPath}`)
  console.log(`  integrity:      ${check}`)
  console.log(`  schema version: ${version}`)
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isDirectRun) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
