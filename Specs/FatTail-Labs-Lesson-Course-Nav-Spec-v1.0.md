# FatTail Labs — Lesson Course Navigation Spec v1.0

**Status:** Approved as built (2026-07-22)
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md` §5.3 (lesson player page)
**Siblings:** Progress Tracking v1.0 (completion data), Enrollment & Access v1.0
(who may open a lesson), SEO v1.1 (anonymous lesson landing)
**Implemented in:** `web/components/LessonCourseNav.tsx`,
`web/lib/progressEvents.ts`,
`web/app/courses/[slug]/lessons/[lessonSlug]/page.tsx`,
`web/components/LessonPlayer.tsx`, `web/components/QuizPlayer.tsx`

---

## 1. Purpose

While a member (or visitor) is on a lesson page, they need continuous orientation
inside the **current course**: where they are, what remains, and a one-click jump
to any other lesson—without returning to the course detail page.

The course navigation rail is that chrome. It does **not** grant access: the
lesson API remains the authority (Enrollment & Access matrix). The rail only
links; the destination page decides player vs lock vs sign-up CTA.

---

## 2. Where it appears

| Lesson page state | Rail shown? | Notes |
|---|---|---|
| Authenticated, lesson allowed (200) | **Yes** | Full rail + live completion when progress loads |
| Authenticated, lesson forbidden (403) | **Yes** | Orientation still useful; structure from public course payload |
| Anonymous (401 → public landing) | **Yes** | Structure only; no session progress (empty / incomplete ticks) |
| Lesson not found (404) | No | Standard not-found |

Route: `/courses/{courseSlug}/lessons/{lessonSlug}` (all successful renders of
that page that resolve a course).

---

## 3. Layout

Desktop (`lg` and up):

| Region | Grid | Content |
|---|---|---|
| Main column | **9 / 12** | Breadcrumb, title, player/quiz, prev/next, notes, CTAs |
| Right rail | **3 / 12** | Course navigation widget |

Mobile / narrow:

- Single column: **main content first**, rail **below**.
- Rail is not required to be a drawer in v1.0.

Rail chrome:

- Sticky under the site header on desktop (`sticky`, offset clear of header).
- Scrollable module list with a max height so long courses do not dominate the
  viewport.
- Landmark: `<nav aria-label="Course lessons">`.

Page shell max width may widen relative to pre-nav lesson pages so the 9+3
split remains readable (e.g. `max-w-7xl`).

Prev/next lesson controls in the **main column** remain required (parent §5.3);
the rail does not replace them.

---

## 4. Widget contents (top → bottom)

### 4.1 Header

1. **Course title** — text link to `/courses/{slug}` (course detail).
2. **Progress summary** (all visitors see the UI; numbers reflect session data):
   - `done / total complete` where `total` = count of all lessons across all
     modules in course order, and `done` = lessons with `completed: true` in
     the progress map.
   - Percent = `round(100 * done / total)` (0 if total is 0).
   - Horizontal bar visual matching that percent.

When the viewer has no session or progress fetch fails, `done` is 0 and every
lesson shows the incomplete indicator (structure still lists).

### 4.2 Module groups

For each module in course order (public course detail payload):

- Module **title** as a non-link section label.
- Under it, an ordered list of that module’s lessons.

### 4.3 Lesson rows

Each lesson is a single link to  
`/courses/{courseSlug}/lessons/{lessonSlug}`.

Row content (left → right):

| Element | Behavior |
|---|---|
| **Completion indicator** | See §5 |
| **Kind glyph** | Affordances only: video / quiz / download / other |
| **Title** | Up to two lines clamped |
| **Meta** | Duration in minutes when `duration_seconds > 0`; optional “Free” when `free_preview` |

**Current lesson:** the row whose slug equals the page’s `lessonSlug`:

- Visual highlight (background + weight).
- `aria-current="page"`.
- Completion indicator uses the “current” variant when not yet completed (§5).

---

## 5. Completion indicators

Three mutually exclusive visual states per lesson row:

| State | When | Appearance (normative intent) |
|---|---|---|
| **Completed** | Progress map says `completed` for that slug | Filled success mark (e.g. ✓ in emerald disc); `aria-label="Completed"` |
| **Current** | Slug is current lesson and not completed | Emphasized ring/dot; `aria-label="Current lesson"` |
| **Incomplete** | Otherwise | Empty circle; `aria-label="Not completed"` |

Completed **wins over** current (a finished lesson you reopened still shows
completed).

### 5.1 Progress data source

- **Read:** `GET /api/me/progress?course={slug}`  
  Shape per Progress Tracking v1.0:  
  `{ lessons: { [lesson_slug]: { completed, last_position, watch_seconds } } }`
- **Session required** for a non-empty map. No cookie / 401 → treat as empty map.
- Progress is **not** embedded in the public course payload (keeps catalog
  cacheable and identity-free).

### 5.2 Live updates

While the member remains on a lesson page, completion of the **current** lesson
must update the rail without a full navigation:

- Player auto-complete and “Mark complete” emit a same-tab browser event
  (`labs:progress` / `PROGRESS_EVENT`) with  
  `{ courseSlug, lessonSlug, completed: true }`.
- Quiz submit that marks the lesson complete emits the same event.
- The rail listens and sets that slug’s `completed` in local state.

Completion is never cleared by the rail. Full rules for when `completed_at` is
stamped remain Progress Tracking v1.0.

---

## 6. Data & dependencies

| Need | Source |
|---|---|
| Module/lesson tree, titles, kinds, durations, free_preview | Public course detail (`GET /api/courses/{slug}` / `fetchCourse`) |
| Current lesson identity | Route param `lessonSlug` |
| Completion map | `GET /api/me/progress?course=` (session) |
| Live complete | Client event from player/quiz |

If the course detail cannot be loaded, the rail is **omitted** (main column
still renders if the lesson payload alone is enough).

---

## 7. Access invariants

1. **Rail never unlocks content.** Clicking a gated lesson still hits the lesson
   endpoint; 403/401 UIs are unchanged.
2. **No progress spoofing via the rail.** Indicators only reflect API progress
   (and optimistic same-tab complete events after a successful write).
3. **Anonymous visitors** may see the full outline (public catalog structure)
   for orientation and SEO-adjacent discovery; they do not receive other
   members’ progress.
4. **Same structure** for free-preview and member lessons—no separate nav trees.

---

## 8. Accessibility

- Course outline is a single `nav` with an accessible name (“Course lessons”).
- Current lesson uses `aria-current="page"`.
- Completion state is available via `aria-label` / `title` on the indicator,
  not color alone.
- Module titles are text headings/labels, not interactive decoys.

---

## 9. Non-goals (v1.0)

- Collapsible module accordions (always expanded).
- Drag-and-drop reorder (admin structure editing stays on course page).
- Mobile slide-over / hamburger drawer for the rail.
- Per-lesson lock icons beyond free-preview meta (destination page owns locks).
- Server-side injection of progress into HTML for the rail (client fetch is fine;
  lesson pages are already `force-dynamic` for the player).
- Separate “course map” page.

---

## 10. Verification checklist

- [ ] Logged-in lesson page: `lg` layout is 9 + 3; rail sticky.
- [ ] All modules and lessons from the course appear in order with correct links.
- [ ] Current lesson is highlighted and `aria-current="page"`.
- [ ] After auto-complete or Mark complete, the current row’s indicator becomes
      completed without reload; header `done/total` increments.
- [ ] Anonymous free-preview landing: rail present; progress stays at 0 / empty
      ticks unless a later session exists.
- [ ] 403 member wall: rail still present when course detail loads.
- [ ] Narrow viewport: content above rail; no horizontal page break.
- [ ] Prev/next in main column still work.

---

## 11. Relationship to parent §5.3

This spec **extends** the lesson player page anatomy. Parent §5.3 remains the
authority for player, notes, and linear prev/next. Where layout width or chrome
differs, **this document wins** for the rail and the 9/12–3/12 split.
