#!/usr/bin/env python3
"""Seed ~1 year of realistic options trade-log data on the default account.

Starts from a $50k mental book (tracked via cumulative pnl_amount on closes).
Mostly SPX/ES-style butterflies with a mix of verticals and notes — for UI/API
feature testing (table grouping, sheet, accounts).

Usage (from server/, .env loaded):
  .venv/bin/python seed_trade_log_demo.py
  .venv/bin/python seed_trade_log_demo.py --email ernie@fattail.ai --replace
  .venv/bin/python seed_trade_log_demo.py --days 365 --identity-id 1

Idempotent with --replace: deletes rows tagged external_adapter=demo_seed first.
"""

from __future__ import annotations

import argparse
import random
from datetime import date, datetime, timedelta
from decimal import Decimal

import db
import identity as identity_mod

ADAPTER = "demo_seed"
STARTING_EQUITY = Decimal("50000")


def _parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Seed demo trade log (~1y butterflies)")
    ap.add_argument("--email", default="ernie@fattail.ai")
    ap.add_argument("--identity-id", type=int, default=None)
    ap.add_argument("--days", type=int, default=365, help="Lookback days of history")
    ap.add_argument(
        "--replace",
        action="store_true",
        help="Delete prior demo_seed trades for this identity before insert",
    )
    ap.add_argument("--seed", type=int, default=42, help="RNG seed for reproducibility")
    return ap.parse_args()


def _weekdays(end: date, days: int) -> list[date]:
    out: list[date] = []
    d = end - timedelta(days=days)
    while d <= end:
        if d.weekday() < 5:
            out.append(d)
        d += timedelta(days=1)
    return out


def _exec_at(d: date, hour: int, minute: int) -> datetime:
    return datetime(d.year, d.month, d.day, hour, minute, 0)


def _spx_path(days: list[date], rng: random.Random) -> dict[date, float]:
    """Synthetic SPX path for strike selection (~5800 area)."""
    px = 5820.0
    path: dict[date, float] = {}
    for d in days:
        # Mild daily drift + vol; occasional larger day
        shock = rng.gauss(0.2, 18.0)
        if rng.random() < 0.04:
            shock = rng.choice([-1, 1]) * rng.uniform(45, 90)
        px = max(4800.0, min(6200.0, px + shock))
        path[d] = round(px / 5) * 5  # 5-point grid
    return path


def _fly_strikes(spot: float, width: int, rng: random.Random) -> tuple[int, int, int]:
    """Put butterfly: wing / body / wing around slightly OTM or ATM."""
    center = int(round(spot / 5) * 5)
    # Bias slightly OTM put for "credit/debit hunt" style
    if rng.random() < 0.55:
        center = int(round((spot - rng.choice([10, 15, 20, 25])) / 5) * 5)
    lo = center - width
    hi = center + width
    return lo, center, hi


