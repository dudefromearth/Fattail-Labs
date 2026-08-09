# Advisor Review Response — Accounts & Capital and Positions View Spec

**Date:** 2026-08-09  
**Input:** Advisor review of Spec v0.1 (verdict FAITHFUL; findings PV-1…PV-7)  
**Output:** Spec **v0.2** — [`Specs/FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md`](../Specs/FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md)

---

## Disposition of findings

| ID | Severity | Fold action in v0.2 |
|----|----------|---------------------|
| **PV-1** | Substantive | **Accepted.** New law **V17** + §6.1 weekend/closed-market rule: stale-for-ticking ≠ unusable-for-valuation. Header as-of carries true age; degradation only for absent/unusable marks. Acceptance #14. |
| **PV-2** | Substantive | **Accepted.** As-built confirmed: BP is identity-level in `member_capital_prefs`. V7 rewritten **per account**. Dependency **#5a** named migration (not polish); ship-order step 2. Acceptance #17. |
| **PV-3** | Substantive | **Accepted.** V1 scoped to **row fields**. New **V5a** marked-derived totals on Positions. Acceptance #4 split; #5 marks-gap case. §5.4 table. |
| **PV-4** | Substantive | **Accepted.** Provisional cash path **deleted**. OD-MC interim = **omit Cash** (BP alone). V6 / register #9 / acceptance #16. |
| **PV-5** | Minor | **Accepted.** §6.3 dead-heartbeat member behavior; acceptance #15. |
| **PV-6** | Minor | **Accepted.** V5 and OD-SV interim: stated-preferred = derived-only until field ships. |
| **PV-7** | Carried | **Noted.** Parent table + dependency #9: this Spec inherits Funding §3.4; Advisor re-verify of Funding/Capital texts remains standing. Spec paths: Funding v0.2 + Capital v0.3 already in repo for upload. |

---

## As-built note (India / PV-2)

L/A/F land shape for BP:

- Table: `member_capital_prefs` (identity PK)  
- Columns: `buying_power_posture`, `buying_power_value`, `buying_power_as_of`  
- Migration 110  

v0.2 requires moving BP to **account row** before multi-account deployability pair ships.

---

## Coach decisions still open

| OD | Blocks |
|----|--------|
| **OD-MC** match-cash | Cash on deployability pair + match-cash Cash rows |
| **OD-SV** stated account value | True stated-preferred summary (until then derived-only) |
| OD-D1…D4 | Layout defaults already proposed; confirm or override |

---

## Not reopened

V2 “nothing typed into the view,” V9 undirected absence, valuation API shape, grep gate on write-path exclusivity — Advisor affirmed; unchanged in spirit.
