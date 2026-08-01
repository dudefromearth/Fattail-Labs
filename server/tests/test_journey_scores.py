"""Journey gamification scoring + leaderboard (Spec v1.0)."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import journey_scores as js
from tests.conftest import cookie_for


EASTERN = ZoneInfo("America/New_York")


def test_contribution_formula():
    assert js.contribution(10, 20, 3) == 10 + 20 + 8 * 3
    assert js.contribution(0, 0, 100) == 8 * js.STREAK_CAP


def test_process_grade_scale():
    assert js.process_grade(0)["label"] == "Poor"
    assert js.process_grade(24)["id"] == "poor"
    assert js.process_grade(25)["label"] == "Fair"
    assert js.process_grade(50)["label"] == "Good"
    assert js.process_grade(70)["label"] == "Great"
    assert js.process_grade(85)["label"] == "Excellent"
    assert js.process_grade(100)["id"] == "excellent"
    assert js.process_grade(0, establishing=True)["id"] == "establishing"
    scale = js.process_grade_scale()
    assert [b["label"] for b in scale] == [
        "Poor",
        "Fair",
        "Good",
        "Great",
        "Excellent",
    ]


def test_tenure_pulls_toward_center():
    # Day 0: raw 0 → graded near 50, not Poor
    adj0, w0 = js.apply_tenure_to_percent(0, tenure_days=0, ramp_days=42)
    assert w0 == 0.0
    assert adj0 == 50
    # Day 0 raw 100 → also 50 (can't start Excellent)
    assert js.apply_tenure_to_percent(100, 0, 42)[0] == 50
    # Mid ramp: partial pull
    adj_mid, w_mid = js.apply_tenure_to_percent(0, tenure_days=21, ramp_days=42)
    assert 0 < w_mid < 1
    assert 25 < adj_mid < 50  # pulled up from 0 toward 50
    # Full ramp: raw preserved
    assert js.apply_tenure_to_percent(0, 42, 42)[0] == 0
    assert js.apply_tenure_to_percent(100, 42, 42)[0] == 100


def test_scores_include_process_meters(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    r = client.get("/api/me/journey/scores", cookies=cookies)
    assert r.status_code == 200
    body = r.json()
    assert "process" in body
    p = body["process"]
    assert p["framing"] == "process_meter"
    assert p.get("scoring_model_version") == js.SCORING_MODEL_VERSION
    assert "weights" in p and isinstance(p["weights"], dict)
    assert sum(p["weights"].values()) == 100
    assert 0 <= p["overall_percent"] <= 100
    assert 0 <= p["overall_raw_percent"] <= 100
    assert "overall_raw_equal_mean" in p
    assert "grade" in p and p["grade"]["label"] in (
        "Establishing",
        "Poor",
        "Fair",
        "Good",
        "Great",
        "Excellent",
    )
    assert "tenure" in p
    assert "grade_scale" in p and len(p["grade_scale"]) == 5
    ids = {m["id"] for m in p["meters"]}
    assert "persistence" in ids
    assert "routine" in ids and "learning" in ids and "retrospective" in ids
    for m in p["meters"]:
        assert "weight" in m
    # No achievement / trophy framing
    assert "achievement" not in p["overall_label"].lower()


def test_process_weights_all_profiles_sum_100():
    for pid in js.PROCESS_METER_WEIGHTS:
        w = js.process_weights_for_profile(pid)
        assert sum(w.values()) == 100, pid
        # Option 1: quality share meaningful (adherence+retro)
        q = w["adherence"] + w["retrospective"]
        assert q >= 30, f"{pid} quality share {q} too low for Option 1"
        w_mt = js.process_weights_for_profile(pid, include_mental_toughness=True)
        assert sum(w_mt.values()) == 100, pid
        assert w_mt["mental_toughness"] >= 8
        assert "mental_toughness" not in w


def test_process_weights_unknown_profile_fails_loud():
    try:
        js.process_weights_for_profile("not_a_real_profile")
        assert False, "expected RuntimeError"
    except RuntimeError as e:
        assert "weights missing" in str(e)


def test_weighted_overall_raw_arithmetic():
    """raw_i already 0–100 — no 100× blow-up; renorm on empty."""
    weights = {
        "a": 50,
        "b": 50,
        "c": 0,
    }
    meters = [
        {"id": "a", "raw_percent": 100},
        {"id": "b", "raw_percent": 0},
        {"id": "c", "raw_percent": 50, "empty": True},
    ]
    # 50*100 + 50*0 / 100 = 50
    overall, applied = js.weighted_overall_raw(meters, weights)
    assert overall == 50
    assert applied == {"a": 50, "b": 50}
    assert overall <= 100


def test_weighted_overall_quality_dominates_engagement():
    """Option 1 observer: high engagement + zero quality must not look Excellent raw."""
    w = js.process_weights_for_profile("observer_trial")
    meters = [
        {"id": "persistence", "raw_percent": 100},
        {"id": "routine", "raw_percent": 100},
        {"id": "learning", "raw_percent": 100},
        {"id": "live", "raw_percent": 100},
        {"id": "adherence", "raw_percent": 0},
        {"id": "retrospective", "raw_percent": 0},
    ]
    overall, _ = js.weighted_overall_raw(meters, w)
    # engagement weights 55% at 100, quality 45% at 0 → 55
    assert overall == 55
    # Equal mean would be ~67 — weighted is lower (quality drag)
    equal = round(sum(m["raw_percent"] for m in meters) / 6)
    assert overall < equal


def test_adherence_dual_empty():
    # No trades → empty
    raw, empty = js.adherence_raw_from_counts(0, 0, 0)
    assert empty is True and raw is None
    # Trades but untagged → raw 0, not empty (do not renorm away)
    raw, empty = js.adherence_raw_from_counts(10, 0, 0)
    assert empty is False and raw == 0
    # Tagged 4/10 good
    raw, empty = js.adherence_raw_from_counts(10, 10, 4)
    assert empty is False and raw == 40


def test_practice_persistence_weeks():
    # 8 of 12 weeks active → 100% at target of 8
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)
    weeks: set[tuple[int, int]] = set()
    d = now.astimezone(js.EASTERN).date()
    for i in range(8):
        w = (d - timedelta(days=7 * i)).isocalendar()
        weeks.add((w[0], w[1]))
    pct, active, _streak = js.practice_persistence(
        weeks, now=now, horizon_weeks=12, target_weeks=8
    )
    assert active == 8
    assert pct == 100


def test_observer_trial_profile_six_week_horizon():
    p = js.METER_PROFILE_OBSERVER_TRIAL
    assert p["persistence_weeks"] == 6
    assert p["persistence_target_weeks"] == 5
    nav_m = js.METER_PROFILE_NAVIGATOR_MONTHLY
    nav_y = js.METER_PROFILE_NAVIGATOR_ANNUAL
    assert nav_y["persistence_weeks"] > nav_m["persistence_weeks"]


def test_rt71_cadence_formula_boundaries():
    """Spec §4.1a: d≤H → 100; 1.5H → 50; d≥2H → 0."""
    H = 30
    assert js.retrospective_cadence_raw(0, H) == 100
    assert js.retrospective_cadence_raw(H, H) == 100
    assert js.retrospective_cadence_raw(H + 1, H) == round(100 * (H - 1) / H)
    assert js.retrospective_cadence_raw(int(1.5 * H), H) == 50
    assert js.retrospective_cadence_raw(2 * H, H) == 0
    assert js.retrospective_cadence_raw(2 * H + 10, H) == 0
    # Spec v0.51: trial weekly H=7; alumni 90; free n/a
    assert js.METER_PROFILE_OBSERVER_TRIAL["retro_horizon_days"] == 7
    assert js.METER_PROFILE_OBSERVER_TRIAL["grade_ramp_days"] == 42  # tenure ≠ cadence
    assert js.METER_PROFILE_NAVIGATOR_MONTHLY["retro_horizon_days"] == 30
    assert js.METER_PROFILE_NAVIGATOR_ANNUAL["retro_horizon_days"] == 90
    assert js.METER_PROFILE_ALUMNI["retro_horizon_days"] == 90
    assert js.METER_PROFILE_FREE_OBSERVER["retro_horizon_days"] is None


def test_rt71_retrospective_meter_not_soon(client, probe_identity):
    """Activator probe: cadence meter is not soon; may be empty under E2 grace."""
    cookies = cookie_for("activator", probe_identity)
    r = client.get("/api/me/journey/scores", cookies=cookies)
    assert r.status_code == 200
    p = r.json()["process"]
    assert p["profile"].get("retro_horizon_days") == 30
    retro = next(m for m in p["meters"] if m["id"] == "retrospective")
    assert retro.get("soon") is not True
    assert "soon" not in retro or retro["soon"] is False
    # Label is cadence, not "Coming soon"
    assert "cadence" in retro["label"].lower() or "Retrospective" in retro["label"]
    assert "Coming soon" not in retro.get("detail", "")


def _cadence_member(email: str, role: str = "activator"):
    import identity as identity_mod
    import db

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Cadence")
            cur.execute(
                "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                (role, iid),
            )
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
    return iid


def _cadence_cleanup(iid: int):
    import db

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_rt71_open_retro_does_not_move_clock(client):
    """§D.2 #11: ready open does not hold meter — clock from prior completed_at."""
    import db

    iid = _cadence_member("zztest-cadence-open@labs.test")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md, completed_at)
                   VALUES (%s, 'complete', 1,
                           DATE_SUB(NOW(), INTERVAL 40 DAY),
                           DATE_SUB(NOW(), INTERVAL 20 DAY),
                           'Done', '',
                           DATE_SUB(NOW(), INTERVAL 20 DAY))""",
                (iid,),
            )
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md)
                   VALUES (%s, 'ready', 0, DATE_SUB(NOW(), INTERVAL 20 DAY),
                           NOW(), 'Open', '')""",
                (iid,),
            )
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/journey/scores", cookies=cookies)
        assert r.status_code == 200
        retro = next(
            m for m in r.json()["process"]["meters"] if m["id"] == "retrospective"
        )
        assert not retro.get("empty")
        assert retro.get("days_since", 0) >= 19
        assert retro.get("clock") == "last_complete"
        assert retro["raw_percent"] == js.retrospective_cadence_raw(
            int(retro["days_since"]), 30
        )
    finally:
        _cadence_cleanup(iid)


