"""Curate instance / positions / decision_log persistence."""

from __future__ import annotations

import hashlib
import json
import secrets
from datetime import datetime, timezone
from typing import Any

from strategy_runtime.envelope import normalize_envelope

FILL_MODEL_MARK_MID_V1 = "mark_mid_v1"

STATUSES = frozenset(
    {"draft", "armed", "running", "paused", "halted", "archived"}
)

DEFAULT_RUNNERS = [
    {
        "id": "scan_1",
        "type": "scan",
        "name": "Curate structure scan",
        "enabled": True,
        "schedule": {"every_seconds": 60},
    },
    {
        "id": "manage_1",
        "type": "manage",
        "name": "Curate position manage",
        "enabled": True,
        "schedule": {"every_seconds": 60},
    },
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat().replace("+00:00", "Z")


def _ts_iso(val: Any) -> str | None:
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        s = val.isoformat()
        if not s.endswith("Z") and "+" not in s[10:]:
            s = s + "Z"
        return s.replace("+00:00", "Z")
    return str(val)


def format_runtime_seconds(seconds: float | int | None) -> str | None:
    """Adaptive runtime label: seconds → m:ss → h m → d h.

    - < 60s:        ``42s``
    - < 60m:        ``3:45`` (min:sec)
    - < 24h:        ``2h 15m``
    - ≥ 24h:        ``3d 4h``
    """
    if seconds is None:
        return None
    try:
        s = int(max(0, float(seconds)))
    except (TypeError, ValueError):
        return None
    if s < 60:
        return f"{s}s"
    if s < 3600:
        m, sec = divmod(s, 60)
        return f"{m}:{sec:02d}"
    if s < 86400:
        h, rem = divmod(s, 3600)
        m = rem // 60
        return f"{h}h {m}m"
    d, rem = divmod(s, 86400)
    h = rem // 3600
    return f"{d}d {h}h"


def runtime_since_start(
    run_started_at: Any, *, now: datetime | None = None
) -> dict[str, Any]:
    """Wall-clock runtime since last start/restart (run_started_at)."""
    if run_started_at is None:
        return {
            "run_started_at": None,
            "runtime_seconds": None,
            "runtime_label": None,
        }
    start = run_started_at
    if isinstance(start, str):
        raw = start.replace("Z", "+00:00")
        try:
            start = datetime.fromisoformat(raw)
        except ValueError:
            return {
                "run_started_at": str(run_started_at),
                "runtime_seconds": None,
                "runtime_label": None,
            }
    if getattr(start, "tzinfo", None) is None:
        start = start.replace(tzinfo=timezone.utc)
    n = now or _now()
    if n.tzinfo is None:
        n = n.replace(tzinfo=timezone.utc)
    secs = max(0, int((n - start).total_seconds()))
    return {
        "run_started_at": _ts_iso(run_started_at),
        "runtime_seconds": secs,
        "runtime_label": format_runtime_seconds(secs),
    }


def _public_id() -> str:
    return secrets.token_hex(4)


def _json_dump(obj: Any) -> str:
    return json.dumps(obj, separators=(",", ":"), default=str)


def _json_load(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, (bytes, bytearray)):
        val = val.decode("utf-8")
    if isinstance(val, str):
        return json.loads(val)
    return val


def pack_config_hash(strategy_row: dict) -> str:
    """Stable hash of pack-ish fields for drift detection."""
    payload = {
        "version": strategy_row.get("version"),
        "spec": _json_load(strategy_row.get("spec_json")),
        "attributes": _json_load(strategy_row.get("attributes_json")),
        "product_key": strategy_row.get("product_key"),
    }
    raw = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def append_decision(
    cur,
    *,
    identity_id: int,
    instance_id: int,
    strategy_public_id: str,
    runner_type: str,
    event_type: str,
    message: str = "",
    reason_code: str | None = None,
    payload: dict | None = None,
) -> None:
    cur.execute(
        """INSERT INTO strategy_lab_decision_log
           (identity_id, instance_id, strategy_public_id, runner_type,
            event_type, reason_code, message, payload_json)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            identity_id,
            instance_id,
            strategy_public_id,
            runner_type,
            event_type,
            reason_code,
            (message or "")[:512],
            _json_dump(payload) if payload is not None else None,
        ),
    )


def instance_to_dict(r: dict) -> dict[str, Any]:
    rt = runtime_since_start(r.get("run_started_at"))
    return {
        "id": r["public_id"],
        "db_id": int(r["id"]),
        "strategy_id": r.get("strategy_public_id"),
        "strategy_db_id": int(r["strategy_id"]),
        "bound_version": r["bound_version"],
        "pack_config_hash": r["pack_config_hash"],
        "status": r["status"],
        "allocation_usd": float(r["allocation_usd"]),
        "cash_usd": float(r["cash_usd"]),
        "realized_pnl_usd": float(r["realized_pnl_usd"]),
        "envelope": _json_load(r["envelope_json"]) or {},
        "runners": _json_load(r["runners_json"]) or [],
        "fill_model": r["fill_model"],
        "last_tick_at": r["last_tick_at"].isoformat() + "Z"
        if r.get("last_tick_at") and hasattr(r["last_tick_at"], "isoformat")
        else (str(r["last_tick_at"]) if r.get("last_tick_at") else None),
        "last_tick_status": r.get("last_tick_status"),
        "last_error": r.get("last_error"),
        "run_started_at": rt["run_started_at"],
        "runtime_seconds": rt["runtime_seconds"],
        "runtime_label": rt["runtime_label"],
        "created_at": r["created_at"].isoformat() + "Z"
        if hasattr(r["created_at"], "isoformat")
        else str(r.get("created_at") or ""),
        "updated_at": r["updated_at"].isoformat() + "Z"
        if hasattr(r["updated_at"], "isoformat")
        else str(r.get("updated_at") or ""),
        "account_mode": "curate_sim",
        "execution_home": "labs_hosted",
        "broker": "sim",
    }


def position_to_dict(r: dict) -> dict[str, Any]:
    return {
        "id": r["public_id"],
        "instance_db_id": int(r["instance_id"]),
        "symbol": r["symbol"],
        "structure": _json_load(r["structure_json"]) or {},
        "qty": int(r["qty"]),
        "side": r["side"],
        "entry_price": float(r["entry_price"]),
        "max_loss_usd": float(r["max_loss_usd"]),
        "max_profit_usd": float(r["max_profit_usd"]),
        "mark_price": float(r["mark_price"]) if r.get("mark_price") is not None else None,
        "unrealized_pnl_usd": float(r["unrealized_pnl_usd"] or 0),
        "status": r["status"],
        "client_order_tag": r["client_order_tag"],
        "opened_at": r["opened_at"].isoformat() + "Z"
        if hasattr(r["opened_at"], "isoformat")
        else str(r.get("opened_at") or ""),
        "closed_at": r["closed_at"].isoformat() + "Z"
        if r.get("closed_at") and hasattr(r["closed_at"], "isoformat")
        else (str(r["closed_at"]) if r.get("closed_at") else None),
        "close_reason": r.get("close_reason"),
        "realized_pnl_usd": float(r["realized_pnl_usd"])
        if r.get("realized_pnl_usd") is not None
        else None,
    }


def create_instance(
    cur,
    *,
    identity_id: int,
    strategy_row: dict,
    envelope: dict | None = None,
) -> dict[str, Any]:
    if strategy_row["identity_id"] != identity_id:
        raise PermissionError("strategy not owned")
    phase = (strategy_row.get("phase") or "").lower()
    # Allow Design packs that are ready; prefer curation phase
    if phase not in ("curation", "development", "deployment"):
        raise ValueError("strategy phase cannot host Curate instance")

    env = normalize_envelope(envelope)
    alloc = float(env["allocation_usd"])
    h = pack_config_hash(strategy_row)
    pid = _public_id()
    cur.execute(
        """INSERT INTO strategy_lab_curate_instances
           (public_id, identity_id, strategy_id, strategy_public_id,
            bound_version, pack_config_hash, status, allocation_usd, cash_usd,
            realized_pnl_usd, envelope_json, runners_json, fill_model)
           VALUES (%s, %s, %s, %s, %s, %s, 'draft', %s, %s, 0, %s, %s, %s)""",
        (
            pid,
            identity_id,
            int(strategy_row["id"]),
            strategy_row["public_id"],
            strategy_row["version"],
            h,
            alloc,
            alloc,
            _json_dump(env),
            _json_dump(DEFAULT_RUNNERS),
            FILL_MODEL_MARK_MID_V1,
        ),
    )
    instance_id = int(cur.lastrowid)
    append_decision(
        cur,
        identity_id=identity_id,
        instance_id=instance_id,
        strategy_public_id=strategy_row["public_id"],
        runner_type="system",
        event_type="instance_created",
        message="Curate instance created (sim broker, fake money)",
        payload={
            "bound_version": strategy_row["version"],
            "pack_config_hash": h,
            "fill_model": FILL_MODEL_MARK_MID_V1,
            "allocation_usd": alloc,
        },
    )
    cur.execute(
        "SELECT * FROM strategy_lab_curate_instances WHERE id = %s",
        (instance_id,),
    )
    return instance_to_dict(cur.fetchone())


def get_instance(cur, identity_id: int, public_id: str) -> dict | None:
    cur.execute(
        """SELECT * FROM strategy_lab_curate_instances
           WHERE identity_id = %s AND public_id = %s""",
        (identity_id, public_id),
    )
    return cur.fetchone()


def list_instances(
    cur, identity_id: int, strategy_public_id: str | None = None
) -> list[dict[str, Any]]:
    if strategy_public_id:
        cur.execute(
            """SELECT * FROM strategy_lab_curate_instances
               WHERE identity_id = %s AND strategy_public_id = %s
               ORDER BY id DESC""",
            (identity_id, strategy_public_id),
        )
    else:
        cur.execute(
            """SELECT * FROM strategy_lab_curate_instances
               WHERE identity_id = %s
               ORDER BY id DESC""",
            (identity_id,),
        )
    return [instance_to_dict(r) for r in cur.fetchall()]


def set_status(
    cur,
    row: dict,
    *,
    status: str,
    message: str = "",
) -> dict[str, Any]:
    if status not in STATUSES:
        raise ValueError(f"invalid status {status!r}")
    prev = (row.get("status") or "").lower()
    # Arm / re-arm resets the run clock (start or restart).
    if status == "armed":
        cur.execute(
            """UPDATE strategy_lab_curate_instances
               SET status = %s, last_error = NULL,
                   run_started_at = UTC_TIMESTAMP()
               WHERE id = %s""",
            (status, int(row["id"])),
        )
        payload: dict[str, Any] = {
            "status": status,
            "run_started_at": "reset",
            "prev_status": prev,
        }
    else:
        cur.execute(
            """UPDATE strategy_lab_curate_instances
               SET status = %s, last_error = NULL WHERE id = %s""",
            (status, int(row["id"])),
        )
        payload = {"status": status, "prev_status": prev}
    append_decision(
        cur,
        identity_id=int(row["identity_id"]),
        instance_id=int(row["id"]),
        strategy_public_id=row["strategy_public_id"],
        runner_type="system",
        event_type="status_change",
        message=message or f"status → {status}",
        payload=payload,
    )
    cur.execute(
        "SELECT * FROM strategy_lab_curate_instances WHERE id = %s",
        (int(row["id"]),),
    )
    return instance_to_dict(cur.fetchone())


def list_positions(
    cur, identity_id: int, instance_id: int, *, open_only: bool = False
) -> list[dict[str, Any]]:
    if open_only:
        cur.execute(
            """SELECT * FROM strategy_lab_curate_positions
               WHERE identity_id = %s AND instance_id = %s AND status = 'open'
               ORDER BY id ASC""",
            (identity_id, instance_id),
        )
    else:
        cur.execute(
            """SELECT * FROM strategy_lab_curate_positions
               WHERE identity_id = %s AND instance_id = %s
               ORDER BY id DESC""",
            (identity_id, instance_id),
        )
    return [position_to_dict(r) for r in cur.fetchall()]


def list_decisions(
    cur, identity_id: int, instance_id: int, *, limit: int = 100
) -> list[dict[str, Any]]:
    lim = max(1, min(500, int(limit)))
    cur.execute(
        """SELECT * FROM strategy_lab_decision_log
           WHERE identity_id = %s AND instance_id = %s
           ORDER BY id DESC LIMIT %s""",
        (identity_id, instance_id, lim),
    )
    out = []
    for r in cur.fetchall():
        out.append(
            {
                "id": int(r["id"]),
                "runner_type": r["runner_type"],
                "event_type": r["event_type"],
                "reason_code": r.get("reason_code"),
                "message": r.get("message") or "",
                "payload": _json_load(r.get("payload_json")),
                "created_at": r["created_at"].isoformat() + "Z"
                if hasattr(r["created_at"], "isoformat")
                else str(r.get("created_at") or ""),
            }
        )
    return out


def positions_report(
    cur,
    identity_id: int,
    *,
    status: str = "all",
    strategy_public_id: str | None = None,
    limit: int = 200,
) -> dict[str, Any]:
    """All Curate positions for member with instance + strategy context.

    status: all | open | closed
    """
    lim = max(1, min(1000, int(limit)))
    st = (status or "all").strip().lower()
    if st not in ("all", "open", "closed"):
        raise ValueError("status must be all|open|closed")

    clauses = ["p.identity_id = %s"]
    params: list[Any] = [identity_id]
    if st in ("open", "closed"):
        clauses.append("p.status = %s")
        params.append(st)
    if strategy_public_id:
        clauses.append("i.strategy_public_id = %s")
        params.append(strategy_public_id)

    where = " AND ".join(clauses)
    params.append(lim)
    cur.execute(
        f"""
        SELECT
          p.*,
          i.public_id AS instance_public_id,
          i.status AS instance_status,
          i.bound_version,
          i.cash_usd AS instance_cash_usd,
          i.realized_pnl_usd AS instance_realized_pnl_usd,
          i.strategy_public_id,
          s.name AS strategy_name,
          s.public_id AS strategy_public_id_pos,
          s.phase AS strategy_phase,
          s.version AS strategy_version
        FROM strategy_lab_curate_positions p
        JOIN strategy_lab_curate_instances i ON i.id = p.instance_id
        JOIN strategy_lab_strategies s ON s.id = i.strategy_id
        WHERE {where}
        ORDER BY
          CASE WHEN p.status = 'open' THEN 0 ELSE 1 END,
          p.opened_at DESC,
          p.id DESC
        LIMIT %s
        """,
        tuple(params),
    )
    rows = cur.fetchall()
    positions: list[dict[str, Any]] = []
    open_count = 0
    closed_count = 0
    sum_open_risk = 0.0
    sum_open_upnl = 0.0
    sum_closed_rpnl = 0.0

    for r in rows:
        pos = position_to_dict(r)
        entry = float(r["entry_price"])
        max_profit = float(r["max_profit_usd"])
        max_loss = float(r["max_loss_usd"])
        upnl = float(r["unrealized_pnl_usd"] or 0)
        # Progress fraction toward max profit (+) or max loss (-)
        if upnl >= 0 and max_profit > 0:
            progress_frac = min(1.0, upnl / max_profit)
        elif upnl < 0 and max_loss > 0:
            progress_frac = max(-1.0, upnl / max_loss)
        else:
            progress_frac = 0.0

        # Toward take-profit threshold (envelope default 0.5 of max_profit) — informational
        if max_profit > 0:
            tp_target = 0.5 * max_profit
            progress_to_tp_pct = min(100.0, max(0.0, (upnl / tp_target) * 100.0)) if tp_target else 0.0
        else:
            progress_to_tp_pct = 0.0

        item = {
            **pos,
            "instance_id": r["instance_public_id"],
            "instance_status": r["instance_status"],
            "bound_version": r["bound_version"],
            "instance_cash_usd": float(r["instance_cash_usd"]),
            "instance_realized_pnl_usd": float(r["instance_realized_pnl_usd"]),
            "bot_id": r["strategy_public_id"],
            "bot_name": r["strategy_name"],
            "strategy_id": r["strategy_public_id"],
            "strategy_name": r["strategy_name"],
            "strategy_phase": r["strategy_phase"],
            "strategy_version": r["strategy_version"],
            "progress_frac": round(progress_frac, 4),
            "progress_to_tp_pct": round(progress_to_tp_pct, 1),
            "account_mode": "curate_sim",
            "broker": "sim",
            "not_tradier": True,
        }
        positions.append(item)
        if r["status"] == "open":
            open_count += 1
            sum_open_risk += float(r["max_loss_usd"])
            sum_open_upnl += upnl
        else:
            closed_count += 1
            if r.get("realized_pnl_usd") is not None:
                sum_closed_rpnl += float(r["realized_pnl_usd"])

    return {
        "asof": _now_iso(),
        "account_mode": "curate_sim",
        "broker": "sim",
        "fill_model": FILL_MODEL_MARK_MID_V1,
        "note": (
            "Curate sim positions only — not Tradier Deploy. "
            "progress_frac: -1 max loss … 0 flat … +1 max profit."
        ),
        "filter": {
            "status": st,
            "strategy_id": strategy_public_id,
            "limit": lim,
        },
        "summary": {
            "positions_returned": len(positions),
            "open_count": open_count,
            "closed_count": closed_count,
            "open_risk_usd": round(sum_open_risk, 2),
            "open_unrealized_pnl_usd": round(sum_open_upnl, 2),
            "closed_realized_pnl_usd": round(sum_closed_rpnl, 2),
        },
        "positions": positions,
    }


# Mini-chart budget: last N tick samples, compact {equity} only (no timestamps/cash).
EQUITY_SERIES_LIMIT = 24


def _equity_points_from_log_rows(
    log_rows: list[dict], allocation: float
) -> list[dict[str, Any]]:
    """Build compact sparkline points from tick_complete log rows (oldest→newest)."""
    points: list[dict[str, Any]] = [{"equity": float(allocation)}]
    for r in log_rows:
        payload = _json_load(r.get("payload_json")) or {}
        eq = payload.get("equity_approx_usd")
        if eq is None and payload.get("cash_usd") is not None:
            eq = float(payload["cash_usd"])
        if eq is None:
            continue
        points.append({"equity": round(float(eq), 2)})
    return points


def equity_series_for_instance(
    cur, instance_id: int, allocation: float, *, limit: int = EQUITY_SERIES_LIMIT
) -> list[dict[str, Any]]:
    """Mini equity chart points — *last* N tick_complete events (newest path)."""
    lim = max(2, min(48, int(limit)))
    cur.execute(
        """SELECT payload_json, created_at FROM strategy_lab_decision_log
           WHERE instance_id = %s AND event_type = 'tick_complete'
           ORDER BY id DESC
           LIMIT %s""",
        (instance_id, lim),
    )
    rows = list(cur.fetchall())
    rows.reverse()
    return _equity_points_from_log_rows(rows, allocation)


def _batch_position_aggs(cur, instance_ids: list[int]) -> dict[int, dict]:
    if not instance_ids:
        return {}
    placeholders = ",".join(["%s"] * len(instance_ids))
    cur.execute(
        f"""SELECT
              instance_id,
              SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_n,
              SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_n,
              SUM(CASE WHEN status = 'open' THEN max_loss_usd ELSE 0 END) AS open_risk,
              SUM(CASE WHEN status = 'open' THEN unrealized_pnl_usd ELSE 0 END) AS open_upnl,
              SUM(CASE WHEN status = 'closed' THEN COALESCE(realized_pnl_usd, 0) ELSE 0 END) AS closed_rpnl,
              SUM(CASE WHEN status = 'closed' AND close_reason = 'take_profit' THEN 1 ELSE 0 END) AS tp_n,
              SUM(CASE WHEN status = 'closed' AND close_reason IN ('stop', 'max_loss') THEN 1 ELSE 0 END) AS stop_n
            FROM strategy_lab_curate_positions
            WHERE instance_id IN ({placeholders})
            GROUP BY instance_id""",
        tuple(instance_ids),
    )
    return {int(r["instance_id"]): r for r in cur.fetchall()}


def _batch_equity_series(
    cur, instance_ids: list[int], alloc_by_id: dict[int, float], *, limit: int
) -> dict[int, list[dict[str, Any]]]:
    """Last `limit` tick_complete samples per instance in one query (window)."""
    if not instance_ids:
        return {}
    lim = max(2, min(48, int(limit)))
    placeholders = ",".join(["%s"] * len(instance_ids))
    # MySQL 8 window — take last N per instance, then reassemble oldest→newest
    cur.execute(
        f"""SELECT instance_id, payload_json, created_at, rn FROM (
              SELECT instance_id, payload_json, created_at,
                     ROW_NUMBER() OVER (
                       PARTITION BY instance_id ORDER BY id DESC
                     ) AS rn
              FROM strategy_lab_decision_log
              WHERE instance_id IN ({placeholders})
                AND event_type = 'tick_complete'
            ) x
            WHERE rn <= %s
            ORDER BY instance_id ASC, rn DESC""",
        (*instance_ids, lim),
    )
    by_id: dict[int, list[dict]] = {iid: [] for iid in instance_ids}
    for r in cur.fetchall():
        by_id.setdefault(int(r["instance_id"]), []).append(r)
    out: dict[int, list[dict[str, Any]]] = {}
    for iid, log_rows in by_id.items():
        out[iid] = _equity_points_from_log_rows(
            log_rows, float(alloc_by_id.get(iid, 0))
        )
    return out


def comparison_report(cur, identity_id: int) -> dict[str, Any]:
    """Multi-bot Sim market comparison — process metrics for promote / portfolio.

    Performance contract (browser stability):
    - O(1) SQL batches (not 3N queries)
    - No live Massive correlation on this hot path (use correlation calculator)
    - Compact equity sparklines (last N equities only)
    - Single `bots` array on the wire (no dual bots+strategies payload)
    Multi-member: always scoped to identity_id (Family B).
    """
    cur.execute(
        """
        SELECT
          i.*,
          s.name AS strategy_name,
          s.product_key AS product_key,
          s.phase AS strategy_phase,
          s.phase_state AS strategy_phase_state,
          s.version AS strategy_version,
          s.public_id AS strategy_public_id
        FROM strategy_lab_curate_instances i
        JOIN strategy_lab_strategies s ON s.id = i.strategy_id
        WHERE i.identity_id = %s
          AND i.status NOT IN ('archived')
        ORDER BY
          FIELD(i.status, 'running', 'armed', 'paused', 'halted', 'draft'),
          i.updated_at DESC
        """,
        (identity_id,),
    )
    instances = list(cur.fetchall())
    instance_ids = [int(r["id"]) for r in instances]
    pos_by = _batch_position_aggs(cur, instance_ids)
    alloc_by = {
        int(r["id"]): float(r["allocation_usd"]) for r in instances
    }
    series_by = _batch_equity_series(
        cur, instance_ids, alloc_by, limit=EQUITY_SERIES_LIMIT
    )

    rows: list[dict[str, Any]] = []
    for irow in instances:
        iid = int(irow["id"])
        agg = pos_by.get(iid) or {}
        open_n = int(agg.get("open_n") or 0)
        closed_n = int(agg.get("closed_n") or 0)
        open_risk = float(agg.get("open_risk") or 0)
        open_upnl = float(agg.get("open_upnl") or 0)
        closed_rpnl = float(agg.get("closed_rpnl") or 0)
        tp_n = int(agg.get("tp_n") or 0)
        stop_n = int(agg.get("stop_n") or 0)
        process_exit_rate = (
            round(tp_n / closed_n, 4) if closed_n > 0 else None
        )
        cash = float(irow["cash_usd"])
        realized = float(irow["realized_pnl_usd"])
        allocation = float(irow["allocation_usd"])
        equity_approx = cash + open_risk + open_upnl
        vs_allocation = equity_approx - allocation

        env = _json_load(irow.get("envelope_json")) or {}
        scan_symbol = str(env.get("scan_symbol") or "")
        rt = runtime_since_start(irow.get("run_started_at"))

        rows.append(
            {
                "instance_id": irow["public_id"],
                "instance_status": irow["status"],
                "bot_id": irow["strategy_public_id"],
                "bot_name": irow["strategy_name"],
                "strategy_id": irow["strategy_public_id"],
                "strategy_name": irow["strategy_name"],
                "strategy_attribute": irow.get("product_key")
                or irow.get("strategy_public_id"),
                "strategy_phase": irow["strategy_phase"],
                "strategy_phase_state": irow["strategy_phase_state"],
                "bound_version": irow["bound_version"],
                "strategy_version": irow["strategy_version"],
                "scan_symbol": scan_symbol,
                "allocation_usd": allocation,
                "cash_usd": cash,
                "realized_pnl_usd": realized,
                "open_positions": open_n,
                "closed_positions": closed_n,
                "open_risk_usd": round(open_risk, 2),
                "open_unrealized_pnl_usd": round(open_upnl, 2),
                "closed_realized_pnl_usd": round(closed_rpnl, 2),
                "equity_approx_usd": round(equity_approx, 2),
                "vs_allocation_usd": round(vs_allocation, 2),
                "take_profit_exits": tp_n,
                "stop_or_max_loss_exits": stop_n,
                "process_tp_share_of_closes": process_exit_rate,
                # Compact sparkline only (no t/cash) — browser memory budget
                "equity_series": series_by.get(iid)
                or [{"equity": allocation}],
                "last_tick_at": irow["last_tick_at"].isoformat() + "Z"
                if irow.get("last_tick_at")
                and hasattr(irow["last_tick_at"], "isoformat")
                else (str(irow["last_tick_at"]) if irow.get("last_tick_at") else None),
                "last_tick_status": irow.get("last_tick_status"),
                "fill_model": irow["fill_model"],
                "broker": "sim",
                "account_mode": "curate_sim",
                # corr is on-demand via calculator — never block comparison
                "corr_vs_spy": None,
                "run_started_at": rt["run_started_at"],
                "runtime_seconds": rt["runtime_seconds"],
                "runtime_label": rt["runtime_label"],
            }
        )

    rows.sort(
        key=lambda r: (
            0 if r["instance_status"] == "running" else 1,
            0 if r["instance_status"] == "armed" else 1,
            -(r["equity_approx_usd"] or 0),
        )
    )

    running = sum(1 for r in rows if r["instance_status"] in ("running", "armed"))

    return {
        "asof": _now_iso(),
        "account_mode": "curate_sim",
        "broker": "sim",
        "multi_member": True,
        "identity_scoped": True,
        "purpose": (
            "Compare many Curate bot runs for promote / portfolio inclusion. "
            "Process metrics first; equity_approx is sim book only — not live P&L claims. "
            "Correlation is on-demand (calculator), not on this hot path."
        ),
        "summary": {
            "instances": len(rows),
            "armed_or_running": running,
            "strategies": len({r["strategy_id"] for r in rows}),
            "bots": len({r["bot_id"] for r in rows}),
        },
        # Empty stub keeps old clients from calling Massive on poll
        "correlation": {
            "benchmark": "SPY",
            "vs_benchmark": {},
            "pairwise": [],
            "error": None,
            "deferred": True,
            "note": "Use /curate/correlation or calculator — not loaded with comparison",
        },
        "bots": rows,
        # Legacy key: empty list (do not duplicate full payload)
        "strategies": [],
    }


def list_tickable_instances(cur, identity_id: int) -> list[dict]:
    """Armed or running Curate instances for this member (multi-strategy)."""
    cur.execute(
        """SELECT * FROM strategy_lab_curate_instances
           WHERE identity_id = %s AND status IN ('armed', 'running')
           ORDER BY id ASC""",
        (identity_id,),
    )
    return list(cur.fetchall())


def list_all_tickable_instances(cur, *, limit: int = 500) -> list[dict]:
    """Platform-wide tickable Curate instances (worker / multi-member)."""
    lim = max(1, min(2000, int(limit)))
    cur.execute(
        """SELECT * FROM strategy_lab_curate_instances
           WHERE status IN ('armed', 'running')
           ORDER BY last_tick_at IS NOT NULL, last_tick_at ASC, id ASC
           LIMIT %s""",
        (lim,),
    )
    return list(cur.fetchall())


def opens_today_count(cur, instance_id: int) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM strategy_lab_curate_positions
           WHERE instance_id = %s
             AND DATE(opened_at) = CURDATE()""",
        (instance_id,),
    )
    return int(cur.fetchone()["n"])


def open_symbol_count(cur, instance_id: int, symbol: str) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM strategy_lab_curate_positions
           WHERE instance_id = %s AND status = 'open' AND symbol = %s""",
        (instance_id, symbol),
    )
    return int(cur.fetchone()["n"])
