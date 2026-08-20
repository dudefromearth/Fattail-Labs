# Options Lab Analyzer — Risk Graph User Guide

**Where:** `https://labs.fattail.ai/app/options-lab/analyzer`  
**What this is:** the **2D Risk graph** — a picture of **position** P&L vs underlier price.  
**Language:** we say **position**, never “strategy.” Process and structure only — no profit claims.

This guide matches the **as-built** Analyzer on MiniTwo (Analyzer chrome · Probability · Autofit). Surface is a **separate** Options Lab page (`/app/options-lab/surface`), not a tab inside this viewport.

---

## Screen map

```
┌──────── inspector ────────┐  ┌──────── viewport strip ────────┐
│ Create position           │  │ Symbol   Spot   VIX   [Auto-fit] │
│ Live / Held / Off market  │  ├─────────────────────────────────┤
│ GEX                       │  │                                 │
│ Probability               │  │         Risk graph canvas        │
│ What-if                   │  │                                 │
└───────────────────────────┘  ├─────────────────────────────────┤
                               │ Position list (cards)            │
                               ├─────────────────────────────────┤
                               │ Alerts                           │
```

Drag the **divider** under the canvas to give more height to the graph or to the list.

---

## 1. Symbol, Spot, and VIX

**Where:** dark strip **above** the canvas, upper-left.

| Control | How to use it |
|---------|----------------|
| **Symbol** | Label + Apple pop-up (dark bezel, chevron). Pick a name from the Labs universe. Same yellow 24px bold type as Spot. |
| **Spot** | Live underlier mid. You can type a value — that is a **what-if override**, not a silent live mark. |
| **VIX** | Same idea for vol context. Typing here is also an override. |

Gaps between Symbol, Spot, and VIX are **50px**.

When Spot or VIX is overridden, the inspector shows an **override** banner. Package RECON will not pass/fail against live marks while an override is on.

---

## 2. Auto-fit

**Where:** center of the strip above the canvas. Capsule **bordered** button (white outline, transparent fill, 44pt).

- Click **Auto-fit** to frame the visible book (ATM-centered, structure in view, dollar grid readable).
- Auto-fit is disabled when there is **no drawable position** on the canvas (nothing Shown, or the book is empty).
- If the canvas was empty (GEX/grid only) and a position **appears** — Show, Create, paste, or any other path — Auto-fit **runs by itself**, even if you had panned the empty view.
- Pan, zoom, or drag a strike handle **locks** the window. Live ticks and What-if do **not** steal that window. Show/Hide among an **already shown** book also does not Autofit.

---

## 3. The canvas (Risk graph)

### What the lines are

- **Cyan — At expiry:** structural P&L if every leg is held to expiration (the “tent”).
- **Fuchsia — T+0 (theoretical):** P&L **now** (or under What-if), on the OPF-held chain.
- A **Held** suffix on the legend means the session is off RTH live print — last held generation.

The graph does **not** invent strikes or a package price. If a position cannot be placed on the listed chain, you get a **named state** on the card (see §7), not a fake tent.

### Axes and grid

- **Bottom (X):** underlier price (no `$` on the P&L axis labels).
- **Left (Y):** P&L dollars — `+1200`, `-800` (plus/minus, no `$`).
- Grid steps are **1–2–5 × $10, $20, $50, $100…** Floor **$10**. Enough lines to read (~10–20), not a gray field.

### Markers

- **Yellow vertical line:** spot (or sim spot when What-if spot % is on).
- **Short red ticks** on the $0 line: where **real-time P&L** crosses zero (break-evens).
- **Yellow ticks** on the $0 line: **strike handles** for every **Shown** position.

### Move the view

- **Drag** on empty plot: pan.
- **Scroll / pinch:** zoom (centered on the pointer).
- Dragging a **handle** is not a pan — see §4.

---

## 4. Strike handles (redefine the position)

Yellow ticks on $0 are the listed strikes of **Shown** positions.

| Gesture | What happens |
|---------|----------------|
| **Hover** | That tick thickens; cursor **grab**. |
| **Leave** | Tick returns to the thin idle size. |
| **Drag (no Shift)** | Only that strike moves. Detent **only to listed strikes**. Tent redraws when you land on a new listed strike. |
| **Shift-click / Shift-drag** | All handles of **that position** highlight and move together (same listed step count). |
| **Drop** | Commits: card unlocks, legs rebind on the OPF-held chain. No invented strikes. Auto-fit does **not** run on drop. |

You cannot slide between strikes. If the chain has no next strike in that direction, the handle stays put.

---

## 5. GEX (gamma exposure backdrop)

**Inspector → GEX.** Also paints when **no positions are Shown** — GEX is chain-attached, not a second book.

| Control | What it does |
|---------|----------------|
| **Show** | Toggle the bars. |
| **Value** | **Call / Put** (sky up, red down, two right-hand scales) · **Net** · **Absolute**. |
| **Opacity** | How strong the bars sit behind the tent. |

Bars sit at **listed** strikes. Scale is the **longest bar** on that side (not a cutoff). Units match the Heatmap GEX template (÷1e9). Pan/zoom moves GEX with the view.

