"""Entry-time R2R: potential ÷ risk at open (not outcome)."""

from trade_log_domain.structure import average_entry_r2r, entry_r2r


def _open_fly(*, debit: float, width: float = 10.0, center: float = 560.0) -> dict:
    return {
        "id": 1,
        "account_id": 1,
        "strategy": "BUTTERFLY",
        "asset_class": "equity_option",
        "exec_at": "2026-04-01T10:00:00",
        "net_price": debit,
        "net_side": "DEBIT",
        "legs": [
            {
                "side": "BUY",
                "quantity": 1,
                "pos_effect": "TO_OPEN",
                "asset_class": "equity_option",
                "strike": center - width,
                "right": "PUT",
            },
            {
                "side": "SELL",
                "quantity": 2,
                "pos_effect": "TO_OPEN",
                "asset_class": "equity_option",
                "strike": center,
                "right": "PUT",
            },
            {
                "side": "BUY",
                "quantity": 1,
                "pos_effect": "TO_OPEN",
                "asset_class": "equity_option",
                "strike": center + width,
                "right": "PUT",
            },
        ],
    }


def test_debit_fly_r2r_is_width_minus_risk_over_risk():
    # width 10, debit 1 → risk 1, max_potential = 10−1 = 9 → R2R = 9
    t = _open_fly(debit=1.0, width=10.0)
    r = entry_r2r(t)
    assert r is not None
    assert abs(r - 9.0) < 1e-9


def test_debit_fly_high_r2r_near_ten():
    # debit 0.91 on 10-wide → risk 0.91, max_potential 9.09 → R2R ≈ 9.99
    t = _open_fly(debit=0.91, width=10.0)
    r = entry_r2r(t)
    assert r is not None
    assert 9.5 < r < 10.5
    # Explicit Coach formula
    risk = 0.91
    width = 10.0
    assert abs(r - (width - risk) / risk) < 1e-9


def test_close_fill_has_no_entry_r2r():
    t = _open_fly(debit=1.0)
    for leg in t["legs"]:
        leg["pos_effect"] = "TO_CLOSE"
    assert entry_r2r(t) is None


def test_credit_vertical_r2r_width_minus_risk_over_risk():
    # width 5, credit 1 → risk = 5−1 = 4, max_potential = 5−4 = 1 → R2R = 0.25
    t = {
        "strategy": "VERTICAL",
        "net_price": 1.0,
        "net_side": "CREDIT",
        "legs": [
            {
                "side": "SELL",
                "quantity": 1,
                "pos_effect": "TO_OPEN",
                "asset_class": "equity_option",
                "strike": 100.0,
                "right": "PUT",
            },
            {
                "side": "BUY",
                "quantity": 1,
                "pos_effect": "TO_OPEN",
                "asset_class": "equity_option",
                "strike": 95.0,
                "right": "PUT",
            },
        ],
    }
    r = entry_r2r(t)
    assert r is not None
    assert abs(r - 0.25) < 1e-9
    risk = 4.0
    width = 5.0
    assert abs(r - (width - risk) / risk) < 1e-9


def test_r2r_is_not_outcome_win_rate():
    """Structural R2R ignores realized P&L / win rate entirely."""
    t = _open_fly(debit=1.0, width=10.0)
    t["pnl_amount"] = -999.0  # big loser outcome must not change entry R2R
    r = entry_r2r(t)
    assert r is not None
    assert abs(r - 9.0) < 1e-9


def test_average_entry_r2r():
    trades = [
        _open_fly(debit=1.0, width=10.0),  # 9
        _open_fly(debit=2.0, width=10.0),  # 4
    ]
    avg, n = average_entry_r2r(trades)
    assert n == 2
    assert avg is not None
    assert abs(avg - 6.5) < 1e-9
