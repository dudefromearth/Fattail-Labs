# Seed PH0-1 — Alpha + Mike: Dev identity fallback gate

**Project:** p-practice-harden  
**Primary:** Alpha  
**Reviewers (required):** Mike · India  
**Phase:** H0  
**Prerequisite:** PH0-0  

## Goal

Ensure `_storage_identity_id` (or equivalent) **dev-only fallback** cannot run in
staging/production. Fail loud outside dev. **No intentional UX change** for real sessions.

## Files in scope (declare before edit; adjust only with Juliet)

- `server/routes/trade_log.py` (or extracted identity helper if already split)  
- `server/tests/test_trade_log.py` (or new isolation test module)  
- Possibly `server/config.py` if env checks belong there  

## Out of scope

- Frontend  
- Analytics formula changes  
- New endpoints  

## Invariants

1. Family B isolation: real sessions always use claims identity.  
2. Config fail-loud outside dev.  
3. Change control: only listed files.  

## Implementation notes

- Gate fallback on `LABS_ENV == "dev"` (or equivalent strict check).  
- Staging/production: missing identity → 401/400, never pick ernie/coach/dev-admin.  

## Collaboration / review protocol

1. Alpha implements + pytest evidence.  
2. **Mike** reviews: isolation, attack “claims identity_id=0”.  
3. **India** reviews: env boundary consistent with platform doctrine.  
4. Both must **APPROVED** before seed done.  

## Completion criteria

- [x] Fallback impossible when `LABS_ENV` not `dev` (test evidence)  
- [x] Mike APPROVED  
- [x] India APPROVED  
- [x] Evidence: test command + output  

## Evidence (2026-07-29)

- Implementation: `get_config().env != "dev"` → 401 before fallback SQL  
- Review + pytest: `gate-reports/PH0-1-review.md`  
- `pytest tests/test_trade_log.py -q` → **8 passed**  

## Feeds

→ PH0-2, PH0-3, PH0-G  

