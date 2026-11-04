/**
 * Geometry generators — Grades 1–4 (NY-*.G.*) plus geometric MD.
 * Answers come from geometry / visual predicates — never label-then-draw.
 */
import { createRng, type Rng } from '../rng.ts'
import type {
  DifficultyParamValue,
  GeneratedQuestion,
  PictureOption,
  QuestionType,
} from '../types.ts'
import { altTextFromVisual } from '../visual-alt-text.ts'
import type { VisualPredicateId } from '../visual-predicates.ts'
import type { VisualSpec } from '../visual.ts'
import {
  roll3G1,
  roll3G2,
  roll3Md5,
  roll3Md6,
  roll3Md7,
  roll3Md8,
} from './geometry-grade3.ts'
import {
  roll4G1,
  roll4G2,
  roll4G3,
  roll4Md3,
  roll4Md5,
  roll4Md6,
  roll4Md7,
} from './geometry-grade4.ts'
import {
  advancedExtraDistractors,
  beginnerTargets,
  makeConcavePolygon,
  makeNearClosedGap,
  makePartition,
  makeShape,
  makeUnitSquareGrid,
  shapeLabel,
  sideCountForShape,
  singleTriangleComposite,
  threeTriangleTrapezoid,
  twoSemicircleComposite,
  twoSquaresComposite,
  twoTriangleRectangle,
  twoTrianglesApart,
  type ShapeName,
} from './geometry-shapes.ts'
import {
  assertTypeSupported,
  baseFields,
  buildOptions,
  buildPictureOptions,
  paramNum,
  pickTopic,
  type GeneratorArgs,
} from './shared.ts'

type VisualCore = {
  prompt: string
  correctAnswer: string
  explanation: string
  visualPredicate?: VisualPredicateId
  visual?: VisualSpec
  altText?: string
  /** Picture MC options (before shuffle). */
  pictureCorrect?: PictureOption
  pictureDistractors?: PictureOption[]
  /** Text MC distractors when not using pictures. */
  textDistractors?: string[]
}

