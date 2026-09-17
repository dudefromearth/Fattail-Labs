# VPS1-0 — Alpha · extend sym_feed (StudioTwo build)

**Depends:** Q2 quotes-only. **Does not:** Engine, live Massive from StudioTwo, StudioOne install (ACT 3 / stamp).

Quote `tick()` unchanged. `LABS_VP_SPY_TRADES=1` starts SPY `T.` WS thread. Store under `LABS_MARKET_DATA_ROOT/vp/ingest/` gzip jsonl. Gaps: disconnect + 300 s RTH absence. Odd lots stored. Auction flag from Q4 names.
