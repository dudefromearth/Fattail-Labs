"""Quebec board ops: tick, auto-produce next stage, poller status.

Spec: FatTail-Labs-Quebec-Poller-Spec-v1.0.md
Never publishes or rejects — human gate only.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

import agent_auth
import board
import db
import packages as packages_mod
from agent_auth import Actor

STAGE_PROGRESSION: list[tuple[str, str]] = [
    ("research_pack", "research"),
    ("lesson_plan", "design"),
    ("script", "script"),
    ("video_package", "produce"),
    ("placement_proposal", "package"),
    ("vision_alignment", "package"),
]

# product_line → ordered (stage, callsign|None, task_id|special)
PRODUCE_PIPELINE: dict[str, list[tuple[str, str | None, str]]] = {
    "course": [
        ("research_pack", "bravo", "research_pack"),
        ("lesson_plan", "november", "lesson_plan"),
        ("script", "romeo", "lesson_script"),
        ("video_package", None, "video_stub"),
        ("placement_proposal", "papa", "placement_proposal"),
        ("vision_alignment", None, "vision_stub"),
    ],
    "youtube_long": [
        ("research_pack", "bravo", "research_pack"),
        ("script", "romeo", "lesson_script"),
        ("video_package", None, "video_stub"),
        ("placement_proposal", "papa", "placement_proposal"),
        ("vision_alignment", None, "vision_stub"),
    ],
    "coaching_short": [
        ("research_pack", "bravo", "research_pack"),
        ("script", "romeo", "coaching_short_script"),
        ("video_package", None, "video_stub"),
        ("vision_alignment", None, "vision_stub"),
    ],
    "thematic_short": [
        ("research_pack", "bravo", "research_pack"),
        ("script", "romeo", "coaching_short_script"),
        ("video_package", None, "video_stub"),
        ("vision_alignment", None, "vision_stub"),
    ],
    "other": [
        ("research_pack", "bravo", "research_pack"),
        ("vision_alignment", None, "vision_stub"),
    ],
    "campaign": [
        ("research_pack", "bravo", "research_pack"),
        ("vision_alignment", None, "vision_stub"),
    ],
}


class QuebecError(Exception):
    pass


def auto_enabled() -> bool:
    return os.environ.get("LABS_QUEBEC_AUTO", "").strip() in ("1", "true", "yes")


def poller_enabled() -> bool:
    return os.environ.get("LABS_QUEBEC_POLLER", "").strip() in ("1", "true", "yes")


def auto_produce_enabled() -> bool:
    return os.environ.get("LABS_QUEBEC_AUTO_PRODUCE", "").strip() in (
        "1",
        "true",
        "yes",
    )


def auto_heygen_enabled() -> bool:
    return os.environ.get("LABS_QUEBEC_AUTO_HEYGEN", "").strip() in (
        "1",
        "true",
        "yes",
    )


def produce_mode() -> str:
    raw = os.environ.get("LABS_QUEBEC_AUTO_PRODUCE_MODE", "fixtures").strip().lower()
    if raw not in ("fixtures", "live", "auto"):
        raise QuebecError(
            f"LABS_QUEBEC_AUTO_PRODUCE_MODE must be fixtures|live|auto, got {raw!r}"
        )
    return raw


def poll_interval_seconds() -> int:
    raw = os.environ.get("LABS_QUEBEC_POLL_INTERVAL_SECONDS", "60").strip() or "60"
    try:
        v = int(raw)
    except ValueError as exc:
        raise QuebecError(
            f"LABS_QUEBEC_POLL_INTERVAL_SECONDS must be an integer, got {raw!r}"
        ) from exc
    if v < 15:
        raise QuebecError("LABS_QUEBEC_POLL_INTERVAL_SECONDS must be >= 15")
    return v


def max_actions_default() -> int:
    raw = os.environ.get("LABS_QUEBEC_MAX_ACTIONS", "20").strip() or "20"
    try:
        v = int(raw)
    except ValueError as exc:
        raise QuebecError(
            f"LABS_QUEBEC_MAX_ACTIONS must be an integer, got {raw!r}"
        ) from exc
    return max(1, min(v, 50))


def poller_actor() -> Actor:
    """System actor for the poller process (quebec principal)."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM agent_principals WHERE callsign = 'quebec' LIMIT 1"
            )
            row = cur.fetchone()
    if not row:
        raise QuebecError(
            "agent principal 'quebec' missing — run migrations (016_agent_identity)"
        )
    return Actor(
        kind="agent",
        id=int(row["id"]),
        label="quebec-poller",
        scopes=frozenset({"board:operate", "ai:run", "ai:status"}),
    )


