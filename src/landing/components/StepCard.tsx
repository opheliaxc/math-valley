import type { ComponentType } from 'react'

type StepCardProps = {
  stepNumber: number
  title: string
  sentence: string
  Icon: ComponentType<{ className?: string }>
}

export function StepCard({ stepNumber, title, sentence, Icon }: StepCardProps) {
  return (
    <li className="mv-step-card">
      <div className="mv-step-card__icon" aria-hidden="true">
        <Icon className="mv-step-card__svg" />
        <span className="mv-step-card__num">{stepNumber}</span>
      </div>
      <div className="mv-step-card__text">
        <h3 className="mv-step-card__title">{title}</h3>
        <p className="mv-step-card__sentence">{sentence}</p>
      </div>
    </li>
  )
}
