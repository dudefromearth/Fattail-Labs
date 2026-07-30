"""Habit plans R4 — Spec §9.2 / §18 (cap 2 active, isolation)."""

import identity as identity_mod
import db
import retrospective_domain as rd
from tests.conftest import cookie_for


def _member(email: str, *, role: str = "activator") -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Habit Tester")
            cur.execute(
                "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                (role, iid),
            )
            cur.execute("DELETE FROM member_habit_plans WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
    return iid


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM member_habit_plans WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_create_requires_observable_signal(client):
    iid = _member("zztest-habit-sig@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={"title": "Journal daily", "habit": "write notes"},
        )
        assert r.status_code == 422
        r2 = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "Journal daily",
                "habit": "write notes",
                "why_process": "build routine",
                "observable_signal": "not_a_signal",
            },
        )
        assert r2.status_code == 422
        ok = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "Journal daily",
                "habit": "write notes",
                "why_process": "build routine",
                "observable_signal": "routine_days",
            },
        )
        assert ok.status_code == 200, ok.text
        body = ok.json()
        assert body["status"] == "proposed"
        assert body["observable_signal"] == "routine_days"
        assert body["identity_id"] == iid
    finally:
        _cleanup(iid)


def test_max_two_active_third_409(client):
    """Spec §18: third activate → 409 (including concurrent-safe count)."""
    iid = _member("zztest-habit-cap@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        ids = []
        for i in range(3):
            r = client.post(
                "/api/me/habit-plans",
                cookies=cookies,
                json={
                    "title": f"Plan {i}",
                    "habit": f"habit {i}",
                    "why_process": "process",
                    "observable_signal": "adherence_rate",
                    "status": "proposed",
                },
            )
            assert r.status_code == 200, r.text
            ids.append(r.json()["id"])

        a1 = client.patch(
            f"/api/me/habit-plans/{ids[0]}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert a1.status_code == 200, a1.text
        assert a1.json()["status"] == "active"
        assert a1.json()["activated_at"] is not None

        a2 = client.patch(
            f"/api/me/habit-plans/{ids[1]}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert a2.status_code == 200, a2.text

        a3 = client.patch(
            f"/api/me/habit-plans/{ids[2]}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert a3.status_code == 409, a3.text
        assert "2" in a3.json()["detail"] or "active" in a3.json()["detail"].lower()

        # create as active also blocked
        c = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "Fourth",
                "habit": "x",
                "why_process": "y",
                "observable_signal": "live_checkins",
                "status": "active",
            },
        )
        assert c.status_code == 409

        # free a slot → activate ok
        client.patch(
            f"/api/me/habit-plans/{ids[0]}",
            cookies=cookies,
            json={"status": "kept"},
        )
        a3b = client.patch(
            f"/api/me/habit-plans/{ids[2]}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert a3b.status_code == 200, a3b.text
    finally:
        _cleanup(iid)


def test_isolation_cross_member_404(client):
    a = _member("zztest-habit-a@labs.test")
    b = _member("zztest-habit-b@labs.test")
    ca = cookie_for("activator", a)
    cb = cookie_for("activator", b)
    try:
        r = client.post(
            "/api/me/habit-plans",
            cookies=ca,
            json={
                "title": "A plan",
                "habit": "a",
                "why_process": "w",
                "observable_signal": "lesson_days",
            },
        )
        assert r.status_code == 200
        pid = r.json()["id"]
        assert client.get(f"/api/me/habit-plans/{pid}", cookies=cb).status_code == 404
        assert (
            client.patch(
                f"/api/me/habit-plans/{pid}",
                cookies=cb,
                json={"title": "hijack"},
            ).status_code
            == 404
        )
        listed = client.get("/api/me/habit-plans", cookies=cb)
        assert listed.status_code == 200
        assert all(p["id"] != pid for p in listed.json()["habit_plans"])
    finally:
        _cleanup(a)
        _cleanup(b)


def test_free_observer_403(client):
    iid = _member("zztest-habit-free@labs.test", role="observer")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
    cookies = cookie_for("observer", iid)
    try:
        r = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "X",
                "habit": "y",
                "why_process": "z",
                "observable_signal": "routine_days",
            },
        )
        assert r.status_code == 403
    finally:
        _cleanup(iid)


def test_carry_forward_on_gather(client):
    """Non-maiden gather includes carry_forward when plans exist."""
    iid = _member("zztest-habit-cf@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # activate a plan
        p = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "Tag followed",
                "habit": "mark adherence",
                "why_process": "process",
                "observable_signal": "adherence_rate",
                "status": "active",
            },
        )
        assert p.status_code == 200, p.text
        # maiden retro complete
        r1 = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r1.status_code == 200
        # maiden carry_forward is null
        assert r1.json()["report"]["carry_forward"] is None
        rid = r1.json()["id"]
        client.post(f"/api/me/retrospectives/{rid}/complete", cookies=cookies)

        r2 = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r2.status_code == 200, r2.text
        cf = r2.json()["report"]["carry_forward"]
        assert cf is not None
        assert isinstance(cf["plans"], list)
        assert len(cf["plans"]) >= 1
        assert cf["plans"][0]["observable_signal"] == "adherence_rate"
    finally:
        _cleanup(iid)


