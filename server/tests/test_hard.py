"""FatTail Hard H1 — characterization (Hard Spec v1.0)."""

from __future__ import annotations

import hard_domain as hd
import identity as identity_mod
from tests.conftest import cookie_for
import db


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_hard_daily_logs WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_hard_enrollments WHERE identity_id = %s",
                (iid,),
            )
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def _all_tasks_done(variant_id: str) -> dict:
    v = hd.get_variant(variant_id)
    return {t["id"]: True for t in v["tasks"]}


def test_variants_catalog_fail_loud_unknown():
    try:
        hd.get_variant("nope")
        assert False, "expected HardDomainError"
    except hd.HardDomainError:
        pass
    variants = hd.list_variants_public()
    assert any(v["variant_id"] == "fattail_sprint_20" for v in variants)
    assert any(v["variant_id"] == "fattail_sprint_40" for v in variants)
    assert any(v["variant_id"] == "fattail_sprint_75" for v in variants)
    assert any(v["program_kind"] == "true_75" for v in variants)
    how = hd.how_it_works_public()
    assert "Mental Toughness" in how["headline"]
    assert any("day one" in r.lower() for r in how["rules"])
    assert how.get("ladder", {}).get("rungs")
    assert any(r.get("days") == 40 for r in how["ladder"]["rungs"])
    assert any("despair" in (r.get("blurb") or "").lower() for r in how["ladder"]["rungs"])
    life = how.get("life_and_priorities") or {}
    assert life.get("body")
    life_text = " ".join(life["body"]).lower()
    assert "drinking" in life_text or "alcohol" in life_text
    assert "vacation" in life_text or "wedding" in life_text
    v20 = next(v for v in variants if v["variant_id"] == "fattail_sprint_20")
    assert v20.get("ladder_blurb") and "twice" in v20["ladder_blurb"].lower()


