"""Performance regression guards for Curate multi-bot comparison hot path.

These tests fail LOUDLY if the board-load path regresses into:
- live Massive correlation on GET comparison (was ~20s @ 17 bots)
- O(N) per-instance SQL fan-out (3N+ queries)
- dual full bots+strategies payload
- fat equity series (timestamps/cash on every point)
- multi-second wall time for a modest multi-bot book

Run:  cd server && .venv/bin/python -m pytest tests/test_strategy_lab_curate_perf_guards.py -q

Doctrine: Architecture/20-strategy-lab-curate-board-performance.md · DL-231
"""

from __future__ import annotations

import json
import time
from typing import Any

import db
import identity as identity_mod
import pytest
from strategy_runtime import curate_domain as cd
from strategy_runtime.tick import run_tick
from tests.conftest import cookie_for


# --- budgets (fail early; keep CI-friendly but tight enough to catch the known cliff) ---

# Wall clock for comparison_report with N_BOTS instances on local/CI MySQL.
# Pre-fix was ~20s with correlation; healthy path is <10ms. Allow headroom for CI.
MAX_COMPARISON_SECONDS = 2.0

# SQL execute calls inside comparison_report (batched = O(1), not 3N).
# Allow a small fixed budget independent of N (must stay sub-linear).
MAX_SQL_EXECUTE = 12

# Payload: bytes per bot row + fixed overhead (compact series only).
MAX_BYTES_PER_BOT = 4_000
MAX_PAYLOAD_FIXED = 8_000

# How many bots to create for the multi-bot probe.
N_BOTS = 8

# Equity series must be compact last-N points.
MAX_SERIES_POINTS = 48


class _CountingCursor:
    """Proxy cursor that counts execute() calls."""

    def __init__(self, inner):
        self._inner = inner
        self.execute_count = 0

    def execute(self, *args, **kwargs):
        self.execute_count += 1
        return self._inner.execute(*args, **kwargs)

    def executemany(self, *args, **kwargs):
        self.execute_count += 1
        return self._inner.executemany(*args, **kwargs)

    def __getattr__(self, name: str):
        return getattr(self._inner, name)


def _probe_identity() -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return int(
                identity_mod.get_or_create_identity(
                    cur,
                    "zztest-curate-perf-guard@labs.test",
                    "ZZ Curate Perf Guard",
                )
            )


def _seed_multi_bot_book(identity_id: int, n: int = N_BOTS) -> list[str]:
    """Create n armed+ticked Curate instances for the probe identity. Returns public_ids."""
    import strategy_lab_domain as sld

    public_ids: list[str] = []
    symbols = ["SPY", "QQQ", "IWM", "XLF", "GLD", "TLT", "AAPL", "MSFT", "NVDA", "AMZN"]

    with db.transaction() as conn:
        with conn.cursor() as cur:
            # Isolate: leftover PerfGuard rows fill phase 'curation' (max 100).
            cur.execute(
                "DELETE FROM strategy_lab_curate_instances WHERE identity_id = %s",
                (identity_id,),
            )
            sld.purge_lab(cur, identity_id)
            for i in range(n):
                name = f"PerfGuard Bot {i + 1}"
                strat = sld.create_strategy(
                    cur,
                    identity_id,
                    name=name,
                    description="perf guard seed",
                    phase="curation",
                    phase_state="monitored",
                    blank=True,
                    attributes={"demo_seed": False, "perf_guard": True},
                )
                srow = sld.get_by_public_id(cur, identity_id, strat["id"])
                assert srow is not None
                sym = symbols[i % len(symbols)]
                inst = cd.create_instance(
                    cur,
                    identity_id=identity_id,
                    strategy_row=srow,
                    envelope={
                        "allocation_usd": 10_000.0,
                        "scan_symbol": sym,
                        "scan_risk_per_open_usd": 300.0,
                        "max_positions_concurrent": 2,
                        "max_positions_per_day": 10,
                        "max_positions_per_symbol": 1,
                    },
                )
                full = cd.get_instance(cur, identity_id, inst["id"])
                assert full is not None
                cd.set_status(cur, full, status="armed", message="perf guard arm")
                full = cd.get_instance(cur, identity_id, inst["id"])
                assert full is not None
                run_tick(cur, full, mark_step_frac=0.1)
                public_ids.append(inst["id"])
    return public_ids