def _open_block_flags(item_id: int) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT COUNT(*) AS c FROM content_flags
                   WHERE item_id = %s AND status = 'open' AND severity = 'block'""",
                (item_id,),
            )
            return int(cur.fetchone()["c"])


def _artifact_stages(item_id: int) -> set[str]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT stage FROM content_artifacts WHERE item_id = %s",
                (item_id,),
            )
            return {r["stage"] for r in cur.fetchall()}


def _item_detail_row(item_id: int) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM content_items WHERE id = %s", (item_id,))
            return cur.fetchone()


def _latest_artifact_body(item_id: int, stage: str) -> str:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT body_md FROM content_artifacts
                   WHERE item_id = %s AND stage = %s
                   ORDER BY id DESC LIMIT 1""",
                (item_id, stage),
            )
            row = cur.fetchone()
    return (row["body_md"] if row else "") or ""


def _desired_sub_stage(stages: set[str], product_line: str) -> str:
    order = ["research", "design", "script", "produce", "package", "guardian"]
    level = 0
    if "research_pack" in stages:
        level = max(level, 0)
    if product_line == "course":
        if "lesson_plan" in stages:
            level = max(level, 1)
        if "script" in stages:
            level = max(level, 2)
        if "video_package" in stages:
            level = max(level, 3)
        if "placement_proposal" in stages or "vision_alignment" in stages:
            level = max(level, 4)
    else:
        if "script" in stages:
            level = max(level, 2)
        if "video_package" in stages:
            level = max(level, 3)
        if "placement_proposal" in stages or "vision_alignment" in stages:
            level = max(level, 4)
    return order[level]


def _eligible_queued(limit: int = 5) -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, title, status, sub_stage, product_line, priority
                   FROM content_items
                   WHERE status = 'queued'
                   ORDER BY priority DESC, sort_order ASC, id ASC
                   LIMIT %s""",
                (limit,),
            )
            return list(cur.fetchall())


def _items_in_status(status: str, limit: int = 20) -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, title, status, sub_stage, product_line, priority,
                          cast_id, intent_md
                   FROM content_items
                   WHERE status = %s
                   ORDER BY priority DESC, sort_order ASC, id ASC
                   LIMIT %s""",
                (status, limit),
            )
            return list(cur.fetchall())


def _pipeline_for(product_line: str) -> list[tuple[str, str | None, str]]:
    return PRODUCE_PIPELINE.get(product_line) or PRODUCE_PIPELINE["other"]


def next_missing_stage(item_id: int, product_line: str) -> tuple[str, str | None, str] | None:
    have = _artifact_stages(item_id)
    for stage, callsign, task in _pipeline_for(product_line):
        if stage not in have:
            return stage, callsign, task
    return None


def _write_stage_artifact(
    actor: Actor,
    item_id: int,
    stage: str,
    title: str,
    body: str,
) -> int:
    import hashlib

    chash = hashlib.sha256((body or "").encode("utf-8")).hexdigest()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO content_artifacts
                   (item_id, stage, title, body_md, actor_kind, actor_id, actor_label,
                    content_hash)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    item_id,
                    stage[:64],
                    title[:512],
                    body,
                    actor.kind,
                    actor.id,
                    actor.label,
                    chash,
                ),
            )
            return int(cur.lastrowid)