# --- RT7-3 cadence verification (delta §D.2 items 10–17) ----------------------


def test_rt73_d2_10_formula_exact_boundaries():
    """#10: H and 2H exact boundaries."""
    for H in (30, 42, 90):
        assert js.retrospective_cadence_raw(H, H) == 100
        assert js.retrospective_cadence_raw(2 * H, H) == 0
        assert js.retrospective_cadence_raw(int(1.5 * H), H) == 50


def test_rt73_d2_12_abandoned_does_not_move_clock(client):
    """#12: abandoned does not move pointer — still prior complete."""
    import db

    iid = _cadence_member("zztest-cadence-abandon@labs.test")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md, completed_at)
                   VALUES (%s, 'complete', 1,
                           DATE_SUB(NOW(), INTERVAL 50 DAY),
                           DATE_SUB(NOW(), INTERVAL 15 DAY),
                           'Done', '',
                           DATE_SUB(NOW(), INTERVAL 15 DAY))""",
                (iid,),
            )
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md)
                   VALUES (%s, 'abandoned', 0,
                           DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(),
                           'Abandoned', '')""",
                (iid,),
            )
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/journey/scores", cookies=cookies)
        retro = next(
            m for m in r.json()["process"]["meters"] if m["id"] == "retrospective"
        )
        assert retro.get("clock") == "last_complete"
        assert retro.get("days_since", 0) >= 14
    finally:
        _cadence_cleanup(iid)


