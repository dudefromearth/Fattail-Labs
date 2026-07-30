"""Retrospective agent R5 — Spec §8 validation + analyze endpoint."""

import os

import identity as identity_mod
import db
import retrospective_agent as ra
import retrospective_domain as rd
from tests.conftest import cookie_for


def _member(email: str, *, role: str = "activator") -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Agent Tester")
            cur.execute(
                "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                (role, iid),
            )
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
    return iid


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_validate_rejects_empty_anchors():
    with __import__("pytest").raises(ra.AgentValidationError):
        ra.validate_agent_output(
            {
                "what_worked": [],
                "concerns": [],
                "root_cause_hypotheses": [
                    {"hypothesis": "x", "anchors": [], "supports": []}
                ],
                "habit_plans": [],
            },
            trade_count=25,
            process_what_worked_available=False,
        )


def test_validate_rejects_pnl_only_hypothesis():
    # type outside process/adherence/journal is rejected (cannot origin from P&L)
    with __import__("pytest").raises(ra.AgentValidationError, match="anchor type"):
        ra.validate_agent_output(
            {
                "what_worked": [],
                "concerns": [],
                "root_cause_hypotheses": [
                    {
                        "hypothesis": "edge",
                        "anchors": [{"type": "pnl", "ref": "net"}],
                        "supports": ["pnl up"],
                    }
                ],
                "habit_plans": [],
            },
            trade_count=25,
            process_what_worked_available=False,
        )


def test_validate_symmetry_what_worked():
    with __import__("pytest").raises(ra.AgentValidationError, match="what_worked"):
        ra.validate_agent_output(
            {
                "what_worked": [],
                "concerns": [
                    {
                        "area": "gaps",
                        "evidence": "x",
                        "severity": "med",
                        "anchors": [],
                    }
                ],
                "root_cause_hypotheses": [],
                "habit_plans": [],
            },
            trade_count=10,
            process_what_worked_available=True,
        )


def test_validate_habit_requires_signal():
    with __import__("pytest").raises(ra.AgentValidationError):
        ra.validate_agent_output(
            {
                "what_worked": [{"observation": "ok", "evidence": "e", "window_n": 1}],
                "concerns": [],
                "root_cause_hypotheses": [],
                "habit_plans": [{"title": "x", "habit": "y", "why_process": "z"}],
            },
            trade_count=5,
            process_what_worked_available=True,
        )


def test_local_analyze_and_validate_ok():
    report = {
        "meta": {"trade_count": 5},
        "process": {"adherence": {"followed": 3, "total": 5}},
        "deviations": [
            {
                "kind": "adherence_broke",
                "label": "Trades tagged broke",
                "count": 2,
                "note": "twice",
            }
        ],
        "what_worked": [],
        "book_performance": {"trade_count": 5},
    }
    raw = ra.local_analyze(report)
    out = ra.validate_agent_output(
        raw,
        trade_count=5,
        process_what_worked_available=True,
    )
    assert out["what_worked"]
    assert out["concerns"]
    assert out["root_cause_hypotheses"]
    for h in out["root_cause_hypotheses"]:
        assert h["anchors"]


