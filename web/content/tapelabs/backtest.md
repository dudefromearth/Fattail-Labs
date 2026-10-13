# Backtest

Backtest replays one option structure through one captured day. You pick the moment of entry. The page then marks the structure on each later snapshot from that day.

The page is a calculator. It shows what those quotes did. A reason to take the trade is not on this page.

**Tape Labs** at the top returns you to the dashboard.

## Pick the day and the costs

| Control | What it does |
| --- | --- |
| Symbol | The name to load. |
| Day | The captured session. **Previous captured day** and **Next captured day** step through days that were actually captured. Weekends and days with no capture are skipped. The button between them opens the calendar. |
| Qty | How many of the structure. It starts at 1. |
| Commission / leg, each way ($) | Dollars added for each leg on the way in, and again on the way out. It starts at 0. |
| Slippage / leg, each way ($) | Extra dollars subtracted for each leg, each way. It starts at 0. A number below 0 is treated as 0. |
| Max risk budget ($, optional) | When you set one, the page can offer a quantity that fits that budget. |
| Load chain | Loads the chain for the symbol, the day, and the entry time on the chart. |

Under the form, the chart is that day's own price path. Drag or click it to set **Entry time**. **Spot at that moment** is the price of the symbol then. The only times you can stop on are times the capture actually saved.

The line under the chart says how many days are available for that symbol, and the first and last of those days.

## How a price is chosen

The structure board prices each package at the mark, the middle of the bid and the ask.[^backtest-mark] After you run, each later snapshot marks a long leg at the bid and a short leg at the ask, then subtracts the commission and the slippage you typed.

## Pick a structure

This block appears after the chain loads.

| Control | What you choose |
| --- | --- |
| Structure | **Butterfly**, **Broken Wing**, or **Vertical**. |
| Direction | For a vertical: **Long** or **Short**. For a broken wing: **Wide far** or **Wide near**. A butterfly does not ask for a direction. |
| Far width | Shown for a broken wing. The far wing stays at this width for the whole grid. |

Select a cell on the call board or the put board. You can pick one side or both.

| What you see in a cell | What it means |
| --- | --- |
| A price | The package at the mark, in points. |
| cr | The package is a credit. |
| not listed | The outer strike is not on this chain. |
| Color | Reward compared with risk. That comparison does not say how often the package wins. |

Hover a cell for the payoff at expiration, the legs, and **1R**. 1R is the most that package can lose.

Then select **Run backtest with this structure**.

**Copy shareable link** copies a link to this setup. **Apply qty** appears when the risk budget suggests a different quantity.

## Read the result

The result block shows the replay and its chart.

| Control | What it does |
| --- | --- |
| Export replay to CSV | Downloads the replay. |
| Compare this exact structure across every captured day | Runs this same structure on the other captured days and lists them. |

A day with no capture cannot be loaded. The calendar and the day arrows are how you see which days exist.

[^backtest-mark]: The mark is (bid + ask) / 2. The bid is the price shown for a buyer. The ask is the price shown for a seller.