def test_rt73_d2_13_e2_grace_empty_excluded_from_average(client):
    """#13: no complete, d≤H → empty; not in overall average denominator."""
    iid = _cadence_member("zztest-cadence-e2@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/journey/scores", cookies=cookies)
        body = r.json()["process"]
        retro = next(m for m in body["meters"] if m["id"] == "retrospective")
        # Fresh activator: E2 grace empty
        assert retro.get("empty") is True
        scored = [
            m
            for m in body["meters"]
            if not m.get("empty") and not m.get("soon")
        ]
        assert all(m["id"] != "retrospective" for m in scored)
        # Denominator excludes empty cadence
        if scored:
            raw_avg = sum(m["raw_percent"] for m in scored) / len(scored)
            assert abs(body["overall_raw_percent"] - round(raw_avg)) <= 1
    finally:
        _cadence_cleanup(iid)


def test_rt73_d2_14_free_observer_empty_not_zero(client):
    """#14: below activator → empty, never scored 0 as penalty."""
    iid = _cadence_member("zztest-cadence-free@labs.test", role="observer")
    import db

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                (iid,),
            )
    cookies = cookie_for("observer", iid)
    try:
        r = client.get("/api/me/journey/scores", cookies=cookies)
        assert r.status_code == 200
        body = r.json()["process"]
        assert body["profile"]["id"] == "free_observer"
        assert body["profile"].get("retro_horizon_days") is None
        retro = next(m for m in body["meters"] if m["id"] == "retrospective")
        assert retro.get("empty") is True
        # Empty meters use percent display path without punishing zero in average
        scored_ids = {
            m["id"]
            for m in body["meters"]
            if not m.get("empty") and not m.get("soon")
        }
        assert "retrospective" not in scored_ids
    finally:
        _cadence_cleanup(iid)


