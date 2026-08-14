"""Options campaign path helpers — no network."""

from pathlib import Path

from market_data.options_campaign import aggs_paths, catalog_paths, safe_ticker


def test_safe_ticker_strips_colon():
    assert safe_ticker("O:SPY240621C00550000") == "O_SPY240621C00550000"
    assert safe_ticker("O:SPXW260813C03000000") == "O_SPXW260813C03000000"


def test_layout_under_raw_options(tmp_path: Path):
    part, ok = catalog_paths(tmp_path, "SPX", "expired")
    assert part == (
        tmp_path / "raw" / "SPX" / "options" / "contracts" / "expired" / "part-000.parquet"
    )
    assert str(ok).endswith(".parquet.ok")

    aggs, aggs_ok = aggs_paths(tmp_path, "SPY", "O:SPY240621C00550000")
    assert "ticker=O_SPY240621C00550000" in str(aggs)
    assert aggs.name == "part-000.parquet"
    assert aggs_ok.name == "part-000.parquet.ok"
