"""Practice Own spine — Playbook + Campaign (Trader Development Phase 1).

Family B. Fail loud. No P&L. No rule engine.
"""

from __future__ import annotations

import colorsys
import json
import re
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
# Campaign Phase Spec — capital allocation modes (funding, not direction)
CAPITAL_ALLOCATION_MODES = frozenset({"fixed", "wrap", "proportion", "dynamic"})

# Distinct starter colors for campaign badges (identity chrome, not variance).
CAMPAIGN_BADGE_PALETTE: tuple[str, ...] = (
    "#1D4ED8",
    "#0F766E",
    "#B45309",
    "#BE123C",
    "#7C3AED",
    "#0369A1",
    "#15803D",
    "#C2410C",
    "#A21CAF",
    "#0E7490",
    "#4338CA",
    "#B91C1C",
    "#047857",
    "#CA8A04",
    "#6D28D9",
    "#1E3A5F",
    "#9A3412",
    "#115E59",
    "#9D174D",
    "#3F6212",
    "#1D4E89",
    "#854D0E",
    "#4C1D95",
    "#134E4A",
)
_BADGE_HEX_RE = re.compile(r"^#[0-9A-F]{6}$")


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


def normalize_badge_color(raw: Any) -> str:
    """Accept #RGB / #RRGGBB (any case). Store uppercase #RRGGBB."""
    if raw is None or str(raw).strip() == "":
        raise PracticeSpineError(422, "badge_color is required")
    s = str(raw).strip().upper()
    if not s.startswith("#"):
        s = f"#{s}"
    if re.fullmatch(r"#[0-9A-F]{3}", s):
        s = "#" + "".join(ch * 2 for ch in s[1:])
    if not _BADGE_HEX_RE.fullmatch(s):
        raise PracticeSpineError(422, "badge_color must be #RRGGBB")
    return s


def _hsl_to_hex(h_deg: float, sat: float, light: float) -> str:
    r, g, b = colorsys.hls_to_rgb(h_deg / 360.0, light, sat)
    return f"#{int(round(r * 255)):02X}{int(round(g * 255)):02X}{int(round(b * 255)):02X}"


def _used_badge_colors(
    cur, identity_id: int, *, except_id: int | None = None
) -> set[str]:
    if except_id is None:
        cur.execute(
            """SELECT badge_color FROM member_practice_campaigns
               WHERE identity_id = %s AND badge_color IS NOT NULL
                 AND badge_color <> ''""",
            (identity_id,),
        )
    else:
        cur.execute(
            """SELECT badge_color FROM member_practice_campaigns
               WHERE identity_id = %s AND id <> %s
                 AND badge_color IS NOT NULL AND badge_color <> ''""",
            (identity_id, except_id),
        )
    out: set[str] = set()
    for r in cur.fetchall() or []:
        raw = r.get("badge_color")
        if raw:
            out.add(str(raw).strip().upper())
    return out


def allocate_badge_color(
    cur,
    identity_id: int,
    *,
    preferred: Any = None,
    except_id: int | None = None,
) -> str:
    used = _used_badge_colors(cur, identity_id, except_id=except_id)
    if preferred is not None and str(preferred).strip() != "":
        color = normalize_badge_color(preferred)
        if color in used:
            raise PracticeSpineError(
                422,
                f"badge_color {color} is already used by another campaign",
            )
        return color
    for p in CAMPAIGN_BADGE_PALETTE:
        if p not in used:
            return p
    for i in range(360):
        cand = _hsl_to_hex((i * 47) % 360, 0.62, 0.40)
        if cand not in used:
            return cand
    raise PracticeSpineError(422, "no unused badge colors left")


def _ensure_badge_color(cur, row: dict) -> str:
    raw = row.get("badge_color")
    if raw:
        s = str(raw).strip().upper()
        if _BADGE_HEX_RE.fullmatch(s):
            return s
    iid = int(row["identity_id"])
    cid = int(row["id"])
    color = allocate_badge_color(cur, iid, except_id=cid)
    cur.execute(
        """UPDATE member_practice_campaigns
           SET badge_color = %s
           WHERE id = %s AND identity_id = %s""",
        (color, cid, iid),
    )
    row["badge_color"] = color
    return color


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
    mdd = _parse_max_drawdown_pct(row.get("max_drawdown_pct"), allow_null=True)
    mode = (row.get("capital_allocation_mode") or "fixed") or "fixed"
    mode = str(mode).strip().lower()
    try:
        charter_version = int(row.get("charter_version") or 1)
    except (TypeError, ValueError):
        charter_version = 1
    retro_id = row.get("retrospective_id")
    try:
        retrospective_id = int(retro_id) if retro_id is not None else None
    except (TypeError, ValueError):
        retrospective_id = None
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
        "charter_version": charter_version,
        "max_drawdown_pct": mdd,
        "capital_allocation_mode": mode if mode in CAPITAL_ALLOCATION_MODES else "fixed",
        "capital_allocation_note": (row.get("capital_allocation_note") or "") or "",
        "strategy_codes": _parse_json_list(row.get("strategy_codes")),
        "retrospective_id": retrospective_id,
        "same_bet": _parse_json_obj(row.get("same_bet_json")),
        "badge_color": _ensure_badge_color(cur, row),
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


# Charter fields for signature + amendments (Concept Spec §4.5.1 + Phase Spec)
_CHARTER_FIELDS = (
    "title",
    "goals_md",
    "starting_capital",
    "account_id",
    "starts_at",
    "ends_at",
    "max_drawdown_pct",
    "capital_allocation_mode",
    "capital_allocation_note",
    "strategy_codes",
    "retrospective_id",
    "same_bet",
)


def _parse_json_obj(raw: Any) -> dict | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw:
            return None
        try:
            out = json.loads(raw)
            return out if isinstance(out, dict) else None
        except (TypeError, ValueError):
            return None
    return None


def _parse_json_list(raw: Any) -> list | None:
    if raw is None:
        return None
    if isinstance(raw, list):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw:
            return None
        try:
            out = json.loads(raw)
            return out if isinstance(out, list) else None
        except (TypeError, ValueError):
            return None
    return None


