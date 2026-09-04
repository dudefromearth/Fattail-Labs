# Heat Map Template Spec — Shopper (working title)

**Surface:** Options Lab → Heat Map runner
**Parent template:** Advanced Flies (inherits shell, controls chrome, chain binding, Analyzer handoff)
**Status:** Spec v0.1 — input to the standard pipeline (spec → multi-model review → build plan → decision-log entry)
**Owner:** Coach · **Build:** Agent Bench, Options Lab track

---

## 1 · Purpose

A heat map template that scores every tile by *opportunity under current conditions* rather than by a raw chain attribute, and turns a click into a built position: mini risk graph, spot location, thinkorswim order on the clipboard, and a one-button send to the Analyzer.

It is the same shell and interaction rhythm as Advanced Flies. What changes is the scoring model underneath the tile and the click payload on top of it.

**Doctrine fit:** capacity over dependency — the template narrows the field and builds the structure; the trader decides. Scores are rank-within-chain, never a P&L claim (no profit theater). Every stale, missing, or unfillable state is shown, never hidden (fail loud).

---

## 2 · Inherited from Advanced Flies (assumed — verify against the template standard)

The following are taken as given from the parent and are **not** re-specified here. If any is not actually provided by the standard, it becomes a new requirement in §11.

- Template shell: header, control strip, tile grid, side panel, footer status line
- Chain binding: symbol / expiry selection, snapshot subscription, stale-feed indicator
- Tile grid geometry, row/column headers, responsive scroll container
- Side panel container and its open/close behaviour
- Analyzer handoff mechanism (the transport — the *payload* is specified below)
- Entitlement gating (practice-entitled / Observer and above)
- Instrumentation hooks (view, hover, click, send events)
- Per-user control persistence

---

## 3 · Data contract — chain snapshots

**Source:** ChainStore snapshot stream (Studio One collector; 2-second cadence).

Per snapshot, per expiry, per strike, per side (C/P), the template requires:

| Field | Required | Used for |
|---|---|---|
| `bid`, `ask` | yes | mid, friction, closeability |
| `mid` (or computed) | yes | debit, greeks |
| `iv` | yes | per-leg pricing, residual |
| `oi` | yes | mass |
| `volume` | yes | mass corroboration |
| `delta`, `gamma`, `vega`, `theta` | preferred; computed if absent | ladder display, seat weighting |
| `size_bid`, `size_ask` | if available | depth gate |
| `last_trade_ts` | if available | NOT TRADED / closeability warning |

Plus snapshot-level: `spot`, `ts`, `expiry`, `settlement` (PM for SPXW), and remaining time to close.

**Derived, computed by the template per snapshot:**

- `T` — time to settlement, from `ts`
- `σ_pts = spot × iv_atm × √T` — one standard deviation of remaining move, in points
- `σ_out[K] = (K − spot) / σ_pts` — near-strike distance in σ
- `resid[K] = iv[K] − smooth_fit(iv)` — local vol dislocation in vol points, from a quadratic refit of the *actual* chain in log-moneyness
- `half_spread[K]`, `depth[K]` — from bid/ask/size; fallback to the OI-derived model when size is absent (labelled as modelled)

**Cadence:** compute at snapshot cadence (2s); **render throttled to ≤ 1 Hz** so tiles don't flicker. Show the snapshot timestamp on the status line. If no snapshot for > 10 s, the grid enters `STALE` (§9).

---

## 4 · Scoring model

Full derivation and rationale are in `heatmap-opportunity-scoring` and `shopper-scanner-spec`. The build-relevant summary:

**Three role scores per strike, never blended:**

```
near = .40·norm(−resid) + .25·norm(log OI) + .20·norm(−spread%) + .15·band(σ_out)
body = .40·norm(+resid) + .35·norm(log OI) + .25·norm(−spread%)
far  = .55·norm(−spread$)                  + .45·norm(log OI)
band(σ) = exp(−((σ − σ₀)/w)²)      σ₀ = 1.05, w = 0.45   (template parameters)
```

