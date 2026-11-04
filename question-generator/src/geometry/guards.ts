import { GEOMETRY_TOLERANCE } from './tolerances.ts'
import type { AngleClass } from './angles.ts'
import { classifyAngleDeg } from './angles.ts'
import type { ParallelRelation, PerpendicularRelation } from './lines.ts'
import { parallelRelation, perpendicularRelation } from './lines.ts'
import type { Point2D } from '../visual.ts'

/**
 * Relative area difference |a−b| / max(a,b).
 * Returns 0 if both are ~0.
 */
export function relativeAreaDifference(a: number, b: number): number {
  const max = Math.max(Math.abs(a), Math.abs(b))
  if (max < GEOMETRY_TOLERANCE.exactEps) return 0
  return Math.abs(a - b) / max
}

/**
 * True when two areas differ by at least the unequal-partition margin (25%).
 * Use when generating "unequal" distractors.
 */
export function areasDifferEnough(
  a: number,
  b: number,
  minRatio: number = GEOMETRY_TOLERANCE.unequalAreaMinRatio,
): boolean {
  return relativeAreaDifference(a, b) >= minRatio
}

/**
 * Part weights for unequal partitioned-shape distractors.
 * Guarantees every pair differs by ≥ unequalAreaMinRatio (renderer + validator).
 */
export function unequalPartitionWeights(parts: number): number[] {
  const n = Math.max(parts, 1)
  // Exponential growth keeps adjacent shares clearly unequal on screen.
  return Array.from({ length: n }, (_, i) => Math.pow(2, i))
}

/** True when a classification result sits in an ambiguity margin (must redraw). */
export function isAngleClassAmbiguous(cls: AngleClass): boolean {
  return cls === 'ambiguous'
}

export function isParallelAmbiguous(
  dirA: Point2D,
  dirB: Point2D,
): boolean {
  return parallelRelation(dirA, dirB) === 'ambiguous'
}

export function isPerpendicularAmbiguous(
  dirA: Point2D,
  dirB: Point2D,
): boolean {
  return perpendicularRelation(dirA, dirB) === 'ambiguous'
}

/**
 * True if this degree measure must not be shown as a labeled angle class
 * (lands in the acute/right/obtuse gap).
 */
export function isAngleMeasureAmbiguous(degrees: number): boolean {
  return classifyAngleDeg(degrees) === 'ambiguous'
}

export type ClearLineRelation = ParallelRelation | PerpendicularRelation

export function isLineRelationAmbiguous(
  relation: ClearLineRelation,
): boolean {
  return relation === 'ambiguous'
}
