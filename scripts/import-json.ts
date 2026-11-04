/**
 * Import math-valley-data.json into SQLite (Phase 6 / spec §11).
 *
 *   npm run db:import-json -- [path] [--dry-run] [--force]
 *
 * Default path: server/data/math-valley-data.json
 */
import { access, readFile, rename } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  closeDatabase,
  loadDbConfig,
  openDatabase,
} from '../server/db/connection.ts'
import { createKysely } from '../server/db/kysely.ts'
import { migrateSync } from '../server/db/migrate.ts'
import {
  validateMathValleyData,
  type MathValleyData,
  type StudentRecord,
} from '../server/storage.ts'
import { createSqliteStorage } from '../server/storage/sqlite-store.ts'

const META_IMPORTED = 'json_imported_at'

/** Default legacy JSON path — only this script (and export) should name this file. */
const DEFAULT_JSON_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'server',
  'data',
  'math-valley-data.json',
)

type Args = {
  path: string
  dryRun: boolean
  force: boolean
}

function parseArgs(argv: string[]): Args {
  let path = DEFAULT_JSON_PATH
  let dryRun = false
  let force = false

  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--force') force = true
    else if (arg.startsWith('-')) {
      console.error(`Unknown flag: ${arg}`)
      process.exit(1)
    } else {
      path = arg
    }
  }
  return { path, dryRun, force }
}

type DuplicateGroup = {
  grade: number
  avatarId: string
  name: string
  ids: string[]
}

function findDuplicateProfiles(
  students: Record<string, StudentRecord>,
): DuplicateGroup[] {
  const buckets = new Map<string, DuplicateGroup>()
  for (const student of Object.values(students)) {
    if (!student?.profile) continue
    const name = String(student.profile.name ?? '').trim()
    const key = `${student.profile.grade}|${student.profile.avatarId}|${name.toLowerCase()}`
    const existing = buckets.get(key)
    if (existing) existing.ids.push(student.id)
    else {
      buckets.set(key, {
        grade: student.profile.grade,
        avatarId: student.profile.avatarId,
        name,
        ids: [student.id],
      })
    }
  }
  return [...buckets.values()].filter((g) => g.ids.length > 1)
}

type ImportCounts = {
  students: number
  topicProgress: number
  standardMeta: number
  standardProgress: number
  attempts: number
  missedQuestions: number
  topicTier: number
  zoneXp: number
  unlockedZones: number
  sessionsActive: number
  sessionsCompleted: number
  sessionAnswers: number
}

function countDocument(data: MathValleyData): ImportCounts {
  const counts: ImportCounts = {
    students: 0,
    topicProgress: 0,
    standardMeta: 0,
    standardProgress: 0,
    attempts: 0,
    missedQuestions: 0,
    topicTier: 0,
    zoneXp: 0,
    unlockedZones: 0,
    sessionsActive: 0,
    sessionsCompleted: 0,
    sessionAnswers: 0,
  }

  for (const student of Object.values(data.students)) {
    counts.students += 1
    const player = student.player
    const sp = player.studentProgress as {
      topics?: Record<string, unknown>
      standards?: Record<
        string,
        {
          beginner?: { attempts?: unknown[] }
          advanced?: { attempts?: unknown[] }
        }
      >
      missedQuestions?: unknown[]
    }

    if (player.topicProgress && typeof player.topicProgress === 'object') {
      counts.topicTier += Object.keys(player.topicProgress as object).length
    }
    if (player.zoneXp && typeof player.zoneXp === 'object') {
      counts.zoneXp += Object.keys(player.zoneXp as object).length
    }
    if (Array.isArray(player.unlockedZones)) {
      counts.unlockedZones += player.unlockedZones.length
    }
    if (sp?.topics) counts.topicProgress += Object.keys(sp.topics).length
    if (sp?.missedQuestions) counts.missedQuestions += sp.missedQuestions.length
    if (sp?.standards) {
      for (const standard of Object.values(sp.standards)) {
        counts.standardMeta += 1
        counts.standardProgress += 2
        counts.attempts += standard.beginner?.attempts?.length ?? 0
        counts.attempts += standard.advanced?.attempts?.length ?? 0
      }
    }
    if (student.activeSession) {
      counts.sessionsActive += 1
      counts.sessionAnswers += student.activeSession.answers.length
    }
    counts.sessionsCompleted += student.sessionHistory.length
  }

  return counts
}

function printCounts(label: string, counts: ImportCounts): void {
  console.log(`\n${label}`)
  console.log(`  students:            ${counts.students}`)
  console.log(`  topic_progress:      ${counts.topicProgress}`)
  console.log(`  standard_meta:       ${counts.standardMeta}`)
  console.log(`  standard_progress:   ${counts.standardProgress}`)
  console.log(`  attempts:            ${counts.attempts}`)
  console.log(`  missed_questions:    ${counts.missedQuestions}`)
  console.log(`  topic_tier_progress: ${counts.topicTier}`)
  console.log(`  zone_xp:             ${counts.zoneXp}`)
  console.log(`  unlocked_zones:      ${counts.unlockedZones}`)
  console.log(`  sessions (active):   ${counts.sessionsActive}`)
  console.log(`  sessions (history):  ${counts.sessionsCompleted}`)
  console.log(`  session_answers:     ${counts.sessionAnswers}`)
}

