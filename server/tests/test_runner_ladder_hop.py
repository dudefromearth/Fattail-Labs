"""Runner ladder hop — one read under every template.

The member route and the market socket call ``fetch_runner_ladder``.
The plane serves ``mb:ladder`` then ``mb:ladder-last``. Massive is not
on those handlers.
"""

from __future__ import annotations

import inspect
import json
import subprocess
import threading
import time
from pathlib import Path

import pytest
from fastapi import HTTPException

from market_data.chain_ladder import content_hash
from market_data.massive_client import MassiveClient
from market_data.ssr_snapshot_dash import QuietHTTPServer, Handler
from routes.chain_ladder import (
    _SERVED_LAST,
    fetch_runner_ladder,
    get_chain_ladder,
    list_chain_ladder_expirations,
)
from routes.market_stream import _chain_push_loop, _chain_wire, _handle_sub

REPO = Path(__file__).resolve().parents[2]
EXP = "2026-08-24"
TOKEN = "t" * 32
_ENVELOPE = {
    "unchanged",
    "mode",
    "product",
    "ladder",
    "content_hash",
    "opf_session",
    "server_time",
    "stale",
    "epoch_quality",
}


class MemRedis:
    def __init__(self) -> None:
        self.kv: dict[str, str] = {}
        self.ttl: dict[str, int | None] = {}
        self.gets: list[str] = []

    def get(self, key: str):
        self.gets.append(key)
        return self.kv.get(key)

    def set(self, key: str, value: str, ex: int | None = None):
        self.kv[key] = value
        self.ttl[key] = ex
        return True

    def scan_iter(self, match: str | None = None, count: int = 100):
        import fnmatch

        for key in list(self.kv):
            if match is None or fnmatch.fnmatch(key, match):
                yield key


def _payload(*, fetched_at: float) -> dict:
    p = {
        "underlier": "I:SPX",
        "product": "SPX",
        "expiration": EXP,
        "dual_side": True,
        "spot": 5600.0,
        "vix": 15.0,
        "rows": [
            {"strike": 5600, "side": "call", "mid": 1.0, "bid": 0.9, "ask": 1.1},
            {"strike": 5600, "side": "put", "mid": 1.0, "bid": 0.9, "ask": 1.1},
        ],
        "as_of": "2026-08-22T00:00:00Z",
        "fetched_at_unix": fetched_at,
        "wings": 25,
    }
    p["content_hash"] = content_hash(p)
    return p


def _forbid_massive(monkeypatch) -> None:
    def _init(self, *args, **kwargs):
        raise AssertionError("MassiveClient constructed")

    monkeypatch.setattr(MassiveClient, "__init__", _init)


def _member(monkeypatch) -> None:
    monkeypatch.setattr(
        "routes.chain_ladder.require_session", lambda request: {"sub": "probe"}
    )
    monkeypatch.setattr(
        "routes.chain_ladder._require_tool_member", lambda *a, **k: None
    )
    monkeypatch.setattr(
        "routes.chain_ladder._resolve_universe_symbol",
        lambda symbol: {
            "product": "SPX",
            "chain_underlier": "I:SPX",
            "kind": "index",
            "strike_step": 5.0,
        },
    )


@pytest.fixture
def plane(monkeypatch):
    redis = MemRedis()
    monkeypatch.setattr(
        "market_data.ssr_snapshot_dash.ladder_redis_client", lambda: redis
    )
    monkeypatch.setattr(
        "market_data.ssr_snapshot_dash.resolve_ladder_symbol",
        lambda symbol: {
            "product": "SPX",
            "chain_underlier": "I:SPX",
            "kind": "index",
        },
    )
    monkeypatch.setenv("LABS_SSR_ARCHIVE_TOKEN", TOKEN)
    monkeypatch.delenv("LABS_LADDER_HOP", raising=False)
    httpd = QuietHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    monkeypatch.setenv("LABS_SSR_ARCHIVE_URL", f"http://127.0.0.1:{port}")
    try:
        yield redis
    finally:
        httpd.shutdown()


def _call(**kwargs):
    return get_chain_ladder(
        object(),
        expiration=kwargs.get("expiration", EXP),
        symbol="SPX",
        underlier=None,
        side="call",
        wings=kwargs.get("wings", 25),
        since_hash=None,
    )


def test_hot_document_follows_provenance_and_skips_massive(monkeypatch, plane):
    _member(monkeypatch)
    _forbid_massive(monkeypatch)
    fresh = _payload(fetched_at=time.time())
    raw = json.dumps(fresh)
    hot = f"mb:ladder:I:SPX:{EXP}:w25:dual"
    last = f"mb:ladder-last:I:SPX:{EXP}:w25:dual"
    plane.kv[hot] = raw
    out = _call()
    assert set(out) == _ENVELOPE
    assert out["mode"] == "full"
    assert out["content_hash"] == fresh["content_hash"]
    assert out["ladder"]["content_hash"] == fresh["content_hash"]
    assert out["stale"] is False
    assert out["ladder"]["stale"] is False
    assert isinstance(out["epoch_quality"], str) and out["epoch_quality"]
    assert _SERVED_LAST not in out["ladder"]
    assert _SERVED_LAST not in out
    assert plane.kv[last] == raw
    assert plane.ttl[last] == 18 * 60 * 60
    assert f"mb:interest:{hot}" in plane.kv

    aged = _payload(fetched_at=time.time() - 120)
    plane.kv[hot] = json.dumps(aged)
    older = _call()
    assert older["stale"] is True
    assert older["ladder"]["stale"] is True
    assert older["content_hash"] == aged["content_hash"]


