# Batman / TimeWarp Tester — Spec v1.0

**Status:** v1.0 — frozen. Any change is v1.1 and a new file.
**Repo:** Tape Lab (dev machine: StudioTwo). Page on the Tape Lab site, http://studiotwo.local:7420/
**Data source:** OPF API on StudioOne (stored archive and live feed are the same format; the seam is a date argument).
**Author:** Coach, drafted with Claude, 2026-09-24.

---

## 1. Purpose

Build a research harness that (a) backtests the two dual-OTM-butterfly strategies, Batman and TimeWarp, over the stored chain archive, (b) runs many parameter variants at once with Monte Carlo over fills, (c) measures the full set of mark-to-market peaks per trade so a profit-management rule can be designed from evidence, and (d) registers any variant as a standing forward walk that keeps evaluating every trading day.

The tester is the gate a variant passes before it walks. The walk is the out-of-sample test that never ends.

## 2. Definitions

- **Dual fly:** one long call butterfly above spot and one long put butterfly below spot, entered together.
- **Batman:** dual fly, 0DTE, entered near the open (`entry_offset` minutes after 09:30 ET).
- **TimeWarp:** dual fly, 1DTE, entered near the close of the prior session (`entry_offset` minutes before 16:00 ET). On Fridays the entry is 3DTE (Monday expiry).
- **Debit rule:** combined debit of both flies is 5–15% of the pair's max profit. Max profit = min(width_call, width_put) − combined debit. Each side individually is not constrained beyond the combined rule; symmetric mode adds a ±1% per-side tolerance around the midpoint split.
- **Symmetric:** equal width and equal σ-distance both sides. **Asymmetric:** widths and distances chosen independently; a `split` parameter (e.g. 60/40) allocates the debit budget.
- **Peak set:** every local maximum of the trade's MTM path from entry to exit that persists ≥ `peak_min_frames` consecutive frames. Raw single-frame maxima are not peaks.
- **Walk:** a frozen variant evaluated forward one trading day at a time from its registration date. A backfilled walk additionally carries rows before the registration date, tagged pre-seam.
- **Cube:** the derived per-symbol-day store of fly marks (and per-leg vol/greeks) at every snapshot, for every listed strike pair and every width in the width set.

## 3. Placement (TOPO-1 and CP-1 apply)

| Component | Runs on | Notes |
|---|---|---|
| Cube builder | StudioTwo for this pass; StudioOne after close once promoted | Never during RTH on StudioOne (CP-1). Written from day one in the permanent on-disk layout so promotion is a config change. |
| Cube store (this pass) | StudioTwo, Tape Lab data dir, memory-mapped | Whole SPX+XSP Aug-14 → present slab fits in RAM (192 GB). |
| Evaluator (backtest + walk) | StudioTwo now; Dude two later | Same code path for both. Triggered by the evening queue for walks. |
| Walk registry | StudioTwo, Tape Lab DB | Append-only results table. |
| Tester page + dashboard | Tape Lab site, StudioTwo | Consumer only; picks arrive from the Runner or a manual form. |

## 4. Cube schema (permanent)

One file per `symbol/date`, versioned header. Chunking by day so a bad day rebuilds alone and the nightly append is trivial.

Header: `schema_version, symbol, date, source (archive|opf_live), collector_version, capture_era (fixed_band|sigma_trail), snapshot_cadence_s, strike_grid (absolute), width_set, frames_total, frames_unpriceable, frames_clamped`.

Arrays, float32, indexed `[snapshot, side, width, body_strike]`:

- `mark` — fly mid mark
- `bid`, `ask` — fly package bid/ask (for bid-side exits and the fill model)
- `iv_lower, iv_body, iv_upper` — per-leg IV
- `delta, theta` — package greeks (vendor-computed; recorded as such)
- `spot` — `[snapshot]`
- `vix` — `[snapshot]` (from the index/futures data plane)
- `ts` — `[snapshot]` epoch ms

Rules: index by **absolute strike**, never spot-relative. σ-placement is a computed view. Enumerate **every listed strike pair** for each width in the width set — no σ-grid prefilter. Unpriceable frames are recorded as NaN, not dropped. Clamped marks carry a flag array `clamped[snapshot, side, width, body]`.

Width set this pass: SPX {15, 20, 25}; XSP {2, 3}.

## 5. Strategy template

One template, two registered instances (Batman, TimeWarp). Parameters:

```
strategy:        batman | timewarp
symbol:          SPX | XSP
dte_rule:        0 | 1 (→3 on Friday)
entry_offset_m:  minutes from open (batman) or before close (timewarp)
width_call, width_put
placement_mode:  symmetric | asymmetric
sigma_call, sigma_put      (distance of body from spot, in chain-implied σ)
debit_pct_min, debit_pct_max   (of pair max profit; default 5, 15)
split:           call share of debit budget (symmetric → 50, tol ±1 per side)
exit_rule:       hold_to_expiry | target_R:<x> | trail:<params>
peak_min_frames: default 5
fill_model:      id + version (from Strategy Lab)
```

Selection at entry: from the entry snapshot, enumerate all (put fly, call fly) pairs satisfying width, placement and debit constraints; take the pair closest to target σ and split, or in sweep mode take all.

## 6. Evaluator (shared by backtest and walk)

Input: variant + one trading day (or day pair for TimeWarp). Output: one result row.

