/**
 * Math Valley HTTP API (Step 4).
 * Touches only the JSON data file via the storage module — no arbitrary filesystem access.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { createPlayerState } from '../src/data/playerState.ts'
import type { AvatarId } from '../src/data/avatars.ts'
import type { Grade, Profile } from '../src/data/profile.ts'
import {
  getDatabase,
  getSchemaVersion,
  isDatabaseOpen,
  openDatabase,
} from './db/connection.ts'
import {
  backupIfStale,
  startBackupScheduler,
  stopBackupScheduler,
} from './db/backup.ts'
import { migrate } from './db/migrate.ts'
import { clearServerPid, writeServerPid } from './db/pidfile.ts'
import {
  DUPLICATE_PROFILE_MESSAGE,
  StorageError,
  validateActiveSession,
  validatePlayer,
  validateProfile,
  type ActiveSession,
  type MathValleyStorage,
  type PlayerProgress,
  type SessionHistoryEntry,
  type StudentRecord,
} from './storage.ts'
import { createAppStorage } from './storage/index.ts'
import { resolveStaticDir, tryServeStatic } from './static.ts'
import { applySubmitAnswer } from './submitAnswer.ts'

const AVATAR_IDS = new Set<AvatarId>([
  'ember',
  'sage',
  'sky',
  'gold',
  'violet',
  'rose',
])

export type ApiServerOptions = {
  storage?: MathValleyStorage
  /** Default 3001 */
  port?: number
  host?: string
  /**
   * When true, skip running migrations (caller already migrated).
   * Default false — migrate before listen.
   */
  skipMigrate?: boolean
  /** Skip backup scheduler (tests). Default false. */
  skipBackupScheduler?: boolean
  /** Skip writing the server PID file (tests). Default false. */
  skipPidFile?: boolean
  /**
   * Directory of the Vite production build to serve (same origin as /api).
   * Pass `null` to disable. Default: from SERVE_STATIC / STATIC_DIR / NODE_ENV.
   */
  staticDir?: string | null
}

type JsonBody = unknown

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function sendError(
  res: ServerResponse,
  status: number,
  error: string,
  details?: unknown,
): void {
  sendJson(res, status, details === undefined ? { error } : { error, details })
}

async function readJsonBody(req: IncomingMessage): Promise<JsonBody> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) {
    throw new StorageError('VALIDATION', 'Request body is required')
  }
  try {
    return JSON.parse(raw) as JsonBody
  } catch (err) {
    throw new StorageError('MALFORMED_JSON', 'Request body is not valid JSON', err)
  }
}

