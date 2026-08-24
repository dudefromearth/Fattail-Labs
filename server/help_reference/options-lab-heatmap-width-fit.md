# Options Lab Heatmap — Width Fit

Member-facing guide to the Heatmap **Width Fit** template. It scores listed
long butterflies for fit to **your** criteria on the live chain. Teaching and
inspection only — it does not tell you what to trade and never promises a
profit.

## Width Fit
Width Fit is a Heatmap **template** (Template switcher), sibling of Advanced
flies. Open Options Lab → Heatmap (`/app/options-lab/heatmap`) and pick
**Width Fit**. It is **not** a Value menu item on Advanced flies.

Same long-fly grid: body strike rows, width columns **10, 15, 20, 25, 30, 35,
40, 45, 50**. Quantities **+1 / −2 / +1** at \(K−w\), \(K\), \(K+w\). Only
listed strikes and listed marks. Missing wing, null mid, or a quality gate →
dark tile, not a fake score.

## Live, Average, Heatmap, Ranking

Width Fit has two **interfaces** (Heatmap tiles · Ranking sheet) and two **times**
(Live generation · Average of the last 10 / 20 / 50 / 100 held generations).
Average is a Template Runner view of cached chain snapshots on **this tab** —
not a server archive. Cache size is a member control (4 / 8 / 16 / 32 MB).
Average of colors is observation of listed fit, not a forecast.
Ranking display scores are spaced among the top widths so close medians are
readable; rank order is still the Width Fit median.

## How to open Width Fit
Apps → Options Lab → Heatmap. Inspector **Template** → **Width Fit**. Choose
symbol, listed expiration, Calls or Puts. Inspector choices stay for this
browser tab session when you leave and come back — see **This tab session**.
The strike window is the held chain. Changing Template does not add a second
market feed.

## Color tiles
Tiles show **color only** — no numbers on the face.

- **Teal** = weaker fit to your weights than other listed flies on this surface.
- **Mid** = moderate fit, relative to the rest of this surface.
- **Amber** = stronger fit to your weights than other listed flies here.
- **Dark** = not a valid listed fly (missing wing, null mid, or a quality
  gate). Not a fit score.

A light **outline** means high fit **and** neighbors at the same width agree
(a coherent cluster). Isolated bright cells are suppressed. Color is not a
directional signal and not a recommendation. The Advanced flies − / + color
slider does not apply on this template.

## Hover and click
Numbers live on the info panels, not on the tile.

**Hover:** Color (Teal / Mid / Amber / Dark), Meaning (weaker / moderate /
stronger fit, or not a valid listed fly), Fit (score when valid), Neighbors
(coherent cluster, in line with nearby centers, or isolated / unstable), and
Quality when the quote is wide.

**Click:** the same fields plus the seven component rows (debit efficiency,
payoff efficiency, gamma efficiency, curvature efficiency, theta efficiency,
surface responsiveness, call put asymmetry). If the cell is strong but the
width as a whole is only moderate, a Vs width note appears.

Both panels say this is relative to other listed flies under your current
weights — not a directional signal or a recommendation.

## Footer
The bottom row is labeled **Width Fit**. Each column shows that width’s
**median** fit and **n** (how many valid body strikes). Example: `0.62 · n 12`.
If there are fewer than **5** valid centers, the footer shows **n** only
(low confidence) and that width is not presented as a high-fit aggregate.
Wider columns often have a smaller n near the chain edge.

## Weights
Inspector → **Width Fit**. Seven sliders, default **equal** (each 1/7):

- **debit efficiency** — more fly width per unit of debit.
- **payoff efficiency** — structural tent height vs debit (same idea as
  Risk to Reward).
- **gamma efficiency** — listed fly gamma vs debit.
- **curvature efficiency** — debit curvature vs cost.
- **theta efficiency** — listed fly theta vs debit (clock, not promised P&L).
- **surface responsiveness** — local surface vs nearby centers.
- **call put asymmetry** — call vs put fly debit at the same body and width.

Move a slider and the grid re-scores without refetching the chain. Weights
are yours. **Restore default weights** returns all seven to equal.
Neighborhood stability is **not** a slider — isolated spikes are always
penalized.

## Expand
**Expand full matrix** shows every listed body × width cell. **Show coherent
regions** returns to the quieter overview (rows that are not in a coherent
high-fit region can hide). Start with the quieter view; expand when you want
every center.

## Surface states
The line at the top of the Width Fit inspector is the snapshot state vs your
weights:

- **Strong Fit** — at least one width has a high median on enough valid cells.
- **Moderate Fit** — some structure, not a high-median width.
- **No Clear Fit** — valid cells exist; none of the widths stand out.
- **No reliable fit yet** — too few valid cells, or every width is
  low-confidence.
- **Unstable Surface** — neighbors disagree on most usable widths; treat the
  picture as noisy.

These names are observations of this snapshot. They are not a call to trade.

## Criteria
Width Fit combines those seven member-weighted efficiencies on the **current**
held chain generation. It is not a time series and not a hidden platform
ranking. Debit, payoff, gamma, curvature, theta, responsiveness, and call/put
asymmetry are structure descriptors of listed flies. Stability is a penalty
on isolated cells, not a eighth weight you can zero.

## What Width Fit is not
Not a broker, fill, or advice. Not “the best width to trade.” Not the
Advanced flies Value menu (Long/Debit, Delta, Gamma, Theta, … — those stay
on **Advanced flies**). Not a P&L picture — use Analyzer and Surface for the
book. The app will not invent a strike, a mid, or a greek.
