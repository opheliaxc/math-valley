import type { TopicId } from '../../data/topics'

type IslandArtProps = {
  domainKey: TopicId
  open: boolean
  className?: string
}

/** Shared island base + domain landmark; open vs locked (Section 5.2 A3). */
export function IslandArt({ domainKey, open, className }: IslandArtProps) {
  const fill = open ? 'var(--mv-lavender)' : 'var(--mv-sky-deep)'
  const opacity = open ? 1 : 0.55

  return (
    <svg
      className={className}
      viewBox="0 0 120 88"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <ellipse cx="60" cy="58" rx="48" ry="18" fill={fill} />
      <ellipse
        cx="60"
        cy="52"
        rx="36"
        ry="12"
        fill="var(--mv-cream)"
        opacity={open ? 0.55 : 0.25}
      />
      <ellipse cx="60" cy="70" rx="28" ry="8" fill="var(--mv-grass)" />
      <Landmark domainKey={domainKey} open={open} />
      {!open ? (
        <g transform="translate(48 28)">
          <rect
            x="4"
            y="10"
            width="16"
            height="12"
            rx="2"
            fill="var(--mv-violet)"
          />
          <path
            d="M8 10V7a6 6 0 0 1 12 0v3"
            stroke="var(--mv-violet)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ) : null}
    </svg>
  )
}

function Landmark({
  domainKey,
  open,
}: {
  domainKey: TopicId
  open: boolean
}) {
  const accent = open ? 'var(--mv-violet)' : 'var(--mv-ink)'
  const warm = open ? 'var(--mv-sun)' : 'var(--mv-gold)'

  switch (domainKey) {
    case 'operations-algebraic-thinking':
      // Nest
      return (
        <g>
          <ellipse cx="60" cy="40" rx="16" ry="8" fill={warm} />
          <ellipse cx="60" cy="36" rx="10" ry="5" fill="var(--mv-coral)" />
        </g>
      )
    case 'number-operations-base-ten':
      // Vault / chest
      return (
        <g>
          <rect x="46" y="28" width="28" height="20" rx="3" fill={accent} />
          <rect x="50" y="32" width="20" height="6" rx="1" fill={warm} />
          <circle cx="60" cy="42" r="2.5" fill={warm} />
        </g>
      )
    case 'measurement-data':
      // Sundial
      return (
        <g>
          <circle cx="60" cy="38" r="12" fill={warm} />
          <circle cx="60" cy="38" r="8" fill="var(--mv-cream)" opacity="0.5" />
          <path
            d="M60 38 L60 28 M60 38 L68 42"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )
    case 'number-operations-fractions':
      // Waterfall
      return (
        <g>
          <path
            d="M52 22 Q60 40 52 52 Q60 40 68 52 Q60 40 68 22 Z"
            fill="var(--mv-sky)"
            opacity="0.9"
          />
          <ellipse cx="60" cy="52" rx="14" ry="5" fill="var(--mv-sky-deep)" />
        </g>
      )
    case 'geometry':
      // Forge / shapes
      return (
        <g>
          <polygon
            points="60,22 74,48 46,48"
            fill={accent}
          />
          <rect x="54" y="48" width="12" height="8" rx="1" fill={warm} />
        </g>
      )
    default:
      return null
  }
}