export function generateGeometry(args: GeneratorArgs): GeneratedQuestion {
  const { config, difficulty, type, seed } = args
  if (config.generatorId !== 'geometry') {
    throw new Error(`geometry cannot handle generatorId "${config.generatorId}"`)
  }
  assertTypeSupported(config, type)

  const rng = createRng(seed)
  const advanced = difficulty === 'advanced'
  const topic = config.mathValleyTopics.includes('measurement-data')
    ? pickTopic(config, 'measurement-data')
    : pickTopic(config, 'geometry')
  const base = baseFields(args, topic)
  const params = config.difficultyParams[difficulty]

  let core: VisualCore
  switch (config.code) {
    case 'NY-1.G.1':
      core = rollG1(type, advanced, rng)
      break
    case 'NY-1.G.2':
      core = rollG2(type, advanced, rng, params)
      break
    case 'NY-1.G.3':
      core = rollG3(type, advanced, rng)
      break
    case 'NY-2.G.1':
      core = roll2G1(type, advanced, rng)
      break
    case 'NY-2.G.2':
      core = roll2G2(type, advanced, rng, params)
      break
    case 'NY-2.G.3':
      core = roll2G3(type, advanced, rng)
      break
    case 'NY-3.G.1':
      core = roll3G1(type, advanced, rng)
      break
    case 'NY-3.G.2':
      core = roll3G2(type, advanced, rng)
      break
    case 'NY-3.MD.5':
      core = roll3Md5(type, advanced, rng)
      break
    case 'NY-3.MD.6':
      core = roll3Md6(type, advanced, rng, params)
      break
    case 'NY-3.MD.7':
      core = roll3Md7(type, advanced, rng, params)
      break
    case 'NY-3.MD.8':
      core = roll3Md8(type, advanced, rng)
      break
    case 'NY-4.G.1':
      core = roll4G1(type, advanced, rng)
      break
    case 'NY-4.G.2':
      core = roll4G2(type, advanced, rng)
      break
    case 'NY-4.G.3':
      core = roll4G3(type, advanced, rng)
      break
    case 'NY-4.MD.3':
      core = roll4Md3(type, advanced, rng, params)
      break
    case 'NY-4.MD.5':
      core = roll4Md5(type, advanced, rng)
      break
    case 'NY-4.MD.6':
      core = roll4Md6(type, advanced, rng)
      break
    case 'NY-4.MD.7':
      core = roll4Md7(type, advanced, rng)
      break
    default:
      throw new Error(`geometry does not support "${config.code}"`)
  }

  if (type === 'multiple-choice') {
    if (core.pictureCorrect && core.pictureDistractors) {
      const built = buildPictureOptions(
        core.pictureCorrect,
        core.pictureDistractors,
        rng,
      )
      return {
        ...base,
        prompt: core.prompt,
        correctAnswer: built.correctAnswer,
        options: built.options,
        correctOptionIndex: built.correctOptionIndex,
        explanation: core.explanation,
        visualPredicate: core.visualPredicate,
        ...(core.visual
          ? { visual: core.visual, altText: core.altText ?? altTextFromVisual(core.visual) }
          : {}),
      }
    }

    const { options, correctOptionIndex } = buildOptions(
      core.correctAnswer,
      core.textDistractors ?? [],
      rng,
    )
    return {
      ...base,
      prompt: core.prompt,
      correctAnswer: core.correctAnswer,
      options,
      correctOptionIndex,
      explanation: core.explanation,
      ...(core.visual
        ? { visual: core.visual, altText: core.altText ?? altTextFromVisual(core.visual) }
        : {}),
    }
  }

  if (type === 'true-false') {
    return {
      ...base,
      prompt: core.prompt,
      correctAnswer: core.correctAnswer,
      explanation: core.explanation,
      visualPredicate: core.visualPredicate,
      ...(core.visual
        ? { visual: core.visual, altText: core.altText ?? altTextFromVisual(core.visual) }
        : {}),
    }
  }

  // short-answer
  return {
    ...base,
    prompt: core.prompt,
    correctAnswer: core.correctAnswer,
    explanation: core.explanation,
    visualPredicate: core.visualPredicate,
    ...(core.visual
      ? { visual: core.visual, altText: core.altText ?? altTextFromVisual(core.visual) }
      : {}),
  }
}

// ── NY-1.G.1 ─────────────────────────────────────────────────────────────

function rollG1(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    const pattern = rng.pick([
      'identify',
      'identify',
      'defining-attr',
    ] as const)
    if (pattern === 'defining-attr') {
      return g1DefiningAttribute(advanced, rng)
    }
    return g1IdentifyPicture(advanced, rng)
  }
  if (type === 'true-false') {
    return g1TrueFalse(advanced, rng)
  }
  return g1SideCount(advanced, rng)
}

