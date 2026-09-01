"""P1b plane-owned wings interest — characterization (AT-GP23 shape)."""

from __future__ import annotations

from pathlib import Path

import pytest

from opf.keys import bus_ladder_key
from opf import plane_interest as pi


PLANE_SRC = Path(__file__).resolve().parents[1] / "opf" / "plane_interest.py"


class _FakeRedis:
    def __init__(self) -> None:
        self.data: dict[str, str] = {}
        self.ex: dict[str, int] = {}

    def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.data[key] = value
        if ex is not None:
            self.ex[key] = int(ex)


class _FakeStore:
    def __init__(self) -> None:
        self._r = _FakeRedis()
        self.touched: list[str] = []

    def touch_interest(self, topic: str) -> None:
        self.touched.append(topic)
        self._r.set(f"mb:interest:{topic}", "t", ex=45)

    def list_interest_topics(self, prefix: str = "mb:ladder:") -> list[str]:
        out = []
        for k in self._r.data:
            if k.startswith("mb:interest:"):
                topic = k[len("mb:interest:") :]
                if topic.startswith(prefix) or prefix == "*":
                    out.append(topic)
        return out


def test_source_does_not_read_listed_pairs_or_inline_keys():
    src = PLANE_SRC.read_text()
    assert "LABS_OPF_LISTED_PAIRS" not in src
    assert "listed:dual" not in src
    assert "bus_ladder_key" in src
    assert 'f"mb:ladder:' not in src
    assert "f'mb:ladder:" not in src


def test_empty_topics_is_noop_default(monkeypatch):
    monkeypatch.delenv("LABS_OPF_PLANE_WINGS_TOPICS", raising=False)
    assert pi.parse_wings_topics() == []
    monkeypatch.setenv("LABS_OPF_PLANE_WINGS_TOPICS", "")
    assert pi.parse_wings_topics() == []
    monkeypatch.setenv("LABS_OPF_PLANE_WINGS_TOPICS", "   ")
    assert pi.parse_wings_topics() == []
    store = _FakeStore()
    assert pi.tick(store, [], health_ok=True) == []
    assert store.touched == []


def test_listed_pairs_env_ignored_even_if_set(monkeypatch):
    monkeypatch.setenv("LABS_OPF_LISTED_PAIRS", "I:SPX,2026-09-01")
    monkeypatch.setenv("LABS_OPF_PLANE_WINGS_TOPICS", "")
    assert pi.parse_wings_topics() == []


def test_parses_triple_via_bus_ladder_key_only(monkeypatch):
    monkeypatch.setenv(
        "LABS_OPF_PLANE_WINGS_TOPICS", "I:SPX,2026-09-01,25; SPY,2026-09-04,10"
    )
    topics = pi.parse_wings_topics()
    assert topics == [
        bus_ladder_key("I:SPX", "2026-09-01", 25),
        bus_ladder_key("SPY", "2026-09-04", 10),
    ]
    assert topics[0] == "mb:ladder:I:SPX:2026-09-01:w25:dual"


def test_rebuilds_full_key_through_bus_ladder_key(monkeypatch):
    raw = "mb:ladder:I:SPX:2026-09-01:w25:dual"
    monkeypatch.setenv("LABS_OPF_PLANE_WINGS_TOPICS", raw)
    topics = pi.parse_wings_topics()
    assert topics == [bus_ladder_key("I:SPX", "2026-09-01", 25)]


def test_rejects_unparseable_and_listed_looking_key(monkeypatch):
    monkeypatch.setenv(
        "LABS_OPF_PLANE_WINGS_TOPICS",
        "mb:ladder:I:SPX:2026-09-01:listed:dual; not-a-topic",
    )
    assert pi.parse_wings_topics() == []


def test_tick_writes_same_interest_key_and_sidecar(monkeypatch):
    monkeypatch.setenv("LABS_MB_INTEREST_GRACE_S", "45")
    store = _FakeStore()
    topic = bus_ladder_key("I:SPX", "2026-09-01", 25)
    touched = pi.tick(store, [topic], health_ok=True)
    assert touched == [topic]
    assert store.touched == [topic]
    assert store.list_interest_topics("mb:ladder:") == [topic]
    assert store._r.data[f"{pi.SIDECAR_PREFIX}{topic}"] == pi.SOURCE_PLANE
    assert store._r.ex[f"{pi.SIDECAR_PREFIX}{topic}"] == 45
    # never a decorated interest key
    assert all(not k.startswith("mb:interest:plane:") for k in store._r.data)


def test_tick_skips_when_api_down():
    store = _FakeStore()
    topic = bus_ladder_key("I:SPX", "2026-09-01", 25)
    assert pi.tick(store, [topic], health_ok=False) == []
    assert store.touched == []
    assert store._r.data == {}


def test_api_is_up_uses_probe():
    assert pi.api_is_up("http://example.invalid/health", opener=lambda _u: True)
    assert not pi.api_is_up("http://example.invalid/health", opener=lambda _u: False)
    def boom(_u):
        raise OSError("down")
    assert not pi.api_is_up("http://example.invalid/health", opener=boom)


def test_heartbeat_default_shorter_than_grace(monkeypatch):
    monkeypatch.delenv("LABS_OPF_INTEREST_HEARTBEAT_S", raising=False)
    monkeypatch.setenv("LABS_MB_INTEREST_GRACE_S", "45")
    assert pi.heartbeat_s() == 15.0


def test_heartbeat_at_or_above_grace_fail_loud(monkeypatch):
    monkeypatch.setenv("LABS_OPF_INTEREST_HEARTBEAT_S", "45")
    monkeypatch.setenv("LABS_MB_INTEREST_GRACE_S", "45")
    with pytest.raises(pi.PlaneInterestConfigError):
        pi.heartbeat_s()


def test_health_url_from_port(monkeypatch):
    monkeypatch.delenv("LABS_PLANE_INTEREST_HEALTH_URL", raising=False)
    monkeypatch.setenv("LABS_PORT", "4001")
    assert pi.health_url() == "http://127.0.0.1:4001/api/health"
