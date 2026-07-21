# FatTail Labs — In-Place Admin Editing Spec v1.1

**Status:** Approved for build (2026-07-21, Coach directive)
**Supersedes:** v1.0's modal editor form. Coach: "My idea of in-place editing was not a
form — click on the item to edit, and the editor for that specific item appears.
Clicking a large block of text turns the block of text into an editor."
v1.0's server contract (admin API, field allowlists, save→revalidate pipeline,
dev-login containment) is unchanged and inherited.

---

## 1. Principle: Direct Manipulation

There is no editor form. **The page element IS the editor.** An administrator toggles
Edit mode; every editable element becomes clickable; clicking swaps the element for an
editor rendered in the element's own place, styled to match the display (same
typography, same position, same width). Leaving the editor swaps back to the display
showing the pending value. Nothing moves, nothing overlays the page.

## 2. Edit Mode

- Admins see the floating **✎ Edit** button (as v1.0). Clicking it enters **edit
  mode** — it does not open anything.
- In edit mode, editable elements show a hover affordance (dashed outline + pencil
  cursor). Clicking one activates its in-place editor.
- A floating **edit bar** (bottom of viewport) shows while in edit mode:
  publish status select (draft/published/archived — page-level, not an element),
  pending-change count, **Discard**, **Save & Publish**, and **Exit**.
- Edits accumulate locally (dirty set) — displayed values update immediately in
  place. **Save & Publish** persists everything (course PUT + per-lesson PUTs),
  triggers revalidation, reloads. Discard restores server values.
- Per-editor: blur or Enter commits the pending value to the dirty set;
  **Esc** cancels that element's edit.

## 3. Editable Elements (course page, v1.1 scope)

| Element | In-place editor |
|---|---|
| Course title (hero h1) | Text input, hero typography |
| Subtitle (hero) | Text input |
| Level (metadata strip) | Inline select |
| Description (About tab) | **Markdown block editor** (§4) |
| Lesson row: title | Text input in the row |
| Lesson row: video | YouTube URL/ID input + start/end inputs in the row |
| Lesson row: free preview | Toggle in the row |

Publish status lives in the edit bar. Unchanged v1.0 exclusions (module/lesson
create/delete/reorder, hero/trailer upload, attachments, categories/instructors)
remain the next iteration's scope.

## 4. Markdown (site-wide decision, folded in)

- **All long-text fields are full markdown**: rendered with `react-markdown` +
  `rehype-sanitize` (sanitization is mandatory — admin markdown must not become an
  XSS surface on public pages). Replaces the v1.0 minimal renderer everywhere:
  course descriptions, lesson `body_md`, and inherited by future reviews/discussion.
- The markdown block editor: clicking the rendered block swaps it for a textarea
  (sized to content, monospace) with a **Preview** toggle that renders the pending
  text through the SAME renderer as the public page — preview is exactly what
  publishes.
- Catalog hover-panel outcome bullets continue to parse `- ` lines from the raw
  markdown (data contract unchanged).

## 5. Lesson Page

- `body_md` renders as full markdown under the video for everyone.
- Admins get the same click-to-edit markdown block on the lesson page (its own
  save — the page is dynamic, no revalidation needed). This is where lesson notes,
  links, and transcripts get authored.

## 6. Mechanics

- Editable elements are client components (`EditableText`, `EditableMarkdown`,
  `EditableSelect`) that render display markup identical to v1.0's static output —
  static generation and SEO are unaffected; edit affordances attach only after the
  client-side admin check, in edit mode.
- Lesson slugs map to lesson ids via the admin course payload, fetched once when
  edit mode activates.
- All authority remains server-side (v1.0 §2 unchanged): the components are
  conveniences; the admin API validates everything.

## 7. Invariants (additions to v1.0's)

1. Editor placement is the element's own position — no modals, no drawers, no
   detached forms for element-level edits.
2. Display and preview use the same renderer as the public page.
3. Unsaved edits never write — leaving edit mode without Save & Publish loses
   nothing silently (Discard is explicit; navigation warns if dirty).
