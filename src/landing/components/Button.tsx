import type { AnchorHTMLAttributes, ReactNode } from 'react'

export type LinkButtonVariant = 'primary' | 'secondary' | 'nav'

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant: LinkButtonVariant
  children: ReactNode
}

const variantClass: Record<LinkButtonVariant, string> = {
  primary: 'mv-btn mv-btn--primary',
  secondary: 'mv-btn mv-btn--secondary',
  nav: 'mv-btn mv-btn--nav',
}

/** Navigating actions are links styled as buttons (Section 9.1). */
export function LinkButton({
  variant,
  children,
  className,
  ...rest
}: LinkButtonProps) {
  const classes = [variantClass[variant], className].filter(Boolean).join(' ')
  return (
    <a className={classes} {...rest}>
      {children}
    </a>
  )
}
