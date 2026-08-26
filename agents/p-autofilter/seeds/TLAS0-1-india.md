# TLAS0-1 — India — Strategy column addendum

**Project:** p-autofilter  
**Agent:** India  
**Gate:** TLAS0-G  
**Isolation:** read-only. No product code.

**Read:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Strategy-Column-Spec-v0_1.md` · v0.1.1 · plan `docs/Trade-Log-Autofilter-Strategy-Column-Full-Agent-Bench-Plan-v1_0.md` · `web/lib/tradeLogAutofilter.ts` · `TradeLogAutofilterBar.tsx` · `TradeFindTag.tsx` COLS

**Do:**

1. Addendum **APPROVED** or **RETURNED** for build readiness.
2. Host-only: Strategy is a `ColumnDef` in `tradeLogColumns`. Shared `apply.ts` stays generic.
3. One stream: do not add `strategies=` to Trade Log `fetchTrades`.
4. Alpha idle unless a server seam exists.
5. v0.2 / journal / records stay **parked**. Other five deferred columns out.
6. Find and Badge Strategy filter is a different surface — do not merge.
7. Flag O1/O2 as Coach’s. Do not invent answers. Do not delete addendum text.

**Done when:** `agents/p-autofilter/reviews/TLAS0-1-india.md`.
