"""IKI Factory board domain (Spec v0.1.5 · IF-1).

Operational SoR for in-progress Factory cards. Not content_items.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

import db
from agent_auth import Actor

LANES = ("backlog", "research", "spec", "build", "live")
CARD_STATUSES = ("active", "archived", "trashed", "rework")
ORIGINATOR_KINDS = ("coach", "system", "agent", "outside")
ATTACHMENT_KINDS = ("link", "upload")
PICKUP_REASON = "Picked up for research."
WAITING_SKILLS = "waiting for skills"
WAITING_PLAN = "waiting for plan"
WAITING_PRODUCT = "waiting for product spec"
HOLD_REASON = "Hold is set. Nothing pulls while held."
FREE_VS_PAID = ("free", "paid")
DEPLOY_REASON = (
    "Built-ready + product spec — pulled to Live. "
    "Published is the result of the Admin product-spec gate (invariant #7). "
    "Deploy exposes a publication signal."
)
ADMIN_ONLY_RS = "Research → Spec is Admin selection only."
ONE_STEP = "Happy-path moves are one lane. Skip-forward is not allowed."
GEMBA_REWORK = "Gemba does not choose Rework destination."

log = logging.getLogger("labs.iki_factory")


class FactoryError(Exception):
    pass


class FactoryMoveError(FactoryError):
    def __init__(self, reason: str, card: dict[str, Any]):
        super().__init__(reason)
        self.reason = reason
        self.card = card


def _json_field(v: Any) -> Any:
    if v is None or v == "":
        return None
    if isinstance(v, (list, dict)):
        return v
    import json

    if isinstance(v, (bytes, bytearray)):
        v = v.decode("utf-8")
    return json.loads(str(v))


def _row(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": int(r["id"]),
        "title": r["title"],
        "description": r.get("description"),
        "originator_kind": r.get("originator_kind") or "coach",
        "originator_label": r.get("originator_label"),
        "notes": r.get("notes"),
        "lane": r["lane"],
        "owner_identity_id": int(r["owner_identity_id"]),
        "hold": bool(r["hold"]),
        "card_status": r["card_status"],
        "blocked_reason": r.get("blocked_reason"),
        "failed_reason": r.get("failed_reason"),
        "auto_move_reason": r.get("auto_move_reason"),
        "waiting_reason": r.get("waiting_reason"),
        "rank": r.get("rank_n"),
        "rank_reason": r.get("rank_reason"),
        "sources": _json_field(r.get("sources_json")),
        "remainder": _json_field(r.get("remainder_json")),
        "research_window_ends_at": (
            str(r["research_window_ends_at"]) if r.get("research_window_ends_at") else None
        ),
        "spec_ready": bool(r["spec_ready"]),
        "built_ready": bool(r["built_ready"]),
        "plan_ref": r.get("plan_ref"),
        "spec_md": r.get("spec_md"),
        "product_type": r.get("product_type"),
        "product_tier": r.get("product_tier"),
        "free_vs_paid": r.get("free_vs_paid"),
        "live_at": str(r["live_at"]) if r.get("live_at") else None,
        "publication_hash": r.get("publication_hash"),
        "woo_product_id": (
            int(r["woo_product_id"]) if r.get("woo_product_id") else None
        ),
        "store_visible": bool(r.get("store_visible")),
        "published": bool(r.get("published")),
        "obtainable": bool(r.get("obtainable")),
        "woo_reason": r.get("woo_reason"),
        "lineage_parent_id": (
            int(r["lineage_parent_id"]) if r.get("lineage_parent_id") else None
        ),
        "pickup_at": str(r["pickup_at"]) if r.get("pickup_at") else None,
        "created_at": str(r["created_at"]) if r.get("created_at") else None,
        "updated_at": str(r["updated_at"]) if r.get("updated_at") else None,
    }


def _get_conn(cur, card_id: int) -> dict[str, Any]:
    cur.execute("SELECT * FROM iki_factory_cards WHERE id = %s", (card_id,))
    row = cur.fetchone()
    if not row:
        raise FactoryError("card not found")
    return dict(row)


def get_card(card_id: int) -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return _row(_get_conn(cur, card_id))


def list_cards(*, card_status: str = "active") -> list[dict[str, Any]]:
    if card_status not in CARD_STATUSES and card_status != "all":
        raise FactoryError("invalid card_status")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if card_status == "all":
                cur.execute(
                    "SELECT * FROM iki_factory_cards ORDER BY id ASC"
                )
            else:
                cur.execute(
                    "SELECT * FROM iki_factory_cards WHERE card_status = %s ORDER BY id ASC",
                    (card_status,),
                )
            return [_row(dict(r)) for r in cur.fetchall()]


def _log(
    cur,
    card_id: int,
    *,
    from_lane: str | None,
    to_lane: str,
    actor: Actor,
    reason: str,
    auto: bool,
) -> None:
    cur.execute(
        """
        INSERT INTO iki_factory_transitions
          (card_id, from_lane, to_lane, auto_move, actor_kind, actor_id, actor_label, reason)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            card_id,
            from_lane,
            to_lane,
            1 if auto else 0,
            actor.kind,
            int(actor.id),
            actor.label,
            reason,
        ),
    )


