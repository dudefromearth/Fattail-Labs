# FatTail Labs — In-Place Admin Editing Spec v1.4

**Status:** Approved as built (2026-07-21)
**Extends:** v1.3. Adds **course lifecycle**: unpublish and delete, closing the last
authoring gap (v1.3 noted drafts could accumulate with no delete).

---

## 1. Danger zone

In edit mode, the bottom of the course page (and the draft editing route) shows a
**Danger zone** section:

- **Unpublish** (shown only when published): sets status → draft immediately,
  republishes (public page 404s, catalog drops it on regeneration), and redirects
  the admin to the draft editing route `/admin/courses/{slug}` where work continues.
- **Delete course**: confirmation requires **typing the exact course title**
  (stronger than the confirm() used for modules/lessons — a course is a body of
  work). On confirm: full delete, redirect to the catalog.
- Both are immediate structure writes: refused while the dirty set is non-empty
  (v1.2 rule — no silent loss).

## 2. Server

```
DELETE /api/admin/courses/{slug}
```

Deletion cascade: modules → lessons → progress/questions/attempts (FKs), enrollments,
reviews, certificates (FKs); **plus explicit cleanup of the non-FK relations** —
course attachments (incl. their private files on disk) and course-scoped threads
(comments cascade via thread FK). `live_sessions.replay_course_id` nulls (FK).
Unpublish is the existing status update (no new endpoint); `published_at` is
retained so republishing keeps the original date.

## 3. Draft visibility on the course page

A draft's public URL (`/courses/{slug}`) returns a genuine 404 to everyone — but the
404 page carries an admin-only client check: when the caller is an administrator and
the slug resolves in the admin API, they are routed straight into the draft editor
(`/admin/courses/{slug}`). Non-admins see the plain 404; the HTTP status and SEO
behavior are unchanged; the admin API remains the sole authority.

## 4. Invariants

1. Course deletion is admin-only, title-confirmed, and total — no orphan rows or
   orphan private files.
2. Unpublish never loses content — it is a visibility change, continued on the
   draft route.
3. Drafts render for administrators only, and only via the admin route — the public
   surface never serves draft content, even to admins (it redirects instead).
