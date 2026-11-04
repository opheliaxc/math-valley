/** Soft wave divider between sections (Section 5.2 A6). */

type SectionWaveProps = {
  /** Fill color — pass a token, e.g. var(--mv-cream) */
  fill: string
  className?: string
  /** Flip vertically so the wave sits under a section as a bottom edge. */
  flip?: boolean
}

export function SectionWave({ fill, className, flip = false }: SectionWaveProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path
        fill={fill}
        d="M0 40c120 28 240 40 360 36 160-6 240-40 400-40s240 34 400 40c120 4 200-8 280-36V80H0V40z"
      />
    </svg>
  )
}
