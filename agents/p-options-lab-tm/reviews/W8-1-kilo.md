# W8-1 Kilo — Time Machine acceptance table

**Agent:** Kilo  
**Date:** 2026-08-28  
**Law:** spec §10 · plan §5 · v0.7.4  
**Never waive.** HOLD is explicit. Nothing gated on Basic, TPO, or 1×.

Evidence: existing e2e (`tm-w1`…`tm-w7`), unit tests, `e2e/tm-w8-c11-bytes.spec.ts`.

---

## HOLD (not fail, not waived)

| ID | Why held |
|----|----------|
| **AT-TM-C6** | Basic out of this GO (§12.15). Do not gate. |
| **AT-ATM-7 · AT-ATM-8** | Basic / Enhanced chrome. NX-B. |
| **AT-ATM-9 Basic clause · AT-ATM-19 Basic clause** | Held with C6. Watermark/rehearsal clauses of those ATs **are** gated below. |
| **AT-ATM-15** | 390 one-minute candles. Past-day walk is StudioOne chain (A1). 1-min retired. |
| **AT-ATM-17** | TPO path. NX-TPO. |
| **AT-TMI-3 · 4 · 5 · 7 (date-less strip) · 11 · 12 · 17 NO FILM · 21 · 23 · 24–32 Instant Replay recorder/film** | Instant Replay product name / Record / server film / green glow. Folded: capture always on, no Record, no TM glow, date always present. **HELD** as Instant Replay rows, not failed. |
| **1× speed rows** | NX-1X. Speeds are 10 / 20 / 50. |

---

## AT-TM-C (this GO)

| ID | Verdict | Evidence |
|----|---------|----------|
| **C1** | **PASS** | Date present, today on Analyzer/Heatmap/Surface. `tm-w4-today.spec.ts`, `tm-w6-hosts.spec.ts`. |
| **C2** | **PASS** | Past date: no confirm banner. Watermark already on before date change (replay, not which date). `tm-w5-archive.spec.ts`. |
| **C3** | **PASS** | Sticky `t_ms` Analyzer → Heatmap → Surface SPA. `tm-w6-hosts.spec.ts`. |
| **C4** | **PASS** | Uncovered date grey + **NO PATH**; no 1-min fallback. Surface IV from chain at *t* (`marksFromChain`). `tm-w5-archive.spec.ts`, `tmChainAtT.test.ts`. |
| **C5** | **PASS** | Today parks newest (`enterTodayReplay`). Past parks session-open (`sessionOpenCursor` RTH). `tmSlots.test.ts`, W4/W5. |
| **C6** | **HOLD** | Basic. Not a fail. |
| **C7** | **PASS** | Reset: watermark gone, HUD gone, rehearsal announced. `tm-w4-today.spec.ts`, `tm-w7-rehearsal.spec.ts`. |
| **C8** | **PASS** | No `server/` film module. Switch discards first. Today continues. After second past day, one `archiveDay`. `tmSlots.test.ts`, `tm-w5-archive.spec.ts`, `tm-w8-c11-bytes.spec.ts`. |
| **C9** | **PASS** | No Record control. Raising playhead uses held cache. `tm-w4-today.spec.ts`. |
| **C10** | **PASS** | Badge, no store, announced disposal. `tm-w7-rehearsal.spec.ts`, `rehearsal.test.ts`. |
| **C11** | **PASS (recorded)** | Native 390-tick session: occupancy digest 3,905 B, today gens JSON **52,853 B**, heap **157 MB**; + archive 2026-08-26 coarse 82 gens: digest 3,917 B, archive gens JSON **12,253 B**, heap **157 MB**. Infill not waited. Decay **not shipped this GO** — native only; **ladder not frozen**. No ceiling named. `evidence/w8-c11-resident-bytes.json`. |

---

## AT-ATM-1…20 as they apply (without Basic / TPO / 1×)

