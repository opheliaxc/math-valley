/**
 * Curriculum map — domain-based islands (curriculum-domain-restructure-spec.md).
 *
 * Islands are keyed by NYS domain. Standards come from the Question Generator
 * registry, regrouped from the old custom topics. Grade 3–4 NF is live
 * practice content (Phase E).
 */
import { getStandard } from '../../question-generator/src/standards-registry.ts'
import type { Grade } from '../../question-generator/src/types.ts'
import {
  DOMAIN_NYS_LABEL,
  TOPICS,
  type TopicId,
} from './topics.ts'

export type { Grade }

/** Island unlock order: OA → NBT → MD → NF → Geometry. */
export const TOPIC_UNLOCK_ORDER: readonly TopicId[] = TOPICS

/** @deprecated Use TOPIC_UNLOCK_ORDER — same domain sequence. */
export const DOMAIN_UNLOCK_ORDER = TOPIC_UNLOCK_ORDER

/**
 * A mapped standard is practiceable when it exists in the Question Generator
 * registry (has a generator).
 */
export function isStandardPracticeable(standardCode: string): boolean {
  return getStandard(standardCode) != null
}

/**
 * Per-domain, per-grade standard sequences in teaching order.
 * Word-problem standards live in their home domain (OA, or MD for NY-4.MD.2).
 */
export const CURRICULUM_MAP: Record<TopicId, Record<Grade, readonly string[]>> = {
  'operations-algebraic-thinking': {
    1: ['NY-1.OA.6', 'NY-1.OA.1', 'NY-1.OA.2'],
    2: ['NY-2.OA.2a', 'NY-2.OA.1a', 'NY-2.OA.1b', 'NY-2.OA.4'],
    3: ['NY-3.OA.1', 'NY-3.OA.2', 'NY-3.OA.7', 'NY-3.OA.3', 'NY-3.OA.8'],
    4: ['NY-4.OA.1', 'NY-4.OA.2', 'NY-4.OA.3'],
  },

  'number-operations-base-ten': {
    1: ['NY-1.NBT.4', 'NY-1.NBT.6'],
    2: ['NY-2.NBT.5', 'NY-2.NBT.6', 'NY-2.NBT.7'],
    3: ['NY-3.NBT.2'],
    4: ['NY-4.NBT.4', 'NY-4.NBT.5', 'NY-4.NBT.6'],
  },

  'measurement-data': {
    1: ['NY-1.MD.3a', 'NY-1.MD.3b', 'NY-1.MD.3c'],
    2: ['NY-2.MD.1', 'NY-2.MD.7', 'NY-2.MD.8'],
    // Geometric area/perimeter appended after existing MD (NY-3.MD.5–8).
    3: [
      'NY-3.MD.1',
      'NY-3.MD.2',
      'NY-3.MD.5',
      'NY-3.MD.6',
      'NY-3.MD.7',
      'NY-3.MD.8',
    ],
    // Geometric area/perimeter/angles appended after existing MD (NY-4.MD.3, 5–7).
    4: [
      'NY-4.MD.1',
      'NY-4.MD.2',
      'NY-4.MD.3',
      'NY-4.MD.5',
      'NY-4.MD.6',
      'NY-4.MD.7',
    ],
  },

  'number-operations-fractions': {
    1: [],
    2: [],
    3: ['NY-3.NF.1', 'NY-3.NF.2', 'NY-3.NF.3'],
    4: [
      'NY-4.NF.1',
      'NY-4.NF.2',
      'NY-4.NF.3',
      'NY-4.NF.4',
      'NY-4.NF.5',
      'NY-4.NF.6',
      'NY-4.NF.7',
    ],
  },

  // Geometry last; Grades 1–4 wired.
  geometry: {
    1: ['NY-1.G.1', 'NY-1.G.2', 'NY-1.G.3'],
    2: ['NY-2.G.1', 'NY-2.G.2', 'NY-2.G.3'],
    3: ['NY-3.G.1', 'NY-3.G.2'],
    4: ['NY-4.G.1', 'NY-4.G.2', 'NY-4.G.3'],
  },
}

/** Ordered standard codes for one domain at one grade (may be empty). */
export function getStandardsForTopic(topicId: TopicId, grade: Grade): readonly string[] {
  return CURRICULUM_MAP[topicId][grade]
}

export const getStandardsForDomain = getStandardsForTopic

/**
 * Whether this domain appears as a world-map island at the given grade.
 * Grades 1–2 have no Fractions island; Grades 3–4 include it.
 */
export function topicHasZoneAtGrade(topicId: TopicId, grade: Grade): boolean {
  return getStandardsForTopic(topicId, grade).length > 0
}

/** True when every standard in that domain/grade has a generator. */
export function domainIsPracticeable(topicId: TopicId, grade: Grade): boolean {
  const standards = getStandardsForTopic(topicId, grade)
  if (standards.length === 0) return false
  return standards.every((code) => isStandardPracticeable(code))
}

/** Unlock order, filtered to domains that exist as zones at this grade. */
export function getZoneTopicIdsForGrade(grade: Grade): TopicId[] {
  return TOPIC_UNLOCK_ORDER.filter((topicId) => topicHasZoneAtGrade(topicId, grade))
}

/**
 * Zones that count for content-level mastery / unlock chaining.
 */
export function getPracticeableZoneTopicIdsForGrade(grade: Grade): TopicId[] {
  return getZoneTopicIdsForGrade(grade).filter((topicId) =>
    domainIsPracticeable(topicId, grade),
  )
}

/** Full ordered walk of all domains for a grade. */
export function getCurriculumForGrade(
  grade: Grade,
): { topicId: TopicId; standards: readonly string[]; practiceable: boolean }[] {
  return TOPIC_UNLOCK_ORDER.map((topicId) => ({
    topicId,
    standards: getStandardsForTopic(topicId, grade),
    practiceable: domainIsPracticeable(topicId, grade),
  }))
}

/** Ensures every mapped code exists in the registry under the right domain. */
export function assertCurriculumMapValid(): void {
  for (const topicId of TOPIC_UNLOCK_ORDER) {
    for (const grade of [1, 2, 3, 4] as const) {
      for (const code of CURRICULUM_MAP[topicId][grade]) {
        const entry = getStandard(code)
        if (!entry) {
          throw new Error(`curriculum-map: unknown standard code "${code}"`)
        }
        if (entry.grade !== grade) {
          throw new Error(
            `curriculum-map: ${code} is grade ${entry.grade} but listed under grade ${grade}`,
          )
        }
        if (entry.domain !== DOMAIN_NYS_LABEL[topicId]) {
          throw new Error(
            `curriculum-map: ${code} registry domain "${entry.domain}" does not match island "${topicId}"`,
          )
        }
        if (!entry.mathValleyTopics.includes(topicId)) {
          throw new Error(
            `curriculum-map: ${code} is not tagged for domain "${topicId}" in the registry`,
          )
        }
      }
    }
  }
}

assertCurriculumMapValid()
