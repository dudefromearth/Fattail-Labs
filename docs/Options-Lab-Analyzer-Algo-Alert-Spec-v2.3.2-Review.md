# AZ-ALGO v2.3.2 — Spec Review

**Date:** 2026-09-04  
**Reviewer:** Grok (India / Hotel / Tango)  
**Artifact:** [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.2.md)  
**Commit:** `fe78d83`  
**sha1:** `aa6cc7c813b68c1e3128c54ad4e902a96a4c2183` (recomputed this pass)  
**Status:** Review for Coach — not BUILD AUTHORITY, not a gate stamp  
**Verdict:** **RETURN**

v2.3.2 answers the v2.3.1 RETURN. The arithmetic claims check out, with one printed PaR that does not. The three things that went further than asked are real. Two of them are right. The third ships a warning that cannot fire on the modal A-only trade.

E1–E36 stand. This pass does not re-litigate them.

---

## Up front

Nothing of Coach’s was changed or dropped in this pass. Objections sit beside.

---

## Executive verdict

| Seat | Verdict |
|------|---------|
| **India** | **RETURN.** Not BUILD. The model is now *almost* specifiable. Horizon is a key; `guide_raw < 0` is a state; `m_adv` is signed; `p` is exogenous until the maps exist. Incomplete seating: §14.5 still says “Fit `p`”; AT-ALGO-17 still lists Trail / fourth-row OD-ALGO-1; fixture 20 prints PaR $204 against greeks that yield $244. |
| **Hotel** | Accept E37’s joint calibration and a **constant** horizon. Accept E38: A-only early Managing is the arithmetic, not a defect. **Do not accept** `REGIME_NEAR_PCT × H` as enough warning. Block the leftover short-form `guide widened · high-water` (E42 struck the long form and left the copy-from-here block wrong). |
| **Tango** | Two states can work. This threshold does not. Budget is the right *quantity* and the wrong *authority* until Tango freezes it as proposed telemetry, and it must not paint while clause B is silent. |

---

## Confirmed (do not reopen)

Every arithmetic claim in the brief checks out except the printed PaR on row 20.

| Claim | Check |
|---|---|
| `guide_raw < 0` is modal at the gate | 30-wide $300 debit, `p=0.35`: gate `H=$225`, `guide_raw=−$641`. Paint needs `H ≥ p·ceiling/(1+p) ≈ 26% of ceiling ≈ 2.3× debit`. Gate is 0.75× debit. |
| AT-ALGO-46 ten-tick “exactly one” fails correct accum-and-reset | Five ticks at `T/5` narrate on tick 5 and reset; ticks 6–10 narrate on tick 10. Two narrations. E42’s rewrite is the correct test. |
| `high-water advanced → widened` is impossible | `∂guide_raw/∂H = 1+p > 0`. Rising `H` tightens. Long-form example struck. |
| Unsigned `m_adv` zeros wing PaR | Fixture 3 with `Δ>0` and unsigned `+m` makes `Δ·m` favourable; `PaR=0` on the wing; E1 pair dies. Hotel’s landed goldens already signed. E39 licenses them. |
| Mid-`H` 20/21/21b fire each clause independently | Relations hold. See the PaR typo below. |
| 1 min vs 20 min vs `P_BASE=7.0` | Apex `Γ=−$28/pt²`, 1-min move 3 pt → PaR $126; 20-min → $2520. Ratio 20. Preserving the A boundary needs `p` ×20 → `P_BASE=7.0`, illegal as a probability. Horizon cannot be absorbed into `p`. |

**Row 20 PaR is $244, not $204.** Stated greeks: `Δ=$5/pt`, `Γ=−$28/pt²`, `m_adv=−4`.

```
pnl = 5×(−4) + ½(−28)×16 = −20 − 224 = −244  →  PaR = $244
```

$204 is `½|Γ|m² − |Δ|m` — delta treated as an offset, which is the unsigned mistake E39 just closed. The **relations survive** (`$50 < $178 ≤ $244`; 21 still HOLDs). The printed number does not. Hotel writes $244, or changes `Δ`. Do not leave a reference construction that disagrees with its own greeks.

21b’s worked line `40×(−4) + ½(4)(16) = −128` is signed and correct.

