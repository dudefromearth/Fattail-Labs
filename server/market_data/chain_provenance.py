"""Chain generation provenance — Market Bus MB-P2.

``stale`` uses ``live_marks.stale_seconds()`` (same threshold as underlier marks).
``epoch_quality`` uses ``opf.generation.build_epoch`` (same function as PackageQuote).
No third definition. ``content_hash`` is not recomputed here.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from market_data.live_marks import stale_seconds
from opf.generation import ContractStore, build_epoch


class ChainProvenanceError(Exception):
    """Named fail-loud when a chain document cannot carry provenance."""

    code = "CHAIN_PROVENANCE"


def _write_unix(payload: dict[str, Any]) -> float | None:
    ts = payload.get("fetched_at_unix")
    if isinstance(ts, (int, float)) and ts > 0:
        return float(ts)
    as_of = payload.get("as_of") or payload.get("fetched_at")
    if not as_of:
        return None
    try:
        s = str(as_of).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    except ValueError as exc:
        raise ChainProvenanceError(f"chain as_of unparseable: {as_of!r}") from exc


def chain_is_stale(payload: dict[str, Any], *, now: float | None = None) -> bool:
    """Same boolean as underlier marks: age vs ``stale_seconds()``."""
    ts = _write_unix(payload)
    if ts is None:
        raise ChainProvenanceError(
            "chain document lacks fetched_at_unix / as_of for stale"
        )
    age_s = max(0.0, float(now if now is not None else time.time()) - ts)
    return age_s > float(stale_seconds())


def chain_epoch_quality(payload: dict[str, Any]) -> str:
    """Same ``epoch_quality`` as OPF ``build_epoch`` on this generation."""
    store = ContractStore()
    gen = store.from_ladder_payload(payload)
    epoch = build_epoch([gen], spot=payload.get("spot"))
    q = epoch.get("epoch_quality")
    if not q:
        raise ChainProvenanceError("build_epoch returned empty epoch_quality")
    return str(q)


def apply_chain_provenance(
    payload: dict[str, Any],
    *,
    now: float | None = None,
) -> dict[str, Any]:
    """Mutate payload: set ``stale`` and ``epoch_quality``. Does not touch content_hash."""
    if not isinstance(payload, dict):
        raise ChainProvenanceError("ladder document is not an object")
    payload["epoch_quality"] = chain_epoch_quality(payload)
    payload["stale"] = chain_is_stale(payload, now=now)
    if not isinstance(payload.get("stale"), bool) or not payload.get("epoch_quality"):
        raise ChainProvenanceError("chain provenance incomplete after apply")
    return payload


def provenance_wire(payload: dict[str, Any], *, now: float | None = None) -> dict[str, Any]:
    """Fields for WS / HTTP envelopes. Fail loud if they cannot be computed."""
    apply_chain_provenance(payload, now=now)
    return {
        "stale": payload["stale"],
        "epoch_quality": payload["epoch_quality"],
    }
