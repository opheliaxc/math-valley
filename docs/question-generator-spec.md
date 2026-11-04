# Question Generator — Feature Spec

## 1. Purpose

A standalone, reusable question-generation engine for Math Valley. Given a **grade**, a **NYS standard**, and a **difficulty**, it produces an accurate, randomly-varied math question (multiple choice, true/false, or short answer) each time it's called.

This is built and tested **detached from the main Math Valley app** for now, via its own testing page. It will later be wired into Math Valley's session/difficulty engine (see Section 9, Open Questions).

Reference: `nys-math-standards-grades-1-4.md` (already created) is the source of truth for standard codes, domains, and grade-level expectations.

## 2. Scope (v1)

Covers only Math Valley's v1 topic areas — **Fractions and Geometry are explicitly out of scope** for now.

| Math Valley topic | NYS standards included in v1 |
| --- | --- |
| Addition & subtraction | `NY-1.OA.1`, `NY-1.OA.2`, `NY-1.OA.6`, `NY-1.NBT.4`, `NY-1.NBT.6`, `NY-2.OA.1a`, `NY-2.OA.1b`, `NY-2.OA.2a`, `NY-2.NBT.5`, `NY-2.NBT.6`, `NY-2.NBT.7`, `NY-3.NBT.2`, `NY-4.NBT.4` |
| Multiplication & division | `NY-2.OA.4` (foundational/beginner-only), `NY-3.OA.1`, `NY-3.OA.2`, `NY-3.OA.3`, `NY-3.OA.7`, `NY-4.OA.1`, `NY-4.OA.2`, `NY-4.NBT.5`, `NY-4.NBT.6` |
| Word problems | `NY-1.OA.1`, `NY-2.OA.1a`, `NY-2.OA.1b`, `NY-3.OA.3`, `NY-3.OA.8`, `NY-4.OA.3` |
| Time, money, measurement | `NY-1.MD.3a`, `NY-1.MD.3b`, `NY-1.MD.3c`, `NY-2.MD.1`, `NY-2.MD.7`, `NY-2.MD.8`, `NY-3.MD.1`, `NY-3.MD.2`, `NY-4.MD.1`, `NY-4.MD.2` |

**Note:** some standards (e.g., `NY-3.OA.3`) naturally serve both "multiplication & division" and "word problems" — a standard can be tagged under more than one Math Valley topic.

## 3. Difficulty Model

Two levels per standard, **not** a separate grade-shift:

- **Beginner** — the same skill the standard describes, using the smaller end of the number range and single-step structure.
- **Advanced** — the same skill, using the larger end of the number range, and (where the standard allows) multi-step or more complex structure.

Example — `NY-3.NBT.2` (fluently add/subtract within 1,000):
- Beginner: addends/minuends under 100, no regrouping required.
- Advanced: addends/minuends up to 999, regrouping likely required.

Exact number ranges per standard are defined in the Standard Registry (Section 5) — these are starting defaults and can be tuned without changing the engine's architecture.

## 4. Question Types

Three supported types:

- **`multiple-choice`** — prompt + 4 options (1 correct, 3 distractors), single correct index.
- **`true-false`** — a math statement (equation, fact, or claim) the learner judges true or false.
- **`short-answer`** — prompt + an expected answer (numeric or short string) checked by exact match after normalization (trim, case-insensitive for units).

