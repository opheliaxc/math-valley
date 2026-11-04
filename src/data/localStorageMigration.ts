/**
 * Explicit localStorage → server API migration.
 * Never deletes browser data until the user confirms a successful import.
 */
import {
  createStudent,
  deleteStudent,
  getStudent,
  saveStudentProgress,
  setActiveStudentId,
  studentRecordToPlayerState,
} from './apiClient.ts'
import {
  LEGACY_PROFILE_STORAGE_KEY,
  PLAYER_STORAGE_KEY,
  peekLocalStorageSave,
  type LocalStoragePeek,
  type PlayerState,
} from './playerState.ts'

export const MIGRATION_FINGERPRINT_KEY = 'math-valley-ls-migrated-fingerprint'
export const MIGRATION_DISMISSED_KEY = 'math-valley-ls-migration-dismissed-fingerprint'

function fingerprint(raw: string): string {
  // Short stable id — not cryptographic; just enough to skip re-prompting.
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0
  }
  return `${raw.length}:${hash.toString(16)}`
}

function readFlag(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeFlag(key: string, value: string): void {
  localStorage.setItem(key, value)
}

export function describeLocalPeek(peek: LocalStoragePeek): {
  title: string
  lines: string[]
} {
  if (peek.kind === 'unreadable') {
    return {
      title: 'Browser save found, but it can’t be imported',
      lines: [peek.reason, 'Your browser copy was left unchanged.'],
    }
  }

  if (peek.kind === 'profile-only') {
    return {
      title: 'Older browser profile found',
      lines: [
        `Name: ${peek.profile.name}`,
        `Grade: ${peek.profile.grade}`,
        `Avatar: ${peek.profile.avatarId}`,
        'This save is profile-only (no practice history). Import creates a fresh progress start for that profile.',
      ],
    }
  }

  const { state } = peek
  const unlocked = state.unlockedZones.length
  const standardsTouched = Object.values(state.studentProgress.standards).filter(
    (row) =>
      row.beginner.attempts.length > 0 ||
      row.advanced.attempts.length > 0 ||
      row.beginner.mastered ||
      row.advanced.mastered,
  ).length

  return {
    title: 'Browser save found',
    lines: [
      `Name: ${state.profile.name}`,
      `Grade: ${state.profile.grade}`,
      `Content level: ${state.contentLevel}`,
      `XP: ${state.xp}`,
      `Unlocked zones: ${unlocked}`,
      `Standards with attempts/mastery: ${standardsTouched}`,
      'Import copies this progress into the project JSON file. Standard codes stay the same; island keys use the same domain remap the app already uses (not unrelated standards).',
    ],
  }
}

/** Whether we should pause startup and ask about migrating this browser save. */
export function shouldOfferLocalMigration(
  peek: LocalStoragePeek | null = peekLocalStorageSave(),
): boolean {
  if (!peek) return false
  if (peek.kind === 'unreadable') {
    const fp = fingerprint(peek.raw)
    return readFlag(MIGRATION_DISMISSED_KEY) !== fp
  }
  const fp = fingerprint(peek.raw)
  if (readFlag(MIGRATION_FINGERPRINT_KEY) === fp) return false
  if (readFlag(MIGRATION_DISMISSED_KEY) === fp) return false
  return true
}

export function dismissLocalMigrationOffer(peek: LocalStoragePeek): void {
  writeFlag(MIGRATION_DISMISSED_KEY, fingerprint(peek.raw))
}

export function markLocalMigrationImported(peek: LocalStoragePeek): void {
  writeFlag(MIGRATION_FINGERPRINT_KEY, fingerprint(peek.raw))
}

/**
 * Import browser save into the server store.
 * On failure: throws and leaves localStorage untouched.
 * On success: marks fingerprint; does NOT delete browser keys yet.
 */
export async function importLocalSaveToServer(peek: LocalStoragePeek): Promise<{
  studentId: string
  player: PlayerState
}> {
  if (peek.kind === 'unreadable') {
    throw new Error(peek.reason)
  }

  if (peek.kind === 'profile-only') {
    const student = await createStudent(peek.profile)
    markLocalMigrationImported(peek)
    setActiveStudentId(student.id)
    return {
      studentId: student.id,
      player: studentRecordToPlayerState(student),
    }
  }

  const student = await createStudent(peek.state.profile)
  try {
    await saveStudentProgress(student.id, peek.state)
  } catch (err) {
    // Roll back the empty server shell; never touch browser storage here.
    try {
      await deleteStudent(student.id)
    } catch {
      // ignore rollback failure
    }
    throw new Error(
      err instanceof Error
        ? `Progress import failed: ${err.message}. Your browser save was not deleted.`
        : 'Progress import failed. Your browser save was not deleted.',
    )
  }

  const refreshed = await getStudent(student.id)
  const player = studentRecordToPlayerState(refreshed)
  markLocalMigrationImported(peek)
  setActiveStudentId(student.id)
  return { studentId: student.id, player }
}

/** Only call after a successful import the user confirmed. */
export function removeMigratedLocalStorageCopy(): void {
  localStorage.removeItem(PLAYER_STORAGE_KEY)
  localStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY)
}
