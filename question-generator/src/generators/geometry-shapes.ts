/**
 * Deterministic shape factories for Grade 1 Geometry generators.
 * Coordinates first; labels/predicates are derived afterward.
 */
import type { Rng } from '../rng.ts'
import type { Point2D, ShapeCompositePiece, VisualSpec } from '../visual.ts'

export type ShapeName =
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'circle'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon'
  | 'open-v'

const FILLS = ['#e2e8f0', '#fca5a5', '#93c5fd', '#86efac', '#fcd34d', '#d8b4fe']

export function pickFill(rng: Rng): string {
  return rng.pick(FILLS)
}

function centroid(points: Point2D[]): Point2D {
  const n = points.length || 1
  let x = 0
  let y = 0
  for (const p of points) {
    x += p.x
    y += p.y
  }
  return { x: x / n, y: y / n }
}

export function rotatePoints(
  points: Point2D[],
  deg: number,
): Point2D[] {
  if (deg === 0) return points.map((p) => ({ ...p }))
  const c = centroid(points)
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return points.map((p) => {
    const dx = p.x - c.x
    const dy = p.y - c.y
    return {
      x: c.x + dx * cos - dy * sin,
      y: c.y + dx * sin + dy * cos,
    }
  })
}

export function scalePoints(points: Point2D[], factor: number): Point2D[] {
  const c = centroid(points)
  return points.map((p) => ({
    x: c.x + (p.x - c.x) * factor,
    y: c.y + (p.y - c.y) * factor,
  }))
}

/** Upright equilateral-ish triangle. */
export function makeTriangle(
  rng: Rng,
  opts: { advanced?: boolean; fill?: string } = {},
): VisualSpec {
  const fill = opts.fill ?? pickFill(rng)
  let points: Point2D[]
  if (opts.advanced && rng.chance(0.5)) {
    // Scalene (clearly non-collinear)
    points = [
      { x: 0, y: 90 },
      { x: 40, y: 0 },
      { x: 110, y: 70 },
    ]
  } else {
    points = [
      { x: 0, y: 80 },
      { x: 50, y: 0 },
      { x: 100, y: 80 },
    ]
  }
  if (opts.advanced) {
    points = rotatePoints(points, rng.pick([0, 15, 30, 45, 90, 120, 180]))
  }
  return { kind: 'polygon', points, fill }
}

export function makeSquare(
  rng: Rng,
  opts: { advanced?: boolean; fill?: string; size?: number } = {},
): VisualSpec {
  const fill = opts.fill ?? pickFill(rng)
  const s = opts.size ?? 80
  let points: Point2D[] = [
    { x: 0, y: 0 },
    { x: s, y: 0 },
    { x: s, y: s },
    { x: 0, y: s },
  ]
  if (opts.advanced) {
    points = rotatePoints(points, rng.pick([0, 20, 45, 70]))
  }
  return { kind: 'polygon', points, fill }
}

export function makeRectangle(
  rng: Rng,
  opts: { advanced?: boolean; fill?: string } = {},
): VisualSpec {
  const fill = opts.fill ?? pickFill(rng)
  const w = opts.advanced ? rng.int(90, 130) : 100
  const h = opts.advanced ? rng.int(40, 60) : 55
  let points: Point2D[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
  if (opts.advanced) {
    points = rotatePoints(points, rng.pick([0, 15, 30, 90]))
  }
  return { kind: 'polygon', points, fill }
}

export function makeCircle(
  rng: Rng,
  opts: { advanced?: boolean; fill?: string } = {},
): VisualSpec {
  const fill = opts.fill ?? pickFill(rng)
  const r = opts.advanced ? rng.int(30, 55) : 45
  return { kind: 'circle', cx: 0, cy: 0, r, fill }
}

export function makeTrapezoid(
  rng: Rng,
  opts: { fill?: string } = {},
): VisualSpec {
  const fill = opts.fill ?? pickFill(rng)
  return {
    kind: 'polygon',
    points: [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
      { x: 100, y: 70 },
      { x: 0, y: 70 },
    ],
    fill,
  }
}

export function makeHexagon(
  rng: Rng,
  opts: { fill?: string; advanced?: boolean } = {},
): VisualSpec {
  return makeNGon(6, rng, opts)
}

export function makePentagon(
  rng: Rng,
  opts: { fill?: string; advanced?: boolean } = {},
): VisualSpec {
  return makeNGon(5, rng, opts)
}

/**
 * Simple n-gon from polar vertices. Advanced: irregular radii + rotation.
 * Radii stay far from collinear so side count stays unambiguous.
 */
export function makeNGon(
  sides: 3 | 4 | 5 | 6,
  rng: Rng,
  opts: { fill?: string; advanced?: boolean } = {},
): VisualSpec {
  const fill = opts.fill ?? pickFill(rng)
  const baseR = 45
  const points: Point2D[] = []
  const startDeg = opts.advanced ? rng.pick([-90, -75, -60, -45]) : -90
  for (let i = 0; i < sides; i += 1) {
    const deg = startDeg + (360 / sides) * i
    const rad = (deg * Math.PI) / 180
    const r =
      opts.advanced && sides >= 4
        ? baseR * (0.75 + rng.int(0, 5) * 0.05)
        : baseR
    points.push({ x: r * Math.cos(rad), y: r * Math.sin(rad) })
  }
  if (opts.advanced && sides === 3) {
    return makeTriangle(rng, { advanced: true, fill })
  }
  return { kind: 'polygon', points, fill }
}

/** Concave simple pentagon for advanced G.1 (dent on the bottom). */
export function makeConcavePentagon(rng: Rng): VisualSpec {
  return {
    kind: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 70 },
      { x: 50, y: 40 },
      { x: 0, y: 70 },
    ],
    fill: pickFill(rng),
  }
}