def _build_inputs_for_task(
    item: dict, callsign: str, task_id: str
) -> dict[str, str]:
    from ai.agents import default_fixture_inputs

    try:
        base = dict(default_fixture_inputs(callsign, task_id))
    except Exception:
        base = {}
    intent = (item.get("intent_md") or item.get("title") or "").strip()
    title = (item.get("title") or "").strip()
    # Overlay card context
    if "intent" in base or callsign == "bravo":
        base["intent"] = intent or base.get("intent", "")
    if "source" in base and intent:
        base["source"] = (
            f"Board card #{item['id']}: {title}\n\nIntent:\n{intent}\n\n"
            f"(Poller-supplied context; expand claims from this intent.)"
        )
    if "research" in base:
        research = _latest_artifact_body(int(item["id"]), "research_pack")
        if research:
            base["research"] = research[:8000]
        base["intent"] = intent or base.get("intent", "")
    if "lesson_plan" in base:
        plan = _latest_artifact_body(int(item["id"]), "lesson_plan")
        if plan:
            base["lesson_plan"] = plan[:8000]
    if "cast" in base:
        base["cast"] = item.get("cast_id") or base.get("cast") or "DUDE-PRIMARY"
    if "title" in base:
        base["title"] = title or base.get("title", "")
    if callsign == "papa":
        base["title"] = title
        base["cast"] = item.get("cast_id") or "DUDE-PRIMARY"
        base.setdefault("format", "course_lesson")
        base.setdefault("duration", "6:00")
        base.setdefault("heygen_ids", "pending")
    if callsign == "quebec":
        base["title"] = title
        base["item_id"] = str(item["id"])
        base["intent"] = intent
        stages = sorted(_artifact_stages(int(item["id"])))
        base["artifacts"] = ", ".join(stages) if stages else "none"
        base["flags"] = "none"
        try:
            vision = board.get_vision()
            base["vision"] = (vision.get("body_md") or "")[:2000]
        except Exception:
            base.setdefault("vision", "Stop the bleeding; process outcomes only.")
    return base


def _resolve_produce_mode() -> str:
    mode = produce_mode()
    if mode != "auto":
        return mode
    if os.environ.get("XAI_API_KEY", "").strip() or os.environ.get(
        "ANTHROPIC_API_KEY", ""
    ).strip():
        return "live"
    return "fixtures"


def _produce_ai_stage(
    actor: Actor,
    item: dict,
    *,
    stage: str,
    callsign: str,
    task_id: str,
    mode: str,
) -> dict[str, Any]:
    from ai.agents import (
        AGENT_TASKS,
        run_agent_task,
        synthetic_success_output,
    )

    iid = int(item["id"])
    inputs = _build_inputs_for_task(item, callsign, task_id)
    if mode == "fixtures":
        spec = AGENT_TASKS[callsign][task_id]
        text = synthetic_success_output(spec)
        # Prefer card intent in synthetic body
        text = (
            f"(quebec-poller fixtures for card #{iid}: {item.get('title')})\n\n"
            f"Intent:\n{(item.get('intent_md') or '')[:1500]}\n\n"
            f"{text}"
        )
        attach = packages_mod.attach_ai_result_to_item(
            actor,
            content_item_id=iid,
            callsign=callsign,
            task_id=task_id,
            text=text,
            provider="fixtures",
            model="synthetic",
            prefer=None,
            markers=list(spec.required_markers),
            usage={},
        )
        return {
            "stage": stage,
            "mode": "fixtures",
            "callsign": callsign,
            "task_id": task_id,
            "artifact_id": attach.get("artifact_id") or attach.get("id"),
        }

    result = run_agent_task(callsign, task_id, inputs)
    attach = packages_mod.attach_ai_result_to_item(
        actor,
        content_item_id=iid,
        callsign=result.callsign,
        task_id=result.task_id,
        text=result.text,
        provider=result.provider,
        model=result.model,
        prefer=None,
        markers=list(result.markers_found),
        usage=dict(result.usage or {}),
    )
    return {
        "stage": stage,
        "mode": "live",
        "callsign": result.callsign,
        "task_id": result.task_id,
        "artifact_id": attach.get("artifact_id") or attach.get("id"),
        "provider": result.provider,
    }