| ID | Applied as | Verdict | Evidence |
|----|------------|---------|----------|
| **1** | Date picker; past day = StudioOne (not 1-min) | **PASS** | W5 |
| **2** | Mini line fills from coarse-then-infill (not L→R prefix) | **PASS** | W5 HUD |
| **3** | Play / Pause / Stop + 10/20/50 in the dark strip; no start-time picker | **PASS** | W1/W4 |
| **4** | Strikes/in left of Autofit | **PASS** | W1 |
| **5** | 10×: wall-second → ten session-seconds | **PASS** | `replayCursor` |
| **6** | Scrubber seeks; clock matches sample | **PASS** | HUD |
| **7–8** | Basic / Enhanced | **HOLD** | NX-B |
| **9** | Watermark, no TM glow, What-if red only | **PASS** (Basic clause **HOLD**) | W3 |
| **10** | What-if sliders remain; not labeled Time Machine | **PASS** | Analyzer What-if |
| **11** | Uncovered → NO PATH | **PASS** | W5 |
| **12** | Demo / rehearsal ticks playhead spot + `t_ms` | **PASS** | W7 |
| **13** | No client Massive | **PASS** | `tmChainAtT.test.ts` |
| **14** | Autofit not on every playhead tick | **PASS** | Analyzer autofit on open-spot only |
| **15** | 1-minute 390 bars | **HOLD** | A1 chain walk |
| **16** | Spot walks generation to generation | **PASS** | W5 |
| **17** | TPO | **HOLD** | NX-TPO |
| **18** | Past day binds spot/scale to session open | **PASS** | `sessionOpenCursor` |
| **19** | Empty book; add after; alert is rehearsal | **PASS** (Basic clause **HOLD**) | W7 |
| **20** | Reset exits; Stop does not | **PASS** | W4 |

---

## AT-TMI-1…34 as they apply

Rows that named Instant Replay film, Record, green glow, date-less strip, or exclusive Day/IR: **HOLD** (product folded; not failed).

Rows that still apply:

| ID | Applied as | Verdict |
|----|------------|---------|
| **AT-TMI-2 / 4 (templates)** | Templates stay pure; host selects generation then `run()` | **PASS** · W6 |
| **6** | Playhead domain is first–last held samples | **PASS** |
| **8 / 9** | Reset → live, today cache remains; capture always on | **PASS** · W4/W5 |
| **10** | `replayCursor` 10× | **PASS** |
| **13** (amended) | **NO PATH**; Width Fit Live \| Average \| Replay | **PASS** · W5/W6 |
| **14** | Template switch while replay stays in replay | **PASS** · W6 |
| **15–16** | Sticky playhead; Surface IV at *t* | **PASS** · W6 |
| **18** | Missing listed leg → named state | **PASS** · OT-EF |
| **19** | Symbol change discards previous today (TMI-73) | **PASS** · `tmSlots.test.ts` |
| **22** | No client Massive | **PASS** |
| **24–32** recorder / film / IR exclusive | **HOLD** | capture always on; no server film |

---

## C11 numbers

Filed at `evidence/w8-c11-resident-bytes.json`.

| Snapshot | today gens | archive | occupancy digest | gens JSON | heap |
|----------|------------|---------|------------------|-----------|------|
| Native 390-tick | 390 | 0 | 3,905 B | 52,853 B | 157 MB |
| + 2026-08-26 coarse | 390 | 82 | 3,917 B | 52,853 + 12,253 B | 157 MB |
| Switch → 2026-08-17 | 390 | one `archiveDay` | — | — | — |

Decay not in tree this GO — recorded, ladder **not** frozen. 10–20 MB remains transfer. Coarse 82 is not full-fidelity; do not freeze the ladder on it.

## C8 memory vs days visited

Occupancy after Tuesday then Monday: one `archiveDay`. Today count did not drop. JSON occupancy does not hold two past days.

---

## KEEP extras (Coach, after W7-G)

| Extra | Verdict | Evidence |
|-------|---------|----------|
| Durable live algos skip while playhead is up | **PASS (KEEP)** | `else if (tmActive) { return a; }` in `OpfRiskAnalyzer.tsx`; `rehearsal.test.ts` |
| To Trade Log hidden **and** refused | **PASS (KEEP)** | hide `!pos.rehearsal`; refuse `if (pos.rehearsal) return;` + notice |

Not this-GO gates. Characterized so they cannot vanish in a later round.

---

**Kilo: no row waived.** HOLD C6 (and NX-B / NX-TPO / NX-1X / Instant Replay film rows) named. Delta W8-G.
