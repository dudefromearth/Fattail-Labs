"""OPF session envelope (W4 · CL-21 / CL-11 / CL-13 · H3).

AT-SESS-1, AT-SESS-2, AT-SESS-7. Envelope sits beside mark_mode (H2).
"""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

import db
import identity as identity_mod
from opf.package import PackagePricer
from opf.resolve import resolve_pricing
from opf.session import (
    MASSIVE_SESSION_KEY,
    compute_opf_session,
    envelope_keys_ok,
    product_session_bounds,
    read_massive_session_doc,
)
from opf.static_facts import default_static_facts
from opf.tau import expiry_instant
from tests.conftest import cookie_for
from tests.test_opf_foundation import _fly_intent, _fly_store

NY = ZoneInfo("America/New_York")

_ENVELOPE_KEYS = ("market", "printing", "print_quality", "as_of", "generation_as_of")


def _assert_envelope(doc) -> None:
    assert envelope_keys_ok(doc), doc
    assert doc["market"] in ("open", "extended", "closed")
    assert doc["printing"] in (True, False)
    assert doc["print_quality"] in ("live", "last_print", "none")
    assert isinstance(doc["as_of"], str) and doc["as_of"]
    if doc["print_quality"] == "none":
        assert doc["generation_as_of"] is None
    else:
        assert doc["generation_as_of"] is None or isinstance(doc["generation_as_of"], str)
    # H4: this packet is session/print only
    blob = str(doc)
    assert "HELD/RESIDUAL" not in blob
    assert "held_residual" not in blob.lower()


# ── compute: mapping + H3 ──────────────────────────────────────────


def test_cl11_extended_hours_is_market_extended():
    """AT-SESS-2: Massive extended-hours / printing → market=extended, not closed."""
    env = compute_opf_session(
        massive_doc={"market": "extended-hours"},
        generation_as_of="2026-08-11T20:10:00Z",
        mark_sources=["last_trade"],
        expiration="2026-08-21",
        product="SPX",
        as_of_clock=datetime(2026, 8, 11, 16, 30, tzinfo=NY),
    )
    _assert_envelope(env)
    assert env["market"] == "extended"
    assert env["printing"] is True
    assert env["print_quality"] == "last_print"


def test_cl13_live_rth_complete_nbbo_is_live():
    """AT-SESS-7: live RTH + complete NBBO → print_quality=live."""
    env = compute_opf_session(
        massive_doc={"market": "open"},
        generation_as_of="2026-08-11T15:00:00-04:00",
        mark_sources=["nbbo", "nbbo", "nbbo"],
        expiration="2026-08-21",
        product="SPX",
        as_of_clock=datetime(2026, 8, 11, 15, 0, tzinfo=NY),
    )
    _assert_envelope(env)
    assert env["market"] == "open"
    assert env["printing"] is True
    assert env["print_quality"] == "live"


def test_h3_no_live_after_pm_expiry_even_if_extended():
    """H3: after that contract's OPF29 instant, print_quality is not live."""
    exp = "2026-08-11"
    clock = datetime(2026, 8, 11, 16, 5, tzinfo=NY)
    inst = expiry_instant(exp, settlement="pm")
    assert clock >= inst
    env = compute_opf_session(
        massive_doc={"market": "extended-hours"},
        generation_as_of="2026-08-11T20:01:00Z",
        mark_sources=["nbbo", "nbbo"],
        expiration=exp,
        settlement="pm",
        product="SPX",
        product_kind="index",
        as_of_clock=clock,
    )
    _assert_envelope(env)
    assert env["print_quality"] != "live"
    assert env["print_quality"] == "last_print"
    # Session class is not τ — index may still be open until 16:15
    assert env["market"] in ("open", "extended")