def _parse_max_drawdown_pct(val: Any, *, allow_null: bool = True) -> float | None:
    """Max DD is always percent of campaign allocation (0 < pct ≤ 100)."""
    if val is None or val == "":
        if allow_null:
            return None
        raise PracticeSpineError(422, "max_drawdown_pct is required")
    try:
        pct = float(val)
    except (TypeError, ValueError) as exc:
        raise PracticeSpineError(422, "max_drawdown_pct must be a number") from exc
    if pct <= 0 or pct > 100:
        raise PracticeSpineError(
            422, "max_drawdown_pct must be percent of allocation (0 exclusive … 100]"
        )
    return pct


def _parse_allocation_mode(val: Any, *, default: str = "fixed") -> str:
    if val is None or val == "":
        return default
    mode = str(val).strip().lower()
    if mode not in CAPITAL_ALLOCATION_MODES:
        raise PracticeSpineError(
            422,
            "capital_allocation_mode must be fixed|wrap|proportion|dynamic",
        )
    return mode


def _parse_strategy_codes(val: Any) -> list | None:
    """Null/empty = unadopted (no list rule). Non-empty list = adopted allow-list."""
    if val is None or val == "":
        return None
    if isinstance(val, str):
        parsed = _parse_json_list(val)
        if parsed is None:
            # comma-separated fallback
            parts = [p.strip() for p in val.split(",") if p.strip()]
            return parts or None
        val = parsed
    if not isinstance(val, list):
        raise PracticeSpineError(422, "strategy_codes must be a list of strings")
    out: list[str] = []
    for item in val:
        s = str(item).strip()
        if s:
            out.append(s[:64])
    return out or None


def _parse_same_bet(val: Any) -> dict | None:
    """Null/empty = not answered. Dict = adopted Same-bet answers."""
    if val is None or val == "":
        return None
    if isinstance(val, str):
        return _parse_json_obj(val)
    if isinstance(val, dict):
        # drop empty values — fully empty dict stays null (unadopted)
        cleaned = {str(k): v for k, v in val.items() if v is not None and v != ""}
        return cleaned or None
    raise PracticeSpineError(422, "same_bet must be an object or null")


def _assert_big_three_for_sign(
    *,
    is_ledger: bool,
    starting_capital: float | None,
    max_drawdown_pct: float | None,
    starts_at: Any,
) -> None:
    """P2/P3 — Big Three required to first-activate a deliberate charter."""
    if is_ledger:
        return
    missing: list[str] = []
    if starting_capital is None:
        missing.append("capital allocation (starting_capital)")
    if max_drawdown_pct is None:
        missing.append("max_drawdown_pct")
    if starts_at is None:
        missing.append("starts_at")
    if missing:
        raise PracticeSpineError(
            422,
            "Big Three required to activate: " + "; ".join(missing),
        )


def _assert_end_for_terminal(*, is_ledger: bool, ends_at: Any, new_status: str) -> None:
    """P5 L-End — end date required to complete or abandon."""
    if is_ledger:
        return
    if new_status in ("completed", "abandoned") and ends_at is None:
        raise PracticeSpineError(
            422,
            "ends_at is required to complete or abandon a campaign",
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
        # API name same_bet ↔ column same_bet_json
        if key == "same_bet":
            return _parse_json_obj(row.get("same_bet_json") if "same_bet_json" in row else row.get("same_bet"))
        if key == "strategy_codes":
            return _parse_json_list(row.get("strategy_codes"))
        val = row.get(key)
        if key in ("starts_at", "ends_at") and val is not None:
            return _iso(val)
        if key in ("starting_capital", "max_drawdown_pct") and val is not None:
            try:
                return float(val)
            except (TypeError, ValueError):
                return None
        if key == "account_id" and val is not None:
            try:
                return int(val)
            except (TypeError, ValueError):
                return None
        if key == "retrospective_id" and val is not None:
            try:
                return int(val)
            except (TypeError, ValueError):
                return None
        if key == "goals_md":
            return (val or "") if val is not None else ""
        if key == "capital_allocation_note":
            return (val or "") if val is not None else ""
        if key == "capital_allocation_mode":
            m = (val or "fixed") if val is not None else "fixed"
            return str(m).strip().lower()
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
    """DEPRECATED — Top-Level Account Amendment: no genesis ledger furniture.

    Ensures a Default trade account exists if none; does **not** create campaigns.
    """
    cur.execute(
        """SELECT id FROM member_trade_log_accounts
           WHERE identity_id = %s AND status = 'active'
           ORDER BY id ASC""",
        (identity_id,),
    )
    rows = list(cur.fetchall() or [])
    if not rows:
        _ensure_primary_trade_account(cur, identity_id)
        cur.execute(
            """SELECT id FROM member_trade_log_accounts
               WHERE identity_id = %s AND status = 'active'
               ORDER BY id ASC""",
            (identity_id,),
        )
        rows = list(cur.fetchall() or [])
    return []  # no ledger campaigns


def list_campaigns(cur, identity_id: int) -> list[dict]:
    # Ensure a book exists; never invent ledger campaigns (Amendment L1)
    ensure_ledgers_for_identity(cur, identity_id)
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s
             AND is_ledger = 0
           ORDER BY
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
    """One active deliberate campaign for stamp/prefill (not exclusive).

    Amendment: memory → most recently activated deliberate. No ledger fallback.
    Returns None when undirected is the lawful rest.
    """
    if account_id is not None:
        mem = get_campaign_memory(cur, identity_id, int(account_id))
        if mem is not None:
            cur.execute(
                """SELECT * FROM member_practice_campaigns
                   WHERE id = %s AND identity_id = %s AND status = 'active'
                     AND is_ledger = 0""",
                (mem, identity_id),
            )
            row = cur.fetchone()
            if row:
                return serialize_campaign(cur, row)
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE identity_id = %s AND status = 'active' AND is_ledger = 0
                 AND (account_id = %s OR account_id IS NULL)
               ORDER BY activated_at DESC, id DESC
               LIMIT 1""",
            (identity_id, int(account_id)),
        )
    else:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE identity_id = %s AND status = 'active' AND is_ledger = 0
               ORDER BY activated_at DESC, id DESC
               LIMIT 1""",
            (identity_id,),
        )
    row = cur.fetchone()
    return serialize_campaign(cur, row) if row else None