def _set_blocked(cur, card_id: int, reason: str) -> dict[str, Any]:
    cur.execute(
        "UPDATE iki_factory_cards SET blocked_reason = %s WHERE id = %s",
        (reason, card_id),
    )
    return _row(_get_conn(cur, card_id))


def _product_complete(card: dict[str, Any]) -> bool:
    paid = str(card.get("free_vs_paid") or "").strip().lower()
    return bool(
        str(card.get("product_type") or "").strip()
        and str(card.get("product_tier") or "").strip()
        and paid in FREE_VS_PAID
    )


def _publication_hash(card: dict[str, Any]) -> str:
    payload = json.dumps(
        {
            "title": card.get("title") or "",
            "spec_md": card.get("spec_md") or "",
            "plan_ref": card.get("plan_ref") or "",
            "product_type": card.get("product_type") or "",
            "product_tier": card.get("product_tier") or "",
            "free_vs_paid": card.get("free_vs_paid") or "",
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _live_public(card: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": card["id"],
        "title": card["title"],
        "live_at": card.get("live_at"),
        "product_type": card.get("product_type"),
        "product_tier": card.get("product_tier"),
        "free_vs_paid": card.get("free_vs_paid"),
        "publication_hash": card.get("publication_hash"),
        "published": bool(card.get("published")),
        "obtainable": bool(card.get("obtainable")),
    }


def list_live() -> list[dict[str, Any]]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM iki_factory_cards
                 WHERE lane = 'live'
                   AND published = 1
                   AND card_status IN ('active', 'rework')
                 ORDER BY live_at DESC, id DESC
                """
            )
            return [_live_public(_row(dict(r))) for r in cur.fetchall()]


def list_publication_signals() -> list[dict[str, Any]]:
    return [
        {
            "id": c["id"],
            "title": c["title"],
            "live_at": c.get("live_at"),
            "content_hash": c.get("publication_hash"),
        }
        for c in list_live()
    ]


def get_live(card_id: int) -> dict[str, Any]:
    card = get_card(card_id)
    if card["lane"] != "live" or not card.get("published"):
        raise FactoryError("card not found")
    out = _live_public(card)
    out["spec_md"] = card.get("spec_md")
    return out


def _set_waiting(card_id: int, reason: str) -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET waiting_reason = %s, blocked_reason = NULL
                 WHERE id = %s
                """,
                (reason, card_id),
            )
            return _row(_get_conn(cur, card_id))


def _set_failed(card_id: int, reason: str) -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET failed_reason = %s, blocked_reason = %s
                 WHERE id = %s
                """,
                (reason, reason, card_id),
            )
            return _row(_get_conn(cur, card_id))


def _is_admin_human(actor: Actor) -> bool:
    return actor.kind == "human" and (actor.role or "") == "administrator"


def _notify_factory(card: dict[str, Any], event: str, body: str) -> None:
    try:
        import notify

        notify.notify_admins(
            kind=f"factory.{event}",
            title=f"IKI Factory: {card.get('title') or 'card'}",
            body=body,
            href="/app/iki/factory",
            resource_type="iki_factory_card",
            resource_id=str(card.get("id") or ""),
        )
    except Exception:
        log.exception(
            "factory notify failed event=%s card=%s",
            event,
            card.get("id"),
        )


def _compose_spec_md(raw: dict[str, Any]) -> str:
    sources = _json_field(raw.get("sources_json")) or []
    lines = ["# Template Specification", "", "## Proposal", str(raw.get("title") or "")]
    notes = (raw.get("notes") or "").strip()
    if notes:
        lines += ["", "## Admin notes", notes]
    reason = (raw.get("rank_reason") or "").strip()
    if reason:
        lines += ["", "## Rank reason", reason]
    if isinstance(sources, list) and sources:
        lines += ["", "## Sources"]
        lines += [f"- {s}" for s in sources]
    lines += [
        "",
        "## Plan",
        "Implementation proceeds only against an Admin-attached repo plan. "
        "Attaching the plan is Spec approval.",
    ]
    return "\n".join(lines).strip() + "\n"


def _draft_spec(cur, card_id: int) -> None:
    raw = _get_conn(cur, card_id)
    spec_md = _compose_spec_md(raw)
    waiting = None if str(raw.get("plan_ref") or "").strip() else WAITING_PLAN
    cur.execute(
        """
        UPDATE iki_factory_cards
           SET spec_md = %s,
               spec_ready = 1,
               waiting_reason = %s,
               blocked_reason = NULL
         WHERE id = %s
        """,
        (spec_md, waiting, card_id),
    )


def _mark_built(cur, card_id: int) -> None:
    cur.execute(
        """
        UPDATE iki_factory_cards
           SET built_ready = 1,
               waiting_reason = NULL,
               blocked_reason = NULL
         WHERE id = %s
        """,
        (card_id,),
    )


def execute_deploy(
    card_id: int,
    actor: Actor,
    *,
    reason: str | None = None,
) -> dict[str, Any]:
    """Write Published first. Woo stub after. Never pull back to Build.

    IF-7: this is the pull itself — Live is Coach's (the product-spec
    completeness check below is the human promotion, invariant #7), but the
    act of pulling a build-ready, product-complete card to Live is an
    explicit, actor-recorded call, never a side effect of anything else.
    """
    card = get_card(card_id)
    if card["lane"] == "live" and card.get("published"):
        return card
    if card["lane"] != "build":
        raise FactoryError("Deploy only from Build.")
    if card.get("hold"):
        return card
    if not card.get("built_ready") or not _product_complete(card):
        return _set_waiting(card_id, WAITING_PRODUCT)
    pub_hash = _publication_hash(card)
    reason_s = (reason or "").strip() or DEPLOY_REASON
    free = str(card.get("free_vs_paid") or "").strip().lower() == "free"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET lane = 'live',
                       live_at = UTC_TIMESTAMP(),
                       publication_hash = %s,
                       published = 1,
                       obtainable = %s,
                       store_visible = 0,
                       woo_product_id = NULL,
                       waiting_reason = NULL,
                       blocked_reason = NULL,
                       failed_reason = NULL,
                       auto_move_reason = %s
                 WHERE id = %s
                """,
                (pub_hash, 1 if free else 0, reason_s, card_id),
            )
            _log(
                cur,
                card_id,
                from_lane="build",
                to_lane="live",
                actor=actor,
                reason=reason_s,
                auto=False,
            )
    published = get_card(card_id)
    import iki_factory_woo as woo

    step = woo.woo_step(published)
    woo_reason = str(step.get("reason") or woo.WOO_STUB_REASON)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET woo_reason = %s,
                       store_visible = 0,
                       woo_product_id = NULL
                 WHERE id = %s AND lane = 'live' AND published = 1
                """,
                (woo_reason, card_id),
            )
    out = get_card(card_id)
    _notify_factory(
        out,
        "live",
        "Published. Woo step stubbed — store interface is a later program.",
    )
    return out


def validate_move(
    card: dict[str, Any],
    to_lane: str,
    actor: Actor,
) -> str | None:
    """Return reject reason, or None if allowed.

    IF-7 (v1.0 §3.1, §3.3): pull, not push. Every move here is an explicit
    pull by an actor — there is no more "auto" case to carve an exception
    for, so Hold blocks unconditionally, at every lane, for everyone.
    """
    if to_lane not in LANES:
        return "Unknown lane."
    current = card["lane"]
    if to_lane == current:
        return None
    if card.get("card_status") not in ("active", "rework"):
        return "Archived or trashed cards cannot move."

    from_i = LANES.index(current)
    to_i = LANES.index(to_lane)
    forward = to_i > from_i
    one_step = to_i == from_i + 1

    if bool(card.get("hold")):
        return HOLD_REASON

    if forward and not one_step:
        return ONE_STEP

    if current == "research" and to_lane == "spec":
        if not _is_admin_human(actor):
            return ADMIN_ONLY_RS
        return None

    if current == "spec" and to_lane == "build":
        if not card.get("spec_ready") or not str(card.get("plan_ref") or "").strip():
            return WAITING_PLAN
        return None

    if current == "build" and to_lane == "live":
        if not card.get("built_ready"):
            return "waiting for Built-ready"
        if not _product_complete(card):
            return WAITING_PRODUCT
        return None

    if forward:
        if current == "backlog" and to_lane == "research":
            return None
        return ONE_STEP

    # Backward: Admin only. Gemba does not choose Rework/return lane.
    if not _is_admin_human(actor):
        return GEMBA_REWORK
    return None


def create_idea(
    actor: Actor,
    *,
    title: str,
    notes: str | None = None,
    description: str | None = None,
    originator_kind: str | None = None,
    originator_label: str | None = None,
) -> dict[str, Any]:
    """Backlog create (Spec v1.0 §2.1, §4). Lands in the backlog lane and
    stays there — nothing advances itself (IF-7, v1.0 §3.1). A separate,
    explicit pull is required to move it anywhere. Originator is set at
    this boundary, not editable afterward — it is the provenance record,
    not a card field.

    Priority is cut (v1.0 §2.2, IF-7) — not accepted, not stored, not
    returned. A `priority` key in the request body is silently ignored,
    matching this route's existing lenient-create-body convention; it is
    not treated as an error the way an unknown `patch` field is.
    """
    title = (title or "").strip()
    if not title:
        raise FactoryError("title is required")
    if not _is_admin_human(actor):
        raise FactoryError("Only an administrator may deposit to the backlog.")

    ok = (originator_kind or "coach").strip().lower()
    if ok not in ORIGINATOR_KINDS:
        raise FactoryError("originator_kind must be one of: " + ", ".join(ORIGINATOR_KINDS))
    if ok == "outside" and not str(originator_label or "").strip():
        raise FactoryError("originator_label is required when originator_kind is outside")
    # A human admin creating a card is Coach's own deposit unless explicitly
    # flagged as originating outside the platform (§4.1, §4.2 — legal record).
    label = str(originator_label or "").strip() or (actor.label if ok == "coach" else None)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO iki_factory_cards
                  (title, description, originator_kind, originator_label,
                   notes, lane, owner_identity_id, waiting_reason)
                VALUES (%s, %s, %s, %s, %s, 'backlog', %s, NULL)
                """,
                (title, description, ok, label, notes, int(actor.id)),
            )
            card_id = int(cur.lastrowid)
            _log(
                cur,
                card_id,
                from_lane=None,
                to_lane="backlog",
                actor=actor,
                reason="Deposited to the backlog.",
                auto=False,
            )
            row = _row(_get_conn(cur, card_id))
    return row


