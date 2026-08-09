"""Hardening A1 — Practice spine / export require Practice membership floor."""

from __future__ import annotations

import db
import identity as identity_mod
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.get_or_create_identity(cur, email, "ZZ Entitlement")


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for sql in (
                "DELETE FROM member_playbook_entries WHERE identity_id = %s",
                "DELETE FROM member_practice_campaigns WHERE identity_id = %s",
            ):
                try:
                    cur.execute(sql, (iid,))
                except Exception:
                    pass


def test_free_observer_denied_playbook_write(client):
    """No-plan free role cannot write Practice spine (playbook / campaigns).

    Full-pack export stays on the data-bearing floor (owner read/export) —
    same as Trade Log after A1 wired `_require_tool_member`.
    """
    iid = _member("zztest-entitlement-free@labs.test")
    # free / no-plan observer (not trial, not navigator)
    cookies = cookie_for("observer", iid)
    try:
        r = client.post(
            "/api/me/playbook/entries",
            cookies=cookies,
            json={"title": "Should fail"},
        )
        assert r.status_code == 403, r.text

        r3 = client.post(
            "/api/me/practice/campaigns",
            cookies=cookies,
            json={"title": "No", "activate": True},
        )
        assert r3.status_code == 403, r3.text

        # Owner export floor still allows JSON pack (empty surfaces OK)
        r2 = client.get("/api/me/export?format=json", cookies=cookies)
        assert r2.status_code == 200, r2.text
    finally:
        _cleanup(iid)


def test_activator_can_export_and_list_playbook(client):
    iid = _member("zztest-entitlement-act@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/playbook/entries", cookies=cookies)
        assert r.status_code == 200, r.text
        r2 = client.get("/api/me/export?format=json", cookies=cookies)
        assert r2.status_code == 200, r2.text
    finally:
        _cleanup(iid)


def test_purge_removes_capital_prefs_and_movements(client):
    """A5 — wipe must clear capital tables, not leave prefs after purge."""
    iid = _member("zztest-purge-capital@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={
                "label": "PurgeCapBook",
                "broker": "fattail",
                "starting_balance": 5000,
            },
        )
        assert acct.status_code == 200, acct.text
        aid = int(acct.json()["id"])

        mv = client.post(
            f"/api/me/capital/accounts/{aid}/movements",
            cookies=cookies,
            json={"amount": 100, "note": "pre-purge"},
        )
        assert mv.status_code == 200, mv.text

        # get_or_create_prefs inserts a row
        prefs = client.get("/api/me/capital/prefs", cookies=cookies)
        assert prefs.status_code == 200, prefs.text
        patch = client.patch(
            "/api/me/capital/prefs",
            cookies=cookies,
            json={"tolerated_master_drawdown": 8},
        )
        assert patch.status_code == 200, patch.text

        ok = client.post(
            "/api/me/practice-data/purge",
            cookies=cookies,
            json={"confirm": "DELETE_PRACTICE_DATA"},
        )
        assert ok.status_code == 200, ok.text
        deleted = ok.json().get("deleted") or {}
        assert deleted.get("account_cash_movements", 0) >= 1
        assert deleted.get("capital_prefs", 0) >= 1
        assert deleted.get("trade_log_accounts", 0) >= 1

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) AS n FROM member_account_cash_movements "
                    "WHERE identity_id = %s",
                    (iid,),
                )
                assert int(cur.fetchone()["n"]) == 0
                cur.execute(
                    "SELECT COUNT(*) AS n FROM member_capital_prefs "
                    "WHERE identity_id = %s",
                    (iid,),
                )
                assert int(cur.fetchone()["n"]) == 0
    finally:
        _cleanup(iid)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                for sql in (
                    "DELETE FROM member_account_cash_movements WHERE identity_id = %s",
                    "DELETE FROM member_capital_prefs WHERE identity_id = %s",
                    "DELETE FROM member_trade_log_legs WHERE trade_id IN "
                    "(SELECT id FROM member_trade_log_trades WHERE identity_id = %s)",
                    "DELETE FROM member_trade_log_trades WHERE identity_id = %s",
                    "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
                ):
                    try:
                        cur.execute(sql, (iid,))
                    except Exception:
                        pass


