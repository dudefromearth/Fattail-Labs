"""Hold-resident C11 watch — skip invalid, never raise into replay."""

from __future__ import annotations

from tm_hold_resident import record_hold_resident


def test_record_skips_zero_identity(monkeypatch) -> None:
    def _boom(*_a, **_k):
        raise AssertionError("must not touch db")

    monkeypatch.setattr("tm_hold_resident.db.transaction", _boom)
    record_hold_resident(
        0, day="2026-08-27", symbol="SPX", gen_count=1, heap_bytes=1, fidelity=1
    )


def test_record_skips_bad_day(monkeypatch) -> None:
    def _boom(*_a, **_k):
        raise AssertionError("must not touch db")

    monkeypatch.setattr("tm_hold_resident.db.transaction", _boom)
    record_hold_resident(
        1, day="nope", symbol="SPX", gen_count=1, heap_bytes=1, fidelity=1
    )


def test_record_swallows_db_error(monkeypatch) -> None:
    def _boom(*_a, **_k):
        raise RuntimeError("db down")

    monkeypatch.setattr("tm_hold_resident.db.transaction", _boom)
    record_hold_resident(
        1, day="2026-08-27", symbol="SPX", gen_count=10, heap_bytes=100, fidelity=1
    )
