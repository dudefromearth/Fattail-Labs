# FatTail Labs — Resource Library Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** §4.2 (`/resources` global library) · §3.3 (Trade Lab Resources pillar)
**Extends:** In-Place Admin v1.3 media storage (adds a private tier)

---

## 1. Model

The library is the global view of course attachments — no new content type. Every
attachment belongs to a course; the library aggregates them with course + category
context for filtering.

## 2. Storage tiers & gating

- **Public media** (v1.3, unchanged): images (heroes) at `/api/media/*` — public by
  design.
- **Private files** (new): uploaded via `POST /api/admin/media?private=true`
  (pdf/zip/xlsx/csv/docx/pptx/txt/md + images, ≤ 25 MB) into `server/uploads/private/`
  — NOT statically mounted. Attachment `url` stores the `private:{name}` reference.
- **Downloads are gated**: `GET /api/attachments/{id}/download` requires
  **activator+** (membership — resources are a member benefit); streams with a
  human filename derived from the attachment title. Admins always pass.
  External links (`kind=link`) open directly and require only sign-in to see.

## 3. API

```
GET /api/resources                    session required: all attachments of published
                                      courses [{id,title,kind,course,categories,
                                      url(link-kind only),downloadable}]
GET /api/attachments/{id}/download    activator+ → file stream (403 observer, 401 anon)
POST /api/admin/media?private=true    admin upload to the private tier
```

Public course payload attachments gain `id` (+ `url` for link kind) so the course
Resources tab can link files through the download endpoint.

## 4. UI

- **`/resources`** page (header nav gains a Resources link): filter chips by category
  and kind, resource cards (type icon, title, course link). Files → Download button
  (observers see a Become-a-member prompt on 403); links → open in new tab.
  Signed-out → sign-in prompt.
- Course **Resources tab** rows become functional: files download via the endpoint,
  links open. The v1.3 attachments editor's file upload now targets the private tier.

## 5. Invariants

1. Private files are never reachable by URL guessing — only through the
   role-checked download endpoint.
2. The library derives entirely from course attachments — no orphan resource store.
