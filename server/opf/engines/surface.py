"""Surface geometry: total variance vs log-moneyness + butterfly/calendar arb (OPF24 · §6.5)."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any


class SurfaceFitError(Exception):
    """Fit failed — fail loud, no silent bad surface."""


@dataclass
class SurfaceSlice:
    tau: float
    points: list[tuple[float, float]]  # (k=log(K/F), w=sigma^2 * T)


@dataclass
class Surface:
    slices: list[SurfaceSlice] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)

    def iv(self, strike: float, forward: float, tau: float) -> float:
        if forward <= 0 or strike <= 0 or tau <= 0:
            raise SurfaceFitError("invalid strike/forward/tau for surface IV")
        k = math.log(strike / forward)
        w = self._w_at(k, tau)
        if w < 0:
            raise SurfaceFitError(f"negative total variance w={w}")
        return math.sqrt(w / tau)


def build_surface_from_chain(
    rows: list[dict[str, Any]],
    *,
    spot: float,
    tau: float,
    r: float = 0.0,
    q: float = 0.0,
) -> Surface:
    """Build single-expiry slice from chain IV rows; enforce butterfly convexity."""
    if tau <= 0:
        raise SurfaceFitError("tau must be positive")
    F = spot * math.exp((r - q) * tau)
    pts: list[tuple[float, float, float]] = []  # k, w, strike
    for row in rows:
        iv = row.get("iv")
        strike = row.get("strike")
        if iv is None or strike is None:
            continue
        iv_f = float(iv)
        K = float(strike)
        if iv_f <= 0 or K <= 0:
            continue
        k = math.log(K / F)
        w = iv_f * iv_f * tau
        pts.append((k, w, K))
    if len(pts) < 3:
        raise SurfaceFitError(f"need >=3 IV points for surface fit, got {len(pts)}")
    pts.sort(key=lambda t: t[0])
    # butterfly: discrete convexity of w in k (approx) — second differences of w
    ws = [p[1] for p in pts]
    ks = [p[0] for p in pts]
    _check_butterfly(ks, ws)
    slice_ = SurfaceSlice(tau=tau, points=[(p[0], p[1]) for p in pts])
    return Surface(slices=[slice_], meta={"forward": F, "spot": spot, "tau": tau})


def merge_slices(slices: list[SurfaceSlice]) -> Surface:
    """Multi-exp surface; enforce calendar arb w non-decreasing in T at fixed k."""
    if not slices:
        raise SurfaceFitError("no slices")
    ordered = sorted(slices, key=lambda s: s.tau)
    # sample common k grid from first slice
    if len(ordered) >= 2:
        _check_calendar_arb(ordered)
    return Surface(slices=ordered, meta={"n_slices": len(ordered)})


def _check_butterfly(ks: list[float], ws: list[float]) -> None:
    for i in range(1, len(ws) - 1):
        # rough discrete convexity: w[i] <= lerp(w[i-1], w[i+1])
        k0, k1, k2 = ks[i - 1], ks[i], ks[i + 1]
        if k2 <= k0:
            continue
        t = (k1 - k0) / (k2 - k0)
        w_lin = ws[i - 1] * (1 - t) + ws[i + 1] * t
        # allow tiny numerical slack
        if ws[i] > w_lin + 1e-6:
            raise SurfaceFitError(
                f"butterfly arb: w not convex at k={k1:.6f} (w={ws[i]:.6g} > lin={w_lin:.6g})"
            )


def _check_calendar_arb(slices: list[SurfaceSlice]) -> None:
    """At fixed k (nearest), w must be non-decreasing in T."""
    # use k nodes from shortest slice
    base = slices[0]
    for k, w0 in base.points:
        prev_w = w0
        prev_t = base.tau
        for sl in slices[1:]:
            w = _interp_w(sl.points, k)
            if w + 1e-8 < prev_w:
                raise SurfaceFitError(
                    f"calendar arb: w decreased at k={k:.6f}: "
                    f"T={prev_t:.6g} w={prev_w:.6g} → T={sl.tau:.6g} w={w:.6g}"
                )
            prev_w = w
            prev_t = sl.tau


def _interp_w(points: list[tuple[float, float]], k: float) -> float:
    if not points:
        raise SurfaceFitError("empty slice")
    pts = sorted(points, key=lambda p: p[0])
    if k <= pts[0][0]:
        return pts[0][1]
    if k >= pts[-1][0]:
        return pts[-1][1]
    for i in range(len(pts) - 1):
        k0, w0 = pts[i]
        k1, w1 = pts[i + 1]
        if k0 <= k <= k1:
            if k1 == k0:
                return w0
            t = (k - k0) / (k1 - k0)
            return w0 * (1 - t) + w1 * t
    return pts[-1][1]


# Attach method
def _w_at(self: Surface, k: float, tau: float) -> float:
    if not self.slices:
        raise SurfaceFitError("empty surface")
    ordered = sorted(self.slices, key=lambda s: s.tau)
    if tau <= ordered[0].tau:
        return _interp_w(ordered[0].points, k)
    if tau >= ordered[-1].tau:
        return _interp_w(ordered[-1].points, k)
    for i in range(len(ordered) - 1):
        s0, s1 = ordered[i], ordered[i + 1]
        if s0.tau <= tau <= s1.tau:
            w0 = _interp_w(s0.points, k)
            w1 = _interp_w(s1.points, k)
            if s1.tau == s0.tau:
                return w0
            # linear in calendar T on w (Spec §6.5)
            t = (tau - s0.tau) / (s1.tau - s0.tau)
            return w0 * (1 - t) + w1 * t
    return _interp_w(ordered[-1].points, k)


Surface._w_at = _w_at  # type: ignore[attr-defined]