def test_last_document_same_hash_forced_stale(monkeypatch, plane):
    _member(monkeypatch)
    _forbid_massive(monkeypatch)
    fresh = _payload(fetched_at=time.time())
    raw = json.dumps(fresh)
    last = f"mb:ladder-last:I:SPX:{EXP}:w25:dual"
    plane.kv[last] = raw
    plane.ttl[last] = None
    out = _call()
    assert out["content_hash"] == fresh["content_hash"]
    assert out["ladder"]["content_hash"] == fresh["content_hash"]
    assert out["stale"] is True
    assert out["ladder"]["stale"] is True
    assert _SERVED_LAST not in out["ladder"]
    assert plane.ttl[last] is None


def test_neither_key_is_502_inside_two_seconds(monkeypatch, plane):
    _member(monkeypatch)
    _forbid_massive(monkeypatch)
    started = time.perf_counter()
    with pytest.raises(HTTPException) as exc:
        _call()
    elapsed = time.perf_counter() - started
    assert exc.value.status_code == 502
    assert exc.value.detail == f"No option contracts returned for SPX {EXP}"
    assert elapsed < 2.0
    assert any(k.startswith("mb:interest:mb:ladder:") for k in plane.kv)


def test_wings_100_reads_w50(monkeypatch, plane):
    _member(monkeypatch)
    _forbid_massive(monkeypatch)
    doc = _payload(fetched_at=time.time())
    doc["wings"] = 50
    doc["content_hash"] = content_hash(doc)
    raw = json.dumps(doc)
    plane.kv[f"mb:ladder:I:SPX:{EXP}:w50:dual"] = raw
    out = _call(wings=100)
    assert out["ladder"]["wings_requested"] == 100
    assert out["ladder"]["wings_effective"] == 50
    assert out["content_hash"] == doc["content_hash"]
    assert any(":w50:dual" in key for key in plane.gets)
    assert not any(":w100:" in key for key in plane.gets)
    assert "mb:interest:mb:ladder:I:SPX:" + EXP + ":w50:dual" in plane.kv


def test_socket_subscribe_and_push_use_shared_hop():
    sub = inspect.getsource(_handle_sub)
    push = inspect.getsource(_chain_push_loop)
    assert "fetch_runner_ladder" in sub
    assert "fetch_runner_ladder" in push
    assert "_fetch_ladder" not in sub
    assert "_fetch_ladder" not in push
    fresh = _payload(fetched_at=time.time())
    fresh[_SERVED_LAST] = True
    frame = _chain_wire(
        mode="full",
        key=f"chain:SPX:{EXP}:w25",
        ladder=fresh,
        session_open=True,
    )
    assert frame["stale"] is True
    assert frame["ladder"]["stale"] is True
    assert _SERVED_LAST not in frame["ladder"]
    assert frame["content_hash"] == fresh["content_hash"]


def test_hop_off_uses_todays_path_and_unset_url_is_503(monkeypatch):
    _member(monkeypatch)
    _forbid_massive(monkeypatch)
    monkeypatch.delenv("LABS_SSR_ARCHIVE_URL", raising=False)
    monkeypatch.setenv("LABS_LADDER_HOP", "off")
    seen: dict = {}

    def _today(**kwargs):
        seen.update(kwargs)
        doc = _payload(fetched_at=time.time())
        doc["wings_requested"] = kwargs["wings"]
        doc["wings_effective"] = kwargs["wings"]
        return doc

    monkeypatch.setattr("routes.chain_ladder._fetch_ladder", _today)
    out = _call(wings=100)
    assert seen["wings"] == 50
    assert out["ladder"]["wings_requested"] == 100
    assert out["ladder"]["wings_effective"] == 50

    monkeypatch.delenv("LABS_LADDER_HOP", raising=False)
    with pytest.raises(HTTPException) as exc:
        fetch_runner_ladder(
            product="SPX",
            chain_underlier="I:SPX",
            kind="index",
            expiration=EXP,
            side="call",
            wings=25,
        )
    assert exc.value.status_code == 503


def test_chain_feed_uncached_still_resolves():
    import routes.chain_ladder as cl
    from market_data import chain_feed

    assert callable(cl._fetch_ladder_uncached)
    lines = Path(chain_feed.__file__).read_text().splitlines()
    assert "_fetch_ladder_uncached" in lines[93]


def test_git_grep_handlers_and_stream_do_not_reach_massive():
    banned = (
        "MassiveClient",
        "fetch_option_chain",
        "fetch_option_chain_until",
        "_fetch_ladder_uncached",
        "_scan_expirations_live",
    )
    for fn in (get_chain_ladder, list_chain_ladder_expirations):
        src = inspect.getsource(fn)
        for name in banned:
            assert name not in src, f"{fn.__name__} reaches {name}"
    stream = (REPO / "server/routes/market_stream.py").read_text()
    for name in (
        "MassiveClient",
        "fetch_option_chain",
        "fetch_option_chain_until",
        "_fetch_ladder",
    ):
        assert name not in stream, name
    probe = subprocess.run(
        [
            "git",
            "grep",
            "-n",
            "-e",
            "MassiveClient",
            "-e",
            "fetch_option_chain",
            "-e",
            "_fetch_ladder",
            "--",
            "server/routes/market_stream.py",
        ],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    assert probe.returncode == 1, probe.stdout
