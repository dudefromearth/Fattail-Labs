# Seed LG2-1 — Alpha + Kilo: partner registry backend

**Project:** p-links-growth
**Agents:** Alpha (code) · Kilo (tests, paired)
**Depends on:** Spec v0.1 §7–§10, ruled by v0.2 §2 (PM-L2, Q9–Q11 all ruled; PM-L5 confirmed as a go-live gate, not a build gate)
**Spec:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §7–§10, `Specs/Links-Growth-Acquisition-Spec-v0_2.md` §2
**Plan:** `docs/Links-Growth-Phase4-Full-Agent-Bench-Plan-v1.0.md` (4b, fired on Coach instruction after LG1 PASS)

---

## Intent

Stand up the partner registry (PM-L1), deliberately separate from `affiliates`/`credit_tier_rules` — cash or comp'd-membership terms, never store credit. Reuse AF-L12's exact owner-provisioning pattern (PM-L2, confirmed). Flat fee per signup (Q9), no partner portal (Q10), no invoice/payable tracking inside Labs (Q11) — a dollar-equivalent total is computed read-only from the existing `link_attributions` signal, never stored.

## Read first

1. `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §7 (mechanism), §8 (PM-L1–PM-L5), §9 (Q9–Q11, now ruled), §10 (D16–D19)
2. `Specs/Links-Growth-Acquisition-Spec-v0_2.md` §2 (the actual rulings)
3. `server/routes/affiliates_admin.py` — the structural precedent this mirrors (pending/approved/revoked, approval provisions an identity, never self-serve)
4. `server/identity.py` — `get_or_create_identity`, `upsert_membership` (D19's target — exists today, nothing admin-facing calls it yet)
5. `migrations/157_affiliates.sql` — schema precedent (no FK constraints, house style)

## Files in scope

- `migrations/158_partners.sql` — new table
- `server/routes/partners_admin.py` — new admin router
- `server/main.py` — router registration only (one line; this file has a known history of unrelated WIP contamination — amend surgically, never blind-apply)
- `server/tests/test_partners_admin.py` — new test file

## Out of scope

Any change to `affiliates`/`credit_tier_rules`/`credit_events` (PM-L1 — deliberately separate). Any change to `links_admin.py` (a partner-owned link's reporting stays exactly as any other owned link's — the dollar-equivalent total lives in this new router, not grafted onto the existing owner/credit-balance block). Any frontend file (LG3, separate seed). Any invoice/payable table (Q11 ruled out). Any self-serve partner signup (PM-L1, mirrors AF-L4/AF-L12).

---

## Deliverable

1. `partners` table: name, email (unique), company (nullable), `terms_type` (`cash`/`comp_membership`), `terms_cents` (cash only), `terms_plan_id` (comp_membership only, references `plans.id` conceptually — no FK, house style), status (pending/approved/revoked), identity_id, approved_at/by, created_at.
2. `GET /api/admin/partners` — list, each row including a read-only `signups`/`total_cents` pair computed from `link_attributions` joined through that partner's owned links — not stored.
3. `POST /api/admin/partners` — create (pending only), validates `terms_type`/`terms_cents`/`terms_plan_id` pairing, 409 on duplicate email, 422 if `terms_plan_id` doesn't exist in `plans`.
4. `PATCH /api/admin/partners/{id}` — status change; on first approval, provisions a minimal `identities` row (PM-L2) exactly like `affiliates_admin.py`'s `update_affiliate`.
5. `POST /api/admin/partners/{id}/grant-membership` — D19: calls `identity.upsert_membership()` directly for an approved `comp_membership` partner. Never a Stripe API call, never a simulated checkout (PM-L4). Idempotent (same unique key `(identity_id, plan_id, source)` as every other membership row).
6. Tests covering: create validation (both terms types, missing/invalid fields), duplicate email 409, pending link is inert (mirrors `AF-L4`'s existing affiliate test), approval provisions identity + reuses an existing identity for a matching email, comp-membership grant calls `upsert_membership` and never touches Stripe, grant rejected for `cash`-type or unapproved partners, the dollar-equivalent total compute (signups × terms_cents) against real `link_attributions` rows, and that no response anywhere contains an invoice/payable-status field (PM-L3/Q11 — mirrors the existing `AT-6`-style affiliate test).

---

## Invariants

- No FK constraints (house style, matches `affiliates`/`credit_tier_rules`)
- No cash ledger, no invoice, no payable-status field, anywhere in this router's responses (PM-L3)
- `grant-membership` never calls the Stripe SDK or constructs a checkout session (PM-L4)
- Config-driven, fail-loud where applicable — no silent default on a missing `terms_plan_id` for `comp_membership` terms
- `server/main.py` touched only by a precise 1–2 line insertion, verified by `git diff` before commit — never a blind patch/apply

---

## Completion

- [ ] Migration applies cleanly (dev DB)
- [ ] All seed test cases pass
- [ ] Full `pytest tests/ -q -k "links or affiliate or billing or partner"` selection passes
- [ ] `git diff -- server/main.py` reviewed and shows only the intended router registration
- [ ] Feeds `gate-reports/LG2-G.md`
