"""Campaign Panel v1 — The Six Controls (blood-work surface).

Source: docs/Campaign-Panel-v1-The-Six-Controls.md
House-seeded boundary rows; members read; admin dials ranges.
"""

from __future__ import annotations

from typing import Any

from campaign_alignment import axis_extension

# Fixed six — order is display order (radar axes same order)
PANEL_ATTRIBUTES: tuple[str, ...] = (
    "win_rate",
    "risk_to_reward",
    "drawdown",
    "avg_win_loss",
    "profit_factor",
    "sharpe",
)

PANEL_LABELS: dict[str, str] = {
    "win_rate": "Win rate",
    "risk_to_reward": "Risk-to-reward (entry)",
    "drawdown": "Max drawdown (of peak)",
    "avg_win_loss": "Avg win/loss ratio",
    "profit_factor": "Profit factor",
    "sharpe": "Sharpe ratio",
}

# Seed acceptable + total ranges (Coach arbitrary starting bands)
PANEL_SEEDS: dict[str, dict[str, float | int | None]] = {
    "win_rate": {
        "range_low": 40.0,
        "range_high": 60.0,
        "display_low": 0.0,
        "display_high": 100.0,
        "n_floor": 20,
        "unit": "percent",
    },
    "risk_to_reward": {
        "range_low": 9.0,
        "range_high": 18.0,
        "display_low": 0.0,
        "display_high": 30.0,
        "n_floor": 10,
        "unit": "ratio",
    },
    "drawdown": {
        "range_low": 0.0,
        "range_high": 6.0,
        "display_low": 0.0,
        "display_high": 15.0,
        "n_floor": 10,
        "unit": "percent",
    },
    "avg_win_loss": {
        "range_low": 1.2,
        "range_high": 2.2,
        "display_low": 0.0,
        "display_high": 4.0,
        "n_floor": 10,
        "unit": "ratio",
    },
    "profit_factor": {
        "range_low": 1.3,
        "range_high": 2.5,
        "display_low": 0.0,
        "display_high": 5.0,
        "n_floor": 10,
        "unit": "ratio",
    },
    "sharpe": {
        "range_low": 2.0,
        "range_high": 6.0,
        "display_low": 0.0,
        "display_high": 10.0,
        "n_floor": 10,
        "unit": "ratio",
    },
}


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def ensure_six_controls(cur, identity_id: int, campaign_id: int) -> None:
    """Idempotent: insert missing house seeds for the six panel attributes."""
    import practice_spine_domain as psd

    row = psd._campaign_row(cur, identity_id, campaign_id)
    if bool(int(row.get("is_ledger") or 0)):
        return
    cur.execute(
        """SELECT attribute FROM member_practice_campaign_bounds
           WHERE identity_id = %s AND campaign_id = %s AND role = 'boundary'""",
        (identity_id, campaign_id),
    )
    have = {str(r["attribute"]) for r in cur.fetchall() or []}
    for attr in PANEL_ATTRIBUTES:
        if attr in have:
            continue
        seed = PANEL_SEEDS[attr]
        key = psd._export_key("bnd")
        cur.execute(
            """INSERT INTO member_practice_campaign_bounds
                 (identity_id, campaign_id, role, attribute, unit, basis, window_kind,
                  range_low, range_high, display_low, display_high,
                  is_critical, n_floor, export_key)
               VALUES (%s, %s, 'boundary', %s, %s, NULL, NULL,
                       %s, %s, %s, %s, 0, %s, %s)""",
            (
                identity_id,
                campaign_id,
                attr,
                seed.get("unit"),
                seed["range_low"],
                seed["range_high"],
                seed["display_low"],
                seed["display_high"],
                seed.get("n_floor"),
                key,
            ),
        )


def _bound_row_for_attr(
    cur, identity_id: int, campaign_id: int, attribute: str
) -> dict | None:
    cur.execute(
        """SELECT * FROM member_practice_campaign_bounds
           WHERE identity_id = %s AND campaign_id = %s
             AND role = 'boundary' AND attribute = %s
           ORDER BY id ASC LIMIT 1""",
        (identity_id, campaign_id, attribute),
    )
    return cur.fetchone()