def _produce_vision_stub(actor: Actor, item: dict) -> dict[str, Any]:
    iid = int(item["id"])
    try:
        vision = board.get_vision().get("body_md") or ""
    except Exception:
        vision = "Stop the bleeding first. Process outcomes only."
    body = (
        f"## Vision alignment\n\n"
        f"**Card:** {item.get('title')} (#{iid})\n\n"
        f"**Intent:**\n{(item.get('intent_md') or '').strip()}\n\n"
        f"**Content Vision (excerpt):**\n{vision[:1500]}\n\n"
        f"This work product supports capital preservation and capacity-over-dependency. "
        f"No profit claims. Pathway-safe if course.\n\n"
        f"_Generated by quebec-poller vision_stub._\n"
    )
    aid = _write_stage_artifact(
        actor, iid, "vision_alignment", "Quebec vision alignment", body
    )
    return {"stage": "vision_alignment", "mode": "stub", "artifact_id": aid}


def _produce_video_stub(actor: Actor, item: dict) -> dict[str, Any]:
    iid = int(item["id"])
    if auto_heygen_enabled() and item.get("cast_id"):
        # Prefer dry-run HeyGen package when cast + script exist
        script = _latest_artifact_body(iid, "script")
        if script.strip():
            try:
                import heygen_prod as heygen_mod

                result = heygen_mod.produce_video_package(
                    iid, actor, dry_run=True
                )
                return {
                    "stage": "video_package",
                    "mode": "heygen_dry_run",
                    "artifact_id": result.get("artifact_id"),
                }
            except Exception as exc:
                # fall through to stub
                err = str(exc)
        else:
            err = "no script yet"
    else:
        err = None

    body = json.dumps(
        {
            "provider": "stub",
            "status": "poller_stub",
            "title": item.get("title"),
            "videos": {"lesson-1": None},
            "notes": (
                "Quebec poller video_package stub. Replace with HeyGen produce or "
                "YouTube ids before member publish."
                + (f" (heygen skipped: {err})" if err else "")
            ),
            "renders": [],
        },
        indent=2,
    )
    aid = _write_stage_artifact(
        actor, iid, "video_package", "Quebec video_package stub", body
    )
    return {"stage": "video_package", "mode": "stub", "artifact_id": aid}


def produce_next_stage(actor: Actor, item: dict) -> dict[str, Any] | None:
    """Produce exactly one missing required stage for a card, or None if complete."""
    iid = int(item["id"])
    if _open_block_flags(iid) > 0:
        return None
    missing = next_missing_stage(iid, item["product_line"])
    if not missing:
        return None
    stage, callsign, task = missing
    mode = _resolve_produce_mode()

    if task == "vision_stub":
        return _produce_vision_stub(actor, item)
    if task == "video_stub":
        return _produce_video_stub(actor, item)
    if callsign and task:
        return _produce_ai_stage(
            actor, item, stage=stage, callsign=callsign, task_id=task, mode=mode
        )
    return None


