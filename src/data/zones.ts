import {
  domainIsPracticeable,
  getZoneTopicIdsForGrade,
} from './curriculum-map.ts'
import { getIslandName } from './islandCatalog.ts'
import type { Grade } from './profile.ts'
import type { TopicId } from './topics.ts'
import { TOPICS } from './topics.ts'

export type ZoneId = TopicId

export type Zone = {
  id: ZoneId
  name: string
  intro: string
  accentClass: string
  /** False when the island has no practiceable generators at this grade. */
  practiceable: boolean
}

/** Shared accent per domain (art polish can come later). */
const ZONE_ACCENTS: Record<ZoneId, string> = {
  'operations-algebraic-thinking': 'from-emerald-700 to-lime-800',
  'number-operations-base-ten': 'from-indigo-700 to-slate-800',
  'measurement-data': 'from-amber-700 to-orange-900',
  'number-operations-fractions': 'from-teal-800 to-cyan-900',
  geometry: 'from-sky-800 to-slate-900',
}

/** Flavor intros only — display names live in islandCatalog.ts. */
const ZONE_INTROS: Record<Grade, Partial<Record<ZoneId, string>>> = {
  1: {
    'operations-algebraic-thinking':
      'Tiny claws, big number stories — hatchling ops practice.',
    'number-operations-base-ten':
      'Stack pebbles into tens and ones in the hatchling den.',
    'measurement-data': 'Clocks and coins glimmer in the nest at sundrop hour.',
    geometry: 'Trace sides and shares along the cove — hatchling geometry.',
  },
  2: {
    'operations-algebraic-thinking':
      'Fledgling sparks fly through word problems and mental math.',
    'number-operations-base-ten':
      'Hundreds, tens, and ones glitter deeper in the caverns.',
    'measurement-data':
      'Time and treasure tick along the fledgling treehouse trail.',
    geometry: 'Sort polygons and equal shares in the fledgling quarry.',
  },
  3: {
    'operations-algebraic-thinking':
      'Young drakes master multiplication on windy peaks.',
    'number-operations-base-ten':
      'Guard the vault with fluent add and subtract within 1,000.',
    'measurement-data':
      'Elapsed time, then area and perimeter — measures trade hands in the bazaar.',
    'number-operations-fractions':
      'Equal parts cascade down the falls — build fraction sense.',
    geometry:
      'Classify polygons and equal-area parts in the young drake forge.',
  },
  4: {
    'operations-algebraic-thinking':
      'Elder dragons solve multi-step problems at the summit.',
    'number-operations-base-ten': 'Multi-digit riches fill the elder treasury.',
    'measurement-data':
      'Convert units, then area, perimeter, and angles at the exchange.',
    'number-operations-fractions':
      'Crystal shards of equivalence, comparison, and decimals.',
    geometry:
      "Lines, angles, and symmetry under the elder dragons' skyfire lens.",
  },
}

/** XP earned in a zone required to unlock the next zone. */
export const ZONE_UNLOCK_XP = 80

/** Zone display data for this domain at this content level / grade band. */
export function getZone(id: ZoneId, grade: Grade): Zone {
  return {
    id,
    name: getIslandName(id, grade),
    intro: ZONE_INTROS[grade][id] ?? 'A Math Valley island.',
    accentClass: ZONE_ACCENTS[id],
    practiceable: domainIsPracticeable(id, grade),
  }
}

/** Zones that exist for this grade (hidden when curriculum has no zone content). */
export function getZonesForGrade(grade: Grade): Zone[] {
  return getZoneTopicIdsForGrade(grade).map((id) => getZone(id, grade))
}

export function getNextZoneId(current: ZoneId, grade: Grade): ZoneId | null {
  const order = getZoneTopicIdsForGrade(grade)
  const index = order.indexOf(current)
  if (index < 0 || index >= order.length - 1) return null
  return order[index + 1] ?? null
}

export function createInitialUnlockedZones(grade: Grade): ZoneId[] {
  const first = getZoneTopicIdsForGrade(grade)[0]
  return first ? [first] : []
}

export function createInitialZoneXp(): Record<TopicId, number> {
  return Object.fromEntries(TOPICS.map((topic) => [topic, 0])) as Record<
    TopicId,
    number
  >
}
