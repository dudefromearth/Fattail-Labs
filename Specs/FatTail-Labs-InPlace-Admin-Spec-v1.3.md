# FatTail Labs — In-Place Admin Editing Spec v1.3

**Status:** Approved as built (2026-07-21)
**Extends:** v1.1 (direct manipulation) + v1.2 (structure creation). v1.3 completes the
editor: reorder, media upload, category/instructor/attachment assignment, and
new-course creation. With this, no authoring task requires SQL.

---

## 1. Reorder (drag)

- In edit mode, module cards and lesson rows are **draggable** (HTML5 DnD). Dropping
  reorders within the course (modules) or within a module (lessons).
- Reorder is an immediate structure write (v1.2 semantics: refused while dirty,
  republish + reload, edit mode persists):
  `POST /api/admin/courses/{slug}/reorder-modules {module_ids}` ·
  `POST /api/admin/modules/{id}/reorder-lessons {lesson_ids}` — sort_order = list
  index; the id set must match the existing children exactly (422 otherwise).

## 2. Media upload (hero/banner)

- **Storage decision:** local disk (`server/uploads/`, git-ignored), filenames =
  content hash + extension (idempotent re-uploads), served by the API at
  `/api/media/{name}` (same-origin via the web proxy). S3-compatible storage is a
  future storage-backend swap; URLs are opaque to the rest of the system.
- `POST /api/admin/media` (multipart, admin): accepts png/jpeg/webp ≤ 5 MB → {url}.
- `hero_image_url` joins the course field allowlist. Edit mode adds a **Hero chip**
  (upload button) beside the Trailer chip; upload → immediate course update →
  republish. The hero image also replaces the gradient placeholder on catalog cards
  (existing card behavior — hero doubles as banner).
- Trailer remains YouTube (v1.0 trailer spec) — no video file uploads.

## 3. Assignment editors (in place)

- **Categories:** in edit mode the hero's Categories cell becomes a checklist of all
  categories (from `GET /api/admin/categories`); toggling applies immediately via
  `PUT /api/admin/courses/{slug}/categories {category_slugs}` (replace-set).
- **Instructors:** the About tab's instructor card gains a checklist
  (`GET /api/admin/instructors`, `PUT .../instructors {instructor_ids}` replace-set,
  order = list order).
- **Attachments (Resources tab):** add (title + kind link/file — file kind uploads
  through `/api/admin/media`), edit title/url inline, delete.
  `POST /api/admin/courses/{slug}/attachments` · `PUT /api/admin/attachments/{id}` ·
  `DELETE /api/admin/attachments/{id}`. Lesson-scoped attachments remain future scope.

## 4. New-course creation

- The catalog shows an admin-only **+ New Course** card →
  `POST /api/admin/courses {title?}` creates a **draft** (unique slug from title,
  level beginner) → navigates to the **draft editing route**
  `/admin/courses/{slug}` — a dynamic, admin-only page that renders the same course
  page components from the admin payload with edit mode active. Drafts stay
  invisible on all public surfaces (unchanged invariant); publishing (status →
  published in the edit bar) makes the public URL live, where editing continues as
  normal.
- Admin course payload extended with hero_image_url, categories, instructors, and
  attachments to power the draft page and assignment editors.

## 5. Invariants (additions)

1. Reorder can never orphan or duplicate children (exact-set validation).
2. Uploaded media is validated by type + size server-side; filenames are
   content-derived — no user-controlled paths.
3. Draft courses render only on the admin route for administrators; public surfaces
   remain 404 until published.
