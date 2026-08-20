# Seed W0-6 — Mike auth / stream boundary

**Project:** p-alerts  
**Agent:** Mike  
**Phase:** W0  
**Depends:** W0-2 APPROVED  
**Gate it feeds:** W0-G · Alpha M1

## Intent

Member alerts API is session-authenticated. The alerts stream must not become a second market socket or an unauthenticated firehose.

## Asks

1. `/api/me/alerts*` uses the Labs session cookie (`ft_session`), same posture as `/me` / `/settings`. Unauth → 401.  
2. **ALB-A2:** `/api/me/alerts/stream` (SSE or WS) is **not** `web/lib/market/MarketSocket.ts` and **not** `/api/me/market/stream`. Stamp transport (plan silent default: SSE).  
3. No MSC alert bus, no Redis schema copied from MSC. Redis for alerts is **not** required in v1; if used, localhost + fail-loud, distinct keys from `mb:*`.  
4. `LABS_ALERTS_MANAGER` fail-loud when adapter mode is `manager` and the flag is missing.  
5. Do not expose Manager internals to unsigned clients.

## Files in scope

ALM §5 · Arch 28 §4.3 · Identity/Access spec (cite) · `MarketSocket.ts` **read only**.

## Out of scope

Implementation. MiniTwo secrets. Changing market WS.

## Done when

`gate-reports/W0-6-mike.md` — transport + auth disposition in the first paragraph.

## Invariants

Mike owns session/auth. Arch 28 market law stays intact.