export function makeOpenV(
  rng: Rng,
  opts: { fill?: string } = {},
): VisualSpec {
  void rng
  void opts.fill
  return {
    kind: 'polygon',
    closed: false,
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 80 },
      { x: 100, y: 0 },
    ],
  }
}

export function makeShape(
  name: ShapeName,
  rng: Rng,
  opts: { advanced?: boolean; fill?: string } = {},
): VisualSpec {
  switch (name) {
    case 'triangle':
      return makeTriangle(rng, opts)
    case 'square':
      return makeSquare(rng, opts)
    case 'rectangle':
      return makeRectangle(rng, opts)
    case 'circle':
      return makeCircle(rng, opts)
    case 'trapezoid':
      return makeTrapezoid(rng, opts)
    case 'pentagon':
      return makePentagon(rng, opts)
    case 'hexagon':
      return makeHexagon(rng, opts)
    case 'open-v':
      return makeOpenV(rng, opts)
    default: {
      const _exhaustive: never = name
      return _exhaustive
    }
  }
}

export function beginnerTargets(): ShapeName[] {
  return ['triangle', 'square', 'rectangle', 'circle']
}

export function advancedExtraDistractors(): ShapeName[] {
  return ['trapezoid', 'hexagon', 'open-v']
}

/** Rectangle split into two right triangles along a diagonal. */
export function twoTriangleRectangle(
  rng: Rng,
  opts: { advanced?: boolean } = {},
): VisualSpec {
  const w = opts.advanced ? rng.int(90, 120) : 100
  const h = opts.advanced ? rng.int(50, 80) : 60
  const fillA = pickFill(rng)
  let fillB = pickFill(rng)
  if (fillB === fillA) fillB = FILLS[(FILLS.indexOf(fillA) + 1) % FILLS.length]!

  const pieces: ShapeCompositePiece[] = [
    {
      type: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: 0, y: h },
      ],
      fill: fillA,
    },
    {
      type: 'polygon',
      points: [
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ],
      fill: fillB,
    },
  ]
  return { kind: 'shape-composite', pieces }
}

/** Three triangles forming a trapezoid (advanced). */
export function threeTriangleTrapezoid(rng: Rng): VisualSpec {
  const fillA = pickFill(rng)
  const fillB = pickFill(rng)
  const fillC = pickFill(rng)
  return {
    kind: 'shape-composite',
    pieces: [
      {
        type: 'polygon',
        points: [
          { x: 20, y: 0 },
          { x: 60, y: 0 },
          { x: 40, y: 50 },
        ],
        fill: fillA,
      },
      {
        type: 'polygon',
        points: [
          { x: 0, y: 50 },
          { x: 40, y: 50 },
          { x: 20, y: 0 },
        ],
        fill: fillB,
      },
      {
        type: 'polygon',
        points: [
          { x: 40, y: 50 },
          { x: 100, y: 50 },
          { x: 60, y: 0 },
        ],
        fill: fillC,
      },
    ],
  }
}

