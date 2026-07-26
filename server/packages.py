"""Production packages (Phase C) and Labs placement apply (Phase D start).

Spec: FatTail-Labs-Production-Package-Spec-v1.0.md
"""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any

import agent_auth
import course_model
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
    """Test helper — not used in production paths.

    Uses a multi-module placement_proposal JSON when product_line is course so
    Phase D placement tests exercise the full graph.
    """
    for stage in required_stages(product_line):
        if stage == "placement_proposal" and product_line == "course":
            body = json.dumps(
                {
                    "course_title": "ZZ Placed Multi-Module Course",
                    "subtitle": "Defined risk first",
                    "description_md": "Course placed from package.",
                    "level": "beginner",
                    "trailer_video_id": "dQw4w9WgXcQ",
                    "modules": [
                        {
                            "title": "Foundations",
                            "kind": "standard",
                            "lessons": [
                                {
                                    "title": "Name max loss",
                                    "slug": "name-max-loss",
                                    "video_id": "aqz-KE-bpKQ",
                                    "body_md": "Lesson notes: define debit risk.",
                                    "free_preview": True,
                                    "duration_seconds": 180,
                                },
                                {
                                    "title": "Worked butterfly",
                                    "slug": "worked-butterfly",
                                    "video_id": "aqz-KE-bpKQ",
                                    "body_md": "Worked example notes.",
                                    "free_preview": False,
                                },
                            ],
                        },
                        {
                            "title": "Practice",
                            "kind": "worksheets",
                            "lessons": [
                                {
                                    "title": "Checklist drill",
                                    "slug": "checklist-drill",
                                    "kind": "text",
                                    "body_md": "Complete the pre-trade checklist.",
                                }
                            ],
                        },
                    ],
                    "resources": [
                        {
                            "title": "Max-loss worksheet",
                            "kind": "link",
                            "url": "https://example.com/max-loss.pdf",
                            "free_preview": True,
                            "emoji": "📊",
                            "description_md": "Fill before entry.",
                        }
                    ],
                }
            )
        elif stage == "video_package":
            body = json.dumps(
                {
                    "videos": {
                        "name-max-loss": "aqz-KE-bpKQ",
                        "worked-butterfly": "aqz-KE-bpKQ",
                    },
                    "provider": "youtube",
                }
            )
        else:
            body = f"## {stage}\nstub content for {stage}"
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
                        body,
                        actor.kind,
                        actor.id,
                        actor.label,
                        _sha256(body),
                    ),
                )


# --- Phase D placement --------------------------------------------------------


def _slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s or "course"


def _parse_json_artifact(body: str | None) -> dict | None:
    if not body or not str(body).strip():
        return None
    text = str(body).strip()
    # Allow fenced ```json blocks
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _latest_artifact(cur, item_id: int, stage: str) -> dict | None:
    cur.execute(
        """SELECT body_md, title FROM content_artifacts
           WHERE item_id = %s AND stage = %s
           ORDER BY id DESC LIMIT 1""",
        (item_id, stage),
    )
    return cur.fetchone()


