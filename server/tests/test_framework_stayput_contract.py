"""Application Framework W1 — stay-put contract (characterization).

Family A edit success paths must not rely on document reload. This suite
locks the API side of structure ops (create module/lesson) and a static
source-scan of critical web edit hosts for `location.reload`.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
WEB = REPO / "web"

# Production edit hosts that must never reload on success (Framework A4 / AF1–AF6).
_STAYPUT_GLOBS = [
    "components/edit/EditContext.tsx",
    "components/CourseTabs.tsx",
    "components/hub/HubEditContext.tsx",
    "components/CatalogGrid.tsx",
    "components/QuizBuilder.tsx",
    "components/LessonBody.tsx",
    "components/live/EventEditor.tsx",
]

_RELOAD = re.compile(r"location\s*\.\s*reload\s*\(")


def test_family_a_edit_hosts_have_no_location_reload():
    missing = []
    offenders = []
    for rel in _STAYPUT_GLOBS:
        path = WEB / rel
        if not path.is_file():
            missing.append(rel)
            continue
        text = path.read_text(encoding="utf-8")
        if _RELOAD.search(text):
            offenders.append(rel)
    assert not missing, f"missing edit hosts: {missing}"
    assert not offenders, (
        "location.reload() forbidden on Family A edit success hosts "
        f"(Application Framework A4): {offenders}"
    )


def test_edit_context_structure_op_does_not_reload_and_pins_tab():
    path = WEB / "components/edit/EditContext.tsx"
    text = path.read_text(encoding="utf-8")
    assert "window.location.reload" not in text
    assert "location.reload" not in text
    assert "setCourseTab(pinnedTab)" in text or "setCourseTab(pinnedTab)" in text.replace(
        " ", ""
    )
    assert "pinnedTab" in text
    assert "refreshAdmin" in text
    assert "lockScroll" in text or "scrollLock" in text


def test_course_tabs_uses_provider_tab_not_local_default_only():
    path = WEB / "components/CourseTabs.tsx"
    text = path.read_text(encoding="utf-8")
    assert "courseTab" in text
    assert "setCourseTab" in text
    # Must not reintroduce local useState defaulting tab without provider
    assert "edit?.courseTab" in text or "edit.courseTab" in text


def test_admin_structure_apis_support_in_place_graph(client, admin_cookies):
    """Structure mutations return JSON without requiring a page reload."""
    r = client.get("/api/courses")
    if r.status_code != 200:
        pytest.skip("public catalog unavailable in this env")
    courses = r.json()
    if isinstance(courses, dict):
        items = courses.get("courses") or courses.get("items") or []
    else:
        items = courses
    if not items:
        pytest.skip("no published courses to attach modules")
    slug = items[0]["slug"] if isinstance(items[0], dict) else None
    if not slug:
        pytest.skip("course slug missing")

    detail = client.get(f"/api/admin/courses/{slug}", cookies=admin_cookies)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert "modules" in body
    # In-place create returns ids (client patches graph without reload)
    create = client.post(
        f"/api/admin/courses/{slug}/modules",
        cookies=admin_cookies,
        json={"title": "zztest-stayput-module"},
    )
    assert create.status_code in (200, 201), create.text
    mid = create.json().get("module_id")
    assert mid is not None
    # Cleanup probe module
    client.delete(f"/api/admin/modules/{mid}", cookies=admin_cookies)
