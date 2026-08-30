# Options Lab Heatmap — Advanced flies values

Member-facing guide to the Options Lab Heatmap (Advanced flies). Describes what
each Value menu choice measures. This is a teaching and inspection tool — it does
not tell you what to trade, and it never promises a profit.

**Width Fit** is a separate Heatmap **template** (Template switcher), not a
Value on Advanced flies. See the Width Fit help topic for color-only tiles,
footer median + n, hover/click panels, and criteria weights.

## Options Lab
Options Lab is the in-app suite for inspecting listed options. Open it from the
apps area. The Heatmap lives at `/app/options-lab/heatmap`. Analyzer and Surface
are sibling apps for building a book and viewing its P&L shape.

## Verticals
A **Verticals** template sits under Broken-wing flies. Same width columns
(10…50). **Value** is two tiers. **Debit** or **Credit** is the main
mode — the listed vertical you are looking at. **Type** is secondary:
**% Change** and **R:R** describe that Debit or Credit package. Leave
Type unselected to see the package mid.

**Debit** is +1 at the body and −1 at the far strike (calls: higher
strike · puts: lower strike). **Credit** flips both legs. **% Change**
is the spot-outward percent change of that package
(`|(inner − outer) / inner|`). **R:R** on Debit is
`(width − debit) / debit` when debit is positive; on Credit it is
`credit / (width − credit)` when credit is collected. These are
structure descriptors, not a promised P&L. Missing listed mid → blank
tile. Option-click copies a VERTICAL thinkorswim script.

## Heatmap
Inspector choices (symbol, expiration, template, value, side, Width Fit
weights and view) stay for **this browser tab session** when you leave for
other apps and come back. A new tab starts from defaults. See **This tab
session** for what stays, what does not (hover, Average snapshots), and
how expiration restore works.

The Heatmap is a grid of **symmetric butterflies** (flies) on the live
OPF-held options chain. Rows are body strikes. Columns are fly width
(center-to-wing) in points: **10, 15, 20, 25, 30, 35, 40, 45, 50**.

Pick a symbol, an expiration, and Calls or Puts. The strike window comes from
the held chain — there is no Wings picker. A blank tile (—) means that fly
cannot be formed on listed strikes with listed marks or greeks. The app will
not invent a strike, a mid, or a greek.

Option-click a tile to copy a thinkorswim butterfly script and send it to
Analyzer.

## Time Machine hold
The inspector line says how far back **Time Machine** holds today — from
the open when that session is already on disk, otherwise from the first
print this tab received. It is not a megabyte slider and not a member
control of the decay curve. A past day is a download; today is the held
session.

## Advanced flies Value menu
The Value dropdown chooses **what number** each tile shows (the tile value, sometimes called its score). Every mode uses
the same grid. Colors are a neighbor rate-of-change of that number; the − / +
slider under Side makes the color more calm (−) or more sensitive (+). Color
is not a buy/sell signal.

Older names you may hear: **Debit** is Long/Debit, **Credit** is
Short/Credit, **R:R** is Risk to Reward, **Δ Debit** is **Delta** (listed
fly delta, not a time change), **Δ² Debit** is **Gamma** (listed fly
gamma). **% Change** here is debit vs the next strike away from spot —
not “since the last update.”

## Long/Debit
A **long fly**: buy the wings, sell 2× the body. Quantities **+1 / −2 / +1**
at strikes \(K−w\), \(K\), \(K+w\).

The tile is the package mid: wing + wing − 2× body. Positive means you **pay**
(a debit). Negative means the same long structure would **collect** (unusual,
often a thin or inverted book).

## Short/Credit
A **short fly**: sell the wings, buy 2× the body. Quantities **−1 / +2 / −1**
on the same three strikes.

The tile is that package mid, signed the same way (positive = you pay,
negative = you collect). It is **not** the long debit with a “CR” stamp.

## % Change (debit)
Percent change in **long-fly debit** as you walk **away from spot**, same
width.

The **starting** cell is the next fly toward spot (inner). The **next** cell
is one strike step further out (outer). The outer tile shows:

**|(starting − next) / starting| × 100**

Example: starting debit 9, next debit 7 → **22.2%**. The result is always
**non-negative** (absolute value) so a thin or inverted book cannot print a
minus. The spot-row fly is **0%**. This is not a change over time.

## Risk to Reward
For a long fly with a **positive** debit \(D\) and column width \(w\)
(center-to-wing points):

**\((w − D) / D\)**

That is structural max profit over debit under the usual tent (you cannot
make more than the width minus what you paid). If debit is not positive, or
debit is ≥ width, the tile is invalid — the formula would not be a defined
reward-to-risk.

This is a structure descriptor, not a promised P&L.

## Delta
The fly's **Delta** from the **listed chain greeks** on the three legs:

**+Δ(K−w) − 2Δ(K) + Δ(K+w)**

Same +1/−2/+1 as the long fly. Not a slope of neighboring debit tiles, and
not a change since the last update. If any leg is missing a listed delta,
the tile is invalid.

## Gamma
The fly's **Gamma** from listed chain greeks:

**+Γ(K−w) − 2Γ(K) + Γ(K+w)**

Same rule as Delta. Missing gamma on a leg → invalid.

## Theta
The fly's **Theta** from listed chain thetas:

**+θ(K−w) − 2θ(K) + θ(K+w)**

How the chain says the three-leg package decays with a day of calendar time.
It is a reported greek, not a guaranteed dollar P&L tomorrow. Missing theta
on a leg → invalid.

## Slope
How fast **long-fly debit** changes from one body strike to the next
(debit points per strike point). It is a finite difference of **price**,
not the listed Delta. Edge rows with no neighbor are invalid.

## Curvature
How that Slope itself changes across three evenly spaced body strikes.
A second difference of **debit**, not the listed Gamma. Needs a uniform
triple; otherwise invalid.

## Call/Put asym
Call-fly debit minus put-fly debit at the same body and width. A book
asymmetry (quote / parity deviation), not “calls cost more so buy puts.”
Needs both sides complete.

## Velocity and Acceleration
These are **not on the Value menu**. They would measure how debit moved
from one chain snapshot to the next (a time series). Without a stored
series they would be blank. They return when that series exists.

## What the heatmap is not
It is not a broker, not a fill, and not advice. Tiles use the held
generation's listed mids and greeks. They do not promise what you will
make or lose. For a full book P&L picture, use Analyzer and Surface.

**Condors** (including iron condors) are built in the **Position
Builder**, not on the Heatmap. The Heatmap is for flies, verticals, and
chain GEX — a different job.
