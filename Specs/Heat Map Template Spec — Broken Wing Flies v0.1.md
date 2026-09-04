# Heat Map Template Spec — Broken Wing Flies

**Surface:** Options Lab → Heat Map runner
**Parent template:** Advanced Flies (shell, chrome, chain binding, Analyzer handoff)
**Sibling:** Shopper (symmetric) — everything not stated here is inherited from `shopper-heatmap-template-spec` unchanged: data contract, scale detection, seat scoring, hover, clipboard, handoff payload, states, instrumentation, gates.
**Naming:** "broken wing" is the standard term; "asymmetric fly" is an alias in copy and search, never the title.
**Status:** Spec v0.1 — input to the standard pipeline.

---

## 1 · Purpose

The same scoring surface as Shopper, applied to broken-wing flies — one wing wider than the other. The structure changes three things that a symmetric template never has to think about: **which side is wide, how narrow the narrow side is, and the fact that max loss is no longer the debit.** This spec is those three things, plus the risk graph they make necessary.

---

## 2 · Structure and the width rule

A broken-wing fly is `+1 K_near · −2 K_body · +1 K_far` with `W_near = |K_body − K_near|` and `W_far = |K_far − K_body|`, `W_near ≠ W_far`.

**Template standard: the tile column width always refers to the larger of the two widths.** Rows are the wide width `W_wide ∈ {2 … 10}` strikes (10–50 points on SPX), rendered in points per the scale detection in the Shopper spec §4b. Columns are the near strike.

Which side is wide, and how narrow the other side is, are controls (§3). A cell is one fully specified fly given the two controls plus its row and column.

---

## 3 · Controls — additions to the Shopper strip

| Control | Type | Default | Behaviour |
|---|---|---|---|
| **Wide side** | segmented: Far / Near | **Far** | Selects which spread the column width refers to. `Far` is the classic broken wing (wide far wing); `Near` is the inverted form (wide near wing, narrow far) |
| **Narrow side** | segmented: Auto / 1 / 2 / 3 / 4 / 5 strikes | **Auto** | `Auto` = one strike narrower than the wide side, per row. `1–5` fixes the narrow side at that many strikes for every row |

**Validity.** The narrow side must be at least 1 strike and strictly less than the wide side:

```
1 ≤ W_narrow < W_wide
```

Rows where the selector violates that — `Narrow = 4` on the 2-, 3- and 4-strike rows, say — are shown **hatched with the reason** (`narrow ≥ wide`), not hidden and not silently clamped. The row stays visible so the trader can see why the control emptied it. `Auto` is always valid on every row from 2 strikes up.

**Both controls recolour and rebuild the grid; neither changes the scoring weights.**

---

## 4 · Max loss is not the debit — and the template has to say so

This is the one place the two templates differ in *risk*, not just shape. For a long broken wing, the value beyond the far wing at expiry is `W_near − W_far`:

| Wide side | Beyond the far wing | **Max loss** |
|---|---|---|
| **Far** (default, classic) | `W_near − W_far < 0` — a further loss | **debit + (W_far − W_near)** |
| **Near** (inverted) | `W_near − W_far > 0` — residual value kept | **debit** |

So with the default control the structure carries a second, larger loss zone past the far wing, and the doctrine line "the debit is the max loss" is **false** for it. The template must never let a trader believe otherwise:

- **`risk` in every score, every ratio, and every tooltip = max loss + entry friction**, side-aware. Not the debit.
- The panel shows **Max loss (near side)** and **Max loss (far side)** as two separate numbers, and the larger is labelled **MAX LOSS** in the stop colour.
- A broken wing entered for a **credit** (possible when the far side is wide enough) shows near-side max loss as `0 − credit` (a guaranteed gain on that side) and far-side max loss as `W_far − W_near − credit`. The template supports credit structures; it does not hide the far-side loss behind the word "credit".
- The hover carries a seventh line for this template only: `max loss  ·  4.20 far side` (or `= debit` when Near is the wide side).

Because `risk` is side-aware, the same anchor and widths score differently under the two `Wide side` settings — which is correct, and is the reason the control exists.

---

## 5 · Click — the risk graph must be right

