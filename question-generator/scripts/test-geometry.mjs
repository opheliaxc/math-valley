/**
 * Phase 0 Step 5 — geometry utility unit tests.
 *
 * Run from question-generator/:
 *   node scripts/test-geometry.mjs
 *
 * Or from repo root:
 *   node question-generator/scripts/test-geometry.mjs
 */
import {
  GEOMETRY_TOLERANCE,
  angleBetweenVectorsDeg,
  areasDifferEnough,
  areParallel,
  arePerpendicular,
  classifyAngleDeg,
  hasNearCollinearVertices,
  isSimplePolygon,
  isSymmetricAcross,
  parallelRelation,
  perpendicularRelation,
  polygonArea,
  polygonPerimeter,
  reflectPoint,
  relativeAreaDifference,
} from '../src/geometry/index.ts'

let passed = 0
let failed = 0

function assert(label, condition) {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${label}`)
  } else {
    failed += 1
    console.error(`  ✗ ${label}`)
  }
}

function almost(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps
}

// ── 1. Polygon area (shoelace) ───────────────────────────────────────────
console.log('\n1. polygonArea (shoelace)')
{
  const unitSquare = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ]
  assert('unit square area === 1', almost(polygonArea(unitSquare), 1))

  const rightTriangle = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 0, y: 3 },
  ]
  assert('3-4-5 right triangle area === 6', almost(polygonArea(rightTriangle), 6))

  // Same points clockwise vs counter-clockwise → same area
  const cw = [...unitSquare].reverse()
  assert('orientation does not change area', almost(polygonArea(cw), 1))
}

// ── 2. Perimeter ─────────────────────────────────────────────────────────
console.log('\n2. polygonPerimeter')
{
  const square = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
  ]
  assert('2×2 square perimeter === 8', almost(polygonPerimeter(square), 8))
}

// ── 3. Simple polygon ────────────────────────────────────────────────────
console.log('\n3. isSimplePolygon')
{
  const convex = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
  ]
  assert('rectangle is simple', isSimplePolygon(convex) === true)

  const bowtie = [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ]
  assert('bowtie is not simple', isSimplePolygon(bowtie) === false)

  const concave = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 2, y: 1 },
    { x: 0, y: 3 },
  ]
  assert('concave arrowhead is simple', isSimplePolygon(concave) === true)
}

// ── 4. Collinearity guard ────────────────────────────────────────────────
console.log('\n4. hasNearCollinearVertices')
{
  const clean = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 0, y: 3 },
  ]
  assert('clean triangle has no near-collinear verts', hasNearCollinearVertices(clean) === false)

  const flat = [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 10, y: 0.01 }, // almost on the x-axis
  ]
  assert('nearly flat triangle is flagged', hasNearCollinearVertices(flat) === true)

  const midOnEdge = [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 10, y: 0 },
    { x: 5, y: 5 },
  ]
  assert('vertex on an edge is flagged', hasNearCollinearVertices(midOnEdge) === true)
}

// ── 5. Angle between vectors ─────────────────────────────────────────────
console.log('\n5. angleBetweenVectorsDeg')
{
  assert(
    'orthogonal → 90°',
    almost(angleBetweenVectorsDeg({ x: 1, y: 0 }, { x: 0, y: 1 }), 90),
  )
  assert(
    'same direction → 0°',
    almost(angleBetweenVectorsDeg({ x: 2, y: 0 }, { x: 5, y: 0 }), 0),
  )
  assert(
    'opposite → 180°',
    almost(angleBetweenVectorsDeg({ x: 1, y: 0 }, { x: -1, y: 0 }), 180),
  )
}

// ── 6. Parallel / perpendicular ──────────────────────────────────────────
console.log('\n6. parallel & perpendicular')
{
  assert(
    'horizontal || horizontal',
    areParallel({ x: 1, y: 0 }, { x: 3, y: 0 }) === true,
  )
  assert(
    'horizontal || vertical? false',
    areParallel({ x: 1, y: 0 }, { x: 0, y: 1 }) === false,
  )
  assert(
    'horizontal ⊥ vertical',
    arePerpendicular({ x: 1, y: 0 }, { x: 0, y: 2 }) === true,
  )
  assert(
    'anti-parallel still parallel',
    areParallel({ x: 1, y: 0 }, { x: -2, y: 0 }) === true,
  )

  assert(
    'exact parallel relation',
    parallelRelation({ x: 1, y: 0 }, { x: 2, y: 0 }) === 'parallel',
  )
  assert(
    '10° apart → clear',
    parallelRelation({ x: 1, y: 0 }, {
      x: Math.cos((10 * Math.PI) / 180),
      y: Math.sin((10 * Math.PI) / 180),
    }) === 'clear',
  )
  assert(
    '5° apart → ambiguous',
    parallelRelation({ x: 1, y: 0 }, {
      x: Math.cos((5 * Math.PI) / 180),
      y: Math.sin((5 * Math.PI) / 180),
    }) === 'ambiguous',
  )

  assert(
    'exact perpendicular relation',
    perpendicularRelation({ x: 1, y: 0 }, { x: 0, y: 1 }) === 'perpendicular',
  )
  assert(
    '85° to horizontal → ambiguous vs perpendicular',
    perpendicularRelation({ x: 1, y: 0 }, {
      x: Math.cos((85 * Math.PI) / 180),
      y: Math.sin((85 * Math.PI) / 180),
    }) === 'ambiguous',
  )
  assert(
    '60° → clearly not perpendicular',
    perpendicularRelation({ x: 1, y: 0 }, {
      x: Math.cos((60 * Math.PI) / 180),
      y: Math.sin((60 * Math.PI) / 180),
    }) === 'clear',
  )
}

// ── 7. Angle classification margins ──────────────────────────────────────
console.log('\n7. classifyAngleDeg margins')
{
  assert('60° → acute', classifyAngleDeg(60) === 'acute')
  assert('75° → acute (boundary)', classifyAngleDeg(75) === 'acute')
  assert('80° → ambiguous', classifyAngleDeg(80) === 'ambiguous')
  assert('90° → right', classifyAngleDeg(90) === 'right')
  assert('100° → ambiguous', classifyAngleDeg(100) === 'ambiguous')
  assert('105° → obtuse (boundary)', classifyAngleDeg(105) === 'obtuse')
  assert('120° → obtuse', classifyAngleDeg(120) === 'obtuse')
  assert(
    `tolerance constants match spec (${GEOMETRY_TOLERANCE.acuteMaxDeg}/${GEOMETRY_TOLERANCE.obtuseMinDeg}/${GEOMETRY_TOLERANCE.parallelClearDeg})`,
    GEOMETRY_TOLERANCE.acuteMaxDeg === 75 &&
      GEOMETRY_TOLERANCE.obtuseMinDeg === 105 &&
      GEOMETRY_TOLERANCE.parallelClearDeg === 10 &&
      GEOMETRY_TOLERANCE.unequalAreaMinRatio === 0.25,
  )
}

// ── 8. Reflection / symmetry ─────────────────────────────────────────────
console.log('\n8. reflection & symmetry')
{
  const p = reflectPoint({ x: 3, y: 1 }, { x: 0, y: 0 }, { x: 0, y: 1 })
  assert('reflect across y-axis: (3,1) → (−3,1)', p !== null && almost(p.x, -3) && almost(p.y, 1))

  const isosceles = [
    { x: 0, y: 0 },
    { x: 2, y: 3 },
    { x: 4, y: 0 },
  ]
  assert(
    'isosceles triangle symmetric on altitude',
    isSymmetricAcross(isosceles, { x: 2, y: -1 }, { x: 2, y: 4 }) === true,
  )
  assert(
    'isosceles not symmetric on base midline skew',
    isSymmetricAcross(isosceles, { x: 0, y: 1 }, { x: 4, y: 1 }) === false,
  )
}

// ── 9. Area difference guards ────────────────────────────────────────────
console.log('\n9. areasDifferEnough (25% margin)')
{
  assert('equal areas → not different enough', areasDifferEnough(10, 10) === false)
  assert('20% difference → not enough', areasDifferEnough(10, 8) === false)
  assert(
    '20% relative check',
    almost(relativeAreaDifference(10, 8), 0.2),
  )
  assert('25% difference → enough', areasDifferEnough(10, 7.5) === true)
  assert('50% difference → enough', areasDifferEnough(10, 5) === true)
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('Geometry tests FAILED')
  process.exit(1)
}
console.log('Geometry tests OK')
