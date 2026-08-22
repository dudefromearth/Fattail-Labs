"""Wiki compile watcher stub + schema (Wiki Spec v1.2 W0 · AT-WK5 · SI #2 · SI #10)."""

from __future__ import annotations

import pytest

from config import ConfigError
from tests.conftest import cookie_for

import db
import wiki_compile_store as store
import wiki_compile_watcher as watcher

FIX_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
FIX_SHA_2 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"


def _tables_exist() -> bool:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SHOW TABLES LIKE 'wiki_compile_watcher_state'")
            w = cur.fetchone()
            cur.execute("SHOW TABLES LIKE 'wiki_compile_candidates'")
            c = cur.fetchone()
    return w is not None and c is not None


pytestmark = pytest.mark.skipif(
    not _tables_exist(),
    reason="migration 132 not applied",
)


@pytest.fixture
def clean_watcher():
    """Restore singleton SHA and delete probe candidate rows."""
    with db.transaction() as conn:
        prev = store.get_watcher_state(conn)
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM wiki_compile_candidates "
                "WHERE identity_key LIKE 'zzwikicompile-%'"
            )
            cur.execute(
                "UPDATE wiki_compile_watcher_state "
                "SET last_sha = NULL, recorded_at = NULL WHERE id = 1"
            )
    yield
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM wiki_compile_candidates "
                "WHERE identity_key LIKE 'zzwikicompile-%'"
            )
            cur.execute(
                "UPDATE wiki_compile_watcher_state "
                "SET last_sha = %s, recorded_at = %s WHERE id = 1",
                (prev["last_sha"], prev["recorded_at"]),
            )


def test_tables_exist():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SHOW TABLES LIKE 'wiki_compile_candidates'")
            assert cur.fetchone() is not None
            cur.execute("SHOW TABLES LIKE 'wiki_compile_watcher_state'")
            assert cur.fetchone() is not None
            cur.execute(
                "SELECT last_sha FROM wiki_compile_watcher_state WHERE id = 1"
            )
            row = cur.fetchone()
            assert row is not None


def test_missing_sha_fails_loud():
    with pytest.raises(ConfigError, match="No silent default"):
        watcher.resolve_sha_input()
    with pytest.raises(ConfigError, match="No silent default"):
        watcher.require_sha("")
    with pytest.raises(ConfigError, match="not a git SHA"):
        watcher.require_sha("not-a-sha")


def test_sha_from_cli_env_fixture(monkeypatch):
    monkeypatch.delenv(watcher.ENV_SHA, raising=False)
    assert watcher.resolve_sha_input(fixture=FIX_SHA) == FIX_SHA
    assert watcher.resolve_sha_input(cli_sha=FIX_SHA) == FIX_SHA
    monkeypatch.setenv(watcher.ENV_SHA, FIX_SHA)
    assert watcher.resolve_sha_input() == FIX_SHA
    # CLI wins over env
    assert watcher.resolve_sha_input(cli_sha=FIX_SHA_2) == FIX_SHA_2
    # Fixture wins over CLI
    assert (
        watcher.resolve_sha_input(cli_sha=FIX_SHA_2, fixture=FIX_SHA) == FIX_SHA
    )


def test_at_wk5_first_sha_zero_candidates(clean_watcher):
    assert store.count_candidates() == 0
    assert store.get_watcher_state()["last_sha"] is None
    result = watcher.record_sha(FIX_SHA)
    assert result["last_sha"] == FIX_SHA
    assert result["first_snapshot"] is True
    assert result["candidate_count"] == 0
    state = store.get_watcher_state()
    assert state["last_sha"] == FIX_SHA
    assert state["recorded_at"] is not None
    assert store.count_candidates() == 0


def test_first_sha_named_error_if_candidates_exist(clean_watcher):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_compile_candidates (
                  identity_key, kind, origin, title, audience, disposition,
                  created_at, deployed_sha, deployed_at
                ) VALUES (
                  'zzwikicompile-leak', 'feature', 'agent_found', 'leak',
                  'member', 'open', NOW(), %s, NOW()
                )
                """,
                (FIX_SHA,),
            )
    with pytest.raises(
        watcher.WikiCompileWatcherError, match="must not write candidate rows"
    ):
        watcher.record_sha(FIX_SHA)
    # SHA must not be recorded when the snapshot invariant fails
    # record_sha raises after set_watcher_sha inside the same transaction —
    # rollback leaves last_sha NULL.
    assert store.get_watcher_state()["last_sha"] is None


def test_second_sha_still_zero_candidates_w0(clean_watcher):
    watcher.record_sha(FIX_SHA)
    result = watcher.record_sha(FIX_SHA_2)
    assert result["first_snapshot"] is False
    assert result["last_sha"] == FIX_SHA_2
    assert result["candidate_count"] == 0
    assert store.get_watcher_state()["last_sha"] == FIX_SHA_2


def test_cli_writes_sha_and_prints_json(clean_watcher, capsys):
    rc = watcher.main(["--sha", FIX_SHA])
    assert rc == 0
    out = capsys.readouterr().out
    payload = __import__("json").loads(out)
    assert payload["last_sha"] == FIX_SHA
    assert payload["candidate_count"] == 0
    assert store.get_watcher_state()["last_sha"] == FIX_SHA


def test_cli_missing_sha_exits_2(monkeypatch, capsys):
    monkeypatch.delenv(watcher.ENV_SHA, raising=False)
    rc = watcher.main([])
    assert rc == 2
    err = capsys.readouterr().err
    assert "No silent default" in err


def test_identity_unique_while_open(clean_watcher):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_compile_candidates (
                  identity_key, kind, origin, title, audience, disposition,
                  created_at, deployed_sha, deployed_at
                ) VALUES (
                  'zzwikicompile-id', 'feature', 'agent_found', 'one',
                  'member', 'open', NOW(), %s, NOW()
                )
                """,
                (FIX_SHA,),
            )
    with pytest.raises(Exception):
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO wiki_compile_candidates (
                      identity_key, kind, origin, title, audience, disposition,
                      created_at, deployed_sha, deployed_at
                    ) VALUES (
                      'zzwikicompile-id', 'feature', 'agent_found', 'two',
                      'member', 'open', NOW(), %s, NOW()
                    )
                    """,
                    (FIX_SHA_2,),
                )


def test_admin_pointed_sha_must_be_null(clean_watcher):
    with pytest.raises(Exception):
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO wiki_compile_candidates (
                      identity_key, kind, origin, title, audience, disposition,
                      created_at, deployed_sha
                    ) VALUES (
                      'zzwikicompile-admin', 'feature', 'admin_pointed', 'x',
                      'member', 'open', NOW(), %s
                    )
                    """,
                    (FIX_SHA,),
                )


def test_index_admin_flag(client):
    nav = client.get("/api/wiki/index", cookies=cookie_for("navigator"))
    assert nav.status_code == 200
    assert nav.json()["admin"] is False
    adm = client.get("/api/wiki/index", cookies=cookie_for("administrator"))
    assert adm.status_code == 200
    assert adm.json()["admin"] is True
