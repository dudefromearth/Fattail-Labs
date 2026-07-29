# PH1-3 — Wire clients to analytics API

**Project:** p-practice-harden  
**Seed:** PH1-3 Charlie  
**Date:** 2026-07-29  
**Primary:** Charlie  

## Change summary

| Before | After |
|--------|--------|
| Reports: full book fetch + `buildReportsBook` client domain | `fetchReportsBook` → `reportsBookFromServer` |
| Journal: full book fetch + `buildDayBook` / `daysWithBookInterest` | `fetchDayBook` / `fetchDaysInterest` → mappers |
| Client owned structure/match/synthetic PnL | **Removed** from `web/lib` domain paths |

### New / rewritten

- `web/lib/tradeLogAnalytics.ts` — typed fetch helpers only  
- `web/lib/reportsBook.ts` — presentation + histogram + capital preference  
- `web/lib/journalDayBook.ts` — DayBook types, badge, server mapper only  
- `ReportsDashboard.tsx` — accounts + reports-book by filter/capital  
- `JournalCalendar.tsx` — day-book per selected day + days-interest  

### Fail-visible

- 401/403/err paths preserved on both dashboards  
- Retry hooks still call reload  

### Deep links

- Reports `?trade=` highlight unchanged (series still has `tradeId`)  
- Journal → trade-log / Option-click reports unchanged  

## Evidence

```text
cd server && .venv/bin/python -m pytest tests/test_trade_log_analytics.py tests/test_trade_log_domain.py tests/test_trade_log.py -q
19 passed

cd web && npx tsc --noEmit   # clean
cd web && npm run build      # success (Practice routes present)
```

## Alpha review

**Verdict: APPROVED**

- Client calls match PH1-2 contracts (`starting_capital`, `day`, `from_day`/`to_day`).  
- No reinvented structure/PnL on client.  
- Presentation-only formatting stays client-side as designed.  

## Kilo review

**Verdict: APPROVED**

- Dual domain deleted (not dual-path).  
- Server goldens + analytics isolation remain the correctness net.  
- No new frontend unit theater. Build/tsc evidence sufficient for wire seed.  

## Seed completion

- [x] Reports uses server  
- [x] Journal day book uses server  
- [x] Dual client domain removed  
- [x] Alpha · Kilo APPROVED  
