# IF-1-5 — Characterization (Kilo)

**GO IF-1.** Depends on IF-1-4. Feeds IF-1-G.

## In scope

`server/tests/test_iki_factory_if1.py`  
Prove: non-admin 403; unauthenticated 401; Idea create + pickup stub; auto-move reason visible; invalid move 422 + stay + reason; Hold persists on GET; Research→Spec as `factory:operate` bearer **rejected**; Admin Research→Spec allowed; probe rows cleaned (`zz-if1-*`). No `content_items` writes. Member Factory page file unchanged.

## Out of scope

IF-2 skill window. MiniTwo.

## Completion

`cd server && .venv/bin/python -m pytest tests/test_iki_factory_if1.py -q` green.  
