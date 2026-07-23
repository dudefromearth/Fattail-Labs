"""Content backlog & production board domain (Content Board Spec v1.0)."""

from __future__ import annotations

import json
from typing import Any

import agent_auth
import db
from agent_auth import Actor

STATUSES = (
    "draft",
    "queued",
    "scheduled",
    "in_production",
    "awaiting_approval",
    "revision_requested",
    "published",
    "rejected",
)

PRODUCT_LINES = frozenset(
    {"course", "youtube_long", "coaching_short", "thematic_short", "other"}
)

SUB_STAGES = frozenset(
    {"research", "design", "script", "produce", "package", "guardian"}
)

GUARDIANS = frozenset(
    {"hotel", "tango", "victor", "whiskey", "yankee", "other"}
)

# from -> allowed to
TRANSITIONS: dict[str, frozenset[str]] = {
    "draft": frozenset({"queued", "rejected"}),
    "queued": frozenset({"scheduled", "draft", "rejected"}),
    "scheduled": frozenset({"in_production", "queued", "rejected"}),
    "in_production": frozenset(
        {"awaiting_approval", "revision_requested", "rejected", "scheduled"}
    ),
    "awaiting_approval": frozenset(
        {"published", "rejected", "revision_requested"}
    ),
    "revision_requested": frozenset({"in_production", "rejected", "queued"}),
    "published": frozenset(),
    "rejected": frozenset({"draft"}),
}

HUMAN_ONLY_TARGETS = frozenset(
    {"draft", "queued", "published", "rejected", "revision_requested"}
)
# Note: draft/queued also human-only for *initiating* from some states;
# production pipeline statuses can be board:operate.


class BoardError(Exception):
    pass


def _ts(v: Any) -> Any:
    if v is None:
        return None
    return v.isoformat(sep=" ") if hasattr(v, "isoformat") else v


def get_vision() -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, body_md, updated_at, updated_by_identity_id "
                "FROM content_vision WHERE id = 1"
            )
            row = cur.fetchone()
    if not row:
        raise BoardError("content vision missing — run migrations")
    return {
        "body_md": row["body_md"],
        "updated_at": _ts(row["updated_at"]),
        "updated_by_identity_id": row["updated_by_identity_id"],
    }


def set_vision(body_md: str, actor: Actor) -> dict:
    if actor.kind != "human" or actor.role != "administrator":
        raise BoardError("only human administrators may edit Content Vision")
    text = (body_md or "").strip()
    if not text:
        raise BoardError("vision body_md required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE content_vision
                   SET body_md = %s, updated_by_identity_id = %s
                   WHERE id = 1""",
                (text, actor.id if actor.id else None),
            )
    agent_auth.record_event(actor, "board.vision.update", resource="vision")
    return get_vision()


def _item_row(row: dict, *, open_flags: int = 0) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "intent_md": row["intent_md"],
        "acceptance_md": row.get("acceptance_md"),
        "inputs_md": row.get("inputs_md"),
        "product_line": row["product_line"],
        "status": row["status"],
        "sub_stage": row.get("sub_stage"),
        "priority": row["priority"],
        "sort_order": row["sort_order"],
        "vision_aligned": bool(row.get("vision_aligned", 1)),
        "claimed_callsign": row.get("claimed_callsign"),
        "last_actor_kind": row.get("last_actor_kind"),
        "last_actor_id": row.get("last_actor_id"),
        "last_actor_label": row.get("last_actor_label"),
        "created_by_identity_id": row.get("created_by_identity_id"),
        "reject_reason": row.get("reject_reason"),
        "placed_course_slug": row.get("placed_course_slug"),
        "latest_package_id": row.get("latest_package_id"),
        "created_at": _ts(row.get("created_at")),
        "updated_at": _ts(row.get("updated_at")),
        "open_flag_count": open_flags,
    }


def board_snapshot() -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT i.*,
                          (SELECT COUNT(*) FROM content_flags f
                           WHERE f.item_id = i.id AND f.status = 'open') AS open_flags
                   FROM content_items i
                   ORDER BY i.priority DESC, i.sort_order ASC, i.id ASC"""
            )
            rows = cur.fetchall()
    columns: dict[str, list] = {s: [] for s in STATUSES}
    for r in rows:
        card = _item_row(r, open_flags=int(r.get("open_flags") or 0))
        # omit heavy fields on board cards
        card.pop("intent_md", None)
        card.pop("acceptance_md", None)
        card.pop("inputs_md", None)
        columns[r["status"]].append(card)
    return {"columns": columns, "vision": get_vision(), "statuses": list(STATUSES)}


