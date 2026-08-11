"""Pack registry — default + alternate per use case (OPF13)."""

from __future__ import annotations

from typing import Any, Callable

from opf.packs import backtest, day_trade, outlook

PackFn = Callable[..., dict[str, Any]]

# pack_id -> runner
_PACKS: dict[str, dict[str, Any]] = {
    "day_trade.mark_hybrid@1.0.0": {
        "use_case": "day_trade",
        "role": "default",
        "run": day_trade.run_mark_hybrid,
    },
    "day_trade.surface@1.0.0": {
        "use_case": "day_trade",
        "role": "alternate",
        "run": day_trade.run_surface,
    },
    "outlook.scenario_surface@1.0.0": {
        "use_case": "outlook",
        "role": "default",
        "run": outlook.run_scenario_surface,
    },
    "outlook.dynamics@1.0.0": {
        "use_case": "outlook",
        "role": "alternate",
        "run": outlook.run_dynamics,
    },
    "backtest.chain_replay@1.0.0": {
        "use_case": "backtest",
        "role": "default",
        "run": backtest.run_chain_replay,
    },
    "backtest.surface_reconstruct@1.0.0": {
        "use_case": "backtest",
        "role": "alternate",
        "run": backtest.run_surface_reconstruct,
    },
}

_DEFAULTS = {
    "day_trade": "day_trade.mark_hybrid@1.0.0",
    "outlook": "outlook.scenario_surface@1.0.0",
    "backtest": "backtest.chain_replay@1.0.0",
}


def list_packs() -> list[dict[str, Any]]:
    return [
        {"pack_id": k, "use_case": v["use_case"], "role": v["role"]}
        for k, v in _PACKS.items()
    ]


def resolve_pack_id(use_case: str, pack_id: str | None = None) -> str:
    uc = (use_case or "").strip().lower()
    if uc not in _DEFAULTS:
        raise ValueError(f"unknown use_case: {use_case!r}; expected day_trade|outlook|backtest")
    if not pack_id:
        return _DEFAULTS[uc]
    pid = pack_id.strip()
    if pid not in _PACKS:
        # allow unversioned
        for k in _PACKS:
            if k.startswith(pid + "@") or k == pid:
                return k
        raise ValueError(f"unknown pack_id: {pack_id!r}")
    if _PACKS[pid]["use_case"] != uc:
        raise ValueError(f"pack {pid} is not for use_case {uc}")
    return pid


def get_pack(pack_id: str) -> dict[str, Any]:
    if pack_id not in _PACKS:
        raise ValueError(f"unknown pack_id: {pack_id!r}")
    return _PACKS[pack_id]