def move_card(
    card_id: int,
    actor: Actor,
    *,
    to_lane: str,
    reason: str | None = None,
) -> dict[str, Any]:
    """Pull, not push (IF-7, v1.0 §3.1, §3.3). Every call is an explicit,
    actor-initiated move. Nothing here triggers a further move as a side
    effect — landing in Spec or Build no longer chains onward by itself;
    the next lane is a separate pull. Actor and reason are always recorded
    on the transition (charter invariant 4)."""
    to_lane = (to_lane or "").strip().lower()
    rejected: tuple[str, dict[str, Any]] | None = None
    deploy_after = False
    pulled_to_research = False
    out: dict[str, Any] | None = None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            raw = _get_conn(cur, card_id)
            card = _row(raw)
            reject = validate_move(raw, to_lane, actor)
            if reject:
                blocked = _set_blocked(cur, card_id, reject)
                rejected = (reject, blocked)
            elif to_lane == card["lane"]:
                return card
            elif to_lane == "live":
                deploy_after = True
            else:
                move_reason = (reason or "").strip() or f"Pulled by {actor.label}."
                cur.execute(
                    """
                    UPDATE iki_factory_cards
                       SET lane = %s,
                           blocked_reason = NULL,
                           auto_move_reason = NULL,
                           waiting_reason = NULL
                     WHERE id = %s
                    """,
                    (to_lane, card_id),
                )
                _log(
                    cur,
                    card_id,
                    from_lane=card["lane"],
                    to_lane=to_lane,
                    actor=actor,
                    reason=move_reason,
                    auto=False,
                )
                if to_lane == "spec":
                    _draft_spec(cur, card_id)
                if to_lane == "build":
                    _mark_built(cur, card_id)
                if to_lane == "research":
                    from iki_factory_research import attempt_research

                    attempt_research(cur, card_id)
                    pulled_to_research = True
                out = _row(_get_conn(cur, card_id))
    if rejected:
        raise FactoryMoveError(rejected[0], rejected[1])
    if deploy_after:
        return execute_deploy(card_id, actor, reason=reason)
    assert out is not None
    if pulled_to_research:
        from iki_factory_research import _IMPLS, list_skills, run_registered_skills

        skills = list_skills()
        if skills and all((s["skill_id"], s["version"]) in _IMPLS for s in skills):
            run_registered_skills(
                out["id"], {"title": out["title"], "notes": out.get("notes")}
            )
        return get_card(out["id"])
    if out["lane"] == "spec":
        _notify_factory(
            out,
            "spec_ready",
            "Spec-ready. Attach a repo plan, then pull it to Build.",
        )
        return out
    if out["lane"] == "build" and out.get("built_ready"):
        _notify_factory(
            out,
            "built_ready",
            "Build complete against the attached plan + Spec.",
        )
        return out
    return get_card(out["id"])


