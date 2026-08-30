"""Published help catalog GET — help_reference/*.md, course-shaped, no auth."""

from __future__ import annotations

from pathlib import Path

import pytest

import db
from main import app
from tests.conftest import LabsTestClient, cookie_for
from wiki_agent_http import GetOnlyClient, WikiAgentHttpError
from wiki_agent_poller import poll_help_source

REF = Path(__file__).resolve().parents[1] / "help_reference"
REQUIRED = {"id", "title", "body", "canonical_url", "status"}


def test_list_matches_disk_unauthenticated():
    disk = sorted(p.stem for p in REF.glob("*.md"))
    assert disk
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.get("/api/help/guides")
        assert r.status_code == 200, r.text
        articles = r.json()["articles"]
        assert {a["id"] for a in articles} == set(disk)
        for a in articles:
            assert REQUIRED <= set(a.keys())
            assert a["status"] == "published"
            path = REF / f"{a['id']}.md"
            assert a["body"] == path.read_text(encoding="utf-8")
            assert a["canonical_url"] == f"/api/help/guides/{a['id']}"
            one = client.get(f"/api/help/guides/{a['id']}")
            assert one.status_code == 200
            assert one.json()["id"] == a["id"]
            assert one.json()["body"] == a["body"]


def test_trade_log_autofilter_published():
    """TLAF3 — file present = published (DL-572)."""
    path = REF / "trade-log-autofilter.md"
    assert path.is_file()
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        listed = client.get("/api/help/guides")
        assert listed.status_code == 200, listed.text
        ids = {a["id"] for a in listed.json()["articles"]}
        assert "trade-log-autofilter" in ids
        one = client.get("/api/help/guides/trade-log-autofilter")
        assert one.status_code == 200, one.text
        body = one.json()
        assert body["status"] == "published"
        assert body["id"] == "trade-log-autofilter"
        assert "Autofilter" in body["title"]
        assert body["body"] == path.read_text(encoding="utf-8")
        assert "Find and Badge" in body["body"]
        low = body["body"].lower()
        assert "account" in low and "book" in low
        assert "already loaded on the page" not in low
        assert "already in the loaded book" not in low


def test_unknown_id_404():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        r = client.get("/api/help/guides/zz-not-a-help-guide")
        assert r.status_code == 404
        traversal = client.get("/api/help/guides/../help_ai")
        assert traversal.status_code == 404


def test_no_write_path():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        post = client.post("/api/help/guides", json={"id": "x", "body": "nope"})
        assert post.status_code in (404, 405, 401, 403, 422)
        put = client.put("/api/help/guides/overview", json={"body": "nope"})
        assert put.status_code in (404, 405, 401, 403, 422)
        # Member session cannot write the catalog either.
        authed = client.post(
            "/api/help/guides",
            cookies=cookie_for("administrator"),
            json={"id": "x", "body": "nope"},
        )
        assert authed.status_code in (404, 405, 401, 403, 422)


def test_options_lab_time_machine_published():
    """W9 — Time Machine help is the member name; Instant Replay is not."""
    path = REF / "options-lab-time-machine.md"
    assert path.is_file()
    body = path.read_text(encoding="utf-8")
    assert "Instant Replay" not in body
    assert "One surface, one scrubber" in body
    assert "picks the day" in body
    assert "fidelity" in body.lower()
    assert "cannot persist while scrubbing" in body.lower()
    assert "StudioOne" in body
    assert "Reset, then raise" in body
    low = body.lower()
    assert "from the open" not in low
    assert "no refresh" in low and "control" in low
    for other in REF.glob("*.md"):
        text = other.read_text(encoding="utf-8")
        assert "Instant Replay" not in text, other.name
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})
        listed = client.get("/api/help/guides")
        assert listed.status_code == 200, listed.text
        ids = {a["id"] for a in listed.json()["articles"]}
        assert "options-lab-time-machine" in ids
        one = client.get("/api/help/guides/options-lab-time-machine")
        assert one.status_code == 200, one.text
        assert one.json()["body"] == body


def test_wiki_poller_get_only_against_catalog():
    with LabsTestClient(app) as client:
        client.headers.update({"Origin": "http://testserver"})

        def get_json(url: str):
            r = client.get(url)
            assert r.status_code == 200, r.text
            return r.json()

        http = GetOnlyClient(get_json)
        rows = poll_help_source(http, list_url="/api/help/guides", land=False)
        assert http.calls and all(m == "GET" for m, _ in http.calls)
        assert http.calls[0] == ("GET", "/api/help/guides")
        with pytest.raises(WikiAgentHttpError, match="only GET"):
            http.request("POST", "/api/help/guides")
        assert {r["source_kind"] for r in rows} == {"help_guide"}
        disk = {p.stem for p in REF.glob("*.md")}
        assert {r["source_id"] for r in rows} == disk
        ids = list(disk)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM wiki_source_watermarks "
                    "WHERE source_kind = 'help_guide' AND source_id IN %s",
                    (tuple(ids),),
                )
                cur.execute(
                    "DELETE FROM wiki_contracts WHERE kind = 'source_contract' "
                    "AND source = 'help'"
                )