def list_active_campaigns(
    cur, identity_id: int, *, account_id: int | None = None
) -> list[dict]:
    """All active deliberate campaigns for scope (no ledger furniture).

    When ``account_id`` is set: account-bound + unbound actives. Ordered:
    default first, account-bound, activated_at.
    """
    if account_id is not None:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE identity_id = %s AND status = 'active' AND is_ledger = 0
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
               WHERE identity_id = %s AND status = 'active' AND is_ledger = 0
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
    """Legacy is_default deliberate campaign for account (no ledger furniture)."""
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s AND account_id = %s
             AND is_default = 1 AND is_ledger = 0
           ORDER BY
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
    """L3 — last book→campaign direction (server-side memory).

    Memory is keyed by account (the book the fill came from). The remembered
    campaign may be that book's ledger OR any owned charter (L5 account-free).
    """
    account_id = int(account_id)
    campaign_id = int(campaign_id)
    cur.execute(
        """SELECT id, account_id, is_ledger FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    is_ledger = bool(int(row.get("is_ledger") or 0))
    if is_ledger:
        if row.get("account_id") is None or int(row["account_id"]) != account_id:
            raise PracticeSpineError(
                422, "memory ledger must belong to the same account"
            )
    # charters: no account bind — any book may remember them
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


def campaign_covers_fill(row: dict, exec_at: datetime | None) -> bool:
    """L4 — True when fill time falls inside campaign window [starts_at, ends_at].

    Ledger (is_ledger) always covers. ends_at NULL = open-ended.
    starts_at NULL = no floor (covers any fill day).
    Fill day is date-atom of exec_at (day = atom doctrine).
    """
    if bool(int(row.get("is_ledger") or 0)):
        return True
    if exec_at is None:
        # No fill time → only ledger is safe; charters need a day
        return False
    day = exec_at.date() if hasattr(exec_at, "date") else None
    if day is None:
        return False
    sa, ea = row.get("starts_at"), row.get("ends_at")
    if sa is not None:
        start_d = sa.date() if hasattr(sa, "date") else sa
        if hasattr(start_d, "isoformat"):
            if day < start_d:
                return False
        else:
            try:
                from datetime import date as _date

                sd = _date.fromisoformat(str(start_d)[:10])
                if day < sd:
                    return False
            except ValueError:
                pass
    if ea is not None:
        end_d = ea.date() if hasattr(ea, "date") else ea
        if hasattr(end_d, "isoformat"):
            if day > end_d:
                return False
        else:
            try:
                from datetime import date as _date

                ed = _date.fromisoformat(str(end_d)[:10])
                if day > ed:
                    return False
            except ValueError:
                pass
    return True


def list_eligible_campaigns_for_fill(
    cur,
    identity_id: int,
    account_id: int,
    *,
    exec_at: datetime | None = None,
) -> list[dict]:
    """L4 picker set: ledger for this account + window-covering non-ledger campaigns.

    Charters are account-free (L5) — any owned charter whose window covers fill
    time is offered. Always includes the account ledger.
    """
    account_id = int(account_id)
    # Amendment: deliberate campaigns only (no furniture ledger offer)
    out: list[dict] = []
    seen: set[int] = set()
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s AND is_ledger = 0
             AND status IN ('active', 'planned')
           ORDER BY
             CASE status WHEN 'active' THEN 0 ELSE 1 END,
             activated_at DESC, id DESC""",
        (identity_id,),
    )
    for row in cur.fetchall() or []:
        if not campaign_covers_fill(row, exec_at):
            continue
        cid = int(row["id"])
        if cid in seen:
            continue
        seen.add(cid)
        out.append(serialize_campaign(cur, row))
    return out


def resolve_trade_campaign_id(
    cur,
    identity_id: int,
    account_id: int,
    *,
    practice_campaign_id: int | None = None,
    stamped_by: str | None = None,
    update_memory: bool = True,
    exec_at: datetime | None = None,
) -> tuple[int | None, str | None]:
    """Direction resolve — Amendment Top-Level Account.

    Returns (campaign_id|None, stamped_by|None).
    Explicit deliberate campaign → member (window-eligible; never furniture).
    Else memory if eligible non-ledger; else **undirected** (null, null).
    """
    account_id = int(account_id)
    if practice_campaign_id is not None:
        cid = int(practice_campaign_id)
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (cid, identity_id),
        )
        row = cur.fetchone()
        if not row:
            raise PracticeSpineError(404, "Campaign not found")
        if bool(int(row.get("is_ledger") or 0)):
            raise PracticeSpineError(
                422, "Cannot stamp to furniture ledger — use a deliberate campaign or none"
            )
        if not campaign_covers_fill(row, exec_at):
            raise PracticeSpineError(
                422,
                "Campaign window does not cover this fill time",
            )
        if update_memory:
            set_campaign_memory(cur, identity_id, account_id, cid)
        return cid, (stamped_by or "member")

    # L3 — memory when still window-eligible deliberate campaign
    mem = get_campaign_memory(cur, identity_id, account_id)
    if mem is not None:
        cur.execute(
            """SELECT * FROM member_practice_campaigns
               WHERE id = %s AND identity_id = %s""",
            (mem, identity_id),
        )
        mrow = cur.fetchone()
        if mrow is not None and not bool(int(mrow.get("is_ledger") or 0)):
            if campaign_covers_fill(mrow, exec_at):
                return mem, "memory"
        # expired / furniture / missing → undirected (no fallback object)

    # Undirected — lawful rest (Amendment L2/L3)
    if update_memory:
        # Clear bad memory so we do not keep re-trying a dead campaign
        cur.execute(
            """DELETE FROM member_practice_campaign_memory
               WHERE identity_id = %s AND account_id = %s""",
            (identity_id, account_id),
        )
    return None, None


def _first_trade_at_for_account(
    cur, identity_id: int, account_id: int
) -> Any:
    """Earliest Trade Log exec_at on this account — default campaign start."""
    cur.execute(
        """SELECT MIN(exec_at) AS d FROM member_trade_log_trades
           WHERE identity_id = %s AND account_id = %s
             AND exec_at IS NOT NULL""",
        (identity_id, account_id),
    )
    row = cur.fetchone() or {}
    return row.get("d")


