import { FinalScene } from '../art/FinalScene'
import { SectionWave } from '../art/SectionWave'
import { LinkButton } from '../components/Button'
import { landingCopy } from '../data/landingCopy'
import { ScrollReveal } from '../motion/AmbientMotion'
import { ENTRY_PATH } from '../../routes'

export function FinalCta() {
  const copy = landingCopy.finalCta

  return (
    <section
      id={copy.id}
      className="mv-final"
      aria-labelledby="landing-start-heading"
    >
      <div className="mv-final__wave" aria-hidden="true">
        <SectionWave fill="var(--mv-sky)" />
      </div>

      <ScrollReveal className="mv-final__inner">
        <div className="mv-final__copy">
          <h2 id="landing-start-heading" tabIndex={-1}>
            {copy.heading}
          </h2>
          <LinkButton variant="primary" href={ENTRY_PATH}>
            {copy.startLearning}
          </LinkButton>
        </div>
        <div className="mv-final__art">
          <FinalScene className="mv-final__svg" />
        </div>
      </ScrollReveal>
    </section>
  )
}
