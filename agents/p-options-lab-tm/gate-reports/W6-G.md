# W6-G — Heatmap, Surface, Width Fit

**Agent:** Delta  
**Date:** 2026-08-28  
**Verdict:** **PASS**

**Law:** TMI-3 · TMI-42 · TMI-29 · TMI-32 · Surface §4.6 · AT-TM-C3 · Width Fit Replay

## Evidence

| Check | Result |
|-------|--------|
| Sticky `t_ms` Analyzer → Heatmap → Surface | `e2e/tm-w6-hosts.spec.ts` **PASS** — SPA nav, same `data-tm-playhead-t` on all three. Shots `w6-heatmap-sticky.png` · `w6-surface-sticky.png` |
| Same strip + date | `TimeMachineChrome` on Heatmap and Surface; Analyzer uses `useTimeMachineHost` (shared `tmHost` / `tmSlots`) |
| Width Fit Live \| Average \| Replay | `HeatmapControlsColumn` three segments. Average still `wfTime === "average"` MA path. Replay is `wfTime === "replay"` / playhead chain. Not collapsed. |
| Templates stay pure | Replay substitutes `ChainContext` (`useChainAtPlayhead`). `widthFit.ts` compute untouched. |
| Surface IV at *t* | `marksFromChain` + `iv_source: "generation"` into `bindListedSurfaceLegs`. Windowed archive fetch or remembered live gen. No second Massive socket. |
| Cadence reversal | **DL-606** — [2, 5]; 2 s is Massive's floor; ladder sized on slow end. AT-45 fired ≠ succeeded kept in `at45-run.log`. |

## Fail-closed (none tripped)

Private per-host cursor · Replay collapsed into Average · second Massive socket.

## Not closed here

**Surface high-IV watermark** stays **open** until a listed tent paints. WAITING / CHECK LEGS is not that field.

Rehearsal badge + Trade Log empty is **W7**.

## Unblocks

W7 — rehearsal objects.
