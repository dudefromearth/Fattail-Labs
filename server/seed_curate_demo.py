#!/usr/bin/env python3
"""Seed ≥3 Curate bots + armed runtimes so the Curate dashboard is full.

Creates bots already in phase=curation with sim instances on distinct underliers,
arms them, and ticks several times (manage→scan) so equity paths and comparison
populate. (Bot = product unit; strategy = pack attribute; position = bot instance.)

Usage (from server/, .env loaded):

  set -a && source ../.env && set +a
  .venv/bin/python seed_curate_demo.py
  .venv/bin/python seed_curate_demo.py --email ernie@fattail.ai --replace
  .venv/bin/python seed_curate_demo.py --count 3 --ticks 5

--replace removes prior rows tagged attributes.demo_seed=true for that identity.
"""

from __future__ import annotations

import argparse
import json
import sys

import db
import identity as identity_mod
import strategy_lab_domain as sld
from strategy_runtime import curate_domain as cd
from strategy_runtime.tick import run_tick, tick_many

# Distinct underliers for visual compare on dashboard
DEFAULT_BOOK = (
    {
        "name": "SPY Defined-Risk Scan",
        "description": "Demo Curate book A — SPY weekly-style defined risk",
        "symbol": "SPY",
        "allocation": 25_000,
        "risk": 500,
    },
    {
        "name": "QQQ Structure Book",
        "description": "Demo Curate book B — QQQ for multi-strategy compare",
        "symbol": "QQQ",
        "allocation": 20_000,
        "risk": 400,
    },
    {
        "name": "IWM Satellite Sleeve",
        "description": "Demo Curate book C — IWM smaller sleeve",
        "symbol": "IWM",
        "allocation": 15_000,
        "risk": 300,
    },
)


def _parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Seed multi-bot Curate demo book")
    ap.add_argument("--email", default="ernie@fattail.ai")
    ap.add_argument("--identity-id", type=int, default=None)
    ap.add_argument("--count", type=int, default=3, help="How many bots (max 3 in default book)")
    ap.add_argument("--ticks", type=int, default=4, help="Ticks after arm (builds equity series)")
    ap.add_argument(
        "--replace",
        action="store_true",
        help="Remove prior demo_seed Curate strategies/instances for this identity",
    )
    return ap.parse_args()


def _purge_demo(cur, identity_id: int) -> int:
    """Delete strategies (and cascaded instances) marked demo_seed."""
    cur.execute(
        """SELECT id, public_id, attributes_json FROM strategy_lab_strategies
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


def main() -> int:
    args = _parse_args()
    book = list(DEFAULT_BOOK)[: max(1, min(3, args.count))]

    with db.transaction() as conn:
        with conn.cursor() as cur:
            if args.identity_id:
                iid = int(args.identity_id)
            else:
                iid = identity_mod.get_or_create_identity(
                    cur, args.email, args.email.split("@")[0]
                )
            print(f"identity_id={iid} email={args.email}")

            if args.replace:
                purged = _purge_demo(cur, iid)
                print(f"purged demo strategies: {purged}")

            created: list[dict] = []
            for spec in book:
                # Create directly in curation with validation-like attributes
                attrs = {
                    "demo_seed": True,
                    "demo_symbol": spec["symbol"],
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
                # create_strategy returns public dict with id = public_id
                srow = sld.get_by_public_id(cur, iid, strategy["id"])
                assert srow is not None

                inst = cd.create_instance(
                    cur,
                    identity_id=iid,
                    strategy_row=srow,
                    envelope={
                        "allocation_usd": float(spec["allocation"]),
                        "scan_symbol": spec["symbol"],
                        "scan_risk_per_open_usd": float(spec["risk"]),
                        "max_positions_concurrent": 3,
                        "max_positions_per_day": 8,
                        "max_positions_per_symbol": 1,
                        "take_profit_frac_of_max_profit": 0.45,
                        "stop_multiple_of_premium_risked": 2.0,
                    },
                )
                # Arm
                full = cd.get_instance(cur, iid, inst["id"])
                assert full is not None
                cd.set_status(cur, full, status="armed", message="demo seed arm")

                created.append(
                    {
                        "strategy": strategy["id"],
                        "name": spec["name"],
                        "symbol": spec["symbol"],
                        "instance": inst["id"],
                    }
                )
                print(
                    f"  + {spec['name']} [{spec['symbol']}] "
                    f"strategy={strategy['id']} instance={inst['id']}"
                )

            # Tick all armed/running for this identity
            rows = cd.list_tickable_instances(cur, iid)
            # Prefer just our new instances if possible
            demo_ids = {c["instance"] for c in created}
            demo_rows = [r for r in rows if r["public_id"] in demo_ids]
            if not demo_rows:
                demo_rows = rows

            ticks = max(1, int(args.ticks))
            for t in range(ticks):
                # Vary mark walk: first ticks open, later force some progress
                if t == 0:
                    out = tick_many(cur, demo_rows, mark_step_frac=0.15)
                elif t == ticks - 1:
                    # last tick: force profit path on open packages
                    for row in demo_rows:
                        fresh = cd.get_instance(cur, iid, row["public_id"])
                        if fresh and fresh["status"] in ("armed", "running"):
                            try:
                                run_tick(
                                    cur,
                                    fresh,
                                    mark_step_frac=0.2,
                                    force_pnl_frac=0.55 if t % 2 == 0 else 0.25,
                                )
                            except Exception as exc:  # noqa: BLE001
                                print(f"  tick warn {row['public_id']}: {exc}")
                    out = {"ok": len(demo_rows), "errors": 0, "ticked": len(demo_rows)}
                else:
                    out = tick_many(cur, demo_rows, mark_step_frac=0.18)
                print(
                    f"  tick {t + 1}/{ticks}: ok={out.get('ok')} "
                    f"errors={out.get('errors')} n={out.get('ticked', len(demo_rows))}"
                )
                # refresh rows (status may be running)
                demo_rows = []
                for c in created:
                    r = cd.get_instance(cur, iid, c["instance"])
                    if r and r["status"] in ("armed", "running"):
                        demo_rows.append(r)

            print("done — open Strategy Lab → Curate to see ≥3 bots on the dashboard")
            print(json.dumps({"identity_id": iid, "created": created}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
