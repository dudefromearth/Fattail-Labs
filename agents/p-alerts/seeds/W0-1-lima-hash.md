# Seed W0-1 — Lima hash and DL-465

**Project:** p-alerts  
**Agent:** Lima  
**Phase:** W0  
**Depends:** W0-0 STAMP  
**Gate it feeds:** W0-2

## Intent

Make both specs + this plan validatable: parent cites exact, hashes recorded, plan cited in the decision log.

## Files in scope

- `Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md` (**v1.0.2**)  
- `Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md` (**v1.0.2**)  
- `docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md` (**v1.0.2**)  
- `agents/p-alerts/CHARTER.md`  
- `Architecture/00-decision-log.md` — append **DL-465** (plan landed / board `p-alerts`). Do not rewrite DL-464.

## Out of scope

Rewriting Coach intent. Product code. Analyzer §1.14 rewrite (that is C1 Lima).

## AL-A1 (required)

Confirm on disk (quote id + one-line criterion):

- ALM §9 **AT-ALM-1 through AT-ALM-13**
- AZ-ALB §9 **AT-ALB-1 through AT-ALB-15**

Same SP-1 shape as the What-If board. If HIG rows 11–15 / 12–13 are missing, **RETURN** — do not let C1-G / M-G / C2-G gate those ATs against an older spec.

## Done when

`gate-reports/W0-1-lima.md`: sha1 (or equivalent) of both spec bodies + plan; parent table matches plan § primary law; **DL-465** exists; **AT-ALM-1…13 and AT-ALB-1…15 quoted from the spec files**.

## Invariants

Coach Content Law. DL-464 India fold stays.
