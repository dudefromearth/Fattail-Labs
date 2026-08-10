# S1-1 — Alpha: serialize + patch Big Three / optional

**Agent:** Alpha  
**Gate:** S1-G  
**Depends:** S1-0

## Task

1. API serialize: `charter_version`, `max_drawdown_pct`, allocation mode/amount/note, strategy_codes, retrospective_id, Same-bet fields.  
2. Patch accepts Big Three + optional Tier 2/3; percent-only max DD.  
3. Version increments on signed-term amendments only (with S1-2).

## Invariants

P2 · P4 · P11 · no ghost defaults on optional (null ≠ false).

## Out of scope

Activate 422 (G1-0). UI.

## Completion

curl create/get/patch proof; tests.
