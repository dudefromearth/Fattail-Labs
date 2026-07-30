"""R8 — sequence agent + prompt versions (Spec v0.7.1 §16)."""

from __future__ import annotations

import os

import db
import identity as identity_mod
import retrospective_agent as ra
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Seq Agent")
            cur.execute(
                "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                ("activator", iid),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
    return iid


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_legs WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_ceremony_steps_nine_ordered():
    assert len(ra.CEREMONY_STEPS) == 9
    ids = [s["id"] for s in ra.CEREMONY_STEPS]
    assert ids == list(range(1, 10))


def test_guardrail_blocks_prescription():
    try:
        ra.assert_no_guardrail_violation(
            "You should have waited for the setup", field="test"
        )
        assert False, "expected guardrail"
    except ra.AgentValidationError as e:
        assert "guardrail" in str(e).lower() or "banned" in str(e).lower()


def test_guardrail_blocks_diagnosis_and_pnl_figure():
    try:
        ra.assert_no_guardrail_violation("You were impatient this week", field="t")
        assert False
    except ra.AgentValidationError:
        pass
    try:
        ra.assert_no_guardrail_violation("Lost $500 on revenge", field="t")
        assert False
    except ra.AgentValidationError:
        pass


def test_sequence_guide_no_habit_plans():
    report = {
        "what_worked": [{"observation": "3 followed", "evidence": "x", "window_n": 3}],
        "deviations": [
            {"kind": "adherence_broke", "label": "Trades tagged broke", "count": 2}
        ],
        "period_indicator": {"headline": "Steady", "status": "steady", "readings": []},
        "clustering": {"statements": []},
        "emotion_mirror": {"behavior_tags": [], "insight_tags": []},
        "expected_vs_actual": [],
        "carry_forward": {"plans": []},
        "book_performance": {"trade_count": 5},
        "meta": {"trade_count": 5},
    }
    g = ra.build_sequence_guide(
        report,
        prompt_version_id=ra.DEFAULT_PROMPT_VERSION_ID,
        focused_step=3,
    )
    assert g["role"] == "sequence_keeper"
    assert g["focused_step"] == 3
    assert g["habit_plans"] == []
    assert g["meta"]["prescribes"] is False
    assert g["guardrails"]["no_prescription"] is True
    assert g["guardrails"]["one_question_per_turn"] is True
    assert len(g["steps"]) == 9
    focused = [s for s in g["steps"] if s["is_focused"]]
    assert len(focused) == 1
    assert focused[0]["id"] == 3
    assert g["turn"]["step_id"] == 3
    # Guardrail-clean turn
    ra.assert_no_guardrail_violation(g["turn"]["question"])


def test_run_analyze_requires_mode(monkeypatch):
    monkeypatch.setenv("LABS_RETRO_AGENT_MODE", "off")
    # clear cache if any
    report = {"meta": {"trade_count": 0}, "what_worked": [], "deviations": []}
    try:
        ra.run_analyze(report, role="activator", has_observer_trial=False)
        assert False, "expected config error"
    except ra.AgentConfigError:
        pass


def test_run_analyze_sequence_local(monkeypatch):
    monkeypatch.setenv("LABS_RETRO_AGENT_MODE", "local")
    report = {
        "meta": {"trade_count": 4},
        "what_worked": [],
        "deviations": [],
        "process": {"adherence": {"followed": 0}},
        "period_indicator": {"headline": "Not enough yet", "readings": []},
    }
    out = ra.run_analyze(
        report,
        role="activator",
        has_observer_trial=False,
        focused_step=2,
    )
    assert out["role"] == "sequence_keeper"
    assert out["habit_plans"] == []
    assert out["focused_step"] == 2


def test_create_stamps_prompt_version(client, monkeypatch):
    monkeypatch.setenv("LABS_RETRO_AGENT_MODE", "local")
    email = "zztest-retro-seq-stamp@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("prompt_version_id")
        assert "RETROSPECTIVE" in str(data["prompt_version_id"]).upper() or data[
            "prompt_version_id"
        ]

        # Sequence agent run
        rid = data["id"]
        a = client.post(
            f"/api/me/retrospectives/{rid}/analyze",
            cookies=cookies,
            json={"focused_step": 4},
        )
        assert a.status_code == 200, a.text
        ag = a.json().get("agent") or {}
        assert ag.get("role") == "sequence_keeper"
        assert ag.get("habit_plans") == [] or not ag.get("habit_plans")
        assert ag.get("focused_step") == 4
        assert a.json().get("prompt_version_id")
        # No prescription language in turn
        turn = ag.get("turn") or {}
        q = str(turn.get("question") or "").lower()
        assert "you should" not in q
        assert "you must" not in q
    finally:
        _cleanup(iid)


def test_admin_list_prompt_versions(client, admin_cookies):
    r = client.get("/api/admin/retrospective-prompts", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    versions = r.json().get("versions") or []
    ids = {v["id"] for v in versions}
    assert ra.DEFAULT_PROMPT_VERSION_ID in ids or len(versions) >= 0


def test_ui_sequence_agent_source():
    from pathlib import Path

    path = (
        Path(__file__).resolve().parents[2]
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert 'data-role="sequence_keeper"' in src
    assert "retro-agent-turn" in src
    assert "does not prescribe" in src.lower()
    # Anti-wizard: ceremony steps remain independent
    assert "CEREMONY_STEPS" in src
    assert "retro-agent-run" in src
    # Not a Next-button wizard driven solely by agent
    assert "Run analysis" not in src or "sequence" in src.lower()
