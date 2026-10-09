# LIM Straddle-Scale Amendment v0.2 — India review v1.0

**Verdict:** NEEDS REVISION
**Date:** 2026-10-08
**Reviewer:** India (spec / architecture)
**Document:** `agents/p-options-pricing-foundation/LIM-Straddle-Scale-Amendment-v0_2.md` (placed verbatim; not edited by this review)
**Parent:** `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md`, status line BUILD AUTHORITY, sha1 `2d25e3f99a580b4e29058e720ca7f1424bc9c710`. This review did not edit it.
**Prior review:** `gate-reports/LIM-Straddle-Scale-Amendment-v0_1-India-Review-v1_0.md`, verdict NEEDS REVISION, one BLOCKING. v0.1 was not edited.
**k:** `gate-reports/LIM-Straddle-K-Calibration-v1_0.md`. **k = 3.2712422351724415.** Not refit.
**Not a build stamp.** This review counts no Coach OK on the frozen Heatmap / Runner tree. Build readiness: RETURNED.

## Confirmations asked of this review

| # | Asked | Result |
|---|---|---|
| 1 | §1a is complete | No. The v0.1 four are named. The search still finds live clauses §1a does not name. Finding 1 |
| 2 | No surviving clause contradicts §2 or §3 | No. Finding 1 |
| 3 | The v0.1 blocking gap is closed | Yes, for the four rows that finding named. See below |

**v0.1 finding 1, now named in §1a.**

- The closed interval `[−100, +100]` (parent line 164, and the same claim inside LIM7 and LIM33) is the §1a row that turns displayed X into the open interval `(−100, +100)`.
- The LIM26 chrome sentence (parent lines 447–448) is quoted in §1a and retired. The same words at parent line 18 are that sentence. Retiring the sentence covers the v0.4.6 banner.
- AT-LIM33 (parent line 607) is named, and the row also covers any acceptance test that asserts a ball at ±100 or the closed interval.
- LIM7 (parent lines 166–180) is named, so the live X clamp is in the replaced set.

A seed can no longer satisfy the old edge and the old refusal sentence while also satisfying AT-LIMS1 and §3. That was the v0.1 block. It is closed.

## Search

Parent sha1 above. Tokens: `±100`, `edge`, `saturat`, `clamp`, the sentence `No centre scale configured for <symbol>.`, `LIM_CENTRE_SCALE_PTS`, and the acceptance table. Hits that are not the centre scale are listed so the next review does not treat them as misses.

| Parent | What it is | §1a |
|---|---|---|
| 12–13, 827 | Live status: the env scale map may list `SPX` and `I:SPX` | Not named. Finding 1 |
| 18 | The old refusal sentence, v0.4.6 banner | Covered. The sentence is quoted and retired |
| 128 | Registry `computeCell` stub returns `valid: false` | Not the quad. Stays |
| 164 | Heading `[−100, +100]` for displayed X | Named |
| 170–172, 178–180 | LIM7 formula and "the X clamp is live" | Named, as LIM7 |
| 202–220 | LIM38, the Y clamp that cannot fire | §2 leaves Y alone. Stays |
| 306, 611–613 | `crossingProximity` clamp to 0 and 1 | A different clamp. Stays |
| 365 | Ghost opacity at the trail window's end | Not the numeric edge. Stays |
| 374 | Trail must clear because "the scale map (LIM34)" makes X units differ | Cites LIM34, which is named. The clear-on-switch law stays. Note |
| 378–379 | Ghosts may plot past the plane's left or right edge | Matches AT-LIMS9. Stays |
| 395, 434, 459 | Edge labels and the identity edge glow | Chrome, not the scale. Stays |
| 442–450 | LIM26 refusal, including a missing spot | Sentence named. Note on the missing-spot predicate |
| 536–538 | LIM33 saturation at `x = ±100` | Named |
| 540–542 | LIM34 map, absent symbol, "saturates" | Named |
| 553, 732 | §9 and Appendix A, `LABS_LIM_CENTRE_SCALE_PTS` | Named |
| 586 | AT-LIM13, `lean` beyond ±100, trail past the plane edge | Does not assert the ball equals ±100. Stays. Note |
| 593, 607 | AT-LIM19, AT-LIM33 | Named |
| 615–618 | Hand golden with `leanRaw > 100` | Fixture stays. Expected `x` follows LIM7. Note |
| 630 | D4, Labs law is "per-symbol scale" | Not named. Finding 1 |
| 648 | Caveat 4, the key "does not transfer between symbols" | Not named. Finding 1 |
| 707 | §15 item 4, open, "`LIM_CENTRE_SCALE_PTS` per symbol" | Not named. Finding 1 |
| 719 | §16 names the old constant as a breaking-change subject | Not named. Finding 2 |
| 785, 805, 826 | E1, E27, and the v0.4.6 document-control row | History of the clauses §1a already names. Not a second formula |

No acceptance test other than AT-LIM19 and AT-LIM33 is invalidated. AT-LIM1 and AT-LIM2 keep their sign. AT-LIM9 still holds when a straddle exists and the book is empty (`r = 0`). AT-LIM13 still holds whenever `|100 · r| > 100`, and under `tanh` it holds for every nonzero `r`. AT-LIM26 is the Y assertion §2 leaves in place.

## Findings

### 1. BLOCKING — live parent clauses still require a per-symbol scale, and §1a does not name them

v0.4.7 is still BUILD AUTHORITY. These sentences are in force beside the draft. None of them is LIM7, LIM34, §9, or Appendix A, which §1a does name.

