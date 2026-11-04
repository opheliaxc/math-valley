import type { Point2D } from '../visual.ts'
import { GEOMETRY_TOLERANCE } from './tolerances.ts'
import { cross, length, vec } from './vectors.ts'

/** Shoelace area (always ≥ 0). Needs ≥ 3 points. */
export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

/** Perimeter of a closed polygon (or open path if `closed` is false). */
export function polygonPerimeter(
  points: Point2D[],
  closed = true,
): number {
  if (points.length < 2) return 0
  let sum = 0
  const last = closed ? points.length : points.length - 1
  for (let i = 0; i < last; i += 1) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    sum += length(vec(a, b))
  }
  return sum
}

/**
 * True if three consecutive vertices are nearly collinear (ambiguous side).
 * Checked for every vertex of a closed ring.
 */
export function hasNearCollinearVertices(
  points: Point2D[],
  sinEps: number = GEOMETRY_TOLERANCE.collinearSinEps,
): boolean {
  if (points.length < 3) return false
  const n = points.length
  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n]!
    const cur = points[i]!
    const next = points[(i + 1) % n]!
    const u = vec(prev, cur)
    const v = vec(cur, next)
    const lu = length(u)
    const lv = length(v)
    if (lu < GEOMETRY_TOLERANCE.exactEps || lv < GEOMETRY_TOLERANCE.exactEps) {
      return true
    }
    const sin = Math.abs(cross(u, v)) / (lu * lv)
    if (sin < sinEps) return true
  }
  return false
}

/** Proper intersection of open segments AB and CD (shared endpoints ignored). */
export function segmentsIntersectProperly(
  a: Point2D,
  b: Point2D,
  c: Point2D,
  d: Point2D,
): boolean {
  const ab = vec(a, b)
  const ac = vec(a, c)
  const ad = vec(a, d)
  const cd = vec(c, d)
  const ca = vec(c, a)
  const cb = vec(c, b)

  const d1 = cross(ab, ac)
  const d2 = cross(ab, ad)
  const d3 = cross(cd, ca)
  const d4 = cross(cd, cb)

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true
  }
  return false
}

function edgesShareVertex(i: number, j: number, n: number): boolean {
  if (i === j) return true
  // Adjacent edges along the ring (including first/last).
  if ((i + 1) % n === j || (j + 1) % n === i) return true
  return false
}

/**
 * Simple polygon: closed ring with no proper self-intersections.
 * Does not require convexity. Degenerate/near-collinear rings still count as
 * "simple" topologically — use `hasNearCollinearVertices` separately.
 */
export function isSimplePolygon(points: Point2D[]): boolean {
  const n = points.length
  if (n < 3) return false

  for (let i = 0; i < n; i += 1) {
    const a = points[i]!
    const b = points[(i + 1) % n]!
    for (let j = i + 1; j < n; j += 1) {
      if (edgesShareVertex(i, j, n)) continue
      const c = points[j]!
      const d = points[(j + 1) % n]!
      if (segmentsIntersectProperly(a, b, c, d)) return false
    }
  }
  return true
}
