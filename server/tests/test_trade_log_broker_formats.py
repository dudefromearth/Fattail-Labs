"""Broker CSV export/import round-trips (pure functions, no DB).

Covers the ToS Symbol-column fidelity fix and the Tradier adapter round-trip.
"""

from __future__ import annotations

import trade_log_io as tio


def _leg(side, qty, pe, sym, ac="equity_option", underlier=None, expiry=None,
         strike=None, right=None, price=0, fees=0):
    return {"side": side, "quantity": qty, "pos_effect": pe, "asset_class": ac,
            "underlier": underlier or sym, "symbol": sym, "expiry": expiry,
            "strike": strike, "right": right, "fill_price": price, "fees": fees}


def _occ(sym, exp, strike, r):
    return f"{sym} {exp} {strike}{r}"


SAMPLE = [
    {"exec_at": "2026-07-28T14:31:00Z", "strategy": "STOCK", "asset_class": "equity",
     "order_type": "LMT", "net_price": 210.50, "net_side": None,
     "legs": [_leg("BUY", 100, "TO_OPEN", "AAPL", ac="equity", price=210.50)]},
    {"exec_at": "2026-07-30T14:05:00Z", "strategy": "SINGLE", "asset_class": "equity_option",
     "order_type": "LMT", "net_price": 3.20, "net_side": "DEBIT",
     "legs": [_leg("BUY", 2, "TO_OPEN", _occ("SPY", "2026-08-15", 550, "C"),
                   underlier="SPY", expiry="2026-08-15", strike=550, right="CALL", price=3.20, fees=1.30)]},
    {"exec_at": "2026-08-08T15:10:00Z", "strategy": "BUTTERFLY", "asset_class": "equity_option",
     "order_type": "LMT", "net_price": 0.90, "net_side": "DEBIT",
     "legs": [_leg("BUY", 1, "TO_OPEN", _occ("SPY", "2026-08-29", 560, "C"),
                   underlier="SPY", expiry="2026-08-29", strike=560, right="CALL", price=6.30, fees=0.65),
              _leg("SELL", 2, "TO_OPEN", _occ("SPY", "2026-08-29", 570, "C"),
                   underlier="SPY", expiry="2026-08-29", strike=570, right="CALL", price=2.80, fees=1.30),
              _leg("BUY", 1, "TO_OPEN", _occ("SPY", "2026-08-29", 580, "C"),
                   underlier="SPY", expiry="2026-08-29", strike=580, right="CALL", price=1.00, fees=0.65)]},
]


def _leg_key(leg):
    strike = leg.get("strike")
    strike_v = float(strike) if strike not in (None, "") else None
    return (
        leg.get("side"),
        int(leg.get("quantity")),
        strike_v,  # compare numerically (550 == 550.0 across int/Decimal)
        (leg.get("right") or None),
        str(leg.get("expiry") or "")[:10],
    )


# --- thinkorswim -------------------------------------------------------------

def test_tos_symbol_column_is_underlier_for_options():
    csv_text = tio.export_thinkorswim(SAMPLE)
    lines = [ln for ln in csv_text.splitlines() if ",CALL," in ln or ",STOCK," in ln]
    # Option rows must carry the underlier (SPY / AAPL), never the composite symbol.
    assert any(",SPY,15 AUG 26,550,CALL," in ln for ln in lines)
    assert all("550C" not in ln for ln in lines)


def test_tos_roundtrip_preserves_legs():
    res = tio.parse("thinkorswim", tio.export_thinkorswim(SAMPLE))
    assert res["errors"] == []
    assert len(res["trades"]) == 3
    for orig, rt in zip(SAMPLE, res["trades"]):
        assert [_leg_key(l) for l in orig["legs"]] == [_leg_key(l) for l in rt["legs"]]


# --- Tradier -----------------------------------------------------------------

def test_tradier_export_uses_occ_symbols_and_signed_qty():
    csv_text = tio.export_tradier(SAMPLE)
    assert "date,type,symbol,quantity,price,amount,commission,description" in csv_text
    assert "SPY260815C00550000" in csv_text          # OCC option symbol
    assert ",-2," in csv_text                          # a SELL leg is signed negative
    assert "AAPL" in csv_text and "option" in csv_text


def test_tradier_roundtrip_preserves_legs_and_grouping():
    res = tio.parse("tradier", tio.export_tradier(SAMPLE))
    assert res["errors"] == []
    assert len(res["trades"]) == 3  # butterfly regrouped from 3 rows by shared date
    for orig, rt in zip(SAMPLE, res["trades"]):
        assert [_leg_key(l) for l in orig["legs"]] == [_leg_key(l) for l in rt["legs"]]


def test_tradier_detected():
    det = tio.detect(tio.export_tradier(SAMPLE))
    assert det and det[0]["id"] == "tradier"


def test_occ_build_parse_roundtrip():
    s = tio._occ_build("SPY", "2026-08-15", 550, "CALL")
    assert s == "SPY260815C00550000"
    got = tio._occ_parse(s)
    assert got == {"underlier": "SPY", "expiry": "2026-08-15", "strike": "550", "right": "CALL"}
