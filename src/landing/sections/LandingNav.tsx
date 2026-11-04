import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { CloseIcon, LunaraHeadIcon, MenuIcon } from '../art/Icons'
import { LinkButton } from '../components/Button'
import { landingCopy } from '../data/landingCopy'
import { ENTRY_PATH, LANDING_PATH } from '../../routes'

const NAV_LINKS = [
  { href: '#explore', labelKey: 'explore' as const },
  { href: '#how-it-works', labelKey: 'howItWorks' as const },
  { href: '#explorers', labelKey: 'explorers' as const },
]

function focusSectionHeading(hash: string) {
  const id = hash.replace(/^#/, '')
  if (!id) return
  const section = document.getElementById(id)
  if (!section) return
  const heading = section.querySelector('h1, h2, h3')
  if (heading instanceof HTMLElement) {
    if (!heading.hasAttribute('tabindex')) {
      heading.tabIndex = -1
    }
    heading.focus({ preventScroll: true })
  }
}

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
  focusSectionHeading(href)
}

export function LandingNav() {
  const copy = landingCopy.nav
  const menuId = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    function onResize() {
      if (window.matchMedia('(min-width: 768px)').matches) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [menuOpen])

  function closeMenuAfterNav(href: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      handleInPageNav(event, href)
      setMenuOpen(false)
    }
  }

  function handleSkipToMain(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById('main')
    if (!(main instanceof HTMLElement)) return
    event.preventDefault()
    main.focus({ preventScroll: true })
    main.scrollIntoView({ block: 'start' })
    history.pushState(null, '', '#main')
  }

  return (
    <>
      <a className="mv-skip-link" href="#main" onClick={handleSkipToMain}>
        {copy.skipToMain}
      </a>

      <header className={`mv-nav${scrolled ? ' mv-nav--scrolled' : ''}`}>
        <div className="mv-nav__inner">
          <a className="mv-nav__brand" href={LANDING_PATH}>
            <LunaraHeadIcon className="mv-nav__brand-icon" />
            <span className="mv-nav__wordmark">{copy.wordmark}</span>
          </a>

          <nav className="mv-nav__desktop" aria-label="Main">
            <ul className="mv-nav__list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    className="mv-nav__link"
                    href={link.href}
                    onClick={(event) => handleInPageNav(event, link.href)}
                  >
                    {copy[link.labelKey]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mv-nav__actions">
            <LinkButton variant="nav" href={ENTRY_PATH}>
              {copy.logIn}
            </LinkButton>

            <button
              ref={menuButtonRef}
              type="button"
              className="mv-nav__menu-btn"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <CloseIcon className="mv-nav__menu-icon" />
              ) : (
                <MenuIcon className="mv-nav__menu-icon" />
              )}
              <span>{copy.menu}</span>
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className={`mv-nav__panel${menuOpen ? ' mv-nav__panel--open' : ''}`}
          hidden={!menuOpen}
        >
          <nav aria-label="Main">
            <ul className="mv-nav__panel-list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    className="mv-nav__panel-link"
                    href={link.href}
                    onClick={closeMenuAfterNav(link.href)}
                  >
                    {copy[link.labelKey]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  )
}
