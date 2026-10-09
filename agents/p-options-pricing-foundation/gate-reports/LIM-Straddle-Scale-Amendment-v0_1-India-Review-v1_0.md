# LIM Straddle-Scale Amendment v0.1 — India review v1.0

**Verdict:** NEEDS REVISION
**Date:** 2026-10-08
**Reviewer:** India (spec / architecture)
**Document:** `agents/p-options-pricing-foundation/LIM-Straddle-Scale-Amendment-v0_1.md` (placed verbatim; not edited by this review)
**Parent:** `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md`, status line BUILD AUTHORITY, sha1 `2d25e3f99a580b4e29058e720ca7f1424bc9c710`. This review did not edit it.
**k:** `gate-reports/LIM-Straddle-K-Calibration-v1_0.md`. **k = 3.2712422351724415.**
**Not a build stamp.** This review counts no Coach OK on the frozen Heatmap / Runner tree. DL-817 is the decision record, not a stamp.

## Confirmations asked of this review

| # | Asked | Result |
|---|---|---|
| 1 | The exact parent LIM spec file | `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md`. Header status is BUILD AUTHORITY. It supersedes v0.4.6. sha1 `2d25e3f99a580b4e29058e720ca7f1424bc9c710` |
| 2 | The amendment amends it cleanly (LIM7, LIM33, LIM34, §9, Appendix A, AT-LIM19) | The named targets have a replacement in §2, §3, and §5. Four parent rows that state the old edge and the old refusal are not in the amends line. Finding 1 |
| 3 | `tanh` satisfies Coach's condition | It does. Finding none. See the note under Confirmations |
| 4 | Missing-data handling meets ruling 8 | The member sentence does. The admin half cites MS-9, which still does not fit Admin Notifications Spec v1.0. Finding 2 |
| 5 | The `k` from Part B | 3.2712422351724415. SPX median \|x\| on the sample is 11.13. The method is amendment §4. See the note |

**tanh.** Amendment §2 sets `x = 100 · tanh(r)` with `r = centrePts / (k · S)`. For every finite `r`, `|tanh(r)| < 1`, so `−100 < x < 100`. Equality with ±100 does not occur. `tanh` is strictly increasing, so `r1 < r2` gives `x1 < x2`. A small `r` is near `r`, so the middle of the quad stays near the linear reading. A large `r` approaches the boundary and does not land on it. That is normalisation by the function, not a clip after the fact. Coach's sentence in §1 and in DL-817 is met by this formula. AT-LIMS1 and AT-LIMS2 match it.

**k.** §4 asks for the `k` that makes SPX's median `|x|` under this rule equal 11.13 on the evaluation's 41,063 minutes. The calibration report does that binary search on the evaluation's minute file. Achieved median is 11.130000000000003. Today's fixed-50 median on the same SPX minutes is 11.13149 and the max is 50.75576. Under this `k` the SPX max is 75.81950. No straddle was missing. Six symbols exceed the 1% flag for `|x| > 95` (IWM, SLV, TLT, UNG, USO, XLF). This review does not refit `k` and does not substitute another one.

**The named sections, where the replacement is written.**

- LIM7 (`v0.4.7` lines 166–180) looks `centre` up in `LIM_CENTRE_SCALE_PTS[symbol]` and clamps. §2 replaces that scale with `k · S` and replaces the clamp with `tanh`. `centrePts` stays the LIM7 sum. `xUnclamped` stays the unclamped linear reading, now `100 · r`.
- LIM33 (lines 536–538) already trails on `xUnclamped`. §2 and AT-LIMS9 keep that, and they define `xUnclamped` as `100 · r`. The parent clause "where the displayed position saturates" describes the clamp §2 retires. See finding 1.
- LIM34 (lines 540–542) and AT-LIM19 (line 593) are the symbol map and the ban on borrowing another symbol's 50. §5 says both are replaced by §3. §3's refusal is a missing ATM mid, not a missing map entry. There is no map left to borrow from.
- §9 (lines 546–553) and Appendix A (line 732) list `LABS_LIM_CENTRE_SCALE_PTS` as a required key. §2 adds `LABS_LIM_STRADDLE_K` with no code default, which is invariant 2 (missing key aborts boot, AT-LIMS6, and the same rule as AT-LIM17). §5 retires the old key from Appendix A and from the env files in the same change. The new Appendix A row is not written out. Finding 3.
- Y is untouched. LIM38 (line 202) and AT-LIM26 already keep `nearSpotMix` inside 0–100 with no clamp. §2 says Y is unchanged. That sentence matches the parent.

## Findings

### 1. BLOCKING — the parent still requires a pinned edge and the old refusal sentence, and the amendment does not name those rows

v0.4.7 is still BUILD AUTHORITY. These sentences are in force beside the draft:

- Line 18, and the same words at lines 15–17: a `valid: false` result names the hole `No centre scale configured for <symbol>.` (AT-LIM33).
- Line 164: the X axis is the closed interval `[−100, +100]`.
- Lines 178–180: the X clamp is live, and a reading past the scale is an ordinary session. That paragraph sits inside LIM7, which the amends line does name. The heading on line 164 does not.
- Lines 442–450 (LIM26 / E27): a missing centre-scale is a refusal, and the chrome string is `No centre scale configured for <symbol>.`
- Lines 536–538 (LIM33): the trail keeps resolution "where the displayed position saturates."
- Line 607 (AT-LIM33): `valid: false` (symbol off the scale map) paints no disc and names `No centre scale configured for <symbol>.`

The draft's replacements are a different interval, a different mechanism, and a different sentence:

