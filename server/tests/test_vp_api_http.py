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
