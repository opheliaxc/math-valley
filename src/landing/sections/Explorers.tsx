import { SectionWave } from '../art/SectionWave'
import { landingCopy } from '../data/landingCopy'
import { ScrollReveal } from '../motion/AmbientMotion'

export function Explorers() {
  const copy = landingCopy.explorers

  return (
    <section
      id={copy.id}
      className="mv-explorers"
      aria-labelledby="landing-explorers-heading"
    >
      <div className="mv-explorers__wave" aria-hidden="true">
        <SectionWave fill="color-mix(in srgb, var(--mv-grass) 22%, var(--mv-cream))" />
      </div>

      <ScrollReveal className="mv-explorers__inner">
        <h2 id="landing-explorers-heading" tabIndex={-1}>
          {copy.heading}
        </h2>
        <p className="mv-explorers__intro">{copy.intro}</p>
        <p className="mv-explorers__standards">{copy.standardsLine}</p>

        <div className="mv-explorers__cards">
          <article className="mv-card mv-explorers__card">
            <h3>{copy.forExplorersTitle}</h3>
            <p>{copy.forExplorersBody}</p>
          </article>
          <article className="mv-card mv-explorers__card">
            <h3>{copy.forGrownUpsTitle}</h3>
            <p>{copy.forGrownUpsBody}</p>
          </article>
        </div>
      </ScrollReveal>
    </section>
  )
}
