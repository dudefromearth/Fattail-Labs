"""Linkage pass v1 — FULLTEXT + title boost. Builds wiki_refs (spec §5)."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import db
import wiki_agent_git
import wiki_agent_store as store
from config import ConfigError

TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9-]{2,}")


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _require_float(name: str) -> float:
    raw = os.environ.get(name, "").strip()
    if not raw:
        raise ConfigError(f"Missing required environment variable: {name}")
    try:
        return float(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} must be a float, got {raw!r}") from exc


def _require_int(name: str) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        raise ConfigError(f"Missing required environment variable: {name}")
    try:
        n = int(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} must be an integer, got {raw!r}") from exc
    if n < 1:
        raise ConfigError(f"{name} must be >= 1, got {n}")
    return n


def thresholds() -> dict:
    return {
        "insert": _require_float("LABS_WIKI_LINK_INSERT_THRESHOLD"),
        "reverse": _require_float("LABS_WIKI_REVERSE_PASS_THRESHOLD"),
        "inline_cap": _require_int("LABS_WIKI_REVERSE_PASS_INLINE_CAP"),
    }


def _tokens(text: str) -> list[str]:
    seen: list[str] = []
    for m in TOKEN_RE.finditer(text or ""):
        t = m.group(0).lower()
        if t not in seen:
            seen.append(t)
        if len(seen) >= 12:
            break
    return seen


def _boolean_query(tokens: list[str]) -> str:
    # OR of stems — AND-of-all-tokens would hide valid candidates (WA-3 tests).
    parts = [f"{t}*" for t in tokens]
    return " ".join(parts) if parts else ""


def score_candidates(query_text: str, *, exclude_slug: str) -> list[dict]:
    tokens = _tokens(query_text)
    bq = _boolean_query(tokens)
    if not bq:
        return []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT slug, title, status,
                       MATCH(title, body_md) AGAINST (%s IN BOOLEAN MODE) AS ft
                  FROM wiki_pages_idx
                 WHERE slug <> %s
                   AND MATCH(title, body_md) AGAINST (%s IN BOOLEAN MODE)
                 ORDER BY ft DESC
                 LIMIT 50
                """,
                (bq, exclude_slug, bq),
            )
            rows = cur.fetchall()
    out = []
    for r in rows:
        ft = float(r["ft"] or 0)
        title_l = (r["title"] or "").lower()
        title_boost = 1.0 if any(t in title_l for t in tokens) else 0.0
        total = ft + title_boost
        out.append(
            {
                "slug": r["slug"],
                "title": r["title"],
                "status": r["status"],
                "score": total,
                "explain": {
                    "fulltext": round(ft, 4),
                    "title_boost": title_boost,
                    "total": round(total, 4),
                    "query": bq,
                },
            }
        )
    out.sort(key=lambda x: -x["score"])
    return out


def upsert_ref(*, from_slug: str, to_slug: str, relation: str, score: float, explain: dict, contract_id: str) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_refs
                  (from_slug, to_kind, to_id, relation, score, explain_json, contract_id)
                VALUES (%s, 'wiki_page', %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  score = VALUES(score),
                  explain_json = VALUES(explain_json),
                  contract_id = VALUES(contract_id)
                """,
                (
                    from_slug,
                    to_slug,
                    relation,
                    score,
                    json.dumps(explain),
                    contract_id,
                ),
            )


def queue_reverse(contract_id: str, from_slug: str, to_slug: str, score: float) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_linkage_queue
                  (contract_id, from_slug, to_slug, score, status, created_at)
                VALUES (%s,%s,%s,%s,'queued',%s)
                ON DUPLICATE KEY UPDATE score = VALUES(score)
                """,
                (contract_id, from_slug, to_slug, score, _now()),
            )


def queued_count() -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) AS n FROM wiki_linkage_queue WHERE status = 'queued'"
            )
            row = cur.fetchone()
    return int((row or {}).get("n") or 0)


def peek_queued(n: int) -> list[dict]:
    if n < 1:
        return []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, contract_id, from_slug, to_slug, score, status
                  FROM wiki_linkage_queue
                 WHERE status = 'queued'
                 ORDER BY id ASC
                 LIMIT %s
                """,
                (n,),
            )
            return list(cur.fetchall())


def mark_drained(queue_id: int) -> bool:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE wiki_linkage_queue
                   SET status = 'drained'
                 WHERE id = %s AND status = 'queued'
                """,
                (queue_id,),
            )
            return cur.rowcount == 1