def ensure_ledger_campaign(
    cur,
    identity_id: int,
    account_id: int,
    *,
    title: str | None = None,
) -> dict:
    """Law 1 — get or create account ledger (furniture, never signed).

    Default campaign start = day of the account's first Trade Log fill when
    any trades exist (Coach: the book begins with the first recorded trade).
    """
    account_id = int(account_id)
    _assert_account_owned(cur, identity_id, account_id)
    first_trade = _first_trade_at_for_account(cur, identity_id, account_id)

    def _heal_starts(cid: int) -> None:
        """Backfill starts_at from first trade when ledger has no real start."""
        if first_trade is None:
            return
        cur.execute(
            """UPDATE member_practice_campaigns
               SET starts_at = %s
               WHERE id = %s AND identity_id = %s
                 AND (starts_at IS NULL OR starts_at > %s)""",
            (first_trade, cid, identity_id, first_trade),
        )

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
        _heal_starts(int(existing["id"]))
        out = get_campaign(cur, identity_id, int(existing["id"]))
        assert out is not None
        return out

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
        _heal_starts(int(legacy["id"]))
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
    # First trade wins; else account created_at as provisional furniture date
    starts = first_trade if first_trade is not None else row.get("created_at")
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


def on_account_created(cur, identity_id: int, account_id: int) -> dict | None:
    """Call after every trade-account insert — account only (no ledger furniture)."""
    return None


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
    # Amendment: account only — no genesis ledger
    return aid


