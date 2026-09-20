# Options Lab — Volume Profile

Member-facing guide to **Volume Profile** in Options Lab
(`/app/options-lab/volume-profile`). It shows how much trading volume
happened at each **price**. Teaching and inspection only — it does not
tell you what to trade and never promises a profit.

## What this chart is showing you

Volume Profile is a **volume-by-price histogram**. On a normal chart,
volume is drawn along the bottom (volume over *time*). Here it is turned
on its side: every horizontal bar is a **price row**, and the **longer
the bar, the more volume traded at that price**.

The product chart is **one canvas with layers you switch on**:

- **Price** (candles / bars / line) — the market tape
- **Volume Profile** — the blue side-anchored histogram (default on)
- **Analysis** — structural overlay, **off until you switch it on**
- **Footprint** and **Position** — named future layers, not on yet

It is **not** a separate “view” for each tool. Footprint and GEX arrive
later as **layers** on this same chart. Replay, when it arrives, is a
**view** (a different experience), not a layer.

The profile is **visible range**: each bar is volume at that price
**inside the time window currently on the chart**. Pan or zoom the
candles and the histogram refetches to match. There is no Full History
mode.

## Three uses

The same chart is meant for three jobs. Modes (Morning / Entry / Manage)
are one-click presets of layers and timeframe — Morning is Coach’s show
configuration, so you can match his chart in one click.

| Use | Job |
|-----|-----|
| **Morning routine** | Read the terrain before the open |
| **Trade entry** | Place the structure against the levels |
| **Trade management** | Hold / adjust / exit against the levels |

## Controls

- **Source** — the served instrument list (not a hardcoded menu). Switching
  rebinds data, tick size, and provenance; the layout stays the same.
- **Interval** — 1m / 5m / 15m / 1h / 1D for the **price** layer only.
- **Layers** — L0 canvas, L1 price, L2 profile, L3 analysis. Click a
  layer chip to open its settings.
- **Right-click** — opens the settings dialog for that part of the
  chart: canvas (background, grid, fonts, crosshair, margins), price
  candles (body / border / wick colors), profile (anchor, width,
  opacity), or the price scale (side, last-price line, high/low
  highlights).
- **Defaults** — every settings dialog has Save as default / Reset to
  default / Reset to house default. House values are Coach-tuned; your
  saves do not overwrite them.
- **Your settings persist on your account.** Clearing the browser does
  not lose them; sign in on another machine and the same surface comes
  back.

## Honesty

- **Admin / StudioTwo today:** the layered chart above is what you see
  (tick-measured profile from the Volume Profile service, visible-range
  `/window`).
- **Members today:** the Volume Profile tab still shows the **residual
  OHLC-window estimate** (labelled as an approximation, not tick
  measurement). That residual dies when the layered chart ships to
  members. Until then, read the member chart for **shape**, not exact
  bin counts.
- The profile is **not** Market Profile / TPO and does **not** draw a
  Point of Control or value-area band unless you turn Analysis on.
- It is not personalised advice and not a buy/sell signal.

## How to open

Apps → Options Lab → **Volume Profile** (`/app/options-lab/volume-profile`).
It is its own tab, separate from Analyzer, Heatmap, and Surface.
