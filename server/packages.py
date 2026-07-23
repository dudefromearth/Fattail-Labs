"""Production packages (Phase C) and Labs placement apply (Phase D start).

Spec: FatTail-Labs-Production-Package-Spec-v1.0.md
"""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any

import agent_auth
import db
from agent_auth import Actor

REQUIRED_STAGES: dict[str, tuple[str, ...]] = {
    "course": (
        "research_pack",
        "lesson_plan",
        "script",
        "video_package",
        "placement_proposal",
        "vision_alignment",
    ),
    "youtube_long": (
        "research_pack",
        "script",
        "video_package",
        "placement_proposal",
        "vision_alignment",
    ),
    "coaching_short": (
        "research_pack",
        "script",
        "video_package",
        "vision_alignment",
    ),
    "thematic_short": (
        "research_pack",
        "script",
        "video_package",
        "vision_alignment",
    ),
    "other": ("research_pack", "vision_alignment"),
}

# AI task → package stage
TASK_STAGE_MAP: dict[tuple[str, str], str] = {
    ("bravo", "research_pack"): "research_pack",
    ("november", "lesson_plan"): "lesson_plan",
    ("romeo", "lesson_script"): "script",
    ("romeo", "coaching_short_script"): "script",
    ("papa", "placement_proposal"): "placement_proposal",
    ("hotel", "accuracy_review"): "guardian_review",
    ("quebec", "seed_from_backlog"): "vision_alignment",
    ("quebec", "approval_package_checklist"): "vision_alignment",
    ("tango", "member_experience_review"): "guardian_review",
    ("victor", "lineage_review"): "guardian_review",
    ("whiskey", "lineage_review"): "guardian_review",
    ("yankee", "lineage_review"): "guardian_review",
}


class PackageError(Exception):
    pass


