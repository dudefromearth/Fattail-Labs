"""Risk Graph viewport — MSC autofitView + sticky viewState lineage.

MSC PnLChart keeps an independent ``viewState`` for pan/zoom.
Autofit only runs on load or when the user clicks Autofit — **not** on every
structure drag (which would widen X as the tent moves away from ATM).

Autofit priority (MarketSwarm ``autofitView.ts``):
  1. Center X on spot (ATM)
  2. Keep full structure (strikes / BEs) visible
  3. ~30% pad beyond content
  4. 1σ mode: 1σ band = 1/3 of viewport unless structure is wider
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Any, Iterable, Literal, Sequence

ViewportMode = Literal["autofit", "one_sigma", "wide"]

AUTOFIT_PAD_FRAC = 0.30
AUTOFIT_MIN_HALF_PTS = 5.0
ONE_SIGMA_MIN_VIEWPORT_FRAC = 1.0 / 3.0
STALE_SPOT_SPAN_MULT = 3.0
Y_PAD_FRAC = 0.12


@dataclass(frozen=True)
class Viewport:
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    center: float = 0.0
    x_tick: float = 1.0
    y_tick: float = 1.0
    mode: str = "sticky"
    one_sigma_band: float | None = None

    def to_dict(self) -> dict[str, float]:
        return {
            "x_min": float(self.x_min),
            "x_max": float(self.x_max),
            "y_min": float(self.y_min),
            "y_max": float(self.y_max),
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> "Viewport | None":
        if not d:
            return None
        try:
            x0, x1 = float(d["x_min"]), float(d["x_max"])
            y0, y1 = float(d["y_min"]), float(d["y_max"])
        except (KeyError, TypeError, ValueError):
            return None
        if not (math.isfinite(x0) and math.isfinite(x1) and x1 > x0):
            return None
        if not (math.isfinite(y0) and math.isfinite(y1) and y1 > y0):
            return None
        return cls(
            x_min=x0,
            x_max=x1,
            y_min=y0,
            y_max=y1,
            center=(x0 + x1) / 2.0,
            mode="sticky",
        )


def _nice_tick(range_val: float, target_ticks: int = 8) -> float:
    if range_val <= 0:
        return 1.0
    rough = range_val / target_ticks
    exponent = math.floor(math.log10(rough)) if rough > 0 else 0
    fraction = rough / (10**exponent) if rough > 0 else 1.0
    if fraction < 1.5:
        nice = 1.0
    elif fraction < 3.5:
        nice = 2.0
    elif fraction < 7.5:
        nice = 5.0
    else:
        nice = 10.0
    return nice * (10**exponent)


def _one_sigma_half(
    half: float,
    one_sigma_band: float | None,
    content_half: float,
) -> float:
    if one_sigma_band is None or not (one_sigma_band > 0) or not math.isfinite(one_sigma_band):
        return half
    target_half = one_sigma_band / (2.0 * ONE_SIGMA_MIN_VIEWPORT_FRAC)
    if content_half >= target_half:
        return max(half, content_half)
    return max(content_half, target_half)


def atm_centered_x(
    spot: float,
    content_prices: Sequence[float],
    *,
    pad_frac: float = AUTOFIT_PAD_FRAC,
    min_half_pts: float | None = None,
    one_sigma_band: float | None = None,
) -> tuple[float, float, float]:
    """Return (x_min, x_max, center) — MSC atmCenteredXRange."""
    min_half = float(
        min_half_pts if min_half_pts is not None else max(AUTOFIT_MIN_HALF_PTS, spot * 0.005)
    )
    pts = [p for p in content_prices if isinstance(p, (int, float)) and math.isfinite(p)]

    if not (spot > 0 and math.isfinite(spot)):
        if not pts:
            return 90.0, 110.0, 100.0
        mid = (min(pts) + max(pts)) / 2.0
        half = max((max(pts) - min(pts)) / 2.0, min_half) * (1.0 + pad_frac)
        half = _one_sigma_half(
            half, one_sigma_band, max((max(pts) - min(pts)) / 2.0, min_half)
        )
        return mid - half, mid + half, mid

    if not pts:
        half = max(min_half * 2, spot * 0.01)
        half = _one_sigma_half(half, one_sigma_band, min_half)
        return spot - half, spot + half, spot

    c_min, c_max = min(pts), max(pts)
    c_span = max(c_max - c_min, min_half)
    c_mid = (c_min + c_max) / 2.0
    center = spot
    if abs(spot - c_mid) > c_span * STALE_SPOT_SPAN_MULT:
        center = c_mid

    left = max(0.0, center - min(c_min, center))
    right = max(0.0, max(c_max, center) - center)
    content_half = max(left, right, min_half)
    half = content_half * (1.0 + pad_frac)
    half = _one_sigma_half(half, one_sigma_band, content_half)
    return center - half, center + half, center


def compute_viewport(
    *,
    spot: float,
    content_prices: Iterable[float],
    pnl_values: Iterable[float],
    mode: ViewportMode = "autofit",
    single_iv: float = 0.20,
    time_years: float = 1.0 / 365.0,
    y_pad_frac: float = Y_PAD_FRAC,
) -> Viewport:
    """Compute a fresh autofit viewport (MSC Autofit button)."""
    content = list(content_prices)
    pnls = [p for p in pnl_values if math.isfinite(p)]
    if not pnls:
        pnls = [-100.0, 100.0]

    t_scale = math.sqrt(max(time_years, 1.0 / 365.0) / (1.0 / 365.0))
    one_sig_band = 2.0 * (single_iv * spot / math.sqrt(252.0)) * t_scale

    if mode == "wide":
        one_sig = one_sig_band * 2.0
        pad = 0.50
    elif mode == "one_sigma":
        one_sig = one_sig_band
        pad = AUTOFIT_PAD_FRAC
    else:
        one_sig = one_sig_band
        pad = AUTOFIT_PAD_FRAC

    x_min, x_max, center = atm_centered_x(
        spot,
        content,
        pad_frac=pad,
        one_sigma_band=one_sig,
    )
    if mode == "one_sigma":
        target_half = one_sig_band / (2.0 * ONE_SIGMA_MIN_VIEWPORT_FRAC)
        content_half = max((abs(p - center) for p in content), default=target_half)
        half = max(content_half * (1.0 + pad), target_half)
        x_min, x_max = center - half, center + half

    y_lo, y_hi = min(pnls), max(pnls)
    y_span = y_hi - y_lo
    if y_span <= 0:
        y_span = max(abs(y_hi), 100.0)
    pad_y = y_span * y_pad_frac
    y_min, y_max = y_lo - pad_y, y_hi + pad_y

    return Viewport(
        x_min=x_min,
        x_max=x_max,
        y_min=y_min,
        y_max=y_max,
        center=center,
        x_tick=_nice_tick(x_max - x_min),
        y_tick=_nice_tick(y_max - y_min),
        mode=mode,
        one_sigma_band=one_sig_band,
    )


def resolve_viewport(
    *,
    spot: float,
    content_prices: Iterable[float],
    pnl_values: Iterable[float],
    mode: ViewportMode = "autofit",
    single_iv: float = 0.20,
    time_years: float = 1.0 / 365.0,
    sticky: Viewport | dict[str, Any] | None = None,
    force_autofit: bool = False,
) -> Viewport:
    """MSC viewState: reuse sticky box unless Autofit is requested.

    Handle drag must pass ``force_autofit=False`` and a sticky box so the
    horizontal scale does not jump when the structure moves.
    """
    if not force_autofit:
        locked = sticky if isinstance(sticky, Viewport) else Viewport.from_dict(sticky)
        if locked is not None:
            return locked
    return compute_viewport(
        spot=spot,
        content_prices=content_prices,
        pnl_values=pnl_values,
        mode=mode,
        single_iv=single_iv,
        time_years=time_years,
    )
