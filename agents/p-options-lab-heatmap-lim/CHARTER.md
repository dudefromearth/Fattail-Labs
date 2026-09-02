# Project: Options Lab Heatmap LIM

**Board:** `agents/p-options-lab-heatmap-lim/`  
**Orchestrator:** Juliet  
**Authority:** Coach  

## Plan / Spec

| Doc | Path |
|-----|------|
| **Plan v1.2** | [`docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.2.md`](../../docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.2.md) |
| **LIM Spec v0.4.3** | [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.3.md`](../../Specs/FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.3.md) **BUILD AUTHORITY** sha1 `01f638f590492520236b3607edde487b949d6016` · **DL-651** |
| W0 token | [`agents/go/OLLIM-W0.md`](../go/OLLIM-W0.md) **GO** (**DL-651** · **DL-652** · 2026-09-02) |

## Mission

Ship Heatmap template `lim` (`layout: "quadrant"`): publish where this expiration's GEX mass sits relative to spot, and the near-spot mix of sign, concentration and closeness — **as factors, not as a metaphor**. Forecasts nothing. Reads no volume.

## Invariants

Plan §5. Especially: existing `gex_v1` only · no MSC · no server · crossings are intervals · proximity does not move or fade the dot · empty is centre · fail-loud config · AT-LIM23 vocabulary · frozen `gex` stays.

## Out of scope

Strike Turnover · SVP writer · IKI GEX toolset · Advanced Fly / Width Fit reopen · volume · MiniTwo unless asked.

## Coordination

| Board | Touch |
|-------|--------|
| `p-options-lab-heatmap` | Closed Wave‑1 — do not reopen |
| `p-options-lab-heatmap-width-fit` | Closed — byte-identical |
| `p-iki-lab` / IKI GEX | Beside, not this board (OD-LIM5) |
| `p-session-volume-profile` | Parent Templates merge only (OD-LIM6) |
