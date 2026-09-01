# Seed W0-5 — Foxtrot P1 shape

**Project:** OPF Generation Plane  
**Agent:** Foxtrot  
**Depends:** W0-0  
**Law:** GP21 · GP23 · GP24 · OD-GP3 · GXA0 Q5  
**Out:** standing up the host before OD-GP3 is ticked · putting secrets in the review · `--workers` > 1

## Ask

Write the P1 runbook **for the host Coach ticks on OD-GP3**:

1. Redis bind localhost. `LABS_MARKET_BUS=1`. `REDIS_URL`.
2. `chain_feed` launchd from `infra/launchd/ai.fattail.labs.chain-feed.plist.example`.
3. API uvicorn **without** `--workers` (or `--workers 1`). GP23: boot fails loud if multi-worker while store is process-local.
4. Plane interest heartbeat (P2/P1 code) — ops: env names only in the review.
5. MiniTwo as-built 2026-09-01: no Redis, no chain_feed, no `LABS_MARKET_BUS`. If OD-GP3 is MiniTwo, P1 **installs** those. If StudioTwo, MiniTwo stays `not_configured` by law.
6. Do not kill the API if the plane is off (GP24 §9.3).

## Done when

Review in `agents/p-opf-generation-plane/reviews/W0-5-foxtrot.md`. P1 seed waits on OD-GP3 + W0-G + P0-G.
