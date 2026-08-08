"""Practice Own spine — Playbook + Campaign (Trader Development Phase 1).

Family B. Fail loud. No P&L. No rule engine.
"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone
from typing import Any


PLAYBOOK_STATUSES = frozenset({"active", "archived"})
CAMPAIGN_STATUSES = frozenset({"planned", "active", "completed", "abandoned"})
# planned ↔ active (pause/resume); completed | abandoned are terminals (new campaign to restart)
_CAMPAIGN_TRANSITIONS: dict[str, frozenset[str]] = {
    "planned": frozenset({"active", "abandoned"}),
    "active": frozenset({"planned", "completed", "abandoned"}),  # planned = pause
    "completed": frozenset(),
    "abandoned": frozenset(),
}


class PracticeSpineError(Exception):
    def __init__(self, code: int, detail: str, *, extra: dict | None = None):
        self.code = code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _iso(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        return v.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return str(v)


def _parse_dt(raw: Any) -> datetime | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw.replace(tzinfo=None) if raw.tzinfo else raw
    s = str(raw).replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        return dt.replace(tzinfo=None) if dt.tzinfo else dt
    except ValueError as exc:
        raise PracticeSpineError(422, f"invalid datetime: {raw!r}") from exc


def _export_key(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(8)}"


def _json_loads(raw: Any) -> dict | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            v = json.loads(raw)
            return v if isinstance(v, dict) else None
        except json.JSONDecodeError:
            return None
    return None


# ── Playbook ────────────────────────────────────────────────────────────────


def serialize_playbook(row: dict) -> dict:
    return {
        "id": int(row["id"]),
        "title": row.get("title") or "",
        "body_md": row.get("body_md") or "",
        "structured": _json_loads(row.get("structured_json")) or {},
        "status": row.get("status") or "active",
        "export_key": row.get("export_key"),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def list_playbooks(cur, identity_id: int, *, include_archived: bool = False) -> list[dict]:
    if include_archived:
        cur.execute(
            """SELECT * FROM member_playbook_entries
               WHERE identity_id = %s ORDER BY updated_at DESC, id DESC""",
            (identity_id,),
        )
    else:
        cur.execute(
            """SELECT * FROM member_playbook_entries
               WHERE identity_id = %s AND status = 'active'
               ORDER BY updated_at DESC, id DESC""",
            (identity_id,),
        )
    return [serialize_playbook(r) for r in cur.fetchall() or []]


def get_playbook(cur, identity_id: int, entry_id: int) -> dict | None:
    cur.execute(
        """SELECT * FROM member_playbook_entries
           WHERE id = %s AND identity_id = %s""",
        (entry_id, identity_id),
    )
    row = cur.fetchone()
    return serialize_playbook(row) if row else None


def create_playbook(
    cur,
    identity_id: int,
    *,
    title: str,
    body_md: str = "",
    structured: dict | None = None,
) -> dict:
    title = (title or "").strip()
    if not title:
        raise PracticeSpineError(422, "title is required")
    if len(title) > 255:
        raise PracticeSpineError(422, "title max 255 characters")
    sj = json.dumps(structured) if isinstance(structured, dict) and structured else None
    key = _export_key("pb")
    cur.execute(
        """INSERT INTO member_playbook_entries
             (identity_id, title, body_md, structured_json, status, export_key)
           VALUES (%s, %s, %s, %s, 'active', %s)""",
        (identity_id, title, body_md or "", sj, key),
    )
    eid = int(cur.lastrowid)
    out = get_playbook(cur, identity_id, eid)
    assert out is not None
    return out


def patch_playbook(
    cur,
    identity_id: int,
    entry_id: int,
    *,
    title: str | None = None,
    body_md: str | None = None,
    structured: dict | None = None,
    status: str | None = None,
) -> dict:
    row = get_playbook(cur, identity_id, entry_id)
    if not row:
        raise PracticeSpineError(404, "Playbook entry not found")
    new_title = row["title"] if title is None else (title or "").strip()
    if not new_title:
        raise PracticeSpineError(422, "title is required")
    new_body = row["body_md"] if body_md is None else (body_md or "")
    new_status = row["status"] if status is None else status.strip().lower()
    if new_status not in PLAYBOOK_STATUSES:
        raise PracticeSpineError(422, "status must be active|archived")
    if structured is None:
        sj = json.dumps(row.get("structured") or {}) if row.get("structured") else None
        # keep existing from DB
        cur.execute(
            "SELECT structured_json FROM member_playbook_entries WHERE id = %s",
            (entry_id,),
        )
        existing = cur.fetchone()
        sj = existing.get("structured_json") if existing else None
    else:
        sj = json.dumps(structured) if structured else None
    cur.execute(
        """UPDATE member_playbook_entries
           SET title = %s, body_md = %s, structured_json = %s, status = %s
           WHERE id = %s AND identity_id = %s""",
        (new_title[:255], new_body, sj, new_status, entry_id, identity_id),
    )
    out = get_playbook(cur, identity_id, entry_id)
    assert out is not None
    return out


def assert_playbook_owned(cur, identity_id: int, entry_id: int | None) -> None:
    if entry_id is None:
        return
    cur.execute(
        """SELECT id FROM member_playbook_entries
           WHERE id = %s AND identity_id = %s""",
        (entry_id, identity_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(404, "Playbook entry not found")


# ── Campaigns ───────────────────────────────────────────────────────────────


def serialize_campaign(cur, row: dict) -> dict:
    cid = int(row["id"])
    cur.execute(
        """SELECT playbook_entry_id FROM member_practice_campaign_playbooks
           WHERE campaign_id = %s ORDER BY playbook_entry_id""",
        (cid,),
    )
    pids = [int(r["playbook_entry_id"]) for r in cur.fetchall() or []]
    cap = row.get("starting_capital")
    try:
        starting_capital = float(cap) if cap is not None else None
    except (TypeError, ValueError):
        starting_capital = None
    account_id = row.get("account_id")
    try:
        account_id_out = int(account_id) if account_id is not None else None
    except (TypeError, ValueError):
        account_id_out = None
    return {
        "id": cid,
        "title": row.get("title") or "",
        "status": row.get("status") or "planned",
        "account_id": account_id_out,
        "starts_at": _iso(row.get("starts_at")),
        "ends_at": _iso(row.get("ends_at")),
        "activated_at": _iso(row.get("activated_at")),
        "starting_capital": starting_capital,
        "goals_md": row.get("goals_md") or "",
        # Account default / ledger (structured practice)
        "is_default": bool(int(row.get("is_default") or 0)),
        "is_ledger": bool(int(row.get("is_ledger") or 0)),
        "has_cover": bool(row.get("cover_storage_key")),
        "cover_url": (
            f"/api/me/practice/campaigns/{cid}/cover/bytes"
            if row.get("cover_storage_key")
            else None
        ),
        "signed_at": _iso(row.get("signed_at")),
        "signed_terms": _parse_signed_terms(row.get("signed_terms")),
        "signed_terms_backfilled": bool(int(row.get("signed_terms_backfilled") or 0)),
        "predecessor_campaign_id": (
            int(row["predecessor_campaign_id"])
            if row.get("predecessor_campaign_id") is not None
            else None
        ),
        "cycle_number": None,  # filled by attach_lineage when requested
        "playbook_entry_ids": pids,
        "export_key": row.get("export_key"),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


# Charter fields for signature + amendments (Concept Spec §4.5.1)
_CHARTER_FIELDS = (
    "title",
    "goals_md",
    "starting_capital",
    "account_id",
    "starts_at",
    "ends_at",
)


def _parse_signed_terms(raw: Any) -> dict | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        try:
            out = json.loads(raw)
            return out if isinstance(out, dict) else None
        except (TypeError, ValueError):
            return None
    return None


def _charter_snapshot(row: dict) -> dict:
    """JSON-serializable charter snapshot from a campaign row or values."""
    def _v(key: str):
        val = row.get(key)
        if key in ("starts_at", "ends_at") and val is not None:
            return _iso(val)
        if key == "starting_capital" and val is not None:
            try:
                return float(val)
            except (TypeError, ValueError):
                return None
        if key == "account_id" and val is not None:
            try:
                return int(val)
            except (TypeError, ValueError):
                return None
        if key == "goals_md":
            return (val or "") if val is not None else ""
        if key == "title":
            return str(val or "")
        return val

    return {k: _v(k) for k in _CHARTER_FIELDS}


def _encode_amend_value(val: Any) -> str | None:
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return json.dumps(val, default=str)
    if isinstance(val, datetime):
        return _iso(val)
    return str(val)


def _insert_amendment(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    field: str,
    old_value: Any,
    new_value: Any,
    amended_at: datetime | None = None,
    note_md: str | None = None,
) -> None:
    at = amended_at or _utcnow()
    cur.execute(
        """INSERT INTO member_practice_campaign_amendments
             (identity_id, campaign_id, amended_at, field, old_value, new_value,
              note_md, export_key)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            identity_id,
            campaign_id,
            at,
            field[:64],
            _encode_amend_value(old_value),
            _encode_amend_value(new_value),
            (note_md or "").strip() or None,
            _export_key("camd"),
        ),
    )


