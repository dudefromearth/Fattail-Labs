"""Trade log import/export — canonical + thinkorswim (P2)."""

from pathlib import Path

import db
import identity as identity_mod
import trade_log_io as tio
from conftest import cookie_for

FIXTURE = Path(__file__).parent / "fixtures" / "tos_trade_history_sample.csv"


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
            cur.execute("DELETE FROM identity_links WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM credentials WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_parse_thinkorswim_fixture():
    text = FIXTURE.read_text(encoding="utf-8")
    det = tio.detect(text)
    assert any(d["id"] == "thinkorswim" and d["confidence"] >= 0.5 for d in det)
    result = tio.parse_thinkorswim(text)
    assert not result["errors"]
    trades = result["trades"]
    assert len(trades) == 3  # two opens + one close
    fly = next(t for t in trades if len(t["legs"]) == 3 and t["legs"][0]["pos_effect"] == "TO_OPEN")
    assert fly["strategy"] == "BUTTERFLY"
    assert fly["legs"][1]["quantity"] == 2
    assert fly["net_side"] == "DEBIT"
    assert fly["net_price"] == 0.6


def test_parse_tos_account_statement_snippet():
    """Pattern from real Account Statement export (Account Trade History block)."""
    path = Path(__file__).parent / "fixtures" / "tos_account_statement_snippet.csv"
    text = path.read_text(encoding="utf-8")
    assert "Account Trade History" in text
    det = tio.detect(text)
    assert det[0]["id"] == "thinkorswim"
    result = tio.parse_thinkorswim(text)
    assert not result["errors"]
    assert any("Account Trade History" in w for w in result["warnings"])
    flies = [t for t in result["trades"] if t["strategy"] == "BUTTERFLY"]
    assert flies
    # Complete multi-leg groups (snippet may truncate a trailing partial block)
    complete = [t for t in flies if len(t["legs"]) == 3]
    assert complete, f"expected 3-leg flies, got {[len(t['legs']) for t in flies]}"


def test_import_commit_idempotent(client):
    a = _id("zztest-tl-imp@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "ToS Import", "broker": "thinkorswim"},
        )
        assert acct.status_code == 200, acct.text
        aid = acct.json()["id"]
        text = FIXTURE.read_text(encoding="utf-8")

        prev = client.post(
            "/api/me/trade-log/import/preview",
            cookies=ca,
            json={"adapter": "thinkorswim", "text": text},
        )
        assert prev.status_code == 200, prev.text
        assert prev.json()["trade_count"] == 3

        c1 = client.post(
            "/api/me/trade-log/import/commit",
            cookies=ca,
            json={"adapter": "thinkorswim", "text": text, "account_id": aid},
        )
        assert c1.status_code == 200, c1.text
        assert c1.json()["created"] == 3

        c2 = client.post(
            "/api/me/trade-log/import/commit",
            cookies=ca,
            json={"adapter": "thinkorswim", "text": text, "account_id": aid},
        )
        assert c2.status_code == 200, c2.text
        assert c2.json()["created"] == 0
        assert c2.json()["skipped"] == 3

        listed = client.get(
            f"/api/me/trade-log/trades?account_id={aid}", cookies=ca
        )
        assert listed.status_code == 200
        assert len(listed.json()["trades"]) == 3
    finally:
        _purge(a)


def test_export_canonical_roundtrip_shape(client):
    a = _id("zztest-tl-exp@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "Export", "broker": "sim"},
        )
        aid = acct.json()["id"]
        client.post(
            "/api/me/trade-log/trades",
            cookies=ca,
            json={
                "account_id": aid,
                "strategy": "SINGLE",
                "exec_at": "2026-06-01T10:00:00",
                "legs": [
                    {
                        "side": "BUY",
                        "quantity": 1,
                        "pos_effect": "TO_OPEN",
                        "underlier": "SPX",
                        "expiry": "2026-06-01",
                        "strike": 5800,
                        "right": "PUT",
                        "fill_price": 1.25,
                    }
                ],
            },
        )
        exp = client.get(
            f"/api/me/trade-log/export?account_id={aid}&format=canonical",
            cookies=ca,
        )
        assert exp.status_code == 200, exp.text
        doc = exp.json()
        assert doc["format"] == "fattail.labs.trade_log"
        assert doc["accounts"]
        assert doc["accounts"][0]["trades"]
    finally:
        _purge(a)


def test_export_native_thinkorswim_and_roundtrip(client):
    a = _id("zztest-tl-exp-tos@labs.test")
    try:
        ca = cookie_for("activator", a)
        text = FIXTURE.read_text(encoding="utf-8")
        # Provision + import as ToS so venue is thinkorswim
        listed = client.get("/api/me/trade-log/accounts", cookies=ca)
        aid = listed.json()["accounts"][0]["id"]
        client.post(
            "/api/me/trade-log/import/commit",
            cookies=ca,
            json={"adapter": "thinkorswim", "text": text, "account_id": aid},
        )
        accts = client.get("/api/me/trade-log/accounts", cookies=ca).json()["accounts"]
        assert next(x for x in accts if x["id"] == aid)["broker"] == "thinkorswim"

        # Native export follows venue → ToS CSV
        native = client.get(
            f"/api/me/trade-log/export?account_id={aid}&format=native",
            cookies=ca,
        )
        assert native.status_code == 200, native.text
        body = native.text
        assert "Account Trade History" in body
        assert "Exec Time" in body
        assert "BUTTERFLY" in body

        # Canonical always available
        can = client.get(
            f"/api/me/trade-log/export?account_id={aid}&format=canonical",
            cookies=ca,
        )
        assert can.status_code == 200
        assert can.json()["format"] == "fattail.labs.trade_log"

        # Re-import ToS export
        again = tio.parse_thinkorswim(body)
        assert len(again["trades"]) >= 1
        assert any(len(t["legs"]) == 3 for t in again["trades"])
    finally:
        _purge(a)
