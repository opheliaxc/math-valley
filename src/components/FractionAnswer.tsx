import { useState } from 'react'
import type { GeneratedQuestion } from '../../question-generator/src/types.ts'
import './FractionAnswer.css'

type FractionAnswerProps = {
  disabled?: boolean
  /** Show a whole-number box for mixed-number entry (converted to improper). */
  allowMixed?: boolean
  onSubmit: (answer: string) => void
}

const FRACTION_ANSWER_RE = /^\d+\/\d+$/
const WHOLE_ANSWER_RE = /^\d+$/
const DECIMAL_ANSWER_RE = /^\d+\.\d+$/
const MIXED_MARKER_RE = /\[\[[\d]+\s+\d+\/\d+\]\]/

/** Stacked fraction entry for NF short-answer (not decimals). */
export function isFractionShortAnswer(question: GeneratedQuestion): boolean {
  if (question.type !== 'short-answer') return false
  if (!/\.NF\./.test(question.standard)) return false
  const ans = question.correctAnswer.trim()
  if (DECIMAL_ANSWER_RE.test(ans)) return false
  return FRACTION_ANSWER_RE.test(ans) || WHOLE_ANSWER_RE.test(ans)
}

/** NY-4.NF.3 mixed prompts (and any marked mixed numbers) get a whole box. */
export function allowsMixedAnswerEntry(question: GeneratedQuestion): boolean {
  return MIXED_MARKER_RE.test(question.prompt)
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function FractionAnswer({
  disabled = false,
  allowMixed = false,
  onSubmit,
}: FractionAnswerProps) {
  const [whole, setWhole] = useState('')
  const [numerator, setNumerator] = useState('')
  const [denominator, setDenominator] = useState('')

  function combinedAnswer(): string | null {
    const w = whole.trim()
    const n = numerator.trim()
    const d = denominator.trim()

    if (allowMixed && w !== '') {
      if (!/^\d+$/.test(w)) return null
      // Whole number only
      if (n === '' && d === '') return w
      // Mixed → improper fraction for the existing checker
      if (!/^\d+$/.test(n) || !/^\d+$/.test(d) || Number(d) === 0) return null
      const improper = Number(w) * Number(d) + Number(n)
      return `${improper}/${d}`
    }

    if (!/^\d+$/.test(n)) return null
    if (d === '') return n
    if (!/^\d+$/.test(d) || Number(d) === 0) return null
    return `${n}/${d}`
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (disabled) return
    const answer = combinedAnswer()
    if (!answer) return
    onSubmit(answer)
  }

  const ready = combinedAnswer() !== null

  const stack = (
    <div className="mv-fraction-entry-stack">
      <label>
        <span className="sr-only">Numerator</span>
        <input
          className="mv-fraction-entry-input mv-fraction-entry-num"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={numerator}
          disabled={disabled}
          onChange={(event) => setNumerator(digitsOnly(event.target.value))}
          aria-label="Numerator"
        />
      </label>
      <label>
        <span className="sr-only">Denominator</span>
        <input
          className="mv-fraction-entry-input mv-fraction-entry-den"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={denominator}
          disabled={disabled}
          onChange={(event) => setDenominator(digitsOnly(event.target.value))}
          aria-label="Denominator"
        />
      </label>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="mv-fraction-entry">
      {allowMixed ? (
        <div className="mv-fraction-entry-row">
          <label className="mv-fraction-entry-whole-wrap">
            <span className="sr-only">Whole number</span>
            <input
              className="mv-fraction-entry-input mv-fraction-entry-whole"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={whole}
              disabled={disabled}
              onChange={(event) => setWhole(digitsOnly(event.target.value))}
              aria-label="Whole number"
            />
          </label>
          {stack}
        </div>
      ) : (
        stack
      )}
      <p className="mv-fraction-entry-hint">
        {allowMixed
          ? 'Improper fraction: leave the whole blank. Mixed number: fill all three. Whole only: fill the left box.'
          : 'Leave the bottom blank for a whole number.'}
      </p>
      <button
        type="submit"
        className="mv-fraction-entry-submit"
        disabled={disabled || !ready}
      >
        Check answer
      </button>
    </form>
  )
}
