"""Trade Log v1.1 — multi-leg, accounts, isolation (Spec P1)."""

from pathlib import Path

import db
import identity as identity_mod
from conftest import cookie_for


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


def test_trade_log_legacy_prose_and_isolation(client):
    a = _id("zztest-tl-a@labs.test")
    b = _id("zztest-tl-b@labs.test")
    try:
        ca = cookie_for("activator", a)
        cb = cookie_for("activator", b)
        r = client.post(
            "/api/me/trade-log",
            cookies=ca,
            json={
                "setup_md": "defined-risk vertical",
                "plan_md": "wait for trigger",
                "adherence": "followed",
                "lesson_md": "patience paid",
            },
        )
        assert r.status_code == 200, r.text
        body = r.json()
        eid = body["id"]
        assert body["setup_md"] == "defined-risk vertical"
        assert body.get("strategy") == "NOTE"

        mine = client.get("/api/me/trade-log", cookies=ca)
        assert mine.status_code == 200
        data = mine.json()
        assert any(e["id"] == eid for e in data["entries"])
        assert any(t["id"] == eid for t in data["trades"])

        peer = client.get("/api/me/trade-log", cookies=cb)
        assert peer.status_code == 200
        assert all(e["id"] != eid for e in peer.json()["entries"])
        assert all(t["id"] != eid for t in peer.json()["trades"])

        # Free no-plan observer — write denied; read/export floor keeps owner list.
        obs = cookie_for("observer", a)
        free_read = client.get("/api/me/trade-log", cookies=obs)
        assert free_read.status_code == 200, free_read.text
        free_write = client.post(
            "/api/me/trade-log/trades",
            cookies=obs,
            json={
                "account_id": data["accounts"][0]["id"] if data.get("accounts") else None,
                "exec_at": "2026-08-01T12:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "underlier": "SPY",
                        "instrument_type": "equity",
                        "fill_price": 1.0,
                    }
                ],
            },
        )
        assert free_write.status_code == 403, free_write.text

        client.delete(f"/api/me/trade-log/{eid}", cookies=ca)
    finally:
        _purge(a)
        _purge(b)