def test_rt73_d2_15_maiden_complete_live_at_100(client):
    """#15: completed maiden → meter live ~100; tenure blocks day-one Poor."""
    import db

    iid = _cadence_member("zztest-cadence-maiden@labs.test")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md, completed_at)
                   VALUES (%s, 'complete', 1,
                           DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(),
                           'Maiden', '', NOW())""",
                (iid,),
            )
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/journey/scores", cookies=cookies)
        body = r.json()["process"]
        retro = next(m for m in body["meters"] if m["id"] == "retrospective")
        assert not retro.get("empty")
        assert retro.get("days_since", 99) <= 1
        assert retro["raw_percent"] == 100
        # Overall cannot be Poor on day-one tenure
        g = body["grade"]
        assert g["id"] != "poor" or g.get("establishing")
    finally:
        _cadence_cleanup(iid)


def test_rt73_d2_16_nudge_and_horizon_same_field(client):
    """#16: nudge uses same horizon as meter (profile.retro_horizon_days)."""
    import db

    iid = _cadence_member("zztest-cadence-nudge@labs.test")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md, completed_at)
                   VALUES (%s, 'complete', 1,
                           DATE_SUB(NOW(), INTERVAL 50 DAY),
                           DATE_SUB(NOW(), INTERVAL 35 DAY),
                           'Old', '',
                           DATE_SUB(NOW(), INTERVAL 35 DAY))""",
                (iid,),
            )
    cookies = cookie_for("activator", iid)
    try:
        r = client.get("/api/me/journey/scores", cookies=cookies)
        body = r.json()["process"]
        H = body["profile"]["retro_horizon_days"]
        assert H == 30
        retro = next(m for m in body["meters"] if m["id"] == "retrospective")
        assert retro.get("horizon_days") == H
        assert retro.get("days_since", 0) > H
        assert retro.get("nudge") is True
        assert retro.get("nudge") == (retro["days_since"] > H)
    finally:
        _cadence_cleanup(iid)


def test_rt73_d2_17_copy_sweep_no_marked_down():
    """#17: UI copy sweep — no marked-down / late / overdue / fix grade."""
    from pathlib import Path

    root = Path(__file__).resolve().parents[2] / "web" / "components"
    files = [
        root / "ProcessMeter.tsx",
        root / "RetroCadenceNudge.tsx",
        root / "JourneyScores.tsx",
        root / "member-home" / "MemberHome.tsx",
    ]
    banned = (
        "marked down",
        "overdue",
        "late retro",
        "fix your grade",
        "penalty",
        "don't fall behind",
        "behind on retros",
    )
    for f in files:
        assert f.is_file(), f
        text = f.read_text(encoding="utf-8").lower()
        for b in banned:
            assert b not in text, f"{f.name} contains banned {b!r}"
    # Nudge uses approved dismiss
    nudge = (root / "RetroCadenceNudge.tsx").read_text(encoding="utf-8")
    assert "Not now" in nudge
    assert "when you're ready" in nudge.lower() or "When you're ready" in nudge


def test_scores_process_includes_profile(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    r = client.get("/api/me/journey/scores", cookies=cookies)
    assert r.status_code == 200
    prof = r.json()["process"]["profile"]
    assert "id" in prof and "label" in prof and "horizon_label" in prof


def test_attendance_streak_consecutive_weeks():
    # Three consecutive Eastern weeks of check-ins
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)  # Wed
    # current week + 2 prior
    times = [
        datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc),  # this week
        datetime(2026, 7, 21, 14, 0, tzinfo=timezone.utc),
        datetime(2026, 7, 14, 14, 0, tzinfo=timezone.utc),
    ]
    assert js.attendance_streak_weeks(times, now=now) == 3


