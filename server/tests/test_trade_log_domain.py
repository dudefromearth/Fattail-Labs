"""Pure domain characterization — PH1-1 golden fixtures (useful invariants only)."""

from trade_log_domain import (
    build_day_book,
    build_reports_book,
    enrich_trades_with_synthetic_pnl,
    match_open_close,
    structure_key,
    unit_qty,
)


def _leg(
    side: str,
    qty: int,
    effect: str,
    strike: float,
    right: str = "PUT",
    under: str = "SPX",
    exp: str = "2026-04-21",
    fill: float = 1.0,
    ac: str = "equity_option",
) -> dict:
    return {
        "side": side,
        "quantity": qty,
        "pos_effect": effect,
        "underlier": under,
        "expiry": exp,
        "strike": strike,
        "right": right,
        "fill_price": fill,
        "asset_class": ac,
    }


def _trade(
    tid: int,
    account_id: int,
    exec_at: str,
    strategy: str,
    legs: list,
    net_price: float | None = None,
    net_side: str | None = None,
    pnl_amount: float | None = None,
    asset_class: str = "equity_option",
) -> dict:
    return {
        "id": tid,
        "account_id": account_id,
        "exec_at": exec_at,
        "strategy": strategy,
        "asset_class": asset_class,
        "order_type": "LMT",
        "net_price": net_price,
        "net_side": net_side,
        "pnl_amount": pnl_amount,
        "legs": legs,
        "setup_md": "",
        "plan_md": "",
        "rules_md": "",
        "adherence": "",
        "deviation_md": "",
        "lesson_md": "",
    }


def test_structure_key_normalizes_unit_scale():
    """3-6-3 and 1-2-1 share structure key (GCD unit qty)."""
    t1 = _trade(
        1,
        10,
        "2026-03-01T10:00:00",
        "BUTTERFLY",
        [
            _leg("BUY", 1, "TO_OPEN", 100),
            _leg("SELL", 2, "TO_OPEN", 95),
            _leg("BUY", 1, "TO_OPEN", 90),
        ],
    )
    t3 = _trade(
        2,
        10,
        "2026-03-02T10:00:00",
        "BUTTERFLY",
        [
            _leg("BUY", 3, "TO_OPEN", 100),
            _leg("SELL", 6, "TO_OPEN", 95),
            _leg("BUY", 3, "TO_OPEN", 90),
        ],
    )
    assert unit_qty(t1) == 1
    assert unit_qty(t3) == 3
    assert structure_key(t1) == structure_key(t3)


def test_fifo_match_and_synthetic_pnl_vertical():
    """
    Open DEBIT 2.00 + close CREDIT 3.50 → ( -2 + 3.5 ) × 100 × 1 = $150.
    Useful: locks synthetic realized formula (behavior freeze).
    """
    open_t = _trade(
        1,
        5,
        "2026-03-10T09:30:00",
        "VERTICAL",
        [
            _leg("BUY", 1, "TO_OPEN", 5000, fill=5.0),
            _leg("SELL", 1, "TO_OPEN", 4995, fill=3.0),
        ],
        net_price=2.0,
        net_side="DEBIT",
    )
    close_t = _trade(
        2,
        5,
        "2026-03-10T15:00:00",
        "VERTICAL",
        [
            _leg("SELL", 1, "TO_CLOSE", 5000, fill=4.0),
            _leg("BUY", 1, "TO_CLOSE", 4995, fill=0.5),
        ],
        net_price=3.5,
        net_side="CREDIT",
        pnl_amount=None,
    )
    matched = match_open_close([open_t, close_t])
    assert len(matched) == 1
    assert matched[0]["close"] is not None
    assert matched[0]["close"]["id"] == 2

    enriched = enrich_trades_with_synthetic_pnl([open_t, close_t])
    by_id = {t["id"]: t for t in enriched}
    assert by_id[2]["pnl_amount"] == 150.0


def test_synthetic_pnl_scales_butterfly_units():
    """Example from reportsBook: (-1.57 + 2.78) × 100 × 3 = 363."""
    open_t = _trade(
        10,
        1,
        "2026-04-01T10:00:00",
        "BUTTERFLY",
        [
            _leg("BUY", 3, "TO_OPEN", 7080),
            _leg("SELL", 6, "TO_OPEN", 7075),
            _leg("BUY", 3, "TO_OPEN", 7070),
        ],
        net_price=1.57,
        net_side="DEBIT",
    )
    close_t = _trade(
        11,
        1,
        "2026-04-01T14:00:00",
        "BUTTERFLY",
        [
            _leg("SELL", 3, "TO_CLOSE", 7080),
            _leg("BUY", 6, "TO_CLOSE", 7075),
            _leg("SELL", 3, "TO_CLOSE", 7070),
        ],
        net_price=2.78,
        net_side="CREDIT",
    )
    enriched = enrich_trades_with_synthetic_pnl([open_t, close_t])
    close = next(t for t in enriched if t["id"] == 11)
    assert close["pnl_amount"] == 363.0


