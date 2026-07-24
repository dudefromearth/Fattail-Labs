"""HeyGen production from the board (Phase G1–G5).

G2a single kick, G2b multi-lesson batch, G3 job budgets, G5 status poll.
Does not auto-upload to YouTube or place lessons — human gate required.

Spec: FatTail-Labs-Cast-HeyGen-Spec-v1.1.md
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import uuid
from datetime import datetime, timezone
from typing import Any

import agent_auth
import cast as cast_mod
import db
from agent_auth import Actor
from packages import _sha256

VIDEO_PRODUCT_LINES = frozenset(
    {"course", "youtube_long", "coaching_short", "thematic_short"}
)

# Concurrent batch safety (HeyGen skill: 2–3 max simultaneous)
DEFAULT_MAX_BATCH = 3
DEFAULT_DAILY_JOB_LIMIT = 10
DEFAULT_MONTHLY_JOB_LIMIT = 100


class HeyGenProdError(Exception):
    pass


def _heygen_api_key() -> str | None:
    return os.environ.get("HEYGEN_API_KEY", "").strip() or None


def _dry_run_forced() -> bool:
    return os.environ.get("LABS_HEYGEN_DRY_RUN", "").strip() in ("1", "true", "yes")


def _int_env(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        v = int(raw)
    except ValueError as exc:
        raise HeyGenProdError(f"{name} must be an integer, got {raw!r}") from exc
    if v < 0:
        raise HeyGenProdError(f"{name} must be >= 0")
    return v


def max_batch() -> int:
    return max(1, _int_env("LABS_HEYGEN_MAX_BATCH", DEFAULT_MAX_BATCH))


def daily_job_limit() -> int:
    return _int_env("LABS_HEYGEN_DAILY_JOB_LIMIT", DEFAULT_DAILY_JOB_LIMIT)


def monthly_job_limit() -> int:
    return _int_env("LABS_HEYGEN_MONTHLY_JOB_LIMIT", DEFAULT_MONTHLY_JOB_LIMIT)


def _orientation_for_product_line(product_line: str) -> str:
    if product_line in ("coaching_short", "thematic_short"):
        return "portrait"
    return "landscape"


def _slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return s[:80] or "lesson"


def _latest_artifact(item_id: int, stage: str) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, title, body_md, url FROM content_artifacts
                   WHERE item_id = %s AND stage = %s
                   ORDER BY id DESC LIMIT 1""",
                (item_id, stage),
            )
            return cur.fetchone()


def _parse_json_loose(body: str | None) -> dict | None:
    if not body or not str(body).strip():
        return None
    text = str(body).strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.I)
    if fence:
        text = fence.group(1).strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def plan_render_targets(
    item_id: int, *, title: str, product_line: str, script_body: str
) -> list[dict[str, str]]:
    """Build one render target per video lesson (G2b).

    Sources (first hit wins for structure):
    1. lesson_plan JSON modules/lessons
    2. placement_proposal JSON modules/lessons
    3. script ## Lesson / ## Beat headers
    4. single default lesson-1
    """
    for stage in ("lesson_plan", "placement_proposal"):
        art = _latest_artifact(item_id, stage)
        if not art:
            continue
        data = _parse_json_loose(art.get("body_md"))
        if not data:
            continue
        modules = data.get("modules") or []
        targets: list[dict[str, str]] = []
        for mi, mod in enumerate(modules):
            if not isinstance(mod, dict):
                continue
            for li, les in enumerate(mod.get("lessons") or []):
                if not isinstance(les, dict):
                    continue
                kind = (les.get("kind") or "video").strip().lower()
                # text / download / quiz / external — no presenter render
                if kind not in ("video", "replay"):
                    continue
                ltitle = (les.get("title") or f"Lesson {li+1}").strip()
                slug = (les.get("slug") or _slugify(ltitle)).strip()
                body = (les.get("body_md") or les.get("script") or "").strip()
                targets.append(
                    {
                        "slug": slug,
                        "title": ltitle,
                        "script_text": body,
                    }
                )
        if targets:
            return targets[: max_batch() * 4]  # hard ceiling before budget slice

    # Script section splits
    body = (script_body or "").strip()
    section_re = re.compile(
        r"^##\s+(Lesson|Beat|Scene)\s*[:\-]?\s*(.+?)\s*$",
        re.I | re.M,
    )
    matches = list(section_re.finditer(body))
    if len(matches) >= 2:
        targets = []
        for i, m in enumerate(matches):
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
            chunk = body[start:end].strip()
            ltitle = m.group(2).strip()
            targets.append(
                {
                    "slug": _slugify(ltitle) or f"lesson-{i+1}",
                    "title": ltitle,
                    "script_text": chunk,
                }
            )
        return targets

    # Prefer ## Voiceover for single render
    vo_match = re.search(
        r"##\s*Voiceover\s*\n(.*?)(?=\n##\s|\Z)", body, re.I | re.S
    )
    script_text = vo_match.group(1).strip() if vo_match else body
    return [
        {
            "slug": "lesson-1",
            "title": title,
            "script_text": script_text,
        }
    ]


