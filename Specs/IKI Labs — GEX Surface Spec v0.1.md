# IKI Labs — GEX Surface Spec v0.1

**Status:** **DRAFT** — not build authority. Gates at **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-GEX-Surface-Spec-v0_1.md`
**Component id:** `gex-surface` · **Layout:** `matrix` · **Plane:** `chain_multi_expiry` (**HM21**)
**Parent:** [`IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md`](./IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md)
— GXF law is not restated here.

**Duplicates:** ITMatrix heatmap · Unusual Whales spot-gamma heatmap · DealerEdge heatmap ·
QuantWheel heatmap.

**Standing constraint:** this is the **only tool in the family that cannot be built on data the
platform currently captures.** See §3.

---

## 1. Purpose

**The question it answers:** *is today's concentration a front-expiry artefact, or is the same
strike carrying gamma across several expiries?*

That distinction is the tool's entire reason to exist. A cell that is large in the 0DTE column and
absent everywhere else describes a book that ceases to exist at the bell. The same strike lit
across 0DTE, the weekly and the monthly describes something that survives tomorrow. **Reading one
as the other is the misread this tool is built to prevent** — and, rendered carelessly, the misread
it would most efficiently cause.

**The question it does not answer:** what price will do about it (**GXF36**).

---

## 2. Component declaration

```ts
{
  id: "gex-surface",
  runner_template_id: "gex-surface",
  layout: "matrix",
  dataPlane: { id: "chain_multi_expiry", keyFrom: (ctx, p) => …, required: true },
  analyzer_handoff: false,
  metrics: ["gex", "abs_gex", "dex"],   // VEX gated — GS8
  lenses: ["oi", "flow"],
}
```

---

## 3. The plane — and why it does not exist yet

**GS1 — multi-expiry is not available from the live chain model, and this is not a workaround
question.**

| Constraint | Source |
|---|---|
| The shared chain model is **single-expiration** | HM1 + the chain control |
| Live generation is clamped to **≤250 contracts, one page** | HM17 |
| `next_url` on the live path is a **hard error** — no partial book is ever published | HM18 |
| The existing archive has **no expiry axis at all** — every captured snap is 0DTE for its session date | **SV65**, measured across 12 trading days |

A strike window × 8 expiries × both sides is several times the clamp. So the Surface requires a
**server-owned auxiliary read plane fed by a batch producer that follows pagination** — the SVP
poller pattern exactly (**SV7**): two callers, two laws, and neither given the other's.

**GS2 — the plane is a forward capture. Its history starts the day it runs.** There is no backfill
for the Surface, because there is nothing to backfill from. The back-select control must say so
rather than showing an empty grid (**GXF33**).

**GS3 — enabled `(symbol, expiration)` pairs are enumerated config.** Poller cost is linear in
pairs. "The front expirations of the coaching symbols" is a description, not a config value
(**OD-GXF7**, `SV20` parity). The poller defers to the live Market Bus budget and never starves the
member's live surface.

**GS4 — the plane is read-only and the tool owns no fetch.** The host resolves it (HM21b);
switching metric, lens, normalisation or side costs **at most one** plane read, cached by key
(HM21f). Failure renders a local error state — never a silent fallback to the single-expiry chain
under the same label (**HM21g**).

---

## 4. Transforms

1. **Hygiene and scope**; tradability filter (**GXF21** — AM-settled contracts leave the book at
   the prior close, which on this grid means an entire column can be untradable while displaying
   open interest).
2. **Columns:** the nearest `max_expiries` **listed** expirations, default 8. Listed, never
   synthesised.
3. **Rows:** listed strikes within `spot ± window`. **Listed strikes only, never a synthetic mesh**
   (**GS7**).
4. **Cell:** `Σ gex` for that `(strike, expiry)` under the active lens. Null Γ or null OI on a side
   ⇒ that side invalid; the cell is invalid unless both sides resolve (**GXF33**).
5. **Normalise** — see §5. `global` or `column`, **declared, never inferred**.
6. **Peak cell** = `argmax |cell|` in view.
7. **Counter peak** = `argmax |cell|` on the **opposite side of spot** from the peak. Absent when no
   cell exists on that side — absent, not the next-best cell.
8. **Spot row** = nearest listed strike; the spot line is drawn at its true proportional position
   across all columns.
9. **Stacked tag:** where a strike holds top-decile `|GEX|` in **≥ `stack_min` expiries**, tag it
   with `n_exp` and `gex_sum`. This is the tool's actual product.

---

## 5. Normalisation is a measurement statement, not a preference

**GS5 — the two normalisation modes do not mean the same thing, and the surface must say which is
active.**

Near-dated ATM gamma is enormous relative to a monthly at the same strike. Under **global**
normalisation the front column saturates and every other column reads as empty — which is
*truthful about magnitude* and *useless for the comparison the tool exists to make*. Under
**column** normalisation each expiry is scaled to itself, which makes the comparison legible and
means **a colour in one column is not the same quantity as the same colour in the next**.

| Rule | |
|---|---|
| The active mode is **named on the strip**, not buried in a control (**GXF34** parity) |
| Under `column`, the legend states that intensity is **within-column** and cells are **not comparable across columns** by colour |
| Under either mode, the **number** in the cell and the hover are absolute and always comparable |
| `column` may be the default for readability; it may **not** be the default silently (**OD-GS1**) |
| Never a composite score combining columns (`SV39` parity) |

**GS6 — cross-expiry sums are one number from several books.** `gex_sum` on a stacked tag adds
gamma across expiries with different times to expiry and different hedging horizons. It is a
descriptor. It is **not** "the gamma at that strike", and the surface never presents it as a market
level (`AN-A4`, `SV47`).

---

## 6. Tool law

| # | Law |
|---|---|
| **GS7** | **Listed strikes and listed expiries only.** A synthetic mesh is how a gamma heatmap acquires structure at strikes and dates that do not exist |
| **GS8** | **VEX ships only with its derivation written out.** `vanna · oi · multiplier · spot · iv · 0.01 · sign` does not carry the clean *notional per 1 % move* reading the GEX derivation does. Either derive it the way Foundation §3.1 derives GEX and land it as its own `algo_version`, or **hide the metric**. A metric whose units nobody can state is not a metric (**AT-GS8**) |
| **GS9** | **DEX carries its own sign rule.** Delta exposure's dealer convention is a separate declaration from gamma's; the two are never assumed to share one (`AN-A1`) |
| **GS10** | **Peak and counter-peak are extrema.** Neutral names in the payload; no wall / magnet / control / defence framing anywhere (**GXF35**). Member labels are Echo's (**OD-GS2**) |
| **GS11** | **`abs_gex` hides sign and must say so.** A magnitude metric on a diverging palette is a category error; `abs_gex` renders on a **sequential** scale with sign suppressed and stated |
| **GS12** | **Flow lens: no peak, no counter-peak.** `gex_vol` is unsigned (**GXF11**), so "opposite side of spot from the peak" is still computable but the sign colouring is not. Under `flow` the grid renders sequential magnitude only, and signed marks are **absent** |
| **GS13** | **Every column states its expiration, and no figure is a market level.** A single-expiration crossing or concentration is not "the SPX gamma level", which is computed across all expirations (`SV47`) |
| **GS14** | **Held-to-clock rows are marked.** The plane runs on the poller's clock, not the live bus. Cells are current to `last_poller_at`, and the surface says so rather than implying tick freshness (`SV54b` parity) |

---

## 7. Output contract

```json
{
  "ts": 0,
  "component": { "id": "gex-surface", "version": "0.1.0" },
  "symbol": "SPX", "spot": 0,
  "lens": "oi", "metric": "gex", "normalize": "column",
  "expiries": ["2026-09-01"],
  "strikes": [0],
  "cells": [
    { "strike": 0, "expiry": "", "gex": 0, "oi": 0, "vol": 0,
      "tradable": true, "valid": true, "invalid_reason": null,
      "held_to_clock": false }
  ],
  "peak":         { "strike": 0, "expiry": "", "gex": 0 },
  "counter_peak": { "strike": 0, "expiry": "", "gex": 0 },
  "stacked": [ { "strike": 0, "n_exp": 0, "gex_sum": 0 } ],
  "coverage": { }
}
```

Under `lens: "flow"`, `peak` and `counter_peak` are **absent** (**GS12**).

---

## 8. Visual

Grid: Y strike descending, X expiry near → far. Diverging palette for signed metrics on the
product's frozen scale; **sequential** for `abs_gex` and for the flow lens. Peak and counter-peak
cells outlined, not recoloured — outline carries the tag, hue keeps carrying the value. Spot line
across all columns at true proportional position. Untradable columns (**GXF21**) visibly marked as
such.

Hover: net, call, put, OI, volume, distance from spot, expiry, **and the absolute value regardless
of normalisation mode**.

Coverage strip persistent, carrying the normalisation mode, `last_poller_at`, scope, and `oi_asof`.

---

## 9. Controls

| Control | Default | Notes |
|---|---|---|
| Expiry column set | nearest 8 | listed only; from enumerated pairs (**GS3**) |
| Normalise | `column` | **declared on the strip** (**GS5**, OD-GS1) |
| Lens | `oi` | `flow` suppresses signed marks (**GS12**) |
| Metric | `gex` | `abs_gex` · `dex`; **VEX hidden unless GS8 satisfied** |
| Peak tags | on | neutral names (**GS10**) |
| Stacked tag | on | `stack_min` from config |
| Strike step grouping | native | `$5` / `$10` grouping is a display roll-up; the sum is stated |
| Colour scale | colourblind-safe diverging | sign never carried by hue alone |
| Participant split | **absent** | declined by name (Foundation §18) |

---

## 10. Acceptance tests

| ID | Test |
|---|---|
| **AT-GS1** | The tool never issues a fetch; the host resolves the plane. Metric, lens, normalisation and side switches produce **≤1** plane read total (cached) and **zero** chain HTTP |
| **AT-GS2** | Plane unavailable → local error state for this tool only; **no fallback** to the single-expiry chain rendered under the same label; workspace survives |
| **AT-GS3** | Batch producer follows `next_url` and records `pages`; the **same fixture** through the live generation path still hard-errors (HM18 intact) |
| **AT-GS4** | Requesting a session before the plane's first capture returns an explicit *no data for that session*, never an empty grid |
| **AT-GS5** | Normalisation mode is present in the payload **and** rendered on the strip; under `column` the legend states cells are not comparable across columns by colour |
| **AT-GS6** | Cell hover shows the absolute value; toggling normalisation changes colour only, never the number |
| **AT-GS7** | Null Γ or OI at a `(strike, expiry)` → invalid cell, **never a zero-valued cell** |
| **AT-GS8** | VEX is unavailable unless its `algo_version` and derived units string exist; a build with VEX enabled and no units string **fails validation** |
| **AT-GS9** | Counter-peak is **absent** when no cell exists on the opposite side of spot — the next-best same-side cell is never substituted |
| **AT-GS10** | `lens: "flow"` → `peak` and `counter_peak` absent; grid renders sequential, not diverging |
| **AT-GS11** | Every rendered figure and every payload cell carries its expiration; no copy presents a single-expiration figure as a market-wide level |
| **AT-GS12** | Cells outside the live band carry `held_to_clock: true` and do **not** update on a generation push |
| **AT-GS13** | AM-settled column on settlement day renders as untradable; its cells are excluded from peak, counter-peak and stacked selection |
| **AT-GS14** | Banned strings absent from copy, tooltips, legends and payload field names |

---

## 11. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-GS1** | Default normalisation | **`column`**, declared loudly. `global` is truthful and unreadable; the fix is disclosure, not the other default |
| **OD-GS2** | Member labels for peak / counter-peak / stacked | **Echo + Tango.** The category's names carry the reading **GS10** removes |
| **OD-GS3** | `stack_min` | Start at **3**; it is the tool's core claim and deserves a live-tape sitting, not a desk number |
| **OD-GS4** | Does the Surface ship in the first wave at all, given **GS1**? | **No.** It is the only tool gated on a capture that does not exist. Ship it when its plane has run long enough to be worth reading (**see the execution plan**) |
| **OD-GS5** | Column set: fixed nearest-N, or member-chosen expiries? | **Nearest-N first.** Member-chosen invites comparing a 0DTE against a LEAP on one grid |

---

## 12. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. Plane required and does not yet exist (GS1–GS4); normalisation as a measurement statement with a disclosure rule (GS5); cross-expiry sums are descriptors not levels (GS6); VEX gated on its own derivation (GS8); flow lens suppresses signed marks (GS12). AT-GS1–14 · OD-GS1–5 |

**One-line law:**
**One grid of strike against expiry, from a paged batch capture that does not exist yet, where the
colour means something different depending on a normalisation the surface must always name — and
where no cell is the market's gamma level, because every cell belongs to one expiration.**