---

## 1. E37 — horizon and `P_BASE` are one calibration

**Accept the claim. Horizon cannot be disposed independently.** `PaR` is quadratic in the move, `p` is linear. A 1-minute reading makes A decorative (needs `H` > 93% of this ceiling). A 20-minute reading makes A always-true (needs headroom > $3,847 on a $2,700 ceiling). `P_BASE=7.0` is not a probability. Naming `MOVE_HORIZON_MIN` as a separate key, fitted jointly with `P_BASE` at §14.5, is the law.

**The default 3 is a legitimate starting constant. The band used to pick it is not “the” band.**

The ≈1.3–5.6 min window is the set of horizons for which `p* = PaR / headroom` lands in `[0.157, 0.655]` at **this** apex `Γ=−$28/pt²` and **`H=60%` of this ceiling** (`headroom=$1,080`). The spec says “at these greeks.” It does not say `H=60%`. Both condition.

| `|Γ|` | Band at `H=60%` of this fly | What default 3 does |
|---|---|---|
| 14 (wing-ish) | 2.7–11.2 min | A is live |
| **28 (stated)** | **1.3–5.6 min** | A is live at 60%; **always-fires at 80%** |
| 56 (more short-gamma) | 0.67–2.8 min | **A always fires at 3 min** |

So: a single-Γ, single-H slice is a legitimate **E8 starting point**. It is not a finding that “3 is the horizon.” At 80% of ceiling even this Γ already puts 3 min in always-fire. That is the top-band risk §14 exists to catch.

**Do not make the horizon a Γ-conditional function.** `PaR` already carries `Γ` quadratically. Folding `Γ` into the horizon double-counts convexity and changes the question from “how long am I holding for” to “how convex am I.” Apex alertness is already in E1. Flag that modelling program; do not smuggle it. **FI-048.**

**Required before BUILD (not a model change):**

1. Name the slice: band is at `Γ=−$28/pt²`, `H=60%`, this 30-wide fly. Not “the band.”
2. §14.5 fits **`(HORIZON_MIN, P_BASE)` jointly**, and reports the pair **separately at apex and at wing**, and at 40 / 60 / 80% of ceiling. A pair that cannot serve both is a finding against a constant horizon — then Coach disposes. Header E8 / OD-ALGO-7 still say “fit `p`.” That seating is stale under E37.
3. Keep horizon a **constant key**. AT-ALGO-52 stays.

---

## 2. E38 — early Managing is clause-A-only

**Accept. Do not add a machine state.**

While `guide_raw < 0`:

```
p × headroom = H − guide_raw = H + |guide_raw| > H ≥ giveback
```

Clause B is **structurally false**, not merely unpaintable. `giveback ≈ 0` at the high-water is never `≥` a positive budget. The only live question is A: *is this still worth holding at all.* That is Coach’s regime case, which a price-level trail could never express. Rendering it as a line was the defect. `guide: below zero` / WAITING / no invert / no $0 clamp is the right object. Fixture 27 / AT-ALGO-49 hold.

A third state-machine value (`managing_regime_only`) would split Managing for something the chrome already names. Managing is who-acts. Whether B can fire is a property of the numbers.

**What it does require, and does not yet have:** the A-only stretch must be *visible as A-only*. That is E41’s job on the modal trade, and E41 as written fails there (next section). Also: **Budget must not paint a clause-B dollar while B is silent** (HUD section). Those are surface requirements on a correct model, not a new state.

---

## 3. E41 — two states, one threshold, AZALGO-REGIME

**Two states are enough. This threshold is not. Keep the phase.**

Dropping “comfortable / narrowing / at the fold” for **clear / approaching** is the smaller, testable claim. A third band can come back as errata if the tape asks. AZALGO-REGIME gating any clause-A paint is the right isolation (same family as E17). AT-ALGO-50’s “at least one tick of `approaching` before fixture 20 folds” is necessary and weak.

`REGIME_NEAR_PCT = 2.0` of **`H`**:

| When | `H` | Approaching window | A is the only fold path? |
|---|---|---|---|
| Fixture 27 — gate, modal | $225 | **$4.50** | **Yes (E38)** |
| Mid-`H` 20/21 | $1,890 | $37.80 | No |
| 80% of ceiling | $2,160 | $43.20 | No |

