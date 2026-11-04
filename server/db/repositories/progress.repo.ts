/**
 * Progress repository — topic/standard/zone progress + missed questions.
 * Reconstructs / persists the player progress blob fields (without profile).
 */
import type { Kysely, Transaction } from 'kysely'
import type {
  DB,
  GradeLevel,
  MasteryDifficulty,
  StandardStatus,
  TopicUnlockStatus,
} from '../schema-types.ts'
import {
  deleteAttemptsForStudent,
  insertAttemptsInOrder,
  recentWindow,
  type AttemptInsert,
} from './attempts.repo.ts'

export type ProgressDb = Kysely<DB> | Transaction<DB>

export type AttemptLogEntry = {
  questionId: string
  correct: boolean
  timestamp: number
}

export type DifficultyProgressBlob = {
  attempts: AttemptLogEntry[]
  mastered: boolean
}

export type StandardProgressBlob = {
  standardCode: string
  beginner: DifficultyProgressBlob
  advanced: DifficultyProgressBlob
  status: StandardStatus
}

export type TopicProgressBlob = {
  topicId: string
  contentLevel: GradeLevel
  standardOrder: string[]
  activeStandardIndex: number
  status: TopicUnlockStatus
}

export type MissedQuestionBlob = {
  standardCode: string
  difficulty: MasteryDifficulty
  prompt: string
  timestamp: number
}

export type StudentProgressBlob = {
  profileId: string
  contentLevel: GradeLevel
  topics: Record<string, TopicProgressBlob>
  standards: Record<string, StandardProgressBlob>
  missedQuestions: MissedQuestionBlob[]
}

export type TierProgressBlob = {
  tierIndex: number
  correctStreak: number
  incorrectStreak: number
}

export type PlayerProgressParts = {
  topicProgress: Record<string, TierProgressBlob>
  studentProgress: StudentProgressBlob
  contentLevel: GradeLevel
  xp: number
  zoneXp: Record<string, number>
  unlockedZones: string[]
}

function isGrade(value: unknown): value is GradeLevel {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isDifficulty(value: unknown): value is MasteryDifficulty {
  return value === 'beginner' || value === 'advanced'
}

function isTopicStatus(value: unknown): value is TopicUnlockStatus {
  return value === 'locked' || value === 'unlocked' || value === 'mastered'
}

function isStandardStatus(value: unknown): value is StandardStatus {
  return value === 'locked' || value === 'active' || value === 'mastered'
}

function emptyDifficulty(): DifficultyProgressBlob {
  return { attempts: [], mastered: false }
}

function timestampToIso(timestamp: number): string {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) {
    return new Date(0).toISOString()
  }
  return d.toISOString()
}

function isoToTimestamp(iso: string): number {
  const n = Date.parse(iso)
  return Number.isNaN(n) ? 0 : n
}

