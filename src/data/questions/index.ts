import { getStartingTierId, type AnyTierId } from '../tiers'
import type { Grade } from '../profile'
import type { TopicId } from '../topics'
import type { Question } from './types'

export type { Question } from './types'
export { checkAnswer } from './types'

/**
 * Legacy static question bank — practice sessions use the Question Generator.
 * Kept so older helpers still typecheck; do not use for new curriculum work.
 */
export function generateQuestion(_topic: TopicId, _tier: AnyTierId): Question {
  throw new Error(
    'Legacy static question bank is retired. Use the Question Generator via practiceSession.',
  )
}

/** Convenience: generate using a grade's starting tier for that topic. */
export function generateQuestionForGrade(topic: TopicId, grade: Grade): Question {
  return generateQuestion(topic, getStartingTierId(topic, grade))
}
