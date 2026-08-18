"""AT-SSR-H-G — flag-on missing/unreadable session map fails loud."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from market_data import ssr_live_capture as tap_mod
from market_data.ssr_session_map import load_session_map, session_map_path

NY = ZoneInfo("America/New_York")
GTH = datetime(2026, 8, 18, 0, 30, tzinfo=NY)

FIXTURE_UNIVERSE = [
    {"symbol": "SPX", "feed_symbol": "I:SPX", "role": "tradeable"},
    {"symbol": "AAPL", "feed_symbol": None, "role": "tradeable"},
]


class FakeStore:
    def __init__(self) -> None:
        self.touched: list[str] = []
        self.docs: dict[str, dict] = {}

    def touch_interest(self, topic: str) -> None:
        self.touched.append(topic)

    def get_json(self, key: str):
        return self.docs.get(key)


def _pin_clock(monkeypatch, ts: datetime) -> None:
    monkeypatch.setattr(tap_mod, "now_ny", lambda: ts)


def _tap_env(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("LABS_SSR_CACHE_ROOT", str(tmp_path / "cache"))
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path / "gold"))
    monkeypatch.delenv("LABS_SSR_GOLD_COPY", raising=False)
    monkeypatch.delenv("LABS_SSR_SYMBOLS", raising=False)
    monkeypatch.setattr(tap_mod, "load_enabled_universe", lambda: list(FIXTURE_UNIVERSE))
    _pin_clock(monkeypatch, GTH)


def _snap_paths(root: Path) -> list[Path]:
    return list(root.rglob("snap-*.json"))


def test_at_ssr_h_g_flag_on_default_map_missing(tmp_path, monkeypatch):
    """AT-SSR-H-G: unset override + default file missing → abort, zero polls."""
    monkeypatch.setenv("LABS_SSR_HARDENING", "1")
    monkeypatch.delenv("LABS_SSR_SESSION_MAP", raising=False)
    missing = tmp_path / "missing-session-map.json"
    monkeypatch.setattr(
        "market_data.ssr_session_map.default_session_map_path",
        lambda: missing,
    )
    _tap_env(tmp_path, monkeypatch)

    assert session_map_path() == missing
    with pytest.raises(RuntimeError, match="missing|unreadable|not a file"):
        load_session_map()

    store = FakeStore()
    tap = tap_mod.LiveTap(store=store)
    with pytest.raises(RuntimeError, match="missing|unreadable|not a file"):
        tap.chain_cycle()
    assert store.touched == []
    assert _snap_paths(tmp_path) == []
    assert tap.holes == []


def test_at_ssr_h_g_flag_on_override_missing(tmp_path, monkeypatch):
    """AT-SSR-H-G: LABS_SSR_SESSION_MAP set to a path that does not exist."""
    monkeypatch.setenv("LABS_SSR_HARDENING", "1")
    missing = tmp_path / "nope" / "session-map.json"
    monkeypatch.setenv("LABS_SSR_SESSION_MAP", str(missing))
    _tap_env(tmp_path, monkeypatch)

    with pytest.raises(RuntimeError, match="missing|unreadable|not a file"):
        load_session_map()

    store = FakeStore()
    tap = tap_mod.LiveTap(store=store)
    with pytest.raises(RuntimeError, match="missing|unreadable|not a file"):
        tap.chain_cycle()
    assert store.touched == []
    assert _snap_paths(tmp_path) == []


def test_at_ssr_h_g_flag_on_invalid_json(tmp_path, monkeypatch):
    """AT-SSR-H-G: override path exists but JSON is invalid → abort, zero polls."""
    monkeypatch.setenv("LABS_SSR_HARDENING", "1")
    bad = tmp_path / "session-map.json"
    bad.write_text("{not-json", encoding="utf-8")
    monkeypatch.setenv("LABS_SSR_SESSION_MAP", str(bad))
    _tap_env(tmp_path, monkeypatch)

    with pytest.raises(RuntimeError, match="invalid JSON"):
        load_session_map()

    store = FakeStore()
    tap = tap_mod.LiveTap(store=store)
    with pytest.raises(RuntimeError, match="invalid JSON"):
        tap.chain_cycle()
    assert store.touched == []
    assert _snap_paths(tmp_path) == []


def test_at_ssr_h_g_flag_on_unreadable_path(tmp_path, monkeypatch):
    """AT-SSR-H-G: override path is not a readable file (directory)."""
    monkeypatch.setenv("LABS_SSR_HARDENING", "1")
    not_file = tmp_path / "not-a-file"
    not_file.mkdir()
    monkeypatch.setenv("LABS_SSR_SESSION_MAP", str(not_file))
    _tap_env(tmp_path, monkeypatch)

    with pytest.raises(RuntimeError, match="missing|unreadable|not a file"):
        load_session_map()

    store = FakeStore()
    tap = tap_mod.LiveTap(store=store)
    with pytest.raises(RuntimeError, match="missing|unreadable|not a file"):
        tap.chain_cycle()
    assert store.touched == []
    assert _snap_paths(tmp_path) == []


def test_at_ssr_h_g_flag_off_missing_map_polls(tmp_path, monkeypatch):
    """AT-SSR-H-G contrast: flag off + default map missing → poll-all (E)."""
    monkeypatch.delenv("LABS_SSR_HARDENING", raising=False)
    monkeypatch.delenv("LABS_SSR_SESSION_MAP", raising=False)
    monkeypatch.setattr(
        "market_data.ssr_session_map.default_session_map_path",
        lambda: tmp_path / "absent.json",
    )
    _tap_env(tmp_path, monkeypatch)

    store = FakeStore()
    tap = tap_mod.LiveTap(store=store)
    tap.chain_cycle()
    assert any(":AAPL:" in t for t in store.touched)
    aapl_snaps = list((tmp_path / "cache").rglob("chain/AAPL/snap-*.json"))
    assert aapl_snaps
    assert "NO CHAIN AAPL" in tap.holes
