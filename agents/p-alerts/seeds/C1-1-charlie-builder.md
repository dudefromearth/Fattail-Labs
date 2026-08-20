# Seed C1-1 — Charlie Builder + adapter + holder

**Project:** p-alerts  
**Agent:** Charlie  
**Phase:** C1  
**Depends:** W0-BA names **Packet C1** · Echo W0-3  
**Law:** AZ-ALB §2 · §4 · §5 · plan §8.2 · **§8.5 H1–H7**  
**Gate it feeds:** C1-2 · C1-3

## Intent

Bring the Analyzer Alert Builder, hook, and inspector holder to law. Session stub until Packet S. **Do not touch `HostPnLChart`.**

## Files in scope

- `web/components/options-lab/AlertBuilderDialog.tsx`  
- `web/lib/alerts/analyzerAlertsAdapter.ts`  
- Inspector Alerts holder (`AnalyzerControlsColumn.tsx` / inspector chrome — holder only)  
- `web/lib/options-lab/analyzerBook.ts` — unbound display; **no delete**  
- `web/components/options-lab/OpfRiskAnalyzer.tsx` — **only** to mount dialog + holder save through the hook (no canvas menu)

Keep the file and the feature grammar. **Do not keep MSC chrome.** Plan §8.5 H1–H7 are this packet. Shipping `bg-[#2c2c2e]` or the traffic-light close-dot is a **FAIL**.

## Out of scope

`HostPnLChart.tsx` · `hostAlertMenu.ts` · Manager HTTP · MiniTwo · severity picker · delete chrome · viewport Autofit

## Wire

1. Constants: `ALERTS_SOURCE_SYSTEM`, `ALERTS_SUITE=options_lab`, `ALERTS_SEVERITY_DEFAULT=medium`. Every Save draft includes `suite` + `severity`.  
2. Builder types Price / Position / Greeks live; Algo / BE / Trail / 0DTE Save off.  
3. **§8.5 H1–H7 in this diff:** kit `Modal` · `SegmentedControl` · `IconButton` `xmark` (Close, 44×44) · `Button` Cancel/Save. Dark-pinned **tokens**. Close-dot gone. 44pt on chips, steppers, sub-tabs, holder cards, **+**. Empty holder stays empty.  
4. Holder: **+**, ~3–4 cards, no helper copy, Active/Idle, **Unbound** if `position_id` missing from book. Hidden card still bound. Empty = empty (`EmptyState` deviation).  
5. **Position**, never strategy. Strike labels `6700C/6720C/6740C`.  
6. Honesty: do not claim OS/SMS delivery.

## Done when

**+** opens Builder (Price, Spot). Save → holder card via hook. No `HostPnLChart` diff. H1–H7 closed (no `#2c2c2e`, no close-dot). AT-ALB-11…14 **would** pass once C1-3 lands.

## Invariants

DL-309. FP2 suite/severity. FP3 no delete. FP6 unbound. **FP14.** Plan §8.5. Coach Content Law.
