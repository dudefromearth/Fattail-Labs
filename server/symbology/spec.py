"""REQ-009 v0.2 — contract spec store, loader, grain, snap/format.

Pinned snapshots are the cited SoT. tick_value is computed. session_summary
is never stored (SPEC-12). Live scrape on this module is illegal (SPEC-14).
"""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import date
from pathlib import Path
from threading import Lock
from typing import Any

SNAPSHOT_DIR = Path(__file__).resolve().parent / "spec_snapshots"
STORED_FIELDS = (
    "symbol",
    "title",
    "spec_version",
    "as_of",
    "citation",
    "exchange",
    "product_codes",
    "tick_size",
    "big_point_value",
    "display_shape",
    "months",
    "periodicity",
    "settlement",
    "calendar_id",
)
FORBIDDEN_STORED = frozenset({"tick_value", "session_summary"})
# REQ-008 both-stops (16:15–16:30 ET and 17:00–18:00 ET) not yet resolving.
SESSIONS_BOTH_STOPS = False
GRANDFATHER_CHART_KIND = frozenset({"ES", "MES"})
# Cash / ETF titles live on the registry until the thin cash-index packet.
REGISTRY_TITLES: dict[str, str] = {
    "SPX": "S&P 500 Index",
    "XSP": "Mini-SPX Index",
    "SPY": "SPDR S&P 500 ETF Trust",
}


class SpecLoadRefused(Exception):
    """SPEC-14: loader is a CP-1 post-close StudioOne job."""


class SpecIncomplete(Exception):
    """Engine reason — not a SYM state (P0-4)."""


class SpecGrainMismatch(Exception):
    """Native histogram grain diverged from spec.tick_size."""


class BadAsOf(ValueError):
    pass


def _empty_store() -> dict[str, list[dict[str, Any]]]:
    return {}


_lock = Lock()
_versions: dict[str, list[dict[str, Any]]] = _empty_store()


def snapshot_paths() -> dict[str, Path]:
    return {p.stem.upper(): p for p in sorted(SNAPSHOT_DIR.glob("*.json"))}


def _read_snapshot(path: Path) -> dict[str, Any]:
    rec = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(rec, dict):
        raise ValueError(f"{path} is not an object")
    bad = FORBIDDEN_STORED.intersection(rec)
    if bad:
        raise ValueError(f"{path.name} stores forbidden fields {sorted(bad)}")
    missing = [k for k in STORED_FIELDS if k not in rec]
    if missing:
        raise ValueError(f"{path.name} missing {missing}")
    return rec


def _copy(rec: dict[str, Any]) -> dict[str, Any]:
    return deepcopy(rec)


def _parse_as_of(raw: str | None) -> date | None:
    if raw is None or str(raw).strip() == "":
        return None
    text = str(raw).strip()
    try:
        return date.fromisoformat(text[:10])
    except ValueError as exc:
        raise BadAsOf(f"as_of must be YYYY-MM-DD, got {text!r}") from exc


def spec_root_of(symbol: str) -> str:
    s = str(symbol or "").strip().upper()
    for root in ("MES", "ES", "ZB"):
        if s == root or s.startswith(root):
            return root
    return s


def _load_pinned_unlocked() -> None:
    store: dict[str, list[dict[str, Any]]] = {}
    for root, path in snapshot_paths().items():
        rec = _read_snapshot(path)
        rec["symbol"] = root
        store[root] = [_copy(rec)]
    global _versions
    _versions = store


def reset_specs_for_tests() -> None:
    with _lock:
        _load_pinned_unlocked()


def load_specs(*, session_open: bool) -> dict[str, Any]:
    """CP-1 post-close job. Re-reads pinned snapshots; appends a new version."""
    if session_open:
        raise SpecLoadRefused("spec loader is a CP-1 post-close job")
    loaded: list[str] = []
    with _lock:
        for root, path in snapshot_paths().items():
            rec = _read_snapshot(path)
            rec["symbol"] = root
            rows = _versions.setdefault(root, [])
            if rows and rows[-1] == rec:
                continue
            rows.append(_copy(rec))
            rows.sort(key=lambda r: str(r.get("as_of") or ""))
            loaded.append(root)
    return {"ok": True, "loaded": loaded, "roots": sorted(snapshot_paths())}


def install_version_for_tests(rec: dict[str, Any]) -> None:
    root = spec_root_of(str(rec["symbol"]))
    bad = FORBIDDEN_STORED.intersection(rec)
    if bad:
        raise ValueError(f"forbidden fields {sorted(bad)}")
    with _lock:
        rows = _versions.setdefault(root, [])
        rows.append(_copy(rec))
        rows.sort(key=lambda r: str(r.get("as_of") or ""))


def current_spec(symbol: str) -> dict[str, Any] | None:
    return spec_at(symbol, as_of=None)


def spec_at(symbol: str, *, as_of: str | date | None) -> dict[str, Any] | None:
    root = spec_root_of(symbol)
    want = _parse_as_of(as_of.isoformat() if isinstance(as_of, date) else as_of)
    with _lock:
        rows = list(_versions.get(root) or [])
    if not rows:
        return None
    if want is None:
        return _copy(rows[-1])
    eligible = [
        r for r in rows if date.fromisoformat(str(r["as_of"])[:10]) <= want
    ]
    if not eligible:
        return None
    return _copy(eligible[-1])


