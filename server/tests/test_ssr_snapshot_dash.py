"""Chain Snapshot dashboard — localhost bind + day summary."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

TOKEN_32 = "b" * 32


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
        assert b'id="write-root"' in body
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


def test_available_and_retrieve_http(tmp_path: Path, monkeypatch):
    import json
    import threading
    from http.client import HTTPConnection

    from market_data.ssr_snapshot_dash import Handler, QuietHTTPServer

    day_root = tmp_path / "day=2026-08-25"
    day_dir = day_root / "chain" / "SPX"
    day_dir.mkdir(parents=True)
    (day_root / "COUNTS.json").write_text(
        json.dumps(
            {
                "day": "2026-08-25",
                "symbols": {"SPX": {"snaps": 1, "expiration": "2026-08-25", "not_today": False}},
            }
        ),
        encoding="utf-8",
    )
    (day_dir / "snap-150000Z.json").write_text(
        json.dumps(
            {
                "symbol": "SPX",
                "captured_at": "2026-08-25T11:00:00-04:00",
                "generation": {"rows": [1]},
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(
        "market_data.ssr_archive_read.archive_root", lambda: tmp_path
    )
    monkeypatch.setenv("LABS_SSR_ARCHIVE_TOKEN", TOKEN_32)
    auth = {"Authorization": f"Bearer {TOKEN_32}"}
    httpd = QuietHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/coverage?days=2026-08-25&symbols=SPX", headers=auth)
        res = conn.getresponse()
        avail = json.loads(res.read())
        assert res.status == 200
        assert avail["days"][0]["status"] == "partial"
        assert avail["days"][0]["books"][0]["first_at"].startswith("2026-08-25T11:00")
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/index?day=2026-08-25&symbol=SPX", headers=auth)
        res = conn.getresponse()
        idx = json.loads(res.read())
        assert res.status == 200
        assert idx["count"] == 1
        assert "spot" not in idx["snaps"][0]
        assert "content_hash" not in idx["snaps"][0]
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/fetch?day=2026-08-25&symbol=SPX&level=0", headers=auth)
        res = conn.getresponse()
        got = json.loads(res.read())
        assert res.status == 200
        assert got["returned"] == 1
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/index?day=2026-08-25&symbol=SPX&expiration=2026-08-26", headers=auth)
        res = conn.getresponse()
        wrong = json.loads(res.read())
        assert res.status == 404
        assert wrong["hole"] == "WRONG BOOK"
        assert wrong["snaps"] == []
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/index?day=2026-08-25", headers=auth)
        res = conn.getresponse()
        err = json.loads(res.read())
        assert res.status == 422
        del err
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_live_status_includes_write_root(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    from market_data.ssr_snapshot_dash import live_status

    st = live_status()
    assert "write_root" in st
    assert str(tmp_path / "ssr" / "live_capture") in st["write_root"]
    assert st["day"] in st["write_root"]


def test_absent_token_is_501_not_200(tmp_path: Path, monkeypatch):
    """No token configured ≠ authorized. Archive routes 501 ARCHIVE NOT CONFIGURED."""
    import threading
    from http.client import HTTPConnection

    from market_data.ssr_snapshot_dash import Handler, QuietHTTPServer

    monkeypatch.delenv("LABS_SSR_ARCHIVE_TOKEN", raising=False)
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    monkeypatch.setattr("market_data.ssr_archive_read.archive_root", lambda: tmp_path)
    httpd = QuietHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/")
        html = conn.getresponse()
        html.read()
        assert html.status == 200
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/coverage?symbols=SPX")
        res = conn.getresponse()
        body = json.loads(res.read())
        assert res.status == 501
        assert body["error"] == "ARCHIVE NOT CONFIGURED"
        assert "days" not in body
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_archive_token_short_fails_loud(monkeypatch):
    monkeypatch.setenv("LABS_SSR_ARCHIVE_TOKEN", "short")
    from market_data.ssr_snapshot_dash import archive_token

    with pytest.raises(RuntimeError, match="LABS_SSR_ARCHIVE_TOKEN"):
        archive_token()


def test_bearer_on_archive_routes_only(tmp_path: Path, monkeypatch):
    """AT-SOAR-27 / 28. `/` and `/api/status` open. Archive 401 is ARCHIVE AUTH, not empty days."""
    import threading
    from http.client import HTTPConnection

    from market_data.ssr_snapshot_dash import Handler, QuietHTTPServer

    monkeypatch.setenv("LABS_SSR_ARCHIVE_TOKEN", TOKEN_32)
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    monkeypatch.setattr("market_data.ssr_archive_read.archive_root", lambda: tmp_path)
    httpd = QuietHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/")
        res = conn.getresponse()
        assert res.status == 200
        assert b"Chain Snapshot" in res.read()

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/status")
        res = conn.getresponse()
        assert res.status == 200
        status = json.loads(res.read())
        assert "write_root" in status or "day" in status

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/days")
        res = conn.getresponse()
        assert res.status == 200
        res.read()

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/coverage?symbols=SPX")
        res = conn.getresponse()
        body = json.loads(res.read())
        assert res.status == 401
        assert body["error"] == "ARCHIVE AUTH"
        assert "days" not in body

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/coverage?symbols=SPX", headers={"Authorization": "Bearer wrong-token-wrong-token-wrong"})
        res = conn.getresponse()
        wrong = json.loads(res.read())
        assert res.status == 401
        assert wrong["error"] == "ARCHIVE AUTH"
        assert wrong.get("days") != []

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request(
            "GET",
            "/api/coverage?symbols=SPX",
            headers={"Authorization": f"Bearer {TOKEN_32}"},
        )
        res = conn.getresponse()
        ok = json.loads(res.read())
        assert res.status == 200
        assert "days" in ok
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/health", headers={"Authorization": f"Bearer {TOKEN_32}"})
        res = conn.getresponse()
        health = json.loads(res.read())
        assert res.status == 200
        assert health.get("api_version") == 1
        assert "store" in health

        # A2 W4: marks + stats are the same archive class. 401 ≠ empty tape / empty stats.
        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request(
            "GET",
            "/api/marks?day=2026-08-27&symbols=VIX&t=2026-08-27T01:16:03-04:00",
        )
        res = conn.getresponse()
        marks_unauth = json.loads(res.read())
        assert res.status == 401
        assert marks_unauth["error"] == "ARCHIVE AUTH"
        assert "marks" not in marks_unauth

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/stats")
        res = conn.getresponse()
        stats_unauth = json.loads(res.read())
        assert res.status == 401
        assert stats_unauth["error"] == "ARCHIVE AUTH"
        assert "days" not in stats_unauth

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request(
            "GET",
            "/api/marks?day=2026-08-27&symbols=VIX&t=2026-08-27T01:16:03-04:00",
            headers={"Authorization": f"Bearer {TOKEN_32}"},
        )
        res = conn.getresponse()
        marks_ok = json.loads(res.read())
        assert res.status in (200, 404)
        assert marks_ok.get("error") != "ARCHIVE AUTH"
        if res.status == 200:
            assert "marks" in marks_ok

        conn = HTTPConnection("127.0.0.1", port, timeout=4)
        conn.request("GET", "/api/stats", headers={"Authorization": f"Bearer {TOKEN_32}"})
        res = conn.getresponse()
        stats_ok = json.loads(res.read())
        assert res.status == 200
        assert stats_ok.get("api_version") == 1
        assert stats_ok.get("error") != "ARCHIVE AUTH"
    finally:
        httpd.shutdown()
        httpd.server_close()
