"""IKI Factory research pipeline (IF-2). Registered skills only. No invention."""

from __future__ import annotations

import json
import re
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

import db
from iki_factory import FactoryError

WINDOW = timedelta(hours=24)
MAX_CARDS = 10
NO_SKILLS = "No skills registered. Gemba will not invent findings."
WINDOW_EXPIRED = "Research window expired (24 h). No findings."
UNREGISTERED = "Skill is not in the versioned registry."
BAD_SHAPE = "Finding failed Hotel shape (missing fields, empty sources, or profit/advice)."
_PROFIT = re.compile(
    r"\b(profit|guaranteed return|you should|buy this|expected return|will make money)\b",
    re.I,
)

SkillFn = Callable[[dict[str, Any]], list[dict[str, Any]]]
_IMPLS: dict[tuple[str, str], SkillFn] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _json(v: Any) -> Any:
    if v is None or v == "":
        return None
    if isinstance(v, (dict, list)):
        return v
    if isinstance(v, (bytes, bytearray)):
        v = v.decode("utf-8")
    return json.loads(v)


def list_skills(*, status: str = "registered") -> list[dict[str, str]]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT skill_id, version, status FROM iki_factory_skills
                 WHERE status = %s ORDER BY skill_id, version
                """,
                (status,),
            )
            return [
                {
                    "skill_id": r["skill_id"],
                    "version": r["version"],
                    "status": r["status"],
                }
                for r in cur.fetchall()
            ]


def register_skill(skill_id: str, version: str, *, status: str = "registered") -> None:
    sid = (skill_id or "").strip()
    ver = (version or "").strip()
    if not sid or not ver:
        raise FactoryError("skill_id and version required")
    if status not in ("registered", "retired"):
        raise FactoryError("invalid skill status")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO iki_factory_skills (skill_id, version, status)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
                """,
                (sid, ver, status),
            )


def register_impl(skill_id: str, version: str, fn: SkillFn) -> None:
    _IMPLS[(skill_id, version)] = fn


def clear_impls() -> None:
    _IMPLS.clear()


def invoke(skill_id: str, version: str, idea: dict[str, Any]) -> list[dict[str, Any]]:
    sid, ver = skill_id.strip(), version.strip()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT status FROM iki_factory_skills
                 WHERE skill_id = %s AND version = %s
                """,
                (sid, ver),
            )
            row = cur.fetchone()
    if not row or row["status"] != "registered":
        raise FactoryError(UNREGISTERED)
    fn = _IMPLS.get((sid, ver))
    if fn is None:
        raise FactoryError(f"skill {sid}@{ver} has no implementation")
    out = fn(idea)
    if not isinstance(out, list):
        raise FactoryError(BAD_SHAPE)
    return out


def usable_finding(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    title = str(raw.get("title") or "").strip()
    reason = str(raw.get("reason") or "").strip()
    sources = raw.get("sources")
    if not isinstance(sources, list) or not sources:
        return None
    srcs = [str(s).strip() for s in sources if str(s).strip()]
    if not title or not reason or not srcs:
        return None
    try:
        rank = int(raw["rank"])
    except (KeyError, TypeError, ValueError):
        return None
    blob = f"{title} {reason} {' '.join(srcs)}"
    if _PROFIT.search(blob):
        return None
    return {"title": title, "rank": rank, "reason": reason, "sources": srcs}


def _set_block(cur, card_id: int, reason: str) -> None:
    cur.execute(
        """
        UPDATE iki_factory_cards
           SET blocked_reason = %s,
               waiting_reason = NULL,
               failed_reason = NULL
         WHERE id = %s
        """,
        (reason, card_id),
    )


def attempt_research(cur, card_id: int) -> None:
    """Run inside an open cursor/transaction after pickup."""
    cur.execute(
        "SELECT skill_id, version FROM iki_factory_skills WHERE status = 'registered'"
    )
    skills = list(cur.fetchall())
    ends = _now() + WINDOW
    cur.execute(
        """
        UPDATE iki_factory_cards
           SET research_window_ends_at = %s
         WHERE id = %s
        """,
        (ends, card_id),
    )
    if not skills:
        _set_block(cur, card_id, NO_SKILLS)
        return
    cur.execute(
        """
        UPDATE iki_factory_cards
           SET waiting_reason = 'waiting for skills',
               blocked_reason = NULL
         WHERE id = %s
        """,
        (card_id,),
    )


def expire_open_windows() -> int:
    """Fail-loud cards whose 24 h window ended with no findings. Returns count."""
    n = 0
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id FROM iki_factory_cards
                 WHERE lane = 'research'
                   AND card_status = 'active'
                   AND lineage_parent_id IS NULL
                   AND blocked_reason IS NULL
                   AND research_window_ends_at IS NOT NULL
                   AND research_window_ends_at < UTC_TIMESTAMP()
                """
            )
            ids = [int(r["id"]) for r in cur.fetchall()]
            for cid in ids:
                cur.execute(
                    """
                    SELECT COUNT(*) AS n FROM iki_factory_cards
                     WHERE lineage_parent_id = %s AND card_status = 'active'
                    """,
                    (cid,),
                )
                kids = int(cur.fetchone()["n"])
                if kids == 0:
                    _set_block(cur, cid, WINDOW_EXPIRED)
                    n += 1
    return n


def run_registered_skills(card_id: int, idea: dict[str, Any]) -> dict[str, Any]:
    """Invoke every registered impl. Empty impl set does not invent."""
    skills = list_skills()
    if not skills:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                _set_block(cur, card_id, NO_SKILLS)
                cur.execute("SELECT * FROM iki_factory_cards WHERE id = %s", (card_id,))
                return dict(cur.fetchone())
    raw: list[dict[str, Any]] = []
    for s in skills:
        key = (s["skill_id"], s["version"])
        if key not in _IMPLS:
            raise FactoryError(
                f"skill {s['skill_id']}@{s['version']} has no implementation"
            )
        chunk = invoke(s["skill_id"], s["version"], idea)
        raw.extend(chunk)
    usable = [u for u in (usable_finding(x) for x in raw) if u]
    usable.sort(key=lambda f: f["rank"])
    top = usable[:MAX_CARDS]
    rest = usable[MAX_CARDS:]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE iki_factory_cards
                   SET findings_json = %s,
                       remainder_json = %s,
                       blocked_reason = NULL,
                       waiting_reason = NULL
                 WHERE id = %s
                """,
                (
                    json.dumps(usable),
                    json.dumps(rest) if rest else None,
                    card_id,
                ),
            )
            for f in top:
                cur.execute(
                    """
                    INSERT INTO iki_factory_cards
                      (title, lane, priority, owner_identity_id, lineage_parent_id,
                       rank_n, rank_reason, sources_json)
                    VALUES (%s, 'research', 'medium', 0, %s, %s, %s, %s)
                    """,
                    (
                        f["title"],
                        card_id,
                        f["rank"],
                        f["reason"],
                        json.dumps(f["sources"]),
                    ),
                )
            cur.execute("SELECT * FROM iki_factory_cards WHERE id = %s", (card_id,))
            return dict(cur.fetchone())