def test_trade_log_span_reports_first_last_day(client):
    a = _id("zztest-tl-span@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Span", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        body = {
            "account_id": aid,
            "exec_at": "2022-06-15T14:00:00",
            "strategy": "VERTICAL",
            "asset_class": "equity_option",
            "order_type": "LMT",
            "net_price": 1.0,
            "net_side": "DEBIT",
            "adherence": "unknown",
            "legs": [
                {
                    "side": "BUY",
                    "quantity": 1,
                    "pos_effect": "TO_OPEN",
                    "underlier": "SPY",
                    "expiry": "2022-07-01",
                    "strike": 400,
                    "right": "CALL",
                    "fill_price": 1.0,
                }
            ],
        }
        assert client.post("/api/me/trade-log/trades", cookies=ca, json=body).status_code == 200
        body["exec_at"] = "2026-08-01T14:00:00"
        assert client.post("/api/me/trade-log/trades", cookies=ca, json=body).status_code == 200
        span = client.get("/api/me/trade-log/span", cookies=ca)
        assert span.status_code == 200, span.text
        d = span.json()
        assert d["first_day"] == "2022-06-15"
        assert d["last_day"] == "2026-08-01"
        assert d["trade_count"] >= 2
    finally:
        _purge(a)


def test_trade_log_found_set_range_and_position_count(client):
    """Found set is date range + position count; AutoFilter is book-wide."""
    a = _id("zztest-tl-found@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Found", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        body = {
            "account_id": aid,
            "exec_at": "2022-06-15T14:00:00",
            "strategy": "VERTICAL",
            "asset_class": "equity_option",
            "order_type": "LMT",
            "net_price": 1.0,
            "net_side": "DEBIT",
            "adherence": "unknown",
            "legs": [
                {
                    "side": "BUY",
                    "quantity": 1,
                    "pos_effect": "TO_OPEN",
                    "underlier": "SPY",
                    "expiry": "2022-07-01",
                    "strike": 400,
                    "right": "CALL",
                    "fill_price": 1.0,
                }
            ],
        }
        r1 = client.post("/api/me/trade-log/trades", cookies=ca, json=body)
        assert r1.status_code == 200, r1.text
        june_id = r1.json()["id"]
        body["exec_at"] = "2026-08-01T14:00:00"
        body["net_side"] = "CREDIT"
        r2 = client.post("/api/me/trade-log/trades", cookies=ca, json=body)
        assert r2.status_code == 200, r2.text

        whole = client.get("/api/me/trade-log/found", cookies=ca)
        assert whole.status_code == 200, whole.text
        w = whole.json()
        assert w["first_day"] == "2022-06-15"
        assert w["last_day"] == "2026-08-01"
        assert w["position_count"] >= 2
        ids = {i["id"] for i in w.get("items") or []}
        assert june_id in ids

        june = client.get("/api/me/trade-log/found?months=2022-06", cookies=ca)
        assert june.status_code == 200, june.text
        j = june.json()
        assert j["first_day"] == "2022-06-15"
        assert j["last_day"] == "2022-06-15"
        assert j["position_count"] == 1
        assert [i["id"] for i in j.get("items") or []] == [june_id]

        page = client.get(
            "/api/me/trade-log/trades?months=2022-06&limit=50",
            cookies=ca,
        )
        assert page.status_code == 200, page.text
        pt = page.json()["trades"]
        assert len(pt) == 1
        assert pt[0]["id"] == june_id
        assert page.json().get("has_more") is False

        dist = client.get("/api/me/trade-log/distincts", cookies=ca)
        assert dist.status_code == 200, dist.text
        months = dist.json().get("months") or []
        assert "2022-06" in months
        assert "2026-08" in months
        days = dist.json().get("days") or []
        assert "2022-06-15" in days
        assert "2026-08-01" in days

        by_year = client.get("/api/me/trade-log/found?years=2022", cookies=ca)
        assert by_year.status_code == 200, by_year.text
        y = by_year.json()
        assert y["first_day"] == "2022-06-15"
        assert y["last_day"] == "2022-06-15"
        assert y["position_count"] == 1

        by_day = client.get(
            "/api/me/trade-log/found?days=2022-06-15", cookies=ca
        )
        assert by_day.status_code == 200, by_day.text
        assert by_day.json()["position_count"] == 1
    finally:
        _purge(a)


def test_found_set_symbol_autofilter_is_valid_sql(client):
    """Symbol AutoFilter (SPCX,TSLA) must not 500 — missing ) on IN subquery."""
    a = _id("zztest-tl-found-sym@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Sym", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        for under, day in (("SPCX", "2026-08-14"), ("TSLA", "2026-08-09"), ("SPX", "2026-07-29")):
            r = client.post(
                "/api/me/trade-log/trades",
                cookies=ca,
                json={
                    "account_id": aid,
                    "exec_at": f"{day}T14:00:00",
                    "strategy": "SINGLE",
                    "asset_class": "equity",
                    "order_type": "LMT",
                    "net_price": 1.0,
                    "net_side": "DEBIT",
                    "adherence": "unknown",
                    "legs": [
                        {
                            "side": "BUY",
                            "quantity": 1,
                            "pos_effect": "TO_OPEN",
                            "underlier": under,
                            "symbol": under,
                            "fill_price": 1.0,
                        }
                    ],
                },
            )
            assert r.status_code == 200, r.text
        found = client.get(
            "/api/me/trade-log/found?symbols=SPCX,TSLA", cookies=ca
        )
        assert found.status_code == 200, found.text
        assert found.json()["position_count"] == 2
        page = client.get(
            "/api/me/trade-log/trades?symbols=SPCX,TSLA&positions_only=true",
            cookies=ca,
        )
        assert page.status_code == 200, page.text
        unders = {
            (t.get("legs") or [{}])[0].get("underlier")
            for t in page.json()["trades"]
        }
        assert unders == {"SPCX", "TSLA"}
    finally:
        _purge(a)


def test_autofilter_each_listed_choice_retrieves_positions(client):
    """Every AutoFilter value is a position that exists — select it, get it, no 500."""
    a = _id("zztest-tl-af-all@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "AF", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=ca,
            json={
                "title": "AF season",
                "activate": True,
                "max_drawdown_pct": 15,
                "starts_at": "2020-01-01",
                "starting_capital": 10000,
            },
        )
        assert camp.status_code == 200, camp.text
        cid = int(camp.json()["campaign"]["id"])

        def _pos(**kw):
            r = client.post("/api/me/trade-log/trades", cookies=ca, json=kw)
            assert r.status_code == 200, r.text
            return r.json()

        def _leg(under, effect="TO_OPEN"):
            return {
                "side": "BUY",
                "quantity": 1,
                "pos_effect": effect,
                "underlier": under,
                "symbol": under,
                "fill_price": 1.0,
            }

        _pos(
            account_id=aid,
            exec_at="2022-06-15T14:00:00",
            strategy="VERTICAL",
            asset_class="equity_option",
            order_type="LMT",
            net_price=1.0,
            net_side="DEBIT",
            adherence="unknown",
            legs=[_leg("SPY")],
        )
        _pos(
            account_id=aid,
            exec_at="2026-08-09T14:00:00",
            strategy="SINGLE",
            asset_class="equity",
            order_type="LMT",
            net_price=1.0,
            net_side="CREDIT",
            adherence="unknown",
            legs=[_leg("TSLA")],
        )
        stamped = _pos(
            account_id=aid,
            exec_at="2026-08-14T14:00:00",
            strategy="BUTTERFLY",
            asset_class="equity_option",
            order_type="LMT",
            net_price=1.0,
            net_side="DEBIT",
            adherence="unknown",
            practice_campaign_id=cid,
            legs=[_leg("SPCX")],
        )
        assert stamped.get("practice_campaign_id") == cid
        note = client.post(
            "/api/me/trade-log",
            cookies=ca,
            json={"setup_md": "not a position", "adherence": "unknown"},
        )
        assert note.status_code == 200, note.text
        _pos(
            account_id=aid,
            exec_at="2020-01-01T12:00:00",
            strategy="SINGLE",
            asset_class="equity",
            order_type="LMT",
            net_price=1.0,
            net_side="CREDIT",
            adherence="unknown",
            legs=[_leg("DEAD", "TO_CLOSE")],
        )

        dist = client.get("/api/me/trade-log/distincts", cookies=ca)
        assert dist.status_code == 200, dist.text
        d = dist.json()
        assert "NOTE" not in (d.get("strategies") or [])
        assert "2020-01-01" not in (d.get("days") or [])
        assert "DEAD" not in (d.get("symbols") or [])
        assert "SPCX" in (d.get("symbols") or [])
        assert "TSLA" in (d.get("symbols") or [])
        assert "SPY" in (d.get("symbols") or [])

        checks: list[tuple[str, str]] = []
        for sym in d.get("symbols") or []:
            checks.append(("symbols", sym))
        for st in d.get("strategies") or []:
            checks.append(("strategies", st))
        for sd in d.get("sides") or []:
            checks.append(("sides", sd))
        for fx in d.get("effects") or []:
            checks.append(("effects", fx))
        for ym in (d.get("months") or [])[:3]:
            checks.append(("months", ym))
        for day in (d.get("days") or [])[:3]:
            checks.append(("days", day))
        years = sorted({x[:4] for x in (d.get("days") or [])})
        for y in years:
            checks.append(("years", y))
        for c in d.get("campaigns") or []:
            key = "none" if c.get("id") is None else str(c["id"])
            checks.append(("campaigns", key))

        assert checks, "expected AutoFilter choices from seeded positions"
        for param, value in checks:
            found = client.get(
                f"/api/me/trade-log/found?{param}={value}", cookies=ca
            )
            assert found.status_code == 200, f"{param}={value} found {found.text}"
            n = found.json()["position_count"]
            assert n >= 1, f"{param}={value} listed but found 0 positions"
            page = client.get(
                f"/api/me/trade-log/trades?{param}={value}&positions_only=true",
                cookies=ca,
            )
            assert page.status_code == 200, f"{param}={value} list {page.text}"
            assert len(page.json()["trades"]) >= 1, (
                f"{param}={value} listed but list empty"
            )
    finally:
        _purge(a)


def test_found_set_follows_campaign_stamp_change(client):
    """Clear/assign must change the found set under the current filter."""
    a = _id("zztest-tl-found-stamp@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Stamp", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=ca,
            json={
                "title": "Found stamp",
                "activate": True,
                "max_drawdown_pct": 15,
                "starts_at": "2022-01-01",
                "starting_capital": 10000,
            },
        )
        assert camp.status_code == 200, camp.text
        cid = int(camp.json()["campaign"]["id"])
        body = {
            "account_id": aid,
            "exec_at": "2023-03-15T14:00:00",
            "strategy": "VERTICAL",
            "asset_class": "equity_option",
            "order_type": "LMT",
            "net_price": 1.0,
            "net_side": "DEBIT",
            "adherence": "unknown",
            "practice_campaign_id": cid,
            "legs": [
                {
                    "side": "BUY",
                    "quantity": 1,
                    "pos_effect": "TO_OPEN",
                    "underlier": "SPY",
                    "expiry": "2023-04-01",
                    "strike": 400,
                    "right": "CALL",
                    "fill_price": 1.0,
                }
            ],
        }
        created = client.post("/api/me/trade-log/trades", cookies=ca, json=body)
        assert created.status_code == 200, created.text
        tid = created.json()["id"]

        tagged = client.get(
            f"/api/me/trade-log/found?campaigns={cid}", cookies=ca
        )
        assert tagged.status_code == 200, tagged.text
        assert tagged.json()["position_count"] == 1
        assert {i["id"] for i in tagged.json()["items"]} == {tid}

        cleared = client.patch(
            f"/api/me/trade-log/trades/{tid}",
            cookies=ca,
            json={"practice_campaign_id": None},
        )
        assert cleared.status_code == 200, cleared.text
        assert cleared.json().get("practice_campaign_id") in (None, 0)

        after = client.get(
            f"/api/me/trade-log/found?campaigns={cid}", cookies=ca
        )
        assert after.status_code == 200, after.text
        assert after.json()["position_count"] == 0
        none = client.get("/api/me/trade-log/found?campaigns=none", cookies=ca)
        assert none.status_code == 200, none.text
        assert tid in {i["id"] for i in none.json().get("items") or []}

        month = client.get(
            "/api/me/trade-log/found?months=2023-03", cookies=ca
        )
        assert month.status_code == 200, month.text
        assert month.json()["position_count"] == 1
        row = next(i for i in month.json()["items"] if i["id"] == tid)
        assert row["practice_campaign_id"] is None
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_practice_campaigns WHERE identity_id = %s",
                    (a,),
                )
        _purge(a)


def test_assign_outside_campaign_window_is_rejected(client):
    """Find and tag: fill outside campaign dates stays untagged."""
    a = _id("zztest-tl-window-reject@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Win", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        camp = client.post(
            "/api/me/practice/campaigns",
            cookies=ca,
            json={
                "title": "June only",
                "activate": True,
                "max_drawdown_pct": 15,
                "starts_at": "2026-06-01",
                "ends_at": "2026-06-30",
                "starting_capital": 10000,
            },
        )
        assert camp.status_code == 200, camp.text
        cid = int(camp.json()["campaign"]["id"])
        created = client.post(
            "/api/me/trade-log/trades",
            cookies=ca,
            json={
                "account_id": aid,
                "exec_at": "2023-03-15T14:00:00",
                "strategy": "VERTICAL",
                "asset_class": "equity_option",
                "order_type": "LMT",
                "net_price": 1.0,
                "net_side": "DEBIT",
                "adherence": "unknown",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "SPY",
                        "expiry": "2023-04-01",
                        "strike": 400,
                        "right": "CALL",
                        "fill_price": 1.0,
                    }
                ],
            },
        )
        assert created.status_code == 200, created.text
        tid = created.json()["id"]
        bad = client.patch(
            f"/api/me/trade-log/trades/{tid}",
            cookies=ca,
            json={"practice_campaign_id": cid},
        )
        assert bad.status_code == 422, bad.text
        assert "window" in str(bad.json().get("detail", "")).lower()
        found = client.get(
            f"/api/me/trade-log/found?campaigns={cid}", cookies=ca
        )
        assert found.status_code == 200, found.text
        assert found.json()["position_count"] == 0
        assert tid not in {i["id"] for i in found.json().get("items") or []}
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_practice_campaigns WHERE identity_id = %s",
                    (a,),
                )
        _purge(a)