def _build_prompt(
    script_text: str, *, cast_id: str, title: str, slug: str
) -> str:
    text = (script_text or "").strip() or title
    return (
        f"Title: {title}\n"
        f"Segment slug: {slug}\n"
        f"Cast: {cast_id} (use the selected presenter only — do not re-describe appearance).\n\n"
        f"The selected presenter delivers the following educational script as a clear, "
        f"calm coach. Process outcomes only; no profit claims.\n\n"
        f"{text}\n\n"
        "This script is a concept and theme to convey — not a verbatim transcript. "
        "You have full creative freedom to expand, elaborate, add examples, and fill "
        "the duration naturally. Do not pad with silence or pauses.\n\n"
        "Use minimal, clean styled visuals. Blue, black, and white as main colors. "
        "Leverage motion graphics as B-rolls and A-roll overlays when helpful. "
        "Include brief intro and outro sequences using motion graphics."
    )


def _resolve_look_id(group_id: str) -> str | None:
    try:
        proc = subprocess.run(
            [
                "heygen",
                "avatar",
                "looks",
                "list",
                "--group-id",
                group_id,
                "--limit",
                "5",
            ],
            capture_output=True,
            text=True,
            timeout=30,
            env={**os.environ},
        )
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return None
    if proc.returncode != 0:
        return None
    try:
        data = json.loads(proc.stdout)
        looks = data.get("data") or []
        if looks and isinstance(looks[0], dict) and looks[0].get("id"):
            return str(looks[0]["id"])
    except (json.JSONDecodeError, TypeError, KeyError):
        return None
    return None


def _submit_video_agent(
    *,
    prompt: str,
    avatar_id: str | None,
    voice_id: str,
    orientation: str,
) -> dict[str, Any]:
    if not _heygen_api_key():
        raise HeyGenProdError(
            "HEYGEN_API_KEY is not set — cannot submit HeyGen job "
            "(use dry_run=true for local packages without credits)"
        )
    cmd = [
        "heygen",
        "video-agent",
        "create",
        "--prompt",
        prompt[:9900],
        "--voice-id",
        voice_id,
        "--orientation",
        orientation,
        "--mode",
        "generate",
    ]
    if avatar_id:
        cmd.extend(["--avatar-id", avatar_id])
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            env={**os.environ},
        )
    except FileNotFoundError as exc:
        raise HeyGenProdError(
            "heygen CLI not found on PATH — install HeyGen CLI or use dry_run=true"
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise HeyGenProdError("heygen video-agent create timed out") from exc
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "unknown error").strip()
        raise HeyGenProdError(f"heygen video-agent create failed: {err[:800]}")
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise HeyGenProdError(
            f"heygen returned non-JSON: {proc.stdout[:400]}"
        ) from exc
    data = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(data, dict):
        data = payload if isinstance(payload, dict) else {}
    return {
        "session_id": data.get("session_id") or data.get("id"),
        "video_id": data.get("video_id"),
        "raw": data,
    }


