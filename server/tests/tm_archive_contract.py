"""Time Machine archive contract — consumer proofs, not unit internals.

Fixtures freeze the six proofs. A live smoke pass (opt-in) catches store drift.
Direct StudioOne HTTP, then Labs proxy with the same assertions. Proxy twice:
second pass is a cache hit and the JSON body is byte-identical to the first.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Callable
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")

TOKEN = "b" * 32
SYM = "SPX"

# Fixture calendar (not live collection dates).
DAY_WHOLE = date(2026, 8, 21)
DAY_PARTIAL = date(2026, 8, 20)
DAY_WRAP = date(2026, 8, 25)
DAY_SEAM = date(2026, 8, 1)

GREEKS = ("delta", "gamma", "theta", "vega")


def _counts(folder: Path, symbol: str, expiration: str) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / "COUNTS.json"
    doc: dict[str, Any] = {"day": folder.name.removeprefix("day="), "symbols": {}}
    if path.is_file():
        doc = json.loads(path.read_text(encoding="utf-8"))
    doc.setdefault("symbols", {})[symbol] = {
        "snaps": 0,
        "expiration": expiration,
        "not_today": False,
    }
    path.write_text(json.dumps(doc), encoding="utf-8")


def _provenance(folder: Path, wings: int = 25) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "PROVENANCE.json").write_text(
        json.dumps({"wings": wings, "capture": "live_capture"}),
        encoding="utf-8",
    )


def _envelope(
    *,
    symbol: str,
    expiration: str,
    captured_at: str,
    spot: float,
    tent: bool = False,
) -> dict[str, Any]:
    row = {
        "strike": 5800 if tent else 1,
        "call": {
            "delta": 0.51 if tent else 0.10,
            "gamma": 0.012,
            "theta": -1.2,
            "vega": 8.4,
            "iv": 0.14,
        },
        "put": {
            "delta": -0.49 if tent else -0.10,
            "gamma": 0.012,
            "theta": -1.1,
            "vega": 8.3,
            "iv": 0.15,
        },
    }
    return {
        "provenance": "live_capture",
        "captured_at": captured_at,
        "phase": "rth",
        "symbol": symbol,
        "expiration": expiration,
        "topic": f"mb:ladder:{symbol}:{expiration}:w25:dual",
        "generation": {
            "spot": spot,
            "as_of": captured_at,
            "content_hash": "fixture",
            "row_count": 1,
            "rows": [row],
        },
        "hole": None,
        "row_count": 1,
        "iv_count": 2,
        "greek_count": 2,
    }


def _write_snap(folder: Path, symbol: str, name: str, body: dict[str, Any]) -> None:
    dest = folder / "chain" / symbol
    dest.mkdir(parents=True, exist_ok=True)
    (dest / name).write_text(json.dumps(body), encoding="utf-8")


def build_fixture_store(root: Path) -> Path:
    """Fixed days the six proofs assert against."""
    # Whole RTH.
    whole = root / f"day={DAY_WHOLE.isoformat()}"
    _counts(whole, SYM, DAY_WHOLE.isoformat())
    _provenance(whole)
    _write_snap(
        whole,
        SYM,
        "snap-133000Z.json",
        _envelope(
            symbol=SYM,
            expiration=DAY_WHOLE.isoformat(),
            captured_at="2026-08-21T09:30:00-04:00",
            spot=5801.0,
        ),
    )
    _write_snap(
        whole,
        SYM,
        "snap-200000Z.json",
        _envelope(
            symbol=SYM,
            expiration=DAY_WHOLE.isoformat(),
            captured_at="2026-08-21T16:00:00-04:00",
            spot=5802.0,
        ),
    )

    # Partial: collected from 11:00–15:00 ET.
    partial = root / f"day={DAY_PARTIAL.isoformat()}"
    _counts(partial, SYM, DAY_PARTIAL.isoformat())
    _provenance(partial)
    _write_snap(
        partial,
        SYM,
        "snap-150000Z.json",
        _envelope(
            symbol=SYM,
            expiration=DAY_PARTIAL.isoformat(),
            captured_at="2026-08-20T11:00:00-04:00",
            spot=5790.0,
        ),
    )
    _write_snap(
        partial,
        SYM,
        "snap-190000Z.json",
        _envelope(
            symbol=SYM,
            expiration=DAY_PARTIAL.isoformat(),
            captured_at="2026-08-20T15:00:00-04:00",
            spot=5791.0,
        ),
    )

    # Wrap + dense session + scrubber + tent (2026-08-25).
    wrap = root / f"day={DAY_WRAP.isoformat()}"
    _counts(wrap, SYM, DAY_WRAP.isoformat())
    _provenance(wrap, wings=25)
    n = 5800
    start = 4 * 3600
    for i in range(n):
        total = start + i
        hh, rem = divmod(total, 3600)
        mm, ss = divmod(rem, 60)
        name = f"snap-{hh:02d}{mm:02d}{ss:02d}Z.json"
        cap = f"2026-08-25T{hh:02d}:{mm:02d}:{ss:02d}+00:00"
        _write_snap(
            wrap,
            SYM,
            name,
            _envelope(
                symbol=SYM,
                expiration=DAY_WRAP.isoformat(),
                captured_at=cap,
                spot=5800.0 + (i % 10) * 0.1,
            ),
        )
    _write_snap(
        wrap,
        SYM,
        "snap-001730Z.json",
        _envelope(
            symbol=SYM,
            expiration=DAY_WRAP.isoformat(),
            captured_at="2026-08-25T20:17:30-04:00",
            spot=5810.0,
        ),
    )
    _write_snap(
        wrap,
        SYM,
        "snap-051730Z.json",
        _envelope(
            symbol=SYM,
            expiration=DAY_WRAP.isoformat(),
            captured_at="2026-08-25T01:17:30-04:00",
            spot=5799.0,
        ),
    )
    # 14:32:06 ET = 18:32:06Z.
    _write_snap(
        wrap,
        SYM,
        "snap-183206Z.json",
        _envelope(
            symbol=SYM,
            expiration=DAY_WRAP.isoformat(),
            captured_at="2026-08-25T14:32:06-04:00",
            spot=5805.5,
            tent=True,
        ),
    )
    return root


@dataclass
class HttpResult:
    status: int
    body: dict[str, Any]
    raw: bytes
    headers: dict[str, str]


class ArchiveConsumer:
    """Time Machine's three calls. Paths differ: StudioOne vs Labs proxy."""

    def coverage(self, *, days: str, symbols: str = SYM) -> HttpResult:
        raise NotImplementedError

    def index(self, *, day: str, symbol: str = SYM) -> HttpResult:
        raise NotImplementedError

    def fetch(
        self,
        *,
        day: str,
        symbol: str = SYM,
        level: int = 0,
        from_t: str | None = None,
        to_t: str | None = None,
        day_hash: str = "",
    ) -> HttpResult:
        raise NotImplementedError