`norm()` = 2nd–98th percentile normalization within the current chain → 0–100. **Scores are ranks within this snapshot.** They are comparable across the grid, not across sessions, and the UI must label them as such.

**Structure score for a candidate `(K1, W1, W2)`:**

```
score = (.34·near[K1] + .30·body[K2] + .16·far[K3 | 70 if vertical])
        × (1 − min(friction/risk, 0.6))
        × (0.55 + 0.45·min(W1/debit, 40)/40)

hard gates (cell is hatched, not scored, if any fails):
  depth(K1) ≥ size · depth(K2) ≥ 2·size · depth(K3) ≥ size
  debit ≥ 4 ticks
  σ_out[K1] within [σ₀ − 2w, σ₀ + 2w]
```

**Structure:** symmetric flies. Width is the distance from the body to each long wing, and both wings sit the same number of strikes from the body. This matches Advanced Flies. (Asymmetric / broken-wing flies and verticals are **not** in this template; if wanted later they are a separate control or a sibling template — see §4a.)

**Grid:** rows = width `W`, expressed in **strikes** (2 … 10) and rendered in points for the detected underlying (§4b); columns = near strike. Each cell is one symmetric fly: `K_near`, body at `K_near ± W`, far wing at `K_near ± 2W`.

### 4a · Why the far-wing optimizer is out of this template

The earlier prototype optimized the far wing per cell. That work stands (see `broken-wing-shape-addendum`) but it changes the shape of the trade, and this template's job is to be the Advanced Flies scoring surface — same structures, better weights. Keep the two ideas separate so a trader who knows Advanced Flies sees the same grid with different colours, not a different instrument.

### 4b · Strike scale — widths are in strikes, points follow the underlying

The point widths 10 … 50 are only correct for SPX, where the near-the-money interval is 5 points. On XSP the same fly is one-tenth the size; on stocks the interval can be $0.50, $1, $2.50 or $5 — and fractional strikes like 1.50 and 2.75 are common. **The invariant is the width in strikes, not in points.**

The template detects the scale from the chain on every snapshot:

1. **Working range** = strikes within the σ band on the trading side (the region the gates will accept anyway).
2. **Interval** = the modal difference between consecutive listed strikes inside the working range. Ties resolve to the smaller interval.
3. **Candidate widths** = `W ∈ {2, 3, …, 10} × interval`, but a width is only offered if **both** wings exist as listed strikes for every column it would appear in. Chains that change interval inside the working range (SPX 5 → 25 further out; stocks $1 → $2.50) simply lose the rows that can't be built symmetrically; they are not approximated.
4. **Row labels** show both: `3 strikes · 15 pts` for SPX, `3 strikes · 3.00` for XSP, `3 strikes · 1.50` for a half-dollar stock.
5. **Tick size** is detected alongside the interval (minimum observed quote increment in the working range, cross-checked against a symbol config table). The `debit ≥ 4 ticks` gate and the order-price rounding (§7c) use the detected tick, not a hard-coded nickel.

Examples of what the same rule produces:

| Underlying | Interval | Widths offered (points) | Tick |
|---|---|---|---|
| SPX | 5 | 10, 15, 20 … 50 | 0.05 |
| XSP | 1 | 2, 3, 4 … 10 | 0.01 |
| $150 stock, $1 strikes | 1 | 2 … 10 | 0.01 / 0.05 by price |
| $40 stock, $0.50 strikes | 0.50 | 1.00, 1.50 … 5.00 | 0.01 |
| $600 stock, $2.50 strikes | 2.50 | 5, 7.50 … 25 | 0.05 |

The σ band does the rest. Because `σ_out` is scale-free, the same band parameters select sensible widths on every underlying without retuning — a 3-strike fly on XSP and on SPX land at the same σ distance and score the same way.

