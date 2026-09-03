# AZ-ALGO v2.3 — Spec Review

**Date:** 2026-09-03
**Reviewer:** Grok (India / Hotel / Tango seats on the five named seams)
**Artifact:** [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.md)
**sha1:** `1e429a103d34f48ca72efec146bb7c5be017f899`
**Status:** Review for Coach — not BUILD AUTHORITY, not a gate stamp
**Verdict:** **RETURN**

This is a **model change** (E25–E31), not an errata pass. BUILD AUTHORITY on v2.2.2 is suspended by this file. The AZALGO-W0 GO of 2026-09-03 authorised a different model. P1–P4 are not covered.

Coach (2026-09-03):

> the decreasing trail represents the risk of staying in the trade for potential future value growth, vs exiting with current value

> hold or fold is evaluated every tick while in the trail

E1–E24 are settled. This review does not re-litigate them. E5 and E8, which are settled, are used as constraints on v2.3’s posture.

---

## Executive verdict

| Seat | Verdict |
|------|---------|
| **India** | **RETURN.** Not BUILD. Two combination steps and one false derivation mean two products. AZALGO-W0 does not cover this file. |
| **Hotel** | Block the derivation sentence (false teaching). Block E26’s “the move is available” (false teaching). Do not block E26 itself. |
| **Tango** | A watched line the member cannot knob, that can creep silently, that can fold them for a wick they never held, is not a bleeding-trader surface. Fix seams 1, 3, and 4 before anyone paints it. |

The five seams Coach named are real. Seam 1 is a system break. An implementer cannot build §9.4.3 as written without choosing a product Coach has not chosen.

---

## Scope

Review these first, hardest:

1. §9.4.3 states two conditions and presents them as one derivation.
2. `p` as a fitted constant on an unvalidated model. §14 has never run.
3. The guide is unratcheted and may retreat. E28 requires the surface to name why within one tick.
4. Headroom off `H`, not `U` (E26). Does a brief peak justify the same hold terms as one the trade has held?
5. Appendix B fixtures 20 and 21 — is that pair sufficient to prove the model?

Out of scope: re-opening E1–E24; implementation; re-stamping AZALGO-W0.

---

## 1. Two conditions, one derivation — the weakest seam

The split is right. They are not the same statement, and the derivation paragraph is false.

**Regime test** (§9.4.3):

```
hold while p × headroom > at_risk
```

No `U` in it. `headroom` is off `H`. `at_risk` is `PaR`. This can flip while price sits still. That is Coach’s “evaluated every tick” and “take it, this is the best we’ll get.”

**Level:**

```
guide_level = H − (p × headroom)
```

No `PaR` in it. This is a giveback budget from the peak: fold when `U` crosses `H − p × headroom`, i.e. when `giveback ≥ p × headroom`.

The derivation claims the level is “the P&L at which the inequality flips.” An inequality that does not contain `U` has no P&L indifference point. Projecting `p × headroom = at_risk` onto `H − p × headroom` treats `at_risk` as if it were giveback. It is not. `PaR` is a local quadratic in greeks and `move_unit`. Giveback is `H − U`. Those are different dollars.

**Both belong. They do different jobs. Do not pick one.**

- Drop the boolean and keep only the line: a trade sitting at the ceiling (`H = ceiling`, `U = H`, `headroom = 0`) never folds. The line is at `H`; `U` has not crossed it. Coach’s first case does not fire until the first tick of giveback. That is a hole.
- Drop the line and keep only the boolean: there is no trailing vertical. Coach’s original object is a decreasing trail, two dashed lines, overlay, invert to `x_S`. A boolean is not a trail. §11 still says fold when “spot / P&L exits the guide.”
- Keep both, written as one derivation: two implementers, two products. One fires fold from `p × headroom ≤ PaR` with `U` still above the line. The other waits for the line. Members on two machines see two guides from the same book — the E5 failure mode, again.

§11 already has two fold paths in prose (“exits the guide” **or** “GEX justifies folding ahead, as a named tape event”) and never binds the second path to the boolean. That is the same seam, unclosed.