def test_comparison_never_calls_live_correlation(monkeypatch):
    """Guard: re-introducing relative_correlations into comparison must fail tests."""

    def _boom(*_a, **_k):
        raise AssertionError(
            "PERF REGRESSION: comparison_report must not call "
            "market_data.correlation.relative_correlations (live Massive). "
            "Use the correlation calculator / on-demand endpoints only. "
            "See Architecture/20-strategy-lab-curate-board-performance.md"
        )

    monkeypatch.setattr(
        "market_data.correlation.relative_correlations",
        _boom,
        raising=False,
    )
    # Also guard the module-level import path if comparison does
    # `from market_data.correlation import relative_correlations` then call.
    import market_data.correlation as corr_mod

    monkeypatch.setattr(corr_mod, "relative_correlations", _boom, raising=True)

    iid = _probe_identity()
    _seed_multi_bot_book(iid, n=3)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            report = cd.comparison_report(cur, iid)

    assert report.get("correlation", {}).get("deferred") is True
    # Should not have populated vs_benchmark via Massive
    vs = (report.get("correlation") or {}).get("vs_benchmark") or {}
    assert vs == {} or all(
        (v or {}).get("coefficient") is None for v in vs.values()
    )


def test_comparison_sql_execute_budget_not_3n():
    """Batched SQL: execute count must stay O(1), not ~3N per instance."""
    iid = _probe_identity()
    _seed_multi_bot_book(iid, n=N_BOTS)

    with db.transaction() as conn:
        with conn.cursor() as raw:
            counter = _CountingCursor(raw)
            t0 = time.perf_counter()
            report = cd.comparison_report(counter, iid)
            elapsed = time.perf_counter() - t0

    n_bots = len(report.get("bots") or [])
    assert n_bots >= N_BOTS, f"expected >= {N_BOTS} bots, got {n_bots}"

    # Hard fixed budget
    assert counter.execute_count <= MAX_SQL_EXECUTE, (
        f"PERF REGRESSION: comparison used {counter.execute_count} SQL executes "
        f"for {n_bots} bots (budget {MAX_SQL_EXECUTE}). "
        f"Likely reintroduced per-instance N+1 queries (was ~3N). "
        f"Batch position aggs + equity series. See Arch/20."
    )
    # Explicitly forbid linear 3N-class growth
    assert counter.execute_count < 2 * n_bots, (
        f"PERF REGRESSION: SQL executes ({counter.execute_count}) scale with N "
        f"({n_bots} bots) — expected batched O(1)."
    )
    assert elapsed < MAX_COMPARISON_SECONDS, (
        f"PERF REGRESSION: comparison_report took {elapsed:.3f}s "
        f"(budget {MAX_COMPARISON_SECONDS}s) for {n_bots} bots. "
        f"Pre-fix cliff was ~20s with live correlation."
    )


