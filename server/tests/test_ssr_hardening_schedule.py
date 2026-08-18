"""AT-SSR-H-A / D / E — session schedule, one no-session line, flag-off poll-all."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from market_data import ssr_live_capture as tap_mod
from market_data.ssr_snapshot_dash import summarize_day

NY = ZoneInfo("America/New_York")
DAY = datetime(2026, 8, 18, 0, 30, tzinfo=NY).date()
GTH = datetime(2026, 8, 18, 0, 30, tzinfo=NY)
PRE = datetime(2026, 8, 18, 8, 0, tzinfo=NY)
GTH_NIGHT = datetime(2026, 8, 18, 21, 0, tzinfo=NY)

SHARED_MAP = {
    "version": 1,
    "timezone": "America/New_York",
    "default_phases": ["premarket", "rth", "postmarket"],
    "symbols": {
        "SPX": ["gth", "premarket", "rth", "postmarket"],
        "XSP": ["gth", "premarket", "rth", "postmarket"],
        "IWM": ["gth", "premarket", "rth", "postmarket"],
        "USO": ["gth", "premarket", "rth", "postmarket"],
    },
}

_TODAY_EXPS = ["2026-08-18", "2026-08-19", "2026-08-21"]
FIXTURE_UNIVERSE = [
    {"symbol": "SPX", "feed_symbol": "I:SPX", "role": "tradeable", "next_expirations_json": _TODAY_EXPS},
    {"symbol": "XSP", "feed_symbol": "I:XSP", "role": "tradeable", "next_expirations_json": _TODAY_EXPS},
    {"symbol": "IWM", "feed_symbol": None, "role": "tradeable", "next_expirations_json": _TODAY_EXPS},
    {"symbol": "USO", "feed_symbol": None, "role": "tradeable", "next_expirations_json": ["2026-08-19"]},
    {"symbol": "AAPL", "feed_symbol": None, "role": "tradeable", "next_expirations_json": _TODAY_EXPS},
    {"symbol": "SPY", "feed_symbol": None, "role": "tradeable", "next_expirations_json": _TODAY_EXPS},
]


class FakeStore:
    def __init__(self) -> None:
        self.touched: list[str] = []
        self.docs: dict[str, dict] = {}

    def touch_interest(self, topic: str) -> None:
        self.touched.append(topic)

    def get_json(self, key: str):
        return self.docs.get(key)


class Clock:
    def __init__(self, ts: datetime) -> None:
        self.ts = ts

    def now(self) -> datetime:
        return self.ts


def _write_map(tmp_path: Path) -> Path:
    path = tmp_path / "session-map.json"
    path.write_text(json.dumps(SHARED_MAP), encoding="utf-8")
    return path


def _cache_day(tmp_path: Path) -> Path:
    return tmp_path / "cache" / "ssr" / "live_capture"


def _setup(tmp_path: Path, monkeypatch, *, hardening: str | None, ts: datetime) -> Clock:
    clock = Clock(ts)
    monkeypatch.setattr(tap_mod, "now_ny", clock.now)
    monkeypatch.setattr(tap_mod, "load_enabled_universe", lambda: list(FIXTURE_UNIVERSE))
    monkeypatch.setenv("LABS_SSR_CACHE_ROOT", str(tmp_path / "cache"))
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path / "gold"))
    monkeypatch.delenv("LABS_SSR_GOLD_COPY", raising=False)
    monkeypatch.delenv("LABS_SSR_SYMBOLS", raising=False)
    monkeypatch.setattr(tap_mod, "scan_listed_expirations", lambda row, day: [])
    monkeypatch.setenv("LABS_SSR_SESSION_MAP", str(_write_map(tmp_path)))
    if hardening is None:
        monkeypatch.delenv("LABS_SSR_HARDENING", raising=False)
    else:
        monkeypatch.setenv("LABS_SSR_HARDENING", hardening)
    return clock


def _put_spy_generation(store: FakeStore) -> None:
    row = {
        "symbol": "SPX",
        "feed_symbol": "I:SPX",
        "next_expirations_json": _TODAY_EXPS,
    }
    exp = tap_mod.front_expiration(row, DAY)
    assert exp
    topic = tap_mod.ladder_topics(row, exp, tap_mod.WINGS)[0]
    store.docs[topic] = {
        "content_hash": "spx-gth",
        "as_of": GTH.isoformat(),
        "row_count": 1,
        "rows": [
            {"iv": 0.2, "delta": 0.5, "gamma": 0.01, "theta": -0.02, "vega": 0.1}
        ],
    }


def _topics_for(symbol: str, feed: str | None = None) -> list[str]:
    row = {
        "symbol": symbol,
        "feed_symbol": feed,
        "next_expirations_json": _TODAY_EXPS,
    }
    exp = tap_mod.front_expiration(row, DAY) or DAY.isoformat()
    return tap_mod.ladder_topics(row, exp, tap_mod.WINGS)


def _aapl_no_session_lines(text: str) -> list[str]:
    out: list[str] = []
    for line in text.splitlines():
        low = line.lower()
        if "no session" in low and "AAPL" in line and "hole" not in low:
            out.append(line)
    return out


def test_at_ssr_h_a_gth_no_session_not_polled_not_hole(tmp_path, monkeypatch):
    """AT-SSR-H-A: GTH AAPL is not polled and is not a hole; SPX is polled."""
    _setup(tmp_path, monkeypatch, hardening="1", ts=GTH)
    store = FakeStore()
    _put_spy_generation(store)
    tap = tap_mod.LiveTap(store=store)
    tap.chain_cycle()

    aapl_topics = _topics_for("AAPL")
    assert not any(t in store.touched for t in aapl_topics)
    assert not any(":AAPL:" in t for t in store.touched)
    aapl_dir = _cache_day(tmp_path) / f"day={DAY.isoformat()}" / "chain" / "AAPL"
    assert list(aapl_dir.glob("snap-*.json")) == []
    assert not any(str(h).startswith("NO CHAIN AAPL") or "AAPL" in str(h) for h in tap.holes)

    summary = summarize_day(DAY, root=_cache_day(tmp_path))
    aapl_rows = [s for s in summary["symbols"] if s.get("symbol") == "AAPL"]
    assert aapl_rows == []
    assert "AAPL" in tap.no_session

    spx_topics = _topics_for("SPX", "I:SPX")
    assert any(t.startswith("mb:ladder:SPX:") for t in store.touched)
    assert any(t.startswith("mb:ladder:I:SPX:") for t in store.touched)
    assert set(spx_topics) <= set(store.touched)
    spx_snaps = list(
        (_cache_day(tmp_path) / f"day={DAY.isoformat()}" / "chain" / "SPX").glob(
            "snap-*.json"
        )
    )
    assert spx_snaps
    doc = json.loads(spx_snaps[0].read_text(encoding="utf-8"))
    assert doc.get("hole") is None
    assert doc.get("generation")
    assert "NO CHAIN SPX" not in tap.holes


def test_at_ssr_h_d_one_no_session_per_phase_occupancy(tmp_path, monkeypatch, capsys):
    """AT-SSR-H-D: one 'no session' line per AAPL occupancy, not per cycle."""
    clock = _setup(tmp_path, monkeypatch, hardening="1", ts=GTH)
    store = FakeStore()
    _put_spy_generation(store)
    tap = tap_mod.LiveTap(store=store)

    for _ in range(5):
        tap.chain_cycle()
    first = capsys.readouterr().out
    assert len(_aapl_no_session_lines(first)) == 1
    assert not any(":AAPL:" in t for t in store.touched)

    clock.ts = PRE
    store.touched.clear()
    tap.chain_cycle()
    mid = capsys.readouterr().out
    assert _aapl_no_session_lines(mid) == []
    assert any(":AAPL:" in t for t in store.touched)
    aapl_snaps = list(
        (_cache_day(tmp_path) / f"day={DAY.isoformat()}" / "chain" / "AAPL").glob(
            "snap-*.json"
        )
    )
    assert aapl_snaps

    clock.ts = GTH_NIGHT
    store.touched.clear()
    tap.chain_cycle()
    night = capsys.readouterr().out
    assert len(_aapl_no_session_lines(night)) == 1
    assert not any(":AAPL:" in t for t in store.touched)


@pytest.mark.parametrize("hardening", [None, "0"])
def test_at_ssr_h_e_flag_off_is_poll_all(tmp_path, monkeypatch, hardening):
    """AT-SSR-H-E: flag unset or 0 polls every tradeable; GTH empty is a hole."""
    _setup(tmp_path, monkeypatch, hardening=hardening, ts=GTH)
    store = FakeStore()
    _put_spy_generation(store)
    tap = tap_mod.LiveTap(store=store)
    tap.chain_cycle()

    aapl_topics = _topics_for("AAPL")
    assert any(t in store.touched for t in aapl_topics)
    aapl_snaps = list(
        (_cache_day(tmp_path) / f"day={DAY.isoformat()}" / "chain" / "AAPL").glob(
            "snap-*.json"
        )
    )
    assert aapl_snaps
    doc = json.loads(aapl_snaps[0].read_text(encoding="utf-8"))
    assert doc.get("hole") == "NO CHAIN AAPL"
    assert "NO CHAIN AAPL" in tap.holes
    summary = summarize_day(DAY, root=_cache_day(tmp_path))
    aapl_rows = [s for s in summary["symbols"] if s.get("symbol") == "AAPL"]
    assert aapl_rows and aapl_rows[0].get("hole") == "NO CHAIN AAPL"
    assert summary["latest_holes"] >= 1
    assert tap.no_session == []


def test_skips_symbol_that_does_not_expire_today(tmp_path, monkeypatch, capsys):
    """AAPL listed Mon/Wed/Fri is not snapped on Tuesday — not a NO CHAIN hole."""
    _setup(tmp_path, monkeypatch, hardening="0", ts=PRE)
    store = FakeStore()
    _put_spy_generation(store)

    def universe():
        rows = []
        for row in FIXTURE_UNIVERSE:
            item = dict(row)
            if item["symbol"] == "AAPL":
                item["next_expirations_json"] = ["2026-08-17", "2026-08-19", "2026-08-21"]
            rows.append(item)
        return rows

    monkeypatch.setattr(tap_mod, "load_enabled_universe", universe)
    tap = tap_mod.LiveTap(store=store)
    tap.chain_cycle()
    out = capsys.readouterr().out
    assert "no expiry AAPL" in out
    assert not any(":AAPL:" in t for t in store.touched)
    aapl_dir = _cache_day(tmp_path) / f"day={DAY.isoformat()}" / "chain" / "AAPL"
    assert list(aapl_dir.glob("snap-*.json")) == []
    assert not any("AAPL" in str(h) for h in tap.holes)
    assert any(":SPX:" in t for t in store.touched)
