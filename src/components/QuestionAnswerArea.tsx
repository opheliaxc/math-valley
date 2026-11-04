import type { GeneratedQuestion } from '../../question-generator/src/types.ts'
import {
  allowsMixedAnswerEntry,
  FractionAnswer,
  isFractionShortAnswer,
} from './FractionAnswer'
import { MultipleChoiceAnswer } from './MultipleChoiceAnswer'
import { TypedAnswer } from './TypedAnswer'

type QuestionAnswerAreaProps = {
  question: GeneratedQuestion
  disabled?: boolean
  onSubmit: (answer: string) => void
}

/** Shared answer UI for sessions and demos (MC / true-false / short-answer). */
export function QuestionAnswerArea({
  question,
  disabled = false,
  onSubmit,
}: QuestionAnswerAreaProps) {
  if (question.type === 'multiple-choice' && question.options) {
    return (
      <MultipleChoiceAnswer
        options={question.options}
        disabled={disabled}
        onSubmit={onSubmit}
      />
    )
  }

  if (question.type === 'true-false') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit('true')}
          className="min-h-14 rounded-2xl border border-slate-600 bg-slate-800 text-xl font-semibold hover:border-amber-400 disabled:opacity-50 disabled:hover:border-slate-600"
        >
          True
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit('false')}
          className="min-h-14 rounded-2xl border border-slate-600 bg-slate-800 text-xl font-semibold hover:border-amber-400 disabled:opacity-50 disabled:hover:border-slate-600"
        >
          False
        </button>
      </div>
    )
  }

  return isFractionShortAnswer(question) ? (
    <FractionAnswer
      disabled={disabled}
      allowMixed={allowsMixedAnswerEntry(question)}
      onSubmit={onSubmit}
    />
  ) : (
    <TypedAnswer disabled={disabled} onSubmit={onSubmit} />
  )
}
