"""Stop writing before filling the volume. Gap marker DISK_GUARD."""

from __future__ import annotations

import os
from pathlib import Path

DISK_GUARD_BYTES = 5 * 1024 * 1024 * 1024  # 5 GiB
CHECK_EVERY_S = 15 * 60


def free_bytes(path: Path) -> int:
    st = os.statvfs(path)
    return int(st.f_bavail) * int(st.f_frsize)


def below_guard(path: Path, *, floor: int = DISK_GUARD_BYTES) -> bool:
    p = Path(path)
    if not p.exists():
        p = p.parent if p.parent.exists() else Path("/")
    return free_bytes(p) < floor