def _sha256(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def stage_for_task(callsign: str, task_id: str) -> str:
    key = (callsign.strip().lower(), task_id.strip())
    return TASK_STAGE_MAP.get(key, f"{key[0]}_{key[1]}")


def required_stages(product_line: str) -> tuple[str, ...]:
    return REQUIRED_STAGES.get(product_line, REQUIRED_STAGES["other"])


def _artifacts_by_stage(item_id: int) -> dict[str, list[dict]]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, stage, title, body_md, url, ai_invocation_id, content_hash,
                          actor_label, created_at
                   FROM content_artifacts WHERE item_id = %s ORDER BY id ASC""",
                (item_id,),
            )
            rows = cur.fetchall()
    by: dict[str, list[dict]] = {}
    for r in rows:
        by.setdefault(r["stage"], []).append(
            {
                "id": r["id"],
                "stage": r["stage"],
                "title": r["title"],
                "body_md": r["body_md"],
                "url": r["url"],
                "ai_invocation_id": r["ai_invocation_id"],
                "content_hash": r["content_hash"],
                "actor_label": r["actor_label"],
            }
        )
    return by


def package_checklist(item_id: int) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, product_line, title, latest_package_id, placed_course_slug "
                "FROM content_items WHERE id = %s",
                (item_id,),
            )
            item = cur.fetchone()
            if not item:
                raise PackageError("item not found")
            cur.execute(
                """SELECT COUNT(*) AS c FROM content_flags
                   WHERE item_id = %s AND status = 'open' AND severity = 'block'""",
                (item_id,),
            )
            open_blocks = int(cur.fetchone()["c"])
    by = _artifacts_by_stage(item_id)
    required = required_stages(item["product_line"])
    stages = []
    missing = []
    satisfied = {}
    for stage in required:
        arts = by.get(stage) or []
        ok = len(arts) > 0
        if not ok:
            missing.append(stage)
        else:
            satisfied[stage] = arts[-1]["id"]
        stages.append(
            {
                "stage": stage,
                "required": True,
                "complete": ok,
                "artifact_id": arts[-1]["id"] if arts else None,
                "artifact_title": arts[-1]["title"] if arts else None,
            }
        )
    # optional extras present
    for stage, arts in by.items():
        if stage not in required:
            stages.append(
                {
                    "stage": stage,
                    "required": False,
                    "complete": True,
                    "artifact_id": arts[-1]["id"],
                    "artifact_title": arts[-1]["title"],
                }
            )
    complete = not missing and open_blocks == 0
    return {
        "item_id": item_id,
        "product_line": item["product_line"],
        "title": item["title"],
        "complete": complete,
        "missing_stages": missing,
        "open_block_flags": open_blocks,
        "stages": stages,
        "satisfied": satisfied,
        "latest_package_id": item.get("latest_package_id"),
        "placed_course_slug": item.get("placed_course_slug"),
    }


def validate_for_approval(item_id: int) -> dict:
    checklist = package_checklist(item_id)
    if checklist["open_block_flags"] > 0:
        raise PackageError(
            "cannot submit for approval while block guardian flags are open"
        )
    if checklist["missing_stages"]:
        raise PackageError(
            "package incomplete; missing stages: "
            + ", ".join(checklist["missing_stages"])
        )
    return checklist


def freeze_package(item_id: int, actor: Actor) -> dict:
    checklist = validate_for_approval(item_id)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT body_md FROM content_vision WHERE id = 1")
            vision = cur.fetchone()
            vision_hash = _sha256(vision["body_md"] if vision else "")
            artifact_ids = list(checklist["satisfied"].values())
            cur.execute(
                """INSERT INTO content_approval_packages
                   (item_id, status, vision_hash, checklist_json, artifact_ids_json,
                    created_actor_kind, created_actor_id, created_actor_label)
                   VALUES (%s,'pending',%s,%s,%s,%s,%s,%s)""",
                (
                    item_id,
                    vision_hash,
                    json.dumps(checklist["satisfied"]),
                    json.dumps(artifact_ids),
                    actor.kind,
                    actor.id,
                    actor.label,
                ),
            )
            pkg_id = cur.lastrowid
            cur.execute(
                "UPDATE content_items SET latest_package_id = %s WHERE id = %s",
                (pkg_id, item_id),
            )
    agent_auth.record_event(
        actor,
        "package.freeze",
        resource=str(item_id),
        detail={"package_id": pkg_id},
    )
    return get_package(pkg_id)


def get_package(package_id: int) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM content_approval_packages WHERE id = %s",
                (package_id,),
            )
            row = cur.fetchone()
    if not row:
        raise PackageError("package not found")
    return _pkg_row(row)


def latest_package_for_item(item_id: int) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT latest_package_id FROM content_items WHERE id = %s",
                (item_id,),
            )
            item = cur.fetchone()
            if not item or not item.get("latest_package_id"):
                return None
            cur.execute(
                "SELECT * FROM content_approval_packages WHERE id = %s",
                (item["latest_package_id"],),
            )
            row = cur.fetchone()
    return _pkg_row(row) if row else None


def decide_package(
    item_id: int, actor: Actor, *, decision: str, placement: dict | None = None
) -> None:
    """Mark latest package approved|rejected."""
    if decision not in ("approved", "rejected"):
        raise PackageError("decision must be approved|rejected")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT latest_package_id FROM content_items WHERE id = %s",
                (item_id,),
            )
            item = cur.fetchone()
            if not item or not item.get("latest_package_id"):
                return
            pkg_id = item["latest_package_id"]
            cur.execute(
                """UPDATE content_approval_packages SET
                     status = %s,
                     decided_actor_kind = %s,
                     decided_actor_id = %s,
                     decided_actor_label = %s,
                     decided_at = CURRENT_TIMESTAMP,
                     placement_result_json = COALESCE(%s, placement_result_json)
                   WHERE id = %s AND status = 'pending'""",
                (
                    decision,
                    actor.kind,
                    actor.id,
                    actor.label,
                    json.dumps(placement) if placement is not None else None,
                    pkg_id,
                ),
            )


def record_ai_invocation(
    actor: Actor,
    *,
    callsign: str,
    task_id: str,
    provider: str,
    model: str,
    prefer: str | None,
    markers: list[str],
    usage: dict,
    status: str = "success",
    error: str | None = None,
    content_item_id: int | None = None,
) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if content_item_id is not None:
                cur.execute(
                    "SELECT id FROM content_items WHERE id = %s", (content_item_id,)
                )
                if not cur.fetchone():
                    raise PackageError("content_item_id not found")
            cur.execute(
                """INSERT INTO ai_invocations
                   (content_item_id, callsign, task_id, provider, model, prefer,
                    markers_json, usage_json, status, error,
                    actor_kind, actor_id, actor_label)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    content_item_id,
                    callsign[:64],
                    task_id[:64],
                    provider[:32],
                    model[:128],
                    prefer,
                    json.dumps(list(markers or [])),
                    json.dumps(usage or {}),
                    status,
                    error,
                    actor.kind,
                    actor.id,
                    actor.label,
                ),
            )
            return int(cur.lastrowid)


