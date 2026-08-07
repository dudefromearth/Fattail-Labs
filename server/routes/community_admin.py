"""Admin Community / Discord channel map (C1d-lite).

Spec: FatTail-Labs-Community-App-Spec-v1.0.md §5.3 · §9
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import community_domain as cdom
import db
from guards import require_admin

router = APIRouter(tags=["community-admin"])


def _domain_http(exc: cdom.CommunityDomainError) -> HTTPException:
    return HTTPException(status_code=exc.status, detail=exc.message)


@router.get("/api/admin/community")
def admin_community_overview(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return cdom.admin_overview(cur)


@router.get("/api/admin/community/channels")
def admin_list_channels(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return {
                "channels": cdom.list_channels(cur, include_archived=True),
                "default_guild_id": cdom.default_guild_id(),
            }


@router.post("/api/admin/community/channels")
async def admin_create_channel(request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="JSON object required")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                ch = cdom.create_channel(
                    cur,
                    title=str(body.get("title") or ""),
                    description=str(body.get("description") or ""),
                    kind=str(body.get("kind") or "topic"),
                    app_key=body.get("app_key"),
                    discord_guild_id=body.get("discord_guild_id"),
                    discord_channel_id=body.get("discord_channel_id"),
                    sort_order=body.get("sort_order"),
                    slug=body.get("slug"),
                )
        return {"channel": ch}
    except cdom.CommunityDomainError as exc:
        raise _domain_http(exc) from exc


@router.patch("/api/admin/community/channels/{public_id}")
async def admin_patch_channel(public_id: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="JSON object required")
    kwargs: dict = {}
    if "title" in body:
        kwargs["title"] = body["title"]
    if "description" in body:
        kwargs["description"] = body["description"]
    if "kind" in body:
        kwargs["kind"] = body["kind"]
    if "app_key" in body:
        kwargs["app_key"] = body["app_key"]
    if "discord_guild_id" in body:
        kwargs["discord_guild_id"] = body["discord_guild_id"]
    if "discord_channel_id" in body:
        kwargs["discord_channel_id"] = body["discord_channel_id"]
    if "sort_order" in body:
        kwargs["sort_order"] = body["sort_order"]
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                ch = cdom.update_channel(cur, public_id, **kwargs)
        return {"channel": ch}
    except cdom.CommunityDomainError as exc:
        raise _domain_http(exc) from exc


@router.post("/api/admin/community/channels/{public_id}/archive")
def admin_archive_channel(public_id: str, request: Request) -> dict:
    require_admin(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                ch = cdom.archive_channel(cur, public_id)
        return {"channel": ch}
    except cdom.CommunityDomainError as exc:
        raise _domain_http(exc) from exc


@router.post("/api/admin/community/apply-default-guild")
def admin_apply_default_guild(request: Request) -> dict:
    """Stamp LABS_DISCORD_GUILD_ID onto active channels missing guild id."""
    require_admin(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                return cdom.apply_default_guild_to_unmapped(cur)
    except cdom.CommunityDomainError as exc:
        raise _domain_http(exc) from exc