**Fail loud:** if no interval can be detected (fewer than 6 listed strikes in the working range, or no modal interval), the grid shows `NO SCALE` with the reason instead of guessing.

**Direction:** call side above spot for an up read, put side below for a down read. Template control (§5). Both sides may be shown stacked; default is the side matching the regime control.

All weights (`.40/.25/.20/.15`, `.34/.30/.16`, `σ₀`, `w`, the friction cap, the convexity scale) are **template parameters** exposed in an admin panel, not constants in code. They will be refit against the snapshot bank.

---

## 5 · Controls

Control strip, left to right. All persist per user except where noted.

| Control | Type | Default | Notes |
|---|---|---|---|
| **Regime** | segmented: Momentum ↑ / Momentum ↓ / Neutral | Neutral | Selects side and scenario weights. Shown on screen as an *assumption* |
| **Size** | number | 20 | Depth gate target, contracts |
| **Exit** | segmented: 3:15 / Settle | 3:15 | Sets `T_exit` for the risk graph and the exit-time valuation |
| **Gradient — rate** | slider, γ ∈ [0.25 … 4.0], log scale | 1.0 | See §6. This is the "rate of change in the gradient" |
| **Gradient — clip** | dual slider, percentile [p_lo, p_hi] | [2, 98] | Clamps outliers so one hot cell doesn't wash the ramp |
| **Gradient — steps** | segmented: continuous / 8 / 5 | 8 | Quantized ramps read faster on a stream |
| **Colour by** | segmented: Opportunity / Near seat / Body seat / Friction | Opportunity | Lets the trader look at one input at a time. Never a blended seat score |
| **⌖ Optimized pick** | button (not persisted) | — | Selects the highest-scoring tradable cell |

**Gradient rate — behaviour.** With `t` the normalized score in [0, 1] after clipping:

```
t' = t^γ
```

`γ < 1` brightens the mid-range — more tiles lit, good for a wide scan. `γ > 1` compresses the ramp toward the top — only the best few light up, good for on-air. `γ = 1` is linear. The slider is log-scaled so 0.5 and 2.0 are equidistant from 1.0. Live preview while dragging; no re-score, only re-colour.

**Ramp:** single hue, brand orange, dark → bright (`#241705 … #FF8C1A`). Hatched cells are gated out and never coloured. Ink flips to dark on the top ~45% of the ramp for legibility.

---

## 6 · Hover — simple, formatted, no state change

Custom tooltip, follows cursor, ≤ 250 px wide, appears within 80 ms, no delay on move between cells.

```
6530/6555/6560            ← structure, or "6530/6555 vertical"
debit           1.32
friction        13% of risk
peak / blow-thru  18.9x / 6.8x
near strike     1.10σ
fillable        20 lots
click to build
```

Six lines, that's the whole thing. No greeks, no curve, no why-string. Values come from the same computation the cell used, so hover and cell never disagree.

Hatched cell hover: one line — the gate that failed (`no fill at 20 · body depth 8`, `under 4 ticks`, `outside σ band`).

---

## 7 · Click — build the position

Click selects the cell (persistent ring) and does four things in the same gesture:

### 7a · Ladder highlight
The three strikes light up in the strike ladder in their seat colours (near = teal `#2FA79B`, body = orange `#D2790C`, far = periwinkle `#7C8CE8`), with a seat tag. If the ladder is collapsed, the panel shows the three legs with the same colours.

### 7b · Side panel — the proposal

Top to bottom:

1. **Legs** — qty, strike, seat tag, per-leg mid. Colour-coded by seat.
2. **Mini risk graph** — 300 × 100 px minimum, SVG:
   - x = spot, range `[spot − 0.75σ, spot + 3.25σ]` (or mirrored for puts)
   - y = P&L in **multiples of total risk** (debit + friction)
   - two curves: **exit-time** valuation (orange, 2 px) and **expiry** payoff (grey, 1.5 px)
   - vertical dashed marker at **current spot**, labelled
   - faint vertical rules at the three strikes
   - zero line
   - top-right label: peak multiple
   - **Must use the same pricing function the Analyzer uses**, or the two will disagree on air. Confirm the Analyzer's pricer is callable from the template (§11).
