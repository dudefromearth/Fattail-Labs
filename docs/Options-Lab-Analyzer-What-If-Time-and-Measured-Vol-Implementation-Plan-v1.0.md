# Analyzer What-If T/σ — Implementation Plan v1.0

**Date:** 2026-08-19  
**Owner (orchestration):** Juliet  
**Authority:** Coach (this document is Phase 6 at Coach request)  
**Board:** [`agents/p-az-what-if-tm/`](../agents/p-az-what-if-tm/)  
**Spec:** [`Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md) (**DRAFT · India fold**)  
**Review plan:** [`docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md) (W0)

**Honesty:** Spec is not yet W0-BA BUILD AUTHORITY. Coach asked Juliet to write the execution plan now. **Fire W1 only when:** (a) W0-BA is stamped, **or** (b) Coach stamps this impl plan **and Lima logs a DL that names which W0 packets are bypassed and why**. Stamping impl without that DL is a waived-gate path (forbidden). Silent ODs: **OD-1 B** · **OD-2 A** · **OD-3 B**.

Juliet does not invent WHAT. This plan only sequences the spec apply map (§5).

**Folded spec (SP-1, on disk):** V5 is OPF31 additive (`vol_offset_pts = σ_s − σ_m`); AT-TM-7 is +5 pts not 2× legs; AT-TM-1…13 are in §7; **AT-TM-14** is the Surface last-hour mirror.

**File ownership (PL-B1):** Surface first-ship W3-1…W3-4 is **PASS / complete** (`agents/p-options-lab-surface/ORCHESTRATOR.md`). This board’s W3 is a **follow-on What-if HUD amendment**, not first-ship residual. Exclusive lock while W3 is open: `TimeHud.tsx` + the HUD-wire slice of `SurfaceApp.tsx` only. **Out of W3:** `persist.ts`, `surface_inspect`, playhead SAMPLE, planes, named views, egg, autofit. NX11 still forbids reopening first-ship packets. Alternate if Coach refuses overlap: defer OD-2 (Analyzer-only this program; Surface HUD later on a new Surface-board packet). **Juliet proposes this board keeps W3 under the lock; Coach stamps.**

---

## 0. Ship meaning

| Knob | After |
|------|--------|
| **Time** | Range `[0, remaining_last_trade]`. Index 16:15 / equity 16:00. Readout `11:45 ET · 4h 30m left`. Ends Now · Last trade. |
| **τ** | Unchanged OPF29 **16:00 PM**. Do not move `fractionalT` settlement instant. Apply elapsed with **1-minute** floor (OPF §3.7), not the 1-hour floor in `blackScholes.fractionalT`. |
| **Implied vol** | Member slider is absolute %; detent = measured ATM listed IV σ_m; range `[0.5 σ_m, 2.0 σ_m]` clamp 1–200%. Wire `vol_offset_pts = σ_s − σ_m` (percent points). Legs: `σ' = σ + pts/100`. Label **Implied vol**. No member “pts”. |
| **Enable / RECON / Spot %** | Unchanged (A6 / B4). |
| **Surface What-if HUD** | Same remaining grammar + same `vol_offset_pts`. Chrome says **What-if**, not Time machine. Not Time-machine snap rebind. |

---

## 1. DAG

```text
W1 Charlie helpers + unit tests
  ├── W2 Charlie Analyzer inspector + OpfRiskAnalyzer wire
  └── W3 Charlie Surface TimeHud (∥ W2 after W1)
        └── W4 Kilo AT-TM-1…14
W5 Lima Analyzer §1.11 + DL   (∥ W4 after W2+W3)
W-G Delta
```

W2 and W3 share W1 helpers. Do not start W2 UI before W1 tests pass.

---

## 2. W1 — Pure helpers (Charlie + Kilo characterization)

**New files (only):**

| File | Job |
|------|-----|
| `web/lib/options-lab/whatIfClocks.ts` | Last-trade ms (index 16:15 ET / equity 16:00 ET). Remaining hours. Step size (T6). Readout strings (T7). Product class from symbol (SPX/XSP/NDX/RUT → index). **What-if τ years** to OPF PM 16:00 with **1-minute** floor (`MIN_TAU`) — **the floor fix applies wherever What-if τ is evaluated** (Analyzer sheet **and** Surface mesh), not only `localBookCurves`. **Does not** change the OPF settlement instant. |
| `web/lib/options-lab/whatIfVol.ts` | Measured ATM IV from OPF-held generation (V2). Range (V4). `volOffsetPts = scenarioPct − measuredPct` (V5 OD-1 B). Named IV NO when missing. |
| `web/lib/options-lab/whatIfClocks.test.ts` | AT-TM-1/2/4 clock fixtures (fixed `nowMs`). |
| `web/lib/options-lab/whatIfVol.test.ts` | AT-TM-6/7/8 mapping fixtures. |

**Invariants:** No Massive. No `/resolve` schema. No smile-sticky ratio.

**Done:** `npx --yes tsx lib/options-lab/whatIfClocks.test.ts` and `whatIfVol.test.ts` PASS.

