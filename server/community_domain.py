"""Community app domain — channels + bot shares + FatTail shelf (C1a).

Spec: FatTail-Labs-Community-App-Spec-v1.0.md v1.0.2
Admin channel map: C1d-lite. Discord message mirror / Gateway: C1c.
"""

from __future__ import annotations

import os
import re
import secrets
from typing import Any

from strategy_packs.packs.butterfly import house_designs as hd

# Seed slugs (Spec §5.2) — never journey / wiki
SEED_CHANNEL_SLUGS: frozenset[str] = frozenset(
    {"general", "practice", "strategy-lab", "toughness"}
)
FORBIDDEN_APP_KEYS: frozenset[str] = frozenset({"journey", "wiki"})
ALLOWED_KINDS: frozenset[str] = frozenset({"app_home", "topic", "system"})
ALLOWED_APP_KEYS: frozenset[str] = frozenset(
    {"practice", "strategy-lab", "toughness"}
)


class CommunityDomainError(Exception):
    def __init__(self, message: str, *, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def _ts(v: Any) -> str | None:
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)


def channel_row(r: dict) -> dict[str, Any]:
    return {
        "id": r["public_id"],
        "slug": r["slug"],
        "title": r["title"],
        "description": r["description"] or "",
        "kind": r["kind"],
        "app_key": r["app_key"],
        "discord_guild_id": r["discord_guild_id"],
        "discord_channel_id": r["discord_channel_id"],
        "sort_order": int(r["sort_order"] or 0),
        "archived_at": _ts(r.get("archived_at")),
        "mapped": bool(r.get("discord_channel_id")),
    }


def list_channels(cur, *, include_archived: bool = False) -> list[dict[str, Any]]:
    sql = """
        SELECT public_id, slug, title, description, kind, app_key,
               discord_guild_id, discord_channel_id, sort_order, archived_at
        FROM community_channels
    """
    if not include_archived:
        sql += " WHERE archived_at IS NULL"
    sql += " ORDER BY sort_order ASC, id ASC"
    cur.execute(sql)
    return [channel_row(r) for r in cur.fetchall()]


def get_channel_by_slug(cur, slug: str) -> dict[str, Any] | None:
    cur.execute(
        """SELECT public_id, slug, title, description, kind, app_key,
                  discord_guild_id, discord_channel_id, sort_order, archived_at
           FROM community_channels
           WHERE slug = %s AND archived_at IS NULL""",
        (slug,),
    )
    r = cur.fetchone()
    return channel_row(r) if r else None


def get_channel_by_app_key(cur, app_key: str) -> dict[str, Any] | None:
    if app_key in FORBIDDEN_APP_KEYS:
        return None
    cur.execute(
        """SELECT public_id, slug, title, description, kind, app_key,
                  discord_guild_id, discord_channel_id, sort_order, archived_at
           FROM community_channels
           WHERE app_key = %s AND archived_at IS NULL
           ORDER BY sort_order ASC LIMIT 1""",
        (app_key,),
    )
    r = cur.fetchone()
    return channel_row(r) if r else None


def get_channel_by_public_id(
    cur, public_id: str, *, include_archived: bool = False
) -> dict[str, Any] | None:
    sql = """SELECT public_id, slug, title, description, kind, app_key,
                    discord_guild_id, discord_channel_id, sort_order, archived_at
             FROM community_channels WHERE public_id = %s"""
    if not include_archived:
        sql += " AND archived_at IS NULL"
    cur.execute(sql, (public_id,))
    r = cur.fetchone()
    return channel_row(r) if r else None


def _snowflake(value: Any, *, field: str) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    if not re.fullmatch(r"\d{5,32}", s):
        raise CommunityDomainError(
            f"{field} must be a Discord snowflake (digits only)",
            status=400,
        )
    return s


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return slug or "channel"


