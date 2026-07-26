"""Resource domain (R1) — versioning, publish, course pin invariants."""

from __future__ import annotations

import uuid

import pytest

import db
import resources_domain as rd


def _uid(prefix: str = "zzres") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


@pytest.fixture()
def probe_course():
    """Minimal draft course for link tests; cleaned up after."""
    slug = _uid("zzres-course")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO courses (slug, title, subtitle, description_md, level, status)
                   VALUES (%s, %s, '', 'probe', 'beginner', 'draft')""",
                (slug, f"ZZ Resource Probe {slug}"),
            )
            cid = int(cur.lastrowid)
    yield {"id": cid, "slug": slug}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM course_resource_links WHERE course_id = %s", (cid,)
            )
            cur.execute("DELETE FROM courses WHERE id = %s", (cid,))


def _cleanup_resource(resource_id: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM course_resource_links WHERE resource_id = %s",
                (resource_id,),
            )
            cur.execute(
                "UPDATE resources SET published_version_id = NULL WHERE id = %s",
                (resource_id,),
            )
            cur.execute(
                "DELETE FROM resource_versions WHERE resource_id = %s", (resource_id,)
            )
            cur.execute("DELETE FROM resources WHERE id = %s", (resource_id,))


def test_create_resource_default_unpublished():
    slug = _uid()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            out = rd.create_resource(
                cur,
                title="Trade Log Template",
                description_md="Sizing sheet",
                type="spreadsheet",
                category_slug="risk-sizing",
                kind="file",
                url="private:zz-trade-log.xlsx",
                slug=slug,
                publish=False,
            )
            rid = out["resource_id"]
            assert out["version"] == 1
            assert out["published"] is False
            assert out["slug"].startswith("zzres-") or out["slug"] == slug
            row = rd.get_by_slug(cur, out["slug"], published_only=True)
            assert row is None
            row2 = rd.get_by_slug(cur, out["slug"], published_only=False)
            assert row2 is not None
            assert row2["published_version_id"] is None
    _cleanup_resource(rid)


def test_add_version_monotonic_and_immutable_publish():
    """U3: new version not live until publish; only one published."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            out = rd.create_resource(
                cur,
                title="Process Infographic",
                type="image",
                kind="file",
                url="private:zz-process-v1.png",
                slug=_uid(),
                publish=True,
            )
            rid = out["resource_id"]
            v1 = out["version_id"]
            pub = rd.get_published_version(cur, rid)
            assert pub["version"] == 1
            assert pub["id"] == v1

            v2 = rd.add_version(
                cur,
                rid,
                kind="file",
                url="private:zz-process-v2.png",
                changelog_md="Updated steps",
                publish=False,
            )
            assert v2["version"] == 2
            pub2 = rd.get_published_version(cur, rid)
            assert pub2["version"] == 1  # still v1

            rd.publish_version(cur, rid, 2)
            pub3 = rd.get_published_version(cur, rid)
            assert pub3["version"] == 2
            assert pub3["url"] == "private:zz-process-v2.png"

            versions = rd.list_versions(cur, rid)
            assert [v["version"] for v in versions] == [1, 2]
    _cleanup_resource(rid)


def test_pin_independent_of_publish(probe_course):
    """U4: course pin stays on v1 after library publishes v2."""
    cid = probe_course["id"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            out = rd.create_resource(
                cur,
                title="Pinned Sheet",
                type="spreadsheet",
                kind="link",
                url="https://example.com/log-v1",
                slug=_uid(),
                publish=True,
            )
            rid = out["resource_id"]
            link = rd.attach_to_course(
                cur, course_id=cid, resource_id=rid, pinned_version=1
            )
            assert link["pinned_version"] == 1

            rd.add_version(
                cur,
                rid,
                kind="link",
                url="https://example.com/log-v2",
                publish=True,
            )
            pub = rd.get_published_version(cur, rid)
            assert pub["version"] == 2

            pinned = rd.get_pinned_for_course(
                cur, course_id=cid, resource_id=rid
            )
            assert pinned is not None
            assert pinned["version"] == 1
            assert pinned["url"] == "https://example.com/log-v1"
            # published head is v2
            assert pinned["published_version_id"] != pinned["version_id"]
    _cleanup_resource(rid)


def test_unpublish_hides_slug_keeps_pin(probe_course):
    cid = probe_course["id"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            out = rd.create_resource(
                cur,
                title="Hub then course-only",
                type="document",
                kind="file",
                url="private:zz-doc.pdf",
                slug=_uid(),
                publish=True,
            )
            rid = out["resource_id"]
            slug = out["slug"]
            rd.attach_to_course(cur, course_id=cid, resource_id=rid)
            rd.unpublish(cur, rid)
            assert rd.get_by_slug(cur, slug, published_only=True) is None
            pinned = rd.get_pinned_for_course(
                cur, course_id=cid, resource_id=rid
            )
            assert pinned is not None
            assert pinned["version"] == 1
    _cleanup_resource(rid)


def test_set_pin_and_unlink(probe_course):
    cid = probe_course["id"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            out = rd.create_resource(
                cur,
                title="Repin me",
                type="other",
                kind="link",
                url="https://example.com/a",
                slug=_uid(),
            )
            rid = out["resource_id"]
            rd.add_version(cur, rid, kind="link", url="https://example.com/b")
            rd.attach_to_course(
                cur, course_id=cid, resource_id=rid, pinned_version=1
            )
            rd.set_pin(cur, course_id=cid, resource_id=rid, version=2)
            pinned = rd.get_pinned_for_course(
                cur, course_id=cid, resource_id=rid
            )
            assert pinned["version"] == 2
            rd.unlink_from_course(cur, course_id=cid, resource_id=rid)
            assert (
                rd.get_pinned_for_course(cur, course_id=cid, resource_id=rid)
                is None
            )
    _cleanup_resource(rid)


def test_bad_type_and_pin_missing_version():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            with pytest.raises(rd.ResourceError) as ei:
                rd.create_resource(
                    cur,
                    title="x",
                    type="video",
                    kind="file",
                    url="private:x",
                )
            assert ei.value.code == "BAD_TYPE"

            out = rd.create_resource(
                cur,
                title="ok",
                type="link",
                kind="link",
                url="https://example.com/x",
                slug=_uid(),
            )
            rid = out["resource_id"]
            with pytest.raises(rd.ResourceError) as e2:
                rd.publish_version(cur, rid, 99)
            assert e2.value.code == "VERSION_NOT_FOUND"
    _cleanup_resource(rid)
