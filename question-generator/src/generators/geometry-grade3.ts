/**
 * Grade 3 Geometry + geometric MD generators (NY-3.G.*, NY-3.MD.5–8).
 * Answers come from geometry / visual predicates — never label-then-draw.
 */
import { type Rng } from '../rng.ts'
import type {
  DifficultyParamValue,
  PictureOption,
  QuestionType,
} from '../types.ts'
import { altTextFromVisual } from '../visual-alt-text.ts'
import type { VisualPredicateId } from '../visual-predicates.ts'
import type { VisualSpec } from '../visual.ts'
import {
  makeAreaModel,
  makeConcavePentagon,
  makeConcaveQuad,
  makeLRectComposite,
  makeLShadedGrid,
  makeLabeledRect,
  makeNGon,
  makePartition,
  makeShape,
  makeShadedGrid,
  makeUnitSquareGrid,
  pickFill,
  type PartitionParts,
} from './geometry-shapes.ts'
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

type PolyFamily = 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon'

const POLY_SIDES: Record<PolyFamily, 3 | 4 | 5 | 6> = {
  triangle: 3,
  quadrilateral: 4,
  pentagon: 5,
  hexagon: 6,
}

const POLY_PREDICATE: Record<PolyFamily, VisualPredicateId> = {
  triangle: 'is-closed-triangle',
  quadrilateral: 'is-quadrilateral',
  pentagon: 'is-pentagon',
  hexagon: 'is-hexagon',
}

function polyLabel(family: PolyFamily): string {
  return family
}

function makeFamilyVisual(
  family: PolyFamily,
  advanced: boolean,
  rng: Rng,
): VisualSpec {
  // Always vary fill so repeated family options stay structurally distinct.
  const fill = pickFill(rng)
  if (family === 'triangle') {
    return makeNGon(3, rng, { advanced: advanced || rng.chance(0.5), fill })
  }
  if (family === 'quadrilateral') {
    if (advanced && rng.chance(0.35)) return makeConcaveQuad(rng)
    if (rng.chance(0.4)) return makeNGon(4, rng, { advanced: true, fill })
    return makeShape(rng.pick(['square', 'rectangle', 'trapezoid'] as const), rng, {
      advanced: advanced || rng.chance(0.5),
      fill,
    })
  }
  if (family === 'pentagon') {
    if (advanced && rng.chance(0.4)) return makeConcavePentagon(rng)
    return makeNGon(5, rng, { advanced: true, fill })
  }
  return makeNGon(6, rng, { advanced: true, fill })
}

function otherFamilies(family: PolyFamily): PolyFamily[] {
  return (
    ['triangle', 'quadrilateral', 'pentagon', 'hexagon'] as const
  ).filter((f) => f !== family)
}

// ── NY-3.G.1 ─────────────────────────────────────────────────────────────

export function roll3G1(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    const pattern = rng.pick(['identify', 'identify', 'does-not-belong'] as const)
    if (pattern === 'does-not-belong') return g3DoesNotBelong(advanced, rng)
    return g3IdentifyFamily(advanced, rng)
  }
  if (type === 'true-false') {
    return g3FamilyTf(advanced, rng)
  }
  return rng.chance(0.5) ? g3SideCount(advanced, rng) : g3NameShort(advanced, rng)
}

