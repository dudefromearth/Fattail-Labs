"""RB-08 — GO token checker. No DB. Chat GO is not authority."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
REQUIRE = REPO / "scripts" / "require_go.py"


def _run(*args: str, root: Path | None = None) -> subprocess.CompletedProcess[str]:
    cmd = [sys.executable, str(REQUIRE), *args]
    if root is not None:
        cmd.extend(["--root", str(root)])
    return subprocess.run(cmd, capture_output=True, text=True, check=False)


def test_template_is_findable():
    text = (REPO / "agents" / "go" / "TEMPLATE.md").read_text(encoding="utf-8")
    assert "GO TOKEN TEMPLATE" in text
    assert "status: GO" not in text.split("```")[1] if "```" in text else True
    # Template itself must not authorize anything
    assert _run("--id", "REPLACE-ME").returncode == 1


def test_rb08_token_authorizes_only_rb08():
    ok = _run("--id", "RB-08")
    assert ok.returncode == 0, ok.stderr
    assert "agents/go/RB-08.md" in ok.stdout
    assert _run("--id", "RB-08").returncode == 0
    assert _run("--id", "RB-02").returncode == 1
    assert _run("--id", "CL-1").returncode == 1


def test_rb01_token_authorizes_studio_two_backout_only():
    ok = _run("--id", "RB-01")
    assert ok.returncode == 0, ok.stderr
    assert "agents/go/RB-01.md" in ok.stdout
    assert _run("--id", "CL-1").returncode == 1


def test_conversation_lab_refuses_without_token():
    r = _run("--id", "CL-1")
    assert r.returncode == 1
    assert "REFUSE" in r.stderr
    assert "CL-1" in r.stderr
    assert not (REPO / "agents" / "go" / "CL-1.md").exists()


def test_draft_and_held_are_not_go(tmp_path: Path):
    go_dir = tmp_path / "agents" / "go"
    go_dir.mkdir(parents=True)
    (go_dir / "RB-99.md").write_text(
        "```\nid: RB-99\nstatus: DRAFT\ndate: 2026-08-14\nissuer: Coach\n```\n",
        encoding="utf-8",
    )
    assert _run("--id", "RB-99", root=tmp_path).returncode == 1
    (go_dir / "RB-99.md").write_text(
        "```\nid: RB-99\nstatus: GO\ndate: 2026-08-14\nissuer: Coach\n```\n",
        encoding="utf-8",
    )
    ok = _run("--id", "RB-99", root=tmp_path)
    assert ok.returncode == 0, ok.stderr


def test_legacy_gate_report_requires_status_go(tmp_path: Path):
    path = tmp_path / "agents" / "p-demo" / "gate-reports"
    path.mkdir(parents=True)
    token = path / "CL-9-0-coach-go.md"
    token.write_text("id: CL-9\nstatus: PENDING\n", encoding="utf-8")
    assert _run("--id", "CL-9", root=tmp_path).returncode == 1
    token.write_text("id: CL-9\nstatus: GO\n", encoding="utf-8")
    ok = _run("--id", "CL-9", root=tmp_path)
    assert ok.returncode == 0, ok.stderr


def test_missing_id_flag_fails():
    r = subprocess.run(
        [sys.executable, str(REQUIRE)],
        capture_output=True,
        text=True,
        check=False,
    )
    assert r.returncode != 0


def test_deploy_script_refuses_without_go():
    script = REPO / "infra" / "scripts" / "deploy-minitwo-auth-hardening.sh"
    r = subprocess.run(
        ["bash", str(script)],
        capture_output=True,
        text=True,
        check=False,
        cwd=str(REPO),
    )
    assert r.returncode == 1
    combined = r.stdout + r.stderr
    assert "REFUSE" in combined
    assert "--go" in combined
    # Must not have started a pull
    assert "git pull" not in combined.lower() or "HEAD=" not in combined


def test_deploy_script_refuses_unknown_id():
    script = REPO / "infra" / "scripts" / "deploy-minitwo-auth-hardening.sh"
    r = subprocess.run(
        ["bash", str(script), "--go", "CL-1"],
        capture_output=True,
        text=True,
        check=False,
        cwd=str(REPO),
    )
    assert r.returncode == 1
    combined = r.stdout + r.stderr
    assert "REFUSE" in combined
    assert "CL-1" in combined
