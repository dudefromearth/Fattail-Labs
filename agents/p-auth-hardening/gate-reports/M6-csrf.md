# M6 — CSRF Origin/Referer guard

**Date:** 2026-08-03  
**Verdict:** **PASS**

## Delivered

- `server/csrf.py` middleware on all mutating requests with `ft_session`
- Allowlist: `LABS_WEB_ORIGIN`, `LABS_CSRF_ORIGINS`, request host, dev localhost/testserver
- Skips: GET, no cookie, Bearer agents, webhooks without session
- Tests: 46 passed including auth suite

## Ops note

Production should set `LABS_WEB_ORIGIN=https://labs.fattail.ai` so browser Origin matches.

## Reevaluation

Code medium track (M1/M2/M6/M7) largely closed. Remaining: host ops residuals + optional L1 session revoke.
