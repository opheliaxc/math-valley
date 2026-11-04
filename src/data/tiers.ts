import type { Grade } from './profile.ts'
import type { TopicId } from './topics.ts'

/**
 * Legacy difficulty tiers keyed by domain island.
 * Practice sessions use the Question Generator; these remain for older
 * topicProgress / static question helpers.
 */
export const TIERS = {
  'operations-algebraic-thinking': [
    'sums-to-10',
    'sums-to-20',
    'intro-groups',
    'facts-to-5',
    'facts-to-10',
    'one-step',
    'two-step',
    'two-step-mixed',
  ],
  'number-operations-base-ten': [
    'sums-to-100',
    'regrouping-100',
    'multi-digit',
    'multi-digit-large',
    'multi-digit-remainders',
  ],
  'measurement-data': [
    'hour-half-coins',
    'time-5min-money',
    'elapsed-money-totals',
    'units-conversions',
  ],
  'number-operations-fractions': [
    'unit-fractions',
    'equivalence',
    'compare-add',
  ],
  geometry: ['shape-attributes', 'composites', 'equal-shares'],
} as const

export type TierId<T extends TopicId = TopicId> = (typeof TIERS)[T][number]

export type AnyTierId = {
  [T in TopicId]: (typeof TIERS)[T][number]
}[TopicId]

/** Starting tier index for a grade (also used later as the floor in Step 4). */
export const GRADE_START_TIER_INDEX: Record<TopicId, Record<Grade, number>> = {
  'operations-algebraic-thinking': { 1: 0, 2: 1, 3: 3, 4: 5 },
  'number-operations-base-ten': { 1: 0, 2: 1, 3: 2, 4: 3 },
  'measurement-data': { 1: 0, 2: 1, 3: 2, 4: 3 },
  'number-operations-fractions': { 1: 0, 2: 0, 3: 0, 4: 1 },
  geometry: { 1: 0, 2: 0, 3: 0, 4: 0 },
}

export function getTierId(topic: TopicId, index: number): AnyTierId {
  const list = TIERS[topic]
  const clamped = Math.max(0, Math.min(index, list.length - 1))
  return list[clamped] as AnyTierId
}

export function getStartingTierIndex(topic: TopicId, grade: Grade): number {
  return GRADE_START_TIER_INDEX[topic][grade]
}

export function getStartingTierId(topic: TopicId, grade: Grade): AnyTierId {
  return getTierId(topic, getStartingTierIndex(topic, grade))
}
