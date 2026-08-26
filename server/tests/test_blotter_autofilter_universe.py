"""TLAB1 — blotter Autofilter universe is the account book, not the first page."""

from conftest import cookie_for
from test_trade_log import _id, _purge


def test_years_filter_returns_off_page_2022_and_counts(client):
    a = _id("zztest-tlab-universe@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Book", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        leg = {
            "side": "BUY",
            "quantity": 1,
            "pos_effect": "TO_OPEN",
            "underlier": "SPX",
            "expiry": "2026-12-18",
            "strike": 5000,
            "right": "PUT",
            "fill_price": 1.0,
        }
        old = client.post(
            "/api/me/trade-log/trades",
            cookies=ca,
            json={
                "account_id": aid,
                "exec_at": "2022-09-06T14:00:00",
                "strategy": "VERTICAL",
                "asset_class": "equity_option",
                "order_type": "LMT",
                "net_price": 1.0,
                "net_side": "DEBIT",
                "adherence": "unknown",
                "legs": [{**leg, "expiry": "2022-09-16"}],
            },
        )
        assert old.status_code == 200, old.text
        old_id = old.json()["id"]
        new = client.post(
            "/api/me/trade-log/trades",
            cookies=ca,
            json={
                "account_id": aid,
                "exec_at": "2026-08-17T14:00:00",
                "strategy": "BUTTERFLY",
                "asset_class": "equity_option",
                "order_type": "LMT",
                "net_price": 1.0,
                "net_side": "DEBIT",
                "adherence": "unknown",
                "legs": [leg],
            },
        )
        assert new.status_code == 200, new.text

        page = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&limit=1",
            cookies=ca,
        )
        assert page.status_code == 200, page.text
        body = page.json()
        assert body["book_count"] == 2
        assert body["match_count"] == 2
        assert len(body["trades"]) == 1
        assert body["trades"][0]["id"] == new.json()["id"]

        y2022 = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&years=2022&limit=80",
            cookies=ca,
        )
        assert y2022.status_code == 200, y2022.text
        yb = y2022.json()
        assert yb["match_count"] == 1
        assert yb["book_count"] == 2
        assert [t["id"] for t in yb["trades"]] == [old_id]

        day = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&days=2022-09-06&limit=80",
            cookies=ca,
        )
        assert day.status_code == 200, day.text
        db = day.json()
        assert db["match_count"] == 1
        assert [t["id"] for t in db["trades"]] == [old_id]

        fb = client.get("/api/me/trade-log/distincts", cookies=ca)
        assert fb.status_code == 200, fb.text
        assert "months" in fb.json()
        assert "statuses" not in fb.json()

        dist = client.get(
            f"/api/me/trade-log/distincts?blotter=1&account_id={aid}",
            cookies=ca,
        )
        assert dist.status_code == 200, dist.text
        d = dist.json()
        assert "2022-09-06" in (d.get("days") or [])
        assert "2026-08-17" in (d.get("days") or [])
        assert "VERTICAL" in (d.get("strategies") or [])
        assert "Open" in (d.get("statuses") or [])

        st = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&statuses=Open&limit=80",
            cookies=ca,
        )
        assert st.status_code == 200, st.text
        sb = st.json()
        ids = {t["id"] for t in sb["trades"]}
        assert new.json()["id"] in ids
        assert old_id not in ids
        assert sb["match_count"] >= 1
    finally:
        _purge(a)
