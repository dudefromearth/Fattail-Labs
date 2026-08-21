# Characterization list — Width Fit AT-WF1…12

**W2-G analog:** this file is the lock for **WF4**. Kilo owns tests. Delta does not PASS WF4 without command evidence for every row.

Source: Width Fit Spec v0.1 §11 · plan v1.0 §9.

| Id | Assert | Owner |
|----|--------|-------|
| **AT-WF1** | `width_fit` / components recompute on each applied generation; valueMode or weight change → zero extra Massive | Kilo |
| **AT-WF2** | Missing leg or non-listed \(K \pm w\) → invalid (HM7 / HM8) | Kilo · Hotel |
| **AT-WF3** | Wider columns → fewer valid centers near band edges; footer \(n\) matches | Kilo |
| **AT-WF4** | Isolated high cell down-weighted vs a coherent same-width region of similar raw scores | Kilo · Hotel |
| **AT-WF5** | Member weights re-score and can change cell / width order without chain re-fetch | Kilo |
| **AT-WF6** | Default preset produces a usable surface on a normal RTH fixture | Hotel · Kilo |
| **AT-WF7** | Sticky hysteresis §5.2.2; ordinary mid moves do not re-normalize | Kilo · Echo |
| **AT-WF8** | No forbidden vocabulary in labels, tooltips, or state text (Tango rules “best” / “top” / “strongest”) | Tango · Kilo |
| **AT-WF9** | “No reliable fit yet” / “Unstable Surface” reachable | Tango · Kilo |
| **AT-WF10** | Aggregates use only that width’s valid cells; \(n < min_valid_n\) is low-confidence, not high-fit | Kilo |
| **AT-WF11** | Negative debit, crossed market, extreme spread, null critical greek never yield a high fit. \(D\le 0\) = Templates §5.2.1 / `r2r` — **one** fixture | Hotel · Kilo |
| **AT-WF12** | Footer aggregates change when weights change (no re-fetch) | Kilo |

Forbidden strings (AT-WF8): Optimizer, BOS, Butterfly Opportunity Score, Preferred Width, Recommendation, Opportunity, Strong Preference, No Clear Preference (as product copy). Required: Width Fit, Fit score, Highest-fit width, Strong Fit, No Clear Fit / No reliable fit yet, Unstable Surface.