def test_hard_enroll_daily_mt_empty_and_exit(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-hard@labs.test", "ZZ Hard"
            )
    cookies = cookie_for("activator", iid)
    try:
        # unenrolled → MT empty
        r = client.get("/api/me/hard", cookies=cookies)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["mental_toughness"]["empty"] is True
        assert body["mental_toughness"]["raw_percent"] is None
        assert body["physiology"]["required_cite"] is True
        assert "Touroutoglou" in body["physiology"]["primary"]["citation"]

        # enroll fattail 20
        r = client.post(
            "/api/me/hard/enroll",
            cookies=cookies,
            json={
                "program_kind": "fattail_hard",
                "variant_id": "fattail_sprint_20",
                "consent": {"hard_voluntary": True},
            },
        )
        assert r.status_code == 200, r.text
        en = r.json()["enrollment"]
        assert en["status"] == "active"
        eid = en["id"]
        snap0 = client.get("/api/me/hard", cookies=cookies).json()
        assert snap0.get("how_it_works", {}).get("headline")
        assert "Mental Toughness" in snap0["how_it_works"]["headline"]

        # second enroll blocked
        r2 = client.post(
            "/api/me/hard/enroll",
            cookies=cookies,
            json={
                "program_kind": "fattail_hard",
                "variant_id": "fattail_sprint_40",
            },
        )
        assert r2.status_code == 409

        # incomplete day → complete false; MT not empty
        r = client.post(
            "/api/me/hard/daily",
            cookies=cookies,
            json={"tasks": {"movement": True}, "progress_note": "partial"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["log"]["complete"] is False

        snap = client.get("/api/me/hard", cookies=cookies).json()
        assert snap["mental_toughness"]["empty"] is False
        assert snap["mental_toughness"]["raw_percent"] is not None
        assert 0 <= snap["mental_toughness"]["raw_percent"] <= 100

        # full day
        r = client.post(
            "/api/me/hard/daily",
            cookies=cookies,
            json={
                "tasks": _all_tasks_done("fattail_sprint_20"),
                "progress_note": "day done",
            },
        )
        assert r.status_code == 200, r.text
        assert r.json()["log"]["complete"] is True
        assert r.json()["compliance"]["today_complete"] is True

        # pause + resume
        r = client.post("/api/me/hard/pause", cookies=cookies)
        assert r.status_code == 200
        assert r.json()["enrollment"]["status"] == "paused"
        # MT empty while paused (no active)
        snap = client.get("/api/me/hard", cookies=cookies).json()
        assert snap["mental_toughness"]["empty"] is True

        r = client.post(
            "/api/me/hard/resume",
            cookies=cookies,
            json={"enrollment_id": eid},
        )
        assert r.status_code == 200, r.text
        assert r.json()["enrollment"]["status"] == "active"

        r = client.post("/api/me/hard/exit", cookies=cookies)
        assert r.status_code == 200
        assert r.json()["enrollment"]["status"] == "exited"
        snap = client.get("/api/me/hard", cookies=cookies).json()
        assert snap["mental_toughness"]["empty"] is True
        assert snap["active_enrollment"] is None
    finally:
        _cleanup(iid)


def test_hard_isolation_between_identities(client):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            a = identity_mod.get_or_create_identity(
                cur, "zztest-hard-a@labs.test", "ZZ Hard A"
            )
            b = identity_mod.get_or_create_identity(
                cur, "zztest-hard-b@labs.test", "ZZ Hard B"
            )
    ca, cb = cookie_for("activator", a), cookie_for("activator", b)
    try:
        r = client.post(
            "/api/me/hard/enroll",
            cookies=ca,
            json={
                "program_kind": "fattail_hard",
                "variant_id": "fattail_sprint_20",
            },
        )
        assert r.status_code == 200
        # B has no enrollment
        snap_b = client.get("/api/me/hard", cookies=cb).json()
        assert snap_b["active_enrollment"] is None
        assert snap_b["mental_toughness"]["empty"] is True
        # B cannot log daily
        r = client.post(
            "/api/me/hard/daily",
            cookies=cb,
            json={"tasks": _all_tasks_done("fattail_sprint_20")},
        )
        assert r.status_code == 409
    finally:
        _cleanup(a)
        _cleanup(b)


def test_day_complete_requires_all_required_tasks():
    vid = "fattail_sprint_20"
    assert hd.day_complete(vid, {}) is False
    assert hd.day_complete(vid, {"movement": True}) is False
    assert hd.day_complete(vid, _all_tasks_done(vid)) is True


def test_process_meters_mt_empty_then_enrolled(client):
    """H3: Journey process includes mental_toughness empty until Hard enroll."""
    import journey_scores as js

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, "zztest-hard-mt@labs.test", "ZZ Hard MT"
            )
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/journey/scores", cookies=cookies)
        assert r.status_code == 200, r.text
        proc = r.json()["process"]
        assert proc["scoring_model_version"] == js.SCORING_MODEL_VERSION
        mt = next(m for m in proc["meters"] if m["id"] == "mental_toughness")
        assert mt.get("empty") is True
        assert "mental_toughness" not in (proc.get("weights_applied") or {})

        r = client.post(
            "/api/me/hard/enroll",
            cookies=cookies,
            json={
                "program_kind": "fattail_hard",
                "variant_id": "fattail_sprint_20",
            },
        )
        assert r.status_code == 200, r.text

        r = client.get("/api/me/journey/scores", cookies=cookies)
        assert r.status_code == 200
        proc = r.json()["process"]
        mt = next(m for m in proc["meters"] if m["id"] == "mental_toughness")
        assert not mt.get("empty")
        assert mt["raw_percent"] is not None
        assert 0 <= mt["raw_percent"] <= 100
        assert proc["weights"].get("mental_toughness", 0) >= 8
        assert "mental_toughness" in (proc.get("weights_applied") or {})
        assert str(proc["scoring_model_version"]).startswith("pi-weights-v1-option1+mt")
    finally:
        _cleanup(iid)
