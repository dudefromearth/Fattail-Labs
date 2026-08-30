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
                "DELETE FROM member_trade_log_legs_trash WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_trades_trash WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_imports WHERE identity_id = %s", (iid,)
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
    assert all(leg.get("expiry") == "2026-04-21" for leg in fly["legs"])


TOS_FUTURES_AND_EXPIRED = """\
,Exec Time,Spread,Side,Qty,Pos Effect,Symbol,Exp,Strike,Type,Price,Net Price,Order Type
,8/4/25 07:04:39,BUTTERFLY,BUY,+1,TO OPEN,/ESU25 1/50 4 AUG 25 (Monday) (Wk2),/E1AQ25,6350,PUT,54.00,23.00,LMT
,,,SELL,-2,TO OPEN,/ESU25 1/50 4 AUG 25 (Monday) (Wk2),/E1AQ25,6300,PUT,18.25,DEBIT,
,,,BUY,+1,TO OPEN,/ESU25 1/50 4 AUG 25 (Monday) (Wk2),/E1AQ25,6250,PUT,5.50,,
,4/21/26 16:00:00,SINGLE,,-1,EXPIRED,SPX,21 APR 26,7080,PUT,0.00,0.00,
,4/21/26 16:00:00,SINGLE,SELL,-1,EXPIRED,SPX,21 APR 26,7075,PUT,0.00,0.00,
"""


def test_parse_tos_futures_expiry_from_symbol():
    """ToS futures-option Exp column is the root (/E1AQ25); date is in Symbol."""
    result = tio.parse_thinkorswim(TOS_FUTURES_AND_EXPIRED)
    assert not result["errors"]
    fly = next(t for t in result["trades"] if t["strategy"] == "BUTTERFLY")
    assert [leg["expiry"] for leg in fly["legs"]] == [
        "2025-08-04",
        "2025-08-04",
        "2025-08-04",
    ]
    assert fly["legs"][0]["underlier"] == "/ESU25"
    assert fly["legs"][0]["strike"] == 6350.0


def test_coerce_leg_expiry_from_stored_tos_futures_symbol():
    """Already-imported futures legs with null expiry still resolve from Symbol."""
    from routes.trade_log.common import _coerce_leg_expiry

    assert (
        _coerce_leg_expiry(
            {
                "expiry": None,
                "symbol": "/ESU25 1/50 4 AUG 25 (Monday) (Wk2)",
            }
        )
        == "2025-08-04"
    )
    assert _coerce_leg_expiry({"expiry": None, "symbol": "SPX"}) is None


def test_parse_tos_expired_pos_effect_is_to_close():
    """EXPIRED rows (even with blank Side) import as TO_CLOSE at 0."""
    result = tio.parse_thinkorswim(TOS_FUTURES_AND_EXPIRED)
    expired = [
        t
        for t in result["trades"]
        if t["legs"] and t["legs"][0]["pos_effect"] == "TO_CLOSE" and t["strategy"] == "SINGLE"
    ]
    assert len(expired) == 2
    for t in expired:
        assert t["legs"][0]["fill_price"] == 0.0
        assert t["legs"][0]["expiry"] == "2026-04-21"
        assert t["legs"][0]["side"] == "SELL"


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
    # Futures-option legs must still receive a calendar expiry (from Symbol).
    fut = next(
        (t for t in complete if (t["legs"][0].get("underlier") or "").startswith("/")),
        None,
    )
    if fut:
        assert all(leg.get("expiry") for leg in fut["legs"])


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
        assert listed.status_code == 200, listed.text
        tos = client.post(
            "/api/me/trade-log/accounts",
            cookies=ca,
            json={"label": "ToS book", "broker": "thinkorswim"},
        )
        assert tos.status_code == 200, tos.text
        aid = int((tos.json().get("account") or tos.json())["id"])
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


def _import_three(client, ca) -> int:
    acct = client.post(
        "/api/me/trade-log/accounts", cookies=ca,
        json={"label": "ToS", "broker": "thinkorswim"},
    )
    aid = acct.json()["id"]
    client.post(
        "/api/me/trade-log/import/commit", cookies=ca,
        json={"adapter": "thinkorswim", "text": FIXTURE.read_text(encoding="utf-8"), "account_id": aid},
    )
    return aid


def test_delete_all_requires_typed_confirm(client):
    a = _id("zztest-tl-delall@labs.test")
    try:
        ca = cookie_for("activator", a)
        aid = _import_three(client, ca)
        # missing / wrong confirm → 400, nothing deleted
        assert client.post("/api/me/trade-log/delete-all", cookies=ca, json={}).status_code == 400
        bad = client.post("/api/me/trade-log/delete-all", cookies=ca, json={"confirm": "yes"})
        assert bad.status_code == 400
        still = client.get(f"/api/me/trade-log/trades?account_id={aid}", cookies=ca)
        assert len(still.json()["trades"]) == 3
        # correct confirm, case-insensitive → wipes all
        ok = client.post("/api/me/trade-log/delete-all", cookies=ca, json={"confirm": "DELETE"})
        assert ok.status_code == 200, ok.text
        assert ok.json()["deleted"] >= 3
        gone = client.get(f"/api/me/trade-log/trades?account_id={aid}", cookies=ca)
        assert gone.json()["trades"] == []
    finally:
        _purge(a)


