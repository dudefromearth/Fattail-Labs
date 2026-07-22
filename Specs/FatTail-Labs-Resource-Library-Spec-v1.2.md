# FatTail Labs — Resource Library Spec v1.2

**Status:** Approved as built (2026-07-21)
**Extends:** v1.1 (visibility + admin create/delete). Items become **editable in
place** and carry a **description** and a **representative emoji**.

---

## 1. Model (migration 012)

`attachments` gains `description_md` (TEXT, NULL) and `emoji` (VARCHAR(16),
NULL, ≤16 chars validated). NULL emoji falls back by kind: file → 📄, link → 🔗.

## 2. Library page

- Every item renders emoji (in the leading circle), title, visibility badge,
  description (2-line clamp), owning course link.
- **Admin in-place editing:** an Edit action on each row swaps the row body for
  an inline editor — emoji quick-pick strip (📄 📊 📈 🧮 🎥 🔗 📚 🧠 ✅ ⚡) +
  free-entry custom field, title input, description textarea. Save PUTs and
  refreshes the list; Cancel discards. Free-toggle and Delete unchanged (v1.1).
- **Create form** gains the same emoji picker + a description field.

## 3. API deltas

- `GET /api/resources` items include `description_md` + `emoji`.
- Attachment create/update accept both (update allowlist extended); empty
  strings normalize to NULL.

## 4. Scope note

The course page Resources tab still renders title/kind/free only — emoji and
description surface on the library page. Extending them to the course tab is
future scope (requires CourseDetail attachment payload + draft adapter ripple).