Everything in the Shopper click spec (§7) holds. The risk graph is where a broken wing punishes an approximation, so it is tightened here:

1. **Three curves, always:**
   - **T+0 — the at-the-money curve**: the position's value *right now*, across spot, at the current snapshot's time to expiry and per-leg IV. Brand orange, 2 px. This is the curve the trader is actually holding.
   - **Exit-time** curve at the `Exit` control's time. Orange, 1 px, dashed.
   - **Expiry** payoff. Grey, 1.5 px.
2. **Spot marker** — vertical dashed rule at current spot, labelled with the price, with a dot where it crosses the T+0 curve and the T+0 value at that point written beside it. The trader must be able to read "where am I on this curve" without hovering.
3. **x-range must include the far-side loss zone.** Symmetric flies can stop just past the far wing; a broken wing cannot. Range: `[K_near − 0.75σ, K_far + max(1.5σ, 1.5·W_far)]` (mirrored for puts), so the curve visibly goes below zero past the far wing when it does.
4. **y-axis in multiples of side-aware max loss**, zero line drawn, and the far-side floor labelled with its value.
5. **Strike rules** at all three strikes, with the two widths annotated (`15 · 25`).
6. **Breakevens** marked on the expiry curve — there are two for the default form, and the upper one moves with the narrow/wide choice.
7. **Same pricer as the Analyzer.** Non-negotiable here: an approximated T+0 curve on a broken wing will show the wrong sign of gamma near the body, and that's the exact thing a trader clicks to check.

Numbers block adds: `max loss near`, `max loss far`, `upper breakeven`, `credit/debit` sign.

---

## 6 · Order string

Same generator as Shopper. Two notes specific to this template:

- Emit `BUTTERFLY` with the three strikes; unequal widths are expressed by the strikes themselves. ToS is *believed* to accept this, and the one documented rejection in the wild was a position-effect issue, not nomenclature — **but it is unconfirmed, and every structure in this template is unbalanced, so confirm on a live ticket before release.** The leg-by-leg fallback string is shown under a disclosure on every proposal, not hidden.
- Credit structures emit `SELL −1 BUTTERFLY … @price LMT` with the credit as the price. Verify the sign convention on the ticket.

---

## 7 · Configuration is strategy — the per-leg vol math, measured

The reason this template exists is not that a broken wing is a variant of a fly. It's that **the two controls produce structurally different trades**, and the difference lives in the per-leg vol exposure. Priced on the reference chain, same near strike and body throughout:

| Hours to expiry | Structure | Debit | Vega share K1 / K2 / K3 | **Net vega** | Character |
|---|---|---|---|---|---|
| **1h** | symmetric 30/30 | 2.97 | 70 / 29 / 1 | **+0.29** | long vol, theta harvest |
| | wide far 30/60 | 2.96 | 71 / 29 / 0 | +0.28 | vol-identical to symmetric; adds far-side loss for nothing |
| | wide near 60/30 | 16.22 | 75 / 25 / 1 | +0.40 | near leg is ATM — a different, expensive trade |
| **3h** | symmetric 30/30 | 4.73 | 42 / 49 / 9 | **≈ 0** | vol-neutral |
| | wide far 30/60 | 4.20 | 45 / 53 / 2 | **−0.14** | **short vol** — the far wing is now a real sale |
| | wide near 60/30 | 19.14 | 43 / 48 / 9 | +0.10 | long vol |
| **6h** | symmetric 30/30 | 4.60 | 33 / 51 / 15 | −0.12 | short vol |
| | wide far 30/60 | **2.58** | 36 / 56 / 8 | **−0.49** | strongly short vol, 44% cheaper than symmetric |
| | wide near 60/30 | 19.66 | 34 / 51 / 15 | −0.07 | ≈ flat |

Three things fall out, and each one is a spec requirement:

**The sign of net vega flips with time and configuration.** The same fly is a long-vol trade in the last hour and a short-vol trade in the morning. The wide-far broken wing is the most short-vol structure on the board by mid-morning, and in the last hour it is vol-identical to a symmetric fly while carrying a far-side loss zone the symmetric doesn't have. A trader choosing between configurations is choosing *which kind of trade to be in*, not a shape preference.