def test_h3_open_book_after_tau_still_not_live():
    exp = "2026-08-11"
    env = compute_opf_session(
        massive_doc={"market": "open"},
        generation_as_of="2026-08-11T20:01:00Z",
        mark_sources=["nbbo"],
        expiration=exp,
        settlement="pm",
        product="SPX",
        as_of_clock=datetime(2026, 8, 11, 16, 10, tzinfo=NY),
    )
    assert env["print_quality"] != "live"


def test_missing_session_doc_is_named_incomplete_not_clock():
    env = compute_opf_session(
        massive_doc=None,
        generation_as_of=None,
        mark_sources=[],
        expiration="2026-08-21",
        as_of_clock=datetime(2026, 8, 11, 11, 0, tzinfo=NY),
    )
    _assert_envelope(env)
    assert env["market"] == "closed"
    assert env["printing"] is False
    assert env["print_quality"] == "none"
    assert env["generation_as_of"] is None


def test_closed_held_generation_is_last_print():
    env = compute_opf_session(
        massive_doc={"market": "closed"},
        generation_as_of="2026-08-11T20:00:00Z",
        mark_sources=["last_trade"],
        expiration="2026-08-21",
        as_of_clock=datetime(2026, 8, 11, 18, 0, tzinfo=NY),
    )
    assert env["market"] == "closed"
    assert env["printing"] is False
    assert env["print_quality"] == "last_print"
    assert env["generation_as_of"] == "2026-08-11T20:00:00Z"


def test_extended_nbbo_is_not_live():
    """§2.1: open is the only Live NBBO claim."""
    env = compute_opf_session(
        massive_doc={"market": "extended-hours"},
        generation_as_of="2026-08-11T20:30:00Z",
        mark_sources=["nbbo"],
        expiration="2026-08-21",
        product="AAPL",
        product_kind="equity",
        as_of_clock=datetime(2026, 8, 11, 16, 30, tzinfo=NY),
    )
    assert env["market"] == "extended"
    assert env["print_quality"] == "last_print"


def test_od_sess_3_index_window_after_equity_close():
    """Massive already extended (equity 16:00); SPX still in 16:15 RTH."""
    env = compute_opf_session(
        massive_doc={"market": "extended-hours"},
        generation_as_of="2026-08-11T20:05:00Z",
        mark_sources=["nbbo"],
        expiration="2026-08-21",
        product="SPX",
        product_kind="index",
        as_of_clock=datetime(2026, 8, 11, 16, 5, tzinfo=NY),
    )
    assert env["market"] == "open"
    assert env["printing"] is True
    assert env["print_quality"] == "live"


def test_od_sess_3_equity_flips_at_1600_even_if_massive_open():
    env = compute_opf_session(
        massive_doc={"market": "open"},
        generation_as_of="2026-08-11T20:05:00Z",
        mark_sources=["nbbo"],
        expiration="2026-08-21",
        product="AAPL",
        product_kind="equity",
        as_of_clock=datetime(2026, 8, 11, 16, 5, tzinfo=NY),
    )
    assert env["market"] == "extended"
    assert env["print_quality"] == "last_print"


def test_od_sess_3_does_not_invent_open_from_closed():
    env = compute_opf_session(
        massive_doc={"market": "closed"},
        generation_as_of="2026-08-11T20:05:00Z",
        mark_sources=["nbbo"],
        expiration="2026-08-21",
        product="SPX",
        product_kind="index",
        as_of_clock=datetime(2026, 8, 11, 16, 5, tzinfo=NY),
    )
    assert env["market"] == "closed"


def test_product_session_bounds_reuse_profile():
    idx_open, idx_close = product_session_bounds("SPX", "index")
    eq_open, eq_close = product_session_bounds("AAPL", "equity")
    assert idx_close.hour == 16 and idx_close.minute == 15
    assert eq_close.hour == 16 and eq_close.minute == 0
    assert idx_open.hour == 9 and idx_open.minute == 30


