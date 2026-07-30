# RT07-5-G — Clustering, trends, correlation (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS**

## Deliverable

### Backend (`retrospective_domain.py`)
- `build_clustering()` — Spec §8.2
  - Co-occurrence: Context tags × rule-break days; Behavior tags × rule-break days; no-routine days × rule-breaks
  - Observation language only; note that trader names cause (step 5)
  - No market-regime inference
- `build_period_trends()` — Spec §12
  - Rate-normalized series: avoidable-loss rate (broke/trades), followed+partial rate, routine days/week
  - Tag frequency per trade over periods (reported, never scored)
  - `TREND_MIN_CYCLES = 4`; below floor → `building_baseline`, `trend_asserted: false`, `direction: null`
- `build_correlation()` — Spec §13
  - Layers: behavior_to_process · behavior_to_damage (process damage only)
  - Adherence split (broke vs followed/partial rates)
  - Tag × rule-break day co-occurrence
  - `excludes: [pnl, win_rate, expectancy, profit]`
  - Guard: metrics keys + observation phrases cannot leak expectancy/win-rate/$ figures
- Gather attaches `clustering`, `trends`, `correlation`

### Frontend (`RetrospectiveWorkspace.tsx`)
- Step 4: co-occurrence statements + Context inventory + correlation panel (`data-excludes-pnl`)
- Trends card (rates only; floor messaging; tag series when readable)

### Tests
```
pytest tests/test_retrospectives.py -q  # 42 passed
test_trend_floor_no_direction_below_min
test_correlation_never_pnl_surface
test_clustering_and_trends_on_gather
test_rt24_clustering_ui_source
```

### Evidence claims
| Claim | Evidence |
|-------|----------|
| Co-occurrence is observation-only | `clustering.note` + statements; step 5 still trader-authored cause |
| No trend below floor | `TREND_MIN_CYCLES=4`; maiden → `building_baseline` |
| Rates not raw counts across windows | series points carry `trade_count` / `window_days` |
| No P&L correlation | `excludes` list; grep $ / expectancy / win rate in observations |
| Tags never score | `trends.feeds_indicator: false`; tag series labeled reported-not-scored |

## Out of scope
- R6 interruption polish (partial already)
- Keep-rate + specificity trend co-display (habit assess path; floor still applies)
