"""SODP5 — struck fill deleted (grep-proof)."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
WINDOW_TOKENS = (
    "requested_window_days",
    "REQUESTED_WINDOW_DAYS",
    'min_days: "90"',
    "min_days=90",
    "_REQ001_MIN_DAYS",
    "req001_min_days",
)


def test_fill_branch_gone():
    hits: list[str] = []
    for path in (REPO / "server/sa_dev").rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        if "def _aggs_price_fill" in text:
            hits.append(str(path.relative_to(REPO)))
        if "if requested or span_days" in text:
            hits.append(f"{path.relative_to(REPO)}: span branch")
    assert hits == []


def test_calendar_window_deleted_on_provider_and_surface():
    roots = [
        REPO / "server/sa_dev/futures_history.py",
        REPO / "server/sa_dev/service.py",
        REPO / "server/history_app.py",
        REPO / "web/components/sa/SaPriceChart.tsx",
    ]
    hits: list[str] = []
    for path in roots:
        text = path.read_text(encoding="utf-8")
        for tok in WINDOW_TOKENS:
            if tok in text:
                hits.append(f"{path.relative_to(REPO)}: {tok}")
    assert hits == []