**Required — two clauses, two ATs:**

| Clause | Job | Fires when | AT |
|---|---|---|---|
| **A. Regime** | “Take it, this is the best we’ll get” | `p × headroom ≤ at_risk`, **regardless of `U` vs the line** | New AT: `U` still above `guide_level`, boolean folds, tape names `fold: regime` |
| **B. Level** | Trailing line | `U ≤ H − (p × headroom)` (after the E23 floor) | New AT: boolean still holds, `U` crosses the line, tape names `fold: guide` |

Delete the derivation sentence. Say they share `p` and `headroom` and are not projections of each other. Fold is **A or B**. Payload records which clause fired.

Fixture 20 must be an **A** (spot unchanged, `U` above the line, boolean folds). A “line rises toward `U`” story is **B**, and is also imprecise: `guide_level` rises toward **`H`**, not toward `U`. It meets `U` only when the member is still near the peak.

`giveback` is defined in §9.4.3, HUD’d by E31, and unused in the math. Clause B is where it belongs: `giveback < p × headroom`. Write that, so the HUD row is a term in the model, not a subtraction the member still has to do in their head.

Until those two clauses exist, P1–P4 cannot be covered. `algoHoldFold.ts` does not know what it owns.

---

## 2. `p = 0.35` on an unvalidated model

**Worse than the clock if it becomes the guide they watch. Better than the clock as a labelled second line that §14 has to beat.** The spec currently writes the first and assumes the second.

The clock is honest about being a schedule. The member set the knobs. Capacity is on their side of the glass.

`P_BASE = 0.35` is a house-chosen scale on a quantity named as a probability. Tango correctly forbids printing “62% chance” (AT-ALGO-36). That does not save the line. The line moves fold timing. A guessed probability that the member cannot see and cannot knob is a silent forecast.

Shape versus scale:

- The **shape** (give-up budget is a fraction of remaining headroom, not of `H`) is the model change. At `H = 80%` of ceiling the new line is much tighter than 75%-of-`H`. At `H = 30%` it is wider. That is E26 doing real work. Fixture 19 is the right test of shape.
- The **scale** `0.35` is unargued. Why not `0.2` or `0.5`? No noon-40% calibration, no regime table, no “this matches the remembered day-shape on a typical fly.” OD-ALGO-7 admits starting points; the body of §9.4.3 calls this “the guide.”

§14’s primary criterion is the top band. Too-low `p` tightens (`guide = H − p × headroom` rises) and cuts runners. Too-high `p` holds dying trades. Either failure is exactly the bar that has never run. The clock can also fail that bar — and §14 was always required — but the clock’s error is bounded by member knobs. `p`’s error is not.

E8 is settled and still in force: nothing is “primary” until §14. v2.3 contradicts it in posture. E25 retires `H − k × PaR`. AT-ALGO-38 greps `k` to zero. The proposed line is full weight; legacy is muted; knobs still move only the muted line. A bleeding member watches the line they cannot set.

**Required:** keep E8’s posture in the v2.3 header. `p` is a starting constant (OD-ALGO-7). The clock remains the member-facing law until §14. Fit `p` per vol regime, not `k` (§14.5 is stale). Do not rebuild P1–P4 as if the guessed coefficient were the product.

**Opinion, not a block:** a member-visible *proposed* second line with `0.35` is the same bet `k_base = 1.5` was, and that bet was accepted. What is new — and worse — is naming it a probability, retiring the old combination step, and weighting the unvalidated line as the one they look at.

---

## 3. Unratcheted guide — “named within one tick” is not enough

E27 is right to take the ratchet off the guide. A monotone line cannot say “GEX says staying is okay.” That is Coach §0.2.12. Do not put the ratchet back.

E28 as written is not sufficient protection.

Under `guide_level = H − p × headroom`, with `H` only rising, the guide loosens **only when `p` rises**. Retreat is “we got more optimistic.” That is exactly the read that destroys trust: the stop ran away because the machine cheered up.

Three holes in “named within one tick”:

