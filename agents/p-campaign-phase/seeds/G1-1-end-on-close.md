# G1-1 — Alpha: complete/archive requires end date

**Agent:** Alpha  
**Gate:** G1-G  
**Depends:** S1-G

## Task

1. Complete / abandon-to-archive / archive without end date → **422**.  
2. With end date set (or set in same act) → terminal OK.  
3. Sign/activate still allowed without end (L-End).

## Invariants

P5 · L-End.

## Acceptance

Spec §10 #3

## Completion

pytest lifecycle acts.
