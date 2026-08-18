"""SSR collector session map — config, not code.

Used only when LABS_SSR_HARDENING=1. Flag off ignores this file (poll-all).
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

RELOAD_EVERY_S = 60.0

CLOCK_PHASES = frozenset({"gth", "pre", "rth", "extended"})
NEVER_SCHEDULED = frozenset({"closed", "weekend"})
PHASE_ALIASES = {
    "gth": "gth",
    "premarket": "pre",
    "pre": "pre",
    "rth": "rth",
    "postmarket": "extended",
    "post": "extended",
    "extended": "extended",
}


def hardening_on() -> bool:
    return (os.environ.get("LABS_SSR_HARDENING") or "").strip() == "1"


def default_session_map_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "ssr" / "session-map.json"


def session_map_path() -> Path:
    raw = (os.environ.get("LABS_SSR_SESSION_MAP") or "").strip()
    if raw:
        return Path(raw).expanduser()
    return default_session_map_path()


def normalize_phase_token(raw: Any) -> str:
    token = str(raw or "").strip().lower()
    if token in NEVER_SCHEDULED:
        raise RuntimeError(
            f"session map must not schedule {token!r} (closed/weekend are never sessions)"
        )
    mapped = PHASE_ALIASES.get(token)
    if mapped is None:
        raise RuntimeError(f"unknown session-map phase {raw!r}")
    return mapped


def _normalize_phase_list(raw: Any, *, field: str) -> frozenset[str]:
    if not isinstance(raw, list) or not raw:
        raise RuntimeError(f"session map {field} must be a non-empty list of phases")
    out = {normalize_phase_token(item) for item in raw}
    return frozenset(out)


class SessionMap:
    """Parsed map with mtime reload. Load fails loud — never silent poll-all/none."""

    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        self._mtime: float | None = None
        self._loaded_at: float = 0.0
        self.version: int = 0
        self.timezone: str = ""
        self.default_phases: frozenset[str] = frozenset()
        self.by_symbol: dict[str, frozenset[str]] = {}

    def maybe_reload(self, *, now: float | None = None, force: bool = False) -> None:
        now_m = time.monotonic() if now is None else now
        try:
            st = self.path.stat()
        except OSError as exc:
            raise RuntimeError(
                f"LABS_SSR session map missing or unreadable: {self.path}"
            ) from exc
        if not self.path.is_file():
            raise RuntimeError(f"LABS_SSR session map is not a file: {self.path}")
        stale = self._mtime is None or (now_m - self._loaded_at) >= RELOAD_EVERY_S
        if force or stale or st.st_mtime != self._mtime:
            self._load()
            self._mtime = st.st_mtime
            self._loaded_at = now_m

    def _load(self) -> None:
        try:
            text = self.path.read_text(encoding="utf-8")
        except OSError as exc:
            raise RuntimeError(f"LABS_SSR session map unreadable: {self.path}") from exc
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"LABS_SSR session map invalid JSON: {self.path}") from exc
        if not isinstance(data, dict):
            raise RuntimeError(f"LABS_SSR session map must be a JSON object: {self.path}")
        version = data.get("version")
        if version != 1:
            raise RuntimeError(f"LABS_SSR session map version {version!r} != 1")
        tz = data.get("timezone")
        if tz != "America/New_York":
            raise RuntimeError(
                f"LABS_SSR session map timezone {tz!r} must be America/New_York"
            )
        default = _normalize_phase_list(
            data.get("default_phases"), field="default_phases"
        )
        raw_symbols = data.get("symbols")
        if raw_symbols is None:
            raw_symbols = {}
        if not isinstance(raw_symbols, dict):
            raise RuntimeError("LABS_SSR session map symbols must be an object")
        by_symbol: dict[str, frozenset[str]] = {}
        for name, phases in raw_symbols.items():
            sym = str(name or "").strip().upper()
            if not sym:
                raise RuntimeError("LABS_SSR session map has an empty symbol key")
            by_symbol[sym] = _normalize_phase_list(phases, field=f"symbols.{sym}")
        self.version = 1
        self.timezone = "America/New_York"
        self.default_phases = default
        self.by_symbol = by_symbol

    def phases_for(self, symbol: str) -> frozenset[str]:
        key = str(symbol or "").strip().upper()
        return self.by_symbol.get(key, self.default_phases)

    def in_session(self, symbol: str, clock_phase: str) -> bool:
        if clock_phase in NEVER_SCHEDULED:
            return False
        return clock_phase in self.phases_for(symbol)


def load_session_map(path: Path | None = None, *, force: bool = True) -> SessionMap:
    sm = SessionMap(path if path is not None else session_map_path())
    sm.maybe_reload(force=force)
    return sm
