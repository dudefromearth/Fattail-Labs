# Options Lab Heatmap — Width Fit User Guide

**Where:** `https://labs.fattail.ai/app/options-lab/heatmap`  
**What this is:** a Heatmap **template** that scores listed long butterflies for **fit to the criteria you set**, on the live dual-side chain.  
**Language:** observation and structure only — no profit claims, no “buy this width.”

**Help (concierge):** `server/help_reference/options-lab-heatmap-width-fit.md`  
**Spec (engineering):** `Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`

This guide matches the **as-built** Width Fit template: Template switcher, color-only tiles, hover / click panels, footer median + \(n\), member weight sliders, plus **Heatmap / Ranking** interfaces and **Live / Average** (moving-average of held generations on this tab; cache budget 4–32 MB).

---

## Screen map

```
┌──────── inspector ────────┐  ┌──────── matrix ─────────────────┐
│ Template: Width Fit       │  │ Rows = body strikes             │
│ Width Fit                 │  │ Columns = fly width 10…50       │
│   Strong Fit / …          │  │ Color-only tiles (no numbers)   │
│   Expand full matrix      │  ├─────────────────────────────────┤
│   seven weight sliders    │  │ Footer: median · n per width    │
│   Restore default weights │  └─────────────────────────────────┘
│ Chain (symbol / exp / …)  │
└───────────────────────────┘
```

---

## 1. Open Width Fit

1. Open **Options Lab → Heatmap** (`/app/options-lab/heatmap`).
2. In the inspector, open the **Template** switcher.
3. Choose **Width Fit** (sibling of **Advanced flies**, not a Value on Advanced flies).

Pick a **symbol**, a **listed expiration**, and **Calls** or **Puts**. The strike window comes from the held chain. The grid is the same long-fly geometry as Advanced flies: body \(K\), wings \(K \pm w\), quantities **+1 / −2 / +1**.

Width Fit is **not** on the Advanced flies **Value** menu.

---

## 2. How to read the tiles (color only)

Tiles **do not print numbers**. Color is the fit, **relative to other listed flies on this surface under your current weights**.

| Color | Meaning |
|-------|---------|
| **Teal** (cooler) | Weaker fit to your weights than other listed flies here. |
| **Mid** | Moderate fit, relative to the rest of this surface. |
| **Amber** (warmer) | Stronger fit to your weights than other listed flies here. |
| **Dark / empty** | Not a valid listed fly (missing wing, null mid, or a quality gate). Not a fit score. |

A subtle **outline** on a tile means high fit **and** neighbors at the same width agree (a coherent cluster). Isolated bright cells are suppressed so they do not steal the picture.

Color is **not** a directional signal, not a fill, and not “the app likes this trade.”

The − / + color slider used on Advanced flies **does not apply** here. Width Fit uses its own teal→amber scale.

---

## 3. Hover and click (where the numbers live)

Because tiles are color-only, the characterization sits on the **info panels**.

**Hover** (compact):

| Field | What it tells you |
|-------|-------------------|
| **Color** | Teal, Mid, Amber, or Dark. |
| **Meaning** | Weaker / moderate / stronger fit vs other listed flies here — or “not a valid listed fly.” |
| **Fit** | The relative fit score for that cell (when valid). |
| **Neighbors** | Coherent cluster, in line with nearby centers, or isolated / unstable vs nearby centers. |
| **Quality** | Shown when the quote is wide — that cell is down-weighted. |

**Click** (more info) adds the seven **component** rows (debit efficiency, payoff efficiency, gamma efficiency, curvature efficiency, theta efficiency, surface responsiveness, call put asymmetry). If this cell scores well but the **width as a whole** is only moderate, a **Vs width** note appears.

Both panels end with: this is relative to other listed flies on this surface under your current weights — **not a directional signal or a recommendation.**

Click a valid tile also opens the held fly (same as Advanced flies). Option-click a valid tile copies a thinkorswim butterfly script when that path is available.

---

## 4. Footer (per width)

The bottom row is labeled **Width Fit**. One cell per column (width 10, 15, … 50).

| Footer shows | Meaning |
|--------------|---------|
| **`0.xx · n 12`** | Median fit for that width, and how many valid body strikes went into it. |
| **`n 3` only** | Too few valid centers for a confident median (need at least **5**). Low confidence — not a high-fit width. |

\(n\) is honest: only **valid** cells at that width count. Wider columns often have a smaller \(n\) near the edges of the chain.

---

## 5. Inspector: state, Expand, weights

**Where:** inspector section **Width Fit** (under Template).

### Surface state (top line)

| State | Meaning |
|-------|---------|
| **Strong Fit** | At least one width has a high median on enough valid cells. |
| **Moderate Fit** | Some structure, not a high-median width. |
| **No Clear Fit** | Valid cells exist; none of the widths stand out. |
| **No reliable fit yet** | Too few valid cells, or every width is low-confidence. |
| **Unstable Surface** | Neighbors disagree on most usable widths — treat the picture as noisy. |

These names describe **this snapshot vs your weights**. They are not a call to trade.

### Expand full matrix

Default view can hide rows that are not in a coherent high-fit region, so the first look stays quiet.

- **Expand full matrix** — every listed body × width cell.
- **Show coherent regions** — back to the quieter overview.

### Criteria weights

Seven sliders, default **equal** (each \(1/7\)):

| Slider | Plain meaning (higher = you care more) |
|--------|----------------------------------------|
| **debit efficiency** | More fly width per unit of debit paid. |
| **payoff efficiency** | Structural tent height vs debit (same idea as Risk to Reward). |
| **gamma efficiency** | Listed fly gamma vs debit. |
| **curvature efficiency** | How debit curvature sits vs cost. |
| **theta efficiency** | Listed fly theta vs debit (clock, not a promised P&L). |
| **surface responsiveness** | How the local surface moves with nearby centers. |
| **call put asymmetry** | Call vs put fly debit at the same body and width. |

Move a slider; the grid re-scores **without** refetching the chain. Weights are **yours**. There is no hidden platform ranking.

**Restore default weights** puts all seven back to equal.

Neighborhood **stability** is not a slider. Isolated spikes are always penalized so one noisy cell cannot look like a coherent region.

---

## 6. What Width Fit is not

- Not a broker, fill, or advice.
- Not “the best width to trade.”
- Not Advanced flies **Value** (Long/Debit, Delta, …). Those still live on the **Advanced flies** template.
- Not a time series. It scores **this** held chain generation only.
- Not a promise of P&L. For a book picture, use **Analyzer** and **Surface**.

If a fly cannot be formed on listed strikes with listed marks or greeks, the tile stays dark. The app will not invent a strike, a mid, or a greek.

---

## 7. Quick walkthrough

1. Heatmap → Template → **Width Fit**.
2. Glance at **color**: amber clusters vs teal field.
3. Read the **footer**: which widths have a median and a usable \(n\).
4. **Hover** a tile for Color / Meaning / Fit / Neighbors.
5. **Click** for the component breakdown.
6. Adjust **weights** if your question is different (cost vs gamma vs call/put).
7. Use **Expand full matrix** when you want every center, not only coherent regions.
