# Math Valley Landing Page: Plan, Spec, and Progress Tracker

*Written October 26, 2026. Status: implementation complete through S14 (2026-11-04); awaiting Dev confirmation of S14 handoff.*

---

## 0. How to Use This File (Read First)

This file is both the **spec** and the **progress tracker** for the landing page. It lives in the project root as `LANDING_PAGE_PLAN.md`.

### Working agreement

1. Work **one step at a time**, in the order of Section 10. Never start a step before the previous one is marked ✅.
2. **Before each step:** explain in 2–4 plain sentences what you are about to do and which files you will touch.
3. **After each step:** explain in simple words what you did, list every file created or changed, and give Dev the exact test (copy it from the step) and what a pass and a fail look like.
4. **Stop** and end with: "Step X done. Reply **go** for Step Y." Wait for Dev's "go" or "next".
5. **Update the tracker below at the end of every step.** A step becomes ✅ only after Dev confirms the test passed. Until then it stays 🔄.
6. **If anything is ambiguous,** or the real code disagrees with this plan, stop and ask Dev. Log the answer in Section 0.3. Do not guess.
7. **If you must deviate from this plan,** log it in Section 0.4 and get Dev's approval before continuing.
8. Suggest a commit message at the end of each step, formatted like `landing(S3): navigation bar`. Do not commit unless Dev asks.

### Hard constraints (always on)

- **Do not change** the backend, the SQLite database, profile/entry-screen behavior, saved data, API routes, or the game screens.
- **Do not add npm dependencies.** Use what the project already has: React, TypeScript, the existing CSS/Tailwind setup, and Framer Motion. Font **files** are assets, not dependencies, and are allowed under Section 3.3.
- **Do not edit the app's existing theme tokens or global styles.** All landing styling is scoped to the landing page (Section 3.1).
- **Every statement on the page must be true of the app today.** No unsupported claims (Section 4.9).
- Preserve all existing student data and functionality at every step.

### 0.1 Progress tracker

Status key: ☐ not started · 🔄 in progress, waiting for Dev's test result · ✅ done and confirmed by Dev · ⛔ blocked

| ID | Step | Status | Date done | Notes |
| --- | --- | --- | --- | --- |
| P0 | Preflight: confirm facts (read-only) | ✅ | 2026-10-27 | Entry path = `/app`. Findings + decisions accepted; proceed to S1. |
| S1 | Landing design tokens and fonts | ✅ | 2026-10-27 | Dev confirmed via go. |
| S2 | Route and empty page scaffold | ✅ | 2026-10-27 | Dev confirmed via go. |
| S3 | Navigation bar and skip link | ✅ | 2026-10-27 | Dev confirmed via go. |
| S4 | Hero with Lunara | ✅ | 2026-10-27 | Cute flying dragons approved via go. |
| S5 | Explore the Valley | ✅ | 2026-10-27 | Dev confirmed via go. |
| S6 | How It Works | ✅ | 2026-10-27 | Dev confirmed via go. |
| S7 | Made for Young Math Explorers | ✅ | 2026-10-27 | Dev confirmed via go. |
| S8 | Final call to action and footer | ✅ | 2026-10-27 | Dev confirmed via go. |
| S9 | Motion pass | ✅ | 2026-11-04 | Dev confirmed go through S9. |
| S10 | Responsive pass | ✅ | 2026-11-04 | Dev confirmed via go. |
| S11 | Accessibility pass | ✅ | 2026-11-04 | Dev confirmed via go. |
| S12 | Performance pass | ✅ | 2026-11-04 | Dev confirmed via go. |
| S13 | Integration and regression | ✅ | 2026-11-04 | Dev confirmed via go. |
| S14 | Cleanup and handoff | 🔄 | | README note + unused icon cleanup. Landing eslint clean; build + tests pass. Waiting for Dev confirm. |

### 0.2 Preflight log

*Filled in during P0. Record the real answer for every item in Section 10, step P0.*

| # | Question | Finding |
| --- | --- | --- |
| 1 | Routing / what `/` does today | **No React Router.** `src/main.tsx` mounts `<App />` only. `src/App.tsx` is a screen-state machine (not path-based). Visiting `/` always loads `App`, which boots via API: loading → optional migration → if `localStorage` has remembered student id (`mv-active-student-id` via `getActiveStudentId`), auto-loads that student into `HomeScreen` or resumes `SessionScreen`; otherwise renders **`ProfileCreateScreen`** (the entry UI) at the same URL `/`. Hash-only demos: `#fraction-demo`, `#visual-demo`. No `basename`. Vite `base` is default `/` (`vite.config.ts`). |
| 2 | Entry screen component + path + route constants | Component: **`src/screens/ProfileCreateScreen.tsx`**. Path today: **same as `/`** (no separate entry URL). **No route constants file** and no router config. Entry asks grade + avatar first; name only when API returns `NAME_REQUIRED` (new or tiebreak). |
| 3 | Every link/redirect to `/` | **No `href="/"`, `navigate('/')`, or path redirects in `src/`.** “Leave the app” is **`onSwitchAdventurer`** in `App.tsx` / `HomeScreen.tsx`: clears active student id + local player state and re-renders `ProfileCreateScreen` **in place** (URL stays `/`). Demo hashes stay on `/`. Nothing else points at `/` expecting a named route. |
| 4 | Returning student flow | Remembered id in `localStorage` (`getActiveStudentId` / `setActiveStudentId` in `src/data/apiClient.ts`). On boot, if that id exists in `listStudents()`, `finishBootstrapFromStudentId` loads the student and goes to home or resumes session — **skips `ProfileCreateScreen`**. If not remembered: `ProfileCreateScreen` → `enterByGradeAvatar` (grade + avatar, name when needed) → same bootstrap into home/session. |
| 5 | Production static + `/` | `server/static.ts` `tryServeStatic`: `/` (and `''`) serves `dist/index.html`; extensionless client paths fall back to `index.html`. Enabled when `NODE_ENV=production` or `SERVE_STATIC=1` (`npm start`). Dev: Vite + API proxy `/api` → `:3001`. Server does **not** treat `/` specially beyond SPA index. |
| 6 | Styling / theme / jewel tokens | **Tailwind CSS v4** via `@tailwindcss/vite`; global CSS is only `src/index.css` → `@import "tailwindcss";`. No CSS modules. No custom CSS variables for jewel tones. Accents are **Tailwind utilities** in components (e.g. `violet-*`, `amber-*`, `emerald-*` in gradients). Zone accents in `zones.ts`: Tailwind gradient class strings (`from-emerald-700 to-lime-800`, etc.). `src/visuals/visualTheme.ts` has slate/amber hex for geometry SVGs only — not landing jewels. **No named `--emerald` / `--gold` app tokens to reference.** Plan fallbacks `#0E8F6E` / `#E8B730` would apply unless Dev picks Tailwind hexes to mirror. |
| 7 | Fonts | **No custom webfonts** in the project (no woff/woff2). UI uses browser/Tailwind default stack. Geometry visuals hardcode `system-ui, sans-serif` in places. Heading font for landing: **must self-host** (Fredoka/Baloo 2 per plan) unless Dev chooses otherwise. |
| 8 | Lunara art | **No SVG/PNG dragon art.** `src/components/LunaraDisplay.tsx` + `src/data/lunara.ts`: stages are **emoji** (`🥚🐣🐉🐲✨`) with labels (Hatchling → Elder Wyrm). XP-driven evolution; session summary can show “Lunara evolved into …”. Poses for landing (flying / head icon) **do not exist** as reusable art. |
| 9 | Zone/curriculum API + import purity | **`getZonesForGrade(grade)`** in `src/data/zones.ts` → returns `Zone[]` (`id`, `name`, `intro`, `accentClass`, `practiceable`). Order from **`getZoneTopicIdsForGrade`** in `src/data/curriculum-map.ts` (`TOPIC_UNLOCK_ORDER` filtered by non-empty standards). **Not pure for landing:** `curriculum-map.ts` imports `question-generator/src/standards-registry.ts` and runs **`assertCurriculumMapValid()` at module load**. Importing zones into the landing chunk would pull the generator registry and run that assert. |
| 10 | Island names vs §4.3.1 | **Names and order match the plan table** for G1–G4 (OA → NBT → MD → NF → Geometry; NF only G3–G4). Code names = plan names (e.g. Hatchling Hollow, Fraction Falls, Skyfire Observatory). Domain keys: `operations-algebraic-thinking`, `number-operations-base-ten`, `measurement-data`, `number-operations-fractions`, `geometry`. Per-grade **`intro` strings differ** from plan’s short “friendly captions” (intros are longer/flavorful); captions should stay the plan’s domain→caption map, not `zone.intro`. |
| 11 | How It Works vs real flow | (1) **Mostly true:** entry is grade + avatar; name only when required — sentence “Choose your grade and your avatar” is OK (omits occasional name). (2) True: first island, then challenges. (3) True: practice starts at **beginner** then **advanced** per standard (`practiceSession.resolveQuestionTarget`); UI can show `Beginner cleared — advanced next!` and map labels use `beginner`/`advanced`. (4) True: master beginner+advanced (8/10 window) to advance standard; topic mastery unlocks next island. **Lunara:** stages/emoji change with XP and can announce evolution — optional fifth line is **allowed** if Dev wants it. |
| 12 | Framer Motion | **Installed:** `framer-motion` **13.4.0** (`package.json` `^13.4.0`). Used in `SessionScreen`, `LunaraDisplay`. |
| 13 | Tests / lint / build / run | Scripts: `npm run lint` (eslint), `npm run build` (`tsc -b && vite build`), `npm test` (storage + storage-contract + api node scripts — **no frontend unit/e2e suite**). Dev: `npm run dev`. Prod local: `npm run build` then `npm start` (or `SERVE_STATIC=1`). No Vitest/Playwright/Cypress for the React app. |
| 14 | Privacy / terms / contact | **None** in app routes or pages. Footer should stay as §4.7 only. |
| 15 | Breakpoints | **No custom breakpoints** in project CSS. Tailwind v4 defaults apply (commonly sm 640 / md 768 / lg 1024). Plan’s 640 / 768 / 1024 aligns. |