def _apply_signature(cur, identity_id: int, campaign_id: int, row: dict) -> None:
    """Stamp signed_at + signed_terms once (first activation)."""
    if row.get("signed_at") is not None:
        return
    snap = _charter_snapshot(row)
    cur.execute(
        """UPDATE member_practice_campaigns
           SET signed_at = %s, signed_terms = %s, signed_terms_backfilled = 0
           WHERE id = %s AND identity_id = %s AND signed_at IS NULL""",
        (_utcnow(), json.dumps(snap), campaign_id, identity_id),
    )


def cycle_number_for(cur, identity_id: int, campaign_id: int) -> int:
    """Derived cycle depth from root via predecessor_campaign_id (1 = root)."""
    n = 1
    seen: set[int] = set()
    cid = int(campaign_id)
    while cid and cid not in seen:
        seen.add(cid)
        cur.execute(
            """SELECT predecessor_campaign_id FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (cid, identity_id),
        )
        r = cur.fetchone()
        if not r or r.get("predecessor_campaign_id") is None:
            break
        cid = int(r["predecessor_campaign_id"])
        n += 1
        if n > 100:
            break
    return n


def attach_lineage(cur, identity_id: int, camp: dict) -> dict:
    """Add cycle_number + predecessor title for editor chrome."""
    cid = int(camp["id"])
    camp["cycle_number"] = cycle_number_for(cur, identity_id, cid)
    pred = camp.get("predecessor_campaign_id")
    if pred:
        cur.execute(
            """SELECT id, title, status FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (int(pred), identity_id),
        )
        pr = cur.fetchone()
        camp["predecessor"] = (
            {
                "id": int(pr["id"]),
                "title": pr.get("title") or "",
                "status": pr.get("status") or "",
            }
            if pr
            else None
        )
    else:
        camp["predecessor"] = None
    return camp


def list_amendments(cur, identity_id: int, campaign_id: int) -> list[dict]:
    if get_campaign(cur, identity_id, campaign_id) is None:
        raise PracticeSpineError(404, "Campaign not found")
    cur.execute(
        """SELECT * FROM member_practice_campaign_amendments
           WHERE identity_id = %s AND campaign_id = %s
           ORDER BY amended_at ASC, id ASC""",
        (identity_id, campaign_id),
    )
    out = []
    for r in cur.fetchall() or []:
        out.append(
            {
                "id": int(r["id"]),
                "campaign_id": int(r["campaign_id"]),
                "amended_at": _iso(r.get("amended_at")),
                "field": r.get("field") or "",
                "old_value": r.get("old_value"),
                "new_value": r.get("new_value"),
                "note_md": r.get("note_md") or "",
                "export_key": r.get("export_key"),
            }
        )
    return out


def ensure_ledgers_for_identity(cur, identity_id: int) -> list[dict]:
    """§2.1 Practice provision — ledger for every active trade account.

    Idempotent. Lawful on campaign library load (Practice-suite touch), not a
    silent invent of member *charters* — only furniture ledgers.
    """
    cur.execute(
        """SELECT id FROM member_trade_log_accounts
           WHERE identity_id = %s AND status = 'active'
           ORDER BY id ASC""",
        (identity_id,),
    )
    out = []
    for r in cur.fetchall() or []:
        out.append(ensure_ledger_campaign(cur, identity_id, int(r["id"])))
    if not out:
        # No active book — ensure Primary + ledger
        aid = _ensure_primary_trade_account(cur, identity_id)
        out.append(ensure_ledger_campaign(cur, identity_id, aid))
    return out


def list_campaigns(cur, identity_id: int) -> list[dict]:
    # Practice-suite touch: ensure furniture so library is never hollow after migrate
    ensure_ledgers_for_identity(cur, identity_id)
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s
           ORDER BY
             CASE WHEN is_ledger = 1 THEN 0 ELSE 1 END,
             CASE status
               WHEN 'active' THEN 0
               WHEN 'planned' THEN 1
               WHEN 'completed' THEN 2
               ELSE 3
             END,
             updated_at DESC, id DESC""",
        (identity_id,),
    )
    out = []
    for r in cur.fetchall() or []:
        camp = serialize_campaign(cur, r)
        # Cycle chip for library (derived; few rows per member)
        camp["cycle_number"] = cycle_number_for(cur, identity_id, int(camp["id"]))
        out.append(camp)
    return out


def get_campaign(
    cur, identity_id: int, campaign_id: int, *, with_lineage: bool = False
) -> dict | None:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        return None
    camp = serialize_campaign(cur, row)
    if with_lineage:
        return attach_lineage(cur, identity_id, camp)
    return camp


def get_active_campaign(
    cur, identity_id: int, *, account_id: int | None = None
) -> dict | None:
    """One active campaign for stamp/prefill convenience (not exclusive).

    Law 3: memory → ledger → most recently activated. Multi-active remains.
    """
    if account_id is not None:
        mem = get_campaign_memory(cur, identity_id, int(account_id))
        if mem is not None:
            cur.execute(
                """SELECT * FROM member_practice_campaigns
                   WHERE id = %s AND identity_id = %s AND status = 'active'
                     AND account_id = %s""",
                (mem, identity_id, int(account_id)),
            )
            row = cur.fetchone()
            if row:
                return serialize_campaign(cur, row)
        ledger = get_ledger_campaign(cur, identity_id, int(account_id))
        if ledger and ledger.get("status") == "active":
            return ledger
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE identity_id = %s AND status = 'active' AND account_id = %s
               ORDER BY activated_at DESC, id DESC
               LIMIT 1""",
            (identity_id, int(account_id)),
        )
    else:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE identity_id = %s AND status = 'active'
               ORDER BY
                 CASE WHEN is_ledger = 1 THEN 1 ELSE 0 END,
                 activated_at DESC,
                 id DESC
               LIMIT 1""",
            (identity_id,),
        )
    row = cur.fetchone()
    return serialize_campaign(cur, row) if row else None


def list_active_campaigns(
    cur, identity_id: int, *, account_id: int | None = None
) -> list[dict]:
    """All active campaigns for scope, ordered by prefill rule (B2 + is_default).

    When ``account_id`` is set: account-bound + unbound actives (unbound appears
    for every account filter). Ordered: default first, account-bound, activated_at.
    """
    if account_id is not None:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE identity_id = %s AND status = 'active'
                 AND (account_id = %s OR account_id IS NULL)
               ORDER BY
                 CASE WHEN is_default = 1 AND account_id = %s THEN 0 ELSE 1 END,
                 CASE WHEN account_id = %s THEN 0 ELSE 1 END,
                 activated_at DESC,
                 id DESC""",
            (identity_id, account_id, account_id, account_id),
        )
    else:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE identity_id = %s AND status = 'active'
               ORDER BY
                 CASE WHEN is_default = 1 THEN 0 ELSE 1 END,
                 activated_at DESC,
                 id DESC""",
            (identity_id,),
        )
    return [serialize_campaign(cur, r) for r in cur.fetchall() or []]


def get_default_campaign(
    cur, identity_id: int, account_id: int
) -> dict | None:
    """Account ledger (is_ledger) or legacy is_default book."""
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s AND account_id = %s
             AND (is_ledger = 1 OR is_default = 1)
           ORDER BY
             CASE WHEN is_ledger = 1 THEN 0 ELSE 1 END,
             CASE status WHEN 'active' THEN 0 ELSE 1 END,
             id DESC
           LIMIT 1""",
        (identity_id, int(account_id)),
    )
    row = cur.fetchone()
    return serialize_campaign(cur, row) if row else None


