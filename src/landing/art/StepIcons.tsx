/** How It Works step icons (Section 5.2 A5). Decorative; token colors only. */

type StepIconProps = {
  className?: string
}

export function ExplorerIcon({ className }: StepIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" fill="var(--mv-sun)" opacity="0.35" />
      <circle cx="32" cy="24" r="10" fill="var(--mv-lavender)" />
      <ellipse cx="32" cy="44" rx="14" ry="10" fill="var(--mv-violet)" />
      <circle cx="28" cy="22" r="1.5" fill="var(--mv-ink)" />
      <circle cx="36" cy="22" r="1.5" fill="var(--mv-ink)" />
      <path
        d="M28 27c1.5 1.5 4.5 1.5 6 0"
        stroke="var(--mv-coral)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function IslandStepIcon({ className }: StepIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" fill="var(--mv-sky)" opacity="0.45" />
      <ellipse cx="32" cy="40" rx="20" ry="10" fill="var(--mv-lavender)" />
      <ellipse
        cx="32"
        cy="36"
        rx="14"
        ry="6"
        fill="var(--mv-cream)"
        opacity="0.6"
      />
      <ellipse cx="32" cy="46" rx="12" ry="4" fill="var(--mv-grass)" />
      <path
        d="M32 22c0 0 6 8 0 14c-6-6 0-14 0-14z"
        fill="var(--mv-violet)"
      />
    </svg>
  )
}

export function PracticeIcon({ className }: StepIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" fill="var(--mv-gold)" opacity="0.35" />
      <rect
        x="18"
        y="16"
        width="28"
        height="34"
        rx="4"
        fill="var(--mv-cream)"
        stroke="var(--mv-violet)"
        strokeWidth="2"
      />
      <path
        d="M24 26h16M24 34h16M24 42h10"
        stroke="var(--mv-sky-deep)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 44l8-8 3 3-8 8-4 1z"
        fill="var(--mv-coral)"
      />
    </svg>
  )
}

export function UnlockIcon({ className }: StepIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" fill="var(--mv-lavender)" opacity="0.4" />
      <path
        d="M20 30h24v18a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V30z"
        fill="var(--mv-violet)"
      />
      <path
        d="M26 30v-6a6 6 0 0 1 12 0"
        stroke="var(--mv-gold)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="40" r="3" fill="var(--mv-sun)" />
      <path
        d="M32 43v5"
        stroke="var(--mv-sun)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