→ **The panel and the hover show net vega and net gamma with sign, and a one-word character tag** (`long vol` / `short vol` / `flat`) derived from them. Selection is strategic only if the exposure is legible before the click.

**The seat vega shares are time-dependent.** 70 / 29 / 1 was a one-hour snapshot. At six hours it's 33 / 51 / 15, and the body — not the near wing — carries the most vol. The fixed seat weights in the Shopper spec are a final-hour calibration.

→ **Seat weights are computed from live per-leg vega each snapshot**, not hard-coded. `near`, `body`, `far` scores keep their form; the coefficient on the vol residual term in each is scaled by that leg's current share of gross vega. This is the change that lets one template serve 9:35 and 3:05 without retuning.

**The far wing goes from irrelevant to material across the day.** At one hour a vol point on the far wing moves the debit 0.0–0.2%. At six hours it moves it 12–15%. The claim in the symmetric spec that the far wing "has no scarcity" is a final-hour statement.

→ **The far-seat score re-enables its vol term** when that leg's live vega share exceeds a threshold (template parameter, default 5%). Below it the friction-and-fill formula applies. When the far wing is the *wide* side and the term is live, locally rich is good — you are effectively short there.

The `Wide side = Near` form is its own case: the near strike sits at or in the money, the debit is 5–6× a symmetric fly, and `debit/width` runs ~27% — far outside the convexity band. The σ gate will exclude most of these rows by construction, which is correct; the ones that survive should be tagged `ATM` on the tile so nobody mistakes them for the cheap-convexity trade the rest of the grid is showing.

---

## 8 · States — additions

| State | Trigger | Display |
|---|---|---|
| `NARROW ≥ WIDE` | selector ≥ row width | row hatched, reason on hover |
| `FAR SIDE LOSS` | any selected structure with `W_far > W_near` | persistent stop-colour tag on the panel header until deselected |

---

## 9 · Gates — additions to the Shopper set

**G0b — controls.** `Wide side` and `Narrow side` rebuild the grid per §2–3; `Auto` yields `W_wide − 1` on every row; fixed selectors hatch the invalid rows with the reason; nothing is clamped.

**G4b — risk.** For a recorded snapshot, every tile's `risk` equals side-aware max loss + friction; flipping `Wide side` changes the scores; the panel's two max-loss numbers match the expiry curve's floors; the larger is labelled MAX LOSS.

**G4c — risk graph.** T+0, exit and expiry curves render; spot marker with T+0 value; x-range includes the far-side loss zone and the curve is visibly below zero there for the default form; breakevens match the Analyzer's; T+0 curve matches the Analyzer's pricer within rounding on five reference structures including one credit structure.

**G7b — character.** On the reference chain at 1h, 3h and 6h to expiry, the tile/hover/panel report net vega and net gamma with the correct sign for symmetric, wide-far and wide-near structures; the character tag flips from `long vol` to `short vol` on the wide-far structure between 1h and 3h; seat weights recomputed from live vega reproduce the share table in §7 within rounding; the far-seat vol term is off at 1h and on at 6h for the wide-far form.

**G5b — order.** `BUTTERFLY` string with unequal strikes; leg-by-leg fallback present on every proposal; credit structures emit `SELL −1`. Live-ticket confirmation of unbalanced `BUTTERFLY` acceptance recorded in the gate report.

---

## 10 · Open items

1. **Reading of the `Narrow side` control.** Specced as an absolute width (1–5 strikes) with `Auto = wide − 1`. If the intent was "strikes narrower than the wide side" (a reduction of 1–5), the validity rule becomes `N ≤ W_wide − 1` and the labels change; the grid mechanics are otherwise identical. Confirm.
2. **Credit structures on / off.** Supported as specced. If the template should be debit-only, gate them out and say so in the hover.
3. **Live-ticket confirmation** of ToS `BUTTERFLY` on unequal widths — before release, not after.
4. **Doctrine copy.** Anywhere the template or the show says "the debit is the max loss," this template needs the qualifier. Worth a one-line note in the Advanced Flies help text too.

---

*Sibling of `shopper-heatmap-template-spec`. Structural analysis behind §4 is in `broken-wing-far-side-analysis` and `broken-wing-shape-addendum`.*