GEX is an **estimate** (Γ · OI · S²). It is not dealer positioning and not a trade signal.

---

## 6. Probability (gray bands)

**Inspector → Probability** (this used to be labeled Range).

Gray columns sit **behind** GEX, **inside the plot only** (not in the black gutters).

| Control | What it does |
|---------|----------------|
| **Show** | Toggle the band(s). |
| **Expiration** | Listed expiration used for σ and time. |
| **Width** | Two-sided mass in **percent** (1σ default **68.27%**, not “% of spot”). |
| **Second** | Optional outer band (2σ default **95.45%**). |

Geometry is ±z · σ · √τ on that listed expiration’s ATM IV. Honest overlay only — not a forecast that price “will” stay inside the band.

---

## 7. Positions (the book)

The list **under** the canvas is the definition book. **Show** is a checkbox, not a radio: every Shown card draws as **one additive** tent.

| Control | How to use it |
|---------|----------------|
| **Create position** | Inspector button or **+** on the list. Opens Builder. Default create is a 20-wide butterfly at spot when the chain is ready. |
| **Show** | Include / exclude that card from the graph. Hide is not delete. |
| **BUY / SELL** | Flip the structure (debit ↔ credit). |
| **Expiration** | Roll to another **listed** expiration. |
| **▲ / ▼** | Shift **all** strikes one listed step (unlocks the package). |
| **Lock / Unlock** | Lock pins package basis (closed bolt over the body). Unlock (bolt swung **beside** the body) follows live mid. |
| **Debit / Credit field** | When unlocked, type a limit, Enter/Tab to lock. |
| **Edit** | Full Builder. |
| **Close** | Marks the card closed (session clock). |
| **To Trade Log** | Send an open fill into the practice blotter when offered. |
| **×** | Remove the card from the Analyzer book. |

**Blotter colors:** debit / long → open green; credit / short → close red.

**Named states** (package cell — never a silent blank or a fake debit):

EXPIRED · NOT TRADED · CHECK LEGS · UPDATING · BUDGET LIMIT · WAITING · HIDDEN

If every Shown card is hidden or the book is empty, the canvas still shows **grid + GEX + Probability**. There is no center instruction card.

---

## 8. What-if

**Inspector → What-if.** Enable **gates all three** knobs.

| Knob | Domain |
|------|--------|
| **Time** | From now to last trade (index **16:15 ET**, equity **16:00 ET**). |
| **Implied vol** | Absolute %; detent is measured ATM IV. **IV NO** / **WAITING** when unmeasured. |
| **Spot %** | −5% … +5%. Draws a sim-spot indicator on the graph. |
| **Reset** | Clears elapsed time, vol offset, spot %, and turns Enable off. |

What-if is a **study overlay**. It does not change the card’s listed strikes. Live pan/zoom still owns the window (Auto-fit does not fire on every knob tick).

---

## 9. Alerts (Canvas vs Position)

Two kinds — same as thinkorswim / MSC Risk Graph. Left-click still pans; **right-click** never steals drag.

| Kind | How you create it | What it is |
|------|-------------------|------------|
| **Canvas** | Right-click **empty plot** | A **price** alert at that underlier level: rises above / falls below / touches. |
| **Position** | Hover a Shown card’s **at-expiration** curve (within ~8px). It highlights. Right-click that curve. | Menu is **only** for that card (strike label in the header), then the same three conditions. Bound to that card. Overlapping tents: the closest curve wins. |

Lines draw on the graph (solid = **Active** now, dashed = **Idle**).

**Inspector → Alerts:** title, Canvas vs Position, and **Idle / Live / Touched**. You set Live or Idle. Touched happens when a Live alert meets its print — the row shows **when** (ET) and the underlier. Chip click **resets** Touched to Live. No Ack/Dismiss chrome.

---

## 10. Session posture

Badge on the inspector: **Live** · **Pre/post** · **Off market**.

Off market / Held uses the **last held** chain generation — the same listed strikes as Live, not a second universe. Curves may show **· held**.

---

## Honesty (what this graph is not)

- Not a broker. Not an order ticket.
- Not a promise that a tent “will” pay.
- Not invented strikes or silent package prices.
- GEX and Probability are **inspection overlays**, not signals.
- Surface (3D) is `/app/options-lab/surface` — same book idea, different page.

---

## Feature audit (as-built vs not on this canvas)

| Feature | On the Risk graph today |
|---------|-------------------------|
| Dual OPF curves (expiry + T+0) | Yes |
| Dollar grid ($10 floor, 1–2–5) | Yes |
| Pan / wheel zoom | Yes |
| Auto-fit button + empty→book Autofit | Yes |
| Strike handles (single / Shift group, listed detent) | Yes |
| GEX backdrop (incl. empty book) | Yes |
| Probability bands | Yes |
| Spot / VIX / Symbol strip | Yes |
| What-if time · IV · spot % | Yes |
| Additive Shown book | Yes |
| Named package states | Yes |
| Alert **list** (inspector, info + Active/Idle) | Yes |
| Alert **lines** / right-click Canvas vs Position | Yes |
| OPF model picker | **Removed** from member chrome (default pack still prices) |
| In-viewport Surface tab | **Removed** — use the Surface suite page |
