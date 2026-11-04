# Geometry & Visual Questions — Spec

## 1. Purpose

Add Geometry to Math Valley, one grade at a time (Grade 1 → 4), including the geometric-measurement standards (area, perimeter, angles) that live under Measurement & Data. Almost every question here needs a picture, so this spec starts with shared visual infrastructure (Phase 0), then adds one grade per phase.

Like the Fractions work, each grade is a full vertical slice: verified standards → generators tested on the standalone Question Generator page → wired into the main app → tested end to end. Do not start a grade until the previous one is verified.

Reference: `nys-math-standards-grades-1-4.md` (geometry sections corrected on 2026-10-07 against the official NYSED PDFs; see Section 3).

## 2. Decisions Made

1. **Geometry island is appended at the end** of each grade's island order. Grades 1–2: OA → NBT → MD → **Geometry**. Grades 3–4: OA → NBT → MD → NF → **Geometry**.
2. **Scope follows the standards.** Any standard that is geometric or needs a geometric picture is included: the Geometry (G) domain, plus area, perimeter, and angle standards from MD.
3. **Partial coverage is accepted for now** where a standard asks the student to draw, build, sketch, or compose, which our MC / true-false / short-answer model cannot assess. These are flagged per standard (Section 6) and tracked as an open item (Section 11, item 1).

## 3. Corrections Found While Verifying (already applied to the reference file)

The earlier reference file was wrong in these places. Cursor should rely on the corrected file or the official text below, never the old version:

| Standard | Earlier file said | Official NYS text |
| --- | --- | --- |
| `NY-3.G.1` | Quadrilateral categories (rhombus, rectangle, square) | Recognize and classify **polygons by number of sides and vertices** (triangles, quadrilaterals, pentagons, hexagons) |
| `NY-4.G.2` | One standard: classify by parallel/perpendicular lines or angle type | **Three** parts: (a) triangles by angle size, (b) parallelograms, (c) rectangles |
| `NY-3.MD.8` | One standard | Two parts: (a) perimeter problems, (b) same perimeter / different area |
| `NY-3.MD.7` | Parts a–c | Parts a–**d** (d = area is additive, composite rectangles) |
| `NY-4.MD.5` | One standard | Two parts: (a) angle as fraction of a circle, (b) n one-degree angles |

Sections for Grade 4 OA / NBT / NF were reconstructed from fragments and have not been re-verified line by line. Out of scope here, but worth a verification pass.

## 4. Phase 0 — Visual Question Infrastructure

**Goal:** make the generator and the app able to create, validate, and display picture-based questions. No standards are added in this phase.

### 4.1 Output contract additions (backward compatible)

```ts
type QuestionOption =
  | string                                   // existing text options keep working
  | { id: string; text?: string; visual?: VisualSpec; altText: string };

interface GeneratedQuestion {
  // ...all existing fields unchanged...
  visual?: VisualSpec;     // picture shown with the prompt
  altText?: string;        // generated from the VisualSpec, never hand-written per question
  options?: QuestionOption[];
}
```

- `correctAnswer` stays a string. For picture options it is the option `id`.
- `VisualSpec` is a data description of the picture, not an image. It is rendered by SVG components and re-read by the validator. Kinds are added per grade as needed, for example `polygon`, `partitioned-shape`, `grid`, `lines`, `angle`, `protractor-angle`, `rect-composite`, `symmetry-figure`.

### 4.2 Core principles

- **Answer comes from the geometry.** Generate shapes from coordinates or integer parameters, then compute the answer with geometry functions (shoelace area, cross product for parallel, dot product for perpendicular, reflection for symmetry). Never assign a label and then draw to match it.
- **No ambiguous pictures.** Every predicate has a tolerance margin. Examples: angles classified acute ≤ 75°, right = exactly 90°, obtuse ≥ 105°; lines are exactly parallel or at least 10° apart; "unequal" partitions differ in area by at least 25%; "open" shapes have a visible gap. If a random draw lands in a margin, redraw.
- **Exactly one correct picture option** unless the question is explicitly "select all". The validator recomputes the predicate on every option's `VisualSpec` and fails if the count is not as intended. This matters most for nested categories (a rectangle is also a parallelogram), so wording and distractors must follow the NYS definitions.
- **Seeded and deterministic.** Same seed produces the same picture.
- **Accessible.** Each picture and picture option has generated alt text (for example "a triangle with sides 3, 4, 5"). Color is never the only cue, except in `NY-1.G.1` where color is deliberately a non-defining attribute.
- **Touch-friendly.** Picture options are large tap targets and work at phone width.

