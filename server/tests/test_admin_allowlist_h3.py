"""H3 — WP is_admin must not promote without LABS_ADMIN_EMAILS allowlist."""

from __future__ import annotations

import admin_allowlist as aa
import config as config_mod


def test_may_sso_grant_requires_allowlist(monkeypatch):
    monkeypatch.setenv("LABS_ADMIN_EMAILS", "ernie@dudefromearth.com,coach@fattail.ai")
    config_mod.reset_config_for_tests()
    assert aa.may_sso_grant_administrator(
        email="ernie@dudefromearth.com", wp_claims_admin=True
    )
    assert not aa.may_sso_grant_administrator(
        email="alpha@fotw.ai", wp_claims_admin=True
    )
    assert not aa.may_sso_grant_administrator(
        email="ernie@dudefromearth.com", wp_claims_admin=False
    )
    config_mod.reset_config_for_tests()


def test_bare_admin_role_without_email_denied(monkeypatch):
    monkeypatch.setenv("LABS_ADMIN_EMAILS", "ernie@dudefromearth.com")
    config_mod.reset_config_for_tests()
    assert not aa.may_sso_grant_administrator(email="", wp_claims_admin=True)
    assert not aa.may_sso_grant_administrator(email=None, wp_claims_admin=True)
    config_mod.reset_config_for_tests()


def test_allowlist_case_insensitive(monkeypatch):
    monkeypatch.setenv("LABS_ADMIN_EMAILS", "Ernie@DudeFromEarth.com")
    config_mod.reset_config_for_tests()
    assert aa.is_allowlisted_admin_email("ernie@dudefromearth.com")
    config_mod.reset_config_for_tests()