def _poll_session(session_id: str) -> dict[str, Any]:
    """Poll video-agent session status via CLI."""
    if str(session_id).startswith("dry-run-"):
        return {
            "status": "dry_run",
            "session_id": session_id,
            "video_id": None,
            "video_url": None,
            "progress": None,
        }
    if not _heygen_api_key():
        raise HeyGenProdError("HEYGEN_API_KEY required to poll HeyGen sessions")
    try:
        proc = subprocess.run(
            ["heygen", "video-agent", "get", session_id],
            capture_output=True,
            text=True,
            timeout=60,
            env={**os.environ},
        )
    except FileNotFoundError as exc:
        raise HeyGenProdError("heygen CLI not found on PATH") from exc
    except subprocess.TimeoutExpired as exc:
        raise HeyGenProdError("heygen video-agent get timed out") from exc
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "unknown").strip()
        raise HeyGenProdError(f"heygen video-agent get failed: {err[:500]}")
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise HeyGenProdError(f"heygen get non-JSON: {proc.stdout[:300]}") from exc
    data = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(data, dict):
        data = {}
    status = (
        data.get("status")
        or data.get("session_status")
        or data.get("state")
        or "unknown"
    )
    status = str(status).lower()
    video_id = data.get("video_id") or data.get("videoId")
    video_url = (
        data.get("video_url")
        or data.get("url")
        or data.get("video_page_url")
    )
    # Normalize completion synonyms
    if status in ("complete", "done", "success", "succeeded"):
        status = "completed"
    if status in ("error", "fail"):
        status = "failed"
    return {
        "status": status,
        "session_id": session_id,
        "video_id": video_id,
        "video_url": video_url,
        "progress": data.get("progress") or data.get("percent"),
        "raw": data,
    }


