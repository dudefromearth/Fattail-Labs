"""Oscar W1 compile + file-on-publish (stubs, OD-WK2 · OD-WK9 hook).

Deterministic. No model call. Wiki-only. Help/both refused.
"""

from __future__ import annotations

from datetime import date

import board
import db
import wiki_compile_store as store
import wiki_compile_surfaces as surfaces
import wiki_store
from agent_auth import Actor
from wiki_compile_store import (
    AUDIENCE_WIDEN,
    HELP_TARGET_DISABLED,
    STAFF_SINK_MISSING,
)

OSCAR = Actor(
    kind="agent",
    id=0,
    label="oscar",
    role="administrator",
    scopes=frozenset({"board:operate"}),
)

_AUDIENCE_RANK = {"staff": 0, "member": 1, "public": 2}


class WikiCompileError(ValueError):
    """Named compile/disposition error."""


def _title_for(surface_key: str, fallback: str | None = None) -> str:
    if fallback and fallback.strip():
        return fallback.strip()
    return {
        "iki.wiki.entry": "Wiki",
        "iki.wiki.article": "Wiki article",
        "iki.runner": "IKI Runner",
        "iki.factory": "IKI Factory",
    }.get(surface_key, surface_key)


def _slug_for(surface_key: str) -> str:
    return "compiled-" + surface_key.replace(".", "-")


def _stub_md(row: dict, *, status: str) -> str:
    title = row.get("suggested_title") or row["title"]
    return (
        f"---\n"
        f"title: {title}\n"
        f"kind: concept\n"
        f"status: {status}\n"
        f"tags: []\n"
        f"sources: []\n"
        f"updated: {date.today().isoformat()}\n"
        f"---\n\n"
        f"# {title}\n\n"
        f"surface_key: `{row.get('surface_key') or ''}`\n"
        f"route: `{row.get('route') or ''}`\n"
        f"origin: {row['origin']}\n"
    )


def assert_wiki_target(target: str | None) -> None:
    t = (target or "wiki").strip()
    if t in ("help", "both"):
        raise WikiCompileError(HELP_TARGET_DISABLED)
    if t != "wiki":
        raise WikiCompileError(f"unknown target: {t!r}")


def assert_audience(current: str, requested: str | None) -> str:
    if requested is None or requested == "":
        return current
    req = requested.strip()
    if req not in _AUDIENCE_RANK:
        raise WikiCompileError(f"unknown audience: {req!r}")
    if _AUDIENCE_RANK[req] > _AUDIENCE_RANK.get(current, 1):
        raise WikiCompileError(AUDIENCE_WIDEN)
    if req == "staff":
        raise WikiCompileError(STAFF_SINK_MISSING)
    return req


def compile_wiki_stub(candidate_id: int) -> dict:
    """Mint a wiki board card (stubs). Sets disposition=compiled when the card exists."""
    row = store.get_candidate(candidate_id)
    if row is None:
        raise WikiCompileError("candidate not found")
    if row["disposition"] == "dismissed":
        raise WikiCompileError("candidate is dismissed")
    if row["audience"] == "staff":
        raise WikiCompileError(STAFF_SINK_MISSING)

    title = _title_for(row.get("surface_key") or "", row.get("suggested_title"))
    intent = _stub_md(row, status="draft")
    item = board.create_item(
        OSCAR,
        title=title,
        intent_md=intent,
        product_line="wiki",
        acceptance_md="Board approves this stub onto the wiki. No generated prose.",
    )
    board.transition(int(item["id"]), OSCAR, to_status="awaiting_approval")
    return store.set_disposition(
        candidate_id,
        "compiled",
        compiled_content_ids=[int(item["id"])],
    )


def on_board_published(content_item_id: int) -> None:
    """OD-WK9 / WK15 wiki-only: one published page row. Never reindex (wipes idx)."""
    item = board.get_item(content_item_id)
    if not item or item.get("product_line") != "wiki":
        return
    row = store.candidate_for_content_item(content_item_id)
    if row is None:
        return
    slug = _slug_for(row.get("surface_key") or f"item-{content_item_id}")
    raw = _stub_md(row, status="published")
    meta, body = wiki_store.parse_frontmatter(raw)
    title = (meta.get("title") or "").strip() or row["title"]
    updated = (meta.get("updated") or "").strip() or date.today().isoformat()
    path = f"wiki/concepts/{slug}.md"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_pages_idx
                  (slug, path, title, kind, status, body_md, tags_json,
                   sources_json, updated_date)
                VALUES (%s, %s, %s, 'concept', 'published', %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  path = VALUES(path),
                  title = VALUES(title),
                  kind = VALUES(kind),
                  status = VALUES(status),
                  body_md = VALUES(body_md),
                  tags_json = VALUES(tags_json),
                  sources_json = VALUES(sources_json),
                  updated_date = VALUES(updated_date)
                """,
                (slug, path, title, body, "[]", "[]", updated),
            )


def admin_point_and_maybe_compile(
    payload: dict,
    *,
    compile_now: bool,
    actor_id: int,
    note: str | None,
) -> dict:
    captured = surfaces.sanitize_capture(payload)
    ident = surfaces.identity_key(captured["surface_key"], captured["state_key"])
    title = _title_for(captured["surface_key"])
    row = store.insert_admin_point(
        identity_key=ident,
        title=title,
        surface_key=captured["surface_key"],
        state_key=captured["state_key"],
        route=captured["route"],
        note=note,
    )
    if compile_now:
        store.set_disposition(row["id"], "compiling", disposed_by=actor_id)
        row = compile_wiki_stub(row["id"])
    return row
