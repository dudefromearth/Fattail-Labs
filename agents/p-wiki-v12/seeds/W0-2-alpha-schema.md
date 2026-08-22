# W0-2 — Migrations (candidates + watcher-state)

**Project:** Wiki Spec v1.2 · plan v1.1  
**Agent:** Alpha  
**Depends:** W0-1  
**Feeds:** W0-3 · W0-4

## In scope

`migrations/` for both siblings India named. `server/` store module. Fail-loud config. **SI #10:** `cd server && .venv/bin/python -m pytest tests -q` green after this seed.

## Out of scope

Oscar model. Disposition API. Member Wiki ①②⑤. MiniTwo.

## Completion

`migrate.py` applies. Empty candidates. Watcher-state table exists, no SHA yet (or null). Pytest green.
