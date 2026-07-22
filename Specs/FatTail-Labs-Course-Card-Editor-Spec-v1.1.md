# FatTail Labs — Course Card Editor Spec v1.1

**Status:** Approved as built (2026-07-21)
**Supersedes v1.0** — same-day revision on review: the hover quick-view popup is
removed, and the card banner unifies with the course page header.

---

## 1. Changes from v1.0

- **Hover quick-view popup removed.** Cards click straight through to the course
  page on every device. With it, `card_blurb_md` (its only consumer) is dropped.
- **One banner per course** — `hero_image_url` is the single shared image:
  - **Catalog card:** rendered **sharp** (`object-cover`, 16:9).
  - **Course page header (and draft editor):** the same image **expanded**
    behind the full header, **Gaussian-blurred** (`blur-2xl`, `scale-110` to
    hide edge fringe) with a **dark shade** (`bg-zinc-950/60`) so the title and
    meta stay legible.
  - `card_image_url` is dropped (superseded).
- Migration 011 removes both columns. `card_color` remains the no-image banner
  choice; precedence is now: banner image → card color → category art.

## 2. Uploading the banner

Two places, one store (public media tier):
1. **Course page** — the Hero image chip in edit mode (existing).
2. **Media Library** (`/admin/media`) — see Media Library spec v1.0; the card
   editor links to it, and its URLs paste into the card editor's image field.

The catalog **✎ Card** editor remains (color palette + custom picker, image
upload/URL — now writing `hero_image_url` — live sharp preview, save →
revalidate both pages).
