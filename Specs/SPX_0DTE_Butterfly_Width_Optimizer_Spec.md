# SPX 0DTE Butterfly Width Optimizer

## Development Specification

### 1. Objective

Implement a **Butterfly Width Optimizer** inside the FatTail Options Lab
that continuously evaluates available SPX 0DTE symmetric butterfly
widths and identifies which width currently offers the most favorable
asymmetric characteristics.

The optimizer should answer one practical question:

> **Given the current option surface, which butterfly width provides the
> best combination of cost efficiency, convexity, responsiveness, payoff
> potential, and call/put asymmetry for the current market
> environment?**

The initial implementation should evaluate symmetric butterfly widths
of:

**10, 15, 20, 25, 30, 35, 40, 45, and 50 points.**

The architecture should permit additional widths later without changing
the scoring framework.

------------------------------------------------------------------------

## 2. Core Design Principle

Width should not be selected from VIX or another single volatility
measure alone.

Two sessions can have similar volatility readings while their butterfly
surfaces behave very differently. The optimizer should therefore select
width from the **actual current option surface**.

The system should evaluate the economic and geometric behavior of
butterflies across widths, using the live option chain and the
calculations already available within Options Lab.

The desired output is not simply the cheapest width, the highest nominal
reward-to-risk width, or the width with the largest gamma.

The objective is to identify the width where the butterfly currently
offers the strongest **usable convexity per unit of cost**, while
accounting for:

-   debit,
-   maximum payoff,
-   risk-to-reward,
-   delta,
-   gamma,
-   theta,
-   surface slope,
-   surface curvature,
-   call/put asymmetry,
-   strike-to-strike stability,
-   and the consistency of those characteristics across the relevant
    strike region.

------------------------------------------------------------------------

## 3. Universe

### Instrument

Initial implementation:

-   SPX
-   0 DTE
-   symmetric long butterflies

### Sides

Evaluate:

-   Calls
-   Puts

The optimizer should calculate both sides independently and then combine
the information when measuring width-level call/put symmetry or
asymmetry.

### Widths

Evaluate:

`10, 15, 20, 25, 30, 35, 40, 45, 50`

### Strike Region

The optimizer should evaluate a configurable strike region around spot.

Recommended initial default:

**±50 SPX points around spot**

The system should operate on multiple strikes rather than using a single
butterfly centered at one strike. This prevents one noisy quote or
anomalous structure from determining the width recommendation.

------------------------------------------------------------------------

## 4. Required Source Data

Use the live option-chain/API data already available to Options Lab.

At minimum, the optimizer should have access to the underlying inputs
necessary to calculate or retrieve:

-   bid
-   ask
-   mark/mid
-   option price
-   strike
-   expiration
-   option type
-   spot
-   implied volatility
-   delta
-   gamma
-   theta
-   vega, if available
-   open interest, if available
-   volume, if available

Use the platform's existing butterfly construction and analytics engine
wherever possible rather than creating parallel calculations.

------------------------------------------------------------------------

## 5. Butterfly-Level Calculations

For every valid butterfly at every width and center strike in the
evaluation region, calculate or retrieve:

### Debit

Current estimated cost of the long butterfly.

### Maximum Value

For a symmetric butterfly of width (W):

`Max Value = W`

expressed in SPX option points before contract multiplier.

### Maximum Profit

`Max Profit = Width - Debit`

### Risk-to-Reward

Use the existing Options Lab Risk-to-Reward implementation if already
standardized.

Conceptually:

`Reward / Risk = (Width - Debit) / Debit`

### Greeks

Capture the butterfly's:

-   Delta
-   Gamma
-   Theta

Vega may also be retained for research even if it is not initially
included in the ranking score.

### Surface Geometry

Capture the existing:

-   Slope
-   Curvature

These should be calculated consistently with the current Heatmap/Surface
implementations.

### Call/Put Asymmetry

Use the existing Call/Put Asymmetry calculation when available.

The optimizer should preserve the raw value as well as a normalized
value suitable for cross-width comparison.

------------------------------------------------------------------------

## 6. Derived Width Metrics

The optimizer should convert the raw butterfly data into width-level
metrics.

These metrics are evaluated across the relevant strike region rather
than from a single cell.

### 6.1 Debit Efficiency

Measures how much width is being purchased for the debit paid.

Example normalized formulation:

`Debit Efficiency = 1 - (Debit / Width)`