def _claim_slug(cur, base: str, *, exclude_public_id: str | None = None) -> str:
    slug = base[:64] or "channel"
    n = 0
    while True:
        candidate = slug if n == 0 else f"{slug[:50]}-{n}"
        cur.execute(
            "SELECT public_id FROM community_channels WHERE slug = %s",
            (candidate,),
        )
        row = cur.fetchone()
        if row is None:
            return candidate
        if exclude_public_id and row["public_id"] == exclude_public_id:
            return candidate
        n += 1
        if n > 50:
            raise CommunityDomainError("could not allocate unique slug", status=409)


def default_guild_id() -> str | None:
    return (os.environ.get("LABS_DISCORD_GUILD_ID") or "").strip() or None


def create_channel(
    cur,
    *,
    title: str,
    description: str = "",
    kind: str = "topic",
    app_key: str | None = None,
    discord_guild_id: str | None = None,
    discord_channel_id: str | None = None,
    sort_order: int | None = None,
    slug: str | None = None,
) -> dict[str, Any]:
    title = (title or "").strip()
    if not title or len(title) > 255:
        raise CommunityDomainError("title required (1–255 chars)")
    kind = (kind or "topic").strip()
    if kind not in ALLOWED_KINDS:
        raise CommunityDomainError(f"kind must be one of {sorted(ALLOWED_KINDS)}")
    ak = (app_key or "").strip() or None
    if ak:
        if ak in FORBIDDEN_APP_KEYS:
            raise CommunityDomainError(
                "Journey and Wiki cannot have Community channels",
                status=400,
            )
        if ak not in ALLOWED_APP_KEYS:
            raise CommunityDomainError(
                f"app_key must be one of {sorted(ALLOWED_APP_KEYS)} or empty",
            )
        if kind != "app_home":
            kind = "app_home"
    else:
        if kind == "app_home":
            raise CommunityDomainError("app_home kind requires app_key")

    if discord_guild_id is not None and str(discord_guild_id).strip():
        guild = _snowflake(discord_guild_id, field="discord_guild_id")
    else:
        raw_g = default_guild_id()
        guild = _snowflake(raw_g, field="LABS_DISCORD_GUILD_ID") if raw_g else None
    ch_id = _snowflake(discord_channel_id, field="discord_channel_id")

    base_slug = _slugify(slug or title)
    final_slug = _claim_slug(cur, base_slug)
    if final_slug in ("journey", "wiki"):
        raise CommunityDomainError("slug journey/wiki is reserved")

    if sort_order is None:
        cur.execute(
            "SELECT COALESCE(MAX(sort_order), 0) + 10 AS nxt FROM community_channels"
        )
        sort_order = int(cur.fetchone()["nxt"])

    pid = "cch" + secrets.token_hex(4)
    cur.execute(
        """INSERT INTO community_channels
           (public_id, slug, title, description, kind, app_key,
            discord_guild_id, discord_channel_id, sort_order)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            pid,
            final_slug,
            title,
            (description or "")[:1024],
            kind,
            ak,
            guild,
            ch_id,
            int(sort_order),
        ),
    )
    out = get_channel_by_public_id(cur, pid, include_archived=True)
    if not out:
        raise CommunityDomainError("create failed", status=500)
    return out


def update_channel(
    cur,
    public_id: str,
    *,
    title: str | None = None,
    description: str | None = None,
    kind: str | None = None,
    app_key: Any = ...,
    discord_guild_id: Any = ...,
    discord_channel_id: Any = ...,
    sort_order: int | None = None,
) -> dict[str, Any]:
    row = get_channel_by_public_id(cur, public_id, include_archived=True)
    if not row:
        raise CommunityDomainError("channel not found", status=404)

    sets: list[str] = []
    args: list[Any] = []

    if title is not None:
        t = title.strip()
        if not t or len(t) > 255:
            raise CommunityDomainError("title required (1–255 chars)")
        sets.append("title = %s")
        args.append(t)

    if description is not None:
        sets.append("description = %s")
        args.append((description or "")[:1024])

    if kind is not None:
        k = kind.strip()
        if k not in ALLOWED_KINDS:
            raise CommunityDomainError(f"kind must be one of {sorted(ALLOWED_KINDS)}")
        sets.append("kind = %s")
        args.append(k)

    if app_key is not ...:
        if app_key is None or str(app_key).strip() == "":
            sets.append("app_key = NULL")
        else:
            ak = str(app_key).strip()
            if ak in FORBIDDEN_APP_KEYS:
                raise CommunityDomainError(
                    "Journey and Wiki cannot have Community channels"
                )
            if ak not in ALLOWED_APP_KEYS:
                raise CommunityDomainError(
                    f"app_key must be one of {sorted(ALLOWED_APP_KEYS)} or empty"
                )
            sets.append("app_key = %s")
            args.append(ak)

    if discord_guild_id is not ...:
        sets.append("discord_guild_id = %s")
        args.append(_snowflake(discord_guild_id, field="discord_guild_id"))

    if discord_channel_id is not ...:
        sets.append("discord_channel_id = %s")
        args.append(_snowflake(discord_channel_id, field="discord_channel_id"))

    if sort_order is not None:
        sets.append("sort_order = %s")
        args.append(int(sort_order))

    if not sets:
        return row

    args.append(public_id)
    cur.execute(
        f"UPDATE community_channels SET {', '.join(sets)} WHERE public_id = %s",
        args,
    )
    out = get_channel_by_public_id(cur, public_id, include_archived=True)
    if not out:
        raise CommunityDomainError("channel not found", status=404)
    return out


def archive_channel(cur, public_id: str) -> dict[str, Any]:
    row = get_channel_by_public_id(cur, public_id, include_archived=True)
    if not row:
        raise CommunityDomainError("channel not found", status=404)
    if row["slug"] in SEED_CHANNEL_SLUGS and not row.get("archived_at"):
        # Allow archive of seeds only with care — Spec seed is fixed; prefer unmap
        pass
    cur.execute(
        """UPDATE community_channels
           SET archived_at = CURRENT_TIMESTAMP
           WHERE public_id = %s AND archived_at IS NULL""",
        (public_id,),
    )
    out = get_channel_by_public_id(cur, public_id, include_archived=True)
    if not out:
        raise CommunityDomainError("channel not found", status=404)
    return out


def apply_default_guild_to_unmapped(cur) -> dict[str, Any]:
    """Set discord_guild_id from env on rows missing guild when channel id set or all."""
    guild = default_guild_id()
    if not guild:
        raise CommunityDomainError(
            "LABS_DISCORD_GUILD_ID is not set",
            status=400,
        )
    # validate
    guild = _snowflake(guild, field="LABS_DISCORD_GUILD_ID")
    cur.execute(
        """UPDATE community_channels
           SET discord_guild_id = %s
           WHERE archived_at IS NULL
             AND (discord_guild_id IS NULL OR discord_guild_id = '')""",
        (guild,),
    )
    return {
        "discord_guild_id": guild,
        "updated": cur.rowcount if cur.rowcount is not None else 0,
        "channels": list_channels(cur, include_archived=False),
    }


def admin_overview(cur) -> dict[str, Any]:
    channels = list_channels(cur, include_archived=True)
    active = [c for c in channels if not c.get("archived_at")]
    mapped = [c for c in active if c.get("mapped")]
    return {
        "channels": channels,
        "stats": {
            "active": len(active),
            "mapped": len(mapped),
            "unmapped": len(active) - len(mapped),
        },
        "default_guild_id": default_guild_id(),
        "bridge_enabled": (os.environ.get("LABS_DISCORD_BRIDGE") or "0").strip()
        in ("1", "true", "TRUE", "yes"),
        "connect_url": (os.environ.get("LABS_DISCORD_CONNECT_URL") or "").strip()
        or None,
        "note": (
            "Member Discord connect is on fattail.ai (WP plugin). "
            "Map each Labs channel to a FatTail AI Discord channel snowflake before C1c sync."
        ),
    }


def fattail_shelf() -> dict[str, Any]:
    """House designs projected for Community FatTail Bots shelf (no P&L)."""
    return {
        "catalog_version": hd.HOUSE_CATALOG_VERSION,
        "maintainer": "admin",
        "member_may_edit_house": False,
        "member_may_remove_house": False,
        "note": (
            "House strategies are FatTail-designed and taught in courses. "
            "Only administrators may modify or version them. "
            "Members apply, configure bots, or copy-and-rebuild."
        ),
        "house": hd.list_house_design_summaries(),
    }


def share_row(r: dict) -> dict[str, Any]:
    provenance = None
    if r.get("house_design_key"):
        provenance = {
            "house_design_key": r["house_design_key"],
            "house_design_version": r.get("house_design_version") or "",
            "label": (
                f"Based on {r['house_design_key']} "
                f"v{r.get('house_design_version') or '?'}"
            ),
        }
    return {
        "id": r["public_id"],
        "bot_name": r["bot_name"] or "",
        "bot_version": r["bot_version"] or "",
        "pack_id": r["pack_id"] or "",
        "phase_at_share": r["phase_at_share"] or "",
        "summary_md": r["summary_md"] or "",
        "status": r["status"],
        "visibility": r["visibility"],
        "published_at": _ts(r.get("published_at")),
        "provenance": provenance,
        # Never include pack_config_snapshot or P&L on list cards (C1a).
    }


def list_community_shares(cur, *, limit: int = 50) -> list[dict[str, Any]]:
    lim = max(1, min(int(limit), 100))
    cur.execute(
        """SELECT public_id, bot_name, bot_version, pack_id,
                  house_design_key, house_design_version,
                  phase_at_share, summary_md, status, visibility, published_at
           FROM community_bot_shares
           WHERE status = 'published' AND visibility = 'community'
           ORDER BY published_at DESC, id DESC
           LIMIT %s""",
        (lim,),
    )
    return [share_row(r) for r in cur.fetchall()]


def discord_status_for_identity(cur, identity_id: int | None) -> dict[str, Any]:
    """Discord link status for Community (identity from WP SSO claims)."""
    import identity as identity_mod

    connect = (os.environ.get("LABS_DISCORD_CONNECT_URL") or "").strip()
    if not connect:
        connect = "https://fattail.ai/my-account/"
    bridge = (os.environ.get("LABS_DISCORD_BRIDGE") or "0").strip()
    base = {
        "linked": False,
        "discord_user_id": None,
        "display_name": None,
        "avatar_url": None,
        "connect_url": connect,
        "bridge_enabled": bridge in ("1", "true", "TRUE", "yes"),
        "note": (
            "Connect Discord on fattail.ai (WordPress plugin). Labs receives "
            "your Discord id + name via signed SSO — not Discord OAuth tokens."
        ),
    }
    if not identity_id:
        return base
    try:
        prof = identity_mod.get_discord_profile(cur, int(identity_id))
    except Exception:
        prof = None
    if not prof:
        return base
    uid = prof.get("discord_user_id")
    uname = prof.get("username") or ""
    avatar = prof.get("avatar_hash")
    avatar_url = None
    if uid and avatar:
        avatar_url = f"https://cdn.discordapp.com/avatars/{uid}/{avatar}.png"
    return {
        **base,
        "linked": True,
        "discord_user_id": uid,
        "display_name": uname or None,
        "avatar_url": avatar_url,
        "note": "Discord linked via fattail.ai · shown as your Discord name in chat.",
    }


def board_payload(cur, identity_id: int | None = None) -> dict[str, Any]:
    channels = list_channels(cur)
    return {
        "channels": channels,
        "fattail_shelf": fattail_shelf(),
        "member_shares": list_community_shares(cur),
        "discord": discord_status_for_identity(cur, identity_id),
        "message_sync": {
            "enabled": False,
            "phase": "C1c",
            "note": "Bidirectional Discord mirror ships in C1c; shell only in C1a.",
        },
    }
