import { useState } from 'react'
import type {
  GeneratedQuestion,
  VisualSpec,
} from '../../question-generator/src/types.ts'
import { QuestionAnswerArea } from '../components/QuestionAnswerArea'
import { checkGeneratedAnswer } from '../data/practiceSession.ts'
import {
  DUMMY_PICTURE_MC,
  DUMMY_PICTURE_SHORT,
  DUMMY_PICTURE_TRUE_FALSE,
} from '../visuals/dummyVisualQuestions'
import { renderMathDisplay } from '../utils/renderMath'
import { renderVisual } from '../visuals/renderVisual'

const SIZES = [80, 140, 220] as const
const ROTATIONS = [0, 45, 90] as const

type DemoSample = {
  title: string
  note: string
  altText: string
  spec: VisualSpec
}

const SAMPLES: DemoSample[] = [
  {
    title: 'polygon',
    note: 'Closed triangle (also try open polyline below via closed:false in code).',
    altText: 'a triangle',
    spec: {
      kind: 'polygon',
      points: [
        { x: 0, y: 80 },
        { x: 50, y: 0 },
        { x: 100, y: 80 },
      ],
    },
  },
  {
    title: 'polygon (open)',
    note: 'Open figure — gap is visible (non-polygon distractor style).',
    altText: 'an open three-sided figure',
    spec: {
      kind: 'polygon',
      closed: false,
      points: [
        { x: 0, y: 80 },
        { x: 50, y: 0 },
        { x: 100, y: 80 },
      ],
    },
  },
  {
    title: 'circle',
    note: 'Filled circle with stroke.',
    altText: 'a circle',
    spec: { kind: 'circle', cx: 0, cy: 0, r: 50 },
  },
  {
    title: 'arc',
    note: 'Circular arc from 20° to 140°.',
    altText: 'a circular arc',
    spec: {
      kind: 'arc',
      cx: 0,
      cy: 0,
      r: 55,
      startDeg: 20,
      endDeg: 140,
    },
  },
  {
    title: 'grid',
    note: '3×4 unit grid with some shaded cells.',
    altText: 'a grid of 3 rows and 4 columns with some squares shaded',
    spec: {
      kind: 'grid',
      rows: 3,
      cols: 4,
      shaded: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ],
    },
  },
  {
    title: 'lines',
    note: 'Segment, ray, and line with arrows.',
    altText: 'a segment, a ray, and a line',
    spec: {
      kind: 'lines',
      items: [
        {
          type: 'segment',
          a: { x: 0, y: 0 },
          b: { x: 60, y: 0 },
          label: 'AB',
        },
        {
          type: 'ray',
          a: { x: 0, y: 40 },
          b: { x: 50, y: 40 },
          label: 'ray',
        },
        {
          type: 'line',
          a: { x: 10, y: 80 },
          b: { x: 50, y: 80 },
          label: 'line',
        },
      ],
    },
  },
  {
    title: 'angle',
    note: 'Two rays with an arc mark.',
    altText: 'an angle formed by two rays',
    spec: {
      kind: 'angle',
      vertex: { x: 0, y: 0 },
      from: { x: 70, y: 0 },
      to: { x: 40, y: -55 },
      showArc: true,
    },
  },
  {
    title: 'protractor-angle',
    note: 'Protractor with a 55° ray to read.',
    altText: 'a protractor showing an angle of 55 degrees',
    spec: {
      kind: 'protractor-angle',
      vertex: { x: 0, y: 0 },
      from: { x: 80, y: 0 },
      to: { x: 45, y: -65 },
      measureDeg: 55,
    },
  },
  {
    title: 'partitioned-shape (circle)',
    note: 'Equal fourths; one part shaded.',
    altText: 'a circle split into four equal parts with one part shaded',
    spec: {
      kind: 'partitioned-shape',
      shape: 'circle',
      parts: 4,
      equal: true,
      r: 50,
      shadedParts: [0],
    },
  },
  {
    title: 'partitioned-shape (rectangle)',
    note: 'Unequal strips (distractor style).',
    altText: 'a rectangle split into three unequal parts',
    spec: {
      kind: 'partitioned-shape',
      shape: 'rectangle',
      parts: 3,
      equal: false,
      width: 120,
      height: 70,
    },
  },
  {
    title: 'rect-composite',
    note: 'L-shape from two rectangles.',
    altText: 'an L-shaped figure made of two rectangles',
    spec: {
      kind: 'rect-composite',
      rects: [
        { x: 0, y: 0, w: 80, h: 40, label: 'A' },
        { x: 0, y: 40, w: 40, h: 40, label: 'B' },
      ],
    },
  },
  {
    title: 'symmetry-figure',
    note: 'Isosceles triangle with a dashed line of symmetry.',
    altText: 'a triangle with a dashed line of symmetry',
    spec: {
      kind: 'symmetry-figure',
      points: [
        { x: 0, y: 80 },
        { x: 40, y: 0 },
        { x: 80, y: 80 },
      ],
      axis: { a: { x: 40, y: -5 }, b: { x: 40, y: 85 } },
      showAxis: true,
    },
  },
]