def tick_value_of(rec: dict[str, Any]) -> float:
    return float(rec["tick_size"]) * float(rec["big_point_value"])


def snap_price(price: float, rec: dict[str, Any]) -> float:
    """SPEC-15: integer tick counts. Never price / 0.03125 float loops."""
    shape = rec.get("display_shape") or {}
    if shape.get("kind") == "fractional":
        den = int((shape.get("fraction") or {})["denominator"])
        ticks = int(round(float(price) * den))
        return ticks / den
    tick = float(rec["tick_size"])
    n = int(round(float(price) / tick))
    return n * tick


def format_price(price: float, rec: dict[str, Any]) -> str:
    shape = rec.get("display_shape") or {}
    snapped = snap_price(price, rec)
    if shape.get("kind") == "fractional":
        frac = shape.get("fraction") or {}
        den = int(frac["denominator"])
        ticks = int(round(snapped * den))
        whole = ticks // den
        num = ticks % den
        width = int(frac.get("width") or 2)
        sep = str(frac.get("separator") or "'")
        return f"{whole}{sep}{num:0{width}d}"
    precision = int(shape.get("precision") or 2)
    return f"{snapped:.{precision}f}"


def calendar_resolving(rec: dict[str, Any] | None) -> bool:
    if not rec:
        return False
    if not rec.get("calendar_id"):
        return False
    return bool(SESSIONS_BOTH_STOPS)


def spec_complete(rec: dict[str, Any] | None) -> bool:
    if not rec:
        return False
    for key in STORED_FIELDS:
        if rec.get(key) in (None, "", [], {}):
            return False
    return True


def title_for_root(root: str) -> str:
    rec = current_spec(root)
    if rec and rec.get("title"):
        return str(rec["title"])
    return REGISTRY_TITLES.get(root, root)


def activation_state(
    root: str,
    *,
    kind: str,
    artifact: dict[str, Any] | None,
    now_iso: str,
) -> tuple[str, str | None]:
    """SPEC-5 ∘ SYM-9/10. Engine reason is not a SYM state (P0-4).

    Grandfather: ES/MES chart-kind keep standing without resolving calendar.
    """
    from symbology.service import row_state_from_artifact

    state = row_state_from_artifact(artifact, now_iso=now_iso)
    if state != "ACTIVE":
        return state, None
    rec = current_spec(root)
    if not spec_complete(rec):
        return "COMING", "SPEC INCOMPLETE"
    grandfather = kind == "chart" and spec_root_of(root) in GRANDFATHER_CHART_KIND
    if not calendar_resolving(rec) and not grandfather:
        return "COMING", "SPEC INCOMPLETE"
    return "ACTIVE", None


def grain_for(symbol: str) -> float:
    """Futures: spec.tick_size. SPY 0.10 remains VPS metadata (D7 split-author)."""
    root = spec_root_of(symbol)
    if root == "SPY":
        from market_data.vp_engine.coverage import VP_ROW

        if "SPY" not in VP_ROW:
            raise SpecIncomplete("SPY")
        return float(VP_ROW["SPY"])
    rec = current_spec(root)
    if rec is None or rec.get("tick_size") is None:
        raise SpecIncomplete(root)
    return float(rec["tick_size"])


def assert_native_grain(symbol: str, claimed: float | None) -> float:
    native = grain_for(symbol)
    if claimed is not None and abs(float(claimed) - native) > 1e-9:
        raise SpecGrainMismatch(
            f"{symbol} histogram vp_row={claimed} spec.tick_size={native}"
        )
    return native


def public_payload(
    rec: dict[str, Any],
    *,
    queried_symbol: str,
    state: str | None,
    roles: list[str] | None,
    member_visible: bool,
) -> dict[str, Any]:
    body: dict[str, Any] = {k: deepcopy(rec[k]) for k in STORED_FIELDS if k in rec}
    body["symbol"] = rec.get("symbol") or spec_root_of(queried_symbol)
    body["queried_symbol"] = queried_symbol
    body["tick_value"] = tick_value_of(rec)
    body["state"] = state
    body["roles"] = list(roles or [])
    body["member_visible"] = bool(member_visible)
    # SPEC-12: omit until REQ-008 both-stops resolve. Never a stored string.
    if calendar_resolving(rec):
        body["session_summary"] = None
    return body


def lookup_for_http(
    symbol: str,
    *,
    as_of: str | None,
    member_surface: bool,
) -> dict[str, Any] | None:
    rec = spec_at(symbol, as_of=as_of)
    if rec is None:
        return None
    visible = bool(rec.get("member_visible", True))
    if member_surface and not visible:
        return None
    from symbology import service

    strip = service.current_strip()
    token = str(symbol or "").strip().upper()
    row = service._row_by_symbol(strip, token)
    if row is None and token != spec_root_of(token):
        row = service._row_by_symbol(strip, spec_root_of(token))
    if row is None:
        state = None
        roles: list[str] = []
        row_visible = visible
    else:
        state = row.state
        roles = sorted(row.roles)
        row_visible = row.member_visible
        if member_surface and not row_visible:
            return None
    return public_payload(
        rec,
        queried_symbol=token,
        state=state,
        roles=roles,
        member_visible=visible if row is None else row_visible,
    )


_load_pinned_unlocked()
