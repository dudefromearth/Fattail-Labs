# FatTail Labs — Lesson Course Navigation Spec v1.1

**Status:** DRAFT — Coach-directed change (2026-07-28); supersedes v1.0 **for the
main-column prev/next and Mark-complete placement only**. The course rail (v1.0
§§2–8) is unchanged and remains in force.
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md` §5.3 — where parent
says prev/next placement, **this document now wins**.
**Routes (current namespace):** `/course/{courseSlug}/{moduleSlug}/{lessonSlug}`
**Implements in:** lesson page (`web/app/course/[slug]/[moduleSlug]/[lessonSlug]/page.tsx`),
`web/components/LessonPlayer.tsx` (Mark-complete relocation), new
`web/components/LessonFlowBar.tsx`

---

## 1. Intent (Coach, 2026-07-28)

Members finishing a lesson should flow to the next one — or back — **without
hunting**, even across module boundaries, and completing a lesson should live in
the same gesture. One control cluster, directly under the video:

```
┌──────────────────────────────────────────────────────────────┐
│                        [ video player ]                      │
└──────────────────────────────────────────────────────────────┘
              ‹        [ ✓ Mark complete ]        ›
```

Coach direction (2026-07-28): **no text labels — follow the Apple HIG.**
Prev/next use the standard back/forward symbols only (Toolbars guidance: "use
the standard Back … prefer the standard symbols … don't use a text label").
Lesson titles move to tooltips and accessibility labels.

## 2. The Lesson Flow Bar

### 2.1 Placement

| Lesson shape | Bar position |
|---|---|
| Has video player | **Directly under the video** (before notes/body) |
| No video (text/quiz/download) | Directly **above** the lesson body/notes box |
| Quiz lesson | Above the quiz; completion element follows §2.4 quiz rule |

One bar per page. The old bottom-of-content `NavRow` is **removed** (not
duplicated); the rail (v1.0) remains the full-outline navigation.

### 2.2 Anatomy (left → center → right)

| Slot | Content | Behavior |
|---|---|---|
| **Prev** | Standard back chevron (`‹`), symbol only | Links to the previous lesson in **flat course order** (module boundaries do not stop it — last lesson of module N precedes first lesson of module N+1) |
| **Center** | **Mark complete** button | Between the nav controls, always centered; see §2.4 |
| **Next** | Standard forward chevron (`›`), symbol only | Next lesson in flat course order |

- **No visible text labels** (HIG Toolbars rule). Each control carries the
  destination as `title` tooltip and accessible name:
  `Previous lesson: {title}` / `Next lesson: {title} — {module title when it
  differs from the current module}`.
- Chevrons use one consistent symbol pair app-wide (Icons guidance); ≥44 pt
  hit regions (Buttons guidance) even though the glyph is small.
- Next is the visually primary control (filled circle); prev is quiet — style,
  not size, distinguishes them (Buttons guidance).
- First lesson: prev hidden (layout keeps its slot). Last lesson: next hidden;
  returning to the course stays in the breadcrumb (hierarchy back).

### 2.4 Mark complete (center slot)

| State | Render | Action |
|---|---|---|
| Not completed | `Mark complete` (outline button, check icon) | POST progress complete (existing endpoint); optimistic flip; emits the v1.0 §5.2 `labs:progress` event (rail updates live) |
| Completed | `✓ Completed` (success tint, non-destructive) | No-op; completion is never cleared here (v1.0 invariant) |
| Anonymous / no session | Hidden (nav buttons still render) | — |
| Quiz lessons | Replaced by static hint `Complete via quiz` or hidden (quiz submit owns completion — Progress Tracking v1.0) | — |

Auto-complete from the player (watch-threshold) still works and flips the same
button state via the same event. **This bar is now the single home of
Mark-complete** — the button inside `LessonPlayer` moves here (no duplicate
controls).

### 2.5 Mobile (< md)

Symbol-only controls fit one row at any width: single row, chevrons at the
edges, Mark complete centered (no stacking needed). Hit regions stay ≥44 pt.

## 3. Data

No new endpoints. Flat order derives from the course detail payload already on
the page (modules[].lessons[] in order — same source as v1.0 rail). Completion
state and write path are Progress Tracking v1.0 as today.

## 4. Access invariants (inherited)

Bar never unlocks content (destination decides); no progress spoofing —
optimistic flip only after a successful write, mirroring v1.0 §7.

## 5. Accessibility

- `<nav aria-label="Lesson navigation">` wrapping the bar.
- Prev/next are real links (⌘-click works); Mark complete is a `<button>`.
- Completed state announced (`aria-pressed`/label change), not color-only.
- Focus order: prev → complete → next.

## 5.1 Apple HIG reference (Echo review basis)

The flow bar is, in HIG vocabulary, a **toolbar**: "one or more sets of controls
arranged horizontally along the top or bottom edge of the view, grouped into
logical sections … toolbars act on content in the view, facilitate navigation …
include navigation controls, like back and forward, and actions, or bar items,
like buttons."

| HIG document | Guidance we apply |
|---|---|
| [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) | Mixing navigation controls + actions in one edge-anchored bar is the sanctioned pattern; group into logical sections; choose items deliberately (we have exactly three); make each control's meaning unmistakable |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | One prominent button per view for the most likely action (our filled **Next**); "use style — not size — to distinguish the preferred choice" (Prev = quiet chip, same height); ≥44 pt hit targets; visible press states |
| [Page controls](https://developer.apple.com/design/human-interface-guidelines/page-controls) | HIG's sequential-content component — considered and rejected: dots don't scale to 33-lesson courses and carry no titles; noted so the choice is on record |

**Conformance ruling (Coach, 2026-07-28):** symbol-only prev/next per the
Toolbars rule — no text labels. Destination titles live in tooltips and
accessible names. Literal dot-style Page Controls remain rejected (the HIG
scopes them to small page counts; 33-lesson courses overflow them).

## 6. Verification checklist

- [ ] Bar renders directly under the video on video lessons; above body on text lessons; above quiz on quiz lessons
- [ ] Prev/next are symbol-only chevrons; tooltip + accessible name carry `Previous/Next lesson: {title}` (module named when it changes)
- [ ] Module boundary: last lesson of module N → next = first lesson of module N+1
- [ ] First lesson: prev hidden; last lesson: next hidden (breadcrumb owns course-back)
- [ ] Hit regions ≥44 pt on both chevrons and the complete button
- [ ] Mark complete sits between prev and next; completing flips button AND rail row without reload (v1.0 §5.2 event)
- [ ] Quiz lesson: no Mark-complete button; quiz submit still completes
- [ ] Anonymous: nav renders, no complete button
- [ ] Old bottom NavRow gone; no duplicate Mark-complete in player
- [ ] Mobile: stacked order complete/next/prev, full-width

## Version history

| Ver | Change |
|---|---|
| v1.0 | Course rail + main-column linear prev/next (approved as built) |
| **v1.1** | **Lesson Flow Bar**: prev/next moved directly under video, cross-module, **symbol-only chevrons per HIG** (titles in tooltips/accessible names); Mark-complete relocated between them; bottom NavRow removed |