def _insert_trade(
    cur,
    *,
    iid: int,
    account_id: int,
    exec_at: datetime,
    strategy: str,
    order_type: str,
    net_price: Decimal | None,
    net_side: str | None,
    setup: str,
    plan: str,
    rules: str,
    adherence: str,
    deviation: str,
    lesson: str,
    pnl: Decimal | None,
    legs: list[dict],
    external_order_id: str,
) -> int:
    cur.execute(
        """INSERT INTO member_trade_log_trades
             (identity_id, account_id, exec_at, asset_class, strategy, order_type,
              net_price, net_side, setup_md, plan_md, rules_md, adherence,
              deviation_md, lesson_md, pnl_amount, external_adapter, external_order_id)
           VALUES (%s,%s,%s,'equity_option',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (
            iid,
            account_id,
            exec_at,
            strategy,
            order_type,
            net_price,
            net_side,
            setup,
            plan,
            rules,
            adherence,
            deviation,
            lesson,
            pnl,
            ADAPTER,
            external_order_id,
        ),
    )
    tid = int(cur.lastrowid)
    for i, leg in enumerate(legs):
        cur.execute(
            """INSERT INTO member_trade_log_legs
                 (trade_id, identity_id, account_id, leg_index, side, quantity,
                  pos_effect, asset_class, underlier, symbol, expiry, strike,
                  option_right, multiplier, fill_price, fees)
               VALUES (%s,%s,%s,%s,%s,%s,%s,'equity_option',%s,NULL,%s,%s,%s,100,%s,%s)""",
            (
                tid,
                iid,
                account_id,
                i,
                leg["side"],
                leg["qty"],
                leg["effect"],
                leg["underlier"],
                leg["expiry"],
                leg["strike"],
                leg["right"],
                leg["fill"],
                leg.get("fees"),
            ),
        )
    return tid


def _open_butterfly(
    underlier: str,
    expiry: date,
    lo: int,
    mid: int,
    hi: int,
    right: str,
    debit: Decimal,
    rng: random.Random,
) -> tuple[list[dict], Decimal, str]:
    """3-leg long put/call fly; approximate leg prices that sum to debit."""
    # Rough split of debit across wings/body (display realism, not arb-free)
    body = (debit * Decimal("0.55")).quantize(Decimal("0.01"))
    wing_lo = (debit * Decimal("0.28")).quantize(Decimal("0.01"))
    wing_hi = (debit - body - wing_lo).quantize(Decimal("0.01"))
    if wing_hi < Decimal("0.05"):
        wing_hi = Decimal("0.05")
        wing_lo = max(Decimal("0.05"), debit - body - wing_hi)
    legs = [
        {
            "side": "BUY",
            "qty": 1,
            "effect": "TO_OPEN",
            "underlier": underlier,
            "expiry": expiry,
            "strike": lo,
            "right": right,
            "fill": float(wing_lo),
            "fees": 1.30,
        },
        {
            "side": "SELL",
            "qty": 2,
            "effect": "TO_OPEN",
            "underlier": underlier,
            "expiry": expiry,
            "strike": mid,
            "right": right,
            "fill": float(body),
            "fees": 1.30,
        },
        {
            "side": "BUY",
            "qty": 1,
            "effect": "TO_OPEN",
            "underlier": underlier,
            "expiry": expiry,
            "strike": hi,
            "right": right,
            "fill": float(wing_hi),
            "fees": 1.30,
        },
    ]
    # Tiny noise on fills
    for leg in legs:
        leg["fill"] = round(leg["fill"] + rng.uniform(-0.03, 0.03), 2)
        leg["fill"] = max(0.05, leg["fill"])
    return legs, debit, "DEBIT"


def _close_butterfly(
    underlier: str,
    expiry: date,
    lo: int,
    mid: int,
    hi: int,
    right: str,
    credit: Decimal,
    rng: random.Random,
) -> tuple[list[dict], Decimal, str]:
    body = (credit * Decimal("0.55")).quantize(Decimal("0.01"))
    wing_lo = (credit * Decimal("0.28")).quantize(Decimal("0.01"))
    wing_hi = (credit - body - wing_lo).quantize(Decimal("0.01"))
    if wing_hi < Decimal("0.02"):
        wing_hi = Decimal("0.02")
    legs = [
        {
            "side": "SELL",
            "qty": 1,
            "effect": "TO_CLOSE",
            "underlier": underlier,
            "expiry": expiry,
            "strike": lo,
            "right": right,
            "fill": float(wing_lo),
            "fees": 1.30,
        },
        {
            "side": "BUY",
            "qty": 2,
            "effect": "TO_CLOSE",
            "underlier": underlier,
            "expiry": expiry,
            "strike": mid,
            "right": right,
            "fill": float(body),
            "fees": 1.30,
        },
        {
            "side": "SELL",
            "qty": 1,
            "effect": "TO_CLOSE",
            "underlier": underlier,
            "expiry": expiry,
            "strike": hi,
            "right": right,
            "fill": float(wing_hi),
            "fees": 1.30,
        },
    ]
    for leg in legs:
        leg["fill"] = round(max(0.02, leg["fill"] + rng.uniform(-0.02, 0.02)), 2)
    return legs, credit, "CREDIT"


def _open_vertical(
    underlier: str,
    expiry: date,
    long_k: int,
    short_k: int,
    right: str,
    debit: Decimal,
) -> tuple[list[dict], Decimal, str]:
    long_px = (debit * Decimal("0.65")).quantize(Decimal("0.01"))
    short_px = (debit - long_px).quantize(Decimal("0.01"))
    if short_px < Decimal("0.05"):
        short_px = Decimal("0.05")
        long_px = debit - short_px
    legs = [
        {
            "side": "BUY",
            "qty": 1,
            "effect": "TO_OPEN",
            "underlier": underlier,
            "expiry": expiry,
            "strike": long_k,
            "right": right,
            "fill": float(long_px),
            "fees": 1.30,
        },
        {
            "side": "SELL",
            "qty": 1,
            "effect": "TO_OPEN",
            "underlier": underlier,
            "expiry": expiry,
            "strike": short_k,
            "right": right,
            "fill": float(short_px),
            "fees": 1.30,
        },
    ]
    return legs, debit, "DEBIT"


def _close_vertical(
    underlier: str,
    expiry: date,
    long_k: int,
    short_k: int,
    right: str,
    credit: Decimal,
) -> tuple[list[dict], Decimal, str]:
    long_px = (credit * Decimal("0.65")).quantize(Decimal("0.01"))
    short_px = max(Decimal("0.02"), (credit - long_px).quantize(Decimal("0.01")))
    legs = [
        {
            "side": "SELL",
            "qty": 1,
            "effect": "TO_CLOSE",
            "underlier": underlier,
            "expiry": expiry,
            "strike": long_k,
            "right": right,
            "fill": float(long_px),
            "fees": 1.30,
        },
        {
            "side": "BUY",
            "qty": 1,
            "effect": "TO_CLOSE",
            "underlier": underlier,
            "expiry": expiry,
            "strike": short_k,
            "right": right,
            "fill": float(short_px),
            "fees": 1.30,
        },
    ]
    return legs, credit, "CREDIT"


def generate_year(
    cur,
    *,
    iid: int,
    account_id: int,
    days: int,
    rng: random.Random,
) -> dict:
    end = date.today()
    weekdays = _weekdays(end, days)
    path = _spx_path(weekdays, rng)
    underlier = "SPX"

    equity = STARTING_EQUITY
    n_open = n_close = n_vert = n_note = 0
    seq = 0
    open_positions: list[dict] = []  # pending flies/verticals to close

    for d in weekdays:
        spot = path[d]
        # Trading intensity: skip ~35% of sessions (discipline / no setup)
        if rng.random() < 0.35:
            continue
        # Prefer late morning / early afternoon fills
        open_h, open_m = rng.choice([(10, 15), (10, 42), (11, 5), (11, 38), (12, 10), (13, 22)])
        close_h, close_m = rng.choice([(12, 45), (13, 15), (14, 5), (14, 40), (15, 12), (15, 45)])

        # Close older open positions first (~same day or next sessions)
        still: list[dict] = []
        for pos in open_positions:
            age = (d - pos["opened"].date()).days
            should_close = age >= pos["hold_days"] or (
                age >= 0 and d == pos["opened"].date() and rng.random() < 0.55
            )
            if not should_close or d < pos["opened"].date():
                still.append(pos)
                continue
            if d == pos["opened"].date() and (close_h, close_m) <= (
                pos["opened"].hour,
                pos["opened"].minute,
            ):
                still.append(pos)
                continue

            seq += 1
            oid = f"demo-{iid}-{seq:04d}-c"
            # Outcome: ~48% winners, 12% scratches, rest losers (process-realistic)
            roll = rng.random()
            entry = pos["debit"]
            if roll < 0.48:
                # Win: 1.2x–2.8x credit vs debit (capped)
                mult = Decimal(str(round(rng.uniform(1.15, 2.6), 2)))
                credit = (entry * mult).quantize(Decimal("0.01"))
                adherence = rng.choice(["followed", "followed", "partial"])
                lesson = rng.choice(
                    [
                        "Took partial at 25% — no regret.",
                        "Structure held; managed time not price.",
                        "Sized for one R; exit was mechanical.",
                    ]
                )
            elif roll < 0.60:
                credit = (entry * Decimal(str(round(rng.uniform(0.85, 1.05), 2)))).quantize(
                    Decimal("0.01")
                )
                adherence = "followed"
                lesson = "Scratch — no edge after first hour."
            else:
                mult = Decimal(str(round(rng.uniform(0.15, 0.65), 2)))
                credit = (entry * mult).quantize(Decimal("0.01"))
                adherence = rng.choice(["followed", "partial", "broke"])
                lesson = rng.choice(
                    [
                        "Stopped at plan — small loss is the product.",
                        "Held too long into lunch; process note only.",
                        "Wrong width for the day's range.",
                    ]
                )

            # P&L in dollars: options * 100 multiplier * (credit - debit) per fly
            contracts = Decimal(pos.get("contracts", 1))
            pnl = ((credit - entry) * Decimal("100") * contracts).quantize(Decimal("0.01"))
            equity += pnl

            if pos["kind"] == "BUTTERFLY":
                legs, net_p, net_s = _close_butterfly(
                    underlier,
                    pos["expiry"],
                    pos["lo"],
                    pos["mid"],
                    pos["hi"],
                    pos["right"],
                    credit,
                    rng,
                )
            else:
                legs, net_p, net_s = _close_vertical(
                    underlier,
                    pos["expiry"],
                    pos["long_k"],
                    pos["short_k"],
                    pos["right"],
                    credit,
                )

            _insert_trade(
                cur,
                iid=iid,
                account_id=account_id,
                exec_at=_exec_at(d, close_h, close_m),
                strategy=pos["kind"],
                order_type="LMT",
                net_price=net_p,
                net_side=net_s,
                setup=pos["setup"],
                plan="Exit per rule: time stop or 25–50% credit.",
                rules="No averaging. Max hold through final hour only if still defined.",
                adherence=adherence,
                deviation="" if adherence == "followed" else "Adjusted exit time once.",
                lesson=lesson,
                pnl=pnl,
                legs=legs,
                external_order_id=oid,
            )
            n_close += 1

        open_positions = still

        # New opens: usually butterfly
        if rng.random() < 0.72:
            kind = "BUTTERFLY"
        elif rng.random() < 0.85:
            kind = "VERTICAL"
        else:
            # Occasional process note only
            if rng.random() < 0.4:
                seq += 1
                _insert_trade(
                    cur,
                    iid=iid,
                    account_id=account_id,
                    exec_at=_exec_at(d, 9, 35),
                    strategy="NOTE",
                    order_type="LMT",
                    net_price=None,
                    net_side=None,
                    setup="No trade — range day / no convex structure.",
                    plan="Watch only. Protect capital.",
                    rules="Do not force a fly in a dead tape.",
                    adherence="followed",
                    deviation="",
                    lesson="Sitting out is a valid process outcome.",
                    pnl=None,
                    legs=[],
                    external_order_id=f"demo-{iid}-{seq:04d}-n",
                )
                n_note += 1
            continue

        width = rng.choice([25, 25, 30, 40, 50])
        right = rng.choice(["PUT", "PUT", "PUT", "CALL"])
        lo, mid, hi = _fly_strikes(spot, width, rng)
        # 0DTE / weekly: expiry same day or Friday
        if rng.random() < 0.55:
            expiry = d
            tenor = "0DTE"
        else:
            # next Friday
            expiry = d + timedelta(days=(4 - d.weekday()) % 7)
            if expiry < d:
                expiry = d
            tenor = "weekly"

        debit = Decimal(str(round(rng.uniform(0.45, 2.35), 2)))
        contracts = rng.choice([1, 1, 1, 2, 2, 3])
        seq += 1
        oid = f"demo-{iid}-{seq:04d}-o"

        if kind == "BUTTERFLY":
            legs, net_p, net_s = _open_butterfly(
                underlier, expiry, lo, mid, hi, right, debit, rng
            )
            if contracts > 1:
                for leg in legs:
                    leg["qty"] *= contracts
            setup = (
                f"{tenor} {right} butterfly {lo}/{mid}/{hi} ×{contracts} "
                f"on {underlier} (spot ~{int(spot)})."
            )
            plan = "Enter on structure; target 25–50% of debit as credit; time-stop."
            open_positions.append(
                {
                    "kind": "BUTTERFLY",
                    "opened": _exec_at(d, open_h, open_m),
                    "hold_days": 0 if tenor == "0DTE" else rng.choice([0, 1, 1, 2]),
                    "debit": debit,
                    "contracts": contracts,
                    "lo": lo,
                    "mid": mid,
                    "hi": hi,
                    "right": right,
                    "expiry": expiry,
                    "setup": setup,
                }
            )
            n_open += 1
        else:
            # debit put vertical: buy higher put, sell lower
            long_k = mid
            short_k = mid - width
            legs, net_p, net_s = _open_vertical(
                underlier, expiry, long_k, short_k, right, debit
            )
            if contracts > 1:
                for leg in legs:
                    leg["qty"] *= contracts
            setup = (
                f"{tenor} {right} vertical {long_k}/{short_k} ×{contracts} "
                f"(spot ~{int(spot)})."
            )
            plan = "Defined risk only. Exit 50% or time cut."
            open_positions.append(
                {
                    "kind": "VERTICAL",
                    "opened": _exec_at(d, open_h, open_m),
                    "hold_days": 0 if tenor == "0DTE" else rng.choice([0, 1, 2]),
                    "debit": debit,
                    "contracts": contracts,
                    "long_k": long_k,
                    "short_k": short_k,
                    "right": right,
                    "expiry": expiry,
                    "setup": setup,
                }
            )
            n_vert += 1
            n_open += 1

        _insert_trade(
            cur,
            iid=iid,
            account_id=account_id,
            exec_at=_exec_at(d, open_h, open_m),
            strategy=kind,
            order_type="LMT",
            net_price=net_p,
            net_side=net_s,
            setup=setup,
            plan=plan,
            rules="1–2% account risk max. No naked. Log before size-up.",
            adherence=rng.choice(["followed", "followed", "followed", "partial"]),
            deviation="",
            lesson="",
            pnl=None,  # P&L recorded on close
            legs=legs,
            external_order_id=oid,
        )

    # Force-close remaining opens on last day
    if open_positions:
        d = weekdays[-1]
        for pos in open_positions:
            seq += 1
            credit = (pos["debit"] * Decimal("0.4")).quantize(Decimal("0.01"))
            contracts = Decimal(pos.get("contracts", 1))
            pnl = ((credit - pos["debit"]) * Decimal("100") * contracts).quantize(
                Decimal("0.01")
            )
            equity += pnl
            if pos["kind"] == "BUTTERFLY":
                legs, net_p, net_s = _close_butterfly(
                    underlier,
                    pos["expiry"],
                    pos["lo"],
                    pos["mid"],
                    pos["hi"],
                    pos["right"],
                    credit,
                    rng,
                )
            else:
                legs, net_p, net_s = _close_vertical(
                    underlier,
                    pos["expiry"],
                    pos["long_k"],
                    pos["short_k"],
                    pos["right"],
                    credit,
                )
            _insert_trade(
                cur,
                iid=iid,
                account_id=account_id,
                exec_at=_exec_at(d, 15, 50),
                strategy=pos["kind"],
                order_type="LMT",
                net_price=net_p,
                net_side=net_s,
                setup=pos["setup"],
                plan="EOD flatten demo seed.",
                rules="No overnight on demo seed remainder.",
                adherence="followed",
                deviation="",
                lesson="Closed residual for seed completeness.",
                pnl=pnl,
                legs=legs,
                external_order_id=f"demo-{iid}-{seq:04d}-x",
            )
            n_close += 1

    return {
        "opens": n_open,
        "closes": n_close,
        "verticals_tagged": n_vert,
        "notes": n_note,
        "ending_equity_approx": float(equity),
        "starting_equity": float(STARTING_EQUITY),
        "pnl_sum_approx": float(equity - STARTING_EQUITY),
        "trades_inserted": seq,
    }


def main() -> None:
    args = _parse_args()
    rng = random.Random(args.seed)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            if args.identity_id:
                iid = args.identity_id
                cur.execute(
                    "SELECT identity_id, email FROM identities WHERE identity_id = %s",
                    (iid,),
                )
                row = cur.fetchone()
                if not row:
                    raise SystemExit(f"identity_id {iid} not found")
                email = row["email"]
            else:
                iid = identity_mod.get_or_create_identity(cur, args.email, args.email)
                email = args.email

            if args.replace:
                cur.execute(
                    """SELECT id FROM member_trade_log_trades
                       WHERE identity_id = %s AND external_adapter = %s""",
                    (iid, ADAPTER),
                )
                ids = [r["id"] for r in cur.fetchall()]
                if ids:
                    cur.execute(
                        f"DELETE FROM member_trade_log_legs WHERE trade_id IN ({','.join(['%s']*len(ids))})",
                        ids,
                    )
                    cur.execute(
                        """DELETE FROM member_trade_log_trades
                           WHERE identity_id = %s AND external_adapter = %s""",
                        (iid, ADAPTER),
                    )
                print(f"replaced: removed {len(ids)} prior demo trades")

            # Default / Primary account
            cur.execute(
                """SELECT * FROM member_trade_log_accounts
                   WHERE identity_id = %s
                   ORDER BY CASE label WHEN 'Primary' THEN 0 ELSE 1 END, id
                   LIMIT 1""",
                (iid,),
            )
            acct = cur.fetchone()
            if not acct:
                cur.execute(
                    """INSERT INTO member_trade_log_accounts
                         (identity_id, label, broker, status, sort_order, notes_md)
                       VALUES (%s, 'Primary', 'thinkorswim', 'active', 10, %s)""",
                    (
                        iid,
                        f"Demo book · start ${STARTING_EQUITY:,.0f} · {ADAPTER}",
                    ),
                )
                cur.execute(
                    "SELECT * FROM member_trade_log_accounts WHERE id = %s",
                    (cur.lastrowid,),
                )
                acct = cur.fetchone()
            else:
                note = (
                    f"Demo book · start ${STARTING_EQUITY:,.0f} · seeded {ADAPTER}. "
                    f"{(acct.get('notes_md') or '')}".strip()
                )
                cur.execute(
                    """UPDATE member_trade_log_accounts
                       SET notes_md = %s, broker = COALESCE(NULLIF(broker,''), 'thinkorswim')
                       WHERE id = %s""",
                    (note[:2000], acct["id"]),
                )

            account_id = int(acct["id"])
            stats = generate_year(
                cur,
                iid=iid,
                account_id=account_id,
                days=args.days,
                rng=rng,
            )

    print(
        f"seeded identity={iid} email={email} account_id={account_id}\n"
        f"  days={args.days} trades~={stats['trades_inserted']} "
        f"opens={stats['opens']} closes={stats['closes']} notes={stats['notes']}\n"
        f"  starting=${stats['starting_equity']:,.0f} "
        f"ending≈${stats['ending_equity_approx']:,.2f} "
        f"pnl≈${stats['pnl_sum_approx']:,.2f}"
    )


if __name__ == "__main__":
    main()
