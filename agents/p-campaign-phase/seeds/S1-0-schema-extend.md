# S1-0 — India · Mike: schema finalize

**Agents:** India · Mike  
**Gate:** S1-G  
**Depends:** W0-G

## Task

1. Confirm/extend migration 116 campaign definition fields; resolve dual-116 runner collision if needed.  
2. Same-bet storage (nullable JSON or columns — dormant when null).  
3. Export / Family B keys for new charter columns.  
4. No dual write of equity; allocation amount field path clear (existing capital composition vs campaign columns).

## Invariants

P1 · P4 · P6 · P11 · P12 · Family B · no MSC · CP13 scaffold.

## Out of scope

UI. Sign gates (G). Report math (R).

## Completion

Migration applied or idempotent; Mike keys listed; evidence in gate-reports.
