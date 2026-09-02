# Options Lab Heatmap — GEX lean (window)

Member-facing guide to the Heatmap **LIM** template. It shows where this
expiration’s GEX mass sits relative to spot, and the near-spot mix of
sign, concentration and closeness. Teaching and inspection only — it
does not tell you what to trade and never promises a profit.

## GEX lean (window)
A Heatmap **template** (Template switcher), sibling of Advanced flies,
Width Fit, and Chain GEX (estimate). Open Options Lab → Heatmap
(`/app/options-lab/heatmap`) and pick **GEX lean (window)**. Code id
`lim`. Layout is a **quadrant**, not a grid.

The disc is lean (left/right) and near-spot mix (up/down). Colour is
identity — one blue — not good or bad. Empty or not-yet-loaded sits
dead centre at full opacity.

Four outlined cells. Edge labels: EXPANSION / COMPRESSION and
WEIGHT BELOW / WEIGHT ABOVE. Shelf life is the header proximity
number (0–1), never a fade and never a ring. The header also prints Lean · Mix · magF · crossings ·
proximity. There is no Comfort/Compact toggle; a narrow panel drops the
trail and keeps the chip.

## Chrome
Four standing lines. Line 3 is always visible. Lines 1, 2 and 4 sit
behind the **i** next to the title:

1. Chain GEX (estimate). Dealer sign is assumed, not observed.
2. Window read — mass outside the wings is not counted.
3. Open interest as of {date}. Today's trading is not in it. If the
   date is missing: Open interest as-of date unavailable. Today's
   trading is not in it.
4. The near-spot mix is a blend of measured factors. Whether it
   resists price movement is unmeasured.

Chrome never prints a single crossing price when the crossing count is
not exactly one.

## Companion GEX
The same generation as the quadrant. The **spot line** (a price, not a
strike row) takes the disc’s colour and glow. Bars stay ordinary.

## Trail
Prior states; spacing is speed. Drops on a narrow panel. Clears on symbol change,
expiration change, and when the UTC date in the generation stamp
changes (UTC midnight = 20:00 ET daylight / 19:00 standard — not the
cash open).

## How to open
Apps → Options Lab → Heatmap. Inspector **Template** → **GEX lean
(window)**. Choose symbol and listed expiration. Changing Template does
not add a second market feed.