/** Parse the opaque player.* fields from the JSON/API shape into typed parts. */
export function parsePlayerProgressParts(
  studentId: string,
  player: {
    topicProgress: unknown
    studentProgress: unknown
    contentLevel: unknown
    xp: unknown
    zoneXp: unknown
    unlockedZones: unknown
  },
): PlayerProgressParts {
  if (!isGrade(player.contentLevel)) {
    throw new Error('player.contentLevel must be 1–4')
  }
  if (typeof player.xp !== 'number' || !Number.isFinite(player.xp) || player.xp < 0) {
    throw new Error('player.xp must be a non-negative number')
  }

  const topicProgress: Record<string, TierProgressBlob> = {}
  if (player.topicProgress && typeof player.topicProgress === 'object') {
    for (const [topicId, raw] of Object.entries(
      player.topicProgress as Record<string, unknown>,
    )) {
      if (!raw || typeof raw !== 'object') continue
      const t = raw as Record<string, unknown>
      topicProgress[topicId] = {
        tierIndex: typeof t.tierIndex === 'number' ? t.tierIndex : 0,
        correctStreak: typeof t.correctStreak === 'number' ? t.correctStreak : 0,
        incorrectStreak:
          typeof t.incorrectStreak === 'number' ? t.incorrectStreak : 0,
      }
    }
  }

  const zoneXp: Record<string, number> = {}
  if (player.zoneXp && typeof player.zoneXp === 'object') {
    for (const [topicId, amount] of Object.entries(
      player.zoneXp as Record<string, unknown>,
    )) {
      if (typeof amount === 'number' && amount >= 0) zoneXp[topicId] = amount
    }
  }

  const unlockedZones = Array.isArray(player.unlockedZones)
    ? player.unlockedZones.filter((z): z is string => typeof z === 'string')
    : []

  const spRaw =
    player.studentProgress && typeof player.studentProgress === 'object'
      ? (player.studentProgress as Record<string, unknown>)
      : {}

  const contentLevel = isGrade(spRaw.contentLevel)
    ? spRaw.contentLevel
    : player.contentLevel

  const topics: Record<string, TopicProgressBlob> = {}
  if (spRaw.topics && typeof spRaw.topics === 'object') {
    for (const [topicId, raw] of Object.entries(
      spRaw.topics as Record<string, unknown>,
    )) {
      if (!raw || typeof raw !== 'object') continue
      const t = raw as Record<string, unknown>
      const order = Array.isArray(t.standardOrder)
        ? t.standardOrder.filter((c): c is string => typeof c === 'string')
        : []
      const status = isTopicStatus(t.status) ? t.status : 'locked'
      const level = isGrade(t.contentLevel) ? t.contentLevel : contentLevel
      topics[topicId] = {
        topicId: typeof t.topicId === 'string' ? t.topicId : topicId,
        contentLevel: level,
        standardOrder: order,
        activeStandardIndex:
          typeof t.activeStandardIndex === 'number' ? t.activeStandardIndex : 0,
        status,
      }
    }
  }

  const standards: Record<string, StandardProgressBlob> = {}
  if (spRaw.standards && typeof spRaw.standards === 'object') {
    for (const [code, raw] of Object.entries(
      spRaw.standards as Record<string, unknown>,
    )) {
      if (!raw || typeof raw !== 'object') continue
      const s = raw as Record<string, unknown>
      standards[code] = {
        standardCode: typeof s.standardCode === 'string' ? s.standardCode : code,
        status: isStandardStatus(s.status) ? s.status : 'active',
        beginner: parseDifficulty(s.beginner),
        advanced: parseDifficulty(s.advanced),
      }
    }
  }

  const missedQuestions: MissedQuestionBlob[] = []
  if (Array.isArray(spRaw.missedQuestions)) {
    for (const raw of spRaw.missedQuestions) {
      if (!raw || typeof raw !== 'object') continue
      const m = raw as Record<string, unknown>
      if (
        typeof m.standardCode !== 'string' ||
        !isDifficulty(m.difficulty) ||
        typeof m.prompt !== 'string' ||
        typeof m.timestamp !== 'number'
      ) {
        continue
      }
      missedQuestions.push({
        standardCode: m.standardCode,
        difficulty: m.difficulty,
        prompt: m.prompt,
        timestamp: m.timestamp,
      })
    }
  }

  return {
    topicProgress,
    studentProgress: {
      profileId:
        typeof spRaw.profileId === 'string' ? spRaw.profileId : studentId,
      contentLevel,
      topics,
      standards,
      missedQuestions,
    },
    contentLevel: player.contentLevel,
    xp: player.xp,
    zoneXp,
    unlockedZones,
  }
}

function parseDifficulty(raw: unknown): DifficultyProgressBlob {
  if (!raw || typeof raw !== 'object') return emptyDifficulty()
  const d = raw as Record<string, unknown>
  const attempts: AttemptLogEntry[] = []
  if (Array.isArray(d.attempts)) {
    for (const a of d.attempts) {
      if (!a || typeof a !== 'object') continue
      const entry = a as Record<string, unknown>
      if (typeof entry.questionId !== 'string') continue
      if (typeof entry.correct !== 'boolean') continue
      if (typeof entry.timestamp !== 'number') continue
      attempts.push({
        questionId: entry.questionId,
        correct: entry.correct,
        timestamp: entry.timestamp,
      })
    }
  }
  return {
    attempts,
    mastered: d.mastered === true,
  }
}

