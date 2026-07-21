"""Filename-ordered SQL migration runner.

Applies migrations/NNN_*.sql in sort order, recording each by filename in
schema_migrations. Never edit an applied migration — create a new one.

Usage:
  python migrate.py             # apply pending
  python migrate.py --dry-run   # preview
"""

import sys
from pathlib import Path

import db

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"

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
    statements = [s.strip() for s in path.read_text().split(";") if s.strip()]
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
