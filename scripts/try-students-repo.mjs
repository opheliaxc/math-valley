/**
 * Step 4 scratch script — try the students repository on a temp database.
 *
 *   npm run db:try-students
 *   # or: node scripts/try-students-repo.mjs
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  closeDatabase,
  openDatabase,
} from '../server/db/connection.ts'
import { createKysely } from '../server/db/kysely.ts'
import { migrateSync } from '../server/db/migrate.ts'
import {
  createStudent,
  findByGradeAvatar,
  updateStudentFields,
} from '../server/db/repositories/students.repo.ts'

const dir = await mkdtemp(join(tmpdir(), 'mv-students-repo-'))
const dbPath = join(dir, 'try.db')
process.env.DB_PATH = dbPath

console.log(`Temp DB: ${dbPath}`)

try {
  const sqlite = openDatabase(dbPath)
  migrateSync()
  const db = createKysely(sqlite)

  const created = await createStudent(db, {
    name: 'Alex',
    grade: 3,
    avatarId: 'rose',
  })
  console.log('created:', {
    id: created.id,
    name: created.name,
    grade: created.grade,
    avatar_id: created.avatar_id,
    content_level: created.content_level,
    xp: created.xp,
  })

  const byAvatar = await findByGradeAvatar(db, 3, 'rose')
  console.log(`findByGradeAvatar(3, rose) → ${byAvatar.length} row(s)`)

  const byName = await findByGradeAvatar(db, 3, 'rose', 'ALEX')
  console.log(
    `findByGradeAvatar(3, rose, 'ALEX') → ${byName.length} row(s)`,
    byName[0] ? `(id=${byName[0].id})` : '',
  )

  const updated = await updateStudentFields(db, created.id, {
    contentLevel: 4,
    xp: 50,
  })
  console.log('updated content_level + xp:', {
    content_level: updated.content_level,
    xp: updated.xp,
  })

  // Same grade+avatar, different name — allowed.
  const second = await createStudent(db, {
    name: 'Sam',
    grade: 3,
    avatarId: 'rose',
  })
  console.log('second profile same grade+avatar:', second.name, second.id)

  const both = await findByGradeAvatar(db, 3, 'rose')
  console.log(
    'both profiles:',
    both.map((s) => s.name).join(', '),
  )

  // Duplicate name (case-insensitive) should fail.
  try {
    await createStudent(db, {
      name: 'alex',
      grade: 3,
      avatarId: 'rose',
    })
    console.error('FAIL: expected duplicate-name conflict')
    process.exitCode = 1
  } catch (err) {
    console.log(
      'duplicate name rejected:',
      err instanceof Error ? err.message : err,
    )
  }

  await db.destroy()
  console.log('\nOK — students repo looks good.')
} finally {
  closeDatabase()
  await rm(dir, { recursive: true, force: true })
}
