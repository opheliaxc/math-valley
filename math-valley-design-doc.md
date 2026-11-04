# Math Valley — Design Document

*As of September 17, 2026*

## Overview

Math Valley is a web-based math practice app for kids in grades 1–4, built as a personal side project. Kids practice addition, subtraction, multiplication, division, word problems, and measurement/time/money skills by exploring a fantasy world guided by Lunara, a dragon companion who grows and evolves as they practice.

The app is designed to be picked up in short 5–10 question sessions, with no account or login required, and to feel like play rather than homework.

## Goals & Scope

**Primary goal:** give grades 1–4 kids an engaging way to practice core math facts, while giving Dev a well-scoped, shippable solo project.

**In scope for v1:**
- Practice across four topic areas (see Content & Curriculum)
- Adaptive difficulty within each topic
- A dragon companion (Lunara) and a small unlockable world map
- No-login, local-device profiles
- Responsive design for desktop, tablet, and phone

**Out of scope for v1** (see Roadmap):
- User accounts / cloud sync
- Audio narration
- Classroom or multi-student management
- Fractions and other later-grade topics

## Target Audience & Access

**Primary users:** kids in grades 1–4, both for personal/family use and as a showable portfolio project.

**Access model (v1):**
1. On first visit, the kid enters a name, picks a grade (1–4), and chooses an avatar.
2. That profile is stored on the device (localStorage) — no email, password, or account creation.
3. Returning to the app on the same device loads the existing profile automatically.

**Future (not v1):** an optional PIN-protected parent view showing progress and accuracy, without requiring full account infrastructure.

## Content & Curriculum

Four topic areas make up v1, each represented by its own zone on the world map. Difficulty within each topic scales by grade band and adapts to performance (see Difficulty System).

| Topic | Grade 1 | Grade 2 | Grade 3 | Grade 4 |
| --- | --- | --- | --- | --- |
| Addition & subtraction | Sums to 20 | Sums to 100, regrouping | Multi-digit, regrouping | Multi-digit, larger numbers |
| Multiplication & division | — (intro only) | Intro concepts | Facts to 10x10 | Multi-digit, remainders |
| Word problems | 1-step, small numbers | 1-step | 2-step | 2-step, mixed operations |
| Time, money, measurement | Telling time (hour/half), coins | Time to 5 min, counting money | Elapsed time, money totals | Units, conversions, elapsed time |

Each topic maps to one world-map zone (see Story, Mascot & Progression).

## Difficulty System

A simple rule-based engine, not machine learning, keeps difficulty within each topic in the kid's comfort zone.

**Mechanics:**
- Each topic has a set of difficulty tiers (e.g., "sums to 10" → "sums to 20" → "sums with regrouping").
- The kid starts at the tier matching their selected grade.
- 3 correct answers in a row → move up one tier.
- 2 incorrect answers in a row → move down one tier (never below the grade's minimum floor).
- Tier position is saved per topic, per profile, so progress persists across sessions (once local storage is in place).

This keeps the logic easy to reason about and debug, while still feeling responsive to the kid.

## Gameplay & Answer Formats

**Session structure:** a practice session is 5–10 questions from one topic/zone, ending with a short reward moment (Lunara reacts, XP is added, a zone may unlock).

**Answer format by question type:**

| Question type | Format |
| --- | --- |
| Basic facts (addition, multiplication, etc.) | Multiple choice or typed number, varied for variety |
| Word problems | Typed number answer |
| Time/money/measurement | Multiple choice, or drag & drop (e.g., dragging coins to match an amount, setting a clock hand) |

Mixing formats keeps sessions from feeling repetitive and lets certain skills (like reading a clock) use a more visual, hands-on interaction than a typed answer would allow.

## Story, Mascot & Progression

**Mascot:** Lunara, a dragon companion who accompanies the kid through Math Valley. Lunara starts small (hatchling stage) and visibly grows/evolves in appearance as the kid earns XP through practice.

**World map (v1 scope — medium):**
- Math Valley is divided into a small number of zones, one per topic area (e.g., Addition Orchard, Multiplication Mountains, Word-Problem Woods, Time & Treasure Market).
- Zones start locked except the first; finishing enough sessions/XP in a zone's topic unlocks the next.
- Each zone has simple flavor (a background illustration, a short intro line) but no complex quest/dialogue system in v1.

**Growth loop:** every completed session → XP → Lunara levels up and/or progress toward unlocking the next zone. No separate currency or shop system in v1 — growth is the reward.

## Visual Design & Theme

**Theme:** epic, adventurous fantasy — a magical valley/realm with dragons, wizards, and enchanted forests, rather than a silly cartoon tone.

**Design direction:**
- Warm, saturated color palette (jewel tones — emerald forests, gold treasure, deep blues/purples for magic) rather than pastel "baby" colors.
- Rounded, friendly typography that still feels a bit "storybook" (not a generic sans-serif UI font).
- Illustrated (not photographic) art style throughout — zone backgrounds, Lunara's evolution stages, UI icons.
- Big, touch-friendly tap targets throughout (buttons, answer choices, drag & drop pieces) since tablets/phones are a primary target.
- Animated transitions (zone unlocks, Lunara leveling up, correct/incorrect feedback) using Framer Motion for a sense of delight without needing hand-drawn animation.

## Technical Approach

**Frontend:** standard React app (matches existing day-to-day stack). No component library like MUI for this project — its default "enterprise dashboard" look works against the fantasy theme. Custom CSS/Tailwind instead, so the visual style stays fully controlled.

**Animation:** Framer Motion for transitions, level-ups, and zone unlocks. No dedicated game engine (e.g., Phaser) — nothing in scope needs physics, sprite sheets, or complex canvas rendering; CSS/SVG animation covers it.

**Data/storage (v1):** browser localStorage holds the profile, XP, tier progress per topic, and zone-unlock state. No backend or database in v1.

**Future path:** if progress-sync or a parent view becomes a priority, a lightweight Node.js API (matching existing backend experience) backed by a small database would replace localStorage, most likely deployed on AWS.

## Data & Progress

**v1 model:** everything lives in the browser's localStorage, keyed by profile:
- Profile info (name, grade, avatar)
- Per-topic difficulty tier
- Lunara's XP/level
- Zone-unlock state

This means progress is tied to one device/browser — clearing browser data or switching devices loses it. That trade-off is acceptable for v1 given the "nice to have, not critical" priority on persistence.

**If/when a backend is added:** the same data shape can move to a small database behind a Node API, enabling cross-device sync and a parent-facing progress view, without changing how the frontend already models progress.

## Roadmap & Future Phases

Deliberately deferred out of v1 to keep the first build achievable:

| Feature | Phase |
| --- | --- |
| Audio narration (questions read aloud) | Phase 2 |
| Backend + cross-device progress sync | Phase 2 |
| Parent PIN view with progress/accuracy stats | Phase 2 |
| Additional topics (fractions, geometry) | Phase 2+ |
| Larger world map / additional zones | Phase 2+ |
| Classroom/teacher assignment features | Phase 3 (only if there's reason to expand beyond personal use) |

v1's job is to prove out the core loop — adaptive practice, Lunara's growth, and the world map — end to end, before adding scope.