/** Clear and rewrite all progress-related rows for one student. */
export async function replacePlayerProgress(
  db: ProgressDb,
  studentId: string,
  player: {
    topicProgress: unknown
    studentProgress: unknown
    contentLevel: unknown
    xp: unknown
    zoneXp: unknown
    unlockedZones: unknown
  },
): Promise<PlayerProgressParts> {
  const parts = parsePlayerProgressParts(studentId, player)
  const now = new Date().toISOString()

  await db
    .deleteFrom('topic_tier_progress')
    .where('student_id', '=', studentId)
    .execute()
  await db.deleteFrom('zone_xp').where('student_id', '=', studentId).execute()
  await db
    .deleteFrom('unlocked_zones')
    .where('student_id', '=', studentId)
    .execute()
  await db
    .deleteFrom('topic_progress')
    .where('student_id', '=', studentId)
    .execute()
  await db
    .deleteFrom('standard_meta')
    .where('student_id', '=', studentId)
    .execute()
  await db
    .deleteFrom('standard_progress')
    .where('student_id', '=', studentId)
    .execute()
  await db
    .deleteFrom('missed_questions')
    .where('student_id', '=', studentId)
    .execute()
  await deleteAttemptsForStudent(db, studentId)

  await db
    .updateTable('students')
    .set({
      content_level: parts.contentLevel,
      xp: parts.xp,
      updated_at: now,
    })
    .where('id', '=', studentId)
    .execute()

  for (const [topicId, tier] of Object.entries(parts.topicProgress)) {
    await db
      .insertInto('topic_tier_progress')
      .values({
        student_id: studentId,
        topic_id: topicId,
        tier_index: tier.tierIndex,
        correct_streak: tier.correctStreak,
        incorrect_streak: tier.incorrectStreak,
      })
      .execute()
  }

  for (const [topicId, xp] of Object.entries(parts.zoneXp)) {
    await db
      .insertInto('zone_xp')
      .values({ student_id: studentId, topic_id: topicId, xp })
      .execute()
  }

  for (const zoneId of parts.unlockedZones) {
    await db
      .insertInto('unlocked_zones')
      .values({ student_id: studentId, zone_id: zoneId })
      .execute()
  }

  for (const topic of Object.values(parts.studentProgress.topics)) {
    await db
      .insertInto('topic_progress')
      .values({
        student_id: studentId,
        topic_id: topic.topicId,
        content_level: topic.contentLevel,
        standard_order_json: JSON.stringify(topic.standardOrder),
        active_standard_index: topic.activeStandardIndex,
        status: topic.status,
        updated_at: now,
      })
      .execute()
  }

  const attemptBatch: AttemptInsert[] = []

  for (const standard of Object.values(parts.studentProgress.standards)) {
    await db
      .insertInto('standard_meta')
      .values({
        student_id: studentId,
        standard_code: standard.standardCode,
        status: standard.status,
        updated_at: now,
      })
      .execute()

    for (const difficulty of ['beginner', 'advanced'] as const) {
      const diff = standard[difficulty]
      await db
        .insertInto('standard_progress')
        .values({
          student_id: studentId,
          standard_code: standard.standardCode,
          difficulty,
          mastered: diff.mastered ? 1 : 0,
          mastered_at: diff.mastered ? now : null,
          updated_at: now,
        })
        .execute()

      for (const attempt of diff.attempts) {
        attemptBatch.push({
          studentId,
          standardCode: standard.standardCode,
          difficulty,
          questionId: attempt.questionId,
          isCorrect: attempt.correct,
          createdAt: timestampToIso(attempt.timestamp),
        })
      }
    }
  }

  // Preserve chronological order across standards by sorting on createdAt.
  attemptBatch.sort((a, b) => {
    const ta = Date.parse(a.createdAt ?? '') || 0
    const tb = Date.parse(b.createdAt ?? '') || 0
    return ta - tb
  })
  await insertAttemptsInOrder(db, attemptBatch)

  for (const missed of parts.studentProgress.missedQuestions) {
    await db
      .insertInto('missed_questions')
      .values({
        student_id: studentId,
        standard_code: missed.standardCode,
        difficulty: missed.difficulty,
        prompt: missed.prompt,
        created_at: timestampToIso(missed.timestamp),
      })
      .execute()
  }

  return parts
}

