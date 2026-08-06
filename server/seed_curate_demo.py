#!/usr/bin/env python3
"""Seed Sim market (Curate) exercise book — case coverage, not cosmetics.

Goal: put every meaningful runtime/UI branch on the board so Coach can click,
tick, compare, pause/arm, and read reports against real data shapes.

Covered intentionally (extend when a new branch appears):

  Outcomes
    winner ×2, loser (max_loss), stop-only close, mixed TP+stop, flat/breakeven,
    underwater open, closed-only (flat book, no open), multi-open concurrent

  Lifecycle status
    draft, armed, running, paused, halted

  Envelope blocks (decision log + no new open)
    max_positions_concurrent, max_positions_per_day, insufficient_cash

  Errors
    last_tick_status=error (marks/synthetic)

Bot = product unit; strategy = pack attribute; position = bot instance.

Usage (from server/, .env loaded):

  set -a && source ../.env && set +a
  .venv/bin/python seed_curate_demo.py --replace
  .venv/bin/python seed_curate_demo.py --replace --diversify-all
  .venv/bin/python seed_curate_demo.py --count 14 --replace
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

import db
import identity as identity_mod
import strategy_lab_domain as sld
from strategy_runtime import curate_domain as cd
from strategy_runtime.tick import run_tick

# Full exercise catalog. Order is stable; --count trims from the front.
# Symbols must resolve via marks stub or shared stream (see marks.py).
DEFAULT_BOOK: tuple[dict[str, Any], ...] = (
    # --- outcomes (running) ---
    {
        "name": "CASE winner-a (TP+green)",
        "description": "Exercise: take-profit close + green open",
        "symbol": "SPY",
        "allocation": 25_000,
        "risk": 500,
        "path": "winner",
    },
    {
        "name": "CASE winner-b (TP+green)",
        "description": "Exercise: second winner for multi-green compare",
        "symbol": "QQQ",
        "allocation": 22_000,
        "risk": 450,
        "path": "winner",
    },
    {
        "name": "CASE loser max_loss",
        "description": "Exercise: max_loss close + red open",
        "symbol": "IWM",
        "allocation": 20_000,
        "risk": 400,
        "path": "loser",
    },
    {
        "name": "CASE stop-only close",
        "description": "Exercise: stop reason (not max_loss) + red open",
        "symbol": "XLF",
        "allocation": 18_000,
        "risk": 350,
        "path": "stop_only",
    },
    {
        "name": "CASE mixed TP+stop",
        "description": "Exercise: one TP then one max_loss; chop open",
        "symbol": "TLT",
        "allocation": 16_000,
        "risk": 300,
        "path": "mixed",
    },
    {
        "name": "CASE underwater open",
        "description": "Exercise: single open red, no exit yet",
        "symbol": "GLD",
        "allocation": 15_000,
        "risk": 300,
        "path": "underwater",
    },
    {
        "name": "CASE flat closed book",
        "description": "Exercise: activity then flat; no open positions",
        "symbol": "SLV",
        "allocation": 14_000,
        "risk": 280,
        "path": "closed_flat",
    },
    {
        "name": "CASE multi-open concurrent",
        "description": "Exercise: 3 concurrent opens on same symbol sleeve",
        "symbol": "NVDA",
        "allocation": 30_000,
        "risk": 400,
        "path": "multi_open",
        "envelope": {
            "max_positions_concurrent": 3,
            "max_positions_per_symbol": 3,
            "max_positions_per_day": 12,
        },
    },
    # --- lifecycle ---
    {
        "name": "CASE draft never armed",
        "description": "Exercise: draft instance controls (Arm)",
        "symbol": "AAPL",
        "allocation": 10_000,
        "risk": 200,
        "path": "draft_only",
    },
    {
        "name": "CASE armed never ticked",
        "description": "Exercise: armed pre-start (Advance / Pause)",
        "symbol": "MSFT",
        "allocation": 10_000,
        "risk": 200,
        "path": "armed_only",
    },
    {
        "name": "CASE paused after loss",
        "description": "Exercise: paused status after stops; re-Arm path",
        "symbol": "AMZN",
        "allocation": 12_000,
        "risk": 250,
        "path": "paused_loss",
    },
    {
        "name": "CASE halted after activity",
        "description": "Exercise: halted status after TP; re-Arm path",
        "symbol": "META",
        "allocation": 12_000,
        "risk": 250,
        "path": "halted_after_tp",
    },
    # --- envelope blocks (running, last tick blocked) ---
    {
        "name": "CASE block concurrent",
        "description": "Exercise: envelope_max_positions_concurrent in decision log",
        "symbol": "TSLA",
        "allocation": 15_000,
        "risk": 300,
        "path": "block_concurrent",
        "envelope": {
            "max_positions_concurrent": 1,
            "max_positions_per_symbol": 1,
            "max_positions_per_day": 20,
        },
    },
    {
        "name": "CASE block daily cap",
        "description": "Exercise: envelope_max_positions_per_day in decision log",
        "symbol": "GOOGL",
        "allocation": 15_000,
        "risk": 300,
        "path": "block_daily",
        "envelope": {
            "max_positions_concurrent": 3,
            "max_positions_per_symbol": 3,
            "max_positions_per_day": 1,
        },
    },
    {
        "name": "CASE block cash",
        "description": "Exercise: envelope_insufficient_cash in decision log",
        "symbol": "USO",
        "allocation": 1_000,
        "risk": 600,
        "path": "block_cash",
        "envelope": {
            "max_positions_concurrent": 3,
            "max_positions_per_day": 20,
            "max_positions_per_symbol": 3,
        },
    },
    # --- errors ---
    {
        "name": "CASE tick error marks",
        "description": "Exercise: last_tick_status=error surface",
        "symbol": "UNG",
        "allocation": 10_000,
        "risk": 200,
        "path": "tick_error",
    },
)


def _parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(
        description="Seed Sim market exercise book (case coverage)"
    )
    ap.add_argument(
        "--email",
        default="ernie@dudefromearth.com",
        help="Member email (default: primary Coach account)",
    )
    ap.add_argument("--identity-id", type=int, default=None)
    ap.add_argument(
        "--count",
        type=int,
        default=len(DEFAULT_BOOK),
        help=f"How many cases from catalog (default {len(DEFAULT_BOOK)} = full set)",
    )
    ap.add_argument(
        "--replace",
        action="store_true",
        help="Remove prior demo_seed strategies/instances for this identity",
    )
    ap.add_argument(
        "--diversify-all",
        action="store_true",
        help="Also reshape non-demo running instances (e.g. Batman) into a case",
    )
    ap.add_argument(
        "--non-demo-path",
        default="winner",
        help="Path for --diversify-all non-demo bots (default winner)",
    )
    return ap.parse_args()


def _purge_demo(cur, identity_id: int) -> int:
    cur.execute(
        """SELECT id, attributes_json FROM strategy_lab_strategies
           WHERE identity_id = %s""",
        (identity_id,),
    )
    n = 0
    for r in cur.fetchall():
        attrs = r.get("attributes_json")
        if isinstance(attrs, str):
            try:
                attrs = json.loads(attrs)
            except json.JSONDecodeError:
                attrs = {}
        if not isinstance(attrs, dict) or not attrs.get("demo_seed"):
            continue
        cur.execute(
            "DELETE FROM strategy_lab_strategies WHERE id = %s",
            (int(r["id"]),),
        )
        n += 1
    return n


def _tick(
    cur,
    row: dict,
    *,
    force_pnl_frac: float | None = None,
    mark_step_frac: float = 0.15,
) -> dict[str, Any]:
    return run_tick(
        cur,
        row,
        mark_step_frac=mark_step_frac,
        force_pnl_frac=force_pnl_frac,
    )


def _refresh(cur, identity_id: int, public_id: str) -> dict | None:
    return cd.get_instance(cur, identity_id, public_id)


def _open_count(cur, instance_db_id: int) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM strategy_lab_curate_positions
           WHERE instance_id = %s AND status = 'open'""",
        (instance_db_id,),
    )
    return int(cur.fetchone()["n"])