### 4.3 Steps

1. Inspect how questions are rendered today (question card, MC buttons, true/false, short-answer, test page, debug panels). Report before changing anything.
2. Add the contract types and a `renderVisual` entry point; existing text-only questions must look and behave exactly as before.
3. Build SVG primitives (polygon, circle/arc, grid, line/ray/segment, angle with arc, protractor) plus a demo page showing each at several sizes and rotations.
4. Build picture-option rendering for MC, true/false with a picture, and short-answer with a picture. Tap targets sized for tablets.
5. Build the geometry utility library (polygon area, simple-polygon check, collinearity guard, angle between vectors, parallel/perpendicular predicates, reflection, minimum-difference guards) with unit tests.
6. Extend the validation suite: re-derive the answer from the `VisualSpec`, check exactly-one-correct, check options are structurally distinct, check no `VisualSpec` sits inside a tolerance margin.
7. Extend the standalone test page: "Generate 20" must show the pictures; add a "show VisualSpec JSON" toggle for debugging.

**Test:** on the standalone page, render each primitive, then generate a few dummy picture questions and confirm validation catches a deliberately broken one (for example two correct options).

## 5. Per-Grade Loop (applies to Phases 1–4)

For each grade:

1. **Verify.** Read the official text for the grade's standards (Section 6 has it). Confirm item granularity: default is **one progression item per parent code** (for example `NY-3.MD.7`), with sub-parts covered inside that item. The generator must **sample sub-parts evenly (stratified)** so mastery cannot come from the easiest sub-part alone. Confirm or change before building.
2. **Generate.** Build generators and config in the standalone Question Generator and test on its page.
3. **Validate.** Run the extended validation suite on the new standards.
4. **Wire.** Add the standards to the curriculum map and registry, add the island, names, and unlock order in the main app.
5. **Test and stop.** Full path test (below), then wait for approval before the next grade.

**Default for island visibility:** a grade's Geometry island appears only once that grade's standards are wired. No locked placeholders (unlike Fractions), because each grade ships complete before the next starts.

**Beginner vs Advanced** stays within the standard's boundaries. Beginner: fewer shape families, upright orientation, clearly different distractors. Advanced: rotation, unusual proportions, near-miss distractors (still outside the tolerance margins), more categories or steps. Never a higher-grade concept.

## 6. Standards, Question Patterns, and Coverage

Official wording below is quoted or closely abridged from the NYSED standards. "Coverage" says what the app can assess; the rest is the partial-coverage open item.

### Grade 1 — Geometry island

| Standard | Official text (abridged) | Question patterns | Types | Beginner → Advanced | Coverage |
| --- | --- | --- | --- | --- | --- |
| `NY-1.G.1` | Distinguish defining attributes from non-defining attributes for a wide variety of shapes. Build and/or draw shapes to possess defining attributes. | "Which shape is a triangle?" (picture options); "Is this a triangle?" with the shape recolored/resized/rotated; "Which helps tell it's a triangle: 3 sides, red color, big?"; "How many sides?" | MC, T/F, short | Upright triangle/square/rectangle/circle, obvious distractors → rotated, long/thin, scalene, plus trapezoid/hexagon, open figures as distractors | **Partial**: build/draw not assessed |
| `NY-1.G.2` | Compose 2-D shapes (rectangles, squares, trapezoids, triangles, half-circles, quarter-circles) or 3-D shapes (cubes, right rectangular prisms, right circular cones, right circular cylinders) to create a composite shape, and compose new shapes from the composite. No formal 3-D names required. | "Which two shapes make this rectangle?"; "How many triangles make this shape?"; "Which composite can be made from these pieces?" | MC (pictures), short | Two-piece composites → three or more pieces, new shape from a composite | **Partial**: composing is interactive; 2-D recognition only; **3-D deferred** (needs 3-D rendering) |
| `NY-1.G.3` | Partition circles and rectangles into two and four equal shares; use halves, fourths, quarters, "half of", "fourth of", "quarter of"; describe the whole as two of, or four of, the shares; more equal shares make smaller shares. | "Which shows halves?"; "This is split into __ equal shares"; "Is this split into fourths?"; "How many fourths make the whole?"; "Which is bigger, a half or a fourth of the same shape?" | MC (pictures), T/F, short | Halves only, clear unequal distractors → fourths, varied cut directions (rectangle strips, 2×2, circle quarters), near-miss unequal distractors | **Largely full**; physically drawing the partition is not assessed |

