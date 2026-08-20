# Seed D0-1 — Charlie keep-dark (canvas apply)

**Project:** p-alerts  
**Agent:** Charlie  
**Phase:** D0  
**Depends:** W0-BA chose **keep dark until C2-G**  
**Do not fire** if W0-BA chose accept-as-built or W0-G named not-reachable.  
**Gate it feeds:** M / C1 may still run; C2 stays gated; viewport harnesses see a dark menu

## Intent

Canvas apply is reachable today without a C2 gate. Unhook or flag it so a member in the built app cannot right-click-apply until C2-G. **Not** C2 BUILD. Do not change pan / Autofit / attach.

## Files in scope

Minimum that makes the menu unreachable:

- `HostPnLChart.tsx` — `contextmenu` listener gated off **or** menu not mounted  
- `OpfRiskAnalyzer.tsx` — `onCanvasAlert` / `onPositionAlert` no-ops while dark  
- Optional: a named flag (fail-loud if used; default dark)

## Out of scope

Rewriting `hostAlertMenu.ts` law. Autofit, wheel, `ensureBound`. Builder **+** in the inspector (C1). MiniTwo unless Coach asks.

## Done when

Right-click on the plot does **not** open the alert menu in the built app. Left-click still pans. `gate-reports/D0-1.md` with the off-switch named. C2-1 will turn it back on after C2-BA.

## Invariants

AL-B1. Reciprocal freeze otherwise still holds. DL-309 N/A. Do not invent a second chart.
