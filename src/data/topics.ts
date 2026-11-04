/**
 * Island / domain keys — NYS Next Generation Mathematics domains used as
 * Math Valley progression islands (see curriculum-domain-restructure-spec.md).
 *
 * `TopicId` is kept as the type name for compatibility with existing progress
 * and zone code; values are domain keys, not the old game-topic keys.
 */
export const TOPICS = [
  'operations-algebraic-thinking',
  'number-operations-base-ten',
  'measurement-data',
  'number-operations-fractions',
  'geometry',
] as const

export type TopicId = (typeof TOPICS)[number]

/** Alias used by the curriculum map / restructure docs. */
export type DomainId = TopicId

export const TOPIC_LABELS: Record<TopicId, string> = {
  'operations-algebraic-thinking': 'Operations & Algebraic Thinking',
  'number-operations-base-ten': 'Number & Operations in Base Ten',
  'measurement-data': 'Measurement & Data',
  'number-operations-fractions': 'Number & Operations — Fractions',
  geometry: 'Geometry',
}

/** NYS registry `domain` string ↔ island key. */
export const DOMAIN_NYS_LABEL: Record<TopicId, string> = {
  'operations-algebraic-thinking': 'Operations & Algebraic Thinking',
  'number-operations-base-ten': 'Number & Operations in Base Ten',
  'measurement-data': 'Measurement & Data',
  'number-operations-fractions': 'Number & Operations — Fractions',
  geometry: 'Geometry',
}