### Grade 2 — Geometry island

| Standard | Official text (abridged) | Question patterns | Types | Beginner → Advanced | Coverage |
| --- | --- | --- | --- | --- | --- |
| `NY-2.G.1` | Classify two-dimensional figures as polygons or non-polygons. | "Is this a polygon?"; "Which is NOT a polygon?" | T/F, MC (pictures) | Obvious cases (circle, open V, triangle, square) → irregular and concave polygons, near-closed figures with a clearly visible gap, one curved side | Full |
| `NY-2.G.2` | Partition a rectangle into rows and columns of same-size squares and count to find the total. | "How many squares cover this rectangle?"; "3 rows of 4 squares: how many?" | short, MC, T/F | Grids up to about 3×4 → up to about 5×6 (counting, not multiplication; tunable) | Full |
| `NY-2.G.3` | Partition circles and rectangles into two, three, or four equal shares; use halves, thirds, "half of", "a third of"; describe the whole as two halves, three thirds, four fourths; equal shares of identical wholes need not have the same shape. | "Which shows thirds?"; "Each of 4 equal shares is a ___"; "Two equal shares that look different: true or false?" | MC (pictures), T/F, short | Halves and fourths, same-shape shares → thirds, differently shaped equal shares (for example a square halved by a vertical line vs a diagonal), near-miss unequal distractors | **Largely full**; drawing the partition not assessed |

### Grade 3 — Geometry island, plus area/perimeter in the MD island

| Standard | Official text (abridged) | Question patterns | Types | Beginner → Advanced | Coverage |
| --- | --- | --- | --- | --- | --- |
| `NY-3.G.1` | Recognize and classify polygons based on the number of sides and vertices (triangles, quadrilaterals, pentagons, hexagons). Regular and irregular; formal terms not required. Identify shapes that do not belong to given subcategories. | "How many sides/vertices?"; "What is this polygon called?"; "Which shape does not belong?"; "This is a hexagon: true or false?" | short, MC, T/F | Regular, upright → irregular, rotated, concave, "does not belong" sets | Full. Guard: simple polygons only, no near-collinear vertices, so the side count is unambiguous |
| `NY-3.G.2` | Partition shapes into parts with equal areas. Express the area of each part as a unit fraction of the whole. | "Split into 4 equal parts: what fraction is each part?" (uses `<Fraction>`); "Which shape is split into equal areas?"; "Shaded part is 1/3: true or false?" | short, MC, T/F | 2, 3, 4 parts on rectangles/circles → 6 and 8 parts, irregular equal-area parts on a grid | **Partial**: partitioning action not assessed. Denominators limited to 2, 3, 4, 6, 8 |
| `NY-3.MD.5` (a, b) *(MD island)* | Recognize area as an attribute of plane figures; a unit square has one square unit of area; a figure covered by n unit squares without gaps or overlaps has area n square units. | "A figure covered by 12 unit squares has what area?"; "What is the area of one unit square?" | MC, T/F, short | Plain grids → unit labels (square cm, in.), figures that do or don't tile without gaps | Full |
| `NY-3.MD.6` *(MD island)* | Measure areas by counting unit squares (square cm, m, in., ft, improvised units). | "Count the squares: what is the area?" | short, MC | Full rectangles up to 20 squares → L-shaped and irregular grid figures up to about 30 | Full |
| `NY-3.MD.7` (a–d) *(MD island)* | (a) Area of a rectangle by tiling equals the product of side lengths; (b) multiply side lengths in real-world and math problems; (c) area of a rectangle with sides a and b + c equals a × b + a × c; (d) area is additive: figures composed of non-overlapping rectangles, no more than one unknown side length. | "What is the area?" (labeled rectangle); "Which expression matches this area model?"; "What is the total area of this L-shape?"; "Find the unknown side" | short, MC | 7a/7b with sides up to 10 and products within 100 → 7c area models and 7d composite figures | **Partial**: "show by tiling" is manipulative; assessed numerically. Stratify across a–d |
| `NY-3.MD.8` (a, b) *(MD island)* | (a) Perimeters of polygons, including finding perimeter from side lengths or one unknown side from the perimeter and other sides; (b) identify rectangles with the same perimeter and different areas, or the same area and different perimeters. | "What is the perimeter?"; "Find the missing side"; "Which rectangle has the same perimeter but a different area?" | short, MC | Triangles/rectangles, all sides given → pentagons/hexagons, unknown side, comparison items | Full |