function g1IdentifyPicture(advanced: boolean, rng: Rng): VisualCore {
  const targets = beginnerTargets()
  const target = rng.pick(targets)
  const predicate = predicateForShape(target)

  const correctVisual = makeShape(target, rng, { advanced })
  const correct: PictureOption = {
    id: target,
    altText: altTextFromVisual(correctVisual),
    visual: correctVisual,
  }

  const distractorNames = pickDistractors(target, advanced, rng, 3)
  const distractors: PictureOption[] = distractorNames.map((name) => {
    const visual = makeShape(name, rng, { advanced })
    return {
      id: name,
      altText: altTextFromVisual(visual),
      visual,
    }
  })

  const article = target === 'open-v' ? 'an' : 'a'
  return {
    prompt: `Which shape is ${article} ${shapeLabel(target)}?`,
    correctAnswer: target,
    explanation: definingExplanation(target),
    visualPredicate: predicate,
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g1DefiningAttribute(advanced: boolean, rng: Rng): VisualCore {
  const target = rng.pick(['triangle', 'square', 'rectangle'] as const)
  const visual = makeShape(target, rng, { advanced, fill: rng.pick(['#fca5a5', '#93c5fd', '#86efac']) })
  const correct =
    target === 'triangle'
      ? 'It has 3 sides'
      : target === 'square'
        ? 'It has 4 equal sides'
        : 'It has 4 sides and 4 square corners'

  const distractors = [
    'It is red or blue',
    'It is big',
    'It is tilted',
    'It is small',
  ].filter((d) => d !== correct)

  return {
    prompt: `Look at this ${shapeLabel(target)}. Which helps tell what shape it is?`,
    correctAnswer: correct,
    explanation: `${definingExplanation(target)} Color and size do not define the shape.`,
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: distractors,
  }
}

function g1TrueFalse(advanced: boolean, rng: Rng): VisualCore {
  const target = rng.pick(beginnerTargets())
  const wantTrue = rng.chance(0.55)
  let shown: ShapeName
  if (wantTrue) {
    // A square is also a rectangle; sometimes show that nested case.
    shown =
      target === 'rectangle' && rng.chance(0.25) ? 'square' : target
  } else {
    shown = rng.pick(pickDistractors(target, advanced, rng, 5))
  }

  const visual = makeShape(shown, rng, {
    advanced,
    fill: rng.pick(['#fca5a5', '#93c5fd', '#fcd34d', '#e2e8f0']),
  })
  const predicate = predicateForShape(target)
  const article = target === 'open-v' ? 'an' : 'a'

  return {
    prompt: `This shape is ${article} ${shapeLabel(target)}.`,
    correctAnswer: wantTrue ? 'true' : 'false',
    explanation: wantTrue
      ? definingExplanation(target)
      : `This picture is not ${article} ${shapeLabel(target)}. ${definingExplanation(target)}`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: predicate,
  }
}

function g1SideCount(advanced: boolean, rng: Rng): VisualCore {
  const pool: ShapeName[] = advanced
    ? [...beginnerTargets(), 'trapezoid', 'hexagon']
    : beginnerTargets()
  const name = rng.pick(pool)
  const visual = makeShape(name, rng, { advanced })
  const sides = sideCountForShape(name)

  return {
    prompt: 'How many sides does this shape have?',
    correctAnswer: String(sides),
    explanation:
      name === 'circle'
        ? 'A circle has no straight sides.'
        : `Count the straight sides: ${sides}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'count-sides',
  }
}

function predicateForShape(name: ShapeName): VisualPredicateId {
  switch (name) {
    case 'triangle':
      return 'is-closed-triangle'
    case 'square':
      return 'is-square'
    case 'rectangle':
      return 'is-rectangle'
    case 'circle':
      return 'is-circle'
    default:
      return 'is-simple-closed-polygon'
  }
}

function definingExplanation(name: ShapeName): string {
  switch (name) {
    case 'triangle':
      return 'A triangle has 3 sides and 3 corners.'
    case 'square':
      return 'A square has 4 equal sides and 4 square corners.'
    case 'rectangle':
      return 'A rectangle has 4 sides and 4 square corners.'
    case 'circle':
      return 'A circle is round and has no straight sides.'
    default:
      return `This is a ${shapeLabel(name)}.`
  }
}

function pickDistractors(
  target: ShapeName,
  advanced: boolean,
  rng: Rng,
  count: number,
): ShapeName[] {
  const pool: ShapeName[] = beginnerTargets().filter((n) => n !== target)
  // Avoid nested-category conflicts for picture MC with boolean predicates.
  if (target === 'rectangle') {
    // Square also satisfies is-rectangle — never use as distractor.
    const idx = pool.indexOf('square')
    if (idx >= 0) pool.splice(idx, 1)
  }
  // Ensure enough non-matching options (rectangle pool is otherwise short).
  if (!pool.includes('open-v')) pool.push('open-v')
  if (advanced) {
    for (const extra of advancedExtraDistractors()) {
      if (!pool.includes(extra)) pool.push(extra)
    }
  }
  return rng.shuffle(pool).slice(0, count)
}

// ── NY-1.G.2 ─────────────────────────────────────────────────────────────

function rollG2(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  params: Record<string, DifficultyParamValue>,
): VisualCore {
  void paramNum(params, 'maxPieces', advanced ? 3 : 2)

  if (type === 'multiple-choice') {
    return g2WhichComposite(advanced, rng)
  }
  if (type === 'true-false') {
    // G.2 registry may not include TF; keep a sensible fallback.
    return g2TrueFalse(advanced, rng)
  }
  return g2CountTriangles(advanced, rng)
}

function g2WhichComposite(advanced: boolean, rng: Rng): VisualCore {
  const pattern = rng.pick([
    'two-triangles',
    'forms-rectangle',
  ] as const)

  if (pattern === 'forms-rectangle') {
    const correctVisual = twoTriangleRectangle(rng, { advanced })
    const correct: PictureOption = {
      id: 'rect-2-tri',
      altText: altTextFromVisual(correctVisual),
      visual: correctVisual,
    }
    // Distractors must NOT tile a rectangle (twoSquares would also pass).
    const distractors: PictureOption[] = [
      optionFrom(singleTriangleComposite(rng), 'one-tri'),
      optionFrom(twoTrianglesApart(rng), 'apart'),
      optionFrom(
        advanced ? threeTriangleTrapezoid(rng) : twoSemicircleComposite(rng),
        'other',
      ),
    ]
    return {
      prompt: 'Which picture shows pieces that make a rectangle?',
      correctAnswer: 'rect-2-tri',
      explanation: 'Two triangles can fit together to make a rectangle.',
      visualPredicate: 'composite-forms-rectangle',
      pictureCorrect: correct,
      pictureDistractors: distractors,
    }
  }

  // which is made of exactly two triangles
  const correctVisual = twoTriangleRectangle(rng, { advanced })
  const correct: PictureOption = {
    id: 'two-tri',
    altText: altTextFromVisual(correctVisual),
    visual: correctVisual,
  }
  const distractors: PictureOption[] = [
    optionFrom(singleTriangleComposite(rng), 'one-tri'),
    optionFrom(twoSquaresComposite(rng), 'two-sq'),
    optionFrom(
      advanced ? threeTriangleTrapezoid(rng) : twoSemicircleComposite(rng),
      'other',
    ),
  ]
  return {
    prompt: 'Which shape is made of two triangles?',
    correctAnswer: 'two-tri',
    explanation: 'Count the triangle pieces: there are two.',
    visualPredicate: 'has-exactly-two-triangle-pieces',
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g2CountTriangles(advanced: boolean, rng: Rng): VisualCore {
  const useThree = advanced && rng.chance(0.4)
  const visual = useThree
    ? threeTriangleTrapezoid(rng)
    : twoTriangleRectangle(rng, { advanced })
  const count = useThree ? 3 : 2

  return {
    prompt: 'How many triangles make this shape?',
    correctAnswer: String(count),
    explanation: `Count the triangle pieces: ${count}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'count-triangle-pieces',
  }
}

function g2TrueFalse(advanced: boolean, rng: Rng): VisualCore {
  const isTwo = rng.chance(0.55)
  const visual = isTwo
    ? twoTriangleRectangle(rng, { advanced })
    : singleTriangleComposite(rng)
  return {
    prompt: 'This shape is made of two triangles.',
    correctAnswer: isTwo ? 'true' : 'false',
    explanation: isTwo
      ? 'There are two triangle pieces.'
      : 'This figure does not have two triangle pieces.',
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'has-exactly-two-triangle-pieces',
  }
}

function optionFrom(visual: VisualSpec, id: string): PictureOption {
  return { id, altText: altTextFromVisual(visual), visual }
}

// ── NY-1.G.3 ─────────────────────────────────────────────────────────────

function rollG3(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    const pattern = rng.pick([
      'which-halves',
      'which-fourths',
      'compare-size',
    ] as const)
    if (pattern === 'compare-size') return g3CompareSize(rng)
    if (pattern === 'which-fourths' && advanced) return g3WhichEqual(4, advanced, rng)
    if (pattern === 'which-fourths' && !advanced) return g3WhichEqual(2, advanced, rng)
    return g3WhichEqual(2, advanced, rng)
  }
  if (type === 'true-false') {
    return g3TrueFalse(advanced, rng)
  }
  return g3Short(advanced, rng)
}

function g3WhichEqual(
  parts: 2 | 4,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const shape = rng.pick(['circle', 'rectangle'] as const)
  const correctVisual = makePartition(rng, {
    shape,
    parts,
    equal: true,
    advanced,
  })
  const correct: PictureOption = {
    id: 'equal',
    altText: altTextFromVisual(correctVisual),
    visual: correctVisual,
  }

  const distractors: PictureOption[] = []
  // Unequal same part count
  const unequal = makePartition(rng, { shape, parts, equal: false, advanced })
  distractors.push({
    id: 'unequal',
    altText: altTextFromVisual(unequal),
    visual: unequal,
  })
  // Wrong part count
  const otherParts: 2 | 4 = parts === 2 ? 4 : 2
  if (advanced || parts === 2) {
    const wrongCount = makePartition(rng, {
      shape: shape === 'circle' ? 'rectangle' : 'circle',
      parts: otherParts,
      equal: true,
      advanced,
    })
    distractors.push({
      id: 'wrong-count',
      altText: altTextFromVisual(wrongCount),
      visual: wrongCount,
    })
  } else {
    const wrongCount = makePartition(rng, {
      shape,
      parts: 2,
      equal: true,
      advanced,
    })
    distractors.push({
      id: 'wrong-count',
      altText: altTextFromVisual(wrongCount),
      visual: wrongCount,
    })
  }
  // Another unequal or different shape
  const extra = makePartition(rng, {
    shape: shape === 'circle' ? 'rectangle' : 'circle',
    parts,
    equal: false,
    advanced,
  })
  distractors.push({
    id: 'extra',
    altText: altTextFromVisual(extra),
    visual: extra,
  })

  const word = parts === 2 ? 'halves' : 'fourths'
  return {
    prompt: `Which picture shows ${word}?`,
    correctAnswer: 'equal',
    explanation:
      parts === 2
        ? 'Halves are two equal shares.'
        : 'Fourths are four equal shares.',
    visualPredicate: parts === 2 ? 'is-equal-halves' : 'is-equal-fourths',
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g3CompareSize(_rng: Rng): VisualCore {
  return {
    prompt:
      'A circle is cut into equal shares. Which is bigger: one half or one fourth of the same circle?',
    correctAnswer: 'one half',
    explanation:
      'More equal shares make smaller pieces, so a half is bigger than a fourth.',
    textDistractors: ['one fourth', 'they are the same', 'one third'],
  }
}

function g3TrueFalse(advanced: boolean, rng: Rng): VisualCore {
  const parts: 2 | 4 = advanced && rng.chance(0.5) ? 4 : 2
  const equal = rng.chance(0.55)
  const shape = rng.pick(['circle', 'rectangle'] as const)
  const visual = makePartition(rng, { shape, parts, equal, advanced })
  const word = parts === 2 ? 'halves' : 'fourths'
  const predicate: VisualPredicateId =
    parts === 2 ? 'is-equal-halves' : 'is-equal-fourths'

  // correctAnswer must match predicate: predicate is true only when equal && parts match
  const actually = equal
  return {
    prompt: `This shape is split into ${word}.`,
    correctAnswer: actually ? 'true' : 'false',
    explanation: actually
      ? `Yes — ${word} are ${parts} equal shares.`
      : `No — the shares are not equal, so these are not ${word}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: predicate,
  }
}

function g3Short(advanced: boolean, rng: Rng): VisualCore {
  const pattern = rng.pick([
    'part-count',
    'fourths-make-whole',
  ] as const)

  if (pattern === 'fourths-make-whole') {
    const visual = makePartition(rng, {
      shape: rng.pick(['circle', 'rectangle']),
      parts: 4,
      equal: true,
      advanced,
    })
    return {
      prompt: 'How many fourths make one whole?',
      correctAnswer: '4',
      explanation: 'Four fourths make one whole.',
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'partition-part-count',
    }
  }

  const parts: 2 | 4 = !advanced ? 2 : rng.pick([2, 4] as const)
  const visual = makePartition(rng, {
    shape: rng.pick(['circle', 'rectangle']),
    parts,
    equal: true,
    advanced,
  })
  return {
    prompt: 'This shape is split into how many equal shares?',
    correctAnswer: String(parts),
    explanation: `Count the equal parts: ${parts}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'partition-part-count',
  }
}

// ── NY-2.G.1 — polygons vs non-polygons ──────────────────────────────────

function roll2G1(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    return rng.chance(0.5) ? g2WhichPolygon(advanced, rng) : g2WhichNotPolygon(advanced, rng)
  }
  if (type === 'true-false') {
    return g2IsPolygonTf(advanced, rng)
  }
  // short-answer not in registry; keep a safe fallback
  return g2IsPolygonTf(advanced, rng)
}

function polygonVisual(advanced: boolean, rng: Rng): VisualSpec {
  if (advanced && rng.chance(0.45)) return makeConcavePolygon(rng)
  const name = rng.pick(['triangle', 'square', 'rectangle', 'hexagon'] as const)
  return makeShape(name, rng, { advanced })
}

function nonPolygonVisual(advanced: boolean, rng: Rng): VisualSpec {
  if (advanced && rng.chance(0.5)) return makeNearClosedGap(rng)
  return rng.chance(0.5) ? makeCircleish(rng, advanced) : makeShape('open-v', rng)
}

function makeCircleish(rng: Rng, advanced: boolean): VisualSpec {
  return makeShape('circle', rng, { advanced })
}

function g2WhichPolygon(advanced: boolean, rng: Rng): VisualCore {
  const correctVisual = polygonVisual(advanced, rng)
  const correct: PictureOption = {
    id: 'polygon',
    altText: altTextFromVisual(correctVisual),
    visual: correctVisual,
  }
  // Three different non-polygon constructions so VisualSpecs stay distinct.
  const distractors: PictureOption[] = [
    optionFrom(makeShape('circle', rng, { advanced }), 'circle'),
    optionFrom(makeShape('open-v', rng), 'open-v'),
    optionFrom(
      advanced
        ? makeNearClosedGap(rng)
        : {
            kind: 'polygon',
            closed: false,
            points: [
              { x: 0, y: 40 },
              { x: 40, y: 0 },
              { x: 80, y: 40 },
              { x: 40, y: 80 },
            ],
          },
      'open-other',
    ),
  ]

  return {
    prompt: 'Which shape is a polygon?',
    correctAnswer: 'polygon',
    explanation:
      'A polygon is a closed shape with straight sides. Circles and open shapes are not polygons.',
    visualPredicate: 'is-simple-closed-polygon',
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g2WhichNotPolygon(advanced: boolean, rng: Rng): VisualCore {
  const correctVisual = nonPolygonVisual(advanced, rng)
  const correct: PictureOption = {
    id: 'not-polygon',
    altText: altTextFromVisual(correctVisual),
    visual: correctVisual,
  }
  const distractors: PictureOption[] = [
    optionFrom(makeShape('triangle', rng, { advanced }), 'tri'),
    optionFrom(makeShape('square', rng, { advanced }), 'sq'),
    optionFrom(
      advanced ? makeConcavePolygon(rng) : makeShape('rectangle', rng, { advanced }),
      'other-poly',
    ),
  ]
  return {
    prompt: 'Which shape is NOT a polygon?',
    correctAnswer: 'not-polygon',
    explanation:
      'Polygons are closed with straight sides. Circles and open figures are not polygons.',
    visualPredicate: 'is-non-polygon',
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g2IsPolygonTf(advanced: boolean, rng: Rng): VisualCore {
  const wantTrue = rng.chance(0.55)
  const visual = wantTrue
    ? polygonVisual(advanced, rng)
    : nonPolygonVisual(advanced, rng)
  return {
    prompt: 'This shape is a polygon.',
    correctAnswer: wantTrue ? 'true' : 'false',
    explanation: wantTrue
      ? 'It is closed and has only straight sides.'
      : 'Polygons must be closed with straight sides only.',
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'is-simple-closed-polygon',
  }
}

// ── NY-2.G.2 — rows and columns of unit squares ──────────────────────────

function roll2G2(
  type: QuestionType,
  advanced: boolean,
  rng: Rng,
  params: Record<string, DifficultyParamValue>,
): VisualCore {
  const maxRows = paramNum(params, 'maxRows', advanced ? 5 : 3)
  const maxCols = paramNum(params, 'maxCols', advanced ? 6 : 4)
  const rows = rng.int(2, maxRows)
  const cols = rng.int(2, maxCols)
  const total = rows * cols
  const visual = makeUnitSquareGrid(rows, cols)
  const altText = altTextFromVisual(visual)

  if (type === 'multiple-choice') {
    // Text options + prompt grid. No visualPredicate: count is numeric (MC needs boolean).
    const pattern = rng.pick(['count', 'rows-of'] as const)
    return {
      prompt:
        pattern === 'rows-of'
          ? `${rows} rows of ${cols} squares: how many squares in all?`
          : 'How many squares cover this rectangle?',
      correctAnswer: String(total),
      explanation: `Count the squares: ${rows} rows of ${cols} is ${total}.`,
      visual,
      altText,
      textDistractors: [
        String(rows + cols),
        String(Math.max(1, total - cols)),
        String(total + cols),
        String(rows * Math.max(1, cols - 1)),
        String(Math.max(rows, cols)),
      ],
    }
  }

  if (type === 'true-false') {
    // Boolean claim vs counted total (no numeric visualPredicate on T/F).
    const offsets = [1, 2, cols, -1, -cols].filter((n) => n !== 0)
    const claim = rng.chance(0.5) ? total : total + rng.pick(offsets)
    const actually = claim === total
    return {
      prompt: `This rectangle is covered by ${claim} squares.`,
      correctAnswer: actually ? 'true' : 'false',
      explanation: `There are ${rows} rows and ${cols} columns, so ${total} squares.`,
      visual,
      altText,
    }
  }

  return {
    prompt: rng.chance(0.5)
      ? 'How many squares cover this rectangle?'
      : `${rows} rows of ${cols} squares: how many?`,
    correctAnswer: String(total),
    explanation: `Count them: ${rows} rows of ${cols} is ${total}.`,
    visual,
    altText,
    visualPredicate: 'count-grid-cells',
  }
}

// ── NY-2.G.3 — halves, thirds, fourths (incl. different-looking equals) ─

function roll2G3(type: QuestionType, advanced: boolean, rng: Rng): VisualCore {
  if (type === 'multiple-choice') {
    const pattern = rng.pick(
      advanced
        ? (['thirds', 'halves', 'fourths', 'name-share'] as const)
        : (['halves', 'fourths', 'name-share'] as const),
    )
    if (pattern === 'name-share') return g2NameShare(advanced, rng)
    if (pattern === 'thirds') return g2WhichEqualParts(3, advanced, rng)
    if (pattern === 'fourths') return g2WhichEqualParts(4, advanced, rng)
    return g2WhichEqualParts(2, advanced, rng)
  }
  if (type === 'true-false') {
    return g2EqualSharesTf(advanced, rng)
  }
  return g2PartitionShort(advanced, rng)
}

function g2WhichEqualParts(
  parts: 2 | 3 | 4,
  advanced: boolean,
  rng: Rng,
): VisualCore {
  const shape = rng.pick(['circle', 'rectangle'] as const)
  const cut =
    parts === 2 && shape === 'rectangle' && advanced && rng.chance(0.5)
      ? ('diagonal' as const)
      : undefined
  const correctVisual = makePartition(rng, {
    shape,
    parts,
    equal: true,
    advanced,
    cut,
  })
  const correct: PictureOption = {
    id: 'equal',
    altText: altTextFromVisual(correctVisual),
    visual: correctVisual,
  }
  const word = parts === 2 ? 'halves' : parts === 3 ? 'thirds' : 'fourths'
  const predicate: VisualPredicateId =
    parts === 2
      ? 'is-equal-halves'
      : parts === 3
        ? 'is-equal-thirds'
        : 'is-equal-fourths'

  const otherParts = ([2, 3, 4] as const).filter((p) => p !== parts)
  const distractors: PictureOption[] = [
    optionFrom(
      makePartition(rng, { shape, parts, equal: false, advanced }),
      'unequal',
    ),
    optionFrom(
      makePartition(rng, {
        shape: shape === 'circle' ? 'rectangle' : 'circle',
        parts: otherParts[0]!,
        equal: true,
        advanced,
      }),
      'wrong-count',
    ),
    optionFrom(
      makePartition(rng, {
        shape,
        parts: otherParts[1] ?? otherParts[0]!,
        equal: false,
        advanced,
      }),
      'extra',
    ),
  ]

  return {
    prompt: `Which picture shows ${word}?`,
    correctAnswer: 'equal',
    explanation:
      parts === 2
        ? 'Halves are two equal shares.'
        : parts === 3
          ? 'Thirds are three equal shares.'
          : 'Fourths are four equal shares.',
    visualPredicate: predicate,
    pictureCorrect: correct,
    pictureDistractors: distractors,
  }
}

function g2NameShare(advanced: boolean, rng: Rng): VisualCore {
  const parts: 2 | 3 | 4 = advanced
    ? rng.pick([2, 3, 4] as const)
    : rng.pick([2, 4] as const)
  const visual = makePartition(rng, {
    shape: rng.pick(['circle', 'rectangle']),
    parts,
    equal: true,
    advanced,
  })
  const word =
    parts === 2 ? 'half' : parts === 3 ? 'third' : 'fourth'
  return {
    prompt: `This shape is split into ${parts} equal shares. Each share is a ___.`,
    correctAnswer: word,
    explanation: `Each of ${parts} equal shares is a ${word}.`,
    visual,
    altText: altTextFromVisual(visual),
    textDistractors: ['half', 'third', 'fourth', 'whole'].filter((w) => w !== word),
  }
}

function g2EqualSharesTf(advanced: boolean, rng: Rng): VisualCore {
  // Advanced: different-looking equal halves (diagonal) are still halves.
  if (advanced && rng.chance(0.4)) {
    const visual = makePartition(rng, {
      shape: 'rectangle',
      parts: 2,
      equal: true,
      advanced: true,
      cut: 'diagonal',
    })
    return {
      prompt: 'This shape is split into two equal shares (halves).',
      correctAnswer: 'true',
      explanation:
        'Equal shares can look different. These two triangles each cover half.',
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'is-equal-halves',
    }
  }

  const parts: 2 | 3 | 4 = advanced
    ? rng.pick([2, 3, 4] as const)
    : rng.pick([2, 4] as const)
  const equal = rng.chance(0.55)
  const shape = rng.pick(['circle', 'rectangle'] as const)
  const visual = makePartition(rng, { shape, parts, equal, advanced })
  const word = parts === 2 ? 'halves' : parts === 3 ? 'thirds' : 'fourths'
  const predicate: VisualPredicateId =
    parts === 2
      ? 'is-equal-halves'
      : parts === 3
        ? 'is-equal-thirds'
        : 'is-equal-fourths'

  return {
    prompt: `This shape is split into ${word}.`,
    correctAnswer: equal ? 'true' : 'false',
    explanation: equal
      ? `Yes — ${word} are ${parts} equal shares.`
      : `No — the shares are not equal, so these are not ${word}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: predicate,
  }
}

function g2PartitionShort(advanced: boolean, rng: Rng): VisualCore {
  const parts: 2 | 3 | 4 = !advanced
    ? rng.pick([2, 4] as const)
    : rng.pick([2, 3, 4] as const)
  const visual = makePartition(rng, {
    shape: rng.pick(['circle', 'rectangle']),
    parts,
    equal: true,
    advanced,
  })
  if (rng.chance(0.4) && parts === 4) {
    return {
      prompt: 'How many fourths make one whole?',
      correctAnswer: '4',
      explanation: 'Four fourths make one whole.',
      visual,
      altText: altTextFromVisual(visual),
      visualPredicate: 'partition-part-count',
    }
  }
  return {
    prompt: 'This shape is split into how many equal shares?',
    correctAnswer: String(parts),
    explanation: `Count the equal parts: ${parts}.`,
    visual,
    altText: altTextFromVisual(visual),
    visualPredicate: 'partition-part-count',
  }
}