def test_observer_trial_plan_trade_log_ok(client):
    """DL-126/128: active Observer plan has Trade Log even if cookie role is observer."""
    a = _id("zztest-tl-observer-trial@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                    (a,),
                )
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (a,))
                cur.execute("SELECT id FROM plans WHERE slug = %s", ("observer-trial",))
                plan = cur.fetchone()
                assert plan is not None, "observer-trial plan missing — seed_dev"
                identity_mod.upsert_membership(
                    cur, a, int(plan["id"]), "active", "zztest"
                )
        # Session role observer (stale cookie) — plan path must admit Practice.
        cookies = cookie_for("observer", a)
        r = client.get("/api/me/trade-log", cookies=cookies)
        assert r.status_code == 200, r.text
        rb = client.get(
            "/api/me/trade-log/analytics/reports-book",
            cookies=cookies,
        )
        assert rb.status_code == 200, rb.text
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (a,))
        _purge(a)


def test_navigator_role_trade_log_ok(client):
    a = _id("zztest-tl-navigator@labs.test")
    try:
        r = client.get("/api/me/trade-log", cookies=cookie_for("navigator", a))
        assert r.status_code == 200, r.text
    finally:
        _purge(a)


def test_default_account_auto_provisioned_fattail_book(client):
    """Default FatTail book is provisioned (not a connected broker)."""
    a = _id("zztest-tl-default@labs.test")
    try:
        ca = cookie_for("activator", a)
        r = client.get("/api/me/trade-log/trades", cookies=ca)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["accounts"], "expected auto-provisioned account"
        assert data.get("default_account_id")
        home = next(
            x for x in data["accounts"] if x["id"] == data["default_account_id"]
        )
        # Doctrine: Default + fattail (legacy Primary/unset soft-migrated)
        assert home["label"] in ("Default", "Primary")
        assert home["broker"] in ("fattail", "unset")
        assert home["status"] == "active"
        r2 = client.get("/api/me/trade-log/accounts", cookies=ca)
        standing = [
            x
            for x in r2.json()["accounts"]
            if x["label"] in ("Default", "Primary")
        ]
        assert len(standing) >= 1
        assert standing[0]["broker"] == "fattail"
    finally:
        _purge(a)


