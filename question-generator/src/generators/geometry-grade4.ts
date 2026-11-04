/**
 * Grade 4 Geometry + geometric MD (NY-4.G.*, NY-4.MD.3 / 5–7).
 * Answers come from geometry / visual predicates — never label-then-draw.
 */
import { isSymmetricAcross } from '../geometry/index.ts'
import { type Rng } from '../rng.ts'
import type {
  DifficultyParamValue,
  PictureOption,
  QuestionType,
} from '../types.ts'
import { altTextFromVisual } from '../visual-alt-text.ts'
import type { VisualPredicateId } from '../visual-predicates.ts'
import type { Point2D, VisualSpec } from '../visual.ts'
import { makeLabeledRect, pickFill } from './geometry-shapes.ts'
import { paramNum } from './shared.ts'

export type VisualCore = {
  prompt: string
  correctAnswer: string
  explanation: string
  visualPredicate?: VisualPredicateId
  visual?: VisualSpec
  altText?: string
  pictureCorrect?: PictureOption
  pictureDistractors?: PictureOption[]
  textDistractors?: string[]
}

function optionFrom(visual: VisualSpec, id: string): PictureOption {
  return { id, altText: altTextFromVisual(visual), visual }
}

function showFrac(n: number, d: number): string {
  return `[[${n}/${d}]]`
}

function fmtFrac(n: number, d: number): string {
  return `${n}/${d}`
}

function polar(cx: number, cy: number, r: number, deg: number): Point2D {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

function makeAngleVisual(measureDeg: number, rotationDeg = 0): VisualSpec {
  const vertex = { x: 0, y: 0 }
  const from = polar(0, 0, 70, rotationDeg)
  const to = polar(0, 0, 70, rotationDeg + measureDeg)
  return { kind: 'angle', vertex, from, to, showArc: true }
}

function makeLineItem(
  type: 'line' | 'ray' | 'segment',
  a: Point2D,
  b: Point2D,
  label?: string,
): VisualSpec {
  return { kind: 'lines', items: [{ type, a, b, label }] }
}

function makeTwoLines(
  type: 'line' | 'segment',
  a1: Point2D,
  b1: Point2D,
  a2: Point2D,
  b2: Point2D,
): VisualSpec {
  return {
    kind: 'lines',
    items: [
      { type, a: a1, b: b1 },
      { type, a: a2, b: b2 },
    ],
  }
}

type AngleKind = 'acute' | 'right' | 'obtuse'

function pickClearAngle(kind: AngleKind, rng: Rng): number {
  if (kind === 'right') return 90
  if (kind === 'acute') return rng.pick([30, 45, 60] as const)
  return rng.pick([120, 135, 150] as const)
}

function anglePredicate(kind: AngleKind): VisualPredicateId {
  if (kind === 'acute') return 'is-acute-angle'
  if (kind === 'right') return 'is-right-angle'
  return 'is-obtuse-angle'
}

function trianglePredicate(kind: AngleKind): VisualPredicateId {
  if (kind === 'acute') return 'is-acute-triangle'
  if (kind === 'right') return 'is-right-triangle'
  return 'is-obtuse-triangle'
}

/** Build a triangle with a clear angle class (integer-ish coords). */
function makeTriangleByClass(kind: AngleKind, rng: Rng): VisualSpec {
  const fill = pickFill(rng)
  if (kind === 'right') {
    const a = rng.int(3, 6)
    const b = rng.int(3, 6)
    // Nudge so repeated options stay distinct.
    const nudge = rng.int(0, 3) * 2
    return {
      kind: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: a * 20 + nudge, y: 0 },
        { x: 0, y: b * 20 + nudge },
      ],
      fill,
    }
  }
  if (kind === 'obtuse') {
    // Clear obtuse at the middle vertex (flat wide angle).
    const variants: Point2D[][] = [
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 20, y: 25 },
      ],
      [
        { x: 0, y: 10 },
        { x: 110, y: 10 },
        { x: 25, y: 40 },
      ],
      [
        { x: 5, y: 0 },
        { x: 95, y: 5 },
        { x: 30, y: 28 },
      ],
    ]
    return { kind: 'polygon', points: rng.pick(variants), fill }
  }
  // acute — roughly equilateral variants
  const acuteVariants: Point2D[][] = [
    [
      { x: 0, y: 80 },
      { x: 50, y: 0 },
      { x: 100, y: 80 },
    ],
    [
      { x: 0, y: 70 },
      { x: 55, y: 0 },
      { x: 105, y: 75 },
    ],
    [
      { x: 5, y: 85 },
      { x: 48, y: 5 },
      { x: 95, y: 80 },
    ],
  ]
  return { kind: 'polygon', points: rng.pick(acuteVariants), fill }
}

