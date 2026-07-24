"""Characterization test suite (Test Suite spec v1.0).

Runs against the DEV database via the FastAPI TestClient — no running server
needed. Tests create their own probe rows (zztest-* names / probe identities)
and clean up after themselves; seeded standing content (published courses, the
four standing live recurrences, plans) is treated as a read-only fixture.

Run:  cd server && .venv/bin/python -m pytest tests -q
"""

import os
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parent
sys.path.insert(0, str(SERVER_DIR))


def _load_env() -> None:
    env_file = REPO_ROOT / ".env"
    if not env_file.is_file():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env()

# Never hit live SMTP during characterization (Hostinger creds may be in .env).
os.environ.pop("LABS_SMTP_HOST", None)
os.environ.pop("LABS_NOTIFY_EMAIL_REQUIRED", None)

# Prefer dry-run HeyGen when tests omit dry_run (still pass dry_run=True explicitly).
os.environ.setdefault("LABS_HEYGEN_DRY_RUN", "1")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import auth  # noqa: E402
import db  # noqa: E402
from config import get_config  # noqa: E402
from main import app  # noqa: E402

COOKIE = get_config().session_cookie


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def cookie_for(role: str, identity_id: int = 0) -> dict:
    """A session cookie for a minted role (identity_id 0 = internal admin)."""
    token = auth.issue_session(identity_id=identity_id, issuer="internal", role=role)
    return {COOKIE: token}


@pytest.fixture(scope="session")
def admin_cookies() -> dict:
    return cookie_for("administrator")


@pytest.fixture()
def probe_identity():
    """A real identity row (FK-safe for enrollments/progress/attempts).
    Everything the tests may attach to it is deleted afterwards."""
    import identity as identity_mod

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-probe@labs.test", "ZZ Test Probe"
            )
    yield iid
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for sql in (
                "DELETE FROM lesson_progress WHERE identity_id = %s",
                "DELETE FROM quiz_attempts WHERE identity_id = %s",
                "DELETE FROM enrollments WHERE identity_id = %s",
                "DELETE FROM memberships WHERE identity_id = %s",
                "DELETE FROM identity_links WHERE identity_id = %s",
                "DELETE FROM credentials WHERE identity_id = %s",
                "DELETE FROM identities WHERE identity_id = %s",
            ):
                cur.execute(sql, (iid,))
