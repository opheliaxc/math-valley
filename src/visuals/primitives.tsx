import type { ReactNode } from 'react'
import type { VisualSpec } from '../../question-generator/src/types.ts'
import { unequalPartitionWeights } from '../../question-generator/src/geometry/index.ts'
import {
  boundsFromPoints,
  boundsSize,
  distance,
  emptyBounds,
  expandBounds,
  extendLine,
  extendRay,
  polar,
  svgArcPath,
  svgPieSlicePath,
  unionBounds,
  vectorAngleDeg,
  type Bounds,
} from './geometry'
import { VISUAL, strokeWidthFor } from './visualTheme'

type PrimitiveResult = {
  bounds: Bounds
  nodes: ReactNode
}

function pointsAttr(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

export function renderPolygonPrimitive(
  spec: Extract<VisualSpec, { kind: 'polygon' }>,
): PrimitiveResult {
  const closed = spec.closed !== false
  const bounds = boundsFromPoints(spec.points)
  const { w, h } = { w: bounds.maxX - bounds.minX, h: bounds.maxY - bounds.minY }
  const sw = strokeWidthFor(Math.max(w, 1), Math.max(h, 1))
  const fill = spec.fill ?? (closed ? VISUAL.fill : 'none')
  const stroke = spec.stroke ?? VISUAL.stroke

  const nodes = closed ? (
    <polygon
      points={pointsAttr(spec.points)}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  ) : (
    <polyline
      points={pointsAttr(spec.points)}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )

  return { bounds, nodes }
}

export function renderCirclePrimitive(
  spec: Extract<VisualSpec, { kind: 'circle' }>,
): PrimitiveResult {
  const bounds: Bounds = {
    minX: spec.cx - spec.r,
    minY: spec.cy - spec.r,
    maxX: spec.cx + spec.r,
    maxY: spec.cy + spec.r,
  }
  const sw = strokeWidthFor(spec.r * 2, spec.r * 2)
  const nodes = (
    <circle
      cx={spec.cx}
      cy={spec.cy}
      r={spec.r}
      fill={spec.fill ?? VISUAL.fill}
      stroke={spec.stroke ?? VISUAL.stroke}
      strokeWidth={sw}
    />
  )
  return { bounds, nodes }
}

export function renderArcPrimitive(
  spec: Extract<VisualSpec, { kind: 'arc' }>,
): PrimitiveResult {
  const start = polar(spec.cx, spec.cy, spec.r, spec.startDeg)
  const end = polar(spec.cx, spec.cy, spec.r, spec.endDeg)
  const mid = polar(
    spec.cx,
    spec.cy,
    spec.r,
    (spec.startDeg + spec.endDeg) / 2,
  )
  const bounds = boundsFromPoints([start, end, mid, { x: spec.cx, y: spec.cy }])
  const sw = strokeWidthFor(spec.r * 2, spec.r * 2)
  const nodes = (
    <path
      d={svgArcPath(spec.cx, spec.cy, spec.r, spec.startDeg, spec.endDeg)}
      fill="none"
      stroke={spec.stroke ?? VISUAL.stroke}
      strokeWidth={sw}
      strokeLinecap="round"
    />
  )
  return { bounds, nodes }
}

export function renderGridPrimitive(
  spec: Extract<VisualSpec, { kind: 'grid' }>,
): PrimitiveResult {
  const cell = 20
  const width = spec.cols * cell
  const height = spec.rows * cell
  const bounds: Bounds = { minX: 0, minY: 0, maxX: width, maxY: height }
  const sw = strokeWidthFor(width, height) * 0.7
  const shaded = new Set(
    (spec.shaded ?? []).map((c) => `${c.row},${c.col}`),
  )

  const cells: ReactNode[] = []
  for (let r = 0; r < spec.rows; r += 1) {
    for (let c = 0; c < spec.cols; c += 1) {
      const key = `${r},${c}`
      cells.push(
        <rect
          key={key}
          x={c * cell}
          y={r * cell}
          width={cell}
          height={cell}
          fill={shaded.has(key) ? VISUAL.shade : VISUAL.paper}
          stroke={VISUAL.stroke}
          strokeWidth={sw}
        />,
      )
    }
  }

  return { bounds, nodes: <g>{cells}</g> }
}

function arrowHead(
  tip: { x: number; y: number },
  from: { x: number; y: number },
  size: number,
): ReactNode {
  const len = distance(from, tip) || 1
  const ux = (tip.x - from.x) / len
  const uy = (tip.y - from.y) / len
  const px = -uy
  const py = ux
  const base = { x: tip.x - ux * size, y: tip.y - uy * size }
  const left = { x: base.x + px * size * 0.55, y: base.y + py * size * 0.55 }
  const right = { x: base.x - px * size * 0.55, y: base.y - py * size * 0.55 }
  return (
    <polygon
      points={pointsAttr([tip, left, right])}
      fill={VISUAL.stroke}
      stroke="none"
    />
  )
}

export function renderLinesPrimitive(
  spec: Extract<VisualSpec, { kind: 'lines' }>,
): PrimitiveResult {
  const bounds = emptyBounds()
  const parts: ReactNode[] = []
  let maxLen = 1

  for (const item of spec.items) {
    maxLen = Math.max(maxLen, distance(item.a, item.b))
  }
  const sw = strokeWidthFor(maxLen, maxLen)
  const arrow = sw * 3.2

  spec.items.forEach((item, index) => {
    let start = item.a
    let end = item.b
    if (item.type === 'ray') {
      ;({ start, end } = extendRay(item.a, item.b, 2.2))
    } else if (item.type === 'line') {
      ;({ start, end } = extendLine(item.a, item.b, 1.6))
    }
    expandBounds(bounds, start)
    expandBounds(bounds, end)

    parts.push(
      <line
        key={`line-${index}`}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={VISUAL.stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />,
    )

    if (item.type === 'ray') {
      parts.push(
        <g key={`arrow-${index}`}>{arrowHead(end, start, arrow)}</g>,
      )
    } else if (item.type === 'line') {
      parts.push(
        <g key={`arrow-a-${index}`}>{arrowHead(end, start, arrow)}</g>,
      )
      parts.push(
        <g key={`arrow-b-${index}`}>{arrowHead(start, end, arrow)}</g>,
      )
    }

    if (item.label) {
      const lx = (item.a.x + item.b.x) / 2
      const ly = (item.a.y + item.b.y) / 2 - sw * 2
      expandBounds(bounds, { x: lx, y: ly })
      parts.push(
        <text
          key={`label-${index}`}
          x={lx}
          y={ly}
          fill={VISUAL.stroke}
          fontSize={sw * 4}
          textAnchor="middle"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {item.label}
        </text>,
      )
    }
  })

  return { bounds, nodes: <g>{parts}</g> }
}

export function renderAnglePrimitive(
  spec: Extract<VisualSpec, { kind: 'angle' }>,
): PrimitiveResult {
  const rayLen =
    Math.max(distance(spec.vertex, spec.from), distance(spec.vertex, spec.to)) *
    1.15
  const a1 = vectorAngleDeg(spec.vertex, spec.from)
  const a2 = vectorAngleDeg(spec.vertex, spec.to)
  let arcDelta = a2 - a1
  while (arcDelta > 180) arcDelta -= 360
  while (arcDelta < -180) arcDelta += 360
  const p1 = polar(spec.vertex.x, spec.vertex.y, rayLen, a1)
  const p2 = polar(spec.vertex.x, spec.vertex.y, rayLen, a2)
  const bounds = boundsFromPoints([spec.vertex, p1, p2])
  const sw = strokeWidthFor(rayLen, rayLen)
  const arcR = rayLen * 0.28

  const nodes = (
    <g>
      <line
        x1={spec.vertex.x}
        y1={spec.vertex.y}
        x2={p1.x}
        y2={p1.y}
        stroke={VISUAL.stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1={spec.vertex.x}
        y1={spec.vertex.y}
        x2={p2.x}
        y2={p2.y}
        stroke={VISUAL.stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {spec.showArc !== false && (
        <path
          d={svgArcPath(
            spec.vertex.x,
            spec.vertex.y,
            arcR,
            a1,
            a1 + arcDelta,
          )}
          fill="none"
          stroke={VISUAL.accent}
          strokeWidth={sw * 0.9}
          strokeLinecap="round"
        />
      )}
      <circle
        cx={spec.vertex.x}
        cy={spec.vertex.y}
        r={sw * 1.1}
        fill={VISUAL.stroke}
      />
    </g>
  )

  return { bounds, nodes }
}

export function renderProtractorAnglePrimitive(
  spec: Extract<VisualSpec, { kind: 'protractor-angle' }>,
): PrimitiveResult {
  const r = 80
  const cx = 0
  const cy = 0
  const sw = strokeWidthFor(r * 2, r)
  const ticks: ReactNode[] = []

  for (let deg = 0; deg <= 180; deg += 10) {
    const outer = polar(cx, cy, r, deg)
    const inner = polar(cx, cy, deg % 30 === 0 ? r - 12 : r - 7, deg)
    ticks.push(
      <line
        key={`tick-${deg}`}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={VISUAL.tick}
        strokeWidth={deg % 30 === 0 ? sw * 0.9 : sw * 0.55}
      />,
    )
    if (deg % 30 === 0) {
      const labelPt = polar(cx, cy, r - 22, deg)
      ticks.push(
        <text
          key={`lbl-${deg}`}
          x={labelPt.x}
          y={labelPt.y + sw}
          fill={VISUAL.tick}
          fontSize={sw * 3.2}
          textAnchor="middle"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {deg}
        </text>,
      )
    }
  }

  const left = polar(cx, cy, r, 180)
  const right = polar(cx, cy, r, 0)
  const measure = Math.min(Math.max(spec.measureDeg, 0), 180)
  const rayEnd = polar(cx, cy, r * 0.92, measure)

  const bounds: Bounds = {
    minX: -r - 8,
    minY: -r - 8,
    maxX: r + 8,
    maxY: 16,
  }

  // vertex/from/to are recorded on the spec for validators; drawing uses measureDeg.
  void spec.vertex
  void spec.from
  void spec.to

  const nodes = (
    <g>
      <path
        d={`${svgArcPath(cx, cy, r, 0, 180)} L ${cx} ${cy} Z`}
        fill={VISUAL.fill}
        stroke={VISUAL.stroke}
        strokeWidth={sw}
      />
      <line
        x1={left.x}
        y1={cy}
        x2={right.x}
        y2={cy}
        stroke={VISUAL.stroke}
        strokeWidth={sw}
      />
      {ticks}
      <line
        x1={cx}
        y1={cy}
        x2={right.x}
        y2={right.y}
        stroke={VISUAL.stroke}
        strokeWidth={sw * 1.1}
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={cy}
        x2={rayEnd.x}
        y2={rayEnd.y}
        stroke={VISUAL.accent}
        strokeWidth={sw * 1.2}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={sw * 1.2} fill={VISUAL.stroke} />
    </g>
  )

  return { bounds, nodes }
}

export function renderPartitionedShapePrimitive(
  spec: Extract<VisualSpec, { kind: 'partitioned-shape' }>,
): PrimitiveResult {
  const parts = Math.max(spec.parts, 1)
  const shaded = new Set(spec.shadedParts ?? [])
  const cut =
    spec.cut ?? (spec.shape === 'circle' ? 'radial' : 'strips-v')

  if (spec.shape === 'circle' || cut === 'radial') {
    const r = spec.r ?? 50
    const cx = 0
    const cy = 0
    const bounds: Bounds = { minX: -r, minY: -r, maxX: r, maxY: r }
    const sw = strokeWidthFor(r * 2, r * 2)
    const slices: ReactNode[] = []

    if (spec.equal) {
      const step = 360 / parts
      for (let i = 0; i < parts; i += 1) {
        const start = 90 - i * step
        const end = start - step
        slices.push(
          <path
            key={i}
            d={svgPieSlicePath(cx, cy, r, start, end)}
            fill={shaded.has(i) ? VISUAL.shade : VISUAL.fill}
            stroke={VISUAL.stroke}
            strokeWidth={sw}
          />,
        )
      }
    } else {
      // Unequal slices for distractors (weights differ clearly on screen).
      const weights = unequalPartitionWeights(parts)
      const total = weights.reduce((a, b) => a + b, 0)
      let cursor = 90
      for (let i = 0; i < parts; i += 1) {
        const sweep = (weights[i]! / total) * 360
        const start = cursor
        const end = cursor - sweep
        slices.push(
          <path
            key={i}
            d={svgPieSlicePath(cx, cy, r, start, end)}
            fill={shaded.has(i) ? VISUAL.shade : VISUAL.fill}
            stroke={VISUAL.stroke}
            strokeWidth={sw}
          />,
        )
        cursor = end
      }
    }

    return { bounds, nodes: <g>{slices}</g> }
  }

  const width = spec.width ?? 120
  const height = spec.height ?? 80
  const bounds: Bounds = { minX: 0, minY: 0, maxX: width, maxY: height }
  const sw = strokeWidthFor(width, height)
  const nodes: ReactNode[] = []

  if (cut === 'grid-2x2' && parts === 4) {
    const cellW = width / 2
    const cellH = height / 2
    for (let i = 0; i < 4; i += 1) {
      const col = i % 2
      const row = Math.floor(i / 2)
      const w = spec.equal ? cellW : col === 0 ? width * 0.35 : width * 0.65
      const h = spec.equal ? cellH : row === 0 ? height * 0.35 : height * 0.65
      const x = col === 0 ? 0 : width - w
      const y = row === 0 ? 0 : height - h
      nodes.push(
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={shaded.has(i) ? VISUAL.shade : VISUAL.fill}
          stroke={VISUAL.stroke}
          strokeWidth={sw}
        />,
      )
    }
    return { bounds, nodes: <g>{nodes}</g> }
  }

  if (cut === 'diagonal' && parts === 2) {
    if (spec.equal) {
      // Classic diagonal: two equal triangles.
      nodes.push(
        <polygon
          key={0}
          points={pointsAttr([
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: 0, y: height },
          ])}
          fill={shaded.has(0) ? VISUAL.shade : VISUAL.fill}
          stroke={VISUAL.stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />,
        <polygon
          key={1}
          points={pointsAttr([
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ])}
          fill={shaded.has(1) ? VISUAL.shade : VISUAL.fill}
          stroke={VISUAL.stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />,
      )
    } else {
      // Unequal: cut from 35% along the top to bottom-left.
      nodes.push(
        <polygon
          key={0}
          points={pointsAttr([
            { x: 0, y: 0 },
            { x: width * 0.35, y: 0 },
            { x: 0, y: height },
          ])}
          fill={shaded.has(0) ? VISUAL.shade : VISUAL.fill}
          stroke={VISUAL.stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />,
        <polygon
          key={1}
          points={pointsAttr([
            { x: width * 0.35, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ])}
          fill={shaded.has(1) ? VISUAL.shade : VISUAL.fill}
          stroke={VISUAL.stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />,
      )
    }
    return { bounds, nodes: <g>{nodes}</g> }
  }

  const horizontal = cut === 'strips-h'
  if (spec.equal) {
    if (horizontal) {
      const stripH = height / parts
      for (let i = 0; i < parts; i += 1) {
        nodes.push(
          <rect
            key={i}
            x={0}
            y={i * stripH}
            width={width}
            height={stripH}
            fill={shaded.has(i) ? VISUAL.shade : VISUAL.fill}
            stroke={VISUAL.stroke}
            strokeWidth={sw}
          />,
        )
      }
    } else {
      const stripW = width / parts
      for (let i = 0; i < parts; i += 1) {
        nodes.push(
          <rect
            key={i}
            x={i * stripW}
            y={0}
            width={stripW}
            height={height}
            fill={shaded.has(i) ? VISUAL.shade : VISUAL.fill}
            stroke={VISUAL.stroke}
            strokeWidth={sw}
          />,
        )
      }
    }
  } else {
    const weights = unequalPartitionWeights(parts)
    const total = weights.reduce((a, b) => a + b, 0)
    if (horizontal) {
      let y = 0
      for (let i = 0; i < parts; i += 1) {
        const h = (weights[i]! / total) * height
        nodes.push(
          <rect
            key={i}
            x={0}
            y={y}
            width={width}
            height={h}
            fill={shaded.has(i) ? VISUAL.shade : VISUAL.fill}
            stroke={VISUAL.stroke}
            strokeWidth={sw}
          />,
        )
        y += h
      }
    } else {
      let x = 0
      for (let i = 0; i < parts; i += 1) {
        const w = (weights[i]! / total) * width
        nodes.push(
          <rect
            key={i}
            x={x}
            y={0}
            width={w}
            height={height}
            fill={shaded.has(i) ? VISUAL.shade : VISUAL.fill}
            stroke={VISUAL.stroke}
            strokeWidth={sw}
          />,
        )
        x += w
      }
    }
  }

  return { bounds, nodes: <g>{nodes}</g> }
}

export function renderShapeCompositePrimitive(
  spec: Extract<VisualSpec, { kind: 'shape-composite' }>,
): PrimitiveResult {
  const bounds = emptyBounds()
  const parts: ReactNode[] = []

  spec.pieces.forEach((piece, index) => {
    if (piece.type === 'polygon') {
      const closed = piece.closed !== false
      for (const p of piece.points) expandBounds(bounds, p)
      const { w, h } = boundsSize(boundsFromPoints(piece.points))
      const sw = strokeWidthFor(Math.max(w, 1), Math.max(h, 1))
      if (closed) {
        parts.push(
          <polygon
            key={index}
            points={pointsAttr(piece.points)}
            fill={piece.fill ?? VISUAL.fill}
            stroke={piece.stroke ?? VISUAL.stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />,
        )
      } else {
        parts.push(
          <polyline
            key={index}
            points={pointsAttr(piece.points)}
            fill="none"
            stroke={piece.stroke ?? VISUAL.stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />,
        )
      }
      return
    }

    if (piece.type === 'circle') {
      expandBounds(bounds, {
        x: piece.cx - piece.r,
        y: piece.cy - piece.r,
      })
      expandBounds(bounds, {
        x: piece.cx + piece.r,
        y: piece.cy + piece.r,
      })
      const sw = strokeWidthFor(piece.r * 2, piece.r * 2)
      parts.push(
        <circle
          key={index}
          cx={piece.cx}
          cy={piece.cy}
          r={piece.r}
          fill={piece.fill ?? VISUAL.fill}
          stroke={piece.stroke ?? VISUAL.stroke}
          strokeWidth={sw}
        />,
      )
      return
    }

    // pie
    const start = polar(piece.cx, piece.cy, piece.r, piece.startDeg)
    const end = polar(piece.cx, piece.cy, piece.r, piece.endDeg)
    const mid = polar(
      piece.cx,
      piece.cy,
      piece.r,
      (piece.startDeg + piece.endDeg) / 2,
    )
    expandBounds(bounds, { x: piece.cx, y: piece.cy })
    expandBounds(bounds, start)
    expandBounds(bounds, end)
    expandBounds(bounds, mid)
    const sw = strokeWidthFor(piece.r * 2, piece.r * 2)
    parts.push(
      <path
        key={index}
        d={svgPieSlicePath(
          piece.cx,
          piece.cy,
          piece.r,
          piece.startDeg,
          piece.endDeg,
        )}
        fill={piece.fill ?? VISUAL.fill}
        stroke={piece.stroke ?? VISUAL.stroke}
        strokeWidth={sw}
      />,
    )
  })

  return { bounds, nodes: <g>{parts}</g> }
}

export function renderRectCompositePrimitive(
  spec: Extract<VisualSpec, { kind: 'rect-composite' }>,
): PrimitiveResult {
  const bounds = emptyBounds()
  const swBase = emptyBounds()
  for (const rect of spec.rects) {
    expandBounds(bounds, { x: rect.x, y: rect.y })
    expandBounds(bounds, { x: rect.x + rect.w, y: rect.y + rect.h })
    expandBounds(swBase, { x: rect.w, y: rect.h })
  }
  const sw = strokeWidthFor(
    Math.max(bounds.maxX - bounds.minX, 1),
    Math.max(bounds.maxY - bounds.minY, 1),
  )

  const nodes = spec.rects.map((rect, index) => (
    <g key={index}>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        fill={VISUAL.fill}
        stroke={VISUAL.stroke}
        strokeWidth={sw}
      />
      {rect.label ? (
        <text
          x={rect.x + rect.w / 2}
          y={rect.y + rect.h / 2}
          fill={VISUAL.stroke}
          fontSize={sw * 3.5}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {rect.label}
        </text>
      ) : null}
    </g>
  ))

  return { bounds, nodes: <g>{nodes}</g> }
}

export function renderSymmetryFigurePrimitive(
  spec: Extract<VisualSpec, { kind: 'symmetry-figure' }>,
): PrimitiveResult {
  let bounds = boundsFromPoints(spec.points)
  if (spec.axis) {
    bounds = unionBounds(
      bounds,
      boundsFromPoints([spec.axis.a, spec.axis.b]),
    )
  }
  const sw = strokeWidthFor(
    Math.max(bounds.maxX - bounds.minX, 1),
    Math.max(bounds.maxY - bounds.minY, 1),
  )

  const nodes = (
    <g>
      <polygon
        points={pointsAttr(spec.points)}
        fill={VISUAL.fill}
        stroke={VISUAL.stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {spec.showAxis !== false && spec.axis ? (
        <line
          x1={spec.axis.a.x}
          y1={spec.axis.a.y}
          x2={spec.axis.b.x}
          y2={spec.axis.b.y}
          stroke={VISUAL.accent}
          strokeWidth={sw}
          strokeDasharray={`${sw * 2} ${sw * 1.5}`}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  )

  return { bounds, nodes }
}
