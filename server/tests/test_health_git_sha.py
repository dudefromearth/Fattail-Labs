"""/api/health publishes the checkout SHA."""

from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

import git_sha
from config import get_config

REPO = Path(__file__).resolve().parents[2]


def _head() -> str:
    return subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=str(REPO), text=True
    ).strip().lower()


def test_health_git_sha_matches_rev_parse(client):
    git_sha.reset_git_sha_for_tests()
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["env"] == get_config().env
    assert body["git_sha"] == _head()


def test_labs_git_sha_env_overrides_rev_parse(client, monkeypatch):
    fake = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    monkeypatch.setenv("LABS_GIT_SHA", fake)
    git_sha.reset_git_sha_for_tests()
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["git_sha"] == fake


def test_invalid_labs_git_sha_fails_loud(monkeypatch):
    monkeypatch.setenv("LABS_GIT_SHA", "not-a-sha")
    git_sha.reset_git_sha_for_tests()
    with pytest.raises(RuntimeError, match="LABS_GIT_SHA"):
        git_sha.resolve_git_sha()