def test_account_trade_count_structure_open_not_close(client):
    """B5 — open+close pair → trade_count ≈ 1 structure (not 2 fills)."""
    a = _id("zztest-tl-structure-count@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "CountBook", "broker": "fattail"},
        )
        assert acct.status_code == 200, acct.text
        aid = int((acct.json().get("account") or acct.json())["id"])

        open_tr = client.post(
            "/api/me/trade-log/trades",
            cookies=ca,
            json={
                "account_id": aid,
                "exec_at": "2026-08-01T10:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 10,
                        "underlier": "SPY",
                        "instrument_type": "equity",
                        "fill_price": 100.0,
                        "pos_effect": "TO_OPEN",
                    }
                ],
            },
        )
        assert open_tr.status_code == 200, open_tr.text
        open_id = int(open_tr.json()["id"])

        close_tr = client.post(
            "/api/me/trade-log/trades",
            cookies=ca,
            json={
                "account_id": aid,
                "exec_at": "2026-08-01T15:00:00",
                "strategy": "CUSTOM",
                "asset_class": "equity",
                "legs": [
                    {
                        "side": "SELL",
                        "quantity": 10,
                        "underlier": "SPY",
                        "instrument_type": "equity",
                        "fill_price": 101.0,
                        "pos_effect": "TO_CLOSE",
                    }
                ],
            },
        )
        assert close_tr.status_code == 200, close_tr.text
        assert int(close_tr.json()["id"]) != open_id

        listed = client.get("/api/me/trade-log/accounts", cookies=ca)
        assert listed.status_code == 200, listed.text
        row = next(x for x in listed.json()["accounts"] if x["id"] == aid)
        assert int(row.get("trade_count") or 0) == 1
        found = client.get("/api/me/trade-log/found", cookies=ca)
        assert found.status_code == 200, found.text
        fd = found.json()
        assert int(fd.get("position_count") or 0) == 1
        ids = {i["id"] for i in fd.get("items") or []}
        assert open_id in ids
        assert int(close_tr.json()["id"]) not in ids
    finally:
        _purge(a)