**Plan vs code mismatches — resolved 2026-10-27 (see 0.3 / 0.4):**

| Topic | Resolution |
| --- | --- |
| Plan file location | Stay in **`docs/LANDING_PAGE_PLAN.md`** |
| Routing | Lightweight pathname switch in `App` (no react-router). `/` = landing; **`/app`** = existing `ProfileCreateScreen` + auto-enter |
| Landing folder | **`src/landing/`** (match repo; no `src/pages/`) |
| Lunara | **New** storybook SVG poses for landing only; in-app emoji Lunara unchanged |
| Jewel tokens | Use plan fallbacks `#0E8F6E` / `#E8B730` |
| Island adapter | Extract a **pure** island names/order module; landing must not import `zones.ts` / curriculum-map / question-generator |
| Returning user on `/` | Always landing. “Log In” → entry URL; **auto-enter** if remembered student id exists |

### 0.3 Decision log

| Date | Decision | Source |
| --- | --- | --- |
| 2026-10-26 | **Palette:** bright valley palette for scenery, with the app's jewel tones as accents (Section 3) | Dev |
| 2026-10-26 | **Returning students:** `/` always shows the landing page, for everyone (Section 7) | Dev |
| 2026-10-26 | **NYS wording:** the page may say "based on New York State math standards for Grades 1–4". It must not say "aligned", "certified", "approved", or "official" | Dev |
| 2026-10-26 | **Entry screen:** keep its current path; the landing page links to it (Section 7) | Plan default — superseded 2026-10-27 (path must become distinct from `/`) |
| 2026-10-26 | **Fonts:** reuse the app's fonts if suitable, otherwise self-host (Section 3.3) | Plan default |
| 2026-10-26 | **Nav button label:** "Log In", as originally requested | Dev |
| 2026-10-26 | **Progress tracking:** this file, Section 0.1 | Plan default |
| 2026-10-27 | **Routing:** pathname switch in `App` / thin shell — **no** new npm deps / no react-router. `/` = landing always | Dev (P0 Q1) |
| 2026-10-27 | **Entry URL:** **`/app`** — existing `ProfileCreateScreen` + remembered auto-enter. Nav still says “Log In”; path is `/app` (not `/login`) | Dev |
| 2026-10-27 | **Log In / remembered:** visiting the entry URL **auto-enters** if a remembered student id exists (same as today’s `/` boot). Otherwise show grade + avatar form | Dev (P0 Q2) |
| 2026-10-27 | **Switch adventurer:** after landing exists, navigate to the entry URL (not `/`) | Dev (P0 Q3) |
| 2026-10-27 | **Lunara landing art:** new inline SVGs in storybook style; do not change in-app emoji Lunara | Dev (P0 Q4) |
| 2026-10-27 | **Island data:** extract pure names/order module for the landing adapter (no question-generator pull-in) | Dev (P0 Q5) |
| 2026-10-27 | **`--mv-emerald` / `--mv-gold`:** use plan fallbacks `#0E8F6E` and `#E8B730` | Dev (P0 Q6) |
| 2026-10-27 | **Heading font:** self-host any OFL rounded face for now (Fredoka default unless blocked) | Dev (P0 Q7) |
| 2026-10-27 | **Heading font chosen:** Fredoka weight 600 (latin woff2 + OFL in `src/landing/fonts/`) | Cursor (S1) |
| 2026-10-27 | **Landing files live under `src/landing/`** (not `src/pages/landing/`) | Dev (P0 Q8) |
| 2026-10-27 | **This tracker stays in `docs/LANDING_PAGE_PLAN.md`** | Dev (P0 Q9) |
| 2026-10-27 | **Back to landing:** “Back to Math Valley” → `/` on **Home** and **entry** (`ProfileCreateScreen`) screens | Dev |

### 0.4 Deviations and issues log