class StudioOneHttp(ArchiveConsumer):
    def __init__(self, host: str, port: int, token: str) -> None:
        self.host = host
        self.port = port
        self.token = token

    def _get(self, path: str) -> HttpResult:
        import http.client

        conn = http.client.HTTPConnection(self.host, self.port, timeout=60)
        try:
            conn.request(
                "GET",
                path,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept-Encoding": "identity",
                },
            )
            res = conn.getresponse()
            raw = res.read()
            headers = {k.lower(): v for k, v in res.getheaders()}
            body = json.loads(raw.decode("utf-8") or "{}")
            if not isinstance(body, dict):
                body = {"_non_object": body}
            return HttpResult(res.status, body, raw, headers)
        finally:
            conn.close()

    def coverage(self, *, days: str, symbols: str = SYM) -> HttpResult:
        return self._get(f"/api/coverage?days={days}&symbols={symbols}")

    def index(self, *, day: str, symbol: str = SYM) -> HttpResult:
        return self._get(f"/api/index?day={day}&symbol={symbol}")

    def fetch(
        self,
        *,
        day: str,
        symbol: str = SYM,
        level: int = 0,
        from_t: str | None = None,
        to_t: str | None = None,
        day_hash: str = "",
    ) -> HttpResult:
        q = f"/api/fetch?day={day}&symbol={symbol}&level={level}"
        if from_t:
            q += f"&from={from_t}"
        if to_t:
            q += f"&to={to_t}"
        if day_hash:
            q += f"&day_hash={day_hash}"
        return self._get(q)


