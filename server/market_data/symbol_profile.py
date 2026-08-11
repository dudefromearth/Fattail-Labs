"""Resolved per-symbol app profile — single config surface for Labs apps.

Source of truth columns live on ``market_symbol_universe``; optional
``app_profile_json`` overrides kind defaults. Apps must not hardcode SPX-only
fly widths / wings when a profile is available.
"""

from __future__ import annotations

from typing import Any


_MSC_SPX_WIDTHS = [20, 25, 30, 35, 40, 45, 50]


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        x = float(v)
        return x if x > 0 else None
    except (TypeError, ValueError):
        return None


def _i(v: Any, default: int) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def kind_defaults(kind: str) -> dict[str, Any]:
    k = (kind or "equity").strip().lower()
    if k == "index":
        return {
            "default_wings": 25,
            "fly_width_mode": "msc_spx",
            "fly_width_count": 7,
            "fly_widths": list(_MSC_SPX_WIDTHS),
            "fetch_step_floor": 5.0,
            "contract_multiplier": 100,
            "supports_options": True,
            "default_view_side": "call",
            "heatmap_default_template": "sym-fly",
            "ohlc_default_tf": "1d",
            "strike_step_default": 5.0,
        }
    if k == "etf":
        return {
            "default_wings": 25,
            "fly_width_mode": "step_multiples",
            "fly_width_count": 8,
            "fly_widths": None,
            "fetch_step_floor": 2.5,
            "contract_multiplier": 100,
            "supports_options": True,
            "default_view_side": "call",
            "heatmap_default_template": "sym-fly",
            "ohlc_default_tf": "1d",
            "strike_step_default": 1.0,
        }
    # equity and other
    return {
        "default_wings": 25,
        "fly_width_mode": "step_multiples",
        "fly_width_count": 8,
        "fly_widths": None,
        "fetch_step_floor": 2.5,
        "contract_multiplier": 100,
        "supports_options": True,
        "default_view_side": "call",
        "heatmap_default_template": "sym-fly",
        "ohlc_default_tf": "1d",
        "strike_step_default": 1.0,
    }


def resolve_symbol_profile(row: dict[str, Any] | None, *, symbol: str = "SPX") -> dict[str, Any]:
    """Merge universe row + app_profile_json + kind defaults → app-facing profile."""
    row = row or {}
    sym = str(row.get("symbol") or symbol or "SPX").strip().upper()
    kind = str(row.get("kind") or "equity").strip().lower()
    base = kind_defaults(kind)
    raw = row.get("app_profile_json")
    if isinstance(raw, str):
        import json

        try:
            raw = json.loads(raw)
        except (TypeError, ValueError):
            raw = None
    overlay = raw if isinstance(raw, dict) else {}

    strike_step = _f(row.get("strike_step"))
    if strike_step is None:
        strike_step = _f(overlay.get("strike_step")) or _f(base.get("strike_step_default"))

    mode = str(overlay.get("fly_width_mode") or base["fly_width_mode"]).strip().lower()
    if mode not in ("msc_spx", "step_multiples", "fixed_points"):
        mode = str(base["fly_width_mode"])

    widths = overlay.get("fly_widths")
    if not isinstance(widths, list) or not widths:
        widths = base.get("fly_widths")
    if isinstance(widths, list):
        try:
            widths = [float(w) for w in widths if float(w) > 0]
        except (TypeError, ValueError):
            widths = list(_MSC_SPX_WIDTHS) if mode == "msc_spx" else None
    else:
        widths = list(_MSC_SPX_WIDTHS) if mode == "msc_spx" else None

    count = _i(overlay.get("fly_width_count"), int(base["fly_width_count"]))
    count = max(1, min(12, count))

    # Compute concrete fly width list for clients
    if mode == "msc_spx" or (widths and mode != "step_multiples"):
        fly_widths = widths or list(_MSC_SPX_WIDTHS)
    else:
        step = strike_step or 1.0
        fly_widths = [round(step * i, 4) for i in range(1, count + 1)]

    side = str(overlay.get("default_view_side") or base["default_view_side"]).lower()
    if side not in ("call", "put"):
        side = "call"

    tpl = str(
        overlay.get("heatmap_default_template") or base["heatmap_default_template"]
    ).strip()
    if not tpl:
        tpl = "sym-fly"

    supports = overlay.get("supports_options")
    if supports is None:
        supports = base["supports_options"]
    supports = bool(supports)

    mult = _i(overlay.get("contract_multiplier"), int(base["contract_multiplier"]))
    if mult not in (1, 100):
        mult = 100 if supports else 1

    wings = _i(overlay.get("default_wings"), int(base["default_wings"]))
    wings = max(5, min(50, wings))

    floor = _f(overlay.get("fetch_step_floor")) or _f(base["fetch_step_floor"]) or 2.5

    return {
        "symbol": sym,
        "kind": kind,
        "role": str(row.get("role") or "tradeable"),
        "feed_symbol": row.get("feed_symbol"),
        "proxy_symbol": row.get("proxy_symbol"),
        "options_cadence": row.get("options_cadence") or "",
        "note": row.get("note") or "",
        "enabled": bool(row.get("enabled", True)),
        "strike_step": strike_step,
        "default_wings": wings,
        "fly_width_mode": mode,
        "fly_width_count": count,
        "fly_widths": fly_widths,
        "fetch_step_floor": floor,
        "contract_multiplier": mult,
        "supports_options": supports,
        "default_view_side": side,
        "heatmap_default_template": tpl,
        "ohlc_default_tf": str(overlay.get("ohlc_default_tf") or base["ohlc_default_tf"]),
        "source": "market_symbol_universe",
    }


def attach_profiles(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Mutate/copy rows with ``profile`` key for API responses."""
    out = []
    for r in rows:
        row = dict(r)
        row["profile"] = resolve_symbol_profile(row, symbol=str(row.get("symbol") or ""))
        out.append(row)
    return out
