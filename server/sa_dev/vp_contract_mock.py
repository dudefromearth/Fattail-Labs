"""Byte-shaped VP API Contract v1.1 mock. Fixtures F1, F2, F5, F8 + STALE + coverage.

SoR: Specs/VP-API-Contract-v1_1.md sha1 d01b3dd9bfbac3bbcafb34110ef7d06cd6650915
(supersedes v1.0 b403937af18140eb7900ccfa72437e7f3e9bc5aa).
Numbers from seated VP v0.6 §10 (v0.6.1 cited by the parent spec).
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

AS_OF_NS = 1789660800000000000
COMPUTED_NS = 1789660815000000000

# F1 expected histogram (VP v0.6 §10).
F1_BINS: list[dict[str, int | float]] = [
    {"price": 640.00, "volume": 5},
    {"price": 640.10, "volume": 7},
    {"price": 640.20, "volume": 7},
    {"price": 640.30, "volume": 4},
]
F1_GAP = {"from_ns": 100_000_000, "to_ns": 200_000_000, "cause": "DISCONNECT"}

# F2: F1 tape minus 640.20-bin prints; zero row kept.
F2_BINS: list[dict[str, int | float]] = [
    {"price": 640.00, "volume": 5},
    {"price": 640.10, "volume": 7},
    {"price": 640.20, "volume": 0},
    {"price": 640.30, "volume": 4},
]

# F5: 6-min hole; eligible volume 4 at 640.00 (engine golden).
F5_BINS: list[dict[str, int | float]] = [
    {"price": 640.00, "volume": 4},
]
F5_GAP = {
    "from_ns": 50_000_000,
    "to_ns": 50_000_000 + 6 * 60 * 1_000_000_000,
    "cause": "DISCONNECT",
}

# F4 source-space ES rows — STALE mapping example (bins still served).
STALE_BINS: list[dict[str, int | float]] = [
    {"price": 6558.25, "volume": 100},
    {"price": 6558.50, "volume": 150},
    {"price": 6558.75, "volume": 120},
    {"price": 6559.00, "volume": 80},
]

ENVELOPE_KEYS = (
    "target_symbol",
    "source",
    "kind",
    "session_date",
    "as_of",
    "computed_at",
    "profile_generation_id",
    "parameter_set_hash",
    "status",
    "flags",
    "gaps",
    "mapping",
    "vp_row",
    "bins",
    "coverage",
)

MAPPING_KEYS = (
    "ratio",
    "offset_published",
    "offset_fit",
    "fit_as_of",
    "residual_rmse",
    "sample_count",
    "mark_source",
)


def _mapping_spy() -> dict[str, Any]:
    return {
        "ratio": 1,
        "offset_published": 0.0,
        "offset_fit": 0.0,
        "fit_as_of": COMPUTED_NS,
        "residual_rmse": 0.0,
        "sample_count": 0,
        "mark_source": "fixture",
    }


def _mapping_stale() -> dict[str, Any]:
    return {
        "ratio": 1,
        "offset_published": 2.48,
        "offset_fit": 2.51,
        "fit_as_of": 1789660810000000000,
        "residual_rmse": 0.04,
        "sample_count": 213,
        "mark_source": "chainstore",
    }


def envelope(
    *,
    target_symbol: str,
    source: str,
    kind: str,
    session_date: str,
    status: str,
    bins: list[dict[str, int | float]],
    gaps: list[dict[str, Any]],
    mapping: dict[str, Any],
    flags_mapping: str,
    vp_row: float,
    generation: str,
    param_hash: str,
) -> dict[str, Any]:
    return {
        "target_symbol": target_symbol,
        "source": source,
        "kind": kind,
        "session_date": session_date,
        "as_of": AS_OF_NS,
        "computed_at": COMPUTED_NS,
        "profile_generation_id": generation,
        "parameter_set_hash": param_hash,
        "status": status,
        "flags": {"mapping": flags_mapping, "approximation": "none"},
        "gaps": deepcopy(gaps),
        "mapping": deepcopy(mapping),
        "vp_row": vp_row,
        "bins": deepcopy(bins),
        "coverage": {
            "floor_session": session_date.split("/")[0],
            "ceiling_session": session_date.split("/")[-1],
        },
    }


def f1(kind: str = "session") -> dict[str, Any]:
    return envelope(
        target_symbol="XSP",
        source="SPY",
        kind=kind,
        session_date="2026-09-16",
        status="GAPPED",
        bins=F1_BINS,
        gaps=[F1_GAP],
        mapping=_mapping_spy(),
        flags_mapping="OK",
        vp_row=0.10,
        generation="g-f1",
        param_hash="sha256:f1",
    )


def f2(kind: str = "session") -> dict[str, Any]:
    return envelope(
        target_symbol="XSP",
        source="SPY",
        kind=kind,
        session_date="2026-09-15",
        status="COMPLETE",
        bins=F2_BINS,
        gaps=[],
        mapping=_mapping_spy(),
        flags_mapping="OK",
        vp_row=0.10,
        generation="g-f2",
        param_hash="sha256:f2",
    )


def f5(kind: str = "session") -> dict[str, Any]:
    return envelope(
        target_symbol="XSP",
        source="SPY",
        kind=kind,
        session_date="2026-09-17",
        status="GAPPED",
        bins=F5_BINS,
        gaps=[F5_GAP],
        mapping=_mapping_spy(),
        flags_mapping="OK",
        vp_row=0.10,
        generation="g-f5",
        param_hash="sha256:f5",
    )


def stale(kind: str = "session") -> dict[str, Any]:
    return envelope(
        target_symbol="SPX",
        source="ES",
        kind=kind,
        session_date="2026-09-14",
        status="COMPLETE",
        bins=STALE_BINS,
        gaps=[],
        mapping=_mapping_stale(),
        flags_mapping="STALE",
        vp_row=0.25,
        generation="g-stale",
        param_hash="sha256:stale",
    )


def mes_unavailable(kind: str = "session") -> dict[str, Any]:
    return envelope(
        target_symbol="XSP",
        source="MES",
        kind=kind,
        session_date="2026-09-16",
        status="UNAVAILABLE",
        bins=[],
        gaps=[],
        mapping={
            "ratio": 0.1,
            "offset_published": 0.0,
            "offset_fit": 0.0,
            "fit_as_of": COMPUTED_NS,
            "residual_rmse": 0.0,
            "sample_count": 0,
            "mark_source": "fixture",
        },
        flags_mapping="FAILED",
        vp_row=0.25,
        generation="g-mes-unavail",
        param_hash="sha256:mes-unavail",
    )


def f8_range(price_lo: float | None = None, price_hi: float | None = None) -> dict[str, Any]:
    """Qualitative F8: two sessions (F2 + F1) summed. v0.6.1 numbers not on disk."""
    summed: dict[float, int] = {}
    for b in F2_BINS + F1_BINS:
        px = float(b["price"])
        summed[px] = summed.get(px, 0) + int(b["volume"])
    bins = [{"price": px, "volume": summed[px]} for px in sorted(summed)]
    if price_lo is not None:
        bins = [b for b in bins if float(b["price"]) >= price_lo]
    if price_hi is not None:
        bins = [b for b in bins if float(b["price"]) <= price_hi]
    return envelope(
        target_symbol="XSP",
        source="SPY",
        kind="range",
        session_date="2026-09-15/2026-09-16",
        status="GAPPED",
        bins=bins,
        gaps=[F1_GAP],
        mapping=_mapping_spy(),
        flags_mapping="OK",
        vp_row=0.10,
        generation="g-f8",
        param_hash="sha256:f8",
    )


MOCK_SPY_FLOOR = "2026-09-15"
MOCK_SPY_CEILING = "2026-09-17"


def health() -> dict[str, Any]:
    return {
        "collectors": {
            "SPY": {
                "live": False,
                "last_print_ns": 0,
                "coverage": {
                    "floor_session": MOCK_SPY_FLOOR,
                    "ceiling_session": MOCK_SPY_CEILING,
                    "sessions_binned": 3,
                },
            },
            "ES": {
                "live": False,
                "last_print_ns": 0,
                "coverage": {
                    "floor_session": "2026-09-14",
                    "ceiling_session": "2026-09-14",
                    "sessions_binned": 1,
                },
            },
            "MES": {
                "live": False,
                "last_print_ns": 0,
                "coverage": {
                    "floor_session": None,
                    "ceiling_session": None,
                    "sessions_binned": 0,
                },
            },
        },
        "gap_report": [F1_GAP, F5_GAP],
        "mapping_fit": {"SPX": "STALE", "XSP": "OK"},
        "backup_watch": "OK",
        "mock": True,
        "contract": "VP-API-Contract-v1_1",
    }


def range_below_coverage(from_date: str) -> tuple[int, dict[str, Any]]:
    return 422, {"error": "range_below_coverage", "coverage_floor": MOCK_SPY_FLOOR}


def resolve_profile(
    target_symbol: str,
    kind: str,
    *,
    source: str | None = None,
    session_date: str | None = None,
) -> dict[str, Any] | tuple[int, dict[str, Any]]:
    target = target_symbol.upper()
    if target not in ("SPX", "XSP"):
        return 404, {"error": "unknown_target"}
    if kind == "composite":
        return 404, {"error": "kind_fenced"}
    if kind not in ("session", "developing"):
        return 404, {"error": "unknown_kind"}

    if target == "SPX":
        if source not in (None, "ES"):
            return 404, {"error": "unknown_source"}
        return stale(kind)

    # XSP
    if source is None:
        return {"target_symbol": "XSP", "kind": kind, "entries": [f1(kind), mes_unavailable(kind)]}
    src = source.upper()
    if src == "MES":
        return mes_unavailable(kind)
    if src != "SPY":
        return 404, {"error": "unknown_source"}
    if session_date == "2026-09-15":
        return f2(kind)
    if session_date == "2026-09-17":
        return f5(kind)
    if session_date in (None, "2026-09-16"):
        return f1(kind)
    return 404, {"error": "unknown_session_date"}
