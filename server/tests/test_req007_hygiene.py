"""REQ-007 v2: no client bin-assembly from candles; no capture-start date literal."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BANNED_DATES = ("2026-09-06", "Sep 6", "September 6")
# Client must not histogram candles.
CLIENT_BAN = ("histogramFromBars", "binFromCandle", "assembleHistogram")


def test_no_date_constant_in_window_path():
    roots = [
        REPO / "server/market_data/vp_engine/window_bins.py",
        REPO / "web/components/sa/SaPriceChart.tsx",
        REPO / "web/lib/saVpBand.ts",
    ]
    hits = []
    for p in roots:
        text = p.read_text(encoding="utf-8")
        for tok in BANNED_DATES:
            if tok in text:
                hits.append(f"{p.name}:{tok}")
    assert hits == []


def test_no_client_bin_assembly_helpers():
    web = REPO / "web"
    hits = []
    for p in web.rglob("*.ts*"):
        if "node_modules" in str(p) or ".next" in str(p):
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for tok in CLIENT_BAN:
            if tok in text:
                hits.append(f"{p.relative_to(REPO)}:{tok}")
    assert hits == []