3. **Numbers** — debit, friction (abs and % of risk), total risk, peak ×, blow-through ×, fillable size.
4. **Why / Invalidation** — two mandatory strings, generated from the structure and regime, written to be read aloud. Templates for these strings are admin-editable.
5. **thinkorswim order** — read-only textarea + COPY button (§7c).
6. **SEND TO ANALYZER** — primary, full-width, brand orange (§7d).
7. **PASS · STAND DOWN** — secondary, side by side.
8. **Handoff log** — last N stamps, session-scoped.

### 7c · thinkorswim order → clipboard

Written to the clipboard **on click**, in the same gesture (the click is the user gesture the clipboard API requires). Also rendered in the panel with a COPY button.

Verified paste shape:

```
BUY +1 BUTTERFLY SPX 100 (Weeklys) 4 SEP 26 6530/6555/6560 CALL @1.30 LMT
BUY +1 VERTICAL  SPX 100 (Weeklys) 4 SEP 26 6530/6555      CALL @1.30 LMT
```

Rules:
- Quantity from the Size control.
- **Price = model mid rounded to the detected tick** (§4b). SPX is nickels; XSP and most stocks are pennies. Off-tick limits are rejected.
- **Expiry generated from the snapshot timestamp**, never hard-coded.
- **Symbol and expiry tag from the chain**: `SPX 100 (Weeklys)`, `XSP 100 (Weeklys)`, `AAPL 100` with `(Weeklys)` only when the expiry is a non-standard weekly. Multiplier 100 for standard contracts; read from the chain, don't assume.
- CALL for up-read structures, PUT for down-read.
- Clipboard write: `navigator.clipboard.writeText` → fallback `execCommand('copy')` on the textarea → fallback select-the-text with a visible "press ⌘/Ctrl+C" status. **Never fail silently.**
- Toast on success: *"Order copied — paste into ToS Order Entry."*
- Panel carries the standing line: *"Model mid, rounded to the nickel — not a fill. Verify every leg on the ticket before you send."*
- Unbalanced flies emit `BUTTERFLY`. No evidence ToS rejects unequal widths under that name, but it is unconfirmed — a leg-by-leg fallback string is generated and shown under a disclosure.

### 7d · Send to Analyzer

Payload — the PROPOSAL contract:

```
{
  ts,                       // stamped at push, before the trader reacts
  snapshot_ts,
  symbol, expiry, side,
  regime, size, exit,
  level:   { spot, sigma_pts, sigma_out },
  family:  "fly" | "vertical",
  slate:   [ {K1,K2,K3,W1,W2,debit,friction,risk,peak,floor,depth,score} ... ],
  pick:    index into slate,
  why, invalidation,
  tos_order
}
```

- **Slate, not single.** The panel's structure is the pick; the other tradable `W2` variants for the same anchor ride along so the adjacent comparison survives into the Analyzer. If the Analyzer accepts only one structure, it takes the pick and the slate is logged (§11).
- The Analyzer opens with the pick loaded and the risk graph matching §7b exactly.
- `PASS` and `STAND DOWN` post the same payload with the decision field set, so a pass is recorded at the flag moment.

---

## 8 · Strike ladder (secondary surface)

Collapsible, below the grid. One row per strike in the display range: strike, σ out, IV, local vol residual as a diverging bar (cheap = teal, rich = orange — the seat colours do the teaching), OI, depth, three seat-score bars, seat tag. This is the *read*; the grid is the *shop*. Keep them separate.

---

## 9 · States and fail-loud behaviour

