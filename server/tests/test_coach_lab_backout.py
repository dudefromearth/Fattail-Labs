"""RB-01 — coach-lab backout tripwire. Routes and incident schema must stay gone."""

from __future__ import annotations

import db
from main import app


def _collect_paths(obj, out: list[str]) -> None:
    path = getattr(obj, "path", None)
    if isinstance(path, str) and path:
        out.append(path)
    orig = getattr(obj, "original_router", None)
    if orig is not None and orig is not obj:
        _collect_paths(orig, out)
    for child in getattr(obj, "routes", None) or []:
        _collect_paths(child, out)


def registered_paths() -> list[str]:
    paths: list[str] = []
    _collect_paths(app.router, paths)
    paths.extend(app.openapi().get("paths", {}).keys())
    return paths


def test_coach_lab_routes_are_not_registered():
    offenders = sorted(
        {
            p
            for p in registered_paths()
            if "coach-lab" in p.lower() or "coach_lab" in p.lower()
        }
    )
    assert offenders == [], f"coach-lab routes must stay gone: {offenders}"


def test_coach_lab_http_is_not_found(client):
    """Registered or not: these paths must 404. Auth 401/403 would mean the route exists."""
    for path in (
        "/api/admin/coach-lab/config",
        "/api/admin/coach-lab",
        "/api/admin/coach-lab/conversations",
    ):
        r = client.get(path)
        assert r.status_code == 404, f"{path} -> {r.status_code} {r.text[:200]}"


def test_coach_lab_tables_absent():
    conn = db.connect()
    try:
        with conn.cursor() as cur:
            cur.execute("SHOW TABLES LIKE 'coach_lab%'")
            rows = cur.fetchall()
    finally:
        conn.close()
    assert not rows, f"incident tables must stay dropped: {rows}"


def test_schema_migrations_has_no_128_coach_lab():
    conn = db.connect()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT filename FROM schema_migrations WHERE filename = %s",
                ("128_coach_lab.sql",),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    assert row is None, f"128 tracking row must stay deleted: {row}"