/** Load player progress parts for one student from normalized tables. */
export async function loadPlayerProgress(
  db: ProgressDb,
  studentId: string,
  fallbackContentLevel: GradeLevel,
  xp: number,
): Promise<PlayerProgressParts> {
  const tierRows = await db
    .selectFrom('topic_tier_progress')
    .selectAll()
    .where('student_id', '=', studentId)
    .execute()

  const topicProgress: Record<string, TierProgressBlob> = {}
  for (const row of tierRows) {
    topicProgress[row.topic_id] = {
      tierIndex: row.tier_index,
      correctStreak: row.correct_streak,
      incorrectStreak: row.incorrect_streak,
    }
  }

  const zoneRows = await db
    .selectFrom('zone_xp')
    .selectAll()
    .where('student_id', '=', studentId)
    .execute()
  const zoneXp: Record<string, number> = {}
  for (const row of zoneRows) zoneXp[row.topic_id] = row.xp

  const unlockedRows = await db
    .selectFrom('unlocked_zones')
    .selectAll()
    .where('student_id', '=', studentId)
    .execute()
  const unlockedZones = unlockedRows.map((r) => r.zone_id)

  const topicRows = await db
    .selectFrom('topic_progress')
    .selectAll()
    .where('student_id', '=', studentId)
    .execute()
  const topics: Record<string, TopicProgressBlob> = {}
  for (const row of topicRows) {
    let standardOrder: string[] = []
    try {
      const parsed: unknown = JSON.parse(row.standard_order_json)
      if (Array.isArray(parsed)) {
        standardOrder = parsed.filter((c): c is string => typeof c === 'string')
      }
    } catch {
      standardOrder = []
    }
    topics[row.topic_id] = {
      topicId: row.topic_id,
      contentLevel: row.content_level,
      standardOrder,
      activeStandardIndex: row.active_standard_index,
      status: row.status,
    }
  }

  const metaRows = await db
    .selectFrom('standard_meta')
    .selectAll()
    .where('student_id', '=', studentId)
    .execute()
  const progressRows = await db
    .selectFrom('standard_progress')
    .selectAll()
    .where('student_id', '=', studentId)
    .execute()

  const standards: Record<string, StandardProgressBlob> = {}
  for (const meta of metaRows) {
    standards[meta.standard_code] = {
      standardCode: meta.standard_code,
      status: meta.status,
      beginner: emptyDifficulty(),
      advanced: emptyDifficulty(),
    }
  }

  for (const row of progressRows) {
    const existing =
      standards[row.standard_code] ??
      ({
        standardCode: row.standard_code,
        status: 'active' as const,
        beginner: emptyDifficulty(),
        advanced: emptyDifficulty(),
      } satisfies StandardProgressBlob)
    const window = await recentWindow(
      db,
      studentId,
      row.standard_code,
      row.difficulty,
    )
    // JSON blob stores oldest-first; recentWindow is newest-first.
    const attemptsOldestFirst = [...window].reverse().map((a) => ({
      questionId: a.question_id ?? '',
      correct: a.is_correct === 1,
      timestamp: isoToTimestamp(a.created_at),
    }))
    existing[row.difficulty] = {
      attempts: attemptsOldestFirst,
      mastered: row.mastered === 1,
    }
    standards[row.standard_code] = existing
  }

  const missedRows = await db
    .selectFrom('missed_questions')
    .selectAll()
    .where('student_id', '=', studentId)
    .orderBy('id', 'asc')
    .execute()
  const missedQuestions: MissedQuestionBlob[] = missedRows.map((m) => ({
    standardCode: m.standard_code,
    difficulty: m.difficulty,
    prompt: m.prompt,
    timestamp: isoToTimestamp(m.created_at),
  }))

  return {
    topicProgress,
    studentProgress: {
      profileId: studentId,
      contentLevel: fallbackContentLevel,
      topics,
      standards,
      missedQuestions,
    },
    contentLevel: fallbackContentLevel,
    xp,
    zoneXp,
    unlockedZones,
  }
}

export function playerPartsToApiPlayer(parts: PlayerProgressParts): {
  topicProgress: Record<string, TierProgressBlob>
  studentProgress: StudentProgressBlob
  contentLevel: GradeLevel
  xp: number
  zoneXp: Record<string, number>
  unlockedZones: string[]
} {
  return {
    topicProgress: parts.topicProgress,
    studentProgress: parts.studentProgress,
    contentLevel: parts.contentLevel,
    xp: parts.xp,
    zoneXp: parts.zoneXp,
    unlockedZones: parts.unlockedZones,
  }
}
