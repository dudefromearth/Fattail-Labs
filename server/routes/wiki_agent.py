"""Wiki Agent portal — contracts + session lifecycle (Spec v0.1.3 WA-4)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import wiki_agent_schema as schema
import wiki_agent_session as session
import wiki_agent_store as store
from config import ConfigError
from guards import require_actor, require_admin, resolve_actor
from wiki_agent_schema import ContractSchemaError, SourceEnvelopeIncomplete
from wiki_agent_store import SessionSealedError

router = APIRouter(tags=["wiki-agent"])


def _bearer(request: Request) -> str:
    raw = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    if raw.lower().startswith("bearer "):
        return raw[7:].strip()
    return ""


def _reject_agent_session(request: Request, envelope: dict | None = None) -> None:
    if _bearer(request).startswith("ftl_ag_"):
        _reject(envelope or {}, "agent", "session_requires_human", 403)


def _require_human_admin(request: Request) -> dict:
    _reject_agent_session(request)
    return require_admin(request)


def _reject(envelope: dict, principal: str, reason: str, status_code: int) -> None:
    row = store.insert_contract(
        envelope=envelope
        if envelope
        else {
            "contract_version": "",
            "kind": "",
            "source": "",
            "refs": [],
            "payload": {},
        },
        principal=principal,
        status="rejected",
        reject_reason=reason,
    )
    raise HTTPException(
        status_code=status_code,
        detail={"reject_reason": reason, "contract_id": row["contract_id"]},
    )


@router.get("/api/wiki-agent/context")
def get_context(request: Request, route: str = "") -> dict:
    """Resolve registered context providers. Admin-only. Fail-loud if env missing."""
    _require_human_admin(request)
    import wiki_agent_context as ctxmod

    path = (route or "").strip()
    if not path:
        raise HTTPException(status_code=400, detail="route required")
    try:
        return ctxmod.resolve(path)
    except ConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/api/wiki-agent/session/affordance")
def session_affordance(request: Request) -> dict:
    """Admin-only probe. Non-admin (and agent bearer) get 404 — do not advertise."""
    if _bearer(request).startswith("ftl_ag_"):
        raise HTTPException(status_code=404, detail="Not found")
    try:
        require_admin(request)
    except HTTPException as exc:
        if exc.status_code in (401, 403):
            raise HTTPException(status_code=404, detail="Not found") from exc
        raise
    return {"render": True}


@router.get("/api/wiki-agent/linkage-queue")
def get_linkage_queue(request: Request) -> dict:
    _require_human_admin(request)
    import wiki_agent_linkage as linkage

    return {"queued": linkage.queued_count()}


@router.post("/api/wiki-agent/linkage-queue/drain")
def drain_linkage_queue(request: Request) -> dict:
    _require_human_admin(request)
    import wiki_agent_linkage as linkage
    import wiki_store

    try:
        n = session.drain_n()
    except ConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return linkage.drain_to_board(n, wiki_store.wiki_root())


@router.post("/api/wiki-agent/contracts/{contract_id}/turns")
def post_turn(contract_id: str, request: Request, body: dict | None = None) -> dict:
    _require_human_admin(request)
    raw = body if isinstance(body, dict) else {}
    content = str(raw.get("content") or "")
    try:
        return session.append_admin_turn(contract_id, content)
    except KeyError:
        raise HTTPException(status_code=404, detail="Not found") from None
    except SessionSealedError:
        raise HTTPException(
            status_code=409,
            detail={"reject_reason": "session_sealed", "contract_id": contract_id},
        ) from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/wiki-agent/contracts/{contract_id}/seal")
def post_seal(contract_id: str, request: Request) -> dict:
    _require_human_admin(request)
    row = store.get_contract(contract_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    if row.get("kind") != "session":
        raise HTTPException(status_code=400, detail="not_session")
    try:
        return store.seal_contract(contract_id)
    except SessionSealedError:
        raise HTTPException(
            status_code=409,
            detail={"reject_reason": "session_sealed", "contract_id": contract_id},
        ) from None
    except KeyError:
        raise HTTPException(status_code=404, detail="Not found") from None


@router.post("/api/wiki-agent/contracts/{contract_id}/draft")
def post_session_draft(contract_id: str, request: Request) -> dict:
    _require_human_admin(request)
    try:
        return session.discharge_session(contract_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Not found") from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _source_disposition(row: dict) -> dict:
    status = row["status"]
    out = {
        "contract_id": row["contract_id"],
        "status": status,
        "page_path": "",
        "linkages": [],
        "kind": row.get("kind") or "source_contract",
        "payload": row.get("payload") or {},
        "watermark": None,
    }
    if status != "accepted":
        out["reason"] = row.get("reason") or row.get("failure_reason") or row.get(
            "reject_reason"
        ) or ""
    return out


def _auth_source_contract(request: Request, origin_owner: str, envelope: dict) -> str:
    """Admin cookie or agent with contracts:deliver + registry (allowed_kind=source_contract)."""
    if _bearer(request).startswith("ftl_ag_"):
        actor = require_actor(request, scopes=["contracts:deliver"])
        if actor.kind != "agent":
            _reject(envelope, actor.label, "source_requires_agent", 403)
        src = store.lookup_source(origin_owner)
        if src is None or not src["enabled"]:
            _reject(envelope, actor.label, "unregistered_principal", 403)
        if src["principal_callsign"] != actor.label:
            _reject(envelope, actor.label, "unregistered_principal", 403)
        if src["allowed_kind"] != "source_contract":
            _reject(envelope, actor.label, "unregistered_principal", 403)
        return actor.label
    claims = require_admin(request)
    return str(claims["identity_id"])


def _post_source_contract(request: Request, raw: dict) -> dict:
    """Source Contract v0.1.4 — validate, ledger disposition, watermark. No compose."""
    stub = {
        "contract_version": "0.1.4",
        "kind": "source_contract",
        "source": str(raw.get("origin_owner") or ""),
        "refs": [],
        "payload": {k: v for k, v in raw.items() if v not in (None, "")},
    }
    try:
        parsed = schema.parse_source_envelope(raw)
        incomplete_reason = ""
    except ContractSchemaError as exc:
        principal = "unknown"
        try:
            actor = resolve_actor(request)
            if actor is not None:
                principal = actor.label
        except Exception:
            pass
        _reject(stub, principal, exc.reason, 400)
        raise AssertionError("unreachable")
    except SourceEnvelopeIncomplete as exc:
        parsed = None
        incomplete_reason = exc.reason

    principal = _auth_source_contract(request, stub["source"], stub)

    if parsed is None:
        row = store.insert_contract(
            envelope=stub,
            principal=principal,
            status="failed-partial",
            failure_reason=incomplete_reason,
        )
        return _source_disposition(row)

    row = store.insert_contract(
        envelope={
            "contract_version": "0.1.4",
            "kind": "source_contract",
            "source": parsed["origin_owner"],
            "refs": [],
            "payload": parsed,
        },
        principal=principal,
        status="accepted",
    )
    mark = store.upsert_watermark(
        source_kind=parsed["source_kind"],
        source_id=parsed["source_id"],
        content_hash=parsed["content_hash"],
        contract_id=row["contract_id"],
    )
    out = _source_disposition(row)
    out["watermark"] = {
        "source_kind": mark["source_kind"],
        "source_id": mark["source_id"],
        "content_hash": mark["content_hash"],
        "seen_at": mark["seen_at"],
    }
    return out


@router.post("/api/wiki-agent/push")
def post_push(request: Request, body: dict | None = None) -> dict:
    """S7 delivery point — artifact + intent only. Admin cookie. No schema form."""
    _require_human_admin(request)
    claims = require_admin(request)
    raw = body if isinstance(body, dict) else {}
    extra = set(raw.keys()) - {"artifact", "intent"}
    if extra:
        raise HTTPException(status_code=400, detail="unknown_field")
    import wiki_agent_push as push

    return push.push_handoff(
        artifact=str(raw.get("artifact") or ""),
        intent=str(raw.get("intent") or ""),
        origin_owner=f"admin:{claims['identity_id']}",
    )


@router.post("/api/wiki-agent/contracts")
def post_contract(request: Request, body: dict | None = None) -> dict:
    raw = body if isinstance(body, dict) else {}
    if schema.has_source_kind(raw):
        return _post_source_contract(request, raw)
    kind_hint = str(raw.get("kind") or "")
    try:
        envelope = schema.parse_envelope(raw)
    except ContractSchemaError as exc:
        principal = "unknown"
        try:
            actor = resolve_actor(request)
            if actor is not None:
                principal = actor.label
        except Exception:
            pass
        _reject(
            {
                "contract_version": str(raw.get("contract_version") or ""),
                "kind": kind_hint,
                "source": str(raw.get("source") or ""),
                "refs": raw.get("refs") if isinstance(raw.get("refs"), list) else [],
                "payload": raw.get("payload") if isinstance(raw.get("payload"), dict) else {},
            },
            principal,
            exc.reason,
            400,
        )

    if envelope["kind"] == "session":
        if _bearer(request).startswith("ftl_ag_"):
            _reject(envelope, "agent", "session_requires_human", 403)
        claims = require_admin(request)
        principal = str(claims["identity_id"])
        envelope["payload"]["admin"] = int(claims["identity_id"])
        envelope["payload"]["transcript"] = []
        ctx = envelope["payload"]["context"]
        if ctx.get("entity") is None:
            import wiki_agent_context as ctxmod

            try:
                filled = ctxmod.enrich(str(ctx.get("route") or ""))
            except ConfigError as exc:
                raise HTTPException(status_code=500, detail=str(exc)) from exc
            if filled is not None:
                ctx["entity"] = filled
        for ref in envelope["refs"]:
            if ref.get("kind") == "wiki_contract":
                prior = store.get_contract(str(ref.get("id") or ""))
                if prior is None or not prior.get("sealed_at"):
                    _reject(envelope, principal, "follow_on_unsealed", 400)
        row = store.insert_contract(
            envelope=envelope, principal=principal, status="validated"
        )
        return session.apply_opening(row["contract_id"])

    actor = require_actor(request, scopes=["contracts:deliver"])
    if actor.kind != "agent":
        _reject(envelope, actor.label, "source_requires_agent", 403)
    src = store.lookup_source(envelope["source"])
    if src is None or not src["enabled"]:
        _reject(envelope, actor.label, "unregistered_principal", 403)
    if src["principal_callsign"] != actor.label:
        _reject(envelope, actor.label, "unregistered_principal", 403)
    if src["allowed_kind"] != envelope["kind"]:
        _reject(envelope, actor.label, "unregistered_principal", 403)
    row = store.insert_contract(
        envelope=envelope, principal=actor.label, status="validated"
    )
    return row


@router.get("/api/wiki-agent/contracts/{contract_id}")
def get_contract(contract_id: str, request: Request) -> dict:
    actor = resolve_actor(request)
    if actor is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    if actor.kind == "human":
        require_admin(request)
    elif not actor.has_scopes(["contracts:deliver"]):
        raise HTTPException(status_code=403, detail="Agent missing required scopes")
    row = store.get_contract(contract_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    if row.get("kind") == "source_contract":
        out = _source_disposition(row)
        payload = row.get("payload") or {}
        mark = store.get_watermark(
            str(payload.get("source_kind") or ""),
            str(payload.get("source_id") or ""),
        )
        if mark is not None:
            out["watermark"] = {
                "source_kind": mark["source_kind"],
                "source_id": mark["source_id"],
                "content_hash": mark["content_hash"],
                "seen_at": mark["seen_at"],
            }
        return out
    return row
