# FatTail Labs — Course Card Editor Spec v1.0

**Status:** Approved as built (2026-07-21)
**Context:** Catalog cards (Udemy model) previously derived their banner from
category art and the hover panel from subtitle + description outcomes. Admins
can now author both, per course, directly on the catalog.

---

## 1. Model (migration 010)

`courses` gains three nullable columns:
- **`card_color`** — hex; rendered as the banner gradient
  `135deg, shade(color, 0.3) → color` with the category label + title art kept.
- **`card_image_url`** — banner image; scales to fill (`object-cover`,
  16:9 banner). Public-tier media upload or any URL.
- **`card_blurb_md`** — Markdown shown in the hover panel **instead of** the
  default subtitle + ✓-outcomes block. Derived meta (duration, level, lesson
  count, NEW/Certification badges) is not editable — it stays truthful.

**Banner precedence:** `card_image_url` → `card_color` → `hero_image_url` →
category gradient. NULL everywhere = exactly the pre-v1.0 behavior.

## 2. Editor (on the catalog, admin only)

Each card shows an **✎ Card** chip (top-right) for administrators. Clicking it
replaces the card face with an inline editor:
- Live banner preview reflecting the current choice.
- Curated palette swatches (the category-art end-stops) + native color picker +
  clear. Picking a color clears the image (they are alternatives).
- **Upload image…** (public media tier, png/jpg/webp ≤5MB) or paste a URL;
  remove-image reverts to color/derived art.
- Blurb textarea (Markdown; empty = default panel content).
- Save → `PUT /api/admin/courses/{slug}` (allowlist gains the three fields) →
  revalidate `/courses` + `/courses/{slug}` → reload. Cancel discards.

## 3. API deltas

- Public catalog/detail payloads and `GET /api/admin/courses/{slug}` include
  `card_color`, `card_image_url`, `card_blurb_md`.
- No validation beyond the allowlist (consistent with `hero_image_url`);
  rendering is XSS-safe via the sanitized Markdown pipeline.
