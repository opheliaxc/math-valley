/** Decorative SVG primitives (Section 5.2 A4). Use inside a parent <svg>. Token colors only. */

type DecorProps = {
  className?: string
}

export function Star({ className }: DecorProps) {
  return (
    <g className={className} aria-hidden="true">
      <path
        fill="var(--mv-sun)"
        d="M12 2.5l2.4 7.2H22l-6 4.4 2.3 7.1L12 16.8 5.7 21.2 8 14.1 2 9.7h7.6L12 2.5z"
      />
      <path
        fill="var(--mv-cream)"
        opacity="0.55"
        d="M12 5.2l1.2 3.6H17l-3 2.2 1.1 3.5L12 12.4 8.9 14.5 10 11 7 8.8h3.8L12 5.2z"
      />
    </g>
  )
}

export function Cloud({ className }: DecorProps) {
  return (
    <g className={className} aria-hidden="true">
      <ellipse cx="28" cy="18" rx="18" ry="10" fill="var(--mv-cream)" />
      <ellipse cx="40" cy="16" rx="14" ry="9" fill="var(--mv-cream)" />
      <ellipse cx="18" cy="16" rx="10" ry="7" fill="var(--mv-cream)" />
      <ellipse
        cx="30"
        cy="14"
        rx="10"
        ry="5"
        fill="var(--mv-cream)"
        opacity="0.7"
      />
    </g>
  )
}

export function Flower({ className }: DecorProps) {
  return (
    <g className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3" fill="var(--mv-coral)" />
      <circle cx="8" cy="12" r="3" fill="var(--mv-coral)" />
      <circle cx="16" cy="12" r="3" fill="var(--mv-coral)" />
      <circle cx="12" cy="16" r="3" fill="var(--mv-coral)" />
      <circle cx="12" cy="12" r="2.2" fill="var(--mv-sun)" />
    </g>
  )
}

export function StepStone({ className }: DecorProps) {
  return (
    <g className={className} aria-hidden="true">
      <ellipse cx="16" cy="9" rx="14" ry="5.5" fill="var(--mv-gold)" />
      <ellipse
        cx="16"
        cy="7.5"
        rx="11"
        ry="3.5"
        fill="var(--mv-sun)"
        opacity="0.85"
      />
    </g>
  )
}

export type MathSymbolKind = '+' | '−' | '×' | '÷'

export function MathSymbol({
  kind,
  className,
}: DecorProps & { kind: MathSymbolKind }) {
  return (
    <g className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--mv-sun)" opacity="0.9" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="var(--mv-ink)"
        fontFamily="system-ui, sans-serif"
      >
        {kind}
      </text>
    </g>
  )
}

export function Sparkle({ className }: DecorProps) {
  return (
    <g className={className} aria-hidden="true">
      <path
        fill="var(--mv-gold)"
        d="M8 1l1.2 4.2L13.5 6.5 9.2 7.8 8 12 6.8 7.8 2.5 6.5l4.3-1.3L8 1z"
      />
    </g>
  )
}
