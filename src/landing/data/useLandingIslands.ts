import { useMemo } from 'react'
import {
  getIslandCatalogForGrade,
  type IslandCatalogEntry,
} from '../../data/islandCatalog'
import type { Grade } from '../../data/profile'
import type { TopicId } from '../../data/topics'

/** Friendly captions from plan §4.3.1 — true for every grade the domain appears. */
const DOMAIN_CAPTIONS: Record<TopicId, string> = {
  'operations-algebraic-thinking': 'Number stories and operations',
  'number-operations-base-ten': 'Place value and big numbers',
  'measurement-data': 'Measuring and time',
  'number-operations-fractions': 'Fractions',
  geometry: 'Shapes',
}

export type LandingIsland = {
  id: TopicId
  name: string
  domainKey: TopicId
  caption: string
  order: number
  /** First island is open on the marketing map; the rest are locked. */
  open: boolean
}

function captionFor(domainKey: TopicId): string {
  return DOMAIN_CAPTIONS[domainKey]
}

function toLandingIsland(entry: IslandCatalogEntry, index: number): LandingIsland {
  return {
    id: entry.id,
    name: entry.name,
    domainKey: entry.id,
    caption: captionFor(entry.id),
    order: entry.order,
    open: index === 0,
  }
}

/** Read-only adapter over the pure island catalog (no student / network). */
export function useLandingIslands(grade: Grade): LandingIsland[] {
  return useMemo(
    () => getIslandCatalogForGrade(grade).map(toLandingIsland),
    [grade],
  )
}
