/**
 * Bridge mastery progress → world-map unlockedZones (Phase 3).
 * Reuses the same zone ids / names the home map and session summary use.
 * Zone list is driven by contentLevel, not Profile.grade.
 */
import { getZoneTopicIdsForGrade } from './curriculum-map.ts'
import type { PlayerState } from './playerState.ts'
import type { StudentProgress } from './studentProgress.ts'
import type { ZoneId } from './zones.ts'
import { createInitialUnlockedZones } from './zones.ts'

/** Zone ids that mastery considers open (unlocked or mastered) at contentLevel. */
export function zoneIdsOpenFromMastery(progress: StudentProgress): ZoneId[] {
  return getZoneTopicIdsForGrade(progress.contentLevel).filter((id) => {
    const topic = progress.topics[id]
    return topic?.status === 'unlocked' || topic?.status === 'mastered'
  })
}

/**
 * Copy mastery unlocks onto player.unlockedZones.
 * Returns the first zone that was not previously unlocked (for the reward banner).
 */
export function syncPlayerZonesFromMastery(
  player: PlayerState,
  studentProgress: StudentProgress,
): { player: PlayerState; newlyUnlockedZone: ZoneId | null } {
  const fromMastery = zoneIdsOpenFromMastery(studentProgress)
  const contentLevel = studentProgress.contentLevel
  const firstForLevel = createInitialUnlockedZones(contentLevel)
  const levelChanged = player.contentLevel !== contentLevel

  // Map unlocks follow mastery only (not XP or leftover saved ids).
  const unlockedZones = [...new Set([...firstForLevel, ...fromMastery])]

  const previous = new Set(player.unlockedZones)
  let newlyUnlockedZone: ZoneId | null = null
  if (!levelChanged) {
    for (const id of fromMastery) {
      if (!previous.has(id)) {
        newlyUnlockedZone = id
        break
      }
    }
  }

  return {
    player: {
      ...player,
      contentLevel,
      studentProgress,
      unlockedZones,
    },
    newlyUnlockedZone,
  }
}