| State | Trigger | Display |
|---|---|---|
| `LIVE` | snapshot age ≤ 10 s | normal |
| `STALE` | snapshot age > 10 s | grid desaturates, banner with age, cells still hoverable but click disabled |
| `NO FEED` | no snapshot this session | empty grid, banner, no hatching (hatching means "gated", not "unknown") |
| `NOT TRADED` leg | a leg has no bid or last trade age > threshold | cell hatched with reason; if already selected, panel shows a closeability warning |
| `GATED` | any hard gate fails | hatched, reason on hover |
| `ANALYZER UNREACHABLE` | send fails | button turns red, payload retained, toast with the error, retry available |

Nothing is ever silently frozen or silently empty.

---

## 10 · Instrumentation

Emit through the standard template hooks: `template.view`, `tile.hover` (throttled), `tile.select`, `order.copied` (with method: api/exec/manual), `proposal.sent`, `proposal.passed`, `proposal.standdown`, `control.changed` (name, value). Payload ids on send events so proposals can be joined to Analyzer opens and to trade-log entries later.

---

## 11 · Open items — resolve before build plan

1. **Confirm the Advanced Flies inheritance list (§2).** Anything not actually provided by the standard becomes a requirement here.
2. **Analyzer pricer.** Is the Analyzer's valuation callable from a template, so the mini risk graph and the Analyzer curve are the same function? If not, this template ships its own pricer and the two will drift — flag as a known defect from day one.
3. **Slate vs single on the Analyzer side.** Does the Analyzer accept a slate?
4. **Depth source.** Does ChainStore carry `size_bid/size_ask`? If not, depth is modelled from OI and the panel must say so.
5. **Friction model.** Use the fill-history-calibrated friction from the Strategy Lab fill simulator rather than the OI heuristic, once it's exposed.
6. **Put-side σ band.** The skew asymmetry work predicts the optimal far wing differs by direction; the band parameters may need to be per-side.
7. **Template name.** "Shopper" is a working title. Note there is an existing "Convexity" template — avoid collision.
8. **Exit control and settlement.** With Exit = Settle, the risk graph's exit curve is the expiry curve and the panel should say the settlement print is determined after 4:00 by the closing auctions.

---

## 12 · Acceptance — gate criteria

**G0 — scale.** On recorded SPX, XSP, a $1-strike stock, and a $0.50-strike stock chain, the template detects the interval and tick, offers widths of 2–10 strikes rendered in the right points, drops rows that can't be built symmetrically, and shows `NO SCALE` on a chain with fewer than 6 working-range strikes. Row labels carry both strikes and points.

**G1 — scoring.** Given a recorded snapshot, the grid reproduces the reference scores from `shopper3.py` (symmetric subset) within rounding; `corr(near, body)` is negative on the reference chain; zero cells in the top-50 by naive R:R survive the gates.

**G2 — controls.** Gradient rate slider changes colour only, never scores; dragging is live; clip and steps behave per §5; all persist per user.

**G3 — hover.** Six-line tooltip, ≤ 80 ms, values equal the cell's; gated cells show the failed gate.

**G4 — click.** Selection ring, ladder highlight in seat colours, panel renders legs / graph / numbers / strings; risk graph shows spot marker and both curves; numbers match the Analyzer's for the same structure.

**G5 — order.** Clipboard populated on click via API or fallback, never silent; string matches the verified shape; price on a nickel; expiry from snapshot date; COPY button works.

**G6 — handoff.** SEND opens the Analyzer with the pick loaded; payload matches §7d; `ts` precedes any decision field; PASS/STAND DOWN post with decision set.

**G7 — states.** STALE, NO FEED, NOT TRADED, GATED, ANALYZER UNREACHABLE each render per §9 on injected conditions.

**G8 — instrumentation.** All events in §10 fire with payload ids.

Orchestrator auto-GOes clean gates; stops only on a problem, with an explicit GO / NO-GO.

---

*Companion docs: `heatmap-opportunity-scoring`, `shopper-scanner-spec`, `per-leg-vol-analysis`, `runner-algo-design-spec`. Reference prototype: `shopper3.py` and the Convexity Heat Map artifact.*