def get_item(item_id: int) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM content_items WHERE id = %s", (item_id,))
            row = cur.fetchone()
            if not row:
                raise BoardError("item not found")
            cur.execute(
                """SELECT COUNT(*) AS c FROM content_flags
                   WHERE item_id = %s AND status = 'open'""",
                (item_id,),
            )
            open_flags = int(cur.fetchone()["c"])
            cur.execute(
                """SELECT * FROM content_transitions
                   WHERE item_id = %s ORDER BY id ASC""",
                (item_id,),
            )
            transitions = [
                {
                    "id": t["id"],
                    "from_status": t["from_status"],
                    "to_status": t["to_status"],
                    "sub_stage": t["sub_stage"],
                    "actor_kind": t["actor_kind"],
                    "actor_label": t["actor_label"],
                    "reason": t["reason"],
                    "created_at": _ts(t["created_at"]),
                }
                for t in cur.fetchall()
            ]
            cur.execute(
                """SELECT * FROM content_artifacts
                   WHERE item_id = %s ORDER BY id ASC""",
                (item_id,),
            )
            artifacts = [
                {
                    "id": a["id"],
                    "stage": a["stage"],
                    "title": a["title"],
                    "body_md": a["body_md"],
                    "url": a["url"],
                    "actor_label": a["actor_label"],
                    "created_at": _ts(a["created_at"]),
                }
                for a in cur.fetchall()
            ]
            cur.execute(
                """SELECT * FROM content_flags
                   WHERE item_id = %s ORDER BY id ASC""",
                (item_id,),
            )
            flags = [
                {
                    "id": f["id"],
                    "guardian": f["guardian"],
                    "severity": f["severity"],
                    "message": f["message"],
                    "status": f["status"],
                    "created_actor_label": f["created_actor_label"],
                    "created_at": _ts(f["created_at"]),
                    "cleared_at": _ts(f["cleared_at"]),
                }
                for f in cur.fetchall()
            ]
    detail = _item_row(row, open_flags=open_flags)
    detail["transitions"] = transitions
    detail["artifacts"] = artifacts
    detail["flags"] = flags
    detail["placed_course_slug"] = row.get("placed_course_slug")
    detail["latest_package_id"] = row.get("latest_package_id")
    try:
        import packages as packages_mod

        detail["package"] = packages_mod.package_detail(item_id)
    except Exception:
        detail["package"] = None
    return detail


