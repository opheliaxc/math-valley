# Question Generator Integration — Spec

## 1. Purpose

Wire the standalone Question Generator into the main Math Valley app so that:
- Each Math Valley topic (zone) is backed by a real, ordered sequence of NYS standards.
- The app calls the generator to produce beginner/advanced questions for whatever standard the student is currently working on.
- Progress is tracked per standard, wrong answers keep resurfacing similar questions until mastered, and topics unlock in sequence as the student masters them.
- Once a student masters everything at their grade, they can advance into the next grade's content.

This is a bigger change than the generator itself, so it's broken into **five phases**, each independently buildable and testable. Do not attempt all phases in one pass — finish and verify one phase before starting the next.

## 2. Decisions Already Made (from your answers)

- **Success/mastery metric:** accuracy-based — a student masters a difficulty level for a standard once their **most recent 10 attempts** at that (standard, difficulty) contain **at least 8 correct** (80%). Both beginner and advanced must be mastered to master the standard.
- **Grade progression:** students start at their selected grade, but can advance beyond it once they've mastered everything at their current grade (Phase 4).
- **Wrong-answer handling:** queued for a future session, not an immediate in-session retry.

## 3. Design Decision: How Mastery & Remediation Combine

Rather than building two separate systems (a "batch pass/fail" system and a separate "wrong answer queue"), this spec uses **one mechanism** that satisfies both requirements at once:

- Every attempt (correct or incorrect) at a given `(standard, difficulty)` is logged.
- **Mastery** = true once the most recent 10 logged attempts contain ≥ 8 correct.
- Until a `(standard, difficulty)` is mastered, the app keeps generating **new questions for that exact standard/difficulty** whenever the student practices that topic — which is exactly "keep adding similar questions until mastered."
- Because a session is only 5–10 questions (per the original app spec) and a student is generally served questions from their **current active standard**, a wrong answer naturally doesn't get retried within the same session — it simply means that standard stays "active" and the student sees more of it in their *next* session. This satisfies "queued for a future session" without needing a separate queue data structure.
- We do keep a lightweight `missedQuestions` log (see Section 5) — not used for question selection, but reserved for a future "here's what you got wrong" review view or parent dashboard. Cheap to add now, useful later.

**Why this matters:** it keeps the system simple — one rolling accuracy log per standard/difficulty drives mastery, topic unlock, and remediation, instead of three separate systems that could drift out of sync.

## 4. Phase 0 — Curriculum Alignment

**Goal:** produce a single config that says, for each Math Valley topic, exactly which standards exist, in what order, per grade.

- Build `curriculum-map.ts`: for each of the 4 Math Valley topics (`addition-subtraction`, `multiplication-division`, `word-problems`, `time-money-measurement`), list its standards **grouped by grade**, in teaching order, reusing the standard codes already defined in the Question Generator's `standards-registry.ts` (don't redefine them — import/reference).
- Decide and record the **topic/zone unlock order**. Default (flag if you want it different): `addition-subtraction → multiplication-division → time-money-measurement → word-problems` (word problems last, since they draw on the other three skills).
- Each topic's per-grade standard list should be in a sensible teaching sequence (e.g., within Grade 3 addition/subtraction: `NY-3.NBT.2` before anything that depends on fluent addition).

**Test:** a simple script/console log that prints, for a given grade, the full ordered list of standards per topic — eyeball it against `nys-math-standards-grades-1-4.md` to confirm nothing's missing or mis-ordered.

## 5. Phase 1 — Progress Data Model

**Goal:** define and implement the data structures that track a student's progress, independent of any UI.

```ts
interface AttemptLogEntry {
  questionId: string;
  correct: boolean;
  timestamp: number;
}

interface StandardProgress {
  standardCode: string;
  beginner: { attempts: AttemptLogEntry[]; mastered: boolean };
  advanced: { attempts: AttemptLogEntry[]; mastered: boolean };
  status: "locked" | "active" | "mastered";
}

interface TopicProgress {
  topicId: string;
  grade: 1 | 2 | 3 | 4;
  standardOrder: string[];       // from curriculum-map.ts, for this topic+grade
  activeStandardIndex: number;   // which standard the student is currently working on
  status: "locked" | "unlocked" | "mastered";
}

interface StudentProgress {
  profileId: string;
  currentGrade: 1 | 2 | 3 | 4;
  topics: Record<string, TopicProgress>;      // keyed by topicId
  standards: Record<string, StandardProgress>; // keyed by standardCode
  missedQuestions: { standardCode: string; difficulty: string; prompt: string; timestamp: number }[];
}
```