The window is smallest on the trade where B is dead and A is the only way out. A one-tick GEX jump skips `approaching` entirely: clear → folded. Hotel can construct fixture 20 to linger in the band; live tape need not. That is a check that cannot fire against the real case — the defect family E34 named.

Two states give “how long they had” **only if `approaching` has duration**. At 2% of small `H` it does not. The member goes from clear to folded with a maybe-one-tick flicker, which is the surprise A-fold E41 exists to prevent.

**Required:**

- Threshold in a unit that is usable on **fixture 27**, not only on fixture 20. Candidates (Coach disposes one): a floor in dollars; a fraction of `at_risk` (scale-free); `max(REGIME_NEAR_PCT × H, REGIME_NEAR_ABS)`. Do not reuse `LOOSEN_NARRATE_PCT` (already separated — keep that).
- AT: fixture 27’s path into an A-fold shows `approaching` for more than one tick, on-canvas, no hover. AT-ALGO-50 on fixture 20 alone does not cover the modal trade.
- Two states stay. Do not bring back an untestable third.

---

## 4. Copy vs E35 / AT-ALGO-36

**Almost. Not fully.** The two self-violations named in E43 (`Feed may say 'more of the move still looks available'`; `probability-weighted headroom`) are struck. Residuals:

| Where | Text | Verdict |
|---|---|---|
| §9.4.4 `gamma_factor` | “more **chance** the fly is reached” | Forecast claim in the factor table. Strike. “Price is being held” is enough. |
| §9.4.4 `extrinsic_factor` | “closest thing to a quoted `p` **available**” | English *on hand*, not E35’s *available*. Reword so a grep does not have to be clever. |
| Short-form causes (§9.4.3) | `guide widened · high-water` | **E42 left this after striking the long form.** Arithmetically impossible. Hotel blocks. Must read `tightened · high-water`. |
| Named states | `gex: unavailable` · `p: extrinsic unavailable` | Substring-hit for AT-ALGO-36 (ii) on *available*. Scope the grep: whole word, or exempt these two chrome strings by path. Unscoped, the AT fails on correct E5/E30 chrome — E7 family. |
| Coach clause table | *“this is **likely** the best we’re going to get”* | Coach verbatim. Stays. Chrome must not quote it (AT-ALGO-36 already bans *likely* on surfaces). |
| AT-ALGO-17 | HUD **High · Profit · Given back · Trail · &lt;guide row&gt;**; “fourth row” follows OD-ALGO-1 | Stale. E43’s HUD is High · Profit · Given back · **Budget** · **Guide**. Two ATs, two products. |

Banned-word list in AT-ALGO-36 (ii) is the right list. Legacy `%` knobs exempt is the right scope. House prompt and canvas causes still need a pass after the short-form fix.

---

## 5. Budget on the HUD

**The quantity belongs. The row does not ship unmarked, and it does not paint while B is silent. Tango before P3.**

`Budget = p × headroom` in dollars is clause B’s other term. Given back · Budget is how the member reads a level fold without subtracting in their head. Dollars, not “62% chance.” That is the E31 argument applied to the other side, and it is right.

It is also `0.35 × headroom` from an unvalidated model (E8 · E33). A bleeding member will treat a HUD dollar as law. Knobs still only move the muted legacy line. OD-ALGO-8 already asks the question; the body of §9.6 writes the row as if disposed.

**Required:**

1. Tango freeze before any packet paints it. Default may stay **Budget** (not Drawdown, not Trail).
2. Same *proposed* posture as the line: the row is labelled as belonging to the unvalidated guide, not as a peer of Profit.
3. **While `guide: below zero`, Budget does not paint a live dollar.** B is silent; a $866 budget at the gate (fixture 27) teaches room they cannot spend on a line, while A can still fold them. Hide, or name `budget: waiting` with the line. AT-ALGO-49 extends.

Without (3), E38’s correct model is contradicted by the HUD.

---

## Related integrity (blocks BUILD, not E1–E36)

