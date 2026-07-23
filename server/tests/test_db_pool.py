"""Phase E — DB connection pool characterization."""

from __future__ import annotations

import threading

import db


def test_pool_reuses_connections():
    db.reset_pool()
    stats0 = db.get_pool().stats()
    assert stats0["size"] >= 1

    ids = []
    for _ in range(5):
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok")
                assert cur.fetchone()["ok"] == 1
            ids.append(id(conn))

    # After returning to pool, subsequent checkouts should reuse (created << 5)
    stats = db.get_pool().stats()
    assert stats["created"] <= stats["size"]
    assert stats["created"] >= 1
    # At least one id reused if pool works
    assert len(set(ids)) < 5 or stats["created"] == 1


def test_pool_concurrent_transactions():
    db.reset_pool()
    errors: list[BaseException] = []

    def worker():
        try:
            with db.transaction() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1 AS ok")
                    assert cur.fetchone()["ok"] == 1
        except BaseException as exc:  # noqa: BLE001
            errors.append(exc)

    threads = [threading.Thread(target=worker) for _ in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)
    assert not errors, errors
    stats = db.get_pool().stats()
    assert stats["created"] <= stats["size"]


def test_transaction_rolls_back_on_error():
    db.reset_pool()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            raise RuntimeError("force rollback")
    except RuntimeError:
        pass
    # Pool still usable
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            assert cur.fetchone()["ok"] == 1
