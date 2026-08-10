# G1-0 — Alpha: activate/sign requires Big Three

**Agent:** Alpha  
**Gate:** G1-G  
**Depends:** S1-G

## Task

1. First activate / sign without allocation, max DD%, or start → **422** on campaign API.  
2. With Big Three present → activate OK.  
3. Max DD accepts percent only (reject $ form / wrong unit).

## Invariants

P2 · P3 · P4 · umpire (charter-only 422).

## Acceptance

Spec §10 #1 · #2

## Completion

curl/pytest 422 and 200 paths.
