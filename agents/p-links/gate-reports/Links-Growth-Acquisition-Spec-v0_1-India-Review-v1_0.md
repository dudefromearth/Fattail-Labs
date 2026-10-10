# Links Growth & Acquisition Spec v0.1 — India review v1.0

**Project:** p-links
**Agent:** India (Canonical Model / architecture gate), model: Grok
**Date:** 2026-10-10
**Document:** `Specs/Links-Growth-Acquisition-Spec-v0_1.md`, sha1 `14a3b22f96944be5415035d59f0b074e7f0dd638` (placed verbatim; not edited by this review)
**Parent:** `Specs/LK-1.2.md`; `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` / `v0_2.md`. This review did not edit any of them.
**Not a build stamp.** This review counts no Coach OK on 4a or 4b. BUILD AUTHORITY stays none until Coach rules Q12/Q13 (4a) and Q9–Q11 plus PM-L2's provisioning approach (4b).

---

## Verdict: **CONDITIONAL APPROVE**

No Canonical Model violations. Pure Application Layer (Labs) growth surface — does not touch, import, mutate, or bypass any Canonical Model, frozen dataclass, engine, or layer boundary. Conditional on the Coach decisions the spec itself already lists as open (§6, §9) — this review adds no new ones.

---

## Review Lens (full execution against guarded artifacts)

| # | Check | Result |
|---|---|---|
| 1 | Exact alignment with guarded canonical artifacts (`msc/canonical/instrument.py`, `engines/*.py`, `governance.py`, `position_intent.py`, `truth/schema.py`, engine interface contract, CRCE Pipeline, Redis topology) | Confirmed zero intersection. Links/QR, credit events, and the proposed partner registry live entirely in Labs application surfaces and existing billing/identity paths. No drift into MSC canonical. |
| 2 | Full authority hierarchy and layer boundaries (Constitution → Doctrine → Canonical Model → Engines → Services → Application Layer) | Respected. Feature stays in Application Layer. No service imports canonical/engine modules. No bypass. |
| 3 | No frozen dataclass mutation | Confirmed. New `partners` table (D16) and the new credit `reason` value (D14) are additive Labs schema, not canonical models. |
| 4 | All configuration is truth-driven | Satisfied for scope. Credit amounts (Q12) and partner terms (Q9) are explicitly deferred to Coach-set constants/decisions, not hardcoded. |
| 5 | Agent sovereignty and approved communication channels | N/A — product feature, not agent interaction. No hidden coupling introduced. |
| 6 | Redis topology and pub/sub routing rules | Unaffected. Spec operates on existing DB/`credit_events`/identity paths only. |
| 7 | Doctrine & First Principles | Yes. Builds on existing mechanism (AF-L9/AF-L10 for 4a; ordinary `links` rows for 4b) — no parallel system. PM-L1's deliberate separation of `partners` from `affiliates` does not conceal a compensation-model difference behind the existing store-credit path. No wrappers/normalization layers. Three-attempt rule not triggered. |
| 8 | No hidden complexity, wrappers, or normalization layers | Confirmed. 4a is a sibling award call with a distinct `reason`. 4b is a new table + provisioning-pattern reuse. The explicit non-reuse of AF-L10's "never cash" rule for partners is documented in the spec (PM-L prefix choice), not papered over. |
| 9 | Agent-to-agent interaction routing (Redis pub/sub via Coach/Juliet mediation) | N/A — no agent interactions in scope. |
| 10 | Long-term maintainability / Prime Directive (capability vs. dependency) | Acceptable. Strengthens acquisition without creating a dependency inside the trading canonical. Trader sovereignty untouched — no automation of trading decisions. The capability increase is business-level (more users entering the platform), not a reduction of trader judgment. |

---

## Specific findings

**4a — two-sided referral.** No violations. Extends an already-shipped, already-reviewed credit mechanism (AF-L9/AF-L10). Per-side idempotency (AF-L15) is correct. Self-referral handling (AF-L17, carried from AF-L7) correctly preserves the existing flagged-not-blocked rule rather than introducing a second one. Risk is low and contained — a reasonable direct-iteration candidate once Q12/Q13 are ruled, as the spec itself recommends in §14.

**4b — partner/creator co-marketing.** No Canonical Model violations. Separating `partners` from `affiliates` (PM-L1) is required and correctly specified — different compensation model, different trust boundary; merging them would have been the actual violation. PM-L3 (no cash ledger/payout inside Labs) and PM-L4 (comp'd membership via a real call to `identity.upsert_membership()`, never a faked checkout) are correct. PM-L5's compliance flag is appropriately carried forward from `Specs/Links-Attribution-Affiliates-Spec-v0_1.md` §8 Q7/§10, not re-retired the way v0.2's AF-L14 correctly retired it for the store-credit path only.

**Out-of-scope items (§3 — on-screen QR/YouTube native surfaces, paid-ad tagging).** Correctly excluded as zero-code operational use of existing `placement`/`source`/`medium` fields. No review required.

---

## Required before any build

- **4a:** Coach rules Q12 (referred-side credit amount) and Q13 (retroactive vs. forward-only). Then stamp.
- **4b:** Coach rules Q9–Q11, confirms PM-L2's provisioning approach (minimal-identity-row reuse of AF-L12's pattern is this review's preferred reading, matching the spec's own stated working assumption), and obtains the real legal input PM-L5 requires for cash terms. Then stamp. **Do not treat 4b as a direct-iteration candidate** — same posture the spec's own §14 risk note recommends.

---

## Completion checklist

- [x] Explicit mapping against all guarded artifacts (zero contact)
- [x] Full review lens executed and documented
- [x] Authority hierarchy compliance verified
- [x] No agent sovereignty or communication violations
- [x] Prime Directive and Doctrine constraints satisfied
- [x] Actionable remediation: none required for the Canonical Model; the open Coach decisions and legal input already named in the spec remain the only gates

No blocking issues. The spec is architecturally clean relative to the Canonical Model and may proceed to Coach for the open decisions and stamps named above. This review will re-review any implementation diffs against the same lens before they merge.
