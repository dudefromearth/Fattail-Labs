# LIM2-0 — Trail buffer

**Project:** Options Lab Heatmap LIM  
**Agent:** Charlie  
**Depends:** LIM1-G · LIM0-0 GO · **DL-652**  
**Feeds:** LIM2-G  
**Law:** Spec **v0.4.3** LIM19–22 · LIM33 · E13

## In scope

`web/lib/options-lab/templates/limTrail.ts` · `limTrail.test.ts`

## Out of scope

Quadrant SVG. Registry. Panel. `gex.ts`. Chrome. LIM3. Distance-based emission.

---

## Gaps (Coach 2026-09-02 — settle here, do not guess)

### G1 — “session open” (LIM21 / E13)

**Juliet default, accepted:** reset when the **trading date implied by `ctx.asOf` changes**.

- One comparison. No market calendar. No timezone constant. No new config key.
- Date = leading `YYYY-MM-DD` of the asOf **string as written** (Labs ladder `as_of` is UTC ISO from `chain_ladder.py`). Not `Date.parse` + local/ET conversion.
- Holds across a restart: the module stores the last seen prefix; a reload with the same prefix is not a change (buffer starts empty anyway).
- Missing / non-`YYYY-MM-DD` asOf → no date. A change *to or from* “no date” is a reset. Same “no date” is not.
- **Charlie finding for the token:** none. `ctx.asOf` from the ladder **can** yield a stable `YYYY-MM-DD`. UTC prefix is not RTH 09:30 ET; that is the cost of refusing a TZ key, and it is accepted.

### G2 — clock (LIM20 · window 45 min)

`limTrail` takes a **`now()` supplier**. Tests inject it. **No** `setTimeout`, **no** `sleep`, **no** wall-clock 45-minute run. A flaky trail test is worse than none.

---

## Law (carry)

- Emission is **fixed interval** `LIM_TRAIL_INTERVAL_S`, never on distance. Spacing **is** speed (LIM20). No smoothing, no threshold, no cap.
- Buffer holds **`(xUnclamped, y)`**. X unclamped so ghosts continue past the plane edge; Y has no unclamped twin (E8 / LIM33).
- Reset is immediate and unconditional on **all three**, tested **separately** (AT-LIM25): asOf-date change · expiration change · symbol change. First frame after each is **empty**. No fade, no carry-over, no emit-on-the-reset-frame.
- Uniform ghost size; opacity by age. Opacity is the trail’s channel, not the dot’s (E3).
- Transition compute may exist behind `LIM_SHOW_TRANSITION=false`. **No chrome.**
- Pure module. No fetch, no subscription (HM6). Do not import `limConfig` at eval (C2).

## LIM2-G (this seed)

AT-LIM13 trail-past-edge · AT-LIM14 cluster · AT-LIM15 spread · AT-LIM25 three separate first-frame empties.
