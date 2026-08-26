# AF0-4 — SUPERSEDED — use `TLAF0-4-kilo.md`

# AF0-4 — Kilo Autofilter as-built inventory (v0.2)

**Project:** p-autofilter  
**Agent:** Kilo  
**Gate:** AF0-G  
**Isolation:** read-only. Grep and quote.

**Do (evidence, not claims):**

1. Files defining `AutoFilter` / `autofilter-` testids.
2. Nav date/campaign: `practice-granularity`, `practice-campaign-select`, any Trade Log-local buttons.
3. Quote `Open:N` and campaign-badge `onClick` in `TradeLogTable.tsx` (file + line).
4. Quote `campaign-autofilter-toggle`.
5. Practice pages that mount `PracticeSuiteChrome` — **named vs unnamed**.
6. **Today’s dual mechanism:** Campaign Find and Badge Autofilter **plus** PracticeContextBar on the same page (A17 as-built fail — inventory it).
7. Existing e2e: `web/e2e/trade-log-find.spec.ts`. Do **not** treat `reports-scope.spec.ts` as in-program unless Coach names Reports.
8. Confirm zero extra Autofilter copies, or list them.

**Done when:** `agents/p-autofilter/reviews/AF0-4-kilo.md` with command + output. No code changes.
