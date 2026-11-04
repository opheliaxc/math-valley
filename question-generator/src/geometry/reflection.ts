import type { Point2D } from '../visual.ts'
import { GEOMETRY_TOLERANCE } from './tolerances.ts'
import { add, dot, length, scale, vec } from './vectors.ts'

/**
 * Reflect point `p` across the infinite line through `axisA` and `axisB`.
 * Returns null if the axis is degenerate.
 */
export function reflectPoint(
  p: Point2D,
  axisA: Point2D,
  axisB: Point2D,
): Point2D | null {
  const axis = vec(axisA, axisB)
  const len2 = axis.x * axis.x + axis.y * axis.y
  if (len2 < GEOMETRY_TOLERANCE.exactEps) return null

  const ap = vec(axisA, p)
  const t = dot(ap, axis) / len2
  const proj = add(axisA, scale(axis, t))
  return {
    x: 2 * proj.x - p.x,
    y: 2 * proj.y - p.y,
  }
}

/** Reflect every point; returns null if the axis is degenerate. */
export function reflectPoints(
  points: Point2D[],
  axisA: Point2D,
  axisB: Point2D,
): Point2D[] | null {
  const out: Point2D[] = []
  for (const p of points) {
    const r = reflectPoint(p, axisA, axisB)
    if (!r) return null
    out.push(r)
  }
  return out
}

/**
 * True if reflecting `points` across the axis yields the same multiset of
 * vertices (within `eps`). Suitable for integer-grid symmetry checks.
 */
export function isSymmetricAcross(
  points: Point2D[],
  axisA: Point2D,
  axisB: Point2D,
  eps: number = 1e-6,
): boolean {
  const reflected = reflectPoints(points, axisA, axisB)
  if (!reflected) return false
  if (reflected.length !== points.length) return false

  const used = new Array(points.length).fill(false)
  for (const r of reflected) {
    let found = false
    for (let i = 0; i < points.length; i += 1) {
      if (used[i]) continue
      const p = points[i]!
      if (Math.hypot(p.x - r.x, p.y - r.y) <= eps) {
        used[i] = true
        found = true
        break
      }
    }
    if (!found) return false
  }
  return true
}

export function pointsAlmostEqual(
  a: Point2D,
  b: Point2D,
  eps: number = 1e-6,
): boolean {
  return length(vec(a, b)) <= eps
}
