# Options Lab Heatmap — LIM User Guide

**Where:** `https://labs.fattail.ai/app/options-lab/heatmap`  
**What this is:** a Heatmap **template** that publishes where this expiration’s GEX mass sits relative to spot, and the near-spot mix of sign, concentration and closeness — as **factors**, not as a metaphor.  
**Language:** observation only. It forecasts nothing. It does not tell you what to trade.

**Help (concierge):** `server/help_reference/options-lab-heatmap-lim.md`  
**Spec (engineering):** `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.3.md`

Picker name: **GEX lean (window)**. Code id `lim`.

---

## Screen map

```
┌──────── inspector ────────┐  ┌──── quadrant ────┬── companion GEX ──┐
│ Template: GEX lean (window)│  │ crosshairs 0 / 50 │  bars ordinary    │
│ Comfort | Compact          │  │ disc + ring       │  spot LINE glows  │
│ Chain (symbol / exp / …)   │  │ trail if Comfort  │                  │
└────────────────────────────┘  └──────────────────┴───────────────────┘
chrome under both
```

---

## 1. Open LIM

1. Open **Options Lab → Heatmap**.
2. Template switcher → **GEX lean (window)**.
3. Pick a listed symbol and expiration. The window is the held chain (wings). Mass outside the wings is not counted.

Changing Template does not add a second market feed.

---

## 2. The plane

Crosshairs at lean **0** and mix **50**. The disc is **lean** (left/right) and **near-spot mix** (up/down). Colour is identity (one blue), not good/bad.

Empty, not yet loaded, or a symbol with no scale, sit **dead centre** at full opacity — not bottom-centre, not a spinner.

**Shelf life** is the **ring** (size), never the disc fading. Compact **keeps the ring** and drops the numeric chip, the trail, and the magF readout.

Comfort shows `crossingProximity` (0–1, two decimals) and **magF** beside it. Two books can share the same mix and differ only in magF.

Ghosts (Comfort) are prior states. Spacing is speed. They may plot past the left/right edge.

---

## 3. Chrome (verbatim)

1. `Chain GEX (estimate). Dealer sign is assumed, not observed.`
2. `Window read — mass outside the wings is not counted.`
3. `Open interest as of {oiAsOf}. Today's trading is not in it.`  
   When the as-of date is missing: `Open interest as-of date unavailable. Today's trading is not in it.`
4. `The near-spot mix is a blend of measured factors. Whether it resists price movement is unmeasured.`

Compact shows lines **1 and 3** only.

The state line prints expiration, wing count, and (Comfort) crossing **count**. It never prints a single crossing **price**.

---

## 4. Session trail reset

The ghost trail clears on symbol change, expiration change, and when the **UTC calendar date** in the generation stamp changes. That UTC midnight is **20:00 ET (EDT) / 19:00 (EST)**, not the cash-session open, and it shifts across DST. Correct through regular trading hours. Revisit only if Labs shows an overnight session.

---

## 5. What this is not

Not a wall, magnet, pin, or forecast. Not chain GEX (it is a **window**). Not volume. Not the frozen **Chain GEX (estimate)** template — that stays in the switcher unchanged.
