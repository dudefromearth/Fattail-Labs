# W0-6 — Echo Accounts & Capital IA

**Status:** PASS  
**Date:** 2026-08-09  

## Placement

| Item | Spec |
|------|------|
| Name | **Accounts & Capital** |
| Nav | Users menu (with profile / billing) — **not** Practice suite chrome |
| Route (indicative) | `/app/me/accounts-capital` or `/app/accounts-capital` — Charlie locks with app router patterns |
| Entitlement | Identity session; **not** gated on Practice-only or Labs-only purchase (product independence) |

## Blocks (top → bottom)

1. **Total net capital** — one number + quiet master-DD witness line if over budget  
2. **Accounts** — list: label, venue, balance (derived), status; Create · Retire  
3. **Account detail** — starting balance (gap if unset); movements list; Fund / Withdraw  
4. **Buying power** — posture · value · as-of (staleness grammar)  
5. **Tolerated master drawdown** — value + form  
6. **Portfolio witnesses** — overcommit total / per-source (quiet)  
7. **Confirm as current** — cheap as-of refresh  

## Density

HIG: stay-put, report register. No campaign panel, no radar, no P&L hero charts on this surface (optional advanced: two curves later — default witnesses only).

## After A-G (Charlie)

- Remove account create/retire from Trade Log settings / Practice.  
- Grep gate: no parallel write path.  
- Pickers still list accounts (read).

## Out of IA for W0

Pixel comps; solved-size calculator (Z).
