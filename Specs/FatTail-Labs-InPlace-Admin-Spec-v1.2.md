# FatTail Labs — In-Place Admin Editing Spec v1.2

**Status:** Approved as built (2026-07-21)
**Extends:** v1.1 (direct manipulation — unchanged). Adds **structure creation and
deletion** to the same model: the Modules list is where course structure is built,
in place.

---

## 1. Principle (extension)

Structure is created empty, then filled by direct manipulation. In edit mode the
Modules tab grows creation affordances; a new module arrives empty with an editable
title and metadata; new lessons arrive as editable rows; navigating to a new lesson's
page lets you manipulate its features (notes block, and its video via the course-page
row) exactly like any existing content.

## 2. Edit-mode Modules tab additions

| Affordance | Behavior |
|---|---|
| **+ Add module** (below the list) | Creates an empty module (`New Module`, kind `standard`) at the end; page republishes and reloads still in edit mode |
| Module title | `EditableText` (was static in v1.1) |
| Module kind | `EditableSelect`: standard / worksheets / resources / bonus (kind drives completion denominators — spec'd behavior unchanged) |
| **+ Add lesson** (per module) | Creates an empty lesson (`New Lesson`, kind video, no video yet) as an editable row |
| 🗑 per module / per lesson | Deletes after confirm; module delete cascades its lessons |

- Creation/deletion are immediate server writes (not part of the dirty batch): they
  republish and reload. If the dirty set is non-empty, the action is refused with
  "save or discard pending edits first" — no silent loss (v1.1 §7.3 upheld).
- **Edit mode persists across these reloads** (sessionStorage, per course) so
  building out a course is one continuous session.

## 3. Server additions (admin API)

```
PUT    /api/admin/modules/{id}            {title?, kind?}   field-allowlisted
POST   /api/admin/courses/{slug}/modules  {title?, kind?}   -> {module_id}
POST   /api/admin/modules/{id}/lessons    {title?}          -> {id, slug}
DELETE /api/admin/modules/{id}                              cascades lessons
DELETE /api/admin/lessons/{id}
```

- New lesson slugs are server-generated: slugified title, uniquified within the
  module (`new-lesson`, `new-lesson-2`, …). Sort orders append at the end.
- Deletion cascades progress rows via existing FKs — deleting content deletes its
  progress records (bookkeeping follows content; enrollments are untouched).

## 4. Out of scope (next iterations)

Reorder (drag) of modules/lessons · hero/trailer upload · attachments management ·
category/instructor assignment.
