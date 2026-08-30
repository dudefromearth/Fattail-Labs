"""Read-only live_capture archive: coverage, filename+stat index, dyadic fetch.

Does not write. Does not call Massive. Store is FatTail2TB
(LABS_MARKET_DATA_ROOT / ssr / live_capture). SO-AR spec v0.8 + Amendment A1.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable
from zoneinfo import ZoneInfo

from market_data.ssr_live_capture import data_root

NY = ZoneInfo("America/New_York")
UTC = timezone.utc
RTH_OPEN = time(9, 30)
RTH_CLOSE = time(16, 0)
API_VERSION = 1
GAP_MULT = 2.5
GAP_FLOOR_S = 15.0
FETCH_MAX_BYTES = 8 * 1024 * 1024
FETCH_MAX_ENVELOPES = 512
ENVELOPE_NEAR_S = 5 * 60
# Spec §4.7 leftover still names [3, 5] as DL-400. DL-609 reversed the
# capture band to [2, 5]. Stats measure both; truth is DL-609.
DL400_LO = 3.0
DL400_HI = 5.0
DL609_LO = 2.0
DL609_HI = 5.0
DEFAULT_STEP_S = 60
MAX_RETURN = 4000
_SNAP_NAME = re.compile(
    r"^snap-(\d{2})(\d{2})(\d{2})(\d{0,3})Z(?:__\d+)?\.json$"
)

# Named DST branch only. Tests assert the hot index path never appends here.
dst_envelope_opens: list[str] = []


def archive_root() -> Path:
    return data_root() / "ssr" / "live_capture"


def day_folder(day: date, *, root: Path | None = None) -> Path:
    base = root if root is not None else archive_root()
    return base / f"day={day.isoformat()}"


def parse_day(raw: str) -> date:
    return date.fromisoformat(raw.strip()[:10])


def parse_symbols(raw: str | None) -> list[str]:
    if not raw or not str(raw).strip():
        return []
    out: list[str] = []
    seen: set[str] = set()
    for part in str(raw).replace(" ", "").split(","):
        sym = part.strip().upper()
        if not sym or sym in seen:
            continue
        seen.add(sym)
        out.append(sym)
    return out


def parse_days(raw: str | None) -> list[date]:
    if not raw or not str(raw).strip():
        return []
    out: list[date] = []
    seen: set[date] = set()
    for part in str(raw).replace(" ", "").split(","):
        if not part:
            continue
        d = parse_day(part)
        if d in seen:
            continue
        seen.add(d)
        out.append(d)
    return out


def folder_window(day: date) -> tuple[datetime, datetime]:
    """Tap window: [D 00:00 NY, D+1 00:00 NY). Same roll as ensure_day/today_ny."""
    start = datetime.combine(day, time.min, tzinfo=NY)
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=NY)
    return start, end


def parse_snap_clock(name: str) -> tuple[int, int, int, int] | None:
    m = _SNAP_NAME.match(name)
    if not m:
        return None
    hh, mm, ss = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if hh > 23 or mm > 59 or ss > 59:
        return None
    frac = m.group(4) or ""
    if not frac:
        micro = 0
    elif len(frac) <= 3:
        micro = int(frac.ljust(3, "0")) * 1000
    else:
        micro = int(frac[:6].ljust(6, "0"))
    return hh, mm, ss, micro


def clock_candidates(day: date, hh: int, mm: int, ss: int, micro: int) -> list[datetime]:
    out: list[datetime] = []
    for d in (day, day + timedelta(days=1)):
        try:
            out.append(
                datetime(d.year, d.month, d.day, hh, mm, ss, micro, tzinfo=UTC)
            )
        except ValueError:
            continue
    return out


def in_window(dt: datetime, start: datetime, end: datetime) -> bool:
    return start <= dt < end


def _parse_iso(raw: str | None) -> datetime | None:
    if not raw:
        return None
    text = str(raw).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=NY)
    return dt


def reset_dst_envelope_opens() -> None:
    dst_envelope_opens.clear()


def open_envelope_for_dst(path: Path) -> datetime | None:
    """Named branch: two-in-window files only. Never the hot index path."""
    dst_envelope_opens.append(path.name)
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, UnicodeError):
        return None
    if not isinstance(doc, dict):
        return None
    raw = doc.get("captured_at")
    if not raw:
        gen = doc.get("generation")
        if isinstance(gen, dict):
            raw = gen.get("as_of")
    return _parse_iso(str(raw) if raw else None)


def _mtime_in_window(path: Path, start: datetime, end: datetime) -> datetime | None:
    try:
        mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC)
    except OSError:
        return None
    if in_window(mtime, start, end):
        return mtime
    return None


@dataclass
class SnapRec:
    path: Path
    name: str
    bytes: int
    clock_s: int | None
    candidates: list[datetime] = field(default_factory=list)
    t: datetime | None = None
    hole: str | None = None


def snap_files(folder: Path, symbol: str) -> list[Path]:
    """Nested chain/{SYM}/snap-*.json, plus Friday-flat chain/snap-*.json (SPY). Unsorted."""
    chain = folder / "chain"
    if not chain.is_dir():
        return []
    sym = symbol.strip().upper()
    found: list[Path] = []
    nested = chain / sym
    if nested.is_dir():
        found.extend(p for p in nested.glob("snap-*.json") if p.is_file())
    if sym == "SPY":
        found.extend(
            p
            for p in chain.glob("snap-*.json")
            if p.is_file() and p.parent == chain
        )
    return found


def list_symbols_on_disk(folder: Path) -> list[str]:
    chain = folder / "chain"
    if not chain.is_dir():
        return []
    names: set[str] = set()
    for child in chain.iterdir():
        if child.is_dir():
            if any(child.glob("snap-*.json")):
                names.add(child.name.upper())
        elif child.name.startswith("snap-") and child.suffix == ".json":
            names.add("SPY")
    return sorted(names)


def _flat_spy_layout(folder: Path) -> bool:
    """Pre-subdirectory chain/snap-*.json (2026-08-14). A2-2 carve-out only."""
    chain = folder / "chain"
    if not chain.is_dir():
        return False
    nested = chain / "SPY"
    if nested.is_dir() and any(nested.glob("snap-*.json")):
        return False
    return any(
        p.is_file() and p.parent == chain
        for p in chain.glob("snap-*.json")
    )


def list_marks_on_disk(folder: Path) -> list[str]:
    marks = folder / "marks"
    if not marks.is_dir():
        return []
    names: list[str] = []
    for child in sorted(marks.iterdir()):
        if child.is_file() and child.suffix == ".jsonl":
            stem = child.stem
            names.append("SESSION" if stem.lower() == "session" else stem.upper())
    return names


_NATIVE_MARK_SOURCES = frozenset(
    {
        "massive",
        "massive_index_v1",
        "massive_live_stream_v1",
        "massive_index_options_v1",
    }
)


def _source_is_native(src: str | None) -> bool:
    s = str(src or "").strip()
    if not s:
        return False
    if s == "massive_proxy_v1" or "proxy" in s.lower():
        return False
    return s in _NATIVE_MARK_SOURCES


def _tape_not_native(path: Path) -> bool:
    """True if a present tape has any non-native source (AT-SOAR-59)."""
    if not path.is_file():
        return False
    try:
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                if not line.strip():
                    continue
                try:
                    doc = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if not isinstance(doc, dict):
                    continue
                if not _source_is_native(doc.get("source")):
                    return True
    except OSError:
        return False
    return False


def vol_not_native_flags(folder: Path) -> list[str]:
    """Daily stats flags. Proxy VIX cannot be read as a native print."""
    flags: list[str] = []
    if _tape_not_native(marks_path(folder, "VIX")):
        flags.append("VIX NOT NATIVE")
    if _tape_not_native(marks_path(folder, "VIX1D")):
        flags.append("VIX1D NOT NATIVE")
    return flags


def marks_path(folder: Path, symbol: str) -> Path:
    u = symbol.strip().upper()
    stem = "session" if u == "SESSION" else u.lower()
    return folder / "marks" / f"{stem}.jsonl"


def _mark_instant(doc: dict[str, Any]) -> datetime | None:
    return _parse_iso(str(doc.get("captured_at") or "") or None)


def _marks_span(path: Path) -> tuple[int, datetime | None, datetime | None]:
    if not path.is_file():
        return 0, None, None
    first_raw = last_raw = None
    n = 0
    try:
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                if not line.strip():
                    continue
                n += 1
                if first_raw is None:
                    first_raw = line
                last_raw = line
    except OSError:
        return 0, None, None

    def _inst(raw: str | None) -> datetime | None:
        if not raw:
            return None
        try:
            doc = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return _mark_instant(doc) if isinstance(doc, dict) else None

    return n, _inst(first_raw), _inst(last_raw)


def load_marks_tape(folder: Path, symbol: str) -> list[tuple[datetime, dict[str, Any]]]:
    path = marks_path(folder, symbol)
    if not path.is_file():
        return []
    rows: list[tuple[datetime, dict[str, Any]]] = []
    try:
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                raw = line.strip()
                if not raw:
                    continue
                try:
                    doc = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if not isinstance(doc, dict):
                    continue
                inst = _mark_instant(doc)
                if inst is None:
                    continue
                rows.append((inst, doc))
    except OSError:
        return []
    rows.sort(key=lambda r: r[0])
    return rows


def _marks_gap_limit(rows: list[tuple[datetime, dict[str, Any]]]) -> float:
    if len(rows) < 2:
        return GAP_FLOOR_S
    deltas = [(b[0] - a[0]).total_seconds() for a, b in zip(rows, rows[1:])]
    deltas = [d if d >= 0 else 0.0 for d in deltas]
    cadence = float(sorted(deltas)[len(deltas) // 2])
    if cadence <= 0:
        return GAP_FLOOR_S
    return _gap_limit(cadence)


def _as_mid(value: Any) -> float | None:
    if value is None:
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n == n else None  # noqa: PLR0124 — reject NaN


def mark_row(
    symbol: str,
    doc: dict[str, Any] | None,
    *,
    hole: str | None,
) -> dict[str, Any]:
    """MID is a number. source/label are provenance — never folded into mid."""
    live = hole is None and doc is not None
    src = doc or {}
    return {
        "symbol": symbol.strip().upper(),
        "mid": _as_mid(src.get("mid")) if live else None,
        "bid": _as_mid(src.get("bid")) if live else None,
        "ask": _as_mid(src.get("ask")) if live else None,
        "source": src.get("source"),
        "label": src.get("label"),
        "captured_at": src.get("captured_at") if live else None,
        "hole": hole,
    }


def nearest_mark(folder: Path, symbol: str, t: datetime) -> dict[str, Any]:
    u = symbol.strip().upper()
    if not marks_path(folder, u).is_file():
        return mark_row(u, None, hole="MARKS NONE")
    rows = load_marks_tape(folder, u)
    if not rows:
        return mark_row(u, None, hole="MARKS NONE")
    nearest_t, doc = min(rows, key=lambda r: abs((r[0] - t).total_seconds()))
    delta = abs((nearest_t - t).total_seconds())
    if delta > _marks_gap_limit(rows):
        return mark_row(u, doc, hole="MARK GAP")
    return mark_row(u, doc, hole=None)


def day_marks(
    day: date,
    symbols: list[str],
    t: datetime,
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    """Batch nearest-in-time. One call, many names. Generic — no VIX branch."""
    folder = day_folder(day, root=root)
    wanted = [s.strip().upper() for s in symbols if str(s).strip()]
    if not wanted:
        wanted = list_marks_on_disk(folder)
    return {
        "day": day.isoformat(),
        "t": _iso(t),
        "marks": [nearest_mark(folder, s, t) for s in wanted],
        "hole": None,
        "api_version": API_VERSION,
    }


def captured_reachable(folder: Path) -> list[tuple[str, str]]:
    """(symbol, plane) for every name with data on disk. AT-SOAR-56."""
    out: list[tuple[str, str]] = []
    for sym in list_symbols_on_disk(folder):
        out.append((sym, "chain"))
    for sym in list_marks_on_disk(folder):
        out.append((sym, "marks"))
    return out


def _stat_bytes(path: Path) -> int:
    try:
        return path.stat().st_size
    except OSError:
        return 0


def _pick_window_t(candidates: list[datetime], start: datetime, end: datetime) -> list[datetime]:
    return [c for c in candidates if in_window(c, start, end)]


def _neighbour_pick(
    rec: SnapRec, resolved: list[SnapRec]
) -> datetime | None:
    """Pick the candidate that stays non-decreasing vs clock-adjacent resolved t."""
    if rec.clock_s is None or len(rec.candidates) != 2:
        return None
    left: SnapRec | None = None
    right: SnapRec | None = None
    for other in resolved:
        if other.t is None or other.clock_s is None:
            continue
        if other.clock_s < rec.clock_s:
            if left is None or other.clock_s > left.clock_s:
                left = other
        elif other.clock_s > rec.clock_s:
            if right is None or other.clock_s < right.clock_s:
                right = other
    ok: list[datetime] = []
    for c in rec.candidates:
        if left is not None and left.t is not None and left.t > c:
            continue
        if right is not None and right.t is not None and c > right.t:
            continue
        ok.append(c)
    if len(ok) == 1:
        return ok[0]
    return None


def reconstruct_book(
    folder: Path, symbol: str, day: date, *, allow_envelope: bool = True
) -> list[SnapRec]:
    start, end = folder_window(day)
    recs: list[SnapRec] = []
    for path in snap_files(folder, symbol):
        parsed = parse_snap_clock(path.name)
        rec = SnapRec(
            path=path,
            name=path.name,
            bytes=_stat_bytes(path),
            clock_s=None,
        )
        if parsed is None:
            rec.hole = "UNREADABLE"
            recs.append(rec)
            continue
        hh, mm, ss, micro = parsed
        rec.clock_s = hh * 3600 + mm * 60 + ss
        rec.candidates = _pick_window_t(
            clock_candidates(day, hh, mm, ss, micro), start, end
        )
        if not rec.candidates:
            rec.hole = "OUT OF WINDOW"
        elif len(rec.candidates) == 1:
            rec.t = rec.candidates[0]
            rec.hole = None
        recs.append(rec)

    resolved = [r for r in recs if r.t is not None]
    pending = [r for r in recs if len(r.candidates) > 1 and r.t is None]
    still: list[SnapRec] = []
    for rec in pending:
        env = open_envelope_for_dst(rec.path) if allow_envelope else None
        if env is not None:
            nearest = min(rec.candidates, key=lambda c: abs((c - env).total_seconds()))
            if abs((nearest - env).total_seconds()) <= ENVELOPE_NEAR_S:
                rec.t = nearest
                rec.hole = None
                resolved.append(rec)
                continue
        still.append(rec)
    pending = still
    changed = True
    while pending and changed:
        changed = False
        nxt: list[SnapRec] = []
        for rec in pending:
            neighbour = _neighbour_pick(rec, resolved)
            if neighbour is not None:
                rec.t = neighbour
                rec.hole = None
                resolved.append(rec)
                changed = True
                continue
            nxt.append(rec)
        pending = nxt
    for rec in pending:
        mt = _mtime_in_window(rec.path, start, end)
        if mt is not None:
            nearest = min(rec.candidates, key=lambda c: abs((c - mt).total_seconds()))
            rec.t = nearest
            rec.hole = None
            continue
        rec.t = None
        rec.hole = "AMBIGUOUS INSTANT"

    recs.sort(
        key=lambda r: (
            r.t is None,
            r.t or datetime.min.replace(tzinfo=UTC),
            r.name,
        )
    )
    return recs


def paths_hash(recs: Iterable[SnapRec | Path]) -> str:
    """sha256 of filename\\tsize\\n in the given order (must be t-order)."""
    h = hashlib.sha256()
    for item in recs:
        if isinstance(item, SnapRec):
            name, size = item.name, item.bytes
        else:
            name, size = item.name, _stat_bytes(item)
        h.update(f"{name}\t{size}\n".encode("utf-8"))
    return h.hexdigest()


def derived_stride(n: int) -> tuple[int, int]:
    """Largest S=2^k with n/S >= 64; floor S at 1. Returns (S, k)."""
    if n <= 0:
        return 1, 0
    s = 1
    k = 0
    while (n / (s * 2)) >= 64:
        s *= 2
        k += 1
    return s, k


def level_indices(n: int, level: int, *, stride: int | None = None) -> list[int]:
    if n <= 0:
        return []
    if stride is None:
        s, k = derived_stride(n)
    else:
        s = stride
        k = 0
        x = s
        while x > 1:
            x //= 2
            k += 1
    if level < 0 or level > k:
        raise ValueError(f"level must be 0..{k}")
    if level == 0:
        return list(range(0, n, s))
    step = s >> (level - 1)
    offset = s >> level
    return list(range(offset, n, step))


def rth_status(day: date, first_at: str | None, last_at: str | None) -> str:
    first = _parse_iso(first_at)
    last = _parse_iso(last_at)
    if first is None or last is None:
        return "none"
    open_dt = datetime.combine(day, RTH_OPEN, tzinfo=NY)
    close_dt = datetime.combine(day, RTH_CLOSE, tzinfo=NY)
    slack = timedelta(seconds=30)
    if first <= open_dt + slack and last >= close_dt - slack:
        return "rth_complete"
    return "partial"


def _counts_row(folder: Path, symbol: str) -> dict[str, Any] | None:
    path = folder / "COUNTS.json"
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    row = (doc.get("symbols") or {}).get(symbol.upper())
    return row if isinstance(row, dict) else None


def _wings(folder: Path) -> Any:
    path = folder / "PROVENANCE.json"
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, UnicodeError):
        return None
    if not isinstance(doc, dict):
        return None
    return doc.get("wings")


def _held_expiration(folder: Path, symbol: str) -> str | None:
    row = _counts_row(folder, symbol)
    if not row:
        return None
    raw = row.get("expiration")
    if raw is None or str(raw).strip() == "":
        return None
    return str(raw).strip()[:10]


def _is_today(day: date) -> bool:
    from market_data.ssr_live_capture import today_ny

    return day == today_ny()


def _book_hole(
    day: date,
    folder: Path,
    symbol: str,
    expiration: str | None,
) -> str | None:
    # TMI-85: TODAY_LIVE is not a fetch refusal. Coverage still sets live: true.
    counts = _counts_row(folder, symbol)
    if counts and counts.get("not_today"):
        return "NOT TODAY"
    held = _held_expiration(folder, symbol)
    if held is None:
        # COUNTS missing or silent — refused, not guessed as an empty day.
        # A2-2: flat pre-subdirectory SPY is the only carve-out (unambiguous one book).
        if symbol.upper() == "SPY" and _flat_spy_layout(folder):
            return None
        return "UNKNOWN"
    if expiration and expiration.strip()[:10] != held:
        return "WRONG BOOK"
    return None


def hole_http_status(hole: str | None, *, error: str | None = None) -> int:
    if error == "day_changed":
        return 409
    return {
        "TODAY_LIVE": 409,
        "WRONG BOOK": 404,
        "UNKNOWN": 404,
        "STORE MISSING": 503,
        "ARCHIVE BUSY": 429,
        "MARK GAP": 200,
        "MARKS NONE": 200,
    }.get(hole or "", 200)


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.astimezone(NY).isoformat()


def _ladder_recs(recs: list[SnapRec]) -> list[SnapRec]:
    return [
        r
        for r in recs
        if r.t is not None
        and r.hole not in ("UNREADABLE", "OUT OF WINDOW", "AMBIGUOUS INSTANT")
    ]


def _gap_limit(cadence: float) -> float:
    return max(GAP_MULT * cadence, GAP_FLOOR_S)


def observed_cadence_and_gaps(recs: list[SnapRec]) -> tuple[float | None, list[dict[str, Any]]]:
    ladder = _ladder_recs(recs)
    if len(ladder) < 2:
        return None, []
    deltas: list[float] = []
    pairs: list[tuple[SnapRec, SnapRec, float]] = []
    for prev, cur in zip(ladder, ladder[1:]):
        assert prev.t is not None and cur.t is not None
        d = (cur.t - prev.t).total_seconds()
        if d < 0:
            d = 0.0
        deltas.append(d)
        pairs.append((prev, cur, d))
    ordered = sorted(deltas)
    cadence = float(ordered[len(ordered) // 2])
    if cadence <= 0:
        return None, []
    limit = _gap_limit(cadence)
    gaps: list[dict[str, Any]] = []
    for prev, cur, d in pairs:
        if d > limit:
            gaps.append(
                {
                    "after_file": prev.name,
                    "until_file": cur.name,
                    "missing_s": d,
                    "hole": "GAP",
                }
            )
    return cadence, gaps


def _tap_restart(recs: list[SnapRec]) -> bool:
    seen: set[datetime] = set()
    for rec in _ladder_recs(recs):
        if rec.t is None:
            continue
        if rec.t in seen:
            return True
        seen.add(rec.t)
    return False


def book_coverage(
    day: date, symbol: str, *, root: Path | None = None
) -> dict[str, Any]:
    folder = day_folder(day, root=root)
    symbol_u = symbol.strip().upper()
    recs = reconstruct_book(folder, symbol_u, day)
    ladder = _ladder_recs(recs)
    counts = _counts_row(folder, symbol_u)
    if not recs:
        if counts and counts.get("not_today"):
            return {
                "symbol": symbol_u,
                "expiration": None,
                "wings": _wings(folder),
                "count": 0,
                "status": "not_today",
                "first_at": None,
                "last_at": None,
                "cadence_s": None,
                "gaps": [],
                "hash": paths_hash([]),
                "S": 1,
                "k": 0,
                "live": _is_today(day),
                "next_expiration": counts.get("next_expiration"),
                "tap_restart": False,
                "api_version": API_VERSION,
            }
        return {
            "symbol": symbol_u,
            "expiration": _held_expiration(folder, symbol_u) or "UNKNOWN",
            "wings": _wings(folder),
            "count": 0,
            "status": "none",
            "first_at": None,
            "last_at": None,
            "cadence_s": None,
            "gaps": [],
            "hash": paths_hash([]),
            "S": 1,
            "k": 0,
            "live": _is_today(day),
            "tap_restart": False,
            "api_version": API_VERSION,
        }
    first_at = _iso(ladder[0].t) if ladder else None
    last_at = _iso(ladder[-1].t) if ladder else None
    cadence, gaps = observed_cadence_and_gaps(recs)
    n = len(ladder)
    s, k = derived_stride(n)
    held = _held_expiration(folder, symbol_u)
    return {
        "symbol": symbol_u,
        "expiration": held or "UNKNOWN",
        "wings": _wings(folder),
        "count": n,
        "status": rth_status(day, first_at, last_at) if ladder else "none",
        "first_at": first_at,
        "last_at": last_at,
        "cadence_s": cadence,
        "gaps": gaps,
        "hash": paths_hash(recs),
        "first_file": ladder[0].name if ladder else None,
        "last_file": ladder[-1].name if ladder else None,
        "finalized": (folder / "CHECKLIST.json").is_file(),
        "live": _is_today(day),
        "rth_expected": "09:30–16:00 America/New_York",
        "S": s,
        "k": k,
        "tap_restart": _tap_restart(recs),
        "api_version": API_VERSION,
    }


def coverage(
    *,
    days: list[date] | None = None,
    start: date | None = None,
    end: date | None = None,
    symbols: list[str] | None = None,
    root: Path | None = None,
) -> dict[str, Any]:
    base = root if root is not None else archive_root()
    if not base.is_dir():
        return {
            "unreachable": False,
            "store_missing": True,
            "days": [],
            "api_version": API_VERSION,
            "root": str(base),
        }
    if days:
        wanted_days = sorted(days)
    elif start or end:
        a = start or end
        b = end or start
        assert a is not None and b is not None
        if b < a:
            a, b = b, a
        wanted_days = []
        cur = a
        while cur <= b:
            wanted_days.append(cur)
            cur = date.fromordinal(cur.toordinal() + 1)
    else:
        wanted_days = []
        for child in base.iterdir():
            if child.is_dir() and child.name.startswith("day="):
                try:
                    wanted_days.append(parse_day(child.name.removeprefix("day=")))
                except ValueError:
                    continue
        wanted_days.sort()
    out_days: list[dict[str, Any]] = []
    for day in wanted_days:
        folder = day_folder(day, root=root)
        wanted = list(symbols or [])
        chain_names = list_symbols_on_disk(folder)
        mark_names = list_marks_on_disk(folder)
        if wanted:
            tape_syms = [s for s in wanted if s in mark_names]
            book_syms = []
            for s in wanted:
                marks_only = (
                    s in mark_names
                    and s not in chain_names
                    and not (folder / "chain" / s).is_dir()
                )
                if not marks_only:
                    book_syms.append(s)
        else:
            book_syms = chain_names
            tape_syms = mark_names
        books = [book_coverage(day, s, root=root) for s in book_syms]
        tapes: list[dict[str, Any]] = []
        for s in tape_syms:
            path = marks_path(folder, s)
            n, first_at, last_at = _marks_span(path)
            tapes.append(
                {
                    "symbol": s,
                    "kind": "tape",
                    "count": n,
                    "first_at": _iso(first_at),
                    "last_at": _iso(last_at),
                    "file": path.name,
                }
            )
        statuses = [
            b["status"] for b in books if b.get("status") not in ("not_today",)
        ]
        if "partial" in statuses:
            rollup = "partial"
        elif "rth_complete" in statuses and "none" in statuses:
            rollup = "partial"
        elif "rth_complete" in statuses:
            rollup = "rth_complete"
        else:
            rollup = "none"
        flags = vol_not_native_flags(folder)
        out_days.append(
            {
                "date": day.isoformat(),
                "status": rollup,
                "finalized": (folder / "CHECKLIST.json").is_file(),
                "live": _is_today(day),
                "books": books,
                "marks": tapes,
                "flags": flags,
            }
        )
    return {
        "unreachable": False,
        "store_missing": False,
        "store": "archive",
        "root": str(base),
        "days": out_days,
        "api_version": API_VERSION,
    }


def day_index(
    day: date,
    symbol: str,
    expiration: str | None = None,
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    folder = day_folder(day, root=root)
    symbol_u = symbol.strip().upper()
    exp = (expiration or "").strip()[:10] or None
    hole = _book_hole(day, folder, symbol_u, exp)
    empty = {
        "day": day.isoformat(),
        "symbol": symbol_u,
        "expiration": exp or _held_expiration(folder, symbol_u) or "UNKNOWN",
        "count": 0,
        "hash": paths_hash([]),
        "snaps": [],
        "hole": hole,
        "S": 1,
        "k": 0,
        "tap_restart": False,
        "api_version": API_VERSION,
    }
    if hole:
        return empty
    recs = reconstruct_book(folder, symbol_u, day)
    if not recs:
        empty["hole"] = "NONE"
        return empty
    ladder = _ladder_recs(recs)
    n = len(ladder)
    s, k = derived_stride(n)
    snaps = [
        {
            "t": _iso(r.t),
            "file": r.name,
            "bytes": r.bytes,
            "hole": r.hole,
        }
        for r in recs
    ]
    return {
        "day": day.isoformat(),
        "symbol": symbol_u,
        "expiration": _held_expiration(folder, symbol_u) or exp or "UNKNOWN",
        "count": n,
        "hash": paths_hash(recs),
        "snaps": snaps,
        "hole": "TAP RESTART" if _tap_restart(recs) else None,
        "S": s,
        "k": k,
        "tap_restart": _tap_restart(recs),
        "api_version": API_VERSION,
    }


def load_snap(path: Path) -> dict[str, Any] | None:
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, UnicodeError):
        return None
    return doc if isinstance(doc, dict) else None


def day_fetch(
    day: date,
    symbol: str,
    level: int,
    expiration: str | None = None,
    *,
    start: datetime | None = None,
    end: datetime | None = None,
    day_hash: str | None = None,
    from_index: int | None = None,
    root: Path | None = None,
) -> dict[str, Any]:
    folder = day_folder(day, root=root)
    symbol_u = symbol.strip().upper()
    exp = (expiration or "").strip()[:10] or None
    hole = _book_hole(day, folder, symbol_u, exp)
    if hole:
        return {
            "day": day.isoformat(),
            "symbol": symbol_u,
            "expiration": exp or _held_expiration(folder, symbol_u) or "UNKNOWN",
            "level": level,
            "hash": paths_hash([]),
            "count_on_disk": 0,
            "returned": 0,
            "snaps": [],
            "hole": hole,
            "S": 1,
            "k": 0,
            "api_version": API_VERSION,
        }
    recs = reconstruct_book(folder, symbol_u, day)
    ladder = _ladder_recs(recs)
    digest = paths_hash(recs)
    if day_hash and day_hash != digest:
        return {
            "error": "day_changed",
            "day": day.isoformat(),
            "symbol": symbol_u,
            "expiration": _held_expiration(folder, symbol_u) or exp,
            "hash": digest,
            "snaps": [],
            "api_version": API_VERSION,
        }
    n = len(ladder)
    s, k = derived_stride(n)
    idxs = level_indices(n, level, stride=s)
    windowed = start is not None or end is not None
    snaps: list[dict[str, Any]] = []
    next_index: int | None = None
    used = 0
    nbytes = 0
    for i in idxs:
        if from_index is not None and i < from_index:
            continue
        rec = ladder[i]
        if windowed:
            if rec.t is None:
                continue
            if start is not None and rec.t < start:
                continue
            if end is not None and rec.t > end:
                continue
        if used >= FETCH_MAX_ENVELOPES or nbytes >= FETCH_MAX_BYTES:
            next_index = i
            break
        doc = load_snap(rec.path)
        if doc is None:
            row = {
                "_file": rec.name,
                "_index": i,
                "_level": level,
                "hole": "UNREADABLE",
            }
            snaps.append(row)
            used += 1
            continue
        doc["_file"] = rec.name
        doc["_index"] = i
        doc["_level"] = level
        snaps.append(doc)
        used += 1
        nbytes += rec.bytes
    return {
        "day": day.isoformat(),
        "symbol": symbol_u,
        "expiration": _held_expiration(folder, symbol_u) or exp,
        "level": level,
        "hash": digest,
        "count_on_disk": n,
        "returned": len(snaps),
        "snaps": snaps,
        "hole": None,
        "S": s,
        "k": k,
        "next_index": next_index,
        "api_version": API_VERSION,
    }


def _percentile(values: list[float], p: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    idx = min(len(ordered) - 1, max(0, int(round((p / 100) * (len(ordered) - 1)))))
    return float(ordered[idx])


def cadence_stats(
    day: date,
    symbol: str,
    *,
    root: Path | None = None,
    allow_envelope: bool = True,
) -> dict[str, Any]:
    folder = day_folder(day, root=root)
    recs = reconstruct_book(folder, symbol, day, allow_envelope=allow_envelope)
    ladder = _ladder_recs(recs)
    deltas: list[float] = []
    by_hour: dict[int, list[float]] = {}
    for prev, cur in zip(ladder, ladder[1:]):
        assert prev.t is not None and cur.t is not None
        d = (cur.t - prev.t).total_seconds()
        if d < 0:
            d = 0.0
        deltas.append(d)
        hour = cur.t.astimezone(NY).hour
        by_hour.setdefault(hour, []).append(d)
    cadence, gaps = observed_cadence_and_gaps(recs)
    hist = [0] * 16
    tail = 0
    in_band = 0
    in_dl609 = 0
    for d in deltas:
        bucket = int(d)
        if 1 <= bucket <= 15:
            hist[bucket] += 1
        elif d > 15:
            tail += 1
        if DL400_LO <= d <= DL400_HI:
            in_band += 1
        if DL609_LO <= d <= DL609_HI:
            in_dl609 += 1
    first_at = _iso(ladder[0].t) if ladder else None
    last_at = _iso(ladder[-1].t) if ladder else None
    span_s = None
    if ladder and ladder[0].t and ladder[-1].t:
        span_s = (ladder[-1].t - ladder[0].t).total_seconds()
    return {
        "day": day.isoformat(),
        "symbol": symbol.strip().upper(),
        "count": len(ladder),
        "span": {"first_at": first_at, "last_at": last_at, "elapsed_s": span_s},
        "delta_min": min(deltas) if deltas else None,
        "delta_p05": _percentile(deltas, 5),
        "delta_median": cadence,
        "delta_p95": _percentile(deltas, 95),
        "delta_max": max(deltas) if deltas else None,
        "delta_hist": {"buckets_1_to_15": hist[1:], "tail_gt_15": tail},
        "gaps": {"count": len(gaps), "missing_s": sum(g["missing_s"] for g in gaps), "rows": gaps},
        "within_dl400": (in_band / len(deltas)) if deltas else None,
        "within_dl609": (in_dl609 / len(deltas)) if deltas else None,
        "by_hour": {
            str(h): {
                "count": len(vals),
                "median": float(sorted(vals)[len(vals) // 2]),
            }
            for h, vals in sorted(by_hour.items())
        },
        "tap_restart": _tap_restart(recs),
        "api_version": API_VERSION,
    }


def health(*, root: Path | None = None, tap_running: bool | None = None) -> dict[str, Any]:
    """No snap walk. Mount, version, store path; tap bit is supplied by the host."""
    base = root if root is not None else archive_root()
    mounted = base.is_dir()
    return {
        "api_version": API_VERSION,
        "ok": True,
        "store": str(base),
        "store_missing": not mounted,
        "hole": None if mounted else "STORE MISSING",
        "tap_running": tap_running,
    }


# --- leftover dash routes (/api/available, /api/retrieve) ---

def symbol_availability(
    day: date, symbol: str, *, root: Path | None = None
) -> dict[str, Any]:
    book = book_coverage(day, symbol, root=root)
    return {
        "symbol": book["symbol"],
        "snaps": book["count"],
        "status": "not_today" if book.get("status") == "not_today" else book["status"],
        "first_at": book.get("first_at"),
        "last_at": book.get("last_at"),
        "not_today": book.get("status") == "not_today",
        "next_expiration": book.get("next_expiration"),
        "available": book["count"] > 0,
        "first_file": book.get("first_file"),
        "last_file": book.get("last_file"),
        "rth_expected": book.get("rth_expected"),
    }


def available(
    *,
    days: list[date] | None = None,
    start: date | None = None,
    end: date | None = None,
    symbols: list[str] | None = None,
    root: Path | None = None,
) -> dict[str, Any]:
    packed = coverage(days=days, start=start, end=end, symbols=symbols, root=root)
    out_days = []
    for row in packed.get("days") or []:
        books = row.get("books") or []
        out_days.append(
            {
                "date": row["date"],
                "exists": True,
                "finalized": row.get("finalized"),
                "status": row["status"],
                "store": "archive",
                "symbols": [
                    {
                        "symbol": b["symbol"],
                        "snaps": b["count"],
                        "status": b["status"],
                        "first_at": b.get("first_at"),
                        "last_at": b.get("last_at"),
                    }
                    for b in books
                ],
            }
        )
    return {
        "store": "archive",
        "root": packed.get("root"),
        "symbols": symbols or [],
        "days": out_days,
        "api_version": API_VERSION,
        "store_missing": packed.get("store_missing", False),
    }


def select_paths(paths: list[Path], step_s: int) -> list[Path]:
    """Legacy retrieve helper. Orders by reconstructed t when the folder date is known."""
    if step_s < 1:
        raise ValueError("step_s must be >= 1")
    if step_s <= 2:
        return list(paths)
    kept: list[Path] = []
    last_bucket: int | None = None
    for path in paths:
        parsed = parse_snap_clock(path.name)
        if parsed is None:
            kept.append(path)
            continue
        hh, mm, ss, _micro = parsed
        sec = hh * 3600 + mm * 60 + ss
        bucket = sec // step_s
        if last_bucket is None or bucket != last_bucket:
            kept.append(path)
            last_bucket = bucket
    return kept


def retrieve(
    days: Iterable[date],
    symbols: list[str],
    *,
    step_s: int = DEFAULT_STEP_S,
    root: Path | None = None,
    max_return: int = MAX_RETURN,
) -> dict[str, Any]:
    if not symbols:
        raise ValueError("symbols required")
    day_list = list(days)
    if not day_list:
        raise ValueError("days required")
    items: list[dict[str, Any]] = []
    returned = 0
    truncated = False
    for day in day_list:
        folder = day_folder(day, root=root)
        for symbol in symbols:
            recs = _ladder_recs(reconstruct_book(folder, symbol, day))
            paths = [r.path for r in recs]
            selected = select_paths(paths, step_s)
            if returned + len(selected) > max_return:
                room = max(0, max_return - returned)
                selected = selected[:room]
                truncated = True
            snaps: list[dict[str, Any]] = []
            for path in selected:
                doc = load_snap(path)
                if doc is None:
                    continue
                doc["_file"] = path.name
                doc["_day"] = day.isoformat()
                snaps.append(doc)
            returned += len(snaps)
            items.append(
                {
                    "day": day.isoformat(),
                    "symbol": symbol.upper(),
                    "snaps_on_disk": len(paths),
                    "returned": len(snaps),
                    "step_s": step_s,
                    "snaps": snaps,
                }
            )
            if truncated:
                break
        if truncated:
            break
    return {
        "step_s": step_s,
        "truncated": truncated,
        "max_return": max_return,
        "items": items,
        "api_version": API_VERSION,
    }
