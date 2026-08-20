# Seed C2-0 — India lock handoff (canvas apply)

**Project:** p-alerts  
**Agent:** India  
**Phase:** C2  
**Depends:** `p-az-viewport-2d` **W-G PASS** **and** `p-az-viewport-return` **W-G PASS**  
**Gate it feeds:** C2-BA

## Intent

Name the lock handoff so a third board may touch `HostPnLChart` without colliding Packet A / return attach.

## Asks

1. Quote **both** W-G reports (path + excerpt or commit SHA). If either is missing, **BLOCK** — do not infer from ORCHESTRATOR color.  
2. **AL-A2:** Those W-G reports will name `PnLChart.tsx`. As-built is `HostPnLChart.tsx`. **Cite DL-458** (title + date) alongside the excerpts so the lock chain reads across the rename. Do not BLOCK solely because the old filename is in a viewport document.  
3. File lock for C2: `web/components/options-lab/risk-graph/HostPnLChart.tsx` + `web/lib/risk-graph/hostAlertMenu.ts` (+ tests). Viewport Autofit / wheel / `ensureBound` stay on those boards unless their W-G explicitly released them.  
4. Gesture grammar already shipped by Packet A: left-click pans, alerts on right-click. C2 **applies** the menu; it does not reopen pan.  
5. `OpfRiskAnalyzer.tsx` only if a callback must be wired — say so explicitly.

## Out of scope

Code. C2 BA (Coach). MiniTwo.

## Done when

`gate-reports/C2-0-india-lock.md` — first paragraph quotes both W-G artifacts **and DL-458**, and names the files C2 may touch.

## Invariants

Same shape as VP-B1 / ALB-B1. Third occurrence: do not waive.
