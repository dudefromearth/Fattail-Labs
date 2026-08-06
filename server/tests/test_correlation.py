"""Pearson correlation helpers + API."""

from __future__ import annotations

import identity as identity_mod
from market_data.correlation import pearson, daily_log_returns
from tests.conftest import cookie_for
import db


def test_pearson_perfect():
    xs = [1.0, 2.0, 3.0, 4.0, 5.0]
    ys = [2.0, 4.0, 6.0, 8.0, 10.0]
    r = pearson(xs, ys)
    assert r is not None
    assert abs(r - 1.0) < 1e-9


def test_pearson_inverse():
    xs = [1.0, 2.0, 3.0, 4.0, 5.0]
    ys = [10.0, 8.0, 6.0, 4.0, 2.0]
    r = pearson(xs, ys)
    assert r is not None
    assert abs(r + 1.0) < 1e-9


def test_daily_returns_len():
    assert len(daily_log_returns([100.0, 101.0, 102.0])) == 2


def test_correlation_api_identical(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-corr@labs.test", "ZZ Corr"
            )
    cookies = cookie_for("navigator", identity_id=iid)
    r = client.get(
        "/api/me/strategy-lab/curate/correlation?a=SPY&b=SPY",
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["coefficient"] == 1.0


def test_correlation_api_spy_qqq(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-corr2@labs.test", "ZZ Corr2"
            )
    cookies = cookie_for("navigator", identity_id=iid)
    r = client.get(
        "/api/me/strategy-lab/curate/correlation?a=SPY&b=QQQ&days=60",
        cookies=cookies,
    )
    # Requires Massive — skip soft if env missing
    if r.status_code == 422 and "MASSIVE" in r.text.upper():
        return
    if r.status_code == 422 and "insufficient" in r.text.lower():
        return
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["symbol_a"] == "SPY"
    assert j["symbol_b"] == "QQQ"
    assert -1.0 <= j["coefficient"] <= 1.0
    assert j["n_returns"] is None or j["n_returns"] >= 3
