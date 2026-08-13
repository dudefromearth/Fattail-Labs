# FatTail Labs — Catalog Order & Sections Spec v1.0

**Status:** DRAFT — Coach-directed (2026-07-28: "certain courses should be grouped,
and one course should appear at the upper left"). **v1.1** extends the same
contract to the Apps hub (`/app`) — admin-only steppers. Built per doctrine;
Coach review flips status.
**Parent:** Course Hosting v1.0 (catalog surface) · Application Framework v1.0
(Catalog Listing template; ordered-list contract B4)
**Precedent:** Apps hub sections (decision log 2026-07-28) · `apps.sort_order` · **DL-319**

---

## 1. Intent

The catalog at `/course` presents courses in an **editorially chosen order**, not
a computed sort: a designated course occupies the **first cell (upper left)**,
and related courses appear **grouped under section headings**.

## 2. Model (migration 038)

| Column (on `courses`) | Meaning |
|---|---|
| `sort_order INT NOT NULL DEFAULT 0` | Manual position in the catalog (ascending). Global across sections |
| `catalog_section VARCHAR(255) NOT NULL DEFAULT ''` | Display section heading. `''` = unsectioned |

Rules:
- **Section order is derived**: sections appear in order of their lowest member
  `sort_order` — no second table, no parallel ordering store (India: the course
  row is the single source).
- Unsectioned courses render **first, before any headed section** (the pinned
  upper-left course is simply the lowest `sort_order`, typically unsectioned or
  in the first section).
- Seed: migration assigns `sort_order` from current catalog order
  (published_at DESC) ×10 spacing; all sections `''` (Coach assigns in admin).

## 3. API

| Change | Detail |
|---|---|
| `GET /api/courses` | New default sort `order`: `sort_order ASC, published_at DESC`; response rows include `sort_order`, `catalog_section`. Existing `newest/enrolled/title` sorts remain (member-facing re-sort ignores sections; grouped rendering applies to default order only) |
| `POST /api/admin/courses/reorder` | Body `{course_ids: [...]}` (full order) — mirrors `reorder-modules`; rewrites `sort_order` ×10; admin only |
| `PUT /api/admin/courses/{slug}` | Accepts `catalog_section` (field-level, existing editor pathway) |

## 4. Admin UX (Catalog Listing template — Family A)

Per Application Framework **B4 ordered-list contract**: **↑↓ steppers, not drag**.

- In the catalog's existing admin surface, each card gains ↑ ↓ steppers
  (S-class immediate write via reorder endpoint; **stay-put** — filters, scroll,
  edit state preserved; patch client list, no reload).
- Moving across a section boundary moves the course into that neighbor section
  visually only if its `catalog_section` matches; steppers change **order**, the
  card editor changes **section** (a text field with datalist of existing
  section names — free-form, no section CRUD UI in v1).
- After any write: `void revalidate('/course')` for other visitors (Family A
  public page).

## 5. Member rendering

- Default view groups by section: unsectioned run first (no heading), then each
  section under a plain heading (sentence case, no counts, no chrome).
- Section headings render only when at least one course carries a section.
- Category/level filters and explicit sorts collapse to a flat grid (filters
  cut across sections; headings would mislead).

## 6. Apps hub (`/app`) — v1.1

The Apps grid at `/app` presents **editorially chosen order**, not a hardcoded
slug list. Same B4 steppers as `/course`. **Admin only** — members never see
controls and cannot write order.

| Piece | Detail |
|---|---|
| Store | `apps.sort_order` (existing column; migration **124** seeds current grid ×10 and inserts missing catalog rows `practice-log`, `options-lab`) |
| Public read | `GET /api/apps` already returns `sort_order` and orders `sort_order, id` |
| Admin write | `POST /api/admin/apps/reorder` body `{app_ids: [...]}` — administrator session; rewrites `sort_order` ×10. Unknown ids → 422. Nested Practice suite rows (`trade-log`, `journal`, …) are **not** on the grid and need not be in the id list |
| UX | `useIsAdmin()` → ←→ on each card (`AppsGrid`). Walks **reading order** (top-left → right → next row). Last cell wraps to top-left; first wraps to last. Optimistic stay-put. `revalidate(['/app'])` |
| Highlight | Admin iOS switch per card. `apps.highlighted` (migration **125**). On: powder-blue fill `#EEF4FB` + **3px** `#1B4F8B` outline. Members see the paint, not the switch. `PUT /api/admin/apps/{id}` `{highlighted}` |
| Compose | Hub still hides nested Practice slugs and overrides title/href for Practice / Options Lab. After every visible card has a real `id`, order follows `sort_order`. Pre-migration fallback keeps the old hardcoded slug list so the grid does not reshuffle |

Member view is identical to today except the persisted order. No drag. No
member-facing sort control.

## 7. Verification

- [ ] Migration seeds current order; catalog renders unchanged before any admin edit
- [ ] Admin moves a course up/down → order persists, stay-put holds, public page revalidates
- [ ] Designated course at `sort_order` minimum renders upper-left for members
- [ ] Section assignment via card editor; heading appears; section order follows lowest member
- [ ] Explicit sort/filter → flat grid, no headings
- [ ] Anonymous and member views identical (no draft leakage change)
- [ ] `/app` default order matches pre-v1.1 hardcoded grid after migration 124
- [ ] Admin ←→ on `/app` walks reading order across columns; last wraps to top-left; persists; members see no steppers; non-admin POST is 401/403
- [ ] Nested Practice suite cards stay hidden after reorder
- [ ] Admin highlight switch paints powder-blue + thick blue outline; persists; members see paint not switch

## Version history

| Ver | Change |
|---|---|
| **v1.0** | Manual catalog order (`sort_order`) + display sections (`catalog_section`), reorder endpoint, stepper UX per B4 |
| **v1.1** | Same contract on `/app`: `POST /api/admin/apps/reorder`, admin-only B4 steppers, migration 124 seeds catalog rows (**DL-319**) |
| **v1.1.1** | Apps steppers are ←→ through 2-col reading order; last wraps to top-left (**DL-320**) |
| **v1.1.2** | Admin highlight toggle; powder-blue fill + thick darker-blue outline (**DL-321**) |
