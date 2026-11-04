import type { MouseEvent } from 'react'
import { HeroValley } from '../art/HeroValley'
import { SectionWave } from '../art/SectionWave'
import { LinkButton } from '../components/Button'
import { landingCopy } from '../data/landingCopy'
import { ENTRY_PATH } from '../../routes'

function scrollToExplore(event: MouseEvent<HTMLAnchorElement>) {
  const href = '#explore'
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

export function Hero() {
  const copy = landingCopy.hero

  return (
    <section
      id={copy.id}
      className="mv-hero"
      aria-labelledby="landing-hero-heading"
    >
      <div className="mv-hero__inner">
        <div className="mv-hero__copy">
          <h1 id="landing-hero-heading" tabIndex={-1}>
            {copy.headline}
          </h1>
          <p className="mv-hero__supporting">{copy.supporting}</p>
          <div className="mv-hero__actions">
            <LinkButton variant="primary" href={ENTRY_PATH}>
              {copy.startLearning}
            </LinkButton>
            <LinkButton
              variant="secondary"
              href="#explore"
              onClick={scrollToExplore}
            >
              {copy.exploreCta}
            </LinkButton>
          </div>
          <p className="mv-hero__grades">{copy.gradesLine}</p>
        </div>

        <div className="mv-hero__art">
          <HeroValley className="mv-hero__svg" />
        </div>
      </div>

      <div className="mv-hero__wave" aria-hidden="true">
        <SectionWave fill="var(--mv-cream)" />
      </div>
    </section>
  )
}
