import type { AvatarId } from './avatars.ts'
import {
  createInitialTopicProgress,
  type TopicProgress,
  type TopicProgressMap,
} from './difficulty.ts'
import {
  LEGACY_TOPIC_IDS,
  migrateStudentProgressToDomains,
} from './migrateDomainProgress.ts'
import { createInitialStudentProgress } from './practiceSession.ts'
import type { Grade, Profile } from './profile.ts'
import type { StudentProgress } from './studentProgress.ts'
import { TOPICS, type TopicId } from './topics.ts'
import { getZoneTopicIdsForGrade } from './curriculum-map.ts'
import { domainIsPracticeable } from './curriculum-map.ts'
import {
  createInitialUnlockedZones,
  createInitialZoneXp,
  type ZoneId,
} from './zones.ts'

/** Best-effort remap of legacy difficulty-tier rows onto domain keys. */
const LEGACY_DIFFICULTY_TOPIC_MAP: Record<string, TopicId> = {
  'addition-subtraction': 'operations-algebraic-thinking',
  'multiplication-division': 'operations-algebraic-thinking',
  'word-problems': 'operations-algebraic-thinking',
  'time-money-measurement': 'measurement-data',
}

export type PlayerState = {
  profile: Profile
  topicProgress: TopicProgressMap
  /** Curriculum mastery / standard attempt logs (question-generator integration). */
  studentProgress: StudentProgress
  /**
   * Active curriculum band (1–4). Starts equal to profile.grade; can advance
   * independently. Drives standards/zones — not the same as school grade.
   */
  contentLevel: Grade
  xp: number
  zoneXp: Record<TopicId, number>
  unlockedZones: ZoneId[]
}

/** Browser key for the full PlayerState blob (pre-server persistence). */
export const PLAYER_STORAGE_KEY = 'math-valley-player'

/** Legacy key from early profile-only saves. */
export const LEGACY_PROFILE_STORAGE_KEY = 'math-valley-profile'

const STORAGE_KEY = PLAYER_STORAGE_KEY
const LEGACY_PROFILE_KEY = LEGACY_PROFILE_STORAGE_KEY

export type LocalStoragePeek =
  | { kind: 'player'; raw: string; state: PlayerState }
  | { kind: 'profile-only'; raw: string; profile: Profile }
  | { kind: 'unreadable'; source: 'player' | 'profile'; raw: string; reason: string }

/**
 * Read browser saves without writing or deleting anything.
 * Used for explicit server migration (Step 9).
 */
export function peekLocalStorageSave(): LocalStoragePeek | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw)
        const state = tryParsePlayerState(parsed)
        if (state) return { kind: 'player', raw, state }
        return {
          kind: 'unreadable',
          source: 'player',
          raw,
          reason:
            'Browser save JSON is not a valid Math Valley player profile/progress blob.',
        }
      } catch {
        return {
          kind: 'unreadable',
          source: 'player',
          raw,
          reason: 'Browser save is not valid JSON.',
        }
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_PROFILE_KEY)
    if (!legacyRaw) return null
    try {
      const legacyParsed: unknown = JSON.parse(legacyRaw)
      if (!isProfile(legacyParsed)) {
        return {
          kind: 'unreadable',
          source: 'profile',
          raw: legacyRaw,
          reason: 'Legacy profile save is missing a valid name, grade, or avatar.',
        }
      }
      return { kind: 'profile-only', raw: legacyRaw, profile: legacyParsed }
    } catch {
      return {
        kind: 'unreadable',
        source: 'profile',
        raw: legacyRaw,
        reason: 'Legacy profile save is not valid JSON.',
      }
    }
  } catch {
    return null
  }
}

function isGrade(value: unknown): value is Grade {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isAvatarId(value: unknown): value is AvatarId {
  return (
    value === 'ember' ||
    value === 'sage' ||
    value === 'sky' ||
    value === 'gold' ||
    value === 'violet' ||
    value === 'rose'
  )
}

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    isGrade(candidate.grade) &&
    isAvatarId(candidate.avatarId)
  )
}

