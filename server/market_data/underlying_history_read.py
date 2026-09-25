"""Read packed underlying bars stored next to the gap files.

The bytes match fattail-tapelab data-system/underlying_history.py (FTU1).
This process only reads the files. It does not call Massive, and the pack
has no option chain, quote, or greek.
"""
from __future__ import annotations

import json
import math
import os
import re
import struct
from pathlib import Path

MAGIC = b"FTU1"
DAY = struct.Struct("<I4fIHHH")
BAR = struct.Struct("<H4fIf")
NO_CONTRACT = 0xFFFF
INDEX = {"SPX", "XSP", "VIX", "VIX1D"}
_SYM = re.compile(r"^[A-Z][A-Z0-9]{0,7}$")


def history_root() -> Path:
    raw = (os.environ.get("LABS_GAP_HISTORY_ROOT") or "").strip()
    if raw:
        return Path(raw).expanduser()
    from market_data.ssr_live_capture import data_root

    return data_root() / "gap-history"


def _check(symbol: str) -> str:
    sym = (symbol or "").upper()
    if not _SYM.match(sym):
        raise ValueError("bad symbol")
    return sym


def pack_path(symbol: str) -> Path:
    sym = _check(symbol)
    name = f"I_{sym}.ftu1" if sym in INDEX else f"{sym}.ftu1"
    return history_root() / "bars" / name


def symbols() -> list[str]:
    root = history_root() / "bars"
    if not root.is_dir():
        return []
    out = []
    for path in sorted(root.glob("*.ftu1")):
        stem = path.stem
        out.append(stem[2:] if stem.startswith("I_") else stem)
    return out


def _open(path: Path):
    fh = path.open("rb")
    if fh.read(4) != MAGIC:
        fh.close()
        raise ValueError("not an underlying pack")
    (n,) = struct.unpack("<I", fh.read(4))
    header = json.loads(fh.read(n))
    if header.get("chains"):
        fh.close()
        raise ValueError("pack claims to hold chains")
    return fh, header


def _day_text(ymd: int) -> str:
    return f"{ymd // 10000:04d}-{(ymd // 100) % 100:02d}-{ymd % 100:02d}"


def _num(x: float):
    return None if isinstance(x, float) and math.isnan(x) else x


def _bars(fh, count: int) -> list[dict]:
    out = []
    for _ in range(count):
        minute, o, h, l, c, v, vwap = BAR.unpack(fh.read(BAR.size))
        out.append({
            "t": f"{minute // 60:02d}:{minute % 60:02d}",
            "o": _num(o), "h": _num(h), "l": _num(l), "c": _num(c), "v": v,
            "vwap": _num(vwap),
        })
    return out


def _at(fh, header: dict, index: int) -> dict:
    (n,) = struct.unpack("<I", fh.read(4))
    offs = struct.unpack("<" + "Q" * n, fh.read(8 * n))
    fh.seek(offs[index])
    ymd, o, h, l, c, v, contract, n5, n1 = DAY.unpack(fh.read(DAY.size))
    names = header.get("contracts") or []
    return {
        "day": _day_text(ymd),
        "o": _num(o), "h": _num(h), "l": _num(l), "c": _num(c), "v": v,
        "contract": names[contract] if contract != NO_CONTRACT and contract < len(names) else None,
        "m5": _bars(fh, n5),
        "m1": _bars(fh, n1),
    }


def session(symbol: str, day: str) -> dict | None:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day or ""):
        raise ValueError("day must be YYYY-MM-DD")
    path = pack_path(symbol)
    if not path.is_file():
        return None
    fh, header = _open(path)
    try:
        days = header.get("days") or []
        if day not in days:
            return None
        row = _at(fh, header, days.index(day))
    finally:
        fh.close()
    bar_keys = ("t", "o", "h", "l", "c", "v", "vwap")
    return {
        "symbol": _check(symbol),
        "day": day,
        "kind": header.get("kind"),
        "chains": False,
        "session": "09:30-16:00 America/New_York",
        "contract": row["contract"],
        "daily": {k: row[k] for k in ("o", "h", "l", "c", "v")},
        "m5": [{k: b[k] for k in bar_keys} for b in row["m5"]],
        "m1": [{k: b[k] for k in bar_keys} for b in row["m1"]],
    }


def daily(symbol: str, start: str | None, end: str | None) -> dict | None:
    path = pack_path(symbol)
    if not path.is_file():
        return None
    fh, header = _open(path)
    try:
        days = header.get("days") or []
        (n,) = struct.unpack("<I", fh.read(4))
        offs = struct.unpack("<" + "Q" * n, fh.read(8 * n)) if n else ()
        names = header.get("contracts") or []
        rows = []
        for i, day in enumerate(days):
            if start and day < start:
                continue
            if end and day > end:
                continue
            fh.seek(offs[i])
            ymd, o, h, l, c, v, contract, _n5, _n1 = DAY.unpack(fh.read(DAY.size))
            rows.append({
                "day": day,
                "o": _num(o), "h": _num(h), "l": _num(l), "c": _num(c), "v": v,
                "contract": names[contract] if contract != NO_CONTRACT and contract < len(names) else None,
            })
    finally:
        fh.close()
    return {
        "symbol": _check(symbol),
        "kind": header.get("kind"),
        "chains": False,
        "from": header.get("from"),
        "to": header.get("to"),
        "bars": rows,
    }
