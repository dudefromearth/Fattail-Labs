# Analyzer 2D Viewport — Implementation Plan v1.0 (Packet A)

**Date:** 2026-08-19  
**Owner (orchestration):** Juliet  
**Authority:** Coach (this document is Phase 6 at Coach request)  
**Board:** [`agents/p-az-viewport-2d/`](../agents/p-az-viewport-2d/)  
**Review plan:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md)  
**Law:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md`](./Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md)

**Honesty:** Fire W1 only when (a) W0-BA is stamped, **or** (b) Coach stamps this impl plan **and Lima logs a DL that names which W0 packets are bypassed and why**. Silent ODs: **VP-A1 Juliet default** (Show/Hide = draw only) unless Echo overrules at W0-3 · **VP-A2** 3% wheel stays · **VP-B1** Packet A = `PnLChart` only.

Juliet does not invent WHAT. This plan sequences the analysis apply map.

---

## 0. Ship meaning (Packet A)

| After | Member |
|-------|--------|
| Left-drag tent | **Pans.** No alert menu. |
| Scroll | Stretch/compress strike; **stays** through 2.5s polls and What-if rebuilds. |
| Right-click | Alerts (blank = price, curve = position). |
| Auto-fit | Only first paint · **structure** change · Auto-fit button. |

Packet B (listed-grid handles) is **not** this plan’s fire.

---

## 1. DAG

```text
W1 Charlie PnLChart sticky view + left-click pan + native wheel
  ├── W2 Kilo AT-VS-1 / AT-2D-AF-* / AT-CLICK-*
  └── W3 Lima §1.14.3 + DL     (∥ W2)
  └── W3-E Echo cursor/hit review (after W1)
W-G Delta
```

---

## 2. W1 — Charlie (`PnLChart.tsx` only)

**Touch:**

| File | Change |
|------|--------|
| `web/components/options-lab/risk-graph/PnLChart.tsx` | Delete hovered-curve left-click → menu. `userAdjustedView` lock. Gate T6/T7/T8 to `scheduleDraw` after lock. Native `{passive:false}` wheel. Pointer capture. Axis-zoom min range. |
| `web/lib/risk-graph/pnlChartViewPolicy.ts` (**new**) | `autofitShouldRun2d(trigger)` · lock-clear predicates. Mirror Surface `autofitShouldRun`. |

**Out:** `OpfRiskAnalyzer.tsx`. Strike-handle props. Wheel step ≠ 3%. Show/Hide snap unless Echo W0-3 overrules Juliet default.

**VP-A1 default (unless Echo stamps otherwise):** lock clears on Auto-fit and **structure** (legs/strikes). Show/Hide T+0 / expiration = `scheduleDraw` only.

**Done:** AT-VS-1 would fail on `main` before this packet; **PASS** after. Left-click on tent does not open menu.

---

## 3. W2 — Kilo

`web/lib/risk-graph/pnlChartViewPolicy.test.ts` (tsx). AT-VS-1, AT-2D-AF-1…3, 7, 9, 10. AT-CLICK-1/2 as source or thin harness. AT-WH-1: `PnLChart` source or mount spy includes `{ passive: false }`. AT-AZ-WIRE-1: Analyzer still has **no** `onStrikeDrag` (Packet B not shipped).

Fixture `nowMs` / BE hashes — no wall clock. No Playwright required for W2.

---

## 4. W3 — Lima

Same body as W1–W2:

- Analyzer Spec §1.14.3 honesty: left-click pan; alerts right-click.  
- 2D sticky-autofit rows = Surface AT-AF-7 (one law, two surfaces).  
- DL: Packet A; VP-B1 order; VP-A1 as Echo stamped or Juliet default.  
- Analysis status → implemented / DL cited.

---

## 5. W3-E — Echo

Read-only after W1. Cursors (grab on plot, not pointer-as-primary). No new chrome. Block only HI invariant.

---

## 6. NX

Review plan NX1–NX10. Especially: no `OpfRiskAnalyzer` · no Packet B · no wheel-feel AC.

---

## 7. Status

| Packet | State |
|--------|--------|
| This impl plan | **GO** · DL-457 named W0 bypass |
| W1 Charlie | in flight |
| Packet B | Not this plan |