/** Two squares side-by-side (not a triangle decomposition). */
export function twoSquaresComposite(rng: Rng): VisualSpec {
  const s = 50
  return {
    kind: 'shape-composite',
    pieces: [
      {
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: s, y: 0 },
          { x: s, y: s },
          { x: 0, y: s },
        ],
        fill: pickFill(rng),
      },
      {
        type: 'polygon',
        points: [
          { x: s, y: 0 },
          { x: s * 2, y: 0 },
          { x: s * 2, y: s },
          { x: s, y: s },
        ],
        fill: pickFill(rng),
      },
    ],
  }
}

/** Half-circle + half-circle = circle (advanced G.2). */
export function twoSemicircleComposite(rng: Rng): VisualSpec {
  const r = 45
  return {
    kind: 'shape-composite',
    pieces: [
      {
        type: 'pie',
        cx: 0,
        cy: 0,
        r,
        startDeg: 0,
        endDeg: 180,
        fill: pickFill(rng),
      },
      {
        type: 'pie',
        cx: 0,
        cy: 0,
        r,
        startDeg: 180,
        endDeg: 360,
        fill: pickFill(rng),
      },
    ],
  }
}

/** Single triangle (distractor for "made of two triangles"). */
export function singleTriangleComposite(rng: Rng): VisualSpec {
  return {
    kind: 'shape-composite',
    pieces: [
      {
        type: 'polygon',
        points: [
          { x: 0, y: 80 },
          { x: 50, y: 0 },
          { x: 100, y: 80 },
        ],
        fill: pickFill(rng),
      },
    ],
  }
}

/** Two triangles with a gap — does not tile a rectangle. */
export function twoTrianglesApart(rng: Rng): VisualSpec {
  return {
    kind: 'shape-composite',
    pieces: [
      {
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 40, y: 0 },
          { x: 0, y: 40 },
        ],
        fill: pickFill(rng),
      },
      {
        type: 'polygon',
        points: [
          { x: 90, y: 20 },
          { x: 130, y: 20 },
          { x: 90, y: 60 },
        ],
        fill: pickFill(rng),
      },
    ],
  }
}

export function sideCountForShape(name: ShapeName): number {
  switch (name) {
    case 'triangle':
      return 3
    case 'square':
    case 'rectangle':
    case 'trapezoid':
      return 4
    case 'pentagon':
      return 5
    case 'hexagon':
      return 6
    case 'circle':
      return 0
    case 'open-v':
      return 2
    default: {
      const _exhaustive: never = name
      return _exhaustive
    }
  }
}

export function shapeLabel(name: ShapeName): string {
  switch (name) {
    case 'triangle':
      return 'triangle'
    case 'square':
      return 'square'
    case 'rectangle':
      return 'rectangle'
    case 'circle':
      return 'circle'
    case 'trapezoid':
      return 'trapezoid'
    case 'pentagon':
      return 'pentagon'
    case 'hexagon':
      return 'hexagon'
    case 'open-v':
      return 'open shape'
    default: {
      const _exhaustive: never = name
      return _exhaustive
    }
  }
}

export type PartitionCut =
  | 'radial'
  | 'strips-v'
  | 'strips-h'
  | 'grid-2x2'
  | 'diagonal'

export type PartitionParts = 2 | 3 | 4 | 6 | 8

export function makePartition(
  rng: Rng,
  opts: {
    shape: 'circle' | 'rectangle'
    parts: PartitionParts
    equal: boolean
    advanced?: boolean
    /** Force a specific cut when set. */
    cut?: PartitionCut
    /** Which part indices are shaded (0-based). */
    shadedParts?: number[]
  },
): VisualSpec {
  let cut: PartitionCut
  if (opts.cut) {
    cut = opts.cut
  } else if (opts.shape === 'circle') {
    cut = 'radial'
  } else if (opts.parts === 2 && opts.advanced && rng.chance(0.4)) {
    cut = 'diagonal'
  } else if (opts.parts === 4 && opts.advanced && rng.chance(0.45)) {
    cut = 'grid-2x2'
  } else if (opts.advanced && rng.chance(0.5)) {
    cut = 'strips-h'
  } else {
    cut = 'strips-v'
  }

  // Diagonal only valid for rectangle halves.
  if (cut === 'diagonal' && (opts.shape !== 'rectangle' || opts.parts !== 2)) {
    cut = 'strips-v'
  }
  if (cut === 'grid-2x2' && opts.parts !== 4) {
    cut = 'strips-v'
  }

  return {
    kind: 'partitioned-shape',
    shape: opts.shape,
    parts: opts.parts,
    equal: opts.equal,
    cut,
    width: 120,
    height: opts.advanced ? rng.int(60, 90) : 70,
    r: 50,
    ...(opts.shadedParts ? { shadedParts: opts.shadedParts } : {}),
  }
}