def budget_snapshot() -> dict[str, Any]:
    """G3: live (non-dry-run) job counts vs limits."""
    daily_lim = daily_job_limit()
    monthly_lim = monthly_job_limit()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT COUNT(*) AS c FROM heygen_job_ledger
                   WHERE dry_run = 0
                     AND status IN ('submitted','completed','generating','thinking')
                     AND created_at >= CURDATE()"""
            )
            day_used = int(cur.fetchone()["c"])
            cur.execute(
                """SELECT COUNT(*) AS c FROM heygen_job_ledger
                   WHERE dry_run = 0
                     AND status IN ('submitted','completed','generating','thinking')
                     AND created_at >= DATE_FORMAT(CURDATE(), '%%Y-%%m-01')"""
            )
            month_used = int(cur.fetchone()["c"])
    # Limit 0 = no live jobs allowed. Use a large limit for "effectively unlimited".
    return {
        "daily_limit": daily_lim,
        "daily_used": day_used,
        "daily_remaining": max(0, daily_lim - day_used),
        "monthly_limit": monthly_lim,
        "monthly_used": month_used,
        "monthly_remaining": max(0, monthly_lim - month_used),
        "max_batch": max_batch(),
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


def _assert_budget(job_count: int) -> None:
    if job_count <= 0:
        return
    snap = budget_snapshot()
    day_rem = int(snap["daily_remaining"])
    mon_rem = int(snap["monthly_remaining"])
    if job_count > day_rem:
        raise HeyGenProdError(
            f"HeyGen daily job budget exceeded: need {job_count}, "
            f"remaining {day_rem} (limit {snap['daily_limit']})"
        )
    if job_count > mon_rem:
        raise HeyGenProdError(
            f"HeyGen monthly job budget exceeded: need {job_count}, "
            f"remaining {mon_rem} (limit {snap['monthly_limit']})"
        )


def _ledger_insert(
    *,
    item_id: int,
    artifact_id: int | None,
    cast_id: str,
    session_id: str | None,
    slug: str,
    status: str,
    dry_run: bool,
    actor: Actor,
) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO heygen_job_ledger
                   (content_item_id, artifact_id, cast_id, session_id, slug,
                    status, dry_run, actor_kind, actor_id, actor_label)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    item_id,
                    artifact_id,
                    cast_id,
                    session_id,
                    slug,
                    status,
                    1 if dry_run else 0,
                    actor.kind,
                    actor.id,
                    actor.label,
                ),
            )


def produce_video_package(
    item_id: int,
    actor: Actor,
    *,
    dry_run: bool | None = None,
    orientation: str | None = None,
    max_renders: int | None = None,
) -> dict[str, Any]:
    """Kick HeyGen for a board card (single or multi-lesson batch)."""
    if dry_run is None:
        dry_run = _dry_run_forced()

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM content_items WHERE id = %s", (item_id,))
            item = cur.fetchone()
    if not item:
        raise HeyGenProdError("item not found")

    product_line = item["product_line"]
    if product_line not in VIDEO_PRODUCT_LINES:
        raise HeyGenProdError(
            f"product_line {product_line!r} does not produce video packages"
        )

    cast_id = item.get("cast_id")
    if not cast_id:
        raise HeyGenProdError(
            "cast_id required on card — assign a cast member before producing"
        )
    try:
        member = cast_mod.get_cast(cast_id)
    except cast_mod.CastError as exc:
        raise HeyGenProdError(str(exc)) from exc
    if not member.get("ready"):
        raise HeyGenProdError(f"cast {cast_id} is not ready")

    script_art = _latest_artifact(item_id, "script")
    script_body = (script_art or {}).get("body_md")
    script_title = (script_art or {}).get("title")
    if not script_body or not str(script_body).strip():
        raise HeyGenProdError(
            "script artifact required — add a stage=script artifact before producing"
        )

    orient = (orientation or "").strip().lower()
    if orient not in ("landscape", "portrait"):
        orient = _orientation_for_product_line(product_line)
        if product_line not in ("coaching_short", "thematic_short"):
            if member.get("orientation") in ("landscape", "portrait"):
                orient = member["orientation"]

    targets = plan_render_targets(
        item_id,
        title=item["title"],
        product_line=product_line,
        script_body=str(script_body),
    )
    limit = max_renders if max_renders is not None else max_batch()
    limit = max(1, min(int(limit), max_batch() * 4))
    targets = targets[:limit]
    if not targets:
        raise HeyGenProdError("no render targets found")

    if not dry_run:
        _assert_budget(len(targets))

    look_id = None if dry_run else _resolve_look_id(member["group_id"])
    renders: list[dict[str, Any]] = []
    any_failed = False
    first_error: str | None = None

    # Sequential submit (batch of max_batch at a time is already size-capped)
    for t in targets:
        slug = t["slug"]
        prompt = _build_prompt(
            t.get("script_text") or script_body,
            cast_id=member["cast_id"],
            title=t["title"],
            slug=slug,
        )
        if dry_run:
            session_id = f"dry-run-{uuid.uuid4().hex[:12]}"
            renders.append(
                {
                    "slug": slug,
                    "title": t["title"],
                    "session_id": session_id,
                    "heygen_video_id": None,
                    "video_url": None,
                    "status": "dry_run",
                    "session_url": None,
                    "error": None,
                }
            )
            continue
        try:
            result = _submit_video_agent(
                prompt=prompt,
                avatar_id=look_id,
                voice_id=member["voice_id"],
                orientation=orient,
            )
            session_id = result.get("session_id")
            renders.append(
                {
                    "slug": slug,
                    "title": t["title"],
                    "session_id": session_id,
                    "heygen_video_id": result.get("video_id"),
                    "video_url": None,
                    "status": "submitted",
                    "session_url": (
                        f"https://app.heygen.com/video-agent/{session_id}"
                        if session_id
                        else None
                    ),
                    "error": None,
                }
            )
        except HeyGenProdError as exc:
            any_failed = True
            if first_error is None:
                first_error = str(exc)
            renders.append(
                {
                    "slug": slug,
                    "title": t["title"],
                    "session_id": None,
                    "heygen_video_id": None,
                    "video_url": None,
                    "status": "failed",
                    "session_url": None,
                    "error": str(exc),
                }
            )

    overall = "dry_run" if dry_run else (
        "failed" if any_failed and all(r["status"] == "failed" for r in renders)
        else "partial" if any_failed
        else "submitted"
    )

    package = {
        "provider": "heygen",
        "status": overall,
        "cast_id": member["cast_id"],
        "group_id": member["group_id"],
        "voice_id": member["voice_id"],
        "look_id": look_id,
        "orientation": orient,
        "product_line": product_line,
        "title": item["title"],
        "script_title": script_title,
        "batch": True,
        "render_count": len(renders),
        "renders": renders,
        "videos": {},
        "trailer_video_id": None,
        "notes": (
            "HeyGen package is a production intermediate. Poll with refresh-heygen, "
            "upload to YouTube (or CDN), set videos{} for placement. Human gate required."
        ),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    body = json.dumps(package, indent=2)
    artifact = _write_artifact(item_id, actor, body, package)

    for r in renders:
        _ledger_insert(
            item_id=item_id,
            artifact_id=artifact["id"],
            cast_id=member["cast_id"],
            session_id=r.get("session_id"),
            slug=r.get("slug") or "",
            status=r.get("status") or "unknown",
            dry_run=bool(dry_run),
            actor=actor,
        )

    if item.get("status") == "in_production":
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE content_items
                       SET sub_stage = 'produce',
                           last_actor_kind = %s,
                           last_actor_id = %s,
                           last_actor_label = %s
                       WHERE id = %s""",
                    (actor.kind, actor.id, actor.label, item_id),
                )

    agent_auth.record_event(
        actor,
        "board.heygen.produce",
        resource=str(item_id),
        detail={
            "cast_id": member["cast_id"],
            "status": overall,
            "render_count": len(renders),
            "dry_run": dry_run,
        },
    )

    if overall == "failed" and first_error:
        raise HeyGenProdError(first_error)

    return {
        "video_package": package,
        "artifact_id": artifact["id"],
        "item_id": item_id,
        "dry_run": dry_run,
        "budget": budget_snapshot(),
    }


