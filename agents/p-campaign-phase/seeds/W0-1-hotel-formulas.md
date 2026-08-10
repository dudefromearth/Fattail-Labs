# W0-1 — Hotel: free cash · structure_risk_open · P13

**Agent:** Hotel  
**Gate:** W0-G

## Task

1. Sign free-cash formula: balance − open cost basis (scoped).  
2. Sign free margin: `declared_buying_power − structure_risk_open` (defined max loss; **not** broker MM).  
3. Sign P13: campaign-strip realized DD% denominator = **campaign allocation** (same as declared max DD%).  
4. Confirm no P&L-ranked prune candidates in v1.

## Out of scope

Implementation code. Master campaign-blind DD (stays on Accounts & Capital).

## Completion

Gate note: SIGNED formulas + P13; API forbids name `margin_at_risk`.
