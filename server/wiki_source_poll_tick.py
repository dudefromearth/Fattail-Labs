"""SC-3 P2 tick — GET-only S1 help + S2 courses.

Cadence: every 15 minutes locally (launchd later). MiniTwo is NOT required
and is not configured by this packet.

Usage (repo .env loaded):

  cd server && .venv/bin/python wiki_source_poll_tick.py

Help catalog: LABS_WIKI_HELP_CATALOG_URL, default `/api/help/guides`
(Help packet — published help_reference/*.md).
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parent.parent
if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))


def _load_env() -> None:
    env_file = _REPO / ".env"
    if not env_file.is_file():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main() -> int:
    _load_env()
    from fastapi.testclient import TestClient

    from main import app
    from wiki_agent_http import GetOnlyClient
    from wiki_agent_poller import poll_courses_source, poll_help_source

    http_app = TestClient(app)
    http_app.headers.update({"Origin": "http://testserver"})

    def get_json(url: str):
        r = http_app.get(url)
        if r.status_code != 200:
            raise RuntimeError(f"GET {url} -> {r.status_code}")
        return r.json()

    client = GetOnlyClient(get_json)
    report: dict = {"cadence": "15m-local", "mini_two": False, "calls": []}
    report["courses"] = poll_courses_source(client)
    help_url = os.environ.get("LABS_WIKI_HELP_CATALOG_URL", "").strip() or "/api/help/guides"
    report["help"] = poll_help_source(client, list_url=help_url)
    report["calls"] = list(client.calls)
    if any(m != "GET" for m, _ in client.calls):
        raise SystemExit("poller issued a non-GET")
    print(json.dumps(report, default=str)[:8000])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
