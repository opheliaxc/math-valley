import type { ReactNode } from 'react'
import { Fraction } from '../components/Fraction'

const MARKER_RE = /\[\[([^\]]+)\]\]/g
const SIMPLE_FRACTION_RE = /^(\d+)\s*\/\s*(\d+)$/
const MIXED_NUMBER_RE = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/
const PLAIN_FRACTION_RE = /^\d+\/\d+$/
const PLAIN_MIXED_RE = /^\d+\s+\d+\/\d+$/

/** Remove `[[3/4]]` wrapping so answer checks still see `3/4`. */
export function unwrapMathMarkers(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, '$1')
}

/** Turn `[[3/4]]` / `[[2 1/3]]` markers into stacked fraction components. */
export function renderMath(text: string): ReactNode {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(MARKER_RE)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }
    nodes.push(
      <MathMarker key={`math-${key}`} inner={match[1] ?? ''} raw={match[0]} />,
    )
    key += 1
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  if (nodes.length === 0) return text
  if (nodes.length === 1 && typeof nodes[0] === 'string') return nodes[0]
  return nodes
}

/**
 * Like renderMath, plus stacked display for a bare `3/4` or `2 1/3` answer
 * string. Does not scan for slashes inside ordinary sentences.
 */
export function renderMathDisplay(text: string): ReactNode {
  const trimmed = text.trim()
  if (PLAIN_FRACTION_RE.test(trimmed) || PLAIN_MIXED_RE.test(trimmed)) {
    return renderMath(`[[${trimmed}]]`)
  }
  return renderMath(text)
}

function MathMarker({ inner, raw }: { inner: string; raw: string }) {
  const mixed = inner.trim().match(MIXED_NUMBER_RE)
  if (mixed) {
    const whole = mixed[1]!
    const n = mixed[2]!
    const d = mixed[3]!
    return (
      <span
        className="mv-mixed-number"
        role="math"
        aria-label={`${whole} and ${n} over ${d}`}
      >
        <span aria-hidden="true">{whole}</span>
        <Fraction n={n} d={d} decorative />
      </span>
    )
  }

  const simple = inner.trim().match(SIMPLE_FRACTION_RE)
  if (simple) {
    return <Fraction n={simple[1]!} d={simple[2]!} />
  }

  return <>{raw}</>
}