def refresh_video_package(item_id: int, actor: Actor) -> dict[str, Any]:
    """G5: poll HeyGen sessions on latest video_package and rewrite artifact."""
    art = _latest_artifact(item_id, "video_package")
    if not art or not art.get("body_md"):
        raise HeyGenProdError("no video_package artifact to refresh")
    package = _parse_json_loose(art["body_md"])
    if not package:
        raise HeyGenProdError("video_package body is not valid JSON")
    if package.get("provider") and package.get("provider") != "heygen":
        raise HeyGenProdError(
            f"cannot refresh non-heygen package (provider={package.get('provider')})"
        )

    renders = list(package.get("renders") or [])
    if not renders:
        raise HeyGenProdError("video_package has no renders")

    updated = 0
    for r in renders:
        if not isinstance(r, dict):
            continue
        sid = r.get("session_id")
        if not sid:
            continue
        if r.get("status") in ("completed", "failed", "dry_run") and r.get(
            "heygen_video_id"
        ):
            # still re-poll dry_run skip; completed with id skip optional re-poll
            if r.get("status") == "completed" and r.get("heygen_video_id"):
                continue
            if r.get("status") == "dry_run":
                continue
        try:
            polled = _poll_session(str(sid))
        except HeyGenProdError as exc:
            r["error"] = str(exc)
            r["status"] = r.get("status") or "unknown"
            continue
        r["status"] = polled.get("status") or r.get("status")
        if polled.get("video_id"):
            r["heygen_video_id"] = polled["video_id"]
        if polled.get("video_url"):
            r["video_url"] = polled["video_url"]
        if polled.get("progress") is not None:
            r["progress"] = polled["progress"]
        if r.get("session_id") and not str(r["session_id"]).startswith("dry-run"):
            r["session_url"] = (
                f"https://app.heygen.com/video-agent/{r['session_id']}"
            )
        updated += 1
        # ledger status touch
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE heygen_job_ledger SET status = %s
                       WHERE session_id = %s""",
                    (r.get("status"), sid),
                )

    statuses = [str(r.get("status") or "") for r in renders if isinstance(r, dict)]
    if statuses and all(s == "dry_run" for s in statuses):
        package["status"] = "dry_run"
    elif statuses and all(s == "completed" for s in statuses):
        package["status"] = "completed"
    elif any(s == "failed" for s in statuses) and not any(
        s in ("submitted", "generating", "thinking") for s in statuses
    ):
        package["status"] = (
            "failed" if all(s == "failed" for s in statuses) else "partial"
        )
    elif any(s in ("submitted", "generating", "thinking") for s in statuses):
        package["status"] = "in_progress"
    else:
        package["status"] = package.get("status") or "unknown"

    package["renders"] = renders
    package["updated_at"] = datetime.now(timezone.utc).isoformat()
    package["last_refresh_actor"] = actor.label

    body = json.dumps(package, indent=2)
    artifact = _write_artifact(item_id, actor, body, package)

    agent_auth.record_event(
        actor,
        "board.heygen.refresh",
        resource=str(item_id),
        detail={"updated_renders": updated, "status": package["status"]},
    )
    return {
        "video_package": package,
        "artifact_id": artifact["id"],
        "item_id": item_id,
        "updated_renders": updated,
    }


def set_youtube_map(
    item_id: int,
    actor: Actor,
    *,
    videos: dict[str, str] | None = None,
    trailer_video_id: str | None = None,
) -> dict[str, Any]:
    """Human fills YouTube ids onto latest video_package for placement."""
    art = _latest_artifact(item_id, "video_package")
    if not art or not art.get("body_md"):
        raise HeyGenProdError("no video_package artifact")
    package = _parse_json_loose(art["body_md"])
    if not package:
        raise HeyGenProdError("video_package body is not valid JSON")
    if videos is not None:
        if not isinstance(videos, dict):
            raise HeyGenProdError("videos must be an object map slug→youtube_id")
        package["videos"] = {str(k): str(v) for k, v in videos.items() if v}
    if trailer_video_id is not None:
        package["trailer_video_id"] = trailer_video_id or None
    package["updated_at"] = datetime.now(timezone.utc).isoformat()
    body = json.dumps(package, indent=2)
    artifact = _write_artifact(item_id, actor, body, package)
    agent_auth.record_event(
        actor,
        "board.heygen.youtube_map",
        resource=str(item_id),
        detail={"videos": package.get("videos"), "trailer": package.get("trailer_video_id")},
    )
    return {
        "video_package": package,
        "artifact_id": artifact["id"],
        "item_id": item_id,
    }


def _write_artifact(
    item_id: int,
    actor: Actor,
    body: str,
    package: dict,
) -> dict:
    title = (
        f"HeyGen video package ({package.get('status')}) — "
        f"{package.get('cast_id')} × {package.get('render_count') or len(package.get('renders') or [])}"
    )
    url = None
    for r in package.get("renders") or []:
        if isinstance(r, dict) and r.get("session_url"):
            url = r["session_url"]
            break
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO content_artifacts
                   (item_id, stage, title, body_md, url, actor_kind, actor_id,
                    actor_label, content_hash)
                   VALUES (%s,'video_package',%s,%s,%s,%s,%s,%s,%s)""",
                (
                    item_id,
                    title,
                    body,
                    url,
                    actor.kind,
                    actor.id,
                    actor.label,
                    _sha256(body),
                ),
            )
            aid = cur.lastrowid
    return {"id": aid, "stage": "video_package", "title": title}