/**
 * Axis-aligned rectangle in unit lengths (w×h).
 * VisualFrame scales small unit sizes; area = w×h from the VisualSpec.
 */
export function makeLabeledRect(
  w: number,
  h: number,
  label?: string,
): VisualSpec {
  return {
    kind: 'rect-composite',
    rects: [
      {
        x: 0,
        y: 0,
        w,
        h,
        label: label ?? `${w}×${h}`,
      },
    ],
  }
}

/** Distributive area model: a×b + a×c as two adjacent rectangles. */
export function makeAreaModel(a: number, b: number, c: number): VisualSpec {
  return {
    kind: 'rect-composite',
    rects: [
      {
        x: 0,
        y: 0,
        w: b,
        h: a,
        label: `${a}×${b}`,
      },
      {
        x: b,
        y: 0,
        w: c,
        h: a,
        label: `${a}×${c}`,
      },
    ],
  }
}

/** L-shaped composite of two non-overlapping rectangles (unit lengths). */
export function makeLRectComposite(
  wide: number,
  tall: number,
  notch: number,
): VisualSpec {
  // Horizontal bar wide×notch, plus vertical stem notch×(tall-notch) on the left.
  const stemH = tall - notch
  return {
    kind: 'rect-composite',
    rects: [
      {
        x: 0,
        y: stemH,
        w: wide,
        h: notch,
        label: `${wide}×${notch}`,
      },
      {
        x: 0,
        y: 0,
        w: notch,
        h: stemH,
        label: `${notch}×${stemH}`,
      },
    ],
  }
}

/** Partially shaded grid figure (area by counting unit squares). */
export function makeShadedGrid(
  rows: number,
  cols: number,
  shaded: Array<{ row: number; col: number }>,
): VisualSpec {
  return { kind: 'grid', rows, cols, shaded }
}

/** L-tetromino-style region of unit squares on a grid. */
export function makeLShadedGrid(
  armRows: number,
  armCols: number,
  stemExtra: number,
): { visual: VisualSpec; area: number } {
  const rows = armRows + stemExtra
  const cols = armCols
  const shaded: Array<{ row: number; col: number }> = []
  // Bottom bar
  for (let c = 0; c < armCols; c += 1) {
    shaded.push({ row: rows - 1, col: c })
  }
  // Vertical stem on the left
  for (let r = 0; r < rows - 1; r += 1) {
    shaded.push({ row: r, col: 0 })
  }
  return {
    visual: makeShadedGrid(rows, cols, shaded),
    area: shaded.length,
  }
}

/** Concave arrowhead-style pentagon (still simple / closed). Used by Grade 2. */
export function makeConcavePolygon(rng: Rng): VisualSpec {
  return {
    kind: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 80 },
      { x: 50, y: 45 },
      { x: 0, y: 80 },
    ],
    fill: pickFill(rng),
  }
}

/** Concave simple quadrilateral (arrowhead dent). */
export function makeConcaveQuad(rng: Rng): VisualSpec {
  return {
    kind: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 40 },
      { x: 0, y: 80 },
      { x: 30, y: 40 },
    ],
    fill: pickFill(rng),
  }
}

/** Nearly closed open path with a visible gap (non-polygon). */
export function makeNearClosedGap(rng: Rng): VisualSpec {
  // Vary the gap corner slightly so fingerprints stay unique when reused.
  const gap = rng.int(6, 16)
  return {
    kind: 'polygon',
    closed: false,
    points: [
      { x: gap, y: 0 },
      { x: 90, y: 0 },
      { x: 90, y: 80 },
      { x: 0, y: 80 },
      { x: 0, y: gap + 4 },
    ],
  }
}

/** Full rectangle grid of unit squares (NY-2.G.2). */
export function makeUnitSquareGrid(rows: number, cols: number): VisualSpec {
  return {
    kind: 'grid',
    rows,
    cols,
    // Shade all cells so counting is unambiguous on the figure.
    shaded: Array.from({ length: rows * cols }, (_, i) => ({
      row: Math.floor(i / cols),
      col: i % cols,
    })),
  }
}
