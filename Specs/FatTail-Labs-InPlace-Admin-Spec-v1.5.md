# FatTail Labs — In-Place Admin Editing Spec v1.5

**Status:** Approved as built (2026-07-21)
**Extends:** v1.4. The lesson-notes markdown editor embeds **images by upload**.

---

## 1. Image embedding (lesson page editor)

Three equivalent inputs, GitHub-style:
1. **🖼 Insert image…** toolbar button (multi-select file picker),
2. **paste** an image from the clipboard into the textarea,
3. **drag-drop** image files onto the textarea.

Flow: a `![Uploading name…]()` placeholder lands at the cursor immediately;
the file uploads to the public media tier (`POST /api/admin/media` — same
store as banners, so everything appears in the Media Library); on success the
placeholder is swapped for `![name](/api/media/<hash>.<ext>)`, on failure it is
removed and the toolbar shows the error. Alt text defaults to the filename
minus extension. Save is disabled while an upload is in flight.

## 2. Rendering

The sanitized site-wide renderer already permits `img`; it now styles them
(`max-w-full`, rounded, block spacing) — Markdown/preview/public render
identically, and non-image pastes are untouched.

## 3. Notes

- Lesson images live in the **public** tier: the lesson page is role-gated but
  its image URLs are not. Fine for charts/diagrams; anything that must be
  member-only belongs in private-tier resources, not inline images.
- Deleting a lesson-embedded image from the Media Library is NOT reference-
  checked against `body_md` (the 409 guard covers banners and attachments) —
  logged as accepted debt; re-embedding the file restores it.
