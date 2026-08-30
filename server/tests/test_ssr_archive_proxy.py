"""Labs archive proxy: 501 absent, unreachable named, session-only, cache, must-revalidate."""

from __future__ import annotations

import json

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from config import ConfigError, validate_ssr_archive_env
from routes.ssr_archive import NOT_CONFIGURED, UNREACHABLE, router


TOKEN_32 = "a" * 32


@pytest.fixture()
def app(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_SSR_ARCHIVE_URL", "http://studioone.example:5055")
    monkeypatch.setenv("LABS_SSR_ARCHIVE_TOKEN", TOKEN_32)
    monkeypatch.setenv("LABS_SSR_ARCHIVE_CACHE_ROOT", str(tmp_path))
    application = FastAPI()
    application.include_router(router)

    @application.middleware("http")
    async def _auth(request, call_next):
        request.state.actor = type("A", (), {"claims": {"sub": "1", "role": "navigator"}})()
        return await call_next(request)

    return application


def _session(monkeypatch, role: str = "navigator"):
    monkeypatch.setattr(
        "routes.ssr_archive.require_session",
        lambda request: {"sub": "1", "role": role, "identity_id": 1},
    )
    if role == "administrator":
        monkeypatch.setattr(
            "routes.ssr_archive.require_admin",
            lambda request: {"sub": "1", "role": "administrator", "identity_id": 1},
        )
    else:
        def _forbid(_request):
            raise HTTPException(status_code=403, detail="Administrator role required")

        monkeypatch.setattr("routes.ssr_archive.require_admin", _forbid)


def test_absent_env_is_501_not_boot_abort(monkeypatch):
    """AT-SOAR-19."""
    monkeypatch.delenv("LABS_SSR_ARCHIVE_URL", raising=False)
    monkeypatch.delenv("LABS_SSR_ARCHIVE_TOKEN", raising=False)
    monkeypatch.delenv("LABS_SSR_ARCHIVE_CACHE_ROOT", raising=False)
    settings = validate_ssr_archive_env()
    assert settings["url"] is None
    application = FastAPI()
    application.include_router(router)
    _session(monkeypatch)
    client = TestClient(application)
    res = client.get("/api/me/options-lab/archive/coverage")
    assert res.status_code == 501
    assert res.json()["error"] == NOT_CONFIGURED["error"]


def test_malformed_url_aborts():
    """AT-SOAR-20."""
    import os

    os.environ["LABS_SSR_ARCHIVE_URL"] = "not-a-url"
    try:
        with pytest.raises(ConfigError, match="LABS_SSR_ARCHIVE_URL"):
            validate_ssr_archive_env()
    finally:
        os.environ.pop("LABS_SSR_ARCHIVE_URL", None)


def test_short_token_aborts(monkeypatch):
    monkeypatch.setenv("LABS_SSR_ARCHIVE_URL", "http://studioone.example:5055")
    monkeypatch.setenv("LABS_SSR_ARCHIVE_TOKEN", "short")
    with pytest.raises(ConfigError, match="LABS_SSR_ARCHIVE_TOKEN"):
        validate_ssr_archive_env()


def test_coverage_unreachable_is_empty(app, monkeypatch):
    """AT-SOAR-21."""
    _session(monkeypatch)

    def _boom(*_a, **_k):
        raise ConnectionError("down")

    monkeypatch.setattr("routes.ssr_archive._studioone_get", _boom)
    client = TestClient(app)
    res = client.get("/api/me/options-lab/archive/coverage?symbols=SPX")
    assert res.status_code == 200
    body = res.json()
    assert body["unreachable"] is True
    assert body["days"] == []
    assert body["error"] == UNREACHABLE["error"]
    assert "no-store" not in (res.headers.get("cache-control") or "").lower()
    assert "must-revalidate" in (res.headers.get("cache-control") or "").lower()


def test_401_is_not_empty_coverage(app, monkeypatch):
    """AT-SOAR-22."""
    _session(monkeypatch)
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (401, {"error": "nope"}),
    )
    client = TestClient(app)
    res = client.get("/api/me/options-lab/archive/coverage")
    assert res.status_code == 401
    assert res.json()["error"] == "ARCHIVE AUTH"
    assert "days" not in res.json() or res.json().get("days") != []


def test_coverage_must_revalidate(app, monkeypatch):
    """AT-SOAR-25."""
    _session(monkeypatch)
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (200, {"days": [{"date": "2026-08-25"}], "hash": "abc", "api_version": 1}),
    )
    client = TestClient(app)
    res = client.get("/api/me/options-lab/archive/coverage")
    assert res.status_code == 200
    cc = (res.headers.get("cache-control") or "").lower()
    assert "must-revalidate" in cc
    assert "no-store" not in cc
    assert res.headers.get("etag") == '"abc"'


def test_no_studioone_url_in_body(app, monkeypatch):
    """AT-SOAR-24."""
    _session(monkeypatch)
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (200, {"days": [], "api_version": 1}),
    )
    client = TestClient(app)
    res = client.get("/api/me/options-lab/archive/coverage")
    dumped = json.dumps(res.json())
    assert "studioone.example" not in dumped
    assert "5055" not in dumped