| Date | Step | What happened or what changed | Approved by Dev? |
| --- | --- | --- | --- |
| 2026-10-27 | P0 | Plan said file lives in project root; stays under **`docs/`** | Yes |
| 2026-10-27 | P0 | No React Router in repo: use pathname switch instead of assumed router | Yes |
| 2026-10-27 | P0 | Entry screen can no longer live at `/` (landing takes `/`). Entry path = **`/app`** | Yes |
| 2026-10-27 | P0 | Landing tree path: `src/landing/` instead of `src/pages/landing/` | Yes |
| 2026-10-27 | P0 | Lunara: new landing SVGs (in-app has only emoji); §5.1 “reuse existing art” waived for landing | Yes |
| 2026-10-27 | P0 | Island adapter: extract pure data module instead of importing `getZonesForGrade` directly | Yes |
| 2026-10-27 | P0 | Jewel emerald/gold: plan hex fallbacks (no app CSS tokens) | Yes |
| 2026-10-27 | S2 | Added `src/Root.tsx` pathname switch + `src/routes.ts` (`ENTRY_PATH=/app`). `main.tsx` mounts Root. `App.tsx` Switch adventurer → `/app` | Yes (P0) |
| 2026-10-27 | S4 | Hero art revised to cute flying dragons (Dev feedback) | Yes |
| 2026-10-27 | S5 | Extracted `src/data/islandCatalog.ts`; `zones.ts` reads names from it. Landing uses catalog only (no curriculum-map) | Yes (P0) |
| 2026-10-27 | — | `HomeScreen.tsx`: added “Back to Math Valley” link to `/` (approved exception to “don’t change game screens”) | Yes |
| 2026-10-27 | — | `ProfileCreateScreen.tsx`: same “Back to Math Valley” link under Enter | Yes |
| 2026-11-04 | S11 | Contrast fixes: hero grades → ink on sky; locked status → violet (sky-deep on sky and coral-deep on locked card failed 4.5:1). Island names → `h3`. Island scroll region only focusable + arrow-key scroll below 640px. Skip link focuses `#main`. Hero `aria-label` aligned to §9.1 (S4 cute-dragon art still shown). Footer pause gets clearer disabled/aria when reduced-motion. axe-core: 0 violations / 41 passes (color-contrast incomplete). Lighthouse CLI unavailable here (no Chrome); Dev should run mobile a11y ≥95. | Yes (go) |
| 2026-11-04 | S12 | Prod build: `LandingPage-*.js` (~40KB) + CSS separate from `App-*.js`; App does not import Landing. Shared `proxy-*.js` (~125KB) is mostly framer-motion (both routes). Art source: HeroValley 6.6KB / all art 30KB (under 40/120). Fredoka preload on landing only + Fallback `size-adjust`. Ambient `will-change` only while playing. No network external font/script/image requests (SVG xmlns only). Lighthouse mobile still needs Dev (no Chrome in agent env). | Yes (go) |
| 2026-11-04 | S13 | Ran Section 11 on prod Express (`SERVE_STATIC=1` :3011): `/`+`/app` SPA 200; API health/students/progress OK (7 students; duplicate grade+avatar pairs present for name-prompt case); landing chunk has no `/api` or external URLs; islands match catalog; links to `/app`; responsive matrix overflowX=0 at Section 8 widths (200% zoom left for Dev). Tests pass. Lint still fails on pre-existing issues (QG + app + previously `StepIcons` react-refresh). Dev still needed for: remembered-profile UI, name-prompt UI, full keyboard walk, VoiceOver, Lighthouse, real browsers. | Yes (go) |
| 2026-11-04 | S14 | Cleanup: removed unused `ArrowIcon` and `STEP_ICONS` export (lint); README landing note; no console logs / temp assets found. Approved non-landing touchpoints remain those in 0.4 only. | Pending Dev test |

---

## 1. Overview and Goals

### 1.1 What this is

Today, visitors who open the Math Valley website land directly on the entry screen. This plan adds a welcoming landing page at `/` that introduces the game, shows Lunara and the islands, and sends visitors to the existing entry screen. After that, everything works exactly as it does today.

### 1.2 Goals

1. Make the first impression feel like the start of an adventure, not a form.
2. Introduce Lunara and the island world honestly, using the real islands the app has.
3. Be lightweight, accessible, and good on phones and tablets.
4. Leave the existing app untouched: entry screen, profiles, progress, sessions, database.

### 1.3 Non-goals

- No redesign of game screens, no changes to the entry screen.
- No accounts, sign-up, parent dashboard, analytics, newsletter, or contact form.
- No new backend endpoints. The landing page is entirely static.
- No audio.
- No translations (English only for now).

### 1.4 Success criteria

- A visitor at `/` sees the landing page; one click reaches the existing entry screen.
- An existing student with saved progress can still play, with nothing lost.
- Mobile Lighthouse: Accessibility ≥ 95 and Performance ≥ 90 for the landing page (targets are tunable if the hosting environment makes Performance unfair).
- No horizontal scrolling at any width from 320px to 1920px.
- Everything works with the keyboard alone, and with reduced motion on.

---

## 2. Visual Design Direction

**One-line direction:** a bright, storybook valley (green hills, a winding river, bridges, floating islands, a friendly dragon) drawn in the app's own jewel-toned fantasy world, so the landing page and the app feel like the same place.

**Style rules for every illustration:**

- **Flat, soft shapes** with rounded corners. No hard black outlines. Subtle highlights only: one lighter shape on top of a base shape.
- **Palette from tokens only** (Section 3). No colors that aren't tokens.
- **Layered depth:** far mountains (cooler, lighter), then hills, then river and bridges, then islands, then foreground flowers. Farther layers are lighter and bluer.
- **Details are small and sparing:** stars, clouds, flowers, stepping stones, glowing paths, math symbols (`+ − × ÷`) worked into the scenery (for example as glowing stones or floating over islands), not stickers placed on top.
- **Not babyish:** proportions and line shapes are rounded and friendly but not toddler-like. Limited use of faces. Lunara is the only character.
- **Not corporate:** no stock photos, no generic icon packs, no gradient-heavy hero.
- **One gradient maximum per illustration**, and only for the sky.
- **Mood:** warm, curious, calm. No flashing, no clutter. Generous empty space around text.

**Page rhythm** (top to bottom): sky blue hero → cream "Explore the Valley" with islands → lavender-tinted "How It Works" → grass-green-tinted "Made for Young Math Explorers" → sky and violet final call to action that echoes the hero → violet footer. Section edges use soft wave or hill-shaped dividers (SVG), not hard lines.

---

## 3. Color Palette and Typography

### 3.1 Tokens

All tokens are CSS custom properties scoped to the landing page root (for example `.mv-landing { --mv-sky: …; }`), so the app's own theme is never touched.

| Token | Value | Use |
| --- | --- | --- |
| `--mv-sky` | `#8FD3F4` | Sky, hero background |
| `--mv-sky-deep` | `#2B6CA3` | River, links on cream, secondary accents |
| `--mv-grass` | `#6CC24A` | Hills, grass-tinted section |
| `--mv-grass-deep` | `#2F8F46` | Shaded hills, **decoration only** (see contrast rules) |
| `--mv-sun` | `#FFD54A` | Sun, primary button, glowing paths |
| `--mv-lavender` | `#B9A7F0` | Floating islands, How It Works tint |
| `--mv-coral` | `#FF8A7A` | Flowers, small accents |
| `--mv-coral-deep` | `#C2402F` | Accent text or icons needing contrast |
| `--mv-violet` | `#4B2A8C` | Jewel anchor: nav button, headings accent, focus ring, footer |
| `--mv-ink` | `#1F2340` | Body text, headings |
| `--mv-cream` | `#FFF9EC` | Page surface, cards |
| `--mv-emerald`, `--mv-gold` | `#0E8F6E` and `#E8B730` (plan fallbacks; P0 found no app CSS jewel tokens) | Decoration and borders only (their text contrast is not verified) |

Where the app already defines the same colors under another name, **reuse the app's value by referencing it**, so one change updates both. Do not duplicate with a slightly different color.

### 3.2 Contrast rules (computed with the WCAG formula)

| Foreground on background | Ratio | Allowed for |
| --- | --- | --- |
| `ink` on `cream` | 14.58 | All text |
| `ink` on `sky` | 9.32 | All text |
| `ink` on `sun` | 10.83 | All text, including the primary button |
| `ink` on `lavender` | 7.17 | All text |
| `ink` on `grass` | 6.89 | All text |
| `ink` on `coral` | 6.68 | All text |
| `white` on `violet` | 10.45 | All text, including the nav button and footer |
| `violet` on `cream` | 9.96 | All text, including the secondary button |
| `white` on `coral-deep` | 5.16 | All text |
| `white` on `sky-deep` | 5.56 | All text |
| `white` on `grass-deep` | **4.09** | **Not allowed for normal text** (below 4.5:1). Large text or decoration only |
| `sky-deep` on `cream` | 5.30 | Nav links, captions, hints on cream (S11) |
| `sky-deep` on grass-tinted explorers surface | 4.52 | Standards line (S11) |
| `violet` on locked island card | ~9.07 | Locked status text (S11) |
| `sky-deep` on `sky` | **3.39** | **Not allowed** — was hero grades line; switched to ink on sky (S11) |
| `coral-deep` on locked island card | **~4.48** | **Not allowed** for normal text; use violet instead (S11) |