function isTopicProgress(value: unknown): value is TopicProgress {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.tierIndex === 'number' &&
    Number.isInteger(candidate.tierIndex) &&
    candidate.tierIndex >= 0 &&
    typeof candidate.correctStreak === 'number' &&
    Number.isInteger(candidate.correctStreak) &&
    candidate.correctStreak >= 0 &&
    typeof candidate.incorrectStreak === 'number' &&
    Number.isInteger(candidate.incorrectStreak) &&
    candidate.incorrectStreak >= 0
  )
}

function normalizeTopicProgressMap(
  value: unknown,
  grade: Grade,
): TopicProgressMap {
  const next = createInitialTopicProgress(grade)
  if (!value || typeof value !== 'object') return next
  const raw = value as Record<string, unknown>

  for (const topic of TOPICS) {
    if (isTopicProgress(raw[topic])) {
      next[topic] = raw[topic]
    }
  }

  // Legacy difficulty rows → domain keys when the domain slot is still default-empty.
  for (const legacyId of LEGACY_TOPIC_IDS) {
    const mapped = LEGACY_DIFFICULTY_TOPIC_MAP[legacyId]
    if (!mapped || !isTopicProgress(raw[legacyId])) continue
    const current = next[mapped]
    const incoming = raw[legacyId]
    // Prefer the legacy row with more activity if domain slot looks unused.
    if (
      current.correctStreak === 0 &&
      current.incorrectStreak === 0 &&
      (incoming.correctStreak > 0 ||
        incoming.incorrectStreak > 0 ||
        incoming.tierIndex !== current.tierIndex)
    ) {
      next[mapped] = incoming
    }
  }

  return next
}

function normalizeZoneXp(value: unknown): Record<TopicId, number> {
  const zoneXp = createInitialZoneXp()
  if (!value || typeof value !== 'object') return zoneXp
  const raw = value as Record<string, unknown>

  for (const topic of TOPICS) {
    const amount = raw[topic]
    if (typeof amount === 'number' && amount >= 0) zoneXp[topic] = amount
  }

  for (const legacyId of LEGACY_TOPIC_IDS) {
    const mapped = LEGACY_DIFFICULTY_TOPIC_MAP[legacyId]
    const amount = raw[legacyId]
    if (!mapped || typeof amount !== 'number' || amount < 0) continue
    zoneXp[mapped] = Math.max(zoneXp[mapped], amount)
  }

  return zoneXp
}

function normalizePlayerState(value: {
  profile: Profile
  topicProgress: unknown
  studentProgress?: unknown
  contentLevel?: unknown
  xp?: unknown
  zoneXp?: unknown
  unlockedZones?: unknown
}): PlayerState {
  const xp = typeof value.xp === 'number' && value.xp >= 0 ? value.xp : 0

  let studentProgress = normalizeStudentProgress(
    value.studentProgress,
    value.profile,
  )
  const contentLevel = isGrade(value.contentLevel)
    ? value.contentLevel
    : studentProgress.contentLevel

  if (studentProgress.contentLevel !== contentLevel) {
    studentProgress = migrateStudentProgressToDomains({
      ...studentProgress,
      contentLevel,
    })
  }

  const topicProgress = normalizeTopicProgressMap(
    value.topicProgress,
    contentLevel,
  )
  const zoneXp = normalizeZoneXp(value.zoneXp)

  const firstZone = createInitialUnlockedZones(contentLevel)[0]
  const fromMastery = getZoneTopicIdsForGrade(contentLevel).filter((id) => {
    const topic = studentProgress.topics[id]
    return topic?.status === 'unlocked' || topic?.status === 'mastered'
  })
  const unlockedZones = [
    ...new Set([...(firstZone ? [firstZone] : []), ...fromMastery]),
  ]

  return {
    profile: value.profile,
    topicProgress,
    studentProgress,
    contentLevel,
    xp,
    zoneXp,
    unlockedZones,
  }
}

