import type { Point2D } from '../visual.ts'
import { GEOMETRY_TOLERANCE } from './tolerances.ts'
import { angleBetweenVectorsDeg, vec } from './vectors.ts'

export type AngleClass = 'acute' | 'right' | 'obtuse' | 'ambiguous'

/**
 * Classify an interior angle in degrees using spec margins:
 * acute ≤ 75°, right ≈ 90°, obtuse ≥ 105°; anything between is ambiguous.
 */
export function classifyAngleDeg(
  degrees: number,
  opts: {
    acuteMax?: number
    obtuseMin?: number
    rightEpsilon?: number
  } = {},
): AngleClass {
  if (!Number.isFinite(degrees)) return 'ambiguous'
  const acuteMax = opts.acuteMax ?? GEOMETRY_TOLERANCE.acuteMaxDeg
  const obtuseMin = opts.obtuseMin ?? GEOMETRY_TOLERANCE.obtuseMinDeg
  const rightEps = opts.rightEpsilon ?? GEOMETRY_TOLERANCE.rightEpsilonDeg

  const d = Math.abs(degrees)
  if (Math.abs(d - 90) <= rightEps) return 'right'
  if (d <= acuteMax) return 'acute'
  if (d >= obtuseMin) return 'obtuse'
  return 'ambiguous'
}

/** Angle at `vertex` formed by points `from` → vertex → `to`, in [0, 180]. */
export function angleAtVertexDeg(
  vertex: Point2D,
  from: Point2D,
  to: Point2D,
): number {
  return angleBetweenVectorsDeg(vec(vertex, from), vec(vertex, to))
}

export function classifyAngleAtVertex(
  vertex: Point2D,
  from: Point2D,
  to: Point2D,
): AngleClass {
  return classifyAngleDeg(angleAtVertexDeg(vertex, from, to))
}