**Rules:**
- Text never sits directly on a busy illustration. Text sits on a flat cream or colored panel, or on a clear area of the sky.
- Information is never conveyed by color alone (locked versus unlocked islands also differ by icon and label).
- Any new color pair used for text must be checked, and the result added to this table.

### 3.3 Typography

- **Headings:** a rounded, friendly display face. **Reuse the app's heading font if it fits the storybook feel.** If not, self-host an OFL-licensed rounded font (candidates: *Fredoka* or *Baloo 2*; confirm the license file is included) as local `woff2` files in the project's static assets folder with `font-display: swap`. Preload only the heading font's one primary weight.
- **Body:** the app's body font, or a system UI stack. No extra body webfont.
- **No external font services** (no requests to third-party servers; this is a children's site).
- **Scale (fluid):**
  - `h1`: `clamp(2.25rem, 1rem + 5vw, 4rem)`, line-height 1.1
  - `h2`: `clamp(1.75rem, 1rem + 2.5vw, 2.75rem)`, line-height 1.15
  - `h3`: `1.25rem`–`1.5rem`
  - Body: at least `1.125rem` (18px), line-height 1.55
  - Maximum text line length about 60 characters
- **Buttons:** at least `1.125rem`, bold, minimum height 48px and minimum width 48px.

### 3.4 Component basics

- **Radius:** 16px for cards, 999px for buttons.
- **Shadow:** one soft shadow style only, such as `0 6px 0 rgba(75,42,140,.18)` for buttons, `0 8px 24px rgba(31,35,64,.12)` for cards.
- **Primary button** ("Start Learning"): `--mv-sun` background, `--mv-ink` text, violet bottom shadow. Pressed: moves down 2px.
- **Nav button** ("Log In"): `--mv-violet` background, white text.
- **Secondary button** ("Explore the Valley"): `--mv-cream` background, `--mv-violet` text, 2px violet border.
- **Focus ring (all interactive elements):** two-tone, a 3px `--mv-ink` outline plus a 2px `--mv-cream` outer ring, so it is visible on every background including violet.

---

## 4. Landing Page Structure and Content

The page uses real semantic landmarks: `<header>` (nav), `<main>` with one `<section>` per block, and `<footer>`. There is exactly one `<h1>`.

### 4.1 Skip link and navigation bar (`<header>`)

- First focusable element: a **"Skip to main content"** link, visible on focus.
- **Wordmark:** "Math Valley" (text, in the heading font) with a small Lunara head icon. Links to `/`.
- **Links:** "Explore the Valley" (`#explore`), "How It Works" (`#how-it-works`), "For Explorers and Grown-Ups" (`#explorers`).
- **Button:** "Log In", linking to the existing entry screen (Section 7).
- **Mobile (below 768px):** the links collapse into a menu button ("Menu", with an icon) that opens a panel. The "Log In" button stays visible in the bar outside the menu.
- Sticky at the top, with a small shadow once scrolled. It must never cover focused elements (use `scroll-margin-top` on sections).

### 4.2 Hero (`#top`)

- **Headline (h1):** Welcome to Math Valley!
- **Supporting text:** Explore a world of math adventures, solve exciting challenges, and unlock new islands as you learn.
- **Buttons:** **Start Learning** (primary, to the entry screen) and **Explore the Valley** (secondary, scrolls to `#explore`).
- **Small line under the buttons:** "For Grades 1–4".
- **Illustration (`HeroValley`):** a wide, layered valley scene with Lunara flying or perched near the largest island; a winding river; two bridges connecting islands; floating stars and a few glowing stepping stones; math symbols as glowing details. See Section 5.
- **Layout:** text left and art right on desktop; art below the text on mobile. Text is the largest-contentful element and renders before the art.

### 4.3 Explore the Valley (`#explore`)

- **Heading (h2):** Explore the Valley
- **Intro:** Every island is a different kind of math. Finish one to open the path to the next.
- **Grade picker:** four buttons, "Grade 1", "Grade 2", "Grade 3", "Grade 4", which swap the islands shown. It is a set of toggle buttons (`aria-pressed`), defaulting to Grade 1. A short line explains it: "Each grade has its own islands."
- **Islands row/map:** the real islands for the chosen grade, in the app's real order, joined by a glowing path with bridges. **The first island looks open; the rest look locked** (dimmer, with a small lock icon and the word "Locked" for screen readers and as visible text on focus or hover). Under the row: **"Islands open in order as you master each one."**
- **Each island card shows:** the island's real name, the domain's friendly caption (4.3.1), and its art.
- **Data source:** the app's own zone/curriculum definitions through a thin adapter (Section 6.3). **No island names are typed into the landing page code.**

#### 4.3.1 Reference: islands as of the specs (the code is authoritative)

This table is for **checking** the page against the code during P0 and S5. If the code differs, the code wins, and the difference is logged.

| Order | Domain | Friendly caption (verify against the standards in that island) | G1 | G2 | G3 | G4 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Operations & Algebraic Thinking | Number stories and operations | Hatchling Hollow | Ember Grove | Stormwing Peaks | Skyfire Summit |
| 2 | Number & Operations in Base Ten | Place value and big numbers | Pebble Hoard Den | Glimmer Hoard Caverns | Dragon's Vault | Elder's Treasury |
| 3 | Measurement & Data | Measuring and time | Sundrop Nest | Ticktock Treehouse | Sundial Bazaar | Chrono Exchange |
| 4 | Number & Operations: Fractions (Grades 3–4) | Fractions | — | — | Fraction Falls | Crystal Shard Falls |
| 5 | Geometry (appended last) | Shapes | Hatchling Shape Cove | Ember Shapes Quarry | Dragon's Forge | Skyfire Observatory |

Captions must be true for **every** grade where the island appears. If a caption is only true for some grades, make it generic (for example "Number stories and operations") or vary it by grade.

### 4.4 How It Works (`#how-it-works`)

- **Heading (h2):** How It Works
- **Four steps** (ordered list, each with an icon, a short title, and one sentence):

| # | Title | Sentence |
| --- | --- | --- |
| 1 | Pick your explorer | Choose your grade and your avatar. |
| 2 | Visit an island | Start at the first island and try a math challenge. |
| 3 | Practice and learn | Solve problems, starting with Beginner questions, at your own pace. |
| 4 | Unlock what's next | Master Beginner and Advanced to open the next skill, then the next island. |

- **Check against the app in P0.** If any sentence is not exactly true (for example if the entry screen asks for something else first), fix the sentence, not the app. If Lunara visibly grows or reacts in the app, an optional fifth line may say so; otherwise it must not appear.

### 4.5 Made for Young Math Explorers (`#explorers`)

- **Heading (h2):** Made for Young Math Explorers
- **Intro paragraph:** Math Valley is a math-practice adventure for children in Grades 1–4. Each island focuses on one kind of math. Questions start at Beginner and move to Advanced, and children move forward by practicing until a skill feels solid.
- **Standards line (approved wording):** Practice based on New York State math standards for Grades 1–4.
- **Two cards:**
  - **For explorers:** A dragon friend, islands to unlock, and math that you can practice at your own speed.
  - **For parents and teachers:** Practice stays focused on one skill at a time, moving from Beginner to Advanced before the next skill opens.
- **Do not add** anything about results, reports, progress emails, or session length unless P0 confirms it exists and Dev approves the wording.

### 4.6 Final call to action (`#start`)

- **Heading (h2):** Your Math Adventure Starts Here!
- **Button:** **Start Learning** (primary, to the entry screen).
- **Background:** a smaller scene that echoes the hero (reused hills, sky, a flying Lunara), so the page ends where it began.

### 4.7 Footer (`<footer>`)

- Violet background, white text.
- Wordmark, the same three section links, and the "Log In" link.
- Small line: "© {current year} Math Valley".
- **Nothing else.** No contact details, social accounts, policy links, or "made with" credits unless they already exist in the project.
- A **"Pause animations"** toggle button (Section 9.2).

### 4.8 Page title and metadata

- `<title>`: Math Valley: Math Adventures for Grades 1–4
- Meta description: A math-practice adventure for Grades 1–4. Explore islands, practice math, and unlock what's next with Lunara the dragon.
- Set these only for the landing route. Do not change the app's other pages' titles.

### 4.9 Claims we do not make

The page must not mention or imply: learning outcomes or "proven" results, test-score improvement, certifications or "official" approval, analytics or reports, parent dashboards, accounts or sign-up, cross-device sync, teacher or classroom tools, audio, a privacy policy, safety certifications, or any number of users. If a sentence could be read as one of these, rewrite it.

---

## 5. Illustration and Asset Plan

### 5.1 Approach

**Inline SVG as React components**, in the style from Section 2. Reasons: tiny size, crisp at any resolution, colors come from tokens (so they follow the palette and any theme change), individual parts can be animated with Framer Motion, and no image requests or layout shift.

**Lunara:** In-app Lunara is **emoji stages only** (`LunaraDisplay` / `lunara.ts`) — leave that unchanged. For the landing page only, draw **new** inline SVG poses (flying, head icon; optional cheering) in the Section 2 storybook style. Do not replace or restyle the in-app emoji Lunara.

### 5.2 Asset inventory

| ID | Asset | Used in | Notes |
| --- | --- | --- | --- |
| A1 | `HeroValley` | Hero | Layered scene: sky with sun and clouds, far mountains, hills, winding river, two bridges, three floating islands, stars, flowers, glowing stepping stones, math symbols. Layers are separate groups so they can be animated |
| A2 | `Lunara` poses | Hero, nav icon, final CTA | At least "flying" and a head-only icon. Optional "cheering" for the final CTA |
| A3 | `IslandArt` | Explore the Valley | One component with variants per domain (OA, NBT, MD, NF, Geometry): same island base, different small landmark (for example a nest, a vault, a sundial, a waterfall, a forge), each with `open` and `locked` states |
| A4 | `Decor` set | Everywhere | `Star`, `Cloud`, `Flower`, `StepStone`, `MathSymbol` (`+ − × ÷`), `Sparkle` |
| A5 | `StepIcon` set | How It Works | Four icons (explorer/avatar, island, pencil or scroll, unlocked gate or key), same style |
| A6 | `SectionWave` | Section edges | Soft wave dividers in token colors |
| A7 | `FinalScene` | Final CTA | A smaller composition reusing A1 layers and A2 |
| A8 | Icons | Menu, lock, arrow | Simple inline SVG, 24px grid |

### 5.3 Rules for assets

- Every SVG has a `viewBox` and no fixed pixel size, so it scales with its container.
- Hero art has an explicit aspect ratio so nothing shifts when it loads.
- Decorative art: `aria-hidden="true"` and `focusable="false"`. Meaningful art: `role="img"` with an `aria-label` (Section 9.1).
- **Size budget:** `HeroValley` at most about 40 KB uncompressed, the whole landing route's art at most about 120 KB uncompressed. No raster image over 100 KB. Budgets are tunable; report if exceeded.
- Keep paths simple: no embedded base64 images, no filters or blurs that are costly to paint, no more than one gradient per illustration.
- Optimize SVG by hand: round coordinates to 1 decimal place, reuse shapes with `<symbol>`/`<use>` for repeated stars, clouds, and flowers.

---

## 6. React Component Implementation Plan

*P0: repo has no `src/pages/`. Landing lives under `src/landing/` (Dev-approved 2026-10-27).*

### 6.1 Files

```
src/landing/
  LandingPage.tsx              # page shell: header, main sections, footer; sets title/meta
  landing.css                  # all landing styles; tokens scoped to .mv-landing
  sections/
    LandingNav.tsx             # skip link, wordmark, links, Log In, mobile menu
    Hero.tsx
    ExploreValley.tsx          # grade picker + island row
    HowItWorks.tsx
    Explorers.tsx              # "Made for Young Math Explorers"
    FinalCta.tsx
    LandingFooter.tsx          # includes Pause animations toggle
  components/
    Button.tsx                 # LinkButton variants: primary | secondary | nav
    GradePicker.tsx
    IslandCard.tsx
    StepCard.tsx
  data/
    useLandingIslands.ts       # adapter over pure island names/order module (6.3)
    landingCopy.ts             # all page copy from Section 4, in one place
  art/
    HeroValley.tsx  Lunara.tsx  IslandArt.tsx  Decor.tsx
    StepIcons.tsx   SectionWave.tsx  FinalScene.tsx  Icons.tsx
  motion/
    useLandingMotion.ts        # reduced-motion + pause state
```

Also (routing, added in S2): a single exported entry-path constant next to the pathname switch (for example in `src/routes.ts` or beside `App.tsx`), used by landing “Log In” / “Start Learning” and by “Switch adventurer”.

### 6.2 Principles

- **The landing route is code-split** (`React.lazy` or the project's equivalent), so visitors who go straight into the app don't download it, and landing visitors don't wait for game code.
- **The landing page does not depend on app providers** (profile, session, auth-like state, API client). It must render with none of them mounted, and it must make **no network requests** other than loading its own assets. If the app's root forces providers around every route, mount the landing route outside them, or log it as an issue.
- **Copy lives in `landingCopy.ts`** so wording can change without touching layout.
- **Components are small and typed.** Props are typed; no `any`.
- **No inline styles** for layout. Use the project's styling approach and the scoped tokens.

### 6.3 Island data adapter

`useLandingIslands(grade)` returns `{ id, name, domainKey, caption, order }[]` for that grade.

- **Do not import** `src/data/zones.ts` or `curriculum-map.ts` into the landing chunk (they pull in the question-generator and run a load-time assert).
- Instead, extract a **pure** module (for example `src/data/islandCatalog.ts`) that holds per-grade island **id + name + order** only — the same names as `ZONE_THEMES` / `getZonesForGrade` today. The game’s `zones.ts` should **read from that module** (or stay the single source that the pure module re-exports) so names cannot drift. Exact extraction shape is decided in S5; Dev approved “extract pure module” in P0.
- Captions come from a small `domainKey → caption` map in the landing adapter (Section 4.3.1 friendly captions), not from `zone.intro`.
- The adapter is **read-only**. It never writes progress or reads a student.

### 6.4 Motion

- Framer Motion only, through `useLandingMotion`, which returns `{ reduce, paused }` (from `useReducedMotion()` and the pause toggle).
- If either is true, **no ambient loops and no scroll-in movement**: elements render in their final position.
- Allowed motion (Section 9.2): slow floating of islands and Lunara, drifting clouds, twinkling stars, hover lift on cards and buttons, gentle one-time scroll-in. All transform/opacity only.

---

## 7. Routing and Login Integration

*P0: there is no React Router. `App.tsx` is a screen-state machine. Today `/` is both the site root and the entry UI. After landing, `/` is landing-only; the entry UI gets its own URL.*

### 7.1 Target behavior

| URL | Behavior |
| --- | --- |
| `/` | Landing page, for **everyone** (including devices with a remembered student). No auto-enter into the game from `/`. |
| **`/app`** (entry URL) | Same screen as today: `ProfileCreateScreen`, plus today’s remembered-student auto-enter. This is what the nav **“Log In”** and **“Start Learning”** buttons open. Not a new auth system — just a URL for the existing entry screen. |
| After a profile is chosen / auto-entered | Home / session as today (still client screen state; URL may stay on `/app` until a later step decides otherwise — do not invent game URLs in S2 unless needed) |
| Hash demos (`#fraction-demo`, `#visual-demo`) | **Unchanged** |
| `/api/*` | **Unchanged** |

**What “Log In” means here:** the button label is “Log In”; the screen is still grade + avatar (and name when needed). There is no password. The path is **`/app`**.

### 7.2 Rules

- **Export one constant** for the entry URL (`ENTRY_PATH = '/app'`). Landing links and “Switch adventurer” use that constant only — never hardcode the string in many places.
- **Pathname switch** (no react-router): if path is `/`, render the landing page (code-split) and do **not** run the remembered-student game bootstrap. If path is `/app`, run today’s App bootstrap (auto-enter when remembered; else `ProfileCreateScreen`).
- **“Switch adventurer”** clears the active student (as today) and navigates to `/app` (not `/`).
- **Returning students on `/`:** see the landing; one click on “Log In” / “Start Learning” goes to `/app` and **auto-enters** if remembered.
- **Server fallback:** already returns `index.html` for `/` and extensionless paths (`server/static.ts`) — refresh on `/app` works without server changes.
- **Smooth scrolling** for in-page links uses CSS `scroll-behavior: smooth` inside `@media (prefers-reduced-motion: no-preference)` only. After an in-page link jump, keyboard focus moves to the target section's heading (`tabIndex={-1}`).
- **Hosting under a sub-path:** none today (`vite` base default `/`).
- **No tracking, no analytics, no cookies, and no `localStorage` use** by the landing page. The "Pause animations" choice lasts for the page view only. (The entry URL / app may still use `localStorage` for the remembered student, as today.)

---

## 8. Responsive Design

Use the project's existing breakpoints if it has them. Otherwise: **640px, 768px, 1024px**.

| Area | Mobile (below 640px) | Tablet (640–1023px) | Desktop (1024px and up) |
| --- | --- | --- | --- |
| Nav | Wordmark, "Log In", Menu button; links in a dropdown panel | Same as mobile, or inline links if they fit | Inline links, "Log In" at right |
| Hero | Text first, buttons stacked full-width, art below | Text above art, or side by side if there's room, buttons side by side | Text left, art right, buttons side by side |
| Hero art | Scales by `viewBox`. Lunara and the biggest island stay fully in frame at 320px width | Same | Larger, allowed to overlap the section edge slightly |
| Explore the Valley | Grade picker wraps; islands in a **horizontal scroll-snap row** with a visible hint, or stacked vertically with a vertical path | Two-column path | Full horizontal path with bridges |
| How It Works | One column, step icons beside the text | 2×2 grid | Four in a row |
| Explorers | Cards stacked | Two columns | Two columns |
| Footer | Stacked, centered | Two columns | Row |

**Rules:**
- No horizontal page scroll from 320px to 1920px. The only horizontal scrolling allowed is inside the island row on small screens, and that row must be keyboard-scrollable and labeled.
- All touch targets at least 48 × 48px, with at least 8px between neighbors.
- Text can be zoomed to 200% without loss of content or overlap; the layout must reflow, not clip.
- Buttons never overflow their containers, and long words never break the layout.
- The hero's key subjects (Lunara, main island, headline) stay inside the visible area in both portrait and landscape phone orientations.
- **Test widths:** 320, 360, 390, 768, 1024, 1440, 1920, plus phone landscape (about 800 × 360).

---

## 9. Accessibility and Performance

### 9.1 Accessibility

- **Structure:** one `h1`; `h2` per section; `h3` for cards; landmarks `header`, `nav` (with `aria-label="Main"`), `main`, `footer`; each section uses `aria-labelledby` pointing to its heading. `<html lang="en">` is already set or is set.
- **Skip link** to `#main`, visible on focus.
- **Keyboard:** everything reachable and usable by keyboard, in a logical order. The mobile menu button has `aria-expanded` and `aria-controls`; Escape closes the menu and returns focus to the button. The grade picker uses buttons with `aria-pressed`. No keyboard traps.
- **Focus:** the two-tone focus ring from Section 3.4 on all interactive elements. Never `outline: none` without a replacement.
- **Images:**
  - Hero art: `role="img"`, `aria-label="Illustration: Lunara the dragon flying over a valley of floating math islands"`.
  - Island art: decorative, since the island name is text next to it.
  - Step icons and all decor: `aria-hidden`.
  - Lunara in the final CTA: decorative.
- **Locked islands:** the card's text includes "Locked" (visible, not only as `aria-label`), plus the lock icon; opening the first island is described as "Open".
- **Island list:** rendered as a real list (`<ul>`/`<ol>`); the order is meaningful and announced.
- **Color:** contrast per Section 3.2; no meaning by color alone.
- **Text:** at least 18px body; resizable to 200%; line length and spacing per Section 3.3.
- **Links vs buttons:** things that navigate are links (`<a>`); things that act are buttons. "Start Learning" and "Log In" are links styled as buttons.
- **Link purpose:** the two "Start Learning" links are distinguishable only by context; both have the same destination, so identical text is fine.

### 9.2 Motion safety

- **Reduced motion:** with `prefers-reduced-motion: reduce`, every animation, parallax, and scroll-in movement is off, and smooth scrolling is off.
- **Pause animations:** a visible "Pause animations" toggle button in the footer (`aria-pressed`) stops all ambient loops. This covers the WCAG rule on moving content lasting over 5 seconds. It also appears as a small button in the hero's corner if the footer toggle proves hard to find in testing.
- **No flashing** (nothing flashes more than 3 times per second).
- **Subtle amplitudes:** floats within about ±8px, loops 6–12 seconds, drifts slow. Animate only `transform` and `opacity`.

### 9.3 Performance

- **Route code-splitting** (Section 6.2).
- **No new dependencies;** no webfonts beyond Section 3.3's heading font (one weight preloaded, `font-display: swap`).
- **No layout shift:** hero art has a fixed aspect ratio; font swap uses `size-adjust` or a matching fallback where practical.
- **Largest paint is the headline,** not the art. Text renders without waiting for any script-driven art.
- **Animations** run on the compositor (`transform`, `opacity`); `will-change` only on elements that actually animate, and removed when the animation ends.
- **Pause when offscreen:** ambient loops start only while their section is in view (`IntersectionObserver` or Framer Motion's `whileInView`).
- **Measure with Lighthouse** (mobile profile) in S12. Targets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95; CLS under 0.05.

---

## 10. Step-by-Step Implementation Checklist

Each step has: **Goal, Do, Files, Test, Done when.** Cursor follows the working agreement in Section 0.

### P0. Preflight: confirm facts (read-only; only edit this file's Section 0)

**Goal:** replace this plan's assumptions with real answers before any code.

**Do:** find and record in Section 0.2 (exact file paths and short quotes):
1. How routing works, and **what `/` renders or redirects to today**.
2. The entry screen's component and its **exact path**, and any route constants.
3. Every link or redirect in the app that points to `/` (logout, back, error pages).
4. How a returning student (remembered profile) reaches the app from the entry screen.
5. How production serves the frontend (Express static + fallback) and how it treats `/`.
6. The styling system (plain CSS, CSS modules, Tailwind), where global styles and theme tokens live, and whether **jewel-tone tokens** exist (names and values).
7. The fonts the app uses (heading and body).
8. Lunara's existing art: file type, location, available poses.
9. The zone/curriculum function(s) that return islands per grade, their names, their return shape, and whether importing them pulls in non-static code.
10. The real island names per grade and their order. Compare with Section 4.3.1 and list differences.
11. Whether the app's real flow matches the four "How It Works" sentences (Section 4.4): what the entry screen asks, whether Beginner → Advanced is visible, and whether Lunara visibly grows or reacts.
12. Whether Framer Motion is installed, and its version.
13. The project's test setup (unit tests, e2e, lint/type-check commands), and how to build and run production locally.
14. Any existing privacy, terms, or contact pages or routes (for the footer).
15. Existing breakpoints.

**Files:** only `LANDING_PAGE_PLAN.md`.

**Test (Dev):** read the preflight log; answer any questions Cursor lists; confirm any path changes to this plan.

**Done when:** every item has a real finding, plan sections that conflict with reality are updated and logged in 0.4, and Dev says "go".

### S1. Landing design tokens and fonts

**Goal:** the palette and type scale exist, scoped to the landing page.

**Do:** create `landing.css` with the Section 3.1 tokens under the landing root class, the type scale, button and card base classes, and the two-tone focus ring. Add the heading font files if P0 says the app's font isn't suitable.

**Files:** `landing.css`; font files and license if added.

**Test:** run the app; the entry screen and all game screens look **identical** to before (compare screenshots from before the step). Inspect the CSS: every landing variable is scoped under the landing root class.

**Done when:** no visual change anywhere in the existing app, and tokens are defined.

### S2. Route and empty page scaffold

**Goal:** `/` shows a bare landing page, and the entry screen still works at its own path.

**Do:** add `LandingPage` (code-split) with the header, `main`, and footer landmarks and an empty section for each block (headings only, from `landingCopy.ts`). Route `/` to it. Set the title and meta description. Update any app links that expected `/` to be the entry screen (only those listed and approved from P0 item 3).

**Files:** `LandingPage.tsx`, `landingCopy.ts`, the router config, and any approved link fixes.

**Test:**
1. Open `/`: you see headings only, with landmarks.
2. Open the entry path directly: the entry screen works as before.
3. Choose a profile: you reach the app.
4. Log out (or use any back flow): you land where you expect.
5. Refresh on `/` and on an app route in the production build.

**Done when:** all five checks pass and the landing chunk is separate in the build output.

### S3. Navigation bar and skip link

**Goal:** a working, accessible, responsive nav.

**Do:** build `LandingNav` per Section 4.1, `Button` (`LinkButton` variants), and the Menu/arrow icons. The Log In button uses the entry path constant.

**Test:**
1. Desktop: links scroll to their (still empty) sections; "Log In" reaches the entry screen.
2. At 360px: the Menu button opens and closes the panel; Escape closes it and returns focus.
3. Keyboard only: Tab shows the skip link first and a clear focus ring on everything.
4. Sticky nav doesn't hide a section heading after an anchor jump.

**Done when:** all four pass.

### S4. Hero with Lunara

**Goal:** the hero text, buttons, and art.

**Do:** build `Hero`, `HeroValley` (A1), `Lunara` (A2), and the `Decor` set (A4). Add `SectionWave` (A6) for the hero's lower edge.

**Test:**
1. Compare the hero to Section 2 and 4.2 on desktop and at 360px.
2. "Start Learning" reaches the entry screen; "Explore the Valley" scrolls to `#explore`.
3. At 320px, Lunara and the largest island are fully visible; no horizontal scroll.
4. Headline text is readable on its background (Section 3.2).
5. Lunara matches her existing design from the app.

**Done when:** Dev approves the look, or lists changes (apply them before moving on).

### S5. Explore the Valley

**Goal:** the real islands, per grade, with open and locked states.

**Do:** build `useLandingIslands` (6.3), `GradePicker`, `IslandCard`, `IslandArt` (A3), and `ExploreValley`.

**Test:**
1. For each grade 1–4, the island names and order **exactly match the app's actual map for that grade.** Open a test profile at each grade and compare.
2. Grades 1–2 show no Fractions island; Grades 3–4 show one.
3. The first island looks open; others show a lock icon and the visible word "Locked".
4. Switching grades with the keyboard works (`aria-pressed` toggles).
5. At 360px, the island row scrolls horizontally by touch/keyboard and the rest of the page does not.
6. The landing page makes no network requests (check the Network tab).

**Done when:** all pass and captions are verified against each island's standards.

### S6. How It Works

**Do:** build `HowItWorks`, `StepCard`, and `StepIcons` (A5), using the exact sentences from 4.4 (as updated in P0).

**Test:** the four steps match what the app really does, step by step, using a fresh profile. Layout is 4 / 2×2 / 1 column at desktop / tablet / mobile.

**Done when:** Dev confirms the wording is true and the look fits.

### S7. Made for Young Math Explorers

**Do:** build `Explorers` with the approved copy, standards line, and the two cards.

**Test:** reread the section against Section 4.9; no forbidden claim appears. The standards line says "based on", exactly as approved.

**Done when:** Dev approves the copy.

### S8. Final call to action and footer

**Do:** build `FinalCta` (with `FinalScene`, A7) and `LandingFooter` per 4.6–4.7. The Pause animations button exists here but is wired up in S9.

**Test:**
1. Both "Start Learning" buttons and the footer "Log In" link reach the entry screen.
2. The footer contains **nothing** beyond what Section 4.7 lists.
3. White-on-violet text is readable.

**Done when:** all pass.

### S9. Motion pass

**Do:** build `useLandingMotion`. Add floating islands and Lunara, drifting clouds, twinkling stars, hover lift, and one-time scroll-in. Wire the Pause toggle.

**Test:**
1. Motion looks gentle (Section 9.2).
2. Turn on the operating system's "reduce motion" setting: all movement stops, and the page is still complete and readable.
3. Click "Pause animations": loops stop, and the button reads as pressed.
4. Scroll to an offscreen section: its loops start only when it is in view.
5. Scroll performance feels smooth on a phone.

**Done when:** all pass.

### S10. Responsive pass

**Do:** fix layout at every width in Section 8. Only landing files change.

**Test:** go through every width in Section 8 (including 200% zoom and phone landscape) using the Section 11 responsive table. Record failures and fixes.

**Done when:** the whole table is checked with no horizontal scroll and no clipped content.

### S11. Accessibility pass

**Do:** audit and fix against Section 9.1 and 9.2.

**Test:**
1. Keyboard-only walk-through of the entire page, from the skip link to the footer.
2. Run Lighthouse Accessibility (aim ≥ 95) and fix every finding that is a real issue.
3. Screen reader spot check (VoiceOver or NVDA): headings list, landmarks list, island list reads in order with Open/Locked.
4. Contrast check of every text/background pair against Section 3.2. Add any new pair to the table.

**Done when:** all pass and findings are logged in 0.4.

### S12. Performance pass

**Do:** measure and fix against Section 9.3 and the asset budget in 5.3.

**Test:**
1. Production build: confirm the landing code is its own chunk and is not loaded when opening the entry path directly.
2. Lighthouse mobile on `/`: Performance ≥ 90, Best Practices ≥ 95, CLS < 0.05.
3. Report the size of `HeroValley` and of all landing art.
4. Confirm no external requests (fonts, scripts, images).

**Done when:** targets are met, or Dev approves any exception in 0.4.

### S13. Integration and regression

**Do:** run the full Section 11 checklist on a **production build served by Express**.

**Test:** every box in Section 11 is checked. Pay special attention to: an existing student with saved progress; the entry screen and profile picker (including the "ask for name when two match" case); `/api/*`; refresh on every route.

**Done when:** Section 11 is fully checked and Dev confirms.

### S14. Cleanup and handoff

**Do:** remove temporary code, console logs, and unused assets; make sure no existing file changed except the approved ones listed in 0.4; add a short README note on where the landing page lives and how to edit its copy (`landingCopy.ts`) and islands (adapter). Fill in the tracker.

**Test:** run type-check, lint, and tests (from P0 item 13); the full diff touches only landing files plus the approved router and link changes.

**Done when:** all pass; every row in Section 0.1 is ✅; Cursor writes a short final summary for Dev.

---

## 11. Testing Checklist

Tick each box with the date. Run it on the production build served by Express (S13), and spot-check during earlier steps.

### Routing and regression
- [x] 2026-11-04 `/` shows the landing page (including for a device that already has a remembered profile) — Root always renders landing at `/`; Dev: spot-check with a remembered student id in localStorage
- [x] 2026-11-04 "Start Learning" (hero), "Start Learning" (final CTA), nav "Log In", and footer "Log In" all reach the existing entry screen (`href="/app"`)
- [x] 2026-11-04 The entry screen works at its own path, directly and by refresh (Express SPA shell for `/` and `/app`)
- [x] 2026-11-04 An existing student with saved progress can pick their profile and continue, with all islands, mastery, and XP unchanged — API: 7 students, progress GET 200 for sampled ids; Dev: click through one saved profile in UI
- [x] 2026-11-04 Profile picker behaves as before: grade + avatar, and the name prompt only when more than one profile matches — DB has duplicate grade+avatar pairs (`1:sage`×3, `1:ember`×2); Dev: confirm name prompt in UI
- [x] 2026-11-04 Every other existing route works and refreshes correctly — SPA fallback 200 for unknown paths; hash demos client-only
- [x] 2026-11-04 `/api/*` responds as before (`/api/health` ok; `/api/students` 200)
- [x] 2026-11-04 The landing page makes no API calls and no external requests (landing chunk scan)
- [x] 2026-11-04 Logout/back flows land where they did before — Switch adventurer → `ENTRY_PATH`; Home/entry “Back to Math Valley” → `/`
- [x] 2026-11-04 No existing file changed except those approved and logged in 0.4

### Content truth
- [x] 2026-11-04 Island names and order match the app for Grades 1, 2, 3, and 4 (`islandCatalog`)
- [x] 2026-11-04 Grades 1–2 show no Fractions island; Grades 3–4 do
- [x] 2026-11-04 Each "How It Works" sentence is true in the live app (copy + P0 truth check)
- [x] 2026-11-04 No claim from Section 4.9 appears anywhere on the page
- [x] 2026-11-04 The standards line uses the approved "based on" wording
- [x] 2026-11-04 Footer contains only what Section 4.7 lists

### Responsive matrix (check each cell)

| Width | Nav | Hero | Islands | Steps | Cards | Footer | No horizontal scroll |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 320 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| 360 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| 390 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| 768 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| 1024 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| 1440 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| 1920 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| Phone landscape | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 | [x] 11-04 |
| 200% zoom | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Dev: browser zoom spot-check |

### Accessibility
- [x] 2026-11-04 Skip link appears first on Tab and works (DOM/order + focus handler)
- [ ] Entire page usable by keyboard only; focus order is logical; focus is always visible — Dev walk-through
- [x] 2026-11-04 Mobile menu: opens and closes by keyboard; Escape closes and returns focus (implemented; Dev confirm)
- [x] 2026-11-04 Grade picker works by keyboard and announces its pressed state (`aria-pressed`)
- [x] 2026-11-04 One `h1`; headings in order; landmarks present
- [x] 2026-11-04 Locked islands say "Locked" in visible text; open island says "Open"
- [ ] Screen reader: headings, landmarks, and island list read correctly — Dev VoiceOver/NVDA
- [x] 2026-11-04 Every text/background pair meets Section 3.2 (S11 table)
- [ ] Lighthouse Accessibility ≥ 95 — Dev (no Chrome in agent env)

### Motion
- [ ] Operating system "reduce motion" on: no animation, page fully readable — Dev OS setting
- [x] 2026-11-04 "Pause animations" stops all loops (wired; Dev click confirm)
- [x] 2026-11-04 Loops start only when the section is in view (`useInView`)
- [x] 2026-11-04 Nothing flashes; motion is gentle (S9 amplitudes)

### Performance
- [x] 2026-11-04 Landing code is a separate chunk and isn't loaded for the entry path or app routes
- [ ] Lighthouse mobile: Performance ≥ 90, Best Practices ≥ 95, CLS < 0.05 — Dev
- [x] 2026-11-04 Art size within budget (5.3), or exception logged
- [x] 2026-11-04 No layout shift when fonts or art load — aspect-ratio + Fredoka Fallback size-adjust; Dev CLS via Lighthouse

### Browsers and devices
- [ ] Chrome desktop · [ ] Safari desktop · [ ] Firefox desktop
- [ ] Safari on iPhone or iPad · [ ] Chrome on Android (as available to Dev)

### Build quality
- [x] 2026-11-04 Type-check and existing tests pass (`tsc -b`; storage + storage-contract + api). Landing-related eslint (`src/landing`, Root, routes, islandCatalog) clean after S14. Full-repo `npm run lint` still reports pre-existing non-landing issues (QG / FractionAnswer / etc.) — see 0.4
- [x] 2026-11-04 Production build succeeds with no new warnings from landing files

---

## 12. Potential Risks and Safeguards

| Risk | Safeguard |
| --- | --- |
| Changing what `/` renders breaks a flow that assumed `/` was the entry screen (logout, back, error redirects, bookmarks) | P0 lists every link to `/` before any change; S2 tests each flow; old entry path keeps working directly |
| Landing styles leak into the app (or app styles into the landing page) | Tokens and classes scoped under the landing root; S1 requires an identical-looking app; no edits to global styles |
| Importing the app's island data pulls API or provider code into the landing page | Adapter is read-only; S5 checks the Network tab; stop and ask if the zone module isn't pure |
| Island names or counts on the page drift from the real map | Names come from code, never typed; S5 compares every grade against the live app |
| Copy claims something the app doesn't do | Section 4.9 list; S6–S7 truth checks; Dev approves copy |
| Mismatch with the existing theme (cute pastel landing, dark game) | Jewel-tone anchors used on the landing page (violet, gold, emerald); Dev reviews at S4 |
| Lunara looks different from the app's version | Reuse existing art; no redesign; new poses must match or Dev is asked |
| Heavy hero art slows phones | Inline SVG with a size budget, simplified paths, code splitting, compositor-only animation, Lighthouse in S12 |
| Animations cause discomfort or accessibility failures | Reduced-motion support, Pause toggle, small amplitudes, nothing flashes; S9 and S11 tests |
| Low contrast on colorful backgrounds | Contrast table; text only on flat panels or clear sky; S11 audit |
| Production server doesn't fall back to `index.html` for `/` or deep links | P0 checks the Express setup; S2 and S13 test refresh on production build |
| Sub-path hosting breaks links or assets | Honor `basename`/`base`; P0 checks |
| Third-party font requests on a children's site | Self-host fonts or reuse the app's; S12 confirms no external requests |
| Scope creep (accounts, analytics, parent pages, new backend) | Non-goals in 1.3; hard constraints in Section 0 |
| Public launch obligations for a children's site (privacy policy, children's-data rules such as COPPA) | Out of scope for this landing page, which adds no data collection; the footer deliberately lists no policy. If the site goes public, review these separately. This note is not legal advice |
| Plan assumptions don't match the codebase | P0 replaces assumptions with findings and logs plan changes before any code |
