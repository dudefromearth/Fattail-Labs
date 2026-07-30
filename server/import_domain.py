"""Member Practice import — Spec portability v1.1+ (two-way, **additive only**).

detect → preview → commit

**Non-destructive:** never UPDATE or DELETE existing rows. Insert missing only;
matching export_key / session_key → skip. Journey meters never written.
Privacy prefs are not overwritten (only new check-ins may be added).
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import zipfile
from datetime import datetime, timezone
from typing import Any

import export_domain as ex

MAX_BYTES = 25 * 1024 * 1024
OPEN_STATUSES = frozenset({"draft", "gathering", "ready"})
NOTE_SURFACES = frozenset({"journal", "pre_market"})
# Single policy — additive only (legacy "merge"/"skip_existing" accepted as alias)
POLICIES = frozenset({"additive", "merge", "skip_existing"})


class ImportErrorLoud(Exception):
    """Fail-loud import problem with HTTP-friendly payload."""

    def __init__(self, message: str, *, status: int = 422, extra: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.extra = extra or {}


def _normalize_policy(policy: str | None) -> str:
    p = (policy or "additive").strip().lower()
    if p not in POLICIES:
        raise ImportErrorLoud("policy must be additive (only non-destructive load supported)")
    return "additive"


def _hash_key(*parts: str) -> str:
    h = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()[:32]
    return f"h-{h}"


def _portable_key(raw_id: Any, *fallback_parts: str) -> str:
    if raw_id is not None and str(raw_id).strip():
        return str(raw_id).strip()[:64]
    return _hash_key(*fallback_parts)[:64]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def decode_payload(
    *,
    text: str | None = None,
    b64: str | None = None,
    raw_bytes: bytes | None = None,
) -> tuple[bytes, str]:
    """Return (bytes, kind) kind is 'zip' or 'text'."""
    data: bytes
    if raw_bytes is not None:
        data = raw_bytes
    elif b64:
        data = base64.b64decode(b64)
    elif text is not None:
        data = text.encode("utf-8")
    else:
        raise ImportErrorLoud("text, base64, or file content required")
    if len(data) > MAX_BYTES:
        raise ImportErrorLoud(f"payload exceeds {MAX_BYTES} bytes", status=413)
    if data[:2] == b"PK":
        return data, "zip"
    return data, "text"


def _load_json_obj(data: bytes) -> dict:
    try:
        obj = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ImportErrorLoud(f"invalid JSON: {exc}") from exc
    if not isinstance(obj, dict):
        raise ImportErrorLoud("document must be a JSON object")
    return obj


def unpack_payload(data: bytes, kind: str) -> dict[str, dict]:
    """Map surface name → document dict. Partial packs OK."""
    docs: dict[str, dict] = {}
    if kind == "zip":
        try:
            zf = zipfile.ZipFile(io.BytesIO(data))
        except zipfile.BadZipFile as exc:
            raise ImportErrorLoud("invalid ZIP") from exc
        name_map = {
            "trade_log.tradlog.json": "trade_log",
            "journal.json": "journal",
            "retrospective.json": "retrospective",
            "journey.json": "journey",
            "pack.json": "pack",
        }
        for name in zf.namelist():
            base = name.split("/")[-1]
            if base in name_map:
                try:
                    docs[name_map[base]] = _load_json_obj(zf.read(name))
                except ImportErrorLoud:
                    raise
                except Exception as exc:
                    raise ImportErrorLoud(f"bad file {base}: {exc}") from exc
        if "pack" in docs and docs["pack"].get("format") == ex.FMT_PACK:
            embedded = docs["pack"].get("documents") or {}
            if isinstance(embedded, dict):
                for k, v in embedded.items():
                    if isinstance(v, dict) and k not in docs:
                        docs[k] = v
        if not docs:
            raise ImportErrorLoud("ZIP has no recognizable Practice files")
        return docs

    obj = _load_json_obj(data)
    fmt = obj.get("format") or ""
    if fmt == ex.FMT_PACK:
        docs["pack"] = obj
        embedded = obj.get("documents") or {}
        if isinstance(embedded, dict):
            for k, v in embedded.items():
                if isinstance(v, dict):
                    docs[k] = v
        return docs
    if fmt == ex.FMT_JOURNAL:
        return {"journal": obj}
    if fmt == ex.FMT_RETRO:
        return {"retrospective": obj}
    if fmt == ex.FMT_JOURNEY:
        return {"journey": obj}
    if fmt == "fattail.labs.trade_log" or (
        isinstance(obj.get("accounts"), list)
        and str(obj.get("format", "")).startswith("fattail")
    ):
        return {"trade_log": obj}
    if isinstance(obj.get("accounts"), list) and any(
        isinstance(a, dict) and "trades" in a for a in obj.get("accounts") or []
    ):
        return {"trade_log": obj}
    raise ImportErrorLoud(f"unrecognized format {fmt!r}")


def detect_payload(data: bytes, kind: str) -> dict[str, Any]:
    docs = unpack_payload(data, kind)
    surfaces = [s for s in ("trade_log", "journal", "retrospective", "journey") if s in docs]
    return {
        "kind": kind,
        "policy": "additive",
        "surfaces": surfaces,
        "formats": {
            s: (docs[s].get("format") if isinstance(docs[s], dict) else None) for s in surfaces
        },
    }


def _count_bucket() -> dict[str, int]:
    return {"new": 0, "skip": 0, "error": 0}


def preview_journal(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    warnings: list[str] = []
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        body = (e.get("body_md") or "").strip()
        surface = (e.get("surface") or "journal").strip()
        if surface not in NOTE_SURFACES:
            counts["error"] += 1
            warnings.append(f"skip unknown surface {surface!r}")
            continue
        if not body:
            counts["skip"] += 1
            continue
        key = _portable_key(e.get("id"), surface, str(e.get("day") or ""), body)
        cur.execute(
            """SELECT id FROM member_tool_notes
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
        else:
            counts["new"] += 1
    return {
        "surface": "journal",
        "counts": counts,
        "warnings": warnings,
        "mode": "additive",
    }