function newStudentId(): string {
  return `stu_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

function newSessionId(): string {
  return `sess_${randomUUID().replace(/-/g, '').slice(0, 10)}`
}

function isAvatarId(value: string): value is AvatarId {
  return AVATAR_IDS.has(value as AvatarId)
}

function parseCreateProfile(body: unknown): Profile {
  const profile = validateProfile(body, 'body')
  if (!isAvatarId(profile.avatarId)) {
    throw new StorageError(
      'VALIDATION',
      `body.avatarId must be one of: ${[...AVATAR_IDS].join(', ')}`,
    )
  }
  return {
    name: profile.name,
    grade: profile.grade as Grade,
    avatarId: profile.avatarId,
  }
}

function parseProfilePatch(body: unknown): Partial<Profile> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new StorageError('VALIDATION', 'body must be an object')
  }
  const raw = body as Record<string, unknown>
  const patch: Partial<Profile> = {}

  if (raw.name !== undefined) {
    if (typeof raw.name !== 'string' || raw.name.trim().length === 0) {
      throw new StorageError('VALIDATION', 'body.name must be a non-empty string')
    }
    patch.name = raw.name.trim()
  }
  if (raw.grade !== undefined) {
    if (raw.grade !== 1 && raw.grade !== 2 && raw.grade !== 3 && raw.grade !== 4) {
      throw new StorageError('VALIDATION', 'body.grade must be 1, 2, 3, or 4')
    }
    patch.grade = raw.grade
  }
  if (raw.avatarId !== undefined) {
    if (typeof raw.avatarId !== 'string' || !isAvatarId(raw.avatarId)) {
      throw new StorageError(
        'VALIDATION',
        `body.avatarId must be one of: ${[...AVATAR_IDS].join(', ')}`,
      )
    }
    patch.avatarId = raw.avatarId
  }
  if (Object.keys(patch).length === 0) {
    throw new StorageError(
      'VALIDATION',
      'body must include at least one of: name, grade, avatarId',
    )
  }
  return patch
}

function playerFromCreatedState(profile: Profile): PlayerProgress {
  const state = createPlayerState(profile)
  return {
    topicProgress: state.topicProgress,
    studentProgress: state.studentProgress,
    contentLevel: state.contentLevel,
    xp: state.xp,
    zoneXp: state.zoneXp,
    unlockedZones: state.unlockedZones,
  }
}

function parseProgressBody(body: unknown): PlayerProgress {
  return validatePlayer(body, 'body')
}

function parseSessionBody(body: unknown): ActiveSession {
  const session = validateActiveSession(body, 'body')
  if (!session) {
    throw new StorageError('VALIDATION', 'body must be an active session object')
  }
  return session
}

type CompleteSessionBody = {
  topicId?: string
  total: number
  correctCount: number
  xpEarned: number
  completedAt?: string
  startedAt?: string
  sessionId?: string
  player?: PlayerProgress
}

function parseCompleteSessionBody(body: unknown): CompleteSessionBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new StorageError('VALIDATION', 'body must be an object')
  }
  const raw = body as Record<string, unknown>
  for (const key of ['total', 'correctCount', 'xpEarned'] as const) {
    if (typeof raw[key] !== 'number' || !Number.isFinite(raw[key]) || raw[key] < 0) {
      throw new StorageError(
        'VALIDATION',
        `body.${key} must be a non-negative number`,
      )
    }
  }
  if (raw.topicId !== undefined && typeof raw.topicId !== 'string') {
    throw new StorageError('VALIDATION', 'body.topicId must be a string')
  }
  if (raw.sessionId !== undefined && typeof raw.sessionId !== 'string') {
    throw new StorageError('VALIDATION', 'body.sessionId must be a string')
  }
  if (raw.completedAt !== undefined) {
    if (typeof raw.completedAt !== 'string' || Number.isNaN(Date.parse(raw.completedAt))) {
      throw new StorageError('VALIDATION', 'body.completedAt must be an ISO timestamp')
    }
  }
  if (raw.startedAt !== undefined) {
    if (typeof raw.startedAt !== 'string' || Number.isNaN(Date.parse(raw.startedAt))) {
      throw new StorageError('VALIDATION', 'body.startedAt must be an ISO timestamp')
    }
  }
  let player: PlayerProgress | undefined
  if (raw.player !== undefined) {
    player = validatePlayer(raw.player, 'body.player')
  }
  return {
    topicId: typeof raw.topicId === 'string' ? raw.topicId : undefined,
    total: raw.total as number,
    correctCount: raw.correctCount as number,
    xpEarned: raw.xpEarned as number,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : undefined,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : undefined,
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : undefined,
    player,
  }
}

function listSummary(student: StudentRecord) {
  return {
    id: student.id,
    profile: student.profile,
    updatedAt: student.updatedAt,
    hasActiveSession: student.activeSession !== null,
  }
}

function matchRoute(
  method: string,
  pathname: string,
):
  | { name: 'health' }
  | { name: 'students' }
  | { name: 'student'; id: string }
  | { name: 'profile'; id: string }
  | { name: 'progress'; id: string }
  | { name: 'session'; id: string }
  | { name: 'sessionComplete'; id: string }
  | { name: 'submitAnswer'; id: string }
  | null {
  if (method === 'GET' && pathname === '/api/health') return { name: 'health' }
  if (pathname === '/api/students') {
    if (method === 'GET' || method === 'POST') return { name: 'students' }
    return null
  }

  const studentMatch = /^\/api\/students\/([^/]+)$/.exec(pathname)
  if (studentMatch) {
    const id = decodeURIComponent(studentMatch[1])
    if (method === 'GET' || method === 'DELETE') return { name: 'student', id }
    return null
  }

  const profileMatch = /^\/api\/students\/([^/]+)\/profile$/.exec(pathname)
  if (profileMatch && method === 'PATCH') {
    return { name: 'profile', id: decodeURIComponent(profileMatch[1]) }
  }

  const progressMatch = /^\/api\/students\/([^/]+)\/progress$/.exec(pathname)
  if (progressMatch && (method === 'GET' || method === 'PUT')) {
    return { name: 'progress', id: decodeURIComponent(progressMatch[1]) }
  }

  const sessionCompleteMatch =
    /^\/api\/students\/([^/]+)\/session\/complete$/.exec(pathname)
  if (sessionCompleteMatch && method === 'POST') {
    return {
      name: 'sessionComplete',
      id: decodeURIComponent(sessionCompleteMatch[1]),
    }
  }

  const submitAnswerMatch =
    /^\/api\/students\/([^/]+)\/submit-answer$/.exec(pathname)
  if (submitAnswerMatch && method === 'POST') {
    return {
      name: 'submitAnswer',
      id: decodeURIComponent(submitAnswerMatch[1]),
    }
  }

  const sessionMatch = /^\/api\/students\/([^/]+)\/session$/.exec(pathname)
  if (
    sessionMatch &&
    (method === 'GET' || method === 'PUT' || method === 'DELETE')
  ) {
    return { name: 'session', id: decodeURIComponent(sessionMatch[1]) }
  }

  return null
}

export function createApiHandler(
  storage: MathValleyStorage,
  staticDir: string | null = null,
) {
  return async function handle(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    // CORS for local tooling; production serves the SPA from this process (same origin).
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const method = req.method ?? 'GET'
    const host = req.headers.host ?? 'localhost'
    let pathname: string
    try {
      pathname = new URL(req.url ?? '/', `http://${host}`).pathname
    } catch {
      sendError(res, 400, 'Invalid URL')
      return
    }

    // Non-/api paths: serve the built frontend when enabled; otherwise 404 (no FS probing).
    if (!pathname.startsWith('/api/')) {
      if (staticDir && tryServeStatic(req, res, staticDir, pathname)) {
        return
      }
      sendError(res, 404, 'Not found')
      return
    }

    const route = matchRoute(method, pathname)
    if (!route) {
      sendError(res, 404, 'Not found')
      return
    }

    try {
      if (route.name === 'health') {
        if (!isDatabaseOpen()) {
          sendJson(res, 503, { ok: false, error: 'Database unavailable' })
          return
        }
        try {
          getDatabase().prepare('SELECT 1 AS ok').get()
          sendJson(res, 200, {
            ok: true,
            schemaVersion: getSchemaVersion(),
          })
        } catch (err) {
          console.error('[math-valley-api] health check failed:', err)
          sendJson(res, 503, { ok: false, error: 'Database unavailable' })
        }
        return
      }

      await storage.ensureDataFile()

      if (route.name === 'students' && method === 'GET') {
        const data = await storage.loadData()
        sendJson(res, 200, {
          schemaVersion: data.schemaVersion,
          students: Object.values(data.students).map(listSummary),
          meta: data.meta,
        })
        return
      }

      if (route.name === 'students' && method === 'POST') {
        const body = await readJsonBody(req)
        const profile = parseCreateProfile(body)
        const id = newStudentId()
        const now = new Date().toISOString()
        const student: StudentRecord = {
          id,
          createdAt: now,
          updatedAt: now,
          profile: {
            name: profile.name,
            grade: profile.grade,
            avatarId: profile.avatarId,
          },
          player: playerFromCreatedState(profile),
          sessionHistory: [],
          activeSession: null,
        }

        const data = await storage.updateData((current) => {
          const nameKey = profile.name.trim().toLowerCase()
          const taken = Object.values(current.students).some(
            (existing) =>
              existing.profile.grade === profile.grade &&
              existing.profile.avatarId === profile.avatarId &&
              existing.profile.name.trim().toLowerCase() === nameKey,
          )
          if (taken) {
            throw new StorageError('CONFLICT', DUPLICATE_PROFILE_MESSAGE)
          }
          return {
            ...current,
            students: { ...current.students, [id]: student },
            meta: {
              activeStudentIdByDefault:
                current.meta.activeStudentIdByDefault ?? id,
            },
          }
        })

        sendJson(res, 201, data.students[id])
        return
      }

      if (route.name === 'student' && method === 'GET') {
        const data = await storage.loadData()
        const student = data.students[route.id]
        if (!student) {
          sendError(res, 404, `Student not found: ${route.id}`)
          return
        }
        sendJson(res, 200, student)
        return
      }

      if (route.name === 'student' && method === 'DELETE') {
        const data = await storage.updateData((current) => {
          if (!current.students[route.id]) {
            throw new StorageError('VALIDATION', `Student not found: ${route.id}`)
          }
          const students = { ...current.students }
          delete students[route.id]
          const active =
            current.meta.activeStudentIdByDefault === route.id
              ? null
              : current.meta.activeStudentIdByDefault
          return {
            ...current,
            students,
            meta: { activeStudentIdByDefault: active },
          }
        })
        sendJson(res, 200, { deleted: route.id, meta: data.meta })
        return
      }

      if (route.name === 'profile' && method === 'PATCH') {
        const body = await readJsonBody(req)
        const patch = parseProfilePatch(body)
        const data = await storage.updateData((current) => {
          const existing = current.students[route.id]
          if (!existing) {
            throw new StorageError('VALIDATION', `Student not found: ${route.id}`)
          }
          const profile = { ...existing.profile, ...patch }
          // Re-validate merged profile (incl. avatar allow-list).
          parseCreateProfile(profile)
          const nameKey = profile.name.trim().toLowerCase()
          const taken = Object.values(current.students).some(
            (other) =>
              other.id !== route.id &&
              other.profile.grade === profile.grade &&
              other.profile.avatarId === profile.avatarId &&
              other.profile.name.trim().toLowerCase() === nameKey,
          )
          if (taken) {
            throw new StorageError('CONFLICT', DUPLICATE_PROFILE_MESSAGE)
          }
          const updated: StudentRecord = {
            ...existing,
            profile: {
              name: profile.name,
              grade: profile.grade,
              avatarId: profile.avatarId,
            },
            updatedAt: new Date().toISOString(),
          }
          return {
            ...current,
            students: { ...current.students, [route.id]: updated },
          }
        })
        sendJson(res, 200, data.students[route.id])
        return
      }

      if (route.name === 'progress' && method === 'GET') {
        const data = await storage.loadData()
        const student = data.students[route.id]
        if (!student) {
          sendError(res, 404, `Student not found: ${route.id}`)
          return
        }
        sendJson(res, 200, {
          studentId: student.id,
          profile: student.profile,
          player: student.player,
          updatedAt: student.updatedAt,
        })
        return
      }

      if (route.name === 'progress' && method === 'PUT') {
        const body = await readJsonBody(req)
        const player = parseProgressBody(body)
        const data = await storage.updateData((current) => {
          const existing = current.students[route.id]
          if (!existing) {
            throw new StorageError('VALIDATION', `Student not found: ${route.id}`)
          }
          const updated: StudentRecord = {
            ...existing,
            player,
            updatedAt: new Date().toISOString(),
          }
          return {
            ...current,
            students: { ...current.students, [route.id]: updated },
          }
        })
        sendJson(res, 200, {
          studentId: route.id,
          player: data.students[route.id].player,
          updatedAt: data.students[route.id].updatedAt,
        })
        return
      }

      if (route.name === 'session' && method === 'GET') {
        const data = await storage.loadData()
        const student = data.students[route.id]
        if (!student) {
          sendError(res, 404, `Student not found: ${route.id}`)
          return
        }
        sendJson(res, 200, {
          studentId: student.id,
          activeSession: student.activeSession,
        })
        return
      }

      if (route.name === 'session' && method === 'PUT') {
        const body = await readJsonBody(req)
        const session = parseSessionBody(body)
        const data = await storage.updateData((current) => {
          const existing = current.students[route.id]
          if (!existing) {
            throw new StorageError('VALIDATION', `Student not found: ${route.id}`)
          }
          const updated: StudentRecord = {
            ...existing,
            activeSession: session,
            updatedAt: new Date().toISOString(),
          }
          return {
            ...current,
            students: { ...current.students, [route.id]: updated },
          }
        })
        sendJson(res, 200, {
          studentId: route.id,
          activeSession: data.students[route.id].activeSession,
        })
        return
      }

      if (route.name === 'session' && method === 'DELETE') {
        const data = await storage.updateData((current) => {
          const existing = current.students[route.id]
          if (!existing) {
            throw new StorageError('VALIDATION', `Student not found: ${route.id}`)
          }
          const updated: StudentRecord = {
            ...existing,
            activeSession: null,
            updatedAt: new Date().toISOString(),
          }
          return {
            ...current,
            students: { ...current.students, [route.id]: updated },
          }
        })
        sendJson(res, 200, {
          studentId: route.id,
          activeSession: data.students[route.id].activeSession,
        })
        return
      }

      if (route.name === 'sessionComplete' && method === 'POST') {
        const body = await readJsonBody(req)
        const complete = parseCompleteSessionBody(body)
        const data = await storage.updateData((current) => {
          const existing = current.students[route.id]
          if (!existing) {
            throw new StorageError('VALIDATION', `Student not found: ${route.id}`)
          }

          const now = new Date().toISOString()
          const active = existing.activeSession
          const historyEntry: SessionHistoryEntry = {
            id: complete.sessionId ?? active?.id ?? newSessionId(),
            topicId: complete.topicId ?? active?.topicId ?? 'unknown',
            startedAt: complete.startedAt ?? active?.startedAt ?? now,
            completedAt: complete.completedAt ?? now,
            total: complete.total,
            correctCount: complete.correctCount,
            xpEarned: complete.xpEarned,
          }

          const updated: StudentRecord = {
            ...existing,
            player: complete.player ?? existing.player,
            sessionHistory: [...existing.sessionHistory, historyEntry],
            activeSession: null,
            updatedAt: now,
          }
          return {
            ...current,
            students: { ...current.students, [route.id]: updated },
          }
        })

        const student = data.students[route.id]
        sendJson(res, 200, {
          studentId: route.id,
          activeSession: student.activeSession,
          sessionHistory: student.sessionHistory,
          player: student.player,
        })
        return
      }

      if (route.name === 'submitAnswer' && method === 'POST') {
        const body = await readJsonBody(req)
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          throw new StorageError('VALIDATION', 'body must be an object')
        }
        const raw = body as Record<string, unknown>
        if (typeof raw.submitted !== 'string') {
          throw new StorageError('VALIDATION', 'body.submitted must be a string')
        }

        let outcomeCorrect = false
        let outcomeResult: ReturnType<typeof applySubmitAnswer>['result'] | null =
          null

        const data = await storage.updateData((current) => {
          const existing = current.students[route.id]
          if (!existing) {
            throw new StorageError('VALIDATION', `Student not found: ${route.id}`)
          }
          const outcome = applySubmitAnswer(existing, {
            submitted: raw.submitted,
            question: raw.question,
            topicId: typeof raw.topicId === 'string' ? raw.topicId : undefined,
          })
          outcomeCorrect = outcome.correct
          outcomeResult = outcome.result
          return {
            ...current,
            students: { ...current.students, [route.id]: outcome.student },
          }
        })

        const student = data.students[route.id]
        sendJson(res, 200, {
          studentId: route.id,
          correct: outcomeCorrect,
          player: student.player,
          activeSession: student.activeSession,
          newlyMasteredTopicId: outcomeResult?.newlyMasteredTopicId ?? null,
          newlyUnlockedTopicId: outcomeResult?.newlyUnlockedTopicId ?? null,
          contentLevelAdvanced: outcomeResult?.contentLevelAdvanced ?? false,
          contentLevel: outcomeResult?.contentLevel ?? student.player.contentLevel,
        })
        return
      }

      sendError(res, 404, 'Not found')
    } catch (err) {
      if (err instanceof StorageError) {
        let status = 500
        if (err.code === 'CONFLICT') {
          status = 409
        } else if (err.code === 'MALFORMED_JSON' || err.code === 'VALIDATION') {
          status = err.message.includes('not found') ? 404 : 400
        }
        sendError(res, status, err.message, { code: err.code })
        return
      }
      console.error('[math-valley-api]', err)
      sendError(res, 500, 'Internal server error')
    }
  }
}

