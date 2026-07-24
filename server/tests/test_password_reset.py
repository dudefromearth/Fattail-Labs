"""Native forgot-password / reset-password (Password-Reset Spec v1.0)."""

from __future__ import annotations

import hashlib
import re

import pytest

import db
import identity
import password_reset as pr


@pytest.fixture()
def native_user():
    """Create a throwaway identity + password; clean up after."""
    email = "zztest-reset@labs.test"
    password = "original-password-99"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM identities WHERE email = %s", (email,))
            iid = identity.get_or_create_identity(cur, email, "ZZ Reset")
            ph = identity.hash_password(password)
            cur.execute(
                """INSERT INTO credentials (identity_id, password_hash) VALUES (%s, %s)
                   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)""",
                (iid, ph),
            )
    yield {"email": email, "password": password, "identity_id": iid}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM identities WHERE email = %s", (email,))


def test_forgot_requires_valid_email(client):
    r = client.post("/api/auth/forgot-password", json={"email": "not-an-email"})
    assert r.status_code == 422


def test_forgot_503_without_smtp(client, native_user, monkeypatch):
    monkeypatch.delenv("LABS_SMTP_HOST", raising=False)
    r = client.post(
        "/api/auth/forgot-password",
        json={"email": native_user["email"]},
    )
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"].lower()


def test_forgot_unknown_email_same_message(client, monkeypatch):
    monkeypatch.setenv("LABS_SMTP_HOST", "smtp.test.local")
    monkeypatch.setenv("LABS_SMTP_FROM", "labs@test.local")
    monkeypatch.setenv("LABS_WEB_ORIGIN", "http://localhost:3000")
    sent: list = []

    def fake_send(to, subject, body):
        sent.append((to, subject, body))

    monkeypatch.setattr("notify._send_email", fake_send)
    r = client.post(
        "/api/auth/forgot-password",
        json={"email": "nobody-zz@labs.test"},
    )
    assert r.status_code == 200
    assert "If an account" in r.json()["detail"]
    assert sent == []


def test_forgot_and_reset_flow(client, native_user, monkeypatch):
    monkeypatch.setenv("LABS_SMTP_HOST", "smtp.test.local")
    monkeypatch.setenv("LABS_SMTP_FROM", "labs@test.local")
    monkeypatch.setenv("LABS_WEB_ORIGIN", "http://localhost:3000")
    sent: list = []

    def fake_send(to, subject, body):
        sent.append((to, subject, body))

    monkeypatch.setattr("notify._send_email", fake_send)

    r = client.post(
        "/api/auth/forgot-password",
        json={"email": native_user["email"]},
    )
    assert r.status_code == 200, r.text
    assert "If an account" in r.json()["detail"]
    assert len(sent) == 1
    assert sent[0][0] == native_user["email"]
    m = re.search(r"token=([A-Za-z0-9_\-]+)", sent[0][2])
    assert m, sent[0][2]
    token = m.group(1)

    # Token hash stored once
    th = hashlib.sha256(token.encode()).hexdigest()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT used_at FROM password_reset_tokens WHERE token_hash = %s",
                (th,),
            )
            row = cur.fetchone()
            assert row is not None
            assert row["used_at"] is None

    new_pw = "brand-new-password-42"
    r2 = client.post(
        "/api/auth/reset-password",
        json={"token": token, "password": new_pw},
    )
    assert r2.status_code == 200, r2.text
    assert r2.json()["ok"] is True

    # Old password fails
    bad = client.post(
        "/api/auth/login",
        json={"email": native_user["email"], "password": native_user["password"]},
    )
    assert bad.status_code == 401

    # New password works
    good = client.post(
        "/api/auth/login",
        json={"email": native_user["email"], "password": new_pw},
    )
    assert good.status_code == 200
    assert "identity_id" in good.json()
    # Session-scoped TestClient persists cookies — clear so other tests stay anonymous.
    client.cookies.clear()

    # Reuse token fails
    r3 = client.post(
        "/api/auth/reset-password",
        json={"token": token, "password": "another-password-99"},
    )
    assert r3.status_code == 400


def test_reset_short_password(client, native_user, monkeypatch):
    monkeypatch.setenv("LABS_SMTP_HOST", "smtp.test.local")
    monkeypatch.setenv("LABS_SMTP_FROM", "labs@test.local")
    monkeypatch.setenv("LABS_WEB_ORIGIN", "http://localhost:3000")
    captured = {}

    def fake_send(to, subject, body):
        m = re.search(r"token=([A-Za-z0-9_\-]+)", body)
        captured["token"] = m.group(1) if m else None

    monkeypatch.setattr("notify._send_email", fake_send)
    client.post(
        "/api/auth/forgot-password",
        json={"email": native_user["email"]},
    )
    r = client.post(
        "/api/auth/reset-password",
        json={"token": captured["token"], "password": "short"},
    )
    assert r.status_code == 422
    assert "10" in r.json()["detail"]


def test_reset_garbage_token(client):
    r = client.post(
        "/api/auth/reset-password",
        json={"token": "not-a-real-token-value-xx", "password": "long-enough-password"},
    )
    assert r.status_code == 400