def get_ledger_campaign(
    cur, identity_id: int, account_id: int
) -> dict | None:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s AND account_id = %s AND is_ledger = 1
           ORDER BY id ASC LIMIT 1""",
        (identity_id, int(account_id)),
    )
    row = cur.fetchone()
    return serialize_campaign(cur, row) if row else None


def _clear_default_for_account(
    cur, identity_id: int, account_id: int, *, except_id: int | None = None
) -> None:
    """Clear is_default on non-ledger rows only (ledger keeps is_default=1)."""
    if except_id is None:
        cur.execute(
            """UPDATE member_practice_campaigns
               SET is_default = 0
               WHERE identity_id = %s AND account_id = %s
                 AND is_default = 1 AND is_ledger = 0""",
            (identity_id, int(account_id)),
        )
    else:
        cur.execute(
            """UPDATE member_practice_campaigns
               SET is_default = 0
               WHERE identity_id = %s AND account_id = %s AND is_default = 1
                 AND is_ledger = 0 AND id <> %s""",
            (identity_id, int(account_id), int(except_id)),
        )


def _unique_campaign_title(
    cur, identity_id: int, title: str, *, except_id: int | None = None
) -> str:
    """Law 6 — unique title per identity including archive; auto-suffix."""
    base = (title or "").strip()[:255] or "Campaign"
    candidate = base
    n = 0
    while True:
        if except_id is None:
            cur.execute(
                """SELECT id FROM member_practice_campaigns
                   WHERE identity_id = %s AND title = %s LIMIT 1""",
                (identity_id, candidate),
            )
        else:
            cur.execute(
                """SELECT id FROM member_practice_campaigns
                   WHERE identity_id = %s AND title = %s AND id <> %s LIMIT 1""",
                (identity_id, candidate, int(except_id)),
            )
        if not cur.fetchone():
            return candidate
        n += 1
        suffix = f" ({n})"
        candidate = (base[: 255 - len(suffix)] + suffix)[:255]


def set_campaign_memory(
    cur, identity_id: int, account_id: int, campaign_id: int
) -> None:
    """Law 3 — last account↔campaign pair (server-side)."""
    account_id = int(account_id)
    campaign_id = int(campaign_id)
    cur.execute(
        """SELECT id FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s AND account_id = %s""",
        (campaign_id, identity_id, account_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(
            422, "memory campaign must belong to the same account"
        )
    cur.execute(
        """INSERT INTO member_practice_campaign_memory
             (identity_id, account_id, campaign_id)
           VALUES (%s, %s, %s)
           ON DUPLICATE KEY UPDATE campaign_id = VALUES(campaign_id)""",
        (identity_id, account_id, campaign_id),
    )


def get_campaign_memory(
    cur, identity_id: int, account_id: int
) -> int | None:
    cur.execute(
        """SELECT campaign_id FROM member_practice_campaign_memory
           WHERE identity_id = %s AND account_id = %s""",
        (identity_id, int(account_id)),
    )
    row = cur.fetchone()
    if not row:
        return None
    return int(row["campaign_id"])


def resolve_trade_campaign_id(
    cur,
    identity_id: int,
    account_id: int,
    *,
    practice_campaign_id: int | None = None,
    stamped_by: str | None = None,
    update_memory: bool = True,
) -> tuple[int, str]:
    """Law 2/3 — resolve campaign for a trade stamp.

    Returns (campaign_id, stamped_by).
    explicit id → member; else memory if valid; else ledger.
    """
    account_id = int(account_id)
    if practice_campaign_id is not None:
        cid = int(practice_campaign_id)
        cur.execute(
            """SELECT id, account_id, status FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (cid, identity_id),
        )
        row = cur.fetchone()
        if not row:
            raise PracticeSpineError(404, "Campaign not found")
        if row.get("account_id") is None or int(row["account_id"]) != account_id:
            raise PracticeSpineError(
                422, "Campaign is not bound to this trade account"
            )
        if update_memory:
            set_campaign_memory(cur, identity_id, account_id, cid)
        return cid, (stamped_by or "member")

    mem = get_campaign_memory(cur, identity_id, account_id)
    if mem is not None:
        cur.execute(
            """SELECT id, account_id FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (mem, identity_id),
        )
        mrow = cur.fetchone()
        if mrow and mrow.get("account_id") is not None and int(mrow["account_id"]) == account_id:
            return mem, "memory"

    ledger = ensure_ledger_campaign(cur, identity_id, account_id)
    lid = int(ledger["id"])
    if update_memory:
        set_campaign_memory(cur, identity_id, account_id, lid)
    return lid, "memory"


def ensure_ledger_campaign(
    cur,
    identity_id: int,
    account_id: int,
    *,
    title: str | None = None,
) -> dict:
    """Law 1 — get or create account ledger (furniture, never signed)."""
    account_id = int(account_id)
    _assert_account_owned(cur, identity_id, account_id)
    existing = get_ledger_campaign(cur, identity_id, account_id)
    if existing:
        # Heal: keep active, never signed
        if existing.get("status") != "active" or existing.get("signed_at"):
            cur.execute(
                """UPDATE member_practice_campaigns
                   SET status = 'active', is_default = 1, is_ledger = 1,
                       signed_at = NULL, signed_terms = NULL,
                       signed_terms_backfilled = 0
                   WHERE id = %s AND identity_id = %s""",
                (int(existing["id"]), identity_id),
            )
            out = get_campaign(cur, identity_id, int(existing["id"]))
            assert out is not None
            return out
        return existing

    # Promote legacy is_default non-ledger if present
    legacy = get_default_campaign(cur, identity_id, account_id)
    if legacy and not legacy.get("is_ledger"):
        cur.execute(
            """UPDATE member_practice_campaigns
               SET is_ledger = 1, is_default = 1, status = 'active',
                   signed_at = NULL, signed_terms = NULL,
                   signed_terms_backfilled = 0
               WHERE id = %s AND identity_id = %s""",
            (int(legacy["id"]), identity_id),
        )
        out = get_campaign(cur, identity_id, int(legacy["id"]))
        assert out is not None
        return out

    cur.execute(
        """SELECT label, created_at FROM member_trade_log_accounts
           WHERE id = %s AND identity_id = %s""",
        (account_id, identity_id),
    )
    row = cur.fetchone() or {}
    label = (row.get("label") or "Default").strip() or "Default"
    book_title = _unique_campaign_title(
        cur, identity_id, (title or f"Default — {label}").strip()[:255]
    )
    starts = row.get("created_at")
    return create_campaign(
        cur,
        identity_id,
        title=book_title,
        activate=True,
        account_id=account_id,
        is_default=True,
        is_ledger=True,
        starts_at=starts,
        goals_md=None,
    )


def ensure_default_book_campaign(
    cur,
    identity_id: int,
    account_id: int,
    *,
    title: str | None = None,
    goals_md: str | None = None,
) -> dict:
    """Compat alias → ledger (structured practice Law 1)."""
    return ensure_ledger_campaign(
        cur, identity_id, account_id, title=title
    )


def on_account_created(cur, identity_id: int, account_id: int) -> dict:
    """Call after every trade-account insert — genesis ledger."""
    return ensure_ledger_campaign(cur, identity_id, int(account_id))


def _ensure_primary_trade_account(cur, identity_id: int) -> int:
    """Return an active trade account id; create Default if the member has none."""
    cur.execute(
        """SELECT id FROM member_trade_log_accounts
           WHERE identity_id = %s AND status = 'active'
           ORDER BY
             CASE label
               WHEN 'Default' THEN 0
               WHEN 'Primary' THEN 1
               ELSE 2
             END,
             sort_order ASC, id ASC
           LIMIT 1""",
        (identity_id,),
    )
    row = cur.fetchone()
    if row:
        return int(row["id"])
    cur.execute(
        """INSERT INTO member_trade_log_accounts
             (identity_id, label, broker, status, sort_order, notes_md)
           VALUES (%s, 'Default', 'unset', 'active', 10, %s)""",
        (
            identity_id,
            "Auto-created with first campaign visit.",
        ),
    )
    aid = int(cur.lastrowid)
    ensure_ledger_campaign(cur, identity_id, aid)
    return aid


def ensure_starter_default_campaign(cur, identity_id: int) -> dict | None:
    """Campaign nav cold-start: ensure Default account + ledger furniture.

    If the identity already has any campaign, no-op (return None).
    """
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_practice_campaigns
           WHERE identity_id = %s""",
        (identity_id,),
    )
    n = int((cur.fetchone() or {}).get("n") or 0)
    if n > 0:
        return None
    # Spec §2.1 — Default account + ledger furniture
    account_id = _ensure_primary_trade_account(cur, identity_id)
    return ensure_ledger_campaign(cur, identity_id, account_id)