---

## 3. W2 — Analyzer Controls

**Touch:**

| File | Change |
|------|--------|
| `web/components/options-lab/AnalyzerControlsColumn.tsx` | Time: `max=remainingHours`, readout T7, ends Now / Last trade. Vol: label Implied vol, slider in %, readout V6, disabled + no number on IV NO. Drop `+Nh` / `+N pts`. |
| `web/components/options-lab/OpfRiskAnalyzer.tsx` | Compute remaining from soonest shown exp + symbol. Compute σ_m from held generation (same gens the graph uses). State: keep Enable; store `simElapsedHours` (0…remaining) and `simIvPct` (absolute). Wire `timeOffsetHours = elapsed` (Enable-gated); `volOffsetPts = simIvPct − measuredPct`. Empty book → disable both. Outlook pin unchanged (T8). |
| `web/lib/options-lab/localBookCurves.ts` | Keep additive `volPts/100`. Bind/apply What-if τ via W1 helper (1-minute floor). Do **not** retarget settlement to 16:15. Do not use `blackScholes.fractionalT`’s 1-hour min on this path. |

**Out:** Inspector chrome remediaiton. VIX→IV. Ratio apply.

**Done:** Create still 20-wide fly (regression e2e). What-if Enable off: measured shown, offset 0.

---

## 4. W3 — Surface What-if HUD (OD-2 A)

**Touch:**

| File | Change |
|------|--------|
| `web/components/options-lab/surface/TimeHud.tsx` | Title **What-if** (not Time machine). Time remaining domain via W1 helpers. Vol = Implied vol % + V6 readout; range from σ_m; still emit `volOffsetPts`. |
| `web/components/options-lab/surface/SurfaceApp.tsx` | **HUD-wire only.** Map HUD σ_s ↔ existing `volOffsetPts`. Time elapsed 0…1 is a fraction of **last-trade remaining**. Mesh What-if τ uses the **W1 1-minute-floor helper** (AT-TM-14), never `fractionalT`’s 1-hour min. Settlement instant stays OPF 16:00. |

**Share one scenario (AZ-TM-3 / PL-A2):** sessionStorage `ft_options_lab_whatif_v1` `{ elapsedHours, volOffsetPts, enabled }`. Distinct from Surface W3-4 `surface_inspect` (profile persist — camera/planes/views). Keep-Warm soft-refresh on return must **not** hide an enabled scenario: if `enabled` is true, B4 override banner stays visible; do not re-zero offsets onto a fresh generation without the banner. Analyzer viewport Surface uses the same key. No extra WebSocket.

**Out:** `persist.ts` · `surface_inspect` · playhead SAMPLE · planes · named views · egg · autofit · Time-machine snap rebind.

**Done:** AT-TM-11. AT-TM-14. HUD copy has no “Time machine” on the What-if block.

---

## 5. W4 — Kilo

Characterization tests (prefer `tsx` next to helpers; e2e only where UI is the contract):

AT-TM-1…14 as spec §7 (13 Analyzer / clocks / vol; **14 Surface last-hour**). Fixture `nowMs` — do not depend on wall clock in CI.

Regression: `e2e/analyzer-create-position.spec.ts`.

**Forbidden:** Changing OPF `/resolve`. Inventing IV in fixtures.

---

## 6. W5 — Lima

Same body of work as W2–W4 land:

- Analyzer Spec v0.2.1 §1.11 rows: Time remaining last-trade; Vol implied % / OPF31 pts wire. Rename section heading to What-if (TM-A1).  
- `Architecture/00-decision-log.md` DL: What-if T/σ; two clocks; OD-1 B / OD-2 A / OD-3 B as Coach stamped.  
- Spec status → BUILD AUTHORITY **only if** Coach already stamped W0-BA; else leave DRAFT and cite this impl plan.

---

## 7. NX (same as review plan)

NX1 τ→16:15 · NX2 ratio wire · NX3 `/resolve` schema · NX4 VIX→IV · NX5 RTH-only · NX6 Heatmap/VP · NX7 Time-machine replay · NX8 inspector rail redo · NX9 extra WS/Massive · NX11 Analyzer residual L.

---

## 8. First smoke (Delta W-G)

1. 0DTE SPX ~10:00 ET: Time max ~6.25 h, not 72.  
2. Vol detent equals listed ATM IV; readout measured · scenario.  
3. +5 scenario pts → each leg IV += 0.05; expiry curve unchanged.  
4. Empty book / IV NO: sliders disabled, no fake 16%.  
5. Surface HUD says What-if; same `volOffsetPts`.  
6. 15:30 ET 0DTE: Time at max still moves T+0 vs 15:00 on **both** Analyzer and Surface What-if (1-minute floor).

---

## 9. Status

| Packet | State |
|--------|--------|
| This impl plan | **Landed · waiting Coach fire** |
| W1 helpers | Not fired |
| W2 Analyzer | Not fired |
| W3 Surface HUD | Not fired |
| W4 Kilo · W5 Lima · W-G | Not fired |
