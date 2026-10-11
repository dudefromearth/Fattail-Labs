# LG2-G — Delta

**Project:** p-links-growth
**Agent:** Delta
**Phase:** LG2-G
**Date:** 2026-10-10
**Law:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §7–§10 (PM-L1–PM-L5), ruled by `Specs/Links-Growth-Acquisition-Spec-v0_2.md` §2
**Depends:** LG2-1 (Alpha + Kilo)

---

## Verdict: **PASS**

Unblocks **LG3** (frontend). Does not clear PM-L5 — no partner may be paid or comp'd for real until legal input is obtained, regardless of this gate.

---

## Evidence

Command:

```text
cd server && .venv/bin/python -m pytest tests/test_partners_admin.py -q
```

**24 passed.**

Command:

```text
cd server && .venv/bin/python -m pytest tests/ -q -k "links or affiliate or billing or partner"
```

**147 passed, 4 skipped, 1786 deselected.** 0 failed. (Skips are the pre-existing HTTP-route-availability guards, unrelated.)

Migration: `.venv/bin/python migrate.py` → `applied: 158_partners.sql` on the dev DB, no errors.

| Completion criterion (seed LG2-1) | Evidence |
|---|---|
| `partners` table, separate from `affiliates` | `migrations/158_partners.sql` — new table, no FK to `affiliates` or `credit_tier_rules` |
| Create validates both terms types | `test_create_rejects_invalid_terms` (7 cases: bad type, missing/negative/wrong-type `terms_cents`, missing/bool/unknown `terms_plan_id`) |
| Duplicate email 409 | `test_create_duplicate_email_409` |
| Pending partner link is inert | `test_pending_partner_link_is_inert` (mirrors AF-L4's existing affiliate test) |
| Approval provisions identity / reuses existing | `test_approve_provisions_identity_and_sets_approved_fields`, `test_approve_reuses_existing_identity_for_matching_email` |
| Comp-membership grant calls `upsert_membership`, never Stripe | `test_grant_membership_calls_upsert_membership_directly` — monkeypatches `stripe.checkout.Session.create` to raise if called; asserts the real `memberships` row (`status='active'`, `source='partner-comp'`, `external_ref='partner:{id}'`) |
| Grant rejected for cash / unapproved | `test_grant_membership_requires_comp_membership_terms`, `test_grant_membership_requires_approval_first` |
| Grant is idempotent | `test_grant_membership_is_idempotent` — two calls, both 200 (reuses `memberships`'s existing `(identity_id, plan_id, source)` unique key — no new idempotency mechanism needed) |
| Dollar-equivalent total computed correctly, read-only | `test_signups_and_total_computed_from_attributions` — 2 real `link_attributions` rows against a partner-owned link → `signups=2`, `total_cents=10000` at `terms_cents=5000` |
| No invoice/payable/owed field anywhere (PM-L3/Q11) | `test_no_response_contains_invoice_or_payable_fields` — mirrors the existing affiliate AT-6 |
| `server/main.py` touched only by the intended 2-line insertion | `git diff origin/main -- server/main.py` reviewed before commit; the file's known pre-existing contamination (`access_line_middleware`, Tradier router removal — unrelated WIP present in both the local and production working trees) was excluded by building the commit in a clean worktree off `origin/main`, not by editing the contaminated file directly |

**Canonical Model / MSC check.** New files: one migration, one router, one test file, a 2-line `main.py` amendment. No `msc/`, no `engines/`, no Redis topology touched — consistent with India's CONDITIONAL APPROVE on the parent spec.

---

## Residual

LG3 (frontend admin UI) not yet fired. PM-L5 (legal input) remains the standing go-live precondition — unaffected by this gate's PASS.