def test_first_import_does_not_brand_account_with_adapter(client):
    """ToS CSV → external_adapter on trades; account stays FatTail book."""
    a = _id("zztest-tl-venue-imp@labs.test")
    try:
        ca = cookie_for("activator", a)
        listed = client.get("/api/me/trade-log/accounts", cookies=ca)
        aid = listed.json()["accounts"][0]["id"]
        # Default book is FatTail-canonical (not a connected broker)
        assert listed.json()["accounts"][0]["broker"] in ("unset", "fattail")
        text = (
            Path(__file__).parent / "fixtures" / "tos_trade_history_sample.csv"
        ).read_text(encoding="utf-8")
        c = client.post(
            "/api/me/trade-log/import/commit",
            cookies=ca,
            json={"adapter": "thinkorswim", "text": text, "account_id": aid},
        )
        assert c.status_code == 200, c.text
        accts = client.get("/api/me/trade-log/accounts", cookies=ca).json()["accounts"]
        assert next(x for x in accts if x["id"] == aid)["broker"] == "fattail"
        trades = client.get(
            f"/api/me/trade-log/trades?account_id={aid}", cookies=ca
        ).json()
        rows = trades.get("trades") or trades.get("items") or []
        if rows:
            # Provenance is per-fill, not the account brand
            assert any(
                (t.get("external_adapter") or "") == "thinkorswim" for t in rows
            )
    finally:
        _purge(a)


