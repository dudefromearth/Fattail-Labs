# TLAB1-2 — Charlie — Autofilter drives fetch

**GO TLAB1.** One stream: `FilterMap` → list params. No client `applyAutofilter` membership.

**In:** `web/app/app/trade-log/page.tsx` · `tradeLogAutofilter.ts` (`autofilterToListQuery`) · `tradeLogApi.ts` · `TradeLogAutofilterBar` · `TradeLogTable`.

**Out:** Help · Journal · Find and Badge rewrite.

**Done:**
- `autofilterToListQuery` + `fetchTrades` (`years`/`days`/`strategies`/`symbols`/`campaigns`/`statuses`).
- Menus from `fetchBlotterDistincts` (`blotter=1`).
- shown/total: this page length / `match_count` when Autofilter on; unfiltered page length / `book_count`.
- Empty Autofilter match is not “no trades on this account”.
