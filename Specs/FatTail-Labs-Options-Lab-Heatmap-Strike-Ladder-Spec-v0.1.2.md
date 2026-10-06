# FatTail Labs — Options Lab Heatmap Strike Ladder Spec v0.1.2

**Status:** **DRAFT.** Mockup is up for Coach. Not build authority. No implementation of the member template in this draft.
**Date:** 2026-10-01
**Supersedes:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Strike-Ladder-Spec-v0.1.1.md`. v0.1 and v0.1.1 stay on disk. This file is the draft.
**Template:** Heatmap template id `ladder`. Member label unchanged: Strike Ladder (raw data).
**Parent:** Heatmap Templates. This draft does not revise the parent, and it does not add a template.
**Review surface:** `http://studiotwo:3000/dev/strike-ladder` — not linked from the Runner, not a member route.

Nothing in this draft was dropped from Coach's text. Echo's neutrals and the cause of the flash sit beside that text, labeled.

| What changed from v0.1.1 | Where |
|---|---|
| Coach's right-edge ruling, verbatim | Coach wording |
| The last column keeps a 2rem right inset | §6 |

---

## Coach wording (2026-10-01)

> Spec for the bench, design seat first, mockup for Coach. Strike Ladder template only.
>
> 1. Spot row: bold, highlighted, nearest strike to spot, following the spot stream (not the chain generation).
> 2. Change flash: every numeric cell diffs against its own value in the previous generation; uptick flashes green, downtick red, unchanged nothing; fade ~600 ms. Stable row keys by strike, in-place update — state why the old flash stopped when the full data set landed and fix that cause, not a workaround.
> 3. Age pill beside the header: as_of, counting up, amber past 5 s.
>
> Mockup on dev against two recorded generations, then Coach approves. No new controls, selectors, or defaults. Add to the Strike Ladder spec:
>
> 4. Changed-cell tint: a cell that changed in the most recent generation keeps a background one step darker than the unchanged white after its flash fades, until the next generation lands. The tint carries no direction; the flash carries direction. Unchanged cells stay white. The design seat picks the two neutrals so the tint is visible but quiet, and shows both in the mockup against a recorded generation.

Later the same day:

> Also, I think the Src column can be removed, it is uninteresting.

Later the same day:

> There should be some right margin padding on the last column so that it is not pinned to the edge of the window.

---

## 1. Spot row

On the Strike Ladder only, one row is the spot row.

- It is the listed strike nearest the spot-stream print.
- The row is semibold, and the strike cell carries the existing tint wash and the existing Spot pill.
- The chain generation's `spot` and `is_spot` do not choose this row. Those fields still travel with the document. Quote cells still paint from the document.
- The spot stream is not started by this draft. Until a frame exists, the build that follows approval uses the same held stream print the chip already keeps. This draft does not change that chip.

## 2. Change flash, and why the old one stopped

Every numeric cell compares itself with its own value in the previous generation.

| Comparison | Paint |
|---|---|
| Both finite, new greater | Green flash, then the changed tint |
| Both finite, new smaller | Red flash, then the changed tint |
| Both finite, equal | White. No flash. |
| One side missing, the other finite | The value updates. Tint, because it changed. No flash, because there is no direction. |
| Both missing | White. |

The fade is 600 ms. The row key is the strike. The visible side is already one side, so one strike is one row. Cells update in place.

**Why the flash stopped when a full generation landed.** This is the cause, not a paint bug.

The member socket asks `diff_ladder` for a patch. That function returns `mode: "full"` whenever it has no previous document (`server/market_data/chain_ladder.py`). The previous document is parked in `_by_hash` only inside `_fetch_ladder`. With the hop on, `fetch_runner_ladder` returns the `:5055` document and does not park it (`server/routes/chain_ladder.py`). The socket then looks that hash up, misses, and sends `mode: "full"` on every push after the first (`server/routes/market_stream.py`). The client applies that full document in `applyFull`, which replaces the contract map and never compares cells (`web/lib/market/useOptionChainBus.ts`). `flash()` runs only in the diff branch, and it marks a whole strike rather than a cell.

The row key is already `${side}-${strike}`. The rows are not remounting. The flash stops because the full document is applied with no per-cell diff.

**The fix of that cause.** Park each served generation on the hop in the same `_by_hash` the local fetch already uses, so the socket can emit a diff. When a full document still arrives and the client already holds a generation, diff each numeric cell against that held generation and update the row in place. The first paint has no previous generation, so it does not flash. Painting every cell because the mode string was `full` is the workaround this draft refuses.