class LabsProxyHttp(ArchiveConsumer):
    def __init__(self, client: Any) -> None:
        self.client = client

    def _get(self, path: str) -> HttpResult:
        res = self.client.get(path, headers={"Accept-Encoding": "identity"})
        raw = res.content
        body = res.json()
        if not isinstance(body, dict):
            body = {"_non_object": body}
        headers = {k.lower(): v for k, v in res.headers.items()}
        return HttpResult(res.status_code, body, raw, headers)

    def coverage(self, *, days: str, symbols: str = SYM) -> HttpResult:
        return self._get(f"/api/me/options-lab/archive/coverage?days={days}&symbols={symbols}")

    def index(self, *, day: str, symbol: str = SYM) -> HttpResult:
        return self._get(f"/api/me/options-lab/archive/index?day={day}&symbol={symbol}")

    def fetch(
        self,
        *,
        day: str,
        symbol: str = SYM,
        level: int = 0,
        from_t: str | None = None,
        to_t: str | None = None,
        day_hash: str = "",
    ) -> HttpResult:
        q = f"/api/me/options-lab/archive/fetch?day={day}&symbol={symbol}&level={level}"
        if from_t:
            q += f"&from={from_t}"
        if to_t:
            q += f"&to={to_t}"
        if day_hash:
            q += f"&day_hash={day_hash}"
        return self._get(q)


def _book(coverage: dict[str, Any], day: str) -> dict[str, Any]:
    for row in coverage.get("days") or []:
        if row.get("date") == day:
            books = row.get("books") or []
            assert books, f"coverage day {day} has no books"
            return books[0]
    raise AssertionError(f"coverage missing day {day}")


def prove_calendar(c: ArchiveConsumer) -> None:
    days = f"{DAY_WHOLE.isoformat()},{DAY_PARTIAL.isoformat()},{DAY_SEAM.isoformat()}"
    res = c.coverage(days=days)
    assert res.status == 200, res.body
    assert res.body.get("unreachable") is not True
    by = {row["date"]: row for row in res.body.get("days") or []}

    whole = by[DAY_WHOLE.isoformat()]
    assert whole["status"] == "rth_complete", whole
    wb = whole["books"][0]
    assert str(wb.get("first_at") or "").startswith("2026-08-21T09:30")
    assert str(wb.get("last_at") or "").startswith("2026-08-21T16:00")

    partial = by[DAY_PARTIAL.isoformat()]
    assert partial["status"] == "partial", partial
    pb = partial["books"][0]
    assert str(pb.get("first_at") or "").startswith("2026-08-20T11:00"), pb
    assert str(pb.get("last_at") or "").startswith("2026-08-20T15:00"), pb

    seam = by[DAY_SEAM.isoformat()]
    assert seam["status"] == "none", seam


def prove_timeline(c: ArchiveConsumer) -> None:
    idx = c.index(day=DAY_WRAP.isoformat())
    assert idx.status == 200, idx.body
    snaps = idx.body.get("snaps") or []
    assert snaps, "index empty — no session timeline"
    for row in snaps:
        assert set(row) <= {"t", "file", "bytes", "hole"} or set(row) == {
            "t",
            "file",
            "bytes",
            "hole",
        }
        assert "spot" not in row
        assert "generation" not in row
        assert "rows" not in row
    ts = [row["t"] for row in snaps if row.get("t")]
    parsed = [datetime.fromisoformat(t) for t in ts]
    assert parsed == sorted(parsed), "index not monotonic in t"
    files = [row["file"] for row in snaps if row.get("t")]
    i001 = files.index("snap-001730Z.json")
    i051 = files.index("snap-051730Z.json")
    assert i051 < i001, "wrap: 051730Z (morning) must precede 001730Z (20:17 ET)"
    assert idx.body.get("count") == sum(1 for r in snaps if r.get("t") and not r.get("hole"))


def prove_first_second(c: ArchiveConsumer) -> None:
    import time

    idx = c.index(day=DAY_WRAP.isoformat())
    assert idx.body.get("S") == 64
    digest = str(idx.body.get("hash") or "")
    t0 = time.perf_counter()
    got = c.fetch(day=DAY_WRAP.isoformat(), level=0, day_hash=digest)
    elapsed = time.perf_counter() - t0
    assert got.status == 200, got.body
    snaps = got.body.get("snaps") or []
    assert got.body.get("returned") == 91, got.body.get("returned")
    assert len(snaps) == 91
    for snap in snaps:
        gen = snap.get("generation") or {}
        assert gen.get("spot") is not None, "level 0 missing spot — mini chart cannot draw"
    assert elapsed < 8.0, f"level 0 too slow for first second: {elapsed:.2f}s"