def test_h1_read_does_not_call_massive(monkeypatch):
    """Envelope writer never hops to Massive (H1)."""

    def _boom(*_a, **_k):
        raise AssertionError("Massive must not be called from the envelope writer")

    monkeypatch.setattr(
        "market_data.massive_client.MassiveClient",
        _boom,
        raising=False,
    )
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "open"},
    )
    from opf.session import build_opf_session

    env = build_opf_session(
        generation_as_of="2026-08-11T15:00:00Z",
        mark_sources=["nbbo"],
        expiration="2026-08-21",
        as_of_clock=datetime(2026, 8, 11, 15, 0, tzinfo=NY),
    )
    assert env["print_quality"] == "live"
    assert MASSIVE_SESSION_KEY == "mb:session:market_status"


def test_read_massive_session_doc_never_writes(monkeypatch):
    writes: list = []

    class _Store:
        def get_json(self, key):
            assert key == MASSIVE_SESSION_KEY
            return {"market": "open"}

        def set_json(self, *a, **k):
            writes.append((a, k))

    monkeypatch.setattr("market_data.market_bus.config.bus_enabled", lambda: True)
    monkeypatch.setattr("market_data.market_bus.store.get_store", lambda: _Store())
    doc = read_massive_session_doc()
    assert doc and doc["market"] == "open"
    assert writes == []


# ── surfaces: quote / resolve (CL-21 + CL-13 RECON) ───────────────


def test_cl21_package_quote_carries_opf_session(monkeypatch):
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "open"},
    )
    store = _fly_store()
    clock = datetime.fromisoformat("2026-08-11T15:00:00-04:00")
    q = PackagePricer(
        store, facts=default_static_facts(), as_of_clock=clock
    ).quote(_fly_intent())
    _assert_envelope(q.get("opf_session"))
    assert q.get("mark_mode")  # H2: sits beside, not instead
    assert q["opf_session"]["print_quality"] == "live"
    assert q["opf_session"]["generation_as_of"]


def test_cl21_resolve_carries_opf_session(monkeypatch):
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "open"},
    )
    store = _fly_store()
    clock = datetime.fromisoformat("2026-08-11T15:00:00-04:00")
    out = resolve_pricing(
        use_case="day_trade",
        intent=_fly_intent(),
        store=store,
        facts=default_static_facts(),
        as_of_clock=clock,
        spot_override=100.0,
    )
    _assert_envelope(out.get("opf_session"))
    assert out["opf_session"]["print_quality"] == "live"
    assert out["opf_session"]["market"] == "open"


def test_cl13_live_rth_does_not_break_recon(monkeypatch):
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "open"},
    )
    store = _fly_store()
    clock = datetime.fromisoformat("2026-08-11T15:00:00-04:00")
    out = resolve_pricing(
        use_case="day_trade",
        intent=_fly_intent(),
        store=store,
        facts=default_static_facts(),
        as_of_clock=clock,
        spot_override=100.0,
    )
    assert out["opf_session"]["print_quality"] == "live"
    recon = (out.get("meta") or {}).get("recon") or {}
    assert recon.get("checked") is True, recon
    assert recon.get("pass") is True, recon


def test_cl11_package_quote_extended(monkeypatch):
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "extended-hours"},
    )
    store = _fly_store()
    clock = datetime(2026, 8, 11, 16, 30, tzinfo=NY)
    q = PackagePricer(
        store, facts=default_static_facts(), as_of_clock=clock
    ).quote(_fly_intent(), require_epoch_ok=False)
    _assert_envelope(q.get("opf_session"))
    assert q["opf_session"]["market"] == "extended"
    assert q["opf_session"]["printing"] is True
    assert q["opf_session"]["print_quality"] == "last_print"


def test_h3_package_quote_0dte_after_pm_expiry(monkeypatch):
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "extended-hours"},
    )
    exp = "2026-08-11"
    store = _fly_store(exp=exp, as_of="2026-08-11T20:05:00Z")
    clock = datetime(2026, 8, 11, 16, 5, tzinfo=NY)
    q = PackagePricer(
        store, facts=default_static_facts(), as_of_clock=clock
    ).quote(_fly_intent(exp=exp), require_epoch_ok=False)
    assert q["opf_session"]["print_quality"] != "live"
    assert q["mark_mode"]  # still present


