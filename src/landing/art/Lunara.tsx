/**
 * Landing-only cute dragon poses (Section 5.2 A2).
 * In-app emoji Lunara is unchanged.
 */

import type { ReactNode } from 'react'

export type LunaraPose = 'flying' | 'head' | 'cheering'

type LunaraProps = {
  pose?: LunaraPose
  className?: string
  labelled?: boolean
  nested?: boolean
  /** Tint for secondary dragon buddies in the hero. */
  tint?: 'lavender' | 'coral' | 'emerald'
}

const FILL: Record<NonNullable<LunaraProps['tint']>, string> = {
  lavender: 'var(--mv-lavender)',
  coral: 'var(--mv-coral)',
  emerald: 'var(--mv-emerald)',
}

function CheekBlush({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="2.2" fill="var(--mv-coral)" opacity="0.55" />
}

/** Chubby side-flying dragon — readable silhouette, big head, smile. */
function FlyingBody({ fill }: { fill: string }) {
  return (
    <g>
      {/* Far wing (behind) */}
      <path
        d="M38 34c14-16 28-10 30 2-10 4-20 10-30 14z"
        fill="var(--mv-violet)"
        opacity="0.55"
      />
      {/* Tail */}
      <path
        d="M18 48c-10 4-18 14-14 22 8-4 16-8 22-14"
        fill={fill}
      />
      <path
        d="M8 66c2 4 8 6 12 2-2-4-6-6-12-2z"
        fill="var(--mv-coral)"
      />
      {/* Belly / body */}
      <ellipse cx="42" cy="48" rx="22" ry="16" fill={fill} />
      <ellipse
        cx="40"
        cy="50"
        rx="14"
        ry="10"
        fill="var(--mv-cream)"
        opacity="0.9"
      />
      {/* Near wing (up) */}
      <path
        d="M36 36c18-22 40-18 44-2-14 2-28 12-42 16z"
        fill="var(--mv-violet)"
      />
      <path
        d="M38 34c14-16 30-12 34-2-12 1-24 10-34 13z"
        fill={fill}
        opacity="0.65"
      />
      {/* Head */}
      <circle cx="62" cy="30" r="16" fill={fill} />
      <circle
        cx="62"
        cy="31"
        r="12"
        fill="var(--mv-cream)"
        opacity="0.35"
      />
      {/* Snout */}
      <ellipse cx="74" cy="34" rx="7" ry="5.5" fill={fill} />
      <ellipse
        cx="75"
        cy="34.5"
        rx="4.5"
        ry="3.2"
        fill="var(--mv-cream)"
        opacity="0.75"
      />
      {/* Horns */}
      <path
        d="M54 18c-1-8 2-12 5-12 0 5-1 9-2 12"
        fill="var(--mv-violet)"
      />
      <path
        d="M66 16c1-8 5-11 8-10-1 5-3 9-4 12"
        fill="var(--mv-violet)"
      />
      <circle cx="59" cy="7" r="2.2" fill="var(--mv-sun)" />
      <circle cx="73" cy="7.5" r="2.2" fill="var(--mv-sun)" />
      {/* Ears */}
      <ellipse cx="50" cy="24" rx="4" ry="5" fill={fill} />
      <ellipse cx="70" cy="20" rx="3.5" ry="4.5" fill={fill} />
      {/* Eyes */}
      <circle cx="58" cy="28" r="3.2" fill="var(--mv-cream)" />
      <circle cx="68" cy="27" r="3.2" fill="var(--mv-cream)" />
      <circle cx="58.5" cy="28.5" r="1.7" fill="var(--mv-ink)" />
      <circle cx="68.5" cy="27.5" r="1.7" fill="var(--mv-ink)" />
      <circle cx="59.2" cy="27.8" r="0.55" fill="var(--mv-cream)" />
      <circle cx="69.2" cy="26.8" r="0.55" fill="var(--mv-cream)" />
      <CheekBlush cx={54} cy={34} />
      <CheekBlush cx={72} cy={32} />
      {/* Smile */}
      <path
        d="M58 36c2.5 3 8 3.2 11 0"
        stroke="var(--mv-coral-deep)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tiny feet */}
      <ellipse cx="32" cy="60" rx="4" ry="2.5" fill="var(--mv-coral)" />
      <ellipse cx="42" cy="62" rx="4" ry="2.5" fill="var(--mv-coral)" />
    </g>
  )
}

function HeadOnly({ fill }: { fill: string }) {
  return (
    <g>
      <circle cx="24" cy="26" r="16" fill={fill} />
      <circle cx="24" cy="27" r="12" fill="var(--mv-cream)" opacity="0.35" />
      <ellipse cx="24" cy="32" rx="10" ry="7" fill="var(--mv-cream)" opacity="0.55" />
      <path
        d="M14 14c-1-7 2-11 5-11 0 4-1 8-2 11"
        fill="var(--mv-violet)"
      />
      <path
        d="M28 13c1-7 5-10 8-9-1 4-3 8-4 11"
        fill="var(--mv-violet)"
      />
      <circle cx="19" cy="4.5" r="2.2" fill="var(--mv-sun)" />
      <circle cx="35" cy="5" r="2.2" fill="var(--mv-sun)" />
      <ellipse cx="12" cy="20" rx="4" ry="5" fill={fill} />
      <ellipse cx="36" cy="20" rx="4" ry="5" fill={fill} />
      <circle cx="18" cy="24" r="3.4" fill="var(--mv-cream)" />
      <circle cx="30" cy="24" r="3.4" fill="var(--mv-cream)" />
      <circle cx="18.5" cy="24.5" r="1.8" fill="var(--mv-ink)" />
      <circle cx="30.5" cy="24.5" r="1.8" fill="var(--mv-ink)" />
      <circle cx="19.3" cy="23.7" r="0.6" fill="var(--mv-cream)" />
      <circle cx="31.3" cy="23.7" r="0.6" fill="var(--mv-cream)" />
      <CheekBlush cx={13} cy={30} />
      <CheekBlush cx={35} cy={30} />
      <path
        d="M18 32c2.8 3.5 9 3.5 12 0"
        stroke="var(--mv-coral-deep)"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  )
}

function CheeringBody({ fill }: { fill: string }) {
  return (
    <g>
      <path
        d="M18 40c-10-14-4-26 6-28-2 8 0 16 6 22"
        fill="var(--mv-violet)"
      />
      <path
        d="M46 40c10-14 4-26-6-28 2 8 0 16-6 22"
        fill="var(--mv-violet)"
      />
      <ellipse cx="32" cy="48" rx="18" ry="14" fill={fill} />
      <ellipse
        cx="32"
        cy="50"
        rx="11"
        ry="8"
        fill="var(--mv-cream)"
        opacity="0.9"
      />
      <circle cx="32" cy="24" r="15" fill={fill} />
      <circle cx="32" cy="25" r="11" fill="var(--mv-cream)" opacity="0.35" />
      <path
        d="M24 12c-1-7 2-11 5-10 0 4-1 7-2 10"
        fill="var(--mv-violet)"
      />
      <path
        d="M36 12c1-7 5-10 8-9-1 4-3 7-4 10"
        fill="var(--mv-violet)"
      />
      <circle cx="29" cy="3.5" r="2" fill="var(--mv-sun)" />
      <circle cx="43" cy="4" r="2" fill="var(--mv-sun)" />
      <circle cx="26" cy="22" r="3.2" fill="var(--mv-cream)" />
      <circle cx="38" cy="22" r="3.2" fill="var(--mv-cream)" />
      <circle cx="26.5" cy="22.5" r="1.7" fill="var(--mv-ink)" />
      <circle cx="38.5" cy="22.5" r="1.7" fill="var(--mv-ink)" />
      <CheekBlush cx={21} cy={28} />
      <CheekBlush cx={43} cy={28} />
      <path
        d="M26 30c2.5 3.2 9 3.2 12 0"
        stroke="var(--mv-coral-deep)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="24" cy="60" rx="4" ry="2.5" fill="var(--mv-coral)" />
      <ellipse cx="40" cy="60" rx="4" ry="2.5" fill="var(--mv-coral)" />
    </g>
  )
}

const VIEW: Record<LunaraPose, { viewBox: string }> = {
  flying: { viewBox: '0 0 100 80' },
  head: { viewBox: '0 0 48 48' },
  cheering: { viewBox: '0 0 64 68' },
}

export function Lunara({
  pose = 'flying',
  className,
  labelled = false,
  nested = false,
  tint = 'lavender',
}: LunaraProps) {
  const fill = FILL[tint]
  const { viewBox } = VIEW[pose]

  let body: ReactNode
  if (pose === 'head') body = <HeadOnly fill={fill} />
  else if (pose === 'cheering') body = <CheeringBody fill={fill} />
  else body = <FlyingBody fill={fill} />

  if (nested) {
    return (
      <g className={className} aria-hidden="true">
        {body}
      </g>
    )
  }

  return (
    <svg
      className={className}
      viewBox={viewBox}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? 'Lunara the dragon' : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {body}
    </svg>
  )
}