def test_comparison_payload_lean_no_dual_full_arrays():
    """No dual bots+strategies full copy; compact equity series."""
    iid = _probe_identity()
    _seed_multi_bot_book(iid, n=N_BOTS)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            report = cd.comparison_report(cur, iid)

    bots = report.get("bots") or []
    strategies = report.get("strategies")
    assert isinstance(bots, list) and len(bots) >= N_BOTS

    # Dual full payload guard: strategies must not re-emit the full bot list
    if strategies is None:
        pass
    elif isinstance(strategies, list):
        assert len(strategies) == 0, (
            f"PERF REGRESSION: comparison.strategies has {len(strategies)} rows "
            f"(bots={len(bots)}). Dual full arrays double JSON size. "
            f"Emit bots only; leave strategies empty for legacy clients."
        )
    else:
        pytest.fail("strategies must be a list or absent")

    for row in bots:
        series = row.get("equity_series") or []
        assert isinstance(series, list)
        assert len(series) <= MAX_SERIES_POINTS + 1, (
            f"equity_series too long ({len(series)}) — cap last-N compact points"
        )
        for pt in series:
            assert isinstance(pt, dict)
            assert "equity" in pt
            # Compact contract: no cash/t timestamps on hot path points
            assert "cash" not in pt, (
                "PERF REGRESSION: equity_series points include 'cash' — "
                "use compact {equity} only on comparison hot path"
            )
            assert "t" not in pt, (
                "PERF REGRESSION: equity_series points include 't' — "
                "use compact {equity} only on comparison hot path"
            )

    raw = json.dumps(report, default=str)
    budget = MAX_PAYLOAD_FIXED + MAX_BYTES_PER_BOT * len(bots)
    assert len(raw) <= budget, (
        f"PERF REGRESSION: comparison JSON is {len(raw)} bytes for {len(bots)} bots "
        f"(budget {budget}). Fat series, dual arrays, or corr blocks bloated the payload."
    )


def test_comparison_http_endpoint_perf_guards(client):
    """HTTP characterization: deferred corr, bots key, runtime fields, wall budget."""
    iid = _probe_identity()
    _seed_multi_bot_book(iid, n=N_BOTS)
    cookies = cookie_for("navigator", identity_id=iid)

    t0 = time.perf_counter()
    r = client.get("/api/me/strategy-lab/curate/comparison", cookies=cookies)
    elapsed = time.perf_counter() - t0

    assert r.status_code == 200, r.text
    c = r.json()
    assert elapsed < MAX_COMPARISON_SECONDS, (
        f"PERF REGRESSION: GET comparison took {elapsed:.3f}s "
        f"(budget {MAX_COMPARISON_SECONDS}s)"
    )

    corr = c.get("correlation") or {}
    assert corr.get("deferred") is True, (
        "PERF REGRESSION: correlation.deferred must be true on comparison response"
    )
    assert (corr.get("pairwise") or []) == [], (
        "PERF REGRESSION: comparison must not embed pairwise correlation matrix"
    )
    assert isinstance(c.get("bots"), list) and len(c["bots"]) >= N_BOTS
    assert c.get("strategies") in ([], None) or len(c.get("strategies") or []) == 0

    # Runtime fields (DL-230) present on rows that were armed
    armed_or_running = [
        b
        for b in c["bots"]
        if b.get("instance_status") in ("armed", "running")
    ]
    assert armed_or_running
    for b in armed_or_running:
        assert "run_started_at" in b
        assert "runtime_label" in b or "runtime_seconds" in b


def test_comparison_scales_sql_sublinear_when_n_grows():
    """Double N bots should not roughly double SQL executes (batching)."""
    iid = _probe_identity()

    def _count_for(n: int) -> tuple[int, int]:
        _seed_multi_bot_book(iid, n=n)
        with db.transaction() as conn:
            with conn.cursor() as raw:
                counter = _CountingCursor(raw)
                report = cd.comparison_report(counter, iid)
        return counter.execute_count, len(report.get("bots") or [])

    q_small, n_small = _count_for(3)
    q_large, n_large = _count_for(N_BOTS)

    assert n_large > n_small
    # Executes should not grow proportionally with N
    # Allow +2 slack for noise, but refuse near-linear growth
    growth = q_large - q_small
    assert growth <= 3, (
        f"PERF REGRESSION: SQL executes grew by {growth} when bots "
        f"{n_small}→{n_large} (q={q_small}→{q_large}). Expect batched O(1)."
    )
    assert q_large <= MAX_SQL_EXECUTE
