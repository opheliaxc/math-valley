import type { Grade } from '../../data/profile'
import { landingCopy } from '../data/landingCopy'

const GRADES: Grade[] = [1, 2, 3, 4]

type GradePickerProps = {
  value: Grade
  onChange: (grade: Grade) => void
}

export function GradePicker({ value, onChange }: GradePickerProps) {
  const copy = landingCopy.explore

  return (
    <div className="mv-grade-picker">
      <p className="mv-grade-picker__hint">{copy.gradeHint}</p>
      <div
        className="mv-grade-picker__buttons"
        role="group"
        aria-label="Choose a grade"
      >
        {GRADES.map((grade) => {
          const pressed = value === grade
          return (
            <button
              key={grade}
              type="button"
              className={`mv-grade-picker__btn${pressed ? ' mv-grade-picker__btn--pressed' : ''}`}
              aria-pressed={pressed}
              onClick={() => onChange(grade)}
            >
              {copy.gradeLabel(grade)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
