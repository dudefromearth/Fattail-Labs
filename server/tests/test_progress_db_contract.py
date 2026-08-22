"""Progress DB access — honours the pooled-connection contract.

db.transaction() yields a CONNECTION, not a cursor. Getting that wrong fails
only at runtime against a real database, which is exactly how it reached
production once. These tests pin the contract with a fake connection: any
module that treats the yielded object as a cursor raises AttributeError here.
"""

from __future__ import annotations

import datetime as dt
from contextlib import contextmanager

import pytest

import db
from progress import refresh as R
from progress import report as RP


class FakeCursor:
    def __init__(self, rows): self._rows, self.executed = rows, []
    def execute(self, sql, params=None): self.executed.append((sql, params))
    def fetchone(self): return self._rows[0] if self._rows else None
    def fetchall(self): return list(self._rows)
    @property
    def rowcount(self): return len(self._rows)
    def __enter__(self): return self
    def __exit__(self, *a): return False


class FakeConn:
    """Deliberately has NO .execute — mimicking the real pooled connection."""
    def __init__(self, rows=()): self.cur = FakeCursor(list(rows))
    def cursor(self): return self.cur


@pytest.fixture
def fake_db(monkeypatch):
    holder = {}

    def install(rows=()):
        conn = FakeConn(rows)
        holder["conn"] = conn

        @contextmanager
        def fake_transaction():
            yield conn

        monkeypatch.setattr(db, "transaction", fake_transaction)
        return conn

    holder["install"] = install
    return holder


class TestRefreshUsesCursor:
    def test_snapshot_insert_goes_through_a_cursor(self, fake_db, monkeypatch):
        conn = fake_db["install"]()
        monkeypatch.setitem(R.SOURCES, "woocommerce",
                            lambda months, now: {"counts": {"subscriptions": 3}})
        out = R.refresh_source("woocommerce", now=dt.datetime(2026, 8, 22))
        assert out["status"] == "ok"
        assert conn.cur.executed and "INSERT INTO progress_snapshot" in conn.cur.executed[0][0]

    def test_source_failure_is_recorded_not_raised(self, fake_db, monkeypatch):
        conn = fake_db["install"]()

        def boom(months, now):
            raise RuntimeError("token rejected")

        monkeypatch.setitem(R.SOURCES, "youtube", boom)
        out = R.refresh_source("youtube", now=dt.datetime(2026, 8, 22))
        assert out["status"] == "failed"
        assert "token rejected" in out["error"]
        # The failure still lands in the table — that is how the page shows it.
        assert conn.cur.executed

    def test_unknown_source_is_a_programming_error(self, fake_db):
        fake_db["install"]()
        with pytest.raises(ValueError):
            R.refresh_source("myspace")

    def test_prune_uses_a_cursor(self, fake_db):
        fake_db["install"]([{"id": 1}])
        assert R.prune(keep_days=30) == 1

    def test_latest_decodes_a_json_payload_string(self, fake_db):
        fake_db["install"]([{"captured_at": dt.datetime(2026, 8, 22),
                             "payload": '{"counts": {"subscriptions": 7}}'}])
        got = R.latest("woocommerce")
        assert got["payload"]["counts"]["subscriptions"] == 7


class TestReportUsesCursor:
    def test_load_params_goes_through_a_cursor(self, fake_db):
        fake_db["install"]([{
            "param_key": "monthly_revenue_target", "param_value": 30000,
            "unit": "usd", "label": "Target", "hint": "h",
            "min_value": 0, "max_value": 1e6, "sort_order": 10,
            "updated_at": dt.datetime(2026, 8, 22), "updated_by": None,
        }])
        params = RP.load_params()
        assert params["monthly_revenue_target"]["param_value"] == 30000.0

    def test_out_of_range_value_is_rejected_before_write(self, fake_db):
        conn = fake_db["install"]([{
            "param_key": "activator_monthly_churn", "param_value": 0.067,
            "unit": "rate", "label": "Churn", "hint": "h",
            "min_value": 0.001, "max_value": 1, "sort_order": 20,
            "updated_at": dt.datetime(2026, 8, 22), "updated_by": None,
        }])
        with pytest.raises(ValueError):
            RP.set_param("activator_monthly_churn", 5.0, "admin@fattail.ai")
        assert not any("UPDATE" in sql for sql, _ in conn.cur.executed)

    def test_unknown_param_raises_keyerror(self, fake_db):
        fake_db["install"]([])
        with pytest.raises(KeyError):
            RP.set_param("not_a_param", 1.0, None)
