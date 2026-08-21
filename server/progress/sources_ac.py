"""ActiveCampaign source — campaign sends, opens and clicks.

Read-only. Distinct from server/activecampaign.py, which only WRITES lead
contacts; that module is deliberately left untouched.

Campaigns are classified by audience size because that is what separates a
segment send from a full-list blast, and the two behave nothing alike: on this
account targeted sends open at 38-46% while blasts to the same list click at
under a fifth of a percent.
"""

from __future__ import annotations

import datetime as dt
import logging
import os

import httpx

log = logging.getLogger("labs.progress.ac")

BLAST_MIN_RECIPIENTS = 3000
PAGE = 100
MAX_PAGES = 20


class ACError(RuntimeError):
    """ActiveCampaign is unreachable or misconfigured."""


def _cfg() -> tuple[str, str]:
    base = os.environ.get("LABS_AC_API_URL", "").strip().rstrip("/")
    token = os.environ.get("LABS_AC_API_TOKEN", "").strip()
    if not (base and token):
        raise ACError("ActiveCampaign source needs LABS_AC_API_URL and LABS_AC_API_TOKEN")
    return base, token


def _int(row: dict, key: str) -> int:
    try:
        return int(row.get(key) or 0)
    except (TypeError, ValueError):
        return 0


def fetch(months: int = 8, now: dt.datetime | None = None) -> dict:
    base, token = _cfg()
    now = now or dt.datetime.utcnow()
    since = (dt.datetime(now.year, now.month, 1) - dt.timedelta(days=31 * months)).date()

    rows: list[dict] = []
    with httpx.Client(timeout=45, headers={"Api-Token": token}) as client:
        for page in range(MAX_PAGES):
            resp = client.get(f"{base}/api/3/campaigns", params={
                "limit": PAGE, "offset": page * PAGE, "orders[sdate]": "DESC"})
            if resp.status_code >= 400:
                raise ACError(f"campaigns returned HTTP {resp.status_code}")
            batch = resp.json().get("campaigns") or []
            if not batch:
                break
            rows.extend(batch)
            if len(batch) < PAGE:
                break

    campaigns = []
    for c in rows:
        sdate = (c.get("sdate") or "")[:10]
        if not sdate or sdate < since.isoformat():
            continue
        sent = _int(c, "send_amt")
        if sent <= 0:
            continue
        campaigns.append({
            "id": c.get("id"),
            "name": c.get("name") or "",
            "sent_on": sdate,
            "sent": sent,
            "unique_opens": _int(c, "uniqueopens"),
            "unique_clicks": _int(c, "uniquelinkclicks"),
            "unsubscribes": _int(c, "unsubscribes"),
            "kind": "blast" if sent >= BLAST_MIN_RECIPIENTS else "targeted",
        })

    this_month = now.strftime("%Y-%m")
    by_month: dict[str, dict] = {}
    for c in campaigns:
        key = c["sent_on"][:7]
        b = by_month.setdefault(key, {"month": key, "campaigns": 0, "blasts": 0,
                                      "sent": 0, "opens": 0, "clicks": 0})
        b["campaigns"] += 1
        b["blasts"] += 1 if c["kind"] == "blast" else 0
        b["sent"] += c["sent"]
        b["opens"] += c["unique_opens"]
        b["clicks"] += c["unique_clicks"]
    monthly = []
    for key in sorted(by_month):
        b = by_month[key]
        monthly.append({**b,
                        "open_rate": round(b["opens"] / b["sent"], 5) if b["sent"] else None,
                        "ctr": round(b["clicks"] / b["sent"], 5) if b["sent"] else None,
                        "partial": key == this_month})

    log.info("ac fetch: %d campaigns in window", len(campaigns))
    return {"campaigns": campaigns[:200], "monthly": monthly,
            "counts": {"campaigns": len(campaigns)}}
