/**
 * Visual question validation — Phase 0 Step 6.
 * Structural checks always run when visuals are present.
 * Predicate checks run when `visualPredicate` is set (re-derive / exactly-one).
 */
import type { GeneratedQuestion } from './types.ts'
import {
  evaluateVisualPredicate,
  visualFingerprint,
  visualSpecMarginReasons,
  type VisualPredicateId,
} from './visual-predicates.ts'
import {
  isPictureOption,
  type QuestionOption,
  type VisualSpec,
} from './visual.ts'

const KNOWN_PREDICATES = new Set<VisualPredicateId>([
  'is-closed-triangle',
  'is-simple-closed-polygon',
  'is-open-polyline',
  'is-circle',
  'is-square',
  'is-rectangle',
  'is-quadrilateral',
  'is-pentagon',
  'is-hexagon',
  'count-sides',
  'count-vertices',
  'count-shaded-cells',
  'is-equal-halves',
  'is-equal-thirds',
  'is-equal-fourths',
  'is-equal-sixths',
  'is-equal-eighths',
  'is-equal-partition',
  'partition-part-count',
  'is-non-polygon',
  'count-grid-cells',
  'count-triangle-pieces',
  'has-exactly-two-triangle-pieces',
  'composite-forms-rectangle',
  'composite-piece-count',
  'rect-composite-area',
  'is-ray',
  'is-line',
  'is-segment',
  'is-acute-angle',
  'is-right-angle',
  'is-obtuse-angle',
  'lines-are-parallel',
  'lines-are-perpendicular',
  'is-acute-triangle',
  'is-right-triangle',
  'is-obtuse-triangle',
  'is-parallelogram',
  'has-symmetry-axis',
  'protractor-measure',
])

function isVisualPredicateId(value: string): value is VisualPredicateId {
  return KNOWN_PREDICATES.has(value as VisualPredicateId)
}

function collectVisuals(question: GeneratedQuestion): VisualSpec[] {
  const out: VisualSpec[] = []
  if (question.visual) out.push(question.visual)
  for (const opt of question.options ?? []) {
    if (isPictureOption(opt) && opt.visual) out.push(opt.visual)
  }
  return out
}

function questionHasVisuals(question: GeneratedQuestion): boolean {
  return collectVisuals(question).length > 0
}

/** Structural + margin checks for any question that carries VisualSpec data. */
export function validateVisualStructure(question: GeneratedQuestion): string[] {
  if (!questionHasVisuals(question)) return []

  const reasons: string[] = []

  if (question.visual) {
    if (!question.altText?.trim()) {
      reasons.push('prompt visual is set but altText is missing')
    }
    for (const r of visualSpecMarginReasons(question.visual)) {
      reasons.push(`prompt visual: ${r}`)
    }
  }

  const options = question.options
  if (options) {
    const fingerprints = new Map<string, string>()
    for (let i = 0; i < options.length; i += 1) {
      const opt = options[i]!
      if (!isPictureOption(opt)) continue

      if (!opt.altText?.trim()) {
        reasons.push(`option[${i}] missing altText`)
      }
      if (!opt.visual) {
        reasons.push(`picture option[${i}] (${opt.id}) missing visual`)
        continue
      }

      for (const r of visualSpecMarginReasons(opt.visual)) {
        reasons.push(`option[${i}] (${opt.id}): ${r}`)
      }

      const fp = visualFingerprint(opt.visual)
      const prior = fingerprints.get(fp)
      if (prior !== undefined) {
        reasons.push(
          `options are not structurally distinct (${prior} and ${opt.id} share the same VisualSpec)`,
        )
      } else {
        fingerprints.set(fp, opt.id)
      }
    }
  }

  return reasons
}

/**
 * Re-derive answers from VisualSpec using `question.visualPredicate`.
 * - MC: exactly one option must satisfy the boolean predicate; its id = correctAnswer
 * - TF: prompt visual boolean must match correctAnswer
 * - short-answer: numeric predicates (e.g. shaded count) must match correctAnswer
 */
export function validateVisualAnswer(question: GeneratedQuestion): string[] {
  const predicateId = question.visualPredicate
  if (!predicateId) return []
  if (!isVisualPredicateId(predicateId)) {
    return [`unknown visualPredicate "${predicateId}"`]
  }

  if (question.type === 'multiple-choice') {
    return validatePictureOptionsExactlyOne(question, predicateId)
  }

  if (question.type === 'true-false') {
    return validateTrueFalseFromVisual(question, predicateId)
  }

  if (question.type === 'short-answer') {
    return validateShortAnswerFromVisual(question, predicateId)
  }

  return []
}

