"""LockController — package cost basis + freeze_iv/marks (OPF9–10 · §5.7)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal


LockSource = Literal["natural_mid", "user_limit", "tos_limit"]


@dataclass
class LockState:
    mode: Literal["unlocked", "locked"] = "unlocked"
    locked_at: str | None = None
    package_debit_per_share: float | None = None
    lock_source: LockSource | None = None
    generation_hashes_at_lock: dict[str, str] = field(default_factory=dict)
    freeze_iv: bool = False
    leg_iv_snapshot: dict[str, float] | None = None
    freeze_marks: bool = False
    leg_mark_snapshot: list[dict[str, Any]] | None = None

    def to_dict(self) -> dict[str, Any]:
        if self.mode == "unlocked":
            return {"mode": "unlocked"}
        return {
            "mode": "locked",
            "locked_at": self.locked_at,
            "package_debit_per_share": self.package_debit_per_share,
            "lock_source": self.lock_source,
            "generation_hashes_at_lock": dict(self.generation_hashes_at_lock),
            "freeze_iv": self.freeze_iv,
            "leg_iv_snapshot": dict(self.leg_iv_snapshot) if self.leg_iv_snapshot else None,
            "freeze_marks": self.freeze_marks,
            "leg_mark_snapshot": list(self.leg_mark_snapshot) if self.leg_mark_snapshot else None,
        }


class LockController:
    def __init__(self) -> None:
        self._locks: dict[str, LockState] = {}

    def get(self, strategy_id: str) -> LockState:
        return self._locks.get(strategy_id) or LockState(mode="unlocked")

    def lock_natural(
        self,
        strategy_id: str,
        package_quote: dict[str, Any],
        *,
        freeze_iv: bool = False,
        freeze_marks: bool = False,
    ) -> LockState:
        if not package_quote.get("complete"):
            raise ValueError("cannot lock natural on incomplete package")
        d = package_quote.get("package_debit_per_share")
        if d is None:
            raise ValueError("package_debit_per_share missing")
        # epoch ok check optional — caller enforces day_trade
        hashes = {}
        gens = package_quote.get("generations_used") or {}
        for exp, meta in gens.items():
            if isinstance(meta, dict) and meta.get("content_hash"):
                hashes[exp] = str(meta["content_hash"])

        leg_iv = None
        leg_marks = None
        if freeze_iv:
            leg_iv = {
                str(m["leg_id"]): float(m["iv"])
                for m in package_quote.get("leg_marks") or []
                if m.get("leg_id") is not None and m.get("iv") is not None
            }
        if freeze_marks:
            leg_marks = list(package_quote.get("leg_marks") or [])

        state = LockState(
            mode="locked",
            locked_at=datetime.now(tz=timezone.utc).isoformat(),
            package_debit_per_share=float(d),
            lock_source="natural_mid",
            generation_hashes_at_lock=hashes,
            freeze_iv=freeze_iv,
            leg_iv_snapshot=leg_iv,
            freeze_marks=freeze_marks,
            leg_mark_snapshot=leg_marks,
        )
        self._locks[strategy_id] = state
        return state

    def lock_limit(
        self,
        strategy_id: str,
        limit_per_share: float,
        *,
        source: LockSource = "user_limit",
        package_quote: dict[str, Any] | None = None,
        freeze_iv: bool = False,
        freeze_marks: bool = False,
    ) -> LockState:
        hashes: dict[str, str] = {}
        leg_iv = None
        leg_marks = None
        if package_quote:
            gens = package_quote.get("generations_used") or {}
            for exp, meta in gens.items():
                if isinstance(meta, dict) and meta.get("content_hash"):
                    hashes[exp] = str(meta["content_hash"])
            if freeze_iv:
                leg_iv = {
                    str(m["leg_id"]): float(m["iv"])
                    for m in package_quote.get("leg_marks") or []
                    if m.get("leg_id") is not None and m.get("iv") is not None
                }
            if freeze_marks:
                leg_marks = list(package_quote.get("leg_marks") or [])
        state = LockState(
            mode="locked",
            locked_at=datetime.now(tz=timezone.utc).isoformat(),
            package_debit_per_share=float(limit_per_share),
            lock_source=source,
            generation_hashes_at_lock=hashes,
            freeze_iv=freeze_iv,
            leg_iv_snapshot=leg_iv,
            freeze_marks=freeze_marks,
            leg_mark_snapshot=leg_marks,
        )
        self._locks[strategy_id] = state
        return state

    def edit_limit(self, strategy_id: str, limit_per_share: float) -> LockState:
        state = self.get(strategy_id)
        if state.mode != "locked":
            raise ValueError("edit_limit requires locked state")
        state.package_debit_per_share = float(limit_per_share)
        self._locks[strategy_id] = state
        return state

    def unlock(self, strategy_id: str) -> LockState:
        state = LockState(mode="unlocked")
        self._locks[strategy_id] = state
        return state


_controller: LockController | None = None


def get_lock_controller() -> LockController:
    global _controller
    if _controller is None:
        _controller = LockController()
    return _controller


def reset_lock_controller_for_tests() -> LockController:
    global _controller
    _controller = LockController()
    return _controller
