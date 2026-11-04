import type { MouseEvent } from 'react'
import { LunaraHeadIcon } from '../art/Icons'
import { landingCopy } from '../data/landingCopy'
import { useLandingMotion } from '../motion/useLandingMotion'
import { ENTRY_PATH, LANDING_PATH } from '../../routes'

const FOOTER_LINKS = [
  { href: '#explore', labelKey: 'explore' as const },
  { href: '#how-it-works', labelKey: 'howItWorks' as const },
  { href: '#explorers', labelKey: 'explorers' as const },
]

function handleInPageNav(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (!href.startsWith('#')) return
  const target = document.querySelector(href)
  if (!(target instanceof HTMLElement)) return
  event.preventDefault()
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  history.pushState(null, '', href)
  const heading = target.querySelector('h1, h2, h3')
  if (heading instanceof HTMLElement) {
    if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }
}

export function LandingFooter() {
  const copy = landingCopy
  const year = new Date().getFullYear()
  const { paused, togglePaused, reduce } = useLandingMotion()

  return (
    <footer className="mv-footer">
      <div className="mv-footer__inner">
        <a className="mv-footer__brand" href={LANDING_PATH}>
          <LunaraHeadIcon className="mv-footer__brand-icon" />
          <span className="mv-footer__wordmark">{copy.footer.wordmark}</span>
        </a>

        <nav className="mv-footer__nav" aria-label="Footer">
          <ul className="mv-footer__list">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  className="mv-footer__link"
                  href={link.href}
                  onClick={(event) => handleInPageNav(event, link.href)}
                >
                  {copy.nav[link.labelKey]}
                </a>
              </li>
            ))}
            <li>
              <a className="mv-footer__link" href={ENTRY_PATH}>
                {copy.footer.logIn}
              </a>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="mv-footer__pause"
          aria-pressed={reduce ? true : paused}
          disabled={reduce}
          aria-label={
            reduce
              ? 'Pause animations (already reduced by your system settings)'
              : copy.footer.pauseAnimations
          }
          title={
            reduce
              ? 'Animations already reduced by your system settings'
              : undefined
          }
          onClick={togglePaused}
        >
          {copy.footer.pauseAnimations}
        </button>

        <p className="mv-footer__copy">{copy.footer.copyright(year)}</p>
      </div>
    </footer>
  )
}
