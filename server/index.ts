/**
 * Start the Math Valley API server (and optionally the built frontend).
 *
 *   npm run server          # API (dev defaults: 127.0.0.1, static off unless SERVE_STATIC=1)
 *   npm start               # production-oriented: loads .env if present
 *   pm2 start ecosystem.config.cjs
 *
 * Env: PORT, HOST, SERVE_STATIC, STATIC_DIR, DB_PATH, …
 * See .env.example and the README deployment section.
 */
import {
  closeDatabase,
  loadDbConfig,
  openDatabase,
} from './db/connection.ts'
import { startApiServer } from './api.ts'

const config = loadDbConfig()
openDatabase(config.dbPath)

const started = await startApiServer()
console.log(
  `Math Valley API listening on http://${started.host}:${started.port}`,
)
console.log(`Database:       ${config.dbPath}`)


let shuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`Received ${signal}; shutting down…`)
  try {
    await started.close()
  } catch (err) {
    console.error('[math-valley-api] error while closing HTTP server:', err)
  }
  closeDatabase()
  console.log('Database checkpointed and closed cleanly.')
  process.exit(0)
}

process.once('SIGINT', () => {
  void shutdown('SIGINT')
})
process.once('SIGTERM', () => {
  void shutdown('SIGTERM')
})