function makeParallelogramVisual(rng: Rng, opts: { rectangle?: boolean } = {}): VisualSpec {
  if (opts.rectangle) {
    const w = rng.int(4, 7) * 15
    const h = rng.int(3, 5) * 15
    return {
      kind: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ],
      fill: pickFill(rng),
    }
  }
  // Skewed parallelogram (not a rectangle)
  return {
    kind: 'polygon',
    points: [
      { x: 0, y: 60 },
      { x: 80, y: 60 },
      { x: 110, y: 0 },
      { x: 30, y: 0 },
    ],
    fill: pickFill(rng),
  }
}

function makeTrapezoidNotPara(rng: Rng): VisualSpec {
  return {
    kind: 'polygon',
    points: [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
      { x: 100, y: 60 },
      { x: 0, y: 60 },
    ],
    fill: pickFill(rng),
  }
}

function makeSymFigure(
  points: Point2D[],
  axis: { a: Point2D; b: Point2D } | null,
  showAxis: boolean,
): VisualSpec {
  return {
    kind: 'symmetry-figure',
    points,
    ...(axis ? { axis } : {}),
    showAxis,
  }
}

function squarePoints(size = 80): Point2D[] {
  return [
    { x: 0, y: 0 },
    { x: size, y: 0 },
    { x: size, y: size },
    { x: 0, y: size },
  ]
}

function isoscelesPoints(): Point2D[] {
  return [
    { x: 0, y: 80 },
    { x: 40, y: 0 },
    { x: 80, y: 80 },
  ]
}

function scalenePoints(): Point2D[] {
  return [
    { x: 0, y: 80 },
    { x: 30, y: 0 },
    { x: 90, y: 70 },
  ]
}

// ── NY-4.G.1 ─────────────────────────────────────────────────────────────

export function roll4G1(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    const pattern = rng.pick(
      advanced
        ? (['figure-type', 'angle-class', 'parallel', 'perpendicular'] as const)
        : (['figure-type', 'angle-class', 'figure-type'] as const),
    )
    if (pattern === 'angle-class') return g4AngleClassMc(rng)
    if (pattern === 'parallel') return g4ParallelMc(rng)
    if (pattern === 'perpendicular') return g4PerpendicularMc(rng)
    return g4FigureTypeMc(rng)
  }
  if (type === 'true-false') {
    return g4G1Tf(advanced, rng)
  }
  return g4G1Short(advanced, rng)
}