def test_account_defaults_fattail_and_cap(client):
    a = _id("zztest-tl-acct@labs.test")
    try:
        ca = cookie_for("activator", a)
        # No broker required — FatTail book is the default
        ok_default = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "No venue"},
        )
        assert ok_default.status_code == 200, ok_default.text
        body0 = ok_default.json()
        acct0 = body0.get("account") or body0
        assert acct0["broker"] == "fattail"

        ids = [acct0["id"]]
        for i in range(9):
            r = client.post(
                "/api/me/trade-log/accounts",
                cookies=ca,
                json={"label": f"A{i}", "broker": "sim" if i % 2 else "fattail"},
            )
            assert r.status_code == 200, r.text
            body = r.json()
            acct = body.get("account") or body
            ids.append(acct["id"])
            assert acct.get("venue_kind") in ("live", "sim", None) or acct.get(
                "broker"
            ) in ("sim", "fattail", "paper")

        over = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Over", "broker": "paper"},
        )
        assert over.status_code == 422
        assert "10" in over.json()["detail"] or "active" in over.json()["detail"].lower()
    finally:
        _purge(a)


def test_butterfly_multi_leg_create(client):
    a = _id("zztest-tl-fly@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "IRA", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]

        r = client.post(
            "/api/me/trade-log/trades",
            cookies=ca,
            json={
                "account_id": aid,
                "exec_at": "2026-04-21T14:33:52",
                "strategy": "BUTTERFLY",
                "asset_class": "equity_option",
                "order_type": "LMT",
                "net_price": 0.60,
                "net_side": "DEBIT",
                "setup_md": "weekly fly",
                "adherence": "followed",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "SPX",
                        "expiry": "2026-04-21",
                        "strike": 7080,
                        "right": "PUT",
                        "fill_price": 6.57,
                    },
                    {
                        "side": "SELL",
                        "quantity": 2,
                        "pos_effect": "TO_OPEN",
                        "underlier": "SPX",
                        "expiry": "2026-04-21",
                        "strike": 7075,
                        "right": "PUT",
                        "fill_price": 4.54,
                    },
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "SPX",
                        "expiry": "2026-04-21",
                        "strike": 7070,
                        "right": "PUT",
                        "fill_price": 3.11,
                    },
                ],
            },
        )
        assert r.status_code == 200, r.text
        trade = r.json()
        assert trade["strategy"] == "BUTTERFLY"
        assert len(trade["legs"]) == 3
        assert trade["legs"][1]["quantity"] == 2
        assert trade["legs"][0]["right"] == "PUT"
        assert trade["net_side"] == "DEBIT"

        got = client.get(f"/api/me/trade-log/trades/{trade['id']}", cookies=ca)
        assert got.status_code == 200
        assert len(got.json()["legs"]) == 3

        venues = client.get("/api/me/trade-log/venues", cookies=ca)
        assert venues.status_code == 200
        assert any(v["code"] == "thinkorswim" for v in venues.json()["venues"])
    finally:
        _purge(a)


def test_identity_zero_fallback_blocked_outside_dev(client):
    """PH0-1: claims identity_id=0 must not map to ernie/coach/admin outside dev.

    Useful: locks the isolation/fail-loud gate. Not a coverage checkbox.
    """
    from config import get_config

    cfg = get_config()
    original = cfg.env
    try:
        cfg.env = "production"
        zero = cookie_for("administrator", 0)
        r = client.get("/api/me/trade-log/trades", cookies=zero)
        assert r.status_code == 401, r.text
        assert "Invalid session identity" in r.json().get("detail", "")

        cfg.env = "staging"
        r2 = client.get("/api/me/trade-log/trades", cookies=zero)
        assert r2.status_code == 401, r2.text
    finally:
        cfg.env = original


def test_real_identity_trade_log_works_when_env_not_dev(client):
    """PH0-1: identity gate must not brick legitimate sessions outside dev.

    Useful: proves the fail-loud path is id=0-specific, not a blanket env block.
    """
    from config import get_config

    a = _id("zztest-tl-prod-env@labs.test")
    cfg = get_config()
    original = cfg.env
    try:
        cfg.env = "production"
        ca = cookie_for("activator", a)
        r = client.get("/api/me/trade-log/trades", cookies=ca)
        assert r.status_code == 200, r.text
        assert "accounts" in r.json()
    finally:
        cfg.env = original
        _purge(a)


