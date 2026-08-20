# Analyzer 2D Viewport Drag & Scroll — Full Agent Bench Plan v1.0

**Date:** 2026-08-19  
**Plan revision:** **v1.0.1** (VPP-B1 India artifact · VPP-A1 Packet B own BA · VPP-A2 W3-E gate row)  
**Canonical filename:** `docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-az-viewport-2d/`](../agents/p-az-viewport-2d/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Viewport analysis (WHAT)** | [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md`](./Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md) | Review-folded · VP-B1 stamped |
| Analyzer Spec v0.2.1 §1.14.3 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Parent: **right-click** for alerts |
| Surface Autofit / AT-AF-7 | Spec v0.1.1 · `web/lib/risk-graph/surfaceAutofit.ts` | **One law, two surfaces** — live tick / What-if must not Autofit |
| OT-EF · DL-309 | Doctrine v1.1 | Listed grid only; Packet B must not invent strikes |
| Human Interface Spec v1.0 | `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` | 44pt; no stolen gestures |

**Parents (do not re-litigate):**

| Doc | Role |
|-----|------|
| What-If T/σ board | Claim: **W2 closed** — **India W0-2 must verify from that board’s artifact** (not this cell). Do not reopen `OpfRiskAnalyzer.tsx`. AT-2D-AF-7 lives in Packet A (`PnLChart`). |
| Surface first-ship / autofit boards | 3D Autofit already shipped. Do not reopen persist / egg / playhead. |
| Market Bus · Arch 28 | One WS/tab · no client Massive |
| Analyzer residual | Layout / inspector rail stay **there** |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule of a specialist finding is a **DL with reasoning**, not a waived gate.

**Juliet does not invent WHAT.** Coach stated the symptom. Charlie / Echo / Kilo diagnosed. External review folded VP-B1 / VP-A1–A3. This plan only **sequences**.

---

## 0. Why this program exists

Coach (verbatim):

> In some cases there is no problem with the free movement of a position within the viewport, including scroll to change the strike axis by stretching and compressing it. However the vast majority of cases I have no control over dragging the position or using the scroll function. The position is immovable.

Three separable causes (analysis): **T8 Autofit** on live BE hash; **left-click-on-tent → alert menu**; **strike-handle unwired** (always off — does not explain intermittency).

---

## 1. Mission

```text
W0  Review the analysis as law (India · Echo VP-A1 · Tango · Hotel · Delta)
      → Coach W0-BA or impl stamp + DL naming bypassed W0 packets
W1  Charlie Packet A — PnLChart only
W2  Kilo AT-VS-1 / AT-2D-AF-* (may start with W1 helpers)
W3  Lima Analyzer §1.14.3 + 2D=Surface autofit DL  (∥ W2)
    Echo Packet A cursor/hit review (after W1)
W-G Delta
Packet B  Charlie listed-grid handles — AFTER A + Echo grammar. Separate fire.
```

**No product code until W0-BA, or Coach stamps the impl plan and Lima logs a DL that names which W0 packets are bypassed and why.** Silent stamp without that DL is a waived-gate path (forbidden). Same shape as What-If PL-B2 / DL-451.

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | Packet A is `PnLChart` only. No `/resolve`. No invented strikes. VP-B1 order holds. **W2 closure proven from that board’s artifact** (W-G report, titled DL, or ORCHESTRATOR PASS + named commit) — not from this table. | Echo · Tango · Hotel |
| **W0-3 Echo** | **Must dispose VP-A1** (Show/Hide vs structure for lock-clear). Grammar for Packet A. Packet B handles stay follow-on. | Charlie W1 (that branch) |
| **W0-G Delta** | Analysis + plan + board on disk; **no product code** in W0 | Coach W0-BA |
| **W0-BA Coach** | BUILD AUTHORITY on **Packet A only** (or impl stamp + DL) | W1 Charlie |
| **W3-E Echo** | Post-W1 cursor/hit review (`W3-2-echo-review`). Packet A grammar as-built. | W-G (cite this row) |
| **W-G** | AT-VS-1 PASS · left-click pans · right-click alerts · docs · W3-E filed | Ship / MiniTwo (Coach) |
| **Packet B BA** | **Own Coach BUILD AUTHORITY** — does not inherit Packet A W0-BA. Required before `WB-1` (VPP-A1). | WB-1 Charlie |

---

## 3. Locked (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Left-click = pan / axis-zoom. Alerts = **right-click**. §1.14.3 conformance. | Analysis · advisor |
| **FP2** | After the member moves the view, live BE / seriesLen / spot drift **must not Autofit**. | T8 · AT-AF-7 |
| **FP3** | What-if sheet rebuild must not Autofit (**AT-2D-AF-7**). | VP-B1 hinge · W2 closure **if** India proves it |
| **FP4** | Packet A exclusive lock: `PnLChart.tsx`. Not `OpfRiskAnalyzer.tsx`. | VP-B1 |
| **FP5** | Packet B after A **and its own Coach BA**. Strike-handle = listed grid only (DL-309). | Analysis · VP-B1 · VPP-A1 |
| **FP6** | Wheel **3%** stays in Packet A AC. Larger step is Echo feel (VP-A2). | Advisor |
| **FP7** | Native `{ passive: false }` wheel on the chart host. | React 19 · Surface pattern |
| **FP8** | Juliet does not invent WHAT. Coach Content Law on the analysis. | Doctrine |

**Coach / Echo still dispose:**

| OD | Silent if Coach says nothing at W0-BA |
|----|----------------------------------------|
| **VP-A1** Show/Hide vs structure | **Juliet proposes:** Show/Hide = `scheduleDraw()` only; lock clears on **structure** (legs/strikes), not curve visibility. **Echo stamps at W0-3.** |

---

## 4. DAG

```text
W0-0 Coach plan stamp
  → W0-1 Lima hash
  → W0-2 India parents / VP-B1
       ├── W0-3 Echo (VP-A1 + Packet A grammar)
       ├── W0-4 Tango (stolen gesture / load)
       └── W0-5 Hotel (wrong view story → worse?)
  → W0-G Delta
  → W0-BA Coach
       → W1 Charlie Packet A
            ├── W2 Kilo ATs
            └── W3 Lima docs (∥ W2)
            └── W3-E Echo Packet A review (after W1)
       → W-G Delta
Packet B  (own Coach BA + Echo Packet B grammar + after Packet A W-G · no parallel OpfRiskAnalyzer packet)
```

W0-3 · W0-4 · W0-5 may run **in parallel** after W0-2 APPROVED.

---

## 5. Packets

| Seed | Agent | Fire | Code? |
|------|-------|------|-------|
| `W0-0-coach-plan-stamp.md` | Coach | First | No |
| `W0-1-lima-hash.md` | Lima | After W0-0 | No |
| `W0-2-india-parents.md` | India | After W0-1 | No |
| `W0-3-echo.md` | Echo | After W0-2 | No |
| `W0-4-tango.md` | Tango | After W0-2 | No |
| `W0-5-hotel.md` | Hotel | After W0-2 | No |
| `W0-G-delta.md` | Delta | After W0-2…5 | No |
| `W0-BA-coach-build-authority.md` | Coach | After W0-G | No |
| `W1-1-charlie-pnlchart.md` | Charlie | After W0-BA or impl+DL | **Yes · PnLChart only** |
| `W2-1-kilo-at.md` | Kilo | After W1 (helpers may land with W1) | Tests |
| `W3-1-lima-docs.md` | Lima | After W1 (∥ W2) | Spec + DL |
| `W3-2-echo-review.md` | Echo | After W1 | Review only |
| `WG-delta.md` | Delta | After W2 + W3 + W3-E | No |
| `WB-1-charlie-handles.md` | Charlie | **After Packet B BA** + Echo Packet B grammar + Packet A W-G | `OpfRiskAnalyzer` wire |

**Execution map:**  
[`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md`](./Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md)

---

## 6. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | Reopen What-If W2 / `OpfRiskAnalyzer.tsx` in Packet A |
| **NX2** | Packet B in the same fire as A |
| **NX3** | `/resolve` schema · invented strikes · extra WS / Massive |
| **NX4** | Change wheel **step size** as Packet A acceptance (VP-A2) |
| **NX5** | Surface 3D Autofit / persist / egg / playhead |
| **NX6** | Inspector rail / Heatmap / VP / GEX |
| **NX7** | Copy MSC `PnLChart` — re-derive sticky-view + right-click in Labs |
| **NX8** | Product code before W0-BA (or impl stamp + DL naming bypassed W0) |
| **NX9** | Touch / iPad first ship |
| **NX10** | Pass `oneSigmaBandWidth` (wrong window, not dead controls) |

---

## 7. Review verdict shape (W0-2…5)

Per `spec-create-review-workflow.md`:

- Up front if Coach content changed  
- Bench delta  
- Coach content intact?  
- Blocks (invariant / law / system only)  
- Opinions labeled  
- Flagged ideas table (or none)  
- Build disposition: APPROVED \| RETURNED  

Echo **must** dispose VP-A1. Hotel blocks only if a wrong view story would make a member **worse** (they thought they zoomed to a strike and the next poll lied). Tango RETURN stolen-gesture load; do not delete Coach “immovable position.”

---

## 8. First smoke (after W1 — not W0)

1. Live RTH book: wheel-zoom strike axis; wait ≥ 3 s (one poll); window **stays**.  
2. Grab the tent (left-drag): **pans**, no alert menu.  
3. Right-click tent / blank: alerts still open.  
4. What-if Time/Vol move: sheet rebuilds; view **does not** Autofit.  
5. Controls **Auto-fit** snaps ATM + ½-viewport BEs.  
6. Show/Hide T+0: per Echo VP-A1 stamp (Juliet default: no snap).

---

## 9. Status

| Packet | State |
|--------|--------|
| Analysis v2026-08-19 | **On disk · review-folded** |
| This plan + board | **Land for Coach W0-0 stamp** |
| Impl plan v1.0 | **On disk · not fired** |
| W0-1 … W0-BA | **Not fired** |
| W1+ Packet A | **Not fired** |
| Packet B | **Blocked** until A + Echo grammar |

**Fold (VPP):** W0-2 must prove What-If W2 from that board’s artifact (VPP-B1). Packet B has its own BA row (VPP-A1). W3-E is in §2 (VPP-A2).

**Next:** W0-0 Coach stamp this review board. Stamping the impl plan **before** W0-BA is Coach authority only with a **DL that names which W0 packets are bypassed and why**.
