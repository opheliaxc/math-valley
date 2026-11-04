import './Fraction.css'

type FractionProps = {
  n: number | string
  d: number | string
  /** Hide from screen readers when a parent already speaks the full value. */
  decorative?: boolean
}

export function Fraction({ n, d, decorative = false }: FractionProps) {
  return (
    <span
      className="mv-fraction"
      role={decorative ? undefined : 'math'}
      aria-label={decorative ? undefined : `${n} over ${d}`}
      aria-hidden={decorative ? true : undefined}
    >
      <span className="mv-fraction-num">{n}</span>
      <span className="mv-fraction-den">{d}</span>
    </span>
  )
}
