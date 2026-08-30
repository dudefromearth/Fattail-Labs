"""Time Machine archive contract.

Fixture proofs (HTTP the way TM will): StudioOne direct, then Labs proxy twice.
Live smoke is opt-in: SOAR_TM_SMOKE=1.
"""

from __future__ import annotations

import json
import os
import threading
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.tm_archive_contract import (
    TOKEN,
    LabsProxyHttp,
    StudioOneHttp,
    build_fixture_store,
    prove_calendar,
    prove_first_second,
    prove_scrubber,
    prove_seam,
    prove_tent,
    prove_timeline,
    run_proofs,
)

pytestmark = pytest.mark.filterwarnings("ignore::DeprecationWarning")


@pytest.fixture(scope="module")
def fixture_root(tmp_path_factory: pytest.TempPathFactory) -> Path:
    root = tmp_path_factory.mktemp("tm-archive")
    build_fixture_store(root)
    return root


@pytest.fixture(scope="module")
def dash_server(fixture_root: Path, tmp_path_factory: pytest.TempPathFactory):
    from market_data.ssr_snapshot_dash import Handler, QuietHTTPServer

    os.environ["LABS_SSR_ARCHIVE_TOKEN"] = TOKEN
    import market_data.ssr_archive_read as reader

    orig = reader.archive_root
    reader.archive_root = lambda: fixture_root  # type: ignore[method-assign]
    httpd = QuietHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield "127.0.0.1", port
    finally:
        httpd.shutdown()
        httpd.server_close()
        reader.archive_root = orig  # type: ignore[method-assign]


@pytest.fixture()
def studio(dash_server) -> StudioOneHttp:
    host, port = dash_server
    return StudioOneHttp(host, port, TOKEN)


@pytest.fixture()
def labs(dash_server, tmp_path: Path, monkeypatch) -> LabsProxyHttp:
    host, port = dash_server
    monkeypatch.setenv("LABS_SSR_ARCHIVE_URL", f"http://{host}:{port}")
    monkeypatch.setenv("LABS_SSR_ARCHIVE_TOKEN", TOKEN)
    monkeypatch.setenv("LABS_SSR_ARCHIVE_CACHE_ROOT", str(tmp_path))
    from routes.ssr_archive import router

    app = FastAPI()
    app.include_router(router)
    monkeypatch.setattr(
        "routes.ssr_archive.require_session",
        lambda request: {"sub": "1", "role": "navigator", "identity_id": 1},
    )
    return LabsProxyHttp(TestClient(app))


def test_direct_studioone_contract(studio: StudioOneHttp):
    run_proofs(studio)


def test_labs_proxy_same_contract_then_byte_identical_cache(labs: LabsProxyHttp):
    run_proofs(labs)
    # Second proxy pass: cache hit, body unchanged (Time Machine must not see a flag).
    first = labs.index(day="2026-08-25")
    second = labs.index(day="2026-08-25")
    assert first.status == 200
    assert second.status == 200
    assert second.headers.get("x-labs-archive-cache") == "hit"
    assert first.raw == second.raw
    assert b"_cache_hit" not in second.raw
    first_f = labs.fetch(day="2026-08-25", level=0, day_hash=str(first.body.get("hash") or ""))
    second_f = labs.fetch(day="2026-08-25", level=0, day_hash=str(first.body.get("hash") or ""))
    assert second_f.headers.get("x-labs-archive-cache") == "hit"
    assert first_f.raw == second_f.raw


def test_proxy_defect_surface_is_status_and_body(studio: StudioOneHttp, labs: LabsProxyHttp):
    """Anything that passes direct and fails proxy is a proxy defect."""
    for name, fn in (
        ("calendar", prove_calendar),
        ("timeline", prove_timeline),
        ("first_second", prove_first_second),
        ("scrubber", prove_scrubber),
        ("tent", prove_tent),
        ("seam", prove_seam),
    ):
        fn(studio)
        fn(labs)


@pytest.mark.skipif(os.environ.get("SOAR_TM_SMOKE") != "1", reason="live store smoke opt-in")
def test_live_store_smoke():
    """Drift catcher: real store, no frozen counts. Requires token + StudioOne."""
    import urllib.request

    url = (os.environ.get("LABS_SSR_ARCHIVE_URL") or "http://studioone.local:5055").rstrip("/")
    token = ""
    env = Path("/Users/ernie/Fattail-Labs/.env")
    if env.is_file():
        for line in env.read_text().splitlines():
            if line.startswith("LABS_SSR_ARCHIVE_TOKEN="):
                token = line.split("=", 1)[1].strip()
    if not token:
        pytest.skip("no token")
    req = urllib.request.Request(
        f"{url}/api/coverage?days=2026-08-25&symbols=SPX",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        doc = json.loads(resp.read().decode())
    assert resp.status == 200  # type: ignore[attr-defined]
    days = doc.get("days") or []
    assert days, "live coverage empty for 2026-08-25"
    book = (days[0].get("books") or [None])[0]
    assert book and book.get("count", 0) > 0
    assert book.get("first_at")
    assert book.get("last_at")
