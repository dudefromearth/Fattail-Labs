"""SYM2 — §5 tagged fixture hygiene (SYM-AT-3 production leak).

The REQ-003 picker fixture may carry the tag FIXTURE. Production-oriented
web trees must not. REQ-003 cannot close on this fixture. SYM3 is HOLD.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FIXTURE_REL = Path("artifacts/symbology/req-003-picker.json")
FIXTURE_PATH = REPO / FIXTURE_REL
TAG_RE = re.compile(r"\bFIXTURE\b")
PICKER_FOUR = ("SPX", "XSP", "ES", "MES")
PICKER_SHA1 = "a6af42c82f11fe732964527aa12158ee19937c28"

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

# Only the §5 fixture may carry the tag inside scanned trees.
_ALLOWED = frozenset({FIXTURE_PATH.resolve()})


def _picker_sha1(picker: list) -> str:
    canonical = json.dumps(picker, sort_keys=True, separators=(",", ":"))
    return hashlib.sha1(canonical.encode("utf-8")).hexdigest()


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


def test_fixture_carries_tag_and_hashed_picker_four():
    assert FIXTURE_PATH.is_file(), f"missing {FIXTURE_REL}"
    raw = FIXTURE_PATH.read_text(encoding="utf-8")
    assert _tag_hits(raw), "fixture must carry the FIXTURE tag"
    body = json.loads(raw)
    assert body["tag"] == "FIXTURE"
    assert body["spec_sha1"] == "c87580829301d9a44e678641023e32c07bca58d6"
    assert body["law"]["req_003_cannot_close_on_fixture"] is True
    assert body["law"]["sym_swap_required_before_ap1"] is True
    assert body["law"]["sym3"] == "HOLD"
    assert body["law"]["vps_stage_a_consumes"] is False
    assert body["not_in_picker"] == ["SPY"]

    picker = body["picker"]
    assert [row["symbol"] for row in picker] == list(PICKER_FOUR)
    assert "SPY" not in {row["symbol"] for row in picker}
    by_sym = {row["symbol"]: row for row in picker}
    assert by_sym["SPX"]["roles"] == ["options"]
    assert by_sym["XSP"]["roles"] == ["options"]
    assert by_sym["ES"]["roles"] == ["price-structure"]
    assert by_sym["MES"]["roles"] == ["price-structure"]
    for row in picker:
        assert row["state"] == "COMING", row
        assert row["state"] != "ACTIVE"
    digest = _picker_sha1(picker)
    assert digest == PICKER_SHA1
    assert body["picker_sha1"] == digest


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
        "production bundle must not contain FIXTURE "
        f"(allowlist={FIXTURE_REL}): {offenders}"
    )


def test_allowlist_is_only_the_fixture_path():
    assert _ALLOWED == frozenset({FIXTURE_PATH.resolve()})
    assert FIXTURE_PATH.resolve() not in {p.resolve() for p in _iter_prod_files()}
    assert _tag_hits(FIXTURE_PATH.read_text(encoding="utf-8"))
    assert _scan([FIXTURE_PATH]) == []


def test_scan_fails_when_tag_leaks_into_production_file(tmp_path):
    leak = tmp_path / "bundle.js"
    leak.write_text('export const tag = "FIXTURE";\n', encoding="utf-8")
    clean = tmp_path / "ok.js"
    clean.write_text("export const n = 1;\n", encoding="utf-8")
    hits = _scan([leak, clean])
    assert any(h.endswith("bundle.js") for h in hits), hits
    assert not any(h.endswith("ok.js") for h in hits)