def build_placement_plan(item: dict, artifacts: dict[str, dict | None]) -> dict:
    """Normalize placement plan from placement_proposal / lesson_plan / fallbacks."""
    title = item["title"]
    description = item.get("intent_md") or ""
    subtitle = ""
    level = "beginner"
    trailer_video_id = None
    modules: list[dict] = []
    resources: list[dict] = []

    placement = _parse_json_artifact(
        (artifacts.get("placement_proposal") or {}).get("body_md")
        if artifacts.get("placement_proposal")
        else None
    )
    lesson_plan = _parse_json_artifact(
        (artifacts.get("lesson_plan") or {}).get("body_md")
        if artifacts.get("lesson_plan")
        else None
    )
    video_pkg = _parse_json_artifact(
        (artifacts.get("video_package") or {}).get("body_md")
        if artifacts.get("video_package")
        else None
    )
    script_body = (
        (artifacts.get("script") or {}).get("body_md")
        if artifacts.get("script")
        else None
    )

    if placement:
        title = placement.get("course_title") or placement.get("title") or title
        subtitle = placement.get("subtitle") or subtitle
        description = (
            placement.get("description_md")
            or placement.get("description")
            or description
        )
        level = placement.get("level") or level
        if level not in ("beginner", "intermediate", "advanced"):
            level = "beginner"
        trailer_video_id = placement.get("trailer_video_id") or placement.get(
            "trailer_video"
        )
        modules = list(placement.get("modules") or [])
        resources = list(placement.get("resources") or [])

    if not modules and lesson_plan and isinstance(lesson_plan.get("modules"), list):
        modules = list(lesson_plan["modules"])
        title = lesson_plan.get("course_title") or title
        description = lesson_plan.get("description_md") or description

    # video_package may supply per-slug video ids
    video_map: dict[str, str] = {}
    if video_pkg:
        raw = video_pkg.get("videos") or video_pkg.get("video_ids") or {}
        if isinstance(raw, dict):
            video_map = {str(k): str(v) for k, v in raw.items() if v}
        elif isinstance(raw, list):
            for i, v in enumerate(raw):
                if isinstance(v, dict) and v.get("slug") and v.get("video_id"):
                    video_map[str(v["slug"])] = str(v["video_id"])
                elif isinstance(v, str):
                    video_map[f"lesson-{i+1}"] = v
        if not trailer_video_id:
            trailer_video_id = video_pkg.get("trailer_video_id")

    if not modules:
        # Single-lesson fallback from card + script
        modules = [
            {
                "title": "Module 1",
                "kind": "standard",
                "lessons": [
                    {
                        "title": title,
                        "slug": "lesson-1",
                        "kind": "video",
                        "body_md": script_body or description,
                        "video_id": video_map.get("lesson-1"),
                        "free_preview": False,
                    }
                ],
            }
        ]

    # Normalize modules/lessons
    norm_modules = []
    for mi, mod in enumerate(modules):
        if not isinstance(mod, dict):
            continue
        m_title = (mod.get("title") or f"Module {mi+1}").strip()
        m_kind = mod.get("kind") or "standard"
        if m_kind not in ("standard", "worksheets", "resources", "bonus"):
            m_kind = "standard"
        lessons_in = mod.get("lessons") or []
        norm_lessons = []
        for li, les in enumerate(lessons_in):
            if not isinstance(les, dict):
                continue
            l_title = (les.get("title") or f"Lesson {li+1}").strip()
            l_slug = _slugify(les.get("slug") or l_title)[:255]
            l_kind = les.get("kind") or "video"
            if l_kind not in (
                "video",
                "text",
                "download",
                "external",
                "replay",
                "quiz",
            ):
                l_kind = "video"
            vid = les.get("video_id") or video_map.get(l_slug) or video_map.get(
                les.get("slug") or ""
            )
            vprov = (les.get("video_provider") or video_pkg.get("provider") if video_pkg else None) or "youtube"
            vprov = str(vprov).strip().lower()
            if vprov not in ("youtube", "bunny"):
                vprov = "youtube"
            if isinstance(vid, str):
                vid = vid.strip()
                if vprov == "bunny" or re.fullmatch(
                    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
                    vid,
                ):
                    vprov = "bunny"
                    # leave GUID as-is (lowercase)
                    if re.fullmatch(
                        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
                        vid,
                    ):
                        vid = vid.lower()
                    elif re.fullmatch(r"[0-9a-fA-F]{32}", vid):
                        h = vid.lower()
                        vid = f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"
                    else:
                        vid = None
                        vprov = "youtube"
                else:
                    m = re.search(
                        r"(?:youtube(?:-nocookie)?\.com/(?:watch\?.*?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})",
                        vid,
                    )
                    if m:
                        vid = m.group(1)
                    elif not re.fullmatch(r"[\w-]{11}", vid):
                        vid = None
            else:
                vid = None
            body_md = les.get("body_md") or les.get("notes_md")
            if not body_md and li == 0 and mi == 0 and script_body:
                body_md = script_body
            norm_lessons.append(
                {
                    "title": l_title[:512],
                    "slug": l_slug or f"lesson-{li+1}",
                    "kind": l_kind,
                    "video_id": vid,
                    "video_provider": vprov if vid else "youtube",
                    "body_md": body_md,
                    "free_preview": bool(les.get("free_preview")),
                    "duration_seconds": int(les.get("duration_seconds") or 0),
                    "external_url": les.get("external_url"),
                }
            )
        if not norm_lessons:
            continue
        # de-dupe slugs within module
        seen: set[str] = set()
        for les in norm_lessons:
            base = les["slug"]
            s = base
            n = 2
            while s in seen:
                s = f"{base}-{n}"
                n += 1
            les["slug"] = s
            seen.add(s)
        norm_modules.append(
            {"title": m_title[:512], "kind": m_kind, "lessons": norm_lessons}
        )

    if not norm_modules:
        raise PackageError("placement plan has no modules/lessons")

    norm_resources = []
    for res in resources:
        if not isinstance(res, dict):
            continue
        r_title = (res.get("title") or "").strip()
        r_url = (res.get("url") or "").strip()
        if not r_title or not r_url:
            continue
        norm_resources.append(
            {
                "title": r_title[:512],
                "url": r_url[:1024],
                "kind": "link" if res.get("kind") != "file" else "link",
                "free_preview": bool(res.get("free_preview")),
                "description_md": res.get("description_md"),
                "emoji": (res.get("emoji") or "")[:16] or None,
            }
        )

    return {
        "course_title": title[:512],
        "subtitle": (subtitle or "")[:1024],
        "description_md": description,
        "level": level,
        "trailer_video_id": trailer_video_id,
        "modules": norm_modules,
        "resources": norm_resources,
    }


