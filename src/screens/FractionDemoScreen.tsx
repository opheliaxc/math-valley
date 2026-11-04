import { useState } from 'react'
import { Fraction } from '../components/Fraction'
import { FractionAnswer } from '../components/FractionAnswer'
import { renderMath } from '../utils/renderMath'

const SIZES = [
  { label: 'Small (1rem)', fontSize: '1rem' },
  { label: 'Body (1.25rem)', fontSize: '1.25rem' },
  { label: 'Large (2rem)', fontSize: '2rem' },
  { label: 'Huge (2.75rem)', fontSize: '2.75rem' },
] as const

const MARKED_EXAMPLES = [
  '[[1/2]]',
  '[[3/4]]',
  '[[7/8]]',
  '[[12/100]]',
  '[[2 1/3]]',
  'A pizza is [[3/4]] gone, and [[2 1/3]] pies are left.',
] as const

export function FractionDemoScreen() {
  const [submitted, setSubmitted] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-amber-300 text-sm tracking-widest uppercase">
            Display demo
          </p>
          <h1 className="text-3xl font-bold">Stacked fractions</h1>
          <p className="text-slate-400">
            Not wired into questions yet. Open this page at{' '}
            <code className="text-amber-200">#fraction-demo</code>.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
          <h2 className="text-lg font-semibold">Direct component</h2>
          {SIZES.map((size) => (
            <p key={size.label} style={{ fontSize: size.fontSize }}>
              <span className="mr-3 text-slate-400" style={{ fontSize: '0.85rem' }}>
                {size.label}
              </span>
              <Fraction n={1} d={2} />{' '}
              <Fraction n={3} d={4} />{' '}
              <Fraction n={7} d={8} />{' '}
              <Fraction n={12} d={100} />{' '}
              <span className="mv-mixed-number">
                2
                <Fraction n={1} d={3} />
              </span>
            </p>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
          <h2 className="text-lg font-semibold">renderMath markers</h2>
          {MARKED_EXAMPLES.map((example) => (
            <div key={example} className="space-y-1">
              <p className="text-xs text-slate-500 font-mono">{example}</p>
              <p className="text-xl leading-relaxed">{renderMath(example)}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
          <h2 className="text-lg font-semibold">Short-answer entry</h2>
          <p className="text-slate-400 text-sm">
            Type a numerator and denominator, then Check. Whole numbers: fill
            the top and leave the bottom blank.
          </p>
          <FractionAnswer onSubmit={(answer) => setSubmitted(answer)} />
          <h3 className="text-base font-semibold pt-2">Mixed-number entry</h3>
          <p className="text-slate-400 text-sm">
            For NY-4.NF.3 mixed prompts: whole + fraction converts to an
            improper fraction before checking (e.g. 3 and 1/3 → 10/3).
          </p>
          <FractionAnswer
            allowMixed
            onSubmit={(answer) => setSubmitted(answer)}
          />
          {submitted && (
            <p className="text-emerald-300">
              Would send to the checker: <code>{submitted}</code>
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
