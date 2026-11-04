import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { generateQuestion } from '../../src/engine.ts'
import { getStandardsByGrade } from '../../src/standards-registry.ts'
import {
  runValidationSuite,
  validateQuestion,
  type ValidationReport,
} from '../../src/validate.ts'
import type {
  Difficulty,
  GeneratedQuestion,
  Grade,
  QuestionType,
} from '../../src/types.ts'
import {
  isPictureOption,
  optionKey,
  optionLabel,
} from '../../src/types.ts'
import {
  DUMMY_AMBIGUOUS_ANGLE,
  DUMMY_PICTURE_MC,
  DUMMY_PICTURE_MC_TWO_CORRECT,
  DUMMY_PICTURE_SHORT,
  DUMMY_PICTURE_TRUE_FALSE,
} from '../../src/dummy-visual-questions.ts'
import { renderMathDisplay } from '@display/utils/renderMath.tsx'
import { renderVisual } from '@display/visuals/renderVisual.tsx'
import {
  allowsMixedAnswerEntry,
  FractionAnswer,
  isFractionShortAnswer,
} from '@display/components/FractionAnswer.tsx'

type TypeChoice = 'auto' | QuestionType

const GRADES: Grade[] = [1, 2, 3, 4]
const DIFFICULTIES: Difficulty[] = ['beginner', 'advanced']
const VALIDATION_SAMPLES = 50

const DEMO_PICTURE_BATCH: GeneratedQuestion[] = [
  DUMMY_PICTURE_MC,
  DUMMY_PICTURE_TRUE_FALSE,
  DUMMY_PICTURE_SHORT,
  DUMMY_PICTURE_MC_TWO_CORRECT,
  DUMMY_AMBIGUOUS_ANGLE,
]

