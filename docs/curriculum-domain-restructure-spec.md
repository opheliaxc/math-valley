# Curriculum Domain Restructure — Spec

## 1. Purpose

Replace Math Valley's custom game-themed topic groupings (Addition Orchard, Multiplication Mountains, Word-Problem Woods, Time & Treasure Market) with islands that map directly to the **actual NYS Next Generation Mathematics Learning Standards domains** — the structure the standards themselves use, not an invented one.

This is a restructure of the curriculum/progression layer, **not a rebuild**. The existing app (UI, animations, profile system, Question Generator, mastery/unlock mechanics) stays in place. What changes is *how standards are grouped into islands* and *which standards exist in the curriculum at all* (Fractions is being added; Geometry stays excluded).

## 2. Decisions Made

- **Domains included, per grade:**
  | Grade | Domains (islands) |
  | --- | --- |
  | 1 | Operations & Algebraic Thinking (OA), Number & Operations in Base Ten (NBT), Measurement & Data (MD) |
  | 2 | Operations & Algebraic Thinking (OA), Number & Operations in Base Ten (NBT), Measurement & Data (MD) |
  | 3 | Operations & Algebraic Thinking (OA), Number & Operations in Base Ten (NBT), Number & Operations — Fractions (NF), Measurement & Data (MD) |
  | 4 | Operations & Algebraic Thinking (OA), Number & Operations in Base Ten (NBT), Number & Operations — Fractions (NF), Measurement & Data (MD) |

  **Geometry is excluded** at every grade (not a v1 island, same as before). **Fractions is newly included** at Grades 3–4, where the NF domain actually begins.

- **Word problems are not a separate island.** Word-problem standards fold into their home domain — almost all are OA (a few touch MD, e.g. `NY-4.MD.2`). The old "Word-Problem Woods" topic is retired; its standards simply live inside Operations & Algebraic Thinking (and MD where applicable) going forward.

## 3. What This Means for Standards Already in the Registry

Nothing about *how a standard is practiced* changes — this only changes *how standards are grouped into islands*. The existing `standards-registry.ts` entries for OA/NBT/MD standards are reused as-is; they just get regrouped by their real domain tag instead of the old custom topic tag (`addition-subtraction`, `multiplication-division`, `word-problems`, `time-money-measurement` all go away as grouping keys).

**New work required:** the Question Generator has no Fractions support yet (it was explicitly scoped out of the original build). Grade 3–4 NF standards need new generator coverage before that island can function — see Phase D.

## 4. Key Insight for Migration: Progress Doesn't Need to Move

Per-standard mastery progress (`StandardProgress`, keyed by `standardCode`) was already independent of which topic/zone a standard was grouped under. **A student's attempt history and mastery status for, say, `NY-3.NBT.2` doesn't need to change at all** — only the *island/zone assignment* (which island that standard belongs to, and which island is "active") needs to be recalculated against the new domain groupings. This makes migration much lower-risk than a full data rewrite: no mastery data is lost or needs transformation, only the topic-grouping layer gets rebuilt.

