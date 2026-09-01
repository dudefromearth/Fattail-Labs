# Seed W0-5 — Foxtrot P1 shape

**Project:** OPF Generation Plane  
**Agent:** Foxtrot  
**Depends:** W0-0  
**Law:** GP23 · GP24 · OD-GP3 · GXA0 Q5 · plan P1a  
**Out:** standing up the host before OD-GP3 is ticked · putting secrets in the review · `--workers` > 1 · **shipping `plane_interest.py` or any product Python (that is P1b)** · **loading `ai.fattail.labs.ssr-live-capture.plist`**

## Ask

Write the **P1a** runbook **for the host Coach ticks on OD-GP3**. **Infra only.**

**StudioTwo probe 2026-09-01 14:34 EDT (OD-GP3 evidence):** Redis is already up (v8.2.3, bind localhost). **All `mb:*` keys zero.** No `chain_feed` process, **no chain-feed plist.** uvicorn `:4001` has none of `LABS_MARKET_BUS` / `REDIS_URL` / `LABS_MB_*` / `LABS_OPF_*`. **P1a on StudioTwo is env + one plist.** Smaller than scoped.

1. Redis bind localhost — **already true on StudioTwo. Nothing to install.**
2. API env: `LABS_MARKET_BUS=1`, `REDIS_URL=redis://127.0.0.1:6379/0`, and **`LABS_OPF_STORE_MAX_STALE_MS=20000`** in the **same** env change (OD-GP2; hydrator will refuse to start at P2 without it). Then restart uvicorn so `get_store()` is not `None` (today `pricing.py:238` swallows the miss).
3. **One plist:** `chain_feed` from `infra/launchd/ai.fattail.labs.chain-feed.plist.example`.
4. API uvicorn **without** `--workers` (already true, pid 79091). GP23: boot fails loud if multi-worker while store is process-local.
5. **Do not ship `plane_interest.py`.** That is P1b (Alpha).
6. MiniTwo stays `not_configured` by law if OD-GP3 is StudioTwo.
7. Do not kill the API if the plane is off (GP24 §9.3).
8. P1a-G may use a **documented one-shot manual touch** to prove Redis SET. That is **not** AT-GP23.

### Trap — do not load SSR to get keys moving

`ai.fattail.labs.ssr-live-capture.plist` is **on disk but not loaded**. **Do not load it.** SSR is a different program. If it runs, interest is held by **SSR, not the plane**, and **AT-GP23 would pass on someone else's interest** — the precise failure GP21 exists to expose. Plane interest must be the only interest P1a/P1b rely on.

## Done when

Review in `agents/p-opf-generation-plane/reviews/W0-5-foxtrot.md`. P1a waits on OD-GP3 + W0-G + P0-G.