def test_analyze_endpoint_fail_loud_without_config(client, monkeypatch):
    monkeypatch.delenv("LABS_RETRO_AGENT_MODE", raising=False)
    iid = _member("zztest-agent-off@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        rid = r.json()["id"]
        a = client.post(
            f"/api/me/retrospectives/{rid}/analyze",
            cookies=cookies,
        )
        assert a.status_code == 503, a.text
        assert "not configured" in a.json()["detail"].lower()
    finally:
        _cleanup(iid)


def test_analyze_endpoint_local_ok(client, monkeypatch):
    monkeypatch.setenv("LABS_RETRO_AGENT_MODE", "local")
    iid = _member("zztest-agent-local@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        rid = r.json()["id"]
        a = client.post(
            f"/api/me/retrospectives/{rid}/analyze",
            cookies=cookies,
        )
        assert a.status_code == 200, a.text
        agent = a.json()["agent"]
        assert agent is not None
        assert "what_worked" in agent
        assert "root_cause_hypotheses" in agent
        assert agent.get("meta", {}).get("mode") == "local"
    finally:
        _cleanup(iid)
        monkeypatch.delenv("LABS_RETRO_AGENT_MODE", raising=False)


def test_analyze_trial_off_by_default(client, monkeypatch):
    monkeypatch.setenv("LABS_RETRO_AGENT_MODE", "local")
    monkeypatch.delenv("LABS_RETRO_AGENT_TRIAL", raising=False)
    iid = _member("zztest-agent-trial@labs.test", role="observer")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("SELECT id FROM plans WHERE slug = 'observer-trial'")
            pid = cur.fetchone()["id"]
            identity_mod.upsert_membership(cur, iid, pid, "active", "zztest")
    cookies = cookie_for("observer", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        a = client.post(
            f"/api/me/retrospectives/{rid}/analyze",
            cookies=cookies,
        )
        assert a.status_code == 403, a.text
    finally:
        _cleanup(iid)
        monkeypatch.delenv("LABS_RETRO_AGENT_MODE", raising=False)


# --- RT5-3 characterization -----------------------------------------------------


def test_rt53_empty_anchors_rejected():
    """Seed: empty anchors rejected."""
    with __import__("pytest").raises(ra.AgentValidationError, match="anchors"):
        ra.validate_agent_output(
            {
                "what_worked": [],
                "concerns": [],
                "root_cause_hypotheses": [
                    {
                        "hypothesis": "noise",
                        "anchors": [],
                        "supports": ["x"],
                    }
                ],
                "habit_plans": [],
            },
            trade_count=30,
            process_what_worked_available=False,
        )


def test_rt53_concerns_without_what_worked_when_data_exists():
    """Seed: concerns without what_worked rejected when process data exists."""
    with __import__("pytest").raises(ra.AgentValidationError, match="what_worked"):
        ra.validate_agent_output(
            {
                "what_worked": [],
                "concerns": [
                    {
                        "area": "routine",
                        "evidence": "gap",
                        "severity": "high",
                        "anchors": ["process"],
                    }
                ],
                "root_cause_hypotheses": [],
                "habit_plans": [],
            },
            trade_count=12,
            process_what_worked_available=True,
        )


def test_rt53_sample_gate_drops_outcome_corroborated_hypotheses():
    """Below MIN_INFERENCE_N, hypotheses with P&L supports are dropped."""
    payload = {
        "what_worked": [{"observation": "tagged followed", "evidence": "a", "window_n": 3}],
        "concerns": [],
        "root_cause_hypotheses": [
            {
                "hypothesis": "Process break on Tuesday",
                "anchors": [
                    {"type": "adherence_tag", "ref": "broke"},
                ],
                "supports": ["net pnl was negative"],
                "conflicts": [],
            },
            {
                "hypothesis": "Journal gap hurts routine",
                "anchors": [
                    {"type": "process_event", "ref": "journal_activity_gap"},
                ],
                "supports": ["3-day gap"],
                "conflicts": [],
            },
        ],
        "habit_plans": [],
    }
    out = ra.validate_agent_output(
        payload,
        trade_count=5,  # < 20
        process_what_worked_available=True,
    )
    hyps = out["root_cause_hypotheses"]
    assert len(hyps) == 1
    assert "Journal gap" in hyps[0]["hypothesis"]


def test_rt53_analyze_isolation_404(client, monkeypatch):
    """Seed: isolation — B cannot analyze A's retro."""
    monkeypatch.setenv("LABS_RETRO_AGENT_MODE", "local")
    a = _member("zztest-agent-iso-a@labs.test")
    b = _member("zztest-agent-iso-b@labs.test")
    ca = cookie_for("activator", a)
    cb = cookie_for("activator", b)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=ca,
            json={"gather": True},
        )
        rid = r.json()["id"]
        assert (
            client.post(
                f"/api/me/retrospectives/{rid}/analyze",
                cookies=cb,
            ).status_code
            == 404
        )
    finally:
        _cleanup(a)
        _cleanup(b)
        monkeypatch.delenv("LABS_RETRO_AGENT_MODE", raising=False)


def test_rt53_analyze_before_gather_409(client, monkeypatch):
    monkeypatch.setenv("LABS_RETRO_AGENT_MODE", "local")
    iid = _member("zztest-agent-nogather@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        rid = r.json()["id"]
        a = client.post(
            f"/api/me/retrospectives/{rid}/analyze",
            cookies=cookies,
        )
        assert a.status_code == 409
    finally:
        _cleanup(iid)
        monkeypatch.delenv("LABS_RETRO_AGENT_MODE", raising=False)


def test_rt53_ui_agent_panel_source():
    from pathlib import Path

    path = (
        Path(__file__).resolve().parents[2]
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "retro-agent-run" in src
    assert "retro-agent-accept" in src or "Accept" in src
    assert "Reject" in src
    assert "profit" in src.lower()