export type StartedServer = {
  server: Server
  port: number
  host: string
  storage: MathValleyStorage
  close: () => Promise<void>
}

export async function startApiServer(
  options: ApiServerOptions = {},
): Promise<StartedServer> {
  // Open SQLite for health and student data.
  if (!isDatabaseOpen()) {
    openDatabase(process.env.DB_PATH?.trim() || undefined)
  }

  if (!options.skipMigrate) {
    // Exits the process if a migration fails or DB is newer than code.
    await migrate()
  }

  if (!options.skipBackupScheduler) {
    try {
      await backupIfStale()
      startBackupScheduler()
    } catch (err) {
      console.error('[math-valley-db] Startup backup failed:', err)
    }
  }

  if (!options.skipPidFile) {
    writeServerPid()
  }

  const storage = options.storage ?? createAppStorage()
  const host =
    options.host ??
    (process.env.HOST?.trim() || '127.0.0.1')
  const port = options.port ?? (Number(process.env.PORT) || 3001)
  const staticDir = resolveStaticDir(process.env, options.staticDir)
  if (staticDir) {
    console.log(`Static files:   ${staticDir}`)
  }
  const handler = createApiHandler(storage, staticDir)
  const server = createServer((req, res) => {
    void handler(req, res)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolve())
  })

  return {
    server,
    port,
    host,
    storage,
    close: () =>
      new Promise((resolve, reject) => {
        stopBackupScheduler()
        if (!options.skipPidFile) clearServerPid()
        server.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}
