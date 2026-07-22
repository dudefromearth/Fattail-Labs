"""Live sessions: materialization, category gating matrix, scope-aware
recurring edits, series bounds (Live Sessions specs v1.1–v1.5)."""

import calendar as cal
from datetime import date, datetime, timedelta, timezone

import pytest
from conftest import cookie_for

STANDING = {
    "Daily Livestream": ("coaching", {0, 1, 2, 3, 4}),
    "0DTE Live Show": ("public", {0, 2, 4}),
    "Friday Morning Coach Call": ("members", {4}),
    "Sunday Evening Retrospective": ("coaching", {6}),
}


def _next_month() -> tuple[int, int]:
    today = date.today()
    return (today.year + (today.month == 12), today.month % 12 + 1)


def _weekday_count(year: int, month: int, weekdays: set[int]) -> int:
    return sum(
        1 for week in cal.monthcalendar(year, month)
        for wd in weekdays if week[wd] != 0
    )


@pytest.fixture(scope="module")
def month_payload(client):
    y, m = _next_month()
    r = client.get(f"/api/live/sessions?month={y}-{m:02d}")
    assert r.status_code == 200
    return (y, m, r.json()["sessions"])


def test_standing_schedule_materializes_exactly(month_payload):
    y, m, sessions = month_payload
    for title, (category, weekdays) in STANDING.items():
        mine = [s for s in sessions if s["title"] == title]
        assert len(mine) == _weekday_count(y, m, weekdays), title
        assert all(s["category"] == category for s in mine)
        assert all(s["recurring"] for s in mine)


def test_bad_month_is_422(client):
    assert client.get("/api/live/sessions?month=garbage").status_code == 422


def test_category_gating_matrix(month_payload, client):
    y, m, _ = month_payload
    expect = {  # join_locked value by (role, category) for far-future sessions
        None: {"coaching": "sign_in", "members": "sign_in", "public": "too_early"},
        "activator": {"coaching": "role", "members": "too_early", "public": "too_early"},
        "navigator": {"coaching": "too_early", "members": "too_early", "public": "too_early"},
    }
    for role, by_cat in expect.items():
        cookies = cookie_for(role, 901) if role else {}
        sessions = client.get(
            f"/api/live/sessions?month={y}-{m:02d}", cookies=cookies
        ).json()["sessions"]
        seen = {}
        for s in sessions:
            seen.setdefault(s["category"], s["join_locked"])
        for category, locked in by_cat.items():
            assert seen[category] == locked, (role, category)


def test_public_session_in_window_exposes_join_to_anon(client, admin_cookies):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    r = client.post(
        "/api/admin/live-sessions",
        cookies=admin_cookies,
        json={"title": "zztest Public Probe", "kind": "show", "starts_at": now,
              "join_url": "https://example.com/live", "category": "public"},
    )
    sid = r.json()["id"]
    try:
        upcoming = client.get("/api/live/sessions").json()["upcoming"]
        probe = next(s for s in upcoming if s["title"] == "zztest Public Probe")
        assert probe["join_url"] == "https://example.com/live"
        assert probe["join_locked"] is None
    finally:
        client.delete(f"/api/admin/live-sessions/{sid}", cookies=admin_cookies)


@pytest.fixture()
def probe_series(client, admin_cookies):
    r = client.post(
        "/api/admin/live-recurrences",
        cookies=admin_cookies,
        json={"title": "zztest Scope Series", "kind": "workshop",
              "days": ["mon", "tue", "wed", "thu", "fri"],
              "start_time": "12:00", "duration_minutes": 30, "category": "members"},
    )
    rid = r.json()["id"]
    created = [rid]
    yield rid, created
    for x in created:
        client.delete(f"/api/admin/live-recurrences/{x}", cookies=admin_cookies)


def _series_sessions(client, y, m, title="zztest Scope Series"):
    sessions = client.get(f"/api/live/sessions?month={y}-{m:02d}").json()["sessions"]
    return [s for s in sessions if title in s["title"]]


def test_scope_one_edits_exactly_one_occurrence(client, admin_cookies, probe_series):
    rid, _ = probe_series
    y, m = _next_month()
    target = _series_sessions(client, y, m)[1]["occurrence_date"]
    r = client.put(
        f"/api/admin/live-recurrences/{rid}/occurrences/{target}",
        cookies=admin_cookies,
        json={"scope": "one", "title": "zztest Scope Series SPECIAL"},
    )
    assert r.status_code == 200
    mine = _series_sessions(client, y, m)
    specials = [s for s in mine if "SPECIAL" in s["title"]]
    assert len(specials) == 1
    assert specials[0]["occurrence_date"] == target
    assert specials[0]["modified"] is True
    assert all(not s["modified"] for s in mine if "SPECIAL" not in s["title"])


