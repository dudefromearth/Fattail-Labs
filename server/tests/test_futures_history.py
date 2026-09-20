"""SODP2 — Massive-first provider. Fill is not this module."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from sa_dev.futures_history import bound_symbol_of, serve, vendor_ticker


def test_vendor_maps_long_form_not_identity():
    assert vendor_ticker("ESZ2026") == "ESZ6"
    assert vendor_ticker("MESZ2026") == "MESZ6"
    assert vendor_ticker("ESZ6") == "ESZ6"


def test_bound_expands_decade():
    assert bound_symbol_of("ESZ6") == "ESZ2026"


def test_esz2026_hits_esz6_not_empty(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_FUTURES_HISTORY_ROOT", str(tmp_path))
    seen: list[str] = []

    class Fake:
        def fetch_futures_aggs(self, ticker, **_kw):
            seen.append(ticker)
            t0 = int(datetime(2026, 6, 16, tzinfo=timezone.utc).timestamp() * 1000)
            t1 = int(datetime(2026, 9, 19, tzinfo=timezone.utc).timestamp() * 1000)
            return [
                {"t": t0, "o": 1, "h": 1, "l": 1, "c": 1, "v": 1},
                {"t": t1, "o": 1, "h": 1, "l": 1, "c": 1, "v": 1},
            ]

    import market_data.massive_client as mc
    import sa_dev.futures_history as fh

    monkeypatch.setattr(fh, "_print_tail", lambda *_a, **_k: [])
    monkeypatch.setattr(mc, "MassiveClient", lambda: Fake())
    body = serve("ES", tf="5m", contract="ESZ2026")
    assert seen == ["ESZ6"]
    assert body["ok"] is True
    assert body["bound_symbol"] == "ESZ2026"
    assert body["vendor_ticker"] == "ESZ6"
    assert body["price_source"] == "massive_futures_aggs"
    assert body["history_span_days"] >= 90
    assert body["short_history"] is False
    assert body.get("named_state") != "MASSIVE EMPTY"


def test_empty_massive_is_named_not_short_history(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_FUTURES_HISTORY_ROOT", str(tmp_path))

    class Empty:
        def fetch_futures_aggs(self, ticker, **_kw):
            return []

    import market_data.massive_client as mc
    import sa_dev.futures_history as fh

    monkeypatch.setattr(fh, "_print_tail", lambda *_a, **_k: [])
    monkeypatch.setattr(mc, "MassiveClient", lambda: Empty())
    body = serve("ES", tf="5m", contract="ESZ2026")
    assert body["ok"] is False
    assert body["named_state"] == "MASSIVE EMPTY"
    assert body["short_history"] is False
    assert body["bars"] == []


def test_fill_module_not_imported():
    import sa_dev.futures_history as fh

    assert not hasattr(fh, "_aggs_price_fill")
