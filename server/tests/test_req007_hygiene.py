"""REQ-007 v2: no client bin-assembly from candles; no capture-start date literal."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BANNED_DATES = ("2026-09-06", "Sep 6", "September 6")
# Client must not histogram candles.
CLIENT_BAN = ("histogramFromBars", "binFromCandle", "assembleHistogram")


def test_r0_1_no_stale_90d_or_custom_series_comment():
    text = (REPO / "web/lib/saChartStyle.ts").read_text(encoding="utf-8")
    assert "90d" not in text
    assert "90 d" not in text.lower()
    assert "custom series" not in text.lower()
    assert "REQ-001" not in text


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


def test_first_load_range_fallback_deleted():
    chart = REPO / "web/components/sa/SaPriceChart.tsx"
    text = chart.read_text(encoding="utf-8")
    assert "rangeUrl" not in text
    assert "vr && fromT && toT" not in text
    assert "profileFetchPlan" in text
    assert "windowKickRef" in text
    plan = (REPO / "web/lib/saVpBand.ts").read_text(encoding="utf-8")
    assert "kind: \"wait\"" in plan or "kind: 'wait'" in plan
    assert "visible-range" in plan


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
