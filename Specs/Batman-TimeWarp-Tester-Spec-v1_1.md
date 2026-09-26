# Batman / TimeWarp Tester — Spec v1.1

**Status:** v1.1 — frozen. Any change is v1.2 and a new file.
**Supersedes:** Batman-TimeWarp-Tester-Spec-v1_0.md (kept on disk as baseline; not law).
**Governed by:** Batman-TimeWarp-Tester-Standing-Orders-v1_0.md (invariants, free range, run condition).
**Repo:** ~/fattail-tapelab on StudioTwo, branch tester/batman-timewarp. Page on http://studiotwo.local:7420/
**Data source:** StudioOne archive at http://studioone.local:5055 via the token-gated `/api/fetch` and `/api/coverage` only.
**Author:** Coach, drafted with Claude, 2026-09-25.

### Changes from v1.0

| § | Change | Why |
|---|---|---|
| Header | Standing Orders named as governing document | Orders define invariants and free range; spec defines what is built |
| 2 | TimeWarp scope made conditional on archive expiry coverage | DTE check on 2026-09-24 found 0DTE only on all sampled symbol-days |
| 3 | Data path is token-gated `/api/fetch` + `/api/coverage` through the guarded client; open `/api/retrieve` routes out of scope | Open routes cap at 4000 snaps with no paging; fetch already pages, windows and asserts count parity |
| 3 | Wire size noted (~27 KB/snapshot, ~1 GB per full 2 s day) | Measured 2026-09-24; affects paging and cube-build design |
| 4 | Expiry added as an index dimension; `expiry` in header | A 1DTE/3DTE cube cannot be keyed without it |
| 6 | Rows carry `expiry` and `dte_at_entry` | Same |
| 11 | Q1 and Q2 decisions recorded | Answered 2026-09-24 |
| 12 | Removed — no open questions | — |

---

## 1. Purpose

Build a research harness that (a) backtests the two dual-OTM-butterfly strategies, Batman and TimeWarp, over the stored chain archive, (b) runs many parameter variants at once with Monte Carlo over fills, (c) measures the full set of mark-to-market peaks per trade so a profit-management rule can be designed from evidence, and (d) registers any variant as a standing forward walk that keeps evaluating every trading day.

The tester is the gate a variant passes before it walks. The walk is the out-of-sample test that never ends.

## 2. Definitions and scope

- **Dual fly:** one long call butterfly above spot and one long put butterfly below spot, entered together.
- **Batman:** dual fly, 0DTE, entered near the open (`entry_offset` minutes after 09:30 ET). **In scope for backtest, sweep and walk.**
- **TimeWarp:** dual fly, 1DTE, entered near the close of the prior session (`entry_offset` minutes before 16:00 ET); 3DTE on Fridays. **Scope is conditional on `/api/coverage`:** if the archive holds the next expiry for a symbol-day, TimeWarp is backtestable on those days; if it holds 0DTE only (the finding of 2026-09-24), TimeWarp is registered forward-walk-only and gathers rows from the first day a future collector change captures the next expiry. The collector change is out of scope for this build. Either way the evaluator, cube and registry support TimeWarp fully; only the available data differs.
- **Debit rule:** combined debit of both flies is 5–15% of the pair's max profit. Max profit = min(width_call, width_put) − combined debit. Symmetric mode adds a ±1% per-side tolerance around the midpoint split.
- **Symmetric / asymmetric:** as v1.0 — equal width and σ-distance both sides, or independent with a `split` parameter.
- **Peak set:** every local maximum of the MTM path from entry to exit persisting ≥ `peak_min_frames` consecutive frames.
- **Walk:** a frozen variant evaluated forward one trading day at a time from its registration date; backfilled rows before registration are tagged pre-seam.
- **Cube:** the derived per-symbol-day-expiry store of fly marks and per-leg vol/greeks at every snapshot, for every listed strike pair and every width in the width set.

## 3. Placement and data path (TOPO-1 and CP-1 apply)

| Component | Runs on | Notes |
|---|---|---|
| Guarded OPF client | StudioTwo, data-system/tester/ | Sole path to StudioOne. CP-1 clock guard on every request, no override. Token from STUDIOONE_ARCHIVE_TOKEN in process env. Pages `/api/fetch` by from_index/next_index across decimation levels; asserts page sum = count_on_disk and the day hash; respects the 4-slot pool. |
| Cube builder | StudioTwo now; StudioOne after close once promoted | Built through the client only. Never during RTH on StudioOne. Written in the permanent layout so promotion is a config change. |
| Cube store (this pass) | StudioTwo, Tape Lab data dir, memory-mapped | Full SPX+XSP slab fits in RAM (192 GB). |
| Evaluator (backtest + walk) | StudioTwo now; Dude two later | Same code path for both. Walks run from the evening queue. |
| Walk registry | StudioTwo, Tape Lab (sqlite) | Append-only results table. |
| Tester page + dashboard | Tape Lab site, StudioTwo | Consumer only; picks arrive from the Runner or a manual form. |

Wire size: measured ~27 KB per snapshot; a full 2 s day is ~37k snapshots, ~1 GB. The builder pages a day in bounded chunks, never holds a whole day's raw response in memory, and records effective resolution per day. The open `/api/retrieve` routes on :5055 are not a source for the cube or the evaluator.

## 4. Cube schema (permanent)

One file per `symbol/date/expiry`, versioned header. A symbol-day with several expiries is several files.

Header: `schema_version, symbol, date, expiry, dte_at_open, source (archive|opf_live), collector_version, capture_era (fixed_band|sigma_trail), snapshot_cadence_s, effective_step_s, strike_grid (absolute), width_set, frames_total, frames_unpriceable, frames_clamped, count_on_disk, day_hash`.

