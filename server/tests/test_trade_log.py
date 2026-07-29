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

        obs = cookie_for("observer", a)
        denied = client.get("/api/me/trade-log", cookies=obs)
        assert denied.status_code == 403

        client.delete(f"/api/me/trade-log/{eid}", cookies=ca)
    finally:
        _purge(a)
        _purge(b)


def test_default_account_auto_provisioned_venue_unset(client):
    """Primary is provisioned; venue stays unset until import or first trade."""
    a = _id("zztest-tl-default@labs.test")
    try:
        ca = cookie_for("activator", a)
        r = client.get("/api/me/trade-log/trades", cookies=ca)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["accounts"], "expected auto-provisioned account"
        assert data.get("default_account_id")
        primary = next(x for x in data["accounts"] if x["id"] == data["default_account_id"])
        assert primary["label"] == "Primary"
        assert primary["broker"] == "unset"
        assert primary["status"] == "active"
        r2 = client.get("/api/me/trade-log/accounts", cookies=ca)
        primaries = [x for x in r2.json()["accounts"] if x["label"] == "Primary"]
        assert len(primaries) == 1
    finally:
        _purge(a)


def test_first_import_sets_venue_from_adapter(client):
    a = _id("zztest-tl-venue-imp@labs.test")
    try:
        ca = cookie_for("activator", a)
        listed = client.get("/api/me/trade-log/accounts", cookies=ca)
        aid = listed.json()["accounts"][0]["id"]
        assert listed.json()["accounts"][0]["broker"] == "unset"
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
        assert next(x for x in accts if x["id"] == aid)["broker"] == "thinkorswim"
    finally:
        _purge(a)


def test_account_venue_required_and_cap(client):
    a = _id("zztest-tl-acct@labs.test")
    try:
        ca = cookie_for("activator", a)
        bad = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "No venue"},
        )
        assert bad.status_code == 422

        ids = []
        for i in range(10):
            r = client.post(
                "/api/me/trade-log/accounts",
                cookies=ca,
                json={"label": f"A{i}", "broker": "sim" if i % 2 else "thinkorswim"},
            )
            assert r.status_code == 200, r.text
            ids.append(r.json()["id"])
            assert r.json()["venue_kind"] in ("live", "sim")

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
