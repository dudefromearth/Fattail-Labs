"""SO-AR v0.8+A1 reader: t-order, derived stride, named holes, DST cascade."""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path

from market_data.ssr_archive_read import (
    API_VERSION,
    book_coverage,
    cadence_stats,
    day_fetch,
    day_index,
    derived_stride,
    dst_envelope_opens,
    folder_window,
    health,
    hole_http_status,
    level_indices,
    paths_hash,
    reconstruct_book,
    reset_dst_envelope_opens,
)


def _counts(folder: Path, symbol: str, expiration: str, *, not_today: bool = False) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    doc = {"day": folder.name.removeprefix("day="), "symbols": {}}
    if (folder / "COUNTS.json").is_file():
        doc = json.loads((folder / "COUNTS.json").read_text(encoding="utf-8"))
    doc.setdefault("symbols", {})[symbol] = {
        "snaps": 0,
        "expiration": expiration,
        "not_today": not_today,
    }
    (folder / "COUNTS.json").write_text(json.dumps(doc), encoding="utf-8")


def _write_snap(
    dest: Path,
    name: str,
    *,
    captured_at: str | None = None,
    as_of: str | None = None,
    extra: dict | None = None,
) -> Path:
    dest.mkdir(parents=True, exist_ok=True)
    body: dict = {
        "generation": {
            "spot": 1.0,
            "content_hash": name,
            "rows": [{"strike": 1}],
        }
    }
    if captured_at:
        body["captured_at"] = captured_at
    if as_of:
        body["generation"]["as_of"] = as_of
    if extra:
        body.update(extra)
    path = dest / name
    path.write_text(json.dumps(body), encoding="utf-8")
    return path


def test_derived_stride_thin_and_dense():
    """AT-SOAR-12 / 13: n=64 → S=1 k=0, ≥64 level-0; n=128 → S=2; n=5800 → S=64 k=6."""
    assert derived_stride(64) == (1, 0)
    assert len(level_indices(64, 0)) == 64
    s, k = derived_stride(128)
    assert (s, k) == (2, 1)
    n = 128
    seen: set[int] = set()
    for level in range(k + 1):
        idxs = level_indices(n, level)
        assert not (set(idxs) & seen)
        seen.update(idxs)
    assert seen == set(range(n))
    assert derived_stride(5800) == (64, 6)
    l0 = level_indices(5800, 0)
    assert 64 <= len(l0) <= 127


def test_coverage_gap_uses_t_and_15s_floor(tmp_path: Path):
    """AT-SOAR-4: GAP when delta > max(2.5× cadence, 15 s)."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    files = [
        "snap-000000Z.json",
        "snap-000002Z.json",
        "snap-000004Z.json",
        "snap-000140Z.json",
    ]
    for name in files:
        _write_snap(dest, name, captured_at="2026-08-24T20:00:00-04:00")
    book = book_coverage(day, "SPX", root=tmp_path)
    assert book["count"] == 4
    assert book["cadence_s"] == 2.0
    assert len(book["gaps"]) == 1
    assert book["gaps"][0]["hole"] == "GAP"
    assert book["gaps"][0]["missing_s"] == 96


def test_hash_t_order_differs_from_name_sort_on_wrap(tmp_path: Path):
    """AT-SOAR-5 / 41 / 42: wrapping book hashed in t-order; 001730Z is D 20:17 ET."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    _write_snap(dest, "snap-001730Z.json")
    _write_snap(dest, "snap-051730Z.json")
    recs = reconstruct_book(folder, "SPX", day)
    names = [r.name for r in recs]
    assert names == ["snap-051730Z.json", "snap-001730Z.json"]
    evening = next(r for r in recs if r.name == "snap-001730Z.json")
    assert evening.t is not None
    from zoneinfo import ZoneInfo

    assert evening.t.astimezone(ZoneInfo("America/New_York")).isoformat().startswith(
        "2026-08-25T20:17"
    )
    name_order = sorted(dest.glob("snap-*.json"), key=lambda p: p.name)
    assert [p.name for p in name_order] == ["snap-001730Z.json", "snap-051730Z.json"]
    assert paths_hash(recs) != paths_hash(name_order)
    idx = day_index(day, "SPX", root=tmp_path)
    assert [s["file"] for s in idx["snaps"]] == names
    assert idx["hash"] == paths_hash(recs)


