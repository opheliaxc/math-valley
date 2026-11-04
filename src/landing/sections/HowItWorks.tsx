import { SectionWave } from '../art/SectionWave'
import {
  ExplorerIcon,
  IslandStepIcon,
  PracticeIcon,
  UnlockIcon,
} from '../art/StepIcons'
import { StepCard } from '../components/StepCard'
import { landingCopy } from '../data/landingCopy'
import { ScrollReveal } from '../motion/AmbientMotion'

const STEP_ICONS = [
  ExplorerIcon,
  IslandStepIcon,
  PracticeIcon,
  UnlockIcon,
] as const

export function HowItWorks() {
  const copy = landingCopy.howItWorks

  return (
    <section
      id={copy.id}
      className="mv-how"
      aria-labelledby="landing-how-heading"
    >
      <div className="mv-how__wave" aria-hidden="true">
        <SectionWave fill="color-mix(in srgb, var(--mv-lavender) 28%, var(--mv-cream))" />
      </div>

      <ScrollReveal className="mv-how__inner">
        <h2 id="landing-how-heading" tabIndex={-1}>
          {copy.heading}
        </h2>

        <ol className="mv-how__steps">
          {copy.steps.map((step, index) => {
            const Icon = STEP_ICONS[index]
            return (
              <StepCard
                key={step.title}
                stepNumber={index + 1}
                title={step.title}
                sentence={step.sentence}
                Icon={Icon}
              />
            )
          })}
        </ol>
      </ScrollReveal>
    </section>
  )
}
