# FatTail Labs — Resource Library Spec v1.1

**Status:** Approved as built (2026-07-21)
**Extends:** v1.0. Adds **per-resource visibility** (free vs members) and **admin
create/delete controls on the library page itself**.

---

## 1. Visibility (migration 006: `attachments.free_preview`)

- Every resource is **free** or **members-only** — set at creation, toggleable after.
- **Free** mirrors lesson free-previews: any signed-in account (observer+) may
  download/open. Signup remains the price of everything — nothing is anonymous.
- **Members-only** (default): alumni+ (unchanged v1.0 rule).
- Badges everywhere the resource renders: "Free" (emerald) vs "Members".

## 2. Admin controls

- **Course Resources tab** (edit mode, as v1.3): create gains a Free checkbox;
  each row gains a Free toggle alongside rename/delete.
- **`/resources` library page** (admins, no edit mode needed): a create form with a
  **course selector** (a resource always belongs to a course — no orphan store,
  v1.0 invariant upheld), title, URL or private-file upload, Free checkbox; each
  listed resource shows a Free toggle and delete (confirmed).

## 3. API deltas

- `POST /api/admin/courses/{slug}/attachments` + `PUT /api/admin/attachments/{id}`
  accept `free_preview`.
- `GET /api/resources` and public course payloads include `free`.
- `GET /api/attachments/{id}/download`: free → any session; members-only → alumni+.
