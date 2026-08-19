"""Chain Snapshot dashboard — localhost bind + day summary."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest


def test_quiet_server_binds_without_reverse_dns():
    import threading
    from http.client import HTTPConnection

    from market_data.ssr_snapshot_dash import Handler, QuietHTTPServer

    httpd = QuietHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        conn = HTTPConnection("127.0.0.1", port, timeout=2)
        conn.request("GET", "/")
        res = conn.getresponse()
        body = res.read()
        assert res.status == 200
        assert b"Chain Snapshot" in body
        assert b'href="/volume"' in body
        assert b"Tick Volume" in body
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_dash_host_lan_default(monkeypatch):
    monkeypatch.delenv("LABS_SSR_DASH_HOST", raising=False)
    from market_data.ssr_snapshot_dash import dash_host

    assert dash_host() == "0.0.0.0"


def test_dash_host_allows_localhost(monkeypatch):
    monkeypatch.setenv("LABS_SSR_DASH_HOST", "127.0.0.1")
    from market_data.ssr_snapshot_dash import dash_host

    assert dash_host() == "127.0.0.1"


def test_dash_host_rejects_public_bind(monkeypatch):
    monkeypatch.setenv("LABS_SSR_DASH_HOST", "1.2.3.4")
    from market_data.ssr_snapshot_dash import dash_host

    with pytest.raises(RuntimeError, match="0.0.0.0"):
        dash_host()


def test_dash_port_default(monkeypatch):
    monkeypatch.delenv("LABS_SSR_DASH_PORT", raising=False)
    from market_data.ssr_snapshot_dash import dash_port

    assert dash_port() == 5055


def test_summarize_day_nested_and_flat(tmp_path: Path):
    from market_data.ssr_snapshot_dash import summarize_day

    day = date(2026, 8, 17)
    folder = tmp_path / f"day={day.isoformat()}" / "chain"
    spy = folder / "SPY"
    spy.mkdir(parents=True)
    (spy / "snap-033238Z.json").write_text(
        json.dumps(
            {
                "symbol": "SPY",
                "captured_at": "2026-08-17T23:32:38-04:00",
                "phase": "closed",
                "hole": "NO CHAIN SPY",
                "iv_count": 0,
                "greek_count": 0,
            }
        ),
        encoding="utf-8",
    )
    (spy / "snap-033843Z.json").write_text(
        json.dumps(
            {
                "symbol": "SPY",
                "captured_at": "2026-08-17T23:38:43-04:00",
                "phase": "closed",
                "hole": None,
                "iv_count": 62,
                "greek_count": 62,
                "row_count": 62,
            }
        ),
        encoding="utf-8",
    )
    # Friday-flat sibling day
    fri = date(2026, 8, 14)
    flat = tmp_path / f"day={fri.isoformat()}" / "chain"
    flat.mkdir(parents=True)
    (flat / "snap-132009Z.json").write_text(
        json.dumps(
            {
                "topic": "mb:ladder:SPY:2026-08-14:w25:dual",
                "captured_at": "2026-08-14T09:20:09-04:00",
                "phase": "pre",
                "iv_count": 81,
                "row_count": 102,
            }
        ),
        encoding="utf-8",
    )

    mon = summarize_day(day, root=tmp_path)
    assert mon["snaps"] == 2
    assert mon["symbols_with_snaps"] == 1
    assert mon["latest_with_iv"] == 1
    assert mon["latest_holes"] == 0
    assert mon["symbols"][0]["symbol"] == "SPY"
    assert mon["symbols"][0]["iv_count"] == 62

    fri_doc = summarize_day(fri, root=tmp_path)
    assert fri_doc["snaps"] == 1
    assert fri_doc["symbols"][0]["symbol"] == "SPY"
    assert fri_doc["symbols"][0]["phase"] == "pre"
    assert fri_doc["latest_with_iv"] == 1


def test_count_day_does_not_need_json_body(tmp_path: Path):
    from market_data.ssr_snapshot_dash import count_day

    day = date(2026, 8, 17)
    spy = tmp_path / f"day={day.isoformat()}" / "chain" / "SPY"
    spy.mkdir(parents=True)
    (spy / "snap-033238Z.json").write_text("not-json", encoding="utf-8")
    doc = count_day(day, root=tmp_path)
    assert doc["snaps"] == 1
    assert doc["symbols"][0]["symbol"] == "SPY"


def test_list_days_newest_first(tmp_path: Path):
    from market_data.ssr_snapshot_dash import list_days

    (tmp_path / "day=2026-08-14").mkdir()
    (tmp_path / "day=2026-08-17").mkdir()
    (tmp_path / "logs").mkdir()
    assert list_days(tmp_path) == ["2026-08-17", "2026-08-14"]


def _volume_http(path: str, monkeypatch, tmp_path: Path):
    import threading
    from http.client import HTTPConnection

    from market_data.ssr_snapshot_dash import Handler, QuietHTTPServer

    bins = tmp_path / "vp_bins_v3"
    monkeypatch.setenv("LABS_VP_BINS_ROOT", str(bins))
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path / "gold"))
    httpd = QuietHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        conn = HTTPConnection("127.0.0.1", port, timeout=2)
        conn.request("GET", path)
        res = conn.getresponse()
        return res.status, res.read()
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_volume_page_title_and_nav(monkeypatch, tmp_path: Path):
    status, body = _volume_http("/volume", monkeypatch, tmp_path)
    assert status == 200
    assert b"<title>Tick Volume</title>" in body
    assert b'href="/"' in body
    assert b'href="/volume"' in body
    assert b"/api/volume-bins" in body


def test_api_volume_bins_sixteen_names_no_cash_indexes(monkeypatch, tmp_path: Path):
    from market_data.ssr_snapshot_dash import VOLUME_SYMBOLS

    status, body = _volume_http("/api/volume-bins", monkeypatch, tmp_path)
    assert status == 200
    doc = json.loads(body)
    names = [row["symbol"] for row in doc["symbols"]]
    assert names == list(VOLUME_SYMBOLS)
    assert len(names) == 16
    assert "SPX" not in names
    assert "XSP" not in names
    assert "VIX" not in names
    assert all(row["raw_days"] == 0 for row in doc["symbols"])
    assert all(row["bins"]["present"] is False for row in doc["symbols"])
    assert all(row["pull"]["present"] is False for row in doc["symbols"])


def test_volume_bins_payload_reads_meta_pull_and_raw_days(tmp_path: Path):
    from market_data.ssr_snapshot_dash import volume_bins_payload

    bins = tmp_path / "vp_bins_v3"
    pulls = tmp_path / "pulls"
    gold = tmp_path / "gold"
    spy_meta = bins / "SPY" / "_meta.json"
    spy_meta.parent.mkdir(parents=True)
    spy_meta.write_text(
        json.dumps(
            {
                "status": "ok",
                "total_volume": 1234567,
                "n_bins": 84,
                "last_day": "2026-08-18",
                "days_ok": 19,
            }
        ),
        encoding="utf-8",
    )
    nohup = pulls / "QQQ" / "nohup.out"
    nohup.parent.mkdir(parents=True)
    nohup.write_text("start\nday 2026-08-17\nrunning SPY skip\n", encoding="utf-8")
    day = gold / "raw" / "IWM" / "trades" / "year=2026" / "month=08" / "day=18"
    day.mkdir(parents=True)
    (day / "part-000.parquet").write_bytes(b"PAR1")
    extra = gold / "raw" / "IWM" / "trades" / "year=2026" / "month=08" / "day=19"
    extra.mkdir(parents=True)
    (extra / "part-000.parquet").write_bytes(b"PAR1")
    (extra / "other.parquet").write_bytes(b"skip")

    before = {p.relative_to(tmp_path) for p in tmp_path.rglob("*") if p.is_file()}
    doc = volume_bins_payload(bins_root=bins, pulls_root=pulls, market_root=gold)
    after = {p.relative_to(tmp_path) for p in tmp_path.rglob("*") if p.is_file()}
    assert after == before

    by_sym = {row["symbol"]: row for row in doc["symbols"]}
    assert by_sym["SPY"]["bins"]["present"] is True
    assert by_sym["SPY"]["bins"]["status"] == "ok"
    assert by_sym["SPY"]["bins"]["total_volume"] == 1234567
    assert by_sym["SPY"]["bins"]["n_bins"] == 84
    assert by_sym["SPY"]["bins"]["last_day"] == "2026-08-18"
    assert by_sym["SPY"]["bins"]["days_ok"] == 19
    assert by_sym["QQQ"]["pull"]["present"] is True
    assert by_sym["QQQ"]["pull"]["running"] is True
    assert "running SPY skip" in by_sym["QQQ"]["pull"]["tail"]
    assert by_sym["IWM"]["raw_days"] == 2
    assert by_sym["AAPL"]["raw_days"] == 0
    assert by_sym["AAPL"]["bins"]["present"] is False


def test_vp_bins_root_env(monkeypatch, tmp_path: Path):
    from market_data.ssr_snapshot_dash import DEFAULT_VP_BINS_ROOT, vp_bins_root, vp_pulls_root

    monkeypatch.delenv("LABS_VP_BINS_ROOT", raising=False)
    assert vp_bins_root() == DEFAULT_VP_BINS_ROOT
    assert vp_pulls_root() == DEFAULT_VP_BINS_ROOT.parent / "pulls"

    monkeypatch.setenv("LABS_VP_BINS_ROOT", str(tmp_path / "custom_v3"))
    assert vp_bins_root() == tmp_path / "custom_v3"
    assert vp_pulls_root() == tmp_path / "pulls"
