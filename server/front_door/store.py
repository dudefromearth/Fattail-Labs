"""Evidence and analytics storage.

MemoryStore is the test double. MysqlStore writes the migration tables and
raises StoreError when the database is unreachable or the table is missing.
It does not invent a successful write.
"""

from __future__ import annotations

from typing import Any


class StoreError(RuntimeError):
    """The front-door tables could not be read or written."""


class MemoryStore:
    def __init__(self) -> None:
        self.evidence: list[dict[str, Any]] = []
        self.analytics: list[dict[str, Any]] = []

    def add_evidence(self, row: dict) -> None:
        self.evidence.append(dict(row))

    def evidence_for(self, order_key: str) -> list[dict]:
        return [dict(row) for row in self.evidence if row["order_key"] == order_key]

    def add_analytics(self, row: dict) -> None:
        self.analytics.append(dict(row))

    def analytics_rows(self) -> list[dict]:
        return [dict(row) for row in self.analytics]


class MysqlStore:
    """Lazy import of db so unit tests do not boot Labs config."""

    def add_evidence(self, row: dict) -> None:
        import json

        payload = json.dumps(row["payload"], sort_keys=True)
        self._write(
            """INSERT INTO front_door_evidence
               (order_key, woo_order_id, moment, payload_json, retain_until)
               VALUES (%s, %s, %s, %s, %s)""",
            (
                row["order_key"],
                row.get("woo_order_id"),
                row["moment"],
                payload,
                row["retain_until"],
            ),
        )

    def evidence_for(self, order_key: str) -> list[dict]:
        import json

        rows = self._read(
            """SELECT order_key, woo_order_id, moment, payload_json, retain_until, created_at
               FROM front_door_evidence WHERE order_key = %s ORDER BY id""",
            (order_key,),
        )
        out = []
        for row in rows:
            payload = row["payload_json"]
            if isinstance(payload, (str, bytes)):
                payload = json.loads(payload)
            out.append(
                {
                    "order_key": row["order_key"],
                    "woo_order_id": row["woo_order_id"],
                    "moment": row["moment"],
                    "payload": payload,
                    "retain_until": str(row["retain_until"]),
                    "created_at": str(row["created_at"]),
                }
            )
        return out

    def add_analytics(self, row: dict) -> None:
        self._write(
            """INSERT INTO front_door_analytics
               (visitor_key, event, entry_point, product_id, step)
               VALUES (%s, %s, %s, %s, %s)""",
            (
                row["visitor_key"],
                row["event"],
                row.get("entry"),
                row.get("product_id"),
                row.get("step"),
            ),
        )

    def analytics_rows(self) -> list[dict]:
        rows = self._read(
            """SELECT visitor_key, event, entry_point, product_id, step
               FROM front_door_analytics ORDER BY id""",
            (),
        )
        return [
            {
                "visitor_key": row["visitor_key"],
                "event": row["event"],
                "entry": row["entry_point"],
                "product_id": row["product_id"],
                "step": row["step"],
            }
            for row in rows
        ]

    def _write(self, sql: str, params: tuple) -> None:
        self._run(sql, params, fetch=False)

    def _read(self, sql: str, params: tuple) -> list[dict]:
        return self._run(sql, params, fetch=True)

    def _run(self, sql: str, params: tuple, *, fetch: bool):
        try:
            import db
        except Exception as exc:  # noqa: BLE001 — surface config/import failure
            raise StoreError("front-door store cannot import db") from exc
        try:
            with db.transaction() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    if fetch:
                        return list(cur.fetchall())
        except StoreError:
            raise
        except Exception as exc:  # noqa: BLE001 — missing table or down database
            raise StoreError(f"front-door store failed: {exc.__class__.__name__}") from exc
        return []
