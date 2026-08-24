# Echo labels — Width Fit heatmap + ranking + runner chrome

**Status:** Draft for **SB0-3** to stamp. Not Charlie’s to invent against.  
**Coach (2026-08-24):** *not the standard layout. It should be possible to create any interface. The information is all there.*  
**Coach (follow-up):** *I want the MA Heatmap as well as the Ranking view.*  
**Ranking visual:** [`evidence/width-fit-ui.png`](./evidence/width-fit-ui.png)  
**Kit:** Human Interface Spec v1.0 · `inspectorChrome` rail · existing Width Fit matrix for Heatmap sink.  
**L8:** Cache / Average window remain detent sliders unless Coach Override.  
**Kit (Advisor SB-3 / SB-12):** `DetentSlider` is added to HI Spec §6.2 **before** chrome. `SegmentedControl` is **landed** (`web/components/ui/SegmentedControl.tsx`, `role="radiogroup"`). Ranking “cards” = surface groups, not marketing `Card`. Hero score = `--text-title-1`. Bars must read in light and dark.

Coach Content Law: mock copy and structure sit here **verbatim**. Tango / Hotel objections are labeled **opinions**, not deletions.

---

## Two planes, two sinks (do not collapse)

| Plane | Job | Chrome |
|-------|-----|--------|
| **Rail** (left ~1/5) | Instrument, template, weights, **Heatmap \| Ranking**, **Live \| Average**, cache, chain | Existing `inspectorChrome` |
| **View** (right ~4/5) | Selected sink over the **same** streams | Heatmap matrix **or** ranking sheet |

| Sink | Fills the right pane |
|------|----------------------|
| **Heatmap** | Existing Width Fit K×w tiles. Live = current gen. Average = MA of `colorT` → `widthFitFill`. |
| **Ranking** | Coach mock: hero width, ranked bars, best / runner-up / confidence. Live or Average from the **same** per-width aggregates. |

Default sink: **Heatmap** (L20 A). Member can switch to Ranking without changing Live/Average.

**Do not** merge Heatmap/Ranking with Live/Average into one control. Time × interface are two axes.

**TR9:** later Echo sinks allowed. This packet ships these two. Charlie does not invent a third.

SB3 ships **both**. Dropping either is NX15.

---

## View pane — map of `width-fit-ui.png`

Dark canvas (`--color-background`). Content on `--color-surface` grouped cards (`radius.md`, `elevation.1`). Type ramp: kicker `--text-caption` caps, title `--text-title-1`/`title-2`, hero numeral large, scores `--text-title-2`.

### 1. Header row

- **Left kicker:** `{SYMBOL} · {0DTE\|listed exp} · {structure}`  
  Mock: `SPX · 0DTE · BATMAN`  
  Structure is the Width Fit geometry in play (symmetric fly today; Batman only if `bw-fly` is the bound template — **do not label Batman on `width-fit` / `sym-fly`**). Echo: kicker is facts, not a brand lockup.
- **Title:** mock **Width Ranking** (Coach). Product name remains Width Fit in the rail Template switcher.
- **Right:** clock `8:45 AM CT` (session clock already used on Labs) + caption `Live heat-map snapshot` or, in Average, `Average · {n} of {W}` or Replay time.

### 2. Hero card — leading width

- Eyebrow (mock): `MOST ASYMMETRICALLY EFFICIENT WIDTH`
- Big **width in points** (`20 points`) + body sentence (mock: *Best current balance of movement capture, developing tent value and call/put asymmetry relative to debit.*)
- Trailing **score 0–100** + label `EFFICIENCY SCORE`

**Data (already on the Width Fit footer / per-width median):** leading width = width with highest honest aggregate (median fit, valid \(n\)); score = that aggregate mapped to 0–100 (display only; SoR stays 0–1). Sentence is Tango’s to rewrite or keep (see opinions).

### 3. Ranked Widths list

- Section title `Ranked Widths`
- Pill `Higher = better` (Coach mock)
- Rows 1…N: rank · `{w}-wide` · determinate bar · score  
- Bar: muted fill on track (`--color-label` / `--color-fill`), **not** traffic-light red/green, **not** Width Fit teal→amber required on the bar (mock is white-on-dark). Hit target: whole row ≥ 44 pt. Keyboard: list, not a grid.

