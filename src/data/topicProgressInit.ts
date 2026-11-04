import {
  getStandardsForTopic,
  getZoneTopicIdsForGrade,
} from './curriculum-map.ts'
import type { Grade } from './profile.ts'
import type { TopicProgress } from './studentProgress.ts'
import type { TopicId } from './topics.ts'

export function createTopicProgress(
  topicId: TopicId,
  contentLevel: Grade,
): TopicProgress {
  const zoneIds = getZoneTopicIdsForGrade(contentLevel)
  const firstZone = zoneIds[0]
  return {
    topicId,
    contentLevel,
    standardOrder: [...getStandardsForTopic(topicId, contentLevel)],
    activeStandardIndex: 0,
    status: topicId === firstZone ? 'unlocked' : 'locked',
  }
}
