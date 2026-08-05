"""Deterministic stub option chain (labeled data proxy)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def build_stub_chain(
    *,
    underlying: str = "SPX",
    spot: float = 5000.0,
    dte: int = 0,
) -> dict[str, Any]:
    """Synthetic strikes around spot for construct/rank without a live provider."""
    asof = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    # 5-point grid for index-like underlyings
    step = 5.0 if spot >= 1000 else 1.0
    strikes: list[float] = []
    center = round(spot / step) * step
    for i in range(-20, 21):
        strikes.append(center + i * step)

    def _call_mid(k: float) -> float:
        # Crude extrinsic + intrinsic for debit construction
        intrinsic = max(0.0, spot - k)
        otm = max(0.0, k - spot)
        return max(0.05, intrinsic * 0.5 + 0.15 * step + max(0.0, 8.0 - otm / step) * 0.4)

    def _put_mid(k: float) -> float:
        intrinsic = max(0.0, k - spot)
        otm = max(0.0, spot - k)
        return max(0.05, intrinsic * 0.5 + 0.15 * step + max(0.0, 8.0 - otm / step) * 0.4)

    calls = {str(k): {"mid": round(_call_mid(k), 4), "bid": 0.0, "ask": 0.0} for k in strikes}
    puts = {str(k): {"mid": round(_put_mid(k), 4), "bid": 0.0, "ask": 0.0} for k in strikes}
    for k in strikes:
        m = calls[str(k)]["mid"]
        calls[str(k)]["bid"] = round(m * 0.95, 4)
        calls[str(k)]["ask"] = round(m * 1.05, 4)
        m = puts[str(k)]["mid"]
        puts[str(k)]["bid"] = round(m * 0.95, 4)
        puts[str(k)]["ask"] = round(m * 1.05, 4)

    return {
        "underlying": underlying,
        "spot": spot,
        "asof": asof,
        "dte": dte,
        "strike_step": step,
        "strikes": strikes,
        "calls": calls,
        "puts": puts,
        "provenance": {
            "source": "stub",
            "label": "Phase-1 deterministic stub chain (not live market)",
            "asof": asof,
        },
    }
