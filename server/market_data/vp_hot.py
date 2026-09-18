"""StudioOne Redis hot layer for VP serving objects (DL-749).

Separate DB index from chain `mb:*` (never SELECT 0). No CONFIG SET of
maxmemory/policy on the shared instance. Application cap refuses SET over
LABS_VP_HOT_MAX_BYTES. Immutable keys have no TTL; developing is overwritten
when generation_id changes.
"""

from __future__ import annotations

import json
import os
from typing import Any

PREFIX = "vp:hot:"
BYTES_KEY = PREFIX + "_bytes"
CHAIN_DB_FORBIDDEN = {None, "", "0"}


class HotDisabled(Exception):
    pass


class Hot:
    def __init__(self) -> None:
        self._r: Any = None
        self._max = 0
        if "LABS_VP_HOT" in os.environ:
            raw = os.environ.get("LABS_VP_HOT") or ""
        else:
            raw = ""
            env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
            try:
                with open(os.path.abspath(env_path), encoding="utf-8") as fh:
                    for line in fh:
                        line = line.strip()
                        if line.startswith("LABS_VP_HOT=") and "=" in line:
                            raw = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
            except OSError:
                raw = ""
        raw = raw.strip().lower()
        if raw not in ("1", "true", "yes"):
            return
        url = (os.environ.get("LABS_VP_HOT_REDIS_URL") or "").strip()
        if not url:
            env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
            try:
                with open(os.path.abspath(env_path), encoding="utf-8") as fh:
                    for line in fh:
                        line = line.strip()
                        if line.startswith("LABS_VP_HOT_REDIS_URL="):
                            url = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if line.startswith("LABS_VP_HOT_MAX_BYTES=") and not os.environ.get(
                            "LABS_VP_HOT_MAX_BYTES"
                        ):
                            os.environ["LABS_VP_HOT_MAX_BYTES"] = line.split("=", 1)[1].strip()
            except OSError:
                url = ""
        if not url:
            raise RuntimeError("LABS_VP_HOT=1 requires LABS_VP_HOT_REDIS_URL")
        # db index after / — forbid chain db 0
        db = "0"
        if "/" in url.rsplit("@", 1)[-1]:
            db = url.rsplit("/", 1)[-1].split("?")[0]
        if db in CHAIN_DB_FORBIDDEN:
            raise RuntimeError(
                "LABS_VP_HOT_REDIS_URL must use a DB index other than 0 "
                "(chain_feed mb:* lives on /0)"
            )
        cap = (os.environ.get("LABS_VP_HOT_MAX_BYTES") or "").strip()
        if not cap:
            raise RuntimeError("LABS_VP_HOT=1 requires LABS_VP_HOT_MAX_BYTES")
        self._max = int(cap)
        import redis

        self._r = redis.Redis.from_url(url, decode_responses=False)
        self._r.ping()

    @property
    def enabled(self) -> bool:
        return self._r is not None

    def get(self, key: str) -> dict[str, Any] | None:
        if self._r is None:
            return None
        raw = self._r.get(PREFIX + key)
        if not raw:
            return None
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            return None
        if not isinstance(obj, dict):
            return None
        return obj

    def set(self, key: str, body: dict[str, Any], *, gen: str | None) -> None:
        if self._r is None:
            return
        blob = json.dumps({"gen": gen, "body": body}, separators=(",", ":")).encode()
        full = PREFIX + key
        old = self._r.get(full)
        old_n = len(old) if old else 0
        delta = len(blob) - old_n
        used = int(self._r.get(BYTES_KEY) or 0)
        if used + delta > self._max:
            return
        pipe = self._r.pipeline()
        pipe.set(full, blob)
        pipe.incrby(BYTES_KEY, delta)
        pipe.execute()

    def gen_matches(self, cached: dict[str, Any] | None, gen: str | None) -> bool:
        if not cached or not gen:
            return False
        return str(cached.get("gen") or "") == str(gen)


_hot: Hot | None = None


def hot() -> Hot:
    global _hot
    if _hot is None:
        _hot = Hot()
    return _hot