That fix is not in this draft. Coach approves the mockup first.

## 3. Age pill

Beside the Strike Ladder header, one pill shows the document `as_of` and the age counting up from that clock. Past 5 seconds the pill is amber. At 5 seconds it is not yet amber. The pill is not a control. Other templates do not gain it.

## 4. Changed-cell tint — Echo

**Echo, design seat.** The two neutrals are the existing surface steps. No new swatch.

| Role | Token | Hex |
|---|---|---|
| Unchanged cell | `--color-surface` | `#ffffff` |
| Changed cell, after the flash | `--color-surface-secondary` | `#f2f2f7` |

`#f2f2f7` is the one step already under white in the Human Interface tokens. It is visible on the white row and quiet next to the quote.

Direction stays in the flash only:

- Up: `--color-success` (`#34c759`) mixed at 28% over white, fading to `--color-surface-secondary` in 600 ms.
- Down: `--color-destructive` (`#ff3b30`) mixed at 22% over white, same fade.

The tint holds until the next generation. A cell that does not change in that generation returns to white. The spot row's strike cell keeps the tint wash; its numeric cells still follow this rule.

**Echo, motion.** `prefers-reduced-motion` skips the fade. The tint still lands. This is the platform motion rule already in the old flash. It is not a new setting.

## 5. Src column

The Strike Ladder shows these columns, in this order:

Strike, Mid, Bid, Ask, Last, Vol, OI, Δ, Γ, Θ, Vega, IV.

There is no Src column. `mid_source` stays on the row for any other reader. It is not a numeric cell, so it does not flash and it does not take the tint. Removing the column does not remove the field, and it does not change Position Builder or any other surface.

The review page already has no Src column. The member table still shows Src between Mid and Bid until this draft is accepted. The build that follows acceptance drops that header, that cell, and the ladder test's expectation of a Src header.

## 6. Last column inset — Echo

**Echo, design seat.** The last column's right padding is the existing `--space-8` (2rem). Its left padding stays `--space-3` (0.75rem), the same inset the other columns use on both sides. No new space token.

The header and the cells share that inset, so the label and the figures sit on the same right edge, in from the card and in from the window. The extra space is part of the last column. A changed cell's tint fills it. The other columns do not grow.

The review page shows this inset. The member table gains it when this draft is accepted.

## 7. Mockup

`/dev/strike-ladder` plays recorded SPX calls, expiration 2026-10-01, no controls. The table has the columns in §5.

| Moment | Recording |
|---|---|
| Quotes first | `snap-134804464Z.json`, as_of 2026-10-01T13:48:04.464Z, underlying 7659.28 |
| Quotes next | `snap-134806524Z.json`, as_of 2026-10-01T13:48:06.524Z, underlying 7659.08 |
| Spot frame first | `snap-134537914Z.json`, underlying 7666.69, nearest listed strike 7665 |
| Spot frame next | the newer snap's own underlying 7659.08, nearest listed strike 7660 |

The quote change and the spot-frame change are on different clocks, so the row does not follow the generation. Volume, open interest, and IV on these two snaps do not change, so those cells stay white. Bid 19.6 on the 7660 row stays white. The other numeric changes flash and then hold `#f2f2f7`.

The age pill uses the snap `as_of` against the clock, so on a later viewing it is already amber and still counting.

## 8. Out of scope

Other Heatmap templates. New controls, selectors, or defaults. Starting the spot stream. Editing the hop, the socket, or `HeatmapChainPanel` before Coach accepts this draft. Deleting `mid_source` from the ladder document. A member-facing caption explaining the chain strike. The SPX proxy mark on `mb:sym`.

## Ideas inventory

| Idea | Disposition |
|---|---|
| Spot row from the spot stream | IN-SCOPE |
| Per-cell up/down flash, 600 ms | IN-SCOPE |
| Age pill, amber past 5 s | IN-SCOPE |
| Changed-cell tint, Echo neutrals | IN-SCOPE |
| Src column on the Strike Ladder | Removed. Coach, 2026-10-01. The field `mid_source` stays on the row. |
| Last column right inset, `--space-8` | IN-SCOPE. Echo. Shown on the review page. |
| Park the hop generation so the diff can run | IN-SCOPE as the fix of the cause. Not built in this draft. |
| Flash every cell whenever `mode` is `full` | Refused. Workaround. |