def test_day_index_has_no_envelope_fields(tmp_path: Path):
    """AT-SOAR-6 / 7: t,file,bytes,hole only. No spot/content_hash. No JSON open."""
    reset_dst_envelope_opens()
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    _write_snap(dest, "snap-133000Z.json", captured_at="2026-08-25T09:30:00-04:00")
    idx = day_index(day, "SPX", root=tmp_path)
    assert idx["count"] == 1
    row = idx["snaps"][0]
    assert set(row) == {"t", "file", "bytes", "hole"}
    assert "spot" not in row
    assert "content_hash" not in row
    assert "generation" not in row
    assert "rows" not in row
    assert dst_envelope_opens == []
    recs = reconstruct_book(folder, "SPX", day)
    assert idx["hash"] == paths_hash(recs)


def test_today_retrieves_when_files_exist(tmp_path: Path, monkeypatch):
    """AT-SOAR-8 reversed · AT-TM-OS-3. TODAY_LIVE is not a fetch refusal."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    _write_snap(dest, "snap-133000Z.json")
    monkeypatch.setattr("market_data.ssr_live_capture.today_ny", lambda: day)
    idx = day_index(day, "SPX", root=tmp_path)
    assert idx["hole"] is None
    assert idx["count"] == 1
    assert idx["snaps"]
    got = day_fetch(day, "SPX", 0, root=tmp_path)
    assert got.get("hole") is None
    assert (got.get("count_on_disk") or 0) >= 1


def test_today_empty_is_none_not_today_live(tmp_path: Path, monkeypatch):
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    dest.mkdir(parents=True)
    _counts(folder, "SPX", "2026-08-25")
    monkeypatch.setattr("market_data.ssr_live_capture.today_ny", lambda: day)
    idx = day_index(day, "SPX", root=tmp_path)
    assert idx["hole"] != "TODAY_LIVE"
    assert idx["hole"] in ("NONE", None)
    got = day_fetch(day, "SPX", 0, root=tmp_path)
    assert got.get("hole") != "TODAY_LIVE"


def test_expiration_optional_assertion(tmp_path: Path):
    """AT-SOAR-9 / spec-C."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    _write_snap(dest, "snap-133000Z.json")
    ok = day_index(day, "SPX", root=tmp_path)
    assert ok["hole"] is None
    assert ok["count"] == 1
    assert ok["expiration"] == "2026-08-25"
    wrong = day_index(day, "SPX", expiration="2026-08-26", root=tmp_path)
    assert wrong["hole"] == "WRONG BOOK"
    assert wrong["snaps"] == []
    assert hole_http_status(wrong["hole"]) == 404
    fetch_wrong = day_fetch(day, "SPX", 0, expiration="2026-08-26", root=tmp_path)
    assert fetch_wrong["hole"] == "WRONG BOOK"


def test_missing_counts_is_unknown(tmp_path: Path):
    """AT-SOAR-10. Refused: 404 UNKNOWN, not 200 empty."""
    day = date(2026, 8, 25)
    dest = tmp_path / f"day={day.isoformat()}" / "chain" / "SPX"
    _write_snap(dest, "snap-133000Z.json")
    idx = day_index(day, "SPX", root=tmp_path)
    assert idx["hole"] == "UNKNOWN"
    assert idx["snaps"] == []
    assert hole_http_status(idx["hole"]) == 404
    got = day_fetch(day, "SPX", 0, root=tmp_path)
    assert got["hole"] == "UNKNOWN"
    assert hole_http_status(got["hole"]) == 404


