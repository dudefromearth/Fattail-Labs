"""InterestManager + global generation interest budget (OPF27)."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any

from opf import config as opf_config
from opf.keys import LadderTopic, bus_ladder_key, parse_ladder_topic


class InterestBudgetExceeded(Exception):
    """At cap — refuse loud (OPF27)."""

    def __init__(self, message: str, *, cap: int, held: int) -> None:
        super().__init__(message)
        self.cap = cap
        self.held = held


@dataclass
class InterestEntry:
    topic: str
    refcount: int = 0
    last_touch: float = field(default_factory=time.time)
    meta: dict[str, Any] = field(default_factory=dict)


class InterestManager:
    """Process-local refcounted interest with global cap.

    Complements Redis ``mb:interest:*`` TTL; this manager enforces OPF budget
    before new keys are admitted.
    """

    def __init__(self, cap: int | None = None) -> None:
        self._cap = int(cap if cap is not None else opf_config.max_generation_interests())
        self._lock = threading.Lock()
        self._entries: dict[str, InterestEntry] = {}

    @property
    def cap(self) -> int:
        return self._cap

    def held_count(self) -> int:
        with self._lock:
            return sum(1 for e in self._entries.values() if e.refcount > 0)

    def list_topics(self) -> list[str]:
        with self._lock:
            return [t for t, e in self._entries.items() if e.refcount > 0]

    def touch(
        self,
        topic: str,
        *,
        admit_new: bool = True,
    ) -> InterestEntry:
        """Increment/refresh interest. Raises InterestBudgetExceeded at cap."""
        parsed = parse_ladder_topic(topic)
        # normalize dual keys
        if parsed and parsed.dual:
            topic = bus_ladder_key(
                parsed.chain_underlier, parsed.expiration, parsed.wings
            )
        with self._lock:
            ent = self._entries.get(topic)
            if ent is None or ent.refcount <= 0:
                active = sum(1 for e in self._entries.values() if e.refcount > 0)
                if admit_new and active >= self._cap and (ent is None or ent.refcount <= 0):
                    raise InterestBudgetExceeded(
                        f"generation interest budget full: held={active} cap={self._cap}",
                        cap=self._cap,
                        held=active,
                    )
                if ent is None:
                    ent = InterestEntry(topic=topic)
                    self._entries[topic] = ent
            ent.refcount += 1
            ent.last_touch = time.time()
            return ent

    def release(self, topic: str) -> None:
        parsed = parse_ladder_topic(topic)
        if parsed and parsed.dual:
            topic = bus_ladder_key(
                parsed.chain_underlier, parsed.expiration, parsed.wings
            )
        with self._lock:
            ent = self._entries.get(topic)
            if not ent:
                return
            ent.refcount = max(0, ent.refcount - 1)
            ent.last_touch = time.time()

    def parse(self, topic: str) -> LadderTopic | None:
        return parse_ladder_topic(topic)


# Process singleton for foundation API
_manager: InterestManager | None = None
_mgr_lock = threading.Lock()


def get_interest_manager() -> InterestManager:
    global _manager
    with _mgr_lock:
        if _manager is None:
            _manager = InterestManager()
        return _manager


def reset_interest_manager_for_tests(cap: int | None = None) -> InterestManager:
    global _manager
    with _mgr_lock:
        _manager = InterestManager(cap=cap)
        return _manager
