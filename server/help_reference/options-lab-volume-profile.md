# Options Lab — Volume Profile

Member-facing guide to the **Volume Profile** chart in Options Lab
(`/app/options-lab/volume-profile`). It shows how much trading volume happened
at each price level. Teaching and inspection only — it does not tell you what to
trade and never promises a profit.

## What this chart is showing you
Volume Profile is a **volume-by-price histogram**. On a normal chart, volume is
drawn along the bottom (volume over *time*). Here it's turned on its side and
drawn **at each price**: every horizontal bar is a **price bin**, and the
**longer the bar, the more volume traded at that price** over the selected
period. It answers "which prices has the market done the most business at?" —
heavy bars are prices the market kept trading around; thin bars are prices it
passed through quickly.

The bar at the **current price** is highlighted, so you can see where price sits
within the volume distribution. Hover any bar to see its exact price range and
volume (shown as `low–high vol N`), and each bin is labelled with its mid price.

## Controls
- **Bar period** — the timeframe the profile is built from (the aggregation
  used to bin volume by price). It's labelled *"OHLC estimate — not tick
  measurement"* — see the honesty note below.
- **Scale text size** — Small / Medium / Larger / X Large for the price labels.
  Appearance only; saved per browser.

## Honesty — this chart is an estimate (for now)
The current Volume Profile builds its bins from **OHLC bars, not tick-by-tick
trades**, so it is an **approximation** of where volume traded — read it for
**shape and context**, not exact numbers. A tick-measured version (a true
volume-by-price histogram from trade data) is in development. If the price
series being used is a proxy, the chart says so.

## What it is not
It is **not** Market Profile / TPO, and it does **not** draw a Point of Control
(POC) or value-area bands — it's a straight volume-by-price histogram. It is not
personalised advice and not a buy/sell signal — context and inspection only.

## How to open
Apps → Options Lab → **Volume Profile** (`/app/options-lab/volume-profile`).
Pick your symbol and choose the **Bar period**. Volume Profile is its own tab,
separate from Analyzer, Heatmap, and Surface.
