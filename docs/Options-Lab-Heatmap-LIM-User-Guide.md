# Options Lab Heatmap — LIM User Guide

**Where:** `https://labs.fattail.ai/app/options-lab/heatmap`  
**What this is:** a Heatmap **template** that publishes where this expiration’s GEX mass sits relative to spot, and the near-spot mix of sign, concentration and closeness — as **factors**, not as a metaphor.  
**Language:** observation only. It forecasts nothing. It does not tell you what to trade.

**Help (concierge):** `server/help_reference/options-lab-heatmap-lim.md`  
**Spec (engineering):** `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.4.md`

Picker name: **GEX lean (window)**. Code id `lim`.

---

## Screen map

```
┌──────── inspector ────────┐  ┌──── quadrant ────┬── companion GEX ──┐
│ Template: GEX lean (window)│  │ four outlined     │  bars ordinary    │
│ Chain (symbol / exp / …)   │  │ cells + disc      │  spot LINE glows  │
│ Lean · Mix · magF · …      │  │ proximity chip    │                  │
└────────────────────────────┘  └──────────────────┴───────────────────┘
OI as-of line visible; other three lines behind the i next to the title
```

---

## 1. Open LIM

1. Open **Options Lab → Heatmap**.
2. Template switcher → **GEX lean (window)**.
3. Pick a listed symbol and expiration. The window is the held chain (wings). Mass outside the wings is not counted.

Changing Template does not add a second market feed.

---

## 2. The plane

Crosshairs at lean **0** and mix **50**. Four cells are outlined. Edge labels, as drawn:

- EXPANSION (upper, green) / COMPRESSION (lower, red)
- WEIGHT BELOW (left, red) / WEIGHT ABOVE (right, green)

The disc is **lean** (left/right) and **near-spot mix** (up/down). Colour is identity (one blue), not good/bad.

Empty, not yet loaded, or a symbol with no scale, sit **dead centre** at full opacity — not bottom-centre, not a spinner.

**Shelf life** is the **numeric chip** (0–1, two decimals), never the disc fading, never a ring. The header also prints Lean · Mix · magF · crossings · proximity. Two books can share the same mix and differ only in magF.

There is no Comfort / Compact toggle. At a narrow panel the trail drops; the chip stays. Ghosts are prior states. Spacing is speed. They may plot past the left/right edge.

---

## 3. Chrome (verbatim)

1. `Chain GEX (estimate). Dealer sign is assumed, not observed.`
2. `Window read — mass outside the wings is not counted.`
3. `Open interest as of {oiAsOf}. Today's trading is not in it.`  
   When the as-of date is missing: `Open interest as-of date unavailable. Today's trading is not in it.`
4. `The near-spot mix is a blend of measured factors. Whether it resists price movement is unmeasured.`

Line **3** (open interest as-of) is always visible. Lines 1, 2 and 4 sit behind the **i** next to the title — one click, same words.

The numeric header prints Lean, Mix, magF, crossings **count**, and proximity. It never prints a single crossing **price**.

---

## 4. Session trail reset

The ghost trail clears on symbol change, expiration change, and when the **UTC calendar date** in the generation stamp changes. That UTC midnight is **20:00 ET (EDT) / 19:00 (EST)**, not the cash-session open, and it shifts across DST. Correct through regular trading hours. Revisit only if Labs shows an overnight session.

---

## 5. What this is not

Not a wall, magnet, pin, or forecast. Not chain GEX (it is a **window**). Not volume. Not the frozen **Chain GEX (estimate)** template — that stays in the switcher unchanged.
