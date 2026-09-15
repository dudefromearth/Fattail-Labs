# PPL3-4 — TO_CLOSE writer inventory

**Agent:** Alpha · **Date:** 2026-09-14 · **StudioTwo**  
**Rule:** invert AT-PPL-6 only after every writer is classified.

| Writer | Path | Classification | Notes |
|--------|------|----------------|-------|
| TradeSheet save (create close) | `POST /api/me/trade-log/trades` | **Gated this packet** | Payload `allow_*` + `intended_open_id`. 422 without override. |
| TradeSheet save (edit close) | `PATCH /trades/{id}` | **Gated this packet** | Same gates. Re-key uses previously paired open as intended. |
| Blotter / sheet DELETE | `DELETE /trades/{id}` | **409 this packet** | Paired/partial open blocked. Close fills still 200. |
| Duplicate as new open | session template → create `TO_OPEN` | **Does not post TO_CLOSE** | `onDuplicateOpen` in `page.tsx`. No change. |
| `createTrade` helper | `web/lib/tradeLogApi.ts` | **Passthrough** | Body as given. Only TradeSheet currently posts member closes. |
| `POST .../import/commit` | `routes/trade_log/io.py` + `commit.py` | **OD-25 exempt** | Direct INSERT. Does **not** call `assert_close_gates`. |
| Shared `commit_trades` | `routes/trade_log/commit.py` | **OD-25 exempt** | Same INSERT path (Tradier / future brokers). |
| `server/seed_trade_log_demo.py` | SQL INSERT `demo_seed` | **Exempt (not member POST)** | Operator seed. Do not 422. |
| `server/seed_clone_trade_log.py` | SQL INSERT | **Exempt** | Clone between identities. |
| `server/import_0dte_xlsx.py` | SQL INSERT | **Exempt** | Operator xlsx. Not member POST. |
| `server/import_domain.py` `commit_trade_log` | SQL INSERT | **OD-25 exempt** | Member data import commit. |
| Tests `test_trade_log*.py` HTTP POST | member POST | **Invert or fixture override** | AT-PPL-6 inverted. Partial 1-of-5 sends `allow_partial_units`. Autofilter DEAD close sends `allow_orphan_close`. Matching full closes unchanged. |
| Tests that INSERT SQL | `test_retrospectives.py`, `test_tags.py`, `test_member_export.py`, `test_retrospective_notify.py` | **Exempt** | Bypass API. |
| Domain-only fixtures | `test_trade_log_domain.py`, `test_process_pack_domain.py`, `test_day_net_calendar.py` | **Not writers** | In-memory matcher. |
| Analyzer `analyzerTradeLogSync` | read `findPairedClose` | **Not a writer** | Frozen. |
| LIM / QFRIC / XS trees | — | **None found** | No TO_CLOSE writers. Do not edit. |

**Frozen trees:** grep of LIM / QFRIC / XS product files found **no** `TO_CLOSE` fill writers.

**AT-PPL-6 invert authorized** by this inventory.
