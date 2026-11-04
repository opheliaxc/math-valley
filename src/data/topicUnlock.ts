/**
 * Topic unlock after mastery — Phase 3.
 * Skips domains that are not zones at the student's grade (empty content).
 */
import {
  TOPIC_UNLOCK_ORDER,
  domainIsPracticeable,
  topicHasZoneAtGrade,
} from './curriculum-map.ts'
import { isTopicMastered, type StudentProgress } from './studentProgress.ts'
import type { TopicId } from './topics.ts'

export type TopicUnlockResult = {
  progress: StudentProgress
  newlyMasteredTopicId: TopicId | null
  newlyUnlockedTopicId: TopicId | null
}

/**
 * Next topic in Phase 0 order that is a real zone at this grade and still locked.
 */
export function findNextUnlockableTopic(
  progress: StudentProgress,
  afterTopicId: TopicId,
): TopicId | null {
  const start = TOPIC_UNLOCK_ORDER.indexOf(afterTopicId)
  if (start < 0) return null

  for (let i = start + 1; i < TOPIC_UNLOCK_ORDER.length; i++) {
    const candidate = TOPIC_UNLOCK_ORDER[i]
    const topic = progress.topics[candidate]
    if (!topic) continue
    if (!topicHasZoneAtGrade(candidate, progress.contentLevel)) continue
    if (!domainIsPracticeable(candidate, progress.contentLevel)) continue
    if (topic.status === 'locked') return candidate
  }
  return null
}

/**
 * When a topic becomes fully mastered: mark it mastered and unlock the next
 * non-empty locked topic in Phase 0 order.
 */
export function applyTopicUnlocksIfNeeded(
  progress: StudentProgress,
  topicId: TopicId,
): TopicUnlockResult {
  const topic = progress.topics[topicId]
  if (!topic) {
    return {
      progress,
      newlyMasteredTopicId: null,
      newlyUnlockedTopicId: null,
    }
  }

  if (topic.status === 'mastered' || !isTopicMastered(progress, topicId)) {
    return {
      progress,
      newlyMasteredTopicId: null,
      newlyUnlockedTopicId: null,
    }
  }

  let next: StudentProgress = {
    ...progress,
    topics: {
      ...progress.topics,
      [topicId]: { ...topic, status: 'mastered' },
    },
  }

  const newlyUnlockedTopicId = findNextUnlockableTopic(next, topicId)
  if (newlyUnlockedTopicId) {
    const toUnlock = next.topics[newlyUnlockedTopicId]
    if (toUnlock) {
      next = {
        ...next,
        topics: {
          ...next.topics,
          [newlyUnlockedTopicId]: { ...toUnlock, status: 'unlocked' },
        },
      }
    }
  }

  return {
    progress: next,
    newlyMasteredTopicId: topicId,
    newlyUnlockedTopicId,
  }
}
