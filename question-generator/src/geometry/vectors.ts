import type { Point2D } from '../visual.ts'
import { GEOMETRY_TOLERANCE } from './tolerances.ts'

export function vec(a: Point2D, b: Point2D): Point2D {
  return { x: b.x - a.x, y: b.y - a.y }
}

export function add(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function scale(v: Point2D, s: number): Point2D {
  return { x: v.x * s, y: v.y * s }
}

export function length(v: Point2D): number {
  return Math.hypot(v.x, v.y)
}

export function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y
}

/** 2D cross product magnitude (z-component): ax*by − ay*bx. */
export function cross(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x
}

export function normalize(v: Point2D): Point2D | null {
  const len = length(v)
  if (len < GEOMETRY_TOLERANCE.exactEps) return null
  return { x: v.x / len, y: v.y / len }
}

/** Interior angle between two directions, in degrees in [0, 180]. */
export function angleBetweenVectorsDeg(u: Point2D, v: Point2D): number {
  const nu = normalize(u)
  const nv = normalize(v)
  if (!nu || !nv) return NaN
  const cos = Math.min(1, Math.max(-1, dot(nu, nv)))
  return (Math.acos(cos) * 180) / Math.PI
}

/** Absolute angular separation of undirected lines, in [0, 90]. */
export function lineAngleSeparationDeg(dirA: Point2D, dirB: Point2D): number {
  const raw = angleBetweenVectorsDeg(dirA, dirB)
  if (!Number.isFinite(raw)) return NaN
  return raw > 90 ? 180 - raw : raw
}
