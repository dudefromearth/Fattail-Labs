# TLAF2-3 — Kilo — A1–A12 + suite chrome

**Agent:** Kilo  
**Date:** 2026-08-25  
**Spec:** Trade Log Autofilter v0.1 · GO SPEC DL-584

## Commands

```
cd web && npx --yes tsx lib/autofilter/apply.test.ts
→ autofilter apply.test.ts ok

cd web && npx --yes tsx lib/tradeLogAutofilter.test.ts
→ tradeLogAutofilter.test.ts ok

cd web && npx --yes tsx lib/tradeLogAutofilter.tlf2.test.ts
→ tradeLogAutofilter.tlf2.test.ts ok

LABS_WEB_BASE_URL=http://localhost:3000 npx playwright test e2e/trade-log-autofilter.spec.ts
→ 2 passed

LABS_WEB_BASE_URL=http://localhost:3000 npx playwright test e2e/trade-log-find.spec.ts
→ 3 passed (Find and Badge)

LABS_WEB_BASE_URL=http://localhost:3000 npx playwright test e2e/trade-log-window.spec.ts
→ 1 passed
```

## A1–A12

| # | Result | Evidence |
|---|--------|----------|
| A1 | **PASS** | `trade-log-autofilter` on Trade history row (e2e + screenshot) |
| A2 | **PASS** | `blotter-campaign-filter` count 0 |
| A3 | **PASS** | Trade Log: `practice-granularity` count 0. Journal/Reports/Retro/Playbook: visible |
| A4 | **PASS** | `tradeLogAutofilter.test.ts` QQQ leg returns whole block |
| A5 | **PASS** | `campaignColumnFilter` shared by badge + `?campaign=` (source + unit) |
| A6 | **PASS** | `journey-adhere-locate-banner` + locate `from_day` still on fetch; chrome date unhooked |
| A7 | **PASS** | TLAF1 `selectionGate` + `dateVsWindowsConflict` (select-time O3) |
| A8 | **PASS** | `emptyValidCopy` / `autofilter-nothing-matched` |
| A9 | **PASS** | `FilterOnMark` in title bar |
| A10 | **N/A** | O2 = remove Open:N. `filterOpenOnly` gone. Status=Open is the column |
| A11 | **PASS** | Autofilter present; blotter campaign + Open:N + Practice date/campaign stream absent on Trade Log |
| A12 | **PASS** | Shared `web/lib/autofilter` + `web/components/autofilter`; host columns in `tradeLogAutofilter.ts` |

## Suite chrome (out of slice, watched)

Journal, Reports, Retrospective, Playbook each still render `practice-granularity` and `practice-campaign-select` (e2e). Account chrome stays on Trade Log (`practice-account-select`). Playbook blotter select stays (`blotter-playbook-filter`). Select opens stays (`blotter-select-opens`).

## O4

No Autofilter persist. Grep `lastUsed` clean in `web/lib/autofilter` and the Trade Log Autofilter host.
