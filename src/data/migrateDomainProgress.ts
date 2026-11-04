/**
 * Phase C — remap topic-grouping progress onto NYS domain islands.
 *
 * Per-standard mastery (`standards`, `missedQuestions`) is left untouched.
 * Topic rows are rebuilt from the current curriculum map + mastery state.
 */
import {
  TOPIC_UNLOCK_ORDER,
  domainIsPracticeable,
  getPracticeableZoneTopicIdsForGrade,
  getStandardsForTopic,
} from './curriculum-map.ts'
import {
  isStandardMastered,
  type StudentProgress,
  type TopicProgress,
  type TopicUnlockStatus,
} from './studentProgress.ts'
import type { TopicId } from './topics.ts'
import { TOPICS } from './topics.ts'

/** Pre-restructure island keys still present in older localStorage saves. */
export const LEGACY_TOPIC_IDS = [
  'addition-subtraction',
  'multiplication-division',
  'word-problems',
  'time-money-measurement',
] as const

export function topicsNeedDomainMigration(
  topics: Record<string, unknown> | null | undefined,
): boolean {
  if (!topics || typeof topics !== 'object') return true
  const hasLegacy = LEGACY_TOPIC_IDS.some((id) => id in topics)
  const missingDomain = TOPICS.some((id) => !(id in topics))
  return hasLegacy || missingDomain
}

function hasAttemptsOnStandard(
  progress: StudentProgress,
  standardCode: string,
): boolean {
  const row = progress.standards[standardCode]
  if (!row) return false
  return row.beginner.attempts.length > 0 || row.advanced.attempts.length > 0
}

function domainHasProgress(
  progress: StudentProgress,
  standardOrder: readonly string[],
): boolean {
  return standardOrder.some(
    (code) =>
      isStandardMastered(progress, code) || hasAttemptsOnStandard(progress, code),
  )
}

function computeActiveStandardIndex(
  progress: StudentProgress,
  standardOrder: readonly string[],
): number {
  if (standardOrder.length === 0) return 0
  for (let i = 0; i < standardOrder.length; i += 1) {
    const code = standardOrder[i]
    if (!code) continue
    if (!isStandardMastered(progress, code)) return i
  }
  return standardOrder.length - 1
}

function priorPracticeableDomainsMastered(
  progress: StudentProgress,
  topicId: TopicId,
): boolean {
  const practiceable = getPracticeableZoneTopicIdsForGrade(progress.contentLevel)
  const index = practiceable.indexOf(topicId)
  if (index <= 0) return true
  return practiceable.slice(0, index).every((id) => {
    const order = getStandardsForTopic(id, progress.contentLevel)
    if (order.length === 0) return true
    return order.every((code) => isStandardMastered(progress, code))
  })
}

function resolveDomainStatus(
  progress: StudentProgress,
  topicId: TopicId,
  standardOrder: readonly string[],
): TopicUnlockStatus {
  if (standardOrder.length === 0) return 'locked'
  if (!domainIsPracticeable(topicId, progress.contentLevel)) return 'locked'

  const fullyMastered = standardOrder.every((code) =>
    isStandardMastered(progress, code),
  )
  const unlockedBySequence = priorPracticeableDomainsMastered(progress, topicId)
  const unlockedByProgress = domainHasProgress(progress, standardOrder)

  if (fullyMastered && (unlockedBySequence || unlockedByProgress)) {
    return 'mastered'
  }
  if (unlockedBySequence || unlockedByProgress) {
    return 'unlocked'
  }
  return 'locked'
}

/**
 * Rebuild `topics` for the current contentLevel from curriculum + standards.
 * Idempotent — safe to run on every load.
 */
export function rebuildDomainTopicProgress(
  progress: StudentProgress,
): StudentProgress {
  const topics: Record<string, TopicProgress> = {}

  for (const topicId of TOPIC_UNLOCK_ORDER) {
    const standardOrder = [...getStandardsForTopic(topicId, progress.contentLevel)]
    topics[topicId] = {
      topicId,
      contentLevel: progress.contentLevel,
      standardOrder,
      activeStandardIndex: computeActiveStandardIndex(progress, standardOrder),
      status: resolveDomainStatus(progress, topicId, standardOrder),
    }
  }

  // Drop legacy topic keys by replacement (only domain keys remain).
  return {
    ...progress,
    topics,
  }
}

export function migrateStudentProgressToDomains(
  progress: StudentProgress,
): StudentProgress {
  return rebuildDomainTopicProgress(progress)
}