def ensure_starter_default_campaign(cur, identity_id: int) -> dict | None:
    """Campaign nav cold-start: ensure Default **account** only (no ledger).

    If the identity already has any campaign, no-op (return None).
    """
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_practice_campaigns
           WHERE identity_id = %s AND is_ledger = 0""",
        (identity_id,),
    )
    n = int((cur.fetchone() or {}).get("n") or 0)
    if n > 0:
        return None
    _ensure_primary_trade_account(cur, identity_id)
    return None

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
    max_drawdown_pct: Any = None,
    capital_allocation_mode: Any = None,
    capital_allocation_note: Any = None,
    strategy_codes: Any = None,
    retrospective_id: Any = None,
    same_bet: Any = None,
    badge_color: Any = None,
) -> dict:
    title = (title or "").strip()
    if not title:
        # OD-title — default "Campaign" + date when blank
        title = f"Campaign {_utcnow().date().isoformat()}"
    # L5 — charters are account-free; only ledger/default require a book
    if is_ledger and account_id is None:
        raise PracticeSpineError(422, "ledger campaign requires account_id")
    if is_default and not is_ledger and account_id is None:
        raise PracticeSpineError(
            422, "default book campaign requires account_id"
        )
    start = _parse_dt(starts_at)
    end = _parse_dt(ends_at)
    if start and end and end < start:
        raise PracticeSpineError(422, "ends_at must be on or after starts_at")
    if account_id is not None:
        _assert_account_owned(cur, identity_id, account_id)
    if is_ledger:
        is_default = True
        activate = True
    elif not is_default:
        # L5 — charters never bind an account (ignore client account_id)
        account_id = None
    if is_default:
        activate = True
    status = "active" if activate else "planned"
    key = _export_key("camp")
    cap = None
    if starting_capital is not None and starting_capital != "":
        try:
            cap = float(starting_capital)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "starting_capital must be a number") from exc
        if cap < 0:
            raise PracticeSpineError(422, "starting_capital must be ≥ 0")
    mdd = _parse_max_drawdown_pct(max_drawdown_pct, allow_null=True)
    alloc_mode = _parse_allocation_mode(capital_allocation_mode, default="fixed")
    alloc_note = (
        (str(capital_allocation_note).strip() or None)
        if capital_allocation_note is not None and capital_allocation_note != ""
        else None
    )
    strat = _parse_strategy_codes(strategy_codes)
    same = _parse_same_bet(same_bet)
    retro: int | None = None
    if retrospective_id is not None and retrospective_id != "":
        try:
            retro = int(retrospective_id)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "retrospective_id must be an integer") from exc
    if status == "active" and not is_ledger:
        _assert_big_three_for_sign(
            is_ledger=False,
            starting_capital=cap,
            max_drawdown_pct=mdd,
            starts_at=start,
        )
    goals = (goals_md or "").strip() or None
    if is_ledger:
        goals = None  # ledger has no charter prose by definition
        mdd = None
        alloc_note = None
        strat = None
        same = None
        retro = None
    activated = _utcnow() if status == "active" else None
    if is_default and account_id is not None and not is_ledger:
        _clear_default_for_account(cur, identity_id, int(account_id))
    title = _unique_campaign_title(cur, identity_id, title)
    color = allocate_badge_color(cur, identity_id, preferred=badge_color)
    cur.execute(
        """INSERT INTO member_practice_campaigns
             (identity_id, account_id, title, status, activated_at, starts_at, ends_at,
              starting_capital, goals_md, is_default, is_ledger, export_key,
              charter_version, max_drawdown_pct, strategy_codes,
              capital_allocation_mode, capital_allocation_note, retrospective_id,
              same_bet_json, badge_color)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                   1, %s, %s, %s, %s, %s, %s, %s)""",
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
            mdd,
            json.dumps(strat) if strat is not None else None,
            alloc_mode,
            alloc_note,
            retro,
            json.dumps(same) if same is not None else None,
            color,
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
    # Panel v1: house-seed the six controls on every new charter
    if not is_ledger:
        try:
            from campaign_panel import ensure_six_controls

            ensure_six_controls(cur, identity_id, cid)
        except Exception:
            pass
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
    max_drawdown_pct: Any = ...,
    capital_allocation_mode: Any = ...,
    capital_allocation_note: Any = ...,
    strategy_codes: Any = ...,
    retrospective_id: Any = ...,
    same_bet: Any = ...,
    badge_color: Any = ...,
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
    # Resolve is_default before account rules — default book campaigns need a book;
    # non-default deliberate charters are account-free (L5).
    if is_default is ...:
        new_default = bool(int(row.get("is_default") or 0))
    else:
        new_default = bool(is_default)
    if new_status != "active":
        new_default = False

    if account_id is ...:
        new_account = row.get("account_id")
        if new_account is not None:
            try:
                new_account = int(new_account)
            except (TypeError, ValueError):
                new_account = None
    elif account_id is None or account_id == "":
        if is_ledger:
            raise PracticeSpineError(422, "Ledger campaign requires account_id")
        if new_default:
            # Keep existing bind when Save clears the field; fail only if never bound
            existing = row.get("account_id")
            if existing is not None:
                try:
                    new_account = int(existing)
                except (TypeError, ValueError):
                    new_account = None
            else:
                new_account = None
        else:
            # L5 — non-default charters clear account binding
            new_account = None
    else:
        try:
            new_account = int(account_id)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "account_id must be an integer") from exc
        _assert_account_owned(cur, identity_id, new_account)
        if is_ledger and new_account != row.get("account_id"):
            raise PracticeSpineError(
                422, "Ledger cannot move between accounts"
            )
        # Non-ledger non-default: L5 strips bind. Default book campaigns keep it.
        if not is_ledger and not new_default:
            new_account = None

    if starting_capital is ...:
        new_cap = row.get("starting_capital")
        if new_cap is not None:
            try:
                new_cap = float(new_cap)
            except (TypeError, ValueError):
                new_cap = None
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

    if max_drawdown_pct is ...:
        new_mdd = _parse_max_drawdown_pct(row.get("max_drawdown_pct"), allow_null=True)
    else:
        new_mdd = _parse_max_drawdown_pct(max_drawdown_pct, allow_null=True)

    if capital_allocation_mode is ...:
        new_mode = _parse_allocation_mode(
            row.get("capital_allocation_mode"), default="fixed"
        )
    else:
        new_mode = _parse_allocation_mode(capital_allocation_mode, default="fixed")

    if capital_allocation_note is ...:
        new_alloc_note = row.get("capital_allocation_note")
    elif capital_allocation_note is None or capital_allocation_note == "":
        new_alloc_note = None
    else:
        new_alloc_note = str(capital_allocation_note).strip() or None

    if strategy_codes is ...:
        new_strat = _parse_json_list(row.get("strategy_codes"))
    else:
        new_strat = _parse_strategy_codes(strategy_codes)

    if same_bet is ...:
        new_same = _parse_json_obj(row.get("same_bet_json"))
    else:
        new_same = _parse_same_bet(same_bet)

    if retrospective_id is ...:
        rid = row.get("retrospective_id")
        try:
            new_retro = int(rid) if rid is not None else None
        except (TypeError, ValueError):
            new_retro = None
    elif retrospective_id is None or retrospective_id == "":
        new_retro = None
    else:
        try:
            new_retro = int(retrospective_id)
        except (TypeError, ValueError) as exc:
            raise PracticeSpineError(422, "retrospective_id must be an integer") from exc

    if new_default and new_account is None:
        raise PracticeSpineError(
            422,
            "default book campaign requires account_id "
            "(set the trade account, then Save or Set as default)",
        )

    # Terminal = charter read-only (status already terminal; only allow no-op)
    charter_touched = any(
        (
            title is not None,
            starts_at is not ...,
            ends_at is not ...,
            account_id is not ...,
            starting_capital is not ...,
            goals_md is not ...,
            max_drawdown_pct is not ...,
            capital_allocation_mode is not ...,
            capital_allocation_note is not ...,
            strategy_codes is not ...,
            retrospective_id is not ...,
            same_bet is not ...,
        )
    )
    if terminal and (charter_touched or (status is not None and new_status != cur_status)):
        # Allow no actual change; reject real edits
        if charter_touched or new_status != cur_status:
            raise PracticeSpineError(
                422,
                "Terminal campaigns are read-only — renew instead of editing",
            )

    # P2 — first activate requires Big Three (deliberate charters only)
    will_first_activate = (
        new_status == "active"
        and cur_status != "active"
        and row.get("signed_at") is None
        and not is_ledger
    )
    if will_first_activate or (
        new_status == "active"
        and cur_status != "active"
        and not is_ledger
        and row.get("signed_at") is None
    ):
        _assert_big_three_for_sign(
            is_ledger=False,
            starting_capital=new_cap if new_cap is None else float(new_cap),
            max_drawdown_pct=new_mdd,
            starts_at=new_start,
        )
    # Also gate create-as-active path already handled; resume after pause: already signed — no re-check of missing Big Three if they somehow null? Require still present on any transition to active when never signed.
    if (
        new_status == "active"
        and cur_status != "active"
        and not is_ledger
        and row.get("signed_at") is not None
    ):
        # Resume — still require Big Three present on charter (data integrity)
        _assert_big_three_for_sign(
            is_ledger=False,
            starting_capital=new_cap if new_cap is None else float(new_cap),
            max_drawdown_pct=new_mdd,
            starts_at=new_start,
        )

    # P5 — complete/abandon requires end date
    if new_status != cur_status:
        _assert_end_for_terminal(
            is_ledger=is_ledger, ends_at=new_end, new_status=new_status
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
    try:
        charter_version = int(row.get("charter_version") or 1)
    except (TypeError, ValueError):
        charter_version = 1
    charter_fields_amended = 0
    if record_amends:
        old_snap = _charter_snapshot(row)
        new_snap = {
            "title": new_title[:255],
            "goals_md": new_goals or "",
            "starting_capital": (
                float(new_cap) if new_cap is not None else None
            ),
            "account_id": (
                int(new_account) if new_account is not None else None
            ),
            "starts_at": _iso(new_start),
            "ends_at": _iso(new_end),
            "max_drawdown_pct": new_mdd,
            "capital_allocation_mode": new_mode,
            "capital_allocation_note": new_alloc_note or "",
            "strategy_codes": new_strat,
            "retrospective_id": new_retro,
            "same_bet": new_same,
        }
        for field in _CHARTER_FIELDS:
            ov, nv = old_snap.get(field), new_snap.get(field)
            # normalize empty strings / empty optional
            if field in ("goals_md", "capital_allocation_note"):
                ov = ov or ""
                nv = nv or ""
            if field in ("strategy_codes", "same_bet"):
                # treat None and empty as same for unadopted
                if not ov:
                    ov = None
                if not nv:
                    nv = None
            if ov != nv:
                charter_fields_amended += 1
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
        # P11 — version bump when signed charter terms change (not status-only)
        if charter_fields_amended > 0:
            charter_version = charter_version + 1

    if badge_color is ...:
        existing = row.get("badge_color")
        if existing and _BADGE_HEX_RE.fullmatch(str(existing).strip().upper()):
            new_color = str(existing).strip().upper()
        else:
            new_color = allocate_badge_color(
                cur, identity_id, except_id=campaign_id
            )
    else:
        new_color = allocate_badge_color(
            cur, identity_id, preferred=badge_color, except_id=campaign_id
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
               is_default = %s,
               charter_version = %s,
               max_drawdown_pct = %s,
               capital_allocation_mode = %s,
               capital_allocation_note = %s,
               strategy_codes = %s,
               retrospective_id = %s,
               same_bet_json = %s,
               badge_color = %s
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
            charter_version,
            new_mdd,
            new_mode,
            new_alloc_note,
            json.dumps(new_strat) if new_strat is not None else None,
            new_retro,
            json.dumps(new_same) if new_same is not None else None,
            new_color,
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
    title = (row.get("title") or "Campaign").strip()
    # Avoid infinite " (cycle)" stacking — renew keeps base title
    # L5 — successor charter stays account-free
    new = create_campaign(
        cur,
        identity_id,
        title=title[:255],  # _unique_campaign_title suffixes on collision
        starts_at=row.get("starts_at"),
        ends_at=row.get("ends_at"),
        activate=False,
        account_id=None,
        starting_capital=row.get("starting_capital"),
        goals_md=row.get("goals_md"),
        is_default=False,
        is_ledger=False,
        max_drawdown_pct=row.get("max_drawdown_pct"),
        capital_allocation_mode=row.get("capital_allocation_mode"),
        capital_allocation_note=row.get("capital_allocation_note"),
        strategy_codes=_parse_json_list(row.get("strategy_codes")),
        retrospective_id=row.get("retrospective_id"),
        same_bet=_parse_json_obj(row.get("same_bet_json")),
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
        return (Path(raw) / "campaign_covers").resolve()
    return (
        Path(__file__).resolve().parent / "var" / "campaign_covers"
    ).resolve()


def _confine_campaign_media_path(path):
    """C2 — reject path escape under campaign cover root."""
    from pathlib import Path

    root = campaign_media_root().resolve()
    resolved = Path(path).resolve()
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise PracticeSpineError(500, "invalid media path") from exc
    return resolved


def _image_magic_content_type(data: bytes) -> str | None:
    """C1 — image by magic bytes (not client Content-Type alone)."""
    if not data:
        return None
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return None


def set_campaign_cover_from_upload(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    content_type: str,
    data: bytes,
    original_name: str | None = None,
) -> dict:
    """Store cover image and point campaign at it. Magic-byte images only (C1)."""
    row = get_campaign(cur, identity_id, campaign_id)
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    ct = _image_magic_content_type(data)
    if ct is None:
        raise PracticeSpineError(
            422, "Cover must be an image (JPEG, PNG, WebP, GIF)"
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
        if ".." not in rel and not rel.startswith(("/", "\\")):
            old = _confine_campaign_media_path(root / rel)
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
        if ".." not in rel and not rel.startswith(("/", "\\")):
            path = _confine_campaign_media_path(root / rel)
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
    if ".." in rel or rel.startswith(("/", "\\")):
        raise PracticeSpineError(500, "invalid cover storage key")
    path = _confine_campaign_media_path(campaign_media_root() / rel)
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
        "display_low": _f("display_low"),
        "display_high": _f("display_high"),
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


def _day_iso_from_campaign_field(val: Any) -> str | None:
    """YYYY-MM-DD from campaign starts_at / ends_at (datetime or string)."""
    if val is None:
        return None
    if hasattr(val, "date"):
        try:
            return val.date().isoformat()
        except Exception:
            pass
    s = str(val).strip()
    if len(s) >= 10 and s[4] == "-" and s[7] == "-":
        return s[:10]
    return None


def _window_day_bounds(
    as_of_day: str,
    *,
    from_day: str | None = None,
    to_day: str | None = None,
) -> tuple[str | None, str]:
    """Inclusive day bounds for panel samples (floor, ceiling)."""
    hi = (as_of_day or "")[:10]
    if to_day:
        t = to_day[:10]
        if not hi or t < hi:
            hi = t
    if not hi:
        hi = _utcnow().date().isoformat()
    lo = (from_day or "")[:10] if from_day else None
    return lo, hi


def _pnl_sample_as_of(
    cur,
    identity_id: int,
    campaign_id: int,
    as_of_day: str,
    *,
    from_day: str | None = None,
    to_day: str | None = None,
) -> list[float]:
    """
    Closed Trade Log P&Ls for this campaign, for outcome panel pointers.

    Window (inclusive days):
      from_day = campaign starts_at (if set), else no floor
      to_day   = min(as_of scrub day, campaign ends_at if set)
    Only rows with practice_campaign_id = campaign and non-null pnl_amount.
    """
    lo, hi = _window_day_bounds(as_of_day, from_day=from_day, to_day=to_day)

    sql = """SELECT pnl_amount FROM member_trade_log_trades
             WHERE identity_id = %s AND practice_campaign_id = %s
               AND pnl_amount IS NOT NULL
               AND DATE(exec_at) <= %s"""
    args: list[Any] = [identity_id, campaign_id, hi]
    if lo:
        sql += " AND DATE(exec_at) >= %s"
        args.append(lo)
    sql += " ORDER BY exec_at ASC, id ASC"
    cur.execute(sql, tuple(args))
    out: list[float] = []
    for r in cur.fetchall() or []:
        try:
            out.append(float(r["pnl_amount"]))
        except (TypeError, ValueError):
            continue
    return out


def _campaign_trades_with_legs_as_of(
    cur,
    identity_id: int,
    campaign_id: int,
    as_of_day: str,
    *,
    from_day: str | None = None,
    to_day: str | None = None,
) -> list[dict]:
    """Stamped trades in window with legs (for structural entry R:R)."""
    lo, hi = _window_day_bounds(as_of_day, from_day=from_day, to_day=to_day)
    sql = """SELECT * FROM member_trade_log_trades
             WHERE identity_id = %s AND practice_campaign_id = %s
               AND DATE(exec_at) <= %s"""
    args: list[Any] = [identity_id, campaign_id, hi]
    if lo:
        sql += " AND DATE(exec_at) >= %s"
        args.append(lo)
    sql += " ORDER BY exec_at ASC, id ASC"
    cur.execute(sql, tuple(args))
    rows = list(cur.fetchall() or [])
    if not rows:
        return []
    tids = [int(r["id"]) for r in rows]
    # Legs batch (avoid per-trade round-trips)
    by_leg: dict[int, list[dict]] = {tid: [] for tid in tids}
    chunk = 500
    for i in range(0, len(tids), chunk):
        part = tids[i : i + chunk]
        ph = ",".join(["%s"] * len(part))
        cur.execute(
            f"""SELECT * FROM member_trade_log_legs
               WHERE identity_id = %s AND trade_id IN ({ph})
               ORDER BY trade_id, leg_index, id""",
            (identity_id, *part),
        )
        for lr in cur.fetchall() or []:
            tid = int(lr["trade_id"])
            if tid not in by_leg:
                continue
            by_leg[tid].append(
                {
                    "side": lr.get("side"),
                    "quantity": lr.get("quantity"),
                    "pos_effect": lr.get("pos_effect"),
                    "asset_class": lr.get("asset_class"),
                    "underlier": lr.get("underlier"),
                    "symbol": lr.get("symbol"),
                    "expiry": (
                        lr["expiry"].isoformat()
                        if hasattr(lr.get("expiry"), "isoformat")
                        else lr.get("expiry")
                    ),
                    "strike": (
                        float(lr["strike"]) if lr.get("strike") is not None else None
                    ),
                    "right": lr.get("right"),
                    "fill_price": (
                        float(lr["fill_price"])
                        if lr.get("fill_price") is not None
                        else None
                    ),
                }
            )
    out: list[dict] = []
    for r in rows:
        tid = int(r["id"])
        out.append(
            {
                "id": tid,
                "account_id": r.get("account_id"),
                "strategy": r.get("strategy"),
                "asset_class": r.get("asset_class"),
                "exec_at": r.get("exec_at"),
                "net_price": (
                    float(r["net_price"]) if r.get("net_price") is not None else None
                ),
                "net_side": r.get("net_side"),
                "legs": by_leg.get(tid) or [],
            }
        )
    return out


def _structural_r2r_as_of(
    cur,
    identity_id: int,
    campaign_id: int,
    as_of_day: str,
    *,
    from_day: str | None = None,
    to_day: str | None = None,
) -> tuple[float | None, int]:
    """
    Risk-to-reward at entry (structural) — Hotel / Coach law:

      risk = capital at risk at open (debit, or width−credit on credit)
      max_potential = width − risk
      R2R = max_potential / risk

    Averaged over open fills stamped to this campaign in the term window.
    Close fills excluded. Not computed from realized win rate or P&L.
    """
    from trade_log_domain.structure import average_entry_r2r

    trades = _campaign_trades_with_legs_as_of(
        cur,
        identity_id,
        campaign_id,
        as_of_day,
        from_day=from_day,
        to_day=to_day,
    )
    return average_entry_r2r(trades)


def _stat_readings_from_pnls(
    pnls: list[float],
    *,
    starting_capital: float | None = None,
) -> dict[str, float | None]:
    """Outcome readings from closed P&Ls (win rate, PF, avg W/L, DD, Sharpe).

    Drawdown uses Trade Log law (``trade_log_domain.reports.max_drawdown_*``):
    equity = starting_capital + cum P&L; DD = (equity − peak) / peak.
    Panel displays magnitude in percent (e.g. 4.5 for 4.5% of peak).

    Does **not** set risk_to_reward — that is structural at entry
    (``_structural_r2r_as_of``). Avg win/loss remains the outcome W/L ratio only.
    """
    from math import sqrt

    from trade_log_domain.reports import max_drawdown_pct_magnitude

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

    # Running capital basis — same as Trade Log Reports (default $50k if unset)
    from trade_log_domain.reports import resolve_starting_capital

    cap = resolve_starting_capital(starting_capital)
    # Max drawdown % of peak running capital (not bare P&L, not forced 100%)
    drawdown_pct = max_drawdown_pct_magnitude(pnls, cap)

    # Sample Sharpe (mean / std × √n) on closed outcomes — display control
    sharpe: float | None = None
    if len(pnls) > 1:
        mean = sum(pnls) / len(pnls)
        var = sum((p - mean) ** 2 for p in pnls) / (len(pnls) - 1)
        std = sqrt(var) if var > 0 else 0.0
        if std > 0:
            sharpe = (mean / std) * sqrt(len(pnls))

    return {
        "win_rate": win_rate,
        "profit_factor": pf,
        "avg_win_loss": awl,
        "drawdown": drawdown_pct,
        # risk_to_reward is structural — filled by build_panel, never from P&L
        "risk_to_reward": None,
        "sharpe": sharpe,
    }


def campaign_term_window(
    row: dict, as_of_day: str
) -> tuple[str | None, str]:
    """
    Inclusive trade-day window for panel/radar pointers.
    Floor = starts_at; ceiling = min(as_of, ends_at if set).
    """
    from_day = _day_iso_from_campaign_field(row.get("starts_at"))
    end_day = _day_iso_from_campaign_field(row.get("ends_at"))
    hi = (as_of_day or "")[:10]
    if end_day and (not hi or end_day < hi):
        hi = end_day
    if not hi:
        hi = _utcnow().date().isoformat()
    return from_day, hi


def _campaign_t0_present(cur, identity_id: int, campaign_id: int, row: dict) -> tuple[str | None, str]:
    """T0 = window start; present = today (Spec v1.3 §6)."""
    t0 = _day_iso_from_campaign_field(row.get("starts_at"))
    if not t0 and row.get("signed_at") is not None:
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
    return t0, present


def journey_series(
    cur,
    identity_id: int,
    campaign_id: int,
) -> dict:
    """
    One-shot scrub payload — load once, derive shape/panel in memory client-side.

    Returns compact fill events (day, optional pnl, optional entry r2r) plus
    axis meta (ranges / n_floors). Scrub does **not** re-hit the DB.

    Memory: O(stamps) rows (~1–2k max typical) — far cheaper than N panel
    round-trips while dragging the slider.
    """
    from campaign_panel import (
        PANEL_ATTRIBUTES,
        PANEL_LABELS,
        PANEL_SEEDS,
        ensure_six_controls,
        _bound_row_for_attr,
        _f,
    )
    from trade_log_domain.reports import resolve_starting_capital
    from trade_log_domain.structure import entry_r2r

    row = _campaign_row(cur, identity_id, campaign_id)
    if bool(int(row.get("is_ledger") or 0)):
        raise PracticeSpineError(
            404, "Ledger has no Campaign Journey series (furniture, not charter)"
        )
    ensure_six_controls(cur, identity_id, campaign_id)
    t0, present = _campaign_t0_present(cur, identity_id, campaign_id, row)
    from_day, to_day = campaign_term_window(row, present)

    # Axis meta (static ranges) — scrub only rewrites readings
    axes_meta: list[dict] = []
    for attr in PANEL_ATTRIBUTES:
        b = _bound_row_for_attr(cur, identity_id, campaign_id, attr)
        seed = PANEL_SEEDS[attr]
        if not b:
            continue
        n_floor = b.get("n_floor")
        if n_floor is None:
            n_floor = seed.get("n_floor") or 10
        try:
            n_floor_i = int(n_floor)
        except (TypeError, ValueError):
            n_floor_i = 10
        axes_meta.append(
            {
                "bound_id": int(b["id"]),
                "attribute": attr,
                "label": PANEL_LABELS.get(attr, attr),
                "role": "boundary",
                "range_low": _f(b.get("range_low")),
                "range_high": _f(b.get("range_high")),
                "display_low": _f(b.get("display_low"))
                if b.get("display_low") is not None
                else float(seed["display_low"]),  # type: ignore[arg-type]
                "display_high": _f(b.get("display_high"))
                if b.get("display_high") is not None
                else float(seed["display_high"]),  # type: ignore[arg-type]
                "n_floor": n_floor_i,
                "unit": b.get("unit") or seed.get("unit"),
            }
        )

    # All stamped fills in term window once (legs for structural R2R)
    trades = _campaign_trades_with_legs_as_of(
        cur,
        identity_id,
        campaign_id,
        to_day,
        from_day=from_day,
        to_day=to_day,
    )
    # Map id → day + pnl (single query)
    lo, hi = _window_day_bounds(to_day, from_day=from_day, to_day=to_day)
    sql_pnl = """SELECT id, DATE(exec_at) AS d, pnl_amount
                 FROM member_trade_log_trades
                 WHERE identity_id = %s AND practice_campaign_id = %s
                   AND DATE(exec_at) <= %s"""
    args_pnl: list[Any] = [identity_id, campaign_id, hi]
    if lo:
        sql_pnl += " AND DATE(exec_at) >= %s"
        args_pnl.append(lo)
    sql_pnl += " ORDER BY exec_at ASC, id ASC"
    cur.execute(sql_pnl, tuple(args_pnl))
    pnl_by_id: dict[int, float | None] = {}
    day_by_id: dict[int, str] = {}
    for r in cur.fetchall() or []:
        tid = int(r["id"])
        d = r.get("d")
        day_by_id[tid] = str(d)[:10] if d is not None else ""
        if r.get("pnl_amount") is not None:
            try:
                pnl_by_id[tid] = float(r["pnl_amount"])
            except (TypeError, ValueError):
                pnl_by_id[tid] = None
        else:
            pnl_by_id[tid] = None

    events: list[dict] = []
    for t in trades:
        tid = int(t["id"])
        day = day_by_id.get(tid) or ""
        if not day and t.get("exec_at") is not None:
            ea = t["exec_at"]
            day = (
                ea.date().isoformat()
                if hasattr(ea, "date")
                else str(ea)[:10]
            )
        if not day:
            continue
        ev: dict[str, Any] = {"d": day}
        pnl = pnl_by_id.get(tid)
        if pnl is not None:
            ev["pnl"] = round(pnl, 4)
        r2r = entry_r2r(t)
        if r2r is not None and r2r == r2r and r2r > 0:
            ev["r2r"] = round(float(r2r), 4)
        # Skip empty shells (no pnl and no r2r)
        if "pnl" not in ev and "r2r" not in ev:
            continue
        events.append(ev)

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
        "kind": "series",
        "t0": t0,
        "present": present,
        "window_from": from_day,
        "window_to": to_day,
        "starting_capital": resolve_starting_capital(row.get("starting_capital")),
        "axes_meta": axes_meta,
        "events": events,
        "amendment_markers": markers,
        "event_count": len(events),
    }


def journey_shape_at(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    as_of: str | None = None,
) -> dict:
    """
    Campaign Journey shape DTO — Six Controls axes (Panel v1).

    Ledger → 404. Charters always get six house axes (no empty-invitation mainline).
    Prefer ``journey_series`` + client derive for scrubbing.
    """
    from campaign_panel import PANEL_ATTRIBUTES, build_panel, ensure_six_controls

    row = _campaign_row(cur, identity_id, campaign_id)
    if bool(int(row.get("is_ledger") or 0)):
        raise PracticeSpineError(
            404, "Ledger has no Campaign Journey shape (furniture, not charter)"
        )
    ensure_six_controls(cur, identity_id, campaign_id)

    t0, present = _campaign_t0_present(cur, identity_id, campaign_id, row)
    as_of_day = (as_of or present)[:10]

    panel = build_panel(
        cur, identity_id, campaign_id, as_of=as_of_day, can_edit=False
    )
    # Stable six-axis order
    by_attr = {c["attribute"]: c for c in panel["controls"]}
    axes = []
    for attr in PANEL_ATTRIBUTES:
        c = by_attr.get(attr)
        if not c:
            continue
        axes.append(
            {
                "bound_id": c["bound_id"],
                "role": "boundary",
                "attribute": attr,
                "label": c.get("label"),
                "range_low": c.get("range_low"),
                "range_high": c.get("range_high"),
                "reading": c.get("reading"),
                "extension": c.get("extension"),
                "state": c.get("state"),
                "n_floor": c.get("n_floor"),
                "n": c.get("n"),
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
        "sample_n": panel.get("sample_n") or 0,
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
    Boundary-role process clauses at fill time (Spec §7 / B2-1).

    Returns quiet variance notes — never raises to block the fill.
    Goal-role rows are ignored (never variance).
    Trading window is membership law (L4), not variance — do not note here.
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
