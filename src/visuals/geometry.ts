import type { Point2D } from '../../question-generator/src/types.ts'

export type Bounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function polar(cx: number, cy: number, r: number, deg: number): Point2D {
  const rad = degToRad(deg)
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

/** SVG y-down angle of vector from `from` to `to`, in degrees (0 = right, CCW). */
export function vectorAngleDeg(from: Point2D, to: Point2D): number {
  return radToDeg(Math.atan2(-(to.y - from.y), to.x - from.x))
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function emptyBounds(): Bounds {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
}

export function expandBounds(bounds: Bounds, point: Point2D): void {
  bounds.minX = Math.min(bounds.minX, point.x)
  bounds.minY = Math.min(bounds.minY, point.y)
  bounds.maxX = Math.max(bounds.maxX, point.x)
  bounds.maxY = Math.max(bounds.maxY, point.y)
}

export function boundsFromPoints(points: Point2D[]): Bounds {
  const bounds = emptyBounds()
  for (const p of points) expandBounds(bounds, p)
  return bounds
}

export function unionBounds(a: Bounds, b: Bounds): Bounds {
  if (!Number.isFinite(a.minX)) return b
  if (!Number.isFinite(b.minX)) return a
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

export function padBounds(bounds: Bounds, pad: number): Bounds {
  return {
    minX: bounds.minX - pad,
    minY: bounds.minY - pad,
    maxX: bounds.maxX + pad,
    maxY: bounds.maxY + pad,
  }
}

export function boundsSize(bounds: Bounds): { w: number; h: number } {
  const w = Math.max(bounds.maxX - bounds.minX, 1)
  const h = Math.max(bounds.maxY - bounds.minY, 1)
  return { w, h }
}

export function boundsCenter(bounds: Bounds): Point2D {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
}

export function rotatePoint(
  point: Point2D,
  deg: number,
  origin: Point2D,
): Point2D {
  const rad = degToRad(deg)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

export function rotateBounds(bounds: Bounds, deg: number): Bounds {
  if (deg === 0 || !Number.isFinite(bounds.minX)) return bounds
  const origin = boundsCenter(bounds)
  const corners: Point2D[] = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ].map((p) => rotatePoint(p, deg, origin))
  return boundsFromPoints(corners)
}

/** SVG arc path from startDeg→endDeg (math angles, CCW, 0 = right). */
export function svgArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  let sweep = endDeg - startDeg
  while (sweep <= -360) sweep += 360
  while (sweep >= 360) sweep -= 360
  if (Math.abs(sweep) < 0.001) sweep = 0.001

  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, endDeg)
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0
  const sweepFlag = sweep >= 0 ? 0 : 1 // SVG y-down: CCW math → sweep 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}`
}

/** Closed pie slice from center through startDeg→endDeg. */
export function svgPieSlicePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const arc = svgArcPath(cx, cy, r, startDeg, endDeg)
  // arc is "M x y A ..."; prepend move-to-center and line-to arc start.
  return `M ${cx} ${cy} L ${arc.slice(2)} Z`
}

/** Extend a directed segment so rays/lines reach past the endpoints. */
export function extendRay(
  a: Point2D,
  b: Point2D,
  factor: number,
): { start: Point2D; end: Point2D } {
  const len = distance(a, b) || 1
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  const reach = len * factor
  return {
    start: a,
    end: { x: a.x + ux * reach, y: a.y + uy * reach },
  }
}

export function extendLine(
  a: Point2D,
  b: Point2D,
  factor: number,
): { start: Point2D; end: Point2D } {
  const len = distance(a, b) || 1
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  const reach = len * factor
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  return {
    start: { x: mid.x - ux * reach, y: mid.y - uy * reach },
    end: { x: mid.x + ux * reach, y: mid.y + uy * reach },
  }
}
