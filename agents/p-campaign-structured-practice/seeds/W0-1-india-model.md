# W0-1 — India model keep/kill

**Agents:** India  
**Phase:** W0  
**Blocked by:** W0-0  

## Intent

Written model decisions before M1 migrations:

1. Ledger marker: `is_ledger` vs `kind ENUM('ledger','charter')`  
2. Bounds table shape + attribute enum  
3. Variance **(a) temporal derive** vs **(b) stamp-at-fill** under Spec §5.4 history stability  
4. Last-pair memory storage (table vs prefs)  
5. Panel: derive-only confirm  
6. Strategy-type scope: ship vs trail (disposition #8)  
7. `stamped_by` enum values (`member|memory|migration|import`)  

## Out of scope

Implementation code.

## Done when

Keep/kill note in board or Architecture path; M1-0 can freeze DTO.

## Gate

Required for W0-G.
