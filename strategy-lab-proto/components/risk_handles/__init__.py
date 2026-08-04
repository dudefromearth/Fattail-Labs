"""Embed full MSC Risk Graph via a tall, direct iframe + file data bridge.

Why not only postMessage: Streamlit CCv2 shadow DOM often never delivered chart
data, so the panel sat empty ("hidden"). Streamlit writes ``live-chart.json``;
the MSC UI polls it. Drag commits write ``live-drag.json`` for Streamlit to apply.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import streamlit as st

# risk_handles/__init__.py → parents[0]=risk_handles, [1]=components, [2]=strategy-lab-proto
_ROOT = Path(__file__).resolve().parents[2]
_PUBLIC = _ROOT / "msc-risk-graph-ui" / "public"
_CHART_FILE = _PUBLIC / "live-chart.json"
_DRAG_FILE = _PUBLIC / "live-drag.json"
_PANEL_HEIGHT = 900
_UI_URL = "http://127.0.0.1:5174/"


def write_live_chart(payload: dict[str, Any]) -> None:
    """Atomic-ish write of chart payload for the MSC UI poller."""
    _PUBLIC.mkdir(parents=True, exist_ok=True)
    tmp = _CHART_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload), encoding="utf-8")
    tmp.replace(_CHART_FILE)


def consume_live_drag() -> dict[str, Any] | None:
    """Read and clear a handle-drag commit written by the MSC UI."""
    if not _DRAG_FILE.exists():
        return None
    try:
        raw = _DRAG_FILE.read_text(encoding="utf-8")
        _DRAG_FILE.unlink(missing_ok=True)
        data = json.loads(raw)
        if isinstance(data, dict) and (
            data.get("type") == "strike_drag" or "offset" in data
        ):
            # normalize MSC field names
            if "grabbed_strike" not in data and "grabbedStrike" in data:
                data = {
                    "type": "strike_drag",
                    "grabbed_strike": data["grabbedStrike"],
                    "new_strike": data["grabbedStrike"] + float(data.get("offset") or 0),
                    "offset": float(data.get("offset") or 0),
                    "role": "auto",
                    "side": "auto",
                    "shift_key": bool(data.get("shiftKey") or data.get("shift_key")),
                    "ts": data.get("ts") or time.time(),
                }
            return data
    except Exception:  # noqa: BLE001
        try:
            _DRAG_FILE.unlink(missing_ok=True)
        except OSError:
            pass
    return None


def risk_handles_chart(
    data: dict[str, Any],
    *,
    key: str = "rg_handles",
    ui_url: str = _UI_URL,
    autofit_seq: int = 0,
    height: int = _PANEL_HEIGHT,
    **_ignored: Any,
) -> Any:
    """Show MSC Risk Graph full-bleed in Streamlit (direct iframe)."""
    chart = data.get("chart") if isinstance(data, dict) and "chart" in data else data
    if isinstance(chart, dict):
        write_live_chart(chart)

    # Stable iframe src — do NOT time-bust. Remounting the React app every few
    # seconds wipes PnLChart viewState (pan/zoom feel "disabled").
    # Only change the URL when the user explicitly requests Autofit.
    base = ui_url.rstrip("/") + "/"
    if autofit_seq:
        url = f"{base}?autofit={int(autofit_seq)}"
    else:
        url = base

    # Direct iframe — full width, tall (MSC panel needs real room)
    st.iframe(url, height=height)
    return None


# Back-compat name used by older app snippets
def consume_strike_drag(key: str = "rg_handles") -> dict[str, Any] | None:  # noqa: ARG001
    return consume_live_drag()


def to_msc_chart_payload(
    interactive: dict[str, Any],
    *,
    symbol: str = "SPY",
    dte: int = 0,
    structure: str = "long_butterfly",
    credit: float | None = None,
) -> dict[str, Any]:
    """Convert Python interactive_chart_data → MSC Risk Graph panel payload.

    Long-only: costBasisType debit, direction long. ``credit`` arg is debit premium.
    """
    from datetime import date, timedelta

    from engine.spec import normalize_structure

    prices = interactive.get("prices") or []
    exp = interactive.get("expiry_pnl") or []
    rt = interactive.get("realtime_pnl") or []
    expiration = [{"price": float(p), "pnl": float(v)} for p, v in zip(prices, exp)]
    theoretical = [{"price": float(p), "pnl": float(v)} for p, v in zip(prices, rt)]
    handles = interactive.get("handles") or []
    strikes = sorted({float(h["strike"]) for h in handles})
    spot = float(interactive.get("spot") or 100)
    iv = float(interactive.get("single_iv") or 0.2)
    one_sig = 2.0 * (iv * spot / (252.0**0.5))
    wing = float(interactive.get("wing") or 5)
    deb = float(credit if credit is not None else (interactive.get("credit") or 0))
    exp_date = (date.today() + timedelta(days=max(0, int(dte)))).isoformat()
    st = normalize_structure(structure)

    raw_legs = interactive.get("legs") or []
    legs: list[dict[str, Any]] = []
    if raw_legs:
        for lg in raw_legs:
            legs.append(
                {
                    "strike": float(lg["strike"]),
                    "expiration": exp_date,
                    "right": "put" if lg.get("right") == "put" else "call",
                    "quantity": int(lg.get("qty") or 0),
                    "implied_volatility": iv,
                }
            )
    else:
        for h in handles:
            # Long debit: body role "short" → qty > 0; wing → qty < 0
            default_qty = 1 if h.get("role") == "short" else -1
            qty = int(h.get("qty") if h.get("qty") is not None else default_qty)
            legs.append(
                {
                    "strike": float(h["strike"]),
                    "expiration": exp_date,
                    "right": (
                        "put"
                        if h.get("right") == "put" or h.get("side") == "put"
                        else "call"
                    ),
                    "quantity": qty,
                    "implied_volatility": iv,
                }
            )

    # Infer fly right from legs (all same right for classic butterfly)
    fly_right = "call"
    if st == "long_butterfly" and legs:
        fly_right = "put" if legs[0].get("right") == "put" else "call"
    elif st == "put_debit":
        fly_right = "put"

    pos_type = {
        "long_butterfly": "butterfly",
        "long_condor": "iron_condor",
        "put_debit": "vertical",
        "call_debit": "vertical",
    }.get(st, "custom")
    strat_kind = (
        "butterfly"
        if st == "long_butterfly" or pos_type == "butterfly"
        else (
            "vertical"
            if "debit" in st or pos_type == "vertical"
            else "condor"
        )
    )
    body = float(interactive.get("body") or spot)
    strategy = {
        "id": "labs-shape",
        "addedAt": 0,
        "visible": True,
        "strategy": strat_kind,
        "side": fly_right,
        "strike": body,
        "width": wing,
        "dte": int(dte),
        "expiration": exp_date,
        "debit": deb if deb > 0 else None,
        "symbol": symbol,
        "legs": legs,
        "positionType": pos_type,
        "direction": "long",
        "costBasis": deb if deb > 0 else None,
        "costBasisType": "debit",
        "quantity": 1,
    }
    return {
        "expiration": expiration,
        "theoretical": theoretical,
        "spot": spot,
        "strikes": strikes,
        "expirationBreakevens": [
            float(x) for x in (interactive.get("breakevens") or [])
        ],
        "theoreticalBreakevens": [
            float(x) for x in (interactive.get("breakevens") or [])
        ],
        "oneSigmaBandWidth": one_sig,
        "title": interactive.get("title") or "Risk Graph",
        "strategy": strategy,
        "symbol": symbol,
        "vix": 16.0,
    }
