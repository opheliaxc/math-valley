/**
 * Kysely wrapper over the shared better-sqlite3 connection.
 * Use only inside server/db/ (repositories). Route handlers call storage.
 */
import { Kysely, SqliteDialect } from 'kysely'
import type Database from 'better-sqlite3'
import { getDatabase } from './connection.ts'
import type { DB } from './schema-types.ts'

let kysely: Kysely<DB> | null = null

/** Build a Kysely instance over an existing better-sqlite3 handle (tests / scripts). */
export function createKysely(database: Database.Database): Kysely<DB> {
  return new Kysely<DB>({
    dialect: new SqliteDialect({ database }),
  })
}

/** Shared Kysely over the process-wide connection from connection.ts. */
export function getKysely(): Kysely<DB> {
  if (!kysely) {
    kysely = createKysely(getDatabase())
  }
  return kysely
}

/** Drop the shared Kysely instance (call before closeDatabase in scripts/tests). */
export async function destroyKysely(): Promise<void> {
  if (!kysely) return
  const instance = kysely
  kysely = null
  await instance.destroy()
}
