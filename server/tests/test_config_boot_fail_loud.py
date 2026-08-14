"""RB-05 — boot flags fail loud. Missing LABS_ENV / LABS_PORT / LABS_SESSION_SECRET."""

from __future__ import annotations

import pytest

import config


def test_missing_labs_env_raises_config_error(monkeypatch):
    config.reset_config_for_tests()
    monkeypatch.delenv("LABS_ENV", raising=False)
    with pytest.raises(config.ConfigError, match="LABS_ENV"):
        config.Config()


def test_missing_labs_port_raises_config_error(monkeypatch):
    config.reset_config_for_tests()
    monkeypatch.setenv("LABS_ENV", "dev")
    monkeypatch.delenv("LABS_PORT", raising=False)
    with pytest.raises(config.ConfigError, match="LABS_PORT"):
        config.Config()


def test_missing_labs_session_secret_raises_config_error(monkeypatch):
    config.reset_config_for_tests()
    monkeypatch.setenv("LABS_ENV", "dev")
    monkeypatch.setenv("LABS_PORT", "4000")
    monkeypatch.setenv("LABS_DB_HOST", "127.0.0.1")
    monkeypatch.setenv("LABS_DB_PORT", "3306")
    monkeypatch.setenv("LABS_DB_USER", "labs")
    monkeypatch.setenv("LABS_DB_PASSWORD", "x")
    monkeypatch.setenv("LABS_DB_NAME", "labs")
    monkeypatch.setenv("LABS_SSO_SECRET_FATTAIL", "f" * 32)
    monkeypatch.setenv("LABS_SSO_SECRET_0DTE", "o" * 32)
    monkeypatch.delenv("LABS_SESSION_SECRET", raising=False)
    with pytest.raises(config.ConfigError, match="LABS_SESSION_SECRET"):
        config.Config()
