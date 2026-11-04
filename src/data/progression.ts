import { getLunaraStage } from './lunara.ts'
import { syncPlayerZonesFromMastery } from './masteryWorldMap.ts'
import type { PlayerState } from './playerState.ts'
import { SESSION_LENGTH } from './session.ts'
import type { TopicId } from './topics.ts'
import { type ZoneId } from './zones.ts'

export const XP_PER_CORRECT = 10
export const XP_SESSION_BONUS = 20

export type SessionReward = {
  xpEarned: number
  totalXp: number
  lunaraEvolved: boolean
  lunaraStageId: string
  lunaraLabel: string
  newlyUnlockedZone: ZoneId | null
  player: PlayerState
}

export function calculateSessionXp(correctCount: number): number {
  return correctCount * XP_PER_CORRECT + XP_SESSION_BONUS
}

/**
 * Apply XP after a completed session: update totals, zone XP, Lunara stage.
 * Zone unlock follows mastery only.
 */
export function applySessionReward(
  player: PlayerState,
  topic: TopicId,
  correctCount: number,
  masteryNewlyUnlocked: ZoneId | null = null,
): SessionReward {
  const xpEarned = calculateSessionXp(
    Math.min(correctCount, SESSION_LENGTH),
  )
  const stageBefore = getLunaraStage(player.xp)
  const totalXp = player.xp + xpEarned
  const stageAfter = getLunaraStage(totalXp)

  const zoneXp = {
    ...player.zoneXp,
    [topic]: player.zoneXp[topic] + xpEarned,
  }

  let nextPlayer: PlayerState = {
    ...player,
    xp: totalXp,
    zoneXp,
  }

  let newlyUnlockedZone: ZoneId | null = null

  const masterySync = syncPlayerZonesFromMastery(
    nextPlayer,
    nextPlayer.studentProgress,
  )
  nextPlayer = masterySync.player
  newlyUnlockedZone = masterySync.newlyUnlockedZone

  if (
    masteryNewlyUnlocked &&
    !nextPlayer.unlockedZones.includes(masteryNewlyUnlocked)
  ) {
    nextPlayer = {
      ...nextPlayer,
      unlockedZones: [...nextPlayer.unlockedZones, masteryNewlyUnlocked],
    }
    newlyUnlockedZone = masteryNewlyUnlocked
  } else if (masteryNewlyUnlocked && !newlyUnlockedZone) {
    newlyUnlockedZone = masteryNewlyUnlocked
  }

  return {
    xpEarned,
    totalXp,
    lunaraEvolved: stageBefore.id !== stageAfter.id,
    lunaraStageId: stageAfter.id,
    lunaraLabel: stageAfter.label,
    newlyUnlockedZone,
    player: nextPlayer,
  }
}