def _assert_account_owned(
    cur, identity_id: int, account_id: int | None
) -> None:
    if account_id is None:
        return
    cur.execute(
        """SELECT id FROM member_trade_log_accounts
           WHERE id = %s AND identity_id = %s""",
        (account_id, identity_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(404, "Trade Log account not found")


def _set_campaign_playbooks(
    cur, identity_id: int, campaign_id: int, playbook_ids: list[int]
) -> None:
    cleaned: list[int] = []
    for raw in playbook_ids:
        try:
            pid = int(raw)
        except (TypeError, ValueError):
            continue
        assert_playbook_owned(cur, identity_id, pid)
        if pid not in cleaned:
            cleaned.append(pid)
    cur.execute(
        "DELETE FROM member_practice_campaign_playbooks WHERE campaign_id = %s",
        (campaign_id,),
    )
    for pid in cleaned:
        cur.execute(
            """INSERT INTO member_practice_campaign_playbooks
                 (campaign_id, playbook_entry_id) VALUES (%s, %s)""",
            (campaign_id, pid),
        )


def create_campaign(
    cur,
    identity_id: int,
    *,
    title: str,
    starts_at: Any = None,
    ends_at: Any = None,
    playbook_entry_ids: list[int] | None = None,
    activate: bool = False,
    account_id: int | None = None,
    starting_capital: float | None = None,
    goals_md: str | None = None,
    is_default: bool = False,
    is_ledger: bool = False,
) -> dict:
    title = (title or "").strip()
    if not title:
        raise PracticeSpineError(422, "title is required")
    # Law 4 — every campaign binds one account (ensure Primary if omitted)
    if account_id is None:
        account_id = _ensure_primary_trade_account(cur, identity_id)
    start = _parse_dt(starts_at)
    end = _parse_dt(ends_at)
    if start and end and end < start:
        raise PracticeSpineError(422, "ends_at must be on or after starts_at")
    _assert_account_owned(cur, identity_id, account_id)
    if is_ledger:
        if account_id is None:
            raise PracticeSpineError(422, "ledger campaign requires account_id")
        is_default = True
        activate = True
    if is_default:
        if account_id is None:
            raise PracticeSpineError(
                422, "default book campaign requires account_id"
            )
        activate = True
    status = "active" if activate else "planned"
    key = _export_key("camp")
    cap = None
    if starting_capital is not None:
        try:
            cap = float(starting_capital)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "starting_capital must be a number") from exc
        if cap < 0:
            raise PracticeSpineError(422, "starting_capital must be ≥ 0")
    goals = (goals_md or "").strip() or None
    if is_ledger:
        goals = None  # ledger has no charter prose by definition
    activated = _utcnow() if status == "active" else None
    if is_default and account_id is not None and not is_ledger:
        _clear_default_for_account(cur, identity_id, int(account_id))
    title = _unique_campaign_title(cur, identity_id, title)
    cur.execute(
        """INSERT INTO member_practice_campaigns
             (identity_id, account_id, title, status, activated_at, starts_at, ends_at,
              starting_capital, goals_md, is_default, is_ledger, export_key)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            identity_id,
            account_id,
            title[:255],
            status,
            activated,
            start,
            end,
            cap,
            goals,
            1 if is_default else 0,
            1 if is_ledger else 0,
            key,
        ),
    )
    cid = int(cur.lastrowid)
    if playbook_entry_ids is not None and not is_ledger:
        _set_campaign_playbooks(cur, identity_id, cid, playbook_entry_ids)
    # First activation = signature — never for ledger
    if status == "active" and not is_ledger:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (cid, identity_id),
        )
        crow = cur.fetchone()
        if crow:
            _apply_signature(cur, identity_id, cid, crow)
    out = get_campaign(cur, identity_id, cid)
    assert out is not None
    return out


def patch_campaign(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    title: str | None = None,
    starts_at: Any = ...,
    ends_at: Any = ...,
    status: str | None = None,
    playbook_entry_ids: list[int] | None = None,
    account_id: Any = ...,
    starting_capital: Any = ...,
    goals_md: Any = ...,
    is_default: Any = ...,
) -> dict:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    is_ledger = bool(int(row.get("is_ledger") or 0))
    cur_status = str(row["status"] or "planned")
    terminal = cur_status in ("completed", "abandoned")

    # Ledger lifecycle guards (furniture — never complete/end/pause/renew via status)
    if is_ledger and status is not None:
        ns = status.strip().lower()
        if ns != cur_status:
            raise PracticeSpineError(
                422, "Ledger campaign cannot change lifecycle status"
            )

    # Compute new values first
    new_title = row["title"] if title is None else (title or "").strip()
    if not new_title:
        raise PracticeSpineError(422, "title is required")
    if title is not None:
        new_title = _unique_campaign_title(
            cur, identity_id, new_title, except_id=campaign_id
        )
    new_start = row["starts_at"] if starts_at is ... else _parse_dt(starts_at)
    new_end = row["ends_at"] if ends_at is ... else _parse_dt(ends_at)
    if new_start and new_end and new_end < new_start:
        raise PracticeSpineError(422, "ends_at must be on or after starts_at")
    new_status = cur_status if status is None else status.strip().lower()
    if new_status not in CAMPAIGN_STATUSES:
        raise PracticeSpineError(422, "invalid campaign status")
    if new_status != cur_status:
        allowed = _CAMPAIGN_TRANSITIONS.get(cur_status, frozenset())
        if new_status not in allowed:
            raise PracticeSpineError(
                422,
                f"cannot transition campaign from {cur_status!r} to {new_status!r}",
            )
    if account_id is ...:
        new_account = row.get("account_id")
    elif account_id is None or account_id == "":
        if is_ledger:
            raise PracticeSpineError(422, "Ledger campaign requires account_id")
        # Law 4 — no unbound campaigns
        raise PracticeSpineError(422, "account_id is required")
    else:
        try:
            new_account = int(account_id)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "account_id must be an integer") from exc
        _assert_account_owned(cur, identity_id, new_account)
        if is_ledger and new_account != row.get("account_id"):
            raise PracticeSpineError(
                422, "Ledger cannot move between accounts — instantiate a copy instead"
            )
    if starting_capital is ...:
        new_cap = row.get("starting_capital")
    elif starting_capital is None or starting_capital == "":
        new_cap = None
    else:
        try:
            new_cap = float(starting_capital)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "starting_capital must be a number") from exc
        if new_cap < 0:
            raise PracticeSpineError(422, "starting_capital must be ≥ 0")
    if goals_md is ...:
        new_goals = row.get("goals_md")
    else:
        new_goals = (str(goals_md) if goals_md is not None else "").strip() or None
    if is_default is ...:
        new_default = bool(int(row.get("is_default") or 0))
    else:
        new_default = bool(is_default)
    if new_default and new_account is None:
        raise PracticeSpineError(422, "default book campaign requires account_id")
    if new_status != "active":
        new_default = False

    # Terminal = charter read-only (status already terminal; only allow no-op)
    charter_touched = any(
        (
            title is not None,
            starts_at is not ...,
            ends_at is not ...,
            account_id is not ...,
            starting_capital is not ...,
            goals_md is not ...,
        )
    )
    if terminal and (charter_touched or (status is not None and new_status != cur_status)):
        # Allow no actual change; reject real edits
        if charter_touched or new_status != cur_status:
            raise PracticeSpineError(
                422,
                "Terminal campaigns are read-only — renew instead of editing",
            )

    if new_status == "active" and cur_status != "active":
        new_activated = _utcnow()
    elif new_status == "planned":
        new_activated = row.get("activated_at")
    elif new_status in ("completed", "abandoned"):
        new_activated = None
    else:
        new_activated = row.get("activated_at")

    # Amendment records when signed (or after we are about to sign via activate)
    was_signed = row.get("signed_at") is not None
    will_sign = (
        new_status == "active"
        and cur_status != "active"
        and not was_signed
    )
    # After first sign, charter edits on active/paused produce amendments
    record_amends = was_signed and not terminal
    amend_at = _utcnow()
    if record_amends:
        old_snap = _charter_snapshot(row)
        new_snap = {
            "title": new_title[:255],
            "goals_md": new_goals or "",
            "starting_capital": new_cap,
            "account_id": (
                int(new_account) if new_account is not None else None
            ),
            "starts_at": _iso(new_start),
            "ends_at": _iso(new_end),
        }
        for field in _CHARTER_FIELDS:
            ov, nv = old_snap.get(field), new_snap.get(field)
            # normalize empty goals
            if field == "goals_md":
                ov = ov or ""
                nv = nv or ""
            if ov != nv:
                _insert_amendment(
                    cur,
                    identity_id,
                    campaign_id,
                    field=field,
                    old_value=ov,
                    new_value=nv,
                    amended_at=amend_at,
                )
        if new_status != cur_status:
            _insert_amendment(
                cur,
                identity_id,
                campaign_id,
                field="status",
                old_value=cur_status,
                new_value=new_status,
                amended_at=amend_at,
            )

    if new_default and new_account is not None:
        _clear_default_for_account(
            cur, identity_id, int(new_account), except_id=campaign_id
        )
    cur.execute(
        """UPDATE member_practice_campaigns
           SET title = %s, starts_at = %s, ends_at = %s, status = %s,
               activated_at = %s,
               account_id = %s, starting_capital = %s, goals_md = %s,
               is_default = %s
           WHERE id = %s AND identity_id = %s""",
        (
            new_title[:255],
            new_start,
            new_end,
            new_status,
            new_activated,
            new_account,
            new_cap,
            new_goals,
            1 if new_default else 0,
            campaign_id,
            identity_id,
        ),
    )
    if will_sign:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (campaign_id, identity_id),
        )
        crow = cur.fetchone()
        if crow:
            _apply_signature(cur, identity_id, campaign_id, crow)
    if playbook_entry_ids is not None:
        _set_campaign_playbooks(cur, identity_id, campaign_id, playbook_entry_ids)
    out = get_campaign(cur, identity_id, campaign_id)
    assert out is not None
    return out


def renew_campaign(cur, identity_id: int, campaign_id: int) -> dict:
    """Create draft successor from terminal campaign (§4.5.4)."""
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    if bool(int(row.get("is_ledger") or 0)):
        raise PracticeSpineError(422, "Ledger campaign cannot be renewed")
    st = str(row.get("status") or "")
    if st not in ("completed", "abandoned"):
        raise PracticeSpineError(
            422, "Only completed or abandoned campaigns can be renewed"
        )
    if row.get("account_id") is None:
        raise PracticeSpineError(422, "Campaign has no account — cannot renew")
    title = (row.get("title") or "Campaign").strip()
    # Avoid infinite " (cycle)" stacking — renew keeps base title
    new = create_campaign(
        cur,
        identity_id,
        title=title[:255],  # _unique_campaign_title suffixes on collision
        starts_at=row.get("starts_at"),
        ends_at=row.get("ends_at"),
        activate=False,
        account_id=int(row["account_id"]),
        starting_capital=row.get("starting_capital"),
        goals_md=row.get("goals_md"),
        is_default=False,
        is_ledger=False,
    )
    nid = int(new["id"])
    cur.execute(
        """UPDATE member_practice_campaigns
           SET predecessor_campaign_id = %s
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, nid, identity_id),
    )
    # Law 7 — successor draft inherits bounds (roles) as draft charter fields
    try:
        copy_bounds_to_campaign(cur, identity_id, campaign_id, nid)
    except PracticeSpineError:
        pass  # source may have zero bounds
    out = get_campaign(cur, identity_id, nid)
    assert out is not None
    return attach_lineage(cur, identity_id, out)


