/**
 * Named predicates over VisualSpec — answers come from the geometry.
 * Returns true / false, or 'ambiguous' when the figure sits in a tolerance margin.
 */
import {
  angleAtVertexDeg,
  classifyAngleAtVertex,
  classifyAngleDeg,
  hasNearCollinearVertices,
  isSimplePolygon,
  isSymmetricAcross,
  parallelRelation,
  perpendicularRelation,
  polygonArea,
  relativeAreaDifference,
  segmentDirection,
  unequalPartitionWeights,
} from './geometry/index.ts'
import { GEOMETRY_TOLERANCE } from './geometry/tolerances.ts'
import { length, vec } from './geometry/vectors.ts'
import type { Point2D, ShapeCompositePiece, VisualSpec } from './visual.ts'

export type PredicateResult = boolean | 'ambiguous'

export type VisualPredicateId =
  | 'is-closed-triangle'
  | 'is-simple-closed-polygon'
  | 'is-open-polyline'
  | 'is-circle'
  | 'is-square'
  | 'is-rectangle'
  | 'is-quadrilateral'
  | 'is-pentagon'
  | 'is-hexagon'
  | 'count-sides'
  | 'count-vertices'
  | 'count-shaded-cells'
  | 'is-equal-halves'
  | 'is-equal-thirds'
  | 'is-equal-fourths'
  | 'is-equal-sixths'
  | 'is-equal-eighths'
  | 'is-equal-partition'
  | 'partition-part-count'
  | 'is-non-polygon'
  | 'count-grid-cells'
  | 'count-triangle-pieces'
  | 'has-exactly-two-triangle-pieces'
  | 'composite-forms-rectangle'
  | 'composite-piece-count'
  | 'rect-composite-area'
  | 'is-ray'
  | 'is-line'
  | 'is-segment'
  | 'is-acute-angle'
  | 'is-right-angle'
  | 'is-obtuse-angle'
  | 'lines-are-parallel'
  | 'lines-are-perpendicular'
  | 'is-acute-triangle'
  | 'is-right-triangle'
  | 'is-obtuse-triangle'
  | 'is-parallelogram'
  | 'has-symmetry-axis'
  | 'protractor-measure'