**Core pure functions to implement (fully unit-testable, no UI needed):**
- `recordAttempt(progress, standardCode, difficulty, correct, questionId): StudentProgress` — appends to the attempt log (keep only the most recent 10 per standard/difficulty), recalculates `mastered`, updates `missedQuestions` if incorrect.
- `isStandardMastered(progress, standardCode): boolean` — true when both beginner and advanced are mastered.
- `isTopicMastered(progress, topicId): boolean` — true when every standard in that topic's current-grade `standardOrder` is mastered.
- `advanceActiveStandardIfNeeded(progress, topicId): StudentProgress` — when the current active standard is mastered, moves `activeStandardIndex` to the next one in `standardOrder`.

**Test:** a small script or unit test file that simulates a sequence of attempts (e.g., feed in 10 attempts, 8 correct) and asserts `mastered` flips to `true` at the right point, and stays `false` below the threshold. This should be testable with no app UI at all — just calling the functions directly.

## 6. Phase 2 — Session Integration

**Goal:** wire the generator into an actual practice session, using the progress model from Phase 1.

- A session request looks like: "give me a session for `profileId`, topic `X`."
- The session logic:
  1. Look up the student's `TopicProgress` for that topic (create it, `locked`/`unlocked`, if it doesn't exist yet).
  2. Find the active standard (`standardOrder[activeStandardIndex]`) and its `StandardProgress`.
  3. Determine which difficulty to serve next: if beginner isn't yet mastered, serve beginner; otherwise serve advanced.
  4. Call the Question Generator's `generateQuestion({ grade, standard, difficulty })` for 5–10 questions (per the original session-length spec).
  5. As the student answers each question, call `recordAttempt(...)`, then `advanceActiveStandardIfNeeded(...)`.
- If, mid-session, the active standard becomes mastered (both difficulties), the *next* question in that same session should move to the new active standard — no need to end the session early.

**Test:** a manual test page (can reuse/extend the Question Generator's existing test app) where you can pick a fake profile, start a "session" for a topic, answer questions (a simple correct/incorrect toggle is fine for testing, no real UI polish needed), and watch the progress object update in a debug panel after each answer — confirm mastery flips and the active standard advances at the right time.

## 7. Phase 3 — Topic Unlock & World-Map Wiring

**Goal:** connect topic mastery to the world-map zone system from the original app design.

- When `isTopicMastered(progress, topicId)` becomes true:
  - Mark that `TopicProgress.status = "mastered"`.
  - Unlock the next topic in the Phase 0 order (`status: "locked" → "unlocked"`).
  - Trigger the existing Lunara/zone-unlock event (from the main app's world-map system) so the visual reward fires.
- The **first** topic in the order should default to `unlocked` for a brand-new profile; all others start `locked`.

**Test:** using the Phase 2 test harness, fully "master" a topic (simulate enough correct answers across all its standards) and confirm the next topic's status flips to `unlocked` and the mastered topic's status flips to `mastered`.

## 8. Phase 4 — Cross-Grade Advancement

**Goal:** once a student has mastered every topic at their current grade, move them to the next grade.

- Define `isGradeMastered(progress): boolean` — true when every topic's `TopicProgress` (for `currentGrade`) is `mastered`.
- When true: increment `currentGrade`, and for each topic, load that topic's **next grade's** `standardOrder` from `curriculum-map.ts`, reset `activeStandardIndex` to 0, and set status back to `unlocked` (or `locked` per the Phase 0 order — decide when you get here whether advancing a grade re-locks topics in sequence again, or unlocks all topics at once since the student has already proven mastery once).
- Skip this phase entirely if `currentGrade` is already 4 (no grade 5 content).

**Test:** simulate mastering all topics at grade 1 in the test harness and confirm `currentGrade` becomes 2, with fresh grade-2 standards loaded into each topic.

## 9. Phase 5 (Optional/Later) — Missed-Question Review

Not required for core functionality, but the data (`missedQuestions` log from Phase 1) is already being collected. A later phase could add a simple "questions you found tricky" view for the student or a parent view — no design work needed now, just noting it's already supported by the data model.

## 10. Open Questions / Assumptions

1. **Topic unlock order** (Section 4) is my default suggestion — confirm or change before Phase 0.
2. **Re-locking on grade advancement** (Phase 4): whether topics re-lock in sequence again at a new grade, or all unlock at once since the student already proved they can master a full grade, is left as a decision to make when you reach Phase 4 — not a blocker before then.
3. **Mastery threshold (8/10, most-recent-10 window)** is a first default. Easy to tune later since it's isolated in one function (`recordAttempt`/mastery calculation).
4. This spec assumes progress still lives in **localStorage only**, consistent with the main app's v1 data-storage decision — no backend needed for this integration.

## 11. Suggested Order of Work

1. Phase 0 — Curriculum Alignment
2. Phase 1 — Progress Data Model
3. Phase 2 — Session Integration
4. Phase 3 — Topic Unlock & World-Map Wiring
5. Phase 4 — Cross-Grade Advancement
6. Phase 5 — deferred, no action needed now