def test_open_on_day_and_same_day_close():
    open_t = _trade(
        1,
        1,
        "2026-03-10T09:00:00",
        "VERTICAL",
        [
            _leg("BUY", 1, "TO_OPEN", 100),
            _leg("SELL", 1, "TO_OPEN", 95),
        ],
        net_price=1.0,
        net_side="DEBIT",
    )
    close_t = _trade(
        2,
        1,
        "2026-03-12T15:00:00",
        "VERTICAL",
        [
            _leg("SELL", 1, "TO_CLOSE", 100),
            _leg("BUY", 1, "TO_CLOSE", 95),
        ],
        net_price=0.5,
        net_side="CREDIT",
    )
    book_mid = build_day_book([open_t, close_t], "2026-03-11")
    assert 1 in book_mid["open_ids"]
    assert book_mid["open"][0]["role"] == "open"

    book_close = build_day_book([open_t, close_t], "2026-03-12")
    assert 1 not in book_close["open_ids"]  # closed that day → not still-open
    roles = {i["trade_id"]: i["role"] for i in book_close["activity"]}
    assert roles[2] == "fill_close"


def test_equity_series_and_drawdown():
    """Capital 1000; win +100 then lose -50 → end 1050; peak 1100; max DD -50/1100."""
    t1 = _trade(
        1,
        1,
        "2026-01-02T10:00:00",
        "VERTICAL",
        [_leg("BUY", 1, "TO_CLOSE", 100)],  # treated as close for orphan path
        net_price=1.0,
        net_side="CREDIT",
        pnl_amount=100.0,
    )
    t2 = _trade(
        2,
        1,
        "2026-01-03T10:00:00",
        "VERTICAL",
        [_leg("BUY", 1, "TO_CLOSE", 100)],
        net_price=1.0,
        net_side="DEBIT",
        pnl_amount=-50.0,
    )
    # Force close majority for orphan path not needed — stored pnl used
    t1["legs"] = [_leg("SELL", 1, "TO_CLOSE", 100)]
    t2["legs"] = [_leg("BUY", 1, "TO_CLOSE", 100)]

    book = build_reports_book(
        [t1, t2],
        [{"id": 1, "label": "Primary"}],
        "all",
        1000.0,
    )
    assert book["end_balance"] == 1050.0
    assert book["winners"] == 1
    assert book["losers"] == 1
    assert book["has_pnl_data"] is True
    # series: start + 2 fills
    assert len(book["series"]) == 3
    assert book["series"][1]["equity"] == 1100.0
    assert book["series"][1]["trade_id"] == 1
    assert book["series"][2]["equity"] == 1050.0
    assert abs(book["max_drawdown_pct"] - (-50.0 / 1100.0)) < 1e-9


def test_seed_row_adapters_feed_domain_enrich():
    """PH1-4: seed_reports_demo_pnl adapters produce domain-compatible trades."""
    from seed_reports_demo_pnl import _leg_dict, _trade_dict

    def leg_row(effect: str, side: str, strike: float, fill: float) -> dict:
        return {
            "quantity": 1,
            "pos_effect": effect,
            "underlier": "SPX",
            "expiry": "2026-04-21",
            "strike": strike,
            "option_right": "PUT",
            "side": side,
            "fill_price": fill,
            "asset_class": "equity_option",
        }

    base = {
        "account_id": 5,
        "asset_class": "equity_option",
        "strategy": "VERTICAL",
        "order_type": "LMT",
        "setup_md": "",
        "plan_md": "",
        "rules_md": "",
        "adherence": "",
        "deviation_md": "",
        "lesson_md": "",
    }
    open_t = _trade_dict(
        {
            **base,
            "id": 1,
            "exec_at": "2026-03-10T09:30:00",
            "net_price": 2.0,
            "net_side": "DEBIT",
            "pnl_amount": None,
        },
        [
            _leg_dict(leg_row("TO_OPEN", "BUY", 5000, 5)),
            _leg_dict(leg_row("TO_OPEN", "SELL", 4995, 3)),
        ],
    )
    close_t = _trade_dict(
        {
            **base,
            "id": 2,
            "exec_at": "2026-03-10T15:00:00",
            "net_price": 3.5,
            "net_side": "CREDIT",
            "pnl_amount": None,
        },
        [
            _leg_dict(leg_row("TO_CLOSE", "SELL", 5000, 4)),
            _leg_dict(leg_row("TO_CLOSE", "BUY", 4995, 0.5)),
        ],
    )
    assert open_t["legs"][0]["right"] == "PUT"
    enriched = enrich_trades_with_synthetic_pnl([open_t, close_t])
    assert next(t for t in enriched if t["id"] == 2)["pnl_amount"] == 150.0


def test_account_filter_scopes_reports():
    a = _trade(
        1,
        1,
        "2026-01-01T10:00:00",
        "NOTE",
        [],
        pnl_amount=10.0,
    )
    # NOTE with no legs skipped from match but still in filtered list with pnl
    a["strategy"] = "VERTICAL"
    a["legs"] = [_leg("SELL", 1, "TO_CLOSE", 50)]
    b = _trade(
        2,
        2,
        "2026-01-01T11:00:00",
        "VERTICAL",
        [_leg("SELL", 1, "TO_CLOSE", 50)],
        pnl_amount=999.0,
    )
    book = build_reports_book(
        [a, b],
        [{"id": 1, "label": "A"}, {"id": 2, "label": "B"}],
        1,
        10000.0,
    )
    assert book["trade_count"] == 1
    assert book["end_balance"] == 10010.0
    assert book["account_label"] == "A"