Arrays, float32, indexed `[snapshot, side, width, body_strike]`:

- `mark` — fly mid mark
- `bid`, `ask` — fly package bid/ask
- `iv_lower, iv_body, iv_upper` — per-leg IV
- `delta, theta` — package greeks (vendor-computed; recorded as such)
- `clamped` — flag
- `spot`, `vix`, `ts` — `[snapshot]`

Rules: index by **absolute strike**, never spot-relative; σ-placement is a computed view. Enumerate **every listed strike pair** for each width. Unpriceable frames are NaN, never dropped. Array layout within these constraints is §3 free range under the Standing Orders and is recorded in the idea log.

Width set this pass: SPX {15, 20, 25}; XSP {2, 3}.

## 5. Strategy template

One template, two registered instances. Parameters as v1.0:

```
strategy: batman | timewarp
symbol: SPX | XSP
dte_rule: 0 | 1 (→3 on Friday)
entry_offset_m
width_call, width_put
placement_mode: symmetric | asymmetric
sigma_call, sigma_put
debit_pct_min, debit_pct_max (default 5, 15; of pair max profit)
split (call share; symmetric → 50 ±1 per side)
exit_rule: hold_to_expiry | target_R:<x>
peak_min_frames: default 5
fill_model: id + version
```

Selection at entry: from the entry snapshot only, enumerate all pairs satisfying width, placement and debit constraints; take the pair closest to target σ and split, or in sweep mode take all.

## 6. Evaluator (shared by backtest and walk)

Row fields: `variant_id, date, expiry, dte_at_entry, entered, skip_reason, entry_ts, put_legs, call_legs, put_fill, call_fill, combined_debit, debit_pct, vix_entry, vix_open, vix_bin_1pt, regime, capture_era, effective_step_s, mtm_path_ref, peak_set, best_R, best_ts, mae_R, mae_ts, terminal_R, exit_ts, exit_reason, overnight_R, intraday_R, frames_unpriceable, frames_clamped, seam (pre|post), evaluator_version, cube_schema_version, fill_model_version`.

Rules: the evaluator asks the client for a date and expiry; it does not know whether the day came from the archive or the live feed. TimeWarp needs day N late snapshots on the N+1 expiry plus day N+1's full session; a missing side → `entered=false, skip_reason=missing_pair_day`. Walk rows are append-only; model changes fork, never recompute. A walk day re-run through the backtester must match on `terminal_R, best_R, mae_R`; mismatch is a same-day defect.

## 7. Backtester and sweep

As v1.0: single-pair replay (JSON via URL/POST, manual form, Runner **Send to Tester** button); sweep enumerating the eligible region from the in-memory cube, vectorized over days, Monte Carlo over fills (≥ 5,000 runs/variant), bootstrap over days; per strategy × symbol × VIX bin reporting with counts, distributions of `terminal_R, best_R, mae_R`, capture ratio, peak stats, bootstrapped CI; rolling fit/test forward-walk simulation reporting survivor rate.

## 8. Forward walk manager

As v1.0: frozen registry entry with lineage; daily job from the evening queue appending one row per active walk (skips are rows); manager table with pause/retire/fork/promote; pre-seam and post-seam always shown as two distributions.

## 9. UI

As v1.0: lift the Runner's single-run P&L chart and multi-run distribution chart as data-fed components; do not import the Runner picker. New: peak markers, two-session x-axis for TimeWarp, VIX-bin facets with counts, survivor view, manager table, statistics dashboard. Interface grammar per Apple HIG; visualisation inventive. **No win-rate headline tile.**

## 10. Acceptance tests

- **AT-1 Inventory:** met 2026-09-24 (commit f882a6a); first substantive day 2026-08-18 for SPX and XSP; sampled columns recorded as sampled.
- **AT-2 Cube build:** cube files for all usable SPX/XSP symbol-day-expiries in the §4 schema; NaN count = `frames_unpriceable`; page sum = `count_on_disk` per day.
- **AT-3 Replay parity:** the three most recent live TimeWarp trades (Coach supplies times, fills, screenshots) reproduce entry fills within fill-model tolerance and the real MTM shape. If the archive lacks their expiry, AT-3 runs on the three most recent Batman-shaped 0DTE dual flies instead and the substitution is recorded.
- **AT-4 Peak filter:** single-frame spike excluded; ≥ `peak_min_frames` plateau included.
- **AT-5 Seam parity:** backfilled walk pre-seam rows byte-identical to the backtest over the same dates.
- **AT-6 Sweep scale:** ≥ 10,000 variants × all usable days × 5,000 fill runs on StudioTwo without paging to disk; wall time recorded.
- **AT-7 Visible on Coach's surface:** page and manager render at http://studiotwo.local:7420/ in his browser; screenshot pinned. Gate greens are not acceptance.

## 11. Decisions recorded

- Cube stores marks **and** per-leg IV + package greeks.
- Debit denominator is the pair's max profit; both percentages displayed.
- Peak persistence default 5 frames.
- Walk row is canonical over a later backtest of the same day.
- **Q1 fill model:** Strategy Lab flat fill probability, versioned in every row; spread-based model forks walks when it lands.
- **Q2 exits:** hold-to-expiry and fixed-R targets in the first sweep; a trailing variant is §3 free range once the peak set exists to design it.
- **Data path:** Option C — token-gated fetch/coverage, no StudioOne code change.
- **TimeWarp on a 0DTE-only archive:** forward-walk-only, recorded, build continues.

## 12. Non-goals (this version)

- No symbols beyond SPX and XSP.
- No live order routing; walks are paper only.
- No heatmap picker inside Tape Lab.
- No recomputation of historical walk rows.
- No StudioOne code or collector changes.
