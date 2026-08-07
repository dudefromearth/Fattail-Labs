"""Community app member API — shell + second-window messages.

Spec: FatTail-Labs-Community-App-Spec-v1.0.md v1.0.2
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import community_domain as cdom
import db
import identity as identity_mod
from guards import require_session
from labs_discord.config import bridge_config
from labs_discord import sync as dsync

router = APIRouter(tags=["community-app"])


def _iid(claims: dict) -> int | None:
    try:
        v = int(claims.get("identity_id") or 0)
        return v if v > 0 else None
    except (TypeError, ValueError):
        return None


def _role(claims: dict) -> str:
    return str(claims.get("role") or "observer")


def _require_chat_access(claims: dict) -> None:
    """Signed-in + Discord-included tier (Spec §8.2). Alumni excluded."""
    role = _role(claims)
    if role == "administrator":
        return
    if role in ("observer", "activator", "navigator"):
        return
    raise HTTPException(
        status_code=403,
        detail="Community chat is for active Discord-included memberships",
    )


def _domain_http(exc: cdom.CommunityDomainError) -> HTTPException:
    return HTTPException(status_code=exc.status, detail=exc.message)


@router.get("/api/me/community/board")
def community_board(request: Request) -> dict:
    claims = require_session(request)
    _require_chat_access(claims)
    iid = _iid(claims)
    cfg = bridge_config()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            payload = cdom.board_payload(cur, identity_id=iid)
    payload["message_sync"] = {
        "enabled": bool(cfg.enabled and cfg.bot_token),
        "phase": "C1c",
        "note": (
            "Live second window: Discord ↔ Labs when bridge is on and channels are mapped."
            if cfg.enabled
            else "Set LABS_DISCORD_BRIDGE=1 and bot token; map channels in Admin → Community."
        ),
    }
    return payload


@router.get("/api/me/community/channels")
def list_channels(request: Request) -> dict:
    claims = require_session(request)
    _require_chat_access(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return {"channels": cdom.list_channels(cur)}


@router.get("/api/me/community/channels/{slug}")
def get_channel(slug: str, request: Request) -> dict:
    claims = require_session(request)
    _require_chat_access(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            ch = cdom.get_channel_by_slug(cur, slug)
            if not ch:
                raise HTTPException(status_code=404, detail="channel not found")
            return {"channel": ch}


@router.get("/api/me/community/apps/{app_key}/channel")
def channel_for_app(app_key: str, request: Request) -> dict:
    claims = require_session(request)
    _require_chat_access(claims)
    if app_key in cdom.FORBIDDEN_APP_KEYS:
        raise HTTPException(
            status_code=404,
            detail="no community channel for this app",
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            ch = cdom.get_channel_by_app_key(cur, app_key)
            if not ch:
                raise HTTPException(status_code=404, detail="channel not found")
            return {"channel": ch}


@router.get("/api/me/community/shelves/fattail")
def fattail_shelf(request: Request) -> dict:
    require_session(request)
    return cdom.fattail_shelf()


@router.get("/api/me/community/shelves/shares")
def member_shares(request: Request) -> dict:
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return {"shares": cdom.list_community_shares(cur)}


@router.get("/api/me/community/discord/status")
def discord_status(request: Request) -> dict:
    claims = require_session(request)
    iid = _iid(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return cdom.discord_status_for_identity(cur, iid)


@router.get("/api/me/community/channels/{slug}/messages")
def list_messages(slug: str, request: Request, limit: int = 50) -> dict:
    """List mirrored messages; backfill from Discord when bridge is on."""
    claims = require_session(request)
    _require_chat_access(claims)
    cfg = bridge_config()
    backfill_info = None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            ch = cdom.get_channel_by_slug(cur, slug)
            if not ch:
                raise HTTPException(status_code=404, detail="channel not found")
            if cfg.enabled and cfg.bot_token and ch.get("mapped"):
                try:
                    backfill_info = dsync.backfill_channel(cur, slug, limit=min(limit, 50))
                except cdom.CommunityDomainError as exc:
                    raise _domain_http(exc) from exc
            try:
                messages = dsync.list_messages(cur, slug, limit=limit)
            except cdom.CommunityDomainError as exc:
                raise _domain_http(exc) from exc
            discord = cdom.discord_status_for_identity(cur, _iid(claims))
    # Entitled + mapped + bridge: can post (name from Discord link or Labs display)
    return {
        "channel": ch,
        "messages": messages,
        "sync_enabled": bool(cfg.enabled and cfg.bot_token),
        "backfill": backfill_info,
        "can_post": bool(cfg.enabled and cfg.bot_token and ch.get("mapped")),
        "discord": discord,
    }


@router.post("/api/me/community/channels/{slug}/messages")
async def post_message(slug: str, request: Request) -> dict:
    claims = require_session(request)
    _require_chat_access(claims)
    iid = _iid(claims)
    if not iid:
        raise HTTPException(status_code=401, detail="Sign in required")

    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="JSON object required")
    text = str(body.get("body") or body.get("text") or "").strip()

    with db.transaction() as conn:
        with conn.cursor() as cur:
            # North star: enrolled FatTail members are already on Discord.
            # Prefer Discord name from SSO ingest; else Labs display name + via Labs.
            prof = identity_mod.get_discord_profile(cur, iid)
            name = ""
            discord_uid = None
            if prof:
                name = (prof.get("username") or "").strip()
                discord_uid = prof.get("discord_user_id")
            if not name:
                cur.execute(
                    "SELECT display_name, email FROM identities WHERE identity_id = %s",
                    (iid,),
                )
                idrow = cur.fetchone() or {}
                name = (idrow.get("display_name") or "").strip() or (
                    (idrow.get("email") or "").split("@")[0]
                )

            try:
                msg = dsync.send_labs_message(
                    cur,
                    slug=slug,
                    identity_id=iid,
                    body=text,
                    author_display_name=name,
                    discord_author_id=discord_uid,
                )
            except cdom.CommunityDomainError as exc:
                raise _domain_http(exc) from exc
    return {"message": msg}


@router.post("/api/internal/discord/backfill-channel")
async def internal_backfill(request: Request) -> dict:
    """Ops/launchd: backfill one channel. Auth: LABS_DISCORD_INTERNAL_KEY or admin."""
    import os

    key = (os.environ.get("LABS_DISCORD_INTERNAL_KEY") or "").strip()
    authz = (request.headers.get("authorization") or "").strip()
    ok = False
    if key and authz == f"Bearer {key}":
        ok = True
    else:
        try:
            from guards import require_admin

            require_admin(request)
            ok = True
        except HTTPException:
            ok = False
    if not ok:
        raise HTTPException(status_code=401, detail="unauthorized")

    body = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    slug = str((body or {}).get("slug") or request.query_params.get("slug") or "").strip()
    if not slug:
        raise HTTPException(status_code=400, detail="slug required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                return dsync.backfill_channel(cur, slug, limit=100)
            except cdom.CommunityDomainError as exc:
                raise _domain_http(exc) from exc