def test_list_trades_batch_loads_multi_leg_legs(client, monkeypatch):
    """PH0-2: list returns full legs for every trade without per-trade leg queries.

    Useful scale + correctness invariant — not a coverage checkbox.
    """
    from routes.trade_log import common as tl_common

    a = _id("zztest-tl-batch-legs@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "BatchSim", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        created_ids: list[int] = []
        for i in range(6):
            r = client.post(
                "/api/me/trade-log/trades",
                cookies=ca,
                json={
                    "account_id": aid,
                    "exec_at": f"2026-03-{10 + i:02d}T10:00:00",
                    "asset_class": "equity_option",
                    "strategy": "VERTICAL",
                    "order_type": "LMT",
                    "legs": [
                        {
                            "side": "BUY",
                            "quantity": 1,
                            "pos_effect": "TO_OPEN",
                            "underlier": "SPX",
                            "expiry": "2026-04-21",
                            "strike": 5000 + i,
                            "right": "PUT",
                            "fill_price": 2.5,
                        },
                        {
                            "side": "SELL",
                            "quantity": 1,
                            "pos_effect": "TO_OPEN",
                            "underlier": "SPX",
                            "expiry": "2026-04-21",
                            "strike": 4995 + i,
                            "right": "PUT",
                            "fill_price": 1.1,
                        },
                    ],
                },
            )
            assert r.status_code == 200, r.text
            body = r.json()
            assert len(body["legs"]) == 2
            created_ids.append(body["id"])

        def _forbid_single_trade_leg_load(*_args, **_kwargs):
            raise AssertionError(
                "list_trades must batch-load legs; _load_legs is single-trade only"
            )

        # Patch where list path binds: common module used by trades/io
        monkeypatch.setattr(tl_common, "_load_legs", _forbid_single_trade_leg_load)

        listed = client.get("/api/me/trade-log/trades", cookies=ca)
        assert listed.status_code == 200, listed.text
        trades = listed.json()["trades"]
        by_id = {t["id"]: t for t in trades}
        for tid in created_ids:
            assert tid in by_id, f"missing trade {tid} in list"
            assert len(by_id[tid]["legs"]) == 2, by_id[tid]
            assert by_id[tid]["legs"][0]["leg_index"] == 0
            assert by_id[tid]["legs"][1]["leg_index"] == 1

        # Detail path still allowed to use single-trade loader
        monkeypatch.undo()
        detail = client.get(
            f"/api/me/trade-log/trades/{created_ids[0]}", cookies=ca
        )
        assert detail.status_code == 200
        assert len(detail.json()["legs"]) == 2
    finally:
        _purge(a)


def test_adherence_mode_drift_filter(client):
    """J1-1 / F2: adherence_mode=drift excludes followed+partial."""
    a = _id("zztest-tl-drift@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Drift book", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]

        def _leg(underlier="SPY"):
            return {
                "side": "BUY",
                "quantity": 1,
                "pos_effect": "TO_OPEN",
                "underlier": underlier,
                "expiry": "2026-05-15",
                "strike": 500,
                "right": "CALL",
                "fill_price": 1.0,
            }

        for i, adh in enumerate(["followed", "partial", "broke", "unknown"]):
            r = client.post(
                "/api/me/trade-log/trades",
                cookies=ca,
                json={
                    "account_id": aid,
                    "exec_at": f"2026-05-0{i+1}T14:00:00",
                    "strategy": "VERTICAL",
                    "asset_class": "equity_option",
                    "order_type": "LMT",
                    "net_price": 1.0,
                    "net_side": "DEBIT",
                    "adherence": adh,
                    "legs": [_leg()],
                },
            )
            assert r.status_code == 200, r.text

        all_t = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1", cookies=ca
        )
        assert all_t.status_code == 200
        assert len(all_t.json()["trades"]) >= 4

        drift = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1&adherence_mode=drift",
            cookies=ca,
        )
        assert drift.status_code == 200, drift.text
        adhs = {t.get("adherence") for t in drift.json()["trades"]}
        assert "followed" not in adhs
        assert "partial" not in adhs
        assert adhs <= {"broke", "unknown"} or adhs & {"broke", "unknown"}
        assert len(drift.json()["trades"]) >= 2
    finally:
        _purge(a)