# ── HTTP surfaces (CL-21) ─────────────────────────────────────────


def _member_cookies() -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-opf-session@labs.test", "ZZ OPF Session"
            )
    return cookie_for("activator", iid)


def _fly_http_body(*, exp: str = "2026-08-15") -> dict:
    store = _fly_store(exp=exp)
    key = store.list_keys()[0]
    gen = store.get(key)
    assert gen is not None
    return {
        "strategy": {
            "strategy_id": "fly1",
            "structure": "fly",
            "product": "SPX",
            "packages": 1.0,
            "legs": [
                {
                    "leg_id": "w1",
                    "side": "call",
                    "strike": 90.0,
                    "expiration": exp,
                    "qty": 1.0,
                    "product": "SPX",
                },
                {
                    "leg_id": "body",
                    "side": "call",
                    "strike": 100.0,
                    "expiration": exp,
                    "qty": -2.0,
                    "product": "SPX",
                },
                {
                    "leg_id": "w2",
                    "side": "call",
                    "strike": 110.0,
                    "expiration": exp,
                    "qty": 1.0,
                    "product": "SPX",
                },
            ],
        },
        "generations": [
            {
                "product": gen.key.product,
                "chain_underlier": gen.key.chain_underlier,
                "expiration": gen.key.expiration,
                "wings": gen.key.wings,
                "spot": gen.spot,
                "as_of": gen.as_of,
                "content_hash": gen.content_hash,
                "rows": gen.rows,
            }
        ],
    }


def test_cl21_http_package_quote_and_resolve(client, monkeypatch):
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "open"},
    )
    from routes import pricing as pricing_routes

    pricing_routes.get_opf_store().clear()
    cookies = _member_cookies()
    body = _fly_http_body()
    q = client.post("/api/me/pricing/package-quote", json=body, cookies=cookies)
    assert q.status_code == 200, q.text
    qj = q.json()
    _assert_envelope(qj.get("opf_session"))
    assert qj.get("mark_mode") is not None

    r = client.post(
        "/api/me/pricing/resolve",
        json={"use_case": "day_trade", "spot": 100.0, **body},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    rj = r.json()
    _assert_envelope(rj.get("opf_session"))
    pricing_routes.get_opf_store().clear()


def test_cl21_ladder_http_carries_opf_session(client, monkeypatch):
    monkeypatch.setattr(
        "opf.session.read_massive_session_doc",
        lambda: {"market": "extended-hours"},
    )
    payload = {
        "as_of": "2026-08-11T20:10:00Z",
        "content_hash": "h-ladder-sess",
        "expiration": "2026-08-21",
        "rows": [
            {"strike": 100.0, "side": "call", "mid": 1.1, "mid_source": "last_trade"},
        ],
    }
    monkeypatch.setattr(
        "routes.chain_ladder._resolve_universe_symbol",
        lambda *_a, **_k: {
            "product": "SPX",
            "chain_underlier": "I:SPX",
            "kind": "index",
            "strike_step": 5.0,
        },
    )
    monkeypatch.setattr("routes.chain_ladder._fetch_ladder", lambda **_k: payload)
    cookies = _member_cookies()
    r = client.get(
        "/api/me/market/chain-ladder",
        params={"expiration": "2026-08-21", "symbol": "SPX"},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    _assert_envelope(body.get("opf_session"))
    assert body["opf_session"]["market"] == "extended"
    assert body["opf_session"]["print_quality"] == "last_print"
    assert body["opf_session"]["generation_as_of"] == "2026-08-11T20:10:00Z"


def test_od_sess_4_session_status_route_not_deleted(client):
    cookies = _member_cookies()
    r = client.get("/api/me/market/session-status", cookies=cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "open" in body
    assert "source" in body
