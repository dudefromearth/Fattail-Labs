"""Phase 2 process report pack — pure domain tests."""

from trade_log_domain.process_pack import (
    adherence_mix,
    adherence_rate_series,
    build_process_pack,
    campaign_summaries,
    records_summary_from_trades,
)


def _t(
    tid: int,
    day: str,
    *,
    adherence: str = "unknown",
    strategy: str = "BUTTERFLY",
    account_id: int = 1,
    campaign_id: int | None = None,
    close: bool = False,
) -> dict:
    return {
        "id": tid,
        "account_id": account_id,
        "exec_at": f"{day}T10:00:00",
        "strategy": strategy,
        "adherence": adherence,
        "practice_campaign_id": campaign_id,
        "legs": [
            {
                "pos_effect": "TO_CLOSE" if close else "TO_OPEN",
                "quantity": 1,
                "underlier": "SPY",
            }
        ],
    }


def test_adherence_mix_rates():
    trades = [
        _t(1, "2026-04-01", adherence="followed"),
        _t(2, "2026-04-01", adherence="followed"),
        _t(3, "2026-04-02", adherence="partial"),
        _t(4, "2026-04-02", adherence="broke"),
        _t(5, "2026-04-03", adherence="unknown"),
    ]
    mix = adherence_mix(trades)
    assert mix["counts"]["followed"] == 2
    assert mix["counts"]["partial"] == 1
    assert mix["counts"]["broke"] == 1
    assert mix["counts"]["unknown"] == 1
    assert mix["decided_count"] == 4
    assert mix["adherence_rate"] == 0.5


def test_adherence_rate_series_excludes_unknown_from_denom():
    trades = [
        _t(1, "2026-04-01", adherence="followed"),
        _t(2, "2026-04-01", adherence="unknown"),
        _t(3, "2026-04-02", adherence="broke"),
    ]
    pts = adherence_rate_series(trades, bucket="day")
    assert len(pts) == 2
    assert pts[0]["t"] == "2026-04-01"
    assert pts[0]["v"] == 1.0
    assert pts[0]["unknown"] == 1
    assert pts[1]["v"] == 0.0


def test_campaign_summary_process_only():
    camps = [
        {"id": 10, "title": "Season A", "status": "active"},
        {"id": 11, "title": "Old", "status": "completed"},
    ]
    trades = [
        _t(1, "2026-04-01", adherence="followed", campaign_id=10),
        _t(2, "2026-04-02", adherence="broke", campaign_id=10),
        _t(3, "2026-04-03", adherence="followed", campaign_id=11),
        _t(4, "2026-04-04", adherence="followed"),  # unlinked
    ]
    rows = campaign_summaries(trades, camps)
    assert len(rows) == 2
    active = next(r for r in rows if r["campaign_id"] == 10)
    assert active["trade_count"] == 2
    assert active["adherence_rate"] == 0.5
    assert "pnl" not in active
    assert "win_rate" not in active


def test_build_process_pack_window_and_no_campaigns():
    trades = [
        _t(1, "2026-04-01", adherence="followed"),
        _t(2, "2026-05-01", adherence="broke"),
    ]
    pack = build_process_pack(
        trades, campaigns=[], from_day="2026-04-01", to_day="2026-04-30"
    )
    assert pack["trade_count"] == 1
    assert pack["adherence"]["counts"]["followed"] == 1
    assert pack["has_campaigns"] is False
    assert pack["campaigns"] == []
    assert pack["process_only"] is True


def test_records_summary_by_adherence_no_pnl():
    trades = [
        _t(1, "2026-04-01", adherence="followed", strategy="VERTICAL"),
        _t(2, "2026-04-02", adherence="partial", strategy="VERTICAL", close=True),
    ]
    accounts = [{"id": 1, "label": "Primary", "broker": "thinkorswim"}]
    s = records_summary_from_trades(trades, accounts)
    assert s["trade_count"] == 2
    assert s["by_adherence"]["followed"] == 1
    assert s["by_adherence"]["partial"] == 1
    assert s["pnl_sum"] is None
    assert s["by_strategy"]["VERTICAL"] == 2