The one genuinely new thing: Grade 3–4 NF standards have **no existing progress** (they didn't exist in the app before) — they start locked, same as any new standard would for a student partway through a grade.

## 5. Domain (Island) Order

NYS doesn't mandate a cross-domain teaching order, so this is a judgment call — flag if you want it different:

**Proposed order:** Operations & Algebraic Thinking → Number & Operations in Base Ten → Measurement & Data → Number & Operations — Fractions (grades 3–4 only, after MD)

Rationale: OA and NBT are the arithmetic foundation; MD is comparatively self-contained and reinforces number sense without new abstraction; Fractions is the most conceptually demanding of the four and benefits from coming last, once base-ten and measurement thinking are solid.

## 6. Island & Standard-Item Unlock Mechanics

**No change from what's already built** — this restructure only changes *what the islands are*, not *how unlocking works*:

- Within an island, standard items unlock one at a time, in sequence.
- A standard item's Beginner level must reach mastery (8/10 correct in the most recent 10 attempts — the threshold already in place) before its Advanced level unlocks.
- Advanced must reach the same mastery threshold before the **next standard item** in that island unlocks.
- An island is mastered once its final standard item's Advanced level is mastered; the **next island** (per the order in Section 5) then unlocks.
- The first island for a student's grade/content level starts unlocked; all others start locked. (This matches the re-lock-in-sequence decision already made for cross-grade advancement.)

## 7. Island Names — Dragon-Themed, Escalating by Grade

Rather than one static name per domain, each grade gets its own naming "era" matching Lunara's own growth stages (hatchling → fledgling → young drake → elder dragon), so the world itself feels more grand as the student advances:

| Grade (Lunara's stage) | OA | NBT | MD | NF |
| --- | --- | --- | --- | --- |
| 1 — Hatchling | Hatchling Hollow | Pebble Hoard Den | Sundrop Nest | — |
| 2 — Fledgling | Ember Grove | Glimmer Hoard Caverns | Ticktock Treehouse | — |
| 3 — Young Drake | Stormwing Peaks | Dragon's Vault | Sundial Bazaar | Fraction Falls |
| 4 — Elder Dragon | Skyfire Summit | Elder's Treasury | Chrono Exchange | Crystal Shard Falls |

Purely cosmetic — doesn't block any implementation phase below. Easy to rename later; the domain key (e.g. `operations-algebraic-thinking`) is what the code keys off, the display name is just presentation data.

## 8. Phased Implementation Plan

### Phase A — Curriculum Data Re-Alignment
Rebuild `curriculum-map.ts` so islands are keyed by NYS domain (`operations-algebraic-thinking`, `number-operations-base-ten`, `number-operations-fractions`, `measurement-data`) instead of the old custom topic keys. Populate each grade's domain lists from the existing registry for OA/NBT/MD (word-problem standards simply move into OA/MD, no new data needed). NF standards are added to the map for Grades 3–4 but marked as **not yet practiceable** until Phase D delivers their generators.
**Test:** print the per-grade, per-domain standard list and check it against `nys-math-standards-grades-1-4.md` — confirm every OA/NBT/MD standard landed in the right domain and no word-problem standard was dropped.

### Phase B — Zone/Island UI Remapping
Update `zones.ts` and the per-grade zone logic (`getZonesForGrade`, `getNextZoneId`, island names/art) to reflect the new domain-based islands (Section 7 names) and the Section 5 order. Grades 1–2 show 3 islands; Grades 3–4 show 4.
**Decision:** Fraction Falls / Crystal Shard Falls appears **locked-visible** at Grades 3–4 even before Phase D ships its questions — the student sees it on the map, knows it's coming, but can't enter it yet (not hidden, unlike the Grade 1/2 Multiplication case, which is fully absent).
**Test:** create profiles at each grade, confirm the right island count/names/order appear, confirm Grades 1–2 never show a Fractions island at all, and Grades 3–4 show Fraction Falls as visibly locked (not enterable) until Phase D/E land.

### Phase C — Progress Migration
Write a one-time migration step that remaps existing `TopicProgress` records from old topic keys to new domain keys, using the Section 4 insight (per-standard progress is untouched; only grouping/active-item pointers get recalculated). For each existing profile: recompute which domain each already-mastered or in-progress standard belongs to, rebuild each domain's `activeStandardIndex` based on actual mastery state, and set island `status` (locked/unlocked/mastered) consistently with the new order.
**Test:** take a profile with some progress under the old topic structure, run the migration, and confirm no mastery data is lost — a standard that was mastered before migration is still marked mastered after, just filed under its real domain.

### Phase D — Fractions Question Generator Extension
Extend the standalone Question Generator (not the main app) to support Grade 3–4 NF standards, following the same pattern as the original generator build: add `NY-3.NF.1`, `NY-3.NF.2a/b`, `NY-3.NF.3a–d`, `NY-4.NF.1–7` (with their lettered sub-parts) to `standards-registry.ts`, build new generator function(s) for fraction equivalence, comparison, and addition/subtraction, and verify them on the existing standalone testing page before touching the main app. This is scoped and tested independently, same as the original generator was.
**Test:** using the Question Generator's own testing page, generate beginner and advanced questions for each new NF standard and manually verify correctness and variety, plus run the automated validation suite against the new standards.

### Phase E — Wire Fractions Into the Main App
Once Phase D's generators are verified, flip Fraction Falls from locked/hidden to real content in `curriculum-map.ts` and `zones.ts` for Grades 3–4. No new unlock logic needed — it uses the same mechanics as every other island.
**Test:** master Measurement & Data at Grade 3, confirm Fraction Falls unlocks and serves real, varied, correct NF questions.

### Phase F — Full Regression Pass
Walk every grade (1–4) through: correct islands appear in the correct order, correct standard items appear per island, Beginner → Advanced → next-item unlocking works, island-to-island unlocking works, and (for Grade 1→2, 2→3, 3→4) content-level advancement re-locks correctly into the new domain structure.

## 9. Open Questions / Assumptions

1. **Island names (Section 7)** are confirmed for now — easy to rename later since the domain key, not the display name, drives the logic.
2. **Fraction Falls is locked-visible, not hidden** (Section 7/Phase B) — confirmed.
3. **Domain order (Section 5)** is a judgment call, not an NYS requirement — flag if you'd rather sequence Fractions before Measurement & Data, or otherwise.
4. This spec assumes the existing mastery threshold (8/10 rolling) and re-lock-on-advancement behavior carry over unchanged — nothing here revisits those decisions.
5. Geometry remains fully out of scope — not represented anywhere in this restructure, consistent with the original v1 decision.
