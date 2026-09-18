# Morning 5-session backfill — status 2026-09-18 15:03 ET

**Directive:** 5 recent sessions per source, immediately. Floors still 2026-09-17 at 14:10 — confirm they have not moved.

**Clock at evidence:** 2026-09-18 15:02:46 ET Friday · **RTH True**. chain_feed PID **538** alive. No backfill/tranche/autorun process on StudioOne.

## One line per source (StudioOne coverage.json)

| Source | State | Why | ETA |
|--------|-------|-----|-----|
| **ES** | **not started** | Floor **2026-09-17** ceil 2026-09-18 (2 sessions). Historical pull is **after-close only (CP-1)** until 16:00 ET. After close, `vp_ingest.backfill` still has **no vendor REST/flat-file fetch** (`packets.tranche1` is a print stub). | First possible pull **16:00 ET tonight**; floors move only after fetch is implemented. Target 5 sessions → floor **2026-09-14**. |
| **MES** | **not started** | Same: floor **2026-09-17**, 2 sessions. Same CP-1 + missing fetch. | Same. Floor target **2026-09-14**. |
| **SPY** | **not started** | Same on StudioOne: floor **2026-09-17**, 2 sessions. StudioTwo mirror has SPY coverage empty (ingest lives on S1). | Same. Floor target **2026-09-14**. |

**Named blocker (do not fold silently):** vendor historical fetch is **not wired**. `MassiveClient.fetch_trades_day` exists for stocks; backfill never calls it. Futures historical REST/flat-files are not implemented. Tonight's queue item **A-BACKFILL-5** fails loud on that precondition.

**Does not.** Hit Massive historical during RTH. Stop `:3000`/`:4000`. Touch chain_feed.