def test_member_index_session_only_no_tool_gate(app, monkeypatch):
    """AT-SOAR-29 member side."""
    _session(monkeypatch, role="observer")
    calls = []

    def _get(path, timeout):
        calls.append(path)
        return 200, {"hash": "h1", "snaps": [], "count": 0, "api_version": 1, "hole": None}

    monkeypatch.setattr("routes.ssr_archive._studioone_get", _get)
    client = TestClient(app)
    res = client.get("/api/me/options-lab/archive/index?day=2026-08-25&symbol=SPX")
    assert res.status_code == 200
    assert "expiration=" not in calls[0]


def test_expiration_forwarded(app, monkeypatch):
    _session(monkeypatch)
    calls = []

    def _get(path, timeout):
        calls.append(path)
        return 404, {"hole": "WRONG BOOK", "snaps": [], "api_version": 1}

    monkeypatch.setattr("routes.ssr_archive._studioone_get", _get)
    client = TestClient(app)
    res = client.get(
        "/api/me/options-lab/archive/index?day=2026-08-25&symbol=SPX&expiration=2026-08-26"
    )
    assert res.status_code == 404
    assert "expiration=2026-08-26" in calls[0]


def test_second_fetch_is_disk_cache_hit(app, monkeypatch):
    """AT-SOAR-26."""
    _session(monkeypatch)
    calls = []

    def _get(path, timeout):
        calls.append(path)
        return (
            200,
            {
                "hash": "bookhash",
                "snaps": [{"_index": 0}],
                "returned": 1,
                "api_version": 1,
            },
        )

    monkeypatch.setattr("routes.ssr_archive._studioone_get", _get)
    client = TestClient(app)
    q = "/api/me/options-lab/archive/fetch?day=2026-08-25&symbol=SPX&level=0&day_hash=bookhash"
    first = client.get(q)
    second = client.get(q)
    assert first.status_code == 200
    assert second.status_code == 200
    assert len(calls) == 1
    assert second.headers.get("x-labs-archive-cache") == "hit"
    assert first.json() == second.json()
    assert "_cache_hit" not in second.json()


def test_admin_stats_forbidden_for_member(app, monkeypatch):
    """AT-SOAR-29 admin side."""
    _session(monkeypatch, role="navigator")
    client = TestClient(app)
    res = client.get("/api/admin/options-lab/archive/stats")
    assert res.status_code == 403


def test_admin_cadence_ok_for_admin(app, monkeypatch):
    _session(monkeypatch, role="administrator")
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (200, {"days": [], "api_version": 1}),
    )
    client = TestClient(app)
    res = client.get("/api/admin/options-lab/archive/cadence?symbols=SPX")
    assert res.status_code == 200


def test_version_mismatch_is_502(app, monkeypatch):
    _session(monkeypatch)
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (200, {"days": [], "api_version": 9}),
    )
    client = TestClient(app)
    res = client.get("/api/me/options-lab/archive/coverage")
    assert res.status_code == 502
    assert res.json()["error"] == "VERSION MISMATCH"


def test_marks_absent_env_is_501(monkeypatch):
    monkeypatch.delenv("LABS_SSR_ARCHIVE_URL", raising=False)
    monkeypatch.delenv("LABS_SSR_ARCHIVE_TOKEN", raising=False)
    monkeypatch.delenv("LABS_SSR_ARCHIVE_CACHE_ROOT", raising=False)
    application = FastAPI()
    application.include_router(router)
    _session(monkeypatch)
    client = TestClient(application)
    res = client.get(
        "/api/me/options-lab/archive/marks?day=2026-08-27&t=2026-08-27T14:32:06-04:00&symbols=VIX"
    )
    assert res.status_code == 501
    assert res.json()["error"] == NOT_CONFIGURED["error"]


def test_marks_unreachable_is_named_empty(app, monkeypatch):
    _session(monkeypatch)

    def _boom(*_a, **_k):
        raise ConnectionError("down")

    monkeypatch.setattr("routes.ssr_archive._studioone_get", _boom)
    client = TestClient(app)
    res = client.get(
        "/api/me/options-lab/archive/marks?day=2026-08-27&t=2026-08-27T14:32:06-04:00&symbols=VIX"
    )
    assert res.status_code == 200
    body = res.json()
    assert body["unreachable"] is True
    assert body["error"] == UNREACHABLE["error"]
    assert body.get("marks") in (None, [], body.get("days", []))


def test_marks_401_is_not_empty_tape(app, monkeypatch):
    _session(monkeypatch)
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (401, {"error": "nope"}),
    )
    client = TestClient(app)
    res = client.get(
        "/api/me/options-lab/archive/marks?day=2026-08-27&t=2026-08-27T14:32:06-04:00&symbols=VIX"
    )
    assert res.status_code == 401
    assert res.json()["error"] == "ARCHIVE AUTH"
    assert res.json().get("marks") != []


