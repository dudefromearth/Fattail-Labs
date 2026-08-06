"""Curate tick: manage-before-scan on sim broker + fake money."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Any

from strategy_runtime import curate_domain as cd
from strategy_runtime.envelope import check_open_allowed, normalize_envelope
from strategy_runtime.fill_simulator import (
    FILL_MODEL,
    advance_package_mark,
    fill_close,
    fill_open,
)
from strategy_runtime.marks import MarksError, get_mark
from strategy_runtime.sim_adapter import OrderIntent, SimulatedAdapter


def _tag(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


def tick_many(
    cur,
    rows: list[dict],
    *,
    mark_step_frac: float = 0.15,
) -> dict[str, Any]:
    """Tick multiple Curate instances (multi-strategy / multi-member worker).

    Continues on per-instance errors; returns per-id results.
    """
    results: list[dict[str, Any]] = []
    ok = 0
    err = 0
    for row in rows:
        pub = row.get("public_id")
        try:
            out = run_tick(cur, row, mark_step_frac=mark_step_frac)
            ok += 1
            results.append(
                {
                    "instance_id": pub,
                    "ok": True,
                    "status": out["instance"]["status"],
                    "events": out.get("events") or [],
                    "cash_usd": out["instance"]["cash_usd"],
                }
            )
        except Exception as exc:  # noqa: BLE001 — isolate tenants/strategies
            err += 1
            results.append(
                {
                    "instance_id": pub,
                    "ok": False,
                    "error": str(exc)[:512],
                }
            )
            try:
                cur.execute(
                    """UPDATE strategy_lab_curate_instances
                       SET last_tick_status = 'error', last_error = %s
                       WHERE id = %s""",
                    (str(exc)[:512], int(row["id"])),
                )
            except Exception:  # noqa: BLE001
                pass
    return {
        "ticked": len(rows),
        "ok": ok,
        "errors": err,
        "results": results,
    }


def run_tick(
    cur,
    row: dict,
    *,
    mark_overrides: dict[str, Any] | None = None,
    mark_step_frac: float = 0.15,
    force_pnl_frac: float | None = None,
) -> dict[str, Any]:
    """Execute one Curate tick. Instance must be armed or running."""
    status = row["status"]
    if status not in ("armed", "running"):
        raise ValueError(f"cannot tick instance in status {status!r}")

    identity_id = int(row["identity_id"])
    instance_id = int(row["id"])
    strategy_public_id = row["strategy_public_id"]
    env = normalize_envelope(cd._json_load(row["envelope_json"]))
    adapter = SimulatedAdapter()
    events: list[dict[str, Any]] = []

    # Promote armed → running on first tick
    if status == "armed":
        # Ensure run clock is set (arm should have set it; backfill if missing)
        cur.execute(
            """UPDATE strategy_lab_curate_instances
               SET status = 'running',
                   run_started_at = COALESCE(run_started_at, UTC_TIMESTAMP())
               WHERE id = %s""",
            (instance_id,),
        )
        cd.append_decision(
            cur,
            identity_id=identity_id,
            instance_id=instance_id,
            strategy_public_id=strategy_public_id,
            runner_type="system",
            event_type="status_change",
            message="status → running (first tick)",
            payload={"status": "running"},
        )
        row = {**row, "status": "running"}

    cash = float(row["cash_usd"])
    realized = float(row["realized_pnl_usd"])

    # --- MANAGE ---
    cur.execute(
        """SELECT * FROM strategy_lab_curate_positions
           WHERE instance_id = %s AND status = 'open' ORDER BY id ASC""",
        (instance_id,),
    )
    open_rows = list(cur.fetchall())
    tp_frac = float(env["take_profit_frac_of_max_profit"])
    stop_mult = float(env["stop_multiple_of_premium_risked"])

    for pos in open_rows:
        entry = float(pos["entry_price"])
        max_profit = float(pos["max_profit_usd"])
        max_loss = float(pos["max_loss_usd"])
        if force_pnl_frac is not None:
            from strategy_runtime.marks import package_mark_from_pnl_frac

            mark_price, unrealized = package_mark_from_pnl_frac(
                entry_price=entry,
                max_profit_usd=max_profit,
                max_loss_usd=max_loss,
                pnl_frac=float(force_pnl_frac),
            )
        else:
            mark_price, unrealized = advance_package_mark(
                entry_price=entry,
                max_profit_usd=max_profit,
                max_loss_usd=max_loss,
                current_unrealized=float(pos["unrealized_pnl_usd"] or 0),
                step_frac=mark_step_frac,
            )
        cur.execute(
            """UPDATE strategy_lab_curate_positions
               SET mark_price = %s, unrealized_pnl_usd = %s WHERE id = %s""",
            (mark_price, unrealized, int(pos["id"])),
        )

        close_reason = None
        # take profit: unrealized >= tp_frac * max_profit
        if max_profit > 0 and unrealized >= tp_frac * max_profit - 1e-9:
            close_reason = "take_profit"
        # stop: loss magnitude >= stop_mult * premium risked (entry for debit)
        premium_risked = abs(entry) if entry else max_loss
        if unrealized <= -stop_mult * premium_risked + 1e-9:
            # also cap at max_loss
            close_reason = close_reason or "stop"
        if unrealized <= -max_loss + 1e-9:
            close_reason = "max_loss"

        if not close_reason:
            cd.append_decision(
                cur,
                identity_id=identity_id,
                instance_id=instance_id,
                strategy_public_id=strategy_public_id,
                runner_type="manage",
                event_type="mark_update",
                message=f"{pos['symbol']} mark update",
                payload={
                    "position_id": pos["public_id"],
                    "mark_price": mark_price,
                    "unrealized_pnl_usd": unrealized,
                    "fill_model": FILL_MODEL,
                },
            )
            continue

        # Close via sim adapter + fill
        ctag = _tag("close")
        intent = OrderIntent(
            client_order_tag=ctag,
            symbol=pos["symbol"],
            qty=int(pos["qty"]),
            intent="close",
            side=pos["side"],
            max_loss_usd=max_loss,
            max_profit_usd=max_profit,
            entry_price=entry,
            structure=cd._json_load(pos["structure_json"]) or {},
        )
        ack = adapter.submit_order(intent)
        if not ack.accepted:
            cd.append_decision(
                cur,
                identity_id=identity_id,
                instance_id=instance_id,
                strategy_public_id=strategy_public_id,
                runner_type="manage",
                event_type="close_rejected",
                reason_code="sim_reject",
                message=ack.reject_reason or "reject",
                payload={"position_id": pos["public_id"]},
            )
            continue
        fill = fill_close(entry_price=entry, mark_price=mark_price, qty=int(pos["qty"]))
        pnl = float(unrealized)
        cash += max_loss + pnl  # release reserved max_loss, apply pnl
        # At open we reserved max_loss from cash; on close return max_loss + pnl
        realized += pnl
        cur.execute(
            """UPDATE strategy_lab_curate_positions
               SET status = 'closed', closed_at = UTC_TIMESTAMP(),
                   close_reason = %s, realized_pnl_usd = %s,
                   mark_price = %s, unrealized_pnl_usd = 0
               WHERE id = %s""",
            (close_reason, pnl, mark_price, int(pos["id"])),
        )
        cur.execute(
            """INSERT INTO strategy_lab_curate_orders
               (public_id, instance_id, identity_id, position_id, client_order_tag,
                intent, status, symbol, qty, fill_price, payload_json)
               VALUES (%s, %s, %s, %s, %s, 'close', 'filled', %s, %s, %s, %s)""",
            (
                secrets.token_hex(4),
                instance_id,
                identity_id,
                int(pos["id"]),
                ctag,
                pos["symbol"],
                int(pos["qty"]),
                fill["fill_price"],
                cd._json_dump(
                    {
                        "ack": ack.broker_order_id,
                        "fill": fill,
                        "close_reason": close_reason,
                    }
                ),
            ),
        )
        cd.append_decision(
            cur,
            identity_id=identity_id,
            instance_id=instance_id,
            strategy_public_id=strategy_public_id,
            runner_type="manage",
            event_type="position_closed",
            reason_code=close_reason,
            message=f"closed {pos['symbol']} ({close_reason})",
            payload={
                "position_id": pos["public_id"],
                "realized_pnl_usd": pnl,
                "fill_model": FILL_MODEL,
            },
        )
        events.append({"type": "close", "reason": close_reason, "pnl": pnl})

    # --- SCAN ---
    cur.execute(
        """SELECT COUNT(*) AS n FROM strategy_lab_curate_positions
           WHERE instance_id = %s AND status = 'open'""",
        (instance_id,),
    )
    open_count = int(cur.fetchone()["n"])
    symbol = str(env["scan_symbol"]).upper()
    risk = float(env["scan_risk_per_open_usd"])
    opens_today = cd.opens_today_count(cur, instance_id)
    open_for_symbol = cd.open_symbol_count(cur, instance_id, symbol)

    ok, reason = check_open_allowed(
        env,
        open_count=open_count,
        opens_today=opens_today,
        open_for_symbol=open_for_symbol,
        risk_usd=risk,
        cash_usd=cash,
    )
    if not ok:
        cd.append_decision(
            cur,
            identity_id=identity_id,
            instance_id=instance_id,
            strategy_public_id=strategy_public_id,
            runner_type="scan",
            event_type="open_blocked",
            reason_code=reason,
            message=f"scan open blocked: {reason}",
            payload={"symbol": symbol, "risk_usd": risk, "cash_usd": cash},
        )
    else:
        try:
            mq = get_mark(symbol, mark_overrides, cur=cur)
        except MarksError as exc:
            cur.execute(
                """UPDATE strategy_lab_curate_instances
                   SET last_tick_at = UTC_TIMESTAMP(), last_tick_status = 'error',
                       last_error = %s WHERE id = %s""",
                (str(exc)[:512], instance_id),
            )
            cd.append_decision(
                cur,
                identity_id=identity_id,
                instance_id=instance_id,
                strategy_public_id=strategy_public_id,
                runner_type="scan",
                event_type="mark_error",
                reason_code="marks_missing",
                message=str(exc)[:512],
            )
            raise

        # Synthetic defined-risk debit package for Curate v1
        max_loss = risk
        max_profit = risk * 0.45  # typical butterfly-ish ratio for sim
        entry_price = risk * 0.35  # premium package price units
        structure = {
            "family": "curate_sim_defined_risk",
            "symbol": symbol,
            "underlying_mid": mq.mid,
            "mark_source": mq.source,
            "mark_label": mq.label,
            "mark_shared_stream": mq.shared_stream,
            "mark_stale": mq.stale,
            "note": "Curate v1 synthetic structure — pack-native open later",
        }
        ctag = _tag("open")
        intent = OrderIntent(
            client_order_tag=ctag,
            symbol=symbol,
            qty=1,
            intent="open",
            side="long",
            max_loss_usd=max_loss,
            max_profit_usd=max_profit,
            entry_price=entry_price,
            structure=structure,
        )
        ack = adapter.submit_order(intent)
        if not ack.accepted:
            cd.append_decision(
                cur,
                identity_id=identity_id,
                instance_id=instance_id,
                strategy_public_id=strategy_public_id,
                runner_type="scan",
                event_type="open_rejected",
                reason_code="sim_reject",
                message=ack.reject_reason or "reject",
            )
        else:
            fill = fill_open(intent)
            # Reserve max_loss from cash (defined-risk capital)
            cash -= max_loss
            pos_pub = secrets.token_hex(4)
            cur.execute(
                """INSERT INTO strategy_lab_curate_positions
                   (public_id, instance_id, identity_id, symbol, structure_json,
                    qty, side, entry_price, max_loss_usd, max_profit_usd,
                    mark_price, unrealized_pnl_usd, status, client_order_tag)
                   VALUES (%s, %s, %s, %s, %s, 1, 'long', %s, %s, %s, %s, 0, 'open', %s)""",
                (
                    pos_pub,
                    instance_id,
                    identity_id,
                    symbol,
                    cd._json_dump(structure),
                    entry_price,
                    max_loss,
                    max_profit,
                    entry_price,
                    ctag,
                ),
            )
            pos_id = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO strategy_lab_curate_orders
                   (public_id, instance_id, identity_id, position_id, client_order_tag,
                    intent, status, symbol, qty, fill_price, payload_json)
                   VALUES (%s, %s, %s, %s, %s, 'open', 'filled', %s, 1, %s, %s)""",
                (
                    secrets.token_hex(4),
                    instance_id,
                    identity_id,
                    pos_id,
                    ctag,
                    symbol,
                    fill["fill_price"],
                    cd._json_dump(
                        {
                            "ack": ack.broker_order_id,
                            "fill": fill,
                            "mark": {
                                "mid": mq.mid,
                                "source": mq.source,
                                "label": mq.label,
                                "asof": mq.asof,
                            },
                        }
                    ),
                ),
            )
            cd.append_decision(
                cur,
                identity_id=identity_id,
                instance_id=instance_id,
                strategy_public_id=strategy_public_id,
                runner_type="scan",
                event_type="position_opened",
                message=f"opened sim {symbol} risk ${max_loss:.2f}",
                payload={
                    "position_id": pos_pub,
                    "max_loss_usd": max_loss,
                    "fill_model": FILL_MODEL,
                    "mark_source": mq.source,
                },
            )
            events.append({"type": "open", "symbol": symbol, "risk": max_loss})

    cur.execute(
        """SELECT
             COALESCE(SUM(CASE WHEN status = 'open' THEN max_loss_usd ELSE 0 END), 0) AS open_risk,
             COALESCE(SUM(CASE WHEN status = 'open' THEN unrealized_pnl_usd ELSE 0 END), 0) AS open_upnl
           FROM strategy_lab_curate_positions WHERE instance_id = %s""",
        (instance_id,),
    )
    book = cur.fetchone() or {}
    open_risk = float(book.get("open_risk") or 0)
    open_upnl = float(book.get("open_upnl") or 0)
    equity_approx = cash + open_risk + open_upnl

    cur.execute(
        """UPDATE strategy_lab_curate_instances
           SET cash_usd = %s, realized_pnl_usd = %s,
               last_tick_at = UTC_TIMESTAMP(), last_tick_status = 'ok',
               last_error = NULL
           WHERE id = %s""",
        (cash, realized, instance_id),
    )
    cd.append_decision(
        cur,
        identity_id=identity_id,
        instance_id=instance_id,
        strategy_public_id=strategy_public_id,
        runner_type="system",
        event_type="tick_complete",
        message="Curate tick complete",
        payload={
            "events": events,
            "cash_usd": cash,
            "realized_pnl_usd": realized,
            "open_risk_usd": open_risk,
            "open_unrealized_pnl_usd": open_upnl,
            "equity_approx_usd": equity_approx,
        },
    )

    cur.execute(
        "SELECT * FROM strategy_lab_curate_instances WHERE id = %s",
        (instance_id,),
    )
    inst = cd.instance_to_dict(cur.fetchone())
    positions = cd.list_positions(cur, identity_id, instance_id, open_only=False)
    return {
        "instance": inst,
        "events": events,
        "positions": positions,
        "fill_model": FILL_MODEL,
    }
