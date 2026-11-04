/**
 * Cross-content-level advancement — Phase 4.
 * Advances contentLevel (not Profile.grade). Cap at 4. Re-locks zones in sequence (A).
 */
import {
  TOPIC_UNLOCK_ORDER,
  getPracticeableZoneTopicIdsForGrade,
  getZoneTopicIdsForGrade,
  topicHasZoneAtGrade,
} from './curriculum-map.ts'
import type { Grade } from './profile.ts'
import { createTopicProgress } from './topicProgressInit.ts'
import {
  isTopicMastered,
  type StudentProgress,
  type TopicProgress,
} from './studentProgress.ts'
import type { TopicId } from './topics.ts'

export type ContentLevelAdvanceResult = {
  progress: StudentProgress
  /** True when contentLevel increased. */
  advanced: boolean
  previousContentLevel: Grade
  contentLevel: Grade
}

/**
 * True when every practiceable zone at the current contentLevel is mastered.
 * Empty or non-practiceable domains are ignored.
 */
export function isContentLevelMastered(progress: StudentProgress): boolean {
  const zoneIds = getPracticeableZoneTopicIdsForGrade(progress.contentLevel)
  if (zoneIds.length === 0) return false
  return zoneIds.every((topicId) => {
    const topic = progress.topics[topicId]
    if (!topic) return false
    if (topic.status === 'mastered') return true
    return isTopicMastered(progress, topicId)
  })
}

/**
 * If the current contentLevel is fully mastered and below 4, move to the next
 * level: reload per-topic standardOrder, reset indices, re-lock so only the
 * first zone at the new level is unlocked.
 */
export function advanceContentLevelIfNeeded(
  progress: StudentProgress,
): ContentLevelAdvanceResult {
  const previousContentLevel = progress.contentLevel

  if (previousContentLevel >= 4 || !isContentLevelMastered(progress)) {
    return {
      progress,
      advanced: false,
      previousContentLevel,
      contentLevel: previousContentLevel,
    }
  }

  const contentLevel = (previousContentLevel + 1) as Grade
  const topics: Record<string, TopicProgress> = {}
  for (const topicId of TOPIC_UNLOCK_ORDER) {
    topics[topicId] = createTopicProgress(topicId as TopicId, contentLevel)
  }

  return {
    progress: {
      ...progress,
      contentLevel,
      topics,
      // Keep attempt history / missedQuestions; new level uses fresh topic rows.
    },
    advanced: true,
    previousContentLevel,
    contentLevel,
  }
}

/** Topics that count toward finishing the current contentLevel. */
export function zoneTopicIdsAtContentLevel(progress: StudentProgress): TopicId[] {
  return getZoneTopicIdsForGrade(progress.contentLevel)
}

export function topicIsZoneAtCurrentLevel(
  progress: StudentProgress,
  topicId: TopicId,
): boolean {
  return topicHasZoneAtGrade(topicId, progress.contentLevel)
}
