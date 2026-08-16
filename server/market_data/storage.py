"""Multi-mount map + data-root resolution (VP Spec v0.4 · VP17 / VP14).

LABS_MARKET_DATA_MOUNTS is required when the VP plane is *used* (jobs / APIs).
Format: comma-separated role:path entries, e.g.

    raw-primary:/Volumes/FatTail2TB

Boot of the main API does not require this env (same posture as MASSIVE_API_KEY).
"""

from __future__ import annotations

import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class MountError(RuntimeError):
    """Fail-loud mount / plane configuration error (VP13 / VP17)."""


VALID_ROLES = frozenset({"raw-primary", "raw-shard-2", "binned", "staging"})


@dataclass(frozen=True)
class StorageMount:
    role: str
    path: Path

    @property
    def data_root(self) -> Path:
        """Spec §4.2: {mount}/fattail-market-data.

        If the configured path already ends in fattail-market-data, use it as
        the data root (campaign LABS_MARKET_DATA_ROOT style).
        """
        if self.path.name == "fattail-market-data":
            return self.path
        return self.path / "fattail-market-data"


def parse_mounts_env(raw: str) -> list[StorageMount]:
    text = (raw or "").strip()
    if not text:
        raise MountError("LABS_MARKET_DATA_MOUNTS is empty")
    out: list[StorageMount] = []
    seen_roles: set[str] = set()
    for part in text.split(","):
        item = part.strip()
        if not item:
            continue
        if ":" not in item:
            raise MountError(
                f"LABS_MARKET_DATA_MOUNTS entry {item!r} must be role:path"
            )
        role, path_s = item.split(":", 1)
        role = role.strip()
        path_s = path_s.strip()
        if role not in VALID_ROLES:
            raise MountError(
                f"unknown mount role {role!r}; expected one of {sorted(VALID_ROLES)}"
            )
        if role in seen_roles:
            raise MountError(f"duplicate mount role {role!r}")
        if not path_s:
            raise MountError(f"mount role {role!r} has empty path")
        seen_roles.add(role)
        out.append(StorageMount(role=role, path=Path(path_s).expanduser()))
    if not out:
        raise MountError("LABS_MARKET_DATA_MOUNTS parsed to zero mounts")
    return out


def assert_mount_present(mount: StorageMount) -> None:
    if not mount.path.exists():
        raise MountError(f"mount missing: {mount.role} path={mount.path}")
    if not mount.path.is_dir():
        raise MountError(f"mount not a directory: {mount.role} path={mount.path}")


def load_mounts(*, require_present: bool = True) -> list[StorageMount]:
    raw = (os.environ.get("LABS_MARKET_DATA_MOUNTS") or "").strip()
    if not raw:
        raise MountError("Missing required environment variable: LABS_MARKET_DATA_MOUNTS")
    mounts = parse_mounts_env(raw)
    if require_present:
        for m in mounts:
            assert_mount_present(m)
    return mounts


def plane_configured() -> bool:
    return bool((os.environ.get("LABS_MARKET_DATA_MOUNTS") or "").strip())


def market_data_root() -> Path:
    """Write/read root for raw + binned partitions.

    Prefer LABS_MARKET_DATA_ROOT when set; else first mount's data_root.
    """
    explicit = (os.environ.get("LABS_MARKET_DATA_ROOT") or "").strip()
    if explicit:
        return Path(explicit).expanduser().resolve()
    mounts = load_mounts(require_present=True)
    return mounts[0].data_root.resolve()


def max_n_bins() -> int:
    raw = (os.environ.get("LABS_VP_MAX_N_BINS") or "").strip()
    if not raw:
        raise MountError("Missing required environment variable: LABS_VP_MAX_N_BINS")
    try:
        n = int(raw)
    except ValueError as exc:
        raise MountError(f"LABS_VP_MAX_N_BINS must be an integer, got {raw!r}") from exc
    if n < 1000:
        raise MountError("LABS_VP_MAX_N_BINS must be >= 1000")
    return n


def mount_telemetry(mount: StorageMount) -> dict[str, Any]:
    usage = shutil.disk_usage(str(mount.path))
    return {
        "role": mount.role,
        "path": str(mount.path),
        "data_root": str(mount.data_root),
        "present": mount.path.is_dir(),
        "total_bytes": int(usage.total),
        "used_bytes": int(usage.used),
        "free_bytes": int(usage.free),
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


def upsert_mount_catalog(cur: Any, mounts: list[StorageMount]) -> list[dict[str, Any]]:
    """Refresh market_storage_mount rows (MySQL catalog, not bulk SoR)."""
    rows: list[dict[str, Any]] = []
    for m in mounts:
        tel = mount_telemetry(m)
        cur.execute(
            """
            INSERT INTO market_storage_mount (mount_path, role, last_seen_at, free_bytes)
            VALUES (%s, %s, UTC_TIMESTAMP(), %s)
            ON DUPLICATE KEY UPDATE
              role = VALUES(role),
              last_seen_at = UTC_TIMESTAMP(),
              free_bytes = VALUES(free_bytes)
            """,
            (str(m.path), m.role, tel["free_bytes"]),
        )
        rows.append(tel)
    return rows
