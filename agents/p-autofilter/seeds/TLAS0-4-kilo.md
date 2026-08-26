# TLAS0-4 — Kilo — Strategy column inventory

**Project:** p-autofilter  
**Agent:** Kilo  
**Gate:** TLAS0-G  
**Isolation:** read-only. No product tests until TLAS1.

**Read:** plan §3 as-built · `tradeLogAutofilter.ts` · `TradeLogAutofilterBar.tsx` · `trade-log-autofilter.md` · `TradeFindTag.tsx`

**Do:** Quote file+line:

1. `tradeLogColumns` keys today (expect when, campaign, symbol, status — no strategy).
2. Bar `cols.map` (generic vs hard-coded four).
3. Help heading “The four columns”.
4. Find and Badge already has `strategy` COLS key.
5. e2e `trade-log-autofilter.spec.ts` asserts Exec time / Campaign / Symbol / Status — will need Strategy after TLAS1.

**Done when:** `agents/p-autofilter/reviews/TLAS0-4-kilo.md`.