def test_delete_all_is_identity_scoped(client):
    a = _id("zztest-tl-delall-a@labs.test")
    b = _id("zztest-tl-delall-b@labs.test")
    try:
        ca, cb = cookie_for("activator", a), cookie_for("activator", b)
        _import_three(client, ca)
        bid = _import_three(client, cb)
        # A wipes their own — B's trades must be untouched
        assert client.post("/api/me/trade-log/delete-all", cookies=ca, json={"confirm": "delete"}).status_code == 200
        lb = client.get(f"/api/me/trade-log/trades?account_id={bid}", cookies=cb)
        assert len(lb.json()["trades"]) == 3
    finally:
        _purge(a)
        _purge(b)


# --- import batches (Import Manager) -----------------------------------------


def test_import_batch_list_preview_delete(client):
    a = _id("zztest-tl-batch@labs.test")
    try:
        ca = cookie_for("activator", a)
        acct = client.post(
            "/api/me/trade-log/accounts", cookies=ca,
            json={"label": "ToS", "broker": "thinkorswim"},
        )
        aid = acct.json()["id"]
        commit = client.post(
            "/api/me/trade-log/import/commit", cookies=ca,
            json={"adapter": "thinkorswim", "text": FIXTURE.read_text(encoding="utf-8"),
                  "account_id": aid, "filename": "tos.csv"},
        )
        assert commit.status_code == 200, commit.text
        imp_id = commit.json()["import_id"]
        assert imp_id is not None and commit.json()["created"] == 3

        imps = client.get("/api/me/trade-log/imports", cookies=ca).json()["imports"]
        assert len(imps) == 1 and imps[0]["id"] == imp_id
        assert imps[0]["trade_count"] == 3 and imps[0]["adapter"] == "thinkorswim"
        assert imps[0]["source_filename"] == "tos.csv"

        prev = client.get(f"/api/me/trade-log/imports/{imp_id}", cookies=ca)
        assert prev.status_code == 200
        assert prev.json()["import"]["id"] == imp_id
        assert len(prev.json()["trades"]) == 3

        blotter = client.get(
            f"/api/me/trade-log/trades?account_id={aid}", cookies=ca
        ).json()["trades"]
        assert blotter
        assert all(t.get("import_id") == imp_id for t in blotter)
        assert all(t.get("entry_source") == "import" for t in blotter)

        # soft-delete: trades leave the live blotter, import moves to "deleted"
        d = client.delete(f"/api/me/trade-log/imports/{imp_id}", cookies=ca)
        assert d.status_code == 200 and d.json()["deleted"] == 3
        assert client.get(f"/api/me/trade-log/trades?account_id={aid}", cookies=ca).json()["trades"] == []
        listing = client.get("/api/me/trade-log/imports", cookies=ca).json()
        assert listing["imports"] == []
        assert len(listing["deleted"]) == 1 and listing["deleted"][0]["id"] == imp_id
        # preview of a deleted import reads from trash
        assert len(client.get(f"/api/me/trade-log/imports/{imp_id}", cookies=ca).json()["trades"]) == 3
        # restore brings the trades back to the live blotter
        r = client.post(f"/api/me/trade-log/imports/{imp_id}/restore", cookies=ca)
        assert r.status_code == 200 and r.json()["restored"] == 3
        assert len(client.get(f"/api/me/trade-log/trades?account_id={aid}", cookies=ca).json()["trades"]) == 3
        back = client.get("/api/me/trade-log/imports", cookies=ca).json()
        assert len(back["imports"]) == 1 and back["deleted"] == []
    finally:
        _purge(a)


def test_restore_missing_is_404(client):
    a = _id("zztest-tl-batch3@labs.test")
    try:
        ca = cookie_for("activator", a)
        _import_three(client, ca)
        imp = client.get("/api/me/trade-log/imports", cookies=ca).json()["imports"][0]["id"]
        # not deleted yet → nothing to restore
        assert client.post(f"/api/me/trade-log/imports/{imp}/restore", cookies=ca).status_code == 404
    finally:
        _purge(a)


def test_reimport_creates_no_empty_batch(client):
    a = _id("zztest-tl-batch2@labs.test")
    try:
        ca = cookie_for("activator", a)
        aid = _import_three(client, ca)
        again = client.post(
            "/api/me/trade-log/import/commit", cookies=ca,
            json={"adapter": "thinkorswim", "text": FIXTURE.read_text(encoding="utf-8"),
                  "account_id": aid},
        )
        assert again.status_code == 200
        assert again.json()["created"] == 0 and again.json()["import_id"] is None
        # still exactly one batch (the original), no empty duplicate
        assert len(client.get("/api/me/trade-log/imports", cookies=ca).json()["imports"]) == 1
    finally:
        _purge(a)


def test_delete_import_is_scoped(client):
    a = _id("zztest-tl-batch-a@labs.test")
    b = _id("zztest-tl-batch-b@labs.test")
    try:
        ca, cb = cookie_for("activator", a), cookie_for("activator", b)
        _import_three(client, ca)
        _import_three(client, cb)
        imp_a = client.get("/api/me/trade-log/imports", cookies=ca).json()["imports"][0]["id"]
        # B cannot delete A's import → 404, and B's own import stays intact
        assert client.delete(f"/api/me/trade-log/imports/{imp_a}", cookies=cb).status_code == 404
        assert len(client.get("/api/me/trade-log/imports", cookies=cb).json()["imports"]) == 1
    finally:
        _purge(a)
        _purge(b)
