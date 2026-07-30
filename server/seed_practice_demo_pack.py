#!/usr/bin/env python3
"""Generate a demo Practice pack (canonical export) and optionally import it.

For product demos of two-way portability (Spec Member Practice Export v1.1):

  cd server
  set -a && source ../.env && set +a

  # 1) Write a ZIP you can Load in Profile → Your data
  .venv/bin/python seed_practice_demo_pack.py --out ../tmp/demo-practice.zip

  # 2) Or generate and load into a member (additive; use purge first for clean slate)
  .venv/bin/python seed_practice_demo_pack.py --import-email ernie@fattail.ai
  .venv/bin/python seed_practice_demo_pack.py --import-email demo@labs.local --purge-first

  # 3) JSON instead of ZIP
  .venv/bin/python seed_practice_demo_pack.py --out ../tmp/demo-practice.json --format json

Pack includes process-first sample trades (not profit theater), journal notes,
a completed retrospective + habit plan, and a couple of live check-ins.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Load repo .env before config/db (same pattern as pytest conftest)
_SERVER = Path(__file__).resolve().parent
_ROOT = _SERVER.parent
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))


def _load_env() -> None:
    env_file = _ROOT / ".env"
    if not env_file.is_file():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env()

import db  # noqa: E402
import export_domain as ex  # noqa: E402
import identity as identity_mod  # noqa: E402
import import_domain as im  # noqa: E402


def _iso(days_ago: int = 0, hour: int = 15) -> str:
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    dt = dt.replace(hour=hour, minute=30, second=0, microsecond=0)
    return dt.isoformat().replace("+00:00", "Z")


def _day(days_ago: int = 0) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).date().isoformat()


def build_demo_pack(*, label: str = "Demo Practice book") -> dict:
    """Build fattail.labs.member_export with deterministic demo content."""
    exported_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )
    identity = {
        "export_subject": "self",
        "email": "demo-practice@fattail.example",
    }
    source = {"system": "fattail-labs", "env": "demo", "generator": "seed_practice_demo_pack"}

    trade_log = {
        "format": "fattail.labs.trade_log",
        "model_version": "1.0",
        "exported_at": exported_at,
        "source": {"adapter": "native", "adapter_version": "1.0"},
        "identity": identity,
        "accounts": [
            {
                "id": "acct-demo-1",
                "label": label,
                "broker": "fattail",
                "broker_label": None,
                "currency": "USD",
                "status": "active",
                "trades": [
                    {
                        "id": "demo-trade-001",
                        "exec_at": _iso(14, 10),
                        "asset_class": "equity_option",
                        "strategy": "BUTTERFLY",
                        "order_type": "LMT",
                        "net_price": "0.45",
                        "net_side": "DEBIT",
                        "process": {
                            "setup_md": "SPX iron fly around prior day value.",
                            "plan_md": "Defined risk; exit 50% credit or 21 DTE.",
                            "rules_md": "No add-ons; size to 1% account risk.",
                            "adherence": "followed",
                            "deviation_md": "",
                            "lesson_md": "Held plan through midday noise.",
                            "pnl_amount": None,
                        },
                        "legs": [
                            {
                                "leg_index": 0,
                                "side": "BUY",
                                "quantity": 1,
                                "pos_effect": "TO OPEN",
                                "asset_class": "equity_option",
                                "underlier": "SPX",
                                "symbol": "SPX",
                                "expiry": _day(7),
                                "strike": "5500",
                                "right": "PUT",
                                "fill_price": "12.00",
                                "fees": "1.30",
                            },
                            {
                                "leg_index": 1,
                                "side": "SELL",
                                "quantity": 2,
                                "pos_effect": "TO OPEN",
                                "asset_class": "equity_option",
                                "underlier": "SPX",
                                "symbol": "SPX",
                                "expiry": _day(7),
                                "strike": "5525",
                                "right": "PUT",
                                "fill_price": "8.00",
                                "fees": "2.60",
                            },
                            {
                                "leg_index": 2,
                                "side": "BUY",
                                "quantity": 1,
                                "pos_effect": "TO OPEN",
                                "asset_class": "equity_option",
                                "underlier": "SPX",
                                "symbol": "SPX",
                                "expiry": _day(7),
                                "strike": "5550",
                                "right": "PUT",
                                "fill_price": "5.10",
                                "fees": "1.30",
                            },
                        ],
                        "external_refs": {"broker_order_id": "demo-practice-001"},
                    },
                    {
                        "id": "demo-trade-002",
                        "exec_at": _iso(10, 14),
                        "asset_class": "equity_option",
                        "strategy": "VERTICAL",
                        "order_type": "LMT",
                        "net_price": "1.20",
                        "net_side": "CREDIT",
                        "process": {
                            "setup_md": "Bull put credit after routine checklist.",
                            "plan_md": "Close at 50% or before event risk.",
                            "rules_md": "No revenge size.",
                            "adherence": "partial",
                            "deviation_md": "Held 20 minutes past planned exit window.",
                            "lesson_md": "Timer on phone next time.",
                            "pnl_amount": "85.00",
                        },
                        "legs": [
                            {
                                "leg_index": 0,
                                "side": "SELL",
                                "quantity": 1,
                                "pos_effect": "TO OPEN",
                                "asset_class": "equity_option",
                                "underlier": "SPY",
                                "symbol": "SPY",
                                "expiry": _day(5),
                                "strike": "520",
                                "right": "PUT",
                                "fill_price": "2.40",
                                "fees": "0.65",
                            },
                            {
                                "leg_index": 1,
                                "side": "BUY",
                                "quantity": 1,
                                "pos_effect": "TO OPEN",
                                "asset_class": "equity_option",
                                "underlier": "SPY",
                                "symbol": "SPY",
                                "expiry": _day(5),
                                "strike": "515",
                                "right": "PUT",
                                "fill_price": "1.20",
                                "fees": "0.65",
                            },
                        ],
                        "external_refs": {"broker_order_id": "demo-practice-002"},
                    },
                    {
                        "id": "demo-trade-003",
                        "exec_at": _iso(3, 11),
                        "asset_class": "equity_option",
                        "strategy": "NOTE",
                        "order_type": "LMT",
                        "net_price": None,
                        "net_side": None,
                        "process": {
                            "setup_md": "",
                            "plan_md": "No trade — capital preservation day.",
                            "rules_md": "If no A+ setup, stand down.",
                            "adherence": "followed",
                            "deviation_md": "",
                            "lesson_md": "Standing down is process, not failure.",
                            "pnl_amount": None,
                        },
                        "legs": [],
                        "external_refs": {"broker_order_id": "demo-practice-003"},
                    },
                ],
            }
        ],
    }

    journal = {
        "format": ex.FMT_JOURNAL,
        "model_version": "1.0",
        "exported_at": exported_at,
        "source": source,
        "identity": identity,
        "entries": [
            {
                "id": "demo-note-pre-1",
                "day": _day(14),
                "surface": "pre_market",
                "body_md": (
                    "Pre-market: sleep 7h, checklist done. Looking for defined-risk "
                    "structures only. No size increases today."
                ),
                "created_at": _iso(14, 8),
                "updated_at": _iso(14, 8),
            },
            {
                "id": "demo-note-j-1",
                "day": _day(14),
                "surface": "journal",
                "body_md": (
                    "Opened the fly as planned. Stayed with the checklist when price "
                    "wiggled — process over impulse."
                ),
                "created_at": _iso(14, 16),
                "updated_at": _iso(14, 16),
            },
            {
                "id": "demo-note-j-2",
                "day": _day(10),
                "surface": "journal",
                "body_md": (
                    "Partial adherence on the vertical — exit window slipped. Logged "
                    "it; no rewrite of history."
                ),
                "created_at": _iso(10, 17),
                "updated_at": _iso(10, 17),
            },
            {
                "id": "demo-note-j-3",
                "day": _day(3),
                "surface": "journal",
                "body_md": "No-trade day. Capital preservation is the product.",
                "created_at": _iso(3, 15),
                "updated_at": _iso(3, 15),
            },
        ],
        "day_index": [
            {"day": _day(14), "has_trades": True, "note_ids": ["demo-note-pre-1", "demo-note-j-1"]},
            {"day": _day(10), "has_trades": True, "note_ids": ["demo-note-j-2"]},
            {"day": _day(3), "has_trades": True, "note_ids": ["demo-note-j-3"]},
        ],
    }

    retrospective = {
        "format": ex.FMT_RETRO,
        "model_version": "1.0",
        "exported_at": exported_at,
        "source": source,
        "identity": identity,
        "retrospectives": [
            {
                "id": "demo-retro-maiden",
                "status": "complete",
                "is_maiden": True,
                "scope_start": _iso(28, 0),
                "scope_end": _iso(7, 23),
                "title": "Maiden journey — demo baseline",
                "body_md": (
                    "First full look-back for the demo account. Process first: "
                    "routine days, adherence tags, journal streaks — book is context only."
                ),
                "completed_at": _iso(7, 18),
                "created_at": _iso(7, 17),
                "updated_at": _iso(7, 18),
                "report": {
                    "version": "0.5",
                    "meta": {
                        "is_maiden": True,
                        "scope_start": _iso(28, 0),
                        "scope_end": _iso(7, 23),
                        "window_days": 21,
                        "trade_count": 3,
                        "min_inference_n": 20,
                    },
                    "carry_forward": None,
                    "process": {
                        "routine_days_per_week": 4.0,
                        "journal_days": 5,
                        "adherence_rate": 0.67,
                    },
                    "integrity_review": {
                        "summary": "Installing routine; sample too small for outcome trends."
                    },
                    "deviations": [
                        {
                            "kind": "adherence",
                            "title": "Exit window slip",
                            "detail": "Held past planned exit on one vertical.",
                        }
                    ],
                    "what_worked": [
                        {
                            "observation": "No-trade day held without FOMO fill.",
                            "evidence": "journal note + NOTE trade",
                        }
                    ],
                    "expected_vs_actual": None,
                    "book_performance": {
                        "trade_count": 3,
                        "sample_below_min": True,
                        "sample_banner": (
                            "This is a small sample. It describes what happened; "
                            "it does not measure process quality."
                        ),
                        "note": "Neutral book context for process review.",
                    },
                },
                "comparison": {
                    "has_prior": False,
                    "version": "0.5",
                    "label": "Maiden journey — this becomes your baseline",
                    "metrics": [],
                    "deltas": None,
                },
                "agent": None,
            }
        ],
        "habit_plans": [
            {
                "id": "demo-plan-timer",
                "title": "Exit timer",
                "habit": "Set a phone timer for planned exit window on every credit trade.",
                "why_process": "Partial adherence came from drifting past the plan clock.",
                "observable_signal": "routine_days",
                "status": "active",
                "retrospective_id": "demo-retro-maiden",
                "activated_at": _iso(7, 18),
                "retired_at": None,
                "created_at": _iso(7, 18),
                "updated_at": _iso(7, 18),
            }
        ],
    }

    journey = {
        "format": ex.FMT_JOURNEY,
        "model_version": "1.0",
        "exported_at": exported_at,
        "source": source,
        "identity": identity,
        "snapshot_note": "Demo snapshot — meters not re-imported; check-ins may load additively.",
        "process": {},
        "contribution": {},
        "privacy": {
            "journey_visible": False,
            "analytics_opted_in": False,
        },
        "raw_signals": {
            "live_checkins": [
                {
                    "session_key": "demo-live-week-1",
                    "starts_at": _iso(21, 19),
                    "checked_in_at": _iso(21, 19),
                },
                {
                    "session_key": "demo-live-week-2",
                    "starts_at": _iso(14, 19),
                    "checked_in_at": _iso(14, 19),
                },
            ],
            "enrollment_summary": {"course_count": 0, "completed_lessons": 0},
        },
    }

    return {
        "format": ex.FMT_PACK,
        "model_version": "1.0",
        "exported_at": exported_at,
        "source": source,
        "identity": identity,
        "surfaces": ["trade_log", "journal", "retrospective", "journey"],
        "documents": {
            "trade_log": trade_log,
            "journal": journal,
            "retrospective": retrospective,
            "journey": journey,
        },
    }


def write_pack(pack: dict, out: Path, fmt: str) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    if fmt == "json":
        out.write_text(json.dumps(pack, indent=2, default=str), encoding="utf-8")
        return out
    # zip
    data = ex.pack_to_zip_bytes(pack)
    out.write_bytes(data)
    return out


def import_pack(pack: dict, email: str, *, purge_first: bool) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, email, email.split("@")[0].replace(".", " ").title()
            )
            if purge_first:
                counts = im.purge_practice_data(cur, iid)
                print(f"purged practice for {email} (id={iid}): {counts}")
            docs = {
                k: v
                for k, v in (pack.get("documents") or {}).items()
                if k in ("trade_log", "journal", "retrospective", "journey")
            }
            claims = {"identity_id": iid, "role": "activator"}
            result = im.commit_all(cur, iid, docs, "additive", claims=claims)
            print(f"imported into {email} (id={iid})")
            print(json.dumps(result, indent=2, default=str))
            return result


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Generate demo Practice pack for export/import demos"
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Write pack to this path (.zip or .json)",
    )
    ap.add_argument(
        "--format",
        choices=("zip", "json"),
        default="zip",
        help="Output format when using --out (default zip)",
    )
    ap.add_argument(
        "--import-email",
        default=None,
        help="After generate, additive-import into this member (creates identity if needed)",
    )
    ap.add_argument(
        "--purge-first",
        action="store_true",
        help="With --import-email: purge Practice data first (membership kept)",
    )
    ap.add_argument(
        "--label",
        default="Demo Practice book",
        help="Trade log account label in the pack",
    )
    args = ap.parse_args()

    pack = build_demo_pack(label=args.label)

    if args.out:
        path = args.out
        if path.suffix.lower() == ".json":
            fmt = "json"
        elif path.suffix.lower() == ".zip":
            fmt = "zip"
        else:
            fmt = args.format
            if fmt == "zip" and path.suffix == "":
                path = path.with_suffix(".zip")
            elif fmt == "json" and path.suffix == "":
                path = path.with_suffix(".json")
        written = write_pack(pack, path, fmt)
        print(f"wrote {written} ({written.stat().st_size} bytes)")
    elif not args.import_email:
        # Default: write next to repo tmp/
        default = _ROOT / "tmp" / "demo-practice.zip"
        written = write_pack(pack, default, "zip")
        print(f"wrote {written} ({written.stat().st_size} bytes)")
        print("Load via Profile → Your data → Load Practice data")

    if args.import_email:
        import_pack(pack, args.import_email, purge_first=args.purge_first)


if __name__ == "__main__":
    main()