def campaign_has_references(cur, identity_id: int, campaign_id: int) -> bool:
    """True if any trade, journal session, or playbook link stamps this campaign."""
    cur.execute(
        """SELECT 1 FROM member_trade_log_trades
           WHERE identity_id = %s AND practice_campaign_id = %s LIMIT 1""",
        (identity_id, campaign_id),
    )
    if cur.fetchone():
        return True
    cur.execute(
        """SELECT 1 FROM member_journal_sessions
           WHERE identity_id = %s AND practice_campaign_id = %s LIMIT 1""",
        (identity_id, campaign_id),
    )
    if cur.fetchone():
        return True
    cur.execute(
        """SELECT 1 FROM member_practice_campaign_playbooks
           WHERE campaign_id = %s LIMIT 1""",
        (campaign_id,),
    )
    return cur.fetchone() is not None


def delete_campaign(cur, identity_id: int, campaign_id: int) -> None:
    """Hard-delete only when never signed and unreferenced (OD-PB-7 + §4.5.6).

    Signature is permanence: ``signed_at`` set → no hard-delete (abandon instead).
    Any trade, journal, or playbook stamp → no hard-delete.
    ``signed_at`` check applies once the lifecycle migration lands; until then
    only stamp/reference checks run (column absent on older hosts).
    """
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    if bool(int(row.get("is_ledger") or 0)):
        raise PracticeSpineError(
            409,
            "Ledger campaign cannot be deleted — retires with its account",
            extra={"campaign_id": campaign_id},
        )
    # Spec §4.5.6 (a): signature is permanence — when column exists
    if "signed_at" in row and row.get("signed_at") is not None:
        raise PracticeSpineError(
            409,
            "Campaign was signed — abandon instead of delete",
            extra={"campaign_id": campaign_id},
        )
    if campaign_has_references(cur, identity_id, campaign_id):
        raise PracticeSpineError(
            409,
            "Campaign has stamps or playbook links — complete or abandon instead of delete",
            extra={"campaign_id": campaign_id},
        )
    cur.execute(
        "DELETE FROM member_practice_campaigns WHERE id = %s AND identity_id = %s",
        (campaign_id, identity_id),
    )


