# Symbol view

Symbol view is one symbol on one day, drawn from the saved chain snapshots. A snapshot is a copy of the option chain taken every few seconds.[^symbol-snap] These pictures describe what has already printed. They are not a forecast, and they are not a recommendation.

**Tape Labs** at the top returns you to the dashboard. This card opens on SPX. A tile on Health opens the symbol you select.

## Controls

| Control | What you choose |
| --- | --- |
| Symbol | The name to load. |
| Day | The session. The button opens a calendar. |
| Window | **30 min**, **1 hour**, or **Whole session**. This is how much of the day the pictures cover. The page opens on 1 hour. |
| Heatmap | What the chain picture measures: **Trading activity**, **Size imbalance**, **Spread**, or **Implied vol**. |
| Strikes | How many strikes to show around the price: **±10**, **±20**, or **All**. The page opens on ±10. |
| Side | **Calls** or **Puts** for the heatmap. |
| Pause | Holds the picture still. Select it again to let the picture move. |

## The pictures

**Momentum: direction and magnitude.** What price has already done, measured in units of its own recent noise.[^symbol-sigma] How often a move like that continues is a separate question. That count is not on this page.

**Price and the at-the-money straddle.** **Stacked** draws them one above the other. **Overlaid (two axes)** draws them on one chart so you can compare the shape. The two axes mean the scales are different. A line that looks taller is not automatically a larger move.

**Chain heatmap.** Strikes against time. The measure is the one you picked under Heatmap. Trading activity is the number of contracts traded over the trailing minute. The price path on the heatmap is the underlying, drawn against the strikes.

**Volume and open interest by strike.** Calls and puts are marked on the chart.

**Implied volatility smile.** Out-of-the-money options only. The dashed line is about 30 minutes earlier.

**Contract detail.** Select a strike on the heatmap or on the volume profile. The detail picture uses that strike.

**Recent news.** Context for the name. The sentiment is the vendor's. It is not our signal, and it has not been backtested.

## Structure lab

A calculator for one structure, priced from the live chain at the moment you build it. A long leg uses the ask. A short leg uses the bid. The middle of the market is not used here.

| Control | What you enter |
| --- | --- |
| Type | **Vertical spread** or **OTM broken-wing butterfly**. |
| Right | **Call** or **Put**. |
| Strikes | The strikes for that type. A vertical asks for the long strike and the short strike. A broken-wing butterfly asks for the near wing, the body, and the far wing. |
| Qty | How many. It starts at 1. |
| Risk budget $ (optional) | A dollar budget, if you want one. Leave it empty to skip it. |
| Build from the live chain | Prices the structure from fresh quotes. |
| Mark to market now | Re-prices a structure you already built, from fresh quotes. It appears after a build. |
| Backtest this structure through a captured day | Opens Backtest with this structure. It appears after a build. |

The result is what the structure would cost, and what it would pay at expiration, from those quotes. Mark to market assumes every leg is priced at the same instant. Treat the lab as a what-if. The reason to build a structure is not on this page.

The snapshots arrive every few seconds, so this page is not tick data. Use **Replay** on Health when you want ticks.

[^symbol-snap]: The chain is the list of call and put contracts for that symbol.
[^symbol-sigma]: One unit of that noise is one sigma (σ). It describes the size of recent movement. It does not predict the next one.
