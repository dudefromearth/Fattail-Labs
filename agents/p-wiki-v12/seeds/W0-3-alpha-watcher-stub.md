# W0-3 — Watcher stub (Alpha)

**Project:** Wiki Spec v1.2 · plan v1.1  
**Agent:** **Alpha** (server code). Foxtrot is **not** this seed.  
**Depends:** W0-2  
**Feeds:** W0-7 (after W0-5)

## In scope

Stub that records last SHA and writes **zero** candidate rows on first SHA (AT-WK5).

**SHA input is named and fail-loud (SI #2):** CLI arg / env / test fixture = the checkout revision the process already sees. No silent default. No MiniTwo poll.

Optional: Juliet may ask Foxtrot to **review SHA shape** only — not to implement.

## Out of scope

OD-WK1 hook vs poll (W3+). Diffing templates/features. Model calls.

## Completion

Command + output: named SHA in → watcher-state has that SHA, `COUNT(*)` on candidates = 0. Pytest green.