### Grade 4 — Geometry island, plus area/perimeter/angles in the MD island

| Standard | Official text (abridged) | Question patterns | Types | Beginner → Advanced | Coverage |
| --- | --- | --- | --- | --- | --- |
| `NY-4.G.1` | Draw points, lines, line segments, rays, angles (right, acute, obtuse), and perpendicular and parallel lines. Identify these in two-dimensional figures. | "Which picture shows a ray?"; "What is this figure called?"; "Which angle is obtuse?"; "Which lines are parallel/perpendicular?"; "How many right angles does this figure have?" | MC (pictures), T/F, short | One clear figure → identifying within polygons and crossing-line diagrams with labeled points | **Partial**: drawing not assessed |
| `NY-4.G.2` (a–c) | (a) Identify and name triangles by angle size (right, obtuse, acute); (b) quadrilaterals with 2 pairs of parallel sides are parallelograms; (c) quadrilaterals with four right angles are rectangles. | "What type of triangle is this?"; "Is this a parallelogram?"; "Which of these are rectangles?" | MC, T/F | Clear examples → near-boundary angles (outside tolerance), mixed sets. Stratify across a–c | Full. Guard: a rectangle also has 2 pairs of parallel sides, so a rectangle can never be a "not a parallelogram" distractor. Validator checks the predicate on every option |
| `NY-4.G.3` | Recognize a line of symmetry as a line across the figure such that the figure can be folded along it into matching parts. Identify line-symmetric figures and draw lines of symmetry. | "Is the dashed line a line of symmetry?"; "Which figure has a line of symmetry?"; "How many lines of symmetry does this shape have?" | T/F, MC, short | Single clear axis → figures with several axes, near-symmetric distractors (off by at least one grid unit) | **Partial**: drawing lines not assessed. Use integer grid coordinates so reflection is exact |
| `NY-4.MD.3` *(MD island)* | Apply the area and perimeter formulas for rectangles in real-world and mathematical problems. | "Area/perimeter of this rectangle"; "Find the unknown side from the area or perimeter" | short, MC | Both sides given → unknown side, larger multi-digit sides (within Grade 4 multiplication limits) | Full |
| `NY-4.MD.5` (a, b) *(MD island)* | (a) An angle is measured with reference to a circle centered at the common endpoint of the rays, by the fraction of the circular arc between where the rays meet the circle; (b) an angle that turns through n one-degree angles has an angle measure of n degrees. | "What fraction of the circle does this angle's arc cover?" (uses `<Fraction>`); "An angle turns through 45 one-degree angles: what is its measure?" | short, MC, T/F | Quarter/half circle arcs → other fractions of a circle | Full. The 360-degree full-circle fact is assumed by the standard; confirm wording in the Grade 4 verify step |
| `NY-4.MD.6` *(MD island)* | Measure angles in whole-number degrees using a protractor. Sketch angles of specified measure. | Protractor picture with the angle: "What is the measure?" | short, MC | Multiples of 10, one scale → any whole degree, reading the correct scale | **Partial**: sketching not assessed |
| `NY-4.MD.7` *(MD island)* | Angle measure is additive; solve addition and subtraction problems to find unknown angles on a diagram in real-world and mathematical problems. | "A 90° angle is split into 35° and ?: find ?" | short, MC | Two parts, one unknown, totals up to 180° → three parts, up to 180° (limits tunable) | Full |

