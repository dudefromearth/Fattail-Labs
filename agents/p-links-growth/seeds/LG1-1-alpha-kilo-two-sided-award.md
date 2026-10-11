# Seed LG1-1 — Alpha + Kilo: referred-side credit award

**Project:** p-links-growth
**Agents:** Alpha (code) · Kilo (tests, paired — not a sequential handoff)
**Depends on:** Spec v0.1 DRAFT + v0.2 Coach rulings (Q12/Q13 ruled, no open questions for 4a); India CONDITIONAL APPROVE
**Spec:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §4–§6, ruled by `Specs/Links-Growth-Acquisition-Spec-v0_2.md` §1
**Plan:** `docs/Links-Growth-Phase4-Full-Agent-Bench-Plan-v1.0.md` §5

---

## Intent

When `_award_referral_credit` (`server/routes/billing.py`) awards a link's owner on a qualifying `customer.subscription.created` event, also award the **purchaser** (the referred identity) — same transaction, same `sub_id` as `external_ref`, a distinct `reason` value, sized by the same per-tier credit scale (AF-L9) the owner earns. One constant, reused — Coach ruled this symmetric, not independent (Q12).

## Read first

1. `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §4 (mechanism), §5 (AF-L15–AF-L17), §6 (Q12/Q13 — now ruled)
2. `Specs/Links-Growth-Acquisition-Spec-v0_2.md` §1 (the actual rulings)
3. `server/routes/billing.py` — `_award_referral_credit`, `_handle_subscription`, `PROVIDER`
4. `server/links/credits.py` — `award_credit`, `balance`, `tier_rule`, `CREDIT_VALUE_CENTS`
5. `server/tests/test_billing_attribution_credit.py` — existing webhook-endpoint-level test conventions (real HMAC-signed `POST /api/billing/webhook`, not private-helper calls — see `feedback_test_real_entry_point` precedent from the Phase 3 test-coverage pass)

## Files in scope

- `server/routes/billing.py` — `_award_referral_credit` amendment only
- `server/tests/test_billing_attribution_credit.py` — new test cases appended

## Out of scope

Any migration (forward-only per Q13, no schema change — the existing `ux_credit_events_idempotency` unique key on `credit_events` already covers the new `reason` value independently). Any admin UI change. Any change to the owner-side award call's existing behavior, constant, or `reason` value. 4b (separate seed, not fired here).

---

## Deliverable

1. `_award_referral_credit` awards both the owner (existing, unchanged) and the purchaser (new), in the same transaction, keyed independently for idempotency: `(owner_id, 'referral', sub_id)` and `(purchaser_id, 'referred', sub_id)`.
2. Self-referral (owner == purchaser): only the existing single-sided award fires. No second award to the same identity for the same event.
3. New `reason='referred'` value, documented inline where `reason='referral'` already is.
4. Tests, through the real `POST /api/billing/webhook` endpoint (per the house precedent that a private-helper call is not a substitute for testing the actual entry point):
   - A qualifying event awards both sides, each with its own correctly-tagged `reason`
   - Redelivering the same event does not double-award either side
   - Self-referral produces exactly one award event, not two
   - A referred Observer's credit banks correctly via the existing `balance()` (AF-L16) — no new balance logic to test, just confirm the existing function still derives it correctly for the new `reason`
5. Kilo sign-off that `pytest tests/ -q -k "links or affiliate or billing"` passes clean (the full selection, not just the new cases) — mirrors the discipline already established in this app's test-coverage pass.

---

## Invariants

- Idempotency per side, independently — a partial failure (one side recorded, the other not, e.g. a mid-transaction crash) must be recoverable by simply redelivering the webhook, not a special-cased retry path
- Config-driven, fail-loud — no silent default if the tier rule is missing (mirrors `tier_rule()`'s existing "no rule configured means no credit, not a guess")
- No change to AF-L9/AF-L10's owner-side math or constants
- No MSC imports; no Canonical Model contact (confirmed N/A by India's review — this stays true since no new files outside `server/routes/billing.py` and its test are touched)

---

## Completion

- [ ] Both sides awarded in one transaction on a qualifying event (test, not assertion)
- [ ] Redelivery does not double-award either side (test)
- [ ] Self-referral produces exactly one award event (test)
- [ ] Full `pytest tests/ -q -k "links or affiliate or billing"` selection passes
- [ ] Deployed per this app's standing commit/push/deploy-every-revision discipline
- [ ] Feeds `gate-reports/LG1-G.md`