Row fields: `variant_id, date, entered (bool), skip_reason, entry_ts, put_legs, call_legs, put_fill, call_fill, combined_debit, debit_pct, vix_entry, vix_open, vix_bin_1pt, regime (Zombieland|G1|G2|Chaos), capture_era, mtm_path_ref, peak_set (list of {ts, value_R, persist_frames}), best_R, best_ts, mae_R, mae_ts, terminal_R, exit_ts, exit_reason, overnight_R (timewarp), intraday_R (timewarp), frames_unpriceable, frames_clamped, seam (pre|post), evaluator_version, cube_schema_version`.

Rules:
- The evaluator asks the API for a date; it does not know or care whether the day came from the archive or the live feed.
- TimeWarp needs day N late snapshots plus day N+1 full session; Friday needs Monday. Missing either → `entered=false, skip_reason=missing_pair_day`.
- Walk rows are append-only. A fill-model or evaluator change never recomputes existing rows; fork a new walk.
- A walk day may be re-run through the backtester on the archived copy and must match byte-for-byte on `terminal_R, best_R, mae_R`. Mismatch is a defect, reported that day.

## 7. Backtester and sweep

- Single-pair replay: accepts a pair spec (JSON, via URL or POST; also a minimal manual form) and returns one row plus the MTM path with peaks marked. This is the debugging tool. The Runner gains a **Send to Tester** button emitting the same payload.
- Sweep: takes rule parameters and a date range, enumerates the eligible region from the cube, evaluates every variant on every day as a vectorized pass over the in-memory cube, then runs Monte Carlo over fills (≥ 5,000 runs per variant) and a bootstrap over days.
- Reports per strategy × symbol × VIX bin: trade count, day count, capture-era mix, distributions of `terminal_R, best_R, mae_R`, capture ratio (`terminal_R / best_R`), peaks per trade, time to first peak, bootstrapped CI on mean R.
- Forward-walk simulation inside the backtest: rolling fit window N days / test window M days; report **survivor rate** (fraction of fit-window winners that beat baseline out of sample).

## 8. Forward walk manager

Registry entry: `walk_id, variant (full frozen params), symbol, start_date, registration_ts, parent_backtest_run_id, forked_from_walk_id, fill_model_version, evaluator_version, status (active|paused|retired|promoted)`.

Daily job (evening queue, after close): for every active walk, evaluate the day (or the completed day pair) and append one row. Skips are rows.

Manager screen: table — walk, strategy, symbol, age (days), trades, skip rate, mean R, worst day, current DD, sparkline. Actions: pause, retire, fork, promote (→ Strategy Lab candidate). Multi-select overlays distributions. Pre-seam and post-seam rows are always shown as two distributions, never blended.

## 9. UI

Lift from the Runner: the single-run P&L chart and the multi-run distribution chart (data-fed components). Do **not** import the Runner heatmap picker.

New: peak markers on the P&L chart; two-session x-axis for TimeWarp with the open marked; VIX-bin facets with trade counts on the distribution chart; the survivor view; the manager table; the statistics dashboard.

Statistics dashboard tiles (per strategy, per VIX bin): sample honesty (trade/day counts, era mix, frames dropped/clamped), peak-set stats, risk shape (MAE, worst day, sequence max DD, CI band), TimeWarp overnight vs intraday, survivor rate. **No win-rate headline tile.**

## 10. Acceptance tests

- **AT-1 Inventory:** per symbol-day report of snapshot count, first/last ts, strike range, DTEs present, for SPX and XSP Aug-14 → present, produced from the OPF API on StudioTwo.
- **AT-2 Cube build:** cube files for all usable SPX/XSP days in the schema of §4; header fields populated; NaN count equals `frames_unpriceable`.
- **AT-3 Replay parity:** the three most recent live TimeWarp trades from the afternoon show, re-run at their actual entry times, match Coach's real entry fills within the fill model's stated tolerance and reproduce the real MTM shape. Evidence: screenshots of tester vs broker marks, pinned to machine+time.
- **AT-4 Peak filter:** a single-frame spike (synthetic day) is excluded from the peak set; a ≥ `peak_min_frames` plateau is included.
- **AT-5 Seam parity:** a walk registered with `start_date` in the archive and `registration_ts` = today produces pre-seam rows byte-identical to a backtest of the same variant over the same dates.
- **AT-6 Sweep scale:** ≥ 10,000 variants × all usable days × 5,000 fill runs completes on StudioTwo without paging to disk; wall time recorded.
- **AT-7 Visible on the surface Coach uses:** the tester page and manager render on http://studiotwo.local:7420/ in his browser, screenshot attached. Gate greens are not acceptance.

## 11. Decisions recorded (overridable)

- Cube stores marks **and** per-leg IV + package greeks. Rationale: enables re-pricing under shifted surfaces later; cost is ~2× a marks-only cube, which storage and RAM easily cover.
- Debit denominator is the pair's **max profit** (per Coach, 2026-09-24), not width. The tester displays both percentages so member-facing 10%-of-width language still reconciles.
- Peak persistence default 5 frames (10 s at 2 s cadence). Tunable per run.
- When a walk row and a later backtest of the same day disagree, the **walk row is canonical**.

## 12. Open questions for Coach (do not default)

1. Fill model for this pass: use the Strategy Lab flat fill probability as-is, or wait for the spread-based version?
2. Exit rules to include in the first sweep beyond hold-to-expiry: fixed-R targets only, or also a trailing variant?

## 13. Non-goals (this version)

- No other symbols than SPX and XSP.
- No live order routing; walks are paper only.
- No heatmap picker inside Tape Lab.
- No recomputation of historical walk rows on model changes.