def patch_card(card_id: int, actor: Actor, body: dict[str, Any]) -> dict[str, Any]:
    """IF-7: patching a card never moves it. The spec-ready/plan-attached and
    built-ready/product-complete auto-advance this used to perform on any
    successful patch is gone (Delta IF-6-G, not-measured item 4) — a patch
    only ever patches. Advancing lanes is always a separate, explicit pull.

    Priority is cut (v1.0 §2.2) and is no longer an allowed field — patching
    it now fails loud with "unknown field", the same as any other retired
    or never-existed field, rather than silently accepted (create's lenient
    body convention does not apply here; patch has always been strict).
    """
    if not _is_admin_human(actor):
        raise FactoryError("Only an administrator may edit card fields.")
    allowed = {
        "title",
        "description",
        "notes",
        "owner_identity_id",
        "hold",
        "plan_ref",
        "product_type",
        "product_tier",
        "free_vs_paid",
    }
    unknown = set(body) - allowed
    if unknown:
        raise FactoryError(f"unknown field: {sorted(unknown)[0]}")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            raw = _get_conn(cur, card_id)
            title = raw["title"]
            description = raw.get("description")
            notes = raw.get("notes")
            owner = int(raw["owner_identity_id"])
            hold = int(raw["hold"])
            plan_ref = raw.get("plan_ref")
            product_type = raw.get("product_type")
            product_tier = raw.get("product_tier")
            free_vs_paid = raw.get("free_vs_paid")
            if "title" in body:
                title = str(body["title"] or "").strip()
                if not title:
                    raise FactoryError("title is required")
            if "description" in body:
                description = body["description"]
            if "notes" in body:
                notes = body["notes"]
            if "owner_identity_id" in body:
                owner = int(body["owner_identity_id"])
            if "hold" in body:
                hold = 1 if body["hold"] else 0
            if "plan_ref" in body:
                plan_ref = (str(body["plan_ref"]).strip() or None) if body["plan_ref"] is not None else None
            if "product_type" in body:
                product_type = (
                    (str(body["product_type"]).strip() or None)
                    if body["product_type"] is not None
                    else None
                )
            if "product_tier" in body:
                product_tier = (
                    (str(body["product_tier"]).strip() or None)
                    if body["product_tier"] is not None
                    else None
                )
            if "free_vs_paid" in body:
                if body["free_vs_paid"] is None or str(body["free_vs_paid"]).strip() == "":
                    free_vs_paid = None
                else:
                    free_vs_paid = str(body["free_vs_paid"]).strip().lower()
                    if free_vs_paid not in FREE_VS_PAID:
                        raise FactoryError("free_vs_paid must be free or paid")
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET title = %s,
                       description = %s,
                       notes = %s,
                       owner_identity_id = %s,
                       hold = %s,
                       plan_ref = %s,
                       product_type = %s,
                       product_tier = %s,
                       free_vs_paid = %s
                 WHERE id = %s
                """,
                (
                    title,
                    description,
                    notes,
                    owner,
                    hold,
                    plan_ref,
                    product_type,
                    product_tier,
                    free_vs_paid,
                    card_id,
                ),
            )
    return get_card(card_id)


def set_status(
    card_id: int,
    actor: Actor,
    *,
    card_status: str,
    rework_lane: str | None = None,
) -> dict[str, Any]:
    card_status = (card_status or "").strip().lower()
    if card_status not in CARD_STATUSES:
        raise FactoryError("invalid card_status")
    if not _is_admin_human(actor):
        raise FactoryError("Only an administrator may archive, trash, or rework.")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            raw = _get_conn(cur, card_id)
            to_lane = raw["lane"]
            if card_status == "rework":
                dest = (rework_lane or "").strip().lower()
                if dest not in LANES or dest == "live":
                    raise FactoryError("Rework destination must be an earlier Factory lane.")
                to_lane = dest
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET card_status = %s,
                       lane = %s,
                       blocked_reason = NULL
                 WHERE id = %s
                """,
                (card_status, to_lane, card_id),
            )
            _log(
                cur,
                card_id,
                from_lane=raw["lane"],
                to_lane=to_lane,
                actor=actor,
                reason=f"Admin set status {card_status}.",
                auto=False,
            )
            return _row(_get_conn(cur, card_id))