def test_none_and_unknown_are_distinguishable(tmp_path: Path):
    """NONE is 200 empty (nothing there). UNKNOWN is 404 (cannot identify the book)."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    dest.mkdir(parents=True, exist_ok=True)
    _counts(folder, "SPX", "2026-08-25")
    empty = day_index(day, "SPX", root=tmp_path)
    assert empty["hole"] == "NONE"
    assert empty["snaps"] == []
    assert hole_http_status(empty["hole"]) == 200
    dest.joinpath("COUNTS.json").unlink(missing_ok=True)
    (folder / "COUNTS.json").unlink()
    unknown = day_index(day, "SPX", root=tmp_path)
    assert unknown["hole"] == "UNKNOWN"
    assert hole_http_status(unknown["hole"]) == 404
    assert hole_http_status("NONE") != hole_http_status("UNKNOWN")


def test_not_today(tmp_path: Path):
    """AT-SOAR-11."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    _counts(folder, "AAPL", "2026-08-25", not_today=True)
    idx = day_index(day, "AAPL", root=tmp_path)
    assert idx["hole"] == "NOT TODAY"
    assert hole_http_status(idx["hole"]) == 200
    book = book_coverage(day, "AAPL", root=tmp_path)
    assert book["status"] == "not_today"


def test_dense_session_s64_level0_about_91(tmp_path: Path):
    """Coach: real dense session, S=64, ~91 level-0 snaps — not only the n=64 floor."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    dest.mkdir(parents=True, exist_ok=True)
    _counts(folder, "SPX", "2026-08-25")
    n = 5800
    start = 4 * 3600
    for i in range(n):
        total = start + i
        hh, rem = divmod(total, 3600)
        mm, ss = divmod(rem, 60)
        (dest / f"snap-{hh:02d}{mm:02d}{ss:02d}Z.json").write_bytes(b"{}")
    idx = day_index(day, "SPX", root=tmp_path)
    assert idx["count"] == n
    assert idx["S"] == 64
    assert idx["k"] == 6
    z = day_fetch(day, "SPX", 0, root=tmp_path)
    assert z["S"] == 64
    assert z["returned"] == 91
    assert [s["_index"] for s in z["snaps"]] == list(range(0, n, 64))


def test_fetch_derived_levels_and_day_hash(tmp_path: Path):
    """AT-SOAR-12 / 14: n=128 → S=2; day_hash mismatch 409."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    for i in range(128):
        hh = i // 3600
        mm = (i % 3600) // 60
        ss = i % 60
        _write_snap(dest, f"snap-{hh:02d}{mm:02d}{ss:02d}Z.json")
    z = day_fetch(day, "SPX", 0, root=tmp_path)
    one = day_fetch(day, "SPX", 1, root=tmp_path)
    assert z["S"] == 2 and z["k"] == 1
    assert [s["_index"] for s in z["snaps"]] == list(range(0, 128, 2))
    assert [s["_index"] for s in one["snaps"]] == list(range(1, 128, 2))
    stale = day_fetch(day, "SPX", 0, day_hash="dead", root=tmp_path)
    assert stale["error"] == "day_changed"
    assert hole_http_status(None, error="day_changed") == 409


def test_fetch_window_and_next_index(tmp_path: Path):
    """AT-SOAR-15 window + continuation marker shape."""
    from market_data.ssr_archive_read import _parse_iso

    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    caps = (
        "2026-08-25T09:30:00-04:00",
        "2026-08-25T14:30:00-04:00",
        "2026-08-25T15:00:00-04:00",
    )
    # Filenames are the clock. 14:30 ET = 18:30Z. Window filter uses reconstructed t.
    names = ("snap-133000Z.json", "snap-183000Z.json", "snap-190000Z.json")
    for name, cap in zip(names, caps, strict=True):
        _write_snap(dest, name, captured_at=cap)
    got = day_fetch(
        day,
        "SPX",
        0,
        start=_parse_iso("2026-08-25T14:00:00-04:00"),
        end=_parse_iso("2026-08-25T14:45:00-04:00"),
        root=tmp_path,
    )
    assert got["S"] == 1
    assert [s["_file"] for s in got["snaps"]] == ["snap-183000Z.json"]


