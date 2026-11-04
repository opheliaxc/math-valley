import { useEffect, useState, type KeyboardEvent } from 'react'
import type { Grade } from '../../data/profile'
import { GradePicker } from '../components/GradePicker'
import { IslandCard } from '../components/IslandCard'
import { landingCopy } from '../data/landingCopy'
import { useLandingIslands } from '../data/useLandingIslands'
import { ScrollReveal } from '../motion/AmbientMotion'

/** Mobile-only horizontal island scroll (Section 8: below 640px). */
const ISLAND_SCROLL_MQ = '(max-width: 639px)'

export function ExploreValley() {
  const copy = landingCopy.explore
  const [grade, setGrade] = useState<Grade>(1)
  const islands = useLandingIslands(grade)
  const [scrollLayout, setScrollLayout] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(ISLAND_SCROLL_MQ).matches
      : true,
  )

  useEffect(() => {
    const mq = window.matchMedia(ISLAND_SCROLL_MQ)
    const sync = () => setScrollLayout(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  function onIslandListKeyDown(event: KeyboardEvent<HTMLOListElement>) {
    if (!scrollLayout) return
    const el = event.currentTarget
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'
    const step = Math.min(240, el.clientWidth * 0.8)
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      el.scrollBy({ left: step, behavior })
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      el.scrollBy({ left: -step, behavior })
    }
  }

  return (
    <section
      id={copy.id}
      className="mv-explore"
      aria-labelledby="landing-explore-heading"
    >
      <ScrollReveal className="mv-explore__inner">
        <h2 id="landing-explore-heading" tabIndex={-1}>
          {copy.heading}
        </h2>
        <p className="mv-explore__intro">{copy.intro}</p>

        <GradePicker value={grade} onChange={setGrade} />

        <div className="mv-explore__map-wrap">
          {scrollLayout ? (
            <p className="mv-explore__scroll-hint" id="island-list-hint">
              Swipe or use arrow keys to see every island
            </p>
          ) : null}
          <ol
            className="mv-explore__islands"
            tabIndex={scrollLayout ? 0 : undefined}
            aria-label={`Islands for grade ${grade}`}
            aria-describedby={scrollLayout ? 'island-list-hint' : undefined}
            onKeyDown={onIslandListKeyDown}
          >
            {islands.map((island) => (
              <IslandCard key={`${grade}-${island.id}`} island={island} />
            ))}
          </ol>
        </div>

        <p className="mv-explore__note">{copy.pathNote}</p>
      </ScrollReveal>
    </section>
  )
}
