"""Message mirror: Discord REST ↔ community_messages."""

from __future__ import annotations

import logging
import secrets
from typing import Any

import community_domain as cdom
from labs_discord.config import bridge_config
from labs_discord.rest import DiscordRest, DiscordRestError

log = logging.getLogger("labs.discord.sync")


def _public_id() -> str:
    return "cmsg" + secrets.token_hex(4)


def _avatar_url(user: dict | None) -> str | None:
    if not user:
        return None
    uid = user.get("id")
    av = user.get("avatar")
    if uid and av:
        return f"https://cdn.discordapp.com/avatars/{uid}/{av}.png"
    return None


def _display_name(msg: dict) -> str:
    author = msg.get("author") or {}
    # member nick on guild messages
    member = msg.get("member") or {}
    nick = (member.get("nick") or "").strip()
    if nick:
        return nick
    global_name = (author.get("global_name") or "").strip()
    if global_name:
        return global_name
    return (author.get("username") or "Discord user").strip() or "Discord user"


def upsert_discord_message(cur, channel_db_id: int, msg: dict) -> str | None:
    """Idempotent upsert by discord_message_id. Returns public_id or None if skipped."""
    mid = str(msg.get("id") or "").strip()
    if not mid:
        return None
    if msg.get("webhook_id") and not msg.get("author"):
        # keep webhook posts as discord-origin text
        pass

    author = msg.get("author") or {}
    author_id = str(author.get("id") or "") or None
    # Skip pure system messages without content
    content = (msg.get("content") or "").strip()
    if not content and not msg.get("attachments"):
        # still store empty as deleted/system? drop
        if msg.get("type", 0) != 0:
            return None

    # Resolve Labs identity if discord linked
    identity_id = None
    if author_id:
        cur.execute(
            """SELECT identity_id FROM identity_links
               WHERE provider = 'discord' AND external_id = %s""",
            (author_id,),
        )
        row = cur.fetchone()
        if row:
            identity_id = int(row["identity_id"])

    name = _display_name(msg)
    avatar = _avatar_url(author)
    status = "deleted" if msg.get("content") is None and msg.get("type") == 0 else "visible"
    # edits: discord returns full body on history

    # parent
    discord_parent = None
    ref = msg.get("message_reference") or {}
    if ref.get("message_id"):
        discord_parent = str(ref["message_id"])

    body = content
    if not body and msg.get("attachments"):
        body = "[attachment]"

    cur.execute(
        """SELECT public_id, id FROM community_messages
           WHERE discord_message_id = %s""",
        (mid,),
    )
    existing = cur.fetchone()
    if existing:
        cur.execute(
            """UPDATE community_messages SET
                 body_text = %s,
                 author_display_name = %s,
                 author_avatar_url = %s,
                 identity_id = COALESCE(%s, identity_id),
                 status = 'visible',
                 edited_at = CASE
                   WHEN body_text <> %s THEN CURRENT_TIMESTAMP
                   ELSE edited_at END,
                 synced_at = CURRENT_TIMESTAMP
               WHERE discord_message_id = %s""",
            (body, name, avatar, identity_id, body, mid),
        )
        return existing["public_id"]

    pid = _public_id()
    # created_at from discord snowflake timestamp optional — use NOW for v1
    cur.execute(
        """INSERT INTO community_messages
           (public_id, channel_id, identity_id, discord_message_id,
            discord_author_id, author_display_name, author_avatar_url,
            body_text, status, discord_parent_id, source, synced_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'visible', %s, 'discord', CURRENT_TIMESTAMP)""",
        (
            pid,
            channel_db_id,
            identity_id,
            mid,
            author_id,
            name,
            avatar,
            body,
            discord_parent,
        ),
    )
    return pid


def backfill_channel(cur, slug: str, *, limit: int = 50) -> dict[str, Any]:
    cfg = bridge_config()
    if not cfg.enabled or not cfg.bot_token:
        return {
            "ok": False,
            "error": "bridge disabled or no bot token",
            "upserted": 0,
        }

    cur.execute(
        """SELECT id, slug, discord_channel_id, discord_guild_id
           FROM community_channels
           WHERE slug = %s AND archived_at IS NULL""",
        (slug,),
    )
    ch = cur.fetchone()
    if not ch:
        raise cdom.CommunityDomainError("channel not found", status=404)
    dch = (ch["discord_channel_id"] or "").strip()
    if not dch:
        return {"ok": False, "error": "channel not mapped to Discord", "upserted": 0}

    # last synced discord id
    cur.execute(
        """SELECT discord_message_id FROM community_messages
           WHERE channel_id = %s AND discord_message_id IS NOT NULL
           ORDER BY id DESC LIMIT 1""",
        (ch["id"],),
    )
    last = cur.fetchone()
    after = last["discord_message_id"] if last else None

    rest = DiscordRest(cfg.bot_token)
    try:
        # Discord returns newest first; for after= we get newer than after
        messages = rest.get_channel_messages(dch, after=after, limit=limit)
    except DiscordRestError as exc:
        log.exception("backfill failed channel=%s", slug)
        return {"ok": False, "error": str(exc), "upserted": 0}

    # process oldest first for stable order
    messages = list(reversed(messages))
    n = 0
    for msg in messages:
        # skip messages from our own bot that we already stored as labs?
        # still upsert by discord id — fine
        if upsert_discord_message(cur, int(ch["id"]), msg):
            n += 1
    return {
        "ok": True,
        "upserted": n,
        "channel": slug,
        "after": after,
    }


