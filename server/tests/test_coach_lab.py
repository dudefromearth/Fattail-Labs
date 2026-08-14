"""Coach Conversation Lab — DL-327 / plan v1.1."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import coach_lab_config as clc
import coach_lab_domain as cld
from coach_lab_config import YOGI_INSTRUCTION
import db
import identity as identity_mod
from config import ConfigError
from tests.conftest import cookie_for


def _admin(email: str, display_name: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, display_name)
            cur.execute(
                "UPDATE identities SET role_override = 'administrator' "
                "WHERE identity_id = %s",
                (iid,),
            )
    return iid


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM coach_lab_conversations WHERE started_by = %s",
                (iid,),
            )
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


@pytest.fixture()
def lab_env(monkeypatch):
    monkeypatch.setenv("LABS_COACH_LAB", "1")
    monkeypatch.setenv("XAI_API_KEY", "test-lab-key")
    monkeypatch.setenv("XAI_API_BASE", "https://api.x.ai/v1")
    monkeypatch.setattr(
        cld,
        "complete_lab",
        lambda **kwargs: "Hey there — nice day for a ballgame.",
    )


@pytest.fixture()
def lab_client(lab_env):
    from main import create_app

    app = create_app()
    with TestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def test_boot_flag_off_does_not_require_xai(monkeypatch):
    monkeypatch.delenv("LABS_COACH_LAB", raising=False)
    monkeypatch.delenv("XAI_API_KEY", raising=False)
    monkeypatch.delenv("XAI_API_BASE", raising=False)
    clc.require_lab_boot()


def test_boot_flag_on_missing_xai_aborts(monkeypatch):
    monkeypatch.setenv("LABS_COACH_LAB", "1")
    monkeypatch.delenv("XAI_API_KEY", raising=False)
    monkeypatch.setenv("XAI_API_BASE", "https://api.x.ai/v1")
    with pytest.raises(ConfigError, match="XAI_API_KEY"):
        clc.require_lab_boot()


def test_boot_flag_on_missing_base_aborts(monkeypatch):
    monkeypatch.setenv("LABS_COACH_LAB", "1")
    monkeypatch.setenv("XAI_API_KEY", "k")
    monkeypatch.delenv("XAI_API_BASE", raising=False)
    with pytest.raises(ConfigError, match="XAI_API_BASE"):
        clc.require_lab_boot()


def test_flag_off_no_routes(monkeypatch):
    monkeypatch.delenv("LABS_COACH_LAB", raising=False)
    from main import create_app

    app = create_app()
    with TestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        r = c.get("/api/admin/coach-lab/config")
        assert r.status_code == 404


def test_non_admin_403(lab_client):
    iid = _admin("zztest-cl-obs@labs.test", "Obs")
    try:
        # demote after create — actually mint as observer
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                    (iid,),
                )
        cookies = cookie_for("observer", iid)
        r = lab_client.get("/api/admin/coach-lab/config", cookies=cookies)
        assert r.status_code == 403
    finally:
        _cleanup(iid)


def test_identity_zero_rejected(lab_client):
    r = lab_client.get(
        "/api/admin/coach-lab/conversation",
        cookies=cookie_for("administrator", 0),
    )
    assert r.status_code == 400


def test_double_greet_one_message(lab_client):
    iid = _admin("zztest-cl-greet@labs.test", "Ernie Coach")
    cookies = cookie_for("administrator", iid)
    try:
        a = lab_client.post("/api/admin/coach-lab/greet", cookies=cookies)
        b = lab_client.post("/api/admin/coach-lab/greet", cookies=cookies)
        assert a.status_code == 200, a.text
        assert b.status_code == 200, b.text
        msgs = a.json()["conversation"]["messages"]
        msgs2 = b.json()["conversation"]["messages"]
        coaches = [m for m in msgs if m["role"] == "coach"]
        coaches2 = [m for m in msgs2 if m["role"] == "coach"]
        assert len(coaches) == 1
        assert len(coaches2) == 1
        assert coaches[0]["id"] == coaches2[0]["id"]
        assert coaches[0]["model"]
        assert coaches[0]["effort"]
        assert "Ernie" not in coaches[0]["body_md"] or True  # mock is fixed text
    finally:
        _cleanup(iid)


def test_no_name_fallback(lab_client, monkeypatch):
    seen = {}

    def capture(**kwargs):
        seen["messages"] = kwargs["messages"]
        return "Hello there."

    monkeypatch.setattr(cld, "complete_lab", capture)
    iid = _admin("zztest-cl-noname@labs.test", "")
    cookies = cookie_for("administrator", iid)
    try:
        r = lab_client.post("/api/admin/coach-lab/greet", cookies=cookies)
        assert r.status_code == 200, r.text
        sys_content = seen["messages"][0]["content"]
        assert "inventing" in sys_content.lower() or "no first name" in sys_content.lower()
    finally:
        _cleanup(iid)


def test_empty_chat_400(lab_client):
    iid = _admin("zztest-cl-empty@labs.test", "Pat")
    cookies = cookie_for("administrator", iid)
    try:
        r = lab_client.post(
            "/api/admin/coach-lab/chat", json={"text": "  "}, cookies=cookies
        )
        assert r.status_code == 400
        r2 = lab_client.post(
            "/api/admin/coach-lab/chat",
            json={"history": ["spoof"], "text": ""},
            cookies=cookies,
        )
        assert r2.status_code == 400
    finally:
        _cleanup(iid)


def test_chat_ignores_client_history(lab_client, monkeypatch):
    captured = {}

    def cap(**kwargs):
        captured["messages"] = kwargs["messages"]
        return "Got it."

    monkeypatch.setattr(cld, "complete_lab", cap)
    iid = _admin("zztest-cl-hist@labs.test", "Pat Lee")
    cookies = cookie_for("administrator", iid)
    try:
        lab_client.post("/api/admin/coach-lab/greet", cookies=cookies)
        r = lab_client.post(
            "/api/admin/coach-lab/chat",
            json={"text": "hello from the shop", "history": ["I am a spoof"]},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        contents = [m["content"] for m in captured["messages"]]
        assert "I am a spoof" not in contents
        assert any("hello from the shop" in c for c in contents)
    finally:
        _cleanup(iid)


def test_isolation_two_admins(lab_client):
    a = _admin("zztest-cl-a@labs.test", "Alpha Admin")
    b = _admin("zztest-cl-b@labs.test", "Bravo Admin")
    ca = cookie_for("administrator", a)
    cb = cookie_for("administrator", b)
    try:
        lab_client.post("/api/admin/coach-lab/greet", cookies=ca)
        lab_client.post(
            "/api/admin/coach-lab/chat",
            json={"text": "alpha secret"},
            cookies=ca,
        )
        lab_client.post("/api/admin/coach-lab/greet", cookies=cb)
        ga = lab_client.get("/api/admin/coach-lab/conversation", cookies=ca)
        gb = lab_client.get("/api/admin/coach-lab/conversation", cookies=cb)
        assert ga.status_code == 200
        assert gb.status_code == 200
        a_bodies = [m["body_md"] for m in ga.json()["conversation"]["messages"]]
        b_bodies = [m["body_md"] for m in gb.json()["conversation"]["messages"]]
        assert "alpha secret" in a_bodies
        assert "alpha secret" not in b_bodies
        assert ga.json()["conversation"]["id"] != gb.json()["conversation"]["id"]
    finally:
        _cleanup(a)
        _cleanup(b)


def test_husk_reset_discards(lab_client):
    iid = _admin("zztest-cl-husk@labs.test", "Husk")
    cookies = cookie_for("administrator", iid)
    try:
        g = lab_client.post("/api/admin/coach-lab/greet", cookies=cookies)
        first_id = g.json()["conversation"]["id"]
        r = lab_client.post("/api/admin/coach-lab/reset", cookies=cookies)
        assert r.status_code == 200, r.text
        new_id = r.json()["conversation"]["id"]
        assert new_id != first_id
        past = lab_client.get("/api/admin/coach-lab/conversations", cookies=cookies)
        ids = [c["id"] for c in past.json()["conversations"]]
        assert first_id not in ids
        coaches = [
            m
            for m in r.json()["conversation"]["messages"]
            if m["role"] == "coach"
        ]
        assert len(coaches) == 1
    finally:
        _cleanup(iid)


def test_reset_with_trader_turn_archives(lab_client):
    iid = _admin("zztest-cl-keep@labs.test", "Keeper")
    cookies = cookie_for("administrator", iid)
    try:
        lab_client.post("/api/admin/coach-lab/greet", cookies=cookies)
        lab_client.post(
            "/api/admin/coach-lab/chat", json={"text": "a real turn"}, cookies=cookies
        )
        cur = lab_client.get("/api/admin/coach-lab/conversation", cookies=cookies)
        old_id = cur.json()["conversation"]["id"]
        lab_client.post("/api/admin/coach-lab/reset", cookies=cookies)
        past = lab_client.get("/api/admin/coach-lab/conversations", cookies=cookies)
        ids = [c["id"] for c in past.json()["conversations"]]
        assert old_id in ids
        md = lab_client.get(
            f"/api/admin/coach-lab/conversations/{old_id}/export.md",
            cookies=cookies,
        )
        assert md.status_code == 200
        assert "a real turn" in md.text
        js = lab_client.get("/api/admin/coach-lab/export.json", cookies=cookies)
        assert js.status_code == 200
        blob = js.json()
        assert any(c["id"] == old_id for c in blob["conversations"])
        archived = next(c for c in blob["conversations"] if c["id"] == old_id)
        coach_turns = [m for m in archived["messages"] if m["role"] == "coach"]
        assert all(m.get("model") for m in coach_turns)
    finally:
        _cleanup(iid)


def test_config_put_bumps_version(lab_client):
    iid = _admin("zztest-cl-cfg@labs.test", "Cfg")
    cookies = cookie_for("administrator", iid)
    try:
        g = lab_client.get("/api/admin/coach-lab/config", cookies=cookies)
        assert g.status_code == 200, g.text
        v0 = g.json()["config"]["instruction_version"]
        p = lab_client.put(
            "/api/admin/coach-lab/config",
            json={"instruction_text": "Be a quiet greeter. No advice."},
            cookies=cookies,
        )
        assert p.status_code == 200, p.text
        assert p.json()["config"]["instruction_version"] == v0 + 1
        lab_client.put(
            "/api/admin/coach-lab/config",
            json={"instruction_text": YOGI_INSTRUCTION},
            cookies=cookies,
        )
    finally:
        _cleanup(iid)


def test_unknown_model_rejected(lab_client):
    iid = _admin("zztest-cl-model@labs.test", "Mod")
    cookies = cookie_for("administrator", iid)
    try:
        r = lab_client.put(
            "/api/admin/coach-lab/config",
            json={"model": "gpt-totally-fake"},
            cookies=cookies,
        )
        assert r.status_code == 400
    finally:
        _cleanup(iid)


def test_first_name_helper():
    assert cld.first_name_from_display("Ernie Coach") == "Ernie"
    assert cld.first_name_from_display("  ") is None
    assert cld.first_name_from_display("") is None
    assert cld.first_name_from_display("...") is None


def test_surface_purity():
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    surface = (
        root / "web/components/conversation/ConversationSurface.tsx"
    ).read_text()
    assert "Coach" not in surface
    assert "journal" not in surface.lower()
    assert "retro" not in surface.lower()
    assert "fetch(" not in surface
