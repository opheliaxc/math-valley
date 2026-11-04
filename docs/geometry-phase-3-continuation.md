# Geometry — Continuation Prompt (Phases 3–4)

Paste this into a new agent chat to continue after Phase 2.

---

I'm continuing Geometry for Math Valley after **Phase 0 (visual infrastructure), Phase 1 (Grade 1), and Phase 2 (Grade 2) are done and verified**. Do **not** rebuild Phase 0–2. Extend them.

Full specs:

- `geometry-visual-questions-spec.md` (Phases 1–4, Section 5 loop, Section 6 standards, Section 7 wiring, Section 9 testing)
- `nys-math-standards-grades-1-4.md` (corrected 2026-10-07; trust it over any older copy)
- Prior continuation notes: `geometry-phase-1-continuation.md`

### Already done — reuse these

**Phase 0**

- Optional visual contract: `visual` / `altText` / picture `options` / `visualPredicate` on `GeneratedQuestion`
- SVG rendering via `renderVisual` + primitives (`src/visuals/`)
- Picture MC / T/F-with-picture / short-answer-with-picture
- Geometry math library + tolerances (`question-generator/src/geometry/`)
- Visual validation in `validate-visual.ts` / `visual-predicates.ts`
- Demo/test surfaces: `#visual-demo`, QG “Load demo picture questions” / “Show VisualSpec JSON” / “Validate visible”
- Unit scripts: `npm run test:geometry`, `npm run test:visual-validation` (from `question-generator/`)

**Phase 1 — Grade 1 Geometry (Hatchling Shape Cove)**

- Generators: `NY-1.G.1`, `NY-1.G.2`, `NY-1.G.3` in `question-generator/src/generators/geometry.ts` (+ `geometry-shapes.ts`)
- Registry + engine `generatorId: 'geometry'`
- Wired: `topics.ts` (`geometry` last), `curriculum-map.ts`, `zones.ts` (**Hatchling Shape Cove**), `tiers.ts`
- Path test: `node scripts/test-geometry-phase1.mjs`
- Partial coverage as flagged (no draw/build; G.2 is 2-D recognition only; **3-D deferred**)

**Phase 2 — Grade 2 Geometry (Ember Shapes Quarry)**

- Generators: `NY-2.G.1`, `NY-2.G.2`, `NY-2.G.3`
- Extra kinds/cuts/predicates as needed (`diagonal` partitions, `is-non-polygon`, `is-equal-thirds`, `count-grid-cells`, etc.)
- Wired: curriculum G2 geometry standards; zone **Ember Shapes Quarry**
- Path test: `node scripts/test-geometry-phase2.mjs`
- Grades 1–2 island order: OA → NBT → MD → **Geometry**

### What comes next

| Phase | Scope |
| --- | --- |
| **3** | Grade 3: `NY-3.G.1`, `NY-3.G.2` + MD area/perimeter `NY-3.MD.5–8` (MD island, **appended**) — Geometry island **Dragon's Forge** |
| **4** | Grade 4: `NY-4.G.1–3` + MD `NY-4.MD.3`, `NY-4.MD.5–7` — **Skyfire Observatory** |
| Final | Regression across all grades |

Geometry island is **last** in island order. Grades 3–4: OA → NBT → MD → NF → **Geometry**. Area/perimeter/angle standards live under **measurement-data**, appended to the end of that chain — not on the Geometry island.

No locked Geometry placeholders before a grade is wired (empty curriculum rows = hidden).

### Per-grade loop (strict — Section 5)

For each grade, in order:

1. **Verify** — read official text; confirm parent-code granularity + stratified sub-parts; confirm/change before building
2. **Generate** — generators + registry config; test on standalone QG page
3. **Validate** — extended validation suite must pass
4. **Wire** — curriculum map, registry, island, names, unlock order (MD appends for area/perimeter/angles)
5. **Test and stop** — full path (Section 9); wait for approval before next grade

### How we work together

1. One grade phase at a time; within a phase, one loop step at a time (verify → generate → validate → wire → test).
2. Before each step: 1–2 plain sentences on what you'll do and why.
3. After each step: simple explanation + exact how-to-test; then **STOP** and wait for **go**.
4. If ambiguous or touching more files than expected, stop and ask.

### Rules that still hold

- **Extend, don't rebuild** Phase 0–2 / Fraction / QG / curriculum systems.
- **Backward compatible:** text-only questions unchanged; visual fields optional.
- **Answers from geometry:** generate shapes from coords/params, compute the answer; never label then draw to match. Use `visualPredicate` + geometry utils.
- **No ambiguous pictures:** redraw if inside tolerance margins (Section 4.2 / `GEOMETRY_TOLERANCE`).
- **Seeded & deterministic.**
- **Alt text from VisualSpec**, never hand-written per question (`visual-alt-text.ts`).
- **Picture options:** large touch targets; `correctAnswer` = option `id`.
- Do **not** change how answers are stored/compared/recorded in progress/mastery.
- **Partial coverage** as flagged in Section 6/11 (no draw/build; partitioning action not assessed where flagged).
- Out of scope: clocks, graphs, number lines, line plots, rulers (other MD picture standards).
- Trust corrected NYS / geometry spec: **`NY-3.G.1` is sides/vertices polygons** (triangles, quadrilaterals, pentagons, hexagons) — **not** quadrilateral categories. If `nys-math-standards-grades-1-4.md` still says rhombus/rectangle/square categories for `NY-3.G.1`, trust the geometry spec Section 3/6 correction.
- Stratify lettered sub-parts evenly inside parent items (e.g. `NY-3.MD.7` a–d, `NY-3.MD.8` a–b).

### Practice reminder (for humans)

- Student world map: repo root `npm run dev` (not `question-generator/` alone).
- Geometry unlocks **after** prior islands at that grade.
- QG page (`question-generator` → `npm run dev`) is for Generate/Validate testing only.

### Start now

**Phase 3, loop step 1 only (Verify)** for Grade 3:

- Geometry island: `NY-3.G.1`, `NY-3.G.2` → **Dragon's Forge**
- MD appends: `NY-3.MD.5`, `NY-3.MD.6`, `NY-3.MD.7` (a–d), `NY-3.MD.8` (a, b)

Read Section 6 of `geometry-visual-questions-spec.md` + relevant NYS text. Confirm item granularity (parent codes + stratified sub-parts) and question patterns. Report what you'll build (and any confirms/changes needed). **No code changes in the verify step.** Then stop and wait for **go** before Generate.
