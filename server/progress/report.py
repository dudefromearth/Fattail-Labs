"""Progress report — assembles one payload for the admin page.

Reads the latest good snapshot per source, derives metrics, runs the projection
and the findings, and reports freshness per source. A missing or stale source
degrades that section only; it never fabricates a number.
"""

from __future__ import annotations

import datetime as dt
import logging
from decimal import Decimal

import db
from progress import metrics as M
from progress import refresh as R
from progress import projection as P
from progress import rules

log = logging.getLogger("labs.progress.report")

MONTHS = 6
SOURCES = ("woocommerce", "youtube", "activecampaign")


def load_params() -> dict:
    with db.transaction() as cur:
        cur.execute(
            "SELECT param_key, param_value, unit, label, hint, min_value, max_value, "
            "sort_order, updated_at, updated_by FROM progress_model_param "
            "ORDER BY sort_order, param_key"
        )
        rows = cur.fetchall()
    return {r["param_key"]: _row(r) for r in rows}


def _row(r: dict) -> dict:
    out = dict(r)
    for k in ("param_value", "min_value", "max_value"):
        if isinstance(out.get(k), Decimal):
            out[k] = float(out[k])
    return out


def _values(params: dict) -> dict[str, float]:
    return {k: v["param_value"] for k, v in params.items()}


def set_param(key: str, value: float, actor: str | None) -> dict:
    params = load_params()
    if key not in params:
        raise KeyError(key)
    spec = params[key]
    if not spec["min_value"] <= value <= spec["max_value"]:
        raise ValueError(
            f"{key} must be between {spec['min_value']} and {spec['max_value']}"
        )
    with db.transaction() as cur:
        cur.execute(
            "UPDATE progress_model_param SET param_value=%s, updated_at=%s, "
            "updated_by=%s WHERE param_key=%s",
            (value, dt.datetime.utcnow(), actor, key),
        )
    return load_params()[key]


def _freshness(values: dict[str, float], now: dt.datetime) -> tuple[dict, list[str]]:
    stale_after = dt.timedelta(hours=values.get("snapshot_stale_hours", 6))
    out: dict[str, dict] = {}
    stale: list[str] = []
    for name in SOURCES:
        attempt = R.last_attempt(name)
        good = R.latest(name)
        captured = good["captured_at"] if good else None
        age = (now - captured) if captured else None
        is_stale = captured is None or age > stale_after
        if is_stale:
            stale.append(name)
        out[name] = {
            "last_success": captured.isoformat() if captured else None,
            "age_minutes": round(age.total_seconds() / 60) if age else None,
            "stale": is_stale,
            "last_status": attempt["status"] if attempt else "never",
            "last_error": attempt["error"] if attempt else None,
        }
    return out, stale


def build(now: dt.datetime | None = None) -> dict:
    now = now or dt.datetime.utcnow()
    params = load_params()
    values = _values(params)
    freshness, stale = _freshness(values, now)

    woo = R.latest("woocommerce")
    yt = R.latest("youtube")
    ac = R.latest("activecampaign")

    report: dict = {
        "generated_at": now.isoformat(),
        "params": params,
        "freshness": freshness,
        "target": values.get("monthly_revenue_target"),
        "commerce": None,
        "reach": None,
        "campaigns": None,
        "projection": None,
        "findings": [],
    }

    ctx: dict = {
        "params": values, "stale_sources": stale, "observer_funnel": [],
        "churn_activator": [], "churn_navigator": [], "youtube_months": [],
        "campaign_months": [], "settles_at": None, "observers_needed": None,
        "observers_per_month": None,
    }

    if woo:
        p = woo["payload"]
        subs, orders, prices = p["subscriptions"], p["orders"], p["prices"]
        members = M.members_by_tier(subs)
        funnel = M.observer_funnel(subs, MONTHS, now)
        act_churn = M.churn_by_month(subs, "Activator", MONTHS, now)
        nav_churn = M.churn_by_month(subs, "Navigator", MONTHS, now)
        complete = [r for r in funnel if not r.get("partial")][-3:]
        observers_pm = (sum(r["signups"] for r in complete) / len(complete)) if complete else 0.0
        report["commerce"] = {
            "members": members,
            "prices": prices,
            "revenue": M.revenue_by_month(orders, MONTHS, now),
            "churn": {"Activator": act_churn, "Navigator": nav_churn},
            "funnel": funnel,
            "observer_term_days": M.observer_term_days(subs, now),
            "recurring_run_rate": M.recurring_run_rate(members, prices),
        }
        ctx.update(observer_funnel=funnel, churn_activator=act_churn,
                   churn_navigator=nav_churn, observers_per_month=observers_pm)

        inputs = P.ModelInputs(
            observers_per_month=observers_pm,
            upgrade_rate=max(values["observer_upgrade_rate"], 1e-9),
            annual_rate=values["observer_annual_rate"],
            navigator_share=values["upgrade_share_navigator"],
            activator_churn=values["activator_monthly_churn"],
            navigator_churn=values["navigator_monthly_churn"],
            observer_revenue=values["observer_revenue_per_signup"],
            activator_price=prices.get("Activator", 97.0),
            navigator_price=prices.get("Navigator", 267.0),
            annual_price=prices.get("Navigator Annual", 1997.0),
            start_activators=members.get("Activator", {}).get("paying", 0),
            start_navigators=members.get("Navigator", {}).get("paying", 0),
        )
        target = values["monthly_revenue_target"]
        settles = P.settles_at(inputs)
        needed = P.observers_needed_for(target, inputs) if target > 0 else None
        report["projection"] = {
            "settles_at": settles,
            "observers_per_month": round(observers_pm, 1),
            "observers_needed": needed,
            "observers_needed_per_day": round(needed / 30, 1) if needed else None,
            "months_to_target": P.months_to_target(inputs, target),
            "curve": [
                {"index": pt.index, "total": pt.total_cash, "activators": pt.activators,
                 "navigators": pt.navigators, "observer_cash": pt.observer_cash,
                 "annual_cash": pt.annual_cash}
                for pt in P.project(inputs, 24)
            ],
        }
        ctx.update(settles_at=settles, observers_needed=needed)

    if yt:
        p = yt["payload"]
        vids = p.get("videos", [])
        by_month: dict[str, dict] = {}
        for v in vids:
            key = v["published_at"][:7]
            b = by_month.setdefault(key, {"month": key, "livestream": 0, "long": 0,
                                          "short": 0, "video_views": 0})
            b[v["kind"] if v["kind"] != "livestream" else "livestream"] += 1
            b["video_views"] += v["views"]
        monthly = p.get("monthly", [])
        for row in monthly:
            row.update(by_month.get(row["month"], {}))
        report["reach"] = {"channel": p.get("channel"), "monthly": monthly,
                           "views_per_observer": values.get("views_per_observer")}
        ctx["youtube_months"] = monthly

    if ac:
        report["campaigns"] = ac["payload"].get("monthly", [])
        ctx["campaign_months"] = report["campaigns"]

    report["findings"] = rules.evaluate(ctx)
    return report
