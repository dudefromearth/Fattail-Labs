"""Move prints whose vendor-stamped session is stale onto the live session_end_date.

Massive T frames do not carry session_end_date; we stamp market-status.
If that stamp was frozen at subscribe, overnight prints land on the old day.
Cutoff: CME daily halt end 17:00 America/Chicago.
"""

from __future__ import annotations

import gzip
import json
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from market_data.vp_ingest.store import archive_root, prints_path, vendor_ts_to_seconds

ET = ZoneInfo("America/New_York")
CT = ZoneInfo("America/Chicago")


def _dt(t: int) -> datetime:
    return datetime.fromtimestamp(vendor_ts_to_seconds(int(t)), tz=ET)


def rekey_product(
    root: Path,
    product: str,
    *,
    from_day: str,
    to_day: str,
    cutoff_et: datetime,
) -> dict[str, int]:
    src = prints_path(root, product, date.fromisoformat(from_day))
    if not src.is_file():
        return {"moved": 0, "kept": 0}
    keep: list[str] = []
    move: list[str] = []
    with gzip.open(src, "rt", encoding="utf-8") as fh:
        for line in fh:
            if not line.strip():
                continue
            rec = json.loads(line)
            ts = _dt(int(rec.get("t") or 0))
            if ts >= cutoff_et:
                rec["session_end_date"] = to_day
                rec["rekeyed"] = True
                rec["rekeyed_from"] = from_day
                move.append(json.dumps(rec, separators=(",", ":")))
            else:
                keep.append(line if line.endswith("\n") else line + "\n")
    dst = prints_path(root, product, date.fromisoformat(to_day))
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp_src = src.with_suffix(".jsonl.gz.tmp")
    with gzip.open(tmp_src, "wt", encoding="utf-8") as fh:
        fh.writelines(keep)
    tmp_src.replace(src)
    if move:
        with gzip.open(dst, "wt", encoding="utf-8") as fh:
            for row in move:
                fh.write(row + "\n")
    return {"moved": len(move), "kept": len(keep)}


def main() -> int:
    root = archive_root()
    cutoff = datetime(2026, 9, 17, 18, 0, tzinfo=ET)  # 17:00 CT
    for product in ("ES", "MES"):
        stats = rekey_product(
            root, product, from_day="2026-09-17", to_day="2026-09-18", cutoff_et=cutoff
        )
        print(f"rekey {product} {stats}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
