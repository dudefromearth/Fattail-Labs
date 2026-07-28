"""Member Wiki API — derived-index reads over the lab-wiki checkout.

Specs: Member-Wiki v0.1 (system) · Wiki-Interface v0.1 §§2–5 (surfaces).
Gates: member session for reads; drafts 404 for members, visible to admin
(WIK-D2); reindex is admin-only. Index is derived (WIK-D1) — no writes here
ever author content.
"""

from __future__ import annotations

import json
import re

from fastapi import APIRouter, HTTPException, Request

import auth
import db
import wiki_store
from guards import require_actor, require_session

router = APIRouter(tags=["wiki"])

SNIPPET_WORDS = 30  # D-i5 starting value


def _is_admin(claims: dict) -> bool:
    return auth.role_at_least(str(claims.get("role", "")), "administrator")


def _page_row(r: dict) -> dict:
    return {
        "slug": r["slug"],
        "title": r["title"],
        "kind": r["kind"],
        "status": r["status"],
        "updated": r["updated_date"],
        "tags": json.loads(r["tags_json"] or "[]"),
        "sources": json.loads(r["sources_json"] or "[]"),
    }


def _snippet(body: str, q: str) -> str:
    """~SNIPPET_WORDS words centred on the first query-term hit (plain text)."""
    text = re.sub(r"[#*_\[\]`>|-]+", " ", body)
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split(" ")
    terms = [t.lower() for t in q.split() if t]
    lower = [w.lower() for w in words]
    hit = 0
    for i, w in enumerate(lower):
        if any(t in w for t in terms):
            hit = i
            break
    start = max(0, hit - SNIPPET_WORDS // 2)
    chunk = " ".join(words[start : start + SNIPPET_WORDS])
    prefix = "… " if start > 0 else ""
    suffix = " …" if start + SNIPPET_WORDS < len(words) else ""
    return f"{prefix}{chunk}{suffix}"


@router.get("/api/wiki/index")
def wiki_index(request: Request) -> dict:
    """Browse payload for the entry surface: kinds, start-here, recent."""
    claims = require_session(request)
    admin = _is_admin(claims)
    status_clause = "" if admin else "AND status = 'published'"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT kind, COUNT(*) AS n FROM wiki_pages_idx
                WHERE 1=1 {status_clause} GROUP BY kind
                """
            )
            kinds = {r["kind"]: r["n"] for r in cur.fetchall()}
            cur.execute(
                f"""
                SELECT slug, title, kind, status, updated_date, tags_json, sources_json
                FROM wiki_pages_idx
                WHERE kind = 'topic' {status_clause}
                ORDER BY title ASC
                """
            )
            topics = [_page_row(r) for r in cur.fetchall()]
            cur.execute(
                f"""
                SELECT slug, title, kind, status, updated_date, tags_json, sources_json
                FROM wiki_pages_idx
                WHERE 1=1 {status_clause}
                ORDER BY updated_date DESC, slug ASC
                LIMIT 6
                """
            )
            recent = [_page_row(r) for r in cur.fetchall()]
    return {"kinds": kinds, "start_here": topics[:8], "recent": recent, "admin": admin}


@router.get("/api/wiki/pages/{slug}")
def wiki_page(slug: str, request: Request) -> dict:
    claims = require_session(request)
    admin = _is_admin(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT slug, path, title, kind, status, body_md, tags_json,
                       sources_json, updated_date
                FROM wiki_pages_idx WHERE slug = %s
                """,
                (slug,),
            )
            row = cur.fetchone()
            if row is None or (row["status"] != "published" and not admin):
                raise HTTPException(status_code=404, detail="Page not found")

            cur.execute(
                """
                SELECT l.from_slug, p.title
                FROM wiki_links_idx l
                JOIN wiki_pages_idx p ON p.slug = l.from_slug
                WHERE l.to_slug = %s AND l.resolved = 1
                  AND (p.status = 'published' OR %s)
                ORDER BY p.title ASC
                """,
                (slug, admin),
            )
            backlinks = [
                {"slug": r["from_slug"], "title": r["title"]} for r in cur.fetchall()
            ]
            cur.execute(
                """
                SELECT l.to_slug, l.resolved, p.title, p.status
                FROM wiki_links_idx l
                LEFT JOIN wiki_pages_idx p ON p.slug = l.to_slug
                WHERE l.from_slug = %s
                ORDER BY l.id ASC
                """,
                (slug,),
            )
            outbound = []
            for r in cur.fetchall():
                visible = bool(r["resolved"]) and (
                    admin or (r["status"] == "published")
                )
                outbound.append(
                    {
                        "slug": r["to_slug"],
                        "title": r["title"] or r["to_slug"],
                        "resolved": visible,
                    }
                )
    page = _page_row(row)
    page["body_md"] = row["body_md"]
    page["path"] = row["path"]
    page["backlinks"] = backlinks
    page["links"] = outbound
    return page


@router.get("/api/wiki/search")
def wiki_search(request: Request, q: str = "") -> dict:
    claims = require_session(request)
    admin = _is_admin(claims)
    q = q.strip()
    if not q:
        return {"query": "", "results": []}
    status_clause = "" if admin else "AND status = 'published'"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT slug, title, kind, status, body_md, updated_date,
                       tags_json, sources_json,
                       MATCH(title, body_md) AGAINST (%s IN NATURAL LANGUAGE MODE)
                         AS score,
                       MATCH(title, body_md) AGAINST (%s IN BOOLEAN MODE) AS bscore,
                       (LOWER(title) LIKE LOWER(%s)) AS title_hit
                FROM wiki_pages_idx
                WHERE MATCH(title, body_md) AGAINST (%s IN NATURAL LANGUAGE MODE)
                      {status_clause}
                ORDER BY title_hit DESC, score DESC, updated_date DESC
                LIMIT 25
                """,
                (q, q, f"%{q}%", q),
            )
            rows = cur.fetchall()
    results = []
    for r in rows:
        item = _page_row(r)
        item["snippet"] = _snippet(r["body_md"], q)
        item["group"] = "pages"
        results.append(item)
    return {"query": q, "results": results}


@router.get("/api/wiki/graph")
def wiki_graph(request: Request) -> dict:
    claims = require_session(request)
    admin = _is_admin(claims)
    status_clause = "" if admin else "WHERE status = 'published'"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT slug, title, kind, status FROM wiki_pages_idx {status_clause}"
            )
            nodes = [
                {"slug": r["slug"], "title": r["title"], "kind": r["kind"]}
                for r in cur.fetchall()
            ]
            visible = {n["slug"] for n in nodes}
            cur.execute(
                "SELECT from_slug, to_slug FROM wiki_links_idx WHERE resolved = 1"
            )
            edges = [
                {"from": r["from_slug"], "to": r["to_slug"]}
                for r in cur.fetchall()
                if r["from_slug"] in visible and r["to_slug"] in visible
            ]
    return {"nodes": nodes, "edges": edges}


@router.post("/api/admin/wiki/reindex")
def wiki_reindex(request: Request) -> dict:
    # Human admin OR agent bearer with wiki:reindex (sync tick uses an agent key)
    require_actor(request, scopes=["wiki:reindex"])
    root = wiki_store.wiki_root()
    with db.transaction() as conn:
        counts = wiki_store.reindex(conn, root)
    return counts