def prove_scrubber(c: ArchiveConsumer) -> None:
    idx = c.index(day=DAY_WRAP.isoformat())
    k = int(idx.body.get("k") or 0)
    digest = str(idx.body.get("hash") or "")
    found: list[dict[str, Any]] = []
    for level in range(k + 1):
        got = c.fetch(
            day=DAY_WRAP.isoformat(),
            level=level,
            from_t="2026-08-25T14:32:00-04:00",
            to_t="2026-08-25T14:33:00-04:00",
            day_hash=digest,
        )
        assert got.status == 200, got.body
        snaps = got.body.get("snaps") or []
        assert len(snaps) <= 2, (
            f"windowed level {level} returned {len(snaps)} — "
            "Time Machine would have to hold the whole level for 14:32:06"
        )
        found.extend(snaps)
    assert any(s.get("_file") == "snap-183206Z.json" for s in found), found


def prove_tent(c: ArchiveConsumer) -> dict[str, Any]:
    """Open one envelope. Report what the capture holds vs what Analyzer needs."""
    cov = c.coverage(days=DAY_WRAP.isoformat())
    wings = _book(cov.body, DAY_WRAP.isoformat()).get("wings")
    idx = c.index(day=DAY_WRAP.isoformat())
    k = int(idx.body.get("k") or 0)
    digest = str(idx.body.get("hash") or "")
    env = None
    for level in range(k + 1):
        got = c.fetch(
            day=DAY_WRAP.isoformat(),
            level=level,
            from_t="2026-08-25T14:32:00-04:00",
            to_t="2026-08-25T14:33:00-04:00",
            day_hash=digest,
        )
        snaps = got.body.get("snaps") or []
        hit = next((s for s in snaps if s.get("_file") == "snap-183206Z.json"), None)
        if hit:
            env = hit
            break
    assert env is not None, "tent envelope 14:32:06 not in any windowed level"
    missing: list[str] = []
    if env.get("expiration") != DAY_WRAP.isoformat():
        missing.append("envelope.expiration")
    gen = env.get("generation") or {}
    if gen.get("spot") is None:
        missing.append("generation.spot")
    if "wings" not in env:
        # Tap does not write wings on the envelope; coverage/PROVENANCE does.
        if wings is None:
            missing.append("wings (not on envelope, not on coverage)")
    rows = gen.get("rows") or []
    if not rows:
        missing.append("generation.rows")
    else:
        side = rows[0].get("call") or rows[0]
        for g in GREEKS:
            if not isinstance(side, dict) or side.get(g) is None:
                missing.append(f"greeks.{g}")
    assert not missing, (
        "Analyzer needs fields the capture does not hold "
        f"(permanent for collected days): {missing}"
    )
    return {
        "expiration": env.get("expiration"),
        "spot": gen.get("spot"),
        "wings_on_envelope": "wings" in env,
        "wings_on_coverage": wings,
        "greeks": {g: (rows[0].get("call") or {}).get(g) for g in GREEKS},
        "note": (
            "wing band is not inside the snap envelope; Time Machine must take "
            "wings from coverage/PROVENANCE (coverage-declared)."
        ),
    }


def prove_seam(c: ArchiveConsumer) -> None:
    res = c.coverage(days=DAY_SEAM.isoformat())
    assert res.status == 200, res.body
    assert res.body.get("unreachable") is not True
    days = res.body.get("days") or []
    assert len(days) == 1
    assert days[0]["date"] == DAY_SEAM.isoformat()
    assert days[0]["status"] == "none"
    # Named absence, not an empty success ({days:[]}) and not a 5xx.


PROOFS: list[tuple[str, Callable[[ArchiveConsumer], Any]]] = [
    ("calendar", prove_calendar),
    ("timeline", prove_timeline),
    ("first_second", prove_first_second),
    ("scrubber", prove_scrubber),
    ("tent", prove_tent),
    ("seam", prove_seam),
]


def run_proofs(c: ArchiveConsumer) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for name, fn in PROOFS:
        out[name] = fn(c)
    return out