def _force_close_all_open(
    cur, identity_id: int, row: dict, *, frac: float
) -> list[str]:
    """Close every open via forced frac (may re-open on same tick if envelope allows)."""
    notes: list[str] = []
    pub = row["public_id"]
    # Up to concurrent+2 attempts to drain
    for _ in range(6):
        row = _refresh(cur, identity_id, pub)
        if not row or row["status"] not in ("armed", "running"):
            break
        if _open_count(cur, int(row["id"])) == 0:
            break
        out = _tick(cur, row, force_pnl_frac=frac)
        notes.append(f"force_close frac={frac} events={out.get('events')}")
    return notes


def _play_scenario(cur, identity_id: int, public_id: str, path: str) -> list[str]:
    notes: list[str] = []
    row = _refresh(cur, identity_id, public_id)
    if not row:
        return [f"missing instance {public_id}"]

    if path == "draft_only":
        notes.append("left draft (never armed)")
        return notes

    if path == "armed_only":
        notes.append("left armed (no ticks)")
        return notes

    # First tick: arm→running + open (except paths that never want an open)
    out = _tick(cur, row, mark_step_frac=0.1)
    notes.append(f"start events={out.get('events')}")
    row = _refresh(cur, identity_id, public_id)
    assert row is not None

    if path == "winner":
        out = _tick(cur, row, force_pnl_frac=0.55)
        notes.append(f"tp events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=0.28)
        notes.append(f"green open events={out.get('events')}")

    elif path == "loser":
        out = _tick(cur, row, force_pnl_frac=-1.0)
        notes.append(f"max_loss events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=-0.45)
        notes.append(f"red open events={out.get('events')}")

    elif path == "stop_only":
        # -0.72 of max_loss hits stop (2× premium≈0.7×risk) without max_loss (-1.0)
        out = _tick(cur, row, force_pnl_frac=-0.72)
        notes.append(f"stop events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=-0.35)
        notes.append(f"red open events={out.get('events')}")

    elif path == "mixed":
        out = _tick(cur, row, force_pnl_frac=0.55)
        notes.append(f"tp events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=-1.0)
        notes.append(f"max_loss events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=0.08)
        notes.append(f"chop open events={out.get('events')}")

    elif path == "underwater":
        out = _tick(cur, row, force_pnl_frac=-0.35)
        notes.append(f"underwater events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=-0.42)
        notes.append(f"deeper red events={out.get('events')}")

    elif path == "closed_flat":
        # TP then max_loss roughly cancel process-wise; drain opens
        out = _tick(cur, row, force_pnl_frac=0.55)
        notes.append(f"tp events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=-1.0)
        notes.append(f"max_loss events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        # Close leftover open without wanting a lasting book: force max_loss
        # then if re-open happened, force-close again and leave; if open remains
        # zero it via SQL for a true closed-only book (exercise empty open list).
        notes.extend(_force_close_all_open(cur, identity_id, row, frac=-1.0))
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        # If scan re-opened, strip opens and restore cash for closed-only view
        if _open_count(cur, int(row["id"])) > 0:
            cur.execute(
                """UPDATE strategy_lab_curate_positions
                   SET status='closed', closed_at=UTC_TIMESTAMP(),
                       close_reason='demo_flat_drain', realized_pnl_usd=0,
                       unrealized_pnl_usd=0
                   WHERE instance_id=%s AND status='open'""",
                (int(row["id"]),),
            )
            cur.execute(
                """UPDATE strategy_lab_curate_instances
                   SET cash_usd = allocation_usd + realized_pnl_usd
                   WHERE id=%s""",
                (int(row["id"]),),
            )
            notes.append("drained opens for closed-only book")

    elif path == "multi_open":
        # Envelope allows 3 same-symbol opens; keep forcing green marks + opens
        for i in range(4):
            row = _refresh(cur, identity_id, public_id)
            if not row:
                break
            out = _tick(cur, row, force_pnl_frac=0.15)
            notes.append(f"multi tick{i} events={out.get('events')}")
        notes.append(f"open_count={_open_count(cur, int(row['id']))}")

    elif path == "paused_loss":
        out = _tick(cur, row, force_pnl_frac=-1.0)
        notes.append(f"loss events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=-1.0)
        notes.append(f"second loss events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        cd.set_status(cur, row, status="paused", message="exercise: paused after losses")
        notes.append("status → paused")

    elif path == "halted_after_tp":
        out = _tick(cur, row, force_pnl_frac=0.55)
        notes.append(f"tp events={out.get('events')}")
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        cd.set_status(cur, row, status="halted", message="exercise: halted after TP")
        notes.append("status → halted")

    elif path == "block_concurrent":
        # max concurrent=1: already open; next tick should open_blocked
        out = _tick(cur, row, force_pnl_frac=0.1)
        notes.append(f"block concurrent tick events={out.get('events')}")
        # Verify decision log has open_blocked
        cur.execute(
            """SELECT COUNT(*) AS n FROM strategy_lab_decision_log
               WHERE instance_id=%s AND event_type='open_blocked'
                 AND reason_code='envelope_max_positions_concurrent'""",
            (int(row["id"]),),
        )
        notes.append(f"open_blocked concurrent n={cur.fetchone()['n']}")

    elif path == "block_daily":
        # max per day=1: close open then tick tries second open → blocked
        out = _tick(cur, row, force_pnl_frac=-1.0)
        notes.append(f"close then block events={out.get('events')}")
        # If close+open on same tick used the daily slot, another tick blocks
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        out = _tick(cur, row, force_pnl_frac=0.1)
        notes.append(f"daily block tick events={out.get('events')}")
        cur.execute(
            """SELECT COUNT(*) AS n FROM strategy_lab_decision_log
               WHERE instance_id=%s AND event_type='open_blocked'
                 AND reason_code='envelope_max_positions_per_day'""",
            (int(row["id"]),),
        )
        notes.append(f"open_blocked daily n={cur.fetchone()['n']}")

    elif path == "block_cash":
        # allocation 1000, risk 600: first open ok (cash 400), second blocked
        out = _tick(cur, row, force_pnl_frac=0.05)
        notes.append(f"cash block tick events={out.get('events')}")
        cur.execute(
            """SELECT COUNT(*) AS n FROM strategy_lab_decision_log
               WHERE instance_id=%s AND event_type='open_blocked'
                 AND reason_code='envelope_insufficient_cash'""",
            (int(row["id"]),),
        )
        notes.append(f"open_blocked cash n={cur.fetchone()['n']}")

    elif path == "tick_error":
        # Poison scan symbol so next manage/scan path fails marks on open attempt,
        # or set last_tick_status directly if already open.
        cur.execute(
            """UPDATE strategy_lab_curate_instances
               SET envelope_json = JSON_SET(
                     COALESCE(envelope_json, JSON_OBJECT()),
                     '$.scan_symbol', 'NOTASYMBOL'
                   )
               WHERE id=%s""",
            (int(row["id"]),),
        )
        row = _refresh(cur, identity_id, public_id)
        assert row is not None
        try:
            _tick(cur, row, force_pnl_frac=0.1)
            notes.append("tick_error: expected MarksError, got success")
        except Exception as exc:  # noqa: BLE001
            notes.append(f"tick_error raised: {type(exc).__name__}: {exc}")
            # Ensure instance row shows error (run_tick sets it before raise on mark miss)
            cur.execute(
                """UPDATE strategy_lab_curate_instances
                   SET last_tick_status='error',
                       last_error=%s,
                       last_tick_at=UTC_TIMESTAMP()
                   WHERE id=%s""",
                (str(exc)[:512], int(row["id"])),
            )
            # Restore symbol so later manual ticks can work after Coach fixes
            cur.execute(
                """UPDATE strategy_lab_curate_instances
                   SET envelope_json = JSON_SET(
                         COALESCE(envelope_json, JSON_OBJECT()),
                         '$.scan_symbol', 'UNG'
                       )
                   WHERE id=%s""",
                (int(row["id"]),),
            )
            notes.append("restored scan_symbol=UNG; left last_tick_status=error")

    else:
        out = _tick(cur, row, mark_step_frac=0.12)
        notes.append(f"default walk events={out.get('events')}")

    return notes


def _diversify_non_demo(
    cur, identity_id: int, path: str = "winner"
) -> list[dict[str, Any]]:
    cur.execute(
        """
        SELECT i.public_id, i.status, s.name, s.attributes_json
        FROM strategy_lab_curate_instances i
        JOIN strategy_lab_strategies s ON s.id = i.strategy_id
        WHERE i.identity_id = %s
          AND i.status IN ('armed', 'running', 'paused', 'halted', 'draft')
        ORDER BY i.id ASC
        """,
        (identity_id,),
    )
    out: list[dict[str, Any]] = []
    for r in cur.fetchall():
        attrs = r.get("attributes_json")
        if isinstance(attrs, str):
            try:
                attrs = json.loads(attrs)
            except json.JSONDecodeError:
                attrs = {}
        if isinstance(attrs, dict) and attrs.get("demo_seed"):
            continue
        pub = r["public_id"]
        inst = cd.get_instance(cur, identity_id, pub)
        if not inst:
            continue
        # Re-arm if needed so path can tick
        if inst["status"] in ("paused", "halted", "draft"):
            cd.set_status(cur, inst, status="armed", message="diversify re-arm")
            inst = cd.get_instance(cur, identity_id, pub)
        notes = _reshape_existing(cur, identity_id, inst, path)
        out.append({"name": r["name"], "instance": pub, "path": path, "notes": notes})
        print(f"  diversify {r['name']!r} → {path}: {notes}")
    return out


def _reshape_existing(
    cur, identity_id: int, row: dict, path: str
) -> list[str]:
    """Apply a simple outcome path onto an already-existing instance."""
    notes: list[str] = []
    pub = row["public_id"]

    if row["status"] not in ("armed", "running"):
        cd.set_status(cur, row, status="armed", message="reshape re-arm")
        row = _refresh(cur, identity_id, pub)
        if not row:
            return ["missing after re-arm"]

    open_n = _open_count(cur, int(row["id"]))

    if path == "winner":
        if open_n > 0:
            out = _tick(cur, row, force_pnl_frac=0.55)
            notes.append(f"tp existing events={out.get('events')}")
            row = _refresh(cur, identity_id, pub)
            if not row or row["status"] not in ("armed", "running"):
                return notes
        else:
            out = _tick(cur, row, mark_step_frac=0.1)
            notes.append(f"open events={out.get('events')}")
            row = _refresh(cur, identity_id, pub)
            if not row:
                return notes
            out = _tick(cur, row, force_pnl_frac=0.55)
            notes.append(f"tp events={out.get('events')}")
            row = _refresh(cur, identity_id, pub)
            if not row:
                return notes
        out = _tick(cur, row, force_pnl_frac=0.28)
        notes.append(f"green open events={out.get('events')}")
        return notes

    if path == "underwater":
        if open_n == 0:
            out = _tick(cur, row, mark_step_frac=0.1)
            notes.append(f"open events={out.get('events')}")
            row = _refresh(cur, identity_id, pub)
            if not row:
                return notes
        out = _tick(cur, row, force_pnl_frac=-0.42)
        notes.append(f"underwater events={out.get('events')}")
        return notes

    if path == "loser":
        if open_n > 0:
            out = _tick(cur, row, force_pnl_frac=-1.0)
            notes.append(f"max_loss existing events={out.get('events')}")
            row = _refresh(cur, identity_id, pub)
            if not row or row["status"] not in ("armed", "running"):
                return notes
        else:
            out = _tick(cur, row, mark_step_frac=0.1)
            notes.append(f"open events={out.get('events')}")
            row = _refresh(cur, identity_id, pub)
            if not row:
                return notes
            out = _tick(cur, row, force_pnl_frac=-1.0)
            notes.append(f"max_loss events={out.get('events')}")
            row = _refresh(cur, identity_id, pub)
            if not row:
                return notes
        out = _tick(cur, row, force_pnl_frac=-0.45)
        notes.append(f"red open events={out.get('events')}")
        return notes

    # Fallback: run named scenario from current state
    more = _play_scenario(cur, identity_id, pub, path)
    notes.extend(more)
    return notes


def main() -> int:
    args = _parse_args()
    n = max(1, min(len(DEFAULT_BOOK), int(args.count)))
    book = list(DEFAULT_BOOK)[:n]

    with db.transaction() as conn:
        with conn.cursor() as cur:
            if args.identity_id:
                iid = int(args.identity_id)
            else:
                iid = identity_mod.get_or_create_identity(
                    cur, args.email, args.email.split("@")[0]
                )
            print(f"identity_id={iid} email={args.email}")
            print(f"seeding {n}/{len(DEFAULT_BOOK)} exercise cases")

            if args.replace:
                purged = _purge_demo(cur, iid)
                print(f"purged demo strategies: {purged}")

            created: list[dict] = []
            for spec in book:
                attrs = {
                    "demo_seed": True,
                    "demo_symbol": spec["symbol"],
                    "demo_path": spec["path"],
                    "exercise_case": True,
                    "development_validation": {
                        "back_test": {"status": "ok", "source": "demo_seed"},
                        "forward_walk": {"status": "ok", "source": "demo_seed"},
                    },
                }
                strategy = sld.create_strategy(
                    cur,
                    iid,
                    name=spec["name"],
                    description=spec["description"],
                    phase="curation",
                    phase_state="monitored",
                    blank=True,
                    attributes=attrs,
                )
                srow = sld.get_by_public_id(cur, iid, strategy["id"])
                assert srow is not None

                env: dict[str, Any] = {
                    "allocation_usd": float(spec["allocation"]),
                    "scan_symbol": spec["symbol"],
                    "scan_risk_per_open_usd": float(spec["risk"]),
                    "max_positions_concurrent": 3,
                    "max_positions_per_day": 12,
                    "max_positions_per_symbol": 1,
                    "take_profit_frac_of_max_profit": 0.45,
                    "stop_multiple_of_premium_risked": 2.0,
                }
                if isinstance(spec.get("envelope"), dict):
                    env.update(spec["envelope"])

                inst = cd.create_instance(
                    cur,
                    identity_id=iid,
                    strategy_row=srow,
                    envelope=env,
                )
                full = cd.get_instance(cur, iid, inst["id"])
                assert full is not None

                if spec["path"] != "draft_only":
                    cd.set_status(cur, full, status="armed", message="exercise seed arm")

                created.append(
                    {
                        "strategy": strategy["id"],
                        "name": spec["name"],
                        "symbol": spec["symbol"],
                        "path": spec["path"],
                        "instance": inst["id"],
                    }
                )
                print(
                    f"  + {spec['name']} [{spec['symbol']}] path={spec['path']} "
                    f"instance={inst['id']}"
                )

            for c in created:
                notes = _play_scenario(cur, iid, c["instance"], c["path"])
                print(f"  path {c['name']!r}: {notes}")

            diversified: list[dict] = []
            if args.diversify_all:
                print(f"diversify non-demo → {args.non_demo_path!r}…")
                diversified = _diversify_non_demo(
                    cur, iid, path=str(args.non_demo_path)
                )

            report = cd.comparison_report(cur, iid)
            print("\n=== Sim market exercise snapshot ===")
            winners = 0
            for b in report.get("bots") or []:
                vs = float(b.get("vs_allocation_usd") or 0)
                if vs > 0:
                    winners += 1
                flag = "WIN" if vs > 0 else ("FLAT" if abs(vs) < 1 else "LOSS")
                print(
                    f"  {flag:4} {b['instance_status']:8} "
                    f"eq={b['equity_approx_usd']:>10.2f} vs={vs:>+8.2f} "
                    f"open={b['open_positions']} closed={b['closed_positions']} "
                    f"tp={b['take_profit_exits']} stop={b['stop_or_max_loss_exits']} "
                    f"tick={b.get('last_tick_status') or '—'} "
                    f"{b['bot_name'][:44]} [{b.get('scan_symbol')}]"
                )
            print(f"\ninstances={report['summary']['instances']} winners={winners}")
            print(
                "done — Strategy Lab → Sim market. "
                "Use bot cards + Advance/tick-all/positions/correlation to poke edges."
            )
            print(
                json.dumps(
                    {
                        "identity_id": iid,
                        "created": created,
                        "diversified": diversified,
                    },
                    indent=2,
                )
            )
    return 0


if __name__ == "__main__":
    sys.exit(main())
