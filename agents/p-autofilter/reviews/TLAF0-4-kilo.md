# TLAF0-4 — Kilo — Trade Log Autofilter inventory

**Agent:** Kilo  
**Date:** 2026-08-25  
**Isolation:** read-only. Evidence = path:line. No product tests added.

Commands (workspace root):

```
rg -n "PracticeSuiteChrome" web --glob "*.tsx"
rg -n "practice-granularity|practice-campaign-select|blotter-campaign-filter" web --glob "*.tsx"
rg -n "filterOpenOnly|Open: " web/components/trade-log web/app/app/trade-log
rg -n "onCampaignFilter|get\\(\"campaign\"\\)|playbookFilter|journey-adhere-locate" web --glob "*.tsx"
rg -l "function AutoFilter|data-testid=.autofilter" web --glob "!node_modules"
```

---

## 1. Autofilter implementation (one place today)

| File | What |
|------|------|
| `web/components/trade-log/TradeFindTag.tsx` | `function AutoFilter` ~170; `data-testid={autofilter-${col}}` :230; `autofilter-menu-${col}` :245; toggle `campaign-autofilter-toggle` :753 |
| `web/components/trade-log/DateWhenFilter.tsx` | `autofilter-when` :190; `autofilter-menu-when` :205 |
| `web/components/trade-log/FilterMenuPortal.tsx` | portal (no second Autofilter) |

No second `function AutoFilter` outside Find and Badge.

E2E that must stay green after extract: `web/e2e/trade-log-find.spec.ts` (When year→month→day :31; campaign column :113).

---

## 2. `practice-granularity` — O1 evidence (shared)

Defined: `PracticeContextBar.tsx:123` inside `aria-label="Date and campaign filters"`.

Mounted via `PracticeSuiteChrome` → `PracticeContextBar` (`PracticeSuiteChrome.tsx:90–93`) on:

| Page | File:line | Suite `active` |
|------|-----------|----------------|
| Trade Log | `web/app/app/trade-log/page.tsx:862` | `trade-log` |
| Journal | `web/app/app/journal/page.tsx:11` | `journal` |
| Reports | `web/app/app/reports/page.tsx:12` | `reports` |
| Retrospective | `web/app/app/retrospective/page.tsx:171` | `retrospective` |
| Retro detail | `web/app/app/retrospective/[id]/page.tsx` | chrome |
| Playbook | `web/app/app/playbook/page.tsx:79` | `playbook` |
| Playbook book | `web/app/app/playbook/[bookId]/page.tsx` | playbook |
| Campaign | `web/app/app/practice/campaign/page.tsx:179` | campaign |
| Campaign detail | `web/app/app/practice/campaign/[campaignId]/page.tsx` | campaign |
| Symbols | `web/app/app/practice/symbols/page.tsx` | symbols |

Reports e2e already uses campaign chrome: `web/e2e/reports-scope.spec.ts:18` `practice-campaign-select`. **Out of this slice** except as proof the control is shared.

---

## 3. Two campaign controls on Trade Log today

| Test id | File:line | Role |
|---------|-----------|------|
| `practice-campaign-select` | `PracticeContextBar.tsx:170` | Practice nav / chrome |
| `blotter-campaign-filter` | `TradeLogTable.tsx:281` | Trade history toolbar |

Both write the same `setCampaignId` path (`trade-log/page.tsx:114–121`, `onCampaignFilter={setCampaignFilter}` :730).

---

## 4. Open:N + `filterOpenOnly`

| What | File:line |
|------|-----------|
| State | `trade-log/page.tsx:107` `useState(false)` |
| Table subset | `trade-log/page.tsx:470` `filterOpenOnly ? unmatched : trades` |
| Chip | `TradeLogTable.tsx:249–259` `Open: {openN}` · `onFilterOpenOnly` |
| Count display | `TradeLogTable.tsx:245–246` |

Private standing filter today. O2 not answered here.

---

## 5. Badge + `?campaign=`

| What | File:line |
|------|-----------|
| Deep link | `trade-log/page.tsx:55–56` `searchParams.get("campaign")` |
| Apply to chrome | `trade-log/page.tsx:166–171` `setCampaignId(deepLinkCampaign)` |
| Badge tap | `TradeLogTable.tsx:542` `onClick={() => onCampaignFilter?.(cid)}` · `testId="blotter-campaign-badge"` |

---

## 6. Playbook select (out of slice — inventory)

`playbookFilter` state `trade-log/page.tsx:123–125`; passed `TradeLogTable.tsx:733–734`; `<select>` ~294–308. **Do not remove in TLAF2.**

---

## 7. Adhere locate

`journey-adhere-locate-banner` `trade-log/page.tsx:693`  
`journey-adhere-locate-clear` `:714`  
Deep link `adherence_mode` `:66–68`, `:173–184`.

---

## 8. Extract regression

`web/e2e/trade-log-find.spec.ts` — Find and Badge Autofilter. TLAF1 must keep it green. Not run this packet (read-only inventory).