function masteredStandardCount(student: StudentRecord): number {
  const sp = student.player.studentProgress as {
    standards?: Record<
      string,
      { beginner?: { mastered?: boolean }; advanced?: { mastered?: boolean } }
    >
  }
  if (!sp?.standards) return 0
  let n = 0
  for (const s of Object.values(sp.standards)) {
    if (s.beginner?.mastered && s.advanced?.mastered) n += 1
  }
  return n
}

function spotCheck(data: MathValleyData, n: number): void {
  const list = Object.values(data.students)
  if (list.length === 0) {
    console.log('\nSpot check: (no students)')
    return
  }
  const pick = [...list]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(n, list.length))
  console.log(`\nSpot check (${pick.length} student(s)):`)
  for (const s of pick) {
    console.log(
      `  - ${s.profile.name} | grade ${s.profile.grade} | content L${s.player.contentLevel} | xp ${s.player.xp} | mastered standards ${masteredStandardCount(s)} | activeSession ${s.activeSession ? 'yes' : 'no'}`,
    )
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  console.log('Import JSON → SQLite')
  console.log(`  source:  ${args.path}`)
  console.log(`  dry-run: ${args.dryRun}`)
  console.log(`  force:   ${args.force}`)

  let raw: string
  try {
    raw = await readFile(args.path, 'utf8')
  } catch (err) {
    console.error(
      `Could not read ${args.path}:`,
      err instanceof Error ? err.message : err,
    )
    process.exit(1)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('JSON file is malformed. Nothing was imported.')
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const root =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as { students?: Record<string, StudentRecord> })
      : {}
  const dupScan = findDuplicateProfiles(root.students ?? {})
  if (dupScan.length > 0) {
    console.error(
      '\nDuplicate profiles found (grade + avatar + name). Import stopped.',
    )
    console.error('Rename these by hand in the JSON file, then re-run:\n')
    for (const g of dupScan) {
      console.error(
        `  grade ${g.grade}, avatar ${g.avatarId}, name "${g.name}" → ids: ${g.ids.join(', ')}`,
      )
    }
    process.exit(1)
  }

  let data: MathValleyData
  try {
    data = validateMathValleyData(parsed)
  } catch (err) {
    console.error('Validation failed. Nothing was imported.')
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const planned = countDocument(data)
  printCounts('Would write (from JSON):', planned)
  spotCheck(data, 3)

  const config = loadDbConfig()
  const sqlite = openDatabase(config.dbPath)
  migrateSync(sqlite)
  // Dedicated Kysely for meta checks — do not destroy() (that closes the shared DB).
  const kysely = createKysely(sqlite)

  const importedAt = await kysely
    .selectFrom('app_meta')
    .select('value')
    .where('key', '=', META_IMPORTED)
    .executeTakeFirst()

  const studentCountRow = await kysely
    .selectFrom('students')
    .select((eb) => eb.fn.countAll<number>().as('n'))
    .executeTakeFirst()
  const existingStudents = Number(studentCountRow?.n ?? 0)

  if (importedAt?.value) {
    if (!args.force) {
      console.error(
        `\nImport already recorded at ${importedAt.value}. Refusing to re-run.`,
      )
      console.error(
        'Use --force only on an empty database if you must re-import.',
      )
      closeDatabase()
      process.exit(1)
    }
    if (existingStudents > 0) {
      console.error(
        `\n--force requires an empty database, but students table has ${existingStudents} row(s).`,
      )
      closeDatabase()
      process.exit(1)
    }
    await kysely
      .deleteFrom('app_meta')
      .where('key', '=', META_IMPORTED)
      .execute()
    console.log('Cleared json_imported_at (--force on empty DB).')
  }

  if (args.dryRun) {
    console.log(
      '\nDry run only — database not modified, JSON file not renamed.',
    )
    closeDatabase()
    return
  }

  const beforeStudents = existingStudents
  console.log(`\nDatabase students before import: ${beforeStudents}`)

  const storage = createSqliteStorage({
    database: sqlite,
    dbPath: config.dbPath,
    skipMigrate: true,
  })
  await storage.saveData(data)

  const importedIso = new Date().toISOString()
  await kysely
    .insertInto('app_meta')
    .values({ key: META_IMPORTED, value: importedIso })
    .onConflict((oc) => oc.column('key').doUpdateSet({ value: importedIso }))
    .execute()

  const afterData = await storage.loadData()
  const afterCounts = countDocument(afterData)
  printCounts('Database after import:', afterCounts)
  console.log('\nBefore → after:')
  console.log(`  students: ${beforeStudents} → ${afterCounts.students}`)
  console.log(
    `  attempts (from JSON shape): ${planned.attempts} → ${afterCounts.attempts}`,
  )
  spotCheck(afterData, 3)

  const day = importedIso.slice(0, 10)
  const dir = dirname(args.path)
  const base = basename(args.path).replace(/\.json$/i, '')
  let dest = join(dir, `${base}.imported-${day}.json`)
  try {
    await access(dest)
    dest = join(
      dir,
      `${base}.imported-${day}T${importedIso.slice(11, 19).replace(/:/g, '')}.json`,
    )
  } catch {
    // dest free
  }

  await rename(args.path, dest)
  console.log('\nRenamed JSON (not deleted):')
  console.log(`  ${args.path}`)
  console.log(`  → ${dest}`)
  console.log(`\nRecorded app_meta.${META_IMPORTED} = ${importedIso}`)
  console.log('Import complete.')
  closeDatabase()
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
