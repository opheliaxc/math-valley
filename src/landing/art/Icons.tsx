/** Simple 24px-grid icons for the landing page (Section 5.2 A8). */

type IconProps = {
  className?: string
  title?: string
}

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
} as const

export function MenuIcon({ className, title }: IconProps) {
  return (
    <svg
      {...base}
      className={className}
      aria-hidden={title ? undefined : true}
      focusable="false"
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CloseIcon({ className, title }: IconProps) {
  return (
    <svg
      {...base}
      className={className}
      aria-hidden={title ? undefined : true}
      focusable="false"
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LockIcon({ className, title }: IconProps) {
  return (
    <svg
      {...base}
      className={className}
      aria-hidden={title ? undefined : true}
      focusable="false"
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Wordmark dragon head — matches the cute Lunara face. */
export function LunaraHeadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="26" r="16" fill="var(--mv-lavender)" />
      <circle cx="24" cy="27" r="12" fill="var(--mv-cream)" opacity="0.35" />
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
      <circle cx="18" cy="24" r="3.4" fill="var(--mv-cream)" />
      <circle cx="30" cy="24" r="3.4" fill="var(--mv-cream)" />
      <circle cx="18.5" cy="24.5" r="1.8" fill="var(--mv-ink)" />
      <circle cx="30.5" cy="24.5" r="1.8" fill="var(--mv-ink)" />
      <circle cx="13" cy="30" r="2.2" fill="var(--mv-coral)" opacity="0.55" />
      <circle cx="35" cy="30" r="2.2" fill="var(--mv-coral)" opacity="0.55" />
      <path
        d="M18 32c2.8 3.5 9 3.5 12 0"
        stroke="var(--mv-coral-deep)"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
