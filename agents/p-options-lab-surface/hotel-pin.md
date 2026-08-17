# Hotel pin — Options Lab 3D Surface

**Agent:** Hotel  
**Date:** 2026-08-16  
**Status:** PIN · deliberation. **Not GO.** No code.  
**Law read:** App Spec v0.1.8 · Tech Spec v0.1 · OT-EF v1.1 Law B/C · OPF §3.7 / OPF29 · Method v0.2.2 §2 / §5.1 · DL-409…413

Hotel pins trading truth. Opinions are labeled. Blocks only if a member
who believed a wrong version would be worse with capital at risk.

---

## Pins (load-bearing)

1. **The number on the tent is a mark path, or it is a named hole.**
   Bind `iv_source ∈ {exact, locked}` on every listed leg. Missing /
   inferred (nearest, ATM, VIX, 0.20, `sticky_cli`) → **IV NO**. A tent
   that always paints through 15:59 on 0DTE is lying.

2. **Last-minute 0DTE is first-class.** Cite OPF Spec v0.2.1 §3.7 /
   OPF29 AT-L0-τ1/τ4. Surface does not invent τ. After that product’s
   settlement instant the sheet is **held / residual, never live**.
   Card **EXPIRED** (midnight ET) does not stop the last-minute mark
   path. Applies to the Batman once the 3 DTE walk is 0DTE (App Spec
   §4.6a).

3. **Keep vendor near-zero ITM IV** in (0, 0.01] when exact/locked.
   That is “no extrinsic,” not a missing mark. Do not upgrade it to ATM.

4. **Time machine ≠ What-if.** Time machine rebinds \(S(t),\tau(t),\sigma_i(t)\)
   from the snap at \(t\). A frozen-smile τ walk is theoretical decay.
   Calling it last-minute truth is a Hotel **block**.

5. **Friday 2026-08-14 is not gold.** First tape / harness day, **5-min
   chain**, labeled. Gold minute = Mon 2026-08-17+ at 3–5s (DL-400).
   A 5-minute snap must not wear a last-minute badge.

6. **The sheet is not the fill factory.** Fill = atomic package mark /
   NBBO (Method §5.1). Hold/fold and P&L path = this sheet. When the
   Backtest bench plan seeds, Method §5 item 2 (“reprices from the
   surface”) gets one clause: reprice the **attempt** from the snap’s
   package NBBO/mark. Do not amend Method in this program.

7. **Mini graphic is the day walking, never the result.** Label
   **day walking · n of N**. No P&L hero number. The result is the
   **distribution** and lands after. Same tape across MC runs.

8. **Flat σ / silver** may not write PackagePricer, the card debit, or
   time-machine \(\sigma_i(t)\). S4: not v0.1.

---

## Not a pin (opinion, labeled)

- Preview tab staying beside the full Surface app is chrome (S2), not
  a second pricer, if it binds the same exact/locked legs.
- Reduced grid/DPR on the mini graphic is honest **if** it still fails
  loud on IV NO. A pretty tent that fills holes is a block.

---

## Block list (if a seed violates)

- Invented smile · neighbor fill · VIX as unmarked σ · 1-hour τ flatten  
- 16:01 drawn live · Friday badged last-minute gold  
- Mini graphic wearing a package P&L as “the backtest result”  
- `evaluatePnlAtSpot` presented as the card debit  

**Verdict:** PIN. Deliberation may proceed to Echo labels and Juliet’s
plan. **Not GO.**