- Lines 12–13, in the v0.4.7 status block: "Env scale map may list both `SPX` and `I:SPX` as exact keys. No prefix normaliser."
- Line 630, D4, the Labs column of the declared divergences: "Config, fail loud, per-symbol scale."
- Line 648, caveat 4, under "Known caveats (contractual, and on the chrome)": "`LIM_CENTRE_SCALE_PTS` is instrument-specific and does not transfer between symbols."
- Line 707, §15 item 4, still open: "`LIM_CENTRE_SCALE_PTS` per symbol", owner Hotel.
- Line 827, the v0.4.7 document-control row, present tense: "Scale map may list `SPX` and `I:SPX`."

§2 says `k` is one constant shared by every symbol, and that there is no hand-maintained per-symbol list. §1a retires LIM34. A seed can obey lines 12–13, 630, 648, 707, and 827 and keep a map, and can obey §2 and refuse one. Both cannot be shipped. The lead-in "anything that depends on them follows the new text" does not catch these. They do not present themselves as dependents of LIM34. Caveat 4 and D4 state their own rule. The status block and the document-control row state the map as current v0.4.7 law.

Before stamp, §1a has to name lines 12–13, 630, 648, 707, and 827 as replaced by §2. This review does not edit the draft and does not edit v0.4.7.

### 2. ADVISORY — §16 still names the retired constant

Line 719 lists `LIM_CENTRE_SCALE_PTS` among the subjects whose change is a breaking change. §5 already says this scale change is breaking and that the key is retired in the same change. Line 719 does not order a map and does not contradict §2 or §3. It is an unlisted reference from the required search. Name §16 in §1a so the breaking-change list points at `LABS_LIM_STRADDLE_K`.

### 3. ADVISORY — the new Appendix A row is still not written

This is v0.1 finding 3, still open. It was not the blocking gap. §1a says `LABS_LIM_CENTRE_SCALE_PTS` is removed and `LABS_LIM_STRADDLE_K` is added. Parent §9 (line 548) says Appendix A is the only place a key name is defined, and the row is the environment key plus the in-code constant (line 728). The draft never writes that row. §2 names the environment key and the value. It does not name the in-code constant. Write the row in the amendment. Do not edit v0.4.7 to add it.

## Notes

**Line 374.** The trail-clear sentence cites the scale map as the reason X units differ across symbols. LIM34 is named, so this reason follows the new text. Clearing on symbol change stays. Under §2 the unit is still per symbol, because `S` is that symbol's straddle, and a trail from one symbol is still not a prior state of another. The clear itself does not contradict §2.

**Line 442, missing spot.** LIM26's refusal predicate is "a missing centre-scale (LIM34) or a missing spot." §1a replaces the chrome sentence and retires LIM34. The missing-spot half is a different hole. Opinion: if spot is absent, the ATM strike cannot be chosen, so the §3 sentence is still a true description and not a borrowed contract. Not promoted to a constraint. One sentence in the amendment, saying the missing-spot case uses §3 because the straddle cannot be formed, would stop a seed from inventing a second message.

**AT-LIM13 and the golden.** The §1a blanket replaces tests that assert a ball at ±100 or the closed interval. AT-LIM13 asserts `xUnclamped ≠ x` and a trail past the plane edge. It does not assert `x = ±100`. It stays. The eight-golden line (615–618) still wants a `leanRaw > 100` fixture. Its expected displayed `x` becomes `100 · tanh(r)`, not 100. That is LIM7's replacement, not a ninth acceptance test to retire.

**Empty book.** LIM26's park of an empty book at `(0, 50)` stays, as the v0.1 review said. With a straddle present, `Σ|net| == 0` gives `centrePts = 0`, so `r = 0` and `x = 0`. A missing straddle is `valid: false` even on an empty book. Opinion, not a constraint: §3 wins when both are true, because §3 does not condition on the book.

**Admin half.** §3 now says the aggregated admin record waits on Admin Notifications Spec v1.1, and that the member sentence does not wait. That answers v0.1 finding 2. v1.0 still has three board kinds and no aggregation. The requirement is not dropped. It is not buildable on v1.0, and this draft no longer claims that it is.

**k.** §4 records 3.2712422351724415. SPX median `|x|` is 11.13. SPX max moves from 50.76 to 75.82. This review does not refit it.

## Summary for Coach

Verdict is NEEDS REVISION. The v0.1 block is closed. A further block is open.

§1a now names the closed interval, the LIM26 sentence (including the same words in the v0.4.6 banner), AT-LIM33, and the live X clamp inside LIM7. A seed can no longer ship a ball on the edge, or the sentence `No centre scale configured for <symbol>.`, alongside §2 and §3.

The parent still says, in its own status text, that the scale map may list `SPX` and `I:SPX` (lines 12–13 and 827). Caveat 4 (line 648) says `LIM_CENTRE_SCALE_PTS` does not transfer between symbols. D4 (line 630) still calls per-symbol scale the Labs rule. §15 item 4 (line 707) is still an open decision that the scale is per symbol and that Hotel owns it. §2 says one shared `k` and no list. Those five cannot be shipped with §2. §1a has to name them. The draft was not edited. v0.4.7 was not edited.

`tanh` still does what you asked. `k` is **3.2712422351724415**. The member message still meets ruling 8. The admin copy still waits on a notifications spec that can carry it, and §3 now says so.

This review is not a build stamp. The Heatmap / Runner tree was not edited.

## Bench delta

The next review can start from the parent sha1, from `k = 3.2712422351724415`, from the closed v0.1 list, and from finding 1's five locations. It does not have to re-walk the Y clamp, the proximity clamp, or the edge-label chrome.

## Flagged ideas

The per-symbol map in the v0.4.7 status block, D4, caveat 4, and §15 item 4 stays flagged until §1a names those clauses as replaced by the shared `k`. The requirement is not dropped.

MS-9 as an admin notification stays flagged until Admin Notifications Spec v1.1 exists. §3 already waits on it. The member sentence does not.