**Type selection:** each standard in the registry declares which type(s) it supports (not every standard suits every type — e.g., "tell the time to the nearest minute" doesn't suit true/false well). When the caller doesn't specify a type, the generator picks randomly among that standard's supported types. The caller *can* pass an explicit type to override.

## 5. Standard Registry

A central config (`standards-registry.ts`) is the single source of truth mapping each standard to its generation behavior. Each entry:

```ts
interface StandardConfig {
  code: string;              // "NY-3.NBT.2"
  grade: 1 | 2 | 3 | 4;
  domain: string;            // "Number & Operations in Base Ten"
  mathValleyTopics: string[]; // ["addition-subtraction"]
  supportedTypes: QuestionType[]; // e.g. ["multiple-choice", "short-answer"]
  difficultyParams: {
    beginner: Record<string, number | [number, number]>;
    advanced: Record<string, number | [number, number]>;
  };
  generatorId: string;        // which generator function family handles this standard
}
```

Each `generatorId` maps to one function in `/generators/` that knows how to:
1. Roll random parameters within the requested difficulty's ranges.
2. Compute the correct answer.
3. Build the prompt text (with randomized wording/context where applicable).
4. Build type-specific output (options for MC, true/false statement, or short-answer key).

Generators are grouped by **skill family** rather than one-per-standard where the underlying logic is shared — e.g., a single "two-operand arithmetic" generator family can serve several addition/subtraction standards across grades, parameterized differently by the registry. This keeps the generator count manageable while staying data-driven per standard.

## 6. Output Contract

Every call to the generator returns one object of this shape:

```ts
interface GeneratedQuestion {
  id: string;                 // unique per generation (uuid)
  standard: string;           // "NY-3.OA.3"
  grade: 1 | 2 | 3 | 4;
  topic: string;               // "multiplication-division"
  difficulty: "beginner" | "advanced";
  type: "multiple-choice" | "true-false" | "short-answer";
  prompt: string;              // the question text shown to the learner
  correctAnswer: string;       // normalized correct answer (string form)
  options?: string[];          // present only for multiple-choice, length 4
  correctOptionIndex?: number; // present only for multiple-choice
  explanation: string;         // one-line plain-language explanation of the answer
  seed?: number;               // present if generated with an explicit seed (for reproducibility in tests)
}
```

## 7. Correctness & Randomness Requirements

- **Accuracy is non-negotiable:** every generator must compute its own correct answer programmatically from the same randomized parameters used to build the prompt — never a hardcoded or separately-typed answer that could drift out of sync.
- **No degenerate cases:** generators must avoid trivial or malformed outputs — e.g., subtraction that produces a negative result unless the standard explicitly allows it; division that doesn't divide evenly unless the standard is testing remainders; multiple-choice questions where two options are identical.
- **Distractor quality (multiple-choice):** wrong answers should be *plausible*, generated from common error patterns relevant to the skill (e.g., an off-by-one, a forgotten regroup, swapped digits, wrong operation applied) — not random unrelated numbers. All 4 options must be unique.
- **Randomization:** every call should be capable of producing a different question — varied numbers, and where applicable, varied word-problem context (names, objects, settings) drawn from a small rotating vocabulary bank to avoid repetitive phrasing.
- **Optional seeding:** the generator should accept an optional `seed` parameter that makes output reproducible — needed for automated tests and for reliably reproducing a bug report.

## 8. Testing Page (standalone)

A separate, minimal app — not part of Math Valley's main UI yet — for manually and automatically exercising the generator.

**Location:** new top-level folder, e.g. `/question-generator/` (own `package.json`, own Vite dev server), kept separate from the main app's source tree until integration.

**Manual testing view:**
- Dropdowns: Grade (1–4) → Standard (filtered to that grade) → Difficulty (beginner/advanced) → Type (auto / force a specific type).
- "Generate" button → renders the resulting question exactly as a learner would see it (prompt, options if MC, an input box if short-answer, true/false buttons if true/false).
- A "Reveal answer" toggle showing `correctAnswer` and `explanation`.
- A "Generate 20" button that lists 20 questions back-to-back for the current selection, so number-range and variety issues are easy to eyeball at once.

**Automated checks view:**
- A "Run validation suite" button that, for every standard × difficulty × supported type combination, generates N questions (e.g., 50) and asserts:
  - the computed `correctAnswer` is mathematically correct (independently re-derived from the prompt's parameters where feasible),
  - multiple-choice options are unique and exactly one matches `correctAnswer`,
  - no negative/degenerate outputs slip through,
  - prompts don't contain unresolved template placeholders.
- Results displayed as a pass/fail table per standard, with failure details (the offending generated question) shown inline for debugging.

## 9. Open Questions / Assumptions Going In

These are reasonable defaults chosen to keep the spec buildable — flag any of these back if they should change before Cursor starts:

1. **Number ranges per standard/difficulty** are my starting defaults (drafted from the standard's own grade-level number range, split roughly in half between beginner/advanced). These are easy to tune later and shouldn't block starting implementation.
2. **Word-problem vocabulary** (names, objects, settings used in prompts) will be a small hardcoded rotating bank (e.g., 10–15 names, 10–15 objects) — expandable later, not meant to be exhaustive in v1.
3. **Short-answer checking** assumes exact-match string comparison after trimming/case-normalization — no partial credit or fuzzy matching in v1.
4. **Relationship to Math Valley's existing adaptive difficulty tiers** (from the original design doc, which described multiple fine-grained tiers) is left open: this two-level (beginner/advanced) system is likely a simplification of that concept for now. How the two reconcile — e.g., beginner/advanced becoming the two ends of the tier ladder — is a decision for when this gets integrated into the main app, not for this standalone phase.
5. **Tech stack:** TypeScript throughout (matches Math Valley's stack), pure functions with no side effects, no external content/data dependencies beyond the registry and vocabulary banks defined in this project.

## 10. Suggested File Structure

```
/question-generator/
  package.json
  src/
    types.ts                    # QuestionType, Difficulty, GeneratedQuestion, StandardConfig
    standards-registry.ts       # the Standard Registry (Section 5)
    vocabulary.ts               # names/objects/settings for word problems
    generators/
      arithmetic-two-operand.ts # shared addition/subtraction/multiplication/division family
      word-problem.ts           # word-problem wrapping logic
      time.ts
      money.ts
      measurement.ts
    engine.ts                   # generateQuestion({ grade, standard, difficulty, type? }) — the public entry point
    validate.ts                 # the automated-check logic used by the testing page
  test-app/                     # the standalone testing page (Section 8)
    index.html
    src/App.tsx
```

## 11. Example Call

```ts
const question = generateQuestion({
  grade: 3,
  standard: "NY-3.OA.3",
  difficulty: "beginner",
  // type omitted — engine picks randomly among NY-3.OA.3's supported types
});

// Example result:
// {
//   id: "a1b2c3...",
//   standard: "NY-3.OA.3",
//   grade: 3,
//   topic: "multiplication-division",
//   difficulty: "beginner",
//   type: "multiple-choice",
//   prompt: "Maria has 4 bags with 3 apples in each bag. How many apples does she have in total?",
//   correctAnswer: "12",
//   options: ["7", "9", "12", "16"],
//   correctOptionIndex: 2,
//   explanation: "4 groups of 3 is 4 × 3 = 12."
// }
```
