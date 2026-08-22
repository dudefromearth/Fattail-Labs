# GO token — Template Runner TR-P3 · One runner path

**ID:** `TR-P3`  
**Callsign:** Charlie  
**Board:** `agents/p-template-runner/`  
**Gate:** **TR-P3-G**  
**Parent:** TR-P2 PASS (TR8 residual) · MB-P2 PASS (`68d664a` · DL-535)

---

## Coach stamp

- [x] **GO** — this brief is the stamp  
**Signed:** Coach  
**Date:** 2026-08-21  

---

## W0 — host defect (precise)

| Piece | Where |
|-------|--------|
| Shell host | `web/lib/runner/sinks/render.ts` `HeatmapRenderHost` |
| Early return | `onSnap`: `if (tplKey !== "spread-tax@0.1") return` — `sym-fly` never `run()`s |
| Selector | `onChange` → `setTplKey`; body swaps `HeatmapChainPanel` vs `SpreadTaxGrid` |
| Interest drop | Selecting spread-tax **unmounts** `HeatmapChainPanel` → `useOptionChainBus` cleanup → `setChainInterest(id, null)` → Runner `subscribe()` had no `chain` of its own → **no `run()`** |

**Defect name:** selector change → unmount → `setChainInterest` released → no `run()`.

### HeatmapChainPanel responsibilities (not only tiles)

| Job | Lands on (flag 1 / TR-P3) |
|-----|---------------------------|
| Chain interest | Host `subscribe({ chain })` — one interest id, held until host unmount |
| Snapshot + diffs | Host applies `chain` documents → `ChainContext` |
| Tile compute | `run(template, streams, controls)` |
| Tile draw | Render sink (generic grid) — **not** `HeatmapChainPanel` |
| Staleness chrome | Host props from document `stale` / `epoch_quality` (Keep-Warm Spec still owns chrome grammar; host surfaces the fields) |
| Symbol | `useOptionsLab` (already suite-shared; not the panel) |
| Expiration / view side | Host chain controls (minimal; required to declare interest) |
| Advanced flies inspector / ToS / Width Fit sliders | **Not** on the shell path (flag 0 keeps the panel). Out of TR-P3 chrome redesign. |
| Flag 0 draw | Unchanged `HeatmapChainPanel` |

### Files

**Create:** `web/lib/runner/host.ts`, `web/lib/runner/__tests__/p3.test.ts`  
**Touch:** `web/lib/runner/sinks/render.ts`, heatmap `page.tsx` only if mount changes  
**Read only:** `web/lib/market/*`, `HeatmapChainPanel`, `symFly.ts`, `server/*`
