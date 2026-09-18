# VPS2b — all-history running per-row totals (Q6 = (c))

**Authorized by:** AZ-VP-9-A12.7 · **DL-742**.  
**Parent token:** VPS2-W0 (session + developing still the live Engine kinds).  
**Does not:** publish `kind=composite`. That fence stays for the *route*. This item builds the **backing store**.

## Job

All-history running per-row totals:

- **incremental** (grows with each backfill tranche; bin-as-you-land)
- **deterministic**
- **parameter-hashed**
- **rebuildable**

**Dev first** (StudioTwo local store). **Prod** per standing footprint — RTH-safe read/write under `{LABS_MARKET_DATA_ROOT}/vp/engine/` only, or tonight's 16:05 autorun. **0** new Massive connections. Kill switch = Engine job only; never `chain_feed`.

Until this serves, the display backs on `GET /v1/profile/{target}/range?from={floor}&to={ceiling}` (Contract v1.1, coverage-honest).

A dedicated composite endpoint is a later optimization — proposed, not improvised.