def create_item(
    actor: Actor,
    *,
    title: str,
    intent_md: str,
    acceptance_md: str | None = None,
    inputs_md: str | None = None,
    product_line: str = "course",
    priority: int = 0,
) -> dict:
    if actor.kind != "human" or actor.role != "administrator":
        raise BoardError("only human administrators may create backlog items")
    title = (title or "").strip()
    intent = (intent_md or "").strip()
    if not title or not intent:
        raise BoardError("title and intent_md required")
    pl = (product_line or "course").strip()
    if pl not in PRODUCT_LINES:
        raise BoardError(f"product_line must be one of {sorted(PRODUCT_LINES)}")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO content_items
                   (title, intent_md, acceptance_md, inputs_md, product_line,
                    status, priority, created_by_identity_id,
                    last_actor_kind, last_actor_id, last_actor_label)
                   VALUES (%s,%s,%s,%s,%s,'draft',%s,%s,%s,%s,%s)""",
                (
                    title,
                    intent,
                    acceptance_md,
                    inputs_md,
                    pl,
                    int(priority),
                    actor.id,
                    actor.kind,
                    actor.id,
                    actor.label,
                ),
            )
            iid = cur.lastrowid
            cur.execute(
                """INSERT INTO content_transitions
                   (item_id, from_status, to_status, actor_kind, actor_id, actor_label, reason)
                   VALUES (%s, NULL, 'draft', %s, %s, %s, %s)""",
                (iid, actor.kind, actor.id, actor.label, "created"),
            )
    agent_auth.record_event(
        actor, "board.item.create", resource=str(iid), detail={"title": title}
    )
    return get_item(iid)


def update_item(item_id: int, actor: Actor, fields: dict[str, Any]) -> dict:
    if actor.kind != "human" or actor.role != "administrator":
        raise BoardError("only human administrators may edit card fields")
    allowed = {
        "title",
        "intent_md",
        "acceptance_md",
        "inputs_md",
        "product_line",
        "priority",
        "sort_order",
        "vision_aligned",
        "claimed_callsign",
    }
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        raise BoardError("no updatable fields provided")
    if "product_line" in updates and updates["product_line"] not in PRODUCT_LINES:
        raise BoardError(f"invalid product_line")
    if "title" in updates:
        updates["title"] = str(updates["title"]).strip()
        if not updates["title"]:
            raise BoardError("title required")
    sets: list[str] = []
    vals: list[Any] = []
    for k, v in updates.items():
        sets.append(f"{k} = %s")
        vals.append(v)
    sets += [
        "last_actor_kind = %s",
        "last_actor_id = %s",
        "last_actor_label = %s",
    ]
    vals += [actor.kind, actor.id, actor.label, item_id]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE content_items SET {', '.join(sets)} WHERE id = %s",
                vals,
            )
            cur.execute("SELECT id FROM content_items WHERE id = %s", (item_id,))
            if not cur.fetchone():
                raise BoardError("item not found")
    agent_auth.record_event(actor, "board.item.update", resource=str(item_id))
    return get_item(item_id)


def _assert_transition_auth(actor: Actor, to_status: str) -> None:
    human_admin = actor.kind == "human" and actor.role == "administrator"
    if to_status in HUMAN_ONLY_TARGETS:
        if not human_admin:
            raise BoardError(
                f"only human administrators may move cards to {to_status}"
            )
        return
    # pipeline statuses
    if human_admin:
        return
    if actor.kind == "agent" and actor.has_scopes(["board:operate"]):
        return
    raise BoardError(
        f"actor cannot transition to {to_status} (need human admin or board:operate)"
    )


def transition(
    item_id: int,
    actor: Actor,
    *,
    to_status: str,
    sub_stage: str | None = None,
    reason: str | None = None,
    claimed_callsign: str | None = None,
) -> dict:
    to_status = (to_status or "").strip()
    if to_status not in STATUSES:
        raise BoardError(f"unknown status {to_status!r}")
    _assert_transition_auth(actor, to_status)

    if sub_stage is not None and sub_stage != "":
        if sub_stage not in SUB_STAGES:
            raise BoardError(f"unknown sub_stage {sub_stage!r}")
    else:
        sub_stage = None

    # Phase C: package must be complete before entering awaiting_approval
    if to_status == "awaiting_approval":
        try:
            import packages as packages_mod

            packages_mod.validate_for_approval(item_id)
        except Exception as exc:
            from packages import PackageError

            if isinstance(exc, PackageError):
                raise BoardError(str(exc)) from exc
            raise

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM content_items WHERE id = %s FOR UPDATE", (item_id,)
            )
            row = cur.fetchone()
            if not row:
                raise BoardError("item not found")
            from_status = row["status"]
            if to_status != from_status:
                allowed = TRANSITIONS.get(from_status, frozenset())
                if to_status not in allowed:
                    raise BoardError(
                        f"illegal transition {from_status} → {to_status}"
                    )

            if to_status in ("rejected", "revision_requested") and not (
                reason or row.get("reject_reason")
            ):
                if not reason:
                    raise BoardError("reason required for reject/revision")

            new_sub = sub_stage
            if to_status == "in_production" and not new_sub:
                new_sub = row.get("sub_stage") or "research"
            if to_status != "in_production":
                new_sub = None if to_status not in ("revision_requested",) else (
                    sub_stage or row.get("sub_stage")
                )
            if to_status == "revision_requested":
                new_sub = sub_stage or "research"

            reject_reason = row.get("reject_reason")
            if to_status in ("rejected", "revision_requested") and reason:
                reject_reason = reason

            claim = claimed_callsign
            if claim is None:
                claim = row.get("claimed_callsign")
            if to_status == "scheduled" and actor.kind == "agent":
                claim = actor.label
            if to_status in ("draft", "queued") and to_status != from_status:
                claim = None

            cur.execute(
                """UPDATE content_items SET
                     status = %s, sub_stage = %s, reject_reason = %s,
                     claimed_callsign = %s,
                     last_actor_kind = %s, last_actor_id = %s, last_actor_label = %s
                   WHERE id = %s""",
                (
                    to_status,
                    new_sub,
                    reject_reason,
                    claim,
                    actor.kind,
                    actor.id,
                    actor.label,
                    item_id,
                ),
            )
            cur.execute(
                """INSERT INTO content_transitions
                   (item_id, from_status, to_status, sub_stage,
                    actor_kind, actor_id, actor_label, reason)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    item_id,
                    from_status,
                    to_status,
                    new_sub,
                    actor.kind,
                    actor.id,
                    actor.label,
                    reason,
                ),
            )

    agent_auth.record_event(
        actor,
        "board.item.transition",
        resource=str(item_id),
        detail={"from": from_status, "to": to_status, "sub_stage": new_sub},
    )

    # Phase C: freeze package when entering awaiting_approval
    if to_status == "awaiting_approval" and from_status != to_status:
        try:
            import packages as packages_mod

            packages_mod.freeze_package(item_id, actor)
        except Exception as exc:
            from packages import PackageError

            if isinstance(exc, PackageError):
                raise BoardError(str(exc)) from exc
            raise

    # Phase C/D: decide package + optional Labs placement on human publish
    placement_result = None
    if to_status == "published" and from_status != to_status:
        try:
            import packages as packages_mod

            # replace=True refreshes draft structure on re-approve after revision
            placement_result = packages_mod.apply_placement(
                item_id, actor, replace=True
            )
            packages_mod.decide_package(
                item_id, actor, decision="approved", placement=placement_result
            )
        except Exception as exc:
            from packages import PackageError

            if isinstance(exc, PackageError):
                raise BoardError(str(exc)) from exc
            raise
    elif to_status in ("rejected", "revision_requested") and from_status != to_status:
        try:
            import packages as packages_mod

            packages_mod.decide_package(item_id, actor, decision="rejected")
        except Exception:
            pass

    item = get_item(item_id)
    if placement_result:
        item["placement"] = placement_result
    _notify_transition(item, actor, from_status=from_status, to_status=to_status)
    return item