def test_default_book_filter_includes_unstamped_and_playbook_unaffiliated(client):
    """Book (is_default) includes unstamped; playbook_mode=unaffiliated is named."""
    a = _id("zztest-tl-book-filter@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "BookFilt", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]

        book = client.post(
            "/api/me/practice/campaigns",
            cookies=ca,
            json={
                "title": "BookFilt book",
                "activate": True, "max_drawdown_pct": 15, "starts_at": "2026-01-01", "starting_capital": 10000,
                "account_id": aid,
                "is_default": True,
            },
        )
        assert book.status_code == 200, book.text
        book_id = book.json()["campaign"]["id"]

        other = client.post(
            "/api/me/practice/campaigns",
            cookies=ca,
            json={
                "title": "Named season no",
                "activate": True, "max_drawdown_pct": 15, "starts_at": "2026-01-01", "starting_capital": 10000,
                "account_id": aid,
            },
        )
        assert other.status_code == 200, other.text
        other_id = other.json()["campaign"]["id"]

        def _post(exec_at, camp, pb=None):
            body = {
                "account_id": aid,
                "exec_at": exec_at,
                "strategy": "VERTICAL",
                "asset_class": "equity_option",
                "order_type": "LMT",
                "net_price": 1.0,
                "net_side": "DEBIT",
                "adherence": "unknown",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "SPY",
                        "expiry": "2026-06-01",
                        "strike": 500,
                        "right": "CALL",
                        "fill_price": 1.0,
                    }
                ],
            }
            if camp is not None:
                body["practice_campaign_id"] = camp
            if pb is not None:
                body["playbook_entry_id"] = pb
            r = client.post("/api/me/trade-log/trades", cookies=ca, json=body)
            assert r.status_code == 200, r.text
            return r.json()

        # Explicitly stamp one to book; one to other; one force-null after create
        t_book = _post("2026-06-01T14:00:00", book_id)
        t_other = _post("2026-06-02T14:00:00", other_id)
        t_null = _post("2026-06-03T14:00:00", book_id)
        # Simulate legacy unstamped: clear campaign on one trade via SQL
        import db as dbmod
        with dbmod.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE member_trade_log_trades SET practice_campaign_id = NULL "
                    "WHERE id = %s AND identity_id = %s",
                    (t_null["id"], a),
                )

        # is_default book = full account blotter (no campaign clause) — includes
        # stamps to sibling charters and unstamped rows (home of the book).
        filt = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1&practice_campaign_id={book_id}",
            cookies=ca,
        )
        assert filt.status_code == 200, filt.text
        ids = {t["id"] for t in filt.json()["trades"]}
        assert t_book["id"] in ids
        assert t_null["id"] in ids  # unstamped lives in book
        assert t_other["id"] in ids  # sibling stamp still on this account book

        # Named (non-default) campaign filters exact stamp only
        filt_other = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1&practice_campaign_id={other_id}",
            cookies=ca,
        )
        assert filt_other.status_code == 200, filt_other.text
        oids = {t["id"] for t in filt_other.json()["trades"]}
        assert t_other["id"] in oids
        assert t_book["id"] not in oids
        assert t_null["id"] not in oids

        unaff = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1&playbook_mode=unaffiliated",
            cookies=ca,
        )
        assert unaff.status_code == 200, unaff.text
        for t in unaff.json()["trades"]:
            assert t.get("playbook_entry_id") in (None, 0)

        # Allocation manager: unallocated + symbol search
        none = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1&campaign_mode=unallocated",
            cookies=ca,
        )
        assert none.status_code == 200, none.text
        nids = {t["id"] for t in none.json()["trades"]}
        assert t_null["id"] in nids
        assert t_book["id"] not in nids
        spy = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1&q=SPY",
            cookies=ca,
        )
        assert spy.status_code == 200, spy.text
        assert {t["id"] for t in spy.json()["trades"]} >= {
            t_book["id"],
            t_other["id"],
            t_null["id"],
        }
        combo = client.get(
            f"/api/me/trade-log/trades?account_id={aid}&full=1"
            f"&strategy=VERTICAL&net_side=DEBIT&pos_effect=TO_OPEN&symbol=SPY",
            cookies=ca,
        )
        assert combo.status_code == 200, combo.text
        cids = {t["id"] for t in combo.json()["trades"]}
        assert t_book["id"] in cids
    finally:
        _purge(a)
