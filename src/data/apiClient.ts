/**
 * Thin client for the Math Valley persistence API (Vite proxies /api → :3001).
 */
import type { ActiveSessionState } from './activeSession.ts'
import type { AvatarId } from './avatars.ts'
import type { Grade, Profile } from './profile.ts'
import {
  playerStateFromRemoteParts,
  type PlayerState,
} from './playerState.ts'

export const ACTIVE_STUDENT_KEY = 'math-valley-active-student-id'

export type ApiStudentSummary = {
  id: string
  profile: Profile
  updatedAt: string
  hasActiveSession: boolean
}

export type ApiPlayerProgress = {
  topicProgress: unknown
  studentProgress: unknown
  contentLevel: Grade
  xp: number
  zoneXp: unknown
  unlockedZones: unknown
}

export type ApiStudentRecord = {
  id: string
  createdAt: string
  updatedAt: string
  profile: Profile
  player: ApiPlayerProgress
  sessionHistory: unknown[]
  activeSession: unknown | null
}

export type CompleteSessionPayload = {
  topicId?: string
  total: number
  correctCount: number
  xpEarned: number
  completedAt?: string
  startedAt?: string
  sessionId?: string
  player?: ApiPlayerProgress
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function getActiveStudentId(): string | null {
  try {
    const id = localStorage.getItem(ACTIVE_STUDENT_KEY)
    return id && id.trim() ? id.trim() : null
  } catch {
    return null
  }
}

export function setActiveStudentId(id: string): void {
  localStorage.setItem(ACTIVE_STUDENT_KEY, id)
}

export function clearActiveStudentId(): void {
  localStorage.removeItem(ACTIVE_STUDENT_KEY)
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`
  let code: string | undefined
  try {
    const body = (await res.json()) as { error?: string; details?: { code?: string } }
    if (typeof body.error === 'string') message = body.error
    if (body.details && typeof body.details.code === 'string') {
      code = body.details.code
    }
  } catch {
    // ignore
  }
  return new ApiError(message, res.status, code)
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(
      'Could not reach the Math Valley server. Is it running? Try npm run dev.',
      0,
    )
  }

  if (!res.ok) throw await parseError(res)

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function checkApiHealth(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/health')
}

export async function listStudents(): Promise<{
  schemaVersion: number
  students: ApiStudentSummary[]
  meta: { activeStudentIdByDefault: string | null }
}> {
  return apiFetch('/api/students')
}

export async function getStudent(id: string): Promise<ApiStudentRecord> {
  return apiFetch(`/api/students/${encodeURIComponent(id)}`)
}

export async function createStudent(profile: {
  name: string
  grade: Grade
  avatarId: AvatarId
}): Promise<ApiStudentRecord> {
  return apiFetch('/api/students', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
}

/** Find students with the same grade + avatar (resume key). */
export function findStudentsByGradeAvatar(
  students: ApiStudentSummary[],
  grade: Grade,
  avatarId: AvatarId,
): ApiStudentSummary[] {
  return students.filter(
    (s) => s.profile.grade === grade && s.profile.avatarId === avatarId,
  )
}

export function normalizeAdventurerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Resume or create by grade + avatar.
 * - 0 matches → create (name required)
 * - 1+ matches → name required:
 *   - matching name → resume that student
 *   - new name → create another adventurer on this grade+avatar
 */
export async function enterByGradeAvatar(args: {
  grade: Grade
  avatarId: AvatarId
  name?: string
}): Promise<ApiStudentRecord> {
  const listed = await listStudents()
  const matches = findStudentsByGradeAvatar(
    listed.students,
    args.grade,
    args.avatarId,
  )

  const typed = args.name?.trim() ?? ''

  if (matches.length >= 1) {
    if (!typed) {
      throw new ApiError(
        matches.length === 1
          ? 'Type your name to continue — or a new name to create another adventurer with this avatar.'
          : 'More than one adventurer uses this grade and avatar. Type your name to continue.',
        409,
        'NAME_REQUIRED',
      )
    }

    const normalized = normalizeAdventurerName(typed)
    const named = matches.filter(
      (s) => normalizeAdventurerName(s.profile.name) === normalized,
    )
    if (named.length === 1) {
      const student = await getStudent(named[0].id)
      setActiveStudentId(student.id)
      return student
    }
    if (named.length > 1) {
      throw new ApiError(
        'More than one adventurer matches that name, grade, and avatar. Ask a teacher for help.',
        409,
        'AMBIGUOUS',
      )
    }

    // Name not found among matches → create a new profile on this grade+avatar.
    const created = await createStudent({
      name: typed,
      grade: args.grade,
      avatarId: args.avatarId,
    })
    setActiveStudentId(created.id)
    return created
  }

  // No match — create a new student (name required).
  if (!typed) {
    throw new ApiError(
      'New adventurer — type your name to continue.',
      400,
      'NAME_REQUIRED',
    )
  }

  const created = await createStudent({
    name: typed,
    grade: args.grade,
    avatarId: args.avatarId,
  })
  setActiveStudentId(created.id)
  return created
}

export async function deleteStudent(id: string): Promise<void> {
  await apiFetch(`/api/students/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function playerToProgressPayload(player: PlayerState): ApiPlayerProgress {
  return {
    topicProgress: player.topicProgress,
    studentProgress: player.studentProgress,
    contentLevel: player.contentLevel,
    xp: player.xp,
    zoneXp: player.zoneXp,
    unlockedZones: player.unlockedZones,
  }
}

export async function saveStudentProgress(
  studentId: string,
  player: PlayerState,
): Promise<void> {
  await apiFetch(`/api/students/${encodeURIComponent(studentId)}/progress`, {
    method: 'PUT',
    body: JSON.stringify(playerToProgressPayload(player)),
  })
}

/** Serialize progress writes so out-of-order responses cannot clobber newer state. */
let progressSaveQueue: Promise<void> = Promise.resolve()

export function queueSaveStudentProgress(
  studentId: string,
  player: PlayerState,
): Promise<void> {
  const run = progressSaveQueue.then(() =>
    saveStudentProgress(studentId, player),
  )
  progressSaveQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function saveActiveSession(
  studentId: string,
  session: ActiveSessionState,
): Promise<void> {
  await apiFetch(`/api/students/${encodeURIComponent(studentId)}/session`, {
    method: 'PUT',
    body: JSON.stringify(session),
  })
}

let sessionSaveQueue: Promise<void> = Promise.resolve()

export function queueSaveActiveSession(
  studentId: string,
  session: ActiveSessionState,
): Promise<void> {
  const run = sessionSaveQueue.then(() => saveActiveSession(studentId, session))
  sessionSaveQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function completeStudentSession(
  studentId: string,
  payload: CompleteSessionPayload,
): Promise<void> {
  await apiFetch(
    `/api/students/${encodeURIComponent(studentId)}/session/complete`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

/** Clear an unfinished session without inventing mastery progress. */
export async function clearActiveSession(studentId: string): Promise<void> {
  await apiFetch(`/api/students/${encodeURIComponent(studentId)}/session`, {
    method: 'DELETE',
  })
}

export function studentRecordToPlayerState(
  student: ApiStudentRecord,
): PlayerState {
  const state = playerStateFromRemoteParts(student.profile, student.player)
  if (!state) {
    throw new ApiError(
      'Saved student data looks invalid and could not be loaded.',
      500,
      'VALIDATION',
    )
  }
  return state
}