- Header E8 / §14.5 / OD-ALGO-7 still say fit **`p`**, not the pair `(HORIZON_MIN, P_BASE)`.
- AT-ALGO-17 not updated for Budget / five rows / stamped Guide.
- E3 quote still says “four numbers.”
- Appendix B intro still says all three of 20/21/21b share “one `U` … one set of greeks”; the next sentence and the table correctly vary 21b. Table wins; delete the first sentence.
- Fixture 20 printed PaR $204 vs E39 greeks → $244.

---

## What survives

Two clauses. Fold = A or B. `fold_clause`. Horizon as a named key, joint with `P_BASE`. `guide_raw < 0` as WAITING, no $0 clamp, A live. Signed `m_adv`. `p` exogenous until OD-ALGO-9. Narration: five-tick AT, no reset-on-any-reversal, floor as a cause, provisional widen tick. E8 posture. Wick as *achieved*. Three vol quantities scoped. AZALGO-REGIME as a phase. Given back. Dual lines, legacy ratchet, live eval isolated.

What does not: a 2%-of-`H` approaching band as sufficient warning; a Γ-conditional horizon smuggled as a default; Budget as unmarked law; the leftover `widened · high-water` short form; AT-ALGO-17 as written.

---

## Blocks (invariant | law | system only)

1. Name the E37 band as a slice (`Γ=−$28/pt²`, `H=60%`, this fly). §14.5 / header / OD-ALGO-7 seat the joint fit across apex **and** wing. Horizon stays a constant.  
2. E41 threshold usable on fixture 27. AT covering that path. Two states stay. AZALGO-REGIME stays.  
3. Short-form cause `guide widened · high-water` → `tightened`. AT-ALGO-36 grep must not fail on `unavailable` named states.  
4. Budget: Tango freeze; *proposed* posture; no live dollar while `guide: below zero`.  
5. Fixture 20 PaR $244 (or restated `Δ`). AT-ALGO-17 matches the five-row HUD.

P1 does not fire on this file until Coach re-stamps.

---

## Opinions / recommendations (not blocks — Coach may discard)

- Two HUD states are enough; a third band is later errata if approaching still feels like a blink after the threshold unit changes.
- A dollar floor on approaching is simpler than a ratio of `at_risk`. Either beats `% of H`.
- Do not make horizon a function of `Γ`. PaR already has `Γ`. **FI-048.**
- `Budget` as a word is fine. `Trail` is not, after E25.

---

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| **FI-048** | Adverse horizon as a Γ-conditional function | E37’s discriminating band depends on `Γ` and `H`. Making the *key* a function double-counts convexity already in `PaR`. Modelling program, same family as OD-ALGO-6. Do not smuggle. §14.5 reports whether a constant can serve apex and wing. | Coach + Hotel |
| **FI-047** | Persist-N-bars `H` | Unchanged. Wick still named, not filtered. | Coach + Hotel |
| **FI-045** | Constant vs regime | Still OPEN; seating is now **`(HORIZON_MIN, P_BASE)`**, not `k`, not `p` alone. | Coach + Hotel |

---

## Coach content intact?

Yes. All Coach text retained. Objections are labeled as this review’s and sit beside.

---

## Build disposition

**RETURNED** (implementation readiness only — not product deletion).

Not BUILD AUTHORITY. `AZALGO-W0` does not cover this file. Do not treat P1–P4 as covered.

---

## Bench delta

The next invocation knows:

1. Horizon and `P_BASE` are one calibration; a 20× move cannot be eaten by a probability. The 1.3–5.6 min band is a slice at one `Γ` and `H=60%`, not a finding. Horizon stays a constant; Γ-conditional horizon is a modelling program (FI-048).
2. `guide_raw < 0` makes clause B structurally dead (`p×headroom > H ≥ giveback`). A-only early Managing is correct. It needs a usable approaching band and no Budget dollar, not a new state machine value.
3. Two regime states are enough only if `approaching` has duration on fixture 27. `2% of H` is $4.50 at the gate, where A is the only fold path.
4. E42 struck the long false example and left `guide widened · high-water` in the short-form block implementers copy.
5. Row 20’s printed PaR $204 disagrees with signed E39 on the stated greeks ($244). Verdicts survive; the number does not.
