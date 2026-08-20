# Options Lab Analyzer — Risk graph

Member-facing guide to the Analyzer **Risk graph** (2D P&L vs price). This is a
study tool for listed **positions** — it does not tell you what to trade and
never promises a profit. Open it at `/app/options-lab/analyzer`.

## Analyzer
The Analyzer is the Options Lab day-trader desk. The **Risk graph** is the 2D
canvas in the middle: P&L dollars vs underlier price for every **Shown**
position, drawn as **one additive** book. Left inspector: GEX, Probability,
What-if. Under the graph: the position list, then Alerts. Surface (3D) is a
**separate** page (`/app/options-lab/surface`), not a tab on this canvas.

## Risk graph
Two curves: **At expiry** (cyan tent) and **T+0** (fuchsia, now or under
What-if). Yellow line is spot. Short **red ticks** on $0 are real-time
break-evens. **Yellow ticks** on $0 are strike handles. Grid is dollars
($10, $20, $50, $100…). The graph never invents a strike or a fake package
price — if a position cannot sit on the listed chain, the card shows a named
state instead of a lying tent.

## How to pan and zoom
Drag empty plot to pan. Scroll (or pinch) to zoom. After you move the view,
live ticks and What-if do not snap it back. Click **Auto-fit** (center of the
strip above the canvas) to reframe the book. Auto-fit also runs when the
canvas goes from no positions to having some (Show, Create, paste).

## Auto-fit
The Auto-fit button sits in the **middle** of the dark strip above the
canvas — white outline, see-through fill. It frames the Shown book. It is
disabled when nothing is drawable. Pan, zoom, or handle-drag locks the
window until you Autofit again (or a book appears on an empty canvas).

## Symbol Spot and VIX
Upper-left above the canvas: **Symbol** (yellow pop-up), then 50px, **Spot**,
then 50px, **VIX**. Symbol picks the Labs universe name. Spot and VIX show
live mids; typing a value is a **what-if override** (banner in the
inspector) — not a silent live mark.

## Strike handles
Yellow ticks on the $0 line are listed strikes of Shown positions. Hover
thickens the tick. Drag **without Shift** moves only that strike. **Shift-drag**
moves every handle of that position together. Handles **click to listed
strikes only** — they will not sit between strikes. Drop commits and
unlocks the package. Leaving the tick returns it to the thin idle size.

## GEX
Inspector → **GEX**. Bars of gamma exposure (Γ · OI · S²) at listed strikes,
behind the tent. Modes: Call/Put (two scales), Net, Absolute. Opacity slider.
GEX still shows when no positions are Shown — it is attached to the chain,
not to a card. It is an estimate, not dealer GEX and not a buy/sell signal.

## Probability
Inspector → **Probability** (formerly Range). Gray bands on the plot for
two-sided mass (default 68.27% and optional 95.45%). Pick a **listed**
expiration. This is an inspection overlay (σ · √τ), not a forecast that
price will stay inside the band.

## What-if
Inspector → **What-if**. Turn Enable on to use Time (to last trade: index
16:15 ET, equity 16:00 ET), Implied vol (ATM IV detent), and Spot % (−5 to
+5). Reset clears all three and turns Enable off. What-if studies the
picture; it does not invent new strikes.

## Position list
The cards under the graph are the book. **Show** is a checkbox: every Shown
card is on the tent. Create (inspector or +) opens Builder. BUY/SELL flips
debit/credit. Expiration and ▲/▼ move on **listed** strikes only. Lock
(bolt over the body) pins package basis; Unlock (bolt beside the body)
follows live mid. Edit, Close, To Trade Log, and × (remove) are on the
card. Debit cards are green; credit cards are red.

## Show and hide
Unchecking **Show** drops that card from the graph only. Other Shown cards
stay. Hiding the last card leaves grid, GEX, and Probability — no fake
empty-state overlay. Checking Show on an empty canvas Autofits.

## Named states
If the package cannot be priced honestly the cell says so: EXPIRED, NOT
TRADED, CHECK LEGS, UPDATING, BUDGET LIMIT, WAITING, HIDDEN. Never a blank
or a made-up debit/credit.

## Alerts
There are **two kinds**. Right-click the **empty plot** for a **Canvas**
price alert (rises above / falls below / touches that underlier price).
Hover a Shown card’s **at-expiration** curve (within about 8px) to
highlight it; right-click that curve for a **Position** alert on **that
card only** (strike label in the header), then the same three conditions.
Overlapping tents: the closest curve wins. Left-click still pans.

Alerts list in the **left inspector** (Alerts panel): the title, whether
it is Canvas or Position, and **Idle / Live / Touched**. Lines on the
graph are solid when Live, dashed when Idle.

## Session posture
The inspector badge is Live, Pre/post, or Off market. Off market uses the
last **held** chain — same listed strikes, not a second universe.

## What the Risk graph is not
Not a broker. Not an order. Not a profit forecast. Not invented strikes.
GEX and Probability are overlays for inspection, not signals.
