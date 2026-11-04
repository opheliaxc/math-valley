/**
 * Start API + Vite together for local development.
 *
 *   npm run dev
 *
 * No extra npm packages — uses Node child_process only.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const children = []
let shuttingDown = false

function prefixLines(prefix, chunk, write) {
  for (const line of chunk.toString().split(/\r?\n/)) {
    if (line.length > 0) write(`${prefix}${line}\n`)
  }
}

function run(label, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  })
  children.push(child)

  child.stdout?.on('data', (chunk) => {
    prefixLines(`[${label}] `, chunk, (s) => process.stdout.write(s))
  })
  child.stderr?.on('data', (chunk) => {
    prefixLines(`[${label}] `, chunk, (s) => process.stderr.write(s))
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    console.error(
      `[dev] ${label} exited (${signal ? `signal ${signal}` : `code ${code}`}). Stopping the rest.`,
    )
    shutdown(typeof code === 'number' ? code : 1)
  })

  return child
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 500).unref()
}

async function waitForApi(url, attempts = 50) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      // not up yet
    }
    await sleep(100)
  }
  return false
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

const apiPort = process.env.PORT || '3001'
const apiHost = '127.0.0.1'
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js')

if (!existsSync(viteBin)) {
  console.error('[dev] Could not find local Vite. Run npm install first.')
  process.exit(1)
}

console.log('[dev] Starting Math Valley (API + Vite)…')
console.log(
  `[dev] SQLite persistence (DB_PATH=${process.env.DB_PATH ?? 'server/data/math-valley.db'})`,
)
console.log(`[dev] API: http://${apiHost}:${apiPort}  (browser uses /api via Vite proxy)`)

run('api', process.execPath, [join(root, 'server', 'index.ts')])

const apiReady = await waitForApi(`http://${apiHost}:${apiPort}/api/health`)
if (!apiReady) {
  console.error('[dev] API did not become ready. Check the [api] logs above.')
  shutdown(1)
} else {
  console.log('[dev] API is ready. Starting Vite…')
}

run('vite', process.execPath, [viteBin])