def apply_placement(
    item_id: int, actor: Actor, *, replace: bool = False
) -> dict:
    """Create or refresh a draft Labs course from package artifacts.

    Materializes through the **Canonical Course Model** importer (C4):
    placement plan → document → ``import_document`` (create_draft / replace_draft).

    - First place: create draft course + full module/lesson/resource graph.
    - replace=True (default on re-approve): rebuild draft under same slug.
    - If already placed and replace=False: return already_placed.
    - Never wipes published courses.
    """
    already_placed = False
    replaced = False
    slug: str
    course_id: int
    plan: dict
    module_ids: list[int] = []
    lesson_ids: list[int] = []

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM content_items WHERE id = %s", (item_id,))
            item = cur.fetchone()
            if not item:
                raise PackageError("item not found")

            stages = (
                "placement_proposal",
                "lesson_plan",
                "script",
                "video_package",
            )
            artifacts: dict[str, dict | None] = {
                s: _latest_artifact(cur, item_id, s) for s in stages
            }
            plan = build_placement_plan(item, artifacts)

            existing_slug = item.get("placed_course_slug")
            crow = None
            if existing_slug:
                cur.execute(
                    "SELECT id, status FROM courses WHERE slug = %s",
                    (existing_slug,),
                )
                crow = cur.fetchone()
                if crow and not replace:
                    return {
                        "already_placed": True,
                        "slug": existing_slug,
                        "course_id": crow["id"],
                        "status": crow["status"],
                        "admin_url": f"/courses/{existing_slug}",
                        "replaced": False,
                    }
                if crow and crow["status"] != "draft":
                    raise PackageError(
                        f"course {existing_slug!r} is {crow['status']}; "
                        "refuse to replace non-draft placement"
                    )
                if not crow:
                    existing_slug = None  # stale pointer

            try:
                canon_doc = course_model.placement_plan_to_document(plan)
                do_replace = bool(existing_slug and crow and replace)
                if do_replace:
                    canon_doc.setdefault("course", {})["slug"] = existing_slug
                    imp = course_model.import_document(
                        cur,
                        canon_doc,
                        mode="replace_draft",
                        target_slug=existing_slug,
                        validate_mode="structural",
                    )
                    replaced = True
                else:
                    imp = course_model.import_document(
                        cur,
                        canon_doc,
                        mode="create_draft",
                        validate_mode="structural",
                    )
            except course_model.CourseModelError as exc:
                msg = str(exc)
                if exc.detail and isinstance(exc.detail, dict):
                    errs = exc.detail.get("errors") or []
                    if errs:
                        msg = "; ".join(
                            f"{e.get('code')}:{e.get('message')}" for e in errs[:5]
                        )
                    elif exc.detail.get("code"):
                        msg = f"{exc.detail.get('code')}: {msg}"
                raise PackageError(msg) from exc

            slug = imp["slug"]
            course_id = int(imp["course_id"])

            cur.execute(
                "UPDATE content_items SET placed_course_slug = %s WHERE id = %s",
                (slug, item_id),
            )

            cur.execute(
                """SELECT id FROM modules WHERE course_id = %s
                   ORDER BY sort_order, id""",
                (course_id,),
            )
            module_ids = [r["id"] for r in cur.fetchall()]
            cur.execute(
                """SELECT l.id FROM lessons l
                   JOIN modules m ON m.id = l.module_id
                   WHERE m.course_id = %s
                   ORDER BY m.sort_order, l.sort_order, l.id""",
                (course_id,),
            )
            lesson_ids = [r["id"] for r in cur.fetchall()]

    result = {
        "already_placed": already_placed,
        "replaced": replaced,
        "slug": slug,
        "course_id": course_id,
        "module_ids": module_ids,
        "lesson_ids": lesson_ids,
        "module_count": len(module_ids),
        "lesson_count": len(lesson_ids),
        "resource_count": len(plan.get("resources") or []),
        "status": "draft",
        "admin_url": f"/courses/{slug}",
        "materialized_via": "canonical_course_model",
        "plan_summary": {
            "title": plan["course_title"],
            "modules": [
                {"title": m["title"], "lessons": len(m["lessons"])}
                for m in plan["modules"]
            ],
        },
    }
    agent_auth.record_event(
        actor,
        "package.placement.apply",
        resource=str(item_id),
        detail={k: result[k] for k in result if k != "plan_summary"},
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