function g3IdentifyFamily(advanced: boolean, rng: Rng): VisualCore {
  const family = rng.pick([
    'triangle',
    'quadrilateral',
    'pentagon',
    'hexagon',
  ] as const)
  const correctVisual = makeFamilyVisual(family, advanced, rng)
  const correct: PictureOption = {
    id: family,
    altText: altTextFromVisual(correctVisual),
    visual: correctVisual,
  }
  const distractors = otherFamilies(family)
    .slice(0, 3)
    .map((f) => optionFrom(makeFamilyVisual(f, advanced, rng), f))

  return {
    prompt: `Which shape is a ${polyLabel(family)}?`,
    correctAnswer: family,
    explanation: `A ${polyLabel(family)} has ${POLY_SIDES[family]} sides and ${POLY_SIDES[family]} vertices.`,
    visualPredicate: POLY_PREDICATE[family],
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g3DoesNotBelong(advanced: boolean, rng: Rng): VisualCore {
  const family = rng.pick([
    'triangle',
    'quadrilateral',
    'pentagon',
    'hexagon',
  ] as const)
  const odd = rng.pick(otherFamilies(family))
  const oddVisual = makeFamilyVisual(odd, advanced, rng)
  const correct: PictureOption = {
    id: 'odd',
    altText: altTextFromVisual(oddVisual),
    visual: oddVisual,
  }
  const seen = new Set<string>([JSON.stringify(oddVisual)])
  const distractors: PictureOption[] = []
  let guard = 0
  while (distractors.length < 3 && guard < 40) {
    guard += 1
    const visual = makeFamilyVisual(family, true, rng)
    const fp = JSON.stringify(visual)
    if (seen.has(fp)) continue
    seen.add(fp)
    distractors.push(optionFrom(visual, `same-${distractors.length}`))
  }
  // Last-resort uniqueness: nudge fill via a tiny vertex jitter on a fresh shape.
  while (distractors.length < 3) {
    const visual = makeFamilyVisual(family, true, rng)
    if (visual.kind === 'polygon') {
      visual.points = visual.points.map((p, i) => ({
        x: p.x + (distractors.length + 1) * 0.01 * (i + 1),
        y: p.y,
      }))
    }
    distractors.push(optionFrom(visual, `same-${distractors.length}`))
  }

  return {
    prompt: `Which shape does not belong with the ${polyLabel(family)}s?`,
    correctAnswer: 'odd',
    explanation: `The others are ${polyLabel(family)}s (${POLY_SIDES[family]} sides). This one is a ${polyLabel(odd)}.`,
    visualPredicate: POLY_PREDICATE[odd],
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g3FamilyTf(advanced: boolean, rng: Rng): VisualCore {
  const family = rng.pick([
    'triangle',
    'quadrilateral',
    'pentagon',
    'hexagon',
  ] as const)
  const wantTrue = rng.chance(0.55)
  const shown = wantTrue
    ? family
    : rng.pick(otherFamilies(family))
  const visual = makeFamilyVisual(shown, advanced, rng)
  return {
    prompt: `This shape is a ${polyLabel(family)}.`,
    correctAnswer: wantTrue ? 'true' : 'false',
    explanation: wantTrue
      ? `Yes — it has ${POLY_SIDES[family]} sides and ${POLY_SIDES[family]} vertices.`
      : `No — this is a ${polyLabel(shown)}, not a ${polyLabel(family)}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: POLY_PREDICATE[family],
  }
}

function g3SideCount(advanced: boolean, rng: Rng): VisualCore {
  const family = rng.pick([
    'triangle',
    'quadrilateral',
    'pentagon',
    'hexagon',
  ] as const)
  const visual = makeFamilyVisual(family, advanced, rng)
  const n = POLY_SIDES[family]
  const askVertices = rng.chance(0.45)
  return {
    prompt: askVertices
      ? 'How many vertices does this polygon have?'
      : 'How many sides does this polygon have?',
    correctAnswer: String(n),
    explanation: `A ${polyLabel(family)} has ${n} sides and ${n} vertices.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: askVertices ? 'count-vertices' : 'count-sides',
  }
}

function g3NameShort(advanced: boolean, rng: Rng): VisualCore {
  const family = rng.pick([
    'triangle',
    'quadrilateral',
    'pentagon',
    'hexagon',
  ] as const)
  const visual = makeFamilyVisual(family, advanced, rng)
  return {
    prompt: 'What is this polygon called?',
    correctAnswer: polyLabel(family),
    explanation: `It has ${POLY_SIDES[family]} sides, so it is a ${polyLabel(family)}.`,
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: otherFamilies(family).map(polyLabel),
  }
}

// ── NY-3.G.2 ─────────────────────────────────────────────────────────────

export function roll3G2(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    return rng.chance(0.55)
      ? g3WhichEqualAreas(advanced, rng)
      : g3UnitFractionMc(advanced, rng)
  }
  if (type === 'true-false') {
    return g3ShadedFractionTf(advanced, rng)
  }
  return g3UnitFractionShort(advanced, rng)
}

function g3PartsPool(advanced: boolean): PartitionParts[] {
  return advanced ? [2, 3, 4, 6, 8] : [2, 3, 4]
}

function equalPredicate(parts: PartitionParts): VisualPredicateId {
  switch (parts) {
    case 2:
      return 'is-equal-halves'
    case 3:
      return 'is-equal-thirds'
    case 4:
      return 'is-equal-fourths'
    case 6:
      return 'is-equal-sixths'
    case 8:
      return 'is-equal-eighths'
    default: {
      const _exhaustive: never = parts
      return _exhaustive
    }
  }
}

function g3WhichEqualAreas(advanced: boolean, rng: Rng): VisualCore {
  const parts = rng.pick(g3PartsPool(advanced))
  const shape = rng.pick(['circle', 'rectangle'] as const)
  const correctVisual = makePartition(rng, {
    shape,
    parts,
    equal: true,
    advanced,
  })
  const correct = optionFrom(correctVisual, 'equal')
  const otherParts = g3PartsPool(advanced).filter((p) => p !== parts)
  const distractors: PictureOption[] = [
    optionFrom(
      makePartition(rng, { shape, parts, equal: false, advanced }),
      'unequal',
    ),
    optionFrom(
      makePartition(rng, {
        shape: shape === 'circle' ? 'rectangle' : 'circle',
        parts: rng.pick(otherParts.length ? otherParts : ([2, 3, 4] as PartitionParts[])),
        equal: true,
        advanced,
      }),
      'wrong-count',
    ),
    optionFrom(
      makePartition(rng, {
        shape,
        parts: rng.pick(otherParts.length ? otherParts : ([3, 4] as PartitionParts[])),
        equal: false,
        advanced,
      }),
      'extra',
    ),
  ]
  return {
    prompt: `Which shape is split into ${parts} equal areas?`,
    correctAnswer: 'equal',
    explanation: `Equal areas mean each of the ${parts} parts covers the same amount.`,
    visualPredicate: equalPredicate(parts),
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g3UnitFractionMc(advanced: boolean, rng: Rng): VisualCore {
  const parts = rng.pick(g3PartsPool(advanced))
  const visual = makePartition(rng, {
    shape: rng.pick(['circle', 'rectangle']),
    parts,
    equal: true,
    advanced,
    shadedParts: [0],
  })
  const correct = fmtFrac(1, parts)
  const distractors = g3PartsPool(true)
    .filter((p) => p !== parts)
    .map((p) => fmtFrac(1, p))
  return {
    prompt: `This shape is split into ${parts} equal parts. What fraction is each part?`,
    correctAnswer: correct,
    explanation: `Each equal part is ${showFrac(1, parts)} of the whole.`,
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: distractors,
  }
}

function g3ShadedFractionTf(advanced: boolean, rng: Rng): VisualCore {
  const parts = rng.pick(g3PartsPool(advanced))
  const equal = rng.chance(0.6)
  const visual = makePartition(rng, {
    shape: rng.pick(['circle', 'rectangle']),
    parts,
    equal,
    advanced,
    shadedParts: equal ? [0] : [0],
  })
  // Claim the shaded part is 1/parts. True only when parts are equal.
  const claimTrue = equal
  return {
    prompt: `The shaded part is ${showFrac(1, parts)} of the whole.`,
    correctAnswer: claimTrue ? 'true' : 'false',
    explanation: claimTrue
      ? `Yes — ${parts} equal parts means each is ${showFrac(1, parts)}.`
      : `No — the parts are not equal, so the shaded piece is not ${showFrac(1, parts)}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: equalPredicate(parts),
  }
}

function g3UnitFractionShort(advanced: boolean, rng: Rng): VisualCore {
  const parts = rng.pick(g3PartsPool(advanced))
  const visual = makePartition(rng, {
    shape: rng.pick(['circle', 'rectangle']),
    parts,
    equal: true,
    advanced,
    shadedParts: [0],
  })
  // Short-answer asks for the denominator (numeric predicate); prompt shows fraction language.
  if (rng.chance(0.45)) {
    return {
      prompt: `This shape is split into equal parts. Each shaded part is ${showFrac(1, parts)} of the whole. How many equal parts are there?`,
      correctAnswer: String(parts),
      explanation: `${showFrac(1, parts)} means the whole is split into ${parts} equal parts.`,
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'partition-part-count',
    }
  }
  return {
    prompt: `This shape is split into ${parts} equal parts. What fraction is each part? Write as a fraction.`,
    correctAnswer: fmtFrac(1, parts),
    explanation: `Each equal part is ${showFrac(1, parts)}.`,
    visual,
    altText: altTextFromVisual(visual),
  }
}

// ── NY-3.MD.5 ────────────────────────────────────────────────────────────

export function roll3Md5(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  // Stratify a (unit square) / b (area = n unit squares)
  const part = rng.pick(['a', 'b'] as const)
  if (part === 'a') return md5UnitSquare(type, advanced, rng)
  return md5CoveredArea(type, advanced, rng)
}

function md5UnitSquare(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const visual = makeUnitSquareGrid(1, 1)
  const unit = advanced
    ? rng.pick(['square unit', 'square centimeter', 'square inch'] as const)
    : 'square unit'
  if (type === 'true-false') {
    if (rng.chance(0.55)) {
      return {
        prompt: `One unit square has an area of 1 ${unit}.`,
        correctAnswer: 'true',
        explanation: `A unit square covers exactly 1 ${unit} of area.`,
        visual,
        altText: altTextFromVisual(visual),
      }
    }
    return {
      prompt: `One unit square has an area of 2 ${unit}s.`,
      correctAnswer: 'false',
      explanation: `A unit square has area 1 ${unit}, not 2.`,
      visual,
      altText: altTextFromVisual(visual),
    }
  }
  if (type === 'multiple-choice') {
    return {
      prompt: `What is the area of one unit square?`,
      correctAnswer: `1 ${unit}`,
      explanation: `By definition, one unit square has area 1 ${unit}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [`2 ${unit}s`, `0 ${unit}s`, `4 ${unit}s`],
    }
  }
  return {
    prompt: `A unit square has an area of how many ${unit}s?`,
    correctAnswer: '1',
    explanation: `One unit square = 1 ${unit}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'count-shaded-cells',
  }
}

function md5CoveredArea(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const maxCells = advanced ? 20 : 12
  const rows = rng.int(2, advanced ? 5 : 4)
  const cols = rng.int(2, Math.min(5, Math.floor(maxCells / rows)))
  const area = rows * cols
  const visual = makeUnitSquareGrid(rows, cols)
  const unit = advanced
    ? rng.pick(['square units', 'square centimeters', 'square inches'] as const)
    : 'square units'

  if (type === 'true-false') {
    const claim = rng.chance(0.5) ? area : area + rng.pick([1, 2, cols, -1])
    const ok = claim === area
    return {
      prompt: `A figure covered by ${claim} unit squares without gaps or overlaps has area ${claim} ${unit}.`,
      correctAnswer: ok ? 'true' : 'false',
      explanation: ok
        ? `Area equals the number of unit squares that cover the figure: ${area}.`
        : `This figure is covered by ${area} unit squares, so its area is ${area} ${unit}.`,
      visual,
      altText: altTextFromVisual(visual),
    }
  }
  if (type === 'multiple-choice') {
    return {
      prompt: `This figure is covered by unit squares without gaps or overlaps. What is its area in ${unit}?`,
      correctAnswer: String(area),
      explanation: `Count the unit squares: ${area}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String(rows + cols),
        String(area + cols),
        String(Math.max(1, area - 1)),
        String(rows * Math.max(1, cols - 1)),
      ],
      visualPredicate: 'count-shaded-cells',
    }
  }
  return {
    prompt: `A figure covered by ${area} unit squares has what area (in ${unit})?`,
    correctAnswer: String(area),
    explanation: `Area = number of unit squares = ${area}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'count-shaded-cells',
  }
}

// ── NY-3.MD.6 ────────────────────────────────────────────────────────────

export function roll3Md6(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  params: Record<string, DifficultyParamValue>,
): VisualCore {
  const maxArea = paramNum(params, 'maxArea', advanced ? 30 : 20)
  let visual: VisualSpec
  let area: number

  if (advanced && rng.chance(0.55)) {
    const armCols = rng.int(3, 5)
    const armRows = 1
    const stemExtra = rng.int(2, 4)
    const built = makeLShadedGrid(armRows, armCols, stemExtra)
    // Cap area
    if (built.area <= maxArea) {
      visual = built.visual
      area = built.area
    } else {
      const rows = rng.int(2, 5)
      const cols = rng.int(2, Math.min(6, Math.floor(maxArea / rows)))
      visual = makeUnitSquareGrid(rows, cols)
      area = rows * cols
    }
  } else if (advanced && rng.chance(0.4)) {
    // Irregular polyomino-ish: shade a connected subset
    const rows = rng.int(3, 5)
    const cols = rng.int(3, 5)
    const target = rng.int(8, Math.min(maxArea, rows * cols - 1))
    const shaded: Array<{ row: number; col: number }> = []
    for (let i = 0; i < target; i += 1) {
      shaded.push({ row: Math.floor(i / cols), col: i % cols })
    }
    visual = makeShadedGrid(rows, cols, shaded)
    area = shaded.length
  } else {
    const rows = rng.int(2, advanced ? 5 : 4)
    const cols = rng.int(2, Math.min(6, Math.floor(maxArea / rows)))
    visual = makeUnitSquareGrid(rows, cols)
    area = rows * cols
  }

  const unit = advanced
    ? rng.pick(['square units', 'square centimeters', 'square inches'] as const)
    : 'square units'

  if (type === 'multiple-choice') {
    return {
      prompt: `Count the unit squares. What is the area in ${unit}?`,
      correctAnswer: String(area),
      explanation: `There are ${area} unit squares.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String(area + 1),
        String(Math.max(1, area - 2)),
        String(area + 3),
        String(Math.max(1, area - 1)),
      ],
      visualPredicate: 'count-shaded-cells',
    }
  }
  // short-answer (T/F not in registry for MD.6)
  return {
    prompt: `Count the squares: what is the area in ${unit}?`,
    correctAnswer: String(area),
    explanation: `Count the shaded unit squares: ${area}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'count-shaded-cells',
  }
}

// ── NY-3.MD.7 (a–d stratified) ───────────────────────────────────────────

export function roll3Md7(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  params: Record<string, DifficultyParamValue>,
): VisualCore {
  const part = rng.pick(['a', 'b', 'c', 'd'] as const)
  const maxSide = paramNum(params, 'maxSide', 10)
  const maxProduct = paramNum(params, 'maxProduct', 100)

  if (part === 'a') return md7TilingProduct(type, advanced, rng, maxSide, maxProduct)
  if (part === 'b') return md7MultiplySides(type, advanced, rng, maxSide, maxProduct)
  if (part === 'c') return md7Distributive(type, advanced, rng, maxSide, maxProduct)
  return md7Composite(type, advanced, rng, maxSide, maxProduct)
}

function md7TilingProduct(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  maxSide: number,
  maxProduct: number,
): VisualCore {
  let w = rng.int(2, Math.min(maxSide, advanced ? 10 : 6))
  let h = rng.int(2, Math.min(maxSide, advanced ? 10 : 6))
  while (w * h > maxProduct) {
    w = Math.max(2, w - 1)
    h = Math.max(2, h - 1)
  }
  const area = w * h
  const visual = makeUnitSquareGrid(h, w)

  if (type === 'multiple-choice') {
    return {
      prompt: `This rectangle is tiled with unit squares. Side lengths are ${w} and ${h}. Which expression equals the area?`,
      correctAnswer: `${w}×${h}`,
      explanation: `Tiling shows area = ${w} × ${h} = ${area}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [`${w}+${h}`, `${w}×${w}`, `${h}+${h}`, `${area}+${w}`],
    }
  }
  return {
    prompt: `A ${w}-by-${h} rectangle is tiled with unit squares. What is the area?`,
    correctAnswer: String(area),
    explanation: `Area = ${w} × ${h} = ${area}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'count-shaded-cells',
  }
}

function md7MultiplySides(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  maxSide: number,
  maxProduct: number,
): VisualCore {
  let w = rng.int(2, Math.min(maxSide, advanced ? 10 : 6))
  let h = rng.int(2, Math.min(maxSide, advanced ? 10 : 6))
  while (w * h > maxProduct) {
    w = Math.max(2, w - 1)
    h = Math.max(2, h - 1)
  }
  const area = w * h
  const visual = makeLabeledRect(w, h)
  const context = advanced
    ? rng.pick([
        `A garden is ${w} meters long and ${h} meters wide. What is its area in square meters?`,
        `A rectangle has side lengths ${w} and ${h}. What is its area?`,
      ])
    : `A rectangle has side lengths ${w} and ${h}. What is its area?`

  if (type === 'multiple-choice') {
    return {
      prompt: context,
      correctAnswer: String(area),
      explanation: `Multiply the side lengths: ${w} × ${h} = ${area}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String(w + h),
        String(2 * (w + h)),
        String(area + w),
        String(Math.max(1, area - h)),
      ],
      visualPredicate: 'rect-composite-area',
    }
  }
  return {
    prompt: context,
    correctAnswer: String(area),
    explanation: `Area = ${w} × ${h} = ${area}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'rect-composite-area',
  }
}

function md7Distributive(
  type: QuestionType,
  _advanced: boolean,
  rng: Rng,
  maxSide: number,
  maxProduct: number,
): VisualCore {
  const a = rng.int(2, Math.min(6, maxSide))
  let b = rng.int(2, 5)
  let c = rng.int(2, 5)
  while (a * (b + c) > maxProduct) {
    b = Math.max(2, b - 1)
    c = Math.max(2, c - 1)
  }
  const area = a * b + a * c
  const visual = makeAreaModel(a, b, c)

  if (type === 'multiple-choice') {
    return {
      prompt: 'Which expression matches the area of this figure?',
      correctAnswer: `${a}×${b}+${a}×${c}`,
      explanation: `The figure is ${a}×${b} plus ${a}×${c}, which equals ${area}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        `${a}×${b + c}`,
        `${a}+${b}+${c}`,
        `${a}×${b}×${c}`,
        `${b}×${c}`,
      ],
      visualPredicate: 'rect-composite-area',
    }
  }
  return {
    prompt: `This figure is made of a ${a}-by-${b} rectangle and a ${a}-by-${c} rectangle. What is the total area?`,
    correctAnswer: String(area),
    explanation: `Area = ${a}×${b} + ${a}×${c} = ${area}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'rect-composite-area',
  }
}

function md7Composite(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  maxSide: number,
  maxProduct: number,
): VisualCore {
  const wide = rng.int(4, Math.min(8, maxSide))
  const tall = rng.int(4, Math.min(8, maxSide))
  const notch = rng.int(2, Math.min(3, wide - 1, tall - 1))
  const stemH = tall - notch
  const area = wide * notch + notch * stemH
  if (area > maxProduct) {
    // Fallback to a smaller L
    return md7Distributive(type, advanced, rng, maxSide, maxProduct)
  }
  const visual = makeLRectComposite(wide, tall, notch)

  if (type === 'multiple-choice' && advanced && rng.chance(0.4)) {
    // Unknown side: give total area and one piece; ask for missing length
    const knownArea = wide * notch
    const unknown = stemH
    return {
      prompt: `This L-shape has total area ${area}. The bottom rectangle is ${wide} by ${notch}. The upright rectangle is ${notch} wide. How tall is the upright rectangle?`,
      correctAnswer: String(unknown),
      explanation: `Upright area = ${area} − ${knownArea} = ${area - knownArea}. Height = ${area - knownArea} ÷ ${notch} = ${unknown}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String(unknown + 1),
        String(Math.max(1, unknown - 1)),
        String(notch),
        String(wide),
      ],
    }
  }

  if (type === 'multiple-choice') {
    return {
      prompt: 'What is the total area of this L-shaped figure?',
      correctAnswer: String(area),
      explanation: `Add the areas of the two rectangles: ${wide}×${notch} + ${notch}×${stemH} = ${area}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String(wide * tall),
        String(area + notch),
        String(Math.max(1, area - notch)),
        String(wide + tall),
      ],
      visualPredicate: 'rect-composite-area',
    }
  }
  return {
    prompt: 'What is the total area of this figure made of two rectangles?',
    correctAnswer: String(area),
    explanation: `Area = ${wide}×${notch} + ${notch}×${stemH} = ${area}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'rect-composite-area',
  }
}