def list_transitions(card_id: int) -> list[dict[str, Any]]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _get_conn(cur, card_id)
            cur.execute(
                """
                SELECT * FROM iki_factory_transitions
                 WHERE card_id = %s ORDER BY id ASC
                """,
                (card_id,),
            )
            out = []
            for r in cur.fetchall():
                out.append(
                    {
                        "id": int(r["id"]),
                        "card_id": int(r["card_id"]),
                        "from_lane": r.get("from_lane"),
                        "to_lane": r["to_lane"],
                        "auto_move": bool(r["auto_move"]),
                        "actor_kind": r["actor_kind"],
                        "actor_id": int(r["actor_id"]),
                        "actor_label": r["actor_label"],
                        "reason": r.get("reason"),
                        "created_at": str(r["created_at"]) if r.get("created_at") else None,
                    }
                )
            return out


def _attachment_row(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": int(r["id"]),
        "card_id": int(r["card_id"]),
        "kind": r["kind"],
        "url": r.get("url"),
        "label": r.get("label"),
        "filename": r.get("filename"),
        "content_type": r.get("content_type"),
        "size_bytes": int(r["size_bytes"]) if r.get("size_bytes") is not None else None,
        "created_by_kind": r.get("created_by_kind"),
        "created_by_id": int(r["created_by_id"]) if r.get("created_by_id") is not None else None,
        "created_by_label": r.get("created_by_label"),
        "created_at": str(r["created_at"]) if r.get("created_at") else None,
    }