def test_attendance_streak_grace_current_week_empty():
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)
    times = [
        datetime(2026, 7, 21, 14, 0, tzinfo=timezone.utc),  # last week only
        datetime(2026, 7, 14, 14, 0, tzinfo=timezone.utc),
    ]
    assert js.attendance_streak_weeks(times, now=now) == 2


def _weekly_checkins(n_weeks: int, *, end: datetime) -> list[datetime]:
    """n consecutive weekly check-ins ending at ``end`` (walk back 7 days)."""
    out: list[datetime] = []
    cursor = end
    for _ in range(n_weeks):
        out.append(cursor)
        cursor = cursor - timedelta(days=7)
    return out


def test_live_presence_full_window_scores_100():
    """Perfect presence over horizon → EWMA settles at 100%."""
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)
    times = _weekly_checkins(16, end=datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc))
    pct, streak, active, horizon = js.live_presence_percent(
        times, now=now, streak_cap=12, horizon_weeks=16
    )
    assert streak >= 12
    assert active == 16 and horizon == 16
    assert pct == 100


def test_live_presence_streak_after_drought_below_perfect():
    """10-week streak after older empty weeks scores below continuous presence.

    Near-term EWMA rewards the comeback, but residual drought still dings vs 100.
    """
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)
    times = _weekly_checkins(10, end=datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc))
    pct, streak, active, horizon = js.live_presence_percent(
        times, now=now, streak_cap=12, horizon_weeks=16
    )
    assert streak == 10
    assert active == 10 and horizon == 16
    assert pct < 100
    # Near-term heavy: comeback scores above flat coverage (10/16 ≈ 62)
    assert pct > 62


def test_live_presence_recent_drought_dings_harder_than_old():
    """Same density, different placement: recent gaps hurt more than old gaps."""
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)
    # Recent consistency after old drought: last 10 weeks present
    comeback = _weekly_checkins(
        10, end=datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc)
    )
    # Recent drought after old consistency: first 10 of a 16w block present,
    # then 6 empty — end the block 6 weeks before "now"
    faded = _weekly_checkins(
        10, end=datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc) - timedelta(days=7 * 6)
    )
    pct_comeback, _, a1, _ = js.live_presence_percent(
        comeback, now=now, streak_cap=12, horizon_weeks=16
    )
    pct_faded, _, a2, _ = js.live_presence_percent(
        faded, now=now, streak_cap=12, horizon_weeks=16
    )
    assert a1 == a2 == 10
    assert pct_comeback > pct_faded, (
        f"near-term weight: comeback={pct_comeback} faded={pct_faded}"
    )
    assert pct_faded < 50  # recent slack is punished hard


def test_live_presence_inconsistency_scores_below_consecutive():
    """Alternating show-ups (inconsistent) score below a solid recent block."""
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)
    end = datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc)
    # 8 consecutive recent weeks
    solid = _weekly_checkins(8, end=end)
    # 8 alternating weeks over 16 (every other week, including most recent)
    alt: list[datetime] = []
    cursor = end
    for i in range(16):
        if i % 2 == 0:
            alt.append(cursor)
        cursor = cursor - timedelta(days=7)
    pct_solid, _, _, _ = js.live_presence_percent(
        solid, now=now, streak_cap=12, horizon_weeks=16
    )
    pct_alt, _, active_alt, _ = js.live_presence_percent(
        alt, now=now, streak_cap=12, horizon_weeks=16
    )
    assert active_alt == 8
    assert pct_solid > pct_alt


def test_live_presence_sparse_over_months_dings_hard():
    """Scattered check-ins with no consistency score low under EWMA."""
    now = datetime(2026, 7, 29, 15, 0, tzinfo=timezone.utc)
    times = [
        datetime(2026, 7, 28, 14, 0, tzinfo=timezone.utc),
        datetime(2026, 6, 30, 14, 0, tzinfo=timezone.utc),
        datetime(2026, 6, 2, 14, 0, tzinfo=timezone.utc),
        datetime(2026, 5, 5, 14, 0, tzinfo=timezone.utc),
    ]
    pct, streak, active, horizon = js.live_presence_percent(
        times, now=now, streak_cap=12, horizon_weeks=16
    )
    assert streak == 1
    assert active == 4
    assert pct < 45  # inconsistency / sparsity punished