def attach_ai_result_to_item(
    actor: Actor,
    *,
    content_item_id: int,
    callsign: str,
    task_id: str,
    text: str,
    provider: str,
    model: str,
    prefer: str | None,
    markers: list[str],
    usage: dict,
) -> dict:
    """Record invocation + artifact for the mapped stage."""
    inv_id = record_ai_invocation(
        actor,
        callsign=callsign,
        task_id=task_id,
        provider=provider,
        model=model,
        prefer=prefer,
        markers=markers,
        usage=usage,
        content_item_id=content_item_id,
    )
    stage = stage_for_task(callsign, task_id)
    body = text or ""
    chash = _sha256(body)
    title = f"{callsign}/{task_id} ({provider}/{model})"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO content_artifacts
                   (item_id, stage, title, body_md, url, ai_invocation_id, content_hash,
                    actor_kind, actor_id, actor_label)
                   VALUES (%s,%s,%s,%s,NULL,%s,%s,%s,%s,%s)""",
                (
                    content_item_id,
                    stage[:64],
                    title[:512],
                    body,
                    inv_id,
                    chash,
                    actor.kind,
                    actor.id,
                    actor.label,
                ),
            )
            art_id = cur.lastrowid
    agent_auth.record_event(
        actor,
        "package.artifact.ai",
        resource=str(content_item_id),
        detail={"stage": stage, "invocation_id": inv_id, "artifact_id": art_id},
    )
    return {
        "invocation_id": inv_id,
        "artifact_id": art_id,
        "stage": stage,
        "checklist": package_checklist(content_item_id),
    }


def ensure_stub_artifacts_for_tests(item_id: int, actor: Actor, product_line: str) -> None:
    """Test helper — not used in production paths."""
    for stage in required_stages(product_line):
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO content_artifacts
                       (item_id, stage, title, body_md, actor_kind, actor_id, actor_label, content_hash)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        item_id,
                        stage,
                        f"stub {stage}",
                        f"## {stage}\nstub content",
                        actor.kind,
                        actor.id,
                        actor.label,
                        _sha256(stage),
                    ),
                )


# --- Phase D placement --------------------------------------------------------


def _slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s or "course"


def apply_placement(item_id: int, actor: Actor) -> dict:
    """Create a draft Labs course from the card + placement_proposal/script.

    Idempotent if placed_course_slug already set.
    """
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM content_items WHERE id = %s", (item_id,))
            item = cur.fetchone()
            if not item:
                raise PackageError("item not found")
            if item.get("placed_course_slug"):
                return {
                    "already_placed": True,
                    "slug": item["placed_course_slug"],
                }

            cur.execute(
                """SELECT body_md, title FROM content_artifacts
                   WHERE item_id = %s AND stage = 'placement_proposal'
                   ORDER BY id DESC LIMIT 1""",
                (item_id,),
            )
            placement_art = cur.fetchone()
            cur.execute(
                """SELECT body_md FROM content_artifacts
                   WHERE item_id = %s AND stage = 'script'
                   ORDER BY id DESC LIMIT 1""",
                (item_id,),
            )
            script_art = cur.fetchone()

            title = item["title"]
            description = item.get("intent_md") or ""
            if placement_art and placement_art.get("body_md"):
                # Prefer first markdown heading or JSON title
                body = placement_art["body_md"]
                try:
                    data = json.loads(body)
                    if isinstance(data, dict):
                        title = data.get("course_title") or title
                        description = data.get("description_md") or description
                except json.JSONDecodeError:
                    pass

            base = _slugify(title)
            cur.execute("SELECT slug FROM courses")
            taken = {r["slug"] for r in cur.fetchall()}
            slug = base
            n = 2
            while slug in taken:
                slug = f"{base}-{n}"
                n += 1

            lesson_body = (script_art or {}).get("body_md") or description
            cur.execute(
                """INSERT INTO courses
                   (slug, title, subtitle, description_md, level, status)
                   VALUES (%s, %s, '', %s, 'beginner', 'draft')""",
                (slug, title, description),
            )
            course_id = cur.lastrowid
            cur.execute(
                """INSERT INTO modules (course_id, title, sort_order, kind)
                   VALUES (%s, 'Module 1', 0, 'standard')""",
                (course_id,),
            )
            module_id = cur.lastrowid
            cur.execute(
                """INSERT INTO lessons
                   (module_id, slug, title, sort_order, kind, body_md, free_preview)
                   VALUES (%s, 'lesson-1', %s, 0, 'video', %s, 0)""",
                (module_id, title[:512], lesson_body),
            )
            lesson_id = cur.lastrowid
            cur.execute(
                "UPDATE content_items SET placed_course_slug = %s WHERE id = %s",
                (slug, item_id),
            )

    result = {
        "already_placed": False,
        "slug": slug,
        "course_id": course_id,
        "module_id": module_id,
        "lesson_id": lesson_id,
        "status": "draft",
        "admin_url": f"/courses/{slug}",
    }
    agent_auth.record_event(
        actor,
        "package.placement.apply",
        resource=str(item_id),
        detail=result,
    )
    return result


def package_detail(item_id: int) -> dict:
    checklist = package_checklist(item_id)
    latest = latest_package_for_item(item_id)
    return {"checklist": checklist, "latest_package": latest}


def _pkg_row(row: dict) -> dict:
    def _ts(v):
        if v is None:
            return None
        return v.isoformat(sep=" ") if hasattr(v, "isoformat") else v

    def _j(v):
        if v is None:
            return None
        if isinstance(v, (dict, list)):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return v
        return v

    return {
        "id": row["id"],
        "item_id": row["item_id"],
        "status": row["status"],
        "vision_hash": row["vision_hash"],
        "checklist": _j(row["checklist_json"]),
        "artifact_ids": _j(row["artifact_ids_json"]),
        "placement_result": _j(row.get("placement_result_json")),
        "created_actor_label": row["created_actor_label"],
        "decided_actor_label": row.get("decided_actor_label"),
        "decided_at": _ts(row.get("decided_at")),
        "created_at": _ts(row.get("created_at")),
    }
