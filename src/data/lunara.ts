export type LunaraStageId =
  | 'hatchling'
  | 'fledgling'
  | 'young'
  | 'adult'
  | 'elder'

export type LunaraStage = {
  id: LunaraStageId
  label: string
  /** Minimum total XP to reach this stage. */
  minXp: number
  emoji: string
  blurb: string
}

export const LUNARA_STAGES: LunaraStage[] = [
  {
    id: 'hatchling',
    label: 'Hatchling',
    minXp: 0,
    emoji: '🥚',
    blurb: 'A tiny dragon egg, warm with curiosity.',
  },
  {
    id: 'fledgling',
    label: 'Fledgling',
    minXp: 50,
    emoji: '🐣',
    blurb: 'Lunara peeks out, ready for small adventures.',
  },
  {
    id: 'young',
    label: 'Young Dragon',
    minXp: 150,
    emoji: '🐉',
    blurb: 'Wings stretch — practice makes Lunara stronger.',
  },
  {
    id: 'adult',
    label: 'Valley Guardian',
    minXp: 300,
    emoji: '🐲',
    blurb: 'A proud guardian of Math Valley.',
  },
  {
    id: 'elder',
    label: 'Elder Wyrm',
    minXp: 500,
    emoji: '✨',
    blurb: 'Wisdom and sparkle fill the skies.',
  },
]

export function getLunaraStage(xp: number): LunaraStage {
  let current = LUNARA_STAGES[0]
  for (const stage of LUNARA_STAGES) {
    if (xp >= stage.minXp) current = stage
  }
  return current
}

export function getNextLunaraStage(xp: number): LunaraStage | null {
  const current = getLunaraStage(xp)
  const index = LUNARA_STAGES.findIndex((stage) => stage.id === current.id)
  return LUNARA_STAGES[index + 1] ?? null
}
