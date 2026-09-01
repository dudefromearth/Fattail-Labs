#!/usr/bin/env python3
"""Plane-owned wings interest heartbeat (GP21 erratum).

Own supervised process — not server/main.py. Interest lives in Redis;
GP11's in-process mandate is the hydrator (ContractStore), not this.

Usage:
  .venv/bin/python -m opf.plane_interest
  .venv/bin/python -m opf.plane_interest --once

Law:
  - Heartbeat default 15 s, shorter than the 45 s interest grace.
  - LABS_OPF_PLANE_WINGS_TOPICS only. Wings-only. Empty = correct no-op.
  - Same mb:interest:{topic} key the member path writes. Attribution in
    sidecar mb:interest_src:{topic} = plane. Never a decorated topic.
  - Topic strings via bus_ladder_key() only (E3).
  - TTL-based: stop touching and keys expire inside the grace window.
    Process death self-heals; no delete-on-shutdown required.

Item 9 (API down while this process is up):
  Health-gate before every touch. GET http://127.0.0.1:{LABS_PORT}/api/health
  with a 2 s timeout. Non-200 / unreachable → skip this tick. Existing
  interest then expires via TTL (≤ 45 s) and chain_feed idles. Bound:
  one cheap SELECT 1 per heartbeat, not an accepted unbounded Massive
  cost. Empty topics never probe the API.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
import urllib.error
import urllib.request
from collections.abc import Callable
from typing import Any

from opf.keys import bus_ladder_key, parse_ladder_topic

SIDECAR_PREFIX = "mb:interest_src:"
SOURCE_PLANE = "plane"
DEFAULT_HEARTBEAT_S = 15.0
HEALTH_TIMEOUT_S = 2.0


class PlaneInterestConfigError(RuntimeError):
    pass


def heartbeat_s() -> float:
    raw = (os.environ.get("LABS_OPF_INTEREST_HEARTBEAT_S") or "").strip() or str(
        int(DEFAULT_HEARTBEAT_S)
    )
    try:
        n = float(raw)
    except ValueError as exc:
        raise PlaneInterestConfigError(
            "LABS_OPF_INTEREST_HEARTBEAT_S must be a number"
        ) from exc
    if n <= 0:
        raise PlaneInterestConfigError("LABS_OPF_INTEREST_HEARTBEAT_S must be > 0")
    from market_data.market_bus.config import interest_grace_s

    grace = float(interest_grace_s())
    if n >= grace:
        raise PlaneInterestConfigError(
            f"LABS_OPF_INTEREST_HEARTBEAT_S ({n}) must be < interest grace ({grace})"
        )
    return n


def parse_wings_topics(raw: str | None = None) -> list[str]:
    """Parse LABS_OPF_PLANE_WINGS_TOPICS into canonical dual ladder keys.

    Records are semicolon- or newline-separated. Each record is either:
      underlier,expiration,wings     (I:SPX,2026-09-01,25)
    or a full mb:ladder:… key, which is parsed then rebuilt via
    bus_ladder_key() so this file never inline-formats a topic.

    Empty / unset → []. That is the default no-op, not a failure.
    """
    if raw is None:
        raw = os.environ.get("LABS_OPF_PLANE_WINGS_TOPICS")
    if raw is None or not str(raw).strip():
        return []
    out: list[str] = []
    seen: set[str] = set()
    chunks = str(raw).replace("\n", ";").split(";")
    for chunk in chunks:
        item = chunk.strip()
        if not item:
            continue
        topic = _record_to_topic(item)
        if topic is None:
            print(f"skip unparseable wings record {item!r}", flush=True)
            continue
        if topic not in seen:
            seen.add(topic)
            out.append(topic)
    return out


def _record_to_topic(item: str) -> str | None:
    if item.startswith("mb:ladder:"):
        parsed = parse_ladder_topic(item)
        if parsed is None or not parsed.dual:
            return None
        return bus_ladder_key(
            parsed.chain_underlier, parsed.expiration, parsed.wings
        )
    parts = [p.strip() for p in item.split(",")]
    if len(parts) != 3:
        return None
    underlier, expiration, wings_s = parts
    if not underlier or not expiration:
        return None
    try:
        wings = int(wings_s)
    except ValueError:
        return None
    if wings < 1:
        return None
    return bus_ladder_key(underlier, expiration, wings)


def health_url() -> str | None:
    override = (os.environ.get("LABS_PLANE_INTEREST_HEALTH_URL") or "").strip()
    if override:
        return override
    port = (os.environ.get("LABS_PORT") or "").strip()
    if not port:
        return None
    return f"http://127.0.0.1:{port}/api/health"


def api_is_up(
    url: str | None = None,
    *,
    opener: Callable[[str], Any] | None = None,
) -> bool:
    target = url if url is not None else health_url()
    if not target:
        return False
    probe = opener or _http_get_ok
    try:
        return bool(probe(target))
    except Exception:
        return False


def _http_get_ok(url: str) -> bool:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=HEALTH_TIMEOUT_S) as resp:
            return 200 <= int(resp.status) < 300
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
        return False


def _write_sidecar(store: Any, topic: str) -> None:
    from market_data.market_bus.config import interest_grace_s

    grace = int(interest_grace_s())
    client = getattr(store, "_r", None)
    if client is None:
        return
    client.set(f"{SIDECAR_PREFIX}{topic}", SOURCE_PLANE, ex=grace)


def tick(
    store: Any,
    topics: list[str],
    *,
    health_ok: bool,
) -> list[str]:
    """One heartbeat. Returns topics actually touched.

    Empty topics → no-op. health_ok False → no-op (TTL expires the hold).
    """
    if not topics:
        return []
    if not health_ok:
        print("api_down skip tick", flush=True)
        return []
    touched: list[str] = []
    for topic in topics:
        store.touch_interest(topic)
        _write_sidecar(store, topic)
        touched.append(topic)
        print(f"touch {topic} src={SOURCE_PLANE}", flush=True)
    return touched


def _store():
    from market_data.market_bus.config import bus_enabled
    from market_data.market_bus.store import BusStore, get_store

    if not bus_enabled():
        return None
    return get_store() or BusStore()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="OPF plane-owned wings interest")
    p.add_argument("--once", action="store_true")
    args = p.parse_args(argv)

    try:
        interval = heartbeat_s()
        topics = parse_wings_topics()
    except PlaneInterestConfigError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    store = _store()
    if store is None:
        print("bus disabled; plane interest idle", flush=True)
        if args.once:
            return 0
        while True:
            time.sleep(interval)

    if not topics:
        print("no wings topics; idle (correct no-op)", flush=True)
        if args.once:
            return 0
        while True:
            time.sleep(interval)

    url = health_url()
    if not url:
        print(
            "LABS_PORT or LABS_PLANE_INTEREST_HEALTH_URL required when topics set",
            file=sys.stderr,
        )
        return 2

    def once() -> None:
        tick(store, topics, health_ok=api_is_up(url))

    if args.once:
        once()
        return 0
    while True:
        once()
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
