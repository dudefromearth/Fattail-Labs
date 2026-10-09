# LIM straddle amendment v0.3 — place and India re-review

**Date:** 2026-10-08
**Machine:** StudioTwo

v0.3 is placed verbatim. India returned **NEEDS REVISION**. v0.1, v0.2, and v0.4.7 were not edited. No code, config, or commit.

## Part A

```
=== head -1 ===
# LIM Template — Straddle-Normalised Centre Scale Amendment v0.3 (DRAFT)
=== grep -c ===
1
1
2
```

Those counts are `Status text, lines 12–13`, `Caveat 4`, and `§15 item 4`. Before the write, the straddle listing was v0.1 and v0.2 only.

Files:

- `agents/p-options-pricing-foundation/LIM-Straddle-Scale-Amendment-v0_3.md`
- `agents/p-options-pricing-foundation/gate-reports/LIM-Straddle-Scale-Amendment-v0_3-India-Review-v1_0.md`

## Part B — hit table

Every line of v0.4.7 (852 lines) was searched, case-insensitive. ASCII `-100` matches nothing. The closed interval uses `−100` (U+2212) on lines 164 and 171, and both also match `+100`.

| Line | Token | §1a |
|---|---|---|
| 10 | edge — coloured edge labels | LIM23. Stays. Not the ball. |
| 12–13 | scale map | Covered. Status text |
| 18 | old refusal sentence | Covered. LIM26 sentence |
| 50 | clamp, only inside `yUnclamped` | Y field, E8. Stays. |
| 164 | `+100`, `−100` | Covered. Closed interval |
| 170–172, 178–180 | `CENTRE_SCALE`, clamp, `±100`, "edge case" | Covered. LIM7 |
| 202, 208–209, 213, 217, 220 | clamp | Y, LIM38. Stays. §2. |
| 306, 323 | clamp | `crossingProximity`. Stays. |
| 365 | edge — opacity at the trail window's end | Not the ball. Stays. |
| 374 | scale map, cites LIM34 | Covered by the LIM34 row. The clear-on-switch stays. |
| 378–379 | plane edge; `unclamped` | Covered. LIM33 |
| 395, 459 | edge labels | LIM23 / LIM36. Stays. |
| 434, 469 | edge glow | LIM25 / LIM28. Stays. |
| 447 | old sentence | Covered. LIM26 |
| 520 | clamp inside `xUnclamped` | Covered. LIM33 |
| 536–537 | `±100`, saturates | Covered. LIM33 |
| 540, 542 | per-symbol, symbol map, `CENTRE_SCALE`, saturat | Covered. LIM34 |
| 553, 732 | `CENTRE_SCALE` | Covered. §9 / Appendix A |
| 586 | `±100`, plane edge — AT-LIM13 | Stays. It checks the LIM33 trail. It does not put the ball on ±100. |
| 593 | scale map — AT-LIM19 | Covered. AT-LIM19 |
| 600 | clamp — AT-LIM26, Y | Stays. §2. |
| 607 | scale map, old sentence — AT-LIM33 | Covered. AT-LIM33 |
| 611, 613 | clamp — proximity endpoints | Stays. |
| 630 | per-symbol — D4 | Covered. D4 |
| 648 | `CENTRE_SCALE`, instrument-specific | Covered. Caveat 4 |
| 707 | per symbol, `CENTRE_SCALE` | Covered. §15 item 4 |
| 719 | `CENTRE_SCALE` — §16 list | **Not covered.** |
| 785 | clamp — E1 history of LIM7 | History. Live formula follows LIM7. |
| 792, 809, 822 | clamp — Y and proximity history | Stays. On 822, `edge` occurs only inside `acknowledged`. |
| 827 | scale map, and the words "edge labels" | The map sentence is covered. The labels stay. |

No other line depends on a covered clause and still contradicts §2 or §3.

## India

**Verdict: NEEDS REVISION.** One line is still uncovered.

The five sentences from the last review are now in §1a. The status text, D4, caveat 4, and the open per-symbol decision no longer stand beside the shared `k`. The search found no other per-symbol scale, scale map, or instrument-specific scale outside those rows.

§16, line 719, still lists `LIM_CENTRE_SCALE_PTS` as something whose change is a breaking change. §1a does not name that line. It has to, before stamp. The line does not bring the per-symbol map back.

Every other hit is either inside a named clause, or it is not this scale: edge labels, the identity glow, ghost opacity at the end of the trail, the Y clamp, and the crossing-proximity clamp. Those stay.

`tanh` still does what you asked. `k` is **3.2712422351724415**. The member message still meets ruling 8.

This review is not a build stamp. The Heatmap / Runner tree was not edited. The draft was not edited.