def test_scope_future_splits_series(client, admin_cookies, probe_series):
    rid, created = probe_series
    y, m = _next_month()
    mine = _series_sessions(client, y, m)
    split_date = mine[2]["occurrence_date"]
    r = client.put(
        f"/api/admin/live-recurrences/{rid}/occurrences/{split_date}",
        cookies=admin_cookies,
        json={"scope": "future", "duration_minutes": 45},
    )
    assert r.status_code == 200
    new_id = r.json()["recurrence_id"]
    assert new_id != rid
    created.append(new_id)
    after = _series_sessions(client, y, m)
    assert len(after) == len(mine)  # same calendar, split under the hood
    for s in after:
        if s["occurrence_date"] < split_date:
            assert s["recurrence_id"] == rid and s["duration_minutes"] == 30
        else:
            assert s["recurrence_id"] == new_id and s["duration_minutes"] == 45


def test_scope_one_delete_cancels_single_date(client, admin_cookies, probe_series):
    rid, _ = probe_series
    y, m = _next_month()
    before = _series_sessions(client, y, m)
    target = before[0]["occurrence_date"]
    r = client.delete(
        f"/api/admin/live-recurrences/{rid}/occurrences/{target}?scope=one",
        cookies=admin_cookies,
    )
    assert r.status_code == 200
    after = _series_sessions(client, y, m)
    assert len(after) == len(before) - 1
    assert target not in {s["occurrence_date"] for s in after}


def test_occurrence_validation(client, admin_cookies, probe_series):
    rid, _ = probe_series
    y, m = _next_month()
    saturday = next(
        date(y, m, week[5]).isoformat()
        for week in cal.monthcalendar(y, m) if week[5] != 0
    )
    r = client.get(
        f"/api/admin/live-recurrences/{rid}/occurrences/{saturday}",
        cookies=admin_cookies,
    )
    assert r.status_code == 404  # not an occurrence of a weekday series
    monday = _series_sessions(client, y, m)[0]["occurrence_date"]
    r = client.put(
        f"/api/admin/live-recurrences/{rid}/occurrences/{monday}",
        cookies=admin_cookies,
        json={"scope": "sometimes", "title": "x"},
    )
    assert r.status_code == 422


def test_until_days_bounds_series(client, admin_cookies):
    r = client.post(
        "/api/admin/live-recurrences",
        cookies=admin_cookies,
        json={"title": "zztest Bounded", "kind": "workshop",
              "days": ["mon", "tue", "wed", "thu", "fri"],
              "start_time": "12:00", "duration_minutes": 30,
              "category": "members", "until_days": 7},
    )
    rid = r.json()["id"]
    try:
        limit = (date.today() + timedelta(days=7)).isoformat()
        for probe_m in range(2):
            today = date.today()
            y = today.year + (today.month + probe_m > 12)
            m = (today.month + probe_m - 1) % 12 + 1
            sessions = client.get(f"/api/live/sessions?month={y}-{m:02d}").json()["sessions"]
            for s in sessions:
                if s["title"] == "zztest Bounded":
                    assert s["occurrence_date"] <= limit
    finally:
        client.delete(f"/api/admin/live-recurrences/{rid}", cookies=admin_cookies)


def test_until_conflicts_and_past_rejected(client, admin_cookies):
    base = {"title": "x", "kind": "workshop", "days": ["mon"],
            "start_time": "12:00", "duration_minutes": 30}
    r = client.post("/api/admin/live-recurrences", cookies=admin_cookies,
                    json={**base, "until_days": 7, "until_date": "2030-01-01"})
    assert r.status_code == 422
    r = client.post("/api/admin/live-recurrences", cookies=admin_cookies,
                    json={**base, "until_date": "2020-01-01"})
    assert r.status_code == 422


def test_recurrence_ics_is_repeating_event(client):
    admin = cookie_for("administrator")
    recs = client.get("/api/admin/live-recurrences", cookies=admin).json()["recurrences"]
    daily = next(r for r in recs if r["title"] == "Daily Livestream")
    ics = client.get(f"/api/live/recurrences/{daily['id']}/ics").text
    assert "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" in ics
    assert "DTSTART;TZID=America/New_York" in ics