def test_marks_pass_through_source_not_in_mid(app, monkeypatch):
    _session(monkeypatch)
    payload = {
        "day": "2026-08-27",
        "t": "2026-08-27T14:32:06-04:00",
        "api_version": 1,
        "hole": None,
        "marks": [
            {
                "symbol": "VIX",
                "mid": 17.855,
                "source": "massive_proxy_v1",
                "label": "Proxy underlier via VIXY (massive_proxy_v1)",
                "hole": None,
            }
        ],
    }
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (200, payload),
    )
    client = TestClient(app)
    res = client.get(
        "/api/me/options-lab/archive/marks?day=2026-08-27&t=2026-08-27T14:32:06-04:00&symbols=VIX,SPY"
    )
    assert res.status_code == 200
    row = res.json()["marks"][0]
    assert row["mid"] == 17.855
    assert row["source"] == "massive_proxy_v1"
    assert "proxy" not in str(row["mid"]).lower()
    dumped = json.dumps(res.json())
    assert "studioone.example" not in dumped
    assert "5055" not in dumped


def test_marks_upstream_404_is_404_not_empty_200(app, monkeypatch):
    """Unbounced dash 404 must not look like an empty native tape."""
    _session(monkeypatch)
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (404, {"error": "not found"}),
    )
    client = TestClient(app)
    res = client.get(
        "/api/me/options-lab/archive/marks?day=2026-08-27&t=2026-08-27T14:32:06-04:00&symbols=VIX"
    )
    assert res.status_code == 404
    assert res.json().get("error") == "not found"


def test_marks_observer_session_ok(app, monkeypatch):
    _session(monkeypatch, role="observer")
    monkeypatch.setattr(
        "routes.ssr_archive._studioone_get",
        lambda *_a, **_k: (
            200,
            {"api_version": 1, "marks": [], "hole": "MARKS NONE"},
        ),
    )
    client = TestClient(app)
    res = client.get(
        "/api/me/options-lab/archive/marks?day=2026-08-27&t=2026-08-27T14:32:06-04:00"
    )
    assert res.status_code == 200
    assert res.json()["hole"] == "MARKS NONE"


def test_hold_resident_post_204(app, monkeypatch):
    _session(monkeypatch)
    calls: list[tuple] = []

    def _rec(iid, **kw):
        calls.append((iid, kw))

    monkeypatch.setattr("routes.ssr_archive.record_hold_resident", _rec)
    client = TestClient(app)
    res = client.post(
        "/api/me/options-lab/archive/hold-resident",
        json={
            "day": "2026-08-27",
            "symbol": "SPX",
            "gen_count": 36107,
            "heap_bytes": 553_000_000,
            "fidelity": 1,
        },
    )
    assert res.status_code == 204
    assert calls[0][0] == 1
    assert calls[0][1]["day"] == "2026-08-27"
    assert calls[0][1]["heap_bytes"] == 553_000_000
    assert calls[0][1]["gen_count"] == 36107


def test_hold_resident_admin_forbidden_for_member(app, monkeypatch):
    _session(monkeypatch, role="navigator")
    client = TestClient(app)
    res = client.get("/api/admin/options-lab/archive/hold-resident")
    assert res.status_code == 403


def test_hold_resident_admin_summary_has_no_identity(app, monkeypatch):
    _session(monkeypatch, role="administrator")
    monkeypatch.setattr(
        "routes.ssr_archive.summarize_holds",
        lambda: {
            "n": 1,
            "n_holds": 1,
            "heap_avg": 553_000_000,
            "heap_max": 553_000_000,
            "n_over_400mb": 1,
            "largest": [
                {
                    "day": "2026-08-27",
                    "symbol": "SPX",
                    "gen_count": 36107,
                    "heap_bytes": 553_000_000,
                    "fidelity": 1.0,
                    "created_at": "2026-08-29T12:00:00",
                }
            ],
            "api_version": 1,
        },
    )
    client = TestClient(app)
    res = client.get("/api/admin/options-lab/archive/hold-resident")
    assert res.status_code == 200
    body = res.json()
    dumped = json.dumps(body)
    assert "identity_id" not in dumped
    assert "identity" not in dumped
    assert body["largest"][0]["heap_bytes"] == 553_000_000


def test_tm_consumes_labs_marks_not_studioone() -> None:
    """TMI-94: VIX from Labs archive/marks. Never studioone:5055 from the tab."""
    import pathlib

    web = pathlib.Path(__file__).resolve().parents[2] / "web" / "lib" / "options-lab"
    files = list(web.glob("*.ts")) + list(web.glob("*.tsx"))
    marks_hits = [str(p) for p in files if "archive/marks" in p.read_text(encoding="utf-8")]
    assert marks_hits, "TM must consume Labs /api/me/options-lab/archive/marks"
    studio = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        if "5055" in text or "studioone.local" in text.lower():
            studio.append(str(path))
    assert studio == []
