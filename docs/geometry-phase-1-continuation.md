# Geometry — Continuation Prompt (Phases 1–4)

Paste this into a new agent chat to continue after Phase 0.

---

I'm continuing Geometry for Math Valley after **Phase 0 (visual infrastructure) is done and verified**. Do **not** rebuild Phase 0. Extend it.

Full specs:

- `geometry-visual-questions-spec.md` (Phases 1–4, Section 5 loop, Section 6 standards, Section 7 wiring, Section 9 testing)
- `nys-math-standards-grades-1-4.md` (corrected 2026-10-07; trust it over any older copy)

### Already done (Phase 0) — reuse these

- Optional visual contract: `visual` / `altText` / picture `options` / `visualPredicate` on `GeneratedQuestion`
- SVG rendering via `renderVisual` + primitives (`src/visuals/`)
- Picture MC / T/F-with-picture / short-answer-with-picture (`QuestionAnswerArea`, `MultipleChoiceAnswer`)
- Geometry math library + tolerances (`question-generator/src/geometry/`)
- Visual validation (exactly-one-correct, distinct specs, margin checks) in `validate-visual.ts` / `visual-predicates.ts`
- Demo/test surfaces: `#visual-demo`, QG test page “Load demo picture questions” / “Show VisualSpec JSON” / “Validate visible”
- Unit scripts: `npm run test:geometry`, `npm run test:visual-validation` (from `question-generator/`)

### What comes next

| Phase | Scope |
| --- | --- |
| **1** | Grade 1 Geometry island: `NY-1.G.1`, `NY-1.G.2`, `NY-1.G.3` — island name **Hatchling Shape Cove** |
| **2** | Grade 2: `NY-2.G.1`, `NY-2.G.2`, `NY-2.G.3` — **Ember Shapes Quarry** |
| **3** | Grade 3: `NY-3.G.1`, `NY-3.G.2` + MD area/perimeter `NY-3.MD.5–8` (MD island, appended) — **Dragon's Forge** |
| **4** | Grade 4: `NY-4.G.1–3` + MD `NY-4.MD.3`, `NY-4.MD.5–7` — **Skyfire Observatory** |
| Final | Regression across all grades |

Geometry island is **last** in island order. Grades 1–2: OA → NBT → MD → **Geometry**. Grades 3–4: OA → NBT → MD → NF → **Geometry**. No locked Geometry placeholders before a grade is wired.

### Per-grade loop (strict — Section 5)

For each grade, in order:

1. **Verify** — read official text; confirm parent-code granularity + stratified sub-parts; confirm/change before building
2. **Generate** — generators + registry config; test on standalone QG page
3. **Validate** — extended validation suite must pass
4. **Wire** — curriculum map, registry, island, names, unlock order
5. **Test and stop** — full path (Section 9); wait for approval before next grade

### How we work together

1. One grade phase at a time; within a phase, one loop step at a time (verify → generate → validate → wire → test).
2. Before each step: 1–2 plain sentences on what you'll do and why.
3. After each step: simple explanation + exact how-to-test; then **STOP** and wait for **go**.
4. If ambiguous or touching more files than expected, stop and ask.

### Rules that still hold

- **Extend, don't rebuild** Phase 0 / Fraction / QG / curriculum systems.
- **Backward compatible:** text-only questions unchanged; visual fields optional.
- **Answers from geometry:** generate shapes from coords/params, compute the answer; never label then draw to match. Use `visualPredicate` + geometry utils.
- **No ambiguous pictures:** redraw if inside tolerance margins (Section 4.2 / `GEOMETRY_TOLERANCE`).
- **Seeded & deterministic.**
- **Alt text from VisualSpec**, never hand-written per question.
- **Picture options:** large touch targets; `correctAnswer` = option `id`.
- Do **not** change how answers are stored/compared/recorded in progress/mastery.
- **Partial coverage** as flagged in Section 6/11 (no draw/build; G.2 is 2-D recognition only; **3-D deferred**).
- Out of scope: clocks, graphs, number lines, line plots, rulers (other MD picture standards).
- Trust corrected NYS file; note `NY-3.G.1` is sides/vertices polygons (not quadrilateral categories).

### Start now

**Phase 1, loop step 1 only (Verify)** for Grade 1 (`NY-1.G.1`, `NY-1.G.2`, `NY-1.G.3`).

Read Section 6 of `geometry-visual-questions-spec.md` + `nys-math-standards-grades-1-4.md`. Confirm item granularity and question patterns. Report what you'll build (and any confirms/changes needed). **No code changes in the verify step.** Then stop and wait for **go** before Generate.
