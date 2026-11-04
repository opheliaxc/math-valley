/**
 * Pure island catalog — names and per-grade presence only.
 * Safe for the landing page (no question-generator / curriculum-map imports).
 * Game `zones.ts` reads names from here so they cannot drift.
 */
import type { Grade } from './profile.ts'
import { TOPICS, type TopicId } from './topics.ts'

/** Unlock order: OA → NBT → MD → NF → Geometry (same as TOPIC_UNLOCK_ORDER). */
export const ISLAND_UNLOCK_ORDER: readonly TopicId[] = TOPICS

export type IslandCatalogEntry = {
  id: TopicId
  name: string
  order: number
}

/**
 * Domains that appear as world-map islands at each grade.
 * Mirrors curriculum-map: Grades 1–2 have no Fractions island.
 */
const DOMAINS_BY_GRADE: Record<Grade, readonly TopicId[]> = {
  1: [
    'operations-algebraic-thinking',
    'number-operations-base-ten',
    'measurement-data',
    'geometry',
  ],
  2: [
    'operations-algebraic-thinking',
    'number-operations-base-ten',
    'measurement-data',
    'geometry',
  ],
  3: [
    'operations-algebraic-thinking',
    'number-operations-base-ten',
    'measurement-data',
    'number-operations-fractions',
    'geometry',
  ],
  4: [
    'operations-algebraic-thinking',
    'number-operations-base-ten',
    'measurement-data',
    'number-operations-fractions',
    'geometry',
  ],
}

/** Dragon-themed island display names by grade (single source of truth). */
const ISLAND_NAMES: Record<Grade, Partial<Record<TopicId, string>>> = {
  1: {
    'operations-algebraic-thinking': 'Hatchling Hollow',
    'number-operations-base-ten': 'Pebble Hoard Den',
    'measurement-data': 'Sundrop Nest',
    geometry: 'Hatchling Shape Cove',
  },
  2: {
    'operations-algebraic-thinking': 'Ember Grove',
    'number-operations-base-ten': 'Glimmer Hoard Caverns',
    'measurement-data': 'Ticktock Treehouse',
    geometry: 'Ember Shapes Quarry',
  },
  3: {
    'operations-algebraic-thinking': 'Stormwing Peaks',
    'number-operations-base-ten': "Dragon's Vault",
    'measurement-data': 'Sundial Bazaar',
    'number-operations-fractions': 'Fraction Falls',
    geometry: "Dragon's Forge",
  },
  4: {
    'operations-algebraic-thinking': 'Skyfire Summit',
    'number-operations-base-ten': "Elder's Treasury",
    'measurement-data': 'Chrono Exchange',
    'number-operations-fractions': 'Crystal Shard Falls',
    geometry: 'Skyfire Observatory',
  },
}

export function getIslandName(id: TopicId, grade: Grade): string {
  return ISLAND_NAMES[grade][id] ?? id
}

/** Ordered island list for a grade (id + name only). */
export function getIslandCatalogForGrade(grade: Grade): IslandCatalogEntry[] {
  return DOMAINS_BY_GRADE[grade].map((id, index) => ({
    id,
    name: getIslandName(id, grade),
    order: index + 1,
  }))
}
