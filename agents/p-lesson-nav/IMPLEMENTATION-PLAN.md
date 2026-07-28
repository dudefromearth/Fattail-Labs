# Implementation Plan — Lesson Flow Bar (Lesson-Course-Nav v1.1)

**Project id:** `p-lesson-nav` (single-feature program)
**Spec:** [`Specs/FatTail-Labs-Lesson-Course-Nav-Spec-v1.1.md`](../../Specs/FatTail-Labs-Lesson-Course-Nav-Spec-v1.1.md) (DRAFT until Coach approves)
**Scope:** frontend-only — no schema, no API changes (flat order + progress write
already exist client-side).

## ⚠️ Coordination gate (read first)

The lesson page (`web/app/course/[slug]/[moduleSlug]/[lessonSlug]/page.tsx`) and
`web/components/LessonPlayer.tsx` carry **uncommitted changes from the active
Apps-hub/SEO session**. Do not start LN2 until that work is committed, or
explicitly hand the files over — two writers on one file is how work gets lost.
Current as-is (verified 2026-07-28): cross-module flat prev/next with title
labels already exists in `NavRow` (bottom of content); `Mark complete` lives
inside `LessonPlayer`. This project **moves and merges** — it does not build
nav from scratch.

## Locked decisions

| ID | Decision |
|----|----------|
| LN-D1 | One flow bar; bottom `NavRow` removed; player's internal Mark-complete removed (single home) |
| LN-D2 | Flat course order crosses modules; module change named in tooltip/accessible label (no visible cue line) |
| LN-D3 | Center = Mark complete; hidden anon; quiz lessons defer to quiz submit |
| LN-D4 | First lesson: prev hidden; last lesson: next hidden (breadcrumb owns course-back) |
| LN-D5 | Reuse `labs:progress` event (rail live-update unchanged, v1.0 §5.2) |
| **LN-D6** | **Symbol-only chevrons per Apple HIG (Coach 2026-07-28)** — no text labels; lesson titles in `title` tooltip + accessible name; ≥44 pt hit regions; dot-style Page Controls rejected (HIG scope) |

## Seeds

### LN1 — Coach: spec approval (gate)
Approve/amend v1.1. Under-video placement, center Mark-complete, title labels,
module cue, mobile stack order (§2.5) are the decisions embodied; say the word
and any of them change before build.

### LN2 — Charlie: build (after coordination gate)
**Files:** new `web/components/LessonFlowBar.tsx`; lesson page (mount under
player / above body, delete `NavRow`); `LessonPlayer.tsx` (remove internal
Mark-complete, keep auto-complete + event emit).
**Work:** props = `{prev, next, currentModuleSlug, courseSlug, lessonSlug, completed, canComplete}`;
flat-order derivation stays in the page (already there); module cue when
`prev/next.moduleSlug !== currentModuleSlug`; anatomy/behavior per spec §2;
a11y per §5; mobile per §2.5.
**Done when:** `npx tsc --noEmit` clean; `next build` clean; spec §6 checklist
rows 1–5, 8–9 pass on dev with screenshots.

### LN3 — Echo + Tango: review
HIG pass on the bar (spacing under player, chip vs filled hierarchy, truncation);
Tango: completion affordance must not gamify (no streak copy, no confetti);
verify "Complete via quiz" hint is honest.

### LN4 — Kilo + Delta: verify + close
Playwright (or manual evidence) for spec §6 full checklist incl. quiz lesson and
anonymous; Delta files evidence to `gate-reports/`; Lima: decision-log entry
(v1.1 supersession of parent §5.3 placement) + flip spec status; revalidate
affected lesson paths after deploy build.

## Sequencing

LN1 (Coach) → coordination gate clears → LN2 → LN3 ∥ LN4-prep → LN4 → ship with
next web build.

Estimate: LN2 is a focused half-day seed; no migration, no API, no SEO impact
(bar is client-rendered on force-dynamic lesson pages).