def _advance_columns(
    actor: Actor,
    *,
    budget: int,
    actions: list[dict],
    errors: list[dict],
) -> None:
    def record(action: str, item_id: int, detail: dict | None = None) -> None:
        actions.append({"action": action, "item_id": item_id, **(detail or {})})

    for row in _eligible_queued(limit=budget):
        if len(actions) >= budget:
            break
        try:
            board.transition(
                int(row["id"]),
                actor,
                to_status="scheduled",
                claimed_callsign="quebec"
                if actor.kind == "agent"
                else actor.label,
                reason="quebec tick: claim queued item",
            )
            record("scheduled", int(row["id"]), {"title": row["title"]})
        except board.BoardError as exc:
            errors.append({"item_id": row["id"], "error": str(exc)})

    for row in _items_in_status("scheduled", limit=budget):
        if len(actions) >= budget:
            break
        try:
            board.transition(
                int(row["id"]),
                actor,
                to_status="in_production",
                sub_stage="research",
                reason="quebec tick: start production",
            )
            record(
                "in_production",
                int(row["id"]),
                {"sub_stage": "research", "title": row["title"]},
            )
        except board.BoardError as exc:
            errors.append({"item_id": row["id"], "error": str(exc)})

    for row in _items_in_status("in_production", limit=budget):
        if len(actions) >= budget:
            break
        iid = int(row["id"])
        if _open_block_flags(iid) > 0:
            record("blocked_flags", iid, {"title": row["title"]})
            continue
        stages = _artifact_stages(iid)
        desired = _desired_sub_stage(stages, row["product_line"])
        current = row.get("sub_stage") or "research"
        order = ["research", "design", "script", "produce", "package", "guardian"]
        try:
            cur_i = order.index(current) if current in order else 0
            des_i = order.index(desired) if desired in order else 0
        except ValueError:
            cur_i, des_i = 0, 0

        if des_i > cur_i:
            try:
                board.transition(
                    iid,
                    actor,
                    to_status="in_production",
                    sub_stage=desired,
                    reason=f"quebec tick: artifacts support sub_stage={desired}",
                )
                record(
                    "sub_stage",
                    iid,
                    {"from": current, "to": desired, "title": row["title"]},
                )
            except board.BoardError as exc:
                errors.append({"item_id": iid, "error": str(exc)})
                continue

        try:
            packages_mod.validate_for_approval(iid)
            board.transition(
                iid,
                actor,
                to_status="awaiting_approval",
                reason="quebec tick: package complete",
            )
            record("awaiting_approval", iid, {"title": row["title"]})
        except (packages_mod.PackageError, board.BoardError):
            pass


def tick(
    actor: Actor,
    *,
    max_actions: int | None = None,
    force: bool = False,
    produce: bool | None = None,
) -> dict[str, Any]:
    """One Quebec cycle: advance columns; optionally produce missing stages."""
    human_admin = actor.kind == "human" and actor.role == "administrator"
    agent_ok = actor.kind == "agent" and actor.has_scopes(["board:operate"])
    is_poller = actor.label == "quebec-poller"
    if not human_admin and not agent_ok:
        raise QuebecError(
            "Quebec tick requires human administrator or agent with board:operate"
        )
    if actor.kind == "agent" and not is_poller and not auto_enabled() and not force:
        raise QuebecError(
            "LABS_QUEBEC_AUTO is not enabled — set to 1 for agent auto-advance"
        )

    budget = max_actions if max_actions is not None else max_actions_default()
    budget = max(1, min(int(budget), 50))
    do_produce = auto_produce_enabled() if produce is None else bool(produce)

    actions: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    produced: list[dict[str, Any]] = []

    _advance_columns(actor, budget=budget, actions=actions, errors=errors)

    if do_produce and len(actions) < budget:
        for row in _items_in_status("in_production", limit=budget):
            if len(actions) + len(produced) >= budget:
                break
            try:
                result = produce_next_stage(actor, row)
            except Exception as exc:
                errors.append(
                    {
                        "item_id": row["id"],
                        "error": f"produce: {exc}",
                    }
                )
                continue
            if result:
                produced.append({"item_id": int(row["id"]), **result})
                actions.append(
                    {
                        "action": "produce_stage",
                        "item_id": int(row["id"]),
                        "stage": result.get("stage"),
                        "mode": result.get("mode"),
                    }
                )

        # Second pass: advance after new artifacts
        _advance_columns(actor, budget=budget, actions=actions, errors=errors)

    agent_auth.record_event(
        actor,
        "board.quebec.tick",
        resource="board",
        detail={
            "actions": len(actions),
            "errors": len(errors),
            "produced": len(produced),
            "produce": do_produce,
        },
    )
    return {
        "actions": actions,
        "errors": errors,
        "produced": produced,
        "action_count": len(actions),
        "auto_enabled": auto_enabled(),
        "poller_enabled": poller_enabled(),
        "auto_produce": do_produce,
        "produce_mode": produce_mode() if do_produce else None,
        "actor": {"kind": actor.kind, "label": actor.label},
    }


