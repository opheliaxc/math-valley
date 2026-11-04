import { generateQuestion } from './engine.ts'
import { STANDARDS_REGISTRY } from './standards-registry.ts'
import type {
  Difficulty,
  GeneratedQuestion,
  QuestionType,
} from './types.ts'
import { validateVisualQuestion } from './validate-visual.ts'
import { optionAnswerValue } from './visual.ts'

export interface ValidationFailure {
  reason: string
  question: GeneratedQuestion
}

export interface ValidationComboResult {
  standard: string
  grade: number
  difficulty: Difficulty
  type: QuestionType
  samples: number
  passed: number
  failed: number
  failures: ValidationFailure[]
}

export interface ValidationStandardSummary {
  standard: string
  grade: number
  passed: boolean
  samples: number
  failureCount: number
  failures: ValidationFailure[]
}

export interface ValidationReport {
  samplesPerCombo: number
  combos: ValidationComboResult[]
  byStandard: ValidationStandardSummary[]
  totalSamples: number
  totalPassed: number
  totalFailed: number
}

const PLACEHOLDER_RE = /\{\{|\}\}|\$\{|[A-Z_]{3,}_PLACEHOLDER|<%|%>|\bundefined\b|\bnull\b|\bNaN\b/
const MAX_FAILURES_STORED = 5

/** Strip `[[3/4]]` display markers so options can be compared to plain correctAnswer. */
function unwrapDisplayMath(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, '$1')
}

export interface RunValidationOptions {
  /** Questions generated per standard × difficulty × type (default 50). */
  samplesPerCombo?: number
  /** Optional seed base for reproducibility. */
  seedBase?: number
}

/**
 * For every standard × difficulty × supported type, generate N questions and
 * assert structural + (where feasible) independent math correctness.
 */
export function runValidationSuite(
  options: RunValidationOptions = {},
): ValidationReport {
  const samplesPerCombo = options.samplesPerCombo ?? 50
  const seedBase = options.seedBase ?? 1
  const combos: ValidationComboResult[] = []
  let totalPassed = 0
  let totalFailed = 0
  let seed = seedBase

  for (const config of STANDARDS_REGISTRY) {
    for (const difficulty of ['beginner', 'advanced'] as const) {
      for (const type of config.supportedTypes) {
        const result: ValidationComboResult = {
          standard: config.code,
          grade: config.grade,
          difficulty,
          type,
          samples: samplesPerCombo,
          passed: 0,
          failed: 0,
          failures: [],
        }

        for (let i = 0; i < samplesPerCombo; i += 1) {
          seed += 1
          try {
            const question = generateQuestion({
              grade: config.grade,
              standard: config.code,
              difficulty,
              type,
              seed,
            })
            const reasons = validateQuestion(question)
            if (reasons.length === 0) {
              result.passed += 1
              totalPassed += 1
            } else {
              result.failed += 1
              totalFailed += 1
              if (result.failures.length < MAX_FAILURES_STORED) {
                result.failures.push({
                  reason: reasons.join('; '),
                  question,
                })
              }
            }
          } catch (err) {
            result.failed += 1
            totalFailed += 1
            if (result.failures.length < MAX_FAILURES_STORED) {
              result.failures.push({
                reason: `Generator threw: ${err instanceof Error ? err.message : String(err)}`,
                question: {
                  id: 'error',
                  standard: config.code,
                  grade: config.grade,
                  topic: '',
                  difficulty,
                  type,
                  prompt: '(generation failed)',
                  correctAnswer: '',
                  explanation: '',
                  seed,
                },
              })
            }
          }
        }

        combos.push(result)
      }
    }
  }

  const byStandard = summarizeByStandard(combos)
  return {
    samplesPerCombo,
    combos,
    byStandard,
    totalSamples: totalPassed + totalFailed,
    totalPassed,
    totalFailed,
  }
}

export function validateQuestion(question: GeneratedQuestion): string[] {
  const reasons: string[] = []

  if (!question.prompt?.trim()) reasons.push('empty prompt')
  if (!question.correctAnswer?.trim()) reasons.push('empty correctAnswer')
  if (!question.explanation?.trim()) reasons.push('empty explanation')

  if (question.prompt && PLACEHOLDER_RE.test(question.prompt)) {
    reasons.push('prompt looks like it has unresolved placeholders')
  }
  if (question.explanation && PLACEHOLDER_RE.test(question.explanation)) {
    reasons.push('explanation looks like it has unresolved placeholders')
  }

  if (question.type === 'multiple-choice') {
    reasons.push(...validateMultipleChoice(question))
  } else if (question.type === 'true-false') {
    const ans = question.correctAnswer.trim().toLowerCase()
    if (ans !== 'true' && ans !== 'false') {
      reasons.push(`true-false answer must be "true" or "false" (got "${question.correctAnswer}")`)
    }
  }

  // Degenerate: bare negative numeric answer (except we never expect these in v1)
  if (/^-\d+(\.\d+)?$/.test(question.correctAnswer.trim())) {
    reasons.push('negative numeric correctAnswer')
  }

  // Independent math check where the prompt is a clear equation
  const mathReason = verifyMathFromPrompt(question)
  if (mathReason) reasons.push(mathReason)

  // Picture questions: structure, distinct options, margins, re-derived answer
  reasons.push(...validateVisualQuestion(question))

  return reasons
}

