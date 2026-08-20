# W0-6 — Mike auth / stream

**Project:** p-alerts  
**Agent:** Mike  
**Date:** 2026-08-20  
**Verdict:** **APPROVED**

`/api/me/alerts*` uses Labs session cookie (`ft_session`), same as `/me` / `/settings`. Unauth → 401.

**ALB-A2 / transport:** v1 stream is **SSE** (`GET /api/me/alerts/stream`). Not `MarketSocket`. Not `/api/me/market/stream`. No MSC alert bus. Redis not required in v1; if added later, distinct from `mb:*`.

`LABS_ALERTS_MANAGER`: missing/0 → adapters stub, API honest not-live. `1` → API on. Invalid → abort. Fail loud when adapter mode is `manager` and flag is missing.
