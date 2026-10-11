# LG1-G — Delta

**Project:** p-links-growth
**Agent:** Delta
**Phase:** LG1-G
**Date:** 2026-10-10
**Law:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §4–§6 (AF-L15–AF-L17), ruled by `Specs/Links-Growth-Acquisition-Spec-v0_2.md` §1
**Depends:** LG1-1 (Alpha + Kilo)

---

## Verdict: **PASS**

Ships 4a. Does not unblock 4b — its own seed, own gate, go-live still held on PM-L5 regardless.

---

## Evidence

Command:

```text
cd server && .venv/bin/python -m pytest tests/ -q -k "links or affiliate or billing"
```

**120 passed, 4 skipped, 1789 deselected.** 0 failed. (The 4 skips are the pre-existing HTTP-route-availability guards in `test_links_w1.py`/`test_links_w2.py`, unrelated to this packet.)

Focused run, same checkout:

```text
cd server && .venv/bin/python -m pytest tests/test_billing_attribution_credit.py -q
```

**7 passed.**

| Completion criterion (seed LG1-1) | Evidence |
|---|---|
| Both sides awarded in one transaction, each correctly-tagged | `test_subscription_created_awards_credit_to_owner_and_referred_purchaser` — `credit_events` rows for `(owner, 'referral')` and `(purchaser, 'referred')` on the same `external_ref`, same webhook delivery |
| Redelivery does not double-award either side | `test_subscription_created_redelivery_does_not_double_award` — two deliveries of the same `customer.subscription.created` event, `balance(owner) == 10` and `balance(purchaser) == 10` after both, not 20 |
| Self-referral produces exactly one award, not two | `test_subscription_created_self_referral_is_flagged_not_blocked` — `COUNT(*) FROM credit_events WHERE external_ref = sub_id` is 1, `"referred"` not in the result string |
| No schema change | Confirmed by reading the diff: `server/routes/billing.py` only (plus its test file). No migration file. The existing `ux_credit_events_idempotency` unique key on `(identity_id, reason, external_ref)` already covers the new `reason='referred'` value without a DDL change. |
| No change to owner-side award path | Diff-reviewed: the existing `award_credit(..., reason="referral", ...)` call for `owner_id` is untouched; the new call is a sibling, gated on `not self_referral`. |
| Tests go through the real entry point, not a private helper | `_post_event` POSTs a real HMAC-signed payload to `/api/billing/webhook`, same convention as the rest of this test file (per `feedback_test_real_entry_point` precedent from the Phase 3 test-coverage pass) — not a direct call to `_award_referral_credit`. |

**Deploy evidence.** Commit `4df3c45c` pushed to `origin/main`. Synced onto production's checkout (`minitwo`). `ai.fattail.labs.api` restarted via `launchctl kickstart -k` (pid `76260` → `96310`, confirming the new code is the one running). `GET /api/health` → `200` post-restart.

**Canonical Model / MSC check.** No new file outside `server/routes/billing.py` and its test. India's CONDITIONAL APPROVE on the spec already confirmed zero Canonical Model contact for this surface; nothing in this packet changes that — no `msc/`, no `engines/`, no Redis topology touched.

---

## Residual

None blocking. 4b remains unfired — needs its own seed when Coach starts it; go-live stays gated on PM-L5 regardless of when its code is built.