def send_labs_message(
    cur,
    *,
    slug: str,
    identity_id: int,
    body: str,
    author_display_name: str,
    discord_author_id: str | None,
) -> dict[str, Any]:
    cfg = bridge_config()
    if not cfg.enabled or not cfg.bot_token:
        raise cdom.CommunityDomainError(
            "Discord bridge is not enabled",
            status=503,
        )

    text = (body or "").strip()
    if not text:
        raise cdom.CommunityDomainError("message body required")
    if len(text) > 4000:
        raise cdom.CommunityDomainError("message too long")

    cur.execute(
        """SELECT id, slug, discord_channel_id FROM community_channels
           WHERE slug = %s AND archived_at IS NULL""",
        (slug,),
    )
    ch = cur.fetchone()
    if not ch:
        raise cdom.CommunityDomainError("channel not found", status=404)
    dch = (ch["discord_channel_id"] or "").strip()
    if not dch:
        raise cdom.CommunityDomainError(
            "This channel is not mapped to Discord yet",
            status=400,
        )

    name = (author_display_name or "Member").strip() or "Member"
    # Honest attribution — Spec §6.2
    discord_content = f"**{name}** (via Labs)\n{text}"

    rest = DiscordRest(cfg.bot_token)
    try:
        sent = rest.create_message(dch, discord_content)
    except DiscordRestError as exc:
        raise cdom.CommunityDomainError(
            f"Discord send failed: {exc}",
            status=502,
        ) from exc

    mid = str(sent.get("id") or "")
    pid = _public_id()
    author = sent.get("author") or {}
    cur.execute(
        """INSERT INTO community_messages
           (public_id, channel_id, identity_id, discord_message_id,
            discord_author_id, author_display_name, author_avatar_url,
            body_text, status, source, synced_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'visible', 'labs', CURRENT_TIMESTAMP)""",
        (
            pid,
            int(ch["id"]),
            identity_id,
            mid or None,
            discord_author_id or str(author.get("id") or "") or None,
            name,
            _avatar_url(author),
            text,
        ),
    )
    return message_row_by_public_id(cur, pid)


def message_row_by_public_id(cur, public_id: str) -> dict[str, Any] | None:
    cur.execute(
        """SELECT m.public_id, m.body_text, m.status, m.source,
                  m.author_display_name, m.author_avatar_url,
                  m.discord_message_id, m.discord_author_id,
                  m.identity_id, m.created_at, m.edited_at, m.synced_at,
                  c.slug AS channel_slug
           FROM community_messages m
           JOIN community_channels c ON c.id = m.channel_id
           WHERE m.public_id = %s""",
        (public_id,),
    )
    r = cur.fetchone()
    return _message_row(r) if r else None


def _message_row(r: dict) -> dict[str, Any]:
    return {
        "id": r["public_id"],
        "channel_slug": r.get("channel_slug"),
        "body": r["body_text"] or "",
        "status": r["status"],
        "source": r["source"],
        "author_display_name": r["author_display_name"] or "",
        "author_avatar_url": r["author_avatar_url"],
        "discord_message_id": r["discord_message_id"],
        "discord_author_id": r["discord_author_id"],
        "identity_id": r["identity_id"],
        "created_at": cdom._ts(r.get("created_at")),
        "edited_at": cdom._ts(r.get("edited_at")),
        "synced_at": cdom._ts(r.get("synced_at")),
        "via_labs": r["source"] == "labs",
    }


def list_messages(
    cur,
    slug: str,
    *,
    limit: int = 50,
    before_public_id: str | None = None,
) -> list[dict[str, Any]]:
    cur.execute(
        """SELECT id FROM community_channels
           WHERE slug = %s AND archived_at IS NULL""",
        (slug,),
    )
    ch = cur.fetchone()
    if not ch:
        raise cdom.CommunityDomainError("channel not found", status=404)

    lim = max(1, min(int(limit), 100))
    args: list[Any] = [ch["id"]]
    sql = """
        SELECT m.public_id, m.body_text, m.status, m.source,
               m.author_display_name, m.author_avatar_url,
               m.discord_message_id, m.discord_author_id,
               m.identity_id, m.created_at, m.edited_at, m.synced_at,
               c.slug AS channel_slug
        FROM community_messages m
        JOIN community_channels c ON c.id = m.channel_id
        WHERE m.channel_id = %s AND m.status = 'visible'
    """
    if before_public_id:
        cur.execute(
            "SELECT id FROM community_messages WHERE public_id = %s",
            (before_public_id,),
        )
        br = cur.fetchone()
        if br:
            sql += " AND m.id < %s"
            args.append(br["id"])
    sql += " ORDER BY m.id DESC LIMIT %s"
    args.append(lim)
    cur.execute(sql, args)
    rows = cur.fetchall()
    # chronological for UI
    return [_message_row(r) for r in reversed(rows)]