def commit_journal(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    for e in doc.get("entries") or []:
        if not isinstance(e, dict):
            counts["error"] += 1
            continue
        body = (e.get("body_md") or "").strip()
        surface = (e.get("surface") or "journal").strip()
        if surface not in NOTE_SURFACES or not body:
            counts["skip"] += 1
            continue
        key = _portable_key(e.get("id"), surface, str(e.get("day") or ""), body)
        cur.execute(
            """SELECT id FROM member_tool_notes
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue
        cur.execute(
            """INSERT INTO member_tool_notes
                 (identity_id, surface, body_md, export_key)
               VALUES (%s, %s, %s, %s)""",
            (identity_id, surface, body, key),
        )
        counts["new"] += 1
    return {"surface": "journal", "counts": counts, "mode": "additive"}


def _json_dumps(v: Any) -> str | None:
    if v is None:
        return None
    return json.dumps(v)


def _parse_dt(raw: Any) -> datetime | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw
    s = str(raw).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def preview_retrospective(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    plan_counts = _count_bucket()
    warnings: list[str] = []
    errors: list[str] = []

    cur.execute(
        """SELECT COUNT(*) AS n FROM member_retrospectives
           WHERE identity_id = %s AND status IN ('draft','gathering','ready')""",
        (identity_id,),
    )
    open_now = int(cur.fetchone()["n"] or 0)
    open_new = 0
    for r in doc.get("retrospectives") or []:
        if not isinstance(r, dict):
            counts["error"] += 1
            continue
        status = (r.get("status") or "draft").strip()
        key = _portable_key(
            r.get("id"),
            str(r.get("scope_start") or ""),
            str(r.get("scope_end") or ""),
            str(r.get("title") or ""),
            str(bool(r.get("is_maiden"))),
        )
        cur.execute(
            """SELECT id FROM member_retrospectives
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            counts["skip"] += 1
        else:
            counts["new"] += 1
            if status in OPEN_STATUSES:
                open_new += 1

    if open_now + open_new > 1:
        errors.append(
            "import would exceed max 1 open retrospective (draft/gathering/ready)"
        )

    cur.execute(
        """SELECT COUNT(*) AS n FROM member_habit_plans
           WHERE identity_id = %s AND status = 'active'""",
        (identity_id,),
    )
    active_now = int(cur.fetchone()["n"] or 0)
    active_new = 0
    for p in doc.get("habit_plans") or []:
        if not isinstance(p, dict):
            plan_counts["error"] += 1
            continue
        key = _portable_key(
            p.get("id"),
            str(p.get("title") or ""),
            str(p.get("habit") or ""),
            str(p.get("status") or ""),
        )
        st = (p.get("status") or "proposed").strip()
        cur.execute(
            """SELECT id FROM member_habit_plans
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            plan_counts["skip"] += 1
        else:
            plan_counts["new"] += 1
            if st == "active":
                active_new += 1
    if active_now + active_new > 2:
        errors.append("import would exceed max 2 active habit plans")

    return {
        "surface": "retrospective",
        "counts": counts,
        "habit_plans": plan_counts,
        "warnings": warnings,
        "errors": errors,
        "mode": "additive",
    }


def commit_retrospective(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    prev = preview_retrospective(cur, identity_id, doc)
    if prev.get("errors"):
        raise ImportErrorLoud(
            prev["errors"][0],
            status=409,
            extra={"preview": prev},
        )

    counts = _count_bucket()
    plan_counts = _count_bucket()
    retro_map: dict[str, int] = {}

    # Map existing keys for habit plan links
    cur.execute(
        """SELECT id, export_key FROM member_retrospectives
           WHERE identity_id = %s AND export_key IS NOT NULL""",
        (identity_id,),
    )
    for row in cur.fetchall():
        if row.get("export_key"):
            retro_map[str(row["export_key"])] = int(row["id"])

    for r in doc.get("retrospectives") or []:
        if not isinstance(r, dict):
            counts["error"] += 1
            continue
        status = (r.get("status") or "draft").strip()
        key = _portable_key(
            r.get("id"),
            str(r.get("scope_start") or ""),
            str(r.get("scope_end") or ""),
            str(r.get("title") or ""),
            str(bool(r.get("is_maiden"))),
        )
        cur.execute(
            """SELECT id FROM member_retrospectives
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        row = cur.fetchone()
        if row:
            counts["skip"] += 1
            retro_map[key] = int(row["id"])
            if r.get("id"):
                retro_map[str(r["id"])] = int(row["id"])
            continue

        scope_start = _parse_dt(r.get("scope_start")) or _utcnow()
        scope_end = _parse_dt(r.get("scope_end")) or scope_start
        title = (r.get("title") or "")[:255]
        body_md = r.get("body_md") or ""
        is_maiden = 1 if r.get("is_maiden") else 0
        report_json = _json_dumps(r.get("report"))
        comparison_json = _json_dumps(r.get("comparison"))
        agent_json = _json_dumps(r.get("agent"))
        completed_at = _parse_dt(r.get("completed_at"))

        cur.execute(
            """INSERT INTO member_retrospectives
                 (identity_id, status, is_maiden, scope_start, scope_end,
                  title, body_md, report_json, comparison_json, agent_json,
                  completed_at, export_key)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                identity_id,
                status,
                is_maiden,
                scope_start,
                scope_end,
                title,
                body_md,
                report_json,
                comparison_json,
                agent_json,
                completed_at,
                key,
            ),
        )
        rid = int(cur.lastrowid)
        counts["new"] += 1
        retro_map[key] = rid
        if r.get("id"):
            retro_map[str(r["id"])] = rid

    for p in doc.get("habit_plans") or []:
        if not isinstance(p, dict):
            plan_counts["error"] += 1
            continue
        key = _portable_key(
            p.get("id"),
            str(p.get("title") or ""),
            str(p.get("habit") or ""),
            str(p.get("status") or ""),
        )
        cur.execute(
            """SELECT id FROM member_habit_plans
               WHERE identity_id = %s AND export_key = %s""",
            (identity_id, key),
        )
        if cur.fetchone():
            plan_counts["skip"] += 1
            continue

        title = (p.get("title") or "")[:255]
        habit = (p.get("habit") or "")[:512]
        why = p.get("why_process") or ""
        signal = (p.get("observable_signal") or "routine_days")[:64]
        status = (p.get("status") or "proposed").strip()
        activated_at = _parse_dt(p.get("activated_at"))
        retired_at = _parse_dt(p.get("retired_at"))
        rid_raw = p.get("retrospective_id")
        rid_db = retro_map.get(str(rid_raw)) if rid_raw is not None else None

        cur.execute(
            """INSERT INTO member_habit_plans
                 (identity_id, retrospective_id, title, habit, why_process,
                  observable_signal, status, activated_at, retired_at, export_key)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                identity_id,
                rid_db,
                title,
                habit,
                why,
                signal,
                status,
                activated_at,
                retired_at,
                key,
            ),
        )
        plan_counts["new"] += 1

    return {
        "surface": "retrospective",
        "counts": counts,
        "habit_plans": plan_counts,
        "mode": "additive",
    }


def preview_journey(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    """Additive: new check-ins only. Privacy prefs never changed by import."""
    counts = _count_bucket()
    checkins = (doc.get("raw_signals") or {}).get("live_checkins") or []
    for c in checkins:
        if not isinstance(c, dict) or not c.get("session_key"):
            counts["error"] += 1
            continue
        cur.execute(
            """SELECT id FROM live_session_checkins
               WHERE identity_id = %s AND session_key = %s""",
            (identity_id, str(c["session_key"])[:96]),
        )
        if cur.fetchone():
            counts["skip"] += 1
        else:
            counts["new"] += 1
    return {
        "surface": "journey",
        "counts": counts,
        "mode": "additive",
        "note": (
            "check-ins only (new keys); privacy prefs and process meters are never "
            "overwritten by import"
        ),
    }


def commit_journey(cur, identity_id: int, doc: dict) -> dict[str, Any]:
    counts = _count_bucket()
    # Privacy: never overwrite existing prefs (non-destructive)
    for c in (doc.get("raw_signals") or {}).get("live_checkins") or []:
        if not isinstance(c, dict) or not c.get("session_key"):
            counts["error"] += 1
            continue
        sk = str(c["session_key"])[:96]
        cur.execute(
            """SELECT id FROM live_session_checkins
               WHERE identity_id = %s AND session_key = %s""",
            (identity_id, sk),
        )
        if cur.fetchone():
            counts["skip"] += 1
            continue
        starts = _parse_dt(c.get("starts_at")) or _utcnow()
        checked = _parse_dt(c.get("checked_in_at")) or _utcnow()
        cur.execute(
            """INSERT INTO live_session_checkins
                 (identity_id, session_key, starts_at, checked_in_at)
               VALUES (%s, %s, %s, %s)""",
            (identity_id, sk, starts, checked),
        )
        counts["new"] += 1
    return {
        "surface": "journey",
        "counts": counts,
        "mode": "additive",
        "note": "privacy prefs and process meters not written",
    }


def preview_trade_log(doc: dict) -> dict[str, Any]:
    import trade_log_io as tio

    text = json.dumps(doc)
    result = tio.parse_native(text)
    trades = result.get("trades") or []
    return {
        "surface": "trade_log",
        "counts": {
            "new": len(trades),
            "skip": 0,
            "error": len(result.get("errors") or []),
        },
        "trade_count": len(trades),
        "warnings": result.get("warnings") or [],
        "errors": result.get("errors") or [],
        "mode": "additive",
        "note": "idempotent insert by external id; existing trades skipped",
    }


def commit_trade_log(cur, identity_id: int, doc: dict, claims: dict) -> dict[str, Any]:
    """Insert-only into default account; skip existing external ids."""
    import trade_log_catalog as cat
    import trade_log_io as tio
    from routes.trade_log.common import (
        _dec,
        _ensure_default_account,
        _insert_legs,
        _maybe_set_account_venue,
        _parse_exec_at,
    )

    text = json.dumps(doc)
    result = tio.parse_native(text)
    if result.get("errors"):
        raise ImportErrorLoud(
            "trade log parse failed",
            extra={"errors": result["errors"]},
        )
    trades = result.get("trades") or []
    adapter_id = "native"
    acct = _ensure_default_account(cur, identity_id)
    account_id = int(acct["id"])
    venue = cat.ADAPTER_DEFAULT_VENUE.get(adapter_id) or "fattail"
    _maybe_set_account_venue(
        cur, identity_id, account_id, broker=venue, only_if_unset=True
    )
    created = 0
    skipped = 0
    for t in trades:
        ext = t.get("external_order_id") or t.get("id") or None
        if ext:
            ext = str(ext)[:128]
            cur.execute(
                """SELECT id FROM member_trade_log_trades
                   WHERE identity_id = %s AND account_id = %s
                     AND external_adapter = %s AND external_order_id = %s""",
                (identity_id, account_id, adapter_id, ext),
            )
            if cur.fetchone():
                skipped += 1
                continue
        process = t.get("process") if isinstance(t.get("process"), dict) else {}
        adherence = process.get("adherence") or t.get("adherence") or "unknown"
        if adherence not in cat.ADHERENCE:
            adherence = "unknown"
        strategy = t.get("strategy") or "CUSTOM"
        if strategy not in cat.STRATEGY_CODES:
            strategy = "CUSTOM"
        net_side = t.get("net_side")
        if net_side and net_side not in cat.NET_SIDES:
            net_side = None
        pnl = process.get("pnl_amount")
        if pnl is None:
            pnl = t.get("pnl_amount")
        exec_at = _parse_exec_at(t.get("exec_at"))
        cur.execute(
            """INSERT INTO member_trade_log_trades
                 (identity_id, account_id, exec_at, asset_class, strategy, order_type,
                  net_price, net_side, setup_md, plan_md, rules_md, adherence,
                  deviation_md, lesson_md, pnl_amount, external_adapter, external_order_id)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                identity_id,
                account_id,
                exec_at,
                (t.get("asset_class") or "equity_option").lower(),
                strategy,
                (t.get("order_type") or "LMT")[:32],
                _dec(t.get("net_price")),
                net_side,
                process.get("setup_md") or t.get("setup_md") or "",
                process.get("plan_md") or t.get("plan_md") or "",
                process.get("rules_md") or t.get("rules_md") or "",
                adherence,
                process.get("deviation_md") or t.get("deviation_md") or "",
                process.get("lesson_md") or t.get("lesson_md") or "",
                pnl,
                adapter_id,
                ext,
            ),
        )
        tid = int(cur.lastrowid)
        _insert_legs(cur, tid, identity_id, account_id, t.get("legs") or [])
        created += 1
    return {
        "surface": "trade_log",
        "counts": {"new": created, "skip": skipped, "error": 0},
        "account_id": account_id,
        "mode": "additive",
    }


def preview_all(cur, identity_id: int, docs: dict[str, dict], policy: str) -> dict[str, Any]:
    _normalize_policy(policy)
    surfaces: dict[str, Any] = {}
    errors: list[str] = []
    if "trade_log" in docs:
        surfaces["trade_log"] = preview_trade_log(docs["trade_log"])
        errors.extend(surfaces["trade_log"].get("errors") or [])
    if "journal" in docs:
        surfaces["journal"] = preview_journal(cur, identity_id, docs["journal"])
    if "retrospective" in docs:
        surfaces["retrospective"] = preview_retrospective(
            cur, identity_id, docs["retrospective"]
        )
        errors.extend(surfaces["retrospective"].get("errors") or [])
    if "journey" in docs:
        surfaces["journey"] = preview_journey(cur, identity_id, docs["journey"])
    return {
        "policy": "additive",
        "mode": "additive",
        "surfaces": surfaces,
        "errors": errors,
        "ok": len(errors) == 0,
        "note": "non-destructive: existing rows are never updated or deleted",
    }


# Phrase required in body for intentional Practice wipe (membership retained).
PURGE_CONFIRM = "DELETE_PRACTICE_DATA"


def purge_practice_data(cur, identity_id: int) -> dict[str, int]:
    """Delete authored Practice surfaces; keep identity, memberships, course progress.

    Non-membership data removed:
    - habit plans, retrospectives
    - trade log legs / trades / accounts (+ legacy entries if present)
    - tool notes (journal / playbook / trade_log probe notes)
    - live session check-ins (journey attendance signal)

    Preserved: identities, memberships, enrollments, lesson_progress, certificates,
    analytics consent, journey_visible / share prefs, credentials, SSO links.
    """
    counts: dict[str, int] = {}

    def _del(label: str, sql: str, args: tuple = ()) -> None:
        cur.execute(sql, args if args else (identity_id,))
        counts[label] = int(cur.rowcount or 0)

    # Order respects FKs
    _del(
        "habit_plans",
        "DELETE FROM member_habit_plans WHERE identity_id = %s",
    )
    _del(
        "retrospectives",
        "DELETE FROM member_retrospectives WHERE identity_id = %s",
    )
    _del(
        "trade_log_legs",
        "DELETE FROM member_trade_log_legs WHERE identity_id = %s",
    )
    _del(
        "trade_log_trades",
        "DELETE FROM member_trade_log_trades WHERE identity_id = %s",
    )
    _del(
        "trade_log_accounts",
        "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
    )
    try:
        _del(
            "trade_log_entries_legacy",
            "DELETE FROM member_trade_log_entries WHERE identity_id = %s",
        )
    except Exception:
        counts["trade_log_entries_legacy"] = 0
    _del(
        "tool_notes",
        "DELETE FROM member_tool_notes WHERE identity_id = %s",
    )
    _del(
        "live_checkins",
        "DELETE FROM live_session_checkins WHERE identity_id = %s",
    )
    return counts


def commit_all(
    cur,
    identity_id: int,
    docs: dict[str, dict],
    policy: str,
    *,
    claims: dict,
) -> dict[str, Any]:
    _normalize_policy(policy)
    prev = preview_all(cur, identity_id, docs, "additive")
    if not prev["ok"]:
        raise ImportErrorLoud(
            prev["errors"][0] if prev["errors"] else "preview failed",
            status=409,
            extra={"preview": prev},
        )
    results: dict[str, Any] = {}
    if "trade_log" in docs:
        results["trade_log"] = commit_trade_log(cur, identity_id, docs["trade_log"], claims)
    if "journal" in docs:
        results["journal"] = commit_journal(cur, identity_id, docs["journal"])
    if "retrospective" in docs:
        results["retrospective"] = commit_retrospective(
            cur, identity_id, docs["retrospective"]
        )
    if "journey" in docs:
        results["journey"] = commit_journey(cur, identity_id, docs["journey"])
    return {"policy": "additive", "mode": "additive", "results": results}
