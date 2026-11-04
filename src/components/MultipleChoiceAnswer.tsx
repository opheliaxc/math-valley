import type { QuestionOption } from '../../question-generator/src/types.ts'
import {
  isPictureOption,
  optionAnswerValue,
  optionKey,
} from '../../question-generator/src/types.ts'
import { renderMathDisplay, unwrapMathMarkers } from '../utils/renderMath'
import { renderVisual } from '../visuals/renderVisual'
import './MultipleChoiceAnswer.css'

type MultipleChoiceAnswerProps = {
  options: QuestionOption[]
  disabled?: boolean
  onSubmit: (answer: string) => void
}

function submitValue(option: QuestionOption): string {
  if (typeof option === 'string') return unwrapMathMarkers(option)
  return optionAnswerValue(option)
}

function usesPictureLayout(options: QuestionOption[]): boolean {
  return options.some((opt) => isPictureOption(opt) && opt.visual)
}

export function MultipleChoiceAnswer({
  options,
  disabled = false,
  onSubmit,
}: MultipleChoiceAnswerProps) {
  if (usesPictureLayout(options)) {
    return (
      <div className="mv-mc-picture-grid">
        {options.map((option, index) => {
          const picture = isPictureOption(option) ? option : null
          const label = picture?.text
          return (
            <button
              key={optionKey(option, index)}
              type="button"
              disabled={disabled}
              aria-label={picture?.altText ?? submitValue(option)}
              onClick={() => onSubmit(submitValue(option))}
              className="mv-mc-picture-option"
            >
              {picture?.visual
                ? renderVisual(picture.visual, {
                    altText: picture.altText,
                    size: 128,
                    className: 'mv-mc-picture-option-visual',
                  })
                : (
                    <span className="mv-mc-picture-option-fallback">
                      {renderMathDisplay(
                        typeof option === 'string' ? option : (option.text ?? option.id),
                      )}
                    </span>
                  )}
              {label ? (
                <span className="mv-mc-picture-option-label">
                  {renderMathDisplay(label)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    )
  }

  // Text-only options — same look and submit behavior as before.
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option, index) => {
        const label =
          typeof option === 'string' ? option : (option.text ?? option.altText)
        return (
          <button
            key={optionKey(option, index)}
            type="button"
            disabled={disabled}
            onClick={() => onSubmit(submitValue(option))}
            className="min-h-16 py-2 px-3 rounded-2xl border border-slate-600 bg-slate-800 text-xl font-semibold hover:border-amber-400 disabled:opacity-50 disabled:hover:border-slate-600"
          >
            {renderMathDisplay(label)}
          </button>
        )
      })}
    </div>
  )
}