- §2 and AT-LIMS1: `−100 < x < 100`, never equal to ±100. The ball is not pinned.
- §3 and AT-LIMS4: `Quad window unavailable for {symbol} {expiration}: ATM straddle not available.`
- AT-LIMS7: no "no centre scale" message anywhere on the six named symbols.

The amends line names LIM7, LIM33, LIM34, §9, Appendix A, and AT-LIM19. It does not name AT-LIM33, LIM26, or the §5.1 heading. A seed can satisfy AT-LIMS4 and fail AT-LIM33, or the other way around. Both cannot be the chrome string.

This review does not edit the draft and does not edit v0.4.7. Approved specs are not edited in place. Before stamp, the amendment has to name AT-LIM33, LIM26's refusal sentence (lines 442–450), the v0.4.6 banner (line 18), and the closed interval (line 164) as superseded by §2, §3, AT-LIMS1, and AT-LIMS4. LIM26's rule for an empty book at `(0, 50)` is a different case and stays.

### 2. ADVISORY — AT-LIMS4's admin record is MS-9, and MS-9 does not fit Admin Notifications Spec v1.0

§3 says each missing straddle is reported to admins per plan MS-9, aggregated. AT-LIMS4 expects that record.

Admin Notifications Spec v1.0, re-read:

- Trigger events are only `board.awaiting_approval`, `board.revision_requested`, and `board.flag_opened` (lines 22–28).
- Line 30 reserves later kinds as future, not v1.
- Recipients are `role_override` administrators (lines 32–35).
- The data model is one row per admin per event (lines 42–58). There is no aggregation column.
- The API lists at most 50 rows and the shell polls every 30 seconds (lines 63–72).
- Line 121: v1 is immediate per event.

The member sentence in §3 meets ruling 8 (DL-815): it names the symbol, the expiration, and the missing straddle, and §3 forbids another strike, expiration, or symbol. The admin half cannot be built on v1.0 until that spec grows a missing-data kind and an aggregation rule. This is the same gap as the v0.3 plan review. The amendment does not schedule that spec change.

### 3. ADVISORY — Appendix A gains a retirement and not a new row

§9 (line 548) says Appendix A is the only place a key name is defined, and that a packet may not introduce a key that is not in it. §5 retires `LABS_LIM_CENTRE_SCALE_PTS` from Appendix A. §2 requires `LABS_LIM_STRADDLE_K`. The draft never writes the replacement row (environment key, in-code constant, what it governs). A stamp that only deletes line 732 leaves the new key outside the canonical list §9 is guarding. Write the row in the amendment. Do not edit v0.4.7 to add it.

## Notes

**Empty-map behaviour.** LIM7's first sentence is unchanged by §2: an empty map or `Σ|net| == 0` yields centre 0, so `r = 0` and `x = 0` when a straddle exists. A missing straddle is `valid: false` even if the book is empty. The draft does not say which of those wins when both are true. Opinion: the missing straddle is the refusal, because §3 does not condition on the book. Not promoted to a constraint. Worth one sentence in the amendment so a seed does not have to choose.

**AT-LIM13** (line 586) still matches the new split. When `|100 · r| > 100`, `xUnclamped ≠ x`, and the trail keeps `xUnclamped`. `tanh` makes `xUnclamped ≠ x` for every nonzero `r`, which is stronger than AT-LIM13 and does not fail it.

**AT-LIMS8** retires the string `LIM_CENTRE_SCALE_PTS` from the repo. v0.4.7 contains it, and this review is not a license to edit that file. The grep becomes true only when a later spec version replaces v0.4.7. The amendment should say the parent file is superseded as a whole at stamp, not grepped into compliance.

**Six symbols over the 1% flag.** That is Hotel's §4 flag, recorded in the calibration report. It is not a defect in the formula. TLT's median `|x|` is 50.945 and SPY's is 8.676 (spread 5.872). The unit is the same (ATM straddles). The coordinate is not. §2's chrome sentence says the reading means the same thing on every symbol, which is the unit, not the coordinate.

**Status line of the draft.** It says "not India-reviewed." This file is the review. The draft was placed verbatim and is left verbatim.

## Summary for Coach

Verdict is NEEDS REVISION. One blocking gap.

The parent is `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md` (BUILD AUTHORITY, sha1 `2d25e3f99a580b4e29058e720ca7f1424bc9c710`). The draft does replace LIM7's scale and clamp, LIM34, AT-LIM19, and the old config key. It does not name AT-LIM33, LIM26's refusal sentence, or the closed interval `[−100, +100]`. Those still require the chrome string `No centre scale configured for <symbol>.` and a ball that can sit on the edge. §3 and AT-LIMS1 require a different sentence and a ball that never reaches the edge. Both cannot be shipped.

`tanh` does what you asked. Any finite centre lands strictly inside the quad, the order of readings is kept, and nothing is clipped to the boundary.

The member message meets ruling 8. It names the symbol, the expiration, and the missing straddle, and it does not borrow another contract. The admin copy of that event still has nowhere to go: Admin Notifications Spec v1.0 has three board kinds and no aggregation.

`k` is **3.2712422351724415**. On the same 41,063 minutes, SPX's median `|x|` is 11.13, matching today, and SPX's furthest minute moves from 50.76 to 75.82. No straddle was missing. IWM, SLV, TLT, UNG, USO, and XLF spend more than 1% of minutes with `|x| > 95`.

This review is not a build stamp. The Heatmap / Runner tree was not edited. The draft was not edited.

## Bench delta

The next review can start from the parent sha1 above, from `k = 3.2712422351724415`, and from finding 1's line list. It does not have to rediscover which refusal string is still law.

## Flagged ideas

MS-9 as an admin notification stays flagged until Admin Notifications Spec v1.0 grows a missing-data kind and an aggregation rule. The requirement is not dropped. It is not buildable on the spec as it stands.