def test_checkin_window():
    start = datetime(2026, 7, 29, 18, 0, tzinfo=timezone.utc)
    assert js.checkin_window_ok(start, now=start - timedelta(minutes=10))
    assert not js.checkin_window_ok(start, now=start - timedelta(minutes=20))
    assert js.checkin_window_ok(start, now=start + timedelta(hours=3))
    assert not js.checkin_window_ok(start, now=start + timedelta(hours=5))


def test_scores_and_leaderboard_api(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    # Ensure visible with a name
    r = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"display_name": "Score Probe", "journey_visible": True},
    )
    assert r.status_code == 200, r.text

    scores = client.get("/api/me/journey/scores", cookies=cookies)
    assert scores.status_code == 200
    body = scores.json()
    assert "reputation" in body and "contribution" in body
    assert body["journey_visible"] is True
    assert body["rank"] is not None

    board = client.get("/api/journey/leaderboard", cookies=cookies)
    assert board.status_code == 200
    members = board.json()["members"]
    assert any(m["display_name"] == "Score Probe" and m["is_self"] for m in members)
    for m in members:
        assert "email" not in m
        assert "identity_id" not in m

    # Opt out
    client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={"journey_visible": False},
    )
    board2 = client.get("/api/journey/leaderboard", cookies=cookies)
    names = [m["display_name"] for m in board2.json()["members"]]
    assert "Score Probe" not in names
    # Self scores still work
    s2 = client.get("/api/me/journey/scores", cookies=cookies)
    assert s2.status_code == 200
    assert s2.json()["journey_visible"] is False
    assert s2.json()["rank"] is None


def test_share_personal_growth_private_on_board(client, probe_identity):
    """Community presence without exposing trader personal growth."""
    cookies = cookie_for("activator", probe_identity)
    r = client.patch(
        "/api/me/profile",
        cookies=cookies,
        json={
            "display_name": "Community Only",
            "journey_visible": True,
            "share_reputation": True,
            "share_personal_growth": False,
            "share_attendance": True,
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["share_personal_growth"] is False

    board = client.get("/api/journey/leaderboard", cookies=cookies)
    assert board.status_code == 200
    me = next(m for m in board.json()["members"] if m["is_self"])
    assert me["personal_growth"] is None
    assert me["reputation"] is not None or me["reputation"] == 0
    # Public contribution must not include growth even if self has private growth
    self_scores = client.get("/api/me/journey/scores", cookies=cookies).json()
    assert self_scores["personal_growth"] >= 0  # private full scores
    assert me["contribution"] == js.public_contribution(
        self_scores["reputation"],
        self_scores["personal_growth"],
        self_scores["attendance_streak"],
        share_reputation=True,
        share_personal_growth=False,
        share_attendance=True,
    )


def test_live_checkin_api(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    now = datetime.now(timezone.utc)
    starts = now.isoformat().replace("+00:00", "Z")
    key = "r99-2099-01-01"  # will fail window if far future starts
    # Use starts near now so window is open
    r = client.post(
        "/api/live/check-in",
        cookies=cookies,
        json={"session_key": "r1-2026-07-29", "starts_at": starts},
    )
    assert r.status_code == 200, r.text
    assert r.json()["checked_in"] is True

    # Idempotent
    r2 = client.post(
        "/api/live/check-in",
        cookies=cookies,
        json={"session_key": "r1-2026-07-29", "starts_at": starts},
    )
    assert r2.status_code == 200

    st = client.get(
        "/api/live/check-in",
        cookies=cookies,
        params={"session_key": "r1-2026-07-29"},
    )
    assert st.status_code == 200
    assert st.json()["checked_in"] is True

    # Outside window
    far = (now - timedelta(days=2)).isoformat().replace("+00:00", "Z")
    bad = client.post(
        "/api/live/check-in",
        cookies=cookies,
        json={"session_key": "r2-2026-07-01", "starts_at": far},
    )
    assert bad.status_code == 422
