# FatTail Labs — Media Library Spec v1.0

**Status:** Approved as built (2026-07-21)
**Context:** Course banners (Course Card Editor v1.1) can be uploaded from the
course page or "from a media page" — this is that page.

---

## 1. Page (`/admin/media`, administrators only, noindex)

Grid of every **public-tier** upload (banners and other public images), newest
first: 16:9 thumbnail, filename, size, date. Actions per item:
- **Copy URL** — for pasting into the card editor or anywhere else.
- **Delete** — confirmed; the server refuses (409, with the list of referencing
  courses/attachments) while anything still uses the file. No orphan-banner
  404s, ever.
Plus a page-level **Upload image…** (same constraints as everywhere:
png/jpg/webp ≤ 5 MB, content-hash filenames dedupe re-uploads).

Private-tier files are NOT listed — they are member resources with role-gated
downloads, managed through the resource flows.

## 2. API

- `GET /api/admin/media` → `{media: [{name, url, bytes, modified}]}`.
- `DELETE /api/admin/media/{name}` → 409 if referenced by any
  `courses.hero_image_url` or `attachments.url`; 404 unknown; path traversal
  rejected (422).
- Upload remains the existing `POST /api/admin/media`.
