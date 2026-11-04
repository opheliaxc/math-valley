/**
 * App storage — SQLite only (JSON adapter removed in Phase 9 / Step 11).
 */
import {
  getDatabase,
  isDatabaseOpen,
  loadDbConfig,
  openDatabase,
} from '../db/connection.ts'
import type { MathValleyStorage } from '../storage.ts'
import { createSqliteStorage } from './sqlite-store.ts'

export type { MathValleyStorage }
export { createSqliteStorage } from './sqlite-store.ts'

/**
 * Create the process storage adapter.
 * Uses the shared connection opened at startup (migrate first).
 */
export function createAppStorage(): MathValleyStorage {
  const config = loadDbConfig()

  if (!isDatabaseOpen()) {
    openDatabase(config.dbPath)
  }

  return createSqliteStorage({
    database: getDatabase(),
    dbPath: config.dbPath,
    skipMigrate: true,
  })
}