def test_count_active_helper():
    assert rd.MAX_ACTIVE_HABIT_PLANS == 2
    assert "routine_days" in rd.OBSERVABLE_SIGNALS


# --- RT4-3 characterization -----------------------------------------------------


def test_rt43_maiden_carry_forward_null(client):
    """Maiden gather: carry_forward is null (section absent in UI)."""
    iid = _member("zztest-habit-maiden@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        # Even with an active plan, maiden journey has no carry-forward section
        client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "New plan",
                "habit": "h",
                "why_process": "w",
                "observable_signal": "routine_days",
                "status": "active",
            },
        )
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        assert r.json()["is_maiden"] is True
        assert r.json()["report"]["carry_forward"] is None
    finally:
        _cleanup(iid)


def test_rt43_non_maiden_empty_carry_forward_message(client):
    """Non-maiden with no activated plans: empty_message, not null."""
    iid = _member("zztest-habit-empty-cf@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r1 = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r1.status_code == 200
        rid = r1.json()["id"]
        client.post(f"/api/me/retrospectives/{rid}/complete", cookies=cookies)
        r2 = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r2.status_code == 200, r2.text
        assert r2.json()["is_maiden"] is False
        cf = r2.json()["report"]["carry_forward"]
        assert cf is not None
        assert cf["plans"] == []
        assert "appear next time" in (cf.get("empty_message") or "").lower()
    finally:
        _cleanup(iid)


def test_rt43_create_two_active_third_create_409(client):
    """Two create-as-active then third create-as-active → 409."""
    iid = _member("zztest-habit-create-cap@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        for i in range(2):
            r = client.post(
                "/api/me/habit-plans",
                cookies=cookies,
                json={
                    "title": f"A{i}",
                    "habit": f"h{i}",
                    "why_process": "w",
                    "observable_signal": "live_checkins",
                    "status": "active",
                },
            )
            assert r.status_code == 200, r.text
        third = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "A2",
                "habit": "h2",
                "why_process": "w",
                "observable_signal": "lesson_days",
                "status": "active",
            },
        )
        assert third.status_code == 409, third.text
    finally:
        _cleanup(iid)


def test_rt43_invalid_transition_409(client):
    """kept → active is not allowed."""
    iid = _member("zztest-habit-trans@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/habit-plans",
            cookies=cookies,
            json={
                "title": "T",
                "habit": "h",
                "why_process": "w",
                "observable_signal": "adherence_rate",
                "status": "active",
            },
        )
        pid = r.json()["id"]
        client.patch(
            f"/api/me/habit-plans/{pid}",
            cookies=cookies,
            json={"status": "kept"},
        )
        bad = client.patch(
            f"/api/me/habit-plans/{pid}",
            cookies=cookies,
            json={"status": "active"},
        )
        assert bad.status_code == 409
    finally:
        _cleanup(iid)


def test_rt43_build_carry_forward_unit():
    """Domain: maiden None; never-activated empty; active plans listed."""
    iid = _member("zztest-habit-domain-cf@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert rd.build_carry_forward(cur, iid, is_maiden=True) is None
                empty = rd.build_carry_forward(cur, iid, is_maiden=False)
                assert empty is not None
                assert empty["plans"] == []
                cur.execute(
                    """INSERT INTO member_habit_plans
                         (identity_id, title, habit, why_process, observable_signal,
                          status, activated_at)
                       VALUES (%s, 'X', 'y', 'z', 'routine_days', 'active', NOW())""",
                    (iid,),
                )
                filled = rd.build_carry_forward(cur, iid, is_maiden=False)
                assert len(filled["plans"]) == 1
                assert filled["plans"][0]["observable_signal"] == "routine_days"
    finally:
        _cleanup(iid)


def test_rt43_workspace_maiden_hides_carry_forward_source():
    """UI: carry-forward gated on !isMaiden."""
    from pathlib import Path

    path = (
        Path(__file__).resolve().parents[2]
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "retro-carry-forward" in src
    assert "!isMaiden" in src or "isMaiden &&" in src or "{!isMaiden &&" in src
    assert "Kept" in src and "Partial" in src and "Lapsed" in src
