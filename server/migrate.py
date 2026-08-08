"""Filename-ordered SQL migration runner.

Applies migrations/NNN_*.sql in sort order, recording each by filename in
schema_migrations. Never edit an applied migration — create a new one.

Usage (from server/, with repo .env loaded — this script also loads it):
  .venv/bin/python migrate.py             # apply pending
  .venv/bin/python migrate.py --dry-run   # preview

On MiniTwo/production the process environment must satisfy Config (including
LABS_ADMIN_EMAILS outside dev). Prefer:

  set -a && source /Users/ernie/Fattail-Labs/.env && set +a
  cd server && .venv/bin/python migrate.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Load repo-root .env before config/db (same pattern as tests/conftest).
# Does not override vars already set in the shell.
_REPO_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _REPO_ROOT / ".env"


def _load_env() -> None:
    if not _ENV_FILE.is_file():
        return
    for line in _ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


_load_env()

import db  # noqa: E402

MIGRATIONS_DIR = _REPO_ROOT / "migrations"

TRACKING_TABLE = """
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""


def pending(conn) -> list[Path]:
    with conn.cursor() as cur:
        cur.execute(TRACKING_TABLE)
        cur.execute("SELECT filename FROM schema_migrations")
        applied = {row["filename"] for row in cur.fetchall()}
    conn.commit()
    files = sorted(MIGRATIONS_DIR.glob("[0-9][0-9][0-9]_*.sql"))
    if not files:
        raise SystemExit(f"No migrations found in {MIGRATIONS_DIR}")
    return [f for f in files if f.name not in applied]


def apply(conn, path: Path) -> None:
    # Strip full-line comments BEFORE splitting on ';' — semicolons inside
    # comments must not truncate statements.
    sql = "\n".join(
        line for line in path.read_text().splitlines()
        if not line.lstrip().startswith("--")
    )
    statements = [s.strip() for s in sql.split(";") if s.strip()]
    with conn.cursor() as cur:
        for statement in statements:
            cur.execute(statement)
        cur.execute("INSERT INTO schema_migrations (filename) VALUES (%s)", (path.name,))
    conn.commit()


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    conn = db.connect()
    try:
        todo = pending(conn)
        if not todo:
            print("No pending migrations.")
            return
        for path in todo:
            if dry_run:
                print(f"would apply: {path.name}")
            else:
                apply(conn, path)
                print(f"applied: {path.name}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