def test_fetch_bound_emits_next_index(tmp_path: Path, monkeypatch):
    """AT-SOAR-15: oversize fetch returns prefix + next_index."""
    import market_data.ssr_archive_read as ar

    monkeypatch.setattr(ar, "FETCH_MAX_ENVELOPES", 2)
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    for i in range(8):
        _write_snap(dest, f"snap-15000{i}Z.json")
    first = ar.day_fetch(day, "SPX", 0, root=tmp_path)
    assert first["returned"] == 2
    assert first["next_index"] == 2
    rest = ar.day_fetch(day, "SPX", 0, from_index=first["next_index"], root=tmp_path)
    assert rest["returned"] == 2
    assert [s["_index"] for s in first["snaps"]] == [0, 1]
    assert [s["_index"] for s in rest["snaps"]] == [2, 3]


def test_unreadable_and_out_of_window(tmp_path: Path):
    """AT-SOAR-16 / 17."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    dest.mkdir(parents=True, exist_ok=True)
    _counts(folder, "SPX", "2026-08-25")
    (dest / "snap-not-a-clock.json").write_text("{}", encoding="utf-8")
    idx = day_index(day, "SPX", root=tmp_path)
    holes = {s["file"]: s["hole"] for s in idx["snaps"]}
    assert holes["snap-not-a-clock.json"] == "UNREADABLE"
    dest.joinpath("snap-not-a-clock.json").unlink()
    # Spring-forward Sunday is 23h of UTC: clocks in [04:00Z, 05:00Z) have no in-window candidate.
    spring = date(2026, 3, 8)
    sfolder = tmp_path / f"day={spring.isoformat()}"
    sdest = sfolder / "chain" / "SPX"
    _counts(sfolder, "SPX", "2026-03-08")
    _write_snap(sdest, "snap-043000Z.json")
    sidx = day_index(spring, "SPX", root=tmp_path)
    assert sidx["snaps"][0]["hole"] == "OUT OF WINDOW"
    assert sidx["snaps"][0]["t"] is None


def test_health_does_not_walk_snaps(tmp_path: Path):
    """AT-SOAR-18."""
    reset_dst_envelope_opens()
    doc = health(root=tmp_path, tap_running=True)
    assert doc["api_version"] == API_VERSION
    assert doc["store_missing"] is False
    assert doc["tap_running"] is True
    assert dst_envelope_opens == []
    missing = health(root=tmp_path / "nope")
    assert missing["store_missing"] is True
    assert missing["hole"] == "STORE MISSING"


def test_cadence_from_t_not_name_wrap(tmp_path: Path):
    """AT-SOAR-33 / 43: deltas from reconstructed t are ≥0 across 00:00Z."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    _write_snap(dest, "snap-235959Z.json")
    _write_snap(dest, "snap-000001Z.json")
    recs = reconstruct_book(folder, "SPX", day)
    assert recs[0].t is not None and recs[1].t is not None
    assert recs[1].t >= recs[0].t
    stats = cadence_stats(day, "SPX", root=tmp_path)
    assert stats["within_dl400"] is not None
    assert "delta_median" in stats


def test_tap_restart_keeps_both(tmp_path: Path):
    """AT-SOAR-40."""
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    _write_snap(dest, "snap-133000Z.json")
    _write_snap(dest, "snap-133000Z__2.json")
    idx = day_index(day, "SPX", root=tmp_path)
    assert idx["count"] == 2
    assert idx["tap_restart"] is True
    assert hole_http_status(idx["hole"]) == 200


