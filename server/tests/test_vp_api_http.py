"""Contract v1.0 sidecar HTTP. 403 members even in dev."""

from __future__ import annotations

import os

import pytest

from market_data.vp_api.app import app
from tests.conftest import LabsTestClient, cookie_for


@pytest.fixture
def vp_client(monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", os.environ.get("LABS_MARKET_DATA_ROOT") or "")
    return LabsTestClient(app)


def test_unauthenticated_401(vp_client):
    r = vp_client.get("/v1/health")
    assert r.status_code == 401
    assert r.json()["error"] == "unauthenticated"


def test_member_403_even_in_dev(vp_client):
    member = cookie_for("activator", identity_id=0)
    r = vp_client.get("/v1/profile/SPX/developing", cookies=member)
    assert r.status_code == 403
    assert r.json()["error"] == "computing_consumers_only"


def test_composite_404(vp_client):
    admin = cookie_for("administrator", identity_id=0)
    r = vp_client.get("/v1/profile/SPX/composite", cookies=admin)
    assert r.status_code == 404


def _es_session(tmp_path):
    import json
    from datetime import date

    from market_data.vp_engine.coverage import mark_session
    from market_data.vp_engine.rebuild import histogram_path

    day = date(2026, 9, 17)
    mark_session(tmp_path, "ES", day, binned=True)
    hist = {
        "kind": "session",
        "session_date": "2026-09-17",
        "generation_id": "g-test",
        "parameter_hash": "p-test",
        "status": "COMPLETE",
        "flags": {"mapping": "FAILED", "approximation": "none"},
        "gaps": [],
        "vp_row": 0.25,
        "bins": [
            {"price": 7700.00, "volume": 10},
            {"price": 7700.25, "volume": 20},
            {"price": 7700.50, "volume": 30},
            {"price": 7700.75, "volume": 40},
        ],
    }
    path = histogram_path(tmp_path, "ES", day, "session")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(hist), encoding="utf-8")


def test_range_row_rebins_not_echo(tmp_path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    _es_session(tmp_path)
    client = LabsTestClient(app)
    admin = cookie_for("administrator", identity_id=0)
    native = client.get(
        "/v1/profile/SPX/range?from=2026-09-17&to=2026-09-17", cookies=admin
    )
    assert native.status_code == 200, native.text
    assert len(native.json()["bins"]) == 4
    assert native.json()["vp_row"] == 0.25
    rebinned = client.get(
        "/v1/profile/SPX/range?from=2026-09-17&to=2026-09-17&row=1", cookies=admin
    )
    assert rebinned.status_code == 200, rebinned.text
    body = rebinned.json()
    assert body["vp_row"] == 1.0
    assert len(body["bins"]) == 1
    assert body["bins"][0]["volume"] == 100
    assert body["flags"]["approximation"] == "display_rebin"
    assert body["flags"]["substrate_vp_row"] == 0.25


def test_range_row_below_substrate_422(tmp_path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    _es_session(tmp_path)
    client = LabsTestClient(app)
    admin = cookie_for("administrator", identity_id=0)
    r = client.get(
        "/v1/profile/SPX/range?from=2026-09-17&to=2026-09-17&row=0.1", cookies=admin
    )
    assert r.status_code == 422
    assert r.json()["error"] == "row_below_substrate"


def test_session_etag_304(tmp_path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    _es_session(tmp_path)
    client = LabsTestClient(app)
    admin = cookie_for("administrator", identity_id=0)
    r = client.get(
        "/v1/profile/SPX/session?session_date=2026-09-17", cookies=admin
    )
    assert r.status_code == 200, r.text
    etag = r.headers.get("etag")
    assert etag == '"g-test"'
    assert "immutable" in (r.headers.get("cache-control") or "")
    hit = client.get(
        "/v1/profile/SPX/session?session_date=2026-09-17",
        cookies=admin,
        headers={"If-None-Match": etag},
    )
    assert hit.status_code == 304
    assert hit.headers.get("etag") == etag
    assert hit.content in (b"", b"null")


def test_developing_revalidate_header(tmp_path, monkeypatch):
    import json
    from datetime import date

    from market_data.vp_engine.rebuild import histogram_path

    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    path = histogram_path(tmp_path, "ES", date.today(), "developing")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "kind": "developing",
                "generation_id": "g-dev",
                "parameter_hash": "p-dev",
                "status": "COMPLETE",
                "flags": {"mapping": "FAILED", "approximation": "none"},
                "gaps": [],
                "vp_row": 0.25,
                "bins": [{"price": 7700.00, "volume": 1}],
            }
        ),
        encoding="utf-8",
    )
    client = LabsTestClient(app)
    admin = cookie_for("administrator", identity_id=0)
    r = client.get("/v1/profile/SPX/developing", cookies=admin)
    assert r.status_code == 200, r.text
    cc = r.headers.get("cache-control") or ""
    assert "must-revalidate" in cc
    assert "immutable" not in cc
    assert r.headers.get("etag") == '"g-dev"'


def test_health_coverage_block(vp_client):
    admin = cookie_for("administrator", identity_id=0)
    r = vp_client.get("/v1/health", cookies=admin)
    assert r.status_code == 200, r.text
    cov = r.json()["coverage"]
    assert "ES" in cov and "floor_session" in cov["ES"]
    assert "sessions_binned" in cov["ES"]