1. **Threshold loophole.** AT-ALGO-35 fires only above `LOOSEN_NARRATE_PCT` (2% of `H`) **per tick**. A guide that creeps 1.9% of `H` per tick never names. Silent retreat is still a defect; the AT does not catch it. Accumulate, then name.
2. **Feed is off by default.** §9.6: overlay off, Feed off until Reason is checked. “Named” then means a HUD direction marker with the cause **on hover**. A 0DTE trader watching a fly is not hovering. Name on the canvas, persistent while the widen holds.
3. **Name is an explanation of a fait accompli.** The line has already moved. No confirmation, no delay.

**Required, not optional:**

- Sub-threshold moves accumulate; the sum names. Silent creep is a defect even when no single tick clears 2%.
- The cause is on-canvas, not hover-only, and it does not depend on Reason.
- **Asymmetric hysteresis (Hotel):** tightening is immediate. Widening waits `REENTRY_BARS` (already in Appendix A for override). One-tick GEX blips do not run the line away. E20 already taught this lesson on the fold loop; the same loop exists on breathe.

**Opinion:** a cap on widen per unit time is extra. Persistence plus on-canvas name is the minimum. Naming without those two is a labelled shrug.

---

## 4. Headroom off `H`, not `U`

Keep E26. Coach said *achieved*, not *held*. Do not switch headroom to `U`.

The why-column overclaims. A wick to 80% of ceiling proves the **package can be marked there**. It does not prove “the move is available” as a path that will return. Those are different teachings. Hotel blocks the second.

`H` is sticky. A one-tick print permanently shrinks `headroom` for the rest of the session.

- **Clause B (the line):** after the wick, `U` has already dropped. The now-tight line is often already through. A wick becomes a fold. That can be the right “you got the gift, take it” — but only if the spec owns it.
- **Clause A (the boolean):** after the wick, `headroom` stays small even if `U` is back at 40%. Regime can keep saying fold for the rest of the day because of a print the member never held. That is the trust problem.

Fixture 19 (`H` at 80% vs 30%, everything else equal) does not distinguish a held peak from a wick. It will pass either way.

**Required:** a wick fixture (25). Same fly. (i) `H` printed 80% of ceiling for one tick, `U` now 40%. (ii) `H` held at 80% with `U` at 75%. Record both verdicts, both clauses, and a sentence that says whether the wick-fold is intended. Rewrite E26’s why: *achieved*, not *available*.

**Opinion:** a persist-N-bars `H` for headroom only is a modelling program (same family as OD-ALGO-6’s soft ceiling). Do not smuggle it in. Name the wick, then Coach decides.

---

## 5. Fixtures 20 and 21 are not enough — and they contradict themselves

AT-ALGO-37 and the pair paragraph: one fly, one `H`, one spot, differing only in `p`, opposite verdicts.

Fixture 21’s row: “Spot dips to where the v2.2.2 line would have fired.”

Those cannot both be true. If they share a spot, 21 cannot be a dip. If 21 is a dip, they do not isolate `p`.

As AT-ALGO-37 is written, the pair proves **`p` is in the verdict**. That is necessary and weak. Wrong models pass it:

- Fold iff `p < 0.4`. Pick `0.2` and `0.6`.
- Implement **only** the line. Two `p` values put `guide_level` above and below a fixed `U`.
- Implement **only** the boolean. Two `p` values flip `p × headroom ? PaR`.
- Invert the inequality and still pick two `p`s that disagree.

None of those tests `PaR`, `headroom`, which clause fired, or the v2.2.2 counterfactual. “Same verdict is a finding, not a golden to adjust” is the right posture for a broken pair. It does not make a weak pair a proof.

**Required goldens, handwritten, before code:**

