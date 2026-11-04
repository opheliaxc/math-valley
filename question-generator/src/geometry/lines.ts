import type { Point2D } from '../visual.ts'
import { GEOMETRY_TOLERANCE } from './tolerances.ts'
import {
  cross,
  dot,
  length,
  lineAngleSeparationDeg,
  normalize,
} from './vectors.ts'

/** Exactly parallel (or anti-parallel) within floating-point epsilon. */
export function areParallel(
  dirA: Point2D,
  dirB: Point2D,
  eps: number = GEOMETRY_TOLERANCE.exactEps,
): boolean {
  const a = normalize(dirA)
  const b = normalize(dirB)
  if (!a || !b) return false
  return Math.abs(cross(a, b)) <= eps
}

/** Exactly perpendicular within floating-point epsilon. */
export function arePerpendicular(
  dirA: Point2D,
  dirB: Point2D,
  eps: number = GEOMETRY_TOLERANCE.exactEps,
): boolean {
  const a = normalize(dirA)
  const b = normalize(dirB)
  if (!a || !b) return false
  return Math.abs(dot(a, b)) <= eps
}

export type ParallelRelation = 'parallel' | 'clear' | 'ambiguous'

/**
 * Parallel if exact; clearly not if ≥ parallelClearDeg apart; else ambiguous
 * (redraw). Spec: exactly parallel or at least 10° apart.
 */
export function parallelRelation(
  dirA: Point2D,
  dirB: Point2D,
  clearDeg: number = GEOMETRY_TOLERANCE.parallelClearDeg,
): ParallelRelation {
  if (areParallel(dirA, dirB)) return 'parallel'
  const sep = lineAngleSeparationDeg(dirA, dirB)
  if (!Number.isFinite(sep)) return 'ambiguous'
  // Tiny epsilon so "exactly 10°" survives float error on cos/sin.
  if (sep + 1e-9 >= clearDeg) return 'clear'
  return 'ambiguous'
}

export type PerpendicularRelation = 'perpendicular' | 'clear' | 'ambiguous'

/**
 * Perpendicular if exact; clearly not if angle to 90° is ≥ parallelClearDeg;
 * else ambiguous.
 */
export function perpendicularRelation(
  dirA: Point2D,
  dirB: Point2D,
  clearDeg: number = GEOMETRY_TOLERANCE.parallelClearDeg,
): PerpendicularRelation {
  if (arePerpendicular(dirA, dirB)) return 'perpendicular'
  const sep = lineAngleSeparationDeg(dirA, dirB)
  if (!Number.isFinite(sep)) return 'ambiguous'
  // sep ∈ [0, 90]; distance from a right angle is |90 − sep|.
  if (Math.abs(90 - sep) >= clearDeg) return 'clear'
  return 'ambiguous'
}

/** Convenience: direction of segment AB. */
export function segmentDirection(a: Point2D, b: Point2D): Point2D {
  return { x: b.x - a.x, y: b.y - a.y }
}

export function isZeroVector(v: Point2D): boolean {
  return length(v) < GEOMETRY_TOLERANCE.exactEps
}
