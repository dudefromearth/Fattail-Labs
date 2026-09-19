"""SYM1-DEPLOY-G — contract tests against the live StudioOne sidecar.

Skipped unless LABS_SYMBOLOGY_API_BASE is set (LAN pin, never studioone.local).
Computing-class: unauthenticated 401, member 403, administrator 200.
Does not touch chain_feed. Isolation: this file + HTTP to the sidecar.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request

import pytest

from tests.conftest import cookie_for

BASE = (os.environ.get("LABS_SYMBOLOGY_API_BASE") or "").strip().rstrip("/")

pytestmark = pytest.mark.skipif(
    not BASE, reason="LABS_SYMBOLOGY_API_BASE not set (StudioOne live)"
)

ADMIN = cookie_for("administrator")
MEMBER = cookie_for("navigator")
COOKIE = next(iter(ADMIN))


def _url(path: str, **params: str) -> str:
    qs = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    return f"{BASE}{path}" + (f"?{qs}" if qs else "")


def _request(method: str, path: str, cookies: dict | None = None, **kwargs):
    headers = {"Accept": "application/json"}
    body = kwargs.pop("json", None)
    params = kwargs.pop("params", {}) or {}
    if cookies:
        headers["Cookie"] = "; ".join(f"{k}={v}" for k, v in cookies.items())
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(
        _url(path, **params), data=data, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read()
            parsed = json.loads(raw.decode("utf-8")) if raw else None
            return resp.status, parsed
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            parsed = json.loads(raw.decode("utf-8")) if raw else None
        except json.JSONDecodeError:
            parsed = raw.decode("utf-8", errors="replace")
        return exc.code, parsed


def get(path: str, cookies: dict | None = None, **params):
    return _request("GET", path, cookies=cookies, params=params)


def post(path: str, cookies: dict | None = None, body: dict | None = None):
    return _request("POST", path, cookies=cookies, json=body or {})


PATHS = (
    "/symbology/v1/health",
    "/symbology/v1/universe",
    "/symbology/v1/resolve",
    "/symbology/v1/roll-catalog",
    "/symbology/v1/eligibility-report",
)


@pytest.mark.parametrize("path", PATHS)
def test_unauthenticated_401(path):
    status, _ = get(path)
    assert status == 401


@pytest.mark.parametrize("path", PATHS)
def test_member_403_computing_class(path):
    status, body = get(path, cookies=MEMBER)
    assert status == 403
    assert body["error"] == "computing_consumers_only"


def test_health_computing_200():
    status, body = get("/symbology/v1/health", cookies=ADMIN)
    assert status == 200, body
    assert body["ok"] is True
    assert body["service"] == "symbology"
    assert body["strip_generation_id"] == "sg-20260919-001"


def test_universe_picker_four_coming():
    status, body = get("/symbology/v1/universe", cookies=ADMIN)
    assert status == 200, body
    assert [g["root"] for g in body["groups"]] == ["SPX", "XSP", "ES", "MES"]
    for group in body["groups"]:
        for row in group["rows"]:
            assert row.get("state") != "ACTIVE"


def test_esz6_matches_never_binds():
    status, body = get("/symbology/v1/resolve", cookies=ADMIN, q="ESZ6")
    assert status == 200, body
    assert body["type"] == "matches"
    assert body["binding"] is None
    assert "bound_symbol" not in body
    assert "ESZ2026" in [m["symbol"] for m in body["matches"]]


@pytest.mark.parametrize("q", ["ES1!", "/ES", "@ES"])
def test_continuity_alias_binds_dated_long_form(q):
    status, body = get("/symbology/v1/resolve", cookies=ADMIN, q=q)
    assert status == 200, body
    assert body["type"] == "binding"
    binding = body["binding"]
    assert binding["type"] == "continuity-alias"
    assert binding["bound_symbol"] == "ESZ2026"
    assert binding["bound_symbol"] != "ESZ6"


def test_named_not_built_preset_refused():
    status, body = get(
        "/symbology/v1/resolve", cookies=ADMIN, q="ES1!", preset="tv-1VO"
    )
    assert status == 422, body
    detail = body["detail"]
    assert detail["code"] == "named-not-built"
    assert detail["preset"] == "tv-1VO"


def test_unsupported_real_symbol_miss():
    status, body = get("/symbology/v1/resolve", cookies=ADMIN, q="NQ")
    assert status == 200, body
    assert body["type"] == "miss"
    assert body["miss"]["reason_code"] == "not-supported-yet"
    assert body["miss"]["copy"]


def test_roll_catalog_tv1vo_named_not_built():
    status, body = get("/symbology/v1/roll-catalog", cookies=ADMIN)
    assert status == 200, body
    by_id = {row["id"]: row for row in body["rows"]}
    assert by_id["tv-1VO"]["status"] == "named-not-built"
    assert by_id["tv-1VO"]["applyable"] is False


def test_eligibility_report_computing():
    status, body = get("/symbology/v1/eligibility-report", cookies=ADMIN)
    assert status == 200, body
    symbols = {row["symbol"] for row in body["rows"]}
    assert symbols == {"SPX", "XSP"}
    for row in body["rows"]:
        assert row["state"] == "COMING"
