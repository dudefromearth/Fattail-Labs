"""Posture plane law — open mapping (P-B4 fixture support).

Holiday / half-day / extended-hours must not report open=True.
"""

from routes.market_session import (
    _open_from_massive_doc,
    _printing_from_massive_doc,
)


def test_regular_open_is_true():
    assert _open_from_massive_doc({"market": "open"}) is True


def test_closed_holiday_is_false():
    assert _open_from_massive_doc({"market": "closed"}) is False


def test_early_close_is_false():
    assert _open_from_massive_doc({"market": "early-close"}) is False


def test_extended_hours_is_false():
    assert _open_from_massive_doc({"market": "extended-hours"}) is False


def test_exchange_open_fallback():
    assert _open_from_massive_doc({"exchanges": {"nyse": "open"}}) is True


def test_exchange_closed_fallback():
    assert _open_from_massive_doc({"exchanges": {"nyse": "closed"}}) is False


def test_extended_hours_still_printing():
    assert _printing_from_massive_doc({"market": "extended-hours"}) is True


def test_rth_is_printing():
    assert _printing_from_massive_doc({"market": "open"}) is True


def test_closed_is_not_printing():
    assert _printing_from_massive_doc({"market": "closed"}) is False
