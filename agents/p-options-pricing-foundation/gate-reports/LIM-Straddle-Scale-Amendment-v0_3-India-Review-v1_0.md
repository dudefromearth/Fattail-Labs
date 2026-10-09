# LIM Straddle-Scale Amendment v0.3 — India review v1.0

**Verdict:** NEEDS REVISION
**Date:** 2026-10-08
**Reviewer:** India (spec / architecture)
**Document:** `agents/p-options-pricing-foundation/LIM-Straddle-Scale-Amendment-v0_3.md` (placed verbatim; not edited by this review)
**Parent:** `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md`, 852 lines, status line BUILD AUTHORITY, sha1 `2d25e3f99a580b4e29058e720ca7f1424bc9c710`. This review did not edit it. v0.1 and v0.2 were not edited.
**Prior reviews:** v0.1 and v0.2, each NEEDS REVISION with one BLOCKING. The five lines named in the v0.2 finding are now rows in §1a.
**k:** `gate-reports/LIM-Straddle-K-Calibration-v1_0.md`. **k = 3.2712422351724415.** Not refit.
**Not a build stamp.** This review counts no Coach OK on the frozen Heatmap / Runner tree. Build readiness: RETURNED.

## Confirmations asked of this review

| # | Asked | Result |
|---|---|---|
| 1 | Every token hit is covered by a §1a row, or it is not the subject §1a lists | One real miss. Line 719. Finding 1. The hit table is below. |
| 2 | No other parent line depends on a covered line and still contradicts §2 or §3 | None found. Notes. |
| 3 | The v0.2 blocking gap is closed | Yes. Lines 12–13, 630, 648, 707, and 827 are rows in §1a. |

**How a hit is covered.** A line is covered when a §1a row names it, or names the clause that contains it, or the line is only the old sentence, the displayed-X interval, or a named acceptance test. The lead-in covers a line that cites a named clause and does not state a second rule.

**What was searched, on every line, case-insensitive.** `per-symbol`, `per symbol`, `symbol map`, `scale map`, `CENTRE_SCALE`, `instrument-specific`, `±100`, `-100`, `+100`, `edge`, `saturat`, `clamp`, `No centre scale configured`.

ASCII `-100` matches no line. The closed interval is written with U+2212, `−100`, on lines 164 and 171. Both lines also match `+100`, so they are in the table.

`clamp` inside the spelling `unclamped` or `xUnclamped`, and `edge` inside `acknowledged` (line 822), are not separate claims. They are marked as the field or as a non-word.

## Hit table

