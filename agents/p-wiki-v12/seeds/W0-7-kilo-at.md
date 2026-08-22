# W0-7 — AT-WK5 / WA1 / WA6 / WA11 · pytest

**Project:** Wiki Spec v1.2 · plan v1.1  
**Agent:** Kilo  
**Depends:** **W0-5** (not W0-3/W0-4 directly). Echo has moved DOM. Watcher stub already landed via Alpha before/during Charlie.

## In scope

W0 ATs only. AT-WA6 = empty region does not navigate.  
**SI #10:** `cd server && .venv/bin/python -m pytest tests -q` green.

AT-WA11: `git diff --stat` = **declared W0 allowlist** (includes `server/`, `migrations/`, Wiki Spec v1.2 r4 nits, Admin v0.1.2, `oscar.md`). SQL does **not** fail W0. Still no AppChrome, Options Lab, `web/lib/market/`, course-path.

## Completion

Paste: AT-WK5 (SHA in watcher-state, zero candidates) · AT-WA1 · AT-WA6 · AT-WA11 · pytest -q.
