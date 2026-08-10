# R1-0 — Hotel · Alpha: free cash report

**Agents:** Hotel · Alpha  
**Gate:** R1-G  
**Depends:** G1-G (API after S)

## Task

1. Free cash = current balance − open cost basis (scope per OD-free-cash-scope).  
2. Negative free cash lawful — plain text, no valence.  
3. Account-free campaign: identity total free cash when `account_id` null (default).

## Invariants

P8 · no second store · Funding curves as balance SoR.

## Acceptance

Spec §10 #8

## Completion

API + formula test.
