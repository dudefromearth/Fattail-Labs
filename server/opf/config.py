"""OPF config — fail loud on invalid values (Claude.md doctrine)."""

from __future__ import annotations

import os
from pathlib import Path


def _env(name: str, default: str | None = None) -> str | None:
    raw = os.environ.get(name)
    if raw is None or str(raw).strip() == "":
        return default
    return str(raw).strip()


def max_generation_interests() -> int:
    raw = _env("LABS_OPF_MAX_GENERATION_INTERESTS", "32")
    try:
        n = int(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise RuntimeError("LABS_OPF_MAX_GENERATION_INTERESTS must be an int") from exc
    if n < 1:
        raise RuntimeError("LABS_OPF_MAX_GENERATION_INTERESTS must be >= 1")
    return n


def max_skew_ms() -> int:
    raw = _env("LABS_OPF_MAX_SKEW_MS", "3000")
    try:
        n = int(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise RuntimeError("LABS_OPF_MAX_SKEW_MS must be an int") from exc
    if n < 0:
        raise RuntimeError("LABS_OPF_MAX_SKEW_MS must be >= 0")
    return n


def skew_mode() -> str:
    """Day-trade marks on epoch skew: fail_loud (default) | degrade."""
    m = (_env("LABS_OPF_SKEW_MODE", "fail_loud") or "fail_loud").lower()
    if m not in ("fail_loud", "degrade"):
        raise RuntimeError("LABS_OPF_SKEW_MODE must be fail_loud|degrade")
    return m


def t0_recon_tol_abs() -> float:
    raw = _env("LABS_OPF_T0_RECON_TOL_ABS", "1.0")
    try:
        return float(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise RuntimeError("LABS_OPF_T0_RECON_TOL_ABS must be a float") from exc


def t0_recon_tol_rel() -> float:
    raw = _env("LABS_OPF_T0_RECON_TOL_REL", "0.01")
    try:
        v = float(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise RuntimeError("LABS_OPF_T0_RECON_TOL_REL must be a float") from exc
    if v < 0:
        raise RuntimeError("LABS_OPF_T0_RECON_TOL_REL must be >= 0")
    return v


def archive_max_stale_ms() -> int:
    raw = _env("LABS_OPF_ARCHIVE_MAX_STALE_MS", "900000")  # 15 min
    try:
        n = int(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise RuntimeError("LABS_OPF_ARCHIVE_MAX_STALE_MS must be an int") from exc
    if n < 0:
        raise RuntimeError("LABS_OPF_ARCHIVE_MAX_STALE_MS must be >= 0")
    return n


def archive_root() -> Path:
    raw = _env("LABS_OPF_ARCHIVE_ROOT", None)
    if raw:
        return Path(raw)
    # Default: server/data/opf_archive relative to this package's server root
    return Path(__file__).resolve().parent.parent / "data" / "opf_archive"


def risk_free_rate_continuous() -> float:
    """Config SOFR proxy — continuous annualized (OPF21)."""
    raw = _env("LABS_OPF_RISK_FREE_RATE", "0.05")
    try:
        return float(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise RuntimeError("LABS_OPF_RISK_FREE_RATE must be a float") from exc


def rate_source() -> str:
    return _env("LABS_OPF_RATE_SOURCE", "config_sofr_proxy") or "config_sofr_proxy"
