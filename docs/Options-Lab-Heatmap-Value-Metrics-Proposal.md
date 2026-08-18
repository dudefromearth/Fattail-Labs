# Heatmap Value Metrics Proposal — source + as-built map

**Source (Coach):** [`Heatmap-Value-Metrics-Proposal.pdf`](./Heatmap-Value-Metrics-Proposal.pdf)  
(copied from `/Users/ernie/Downloads/Heatmap Value Metrics Proposal.pdf`)  
**Member explainer / help:** [`Options-Lab-Heatmap-Value-Modes.md`](./Options-Lab-Heatmap-Value-Modes.md) · `server/help_reference/options-lab-heatmap.md`  
**Logged:** **DL-442**

This proposal is **research intent**. It is **not** a promise that every
metric is shipped, and it is **not** member marketing. Coach later
amended several formulas in product (Long/Short flies, spatial % change,
package greeks). Those amendments sit **beside** this text; they do not
erase it.

## Objective (proposal)

Expand the Heatmap **Value** dropdown beyond static butterfly pricing so
the options surface can be studied as a real-time indicator of market
state.

**Research question:** What can the butterfly surface tell us about the
actual **intraday market regime** that VIX, spot, or a static gamma
measurement cannot?

## Proposed metrics (verbatim)

| Metric | What it measures | Research purpose |
|---|---|---|
| Debit | Current butterfly price | Raw surface |
| Credit | Current liquidation / exit value | Execution reality |
| % Change | Change from previous observation | Surface movement |
| R:R | Reward relative to capital at risk | Opportunity quality |
| Δ Debit | Dollar change over a fixed interval | First derivative — where the surface is moving |
| Δ² Debit | Change in Δ Debit | Second derivative — acceleration / deceleration |
| Velocity | Debit change per minute | Speed of repricing |
| Acceleration | Change in velocity | Potential regime-transition signal |
| Slope | Value change between adjacent center strikes | Surface gradient |
| Curvature | Change in slope across strikes | Shape and bending of the surface |
| Call/Put Asymmetry | Equivalent call vs put fly values | Directional / skew imbalance |
| Width Efficiency | Value response normalized by fly width | Comparison across 20/25/30/35/40/etc. widths |
| Time Decay | Value change attributable to time | Separates theta from market movement |
| Spot Sensitivity | Fly-value change per SPX point | Responsiveness of the surface to spot |
| Surface Stability | Persistence of surface shape through time | Stable regime vs reorganizing regime |

## Core research stack (proposal priority)

1. Debit — what does the surface look like?  
2. Δ Debit — where is it moving?  
3. Δ² Debit — is that movement accelerating?  
4. Curvature — what shape / regime is developing?  
5. Call/Put Asymmetry — is repricing symmetric or directional?

Together: heatmap as a potential **market-state sensor** (research
frame, not a shipped score).

## Gamma relationship (proposal)

Gamma / GEX describes **potential dealer hedging pressure**. It is not
all market flow; dealers are not always the dominant force. The
butterfly surface is another view of **what the options market is
pricing and how that pricing is changing**. Research question: do
changes in surface velocity, acceleration, curvature, and asymmetry
precede observable SPX behavior — and when is the apparent gamma regime
actually controlling price vs overwhelmed by outside flow?

## Potential composite (not shipped)

**Surface Regime Score (SRS)** = Velocity + Acceleration + Curvature +
Asymmetry + Stability, classifying
Stable/Compressed → Expanding → Directional → Unstable/Transitioning.
**Not built.** Needs a later spec if Coach opens that program.

## As-built map (2026-08-18)

Coach product amendments in the Heatmap Value menu:

| Proposal name | As-built menu | As-built calc | Notes |
|---|---|---|---|
| Debit | **Long/Debit** | +1/−2/+1 package mid | Unchanged geometry |
| Credit | **Short/Credit** | −1/+2/−1 signed package | Not “long debit + CR chip” |
| % Change | **% Change (debit)** | `|(D_inner − D_outer) / D_inner| × 100` from spot outward | **Amended:** proposal was *previous observation* (time). Product is **spatial** debit change. Absolute value. |
| R:R | **Risk to Reward** | `(w − D) / D` | Matches “reward relative to capital at risk” for a long fly |
| Δ Debit | **Delta** | listed `+Δ_{K−w} − 2Δ_K + Δ_{K+w}` | **Amended:** proposal was $ change over a fixed interval (surface derivative). Product is **package chain Δ** (every strike has greeks). |
| Δ² Debit | **Gamma** | listed `+Γ_{K−w} − 2Γ_K + Γ_{K+w}` | **Amended:** proposal was 2nd derivative of debit. Product is **package chain Γ**. |
| — | **Theta** | listed `+θ_{K−w} − 2θ_K + θ_{K+w}` | Added. Related to proposal **Time Decay**, not the same (greek vs isolated time P&L). |
| Velocity | hidden | debit / minute vs last generation | **Hidden** until a real series exists (DL-440) |
| Acceleration | hidden | Δ velocity | Same |
| Slope | **Slope** | `(D_i − D_{i+1}) / (K_i − K_{i+1})` | Matches “value change between adjacent centers” |
| Curvature | **Curvature** | change in slope on a uniform triple | Matches “change in slope across strikes” |
| Call/Put Asymmetry | **Call/Put asym** | call-fly debit − put-fly debit | Matches |
| Width Efficiency | not shipped | — | Flagged |
| Time Decay | not shipped (Theta is cousin) | — | Flagged |
| Spot Sensitivity | not shipped | — | Flagged |
| Surface Stability | not shipped | — | Flagged |
| SRS | not shipped | — | Flagged |

**Opinion (not a constraint):** Proposal Δ Debit / Δ² Debit as
*surface* first/second derivatives can still be researched later under
new names so they do not collide with listed Delta / Gamma.

## Flagged (not shipping now)

Width Efficiency · Time Decay (as isolated time P&L) · Spot Sensitivity ·
Surface Stability · Surface Regime Score · Velocity / Acceleration
(menu) until a debit time series exists.
