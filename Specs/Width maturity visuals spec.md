# Spec — `width_maturity_visuals.py`

**Purpose:** turn the batch job's output into the figures that decide the questions, in one run of a few seconds. Every figure answers one pre-registered question and states what a positive result looks like, so the pictures get *read*, not admired.

**Input:** the `--out` directory from `width_maturity_job.py` — `width_maturity_rows.parquet`, `summary_at_exit.csv`, `invariant_points.csv`, `days.csv`.
**Output:** numbered PNGs in `<out>/figs/`, plus `figs/index.md` listing each figure with its question and the number it produced.
**Runtime:** seconds. Everything is aggregation over a table that already exists; no pricing is re-run except the one model curve in fig 03.

---

## Conventions

- **Width is ordinal → one sequential hue**, light-to-dark brand orange, 2 strikes lightest, 10 darkest. Never a rainbow. Legend always present; the widest and narrowest also direct-labelled at the line end.
- **Protocol is categorical (two values) → line style**, solid = constant R2R, dashed = constant σ. Same hue per width in both.
- **Symbol → facet**, never colour.
- **One y-axis per panel.** Two measures → two panels.
- Clock on the x-axis in ET, 9:30 → 4:00, exit time drawn as a vertical rule on every time-axis figure.
- Every figure carries a one-line caption: the question, then the answer the data gave, computed — e.g. *"Wide-vs-narrow return gap at 3:00: 2.4× (model predicted ~2.2×)."*
- Bands are interquartile across days, not standard error — sixteen days is not a sample you want a confidence interval on.

---

## Figures

### 01 · Maturity surface — the spreadsheet, averaged over the bank
**Question:** does the wide-first diagonal hold across sixteen sessions, not one?
Heat grid: rows = width (strikes, with points), columns = clock (30-min bins); tile = **mean % of max realized at center** across days. One panel per protocol, one row per symbol. Single-hue ramp. **Overlay contour lines of mean `width/σ` at 0.5, 1.0, 2.0** — if the invariant holds, the colour gradient follows the contours.
**Positive result:** colour tracks the contours; wide rows warm first.

### 02 · Return curves — the study's bar chart, continuous
**Question:** what is the return-at-center path per width, and how much does it vary day to day?
Left panel: return on risk **at center** vs clock, median line per width with IQR band. Right panel: same, **at actual spot** — the honest version. One figure per protocol.
**Positive result:** at 3:00 the wide/narrow gap is ~2× (model prediction for this regime). If it's ~5× as on the VIX-22 day, or ~1×, say so in the caption.

### 03 · The invariant
**Question:** is `% of max at center` a function of `width / σ_remaining` alone?
Scatter of every (width, clock) point: x = width/σ (log scale), y = % of max, coloured by width, faint. Overlay the **flat-vol model curve** (computed inline from Black-Scholes at the bank's median ATM IV). Lower panel: residual (point − curve) vs width/σ, coloured by width.
**Positive result:** points collapse onto one curve regardless of width and hour. **Kurtosis signature:** wide flies sit above the curve, narrow below, systematically.

### 04 · Entry premium ratio — the kurtosis test
**Question:** do narrow flies price rich against a flat model at the open, in low vol?
Per symbol: dot per width = mean `entry_debit / model_debit` across days, with min–max whiskers, a rule at 1.0. Constant-R2R protocol only (constant-σ is confounded by distance).
**Positive result:** ratio declines with width, > 1 at the narrow end. If flat at 1.0, the VIX-22 effect was event- or regime-specific.

### 05 · The regime pair — Sep 2 vs Sep 4
**Question:** does a ~19% difference in σ move the maturity curves the predicted direction?
Per width, two lines: `% of max at center` vs clock on each day. Pre-registered pair via `--pair`; defaults to the bank's highest- and lowest-ATM-IV days if not given.
**Positive result:** the lower-vol day's curves sit to the right (earlier arrival) for every width.

### 06 · Time to half-maturity
**Question:** when does each width reach 50% of its value at center, and how tight is that across days?
Strip plot: x = width, y = clock of first 50% crossing, one dot per day, median marked. Per protocol. Days that never cross are drawn at the top edge and counted in the caption.
**Positive result:** median clock falls monotonically with width; in this regime the model says 35-wide ≈ 3:00, 25–30 ≈ 3:30, narrower ≈ 3:55.

### 07 · The confound — where constant R2R puts the body
**Question:** under Coach's protocol, how far out does each width sit?
Scatter: x = width, y = `body_sigma_out`, one dot per day, constant-R2R only; constant-σ drawn as a horizontal rule at σ₀ for reference.
**Positive result:** none — this figure exists to be looked at. If wide flies sit 1σ+ out while narrow sit ATM, width and location are moving together and fig 02's gap is partly location.

### 08 · Cross-symbol invariant
**Question:** is the mechanism scale-free?
Fig 03's scatter, faceted by symbol, same model curve on each.
**Positive result:** XSP and stock points land on the same curve as SPX.

### 09 · Day sheet
**Question:** which sessions are outliers, and why?
Small multiples, one panel per day: bars of return-at-center at exit by width, title = date · entry ATM IV · realized vol · implied/realized. Both protocols side by side in each panel.
**Positive result:** none — this is the triage sheet. Sep 4 (jobs report) and Aug 25–26 (intraday wick) should look different, and the caption names the three most-anomalous days by distance from the median profile.

### 10 · Theta sign at location
**Question:** is a fly outside its tent ever *paid* to wait in this regime?
Per width, fraction of tracked points where `theta_per_min > 0` at actual spot, by clock bin; heat grid like fig 01.
**Positive result:** near-zero everywhere in low vol (the curve-dynamics prediction), with a visible patch on the Aug 25–26 expansion if the tent widened enough.

---

## CLI

```
python width_maturity_visuals.py --in ./wm_out [--exit 15:00] [--pair 2026-09-02,2026-09-04]
                                 [--symbols SPX] [--dpi 150] [--theme light|dark]
```

`--theme dark` renders on the brand ground for decks and the show; `light` is the default for reading.

## Acceptance

Runs end-to-end on the job's real output in under a minute; every figure's caption contains the computed number it promises; `figs/index.md` exists and lists all ten with their answers; no figure has more than one y-axis; widths never rendered as a rainbow.