def build_panel(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    as_of: str | None = None,
    can_edit: bool = False,
) -> dict:
    """Six controls + readings for blood-work panel. Ledger → error via caller."""
    import practice_spine_domain as psd

    row = psd._campaign_row(cur, identity_id, campaign_id)
    if bool(int(row.get("is_ledger") or 0)):
        raise psd.PracticeSpineError(
            404, "Ledger has no Campaign Panel (furniture, not charter)"
        )
    ensure_six_controls(cur, identity_id, campaign_id)

    # Outcome pointers = closed P&L stamped to this campaign in the term window.
    # Risk-to-reward is structural at entry: (width − risk) / risk — never win-rate.
    present = psd._utcnow().date().isoformat()
    as_of_day = (as_of or present)[:10]
    from_day, to_day = psd.campaign_term_window(row, as_of_day)
    pnls = psd._pnl_sample_as_of(
        cur,
        identity_id,
        campaign_id,
        to_day,
        from_day=from_day,
        to_day=to_day,
    )
    # Drawdown = % off peak of running capital (start capital + cum P&L).
    # Capital basis: campaign.starting_capital, else Reports default ($50k).
    from trade_log_domain.reports import resolve_starting_capital

    starting_capital = resolve_starting_capital(row.get("starting_capital"))
    stats = psd._stat_readings_from_pnls(pnls, starting_capital=starting_capital)
    r2r_avg, r2r_n = psd._structural_r2r_as_of(
        cur,
        identity_id,
        campaign_id,
        to_day,
        from_day=from_day,
        to_day=to_day,
    )
    stats["risk_to_reward"] = r2r_avg
    sample_n = len(pnls)

    controls: list[dict] = []
    for attr in PANEL_ATTRIBUTES:
        b = _bound_row_for_attr(cur, identity_id, campaign_id, attr)
        seed = PANEL_SEEDS[attr]
        if not b:
            continue
        lo = _f(b.get("range_low"))
        hi = _f(b.get("range_high"))
        dlo = _f(b.get("display_low"))
        dhi = _f(b.get("display_high"))
        if dlo is None:
            dlo = float(seed["display_low"])  # type: ignore[arg-type]
        if dhi is None:
            dhi = float(seed["display_high"])  # type: ignore[arg-type]
        n_floor = b.get("n_floor")
        if n_floor is None:
            n_floor = seed.get("n_floor") or 10
        try:
            n_floor_i = int(n_floor)
        except (TypeError, ValueError):
            n_floor_i = 10

        reading = stats.get(attr)
        if attr == "profit_factor" and reading is None and sample_n > 0:
            if any(p > 0 for p in pnls) and not any(p < 0 for p in pnls):
                reading = float(hi) if hi is not None else 10.0

        # R:R n = open fills with defined structure; outcomes use closed P&L n
        attr_n = r2r_n if attr == "risk_to_reward" else sample_n
        gathering = reading is None or attr_n < n_floor_i
        extension: float | None = None
        state = "gathering"
        if not gathering and reading is not None:
            extension = round(
                axis_extension("boundary", float(reading), lo, hi), 4
            )
            state = "in_range" if extension >= 0.999 else "out_of_range"

        controls.append(
            {
                "bound_id": int(b["id"]),
                "attribute": attr,
                "label": PANEL_LABELS.get(attr, attr),
                "role": "boundary",
                "range_low": lo,
                "range_high": hi,
                "display_low": dlo,
                "display_high": dhi,
                "n_floor": n_floor_i,
                "n": attr_n,
                "reading": reading,
                "extension": extension,
                "state": state,
                "unit": b.get("unit") or seed.get("unit"),
            }
        )

    return {
        "campaign_id": campaign_id,
        "as_of": as_of_day,
        "window_from": from_day,
        "window_to": to_day,
        "sample_n": sample_n,
        "r2r_sample_n": r2r_n,
        "can_edit": bool(can_edit),
        "controls": controls,
    }


def patch_control(
    cur,
    identity_id: int,
    campaign_id: int,
    attribute: str,
    *,
    range_low: Any = ...,
    range_high: Any = ...,
    display_low: Any = ...,
    display_high: Any = ...,
    n_floor: Any = ...,
) -> dict:
    """Admin (or caller-authorized) update of acceptable + display domain."""
    import practice_spine_domain as psd

    attr = (attribute or "").strip().lower()
    if attr not in PANEL_ATTRIBUTES:
        raise psd.PracticeSpineError(422, f"not a panel control: {attribute!r}")
    ensure_six_controls(cur, identity_id, campaign_id)
    b = _bound_row_for_attr(cur, identity_id, campaign_id, attr)
    if not b:
        raise psd.PracticeSpineError(404, "Bound not found")
    camp = psd._campaign_row(cur, identity_id, campaign_id)

    new_lo = (
        _f(b.get("range_low"))
        if range_low is ...
        else psd._parse_optional_float(range_low, "range_low")
    )
    new_hi = (
        _f(b.get("range_high"))
        if range_high is ...
        else psd._parse_optional_float(range_high, "range_high")
    )
    new_dlo = (
        _f(b.get("display_low"))
        if display_low is ...
        else psd._parse_optional_float(display_low, "display_low")
    )
    new_dhi = (
        _f(b.get("display_high"))
        if display_high is ...
        else psd._parse_optional_float(display_high, "display_high")
    )
    if n_floor is ...:
        new_nf = b.get("n_floor")
        try:
            new_nf = int(new_nf) if new_nf is not None else None
        except (TypeError, ValueError):
            new_nf = None
    elif n_floor is None or n_floor == "":
        new_nf = None
    else:
        try:
            new_nf = int(n_floor)
        except (TypeError, ValueError) as exc:
            raise psd.PracticeSpineError(422, "n_floor must be an integer") from exc

    old = {
        "range_low": _f(b.get("range_low")),
        "range_high": _f(b.get("range_high")),
        "display_low": _f(b.get("display_low")),
        "display_high": _f(b.get("display_high")),
    }
    cur.execute(
        """UPDATE member_practice_campaign_bounds
           SET range_low = %s, range_high = %s,
               display_low = %s, display_high = %s, n_floor = %s
           WHERE id = %s AND identity_id = %s""",
        (new_lo, new_hi, new_dlo, new_dhi, new_nf, int(b["id"]), identity_id),
    )
    if camp.get("signed_at") is not None and str(camp.get("status") or "") not in (
        "completed",
        "abandoned",
    ):
        psd._insert_amendment(
            cur,
            identity_id,
            campaign_id,
            field=f"bound.boundary.{attr}",
            old_value=old,
            new_value={
                "range_low": new_lo,
                "range_high": new_hi,
                "display_low": new_dlo,
                "display_high": new_dhi,
            },
        )
    return build_panel(cur, identity_id, campaign_id, can_edit=True)
