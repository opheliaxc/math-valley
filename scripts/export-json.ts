/**
 * Export SQLite data in the old Math Valley JSON shape (Phase 6 / spec §11).
 *
 *   npm run db:export-json -- <out-file>
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  closeDatabase,
  loadDbConfig,
  openDatabase,
} from '../server/db/connection.ts'
import { migrateSync } from '../server/db/migrate.ts'
import { createSqliteStorage } from '../server/storage/sqlite-store.ts'

async function main(): Promise<void> {
  const outPath = process.argv[2]
  if (!outPath || outPath.startsWith('-')) {
    console.error('Usage: npm run db:export-json -- <out-file>')
    process.exit(1)
  }

  const config = loadDbConfig()
  console.log('Export SQLite → JSON')
  console.log(`  database: ${config.dbPath}`)
  console.log(`  out:      ${outPath}`)

  const sqlite = openDatabase(config.dbPath)
  migrateSync(sqlite)

  const storage = createSqliteStorage({
    database: sqlite,
    dbPath: config.dbPath,
    skipMigrate: true,
  })

  try {
    const data = await storage.loadData()
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

    const studentCount = Object.keys(data.students).length
    console.log(`\nWrote ${studentCount} student(s) to ${outPath}`)
    console.log(`schemaVersion: ${data.schemaVersion}`)
    console.log(
      `meta.activeStudentIdByDefault: ${data.meta.activeStudentIdByDefault}`,
    )
  } finally {
    closeDatabase()
  }
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false

if (isDirectRun) {
  main().catch((err) => {
    console.error(err)
    closeDatabase()
    process.exit(1)
  })
}