| Line | Token | §1a |
|---|---|---|
| 10 | edge — four coloured edge labels | Not the ball's boundary. LIM23. Stays. No row. |
| 12–13 | scale map — may list SPX and I:SPX | Covered. Status text, lines 12–13 |
| 18 | `No centre scale configured for <symbol>.` | Covered. LIM26 sentence, retired |
| 50 | clamp, only inside `yUnclamped` | Y field, E8. Stays with LIM38. §2 leaves Y unchanged. |
| 164 | `+100`, U+2212 `−100` — heading `[−100, +100]` | Covered. Closed interval for displayed X |
| 170 | `CENTRE_SCALE`, clamp inside `unclamped` | Covered. LIM7 |
| 171 | `+100`, U+2212 `−100`, the word clamp | Covered. LIM7 and the closed-interval row |
| 172 | clamp inside `xUnclamped` | Covered. LIM7 |
| 178 | `±100`, the word clamp — "The X clamp is live." | Covered. LIM7 |
| 179 | `CENTRE_SCALE` | Covered. LIM7 |
| 180 | edge — the idiom "edge case"; clamp inside `xUnclamped` | Covered. LIM7 |
| 202, 208, 213, 220 | the word clamp — Y has no clamp | LIM38. Stays. §2. |
| 209, 217 | clamp inside `yUnclamped` | Same Y passage. Stays. |
| 306, 323 | the word clamp — `crossingProximity` | A different clamp, LIM16. Stays. |
| 365 | edge — ghost opacity at the trail window's end | Not the ball. Stays. |
| 374 | scale map — cites LIM34 as why a trail must clear | Covered by the LIM34 row through the lead-in. The clear stays. Note. |
| 378–379 | edge — ghosts may pass the plane's left or right edge; clamp inside `unclamped` | Covered. LIM33 |
| 395, 459 | edge — edge labels | LIM23 / LIM36. Stays. |
| 434, 469 | edge — identity edge glow | LIM25 / LIM28. Stays. |
| 447 | the old sentence | Covered. LIM26 |
| 520 | clamp inside `xUnclamped` | The result field. Covered. LIM33 |
| 536–537 | `±100`, saturat — displayed position saturates; clamp inside `xUnclamped` | Covered. LIM33 and the closed-interval row |
| 540 | per-symbol, symbol map, `CENTRE_SCALE` | Covered. LIM34 |
| 542 | saturat — a silent fallback saturates a non-SPX session | Inside LIM34. Covered. LIM34 |
| 553 | `CENTRE_SCALE` | Covered. §9 / Appendix A |
| 586 | `±100`, edge, clamp inside `xUnclamped` — AT-LIM13 | Not deleted. Note. The LIM33 row is the behaviour this test checks. |
| 593 | scale map — AT-LIM19 | Covered. AT-LIM19 |
| 600 | the word clamp — AT-LIM26, Y has no clamp | Stays. §2. |
| 607 | scale map, the old sentence — AT-LIM33 | Covered. AT-LIM33 |
| 611, 613 | the word clamp — proximity endpoints | LIM16 / AT-LIM29. Stays. |
| 630 | per-symbol — D4 | Covered. D4, line 630 |
| 648 | `CENTRE_SCALE`, instrument-specific — caveat 4 | Covered. Caveat 4, line 648 |
| 707 | per symbol, `CENTRE_SCALE` — §15 item 4 | Covered. §15 item 4, line 707 |
| 719 | `CENTRE_SCALE` — §16 change-control list | **Not covered.** Finding 1 |
| 732 | `CENTRE_SCALE` | Covered. §9 / Appendix A |
| 785 | the word clamp — E1, `xUnclamped = leanRaw` (LIM7) | History of LIM7. The live formula follows the LIM7 row. |
| 792 | the word clamp — E8, Y clamp removed | History of LIM38. Stays. |
| 809 | the word clamp — E15, proximity | History of LIM16. Stays. |
| 822 | the word clamp — v0.4.2 note, Y clamp removed. `edge` only inside `acknowledged` | History. Stays. Not a reference to the ball's edge. |
| 827 | scale map, and the words "edge labels" | The scale-map sentence is covered by the status-text row. The edge labels are LIM23 and stay. |

No line in the table other than 719 is an uncovered reference to the ball's edge, the closed interval, the old sentence, the old key, a per-symbol scale, a scale map, or an instrument-specific scale.

## Findings

### 1. BLOCKING — §16 line 719 still names the old constant

```text
Any change to the blend weights, band widths, the Y floors or spans, `LIM_CENTRE_SCALE_PTS`, the
put/call sign convention, the crossing-proximity bounds, or the trail interval or window is a
**breaking change**
```

§1a's last paragraph says a line that references the old key is added to the table before stamp. Line 719 is that line. The §9 / Appendix A row removes the key from those two lists. It does not name §16. Amendment §5 cites §16 and retires the key from Appendix A and the env files. It does not say the §16 list drops `LIM_CENTRE_SCALE_PTS` and gains `LABS_LIM_STRADDLE_K`.

This line does not order a per-symbol map and does not contradict the tanh formula. Under this pass an uncovered hit on the old key is blocking. A seed's breaking-change list still names the retired constant. Name line 719 in §1a. Do not edit v0.4.7.

