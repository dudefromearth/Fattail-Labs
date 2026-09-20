"""VPS1 ingest harness — recorded tape only. No live Massive."""

from __future__ import annotations

import gzip
import json
from pathlib import Path

from market_data.vp_ingest.capture import (
    ingest_ws_payload,
    maybe_absence_gap,
    parse_trade_event,
    record_disconnect_gap,
    replay_tape,
)
from market_data.vp_ingest.conditions import annotate, load_q4
from market_data.vp_ingest.store import prints_path


def _read_gz(path: Path) -> list[dict]:
    rows = []
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def test_q4_fixture_flags_ambiguous_and_oddlot_auction():
    doc = load_q4()
    assert doc["store_policy"].startswith("ALL prints")
    odd = annotate([37])
    assert odd["oddlot"] is True
    assert odd["auction"] is False
    auc = annotate([16])
    assert auc["auction"] is True
    unk = annotate([0, 999])
    assert 999 in unk["unknown_condition_ids"]
    # id 0 is in the fixture as AMBIGUOUS, not unknown
    two = next(c for c in doc["codes"] if c["id"] == 2)
    assert two["engine_volume"] is True


def test_parse_and_store_odd_lot_and_auction(tmp_path: Path):
    last = [0]
    gap = [None]
    frame = json.dumps(
        [
            {
                "ev": "T",
                "sym": "SPY",
                "p": 757.5,
                "s": 7,
                "x": 8,
                "c": [37],
                "t": 1_700_000_000_000,
                "pt": 1_700_000_000_000,
                "q": 11,
                "i": "1",
            },
            {
                "ev": "T",
                "sym": "SPY",
                "p": 757.6,
                "s": 100,
                "x": 4,
                "c": [16],
                "t": 1_700_000_000_100,
                "q": 12,
                "i": "2",
            },
        ]
    )
    n = ingest_ws_payload(frame, root=tmp_path, last_print_ms=last, open_gap=gap)
    assert n == 2
    rows = _read_gz(prints_path(tmp_path, "SPY", __import__("datetime").date(2023, 11, 14)))
    # 1700000000000 ms → 2023-11-14 UTC / ET still 14th
    assert any(r["oddlot"] and r["s"] == 7 for r in rows)
    assert any(r["auction"] and r["c"] == [16] for r in rows)
    assert all("p" in r and "s" in r and "x" in r and "c" in r and "t" in r for r in rows)


def test_replay_tape_no_live_socket(tmp_path: Path):
    frames = [
        json.dumps({"ev": "status", "status": "connected"}),
        json.dumps(
            {
                "ev": "T",
                "sym": "SPY",
                "p": 100.0,
                "s": 50,
                "x": 11,
                "c": [0, 12],
                "t": 1_720_000_000_000,
                "q": 9,
            }
        ),
    ]
    n = replay_tape(frames, tmp_path)
    assert n == 1


def test_print_absence_gap_300s_rth(tmp_path: Path):
    last = [1_720_000_000_000]
    gap: list = [None]
    # 09:35 ET 2024-07-01 = weekday RTH. 1720000000000 is 2024-07-03 06:26 UTC = 02:26 ET — not RTH.
    # Use a known RTH ms: 2024-07-01 14:00:00 ET = 2024-07-01 18:00:00 UTC
    from datetime import datetime
    from zoneinfo import ZoneInfo

    et = ZoneInfo("America/New_York")
    t0 = int(datetime(2024, 7, 1, 10, 0, tzinfo=et).timestamp() * 1000)
    last[0] = t0
    later = t0 + 301_000
    maybe_absence_gap(tmp_path, last, gap, later)
    assert gap[0] is not None
    assert gap[0]["kind"] == "print_absence"
    gfile = next((tmp_path / "vp/ingest/SPY/gaps").rglob("gaps.jsonl"))
    lines = gfile.read_text().strip().splitlines()
    assert any("print_absence" in ln for ln in lines)


def test_quiet_but_printing_is_not_a_gap(tmp_path: Path):
    last = [0]
    gap: list = [None]
    t = 1_720_000_000_000
    frame = json.dumps(
        {"ev": "T", "sym": "SPY", "p": 1, "s": 1, "x": 1, "c": [], "t": t, "q": 1}
    )
    ingest_ws_payload(frame, root=tmp_path, last_print_ms=last, open_gap=gap)
    maybe_absence_gap(tmp_path, last, gap, t + 10_000)
    assert gap[0] is None


def test_disconnect_records_feed_liveness_gap(tmp_path: Path):
    gap: list = [None]
    record_disconnect_gap(tmp_path, gap, 1_700_000_000_000)
    assert gap[0]["kind"] == "feed_liveness"


def test_quote_tick_source_unchanged():
    """mb:sym doc keys in sym_feed.tick stay the quote contract."""
    src = Path(__file__).resolve().parents[1] / "market_data" / "sym_feed.py"
    text = src.read_text(encoding="utf-8")
    assert '"symbol": product' in text
    assert '"mid": float(mid)' in text
    assert 'store.set_json(f"mb:sym:{product}", doc, ttl_s=30.0)' in text
    assert "LABS_VP_SPY_TRADES" in text
