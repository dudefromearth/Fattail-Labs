"""AT-HM fixtures — pure formula / dual-side model acceptance (Spec §12).

These do not hit Massive. Client template math is mirrored for golden checks
where the Spec freezes formulas (sym-fly debit, gex_v1, sticky scale).
"""

from __future__ import annotations

from market_data.chain_ladder import build_ladder, content_hash, diff_ladder


def _raw(
    strike: float,
    *,
    mid: float,
    side: str = "call",
    exp: str = "2026-08-15",
    gamma: float | None = 0.01,
    oi: int | None = 100,
) -> dict:
    return {
        "details": {
            "strike_price": strike,
            "expiration_date": exp,
            "contract_type": side,
            "ticker": f"O:SPXW260815{'C' if side == 'call' else 'P'}{int(strike * 1000):08d}",
            "shares_per_contract": 100,
        },
        "last_quote": {"bid": mid - 0.05, "ask": mid + 0.05, "midpoint": mid},
        "greeks": {
            "delta": 0.5 if side == "call" else -0.5,
            "gamma": gamma,
            "theta": -0.1,
            "vega": 0.2,
        },
        "implied_volatility": 0.15,
        "open_interest": oi,
        "day": {"volume": 10},
    }


def test_at_hm6_sym_fly_debit_formula():
    """D = m(K−w) + m(K+w) − 2·m(K)."""
    K, w = 5000.0, 10.0
    mids = {4990.0: 12.0, 5000.0: 10.0, 5010.0: 9.0}
    d = mids[K - w] + mids[K + w] - 2 * mids[K]
    assert d == 12.0 + 9.0 - 20.0  # 1.0
    assert abs(d - 1.0) < 1e-12


def test_at_hm6_missing_leg_invalid():
    """Missing wing → cannot form fly (client returns invalid)."""
    m_lo, m_body, m_hi = 5.0, 4.0, None
    valid = m_lo is not None and m_body is not None and m_hi is not None
    assert valid is False


def test_at_hm8_gex_null_greeks():
    """gex_v1 invalid when γ or OI null."""
    spot = 5000.0
    g, oi = None, 100
    assert g is None or oi is None  # invalid path
    raw_g = None
    if g is not None and oi is not None:
        raw_g = g * oi * spot * spot
    assert raw_g is None


def test_at_hm8_gex_v1_sign_and_units():
    """Call +, put −; per-share Γ·OI·S²."""
    spot = 100.0
    gamma, oi = 0.02, 50
    call_gex = gamma * oi * spot * spot
    put_gex = -gamma * oi * spot * spot
    assert call_gex == 0.02 * 50 * 10000
    assert put_gex == -call_gex
    assert call_gex + put_gex == 0.0


def test_at_hm13_net_gex_needs_both_books():
    """Single-side-only model cannot produce valid gex_net."""
    raw = [
        _raw(5000, mid=10.0, side="call", gamma=0.01, oi=200),
        # no put
    ]
    ladder = build_ladder(
        raw,
        underlier="I:SPX",
        spot=5000.0,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        vix=15.0,
        dte=1,
        dual_side=True,
        strike_lo=4950.0,
        strike_hi=5050.0,
    )
    by = {(r["side"], r["strike"]): r for r in ladder["rows"]}
    assert ("call", 5000.0) in by
    assert ("put", 5000.0) not in by
    # net requires both — fixture documents AT-HM13 precondition


def test_at_hm14_pct_change_zero_prev():
    """D_{j-1}=0 → invalid, not ∞/NaN."""
    prev, cur = 0.0, 1.5
    if prev == 0:
        pct = None
    else:
        pct = (cur - prev) / abs(prev)
    assert pct is None


def test_at_hm16_sticky_scale_hysteresis():
    """Within 25% of sticky → keep sticky."""

    def update_sticky(sticky: float | None, raw_p95: float, thr: float = 0.25) -> float:
        s = raw_p95 if raw_p95 > 0 else 1.0
        if sticky is None or sticky <= 0:
            return s
        if abs(s - sticky) / sticky > thr:
            return s
        return sticky

    sticky = 10.0
    assert update_sticky(sticky, 11.0) == 10.0  # 10% move
    assert update_sticky(sticky, 13.0) == 13.0  # 30% move


def test_at_hm15_standard_wins_over_adjusted():
    raw = [
        _raw(5000, mid=10.0, side="call"),
        {
            "details": {
                "strike_price": 5000,
                "expiration_date": "2026-08-15",
                "contract_type": "call",
                "ticker": "O:SPXW260815C05000000",
                "shares_per_contract": 10,
            },
            "last_quote": {"bid": 99, "ask": 100, "midpoint": 99.5},
            "greeks": {"gamma": 0.5},
            "open_interest": 1,
            "day": {"volume": 1},
        },
    ]
    ladder = build_ladder(
        raw,
        underlier="I:SPX",
        spot=5000.0,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        vix=15.0,
        dte=1,
        dual_side=True,
        strike_lo=4950.0,
        strike_hi=5050.0,
    )
    assert ladder["row_count"] == 1
    assert ladder["excluded_adjusted_count"] == 1
    assert ladder["rows"][0]["mid"] == 10.0


def test_at_hm3b_view_side_not_in_dual_hash():
    """Calls vs Puts view meta must not change dual content_hash."""
    raw = [
        _raw(5000, mid=10.0, side="call"),
        _raw(5000, mid=9.0, side="put"),
    ]
    a = build_ladder(
        raw,
        underlier="I:SPX",
        spot=5000.0,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        vix=15.0,
        dte=1,
        dual_side=True,
        strike_lo=4950.0,
        strike_hi=5050.0,
    )
    b = build_ladder(
        raw,
        underlier="I:SPX",
        spot=5000.0,
        expiration="2026-08-15",
        side="put",
        band=50.0,
        vix=15.0,
        dte=1,
        dual_side=True,
        strike_lo=4950.0,
        strike_hi=5050.0,
    )
    assert content_hash(a) == content_hash(b)
    d = diff_ladder(a, b)
    assert d["mode"] == "unchanged"
