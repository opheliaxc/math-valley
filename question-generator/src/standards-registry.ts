import type { Grade, StandardConfig } from './types.ts'

/**
 * Starting defaults for number ranges (spec §9.1) — tunable later without
 * changing engine architecture. Param keys are consumed by generator families.
 */
export const STANDARDS_REGISTRY: StandardConfig[] = [
  // ── Grade 1 — Addition & subtraction / word problems ───────────────────
  {
    code: 'NY-1.OA.1',
    grade: 1,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxResult: 10, steps: 1 },
      advanced: { maxResult: 20, steps: 1 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-1.OA.2',
    grade: 1,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { addendCount: 3, maxResult: 12 },
      advanced: { addendCount: 3, maxResult: 20 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-1.OA.6',
    grade: 1,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minOperand: 0, maxOperand: 10, maxResult: 10 },
      advanced: { minOperand: 0, maxOperand: 20, maxResult: 20 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-1.NBT.4',
    grade: 1,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      // two-digit + one-digit, or two-digit + multiple of 10
      beginner: { minA: 10, maxA: 40, minB: 1, maxB: 9, bMultipleOf10: 0 },
      advanced: { minA: 10, maxA: 90, minB: 10, maxB: 90, bMultipleOf10: 1 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-1.NBT.6',
    grade: 1,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minMultiple: 10, maxMultiple: 50 },
      advanced: { minMultiple: 10, maxMultiple: 90 },
    },
    generatorId: 'arithmetic-two-operand',
  },

  // ── Grade 1 — Time / money ──────────────────────────────────────────────
  {
    code: 'NY-1.MD.3a',
    grade: 1,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minuteStep: 60 }, // hour only
      advanced: { minuteStep: 30 }, // hour and half-hour
    },
    generatorId: 'time',
  },
  {
    code: 'NY-1.MD.3b',
    grade: 1,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { coinKinds: 2 }, // penny, nickel
      advanced: { coinKinds: 4 }, // penny, nickel, dime, quarter
    },
    generatorId: 'money',
  },
  {
    code: 'NY-1.MD.3c',
    grade: 1,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxCents: 50, maxCoins: 6 },
      advanced: { maxCents: 100, maxCoins: 12 },
    },
    generatorId: 'money',
  },

  // ── Grade 1 — Geometry (Hatchling Shape Cove; wire island in loop step 4) ─
  {
    code: 'NY-1.G.1',
    grade: 1,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { rotate: 0, extraShapes: 0 },
      advanced: { rotate: 1, extraShapes: 1 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-1.G.2',
    grade: 1,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxPieces: 2 },
      advanced: { maxPieces: 3 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-1.G.3',
    grade: 1,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { maxParts: 2 },
      advanced: { maxParts: 4 },
    },
    generatorId: 'geometry',
  },

  // ── Grade 2 — Addition & subtraction / word problems ───────────────────
  {
    code: 'NY-2.OA.1a',
    grade: 2,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxResult: 50, steps: 1 },
      advanced: { maxResult: 100, steps: 1 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-2.OA.1b',
    grade: 2,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxResult: 50, steps: 2 },
      advanced: { maxResult: 100, steps: 2 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-2.OA.2a',
    grade: 2,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minOperand: 0, maxOperand: 10, maxResult: 10 },
      advanced: { minOperand: 0, maxOperand: 20, maxResult: 20 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-2.NBT.5',
    grade: 2,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minOperand: 10, maxOperand: 50, requireRegroup: 0 },
      advanced: { minOperand: 10, maxOperand: 99, requireRegroup: 1 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-2.NBT.6',
    grade: 2,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { addendCount: 3, minAddend: 10, maxAddend: 40 },
      advanced: { addendCount: 4, minAddend: 10, maxAddend: 99 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-2.NBT.7',
    grade: 2,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minOperand: 100, maxOperand: 400, requireRegroup: 0 },
      advanced: { minOperand: 100, maxOperand: 999, requireRegroup: 1 },
    },
    generatorId: 'arithmetic-two-operand',
  },

  // ── Grade 2 — Multiplication foundation ────────────────────────────────
  {
    // Spec: foundational / beginner-oriented; advanced stays within the 5×5 ceiling
    code: 'NY-2.OA.4',
    grade: 2,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minRows: 2, maxRows: 3, minCols: 2, maxCols: 3 },
      advanced: { minRows: 2, maxRows: 5, minCols: 2, maxCols: 5 },
    },
    generatorId: 'arithmetic-two-operand',
  },

  // ── Grade 2 — Time / money / measurement ───────────────────────────────
  {
    code: 'NY-2.MD.1',
    grade: 2,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minLength: 1, maxLength: 10 },
      advanced: { minLength: 5, maxLength: 20 },
    },
    generatorId: 'measurement',
  },
  {
    code: 'NY-2.MD.7',
    grade: 2,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minuteStep: 15 },
      advanced: { minuteStep: 5 },
    },
    generatorId: 'time',
  },
  {
    code: 'NY-2.MD.8',
    grade: 2,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxCents: 50, maxCoins: 5 },
      advanced: { maxCents: 100, maxCoins: 10 },
    },
    generatorId: 'money',
  },

  // ── Grade 2 — Geometry (Ember Shapes Quarry; wire island in loop step 4) ─
  {
    code: 'NY-2.G.1',
    grade: 2,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false'],
    difficultyParams: {
      beginner: { concave: 0 },
      advanced: { concave: 1 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-2.G.2',
    grade: 2,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { maxRows: 3, maxCols: 4 },
      advanced: { maxRows: 5, maxCols: 6 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-2.G.3',
    grade: 2,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { maxParts: 4, thirds: 0 },
      advanced: { maxParts: 4, thirds: 1 },
    },
    generatorId: 'geometry',
  },

  // ── Grade 3 — Multiplication & division / word problems ────────────────
  {
    code: 'NY-3.OA.1',
    grade: 3,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minFactor: 2, maxFactor: 5 },
      advanced: { minFactor: 2, maxFactor: 10 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-3.OA.2',
    grade: 3,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minFactor: 2, maxFactor: 5 },
      advanced: { minFactor: 2, maxFactor: 10 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-3.OA.3',
    grade: 3,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minFactor: 2, maxFactor: 5, maxProduct: 25 },
      advanced: { minFactor: 2, maxFactor: 10, maxProduct: 100 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-3.OA.7',
    grade: 3,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minFactor: 2, maxFactor: 5 },
      advanced: { minFactor: 2, maxFactor: 10 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-3.OA.8',
    grade: 3,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxResult: 50, steps: 2 },
      advanced: { maxResult: 100, steps: 2 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-3.NBT.2',
    grade: 3,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    // Spec §3 example: beginner under 100 no regroup; advanced to 999 with regroup
    difficultyParams: {
      beginner: { minOperand: 10, maxOperand: 99, requireRegroup: 0 },
      advanced: { minOperand: 100, maxOperand: 999, requireRegroup: 1 },
    },
    generatorId: 'arithmetic-two-operand',
  },

  // ── Grade 3 — Time / measurement ───────────────────────────────────────
  {
    code: 'NY-3.MD.1',
    grade: 3,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minuteStep: 1, elapsed: 0 },
      advanced: { minuteStep: 1, elapsed: 1, maxElapsedMinutes: 60 },
    },
    generatorId: 'time',
  },
  {
    code: 'NY-3.MD.2',
    grade: 3,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minMeasure: 1, maxMeasure: 20 },
      advanced: { minMeasure: 10, maxMeasure: 100 },
    },
    generatorId: 'measurement',
  },

  // ── Grade 3 — Geometric measurement (area / perimeter; MD island append) ─
  {
    code: 'NY-3.MD.5',
    grade: 3,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { maxCells: 12 },
      advanced: { maxCells: 20 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-3.MD.6',
    grade: 3,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxArea: 20 },
      advanced: { maxArea: 30 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-3.MD.7',
    grade: 3,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    // Stratify a–d inside the generator.
    difficultyParams: {
      beginner: { maxSide: 6, maxProduct: 36 },
      advanced: { maxSide: 10, maxProduct: 100 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-3.MD.8',
    grade: 3,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    // Stratify a/b inside the generator.
    difficultyParams: {
      beginner: { maxSide: 6 },
      advanced: { maxSide: 10 },
    },
    generatorId: 'geometry',
  },

  // ── Grade 3 — Geometry (Dragon's Forge) ────────────────────────────────
  {
    code: 'NY-3.G.1',
    grade: 3,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { irregular: 0 },
      advanced: { irregular: 1 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-3.G.2',
    grade: 3,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { maxParts: 4 },
      advanced: { maxParts: 8 },
    },
    generatorId: 'geometry',
  },

  // ── Grade 4 — Multiplication & division / word problems ────────────────
  {
    code: 'NY-4.OA.1',
    grade: 4,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minFactor: 2, maxFactor: 10, maxProduct: 50 },
      advanced: { minFactor: 2, maxFactor: 12, maxProduct: 144 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-4.OA.2',
    grade: 4,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minFactor: 2, maxFactor: 8, maxProduct: 48 },
      advanced: { minFactor: 2, maxFactor: 12, maxProduct: 144 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-4.OA.3',
    grade: 4,
    domain: 'Operations & Algebraic Thinking',
    mathValleyTopics: ['operations-algebraic-thinking'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxResult: 200, steps: 2 },
      advanced: { maxResult: 1000, steps: 3 },
    },
    generatorId: 'word-problem',
  },
  {
    code: 'NY-4.NBT.4',
    grade: 4,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { minOperand: 1000, maxOperand: 9999, requireRegroup: 0 },
      advanced: { minOperand: 10000, maxOperand: 99999, requireRegroup: 1 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-4.NBT.5',
    grade: 4,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      // beginner: up to 3-digit × 1-digit; advanced: 4-digit × 1-digit or 2×2
      beginner: { minA: 10, maxA: 999, minB: 2, maxB: 9, twoByTwo: 0 },
      advanced: { minA: 10, maxA: 9999, minB: 2, maxB: 99, twoByTwo: 1 },
    },
    generatorId: 'arithmetic-two-operand',
  },
  {
    code: 'NY-4.NBT.6',
    grade: 4,
    domain: 'Number & Operations in Base Ten',
    mathValleyTopics: ['number-operations-base-ten'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { minDividendDigits: 2, maxDividendDigits: 3, minDivisor: 2, maxDivisor: 5, allowRemainder: 0 },
      advanced: { minDividendDigits: 3, maxDividendDigits: 4, minDivisor: 2, maxDivisor: 9, allowRemainder: 1 },
    },
    generatorId: 'arithmetic-two-operand',
  },

  // ── Grade 4 — Measurement ──────────────────────────────────────────────
  {
    code: 'NY-4.MD.1',
    grade: 4,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxFromValue: 10 },
      advanced: { maxFromValue: 100 },
    },
    generatorId: 'measurement',
  },
  {
    code: 'NY-4.MD.2',
    grade: 4,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxResult: 100, steps: 1 },
      advanced: { maxResult: 500, steps: 2 },
    },
    generatorId: 'measurement',
  },

  // ── Grade 4 — Geometric measurement (area/perimeter/angles; MD append) ─
  {
    code: 'NY-4.MD.3',
    grade: 4,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxSide: 12 },
      advanced: { maxSide: 40 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-4.MD.5',
    grade: 4,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    // Stratify a/b inside the generator.
    difficultyParams: {
      beginner: { simpleFractions: 1 },
      advanced: { simpleFractions: 0 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-4.MD.6',
    grade: 4,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { step: 10 },
      advanced: { step: 1 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-4.MD.7',
    grade: 4,
    domain: 'Measurement & Data',
    mathValleyTopics: ['measurement-data'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxParts: 2 },
      advanced: { maxParts: 3 },
    },
    generatorId: 'geometry',
  },

  // ── Grade 4 — Geometry (Skyfire Observatory) ─────────────────────────────
  {
    code: 'NY-4.G.1',
    grade: 4,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { inFigures: 0 },
      advanced: { inFigures: 1 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-4.G.2',
    grade: 4,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    // Stratify a–c inside the generator.
    difficultyParams: {
      beginner: { nearBoundary: 0 },
      advanced: { nearBoundary: 1 },
    },
    generatorId: 'geometry',
  },
  {
    code: 'NY-4.G.3',
    grade: 4,
    domain: 'Geometry',
    mathValleyTopics: ['geometry'],
    supportedTypes: ['multiple-choice', 'true-false', 'short-answer'],
    difficultyParams: {
      beginner: { multiAxis: 0 },
      advanced: { multiAxis: 1 },
    },
    generatorId: 'geometry',
  },

  // ── Grade 3 — Number & Operations — Fractions ──────────────────────────
  // Parent codes (lettered 2a/2b, 3a–d sampled as variety inside each parent).
  {
    code: 'NY-3.NF.1',
    grade: 3,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer', 'true-false'],
    difficultyParams: {
      beginner: { maxDenom: 4, maxNumerator: 3 },
      advanced: { maxDenom: 8, maxNumerator: 7 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-3.NF.2',
    grade: 3,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxDenom: 4, maxNumerator: 3 },
      advanced: { maxDenom: 8, maxNumerator: 7 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-3.NF.3',
    grade: 3,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer', 'true-false'],
    difficultyParams: {
      beginner: { maxDenom: 4, maxWhole: 2 },
      advanced: { maxDenom: 8, maxWhole: 4 },
    },
    generatorId: 'fractions',
  },

  // ── Grade 4 — Number & Operations — Fractions ──────────────────────────
  {
    code: 'NY-4.NF.1',
    grade: 4,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer', 'true-false'],
    difficultyParams: {
      beginner: { maxDenom: 8, maxFactor: 3 },
      advanced: { maxDenom: 12, maxFactor: 5 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-4.NF.2',
    grade: 4,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxDenom: 8 },
      advanced: { maxDenom: 12 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-4.NF.3',
    grade: 4,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxDenom: 8, mixed: 0 },
      advanced: { maxDenom: 12, mixed: 1 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-4.NF.4',
    grade: 4,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer', 'true-false'],
    difficultyParams: {
      beginner: { maxDenom: 8, maxNumerator: 4, maxWhole: 4 },
      advanced: { maxDenom: 12, maxNumerator: 8, maxWhole: 6 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-4.NF.5',
    grade: 4,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxTenths: 5 },
      advanced: { maxTenths: 9 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-4.NF.6',
    grade: 4,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxHundredths: 50 },
      advanced: { maxHundredths: 99 },
    },
    generatorId: 'fractions',
  },
  {
    code: 'NY-4.NF.7',
    grade: 4,
    domain: 'Number & Operations — Fractions',
    mathValleyTopics: ['number-operations-fractions'],
    supportedTypes: ['multiple-choice', 'short-answer'],
    difficultyParams: {
      beginner: { maxHundredths: 50 },
      advanced: { maxHundredths: 99 },
    },
    generatorId: 'fractions',
  },
]

const byCode = new Map(STANDARDS_REGISTRY.map((s) => [s.code, s]))

export function getStandard(code: string): StandardConfig | undefined {
  return byCode.get(code)
}

export function getStandardsByGrade(grade: Grade): StandardConfig[] {
  return STANDARDS_REGISTRY.filter((s) => s.grade === grade)
}

export function listStandardCodes(): string[] {
  return STANDARDS_REGISTRY.map((s) => s.code)
}