// ── NY-3.MD.8 (a, b stratified) ──────────────────────────────────────────

export function roll3Md8(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const part = rng.pick(['a', 'b'] as const)
  if (part === 'b') return md8SamePerimeterDifferentArea(type, advanced, rng)
  return md8Perimeter(type, advanced, rng)
}

function md8Perimeter(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  if (advanced && rng.chance(0.45)) {
    return md8UnknownSide(type, rng)
  }

  const sides = advanced
    ? rng.pick([3, 4, 5, 6] as const)
    : rng.pick([3, 4] as const)

  if (sides === 4 && rng.chance(0.6)) {
    const w = rng.int(2, advanced ? 10 : 6)
    const h = rng.int(2, advanced ? 8 : 5)
    const perimeter = 2 * (w + h)
    const visual = makeLabeledRect(w, h)
    if (type === 'multiple-choice') {
      return {
        prompt: `What is the perimeter of this ${w}-by-${h} rectangle?`,
        correctAnswer: String(perimeter),
        explanation: `Perimeter = 2 × (${w} + ${h}) = ${perimeter}.`,
        visual,
        altText: altTextFromVisual(visual),
        textDistractors: [
          String(w * h),
          String(w + h),
          String(perimeter + 2),
          String(Math.max(1, perimeter - 2)),
        ],
      }
    }
    return {
      prompt: `A rectangle is ${w} units long and ${h} units wide. What is its perimeter?`,
      correctAnswer: String(perimeter),
      explanation: `Add all four sides: ${w} + ${h} + ${w} + ${h} = ${perimeter}.`,
      visual,
      altText: altTextFromVisual(visual),
    }
  }

  const lengths: number[] = []
  for (let i = 0; i < sides; i += 1) {
    lengths.push(rng.int(2, advanced ? 9 : 6))
  }
  const perimeter = lengths.reduce((s, n) => s + n, 0)
  const family =
    sides === 3
      ? ('triangle' as const)
      : sides === 4
        ? ('quadrilateral' as const)
        : sides === 5
          ? ('pentagon' as const)
          : ('hexagon' as const)
  const visual = makeFamilyVisual(family, false, rng)
  const list = lengths.join(', ')

  if (type === 'multiple-choice') {
    return {
      prompt: `A ${polyLabel(family)} has side lengths ${list}. What is the perimeter?`,
      correctAnswer: String(perimeter),
      explanation: `Add the side lengths: ${list} → ${perimeter}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String(perimeter + lengths[0]!),
        String(Math.max(1, perimeter - lengths[0]!)),
        String(lengths[0]! * sides),
        String(perimeter + 2),
      ],
    }
  }
  return {
    prompt: `A polygon has side lengths ${list}. What is the perimeter?`,
    correctAnswer: String(perimeter),
    explanation: `Perimeter is the sum of the side lengths: ${perimeter}.`,
    visual,
    altText: altTextFromVisual(visual),
  }
}

function md8UnknownSide(type: QuestionType, rng: Rng): VisualCore {
  const w = rng.int(3, 8)
  const h = rng.int(2, 6)
  const perimeter = 2 * (w + h)
  const visual = makeLabeledRect(w, h, `${w}×?`)
  // Hide height in the prompt; student finds h from P and w.
  if (type === 'multiple-choice') {
    return {
      prompt: `A rectangle has perimeter ${perimeter}. One side is ${w}. What is the unknown side length?`,
      correctAnswer: String(h),
      explanation: `2 × (${w} + ?) = ${perimeter}, so ${w} + ? = ${perimeter / 2}, and ? = ${h}.`,
      visual,
      altText: altTextFromVisual(visual),
      textDistractors: [
        String(h + 1),
        String(Math.max(1, h - 1)),
        String(w),
        String(perimeter - w),
      ],
    }
  }
  return {
    prompt: `A rectangle has perimeter ${perimeter}. One side is ${w}. What is the other side length?`,
    correctAnswer: String(h),
    explanation: `Half of ${perimeter} is ${perimeter / 2}. Subtract ${w} to get ${h}.`,
    visual,
    altText: altTextFromVisual(visual),
  }
}

function md8SamePerimeterDifferentArea(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  // Find two rectangles with same perimeter, different area.
  const w1 = rng.int(2, advanced ? 8 : 6)
  const h1 = rng.int(2, advanced ? 8 : 6)
  // Another pair with same perimeter: w2 + h2 = w1 + h1, w2 ≠ w1
  const sum = w1 + h1
  let w2 = rng.int(1, sum - 1)
  while (w2 === w1 || w2 === h1) {
    w2 = rng.int(1, sum - 1)
  }
  const h2 = sum - w2
  const a1 = w1 * h1
  const a2 = w2 * h2
  // Ensure different areas
  if (a1 === a2) {
    w2 = 1
    const h2b = sum - 1
    return md8CompareRects(type, w1, h1, 1, h2b, 'perimeter', rng)
  }
  return md8CompareRects(type, w1, h1, w2, h2, 'perimeter', rng)
}

function md8CompareRects(
  type: QuestionType,
  w1: number,
  h1: number,
  w2: number,
  h2: number,
  mode: 'perimeter' | 'area',
  rng: Rng,
): VisualCore {
  const p1 = 2 * (w1 + h1)
  const p2 = 2 * (w2 + h2)
  const a1 = w1 * h1
  const a2 = w2 * h2
  const visual = makeLabeledRect(w1, h1)

  if (mode === 'perimeter') {
    // Reference is first rect; ask which has same P different A
    const correctVisual = makeLabeledRect(w2, h2)
    const distractorSame = makeLabeledRect(w1, h1)
    // Different perimeter
    const w3 = w1 + 1
    const h3 = h1
    const distractorDiffP = makeLabeledRect(w3, h3)
    // Same area if possible, else another different P
    let w4 = w1
    let h4 = h1 + 1
    const distractorOther = makeLabeledRect(w4, h4)

    if (type === 'multiple-choice') {
      return {
        prompt: `This rectangle is ${w1} by ${h1}. Which rectangle has the same perimeter but a different area?`,
        correctAnswer: 'same-p',
        explanation: `Perimeter ${p1}; area ${a1}. The ${w2}×${h2} rectangle also has perimeter ${p2} but area ${a2}.`,
        visual,
        altText: altTextFromVisual(visual),
        visualPredicate: undefined,
        pictureCorrect: optionFrom(correctVisual, 'same-p'),
        pictureDistractors: [
          optionFrom(distractorSame, 'same-shape'),
          optionFrom(distractorDiffP, 'diff-p'),
          optionFrom(distractorOther, 'other'),
        ],
      }
    }
    // short-answer: ask for the other area
    return {
      prompt: `A ${w1}-by-${h1} rectangle has the same perimeter as a ${w2}-by-${h2} rectangle. What is the area of the ${w2}-by-${h2} rectangle?`,
      correctAnswer: String(a2),
      explanation: `Both have perimeter ${p1}. Area of ${w2}×${h2} is ${a2}.`,
      visual: correctVisual,
      altText: altTextFromVisual(correctVisual),
      visualPredicate: 'rect-composite-area',
    }
  }

  void rng
  void a1
  void a2
  return {
    prompt: `Rectangle A is ${w1}×${h1}. Rectangle B is ${w2}×${h2}. Do they have the same perimeter?`,
    correctAnswer: p1 === p2 ? 'true' : 'false',
    explanation: `Perimeters are ${p1} and ${p2}.`,
    visual,
    altText: altTextFromVisual(visual),
  }
}
