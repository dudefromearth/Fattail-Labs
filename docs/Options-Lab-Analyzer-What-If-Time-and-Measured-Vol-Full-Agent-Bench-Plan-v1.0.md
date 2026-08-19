# Analyzer What-If Time & Measured Vol — Full Agent Bench Plan v1.0

**Date:** 2026-08-19  
**Plan revision:** **v1.0** (W0 = spec review only)  
**Canonical filename:** `docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-az-what-if-tm/`](../agents/p-az-what-if-tm/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **AZ What-If T/σ Spec v0.1** | [`Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md) | **DRAFT · India fold** — not BUILD AUTHORITY |
| Analyzer Spec v0.2.1 §1.11–1.12 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Parent; What-if knobs |
| OPF Spec v0.2.1 §3.7 · §6.7 | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | OPF29 τ · OPF31 `vol_offset_pts` — **do not re-litigate** |
| Surface App Spec v0.1.8 | [`Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`](../Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md) | What-if τ walk ≠ Time machine replay |
| OT-EF v1.1 | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) | IV NO · listed truth |

**Parents (do not re-litigate):**

| Doc | Role |
|-----|------|
| Market Bus · Arch 28 | One WS/tab · no client Massive |
| OD-PF6 / DL-290 | Server lock/pack/RECON; live sheet is client on held IVs — **do not deepen the split** |
| Analyzer residual board | Layout / Surface 3D first-ship / VP bins stay **there** |
| Human Interface Spec v1.0 | Inspector already shipped; this program does not reopen the rail |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule of a specialist finding is a **DL with reasoning**, not a waived gate.

**Juliet does not invent WHAT.** Coach locked remaining last-trade, measured IV, no invented ±30. India folded TM-B1/B2 into the DRAFT. This plan only **sequences review**.

---

## 0. Why this program exists

Coach (verbatim):

> Fix the What-If controls so that the Time slider has the **correct range** and the Volatility slider actually **simulates measured volatility** not just make shit up.

India (2026-08-19): intent and most law hold. Two **blocks** because they crossed OPF parents. Folded. Remaining work is **spec review → Coach BUILD AUTHORITY**. No Charlie until then (workflow Phase 6).

---

## 1. Mission (W0 only)

```text
DRAFT spec (India fold)
  → Lima hash / parent cites
  → India confirm fold vs OPF29/31 (no rewrite of τ or wire)
  → Echo · Tango · Hotel sequential reviews
  → Delta W0-G
  → Coach Phase 5: dispose OD-1; stamp BUILD AUTHORITY
```

**This plan does not authorize implementation.** W1+ seeds are stubs. Juliet writes the **execution** plan only after W0-BA.

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | Confirm TM-B1/B2 fold. Do not move OPF τ. Do not invent a vol wire. | Echo · Tango · Hotel |
| **W0-G Delta** | Spec + plan + board on disk; **no product code** in this fold | Coach W0-BA |
| **W0-BA Coach** | BUILD AUTHORITY on the spec (dispose OD-1; OD-2/3 defaults as marked) | **Then** Juliet execution plan (not this W0 fire) |
| **No code** | No `web/` / `server/` behavior change until W0-BA **and** a Phase-6 execution plan | Charlie / Kilo |

---

## 3. Locked for this review (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Slider remaining = **last trade** (16:15 index / 16:00 equity). | TM-B1 fold · Spec T2 |
| **FP2** | τ = OPF §3.7 / OPF29 **16:00 PM**. Not this spec. | TM-B1 · OPF29 |
| **FP3** | Vol **wire** = OPF31 additive `vol_offset_pts`. As-built `+Δ/100` is that unit. | TM-B2 |
| **FP4** | What is broken: **range, display, detent** — not the additive formula. | TM-B2 |
| **FP5** | Vocabulary is **What-if**, not Time machine. | TM-A1 · Surface v0.1.8 §4.6 |
| **FP6** | Surface bind is the **What-if HUD** (`TimeHud` frozen-smile walk), not Time-machine snap rebind. | TM-A1 |
| **FP7** | τ_min = **1 minute** (OPF §3.7). | TM-A3 |
| **FP8** | Do not deepen OD-PF6 client/server split. | TM-A4 |

**Coach still disposes (spec §8):**

| OD | Silent if Coach says nothing at W0-BA |
|----|----------------------------------------|
| **OD-1** Vol apply | **B** additive OPF31 (A = ratio, needs OPF delta + DL) |
| **OD-2** Surface HUD vol | **A** same scalar this packet |
| **OD-3** last trade vs τ | **B** two clocks (A blocked without OPF amend) |

---

## 4. W0 DAG

```text
W0-0 Coach plan stamp
  → W0-1 Lima hash
  → W0-2 India parents / fold confirm
       ├── W0-3 Echo (inspector copy / TimeHud label)
       ├── W0-4 Tango (cognitive load of % vs pts)
       └── W0-5 Hotel (would a wrong τ/vol story make a member worse?)
  → W0-G Delta
  → W0-BA Coach BUILD AUTHORITY
```

W0-3 · W0-4 · W0-5 may run **in parallel** after W0-2 APPROVED.  
India already folded TM-B1/B2 in the DRAFT; W0-2 is **confirm**, not a second rewrite.

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

**After W0-BA / Coach fire:** implementation plan  
[`docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md`](./Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md)  
(W1 helpers → W2 Analyzer ∥ W3 Surface HUD → W4 Kilo · W5 Lima → W-G).

---

## 6. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | Move OPF τ to 16:15 (needs OPF v0.2.x + DL) |
| **NX2** | Smile-sticky **ratio** wire (`vol_scale` / `scenario_atm_iv`) unless Coach picks OD-1 A **and** files OPF delta |
| **NX3** | Server `/resolve` schema change in W0 |
| **NX4** | Bind Marks VIX to IV |
| **NX5** | RTH-only theta |
| **NX6** | Heatmap / VP / GEX what-if |
| **NX7** | Surface **Time machine** snap rebind |
| **NX8** | Reopen Analyzer inspector width / HIG rail |
| **NX9** | MSC pricing · extra WebSocket · client Massive |
| **NX10** | Charlie / product code before W0-BA |
| **NX11** | Analyzer residual L / Surface first-ship residual |

---

## 7. Review verdict shape (every W0-2…5)

Per `spec-create-review-workflow.md`:

- Up front if Coach content changed  
- Bench delta  
- Coach content intact?  
- Blocks (invariant / law / system only)  
- Opinions labeled  
- Flagged ideas table (or none)  
- Build disposition: APPROVED \| RETURNED  

Hotel blocks only if a wrong Time/Vol story would make a member **worse**. Echo/Tango RETURN chrome/copy; they do not delete Coach remaining-last-trade or measured-IV.

---

## 8. First smoke (after execution — not W0)

Recorded so Coach sees the destination. **Not** this board’s fire.

1. 0DTE SPX 10:00 ET: Time max ~6.25 h (16:15 last trade), not 72. τ still 16:00.  
2. Vol detent = listed ATM IV; readout `σ_m% measured · σ_s% scenario`.  
3. `vol_offset_pts = σ_s − σ_m`; expiry curve unchanged.  
4. IV NO when ATM IV missing.  
5. Analyzer and Surface What-if HUD share the same scalar (if OD-2 A).  
6. 0DTE 15:30: T+0 still moves vs 15:00 on **both** machines (1-minute floor).

---

## 9. Status

| Packet | State |
|--------|--------|
| Spec v0.1 India fold | **On disk · DRAFT** |
| This plan + board | **Land for Coach W0-0 stamp** |
| W0-1 … W0-BA | **Not fired** |
| W1+ implementation | Plan on disk · **not fired** until W0-BA **or** impl stamp **+ DL naming bypassed W0 packets** |

**Next:** W0-0 → … → W0-BA, then fire W1. Stamping the impl plan **before** W0-BA is Coach authority only with a **DL that names which W0 packets are bypassed and why** (not a silent waived gate).
