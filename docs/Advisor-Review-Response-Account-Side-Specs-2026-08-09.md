# Advisor Review Response — Account-Side Specs (2026-08-09)

**Reviewer findings:** Advisor layer (Claude) four-spec review  
**Editor:** Grok  
**Action:** All majors/minors folded into Specs; open Coach items listed below  

## Disposition of findings

| ID | Spec | Action |
|----|------|--------|
| C-1 / F-1 | Capital + Funding | **Fixed:** master DD = **realized $ on trading curve** vs **tolerance budget $** (Funding §3.4; Capital points there) |
| C-2 / F-2 | Funding owns | **Fixed:** trading curve = **Σ fill P&L only** (starts at 0); starts/movements on balance curve only |
| C-3 | Capital | **Fixed:** unified as **v0.3** filename + header |
| C-4 | Capital | **Fixed:** C4 includes cash movements |
| C-5 | Capital | **Fixed:** `tolerated_master_drawdown` + form flag |
| C-6 | Capital | **Fixed:** wrap-one = whole balance; shares = proportion |
| C-7 | Capital | **Fixed:** OD-5 blast radius called out (overcommit + Staleness) |
| C-8 | Capital | Source lineage points at model docs as deposited |
| F-3 | Funding | **Fixed:** retired fills stay on trading curve forever |
| F-4 | Funding | **Fixed:** witnesses derived-at-read display only |
| F-5 | Funding | **Note retained** as India OD (start as first movement) |
| F-6 | Funding | **Fixed:** zero-amount 422 = validation |
| S-1 | Staleness | **Fixed:** overcommit is **composed**, inherits claim as-of |
| S-2 | Staleness | **Fixed:** claim-age conditional on OD-5 snapshot |
| S-3 | Staleness | **Note retained** for Echo when live BP ships |
| A-1 | Amendment | **RESOLVED (Coach 2026-08-09):** present-state radar ships; scrub/as-of-T **cut** (not deferred). See Amendment §2.1 v1.0.2 |
| A-2 | Amendment | **Fixed:** Option A soft-delete default; hard-delete only after India proves zero export refs |
| A-3 | Amendment | **Fixed:** unstamp clears `stamped_by` too |
| A-4 | Amendment | **Fixed:** furniture titles freed after dispose |
| A-5 | Amendment | **Fixed:** acceptance for memory of deleted furniture |

## Current Spec pointers (harden from these)

| Spec | Path |
|------|------|
| Capital | `Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md` |
| Funding | `Specs/FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md` |
| Staleness | `Specs/FatTail-Labs-Staleness-Awareness-Spec-v0.1.md` (v0.1.1 notes in history) |
| Top-level account | `Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md` (v1.0.1) |

## Still needs Coach’s word

1. **Master-DD §3.4** — Hotel sign-off on dollar meeting point (recommended locked; needs ratification).  
2. ~~**Radar disposition (A-1)**~~ — **LOCKED Coach 2026-08-09:** present-only ships; scrub cut. Lima DL.  
3. **OD-5** wrap live vs snapshot (with full blast radius).  
4. Tolerance form default % vs $.  

## Ratification order (Advisor X-1)

Funding **with or before** Capital → Amendment co-ratify with Capital P0 → Staleness before BP self-report (P5).
