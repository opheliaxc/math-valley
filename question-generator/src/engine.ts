import { generateArithmeticTwoOperand } from './generators/arithmetic-two-operand.ts'
import { generateFractions } from './generators/fractions.ts'
import { generateGeometry } from './generators/geometry.ts'
import { generateMeasurement } from './generators/measurement.ts'
import { generateMoney } from './generators/money.ts'
import { generateTime } from './generators/time.ts'
import { generateWordProblem } from './generators/word-problem.ts'
import { createRng } from './rng.ts'
import { getStandard } from './standards-registry.ts'
import type {
  GenerateQuestionParams,
  GeneratedQuestion,
  QuestionType,
  StandardConfig,
} from './types.ts'

/**
 * Public entry point for the question generator (spec §11).
 */
export function generateQuestion(
  params: GenerateQuestionParams,
): GeneratedQuestion {
  const { grade, standard, difficulty, type: requestedType, seed } = params

  const config = getStandard(standard)
  if (!config) {
    throw new Error(`Unknown standard "${standard}". Check the Standard Registry.`)
  }

  if (config.grade !== grade) {
    throw new Error(
      `Grade mismatch: standard ${standard} is grade ${config.grade}, but grade ${grade} was requested.`,
    )
  }

  if (difficulty !== 'beginner' && difficulty !== 'advanced') {
    throw new Error(`Invalid difficulty "${String(difficulty)}". Use "beginner" or "advanced".`)
  }

  const type = resolveType(config, requestedType, seed)
  const args = { config, difficulty, type, seed }

  switch (config.generatorId) {
    case 'arithmetic-two-operand':
      return generateArithmeticTwoOperand(args)
    case 'word-problem':
      return generateWordProblem(args)
    case 'time':
      return generateTime(args)
    case 'money':
      return generateMoney(args)
    case 'measurement':
      return generateMeasurement(args)
    case 'fractions':
      return generateFractions(args)
    case 'geometry':
      return generateGeometry(args)
    default:
      throw new Error(
        `No generator registered for generatorId "${config.generatorId}" (standard ${standard}).`,
      )
  }
}

function resolveType(
  config: StandardConfig,
  requestedType: QuestionType | undefined,
  seed?: number,
): QuestionType {
  if (requestedType !== undefined) {
    if (!config.supportedTypes.includes(requestedType)) {
      throw new Error(
        `Standard ${config.code} does not support type "${requestedType}". ` +
          `Supported: ${config.supportedTypes.join(', ')}`,
      )
    }
    return requestedType
  }

  if (config.supportedTypes.length === 0) {
    throw new Error(`Standard ${config.code} has no supported question types.`)
  }

  const rng = createRng(seed)
  return rng.pick(config.supportedTypes)
}
