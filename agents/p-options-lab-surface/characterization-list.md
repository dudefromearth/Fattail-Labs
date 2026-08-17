# W2 characterization list — Options Lab 3D Surface (first-ship)

**Author:** Delta · Kilo (seed W2-1)  
**Status:** **CONTRACT** for W3–W4. Not a gate verdict.  
**Date:** 2026-08-16  
**Plan:** [`docs/Options-Lab-3D-Surface-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-3D-Surface-Full-Agent-Bench-Plan-v1.0.md) **v1.0.1** §6  
**Tech:** `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-Tech-Spec-v0.1.md` §8  

No tests were added. No product code was changed. **W2-G is this first-ship
set only.** Later rows (§2) do **not** block W3.

Severity **high:** invented smile, silent false package price, live claim
after settlement, neighbor fill of a missing listed IV.

---

## 1. FIRST-SHIP (blocks W3)

### T-IV-1

| Field | Value |
|-------|--------|
| **Fact** | Bind with `vix` / missing mark → `IV NO`, no sheet |
| **Home** | `web/lib/risk-graph/surfaceModel.test.ts` · `bindListedSurfaceLegs` |
| **Blocked on** | none (bind already as-built) |

### T-IV-2

| Field | Value |
|-------|--------|
| **Fact** | Bind `exact`+`locked` → legs carry those IVs |
| **Home** | `bindListedSurfaceLegs` |
| **Blocked on** | none |

### T-IV-3

| Field | Value |
|-------|--------|
| **Fact** | Bind with `nearest` / `atm_exp` / `vix` present and no exact → IV NO, no sheet |
| **Home** | `bindListedSurfaceLegs` |
| **Blocked on** | none |

### T-IV-4

| Field | Value |
|-------|--------|
| **Fact** | Near-zero ITM exact IV in (0, 0.01] → bind succeeds (keep) |
| **Home** | `bindListedSurfaceLegs` |
| **Blocked on** | none |

### T-WIN-1

| Field | Value |
|-------|--------|
| **Fact** | `tauLo/tauHi` → `timeAxis[0]===tauHi`, last===tauLo, length nt |
| **Home** | `computeSurfaceSheet` (W3-1 Alpha τ-window) |
| **Blocked on** | W3-1 |

### T-WIN-2

| Field | Value |
|-------|--------|
| **Fact** | Window outside remaining life → fail loud |
| **Home** | `computeSurfaceSheet` |
| **Blocked on** | W3-1 |

### T-SMP-1

| Field | Value |
|-------|--------|
| **Fact** | Playhead change does not change `pnlGrid` reference / hash |
| **Home** | `sampleSheet` / inspect playhead |
| **Blocked on** | W3-3 |

### T-CAM-1

| Field | Value |
|-------|--------|
| **Fact** | `setInspect` camera-only does not call compute |
| **Home** | `surfaceScene` |
| **Blocked on** | W3-2 |

### T-VW-1

| Field | Value |
|-------|--------|
| **Fact** | 13th saved view → 422 |
| **Home** | PATCH `/api/me/profile` |
| **Blocked on** | W3-4 |

### T-VW-2

| Field | Value |
|-------|--------|
| **Fact** | Name `iso` → 422 |
| **Home** | PATCH `/api/me/profile` |
| **Blocked on** | W3-4 |

### T-LM-1

| Field | Value |
|-------|--------|
| **Fact** | 0DTE τ still decreases 15:00 → 15:59; not clamped to 1 hour |
| **Home** | **Cite only** OPF Spec v0.2.1 §3.7 AT-L0-τ1 / AT-L0-τ4. Surface does not invent a second τ. |
| **Blocked on** | none (OPF already owns) |

### T-LM-2

| Field | Value |
|-------|--------|
| **Fact** | Same structure at 16:01 ET (PM settlement): sheet is residual / not live |
| **Home** | Surface host Law B / Law C consume |
| **Blocked on** | W3-1 |

### T-LM-3

| Field | Value |
|-------|--------|
| **Fact** | Wing `iv_source` ≠ exact\|locked → IV NO; no neighbor fill |
| **Home** | `bindListedSurfaceLegs` |
| **Blocked on** | none |

### T-LM-5

| Field | Value |
|-------|--------|
| **Fact** | Friday 2026-08-14 snap HUD/quality ≠ gold last-minute |
| **Home** | HUD cadence chip (`echo-labels.md`: **5-min** + `as_of`) |
| **Blocked on** | W3-1 / W3-3 if a cadence chip ships |

### T-LM-6

| Field | Value |
|-------|--------|
| **Fact** | `evaluatePnlAtSpot` is not the card debit; debit stays PackagePricer / lock |
| **Home** | Host spot-cell vs sheet sample |
| **Blocked on** | W3-1 |

### T-TM-2

| Field | Value |
|-------|--------|
| **Fact** | Bind path: one missing exact IV → IV NO, no fill. **Not** a snap-feed test. |
| **Home** | `bindListedSurfaceLegs` |
| **Blocked on** | none |

### T-BOOK-1

| Field | Value |
|-------|--------|
| **Fact** | Two shown structures: sheet is additive Σ(V−D*). v0.1 may skip implement. Must **not** document the inverse as law. |
| **Home** | Document-law (App Spec §4.7). Grep product copy for “focused only” as tent law. |
| **Blocked on** | none (document). Implement later if book >1 ships. |

### T-GRID-1

| Field | Value |
|-------|--------|
| **Fact** | Default `nx=80` · `nt=48` (`surfaceModel.ts` `DEFAULT_NX` / `DEFAULT_NT`). Phone DPR **cap 2** (Tech §4). Fail loud if DPR / grid is unbounded. Hotel pin had no numbers — this row is the pin. |
| **Home** | `computeSurfaceSheet` defaults · `surfaceScene` pixel-ratio cap |
| **Blocked on** | W3-1 (grid) · W3-2 (DPR) |

---

## 2. LATER (does **not** block W3 · not in W2-G)

| Id | Fact | Opens with |
|----|------|------------|
| T-TM-1 | Time-machine step to snap t₂ changes σ to t₂’s exact IVs | Consumer wave |
| T-TM-4 | 15:50 → 15:51 σ from the 15:51 snap | Consumer wave |
| T-CON-1 | Backtest uses bind + `computeSurfaceSheet` | Not this board |
| T-CON-2 | Mini graphic label **day walking · n of N**; no P&L hero | Not this board |

---

## 3. Completeness

First-ship IDs required for W2-G: T-IV-1 T-IV-2 T-IV-3 T-IV-4 T-WIN-1
T-WIN-2 T-SMP-1 T-CAM-1 T-VW-1 T-VW-2 T-LM-1 T-LM-2 T-LM-3 T-LM-5
T-LM-6 T-TM-2 T-BOOK-1 T-GRID-1.

Later IDs must remain labeled non-blocking: T-TM-1 T-TM-4 T-CON-1 T-CON-2.
