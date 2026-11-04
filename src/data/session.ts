export const SESSION_LENGTH = 8

export type SessionSummary = {
  topicLabel: string
  zoneName: string
  total: number
  correctCount: number
  xpEarned: number
  totalXp: number
  lunaraEvolved: boolean
  lunaraLabel: string
  unlockedZoneName: string | null
  /** True when this session bumped contentLevel (school grade unchanged). */
  contentLevelAdvanced: boolean
  contentLevel: number | null
}