## 7. App Wiring (per grade, step 4 of the loop)

- Add a `geometry` domain key. Add the grade's standards to `curriculum-map.ts` and `standards-registry.ts`. Area/perimeter/angle standards go in `measurement-data` (their real NYS domain), appended to the end of that chain.
- `getZoneTopicIdsForGrade` returns Geometry last (after Fractions at Grades 3–4).
- Island names (cosmetic, change anytime):

| Grade | Geometry island name |
| --- | --- |
| 1 | Hatchling Shape Cove |
| 2 | Ember Shapes Quarry |
| 3 | Dragon's Forge |
| 4 | Skyfire Observatory |

- Within an island, unlock mechanics are unchanged (Beginner → Advanced at 8/10 rolling → next item).

## 8. Existing Progress

There is no persistent student progress yet (the app is still in development), so **no migration work is needed**. Clearing locally stored test profiles is acceptable if old test data conflicts with the new islands, but stale test data must not crash the app.

Two rules that still matter as design:

1. **Grade-advancement gate includes Geometry.** "Grade mastered" means every island with content at that grade is mastered, so Geometry must be finished before a student advances.
2. **Area, perimeter, and angle standards** are appended to the end of the MD chain at Grades 3–4, and unlock normally in sequence.

## 9. Testing (after each grade)

- Correct islands, names, and order for that grade; Geometry appears last.
- Every new standard generates beginner and advanced questions on the standalone page; validation suite passes; "Generate 20" shows varied, correct pictures.
- Picture options and alt text render at phone and tablet width.
- Beginner → Advanced → next item unlock works; last item unlocks nothing beyond Geometry's end.
- Progress persists across reload; mastery of previously built standards is unchanged.
- Spot check by hand: 10 questions per standard checked against the picture for correctness.

## 10. Suggested Order of Work

1. Phase 0 — Visual infrastructure (7 steps above)
2. Phase 1 — Grade 1 (G.1, G.2, G.3)
3. Phase 2 — Grade 2 (G.1, G.2, G.3)
4. Phase 3 — Grade 3 (G.1, G.2 + MD.5, MD.6, MD.7, MD.8)
5. Phase 4 — Grade 4 (G.1, G.2, G.3 + MD.3, MD.5, MD.6, MD.7)
6. Final regression across all grades

## 11. Open Items

1. **Partial coverage (flagged as requested).** Not assessed today: drawing/building (`NY-1.G.1`, `NY-4.G.1`), composing (`NY-1.G.2`, recognition only), partitioning by drawing (`NY-1.G.3`, `NY-2.G.3`, `NY-3.G.2`), tiling demonstrations (`NY-3.MD.7`), drawing lines of symmetry (`NY-4.G.3`), sketching angles (`NY-4.MD.6`). A later phase could add interactive input (drag, draw, tap-to-cut) to close these.
2. **3-D shapes** in `NY-1.G.2` need 3-D rendering and are deferred.
3. **Other picture-based MD standards** are outside this spec: clocks (`NY-1.MD.3a`, `NY-2.MD.7`, `NY-3.MD.1`), rulers (`NY-2.MD.1–4`), number lines (`NY-2.MD.6`, `NY-4.MD.2`), graphs (`NY-1.MD.4`, `NY-2.MD.10`, `NY-3.MD.3`), line plots (`NY-2.MD.9`, `NY-3.MD.4`, `NY-4.MD.4`). They are not geometric, but they can reuse the Phase 0 infrastructure later.
4. **Grade-advancement gate** includes Geometry by design (Section 8). Revisit only if you want Geometry excluded.
5. **Item granularity** defaults to parent codes with stratified sampling; confirm or change in each grade's verify step.
6. **Tolerance thresholds** (angle margins, 25% unequal-area margin, grid size limits) are starting values and can be tuned.
7. **Island names** are cosmetic placeholders.
8. **Grade 4 OA / NBT / NF wording** in the reference file has not been re-verified line by line.
