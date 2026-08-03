"""M7 — membership webhook timestamp + replay rejection."""

from __future__ import annotations

import hashlib
import hmac
import json
import time

import webhook_security as ws
from config import get_config


def _sig(raw: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()


def _body(**extra) -> dict:
    b = {
        "external_id": "zztest-m7-wp-1",
        "email": "zztest-m7@labs.test",
        "plan_key": "observer-trial",
        "status": "active",
        "timestamp": int(time.time()),
    }
    b.update(extra)
    return b


def setup_function():
    ws.reset_webhook_replay_for_tests()


def test_webhook_missing_timestamp_422(client):
    ws.reset_webhook_replay_for_tests()
    body = _body()
    del body["timestamp"]
    raw = json.dumps(body, separators=(",", ":")).encode()
    secret = get_config().sso_secrets["fattail"]
    r = client.post(
        "/api/integrations/wordpress:fattail/membership",
        content=raw,
        headers={
            "Content-Type": "application/json",
            "X-Labs-Signature": _sig(raw, secret),
        },
    )
    assert r.status_code == 422
    assert "timestamp" in r.text.lower()


def test_webhook_stale_timestamp_401(client):
    ws.reset_webhook_replay_for_tests()
    body = _body(timestamp=int(time.time()) - 10_000)
    raw = json.dumps(body, separators=(",", ":")).encode()
    secret = get_config().sso_secrets["fattail"]
    r = client.post(
        "/api/integrations/wordpress:fattail/membership",
        content=raw,
        headers={
            "Content-Type": "application/json",
            "X-Labs-Signature": _sig(raw, secret),
        },
    )
    assert r.status_code == 401
    assert "old" in r.text.lower() or "stale" in r.text.lower() or "age" in r.text.lower()


def test_webhook_bad_signature_401(client):
    ws.reset_webhook_replay_for_tests()
    body = _body()
    raw = json.dumps(body, separators=(",", ":")).encode()
    r = client.post(
        "/api/integrations/wordpress:fattail/membership",
        content=raw,
        headers={
            "Content-Type": "application/json",
            "X-Labs-Signature": "0" * 64,
        },
    )
    assert r.status_code == 401


def test_webhook_fresh_ok_and_replay_409(client):
    """Fresh signed webhook succeeds once; identical raw body is replay-rejected."""
    import db

    ws.reset_webhook_replay_for_tests()
    # Ensure plan map exists for observer-trial
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM plans WHERE slug='observer-trial'")
            plan = cur.fetchone()
            assert plan is not None
            cur.execute(
                """INSERT INTO provider_plan_map (provider, external_key, plan_id)
                   VALUES ('wordpress:fattail', 'observer-trial', %s)
                   ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id)""",
                (plan["id"],),
            )

    body = _body()
    raw = json.dumps(body, separators=(",", ":")).encode()
    secret = get_config().sso_secrets["fattail"]
    headers = {
        "Content-Type": "application/json",
        "X-Labs-Signature": _sig(raw, secret),
    }
    r1 = client.post(
        "/api/integrations/wordpress:fattail/membership",
        content=raw,
        headers=headers,
    )
    assert r1.status_code == 200, r1.text
    assert r1.json().get("ok") is True

    r2 = client.post(
        "/api/integrations/wordpress:fattail/membership",
        content=raw,
        headers=headers,
    )
    assert r2.status_code == 409, r2.text

    # Cleanup identity created by webhook
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT identity_id FROM identities WHERE email=%s",
                ("zztest-m7@labs.test",),
            )
            row = cur.fetchone()
            if row:
                iid = row["identity_id"]
                cur.execute("DELETE FROM memberships WHERE identity_id=%s", (iid,))
                cur.execute(
                    "DELETE FROM identity_links WHERE identity_id=%s", (iid,)
                )
                cur.execute("DELETE FROM identities WHERE identity_id=%s", (iid,))


def test_parse_iso_timestamp():
    dt = ws.parse_webhook_timestamp("2026-08-03T12:00:00Z")
    assert dt.year == 2026
    assert dt.tzinfo is not None
