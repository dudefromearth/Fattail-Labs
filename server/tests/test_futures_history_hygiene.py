"""SODP5 — struck fill deleted (grep-proof)."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
def test_fill_branch_gone():
    hits: list[str] = []
    for path in (REPO / "server/sa_dev").rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        if "def _aggs_price_fill" in text:
            hits.append(str(path.relative_to(REPO)))
        if "if requested or span_days" in text:
            hits.append(f"{path.relative_to(REPO)}: span branch")
    assert hits == []
