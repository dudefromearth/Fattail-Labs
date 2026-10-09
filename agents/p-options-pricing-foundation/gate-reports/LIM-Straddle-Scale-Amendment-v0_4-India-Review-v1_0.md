# LIM Straddle-Scale Amendment v0.4 — India review v1.0

**Verdict:** READY FOR COACH
**Date:** 2026-10-08
**Reviewer:** India (spec / architecture)
**Document:** `agents/p-options-pricing-foundation/LIM-Straddle-Scale-Amendment-v0_4.md` (placed verbatim; not edited by this review)
**Parent:** `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md`, 852 lines, status line BUILD AUTHORITY, sha1 `2d25e3f99a580b4e29058e720ca7f1424bc9c710`. This review did not edit it. v0.1, v0.2, and v0.3 were not edited.
**Prior review:** v0.3, NEEDS REVISION, one BLOCKING (line 719). That line is now a §1a row.
**k:** `gate-reports/LIM-Straddle-K-Calibration-v1_0.md`. **k = 3.2712422351724415.** Not refit.
**Not a build stamp.** This review counts no Coach OK on the frozen Heatmap / Runner tree. Ready for Coach is not build authority.

## Confirmations asked of this review

| # | Asked | Result |
|---|---|---|
| 1 | Line 719 is covered | Yes. §1a row **§16, line 719**. The retired constant is struck from the change-control list. `LABS_LIM_STRADDLE_K` (`k`) takes its place. A change to `k` is a breaking change, versioned, old versus new. |
| 2 | The v0.3 search, re-run, is unchanged apart from that row | Yes. Same 50 lines. `new []`. `missing []`. No new hit. |
| 3 | Nothing blocks | Nothing blocks. |

The same terms were searched on every line, case-insensitive: `per-symbol`, `per symbol`, `symbol map`, `scale map`, `CENTRE_SCALE`, `instrument-specific`, `±100`, `-100`, `+100`, `edge`, `saturat`, `clamp`, `No centre scale configured`.

ASCII `-100` still matches nothing. The closed interval is still U+2212 `−100` on lines 164 and 171, and both still match `+100`.

Parent sha1 is the sha1 from the v0.3 review. The parent file did not change between the two searches.

## Hit table

The v0.3 table stands, with one cell changed.

| Line | v0.3 | v0.4 |
|---|---|---|
| 719 | `CENTRE_SCALE` on the §16 list. **Not covered.** | Covered. **§16, line 719** |

Every other line keeps the v0.3 disposition: inside a named clause, or not this scale (edge labels, identity glow, ghost opacity at the end of the trail, the Y clamp, the crossing-proximity clamp, and the errata that record those). The line numbers are 10, 12, 18, 50, 164, 170, 171, 172, 178, 179, 180, 202, 208, 209, 213, 217, 220, 306, 323, 365, 374, 378, 379, 395, 434, 447, 459, 469, 520, 536, 537, 540, 542, 553, 586, 593, 600, 607, 611, 613, 630, 648, 707, 732, 785, 792, 809, 822, 827.

No uncovered reference remains to the ball's edge, the closed interval, the old sentence, the old key, a per-symbol scale, a scale map, or an instrument-specific scale.

No parent line depends on a covered clause and still contradicts §2 or §3. The checks from v0.3 still hold: the trail still clears on a symbol change (line 374) because `S` is per symbol; a missing spot (line 442) is still a refusal; AT-LIM13 (line 586) still checks the LIM33 trail and does not put the ball on ±100; the superseded v0.4.6 document-control row (line 826) is still not live law.

## Findings

None. Nothing is BLOCKING.

## Notes

**Appendix A pair.** Carried from v0.2 and v0.3. Not a search miss, and not a block on this pass. §1a says `LABS_LIM_STRADDLE_K` is added. It still does not write the Appendix A pair: environment key and in-code constant. Parent §9 (line 548) says that pair is the only definition of a key. Opinion: write the pair in the amendment before a seed spells the constant. Not promoted to a constraint. v0.4.7 stays unedited.

**Admin half.** §3 still waits on Admin Notifications Spec v1.1 for the aggregated admin record. The member sentence does not wait. Not a search miss.

**k.** §4 records 3.2712422351724415. SPX median `|x|` is 11.13. SPX max moves from 50.76 to 75.82. This review does not refit it.

**`tanh`.** Any finite centre lands strictly inside `(−100, +100)`. Order is kept. Nothing is clipped to the boundary.

## Summary for Coach

Verdict is READY FOR COACH.

The only line the last search left open was §16, line 719. v0.4 names it. The old constant comes off the breaking-change list. `k` goes on it.

The search was run again over all 852 lines. The same 50 lines hit. Nothing new appeared. The other hits are the clauses already named, or they are not this scale.

`k` is **3.2712422351724415**. The member message still meets ruling 8. The admin copy still waits on a notifications spec that can carry it.

This review is not a build stamp. The Heatmap / Runner tree was not edited. The draft was not edited.

## Bench delta

The next invocation can start from this verdict, the parent sha1, and `k = 3.2712422351724415`. It does not have to re-walk the token list to learn that line 719 is the row that closed v0.3.

## Flagged ideas

The Appendix A pair for `LABS_LIM_STRADDLE_K` stays flagged until the amendment writes the environment key and the in-code constant. MS-9 as an admin notification stays flagged until Admin Notifications Spec v1.1 exists. Neither blocks this verdict. Neither is dropped.