/** Evaluate a named predicate on a VisualSpec. */
export function evaluateVisualPredicate(
  id: VisualPredicateId,
  spec: VisualSpec,
): PredicateResult | number {
  switch (id) {
    case 'is-closed-triangle':
      return isClosedTriangle(spec)
    case 'is-simple-closed-polygon':
      return isSimpleClosedPolygon(spec)
    case 'is-open-polyline':
      return isOpenPolyline(spec)
    case 'is-circle':
      return spec.kind === 'circle'
    case 'is-square':
      return isSquare(spec)
    case 'is-rectangle':
      return isRectangle(spec)
    case 'is-quadrilateral':
      return isNGon(spec, 4)
    case 'is-pentagon':
      return isNGon(spec, 5)
    case 'is-hexagon':
      return isNGon(spec, 6)
    case 'count-sides': {
      const n = countSides(spec)
      return n === null ? false : n
    }
    case 'count-vertices': {
      const n = countSides(spec)
      return n === null ? false : n
    }
    case 'count-shaded-cells': {
      const n = countShadedCells(spec)
      return n === null ? false : n
    }
    case 'is-equal-halves':
      return isEqualPartition(spec, 2)
    case 'is-equal-thirds':
      return isEqualPartition(spec, 3)
    case 'is-equal-fourths':
      return isEqualPartition(spec, 4)
    case 'is-equal-sixths':
      return isEqualPartition(spec, 6)
    case 'is-equal-eighths':
      return isEqualPartition(spec, 8)
    case 'is-equal-partition':
      return spec.kind === 'partitioned-shape' && spec.equal
    case 'partition-part-count': {
      if (spec.kind !== 'partitioned-shape') return false
      return spec.parts
    }
    case 'is-non-polygon':
      return isNonPolygon(spec)
    case 'count-grid-cells': {
      const n = countGridCells(spec)
      return n === null ? false : n
    }
    case 'count-triangle-pieces': {
      const n = countTrianglePieces(spec)
      return n === null ? false : n
    }
    case 'has-exactly-two-triangle-pieces': {
      const n = countTrianglePieces(spec)
      return n === null ? false : n === 2
    }
    case 'composite-forms-rectangle':
      return compositeFormsRectangle(spec)
    case 'composite-piece-count': {
      if (spec.kind !== 'shape-composite') return false
      return spec.pieces.length
    }
    case 'rect-composite-area': {
      const n = rectCompositeArea(spec)
      return n === null ? false : n
    }
    case 'is-ray':
      return isSingleLineType(spec, 'ray')
    case 'is-line':
      return isSingleLineType(spec, 'line')
    case 'is-segment':
      return isSingleLineType(spec, 'segment')
    case 'is-acute-angle':
      return angleClassIs(spec, 'acute')
    case 'is-right-angle':
      return angleClassIs(spec, 'right')
    case 'is-obtuse-angle':
      return angleClassIs(spec, 'obtuse')
    case 'lines-are-parallel':
      return twoLinesRelation(spec, 'parallel')
    case 'lines-are-perpendicular':
      return twoLinesRelation(spec, 'perpendicular')
    case 'is-acute-triangle':
      return triangleAngleClassIs(spec, 'acute')
    case 'is-right-triangle':
      return triangleAngleClassIs(spec, 'right')
    case 'is-obtuse-triangle':
      return triangleAngleClassIs(spec, 'obtuse')
    case 'is-parallelogram':
      return isParallelogram(spec)
    case 'has-symmetry-axis':
      return hasSymmetryAxis(spec)
    case 'protractor-measure': {
      if (spec.kind !== 'protractor-angle') return false
      return spec.measureDeg
    }
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

export function isClosedTriangle(spec: VisualSpec): PredicateResult {
  if (spec.kind !== 'polygon') return false
  if (spec.closed === false) return false
  if (spec.points.length !== 3) return false
  if (hasNearCollinearVertices(spec.points)) return 'ambiguous'
  if (!isSimplePolygon(spec.points)) return false
  if (polygonArea(spec.points) <= GEOMETRY_TOLERANCE.exactEps) return 'ambiguous'
  return true
}

export function isSimpleClosedPolygon(spec: VisualSpec): PredicateResult {
  if (spec.kind !== 'polygon') return false
  if (spec.closed === false) return false
  if (spec.points.length < 3) return false
  if (hasNearCollinearVertices(spec.points)) return 'ambiguous'
  if (!isSimplePolygon(spec.points)) return false
  return true
}

export function isOpenPolyline(spec: VisualSpec): PredicateResult {
  if (spec.kind !== 'polygon') return false
  return spec.closed === false
}

/** True for figures that are not simple closed polygons (circle, open path, …). */
export function isNonPolygon(spec: VisualSpec): PredicateResult {
  if (spec.kind === 'circle') return true
  if (spec.kind === 'polygon' && spec.closed === false) return true
  if (spec.kind === 'polygon') {
    const closed = isSimpleClosedPolygon(spec)
    if (closed === 'ambiguous') return 'ambiguous'
    return closed === false
  }
  // Other kinds (arcs, grids, …) are not Grade-2 polygon figures.
  if (
    spec.kind === 'arc' ||
    spec.kind === 'grid' ||
    spec.kind === 'partitioned-shape' ||
    spec.kind === 'shape-composite'
  ) {
    return true
  }
  return false
}

export function countGridCells(spec: VisualSpec): number | null {
  if (spec.kind !== 'grid') return null
  return spec.rows * spec.cols
}

export function isSquare(spec: VisualSpec): PredicateResult {
  const rect = isRectangle(spec)
  if (rect !== true) return rect
  if (spec.kind !== 'polygon') return false
  const sides = sideLengths(spec.points)
  if (!sidesNearlyEqual(sides)) return false
  return true
}

export function isRectangle(spec: VisualSpec): PredicateResult {
  if (spec.kind !== 'polygon') return false
  if (spec.closed === false) return false
  if (spec.points.length !== 4) return false
  if (hasNearCollinearVertices(spec.points)) return 'ambiguous'
  if (!isSimplePolygon(spec.points)) return false
  if (polygonArea(spec.points) <= GEOMETRY_TOLERANCE.exactEps) return 'ambiguous'

  const pts = spec.points
  for (let i = 0; i < 4; i += 1) {
    const prev = pts[(i + 3) % 4]!
    const cur = pts[i]!
    const next = pts[(i + 1) % 4]!
    const deg = angleAtVertexDeg(cur, prev, next)
    const right = isNearRightAngle(deg)
    if (right === 'ambiguous') return 'ambiguous'
    if (right === false) return false
  }

  const sides = sideLengths(pts)
  // Opposite sides equal (within relative tolerance).
  if (!nearEqual(sides[0]!, sides[2]!) || !nearEqual(sides[1]!, sides[3]!)) {
    return false
  }
  return true
}

/** Side count for closed polygons; 0 for circles; null if not applicable. */
export function countSides(spec: VisualSpec): number | null {
  if (spec.kind === 'circle') return 0
  if (spec.kind !== 'polygon') return null
  if (spec.closed === false) return null
  return spec.points.length
}

export function countShadedCells(spec: VisualSpec): number | null {
  if (spec.kind !== 'grid') return null
  return spec.shaded?.length ?? 0
}

/** Simple closed n-gon (side count unambiguous). */
export function isNGon(spec: VisualSpec, sides: number): PredicateResult {
  const closed = isSimpleClosedPolygon(spec)
  if (closed !== true) return closed
  if (spec.kind !== 'polygon') return false
  if (spec.points.length !== sides) return false
  return true
}

/** Sum of rectangle areas in a rect-composite (unit lengths). */
export function rectCompositeArea(spec: VisualSpec): number | null {
  if (spec.kind !== 'rect-composite') return null
  if (spec.rects.length === 0) return null
  let area = 0
  for (const r of spec.rects) {
    if (r.w <= 0 || r.h <= 0) return null
    area += r.w * r.h
  }
  return area
}

function isSingleLineType(
  spec: VisualSpec,
  type: 'line' | 'ray' | 'segment',
): PredicateResult {
  if (spec.kind !== 'lines') return false
  if (spec.items.length !== 1) return false
  return spec.items[0]!.type === type
}

function angleClassIs(
  spec: VisualSpec,
  want: 'acute' | 'right' | 'obtuse',
): PredicateResult {
  if (spec.kind === 'protractor-angle') {
    const cls = classifyAngleDeg(spec.measureDeg)
    if (cls === 'ambiguous') return 'ambiguous'
    return cls === want
  }
  if (spec.kind !== 'angle') return false
  const cls = classifyAngleAtVertex(spec.vertex, spec.from, spec.to)
  if (cls === 'ambiguous') return 'ambiguous'
  return cls === want
}

function twoLinesRelation(
  spec: VisualSpec,
  want: 'parallel' | 'perpendicular',
): PredicateResult {
  if (spec.kind !== 'lines') return false
  if (spec.items.length < 2) return false
  const a = spec.items[0]!
  const b = spec.items[1]!
  const dirA = segmentDirection(a.a, a.b)
  const dirB = segmentDirection(b.a, b.b)
  if (want === 'parallel') {
    const rel = parallelRelation(dirA, dirB)
    if (rel === 'ambiguous') return 'ambiguous'
    return rel === 'parallel'
  }
  const rel = perpendicularRelation(dirA, dirB)
  if (rel === 'ambiguous') return 'ambiguous'
  return rel === 'perpendicular'
}

function triangleAngleClassIs(
  spec: VisualSpec,
  want: 'acute' | 'right' | 'obtuse',
): PredicateResult {
  if (spec.kind !== 'polygon') return false
  if (spec.closed === false) return false
  if (spec.points.length !== 3) return false
  if (hasNearCollinearVertices(spec.points)) return 'ambiguous'
  if (!isSimplePolygon(spec.points)) return false

  const pts = spec.points
  const classes: Array<'acute' | 'right' | 'obtuse'> = []
  for (let i = 0; i < 3; i += 1) {
    const cls = classifyAngleAtVertex(
      pts[i]!,
      pts[(i + 2) % 3]!,
      pts[(i + 1) % 3]!,
    )
    if (cls === 'ambiguous') return 'ambiguous'
    classes.push(cls)
  }
  if (classes.includes('right')) return want === 'right'
  if (classes.includes('obtuse')) return want === 'obtuse'
  return want === 'acute'
}

/** Convex quad with both pairs of opposite sides parallel. */
export function isParallelogram(spec: VisualSpec): PredicateResult {
  if (spec.kind !== 'polygon') return false
  if (spec.closed === false) return false
  if (spec.points.length !== 4) return false
  if (hasNearCollinearVertices(spec.points)) return 'ambiguous'
  if (!isSimplePolygon(spec.points)) return false
  const p = spec.points
  const d01 = segmentDirection(p[0]!, p[1]!)
  const d12 = segmentDirection(p[1]!, p[2]!)
  const d23 = segmentDirection(p[2]!, p[3]!)
  const d30 = segmentDirection(p[3]!, p[0]!)
  const r1 = parallelRelation(d01, d23)
  const r2 = parallelRelation(d12, d30)
  if (r1 === 'ambiguous' || r2 === 'ambiguous') return 'ambiguous'
  return r1 === 'parallel' && r2 === 'parallel'
}

/** Dashed axis on a symmetry-figure is a true fold line. */
export function hasSymmetryAxis(spec: VisualSpec): PredicateResult {
  if (spec.kind !== 'symmetry-figure') return false
  if (!spec.axis) return false
  if (spec.points.length < 3) return false
  if (hasNearCollinearVertices(spec.points)) return 'ambiguous'
  if (!isSimplePolygon(spec.points)) return false
  return isSymmetricAcross(spec.points, spec.axis.a, spec.axis.b)
}

function isEqualPartition(spec: VisualSpec, parts: number): PredicateResult {
  if (spec.kind !== 'partitioned-shape') return false
  if (spec.parts !== parts) return false
  return spec.equal
}

export function countTrianglePieces(spec: VisualSpec): number | null {
  if (spec.kind !== 'shape-composite') return null
  let count = 0
  for (const piece of spec.pieces) {
    if (pieceIsClosedTriangle(piece)) count += 1
  }
  return count
}

function pieceIsClosedTriangle(piece: ShapeCompositePiece): boolean {
  if (piece.type !== 'polygon') return false
  if (piece.closed === false) return false
  if (piece.points.length !== 3) return false
  if (hasNearCollinearVertices(piece.points)) return false
  if (!isSimplePolygon(piece.points)) return false
  return polygonArea(piece.points) > GEOMETRY_TOLERANCE.exactEps
}

/**
 * True when polygon pieces tile an axis-aligned rectangle (area sum ≈ bbox).
 * Used for NY-1.G.2 composite recognition.
 */
export function compositeFormsRectangle(spec: VisualSpec): PredicateResult {
  if (spec.kind !== 'shape-composite') return false
  const polys = spec.pieces.filter(
    (p): p is Extract<ShapeCompositePiece, { type: 'polygon' }> =>
      p.type === 'polygon' && p.closed !== false,
  )
  if (polys.length < 2) return false

  const allPoints: Point2D[] = []
  let sumArea = 0
  for (const piece of polys) {
    if (hasNearCollinearVertices(piece.points)) return 'ambiguous'
    if (!isSimplePolygon(piece.points)) return false
    const area = polygonArea(piece.points)
    if (area <= GEOMETRY_TOLERANCE.exactEps) return 'ambiguous'
    sumArea += area
    allPoints.push(...piece.points)
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of allPoints) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const bboxArea = (maxX - minX) * (maxY - minY)
  if (bboxArea <= GEOMETRY_TOLERANCE.exactEps) return 'ambiguous'

  const rel = relativeAreaDifference(sumArea, bboxArea)
  // Pieces must fill the bbox (no large gaps); allow small float error.
  if (rel > 0.08) return false
  return true
}

/**
 * Intrinsic margin / quality checks on a single VisualSpec (no question context).
 * Returns human-readable failure reasons.
 */
export function visualSpecMarginReasons(spec: VisualSpec): string[] {
  const reasons: string[] = []

  switch (spec.kind) {
    case 'polygon': {
      if (spec.closed !== false && spec.points.length >= 3) {
        if (hasNearCollinearVertices(spec.points)) {
          reasons.push('polygon has near-collinear vertices (ambiguous side count)')
        }
        if (!isSimplePolygon(spec.points)) {
          reasons.push('polygon is self-intersecting (not simple)')
        }
        if (polygonArea(spec.points) <= GEOMETRY_TOLERANCE.exactEps) {
          reasons.push('polygon has zero area')
        }
      }
      break
    }
    case 'angle': {
      const deg = angleAtVertexDeg(spec.vertex, spec.from, spec.to)
      if (classifyAngleDeg(deg) === 'ambiguous') {
        reasons.push(
          `angle ${deg.toFixed(1)}° sits in acute/right/obtuse margin`,
        )
      }
      break
    }
    case 'protractor-angle': {
      if (classifyAngleDeg(spec.measureDeg) === 'ambiguous') {
        reasons.push(
          `protractor measure ${spec.measureDeg}° sits in acute/right/obtuse margin`,
        )
      }
      break
    }
    case 'lines': {
      for (let i = 0; i < spec.items.length; i += 1) {
        for (let j = i + 1; j < spec.items.length; j += 1) {
          const a = spec.items[i]!
          const b = spec.items[j]!
          const rel = parallelRelation(
            segmentDirection(a.a, a.b),
            segmentDirection(b.a, b.b),
          )
          if (rel === 'ambiguous') {
            reasons.push(
              `line pair (${i},${j}) sits in parallel tolerance margin`,
            )
          }
        }
      }
      break
    }
    case 'partitioned-shape': {
      if (spec.cut === 'grid-2x2' && spec.parts !== 4) {
        reasons.push('grid-2x2 cut requires parts === 4')
      }
      if (spec.cut === 'diagonal' && spec.parts !== 2) {
        reasons.push('diagonal cut requires parts === 2')
      }
      if (spec.cut === 'diagonal' && spec.shape !== 'rectangle') {
        reasons.push('diagonal cut requires a rectangle')
      }
      if (!spec.equal && spec.parts >= 2) {
        const weights = unequalPartitionWeights(spec.parts)
        const total = weights.reduce((s, w) => s + w, 0)
        const areas = weights.map((w) => w / total)
        let minDiff = Infinity
        for (let i = 0; i < areas.length; i += 1) {
          for (let j = i + 1; j < areas.length; j += 1) {
            minDiff = Math.min(
              minDiff,
              relativeAreaDifference(areas[i]!, areas[j]!),
            )
          }
        }
        if (minDiff < GEOMETRY_TOLERANCE.unequalAreaMinRatio) {
          reasons.push(
            `unequal partition parts differ by only ${(minDiff * 100).toFixed(1)}% (need ≥ 25%)`,
          )
        }
      }
      break
    }
    case 'shape-composite': {
      for (let i = 0; i < spec.pieces.length; i += 1) {
        const piece = spec.pieces[i]!
        if (piece.type === 'polygon' && piece.closed !== false) {
          if (hasNearCollinearVertices(piece.points)) {
            reasons.push(`composite piece[${i}] has near-collinear vertices`)
          }
          if (!isSimplePolygon(piece.points)) {
            reasons.push(`composite piece[${i}] is not a simple polygon`)
          }
        }
      }
      break
    }
    case 'symmetry-figure': {
      if (spec.points.length >= 3) {
        if (hasNearCollinearVertices(spec.points)) {
          reasons.push('symmetry figure has near-collinear vertices')
        }
        if (!isSimplePolygon(spec.points)) {
          reasons.push('symmetry figure is not a simple polygon')
        }
      }
      break
    }
    default:
      break
  }

  return reasons
}

/** Stable structural fingerprint for "options must be distinct". */
export function visualFingerprint(spec: VisualSpec): string {
  return JSON.stringify(spec)
}

function sideLengths(points: Point2D[]): number[] {
  const n = points.length
  const out: number[] = []
  for (let i = 0; i < n; i += 1) {
    out.push(length(vec(points[i]!, points[(i + 1) % n]!)))
  }
  return out
}

function nearEqual(a: number, b: number, rel = 0.06): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1)
  return Math.abs(a - b) <= scale * rel + GEOMETRY_TOLERANCE.exactEps
}

function sidesNearlyEqual(sides: number[]): boolean {
  if (sides.length === 0) return false
  const mean = sides.reduce((s, n) => s + n, 0) / sides.length
  return sides.every((n) => nearEqual(n, mean))
}

/** Right angle with a small float/rotation tolerance; near-miss → ambiguous. */
function isNearRightAngle(deg: number): PredicateResult {
  const err = Math.abs(Math.abs(deg) - 90)
  if (err <= 1.5) return true
  if (err < 15) return 'ambiguous'
  return false
}
