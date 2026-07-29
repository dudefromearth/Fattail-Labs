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
    assert 0 <= p["overall_percent"] <= 100
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
    # No achievement / trophy framing
    assert "achievement" not in p["overall_label"].lower()


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
    assert nav_m["persistence_weeks"] > p["persistence_weeks"]


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
