/**
 * Server PID file so restore can refuse while the API is running.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SERVER_DIR = dirname(fileURLToPath(import.meta.url))
export const DEFAULT_PID_FILE = join(SERVER_DIR, '..', 'data', 'math-valley.server.pid')

export function writeServerPid(pidFile: string = DEFAULT_PID_FILE): void {
  mkdirSync(dirname(pidFile), { recursive: true })
  writeFileSync(pidFile, `${process.pid}\n`, 'utf8')
}

export function clearServerPid(pidFile: string = DEFAULT_PID_FILE): void {
  try {
    if (existsSync(pidFile)) unlinkSync(pidFile)
  } catch {
    // ignore
  }
}

/** True if the PID file exists and that process is still alive. */
export function isServerPidAlive(pidFile: string = DEFAULT_PID_FILE): boolean {
  if (!existsSync(pidFile)) return false
  let pid: number
  try {
    pid = Number(readFileSync(pidFile, 'utf8').trim())
  } catch {
    return false
  }
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    // Stale PID file — process not running
    return false
  }
}
