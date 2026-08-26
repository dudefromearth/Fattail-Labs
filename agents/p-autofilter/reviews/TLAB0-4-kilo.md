# TLAB0-4 — Kilo — Book universe inventory

**Agent:** Kilo  
**Date:** 2026-08-25  
**Isolation:** read-only.

## Fetch bounds (file + line)

| Bound | Evidence |
|-------|----------|
| Client page | `web/app/app/trade-log/page.tsx:57` `PAGE_LIMIT = 80` · used `:223`, `:314` |
| Server default | `server/routes/trade_log/common.py:636-637` `_TRADE_PAGE_DEFAULT = 80` `_TRADE_PAGE_MAX = 200` |
| full=1 cap | `common.py:634` `_TRADE_BOOK_LIMIT = 10000` |
| Client apply | `trade-log/page.tsx:464` `applyAutofilter(trades, autofilterCols, autofilter)` |
| List params exist | `trades.py:54-61` `strategies` `symbols` `years` `months` `days` `campaigns` |
| Page fetch omits them | `fetchTrades` on Trade Log: limit, playbook, adherence, from_day/to_day (Adhere) only — **no** `years`/`days`/`strategies`/`symbols`/`campaigns` |
| F&B sends them | `TradeFindTag.tsx:151-164` `filterQuery` → `years` via `compactWhen`, `strategies`, `symbols`, `campaigns` |
| Distincts endpoint | `trades.py:236-244` `GET /api/me/trade-log/distincts` → `trade_distincts(cur, iid)` identity, not account |

## MiniTwo Default (spec §1)

1 543 trades, 2022-09-06 → 2026-08-17. First 80: **all 2026** (2026-04-01 → 2026-08-17). 2022 n=204 off-page.

## S7 / isolation

No Journal/Records files in this packet. No `web/` product edit from TLAB0.
