"""VPSB futures collector harness — replay only. No live Massive."""

from __future__ import annotations

import gzip
import json
from datetime import date
from pathlib import Path

from market_data.vp_ingest.futures_capture import (
    ingest_futures_frame,
    maybe_absence,
    parse_futures_trade,
    record_disconnect,
    regenerate_print_absence,
    replay_tape,
)
from market_data.vp_ingest.store import vendor_ts_to_seconds
from market_data.vp_ingest.futures_contracts import pick_roll_set, product_of_ticker
from market_data.vp_ingest.futures_schedules import halt_is_scheduled, session_is_open
from market_data.vp_ingest.disk_guard import below_guard
from market_data.vp_ingest.store import prints_path


def _read(path: Path) -> list[dict]:
    rows = []
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def test_product_of_ticker_mes_before_es():
    assert product_of_ticker("MESZ5") == "MES"
    assert product_of_ticker("ESZ5") == "ES"


def test_active_contracts_returns_both_when_listed():
    rows = [
        {"ticker": "ESU5", "product_code": "ES", "last_trade_date": "2025-09-19"},
        {"ticker": "ESZ5", "product_code": "ES", "last_trade_date": "2025-12-19"},
        {"ticker": "MESU5", "product_code": "MES", "last_trade_date": "2025-09-19"},
        {"ticker": "MESZ5", "product_code": "MES", "last_trade_date": "2025-12-19"},
    ]
    got = pick_roll_set(
        rows
        + [{"ticker": "MESH5-MESZ5", "product_code": "MES"}],
        as_of=date(2025, 9, 17),
    )
    assert "ESU5" in got and "ESZ5" in got
    assert "MESU5" in got and "MESZ5" in got
    assert "MESH5-MESZ5" not in got


def test_parse_stores_raw_ns_session_from_vendor():
    allowed = {"ESZ5"}
    ns = 1734472799000509200
    rec = parse_futures_trade(
        {
            "ev": "T",
            "sym": "ESZ5",
            "p": 6400.25,
            "s": 2,
            "t": ns,
            "session_end_date": "2024-12-17",
        },
        allowed=allowed,
    )
    assert rec is not None
    assert rec["contract"] == "ESZ5"
    assert rec["sym"] == "ES"
    assert rec["t"] == ns
    assert rec["session_end_date"] == "2024-12-17"
    assert "c" not in rec  # absence not a defect


def test_replay_both_products_and_session_path(tmp_path: Path):
    allowed = {"ESZ5", "MESZ5"}
    frames = [
        json.dumps(
            {
                "ev": "T",
                "sym": "ESZ5",
                "p": 6400.0,
                "s": 1,
                "t": 1734472799000509200,
                "session_end_date": "2024-12-17",
            }
        ),
        json.dumps(
            {
                "ev": "T",
                "sym": "MESZ5",
                "p": 6400.0,
                "s": 3,
                "t": 1734472799000509201,
                "session_end_date": "2024-12-17",
                "c": [9],
            }
        ),
    ]
    n = replay_tape(frames, tmp_path, allowed)
    assert n == 2
    es = _read(prints_path(tmp_path, "ES", date(2024, 12, 17)))
    mes = _read(prints_path(tmp_path, "MES", date(2024, 12, 17)))
    assert es[0]["contract"] == "ESZ5" and es[0]["s"] == 1
    assert mes[0]["contract"] == "MESZ5" and mes[0]["c"] == [9]


def test_scheduled_halt_is_never_a_gap(tmp_path: Path):
    assert halt_is_scheduled({"results": [{"type": "maintenance_halt"}]})
    assert not session_is_open({"status": "halt"}, product="ES")
    last = {"ES": 1000, "MES": 1000}
    gap: dict = {}
    maybe_absence(
        tmp_path,
        ("ES", "MES"),
        last,
        gap,
        now_t=1000 + 400 * 1000,
        session_open={"ES": False, "MES": False},
        scheduled_halt={"ES": True, "MES": True},
    )
    assert gap == {}
    assert not list(tmp_path.rglob("gaps.jsonl"))