def forward_progress(
    actor: Actor | None = None,
    *,
    max_actions: int | None = None,
    produce: bool | None = None,
) -> dict[str, Any]:
    """Poller entry: run tick as poller actor and persist status."""
    act = actor or poller_actor()
    started = datetime.now(timezone.utc)
    err: str | None = None
    result: dict[str, Any] = {}
    ok = False
    try:
        result = tick(
            act,
            max_actions=max_actions,
            force=True,
            produce=produce if produce is not None else auto_produce_enabled(),
        )
        ok = True
    except Exception as exc:
        err = str(exc)
        result = {"error": err, "action_count": 0, "actions": [], "errors": []}
        ok = False
    finished = datetime.now(timezone.utc)
    _write_status(
        ok=ok,
        started=started,
        finished=finished,
        result=result,
        error=err,
        poller_on=poller_enabled(),
    )
    if not ok:
        raise QuebecError(err or "forward_progress failed")
    return result


def _write_status(
    *,
    ok: bool,
    started: datetime,
    finished: datetime,
    result: dict,
    error: str | None,
    poller_on: bool,
) -> None:
    payload = json.dumps(result, default=str)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO quebec_poller_status
                   (id, poller_enabled, last_started_at, last_finished_at, last_ok,
                    last_action_count, last_error, last_result_json)
                   VALUES (1,%s,%s,%s,%s,%s,%s,%s)
                   ON DUPLICATE KEY UPDATE
                     poller_enabled = VALUES(poller_enabled),
                     last_started_at = VALUES(last_started_at),
                     last_finished_at = VALUES(last_finished_at),
                     last_ok = VALUES(last_ok),
                     last_action_count = VALUES(last_action_count),
                     last_error = VALUES(last_error),
                     last_result_json = VALUES(last_result_json)""",
                (
                    1 if poller_on else 0,
                    started.replace(tzinfo=None),
                    finished.replace(tzinfo=None),
                    1 if ok else 0,
                    int(result.get("action_count") or 0),
                    error,
                    payload,
                ),
            )


def get_status() -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM quebec_poller_status WHERE id = 1")
            row = cur.fetchone()
    cfg = {
        "poller_enabled_env": poller_enabled(),
        "auto_produce_env": auto_produce_enabled(),
        "auto_heygen_env": auto_heygen_enabled(),
        "produce_mode": produce_mode(),
        "interval_seconds": poll_interval_seconds() if poller_enabled() else None,
        "max_actions": max_actions_default(),
        "lab_quebec_auto": auto_enabled(),
    }
    if not row:
        return {"configured": False, "config": cfg, "status": None}
    last_result = row.get("last_result_json")
    if isinstance(last_result, str):
        try:
            last_result = json.loads(last_result)
        except json.JSONDecodeError:
            pass
    return {
        "configured": True,
        "config": cfg,
        "status": {
            "poller_enabled": bool(row.get("poller_enabled")),
            "last_started_at": str(row["last_started_at"])
            if row.get("last_started_at")
            else None,
            "last_finished_at": str(row["last_finished_at"])
            if row.get("last_finished_at")
            else None,
            "last_ok": None
            if row.get("last_ok") is None
            else bool(row.get("last_ok")),
            "last_action_count": int(row.get("last_action_count") or 0),
            "last_error": row.get("last_error"),
            "last_result": last_result,
        },
    }
