"""SYM-SWAP — §5 fixture deleted; production trees stay FIXTURE-clean (SYM-AT-3).

REQ-003 cannot close on a fixture. After SYM-SWAP the tagged picker file
must not exist. Production-oriented web trees must not contain FIXTURE.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FIXTURE_REL = Path("artifacts/symbology/req-003-picker.json")
FIXTURE_PATH = REPO / FIXTURE_REL
TAG_RE = re.compile(r"\bFIXTURE\b")

# Next production entry: pages, components, client libs, public, tokens.
# Tests / e2e / node_modules / .next are not a production bundle.
_PROD_ROOTS = (
    REPO / "web" / "app",
    REPO / "web" / "components",
    REPO / "web" / "lib",
    REPO / "web" / "public",
    REPO / "web" / "styles",
)
_SKIP_DIR_NAMES = {
    "node_modules",
    ".next",
    "test-results",
    "__pycache__",
    ".git",
}
_SKIP_NAME_SUFFIXES = (
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
)
_TEXT_SUFFIXES = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".css",
    ".md",
    ".html",
    ".svg",
    ".txt",
}

# SYM-SWAP: no allowlist. The tagged picker file is deleted.
_ALLOWED: frozenset[Path] = frozenset()


def _is_skipped(path: Path) -> bool:
    if any(part in _SKIP_DIR_NAMES for part in path.parts):
        return True
    name = path.name
    return any(name.endswith(suf) for suf in _SKIP_NAME_SUFFIXES)


def _iter_prod_files() -> list[Path]:
    out: list[Path] = []
    for root in _PROD_ROOTS:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or _is_skipped(path):
                continue
            if path.suffix.lower() not in _TEXT_SUFFIXES:
                continue
            out.append(path)
    return out


def _tag_hits(text: str) -> bool:
    return TAG_RE.search(text) is not None


def _rel(path: Path) -> str:
    resolved = path.resolve()
    try:
        return str(resolved.relative_to(REPO))
    except ValueError:
        return str(resolved)


def _scan(paths: list[Path]) -> list[str]:
    offenders: list[str] = []
    for path in paths:
        resolved = path.resolve()
        if resolved in _ALLOWED:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if _tag_hits(text):
            offenders.append(_rel(path))
    return offenders


def test_fixture_file_deleted_after_swap():
    assert not FIXTURE_PATH.exists(), (
        f"{FIXTURE_REL} must be deleted at SYM-SWAP "
        "(surfaces consume the live StudioOne API)"
    )


def test_tag_matcher_does_not_trip_on_fixtures_plural():
    assert _tag_hits('"tag": "FIXTURE"')
    assert _tag_hits("carries a FIXTURE tag")
    assert not _tag_hits("POSTURE_FIXTURES")
    assert not _tag_hits("FIXTURE_UNIVERSE")
    assert not _tag_hits("FIXTURE_BASE")


def test_production_web_entry_forbids_fixture_tag():
    files = _iter_prod_files()
    assert files, "production web trees missing"
    offenders = _scan(files)
    assert not offenders, (
        f"production bundle must not contain FIXTURE: {offenders}"
    )


def test_allowlist_is_empty_after_swap():
    assert _ALLOWED == frozenset()
    assert not FIXTURE_PATH.exists()
    assert FIXTURE_PATH.resolve() not in {p.resolve() for p in _iter_prod_files()}


def test_scan_fails_when_tag_leaks_into_production_file(tmp_path):
    leak = tmp_path / "bundle.js"
    leak.write_text('export const tag = "FIXTURE";\n', encoding="utf-8")
    clean = tmp_path / "ok.js"
    clean.write_text("export const n = 1;\n", encoding="utf-8")
    hits = _scan([leak, clean])
    assert any(h.endswith("bundle.js") for h in hits), hits
    assert not any(h.endswith("ok.js") for h in hits)
