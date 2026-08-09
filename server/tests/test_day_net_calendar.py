"""JED-1 — Day net calendar domain + API (Spec v0.2)."""

from __future__ import annotations

import identity as identity_mod
from trade_log_domain.day_net_calendar import (
    build_day_net_calendar,
    intensity_step,
    tone_from_net,
)
from tests.conftest import cookie_for
import db


def test_intensity_buckets_stable():
    assert intensity_step(None) == 0
    assert intensity_step(49) == 1
    assert intensity_step(50) == 2
    assert intensity_step(249) == 2
    assert intensity_step(250) == 3
    assert intensity_step(999) == 3
    assert intensity_step(1000) == 4
    assert intensity_step(4999) == 4
    assert intensity_step(5000) == 5
    # T12: same $50 magnitude same step regardless of month narrative
    assert intensity_step(50) == intensity_step(-50)


def test_tone_from_net():
    assert tone_from_net(1, has_outcomes=True) == "credit"
    assert tone_from_net(-1, has_outcomes=True) == "debit"
    assert tone_from_net(0, has_outcomes=True) == "flat"
    assert tone_from_net(None, has_outcomes=False) == "none"


def test_build_day_net_empty():
    out = build_day_net_calendar([], from_day="2026-08-01", to_day="2026-08-31")
    assert out["period"]["net"] == 0
    assert out["period"]["outcome_days"] == 0
    assert out["days"] == []


def test_build_day_net_sums_closes_and_mean_r2r():
    """Day net = sum of close pnls; day_r2r = mean entry_r2r of opens that closed that day."""
    open_t = {
        "id": 1,
        "account_id": 1,
        "exec_at": "2026-08-01T10:00:00",
        "pnl_amount": None,
        "net_price": -1.0,
        "net_side": "DEBIT",
        "legs": [
            {
                "pos_effect": "TO_OPEN",
                "side": "BUY",
                "quantity": 1,
                "strike": 100,
                "expiry": "2026-08-15",
                "right": "CALL",
                "fill_price": 1.0,
            },
            {
                "pos_effect": "TO_OPEN",
                "side": "SELL",
                "quantity": 1,
                "strike": 110,
                "expiry": "2026-08-15",
                "right": "CALL",
                "fill_price": 0.0,
            },
        ],
    }
    close_t = {
        "id": 2,
        "account_id": 1,
        "exec_at": "2026-08-04T15:00:00",
        "pnl_amount": 120.0,
        "net_price": 0.5,
        "net_side": "CREDIT",
        "legs": [
            {
                "pos_effect": "TO_CLOSE",
                "side": "SELL",
                "quantity": 1,
                "strike": 100,
                "expiry": "2026-08-15",
                "right": "CALL",
                "fill_price": 0.5,
            },
            {
                "pos_effect": "TO_CLOSE",
                "side": "BUY",
                "quantity": 1,
                "strike": 110,
                "expiry": "2026-08-15",
                "right": "CALL",
                "fill_price": 0.0,
            },
        ],
    }
    out = build_day_net_calendar(
        [open_t, close_t],
        from_day="2026-08-01",
        to_day="2026-08-31",
    )
    assert out["period"]["outcome_days"] == 1
    assert out["period"]["net"] == 120.0
    d = out["days"][0]
    assert d["date"] == "2026-08-04"
    assert d["net"] == 120.0
    assert d["tone"] == "credit"
    assert d["intensity_step"] == 2  # 50 <= 120 < 250


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ DayNet")


def test_day_net_api_and_prefs(client):
    iid = _member("zztest-day-net-api@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.get(
            "/api/me/journal/day-net-calendar"
            "?from_day=2026-08-01&to_day=2026-08-31",
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["timezone"] == "America/New_York"
        assert "period" in body and "days" in body

        p = client.get("/api/me/journal/preferences", cookies=cookies)
        assert p.status_code == 200, p.text
        assert p.json()["day_net_map_enabled"] is True

        off = client.patch(
            "/api/me/journal/preferences",
            cookies=cookies,
            json={"day_net_map_enabled": False},
        )
        assert off.status_code == 200, off.text
        assert off.json()["day_net_map_enabled"] is False
        p2 = client.get("/api/me/journal/preferences", cookies=cookies)
        assert p2.json()["day_net_map_enabled"] is False
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_journal_prefs WHERE identity_id = %s",
                    (iid,),
                )