| Fixture | Isolates | Must show |
|---|---|---|
| **20** | `p` down, spot and `U` fixed, `U` **above** the new line | Clause **A** fires. Tape `fold: regime`. This is the pair’s actual proof that the boolean is not the line |
| **21** | `p` high, **spot dips** through where `H − k × PaR` would have folded; `U` still above `H − p × headroom`; boolean still holds | Clause A holds, clause B does not fire. This is the breathe case. It is **not** the same-spot twin of 20 |
| **21b** (new) | Same fly / `H` / spot as 20, only `p` differs | Opposite **clause-A** verdicts. This is AT-ALGO-37, repaired so it cannot be satisfied by the line alone |
| **26** (new) | `p × headroom > PaR`, `U` crosses the line | Clause **B** fires, A still holds. Tape `fold: guide`. Without this, the line is untested as a fold path |
| **19** | `H` not `U` | Already specified; keep |
| **25** | Wick vs held `H` | Seam 4 |

Hotel constructs inputs. If 20 cannot be built with `U` still above the line while the boolean folds, that is a finding against the spec — the two clauses were never independent on real numbers. Stop. Do not nudge `p`.

---

## Related integrity (not E1–E24, blocks BUILD)

v2.3 left the retired combination step in force in the same file. Two combination steps means two products.

- §9.4.2 still laws `proposed_raw = H − k × profit_at_risk` (lines 896–900).
- AT-ALGO-6 still requires proposed `H − k×PaR`. AT-ALGO-38 greps `ALGO_K_` to zero.
- Appendix A lists `LABS_ALGO_K_*` then says they are retired, then appends `FLOOR_REMAINING_H` after the retirement sentence (table is broken).
- §14.5 still says “Fit `k`.” §0.3 seating still says proposed line = profit-at-risk + `k`. Ideas inventory still has `H − k × PaR` IN-SCOPE.
- §18 BUILD gate is still v2.2.2’s (fixtures 17–18, OD-ALGO-1). Header correctly waits on 19–24, re-recorded 1–18, and a re-stamp. §18 wins if someone reads the files table.
- Appendix C claims E1–E31 and stops at E24.
- Dimensional table still lists `k` and `trail_level`; it does not list `p`, `headroom`, `ceiling`, `giveback`, `guide_level`.
- E1’s `trail_level < H` fails when `headroom = 0` (`guide = H`). State the equality case.

These are incomplete-edit defects. They make seam 1 unimplementable even after the two clauses are written, because §9.4.2 will still ship the old line.

---

## What survives

Coach’s comparison needs both sides. `PaR` as adverse-move loss (E1) stays as `at_risk`. Headroom off the peak (E26) stays, with the wick named. The guide breathes (E27); ratchet stays on legacy. `k`’s factors belong on `p`, not on `PaR` (E29). `E(t)` as the market’s quote of remaining movement (E30) is the right reason to finally measure it. Given back on the HUD (E31) stays. E8 stays: proposed, both lines, §14 is the only promotion.

What does not survive: one derivation, a guessed `p` treated as the product, “named within one tick” as the only protection on a retreating line, “the move is available” as the defence of `H`, and fixtures 20/21 as a proof of the model.

---

## Required before any re-stamp

1. Two clauses in §9.4.3, two ATs, payload records which fired. Derivation sentence gone.
2. E8 posture in the v2.3 header. `p` is a starting constant. Clock remains member-facing law until §14. Fit `p`, not `k`.
3. Accumulate-then-name; on-canvas cause; asymmetric hysteresis on widen.
4. Wick fixture 25. E26 why rewritten: *achieved*, not *available*.
5. Goldens 20 / 21 / 21b / 26 as specified above. Hotel constructs; a row that cannot be built is a finding against the spec.
6. Retired `H − k × PaR` removed from §9.4.2, AT-ALGO-6, §0.3, §14.5, ideas inventory, Appendix A table, §18 BUILD gate. Appendix C lists E25–E31. Dimensional table names the new quantities. `trail_level < H` states the `headroom = 0` equality case.

P1–P4 do not fire on this file until Coach re-stamps.

---

## Bench delta

The next invocation knows: v2.3’s inequality and its trailing line are two jobs, not one derivation; `p = 0.35` is a scale not a finding; E28 as written does not close silent retreat; E26 must own the wick; fixtures 20/21 as AT-ALGO-37 wrote them prove only that `p` is in the verdict.