function normalizeStudentProgress(
  value: unknown,
  profile: Profile,
): StudentProgress {
  const profileId =
    profile.name.trim().toLowerCase().replace(/\s+/g, '-') || 'player'
  if (!value || typeof value !== 'object') {
    return createInitialStudentProgress(profileId, profile.grade)
  }
  const candidate = value as Record<string, unknown>
  const legacyLevel = candidate.contentLevel ?? candidate.currentGrade
  const contentLevel = isGrade(legacyLevel) ? legacyLevel : profile.grade

  if (
    typeof candidate.profileId !== 'string' ||
    candidate.topics === null ||
    typeof candidate.topics !== 'object' ||
    candidate.standards === null ||
    typeof candidate.standards !== 'object' ||
    !Array.isArray(candidate.missedQuestions)
  ) {
    return createInitialStudentProgress(profileId, contentLevel)
  }

  const base: StudentProgress = {
    profileId: candidate.profileId,
    contentLevel,
    topics: candidate.topics as StudentProgress['topics'],
    standards: candidate.standards as StudentProgress['standards'],
    missedQuestions:
      candidate.missedQuestions as StudentProgress['missedQuestions'],
  }

  // Phase C: regroup islands; keep standards / missedQuestions as-is.
  return migrateStudentProgressToDomains(base)
}

function tryParsePlayerState(value: unknown): PlayerState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (!isProfile(candidate.profile)) return null
  // topicProgress may use legacy keys — normalized inside normalizePlayerState.
  if (candidate.topicProgress !== null && typeof candidate.topicProgress !== 'object') {
    return null
  }
  return normalizePlayerState({
    profile: candidate.profile,
    topicProgress: candidate.topicProgress,
    studentProgress: candidate.studentProgress,
    contentLevel: candidate.contentLevel,
    xp: candidate.xp,
    zoneXp: candidate.zoneXp,
    unlockedZones: candidate.unlockedZones,
  })
}

/** Build PlayerState from API student profile + player progress blob. */
export function playerStateFromRemoteParts(
  profile: unknown,
  player: unknown,
): PlayerState | null {
  if (!player || typeof player !== 'object') return null
  const p = player as Record<string, unknown>
  return tryParsePlayerState({
    profile,
    topicProgress: p.topicProgress,
    studentProgress: p.studentProgress,
    contentLevel: p.contentLevel,
    xp: p.xp,
    zoneXp: p.zoneXp,
    unlockedZones: p.unlockedZones,
  })
}

export function createPlayerState(profile: Profile): PlayerState {
  const profileId =
    profile.name.trim().toLowerCase().replace(/\s+/g, '-') || 'player'
  const contentLevel = profile.grade
  return {
    profile,
    topicProgress: createInitialTopicProgress(profile.grade),
    studentProgress: createInitialStudentProgress(profileId, contentLevel),
    contentLevel,
    xp: 0,
    zoneXp: createInitialZoneXp(),
    unlockedZones: createInitialUnlockedZones(contentLevel),
  }
}

export function savePlayerState(state: PlayerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearPlayerState(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_PROFILE_KEY)
}

export function loadPlayerState(): PlayerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      const state = tryParsePlayerState(parsed)
      if (state) {
        // Persist migration of older Step 4/5 saves missing XP fields
        savePlayerState(state)
        return state
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_PROFILE_KEY)
    if (!legacyRaw) return null
    const legacyParsed: unknown = JSON.parse(legacyRaw)
    if (!isProfile(legacyParsed)) return null

    const migrated = createPlayerState(legacyParsed)
    savePlayerState(migrated)
    localStorage.removeItem(LEGACY_PROFILE_KEY)
    return migrated
  } catch {
    return null
  }
}

export function getTopicProgress(
  state: PlayerState,
  topic: TopicId,
): TopicProgress {
  return state.topicProgress[topic]
}

export function isZoneUnlocked(state: PlayerState, zoneId: ZoneId): boolean {
  const topic = state.studentProgress.topics[zoneId]
  if (topic) {
    return topic.status === 'unlocked' || topic.status === 'mastered'
  }
  return state.unlockedZones.includes(zoneId)
}

/**
 * Whether the student can enter this island for practice.
 * Requires mastery unlock plus practiceable generators at this content level.
 */
export function isZoneEnterable(state: PlayerState, zoneId: ZoneId): boolean {
  if (!domainIsPracticeable(zoneId, state.contentLevel)) return false
  return isZoneUnlocked(state, zoneId)
}
