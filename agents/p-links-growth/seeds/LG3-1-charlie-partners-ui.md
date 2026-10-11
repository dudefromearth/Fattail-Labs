# Seed LG3-1 — Charlie: partner registry admin UI

**Project:** p-links-growth
**Agent:** Charlie (frontend), HIG per `Echo`'s established tokens/primitives — no separate Echo review packet for a CRUD panel this close to an already-approved precedent (`AffiliatesPanel.tsx`)
**Depends on:** LG2-G PASS (backend live)
**Spec:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §8 (D17), ruled by v0.2 §2 (Q10: manual reporting only — no partner-facing surface, admin-only view)
**Plan:** `docs/Links-Growth-Phase4-Full-Agent-Bench-Plan-v1.0.md`

---

## Intent

An admin-only partner registry panel, parallel in structure and HIG to `AffiliatesPanel.tsx` — create (pending), approve/revoke, and (new, since partners aren't the credit system) show terms (cash amount or comp plan) and the read-only signups/dollar-equivalent total instead of a credit balance. A comp-membership partner gets a one-click "Grant membership" action once approved.

## Read first

1. `web/components/admin/AffiliatesPanel.tsx` — the structural/HIG precedent
2. `web/app/admin/affiliates/page.tsx` — route wrapper precedent
3. `web/styles/tokens.css`, `web/components/ui/Button.tsx`, `web/components/ui/SegmentedControl.tsx` — the only primitives to reuse, no new ones invented
4. `server/routes/partners_admin.py` (LG2) — the actual API shape to bind to

## Files in scope

- `web/components/admin/PartnersPanel.tsx` — new
- `web/app/admin/partners/page.tsx` — new
- `web/app/admin/page.tsx` — one new card, inserted next to the existing Affiliates card

## Out of scope

Any partner-facing (non-admin) page or portal (Q10 ruled out). Any change to `AffiliatesPanel.tsx` itself.

---

## Deliverable

1. `PartnersPanel.tsx`: breadcrumb (Admin / Links·QR / Partners), create form (name, email, company, terms type toggle → cash amount **or** plan picker), status filter, registry list showing status pill, terms summary, signups + dollar-equivalent total (cash partners only), approve/revoke actions, and a "Grant membership" button for approved `comp_membership` partners.
2. `page.tsx` route wrapper, same shape as the affiliates one.
3. One new admin hub card linking to `/admin/partners`.

## Invariants

- Apple HIG via the existing token system only — no new design primitives, no new color values outside `tokens.css`
- No partner-facing surface of any kind (Q10)
- Live polling matches the existing 5s pattern already used in `AffiliatesPanel.tsx`/`LinksPanel.tsx`

## Completion

- [ ] Panel renders against the real LG2 API (manual curl/browser check, not just a type-check)
- [ ] Admin hub card present and links correctly
- [ ] Feeds `gate-reports/LG3-G.md`