def test_dst_nearest_captured_at(tmp_path: Path):
    """AT-SOAR-46: fall-back Sunday 04:30Z nearest captured_at."""
    reset_dst_envelope_opens()
    day = date(2026, 11, 1)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-11-01")
    start, end = folder_window(day)
    from datetime import timezone as _utc

    assert (end.astimezone(_utc.utc) - start.astimezone(_utc.utc)).total_seconds() == 25 * 3600
    _write_snap(
        dest,
        "snap-043000Z.json",
        captured_at="2026-11-01T00:30:00-04:00",
    )
    recs = reconstruct_book(folder, "SPX", day)
    assert dst_envelope_opens == ["snap-043000Z.json"]
    assert recs[0].hole is None
    assert recs[0].t is not None
    assert recs[0].t == datetime(2026, 11, 1, 4, 30, tzinfo=timezone.utc)


def test_dst_as_of_six_seconds_off(tmp_path: Path):
    """AT-SOAR-46b."""
    reset_dst_envelope_opens()
    day = date(2026, 11, 1)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-11-01")
    _write_snap(
        dest,
        "snap-043000Z.json",
        as_of="2026-11-01T00:30:06-04:00",
    )
    recs = reconstruct_book(folder, "SPX", day)
    assert recs[0].t == datetime(2026, 11, 1, 4, 30, tzinfo=timezone.utc)


def test_dst_envelope_one_hour_off_rejected(tmp_path: Path):
    """AT-SOAR-46c then 49 if nothing else separates."""
    reset_dst_envelope_opens()
    day = date(2026, 11, 1)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-11-01")
    path = _write_snap(
        dest,
        "snap-043000Z.json",
        captured_at="2026-11-01T01:30:00-04:00",
    )
    path.touch()
    recs = reconstruct_book(folder, "SPX", day)
    assert recs[0].hole == "AMBIGUOUS INSTANT"
    assert recs[0].t is None


def test_non_fallback_window_equals_local_date(tmp_path: Path):
    """AT-SOAR-47."""
    reset_dst_envelope_opens()
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-08-25")
    _write_snap(dest, "snap-000000997Z.json")
    recs = reconstruct_book(folder, "SPX", day)
    assert dst_envelope_opens == []
    t = recs[0].t
    assert t is not None
    from zoneinfo import ZoneInfo

    assert t.astimezone(ZoneInfo("America/New_York")).date() == day


def test_dst_neighbour_before_mtime(tmp_path: Path):
    """AT-SOAR-48: unreadable envelope, mtime outside, neighbour-monotonic wins."""
    reset_dst_envelope_opens()
    day = date(2026, 11, 1)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    _counts(folder, "SPX", "2026-11-01")
    _write_snap(dest, "snap-051000Z.json")  # unambiguous: Nov 1 05:10Z
    bad = dest / "snap-043000Z.json"
    bad.write_text("not-json", encoding="utf-8")
    recs = reconstruct_book(folder, "SPX", day)
    dst = next(r for r in recs if r.name == "snap-043000Z.json")
    # Neighbour 05:10Z is Nov 1 05:10; c0=Nov1 04:30 satisfies c <= right.t
    assert dst.hole is None
    assert dst.t == datetime(2026, 11, 1, 4, 30, tzinfo=timezone.utc)
    assert "snap-043000Z.json" in dst_envelope_opens


def test_dst_ambiguous_instant(tmp_path: Path):
    """AT-SOAR-49."""
    reset_dst_envelope_opens()
    day = date(2026, 11, 1)
    folder = tmp_path / f"day={day.isoformat()}"
    dest = folder / "chain" / "SPX"
    dest.mkdir(parents=True, exist_ok=True)
    _counts(folder, "SPX", "2026-11-01")
    (dest / "snap-043000Z.json").write_text("not-json", encoding="utf-8")
    recs = reconstruct_book(folder, "SPX", day)
    assert recs[0].hole == "AMBIGUOUS INSTANT"
    assert recs[0].t is None
    idx = day_index(day, "SPX", root=tmp_path)
    assert idx["snaps"][0]["hole"] == "AMBIGUOUS INSTANT"
    assert hole_http_status("AMBIGUOUS INSTANT") == 200