Higher is generally preferable, subject to the butterfly retaining
sufficient responsiveness.

------------------------------------------------------------------------

### 6.2 Convexity Efficiency

Measures gamma/curvature obtained per unit of debit.

Candidate formulations should include:

`Gamma Efficiency = |Gamma| / Debit`

and

`Curvature Efficiency = |Curvature| / Debit`

The development implementation should retain the components separately
so weighting can be calibrated empirically.

------------------------------------------------------------------------

### 6.3 Theta Efficiency

Measures the amount of time-decay burden relative to the convexity being
purchased.

Candidate formulation:

`Theta Efficiency = Convexity Measure / |Theta|`

The goal is not to maximize theta or minimize theta independently. It is
to determine whether the butterfly is receiving sufficient convexity for
the decay being paid.

------------------------------------------------------------------------

### 6.4 Payoff Efficiency

Measures available maximum profit relative to capital at risk.

Candidate formulation:

`Payoff Efficiency = (Width - Debit) / Debit`

This can use the existing Risk-to-Reward value if equivalent.

------------------------------------------------------------------------

### 6.5 Surface Responsiveness

Measures whether the butterfly value is meaningfully responsive to
changes in underlying price.

This should incorporate some combination of:

-   Delta
-   Gamma
-   Slope
-   Curvature

The purpose is to distinguish a cheap butterfly from a butterfly that is
both cheap **and capable of changing value efficiently when SPX moves**.

------------------------------------------------------------------------

### 6.6 Surface Stability

Measure how smoothly the width behaves across adjacent center strikes.

For each width, calculate dispersion or local discontinuity in:

-   debit,
-   gamma,
-   slope,
-   curvature,
-   and other principal scoring metrics.

Possible measures include:

-   standard deviation,
-   median absolute deviation,
-   first-difference variance,
-   percentage of neighboring cells exceeding an anomaly threshold.

A width receiving a strong score from one isolated cell but behaving
erratically across nearby strikes should receive a stability penalty.

This is especially important early in the session when quotes and
surface geometry can be unstable.

------------------------------------------------------------------------

### 6.7 Call/Put Asymmetry Opportunity

Measure whether one side of the butterfly surface currently offers
meaningfully better economics or responsiveness than the other at the
same width.

The system should distinguish between:

1.  **normal call/put differences**, and
2.  **material asymmetric opportunity**.

The score should consider both the magnitude and persistence of the
asymmetry across nearby strikes.

A one-cell asymmetry should carry substantially less weight than an
asymmetry visible across a coherent region of the surface.

------------------------------------------------------------------------

## 7. BOS --- Butterfly Opportunity Score

Create a composite **Butterfly Opportunity Score (BOS)** for each width.

BOS should answer:

> **How attractive is this butterfly width, given its current cost,
> payoff, convexity, responsiveness, stability, and asymmetric
> characteristics?**

Recommended conceptual model:

`BOS = weighted combination of normalized component scores`

Initial components:

-   Debit Efficiency
-   Payoff Efficiency / Risk-to-Reward
-   Gamma Efficiency
-   Curvature Efficiency
-   Theta Efficiency
-   Surface Responsiveness
-   Surface Stability
-   Call/Put Asymmetry Opportunity

All components should first be normalized across the widths being
compared.

### Important

Do **not** hard-code the component weights deeply into the
implementation.

Weights should be configurable so historical testing can determine which
combination best predicts useful butterfly behavior.

The system should retain:

-   raw component values,
-   normalized component values,
-   weights,
-   final BOS.

This allows the optimizer's recommendation to remain explainable.

------------------------------------------------------------------------

## 8. Width-Level Aggregation

For each width, aggregate the strike-level observations into a robust
width score.

Prefer robust statistics such as:

-   median,
-   trimmed mean,
-   percentile bands,
-   median absolute deviation.

Avoid relying solely on arithmetic averages when the surface contains
obvious quote anomalies.

Suggested workflow:

1.  Calculate metrics for every valid center strike.
2.  Identify obvious data-quality outliers.
3.  Calculate robust central values for each metric.
4.  Calculate stability/dispersion measures.
5.  Normalize metrics across widths.
6.  Calculate BOS.
7.  Rank widths.

------------------------------------------------------------------------

## 9. Confidence Score

Every width recommendation should include a **Confidence Score**.

Confidence should increase when:

-   neighboring strikes agree,
-   call/put data is internally coherent,
-   quotes are stable,
-   metrics persist across multiple snapshots,
-   the winning width has a meaningful score advantage.

Confidence should decrease when:

-   the surface contains discontinuities,
-   bid/ask quality is poor,
-   adjacent cells disagree materially,
-   rankings change rapidly,
-   the top widths have nearly identical BOS values,
-   the current snapshot appears structurally noisy.

Suggested display:

`Confidence: 0–100`

or:

`Low / Medium / High`

Internally retain the numeric value.

------------------------------------------------------------------------

## 10. Temporal Stability

Do not evaluate the optimizer solely from one instantaneous snapshot.

Where historical snapshots are available, calculate persistence over
recent observations.

Track:

-   current BOS,
-   previous BOS,
-   BOS change,
-   rank change,
-   time spent as top-ranked width,
-   confidence trend.

This is particularly important near the open, when the option surface
may temporarily produce unstable or anomalous geometry.

A width should receive additional confidence when its superiority
persists across multiple snapshots.

------------------------------------------------------------------------

## 11. Data-Quality Controls

The optimizer must detect and down-weight or reject obviously unreliable
structures.

Potential flags include:

-   negative long-butterfly debit caused by quote artifacts,
-   crossed markets,
-   missing legs,
-   extremely wide bid/ask spreads,
-   impossible or highly discontinuous neighboring values,
-   stale quotes,
-   isolated gamma/slope/curvature spikes,
-   insufficient valid strikes for a width.

Each width should expose a data-quality status.

Example:

`Data Quality: Good / Fair / Poor`

Poor-quality widths should not be allowed to win the optimizer merely
because corrupted inputs create an extreme metric.

------------------------------------------------------------------------

## 12. Ranking Output

The primary output should be a ranked width table.

Example:

  ------------------------------------------------------------------------------------
     Rank   Width     BOS   Confidence   Debit   Convexity     R:R   Stability     C/P
                                          Eff.        Eff.                        Asym
  ------- ------- ------- ------------ ------- ----------- ------- ----------- -------
        1      20      82           88      79          86      81          91      73

        2      25      78           84      75          82      85          87      69

        3      15      69           76      86          73      67          72      78
  ------------------------------------------------------------------------------------

Values above are illustrative only.

The interface should clearly identify:

**Preferred Width**

and preferably:

**Secondary Width**

This prevents a false impression of precision when two widths are
effectively tied.

------------------------------------------------------------------------

## 13. Recommendation Logic

The optimizer should not force a recommendation when the evidence is
weak.

Possible states:

### Strong Preference

One width has a materially higher BOS and sufficient confidence.

### Moderate Preference

One width leads, but neighboring widths remain competitive.

### No Clear Preference

Several widths have statistically/economically similar scores.

### Unstable Surface

Data quality or temporal instability is too high to produce a reliable
ranking.

This distinction is important. **"No reliable width yet" is a valid
output.**

------------------------------------------------------------------------

## 14. Explainability

The optimizer should explain *why* a width ranks first.

Example:

> **Preferred Width: 20**
>
> BOS: 82\
> Confidence: 88%
>
> Primary factors:
>
> -   high convexity per dollar
> -   favorable debit relative to width
> -   strong payoff efficiency
> -   stable curvature across nearby strikes
> -   persistent call/put asymmetry
>
> 15-wide is cheaper but has materially lower surface stability.
>
> 25-wide offers slightly better nominal payoff but requires
> substantially more debit without a proportional increase in
> responsiveness.

The explanation should be generated from actual component-score
differences rather than generic canned text.

------------------------------------------------------------------------

## 15. Visualization

Add a compact width-optimization panel to Options Lab.

Recommended visualization:

### Width Score Strip

Display widths horizontally:

`10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50`

For each width show:

-   BOS
-   confidence
-   rank
-   data-quality indicator

The preferred width should be visually obvious.

### Expanded View

Clicking a width should expose:

-   raw metrics,
-   normalized metrics,
-   component BOS contributions,
-   call score,
-   put score,
-   asymmetry,
-   stability,
-   recent BOS history.

------------------------------------------------------------------------

## 16. Snapshot / Historical Support

The optimizer should be designed so every calculation can be serialized
into a timestamped snapshot.

Each snapshot should include:

-   timestamp,
-   spot,
-   expiration,
-   evaluated strikes,
-   evaluated widths,
-   raw butterfly values,
-   Greeks,
-   slope,
-   curvature,
-   call/put asymmetry,
-   derived metrics,
-   BOS component scores,
-   final BOS,
-   confidence,
-   ranking,
-   data-quality flags.

This enables later replay, historical research, and calibration without
requiring reconstruction from screenshots.

------------------------------------------------------------------------

## 17. Suggested JSON Output

``` json
{
  "symbol": "SPX",
  "expiration": "YYYY-MM-DD",
  "dte": 0,
  "timestamp": "ISO-8601",
  "spot": 0.0,
  "optimizer": {
    "preferred_width": 20,
    "secondary_width": 25,
    "state": "strong_preference",
    "confidence": 88,
    "widths": [
      {
        "width": 20,
        "rank": 1,
        "bos": 82.0,
        "confidence": 88.0,
        "data_quality": "good",
        "components": {
          "debit_efficiency": 79.0,
          "payoff_efficiency": 81.0,
          "gamma_efficiency": 86.0,
          "curvature_efficiency": 84.0,
          "theta_efficiency": 76.0,
          "surface_responsiveness": 85.0,
          "surface_stability": 91.0,
          "call_put_asymmetry": 73.0
        }
      }
    ]
  }
}
```

The schema should be extended to preserve raw strike-level observations
used to create the aggregate scores.

------------------------------------------------------------------------

## 18. Configuration

Expose the following as configuration rather than fixed implementation
constants:

-   evaluated widths
-   strike range around spot
-   minimum valid strike count
-   metric normalization method
-   BOS component weights
-   outlier thresholds
-   quote-quality thresholds
-   snapshot persistence window
-   confidence thresholds
-   ranking/tie threshold

This will allow rapid calibration without rebuilding the optimizer.

------------------------------------------------------------------------

## 19. Calibration and Research Mode

The first implementation should be treated as a measurable ranking
engine rather than assuming the initial BOS weights are optimal.

Persist enough information to answer historically:

-   Which width ranked highest?
-   How large was its advantage?
-   How stable was that ranking?
-   Which component metrics drove the recommendation?
-   How did the surface evolve afterward?
-   Which metrics were most predictive of useful butterfly
    responsiveness?
-   Did different intraday periods favor different metric weights?
-   Did the best scoring framework change across volatility regimes?

The architecture should make it straightforward to optimize BOS weights
from historical observations.

------------------------------------------------------------------------

## 20. Implementation Sequence

### Phase 1 --- Calculation Engine

Build:

-   width universe,
-   butterfly construction,
-   raw metrics,
-   normalized metrics,
-   stability calculations,
-   BOS,
-   confidence,
-   ranking.

### Phase 2 --- UI

Build:

-   preferred-width display,
-   ranked width strip/table,
-   component breakdown,
-   explanation layer.

### Phase 3 --- Snapshot Persistence

Store complete optimizer snapshots for historical comparison and replay.

### Phase 4 --- Calibration

Use accumulated historical data to test:

-   BOS weights,
-   normalization,
-   confidence rules,
-   stability thresholds,
-   persistence requirements.

------------------------------------------------------------------------

## 21. Acceptance Criteria

The feature is complete when the system can:

1.  Evaluate all configured SPX 0DTE butterfly widths from the live
    chain.
2.  Calculate the required raw and derived metrics for calls and puts.
3.  Aggregate results robustly across the configured strike region.
4.  Detect and penalize unstable or corrupted surface data.
5.  Calculate a transparent BOS for every width.
6.  Rank the widths in real time.
7.  Produce a preferred and secondary width when justified.
8.  Return "No Clear Preference" or "Unstable Surface" when justified.
9.  Generate a confidence score.
10. Explain the principal quantitative reasons for the ranking.
11. Persist the complete state as structured snapshot data.
12. Permit metric weights and thresholds to be changed without modifying
    core calculation code.

------------------------------------------------------------------------

## 22. Development Principle

The optimizer should remain **data-driven, explainable, configurable,
and testable**.

The key research hypothesis is:

> **The optimal butterfly width is encoded in the shape and economics of
> the live butterfly surface and can be identified by comparing cost,
> convexity, responsiveness, stability, and call/put asymmetry across
> widths.**

The implementation should therefore preserve as much underlying data as
practical and avoid collapsing the system prematurely into a single
opaque score. BOS is the ranking layer; the underlying surface
measurements remain the source of truth.