function g4FigureTypeMc(rng: Rng): VisualCore {
  const target = rng.pick(['ray', 'line', 'segment'] as const)
  const predicate: VisualPredicateId =
    target === 'ray' ? 'is-ray' : target === 'line' ? 'is-line' : 'is-segment'
  const make = (t: 'ray' | 'line' | 'segment', id: string) =>
    optionFrom(
      makeLineItem(t, { x: 0, y: 40 }, { x: 90, y: 40 + (id === 'ray' ? 0 : id.length) }),
      id,
    )
  // Distinct endpoints so fingerprints differ
  const correct = optionFrom(
    makeLineItem(target, { x: 0, y: 20 }, { x: 100, y: 20 }),
    target,
  )
  const others = (['ray', 'line', 'segment'] as const).filter((t) => t !== target)
  const distractors = [
    make(others[0]!, others[0]!),
    make(others[1]!, others[1]!),
    optionFrom(
      makeAngleVisual(60),
      'angle',
    ),
  ]
  return {
    prompt: `Which picture shows a ${target}?`,
    correctAnswer: target,
    explanation:
      target === 'ray'
        ? 'A ray has one endpoint and extends forever in one direction.'
        : target === 'line'
          ? 'A line extends forever in both directions.'
          : 'A line segment has two endpoints.',
    visualPredicate: predicate,
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g4AngleClassMc(rng: Rng): VisualCore {
  const kind = rng.pick(['acute', 'right', 'obtuse'] as const)
  const deg = pickClearAngle(kind, rng)
  const correct = optionFrom(makeAngleVisual(deg, rng.int(0, 5) * 12), kind)
  const others = (['acute', 'right', 'obtuse'] as const).filter((k) => k !== kind)
  const distractors = others.map((k, i) =>
    optionFrom(makeAngleVisual(pickClearAngle(k, rng), 20 + i * 35), k),
  )
  distractors.push(
    optionFrom(makeAngleVisual(pickClearAngle(others[0]!, rng), 110), 'extra'),
  )
  return {
    prompt: `Which angle is ${kind}?`,
    correctAnswer: kind,
    explanation:
      kind === 'right'
        ? 'A right angle measures exactly 90°.'
        : kind === 'acute'
          ? 'An acute angle measures less than 90°.'
          : 'An obtuse angle measures greater than 90°.',
    visualPredicate: anglePredicate(kind),
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g4ParallelMc(_rng: Rng): VisualCore {
  const correct = optionFrom(
    makeTwoLines('line', { x: 0, y: 20 }, { x: 100, y: 20 }, { x: 0, y: 60 }, { x: 100, y: 60 }),
    'parallel',
  )
  const distractors = [
    optionFrom(
      makeTwoLines('line', { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: -20 }, { x: 50, y: 80 }),
      'perp',
    ),
    optionFrom(
      makeTwoLines('line', { x: 0, y: 10 }, { x: 100, y: 10 }, { x: 0, y: 20 }, { x: 100, y: 70 }),
      'skew',
    ),
    optionFrom(makeAngleVisual(90), 'angle'),
  ]
  return {
    prompt: 'Which picture shows parallel lines?',
    correctAnswer: 'parallel',
    explanation: 'Parallel lines never meet and stay the same distance apart.',
    visualPredicate: 'lines-are-parallel',
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g4PerpendicularMc(_rng: Rng): VisualCore {
  const correct = optionFrom(
    makeTwoLines('line', { x: 0, y: 40 }, { x: 100, y: 40 }, { x: 50, y: 0 }, { x: 50, y: 80 }),
    'perp',
  )
  const distractors = [
    optionFrom(
      makeTwoLines('line', { x: 0, y: 20 }, { x: 100, y: 20 }, { x: 0, y: 60 }, { x: 100, y: 60 }),
      'parallel',
    ),
    optionFrom(
      makeTwoLines('line', { x: 0, y: 10 }, { x: 100, y: 30 }, { x: 0, y: 50 }, { x: 100, y: 70 }),
      'skew',
    ),
    optionFrom(makeAngleVisual(60), 'acute'),
  ]
  return {
    prompt: 'Which picture shows perpendicular lines?',
    correctAnswer: 'perp',
    explanation: 'Perpendicular lines meet at a right angle (90°).',
    visualPredicate: 'lines-are-perpendicular',
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g4G1Tf(_advanced: boolean, rng: Rng): VisualCore {
  const pattern = rng.pick(['angle', 'parallel'] as const)
  if (pattern === 'parallel') {
    const wantTrue = rng.chance(0.55)
    const visual = wantTrue
      ? makeTwoLines('line', { x: 0, y: 20 }, { x: 100, y: 20 }, { x: 0, y: 70 }, { x: 100, y: 70 })
      : makeTwoLines('line', { x: 0, y: 10 }, { x: 100, y: 10 }, { x: 0, y: 20 }, { x: 100, y: 80 })
    return {
      prompt: 'These lines are parallel.',
      correctAnswer: wantTrue ? 'true' : 'false',
      explanation: wantTrue
        ? 'The lines never meet and run in the same direction.'
        : 'The lines are not parallel — they would meet if extended.',
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'lines-are-parallel',
    }
  }
  const kind = rng.pick(['acute', 'right', 'obtuse'] as const)
  const wantTrue = rng.chance(0.55)
  const shown = wantTrue
    ? kind
    : rng.pick((['acute', 'right', 'obtuse'] as const).filter((k) => k !== kind))
  const visual = makeAngleVisual(pickClearAngle(shown, rng))
  return {
    prompt: `This angle is ${kind}.`,
    correctAnswer: wantTrue ? 'true' : 'false',
    explanation: wantTrue
      ? `Yes — this is a clear ${kind} angle.`
      : `No — this angle is ${shown}, not ${kind}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: anglePredicate(kind),
  }
}

function g4G1Short(advanced: boolean, rng: Rng): VisualCore {
  if (advanced && rng.chance(0.5)) {
    const visual = makeParallelogramVisual(rng, { rectangle: true })
    return {
      prompt: 'How many right angles does this figure have?',
      correctAnswer: '4',
      explanation: 'A rectangle has 4 right angles.',
      visual,
      altText: altTextFromVisual(visual),
    }
  }
  const kind = rng.pick(['acute', 'right', 'obtuse'] as const)
  const visual = makeAngleVisual(pickClearAngle(kind, rng))
  return {
    prompt: 'What kind of angle is this? (acute, right, or obtuse)',
    correctAnswer: kind,
    explanation: `This is a ${kind} angle.`,
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: (['acute', 'right', 'obtuse'] as const).filter((k) => k !== kind),
  }
}

// ── NY-4.G.2 (a–c stratified) ────────────────────────────────────────────

export function roll4G2(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  const part = rng.pick(['a', 'b', 'c'] as const)
  if (part === 'a') return g4TriangleType(type, advanced, rng)
  if (part === 'b') return g4Parallelogram(type, advanced, rng)
  return g4Rectangle(type, advanced, rng)
}

function g4TriangleType(
  type: QuestionType,
  _advanced: boolean,
  rng: Rng,
): VisualCore {
  const kind = rng.pick(['acute', 'right', 'obtuse'] as const)
  if (type === 'multiple-choice') {
    const correctVisual = makeTriangleByClass(kind, rng)
    const correct = optionFrom(correctVisual, kind)
    const others = (['acute', 'right', 'obtuse'] as const).filter((k) => k !== kind)
    const seen = new Set<string>([JSON.stringify(correctVisual)])
    const distractors: PictureOption[] = []
    const wantKinds = [others[0]!, others[1]!, others[0]!] as const
    const ids = [others[0]!, others[1]!, 'extra'] as const
    let guard = 0
    while (distractors.length < 3 && guard < 40) {
      guard += 1
      const k = wantKinds[distractors.length]!
      const visual = makeTriangleByClass(k, rng)
      const fp = JSON.stringify(visual)
      if (seen.has(fp)) continue
      seen.add(fp)
      distractors.push(optionFrom(visual, ids[distractors.length]!))
    }
    return {
      prompt: 'What type of triangle is shown by its angles?',
      correctAnswer: kind,
      explanation: `This is a ${kind} triangle (classified by angle size).`,
      visualPredicate: trianglePredicate(kind),
      pictureCorrect: correct,
      pictureDistractors: distractors,
    }
  }
  if (type === 'true-false') {
    const wantTrue = rng.chance(0.55)
    const shown = wantTrue
      ? kind
      : rng.pick((['acute', 'right', 'obtuse'] as const).filter((k) => k !== kind))
    const visual = makeTriangleByClass(shown, rng)
    return {
      prompt: `This is a ${kind} triangle.`,
      correctAnswer: wantTrue ? 'true' : 'false',
      explanation: wantTrue
        ? `Yes — classified by angles, it is ${kind}.`
        : `No — this triangle is ${shown}.`,
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: trianglePredicate(kind),
    }
  }
  const visual = makeTriangleByClass(kind, rng)
  return {
    prompt: 'What type of triangle is this by angle size? (acute, right, or obtuse)',
    correctAnswer: kind,
    explanation: `Angle sizes show this is a ${kind} triangle.`,
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: (['acute', 'right', 'obtuse'] as const).filter((k) => k !== kind),
  }
}

function g4Parallelogram(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  if (type === 'multiple-choice') {
    // Correct may be a skewed parallelogram OR a rectangle (also a parallelogram).
    const correctVisual = rng.chance(0.45)
      ? makeParallelogramVisual(rng, { rectangle: true })
      : makeParallelogramVisual(rng)
    const correct = optionFrom(correctVisual, 'para')
    // Distractors must NOT be parallelograms — never use a rectangle here as "not".
    const distractors = [
      optionFrom(makeTrapezoidNotPara(rng), 'trap'),
      optionFrom(makeTriangleByClass('acute', rng), 'tri'),
      optionFrom(makeTriangleByClass('right', rng), 'tri2'),
    ]
    return {
      prompt: 'Which shape is a parallelogram?',
      correctAnswer: 'para',
      explanation:
        'A parallelogram has 2 pairs of parallel sides. Rectangles are parallelograms too.',
      visualPredicate: 'is-parallelogram',
      pictureCorrect: correct,
      pictureDistractors: distractors,
    }
  }
  if (type === 'true-false') {
    const wantTrue = rng.chance(0.55)
    // When false, never show a rectangle (it IS a parallelogram).
    const visual = wantTrue
      ? makeParallelogramVisual(rng, { rectangle: advanced && rng.chance(0.4) })
      : makeTrapezoidNotPara(rng)
    return {
      prompt: 'This shape is a parallelogram.',
      correctAnswer: wantTrue ? 'true' : 'false',
      explanation: wantTrue
        ? 'It has 2 pairs of parallel sides.'
        : 'It does not have 2 pairs of parallel sides.',
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'is-parallelogram',
    }
  }
  const visual = makeParallelogramVisual(rng)
  return {
    prompt: 'A quadrilateral with 2 pairs of parallel sides is called a ___.',
    correctAnswer: 'parallelogram',
    explanation: 'That is the definition of a parallelogram.',
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: ['trapezoid', 'triangle', 'hexagon'],
  }
}

function g4Rectangle(
  type: QuestionType,
  _advanced: boolean,
  rng: Rng,
): VisualCore {
  if (type === 'multiple-choice') {
    const correct = optionFrom(makeParallelogramVisual(rng, { rectangle: true }), 'rect')
    // Skewed parallelogram is NOT a rectangle — good distractor.
    const distractors = [
      optionFrom(makeParallelogramVisual(rng), 'para'),
      optionFrom(makeTrapezoidNotPara(rng), 'trap'),
      optionFrom(makeTriangleByClass('right', rng), 'tri'),
    ]
    return {
      prompt: 'Which shape is a rectangle?',
      correctAnswer: 'rect',
      explanation: 'A rectangle is a quadrilateral with four right angles.',
      visualPredicate: 'is-rectangle',
      pictureCorrect: correct,
      pictureDistractors: distractors,
    }
  }
  if (type === 'true-false') {
    const wantTrue = rng.chance(0.55)
    const visual = wantTrue
      ? makeParallelogramVisual(rng, { rectangle: true })
      : makeParallelogramVisual(rng) // parallelogram but not rectangle
    return {
      prompt: 'This shape is a rectangle.',
      correctAnswer: wantTrue ? 'true' : 'false',
      explanation: wantTrue
        ? 'It has four right angles.'
        : 'It is a parallelogram but does not have four right angles.',
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'is-rectangle',
    }
  }
  const visual = makeParallelogramVisual(rng, { rectangle: true })
  return {
    prompt: 'A quadrilateral with four right angles is called a ___.',
    correctAnswer: 'rectangle',
    explanation: 'Four right angles define a rectangle.',
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: ['parallelogram', 'triangle', 'trapezoid'],
  }
}

// ── NY-4.G.3 ─────────────────────────────────────────────────────────────

export function roll4G3(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    return g4WhichHasSymmetry(advanced, rng)
  }
  if (type === 'true-false') {
    return g4SymmetryTf(advanced, rng)
  }
  return g4CountAxes(advanced, rng)
}

function g4WhichHasSymmetry(advanced: boolean, rng: Rng): VisualCore {
  const pts = advanced && rng.chance(0.4) ? squarePoints() : isoscelesPoints()
  const axis =
    pts.length === 4
      ? { a: { x: 40, y: -10 }, b: { x: 40, y: 90 } }
      : { a: { x: 40, y: -10 }, b: { x: 40, y: 90 } }
  const correct = optionFrom(makeSymFigure(pts, axis, true), 'sym')
  // Near-miss: scalene or bumped square
  const near = scalenePoints()
  near[1] = { x: near[1]!.x + 1, y: near[1]!.y }
  const distractors = [
    optionFrom(makeSymFigure(near, axis, true), 'near'),
    optionFrom(makeSymFigure(scalenePoints(), axis, true), 'scalene'),
    optionFrom(makeAngleVisual(90), 'angle'),
  ]
  return {
    prompt: 'Which figure has the dashed line as a line of symmetry?',
    correctAnswer: 'sym',
    explanation:
      'A line of symmetry folds the figure onto matching parts.',
    visualPredicate: 'has-symmetry-axis',
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g4SymmetryTf(_advanced: boolean, rng: Rng): VisualCore {
  const wantTrue = rng.chance(0.55)
  if (wantTrue) {
    const pts = rng.chance(0.5) ? squarePoints() : isoscelesPoints()
    const axis = { a: { x: 40, y: -10 }, b: { x: 40, y: 90 } }
    const visual = makeSymFigure(pts, axis, true)
    return {
      prompt: 'The dashed line is a line of symmetry.',
      correctAnswer: 'true',
      explanation: 'Folding along the dashed line matches both sides.',
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'has-symmetry-axis',
    }
  }
  // False: show axis that is NOT a symmetry line (off by ≥1 grid unit)
  const pts = isoscelesPoints()
  const badAxis = { a: { x: 50, y: -10 }, b: { x: 50, y: 90 } }
  const visual = makeSymFigure(pts, badAxis, true)
  // Ensure predicate is false
  if (isSymmetricAcross(pts, badAxis.a, badAxis.b)) {
    badAxis.a.x = 55
    badAxis.b.x = 55
  }
  return {
    prompt: 'The dashed line is a line of symmetry.',
    correctAnswer: 'false',
    explanation: 'Folding along this line does not match both sides.',
    visual: makeSymFigure(pts, badAxis, true),
    altText: altTextFromVisual(visual),
    visualPredicate: 'has-symmetry-axis',
  }
}

function g4CountAxes(advanced: boolean, rng: Rng): VisualCore {
  const choice = advanced
    ? rng.pick(['square', 'rectangle', 'isosceles', 'scalene'] as const)
    : rng.pick(['square', 'isosceles', 'scalene'] as const)
  let points: Point2D[]
  let count: number
  let axis: { a: Point2D; b: Point2D } | null = null
  if (choice === 'square') {
    points = squarePoints()
    count = 4
    axis = { a: { x: 40, y: -10 }, b: { x: 40, y: 90 } }
  } else if (choice === 'rectangle') {
    points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ]
    count = 2
    axis = { a: { x: 50, y: -10 }, b: { x: 50, y: 60 } }
  } else if (choice === 'isosceles') {
    points = isoscelesPoints()
    count = 1
    axis = { a: { x: 40, y: -10 }, b: { x: 40, y: 90 } }
  } else {
    points = scalenePoints()
    count = 0
    axis = null
  }
  const visual = makeSymFigure(points, axis, Boolean(axis))
  return {
    prompt: 'How many lines of symmetry does this shape have?',
    correctAnswer: String(count),
    explanation: `This ${choice} has ${count} line${count === 1 ? '' : 's'} of symmetry.`,
    visual,
    altText: altTextFromVisual(visual),
  }
}

// ── NY-4.MD.3 ────────────────────────────────────────────────────────────

export function roll4Md3(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  params: Record<string, DifficultyParamValue>,
): VisualCore {
  const maxSide = paramNum(params, 'maxSide', advanced ? 40 : 12)
  let w = rng.int(2, Math.min(maxSide, advanced ? 40 : 12))
  let h = rng.int(2, Math.min(maxSide, advanced ? 40 : 12))
  // Keep products within grade-4 comfort for beginner
  if (!advanced && w * h > 100) {
    w = rng.int(2, 10)
    h = rng.int(2, 10)
  }
  const area = w * h
  const perimeter = 2 * (w + h)
  const visual = makeLabeledRect(w, h)
  const mode = rng.pick(
    advanced
      ? (['area', 'perimeter', 'unknown-from-area', 'unknown-from-perimeter'] as const)
      : (['area', 'perimeter'] as const),
  )

  if (mode === 'unknown-from-area') {
    return {
      prompt: `A rectangle has area ${area} square units. One side is ${w}. What is the other side length?`,
      correctAnswer: String(h),
      explanation: `Area = length × width, so ${area} ÷ ${w} = ${h}.`,
      visual,
      altText: altTextFromVisual(visual),
      ...(type === 'multiple-choice'
        ? {
            textDistractors: [
              String(h + 1),
              String(Math.max(1, h - 1)),
              String(area - w),
              String(w),
            ],
          }
        : {}),
    }
  }
  if (mode === 'unknown-from-perimeter') {
    return {
      prompt: `A rectangle has perimeter ${perimeter}. One side is ${w}. What is the other side length?`,
      correctAnswer: String(h),
      explanation: `2 × (${w} + ?) = ${perimeter}, so ? = ${h}.`,
      visual,
      altText: altTextFromVisual(visual),
      ...(type === 'multiple-choice'
        ? {
            textDistractors: [
              String(h + 1),
              String(Math.max(1, h - 1)),
              String(perimeter - w),
              String(w),
            ],
          }
        : {}),
    }
  }
  if (mode === 'perimeter') {
    return {
      prompt: advanced
        ? `A garden is ${w} meters long and ${h} meters wide. What is its perimeter in meters?`
        : `What is the perimeter of this ${w}-by-${h} rectangle?`,
      correctAnswer: String(perimeter),
      explanation: `Perimeter = 2 × (${w} + ${h}) = ${perimeter}.`,
      visual,
      altText: altTextFromVisual(visual),
      ...(type === 'multiple-choice'
        ? {
            textDistractors: [
              String(area),
              String(w + h),
              String(perimeter + 2),
              String(Math.max(1, perimeter - 2)),
            ],
          }
        : {}),
    }
  }
  return {
    prompt: advanced
      ? `A rectangle is ${w} units by ${h} units. What is its area?`
      : `What is the area of this ${w}-by-${h} rectangle?`,
    correctAnswer: String(area),
    explanation: `Area = ${w} × ${h} = ${area}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'rect-composite-area',
    ...(type === 'multiple-choice'
      ? {
          textDistractors: [
            String(perimeter),
            String(w + h),
            String(area + w),
            String(Math.max(1, area - h)),
          ],
        }
      : {}),
  }
}

// ── NY-4.MD.5 (a, b stratified) ──────────────────────────────────────────

export function roll4Md5(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  const part = rng.pick(['a', 'b'] as const)
  if (part === 'b') return md5OneDegree(type, advanced, rng)
  return md5CircleFraction(type, advanced, rng)
}

function md5CircleFraction(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const pool = advanced
    ? [
        { deg: 90, n: 1, d: 4 },
        { deg: 180, n: 1, d: 2 },
        { deg: 45, n: 1, d: 8 },
        { deg: 120, n: 1, d: 3 },
        { deg: 60, n: 1, d: 6 },
      ]
    : [
        { deg: 90, n: 1, d: 4 },
        { deg: 180, n: 1, d: 2 },
        { deg: 90, n: 1, d: 4 },
      ]
  const pick = rng.pick(pool)
  const visual = makeAngleVisual(pick.deg)
  const frac = fmtFrac(pick.n, pick.d)

  if (type === 'true-false') {
    const wantTrue = rng.chance(0.55)
    const claim = wantTrue
      ? frac
      : fmtFrac(pick.n, pick.d === 4 ? 2 : 4)
    return {
      prompt: `This angle's arc covers ${showFrac(
        Number(claim.split('/')[0]),
        Number(claim.split('/')[1]),
      )} of a circle.`,
      correctAnswer: wantTrue ? 'true' : 'false',
      explanation: wantTrue
        ? `A full circle is 360°. ${pick.deg}° is ${showFrac(pick.n, pick.d)} of 360°.`
        : `A full circle is 360°. ${pick.deg}° is ${showFrac(pick.n, pick.d)}, not ${showFrac(Number(claim.split('/')[0]), Number(claim.split('/')[1]))}.`,
      visual,
      altText: altTextFromVisual(visual),
    }
  }
  if (type === 'multiple-choice') {
    return {
      prompt: "What fraction of the circle does this angle's arc cover?",
      correctAnswer: frac,
      explanation: `A full circle is 360°. ${pick.deg}° ÷ 360° = ${showFrac(pick.n, pick.d)}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: ['1/2', '1/4', '1/3', '1/8', '1/6'].filter((f) => f !== frac),
    }
  }
  return {
    prompt: "What fraction of the circle does this angle's arc cover? Write as a fraction.",
    correctAnswer: frac,
    explanation: `A full circle is 360°. ${pick.deg}° is ${showFrac(pick.n, pick.d)} of the circle.`,
    visual,
    altText: altTextFromVisual(visual),
  }
}

function md5OneDegree(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const n = advanced
    ? rng.pick([15, 30, 45, 60, 75, 90, 120, 135, 150] as const)
    : rng.pick([30, 45, 60, 90, 180] as const)
  const visual = makeAngleVisual(n === 180 ? 150 : n) // 180° arc still readable as obtuse-ish; measure is from n
  // Prefer protractor for clarity when advanced
  const shown: VisualSpec = advanced
    ? {
        kind: 'protractor-angle',
        vertex: { x: 0, y: 0 },
        from: { x: 80, y: 0 },
        to: polar(0, 0, 80, Math.min(n, 180)),
        measureDeg: Math.min(n, 180),
      }
    : visual

  if (type === 'true-false') {
    const wantTrue = rng.chance(0.55)
    const claim = wantTrue ? n : n + rng.pick([5, 10, -5])
    return {
      prompt: `An angle that turns through ${claim} one-degree angles has a measure of ${claim} degrees.`,
      correctAnswer: wantTrue ? 'true' : 'false',
      explanation: wantTrue
        ? 'Each one-degree turn adds 1°, so n turns make n degrees.'
        : `Turning through ${n} one-degree angles makes ${n}°, not ${claim}°.`,
      visual: shown,
      altText: altTextFromVisual(shown),
    }
  }
  if (type === 'multiple-choice') {
    return {
      prompt: `An angle turns through ${n} one-degree angles. What is its measure in degrees?`,
      correctAnswer: String(n),
      explanation: `${n} one-degree turns make an angle of ${n}°.`,
      visual: shown,
      altText: altTextFromVisual(shown),
      textDistractors: [
        String(n + 10),
        String(Math.max(1, n - 15)),
        String(360 - n),
        String(n * 2),
      ],
    }
  }
  return {
    prompt: `An angle turns through ${n} one-degree angles. What is its measure in degrees?`,
    correctAnswer: String(n),
    explanation: `Measure = number of one-degree turns = ${n}°.`,
    visual: shown,
    altText: altTextFromVisual(shown),
  }
}

// ── NY-4.MD.6 ────────────────────────────────────────────────────────────

export function roll4Md6(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  // Avoid acute/right/obtuse classification margins (76–89 and 91–104).
  const measure = advanced
    ? (() => {
        let m = rng.int(1, 179)
        while ((m > 75 && m < 90) || (m > 90 && m < 105)) {
          m = rng.int(1, 179)
        }
        return m
      })()
    : rng.pick([
        10, 20, 30, 40, 50, 60, 70, 90, 110, 120, 130, 140, 150, 160, 170,
      ] as const)
  // Avoid ambiguous angle classification margins for the drawn rays (not required for measure).
  const visual: VisualSpec = {
    kind: 'protractor-angle',
    vertex: { x: 0, y: 0 },
    from: { x: 80, y: 0 },
    to: polar(0, 0, 80, measure),
    measureDeg: measure,
  }
  if (type === 'multiple-choice') {
    return {
      prompt: 'What is the measure of the angle on the protractor?',
      correctAnswer: String(measure),
      explanation: `Read the scale where the ray meets the protractor: ${measure}°.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String((180 - measure + 360) % 180 || 10),
        String(Math.min(179, measure + 10)),
        String(Math.max(1, measure - 10)),
        String(measure === 90 ? 45 : 90),
      ],
      visualPredicate: 'protractor-measure',
    }
  }
  return {
    prompt: 'What is the measure of the angle in degrees?',
    correctAnswer: String(measure),
    explanation: `The protractor shows ${measure}°.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'protractor-measure',
  }
}

// ── NY-4.MD.7 ────────────────────────────────────────────────────────────

export function roll4Md7(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const total = rng.pick(advanced ? ([90, 180] as const) : ([90, 180] as const))
  if (advanced && rng.chance(0.4)) {
    // Three parts, one unknown
    const a = rng.int(20, Math.floor(total / 3))
    const b = rng.int(20, Math.floor((total - a) / 2))
    const c = total - a - b
    if (c < 15) return roll4Md7(type, false, rng)
    const visual = makeAngleVisual(total === 180 ? 150 : 90)
    const prompt = `A ${total}° angle is split into ${a}°, ${b}°, and one unknown angle. What is the unknown measure?`
    const answer = String(c)
    return {
      prompt,
      correctAnswer: answer,
      explanation: `${a} + ${b} + ? = ${total}, so ? = ${c}.`,
      visual,
      altText: altTextFromVisual(visual),
      ...(type === 'multiple-choice'
        ? {
            textDistractors: [
              String(c + 5),
              String(Math.max(1, c - 5)),
              String(a + b),
              String(total - a),
            ],
          }
        : {}),
    }
  }
  const known = rng.int(20, total - 25)
  const unknown = total - known
  const visual = makeAngleVisual(total === 180 ? 150 : 90)
  return {
    prompt: `A ${total}° angle is split into ${known}° and one unknown angle. What is the unknown measure?`,
    correctAnswer: String(unknown),
    explanation: `${known} + ? = ${total}, so ? = ${unknown}.`,
    visual,
    altText: altTextFromVisual(visual),
    ...(type === 'multiple-choice'
      ? {
          textDistractors: [
            String(unknown + 10),
            String(Math.max(1, unknown - 10)),
            String(known),
            String(total + known),
          ],
        }
      : {}),
  }
}
