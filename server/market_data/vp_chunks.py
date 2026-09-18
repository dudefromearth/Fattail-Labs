"""Per-session gzipped OHLC chunks. Request path never scans print gzip."""

from __future__ import annotations

import gzip
import json
from datetime import date, datetime
from typing import Any

TFS = ("1m", "5m", "15m", "1h", "1d")
HORIZON_SESSIONS = 126
SOURCES = ("ES", "MES", "SPY")


def encode_chunk(obj: dict[str, Any]) -> bytes:
    return gzip.compress(json.dumps(obj, separators=(",", ":")).encode("utf-8"), 6)


def decode_chunk(blob: bytes) -> dict[str, Any]:
    return json.loads(gzip.decompress(blob).decode("utf-8"))


def chunk_key(source: str, tf: str, session: str) -> str:
    return f"ohlc:{source.upper()}:{tf}:{session}"


def parse_bound(raw: str | None) -> date | None:
    if not raw:
        return None
    text = str(raw).strip()
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


def assemble_bars(
    chunks: list[dict[str, Any]],
    *,
    from_d: date | None,
    to_d: date | None,
    adjust: dict[str, float] | None = None,
) -> tuple[list[dict[str, Any]], list[str], str | None, str]:
    """Concat session chunks. Missing sessions are omitted (honest).

    ``adjust`` is D6 back-adjust per session (current era = 0).
    """
    bars: list[dict[str, Any]] = []
    served: list[str] = []
    contract = None
    rule = "volume_only"
    for ch in chunks:
        iso = str(ch.get("session") or "")
        if from_d and iso and date.fromisoformat(iso) < from_d:
            continue
        if to_d and iso and date.fromisoformat(iso) > to_d:
            continue
        served.append(iso)
        contract = ch.get("contract") or contract
        rule = str(ch.get("lead_rule") or rule)
        delta = float((adjust or {}).get(iso) or 0.0)
        for b in ch.get("bars") or []:
            if not delta:
                bars.append(b)
                continue
            item = dict(b)
            for k in ("o", "h", "l", "c"):
                if k in item and item[k] is not None:
                    item[k] = float(item[k]) + delta
            bars.append(item)
    bars.sort(key=lambda b: int(b.get("t") or 0))
    return bars, served, contract, rule


def ns_bars(bars: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """v1.2: t is bar-open UTC ns. Chunks store t as unix ms."""
    out = []
    for b in bars:
        t = int(b.get("t") or 0)
        if t < 10**15:
            t = t * 1_000_000
        out.append({**b, "t": t})
    return out