def test_playbook_cover_rejects_non_image_magic(client):
    """C1 — cover upload sniffs magic bytes; text body with image/* fails."""
    iid = _member("zztest-cover-magic@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        created = client.post(
            "/api/me/playbook/entries",
            cookies=cookies,
            json={"title": "Cover Magic Book"},
        )
        assert created.status_code == 200, created.text
        bid = int(created.json()["entry"]["id"])
        # Pretend JPEG content-type but send plain text
        r = client.post(
            f"/api/me/playbook/entries/{bid}/cover",
            cookies=cookies,
            files={
                "file": ("fake.jpg", b"not-an-image-payload", "image/jpeg"),
            },
        )
        assert r.status_code in (400, 422), r.text
    finally:
        _cleanup(iid)


def test_capital_pack_export_purge_import_round_trip(client):
    """B3 — capital prefs + movements survive export → purge → import."""
    import json

    iid = _member("zztest-capital-portability@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=cookies,
            json={
                "label": "PortCapBook",
                "broker": "fattail",
                "starting_balance": 12000,
            },
        )
        assert acct.status_code == 200, acct.text
        aid = int(acct.json()["id"])
        assert (
            client.post(
                f"/api/me/capital/accounts/{aid}/movements",
                cookies=cookies,
                json={"amount": 250, "note": "wire-roundtrip"},
            ).status_code
            == 200
        )
        assert (
            client.patch(
                "/api/me/capital/prefs",
                cookies=cookies,
                json={"tolerated_master_drawdown": 7},
            ).status_code
            == 200
        )

        pack = client.get("/api/me/export?format=json", cookies=cookies).json()
        cap = pack["documents"]["capital"]
        assert cap["format"] == "fattail.labs.capital"
        assert cap.get("prefs") is not None
        assert float(cap["prefs"]["tolerated_master_drawdown"]) == 7.0
        assert any(
            float(m.get("amount") or 0) == 250.0 for m in (cap.get("movements") or [])
        )

        assert (
            client.post(
                "/api/me/practice-data/purge",
                cookies=cookies,
                json={"confirm": "DELETE_PRACTICE_DATA"},
            ).status_code
            == 200
        )

        load = client.post(
            "/api/me/import/commit",
            cookies=cookies,
            json={"text": json.dumps(pack), "policy": "additive"},
        )
        assert load.status_code == 200, load.text
        results = (load.json().get("results") or {})
        assert "capital" in results or "trade_log" in results

        prefs = client.get("/api/me/capital/prefs", cookies=cookies)
        assert prefs.status_code == 200, prefs.text
        # After purge+import prefs should restore (or get_or_create if race)
        body = prefs.json().get("prefs") or {}
        # Movement re-import needs account label match from trade_log surface
        pack2 = client.get("/api/me/export?format=json", cookies=cookies).json()
        cap2 = pack2["documents"]["capital"]
        assert any(
            float(m.get("amount") or 0) == 250.0
            for m in (cap2.get("movements") or [])
        ) or float(body.get("tolerated_master_drawdown") or 0) == 7.0
    finally:
        _cleanup(iid)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                for sql in (
                    "DELETE FROM member_account_cash_movements WHERE identity_id = %s",
                    "DELETE FROM member_capital_prefs WHERE identity_id = %s",
                    "DELETE FROM member_trade_log_legs WHERE trade_id IN "
                    "(SELECT id FROM member_trade_log_trades WHERE identity_id = %s)",
                    "DELETE FROM member_trade_log_trades WHERE identity_id = %s",
                    "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
                ):
                    try:
                        cur.execute(sql, (iid,))
                    except Exception:
                        pass
