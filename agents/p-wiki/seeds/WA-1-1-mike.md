# WA-1-1 — Portal auth (Mike)

**Plan:** GO WA-1 · **DL-548**  
**R0-2 is the work definition.**

## In scope

- Add `contracts:deliver` to `VALID_SCOPES` in `server/agent_auth.py`.
- Per-source principals: registry slug → `principal_callsign`; bearer must match.
- `kind=session`: admin **cookie only**; reject `ftl_ag_` even if a cookie is also present.
- `admin` on session envelope is server-assigned `identity_id`.
- Family B: `refs` / `canonical_url` path-only; reject practice/journal/trade-log/capital paths and query strings.

## Out of scope

Session accrete/seal API (WA-4). AppChrome.

## Completion

Kilo proves: reindex-only key 403 on portal; wrong principal vs registered source; session bearer 403; observer session 401/404.