def test_disconnect_during_open_is_gap(tmp_path: Path):
    gap: dict = {}
    record_disconnect(
        tmp_path,
        ("ES",),
        gap,
        now_t=50,
        session_open={"ES": True},
        scheduled_halt={"ES": False},
    )
    assert gap["ES"]["kind"] == "feed_liveness"
    files = list(tmp_path.rglob("gaps.jsonl"))
    assert files


def test_print_absence_mixed_units_does_not_fire_on_live_tape(tmp_path: Path):
    """Live defect: last print in ms, now in ns, silence < 300s → zero gaps."""
    last_ms = 1_789_650_742_544  # ~2026-09-17 as Massive ms
    now_ns = int(last_ms * 1_000_000) + 5_000_000_000  # +5 s in ns
    assert abs(vendor_ts_to_seconds(now_ns) - vendor_ts_to_seconds(last_ms) - 5) < 0.01
    gap: dict = {}
    maybe_absence(
        tmp_path,
        ("ES", "MES"),
        {"ES": last_ms, "MES": last_ms},
        gap,
        now_t=now_ns,
        session_open={"ES": True, "MES": True},
        scheduled_halt={"ES": False, "MES": False},
    )
    assert gap == {}
    assert not list(tmp_path.rglob("gaps.jsonl"))


def test_print_absence_one_gap_after_300s_silence(tmp_path: Path):
    last_ms = 1_789_650_742_544
    now_ns = int(last_ms * 1_000_000) + 301 * 1_000_000_000
    gap: dict = {}
    maybe_absence(
        tmp_path,
        ("ES",),
        {"ES": last_ms},
        gap,
        now_t=now_ns,
        session_open={"ES": True},
        scheduled_halt={"ES": False},
    )
    assert gap["ES"]["kind"] == "print_absence"
    files = list(tmp_path.rglob("gaps.jsonl"))
    assert len(files) == 1
    # second tick while still open does not emit another
    maybe_absence(
        tmp_path,
        ("ES",),
        {"ES": last_ms},
        gap,
        now_t=now_ns + 1_000_000_000,
        session_open={"ES": True},
        scheduled_halt={"ES": False},
    )
    lines = files[0].read_text().strip().splitlines()
    assert len(lines) == 1


def test_regenerate_print_absence_from_raw_prints(tmp_path: Path):
    from market_data.vp_ingest.store import append_gap, append_print

    day = date(2026, 9, 17)
    t0 = 1_789_650_742_544
    append_print(
        tmp_path,
        {"sym": "ES", "contract": "ESZ6", "p": 1, "s": 1, "t": t0, "session_end_date": "2026-09-17"},
    )
    append_print(
        tmp_path,
        {
            "sym": "ES",
            "contract": "ESZ6",
            "p": 1,
            "s": 1,
            "t": t0 + 10_000,
            "session_end_date": "2026-09-17",
        },
    )
    append_print(
        tmp_path,
        {
            "sym": "ES",
            "contract": "ESZ6",
            "p": 1,
            "s": 1,
            "t": t0 + 400_000,
            "session_end_date": "2026-09-17",
        },
    )
    append_gap(
        tmp_path,
        "ES",
        {"kind": "feed_liveness", "opened_t": t0, "t": t0, "state": "open"},
    )
    append_gap(
        tmp_path,
        "ES",
        {"kind": "print_absence", "opened_t": t0, "t": t0, "state": "open"},
    )
    stats = regenerate_print_absence(tmp_path, "ES", day, now_t=None, session_open=True)
    assert stats["prints"] == 3
    assert stats["print_absence"] == 1  # 400s between print 2 and 3
    assert stats["kept_other"] == 1
    text = (tmp_path / "vp/ingest/ES/gaps/day=2026-09-17/gaps.jsonl").read_text()
    assert "feed_liveness" in text
    assert text.count('"kind":"print_absence"') == 1


def test_disk_guard_detects_low_free(tmp_path: Path, monkeypatch):
    from market_data.vp_ingest import disk_guard as dg

    monkeypatch.setattr(dg, "free_bytes", lambda p: 1)
    assert below_guard(tmp_path, floor=100) is True
    monkeypatch.setattr(dg, "free_bytes", lambda p: 10**12)
    assert below_guard(tmp_path, floor=100) is False