function validatePictureOptionsExactlyOne(
  question: GeneratedQuestion,
  predicateId: VisualPredicateId,
): string[] {
  const reasons: string[] = []
  const options = question.options
  if (!options?.length) {
    reasons.push('visualPredicate set but multiple-choice has no options')
    return reasons
  }

  const trueIds: string[] = []
  for (const opt of options) {
    if (!isPictureOption(opt) || !opt.visual) {
      reasons.push(
        `visualPredicate "${predicateId}" requires picture options with visuals`,
      )
      return reasons
    }
    const result = evaluateVisualPredicate(predicateId, opt.visual)
    if (typeof result === 'number') {
      reasons.push(
        `visualPredicate "${predicateId}" returned a number; use a boolean predicate for MC`,
      )
      return reasons
    }
    if (result === 'ambiguous') {
      reasons.push(
        `option ${opt.id}: VisualSpec is ambiguous for predicate "${predicateId}"`,
      )
    } else if (result === true) {
      trueIds.push(opt.id)
    }
  }

  if (trueIds.length !== 1) {
    reasons.push(
      `exactly one option must satisfy "${predicateId}" (found ${trueIds.length}: [${trueIds.join(', ')}])`,
    )
  } else if (trueIds[0] !== question.correctAnswer) {
    reasons.push(
      `re-derived correct option is "${trueIds[0]}" but correctAnswer is "${question.correctAnswer}"`,
    )
  }

  return reasons
}

function validateTrueFalseFromVisual(
  question: GeneratedQuestion,
  predicateId: VisualPredicateId,
): string[] {
  if (!question.visual) {
    return ['true-false visualPredicate requires question.visual']
  }
  const result = evaluateVisualPredicate(predicateId, question.visual)
  if (typeof result === 'number') {
    return [
      `visualPredicate "${predicateId}" returned a number; use a boolean predicate for true-false`,
    ]
  }
  if (result === 'ambiguous') {
    return [`prompt visual is ambiguous for predicate "${predicateId}"`]
  }
  const claimed = question.correctAnswer.trim().toLowerCase() === 'true'
  if (result !== claimed) {
    return [
      `re-derived ${predicateId}=${result} but correctAnswer is "${question.correctAnswer}"`,
    ]
  }
  return []
}

function validateShortAnswerFromVisual(
  question: GeneratedQuestion,
  predicateId: VisualPredicateId,
): string[] {
  if (!question.visual) {
    return ['short-answer visualPredicate requires question.visual']
  }
  const result = evaluateVisualPredicate(predicateId, question.visual)
  if (result === 'ambiguous') {
    return [`prompt visual is ambiguous for predicate "${predicateId}"`]
  }
  if (typeof result === 'boolean') {
    const expected = result ? 'true' : 'false'
    if (question.correctAnswer.trim().toLowerCase() !== expected) {
      return [
        `re-derived ${predicateId}=${result} but correctAnswer is "${question.correctAnswer}"`,
      ]
    }
    return []
  }
  // numeric
  if (String(result) !== question.correctAnswer.trim()) {
    return [
      `re-derived ${predicateId}=${result} but correctAnswer is "${question.correctAnswer}"`,
    ]
  }
  return []
}

/** All visual validation reasons for a question. */
export function validateVisualQuestion(question: GeneratedQuestion): string[] {
  return [
    ...validateVisualStructure(question),
    ...validateVisualAnswer(question),
  ]
}

/** Test helper: count how many picture options satisfy a boolean predicate. */
export function countMatchingPictureOptions(
  options: QuestionOption[],
  predicateId: VisualPredicateId,
): { trueIds: string[]; ambiguousIds: string[] } {
  const trueIds: string[] = []
  const ambiguousIds: string[] = []
  for (const opt of options) {
    if (!isPictureOption(opt) || !opt.visual) continue
    const result = evaluateVisualPredicate(predicateId, opt.visual)
    if (result === 'ambiguous') ambiguousIds.push(opt.id)
    else if (result === true) trueIds.push(opt.id)
  }
  return { trueIds, ambiguousIds }
}