def drain_to_board(n: int, root: Path) -> dict:
    """Pull next N queued reverse-pass rows into board cards. Nothing publishes."""
    from wiki_agent_discharge import OSCAR

    items = peek_queued(n)
    card_ids: list[int] = []
    files: list[str] = []
    drained: list[int] = []
    import board

    for item in items:
        from_slug = item["from_slug"]
        to_slug = item["to_slug"]
        cid = item["contract_id"]
        rel = f"wiki/concepts/wa3-rev-{from_slug}-to-{to_slug}.md"
        dest = root / rel
        if not dest.is_file():
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(
                f"---\ntitle: Proposed revision of {from_slug}\nkind: concept\n"
                f"status: draft\n---\n\n"
                f"Proposed revision for [[{from_slug}]]. Insert: [[{to_slug}]].\n"
                f"score={item['score']}\n",
                encoding="utf-8",
            )
            files.append(rel)
        item_row = board.create_item(
            OSCAR,
            title=f"Reverse-pass drain {from_slug} → {to_slug}",
            intent_md=(
                f"contract `{cid}`\nqueued reverse-pass\n"
                f"`{from_slug}` → `{to_slug}` score={item['score']}\n"
                f"Draft on the board — you still approve.\n"
            ),
            acceptance_md="Board-gated revision draft; nothing auto-published.",
            product_line="wiki",
        )
        board.transition(
            int(item_row["id"]),
            OSCAR,
            to_status="awaiting_approval",
            reason="linkage-queue drain",
        )
        card_ids.append(int(item_row["id"]))
        if mark_drained(int(item["id"])):
            drained.append(int(item["id"]))
    if files:
        wiki_agent_git.commit_paths(
            root,
            contract_id=items[0]["contract_id"] if items else "drain",
            relative_paths=files,
            message="wiki-agent linkage-queue drain drafts",
        )
    return {
        "drained": len(drained),
        "card_ids": card_ids,
        "queued_remaining": queued_count(),
        "files": files,
    }


def list_queue(contract_id: str) -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT from_slug, to_slug, score, status
                  FROM wiki_linkage_queue
                 WHERE contract_id = %s
                 ORDER BY score DESC, from_slug
                """,
                (contract_id,),
            )
            return list(cur.fetchall())


def format_suggestions_md(below: list[dict]) -> str:
    if not below:
        return "## Below-threshold suggestions\n\nNone.\n"
    lines = ["## Below-threshold suggestions", ""]
    for c in below:
        ex = c["explain"]
        lines.append(
            f"- `{c['slug']}` score={ex['total']} "
            f"(fulltext {ex['fulltext']} + title_boost {ex['title_boost']})"
        )
    return "\n".join(lines) + "\n"


def _has_wikilink(body: str, slug: str) -> bool:
    return f"[[{slug}]]" in (body or "")


def _append_wikilink(body: str, slug: str) -> str:
    if _has_wikilink(body, slug):
        return body
    return (body or "").rstrip() + f"\n\nSee also: [[{slug}]]\n"


def run_after_ingest(
    *,
    contract_id: str,
    draft_slug: str,
    relative_path: str,
    root: Path,
    query_text: str,
) -> dict:
    th = thresholds()
    cands = score_candidates(query_text, exclude_slug=draft_slug)
    insert, below = [], []
    for c in cands:
        if c["status"] != "published":
            continue
        upsert_ref(
            from_slug=draft_slug,
            to_slug=c["slug"],
            relation="related",
            score=c["score"],
            explain=c["explain"],
            contract_id=contract_id,
        )
        if c["score"] >= th["insert"]:
            insert.append(c)
        else:
            below.append(c)

    dest = root / relative_path
    body = dest.read_text(encoding="utf-8") if dest.is_file() else ""
    changed = False
    for c in insert:
        new_body = _append_wikilink(body, c["slug"])
        if new_body != body:
            body = new_body
            changed = True
    if changed:
        dest.write_text(body, encoding="utf-8")
        wiki_agent_git.commit_paths(
            root,
            contract_id=contract_id,
            relative_paths=[relative_path],
            message=f"wiki-agent {contract_id} linkage wikilinks",
        )

    reverse_hits = [
        c for c in cands if c["status"] == "published" and c["score"] >= th["reverse"]
    ]
    reverse_files: list[str] = []
    for c in reverse_hits:
        upsert_ref(
            from_slug=c["slug"],
            to_slug=draft_slug,
            relation="reverse",
            score=c["score"],
            explain=c["explain"],
            contract_id=contract_id,
        )
        rev_rel = f"wiki/concepts/wa3-rev-{c['slug']}-to-{draft_slug}.md"
        if (root / rev_rel).is_file():
            continue
        page = (
            f"---\ntitle: Proposed revision of {c['title']}\nkind: concept\n"
            f"status: draft\n---\n\n"
            f"Proposed revision for [[{c['slug']}]]. Insert: [[{draft_slug}]].\n"
            f"score={c['explain']['total']} fulltext={c['explain']['fulltext']} "
            f"title_boost={c['explain']['title_boost']}\n"
        )
        path = root / rev_rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(page, encoding="utf-8")
        reverse_files.append(rev_rel)
        queue_reverse(contract_id, c["slug"], draft_slug, c["score"])

    if reverse_files:
        wiki_agent_git.commit_paths(
            root,
            contract_id=contract_id,
            relative_paths=reverse_files,
            message=f"wiki-agent {contract_id} reverse-pass drafts",
        )

    inline = reverse_hits[: th["inline_cap"]]
    overflow = reverse_hits[th["inline_cap"] :]
    return {
        "insert": insert,
        "below": below,
        "reverse_hits": reverse_hits,
        "reverse_files": reverse_files,
        "inline": inline,
        "overflow": overflow,
        "suggestions_md": format_suggestions_md(below),
        "explain_example": (insert or below or reverse_hits or [{}])[0],
    }
