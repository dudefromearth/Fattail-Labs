# Strategy Lab — Curate multi-bot board performance (as-built)

**Status:** **AS-BUILT** (2026-08-06)  
**Decisions:** DL-230 · DL-231 · DL-232 · DL-233  
**Spec:** [`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md`](../Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md) §1.5 · §5  
**Map:** [19-strategy-lab-as-built-map.md](./19-strategy-lab-as-built-map.md)

---

## 1. Product requirement

Many bots may run in **Curate** for compare / promote / portfolio. The board must be:

- **Fast to load** (no multi-second hangs)  
- **Memory-bounded in the browser** (no tab crash under large sets)  
- **Stable while monitoring** (polls and clocks must not thrash the full tree)

Customer confidence depends on operational stability, not cosmetics.

---

## 2. Audit conclusions (2026-08-06)

Measured on a **17-instance** exercise book:

| Step | Time (before) |
|------|----------------|
| Instance list + batched SQL | ~1–10 ms |
| Equity series (N queries, then) | ~9 ms |
| **Live `relative_correlations` (Massive HTTP, no cache)** | **~22 s** |
| Full `comparison_report` | **~20–21 s** |

### Root causes

| # | Cause | Effect |
|---|--------|--------|
| 1 | Correlation **inside** comparison on every poll | Tab hang; stacked requests |
| 2 | **1 Hz** `nowMs` on dashboard root | Re-sort + re-render **all** cards/SVGs every second |
| 3 | Mount **all** bot mini-charts | DOM/SVG memory explosion |
| 4 | ~**3N SQL** + dual `bots`/`strategies` full JSON | Latency + payload growth at large N |

**Verdict:** Failure mode was architectural, not “too many bots” as a product limit.

---

## 3. As-built architecture (after fix)

### 3.1 Comparison API (hot path)

`GET /api/me/strategy-lab/curate/comparison` → `curate_domain.comparison_report`

| Law | |
|-----|--|
| **C-1** | **No live Massive correlation** on this path. `correlation.deferred=true`. |
| **C-2** | **Batched SQL:** one position-agg `GROUP BY instance_id`; one windowed equity extract. |
| **C-3** | Equity series = **last N** tick_complete samples (`EQUITY_SERIES_LIMIT=24`), compact `{equity}` only. |
| **C-4** | Wire primary list is **`bots`**. `strategies` is empty (no dual full payload). |
| **C-5** | Optional ρ vs SPY is **on-demand** via `/correlation` and `/correlation/relative` + UI calculator. |

**Measured after:** ~**6 ms**, ~**19 KB** @ 17 bots.

### 3.2 Runtime clock

| Law | |
|-----|--|
| **R-1** | `run_started_at` set on **Arm** (migration **088**). |
| **R-2** | Adaptive label: `42s` · `3:45` · `2h 15m` · `3d 4h`. |
| **R-3** | Live update is **per RuntimeCell only** — never a 1 Hz parent re-render of the board. |
| **R-4** | Timers **pause** when `document.visibilityState === "hidden"`. |

### 3.3 Browser board (`PhaseRunDashboard`)

| Law | |
|-----|--|
| **B-1** | **Page size 12** (`PHASE_RUN_PAGE_SIZE`) — hard mount budget for cards/SVGs. |
| **B-2** | Cards, rows, and `MiniEquityChart` are **memoized** (series fingerprint). |
| **B-3** | Sort keys are **stable** (runtime sort uses `run_started_at` epoch, not live seconds). |
| **B-4** | Filter/sort client-side; show **`shown/total`** (e.g. `4/22`); amber **Filter on** chrome. |
| **B-5** | Poll: silent **30 s**, visibility-aware, no stacked in-flight comparison loads. |

### 3.4 Suite navigation (product)

Top suite: **Design · Curate · Deploy · Archive** only (DL-232).  
**Symbols** = Design sub-nav (Board | Symbols), not a suite tab.

---

## 4. Automated guards (must stay green)

**File:** `server/tests/test_strategy_lab_curate_perf_guards.py`  

| Test | Catches |
|------|---------|
| `test_comparison_never_calls_live_correlation` | Re-import of Massive corr into comparison (monkeypatch boom) |
| `test_comparison_sql_execute_budget_not_3n` | Per-instance N+1 SQL; wall-clock cliff |
| `test_comparison_payload_lean_no_dual_full_arrays` | Dual bots+strategies full JSON; fat equity points |
| `test_comparison_http_endpoint_perf_guards` | HTTP path: deferred corr, bots-only, runtime fields, wall budget |
| `test_comparison_scales_sql_sublinear_when_n_grows` | SQL execute growth when N doubles |

**Budgets (fail loud):** ≤ **12** SQL executes · ≤ **2.0 s** wall for N=8 · no `strategies` dual list · compact `{equity}` series only · `correlation.deferred is True`.

Run:

```bash
cd server && .venv/bin/python -m pytest tests/test_strategy_lab_curate_perf_guards.py -q
```

Every commit touching `server/strategy_runtime/` or Curate comparison routes should keep this green.

---

## 5. Residual (not yet required for stability)

- Virtualization within a page if page size grows  
- Materialized equity samples on instance row  
- Throttle tick `mark_update` decision-log spam  
- Chunked platform tick transactions  
- Daily-bar cache for correlation calculator  

---

## 6. Document control

| Ver | Date | Note |
|-----|------|------|
| **1.0** | **2026-08-06** | Audit conclusions + as-built performance contract |
| **1.1** | **2026-08-06** | Automated perf guard tests |