Order = descending score. Widths with \(n < min_valid_n\) still list, with quieter score / named low \(n\) — do not invent a high rank from a hole.

### 4. Three summary cards

| Mock label | Value in mock | Data |
|------------|---------------|------|
| `BEST WIDTH` | 20 | Same as hero width |
| `RUNNER-UP` | 25 | Second width |
| `CONFIDENCE / SEPARATION` | High | Gap between #1 and #2 (and/or stability). Named High / Moderate / Low — Tango locks words |

### 5. Footnote

Mock: *Illustrative values only. Production scores would be calculated directly from the current heat-map mathematics for each available width at the selected time.*

Production drop-in: drop “illustrative”; keep “from the current heat-map mathematics … at the selected time” (Live gen, Average window, or Replay `asOf`).

---

## Rail

Order:

1. Template / Width Fit weights (existing)  
2. **Interface** — SegmentedControl Heatmap \| Ranking (`aria-label="Width Fit interface"`)  
3. **Time** — SegmentedControl Live \| Average (`aria-label="Width Fit time"`)  
4. **Average window** — DetentSlider; hidden unless Average  
5. **Cache** — DetentSlider + caption  
6. Chain / ToS  

No overlay HUD. Ranking header clock is snapshot time, not a second Live chip fighting rail status.

---

## Time — SegmentedControl

- `Live` · `Average` · default Live  
- Applies to **whichever** sink is showing  
- Live = current generation; Average = last W gens  
- Replay is not a third segment in SB3  

## Interface — SegmentedControl

- `Heatmap` · `Ranking` · default Heatmap  
- Does not reset Live/Average or the window  
- `data-testid="width-fit-interface"`

---

## DetentSlider

| Instance | Label | Stops | Default | `aria-valuetext` |
|----------|-------|-------|---------|------------------|
| Cache | Cache | 4 8 16 32 | 8 | `{n} megabytes` |
| Window | Average window | 10 20 50 100 | 10 | `{n} intervals` |

Ticks + labels under the track. Thumb hit ≥ 44 pt. Tokens. Reduced-motion: no thumb animation.  
`data-testid`: `runner-cache-budget` · `width-fit-average-window`

---

## Cache caption

`{used} / {budget} MB · {n} gens · {span}`  
At cap: **Cache at your limit**. Oversize: Banner warning.

---

## Any interface (Coach)

SB3 ships **Heatmap and Ranking**. Stream book + Width Fit compute (tiles, per-width median, \(n\), stability, components) are the information. Future sinks are new Echo packets, not new Massive paths and not a second book.

Charlie: one data contract out of `assignColors` / footer. Ranking **maps** it. Heatmap **paints** it (Live or MA). Do not recompute a second ranking formula.

---

## Motion / color

Heatmap tiles: existing teal→amber `widthFitFill`. Ranking bars: mock muted fill on dark track — not debit red/green. `motion.fast`, or instant if `prefers-reduced-motion`. No emoji chrome.

---

## Tango opinion (not deleted Coach copy)

Mock uses Ranking, Best, Higher = better, Efficiency Score, Most asymmetrically efficient. Spec WF5 / AT-WF8 forbade ranking-as-signal and “best.” **Keep the mock until Coach throws words out.** Tango SB0-4 may propose: Width Fit / Leading width / Stronger fit on this snapshot / Fit score. Coach disposes.

## Hotel opinion

“Movement capture / tent value” must map to named Width Fit components or be rewritten. Do not invent a new efficiency. Batman kicker only when the Batman/broken-wing template is actually bound.

---

## Echo SB0-3 stamp

- [x] Both sinks: Heatmap (MA + Live) and Ranking (mock)  
- [x] Two segmented rows: Heatmap \| Ranking and Live \| Average  
- [x] Ranking header / hero / list / three cards / footnote match the mock  
- [x] Rail detents + cache caption  
- [x] Same information, no second formula  
- [x] 44 pt / tokens / reduced-motion / AT-SB-HIG  
- [x] Copy: Coach mock kept; Tango/Hotel opinions labeled  
