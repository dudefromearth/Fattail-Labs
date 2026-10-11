# Links — Growth & Acquisition (LK Phase 4) — Spec v0.2 (Coach rulings)

**Version:** v0.2
**Supersedes:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md`'s open questions (§6, §9) and PM-L2's "working assumption" status. v0.1's §1–§5, §7–§8 (purpose, scope, mechanism, law framing), and §10–§14 (component inventory, work packets, acceptance tests, out-of-scope, risk note) are unchanged and not reprinted here — this file records what Coach ruled and amends only what those rulings touch.
**Date:** 2026-10-10
**Machine:** Not yet dispatched to any machine. Specification only; files/trees touched by this document: NONE.
**Status:** 4a — rulings complete, no open blockers. 4b — rulings complete for Q9–Q11/PM-L2; PM-L5 (legal input on cash compensation) remains an explicit go-live precondition, confirmed by Coach, not just recommended by India's review.
**BUILD AUTHORITY:** **4a — granted**, by Coach, 2026-10-10, direct ruling (this app's established direct-iteration exception, `Specs/LK-1.2.md` §3; no separate multi-seat stamp was run). **4b — code may proceed** against the rulings below; it does not ship live to a real partner until PM-L5's legal input is obtained.
**Reviewed:** `agents/p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md` — CONDITIONAL APPROVE, zero Canonical Model violations. The rulings below resolve every condition that review listed as required before any build.

**Parents:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md` — the law numbering this file continues and the mechanism/risk framing this file does not repeat.

---

## §1 Rulings — 4a (two-sided referral)

| Question | v0.1 asked | Coach ruled |
|---|---|---|
| Q12 — Referred-side credit amount | No default | **Same scale as the owner's award** — symmetric. A referred Observer/Annual/Lifetime sign-up earns the referred person the same 1/10/25-credit amount (AF-L9's existing scale) the owner earns for that tier. One constant, reused — not an independent second one. |
| Q13 — Retroactive or forward-only | No default | **Forward-only.** Only `link_attributions` rows recorded after this ships earn the referred-side credit. No backfill job against existing rows. |

**AF-L15, amended:** v0.1 §5 described the referred-side constant as "never derived from or equal to the owner's award by default." That caveat is resolved — it *is* equal, by Coach's explicit choice, not by an engineering default that happened to land there.

No remaining open questions for 4a. The "its own stamp" condition v0.1 §2 set is satisfied by India's CONDITIONAL APPROVE plus the rulings above.

---

## §2 Rulings — 4b (partner/creator co-marketing)

| Question | v0.1 asked | Coach ruled |
|---|---|---|
| PM-L2 — Partner owner provisioning | Working assumption, not yet a law | **Confirmed.** Provision a minimal `identities` row for an approved partner, reusing AF-L12's exact pattern. `links.owner` stays one consistent type (`identity_id`) everywhere in the app — no type-discriminator widening. |
| Q9 — Partner terms structure | No default | **Flat fee per signup.** A fixed dollar amount per qualifying signup their link produces — not a percentage of revenue driven, not a tiered-by-destination-tier scale. Simplest to track and pay; revisit only if a specific partner's deal genuinely needs a different shape later. |
| Q10 — Partner self-service visibility | No default | **Manual reporting only.** No partner-facing portal or read-only page in this build — FatTail reports numbers to partners directly. Matches how the affiliate registry already works (admin-only view, AF-L4). |
| Q11 — Payment mechanism / tracking | No default | **Fully outside Labs.** Labs proves attribution and shows a dollar-equivalent total in the admin view; it does not generate an invoice, a payable record, or any owed-amount tracking. "You owe this partner $X" bookkeeping happens entirely outside Labs. |
| PM-L5 — Compliance gate | Flagged as needing real legal input | **Confirmed as a hard precondition, not a recommendation.** Coach explicitly chose "get real legal input before 4b ships" over proceeding on engineering judgment alone. Code may be built and tested against these rulings; it does not go live for a real partner until that input is obtained. |

**PM-L2 is now a confirmed law, not a working assumption** — D18 (v0.1 §10's component inventory) builds against it exactly as specified there.

No remaining open questions for 4b's *build* shape. One remaining precondition for *shipping* live: PM-L5's legal input, which this document does not and cannot satisfy on its own — it can only confirm that Coach wants it gated, not skipped.

---

## §3 What this changes in the v0.1 component inventory

Nothing structural. D14/D15 (4a) and D16–D19 (4b, v0.1 §10) are unchanged in kind; the rulings above fix their *values and shape* (which constant, which provisioning approach, which terms structure) rather than adding or removing a component.

---

## §4 Explicitly still out of scope (unchanged from v0.1 §13)

Everything v0.1 §13 already excluded, still excluded. PM-L5's legal clearance is not a scope exclusion — it is a go-live gate on 4b specifically, tracked above, not a reason to defer building against the other rulings.

---

*v0.2. Records Coach's direct rulings on every open question `Specs/Links-Growth-Acquisition-Spec-v0_1.md` §6/§9 and PM-L2 raised, per `agents/p-links/gate-reports/Links-Growth-Acquisition-Spec-v0_1-India-Review-v1_0.md`. 4a: BUILD AUTHORITY granted. 4b: build may proceed; go-live gated on PM-L5 legal input.*
