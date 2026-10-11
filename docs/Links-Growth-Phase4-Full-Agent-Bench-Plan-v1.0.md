# Links Growth & Acquisition (LK Phase 4) — Full Multi-Agent Bench Plan

**Project callsign:** `p-links-growth`
**Board:** [`agents/p-links-growth/ORCHESTRATOR.md`](../agents/p-links-growth/ORCHESTRATOR.md)
**Spec (canonical):** [`Specs/Links-Growth-Acquisition-Spec-v0_1.md`](../Specs/Links-Growth-Acquisition-Spec-v0_1.md), amended by [`Specs/Links-Growth-Acquisition-Spec-v0_2.md`](../Specs/Links-Growth-Acquisition-Spec-v0_2.md) (Coach rulings)
**Status:** **4a BUILD AUTHORITY granted** (Coach, 2026-10-10, direct ruling — `Specs/LK-1.2.md` §3 exception). **4b: code may proceed, go-live gated on PM-L5 legal input** — not fired in this plan; 4a only.
**Reviewed:** `agents/p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md` — CONDITIONAL APPROVE, zero Canonical Model violations.
**Governance:** `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md` · Delta ternary gates only.

---

## 1. Purpose

Ship **4a — two-sided referral credit**: when a link owner's referred member completes a qualifying tier upgrade, the referred person now earns credit too, not just the owner. This is the Juliet decomposition of Spec v0.1/v0.2 §1/§4–§6 into a reviewable packet, pairing, seed, and gate.

This is a small, contained amendment to an already-shipped, already-reviewed mechanism (AF-L9/AF-L10, `routes/billing.py`'s `_award_referral_credit`) — one packet, not a multi-wave program. The plan is sized to the actual work, not inflated to match larger boards in this repo.

4b (partner/creator co-marketing) is named in the spec and in this project's board for continuity, but is **not fired** by this plan — it needs its own seed once Coach decides to start it, and its go-live stays gated on PM-L5 regardless of when its code is built.

---

## 2. Preconditions

| Gate | Requirement |
|---|---|
| Spec | v0.1 DRAFT + v0.2 Coach rulings — 4a has no open questions (Q12/Q13 ruled) |
| Review | India CONDITIONAL APPROVE, zero Canonical Model violations |
| Mechanism | AF-L9/AF-L10 (`_award_referral_credit`, `credit_events`, `ux_credit_events_idempotency`) live and proven since LK Phase 3b |

**LG1 unblocked.** Start at `seeds/LG1-1-alpha-kilo-two-sided-award.md`.

---

## 3. Keep / kill / non-goals

### Keep

- AF-L9/AF-L10's existing per-tier credit scale (1/10/25) and idempotency key `(identity_id, reason, external_ref)` — reused as-is, not redesigned
- Self-referral flagged-not-blocked (AF-L7/AF-L17) — unchanged by this packet
- Forward-only application (Q13) — no backfill migration

### Kill / ban

- A second, independent credit-value constant for the referred side (Q12 ruled: same scale as owner's)
- Any retroactive award against existing `link_attributions` rows
- Any change to the owner-side award path itself — 4a adds a sibling call, it does not touch the existing one

### Non-goals (this packet)

- 4b (partner/creator links) — separate packet, not fired here
- Any admin UI change — the referred-side award is invisible plumbing; the owner already sees their own balance via the existing owner/credit-balance card (LK Phase 3b), and the referred person sees their own balance the same way every member's balance already surfaces, with no new surface needed
- Any change to `links_admin.py`, `affiliates_admin.py`, or any frontend file

---

## 4. Program phases

```text
LG1  Alpha + Kilo: referred-side award + tests
  ↓
LG1-G  Delta gate (evidence-based)
  ↓
Lima: decision log entry
```

One phase. No AC-style multi-wave decomposition — the work is a single cohesive change in one file plus its tests.

---

## 5. LG1 — Alpha + Kilo: referred-side award + tests

**Pairing:** Alpha (backend) implements; Kilo (test/quality) builds the regression suite alongside, per the "Recommended pairings" table in `AGENTS.md` — not a sequential handoff.

**Touches:** `server/routes/billing.py` (`_award_referral_credit`, called from `_handle_subscription`); `server/tests/test_billing_attribution_credit.py` (new test cases, same file created in the prior Phase 3 test-coverage pass — this is an amendment, not a new test file).

**Mechanism (Spec v0.1 §4, ruled by v0.2 §1):**

1. `_award_referral_credit` already awards the link `owner` on a qualifying `customer.subscription.created` event, keyed on `(identity_id, reason='referral', external_ref=sub_id)`.
2. Add a sibling award call for the **purchaser** (the referred identity), same transaction, same `sub_id` as `external_ref`, distinct `reason='referred'`, sized by the **same** tier-rule credits as the owner's award (Q12 ruled: symmetric, one constant).
3. Self-referral (owner == purchaser): only the existing single-sided award fires — no second award to the same identity for the same event (AF-L17).
4. No schema change — `credit_events`'s existing `ux_credit_events_idempotency` unique key `(identity_id, reason, external_ref)` already covers the new `reason='referred'` row independently of the `reason='referral'` row.

**Deliverable:**

1. `_award_referral_credit` (or a thin sibling it calls) awards both sides in one transaction
2. New `reason='referred'` value documented inline (AF-L15)
3. Tests: both sides awarded on a qualifying event; redelivery does not double-award either side independently; self-referral produces exactly one award, not two; a referred Observer's credit is banked correctly with nothing to spend yet (AF-L16) via the existing `balance()` function — no new balance logic needed

**Invariants:**

- No change to the owner-side award call's existing behavior or constant
- Idempotency per side, independently — a partial failure (one side recorded, the other not) must be recoverable by simply redelivering the webhook
- Forward-only (Q13) — no migration, no backfill script
- Config-driven, fail-loud — no silent default if the tier rule is missing (mirrors existing `tier_rule()` behavior: no rule configured means no credit, not a guess)

**Completion:**

- [ ] Both sides awarded in one transaction on a qualifying `customer.subscription.created` event
- [ ] Redelivery of the same event does not double-award either side (test, not assertion)
- [ ] Self-referral produces exactly one award event (test)
- [ ] Full existing links/billing/affiliates test selection still passes (`pytest tests/ -q -k "links or affiliate or billing"`)
- [ ] Kilo sign-off on test coverage

---

## 6. LG1-G — Delta gate

Delta verifies LG1's deliverable against live evidence (test run output, not assertion) and files `agents/p-links-growth/gate-reports/LG1-G.md`. Verdict is ternary: PASS / FAIL / BLOCKED.

---

## 7. Lima — decision log

Lima logs the 4a ship in `Architecture/00-decision-log.md` same day, per doctrine §10/RL-1.
