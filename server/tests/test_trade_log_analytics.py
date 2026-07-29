"""PH1-2 analytics read models — isolation + contract (useful tests only)."""

from conftest import cookie_for
import db
import identity as identity_mod


def _id(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, email)


def _purge(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_trade_log_legs WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_accounts WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_entries WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM identity_links WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM credentials WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def _create_vertical_pair(client, cookies):
    acct = client.post(
        "/api/me/trade-log/accounts",
        cookies=cookies,
        json={"label": "AnalyticsA", "broker": "thinkorswim"},
    )
    assert acct.status_code == 200, acct.text
    aid = acct.json()["id"]
    open_r = client.post(
        "/api/me/trade-log/trades",
        cookies=cookies,
        json={
            "account_id": aid,
            "exec_at": "2026-03-10T09:30:00",
            "asset_class": "equity_option",
            "strategy": "VERTICAL",
            "order_type": "LMT",
            "net_price": 2.0,
            "net_side": "DEBIT",
            "legs": [
                {
                    "side": "BUY",
                    "quantity": 1,
                    "pos_effect": "TO_OPEN",
                    "underlier": "SPX",
                    "expiry": "2026-04-21",
                    "strike": 5000,
                    "right": "PUT",
                    "fill_price": 5.0,
                },
                {
                    "side": "SELL",
                    "quantity": 1,
                    "pos_effect": "TO_OPEN",
                    "underlier": "SPX",
                    "expiry": "2026-04-21",
                    "strike": 4995,
                    "right": "PUT",
                    "fill_price": 3.0,
                },
            ],
        },
    )
    assert open_r.status_code == 200, open_r.text
    close_r = client.post(
        "/api/me/trade-log/trades",
        cookies=cookies,
        json={
            "account_id": aid,
            "exec_at": "2026-03-10T15:00:00",
            "asset_class": "equity_option",
            "strategy": "VERTICAL",
            "order_type": "LMT",
            "net_price": 3.5,
            "net_side": "CREDIT",
            "legs": [
                {
                    "side": "SELL",
                    "quantity": 1,
                    "pos_effect": "TO_CLOSE",
                    "underlier": "SPX",
                    "expiry": "2026-04-21",
                    "strike": 5000,
                    "right": "PUT",
                    "fill_price": 4.0,
                },
                {
                    "side": "BUY",
                    "quantity": 1,
                    "pos_effect": "TO_CLOSE",
                    "underlier": "SPX",
                    "expiry": "2026-04-21",
                    "strike": 4995,
                    "right": "PUT",
                    "fill_price": 0.5,
                },
            ],
        },
    )
    assert close_r.status_code == 200, close_r.text
    return aid, open_r.json()["id"], close_r.json()["id"]


def test_analytics_reports_book_shape_and_synthetic_pnl(client):
    a = _id("zztest-tl-analytics-rb@labs.test")
    try:
        ca = cookie_for("activator", a)
        _create_vertical_pair(client, ca)
        r = client.get(
            "/api/me/trade-log/analytics/reports-book",
            cookies=ca,
            params={"starting_capital": 10000},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        for key in (
            "series",
            "end_balance",
            "max_drawdown_pct",
            "outcome_pnls",
            "has_pnl_data",
            "stats",
            "starting_capital",
        ):
            assert key in body, key
        assert body["starting_capital"] == 10000
        assert body["has_pnl_data"] is True
        # open DEBIT 2 + close CREDIT 3.5 → $150 synth
        assert 150.0 in body["outcome_pnls"]
        assert body["end_balance"] == 10150.0
        assert any(p.get("trade_id") for p in body["series"] if p.get("trade_index"))
    finally:
        _purge(a)


def test_analytics_day_book_open_and_activity(client):
    a = _id("zztest-tl-analytics-db@labs.test")
    try:
        ca = cookie_for("activator", a)
        _aid, open_id, close_id = _create_vertical_pair(client, ca)
        # Mid-lifecycle day not needed — same-day open+close
        r = client.get(
            "/api/me/trade-log/analytics/day-book",
            cookies=ca,
            params={"day": "2026-03-10"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["day"] == "2026-03-10"
        assert "items" in body and "activity" in body and "open_ids" in body
        act_ids = {i["trade_id"] for i in body["activity"]}
        assert open_id in act_ids
        assert close_id in act_ids
        # Both closed same day → neither still open after close
        assert open_id not in body["open_ids"]
    finally:
        _purge(a)


def test_analytics_isolation_cross_member(client):
    """Useful: peer cannot see trade_ids in another identity's analytics."""
    a = _id("zztest-tl-analytics-iso-a@labs.test")
    b = _id("zztest-tl-analytics-iso-b@labs.test")
    try:
        ca = cookie_for("activator", a)
        cb = cookie_for("activator", b)
        _aid, open_id, close_id = _create_vertical_pair(client, ca)

        peer_rb = client.get(
            "/api/me/trade-log/analytics/reports-book",
            cookies=cb,
            params={"starting_capital": 50000},
        )
        assert peer_rb.status_code == 200, peer_rb.text
        peer_ids = {
            p.get("trade_id")
            for p in peer_rb.json()["series"]
            if p.get("trade_id") is not None
        }
        assert open_id not in peer_ids
        assert close_id not in peer_ids

        peer_db = client.get(
            "/api/me/trade-log/analytics/day-book",
            cookies=cb,
            params={"day": "2026-03-10"},
        )
        assert peer_db.status_code == 200
        peer_item_ids = {i["trade_id"] for i in peer_db.json()["items"]}
        assert open_id not in peer_item_ids
        assert close_id not in peer_item_ids
    finally:
        _purge(a)
        _purge(b)


def test_analytics_observer_forbidden(client):
    a = _id("zztest-tl-analytics-obs@labs.test")
    try:
        co = cookie_for("observer", a)
        r = client.get(
            "/api/me/trade-log/analytics/reports-book",
            cookies=co,
        )
        assert r.status_code == 403
        r2 = client.get(
            "/api/me/trade-log/analytics/day-book",
            cookies=co,
            params={"day": "2026-03-10"},
        )
        assert r2.status_code == 403
    finally:
        _purge(a)


def test_analytics_day_requires_ymd(client):
    a = _id("zztest-tl-analytics-ymd@labs.test")
    try:
        ca = cookie_for("activator", a)
        r = client.get(
            "/api/me/trade-log/analytics/day-book",
            cookies=ca,
            params={"day": "not-a-date"},
        )
        assert r.status_code == 422
    finally:
        _purge(a)
