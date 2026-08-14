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


class LabsTestClient(TestClient):
    """Accept cookies= without httpx's per-request deprecation.

    Isolation: an explicit cookies= jar replaces the client cookies for that
    request only, then is cleared so member A cannot leak into the next call.
    Requests without cookies= keep the jar (SSO Set-Cookie flows).
    """

    def request(self, method, url, **kwargs):  # type: ignore[override]
        cookies = kwargs.pop("cookies", None)
        if cookies is not None:
            self.cookies.clear()
            self.cookies.update(cookies)
        try:
            return super().request(method, url, **kwargs)
        finally:
            if cookies is not None:
                self.cookies.clear()


@pytest.fixture(scope="session")
def client():
    # M6: cookie mutations require Origin/Referer; TestClient is same-site as app.
    with LabsTestClient(app) as c:
        c.headers.update({"Origin": "http://testserver"})
        yield c


def cookie_for(role: str, identity_id: int = 0) -> dict:
    """A session cookie for a minted role (identity_id 0 = internal admin)."""
    token = auth.issue_session(identity_id=identity_id, issuer="internal", role=role)
    return {COOKIE: token}


@pytest.fixture(scope="session")
def admin_cookies() -> dict:
    return cookie_for("administrator")


def _new_probe_course(client, admin_cookies, title: str) -> str:
    r = client.post(
        "/api/admin/courses",
        json={"title": title},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    return r.json()["slug"]


def _add_probe_module(client, admin_cookies, slug: str) -> int:
    r = client.post(
        f"/api/admin/courses/{slug}/modules",
        json={"title": "Probe module"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    return int(r.json()["module_id"])


def _add_probe_lesson(
    client,
    admin_cookies,
    module_id: int,
    *,
    title: str,
    free_preview: bool = False,
    kind: str = "text",
    duration_seconds: int = 0,
    video_id: str | None = None,
) -> dict:
    created = client.post(
        f"/api/admin/modules/{module_id}/lessons",
        json={},
        cookies=admin_cookies,
    )
    assert created.status_code == 200, created.text
    lid = created.json()["id"]
    body = {
        "title": title,
        "free_preview": free_preview,
        "kind": kind,
        "duration_seconds": duration_seconds,
    }
    if video_id:
        body["video_provider"] = "youtube"
        body["video_id"] = video_id
    up = client.put(
        f"/api/admin/lessons/{lid}",
        json=body,
        cookies=admin_cookies,
    )
    assert up.status_code == 200, up.text
    return {"id": lid, "slug": up.json()["slug"], "module_slug": up.json()["module_slug"]}


def publish_probe_course(client, admin_cookies, slug: str) -> None:
    r = client.put(
        f"/api/admin/courses/{slug}",
        json={"status": "published"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text


def delete_probe_course(client, admin_cookies, slug: str) -> None:
    client.delete(f"/api/admin/courses/{slug}", cookies=admin_cookies)


@pytest.fixture()
def draft_probe_course(client, admin_cookies):
    """Own draft course — do not depend on a seeded workshop slug."""
    import uuid

    slug = _new_probe_course(
        client, admin_cookies, f"ZZ Draft Probe {uuid.uuid4().hex[:8]}"
    )
    yield slug
    delete_probe_course(client, admin_cookies, slug)


@pytest.fixture()
def published_access_course(client, admin_cookies):
    """Own published course: one free preview + one gated lesson."""
    import uuid

    slug = _new_probe_course(
        client, admin_cookies, f"ZZ Access Probe {uuid.uuid4().hex[:8]}"
    )
    mid = _add_probe_module(client, admin_cookies, slug)
    free = _add_probe_lesson(
        client,
        admin_cookies,
        mid,
        title="Free Preview",
        free_preview=True,
        kind="video",
        duration_seconds=180,
        video_id="aqz-KE-bpKQ",
    )
    gated = _add_probe_lesson(
        client, admin_cookies, mid, title="Gated Lesson", free_preview=False
    )
    publish_probe_course(client, admin_cookies, slug)
    yield {"slug": slug, "free": free, "gated": gated}
    delete_probe_course(client, admin_cookies, slug)


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
