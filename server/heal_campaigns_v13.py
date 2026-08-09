#!/usr/bin/env python3
"""Heal pre-v1.3 campaigns into the window model (Member Campaign Spec v1.3).

Run once (or anytime — idempotent) after migrate:

  cd server && .venv/bin/python heal_campaigns_v13.py

What it does
------------
1. **Charters** (``is_ledger = 0``):
   - ``account_id = NULL`` (L5 account-free)
   - house-seed all six panel controls (idempotent)

2. **Mis-flagged seasons** — rows that are ``is_ledger = 1`` but look like
   member seasons (not furniture titles like ``Default — …`` / ``Primary book`` /
   ``My first campaign``):
   - Create a proper ledger for that account if needed
   - Demote the season to a charter (panel + radar eligible)
   - Preserve all trade stamps on the demoted campaign

Does **not** rewrite historical stamps or move trades between accounts.
"""

from __future__ import annotations

import sys

import db
import practice_spine_domain as psd
from campaign_panel import ensure_six_controls

# Titles we treat as ledger furniture (keep is_ledger)
_FURNITURE_PREFIXES = (
    "default —",
    "default -",
    "primary book",
    "primary —",
    "primary -",
    "my first campaign",
)


def _is_furniture_title(title: str | None) -> bool:
    t = (title or "").strip().lower()
    if not t:
        return True
    return any(t == p or t.startswith(p) for p in _FURNITURE_PREFIXES)


def heal(*, dry_run: bool = False) -> dict:
    demoted: list[dict] = []
    seeded: list[int] = []
    ledgers_made: list[dict] = []
    cleared_account: list[int] = []

    with db.transaction() as conn:
        with conn.cursor() as cur:
            # --- A: demote season-named ledgers, ensure real ledger per book ---
            cur.execute(
                """SELECT * FROM member_practice_campaigns
                   WHERE is_ledger = 1
                   ORDER BY id ASC"""
            )
            ledgers = list(cur.fetchall() or [])
            for row in ledgers:
                cid = int(row["id"])
                iid = int(row["identity_id"])
                title = row.get("title") or ""
                if _is_furniture_title(title):
                    continue
                aid = row.get("account_id")
                if aid is None:
                    # Corrupt ledger with no account — demote only
                    if dry_run:
                        demoted.append(
                            {"id": cid, "title": title, "account_id": None, "dry": True}
                        )
                        continue
                    cur.execute(
                        """UPDATE member_practice_campaigns
                           SET is_ledger = 0, is_default = 0, account_id = NULL
                           WHERE id = %s AND identity_id = %s""",
                        (cid, iid),
                    )
                    ensure_six_controls(cur, iid, cid)
                    demoted.append({"id": cid, "title": title, "account_id": None})
                    continue

                aid = int(aid)
                if dry_run:
                    demoted.append(
                        {
                            "id": cid,
                            "title": title,
                            "account_id": aid,
                            "dry": True,
                        }
                    )
                    continue

                # Ensure a real ledger exists for this book (may create new)
                ledger = psd.ensure_ledger_campaign(cur, iid, aid)
                lid = int(ledger["id"])
                if lid == cid:
                    # ensure_ledger returned self — force demote then recreate
                    # Rename furniture pattern for the new row
                    cur.execute(
                        """SELECT label FROM member_trade_log_accounts
                           WHERE id = %s AND identity_id = %s""",
                        (aid, iid),
                    )
                    ar = cur.fetchone() or {}
                    label = (ar.get("label") or "Default").strip() or "Default"
                    book_title = psd._unique_campaign_title(
                        cur, iid, f"Default — {label}"
                    )
                    # Demote this season first
                    cur.execute(
                        """UPDATE member_practice_campaigns
                           SET is_ledger = 0, is_default = 0, account_id = NULL
                           WHERE id = %s AND identity_id = %s""",
                        (cid, iid),
                    )
                    ensure_six_controls(cur, iid, cid)
                    demoted.append({"id": cid, "title": title, "account_id": aid})
                    # Create furniture ledger
                    new_led = psd.create_campaign(
                        cur,
                        iid,
                        title=book_title,
                        activate=True,
                        account_id=aid,
                        is_default=True,
                        is_ledger=True,
                        starts_at=row.get("starts_at"),
                    )
                    ledgers_made.append(
                        {
                            "id": int(new_led["id"]),
                            "title": new_led["title"],
                            "account_id": aid,
                            "for_demoted": cid,
                        }
                    )
                else:
                    # Another ledger already exists (or ensure created one)
                    cur.execute(
                        """UPDATE member_practice_campaigns
                           SET is_ledger = 0, is_default = 0, account_id = NULL
                           WHERE id = %s AND identity_id = %s""",
                        (cid, iid),
                    )
                    ensure_six_controls(cur, iid, cid)
                    demoted.append(
                        {
                            "id": cid,
                            "title": title,
                            "account_id": aid,
                            "kept_ledger": lid,
                        }
                    )
                    ledgers_made.append(
                        {
                            "id": lid,
                            "title": ledger.get("title"),
                            "account_id": aid,
                            "for_demoted": cid,
                            "existing": True,
                        }
                    )

            # --- B: all charters — account free + six seeds ---
            cur.execute(
                """SELECT id, identity_id, account_id FROM member_practice_campaigns
                   WHERE is_ledger = 0"""
            )
            for row in cur.fetchall() or []:
                cid = int(row["id"])
                iid = int(row["identity_id"])
                if row.get("account_id") is not None and not dry_run:
                    cur.execute(
                        """UPDATE member_practice_campaigns
                           SET account_id = NULL
                           WHERE id = %s AND identity_id = %s AND is_ledger = 0""",
                        (cid, iid),
                    )
                    cleared_account.append(cid)
                if dry_run:
                    seeded.append(cid)
                    continue
                before = _bound_count(cur, cid)
                ensure_six_controls(cur, iid, cid)
                after = _bound_count(cur, cid)
                if after > before or after >= 6:
                    seeded.append(cid)

    return {
        "demoted": demoted,
        "ledgers_made": ledgers_made,
        "seeded_charter_ids": seeded,
        "cleared_account_ids": cleared_account,
        "dry_run": dry_run,
    }


def _bound_count(cur, campaign_id: int) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_practice_campaign_bounds
           WHERE campaign_id = %s AND role = 'boundary'""",
        (campaign_id,),
    )
    return int((cur.fetchone() or {}).get("n") or 0)


def main(argv: list[str]) -> int:
    dry = "--dry-run" in argv
    report = heal(dry_run=dry)
    print("heal_campaigns_v13", "DRY RUN" if dry else "APPLIED")
    print(f"  demoted seasons: {len(report['demoted'])}")
    for d in report["demoted"]:
        print(f"    - {d}")
    print(f"  ledgers ensured: {len(report['ledgers_made'])}")
    for L in report["ledgers_made"]:
        print(f"    - {L}")
    print(f"  charters seeded/checked: {len(report['seeded_charter_ids'])}")
    print(f"  account_id cleared on: {report['cleared_account_ids']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