def assert_campaign_owned(cur, identity_id: int, campaign_id: int | None) -> None:
    if campaign_id is None:
        return
    cur.execute(
        """SELECT id FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(404, "Campaign not found")


# ── Campaign cover image ─────────────────────────────────────────────────────

_CAMPAIGN_COVER_MAX = 5 * 1024 * 1024  # 5 MiB


def campaign_media_root():
    from pathlib import Path
    from config import get_config

    cfg = get_config()
    raw = getattr(cfg, "playbook_media_dir", None) or ""
    raw = (raw or "").strip()
    if raw:
        return Path(raw) / "campaign_covers"
    return Path(__file__).resolve().parent / "var" / "campaign_covers"


def set_campaign_cover_from_upload(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    content_type: str,
    data: bytes,
    original_name: str | None = None,
) -> dict:
    """Store cover image and point campaign at it. Images only."""
    row = get_campaign(cur, identity_id, campaign_id)
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    ct = (content_type or "").split(";")[0].strip().lower()
    if not ct.startswith("image/"):
        raise PracticeSpineError(
            422, "Cover must be an image (JPEG, PNG, WebP, GIF, …)"
        )
    if len(data) > _CAMPAIGN_COVER_MAX:
        raise PracticeSpineError(413, "Cover image exceeds 5 MB")
    # remove prior file if any
    cur.execute(
        """SELECT cover_storage_key FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    prev = cur.fetchone() or {}
    prev_key = prev.get("cover_storage_key")
    root = campaign_media_root()
    root.mkdir(parents=True, exist_ok=True)
    sub = root / str(identity_id)
    sub.mkdir(parents=True, exist_ok=True)
    name = f"{campaign_id}_{secrets.token_hex(8)}"
    fpath = sub / name
    fpath.write_bytes(data)
    storage_key = f"ccmedia:{identity_id}/{name}"
    cur.execute(
        """UPDATE member_practice_campaigns
           SET cover_storage_key = %s, cover_content_type = %s, cover_byte_size = %s
           WHERE id = %s AND identity_id = %s""",
        (storage_key, ct, len(data), campaign_id, identity_id),
    )
    if prev_key and str(prev_key).startswith("ccmedia:"):
        rel = str(prev_key)[len("ccmedia:") :]
        old = root / rel
        try:
            if old.is_file():
                old.unlink()
        except OSError:
            pass
    camp = get_campaign(cur, identity_id, campaign_id)
    return {
        "campaign": camp,
        "cover_url": camp.get("cover_url") if camp else None,
    }


def clear_campaign_cover(cur, identity_id: int, campaign_id: int) -> dict:
    """Clear cover pointer and delete file."""
    cur.execute(
        """SELECT cover_storage_key FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    key = row.get("cover_storage_key")
    cur.execute(
        """UPDATE member_practice_campaigns
           SET cover_storage_key = NULL, cover_content_type = NULL, cover_byte_size = NULL
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    if key and str(key).startswith("ccmedia:"):
        root = campaign_media_root()
        rel = str(key)[len("ccmedia:") :]
        path = root / rel
        try:
            if path.is_file():
                path.unlink()
        except OSError:
            pass
    camp = get_campaign(cur, identity_id, campaign_id)
    return {"campaign": camp}


def read_campaign_cover_bytes(
    cur, identity_id: int, campaign_id: int
) -> tuple[bytes, str]:
    cur.execute(
        """SELECT cover_storage_key, cover_content_type FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row or not row.get("cover_storage_key"):
        raise PracticeSpineError(404, "No cover image")
    key = str(row["cover_storage_key"])
    if not key.startswith("ccmedia:"):
        raise PracticeSpineError(500, "invalid cover storage key")
    rel = key[len("ccmedia:") :]
    path = campaign_media_root() / rel
    if not path.is_file():
        raise PracticeSpineError(404, "Cover file missing")
    ct = (row.get("cover_content_type") or "image/jpeg").split(";")[0]
    return path.read_bytes(), ct


# ── Charter bounds (Structured Practice Law 7 · Two Roles) ──────────────────

BOUND_ROLES = frozenset({"boundary", "goal"})
BOUND_ATTRIBUTES = frozenset(
    {
        # Process clauses (7a)
        "risk_per_trade",
        "position_size",
        "concurrent_open",
        "strategy_scope",
        "strategy_type_scope",
        "asset_type_scope",
        "asset_scope",
        "trading_window",
        # Statistical signature (7b)
        "avg_win_loss",
        "risk_to_reward",
        "drawdown",
        "sharpe",
        "win_rate",
        "profit_factor",
    }
)


def serialize_bound(row: dict) -> dict:
    def _f(key: str) -> float | None:
        v = row.get(key)
        if v is None:
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    n_floor = row.get("n_floor")
    try:
        n_floor_out = int(n_floor) if n_floor is not None else None
    except (TypeError, ValueError):
        n_floor_out = None
    return {
        "id": int(row["id"]),
        "campaign_id": int(row["campaign_id"]),
        "role": (row.get("role") or "boundary").strip().lower(),
        "attribute": row.get("attribute") or "",
        "unit": row.get("unit"),
        "basis": row.get("basis"),
        "window_kind": row.get("window_kind"),
        "range_low": _f("range_low"),
        "range_high": _f("range_high"),
        "is_critical": bool(int(row.get("is_critical") or 0)),
        "n_floor": n_floor_out,
        "export_key": row.get("export_key"),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def _campaign_row(cur, identity_id: int, campaign_id: int) -> dict:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    return row


def _assert_charter_not_ledger(row: dict) -> None:
    if bool(int(row.get("is_ledger") or 0)):
        raise PracticeSpineError(
            422, "Ledger campaign cannot carry bounds (furniture, not charter)"
        )


def _parse_optional_float(raw: Any, field: str) -> float | None:
    if raw is None or raw == "":
        return None
    try:
        return float(raw)
    except (TypeError, ValueError) as exc:
        raise PracticeSpineError(422, f"{field} must be a number") from exc


def list_bounds(cur, identity_id: int, campaign_id: int) -> list[dict]:
    _campaign_row(cur, identity_id, campaign_id)
    cur.execute(
        """SELECT * FROM member_practice_campaign_bounds
           WHERE identity_id = %s AND campaign_id = %s
           ORDER BY role ASC, attribute ASC, id ASC""",
        (identity_id, campaign_id),
    )
    return [serialize_bound(r) for r in cur.fetchall() or []]


def get_bound(cur, identity_id: int, campaign_id: int, bound_id: int) -> dict | None:
    cur.execute(
        """SELECT * FROM member_practice_campaign_bounds
           WHERE id = %s AND identity_id = %s AND campaign_id = %s""",
        (bound_id, identity_id, campaign_id),
    )
    row = cur.fetchone()
    return serialize_bound(row) if row else None


def _clear_other_critical(
    cur, identity_id: int, campaign_id: int, *, except_id: int | None = None
) -> None:
    if except_id is None:
        cur.execute(
            """UPDATE member_practice_campaign_bounds
               SET is_critical = 0
               WHERE identity_id = %s AND campaign_id = %s AND is_critical = 1""",
            (identity_id, campaign_id),
        )
    else:
        cur.execute(
            """UPDATE member_practice_campaign_bounds
               SET is_critical = 0
               WHERE identity_id = %s AND campaign_id = %s
                 AND is_critical = 1 AND id <> %s""",
            (identity_id, campaign_id, except_id),
        )


def create_bound(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    role: str,
    attribute: str,
    range_low: Any = None,
    range_high: Any = None,
    unit: str | None = None,
    basis: str | None = None,
    window_kind: str | None = None,
    is_critical: bool = False,
    n_floor: Any = None,
) -> dict:
    row = _campaign_row(cur, identity_id, campaign_id)
    _assert_charter_not_ledger(row)
    role_n = (role or "").strip().lower()
    if role_n not in BOUND_ROLES:
        raise PracticeSpineError(422, "role must be 'boundary' or 'goal'")
    attr = (attribute or "").strip().lower()
    if attr not in BOUND_ATTRIBUTES:
        raise PracticeSpineError(422, f"unknown bound attribute: {attribute!r}")
    if is_critical and role_n == "goal":
        raise PracticeSpineError(
            422,
            "is_critical is only allowed on boundary-role bounds "
            "(a goal cannot be the Invalidation clause)",
        )
    lo = _parse_optional_float(range_low, "range_low")
    hi = _parse_optional_float(range_high, "range_high")
    nf: int | None
    if n_floor is None or n_floor == "":
        nf = None
    else:
        try:
            nf = int(n_floor)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "n_floor must be an integer") from exc
        if nf < 0:
            raise PracticeSpineError(422, "n_floor must be ≥ 0")
    if is_critical:
        _clear_other_critical(cur, identity_id, campaign_id)
    key = _export_key("bnd")
    cur.execute(
        """INSERT INTO member_practice_campaign_bounds
             (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
              range_low, range_high, is_critical, n_floor, export_key)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            identity_id,
            campaign_id,
            role_n,
            attr,
            (unit or None),
            (basis or None),
            (window_kind or None),
            lo,
            hi,
            1 if is_critical else 0,
            nf,
            key,
        ),
    )
    bid = int(cur.lastrowid)
    # Post-signature bound create is a charter amendment
    if row.get("signed_at") is not None and str(row.get("status") or "") not in (
        "completed",
        "abandoned",
    ):
        _insert_amendment(
            cur,
            identity_id,
            campaign_id,
            field=f"bound.{role_n}.{attr}",
            old_value=None,
            new_value={"id": bid, "range_low": lo, "range_high": hi},
        )
    out = get_bound(cur, identity_id, campaign_id, bid)
    assert out is not None
    return out


def patch_bound(
    cur,
    identity_id: int,
    campaign_id: int,
    bound_id: int,
    *,
    role: Any = ...,
    attribute: Any = ...,
    range_low: Any = ...,
    range_high: Any = ...,
    unit: Any = ...,
    basis: Any = ...,
    window_kind: Any = ...,
    is_critical: Any = ...,
    n_floor: Any = ...,
) -> dict:
    camp = _campaign_row(cur, identity_id, campaign_id)
    _assert_charter_not_ledger(camp)
    cur.execute(
        """SELECT * FROM member_practice_campaign_bounds
           WHERE id = %s AND identity_id = %s AND campaign_id = %s""",
        (bound_id, identity_id, campaign_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Bound not found")

    new_role = (
        (row.get("role") or "boundary").strip().lower()
        if role is ...
        else str(role or "").strip().lower()
    )
    if new_role not in BOUND_ROLES:
        raise PracticeSpineError(422, "role must be 'boundary' or 'goal'")
    new_attr = (
        (row.get("attribute") or "")
        if attribute is ...
        else str(attribute or "").strip().lower()
    )
    if new_attr not in BOUND_ATTRIBUTES:
        raise PracticeSpineError(422, f"unknown bound attribute: {new_attr!r}")
    new_lo = (
        _parse_optional_float(row.get("range_low"), "range_low")
        if range_low is ...
        else _parse_optional_float(range_low, "range_low")
    )
    new_hi = (
        _parse_optional_float(row.get("range_high"), "range_high")
        if range_high is ...
        else _parse_optional_float(range_high, "range_high")
    )
    new_unit = row.get("unit") if unit is ... else (unit or None)
    new_basis = row.get("basis") if basis is ... else (basis or None)
    new_wk = row.get("window_kind") if window_kind is ... else (window_kind or None)
    new_crit = (
        bool(int(row.get("is_critical") or 0))
        if is_critical is ...
        else bool(is_critical)
    )
    if new_crit and new_role == "goal":
        raise PracticeSpineError(
            422,
            "is_critical is only allowed on boundary-role bounds "
            "(a goal cannot be the Invalidation clause)",
        )
    if n_floor is ...:
        new_nf = row.get("n_floor")
        try:
            new_nf = int(new_nf) if new_nf is not None else None
        except (TypeError, ValueError):
            new_nf = None
    elif n_floor is None or n_floor == "":
        new_nf = None
    else:
        try:
            new_nf = int(n_floor)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "n_floor must be an integer") from exc
        if new_nf < 0:
            raise PracticeSpineError(422, "n_floor must be ≥ 0")

    if new_crit:
        _clear_other_critical(
            cur, identity_id, campaign_id, except_id=bound_id
        )

    old_snap = serialize_bound(row)
    cur.execute(
        """UPDATE member_practice_campaign_bounds
           SET role = %s, attribute = %s, unit = %s, basis = %s, window_kind = %s,
               range_low = %s, range_high = %s, is_critical = %s, n_floor = %s
           WHERE id = %s AND identity_id = %s""",
        (
            new_role,
            new_attr,
            new_unit,
            new_basis,
            new_wk,
            new_lo,
            new_hi,
            1 if new_crit else 0,
            new_nf,
            bound_id,
            identity_id,
        ),
    )
    if camp.get("signed_at") is not None and str(camp.get("status") or "") not in (
        "completed",
        "abandoned",
    ):
        new_out = get_bound(cur, identity_id, campaign_id, bound_id)
        if new_out and (
            old_snap.get("role") != new_out.get("role")
            or old_snap.get("attribute") != new_out.get("attribute")
            or old_snap.get("range_low") != new_out.get("range_low")
            or old_snap.get("range_high") != new_out.get("range_high")
            or old_snap.get("is_critical") != new_out.get("is_critical")
            or old_snap.get("n_floor") != new_out.get("n_floor")
        ):
            _insert_amendment(
                cur,
                identity_id,
                campaign_id,
                field=f"bound.{new_role}.{new_attr}",
                old_value={
                    "range_low": old_snap.get("range_low"),
                    "range_high": old_snap.get("range_high"),
                    "role": old_snap.get("role"),
                    "is_critical": old_snap.get("is_critical"),
                },
                new_value={
                    "range_low": new_out.get("range_low"),
                    "range_high": new_out.get("range_high"),
                    "role": new_out.get("role"),
                    "is_critical": new_out.get("is_critical"),
                },
            )
    out = get_bound(cur, identity_id, campaign_id, bound_id)
    assert out is not None
    return out


def delete_bound(
    cur, identity_id: int, campaign_id: int, bound_id: int
) -> None:
    camp = _campaign_row(cur, identity_id, campaign_id)
    _assert_charter_not_ledger(camp)
    cur.execute(
        """SELECT * FROM member_practice_campaign_bounds
           WHERE id = %s AND identity_id = %s AND campaign_id = %s""",
        (bound_id, identity_id, campaign_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Bound not found")
    if camp.get("signed_at") is not None and str(camp.get("status") or "") not in (
        "completed",
        "abandoned",
    ):
        _insert_amendment(
            cur,
            identity_id,
            campaign_id,
            field=f"bound.{row.get('role')}.{row.get('attribute')}",
            old_value=serialize_bound(row),
            new_value=None,
        )
    cur.execute(
        """DELETE FROM member_practice_campaign_bounds
           WHERE id = %s AND identity_id = %s AND campaign_id = %s""",
        (bound_id, identity_id, campaign_id),
    )


def copy_bounds_to_campaign(
    cur, identity_id: int, source_campaign_id: int, dest_campaign_id: int
) -> int:
    """Copy bound rows to a draft successor (renew / instantiate). Returns count."""
    bounds = list_bounds(cur, identity_id, source_campaign_id)
    n = 0
    for b in bounds:
        create_bound(
            cur,
            identity_id,
            dest_campaign_id,
            role=str(b["role"]),
            attribute=str(b["attribute"]),
            range_low=b.get("range_low"),
            range_high=b.get("range_high"),
            unit=b.get("unit"),
            basis=b.get("basis"),
            window_kind=b.get("window_kind"),
            is_critical=bool(b.get("is_critical")),
            n_floor=b.get("n_floor"),
        )
        n += 1
    return n


def _default_n_floor(attribute: str) -> int:
    """Hotel-ish defaults; win_rate needs the highest sample."""
    if attribute == "win_rate":
        return 20
    if attribute in (
        "avg_win_loss",
        "risk_to_reward",
        "drawdown",
        "sharpe",
        "profit_factor",
    ):
        return 10
    return 1  # process clauses wake immediately


def _pnl_sample_as_of(
    cur, identity_id: int, campaign_id: int, as_of_day: str
) -> list[float]:
    cur.execute(
        """SELECT pnl_amount FROM member_trade_log_trades
           WHERE identity_id = %s AND practice_campaign_id = %s
             AND pnl_amount IS NOT NULL
             AND DATE(exec_at) <= %s
           ORDER BY exec_at ASC, id ASC""",
        (identity_id, campaign_id, as_of_day),
    )
    out: list[float] = []
    for r in cur.fetchall() or []:
        try:
            out.append(float(r["pnl_amount"]))
        except (TypeError, ValueError):
            continue
    return out


def _stat_readings_from_pnls(pnls: list[float]) -> dict[str, float | None]:
    """Signature attribute readings from closed P&Ls (campaign window)."""
    if not pnls:
        return {
            "win_rate": None,
            "profit_factor": None,
            "avg_win_loss": None,
            "drawdown": None,
            "risk_to_reward": None,
            "sharpe": None,
        }
    winners = [p for p in pnls if p > 0]
    losers = [p for p in pnls if p < 0]
    decided = len(winners) + len(losers)
    win_rate = (len(winners) / decided) * 100.0 if decided else None
    gp = sum(winners)
    gl = -sum(losers)
    if gl > 0:
        pf = gp / gl
    elif gp > 0:
        pf = None  # unbounded — treat as high alignment later
    else:
        pf = 0.0
    avg_w = sum(winners) / len(winners) if winners else 0.0
    avg_l = (-sum(losers) / len(losers)) if losers else 0.0
    if avg_l > 0:
        awl = avg_w / avg_l
    elif avg_w > 0:
        awl = None
    else:
        awl = 0.0
    # Max drawdown % of peak equity from starting 0 cumulative
    cum = 0.0
    peak = 0.0
    max_dd = 0.0
    for p in pnls:
        cum += p
        peak = max(peak, cum)
        if peak > 0:
            max_dd = min(max_dd, (cum - peak) / peak)
        elif peak == 0 and cum < 0:
            max_dd = min(max_dd, -1.0)
    drawdown_pct = abs(max_dd) * 100.0  # magnitude of max DD as %
    return {
        "win_rate": win_rate,
        "profit_factor": pf,
        "avg_win_loss": awl,
        "drawdown": drawdown_pct,
        "risk_to_reward": None,  # structural R:R needs legs — gathering until wired
        "sharpe": None,  # deferred v1
    }


def journey_shape_at(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    as_of: str | None = None,
) -> dict:
    """
    Campaign Journey shape DTO (Spec §6a).

    Ledger → raises 404 (furniture has no journey-shape route).
    Charter with zero bounds → invitation payload (200-level empty).
    Axes: band-alignment (boundary) or progress (goal) via campaign_alignment.
    """
    from campaign_alignment import axis_extension

    row = _campaign_row(cur, identity_id, campaign_id)
    if bool(int(row.get("is_ledger") or 0)):
        raise PracticeSpineError(
            404, "Ledger has no Campaign Journey shape (furniture, not charter)"
        )
    bounds = list_bounds(cur, identity_id, campaign_id)
    # T0: signed_at date wins; else first fill day
    t0 = None
    if row.get("signed_at") is not None:
        sa = row["signed_at"]
        t0 = (
            sa.date().isoformat()
            if hasattr(sa, "date")
            else str(sa)[:10]
        )
    if not t0:
        cur.execute(
            """SELECT MIN(DATE(exec_at)) AS d FROM member_trade_log_trades
               WHERE identity_id = %s AND practice_campaign_id = %s""",
            (identity_id, campaign_id),
        )
        fr = cur.fetchone() or {}
        if fr.get("d") is not None:
            t0 = str(fr["d"])[:10]
    present = (_utcnow().date()).isoformat()
    as_of_day = (as_of or present)[:10]
    if not bounds:
        return {
            "campaign_id": campaign_id,
            "kind": "invitation",
            "t0": t0,
            "present": present,
            "as_of": as_of_day,
            "axes": [],
            "amendment_markers": [],
            "sample_n": 0,
            "message": "Declare charter bounds to reveal this season's fingerprint",
        }

    pnls = _pnl_sample_as_of(cur, identity_id, campaign_id, as_of_day)
    stats = _stat_readings_from_pnls(pnls)
    sample_n = len(pnls)

    axes = []
    for b in bounds:
        attr = str(b.get("attribute") or "")
        role = str(b.get("role") or "boundary")
        lo, hi = b.get("range_low"), b.get("range_high")
        n_floor = b.get("n_floor")
        if n_floor is None:
            n_floor = _default_n_floor(attr)
        try:
            n_floor = int(n_floor)
        except (TypeError, ValueError):
            n_floor = _default_n_floor(attr)

        reading: float | None = None
        if attr in stats:
            reading = stats.get(attr)  # type: ignore[assignment]
            # Unbounded PF with wins only → treat as high in-band signal
            if attr == "profit_factor" and reading is None and sample_n > 0:
                if any(p > 0 for p in pnls) and not any(p < 0 for p in pnls):
                    reading = float(hi) if hi is not None else 10.0

        # Process: simple presence — gathering only if no fills when n_floor>0
        process_attrs = {
            "risk_per_trade",
            "position_size",
            "concurrent_open",
            "strategy_scope",
            "strategy_type_scope",
            "asset_type_scope",
            "asset_scope",
            "trading_window",
        }
        if attr in process_attrs:
            # Count fills in window as sample for process wake
            cur.execute(
                """SELECT COUNT(*) AS n FROM member_trade_log_trades
                   WHERE identity_id = %s AND practice_campaign_id = %s
                     AND DATE(exec_at) <= %s""",
                (identity_id, campaign_id, as_of_day),
            )
            fill_n = int((cur.fetchone() or {}).get("n") or 0)
            if fill_n < max(1, n_floor):
                axes.append(
                    {
                        "bound_id": b["id"],
                        "role": role,
                        "attribute": attr,
                        "range_low": lo,
                        "range_high": hi,
                        "reading": None,
                        "extension": None,
                        "state": "gathering",
                        "n_floor": n_floor,
                        "n": fill_n,
                    }
                )
                continue
            # Default process axes full until richer witness — never raw magnitude spike
            reading = lo if lo is not None else (hi if hi is not None else 0.0)
            if lo is not None and hi is not None:
                reading = (float(lo) + float(hi)) / 2.0
            ext = axis_extension(role, float(reading), lo, hi)
            axes.append(
                {
                    "bound_id": b["id"],
                    "role": role,
                    "attribute": attr,
                    "range_low": lo,
                    "range_high": hi,
                    "reading": reading,
                    "extension": round(ext, 4),
                    "state": "in_range" if ext >= 0.999 else "out_of_range",
                    "n_floor": n_floor,
                    "n": fill_n,
                }
            )
            continue

        if reading is None or sample_n < n_floor:
            axes.append(
                {
                    "bound_id": b["id"],
                    "role": role,
                    "attribute": attr,
                    "range_low": lo,
                    "range_high": hi,
                    "reading": reading,
                    "extension": None,
                    "state": "gathering",
                    "n_floor": n_floor,
                    "n": sample_n,
                }
            )
            continue

        ext = axis_extension(role, float(reading), lo, hi)
        if role == "goal":
            if ext >= 0.999:
                state = "reached"
            elif ext >= 0.5:
                state = "tracking_toward"
            else:
                state = "tracking_away"
        else:
            state = "in_range" if ext >= 0.999 else "out_of_range"
        axes.append(
            {
                "bound_id": b["id"],
                "role": role,
                "attribute": attr,
                "range_low": lo,
                "range_high": hi,
                "reading": reading,
                "extension": round(ext, 4),
                "state": state,
                "n_floor": n_floor,
                "n": sample_n,
            }
        )

    cur.execute(
        """SELECT amended_at, field FROM member_practice_campaign_amendments
           WHERE identity_id = %s AND campaign_id = %s
           ORDER BY amended_at ASC""",
        (identity_id, campaign_id),
    )
    markers = []
    for am in cur.fetchall() or []:
        at = am.get("amended_at")
        markers.append(
            {
                "at": _iso(at)[:10] if at is not None else None,
                "field": am.get("field"),
            }
        )
    return {
        "campaign_id": campaign_id,
        "kind": "shape",
        "t0": t0,
        "present": present,
        "as_of": as_of_day,
        "axes": axes,
        "amendment_markers": markers,
        "sample_n": sample_n,
        "message": None,
    }


def witness_process_bounds_at_fill(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    exec_at: datetime | None,
    strategy: str | None = None,
    underliers: list[str] | None = None,
) -> list[dict]:
    """
    Boundary-role process clauses at fill time (Spec §7a / B2-1).

    Returns quiet variance notes — never raises to block the fill.
    Goal-role rows are ignored (never variance).
    Trading window: fill outside campaign starts_at/ends_at is variance (not 422).
    """
    notes: list[dict] = []
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    camp = cur.fetchone()
    if not camp or bool(int(camp.get("is_ledger") or 0)):
        return notes

    # Term window from campaign dates (always process boundary)
    if exec_at is not None:
        day = exec_at.date() if hasattr(exec_at, "date") else None
        if day is not None:
            sa, ea = camp.get("starts_at"), camp.get("ends_at")
            if sa is not None:
                start_d = sa.date() if hasattr(sa, "date") else sa
                if day < start_d:
                    notes.append(
                        {
                            "attribute": "trading_window",
                            "role": "boundary",
                            "state": "variance",
                            "detail": f"fill day {day.isoformat()} before starts_at",
                        }
                    )
            if ea is not None:
                end_d = ea.date() if hasattr(ea, "date") else ea
                if day > end_d:
                    notes.append(
                        {
                            "attribute": "trading_window",
                            "role": "boundary",
                            "state": "variance",
                            "detail": f"fill day {day.isoformat()} after ends_at",
                        }
                    )

    bounds = list_bounds(cur, identity_id, campaign_id)
    und = {u.upper() for u in (underliers or []) if u}
    strat = (strategy or "").upper()
    for b in bounds:
        if b.get("role") != "boundary":
            continue
        attr = b.get("attribute")
        # Asset scope: basis may hold comma-separated underliers
        if attr == "asset_scope" and und:
            allowed = {
                x.strip().upper()
                for x in str(b.get("basis") or b.get("unit") or "").split(",")
                if x.strip()
            }
            if allowed and not und.issubset(allowed):
                notes.append(
                    {
                        "attribute": "asset_scope",
                        "role": "boundary",
                        "state": "variance",
                        "detail": f"underliers {sorted(und)} outside {sorted(allowed)}",
                    }
                )
        if attr == "strategy_scope" and strat:
            allowed = {
                x.strip().upper()
                for x in str(b.get("basis") or b.get("unit") or "").split(",")
                if x.strip()
            }
            if allowed and strat not in allowed:
                notes.append(
                    {
                        "attribute": "strategy_scope",
                        "role": "boundary",
                        "state": "variance",
                        "detail": f"strategy {strat} outside scope",
                    }
                )
    return notes