def add_artifact(
    item_id: int,
    actor: Actor,
    *,
    stage: str,
    title: str,
    body_md: str | None = None,
    url: str | None = None,
) -> dict:
    _require_board_write(actor)
    stage = (stage or "").strip()
    title = (title or "").strip()
    if not stage or not title:
        raise BoardError("stage and title required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM content_items WHERE id = %s", (item_id,))
            if not cur.fetchone():
                raise BoardError("item not found")
            import hashlib

            chash = hashlib.sha256((body_md or "").encode("utf-8")).hexdigest()
            cur.execute(
                """INSERT INTO content_artifacts
                   (item_id, stage, title, body_md, url, content_hash,
                    actor_kind, actor_id, actor_label)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    item_id,
                    stage[:64],
                    title[:512],
                    body_md,
                    url,
                    chash,
                    actor.kind,
                    actor.id,
                    actor.label,
                ),
            )
    agent_auth.record_event(
        actor, "board.artifact.add", resource=str(item_id), detail={"stage": stage}
    )
    return get_item(item_id)


def add_flag(
    item_id: int,
    actor: Actor,
    *,
    guardian: str,
    message: str,
    severity: str = "block",
) -> dict:
    _require_board_write(actor)
    g = (guardian or "").strip().lower()
    if g not in GUARDIANS:
        raise BoardError(f"guardian must be one of {sorted(GUARDIANS)}")
    msg = (message or "").strip()
    if not msg:
        raise BoardError("message required")
    if severity not in ("block", "warn"):
        raise BoardError("severity must be block|warn")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM content_items WHERE id = %s", (item_id,))
            if not cur.fetchone():
                raise BoardError("item not found")
            cur.execute(
                """INSERT INTO content_flags
                   (item_id, guardian, severity, message, status,
                    created_actor_kind, created_actor_id, created_actor_label)
                   VALUES (%s,%s,%s,%s,'open',%s,%s,%s)""",
                (item_id, g, severity, msg, actor.kind, actor.id, actor.label),
            )
    agent_auth.record_event(
        actor, "board.flag.open", resource=str(item_id), detail={"guardian": g}
    )
    item = get_item(item_id)
    if severity == "block":
        try:
            import notify

            notify.notify_board_flag(
                item_id, item.get("title") or f"#{item_id}", g, msg
            )
        except Exception:  # noqa: BLE001 — notifications must not fail the write
            pass
    return item


def clear_flag(flag_id: int, actor: Actor) -> dict:
    _require_board_write(actor)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT item_id, status FROM content_flags WHERE id = %s", (flag_id,)
            )
            row = cur.fetchone()
            if not row:
                raise BoardError("flag not found")
            if row["status"] != "open":
                return get_item(int(row["item_id"]))
            cur.execute(
                """UPDATE content_flags SET
                     status = 'cleared',
                     cleared_at = CURRENT_TIMESTAMP,
                     cleared_actor_kind = %s,
                     cleared_actor_id = %s,
                     cleared_actor_label = %s
                   WHERE id = %s""",
                (actor.kind, actor.id, actor.label, flag_id),
            )
            item_id = int(row["item_id"])
    agent_auth.record_event(
        actor, "board.flag.clear", resource=str(item_id), detail={"flag_id": flag_id}
    )
    return get_item(item_id)


def _require_board_write(actor: Actor) -> None:
    if actor.kind == "human" and actor.role == "administrator":
        return
    if actor.kind == "agent" and actor.has_scopes(["board:operate"]):
        return
    raise BoardError("board write requires human admin or board:operate")


def _notify_transition(
    item: dict, actor: Actor, *, from_status: str, to_status: str
) -> None:
    """Email + in-app for admin-action statuses. Never raises to callers."""
    if from_status == to_status:
        return
    try:
        import notify

        exclude = actor.id if actor.kind == "human" and actor.id else None
        if to_status == "awaiting_approval":
            notify.notify_board_awaiting_approval(
                item, actor_identity_id=exclude
            )
        elif to_status == "revision_requested":
            notify.notify_board_revision(item, actor_identity_id=exclude)
    except Exception:  # noqa: BLE001
        pass