## Notes

**The v0.2 five are closed.** Lines 12–13 and 827 (the scale-map sentence), D4 at 630, caveat 4 at 648, and §15 item 4 at 707 each have a row. A seed cannot keep a per-symbol map from those sentences and also follow §2.

**Line 374.** The trail clears on symbol change because the scale map made the X units differ. LIM34 is retired, so that reason follows the new text. The clear itself stays. Under §2 the unit is still per symbol, because `S` is that symbol's straddle. This does not contradict §2.

**Line 442, not a token hit.** LIM26's predicate is "a missing centre-scale (LIM34) or a missing spot." The centre-scale half goes with LIM34. The missing-spot half stays a refusal. Opinion: with no spot the ATM strike cannot be chosen, so the §3 sentence is still a true description. Not promoted to a constraint.

**Line 450, not a token hit.** "Compute may still return `x = 0` (AT-LIM19)." AT-LIM19 is replaced by AT-LIMS4/5. The line follows that replacement. It does not keep a scale map.

**Line 826, not a token hit.** The v0.4.6 document-control row says the env key is `SPX`, not `I:SPX`, and the row is marked superseded. It is not live law beside the status-text row.

**AT-LIM13 (line 586).** It asserts `xUnclamped ≠ x` and a trail past the plane edge when lean is beyond ±100. It does not assert that the displayed ball equals ±100. The AT-LIM33 row therefore does not delete it. The LIM33 row is the behaviour it checks. It stays, and it holds for every nonzero `r` under `tanh`.

**Y and the proximity clamp.** LIM38, AT-LIM26, LIM16, AT-LIM29, and their errata use the word clamp for other channels. §2 says Y is unchanged. Nothing in §1a retires them. They do not contradict §2 or §3.

**Appendix A row for the new key.** Carried from v0.2, still open, not a parent-token miss. §1a says `LABS_LIM_STRADDLE_K` is added. It still does not write the Appendix A pair: environment key and in-code constant. Parent §9 (line 548) says that pair is the only definition of a key. Write the row in the amendment. Do not edit v0.4.7. Advisory.

**Admin half.** §3 still waits on Admin Notifications Spec v1.1 for the aggregated admin record, and the member sentence does not wait. That remains the right split. Not a token miss.

**k.** §4 records 3.2712422351724415. This review does not refit it.

## Summary for Coach

Verdict is NEEDS REVISION. One line is still uncovered.

The five sentences from the last review are now in §1a. The status text, D4, caveat 4, and the open per-symbol decision no longer stand beside the shared `k`. The search of all 852 lines found no other per-symbol scale, scale map, or instrument-specific scale outside those rows.

One old-key hit remains. §16, line 719, still lists `LIM_CENTRE_SCALE_PTS` as something whose change is a breaking change. §1a does not name that line. It has to, before stamp. The line does not bring the per-symbol map back.

Every other hit is either inside a named clause, or it is not this scale: edge labels, the identity glow, ghost opacity at the end of the trail, the Y clamp, and the crossing-proximity clamp. Those stay. ASCII `-100` occurs nowhere. The closed interval uses `−100` and is the row that opens it.

`tanh` still does what you asked. `k` is **3.2712422351724415**. The member message still meets ruling 8.

This review is not a build stamp. The Heatmap / Runner tree was not edited. The draft was not edited.

## Bench delta

The next review can start from the parent sha1, from `k = 3.2712422351724415`, and from line 719 as the only uncovered old-key hit. It does not have to re-walk the five v0.2 lines, the Y clamp, or the proximity clamp.

## Flagged ideas

Line 719 stays flagged until §1a names it. The Appendix A pair for `LABS_LIM_STRADDLE_K` stays flagged until the amendment writes it. MS-9 as an admin notification stays flagged until Admin Notifications Spec v1.1 exists. None of these is dropped.