function validateMultipleChoice(question: GeneratedQuestion): string[] {
  const reasons: string[] = []
  const options = question.options

  if (!options || options.length !== 4) {
    reasons.push(`multiple-choice must have exactly 4 options (got ${options?.length ?? 0})`)
    return reasons
  }

  const answerKeys = options.map((opt) =>
    unwrapDisplayMath(optionAnswerValue(opt)),
  )

  if (new Set(answerKeys).size !== 4) {
    reasons.push('multiple-choice options are not unique')
  }

  const matches = answerKeys.filter((o) => o === question.correctAnswer)
  if (matches.length !== 1) {
    reasons.push(
      `exactly one option must equal correctAnswer (found ${matches.length})`,
    )
  }

  if (
    question.correctOptionIndex === undefined ||
    question.correctOptionIndex < 0 ||
    question.correctOptionIndex > 3
  ) {
    reasons.push('correctOptionIndex missing or out of range')
  } else if (
    unwrapDisplayMath(
      optionAnswerValue(options[question.correctOptionIndex] ?? ''),
    ) !== question.correctAnswer
  ) {
    reasons.push('correctOptionIndex does not point at correctAnswer')
  }

  return reasons
}

/**
 * Re-derive the answer from simple equation-style prompts when possible.
 * Returns a failure reason, or null if OK / not applicable.
 */
function verifyMathFromPrompt(question: GeneratedQuestion): string | null {
  const prompt = question.prompt

  // Division (supports remainder answers like "14 R 2")
  const div = prompt.match(/^What is (\d+)\s*÷\s*(\d+)\?$/)
  if (div) {
    const a = Number(div[1])
    const b = Number(div[2])
    if (b === 0) return 'division by zero in prompt'
    const q = Math.floor(a / b)
    const r = a % b
    const expected = r === 0 ? String(q) : `${q} R ${r}`
    if (normalizeAnswer(question.correctAnswer) !== normalizeAnswer(expected)) {
      return `math mismatch: ${a} ÷ ${b} should be ${expected}, got ${question.correctAnswer}`
    }
    return null
  }

  // "What is 12 + 34?" / multi-addend / unicode operators
  const whatIs = prompt.match(
    /^What is (-?\d+(?:\s*[+−\-×x*÷/]\s*-?\d+)+)\?$/u,
  )
  if (whatIs) {
    const expected = evalLeftToRight(whatIs[1]!)
    if (expected === null) return null
    if (normalizeAnswer(question.correctAnswer) !== String(expected)) {
      return `math mismatch: "${whatIs[1]}" should be ${expected}, got ${question.correctAnswer}`
    }
    return null
  }

  // True/false equation: "Is this true or false? 3 + 4 = 7"
  const tf = prompt.match(/^Is this true or false\?\s*(.+?)\s*=\s*(.+)$/)
  if (tf && question.type === 'true-false') {
    const leftVal = evalLeftToRight(tf[1]!)
    if (leftVal === null) return null
    const rightRaw = tf[2]!.trim()
    const rightVal = Number(rightRaw)
    if (!Number.isFinite(rightVal)) return null
    const actuallyTrue = leftVal === rightVal
    const claimed = question.correctAnswer.trim().toLowerCase() === 'true'
    if (actuallyTrue !== claimed) {
      return `true/false mismatch: ${tf[1]} = ${rightRaw} is ${actuallyTrue}, but answer is ${question.correctAnswer}`
    }
    return null
  }

  return null
}

/** Evaluate a simple left-to-right chain of + − × ÷ (no precedence). */
function evalLeftToRight(expr: string): number | null {
  const normalized = expr
    .replace(/−/g, '-')
    .replace(/×|x/gi, '*')
    .replace(/÷/g, '/')
    .replace(/\s+/g, '')

  const tokens = normalized.match(/-?\d+|[+\-*/]/g)
  if (!tokens || tokens.length < 3) return null

  let value = Number(tokens[0])
  if (!Number.isFinite(value)) return null

  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]
    const rhs = Number(tokens[i + 1])
    if (!op || !Number.isFinite(rhs)) return null
    if (op === '+') value += rhs
    else if (op === '-') value -= rhs
    else if (op === '*') value *= rhs
    else if (op === '/') {
      if (rhs === 0) return null
      // Prefer exact integer division for our generators
      if (value % rhs !== 0) return null
      value = value / rhs
    } else return null
  }

  return value
}

function normalizeAnswer(answer: string): string {
  return answer.trim().replace(/\s+/g, ' ')
}

function summarizeByStandard(
  combos: ValidationComboResult[],
): ValidationStandardSummary[] {
  const map = new Map<string, ValidationStandardSummary>()

  for (const combo of combos) {
    let row = map.get(combo.standard)
    if (!row) {
      row = {
        standard: combo.standard,
        grade: combo.grade,
        passed: true,
        samples: 0,
        failureCount: 0,
        failures: [],
      }
      map.set(combo.standard, row)
    }
    row.samples += combo.samples
    row.failureCount += combo.failed
    if (combo.failed > 0) row.passed = false
    for (const f of combo.failures) {
      if (row.failures.length < MAX_FAILURES_STORED) row.failures.push(f)
    }
  }

  return [...map.values()]
}