function DummyQuestionCard({
  title,
  question,
}: {
  title: string
  question: GeneratedQuestion
}) {
  const [last, setLast] = useState<string | null>(null)
  const correct =
    last === null ? null : checkGeneratedAnswer(question, last)

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-slate-400 text-sm">
          Dummy question — taps submit the option id (or typed answer). Checker
          uses the same path as live sessions.
        </p>
      </div>
      <p className="text-xl font-semibold leading-relaxed">
        {renderMathDisplay(question.prompt)}
      </p>
      {question.visual
        ? renderVisual(question.visual, {
            altText: question.altText,
            size: 180,
          })
        : null}
      <QuestionAnswerArea
        question={question}
        onSubmit={(answer) => setLast(answer)}
      />
      {last !== null && (
        <p className={correct ? 'text-emerald-300' : 'text-rose-300'}>
          Submitted <code className="text-amber-200">{last}</code>
          {correct ? ' — correct' : ' — not the answer key'}
        </p>
      )}
    </section>
  )
}

export function VisualDemoScreen() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-2">
          <p className="text-amber-300 text-sm tracking-widest uppercase">
            Display demo
          </p>
          <h1 className="text-3xl font-bold">Geometry visuals</h1>
          <p className="text-slate-400">
            SVG primitives for Phase 0. Open at{' '}
            <code className="text-amber-200">#visual-demo</code>. Not wired into
            live standards yet.
          </p>
        </header>

        <header className="space-y-1 pt-2">
          <h2 className="text-2xl font-bold">Picture answer demos</h2>
          <p className="text-slate-400 text-sm">
            Try these on a phone-width window and a tablet-width window. Picture
            options should be large tap targets.
          </p>
        </header>

        <DummyQuestionCard
          title="Multiple choice — picture options"
          question={DUMMY_PICTURE_MC}
        />
        <DummyQuestionCard
          title="True / false — picture with prompt"
          question={DUMMY_PICTURE_TRUE_FALSE}
        />
        <DummyQuestionCard
          title="Short answer — picture with prompt"
          question={DUMMY_PICTURE_SHORT}
        />

        <header className="space-y-1 pt-4">
          <h2 className="text-2xl font-bold">SVG primitives</h2>
          <p className="text-slate-400 text-sm">
            Each kind at several sizes and rotations.
          </p>
        </header>

        {SAMPLES.map((sample) => (
          <section
            key={sample.title}
            className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-4"
          >
            <div>
              <h2 className="text-lg font-semibold font-mono">{sample.title}</h2>
              <p className="text-slate-400 text-sm">{sample.note}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                Sizes
              </p>
              <div className="flex flex-wrap items-end gap-4">
                {SIZES.map((size) => (
                  <div key={size} className="space-y-1">
                    <p className="text-xs text-slate-500">{size}px</p>
                    {renderVisual(sample.spec, {
                      altText: sample.altText,
                      size,
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                Rotations (140px)
              </p>
              <div className="flex flex-wrap items-end gap-4">
                {ROTATIONS.map((deg) => (
                  <div key={deg} className="space-y-1">
                    <p className="text-xs text-slate-500">{deg}°</p>
                    {renderVisual(sample.spec, {
                      altText: `${sample.altText}, rotated ${deg} degrees`,
                      size: 140,
                      rotationDeg: deg,
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