def list_attachments(card_id: int) -> list[dict[str, Any]]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _get_conn(cur, card_id)
            cur.execute(
                "SELECT * FROM iki_factory_card_attachments WHERE card_id = %s ORDER BY id ASC",
                (card_id,),
            )
            return [_attachment_row(dict(r)) for r in cur.fetchall()]


def add_link_attachment(
    card_id: int, actor: Actor, *, url: str, label: str | None = None
) -> dict[str, Any]:
    """Attachments are often the whole substance of the item (§2.3) — no
    invention here, just recording what was handed over."""
    if not _is_admin_human(actor):
        raise FactoryError("Only an administrator may add attachments.")
    url = (url or "").strip()
    if not url:
        raise FactoryError("url is required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _get_conn(cur, card_id)
            cur.execute(
                """
                INSERT INTO iki_factory_card_attachments
                  (card_id, kind, url, label, created_by_kind, created_by_id, created_by_label)
                VALUES (%s, 'link', %s, %s, %s, %s, %s)
                """,
                (card_id, url, (label or "").strip() or None, actor.kind, int(actor.id), actor.label),
            )
            aid = int(cur.lastrowid)
            cur.execute("SELECT * FROM iki_factory_card_attachments WHERE id = %s", (aid,))
            return _attachment_row(dict(cur.fetchone()))


def add_upload_attachment(
    card_id: int,
    actor: Actor,
    *,
    filename: str,
    content_type: str,
    size_bytes: int,
    storage_path: str,
    served_url: str,
    label: str | None = None,
) -> dict[str, Any]:
    """Domain-side record for a file already written to disk by the route
    (io/storage decisions are the route's job — this just records provenance,
    matching the link-attachment path's shape)."""
    if not _is_admin_human(actor):
        raise FactoryError("Only an administrator may add attachments.")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _get_conn(cur, card_id)
            cur.execute(
                """
                INSERT INTO iki_factory_card_attachments
                  (card_id, kind, url, label, filename, content_type, size_bytes,
                   storage_path, created_by_kind, created_by_id, created_by_label)
                VALUES (%s, 'upload', %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    card_id,
                    served_url,
                    (label or "").strip() or None,
                    filename,
                    content_type,
                    int(size_bytes),
                    storage_path,
                    actor.kind,
                    int(actor.id),
                    actor.label,
                ),
            )
            aid = int(cur.lastrowid)
            cur.execute("SELECT * FROM iki_factory_card_attachments WHERE id = %s", (aid,))
            return _attachment_row(dict(cur.fetchone()))


def get_attachment(card_id: int, attachment_id: int) -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM iki_factory_card_attachments WHERE id = %s AND card_id = %s",
                (attachment_id, card_id),
            )
            row = cur.fetchone()
            if not row:
                raise FactoryError("attachment not found")
            return _attachment_row(dict(row))


def delete_attachment(card_id: int, attachment_id: int, actor: Actor) -> None:
    if not _is_admin_human(actor):
        raise FactoryError("Only an administrator may remove attachments.")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM iki_factory_card_attachments WHERE id = %s AND card_id = %s",
                (attachment_id, card_id),
            )
            if cur.rowcount == 0:
                raise FactoryError("attachment not found")