export default function App() {
  const [grade, setGrade] = useState<Grade>(1)
  const [standard, setStandard] = useState('NY-1.OA.6')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [typeChoice, setTypeChoice] = useState<TypeChoice>('auto')
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [batch, setBatch] = useState<GeneratedQuestion[]>([])
  const [reveal, setReveal] = useState(false)
  const [showVisualSpec, setShowVisualSpec] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [validating, setValidating] = useState(false)
  const [demoValidation, setDemoValidation] = useState<string | null>(null)

  const standardsForGrade = useMemo(() => getStandardsByGrade(grade), [grade])

  const selectedConfig = standardsForGrade.find((s) => s.code === standard)

  function onGradeChange(next: Grade) {
    setGrade(next)
    const list = getStandardsByGrade(next)
    const nextStandard = list[0]?.code ?? ''
    setStandard(nextStandard)
    setTypeChoice('auto')
    setQuestion(null)
    setBatch([])
    setError(null)
    setDemoValidation(null)
  }

  function onStandardChange(code: string) {
    setStandard(code)
    setTypeChoice('auto')
    setQuestion(null)
    setBatch([])
    setError(null)
    setDemoValidation(null)
  }

  function buildParams() {
    return {
      grade,
      standard,
      difficulty,
      ...(typeChoice === 'auto' ? {} : { type: typeChoice }),
    }
  }

  function handleGenerate() {
    setError(null)
    setBatch([])
    setReport(null)
    setReveal(false)
    setDemoValidation(null)
    try {
      setQuestion(generateQuestion(buildParams()))
    } catch (err) {
      setQuestion(null)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function handleGenerate20() {
    setError(null)
    setQuestion(null)
    setReport(null)
    setReveal(false)
    setDemoValidation(null)
    try {
      const items: GeneratedQuestion[] = []
      for (let i = 0; i < 20; i += 1) {
        items.push(generateQuestion(buildParams()))
      }
      setBatch(items)
    } catch (err) {
      setBatch([])
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function handleLoadDemoPictures() {
    setError(null)
    setQuestion(null)
    setReport(null)
    setDemoValidation(null)
    setBatch(DEMO_PICTURE_BATCH.map((q) => ({ ...q })))
  }

  function handleValidateVisible() {
    const items = question ? [question] : batch
    if (items.length === 0) {
      setDemoValidation('Generate or load questions first.')
      return
    }
    const lines: string[] = []
    for (const q of items) {
      const reasons = validateQuestion(q)
      if (reasons.length === 0) {
        lines.push(`PASS  ${q.id}`)
      } else {
        lines.push(`FAIL  ${q.id}`)
        for (const r of reasons) lines.push(`      • ${r}`)
      }
    }
    setDemoValidation(lines.join('\n'))
  }

  function handleValidation() {
    setError(null)
    setQuestion(null)
    setBatch([])
    setDemoValidation(null)
    setValidating(true)
    window.setTimeout(() => {
      try {
        setReport(runValidationSuite({ samplesPerCombo: VALIDATION_SAMPLES }))
      } catch (err) {
        setReport(null)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setValidating(false)
      }
    }, 20)
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>Question Generator</h1>
      <p style={styles.sub}>
        Standalone test page — not part of Math Valley&apos;s main UI yet.
      </p>

      <section style={styles.controls}>
        <label style={styles.label}>
          Grade
          <select
            value={grade}
            onChange={(e) => onGradeChange(Number(e.target.value) as Grade)}
            style={styles.select}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Standard
          <select
            value={standard}
            onChange={(e) => onStandardChange(e.target.value)}
            style={styles.select}
          >
            {standardsForGrade.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} ({s.generatorId})
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            style={styles.select}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Type
          <select
            value={typeChoice}
            onChange={(e) => setTypeChoice(e.target.value as TypeChoice)}
            style={styles.select}
          >
            <option value="auto">auto</option>
            {(selectedConfig?.supportedTypes ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div style={styles.buttonRow}>
        <button type="button" onClick={handleGenerate} style={styles.button}>
          Generate
        </button>
        <button type="button" onClick={handleGenerate20} style={styles.buttonSecondary}>
          Generate 20
        </button>
        <button
          type="button"
          onClick={handleLoadDemoPictures}
          style={styles.buttonSecondary}
        >
          Load demo picture questions
        </button>
        <button
          type="button"
          onClick={handleValidateVisible}
          style={styles.buttonSecondary}
        >
          Validate visible
        </button>
        <button
          type="button"
          onClick={handleValidation}
          style={styles.buttonSecondary}
          disabled={validating}
        >
          {validating ? 'Running…' : 'Run validation suite'}
        </button>
        <label style={styles.revealToggle}>
          <input
            type="checkbox"
            checked={reveal}
            onChange={(e) => setReveal(e.target.checked)}
          />
          Reveal answer
        </label>
        <label style={styles.revealToggle}>
          <input
            type="checkbox"
            checked={showVisualSpec}
            onChange={(e) => setShowVisualSpec(e.target.checked)}
          />
          Show VisualSpec JSON
        </label>
      </div>

      <p style={styles.hint}>
        Phase 0: registry standards are still text-only. Use{' '}
        <strong>Load demo picture questions</strong> to exercise pictures,
        then <strong>Validate visible</strong> — the two-correct / ambiguous
        demos should FAIL.
      </p>

      {error && (
        <div style={styles.error} role="alert">
          {error}
        </div>
      )}

      {demoValidation && (
        <pre style={styles.demoValidation} role="status">
          {demoValidation}
        </pre>
      )}

      {question && (
        <section style={styles.preview}>
          <QuestionPreview
            question={question}
            reveal={reveal}
            showVisualSpec={showVisualSpec}
          />
        </section>
      )}

      {batch.length > 0 && (
        <section style={styles.batch}>
          <h2 style={styles.h2}>Batch of {batch.length}</h2>
          <ol style={styles.batchList}>
            {batch.map((q, i) => (
              <li key={q.id + i} style={styles.batchItemCard}>
                <div style={styles.batchMeta}>
                  #{i + 1} · {q.type}
                  {q.visualPredicate ? ` · predicate ${q.visualPredicate}` : ''}
                  {reveal && (
                    <span style={styles.batchAnswer}>
                      {' '}
                      → {renderMathDisplay(q.correctAnswer)}
                    </span>
                  )}
                </div>
                <QuestionPreview
                  question={q}
                  reveal={reveal}
                  showVisualSpec={showVisualSpec}
                  compact
                />
              </li>
            ))}
          </ol>
        </section>
      )}

      {report && <ValidationResults report={report} />}
    </main>
  )
}

function ValidationResults({ report }: { report: ValidationReport }) {
  const allPassed = report.totalFailed === 0
  return (
    <section style={styles.validation}>
      <h2 style={styles.h2}>Validation suite</h2>
      <p style={styles.sub}>
        {report.samplesPerCombo} samples per standard × difficulty × type ·{' '}
        <strong style={{ color: allPassed ? '#1a7a3a' : '#7a1f1f' }}>
          {report.totalPassed} passed, {report.totalFailed} failed
        </strong>{' '}
        of {report.totalSamples}
      </p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Standard</th>
            <th style={styles.th}>Grade</th>
            <th style={styles.th}>Result</th>
            <th style={styles.th}>Samples</th>
            <th style={styles.th}>Failures</th>
          </tr>
        </thead>
        <tbody>
          {report.byStandard.map((row) => (
            <tr key={row.standard}>
              <td style={styles.td}>{row.standard}</td>
              <td style={styles.td}>{row.grade}</td>
              <td
                style={{
                  ...styles.td,
                  color: row.passed ? '#1a7a3a' : '#7a1f1f',
                  fontWeight: 600,
                }}
              >
                {row.passed ? 'PASS' : 'FAIL'}
              </td>
              <td style={styles.td}>{row.samples}</td>
              <td style={styles.td}>{row.failureCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {report.byStandard
        .filter((row) => !row.passed)
        .map((row) => (
          <div key={row.standard + '-details'} style={styles.failBlock}>
            <h3 style={styles.h3}>
              {row.standard} — {row.failureCount} failure
              {row.failureCount === 1 ? '' : 's'}
            </h3>
            {row.failures.map((f, i) => (
              <div key={row.standard + i} style={styles.failItem}>
                <div style={styles.failReason}>{f.reason}</div>
                <div style={styles.batchMeta}>
                  {f.question.difficulty} · {f.question.type}
                  {f.question.seed !== undefined ? ` · seed ${f.question.seed}` : ''}
                </div>
                <div>{renderMathDisplay(f.question.prompt)}</div>
                {f.question.visual
                  ? renderVisual(f.question.visual, {
                      altText: f.question.altText,
                      size: 120,
                    })
                  : null}
                <div>
                  answer: {renderMathDisplay(f.question.correctAnswer || '(none)')}
                  {f.question.options ? ' · options: [' : ''}
                  {f.question.options?.map((opt, idx) => (
                    <span key={optionKey(opt, idx)}>
                      {idx > 0 ? ', ' : ''}
                      {renderMathDisplay(optionLabel(opt))}
                    </span>
                  ))}
                  {f.question.options ? ']' : ''}
                </div>
              </div>
            ))}
          </div>
        ))}
    </section>
  )
}

function QuestionPreview({
  question,
  reveal,
  showVisualSpec,
  compact = false,
}: {
  question: GeneratedQuestion
  reveal: boolean
  showVisualSpec: boolean
  compact?: boolean
}) {
  const visualSize = compact ? 120 : 160
  const optionSize = compact ? 96 : 112

  return (
    <div>
      {!compact && (
        <div style={styles.meta}>
          {question.standard} · grade {question.grade} · {question.difficulty} ·{' '}
          {question.type}
          {question.visualPredicate
            ? ` · predicate ${question.visualPredicate}`
            : ''}
        </div>
      )}
      <p style={compact ? styles.promptCompact : styles.prompt}>
        {renderMathDisplay(question.prompt)}
      </p>

      {question.visual
        ? renderVisual(question.visual, {
            altText: question.altText,
            size: visualSize,
          })
        : null}

      {question.type === 'multiple-choice' && question.options && (
        <div style={styles.mcGrid}>
          {question.options.map((opt, idx) => (
            <div key={optionKey(opt, idx)} style={styles.mcCard}>
              {isPictureOption(opt) && opt.visual
                ? renderVisual(opt.visual, {
                    altText: opt.altText,
                    size: optionSize,
                  })
                : (
                    <button type="button" style={styles.optionButton}>
                      {renderMathDisplay(optionLabel(opt))}
                    </button>
                  )}
              {isPictureOption(opt) && opt.text ? (
                <div style={styles.optionCaption}>
                  {renderMathDisplay(opt.text)}
                </div>
              ) : null}
              {reveal && idx === question.correctOptionIndex && (
                <span style={styles.correctMark}>correct</span>
              )}
              {showVisualSpec && isPictureOption(opt) && opt.visual ? (
                <VisualSpecBlock
                  label={`option ${opt.id}`}
                  value={{
                    id: opt.id,
                    altText: opt.altText,
                    visual: opt.visual,
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {question.type === 'true-false' && (
        <div style={styles.tfRow}>
          <button type="button" style={styles.optionButton}>
            True
          </button>
          <button type="button" style={styles.optionButton}>
            False
          </button>
        </div>
      )}

      {question.type === 'short-answer' &&
        (isFractionShortAnswer(question) ? (
          <FractionAnswer
            disabled
            allowMixed={allowsMixedAnswerEntry(question)}
            onSubmit={() => {}}
          />
        ) : (
          <input
            type="text"
            placeholder="Type your answer"
            style={styles.input}
            readOnly
          />
        ))}

      {showVisualSpec && question.visual ? (
        <VisualSpecBlock
          label="prompt visual"
          value={{
            altText: question.altText,
            visualPredicate: question.visualPredicate,
            visual: question.visual,
          }}
        />
      ) : null}

      {reveal && (
        <div style={styles.revealBox}>
          <div>
            <strong>Answer:</strong> {renderMathDisplay(question.correctAnswer)}
          </div>
          <div style={styles.explanation}>
            {renderMathDisplay(question.explanation)}
          </div>
        </div>
      )}
    </div>
  )
}

function VisualSpecBlock({
  label,
  value,
}: {
  label: string
  value: unknown
}): ReactNode {
  return (
    <details style={styles.specDetails}>
      <summary style={styles.specSummary}>VisualSpec — {label}</summary>
      <pre style={styles.specPre}>{JSON.stringify(value, null, 2)}</pre>
    </details>
  )
}

const styles: Record<string, CSSProperties> = {
  main: {
    fontFamily: 'system-ui, sans-serif',
    padding: '1.5rem',
    maxWidth: 920,
    margin: '0 auto',
    color: '#1a1a1a',
    lineHeight: 1.45,
  },
  h1: { margin: '0 0 0.25rem', fontSize: '1.6rem' },
  h2: { margin: '0 0 0.75rem', fontSize: '1.15rem' },
  h3: { margin: '0 0 0.5rem', fontSize: '1rem' },
  sub: { margin: '0 0 1.25rem', color: '#555', fontSize: '0.95rem' },
  hint: {
    margin: '0 0 1rem',
    color: '#555',
    fontSize: '0.9rem',
    background: '#f4f6f8',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '0.65rem 0.85rem',
  },
  controls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  select: {
    font: 'inherit',
    fontWeight: 400,
    padding: '0.4rem 0.5rem',
    borderRadius: 6,
    border: '1px solid #ccc',
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  button: {
    font: 'inherit',
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: '1px solid #1a1a1a',
    background: '#1a1a1a',
    color: '#fff',
    cursor: 'pointer',
  },
  buttonSecondary: {
    font: 'inherit',
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: '1px solid #888',
    background: '#fff',
    color: '#1a1a1a',
    cursor: 'pointer',
  },
  revealToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.95rem',
  },
  error: {
    background: '#fde8e8',
    border: '1px solid #e0a0a0',
    color: '#7a1f1f',
    padding: '0.75rem 1rem',
    borderRadius: 6,
    marginBottom: '1rem',
  },
  demoValidation: {
    background: '#0f172a',
    color: '#e2e8f0',
    padding: '0.85rem 1rem',
    borderRadius: 8,
    fontSize: 12,
    lineHeight: 1.45,
    overflow: 'auto',
    marginBottom: '1rem',
  },
  preview: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '1.1rem 1.25rem',
    marginBottom: '1.5rem',
    background: '#fafafa',
  },
  meta: { fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' },
  prompt: { fontSize: '1.15rem', margin: '0 0 1rem', fontWeight: 500 },
  promptCompact: { fontSize: '1.05rem', margin: '0 0 0.65rem', fontWeight: 500 },
  mcGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  mcCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
    minHeight: '7rem',
    padding: '0.65rem',
    borderRadius: 10,
    border: '1px solid #ccc',
    background: '#fff',
  },
  optionCaption: { fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' },
  optionButton: {
    font: 'inherit',
    padding: '0.45rem 0.85rem',
    borderRadius: 6,
    border: '1px solid #bbb',
    background: '#fff',
    cursor: 'default',
    minWidth: '4rem',
  },
  correctMark: { color: '#1a7a3a', fontSize: '0.85rem', fontWeight: 600 },
  tfRow: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' },
  input: {
    font: 'inherit',
    padding: '0.45rem 0.75rem',
    borderRadius: 6,
    border: '1px solid #bbb',
    width: '100%',
    maxWidth: 240,
    boxSizing: 'border-box',
    marginTop: '0.5rem',
  },
  revealBox: {
    marginTop: '1rem',
    paddingTop: '0.85rem',
    borderTop: '1px solid #ddd',
  },
  explanation: { marginTop: '0.35rem', color: '#444', fontSize: '0.95rem' },
  batch: { marginTop: '0.5rem' },
  batchList: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' },
  batchItemCard: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '0.9rem 1rem',
    background: '#fafafa',
  },
  batchMeta: { fontSize: '0.8rem', color: '#666', marginBottom: '0.35rem' },
  batchAnswer: { color: '#1a7a3a', fontWeight: 600 },
  specDetails: {
    width: '100%',
    marginTop: '0.35rem',
    fontSize: '0.8rem',
  },
  specSummary: { cursor: 'pointer', color: '#334155', fontWeight: 600 },
  specPre: {
    margin: '0.35rem 0 0',
    padding: '0.55rem 0.65rem',
    background: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 6,
    overflow: 'auto',
    fontSize: 11,
    lineHeight: 1.4,
    maxHeight: 220,
  },
  validation: { marginTop: '1.5rem' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
    marginBottom: '1.25rem',
  },
  th: {
    textAlign: 'left',
    borderBottom: '2px solid #ccc',
    padding: '0.4rem 0.5rem',
  },
  td: {
    borderBottom: '1px solid #eee',
    padding: '0.35rem 0.5rem',
    verticalAlign: 'top',
  },
  failBlock: {
    background: '#fff8f8',
    border: '1px solid #e0a0a0',
    borderRadius: 8,
    padding: '0.85rem 1rem',
    marginBottom: '0.85rem',
  },
  failItem: {
    marginBottom: '0.75rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #f0d0d0',
  },
  failReason: { fontWeight: 600, color: '#7a1f1f', marginBottom: '0.25rem' },
}
