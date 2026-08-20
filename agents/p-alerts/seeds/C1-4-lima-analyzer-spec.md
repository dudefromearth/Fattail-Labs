# Seed C1-4 — Lima Analyzer §1.14 honesty

**Project:** p-alerts  
**Agent:** Lima  
**Phase:** C1  
**Depends:** C1-1 (holder/Builder as-built)  
**Gate it feeds:** C1-G

## Intent

Analyzer Spec v0.2 **§1.14** still describes MSC-era ack/dismiss/list-under-viewport. That is no longer product law. Rewrite it to **cite AZ-ALB**: left inspector holder, **+** / Builder, canvas apply owned by C2, hook to ALM, no delete v1.

## Files in scope

- `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` §1.14 and any AT-AZ-AL rows that still require ack/dismiss as law  
- Help/user guide Alerts paragraphs **only if they contradict** AZ-ALB (do not invent a new guide)

## Out of scope

Code. DL-464 rewrite. Claiming C2 canvas ATs PASS.

## Done when

§1.14 matches AZ-ALB holder/Builder/hook. Old ack/dismiss is labeled **superseded** or removed as requirement. `gate-reports/C1-4-lima.md`.

## Invariants

Coach Content Law: do not drop canvas vs position; fold, don’t erase.
