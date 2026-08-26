# TLAF1-G — Delta

**Program:** Trade Log Autofilter — **internal extract only**  
**Plan:** `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`  
**Spec:** GO SPEC **DL-584** · O3 select-time · O4 clean visit  
**Date:** 2026-08-25  
**Verdict:** **PASS**

TLAF1 is **internal, not a deploy.** Find and Badge is the only consumer. Trade Log title bar **not** mounted. Buttons/nav **not** removed. **TLAF2 not fired.**

---

## Evidence

### A12 — one shared component

| Path | Role |
|------|------|
| `web/lib/autofilter/apply.ts` | AND/OR stream, select-time gate, `(none)`, Filter-on label |
| `web/components/autofilter/ValueFilter.tsx` | value-list dropdown |
| `web/components/autofilter/DateWhenFilter.tsx` | date tree |
| `web/components/autofilter/FilterMenuPortal.tsx` | portal |
| `web/components/autofilter/FilterOnMark.tsx` | A9 mark |
| `web/components/trade-log/DateWhenFilter.tsx` | **re-export only** |
| `web/components/trade-log/FilterMenuPortal.tsx` | **re-export only** |
| `web/components/trade-log/TradeFindTag.tsx` | consumer (`ValueFilter` + `DateWhenFilter`) |

`rg 'function AutoFilter' web` → no matches (dropdown is `ValueFilter`).

### A7 / A8 / A9 engine

```
cd web && npx --yes tsx lib/autofilter/apply.test.ts
→ autofilter apply.test.ts ok
```

O3 select-time: `selectionGate` + `dateVsWindowsConflict` disables campaign/day combos outside the window.  
A8: zero rows without incompatibility → `NOTHING_MATCHED`, gate not disabled.  
A9: `filterOnLabel(2, 3) === "Filter on — 2/3"`.  
O4: `apply.ts` has no persist / `lastUsed` API.

### Find and Badge

Same testids (`autofilter-${col}`, `autofilter-when`, `campaign-autofilter-toggle`). Filter still drives `filterQuery` / found-set fetch. Playwright `trade-log-find.spec.ts` not run in this gate (needs live app); characterization of extract is the unit file. Live e2e remains the TLAF2/regression bar.

### Not in this diff

- Trade Log title-bar Autofilter  
- `blotter-campaign-filter` removal  
- Practice nav omit (O1 → TLAF2)  
- Open:N removal (O2 → TLAF2)

---

## Stop

**TLAF1-G PASS.** Coach stamps **GO TLAF2** (requires this PASS + O1 + O2). **Do not fire TLAF2 from chat.**
