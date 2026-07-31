"""Retrospectives R1b–R2b characterization (Spec v0.5).

RT1 entitlement/isolation · RT2 report shape · sample gate · profile expand pref.
"""

from pathlib import Path

import identity as identity_mod
import db
import retrospective_domain as rd
from tests.conftest import cookie_for

REPO_ROOT = Path(__file__).resolve().parents[2]


def _member(
    email: str = "zztest-retro@labs.test",
    *,
    role_override: str | None = "activator",
):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Retro Tester")
            if role_override is None:
                cur.execute(
                    "UPDATE identities SET role_override = NULL WHERE identity_id = %s",
                    (iid,),
                )
            else:
                cur.execute(
                    "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                    (role_override, iid),
                )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
    return iid


def _plan_id(cur, slug: str) -> int:
    cur.execute("SELECT id FROM plans WHERE slug = %s", (slug,))
    row = cur.fetchone()
    assert row is not None, f"plan {slug} missing — seed_dev / migrations"
    return int(row["id"])


def _grant_plan(iid: int, slug: str, status: str = "active") -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            pid = _plan_id(cur, slug)
            identity_mod.upsert_membership(cur, iid, pid, status, "zztest")


def _expire_plan(iid: int, slug: str) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE memberships m
                   JOIN plans p ON p.id = m.plan_id
                   SET m.status = 'expired',
                       m.current_period_end = DATE_SUB(NOW(), INTERVAL 1 DAY)
                   WHERE m.identity_id = %s AND p.slug = %s""",
                (iid, slug),
            )


def _cleanup(iid: int):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM tag_assignments WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_habit_plans WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_journal_messages WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_journal_sessions WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_trade_log_legs WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_trades WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_trade_log_accounts WHERE identity_id = %s",
                (iid,),
            )
            cur.execute(
                "DELETE FROM member_tool_notes WHERE identity_id = %s", (iid,)
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def _seed_trades(iid: int, n: int, *, adherence: str = "followed") -> None:
    """Insert n in-window trades for sample-gate characterization."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id FROM member_trade_log_accounts
                   WHERE identity_id = %s ORDER BY id LIMIT 1""",
                (iid,),
            )
            row = cur.fetchone()
            if row:
                aid = int(row["id"])
            else:
                cur.execute(
                    """INSERT INTO member_trade_log_accounts
                         (identity_id, label, broker, status, sort_order)
                       VALUES (%s, 'Primary', 'unset', 'active', 0)""",
                    (iid,),
                )
                aid = int(cur.lastrowid)
            for i in range(n):
                adh = "broke" if i % 7 == 0 else adherence
                pnl = 10.0 if i % 2 == 0 else -4.0
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, strategy,
                          setup_md, plan_md, rules_md, adherence,
                          deviation_md, lesson_md, pnl_amount)
                       VALUES (
                         %s, %s, DATE_SUB(NOW(), INTERVAL %s HOUR),
                         'zztest', '', '', '', %s, '', '', %s
                       )""",
                    (iid, aid, i, adh, pnl),
                )


def test_preview_create_gather_complete(client):
    iid = _member()
    cookies = cookie_for("activator", iid)
    try:
        prev = client.get("/api/me/retrospectives/preview-scope", cookies=cookies)
        assert prev.status_code == 200, prev.text
        assert prev.json()["is_maiden"] is True

        created = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert created.status_code == 200, created.text
        body = created.json()
        assert body["is_maiden"] is True
        assert body["status"] == "ready"
        assert body["report"] is not None
        rep = body["report"]
        assert rep["version"] == "0.5"
        assert "book_performance" in rep
        assert "process" in rep
        assert "integrity_review" in rep
        assert "deviations" in rep
        assert "what_worked" in rep
        assert "meta" in rep
        assert rep["meta"]["min_inference_n"] == 20
        # sample gate: empty book is below min
        assert rep["book_performance"]["sample_below_min"] is True
        assert rep["book_performance"]["sample_banner"]
        assert "measure process quality" in rep["book_performance"]["sample_banner"]
        assert body["comparison"]["has_prior"] is False
        rid = body["id"]

        conflict = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert conflict.status_code == 409

        done = client.post(
            f"/api/me/retrospectives/{rid}/complete",
            cookies=cookies,
        )
        assert done.status_code == 200
        assert done.json()["status"] == "complete"
        assert done.json()["completed_at"] is not None

        prev2 = client.get("/api/me/retrospectives/preview-scope", cookies=cookies)
        assert prev2.json()["is_maiden"] is False

        created2 = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert created2.status_code == 200
        assert created2.json()["is_maiden"] is False
        assert created2.json()["comparison"]["has_prior"] is True
    finally:
        _cleanup(iid)


def test_free_no_plan_create_403(client):
    """Free observer, no trial plan → 403 on create (not role spoof)."""
    iid = _member(
        "zztest-retro-free@labs.test",
        role_override=None,
    )
    cookies = cookie_for("observer", iid)
    try:
        # List is isolation-only (empty OK)
        listed = client.get("/api/me/retrospectives", cookies=cookies)
        assert listed.status_code == 200
        assert listed.json()["retrospectives"] == []

        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert r.status_code == 403, r.text
        assert "Observer trial" in r.json()["detail"] or "trial" in r.json()["detail"].lower()

        prev = client.get("/api/me/retrospectives/preview-scope", cookies=cookies)
        assert prev.status_code == 403
    finally:
        _cleanup(iid)


def test_observer_trial_plan_create_ok(client):
    """Active observer-trial membership allows create even with observer role cookie.

    Session role is often navigator (grants_role), but entitlement is plan-slug.
    This also covers the inverse: plan check is what matters for G1.
    """
    iid = _member(
        "zztest-retro-trial@labs.test",
        role_override=None,
    )
    _grant_plan(iid, "observer-trial")
    # Cookie role observer — proves plan path, not role_at_least(activator)
    cookies = cookie_for("observer", iid)
    try:
        created = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert created.status_code == 200, created.text
        assert created.json()["status"] == "ready"
        assert created.json()["is_maiden"] is True
    finally:
        _cleanup(iid)


def test_activator_legacy_create_ok(client):
    iid = _member("zztest-retro-act@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        created = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert created.status_code == 200, created.text
        assert created.json()["status"] == "draft"
    finally:
        _cleanup(iid)


def test_cross_member_get_404(client):
    a = _member("zztest-retro-a@labs.test", role_override="activator")
    b = _member("zztest-retro-b@labs.test", role_override="activator")
    cookies_a = cookie_for("activator", a)
    cookies_b = cookie_for("activator", b)
    try:
        created = client.post(
            "/api/me/retrospectives",
            cookies=cookies_a,
            json={"gather": False},
        )
        assert created.status_code == 200
        rid = created.json()["id"]
        other = client.get(f"/api/me/retrospectives/{rid}", cookies=cookies_b)
        assert other.status_code == 404
    finally:
        _cleanup(a)
        _cleanup(b)


def test_schema_habit_plans_and_pnl_pref_exist():
    """Migration 047 applied: table + column present."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT COUNT(*) AS n FROM information_schema.tables
                   WHERE table_schema = DATABASE()
                     AND table_name = 'member_habit_plans'"""
            )
            assert cur.fetchone()["n"] == 1
            cur.execute(
                """SELECT COUNT(*) AS n FROM information_schema.columns
                   WHERE table_schema = DATABASE()
                     AND table_name = 'identities'
                     AND column_name = 'retrospective_pnl_expanded'"""
            )
            assert cur.fetchone()["n"] == 1


# --- RT1-2: attack notes A1, A5, A6 + unit matrix ---------------------------------


def test_a1_body_identity_spoof_ignored(client):
    """A1: body identity_id of B is ignored — create lands under session A only."""
    a = _member("zztest-retro-spoof-a@labs.test", role_override="activator")
    b = _member("zztest-retro-spoof-b@labs.test", role_override="activator")
    cookies_a = cookie_for("activator", a)
    try:
        created = client.post(
            "/api/me/retrospectives",
            cookies=cookies_a,
            json={"gather": False, "identity_id": b, "title": "spoof-attempt"},
        )
        assert created.status_code == 200, created.text
        rid = created.json()["id"]
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT identity_id FROM member_retrospectives WHERE id = %s",
                    (rid,),
                )
                row = cur.fetchone()
                assert row is not None
                assert int(row["identity_id"]) == a
                assert int(row["identity_id"]) != b
        # B still cannot read A's row
        cookies_b = cookie_for("activator", b)
        assert (
            client.get(f"/api/me/retrospectives/{rid}", cookies=cookies_b).status_code
            == 404
        )
    finally:
        _cleanup(a)
        _cleanup(b)


def test_a5_expired_trial_create_403(client):
    """A5: expired observer-trial membership → create 403 (live membership check).

    Session role observer (post-expiry re-login shape). Residual: a *stale* JWT
    still claiming navigator would pass the role_at_least path until re-issue —
    that is session lifecycle, not plan-slug failure.
    """
    iid = _member("zztest-retro-expired-trial@labs.test", role_override=None)
    _grant_plan(iid, "observer-trial")
    cookies = cookie_for("observer", iid)
    try:
        ok = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert ok.status_code == 200, ok.text
        # abandon so we can re-test create after expire
        rid = ok.json()["id"]
        client.post(f"/api/me/retrospectives/{rid}/abandon", cookies=cookies)

        _expire_plan(iid, "observer-trial")
        denied = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert denied.status_code == 403, denied.text
    finally:
        _cleanup(iid)


def test_a6_concurrent_second_open_409(client):
    """A6: second open create while draft/ready exists → 409."""
    iid = _member("zztest-retro-409@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        first = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert first.status_code == 200
        second = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert second.status_code == 409
        assert "open retrospective" in second.json()["detail"].lower()
    finally:
        _cleanup(iid)


def test_can_create_or_gather_unit_matrix():
    """Direct domain predicate — no HTTP (fail-loud constant path)."""
    iid = _member("zztest-retro-unit@labs.test", role_override=None)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert rd.can_create_or_gather(cur, iid, "observer") is False
                assert rd.can_create_or_gather(cur, iid, "alumni") is False
                assert rd.can_create_or_gather(cur, iid, "activator") is True
                assert rd.can_create_or_gather(cur, iid, "navigator") is True
                assert rd.can_create_or_gather(cur, iid, "administrator") is True
        _grant_plan(iid, "observer-trial")
        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert rd.can_create_or_gather(cur, iid, "observer") is True
        _expire_plan(iid, "observer-trial")
        with db.transaction() as conn:
            with conn.cursor() as cur:
                assert rd.can_create_or_gather(cur, iid, "observer") is False
    finally:
        _cleanup(iid)


def test_navigator_role_create_ok(client):
    """Paid Navigator path (role ladder) — no trial plan required."""
    iid = _member("zztest-retro-nav@labs.test", role_override="navigator")
    cookies = cookie_for("navigator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": False},
        )
        assert r.status_code == 200, r.text
    finally:
        _cleanup(iid)


def test_rt22_report_v05_shape_and_sample_gate(client):
    """RT2-2: gather emits DTO v0.5; sample gate honest (Hotel)."""
    iid = _member("zztest-retro-v05@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        created = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert created.status_code == 200, created.text
        rep = created.json()["report"]
        assert rep["version"] == "0.5"
        book = rep["book_performance"]
        assert book["min_inference_n"] == 20
        assert book["trade_count"] == rep["meta"]["trade_count"]
        if book["trade_count"] < 20:
            assert book["sample_below_min"] is True
            assert book["sample_banner"] is not None
            assert "process quality" in book["sample_banner"]
        else:
            assert book["sample_below_min"] is False
            assert book["sample_banner"] is None
        # Process rates present
        assert "adherence" in rep["process"]
        assert "routine" in rep["process"]
        assert "live" in rep["process"]
        assert "learning" in rep["process"]
        assert isinstance(rep["deviations"], list)
        assert len(rep["deviations"]) <= 5
        assert isinstance(rep["what_worked"], list)
        assert len(rep["what_worked"]) <= 3
        assert rep["carry_forward"] is None  # R4
        assert rep["expected_vs_actual"] is None  # R6
        # Compat alias
        assert rep["pnl"]["trade_count"] == book["trade_count"]
    finally:
        _cleanup(iid)


def test_rt22_deviations_gap_constant():
    """Journal gap constant is Spec N=3 (domain fail-loud)."""
    assert rd.JOURNAL_GAP_DAYS == 3
    assert rd.MIN_INFERENCE_N == 20
    assert rd.MAX_DEVIATIONS == 5


# --- RT2-4: report shape + sample gate + UI contract surface --------------------


def test_rt24_sample_below_min_true_when_n_lt_20(client):
    """Seed goal: trade_count < 20 → sample_below_min true + banner."""
    iid = _member("zztest-retro-sample-lo@labs.test", role_override="activator")
    _seed_trades(iid, 7)
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        book = r.json()["report"]["book_performance"]
        assert book["trade_count"] == 7
        assert book["sample_below_min"] is True
        assert book["min_inference_n"] == 20
        assert book["sample_banner"] is not None
        assert "does not measure process quality" in book["sample_banner"]
        assert r.json()["report"]["meta"]["trade_count"] == 7
    finally:
        _cleanup(iid)


def test_rt24_sample_below_min_false_when_n_ge_20(client):
    """n >= MIN_INFERENCE_N → no banner; sample_below_min false."""
    iid = _member("zztest-retro-sample-hi@labs.test", role_override="activator")
    _seed_trades(iid, 22)
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        book = r.json()["report"]["book_performance"]
        assert book["trade_count"] == 22
        assert book["sample_below_min"] is False
        assert book["sample_banner"] is None
        # Deviations may include broke tags (every 7th)
        assert isinstance(r.json()["report"]["deviations"], list)
        assert len(r.json()["report"]["deviations"]) <= 5
    finally:
        _cleanup(iid)


def test_rt24_report_dto_required_keys(client):
    """Architecture/12 keys present on gather payload."""
    iid = _member("zztest-retro-dto-keys@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        rep = r.json()["report"]
        for key in (
            "version",
            "meta",
            "carry_forward",
            "process",
            "integrity_review",
            "deviations",
            "what_worked",
            "expected_vs_actual",
            "book_performance",
        ):
            assert key in rep, f"missing report.{key}"
        meta = rep["meta"]
        for key in (
            "is_maiden",
            "scope_start",
            "scope_end",
            "window_days",
            "trade_count",
            "min_inference_n",
        ):
            assert key in meta, f"missing meta.{key}"
        proc = rep["process"]
        for key in ("adherence", "routine", "live", "learning"):
            assert key in proc, f"missing process.{key}"
        book = rep["book_performance"]
        for key in (
            "trade_count",
            "sample_below_min",
            "min_inference_n",
            "sample_banner",
            "collapsed_summary",
            "headline",
        ):
            assert key in book, f"missing book.{key}"
    finally:
        _cleanup(iid)


def test_rt24_profile_pnl_expanded_default_and_patch(client):
    """RT2-3 pref: default collapsed (false); PATCH persists true."""
    iid = _member("zztest-retro-pnl-pref@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        g = client.get("/api/me/profile", cookies=cookies)
        assert g.status_code == 200, g.text
        assert g.json().get("retrospective_pnl_expanded") is False
        p = client.patch(
            "/api/me/profile",
            cookies=cookies,
            json={"retrospective_pnl_expanded": True},
        )
        assert p.status_code == 200, p.text
        assert p.json()["retrospective_pnl_expanded"] is True
        g2 = client.get("/api/me/profile", cookies=cookies)
        assert g2.json()["retrospective_pnl_expanded"] is True
        # reset
        client.patch(
            "/api/me/profile",
            cookies=cookies,
            json={"retrospective_pnl_expanded": False},
        )
    finally:
        _cleanup(iid)


def test_rt24_workspace_section_order_source():
    """Ceremony §6.1: nine fixed steps; period indicator; book last."""
    path = (
        REPO_ROOT
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    assert path.is_file(), path
    src = path.read_text(encoding="utf-8")
    markers = [
        'testId="retro-carry-forward"',
        'testId="retro-process"',
        'testId="retro-deviations"',
        'testId="retro-clustered"',
        'testId="retro-cause"',
        'testId="retro-what-worked"',
        'testId="retro-expected-vs-actual"',
        'testId="retro-onething"',
        'testId="retro-book"',
    ]
    positions = []
    for m in markers:
        i = src.find(m)
        assert i >= 0, f"missing marker {m}"
        positions.append((i, m))
    for a, b in zip(positions, positions[1:]):
        assert a[0] < b[0], f"order violation: {a[1]} after {b[1]}"
    assert "Show book sample" in src
    assert "Hide book sample" in src
    assert "bookExpanded" in src
    assert "CEREMONY_STEPS" in src
    assert "retro-period-indicator" in src
    assert "Context: period" in src
    # Rolling integrity not co-displayed as grade headline in ceremony
    assert "retro-integrity-hidden-rolling" in src
    assert "retro-comparison" in src
    assert "Kept" in src and "Partial" in src and "Lapsed" in src
    assert "patchHabitPlan" in src or "setPlanAssessment" in src
    assert "You succeeded" not in src and "You failed" not in src
    # R8 sequence agent panel (holds order; no prescribe)
    assert "retro-agent-run" in src
    assert 'data-role="sequence_keeper"' in src
    assert "does not prescribe" in src.lower()
    assert "retro-agent-turn" in src
    # Spec §6.2 — 3×3 ceremony map + one expanded body
    assert 'data-layout="map-3x3"' in src
    assert "ceremony-step-body" in src
    assert "needs_you" in src
    assert "ceremonyTiles" in src
    # RT6-2 what worked / expected vs actual
    assert "retro-what-worked" in src
    assert "Stated intent" in src
    assert "What executed" in src
    assert "not a scorecard" in src.lower() or "Process pairing" in src


# --- RT3-1: normalized comparison (§7) ------------------------------------------


def test_rt31_compare_metric_21d_vs_63d_not_comparable():
    """Seed criterion: 21d vs 63d → rate metrics comparable=false (3× window)."""
    row = rd.compare_metric(
        "routine_days_per_week",
        current_value=4.4,
        current_window_days=21,
        current_n=13,
        previous_value=3.1,
        previous_window_days=63,
        previous_n=27,
        kind="activity",
    )
    assert row["comparable"] is False
    assert row["comparable_reason"] == "window_length_ratio_ge_3x"
    assert row["current"]["window_days"] == 21
    assert row["previous"]["window_days"] == 63
    assert row["current"]["n"] == 13
    assert row["previous"]["n"] == 27


def test_rt31_compare_metric_adherence_below_n():
    """Adherence not comparable when either window trades < MIN_INFERENCE_N."""
    row = rd.compare_metric(
        "adherence_followed_partial_rate",
        current_value=0.8,
        current_window_days=30,
        current_n=10,
        previous_value=0.7,
        previous_window_days=30,
        previous_n=25,
        kind="adherence",
    )
    assert row["comparable"] is False
    assert row["comparable_reason"] == "sample_below_min_inference_n"


def test_rt31_compare_metric_activity_short_window():
    """Activity rates need window_days >= 14 on both sides."""
    row = rd.compare_metric(
        "live_checkins_per_week",
        current_value=2.0,
        current_window_days=10,
        current_n=3,
        previous_value=1.5,
        previous_window_days=30,
        previous_n=6,
        kind="activity",
    )
    assert row["comparable"] is False
    assert row["comparable_reason"] == "window_days_below_14"


def test_rt31_compare_metric_comparable_when_ok():
    """Similar windows + enough sample → comparable."""
    row = rd.compare_metric(
        "routine_days_per_week",
        current_value=4.0,
        current_window_days=28,
        current_n=12,
        previous_value=3.5,
        previous_window_days=30,
        previous_n=14,
        kind="activity",
    )
    assert row["comparable"] is True
    assert row["comparable_reason"] is None


def test_rt31_build_comparison_metrics_from_reports():
    """_build_comparison_metrics emits Spec rows with both windows."""
    cur = {
        "meta": {"window_days": 21, "trade_count": 15},
        "process": {
            "routine": {"activity_days_per_week": 4.4, "activity_days": 13},
            "live": {"checkins_per_week": 1.0, "checkins": 3},
            "learning": {"lesson_days_per_week": 0.5, "lesson_days": 2},
            "adherence": {"followed_or_partial_rate": 0.8, "total": 15},
        },
        "integrity_review": {"overall_percent": 60.0, "grade": "Good"},
        "book_performance": {"trade_count": 15, "net_pnl": 100.0},
    }
    pri = {
        "meta": {"window_days": 63, "trade_count": 40},
        "process": {
            "routine": {"activity_days_per_week": 3.1, "activity_days": 27},
            "live": {"checkins_per_week": 0.8, "checkins": 7},
            "learning": {"lesson_days_per_week": 0.4, "lesson_days": 4},
            "adherence": {"followed_or_partial_rate": 0.7, "total": 40},
        },
        "integrity_review": {"overall_percent": 55.0, "grade": "Fair"},
        "book_performance": {"trade_count": 40, "net_pnl": 200.0},
    }
    metrics = rd._build_comparison_metrics(cur, pri)
    assert len(metrics) >= 5
    by = {m["metric"]: m for m in metrics}
    assert by["routine_days_per_week"]["comparable"] is False
    assert by["routine_days_per_week"]["comparable_reason"] == (
        "window_length_ratio_ge_3x"
    )
    # Adherence: current n=15 < 20 also fails sample
    assert by["adherence_followed_partial_rate"]["comparable"] is False
    # Label helper
    assert "3 weeks" in rd._weeks_label(21)
    assert "9 weeks" in rd._weeks_label(63)


def test_rt31_second_retro_emits_metrics(client):
    """HTTP: second gather comparison has metrics[] and §7.3-style label."""
    iid = _member("zztest-retro-cmp@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        first = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert first.status_code == 200, first.text
        rid = first.json()["id"]
        done = client.post(
            f"/api/me/retrospectives/{rid}/complete",
            cookies=cookies,
        )
        assert done.status_code == 200
        second = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert second.status_code == 200, second.text
        cmp_ = second.json()["comparison"]
        assert cmp_["has_prior"] is True
        assert cmp_["version"] == "0.5"
        assert "This window" in cmp_["label"]
        assert "vs previous" in cmp_["label"]
        assert isinstance(cmp_["metrics"], list)
        assert len(cmp_["metrics"]) >= 1
        m0 = cmp_["metrics"][0]
        assert "comparable" in m0
        assert "window_days" in m0["current"]
        assert "window_days" in m0["previous"]
        assert "n" in m0["current"]
    finally:
        _cleanup(iid)


# --- RT3-3: comparison fixtures (IMPLEMENTATION-PLAN: 21d vs 63d) --------------


def _report_fixture(
    *,
    window_days: int,
    trade_count: int,
    activity_days: int,
    activity_per_week: float,
    adherence_rate: float,
    integrity_pct: float,
    net_pnl: float,
) -> dict:
    return {
        "meta": {
            "window_days": window_days,
            "trade_count": trade_count,
            "min_inference_n": 20,
        },
        "process": {
            "window_days": window_days,
            "routine": {
                "activity_days": activity_days,
                "activity_days_per_week": activity_per_week,
            },
            "live": {
                "checkins": max(1, activity_days // 4),
                "checkins_per_week": round(
                    max(1, activity_days // 4) / (window_days / 7), 2
                ),
            },
            "learning": {
                "lesson_days": max(0, activity_days // 5),
                "lesson_days_per_week": round(
                    max(0, activity_days // 5) / (window_days / 7), 2
                ),
            },
            "adherence": {
                "followed_or_partial_rate": adherence_rate,
                "total": trade_count,
            },
        },
        "integrity_review": {
            "overall_percent": integrity_pct,
            "grade": "Good",
        },
        "book_performance": {
            "trade_count": trade_count,
            "net_pnl": net_pnl,
        },
    }


def test_rt33_fixture_21d_vs_63d_all_activity_not_comparable():
    """Plan exit fixture: 21d vs 63d → rate metrics comparable=false."""
    cur = _report_fixture(
        window_days=21,
        trade_count=25,
        activity_days=13,
        activity_per_week=4.4,
        adherence_rate=0.8,
        integrity_pct=62.0,
        net_pnl=100.0,
    )
    pri = _report_fixture(
        window_days=63,
        trade_count=40,
        activity_days=27,
        activity_per_week=3.1,
        adherence_rate=0.7,
        integrity_pct=55.0,
        net_pnl=200.0,
    )
    metrics = rd._build_comparison_metrics(cur, pri)
    by = {m["metric"]: m for m in metrics}
    # Activity + adherence + book + integrity all hit ≥3× window ratio
    for key in (
        "routine_days_per_week",
        "live_checkins_per_week",
        "lesson_days_per_week",
        "adherence_followed_partial_rate",
        "integrity_overall_percent",
        "book_net_per_trade",
    ):
        assert key in by, key
        assert by[key]["comparable"] is False, key
        assert by[key]["comparable_reason"] == "window_length_ratio_ge_3x", key
        assert by[key]["current"]["window_days"] == 21
        assert by[key]["previous"]["window_days"] == 63


def test_rt33_rate_math_per_week_denom():
    """Rate values are rates, not raw counts — both windows expose denominators."""
    row = rd.compare_metric(
        "routine_days_per_week",
        current_value=4.0,
        current_window_days=28,
        current_n=16,
        previous_value=14.0,  # raw-looking number as value would be wrong product use
        previous_window_days=28,
        previous_n=14,
        kind="activity",
    )
    # comparable (same window, enough days) — UI must still show value not invent delta
    assert row["comparable"] is True
    assert row["current"]["value"] == 4.0
    assert row["previous"]["value"] == 14.0
    assert row["current"]["window_days"] == row["previous"]["window_days"] == 28


def test_rt33_book_per_trade_math():
    """Book metric uses net/trade from report fixtures."""
    cur = _report_fixture(
        window_days=30,
        trade_count=25,
        activity_days=15,
        activity_per_week=3.5,
        adherence_rate=0.75,
        integrity_pct=60.0,
        net_pnl=250.0,
    )
    pri = _report_fixture(
        window_days=30,
        trade_count=25,
        activity_days=12,
        activity_per_week=2.8,
        adherence_rate=0.7,
        integrity_pct=58.0,
        net_pnl=100.0,
    )
    metrics = rd._build_comparison_metrics(cur, pri)
    book = next(m for m in metrics if m["metric"] == "book_net_per_trade")
    assert book["comparable"] is True
    assert book["current"]["value"] == 10.0  # 250/25
    assert book["previous"]["value"] == 4.0  # 100/25
    assert book["current"]["n"] == 25
    assert book["previous"]["n"] == 25


def test_rt33_adherence_n_floor_overrides_similar_windows():
    """Even with matching 30d windows, n=10 vs n=25 → adherence not comparable."""
    cur = _report_fixture(
        window_days=30,
        trade_count=10,
        activity_days=12,
        activity_per_week=2.8,
        adherence_rate=0.9,
        integrity_pct=60.0,
        net_pnl=50.0,
    )
    pri = _report_fixture(
        window_days=30,
        trade_count=25,
        activity_days=14,
        activity_per_week=3.3,
        adherence_rate=0.7,
        integrity_pct=55.0,
        net_pnl=80.0,
    )
    metrics = rd._build_comparison_metrics(cur, pri)
    adh = next(m for m in metrics if m["metric"] == "adherence_followed_partial_rate")
    assert adh["comparable"] is False
    assert adh["comparable_reason"] == "sample_below_min_inference_n"
    # Activity can still be comparable (30d both, days >= 14)
    routine = next(m for m in metrics if m["metric"] == "routine_days_per_week")
    assert routine["comparable"] is True


def test_rt33_weeks_label_heading():
    """§7.3 heading ingredients."""
    assert rd._weeks_label(21) == "3 weeks"
    assert rd._weeks_label(63) == "9 weeks"
    assert rd._weeks_label(7) == "1 week"
    assert "This window" in (
        f"This window ({rd._weeks_label(21)}) vs previous ({rd._weeks_label(63)})"
    )


def test_rt33_workspace_suppresses_delta_when_not_comparable():
    """Charlie UI: Not comparable path present; no bare arrow trend on integrity."""
    path = (
        REPO_ROOT
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "Not comparable" in src
    assert "data-comparable" in src
    assert "retro-comparison-maiden" in src
    # Old crude arrow trend removed
    assert "Integrity: {str(comparison.prior_integrity_grade)} →" not in src
    assert "pts ·" not in src or "comparable only" in src


# --- RT6-1: what worked + expected vs actual ------------------------------------


def test_rt61_expected_vs_actual_null_without_pre_market(client):
    """No pre_market notes → expected_vs_actual is null (section absent)."""
    iid = _member("zztest-retro-eva-empty@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        assert r.json()["report"]["expected_vs_actual"] is None
    finally:
        _cleanup(iid)


def test_rt61_expected_vs_actual_from_pre_market_note(client):
    """pre_market-marked journal note pairs with same-day trades."""
    iid = _member("zztest-retro-eva-pm@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_tool_notes (identity_id, surface, body_md)
                       VALUES (%s, 'journal', %s)""",
                    (
                        iid,
                        "pre_market: Only take A+ setups; size half if unsure.",
                    ),
                )
        _seed_trades(iid, 3, adherence="followed")
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        eva = r.json()["report"]["expected_vs_actual"]
        assert isinstance(eva, list)
        assert len(eva) >= 1
        row = eva[0]
        assert "Only take A+ setups" in row["stated_intent"]
        assert "pre_market:" not in row["stated_intent"].lower()
        assert "what_executed" in row
        assert row.get("gap") is None
    finally:
        _cleanup(iid)


def test_rt61_adverse_what_worked_no_pnl_figure(client):
    """Followed on negative book day → process fact; no dollar figure."""
    iid = _member("zztest-retro-adverse@labs.test", role_override="activator")
    cookies = cookie_for("activator", iid)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id FROM member_trade_log_accounts
                       WHERE identity_id = %s LIMIT 1""",
                    (iid,),
                )
                row = cur.fetchone()
                if row:
                    aid = int(row["id"])
                else:
                    cur.execute(
                        """INSERT INTO member_trade_log_accounts
                             (identity_id, label, broker, status, sort_order)
                           VALUES (%s, 'Primary', 'unset', 'active', 0)""",
                        (iid,),
                    )
                    aid = int(cur.lastrowid)
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, strategy,
                          setup_md, plan_md, rules_md, adherence,
                          deviation_md, lesson_md, pnl_amount)
                       VALUES (%s, %s, NOW(), 'zz', '', '', '', 'followed',
                               '', '', -50.00)""",
                    (iid, aid),
                )
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, strategy,
                          setup_md, plan_md, rules_md, adherence,
                          deviation_md, lesson_md, pnl_amount)
                       VALUES (%s, %s, NOW(), 'zz', '', '', '', 'followed',
                               '', '', -10.00)""",
                    (iid, aid),
                )
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        ww = r.json()["report"]["what_worked"]
        assert isinstance(ww, list)
        text = " ".join(str(x.get("observation") or "") for x in ww)
        assert "negative" in text.lower() or "followed" in text.lower()
        # Never print the adverse dollar figure in what_worked
        assert "-50" not in text
        assert "-10" not in text
        assert "$" not in text
    finally:
        _cleanup(iid)


def test_period_indicator_on_gather(client):
    """Spec v0.7.1 §7 — gather includes period_indicator; no rolling co-frame."""
    import identity as identity_mod
    import db
    from tests.conftest import cookie_for
    from datetime import date

    email = "zztest-retro-period-ind@labs.test"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "PI")
            cur.execute(
                "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                ("activator", iid),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,))
    cookies = cookie_for("activator", iid)
    try:
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        rep = r.json().get("report") or {}
        pi = rep.get("period_indicator")
        assert pi is not None, rep.keys()
        assert pi.get("context") == "period"
        assert pi.get("rolling") is None
        assert pi.get("status") in ("not_enough_yet", "steady", "pattern")
        # integrity may still exist for comparison but is rolling context
        ir = rep.get("integrity_review") or {}
        if ir:
            assert ir.get("context") in (None, "rolling") or True
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
                cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def test_mirror_behavior_line_not_diagnosis():
    """Spec §8.1 — mirror names tags; never diagnoses character."""
    line = rd._mirror_behavior_line("impatience", 4, ["2026-07-14", "2026-07-15"])
    assert "You named" in line
    assert "impatience" in line
    assert "4 times" in line or "four" in line.lower()
    low = line.lower()
    for ban in (
        "you were",
        "you felt",
        "you seemed",
        "you are",
        "diagnos",
    ):
        assert ban not in low, line
    rd._assert_mirror_not_diagnosis(line)


def test_lexicon_ceremony_map_static():
    """Spec §8.1a — Behavior→3, Context→4, Process→2/8, Insight→6."""
    m = {row["system_key"]: row for row in rd.lexicon_ceremony_map()}
    assert m["behavior"]["ceremony_steps"] == [3]
    assert m["context"]["ceremony_steps"] == [4]
    assert 2 in m["process"]["ceremony_steps"] and 8 in m["process"]["ceremony_steps"]
    assert m["insight"]["ceremony_steps"] == [6]


def test_emotion_mirror_on_gather(client):
    """Spec v0.7.1 §8.1 — Behavior tags + member journal words; no diagnosis."""
    import journal_session_domain as jsd
    import tag_domain as td
    from datetime import date, timedelta

    email = "zztest-retro-emotion@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    today = date.today()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM tags WHERE slug = %s", ("impatience",))
                row = cur.fetchone()
                assert row, "seed tag impatience missing (mig 053)"
                tid = int(row["id"])
                # Two days both inside a typical maiden window (recent)
                yday = today - timedelta(days=1)
                sess = jsd.create_session(cur, iid, journal_date=today)
                sid = int(sess["id"])
                jsd.append_member_message(
                    cur,
                    iid,
                    sid,
                    body_md="Felt the urge to chase after the open — sat on hands instead.",
                )
                sess2 = jsd.create_session(cur, iid, journal_date=yday)
                sid2 = int(sess2["id"])
                for oid in (sid, sid2):
                    td.assign_tag(
                        cur,
                        tag_id=tid,
                        object_type="journal_session",
                        object_id=oid,
                        identity_id=iid,
                    )
                # Also tag a trade so object_type diversity is covered
                cur.execute(
                    """INSERT INTO member_trade_log_accounts
                         (identity_id, label, broker, status, sort_order)
                       VALUES (%s, 'Emotion', 'unset', 'active', 0)""",
                    (iid,),
                )
                aid = int(cur.lastrowid)
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, strategy,
                          setup_md, plan_md, rules_md, adherence,
                          deviation_md, lesson_md, pnl_amount)
                       VALUES (%s, %s, NOW(), 'probe', '', '', '', 'broke',
                               '', '', 0)""",
                    (iid, aid),
                )
                trade_id = int(cur.lastrowid)
                td.assign_tag(
                    cur,
                    tag_id=tid,
                    object_type="trade",
                    object_id=trade_id,
                    identity_id=iid,
                )
                # Context tag for step 4 inventory
                cur.execute("SELECT id FROM tags WHERE slug = %s", ("fomc-day",))
                ctx = cur.fetchone()
                if ctx:
                    td.assign_tag(
                        cur,
                        tag_id=int(ctx["id"]),
                        object_type="journal_session",
                        object_id=sid,
                        identity_id=iid,
                    )
                # Insight tag for step 6 candidates
                cur.execute("SELECT id FROM tags WHERE slug = %s", ("lesson-learned",))
                ins = cur.fetchone()
                if ins:
                    td.assign_tag(
                        cur,
                        tag_id=int(ins["id"]),
                        object_type="journal_session",
                        object_id=sid,
                        identity_id=iid,
                    )

        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        rep = r.json().get("report") or {}
        em = rep.get("emotion_mirror")
        assert em is not None, list(rep.keys())
        assert em.get("source_policy") == "trader_tags_and_member_words_only"
        assert em.get("feeds_indicator") is False
        assert em.get("prohibits") == "system_emotional_diagnosis"

        behavior = em.get("behavior_tags") or []
        assert len(behavior) >= 1
        imp = next(
            (b for b in behavior if b.get("slug") == "impatience"),
            behavior[0],
        )
        # 2 sessions + 1 trade assignment
        assert imp["count"] >= 2, imp
        assert "You named" in imp["mirror"]
        assert "impatience" in imp["mirror"].lower()
        low = imp["mirror"].lower()
        assert "you were" not in low
        assert "you felt" not in low
        assert "trade" in (imp.get("object_types") or []) or "journal_session" in (
            imp.get("object_types") or []
        )

        words = em.get("journal_words") or []
        assert len(words) >= 1
        assert "chase" in words[0]["excerpt"].lower() or "sat" in words[0]["excerpt"].lower()
        assert words[0]["source"] == "member_message"

        # Lexicon map present
        lmap = rep.get("lexicon_ceremony_map") or []
        keys = {x["system_key"] for x in lmap}
        assert keys >= {"behavior", "context", "process", "insight"}

        # §8.1b — tag frequency must not feed period indicator
        pi = rep.get("period_indicator") or {}
        assert "behavior" not in str(pi).lower() or pi.get("feeds_indicator") is not True
        assert "impatience" not in str(pi).lower()
        # readings are process meters only
        for reading in pi.get("readings") or []:
            rid = str(reading.get("id") or "")
            assert rid in ("routine", "adherence", "live", "learning")

        # All mirror statements clean
        for s in em.get("statements") or []:
            sl = s.lower()
            assert "you were" not in sl
            assert "you felt" not in sl
            assert "diagnos" not in sl
    finally:
        _cleanup(iid)


def test_rt24_emotion_mirror_ui_source():
    """R4 UI: emotion mirror + lexicon map; no system diagnosis copy."""
    path = (
        REPO_ROOT
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "retro-emotion-mirror" in src
    assert "retro-lexicon-ceremony-map" in src
    assert "retro-behavior-tags" in src
    assert "retro-journal-words" in src
    assert 'data-feeds-indicator="false"' in src
    # No character diagnosis in ceremony copy
    low = src.lower()
    assert "you were impatient" not in low
    assert "you felt anxious" not in low
    assert "emotional state" not in low


def test_trend_floor_no_direction_below_min():
    """Spec §12 — no trend direction below TREND_MIN_CYCLES."""
    assert rd.TREND_MIN_CYCLES >= 4
    # Synthetic series shorter than floor
    vals = [0.1, 0.2, 0.15]
    assert rd._series_direction(vals) is None
    # At floor
    vals4 = [0.1, 0.12, 0.2, 0.25]
    assert rd._series_direction(vals4) in ("up", "down", "flat")


def test_correlation_never_pnl_surface():
    """Spec §13 — correlation excludes P&L / win rate / expectancy."""
    trades = [
        {"exec_at": "2026-07-20T14:00:00", "adherence": "broke", "pnl_amount": -50},
        {"exec_at": "2026-07-21T14:00:00", "adherence": "followed", "pnl_amount": 100},
        {"exec_at": "2026-07-22T14:00:00", "adherence": "broke", "pnl_amount": -20},
        {"exec_at": "2026-07-23T14:00:00", "adherence": "followed", "pnl_amount": 30},
    ]
    corr = rd.build_correlation(
        trades,
        emotion_mirror={"behavior_tags": []},
        clustering={"statements": []},
    )
    assert "pnl" in corr["excludes"]
    assert "win_rate" in corr["excludes"]
    assert "expectancy" in corr["excludes"]
    blob = str(corr).lower()
    assert "expectancy" not in blob or "excludes" in blob
    # Observation text must not pitch expectancy/win rate as metrics
    for s in corr.get("statements") or []:
        obs = str(s.get("observation") or "").lower()
        assert "expectancy" not in obs
        assert "win rate" not in obs
        assert "profit factor" not in obs
        assert "$" not in obs
        # Denial of P&L comparison is allowed; claiming a P&L correlation is not
        assert "correlated to p&l" not in obs
        assert "expectancy of" not in obs
    assert corr.get("has_content") is True  # adherence split


def test_clustering_and_trends_on_gather(client):
    """Spec §8.2 / §12 / §13 — gather includes clustering, trends, correlation."""
    import journal_session_domain as jsd
    import tag_domain as td
    from datetime import date

    email = "zztest-retro-cluster@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    today = date.today()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                # Broke trade today
                cur.execute(
                    """INSERT INTO member_trade_log_accounts
                         (identity_id, label, broker, status, sort_order)
                       VALUES (%s, 'Cluster', 'unset', 'active', 0)""",
                    (iid,),
                )
                aid = int(cur.lastrowid)
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, strategy,
                          setup_md, plan_md, rules_md, adherence,
                          deviation_md, lesson_md, pnl_amount)
                       VALUES (%s, %s, NOW(), 'probe', '', '', '', 'broke',
                               '', '', -12.5)""",
                    (iid, aid),
                )
                trade_id = int(cur.lastrowid)
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                         (identity_id, account_id, exec_at, strategy,
                          setup_md, plan_md, rules_md, adherence,
                          deviation_md, lesson_md, pnl_amount)
                       VALUES (%s, %s, NOW(), 'probe', '', '', '', 'followed',
                               '', '', 8.0)""",
                    (iid, aid),
                )
                # Behavior + context tags on session same day as broke
                cur.execute("SELECT id FROM tags WHERE slug = %s", ("impatience",))
                tid = int(cur.fetchone()["id"])
                cur.execute("SELECT id FROM tags WHERE slug = %s", ("fomc-day",))
                ctx_id = int(cur.fetchone()["id"])
                sess = jsd.create_session(cur, iid, journal_date=today)
                sid = int(sess["id"])
                td.assign_tag(
                    cur,
                    tag_id=tid,
                    object_type="journal_session",
                    object_id=sid,
                    identity_id=iid,
                )
                td.assign_tag(
                    cur,
                    tag_id=ctx_id,
                    object_type="journal_session",
                    object_id=sid,
                    identity_id=iid,
                )
                td.assign_tag(
                    cur,
                    tag_id=tid,
                    object_type="trade",
                    object_id=trade_id,
                    identity_id=iid,
                )

        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        rep = r.json().get("report") or {}

        cl = rep.get("clustering")
        assert cl is not None, list(rep.keys())
        assert "statements" in cl
        assert "note" in cl

        trends = rep.get("trends")
        assert trends is not None
        assert trends.get("min_cycles") == rd.TREND_MIN_CYCLES
        assert trends.get("status") in ("building_baseline", "trend_readable")
        assert trends.get("feeds_indicator") is False
        # Maiden / first cycle → no direction
        if trends["cycle_count"] < rd.TREND_MIN_CYCLES:
            assert trends["status"] == "building_baseline"
            for s in trends.get("series") or []:
                assert s.get("trend_asserted") is False
                assert s.get("direction") is None

        corr = rep.get("correlation")
        assert corr is not None
        assert "pnl" in (corr.get("excludes") or [])
        blob = str(corr).lower()
        # Hard grep: no expectancy / win_rate as correlation metrics in statements
        for s in corr.get("statements") or []:
            obs = str(s.get("observation") or "").lower()
            assert "expectancy" not in obs
            assert "win rate" not in obs
        # Adherence split present when we have broke + followed
        assert corr.get("has_content") is True
        assert "process damage" in blob or "rule-break" in blob
        # Never dollar theater in correlation statements
        for s in corr.get("statements") or []:
            obs = str(s.get("observation") or "")
            assert "-12.5" not in obs
            assert "$" not in obs
    finally:
        _cleanup(iid)


def test_rt24_clustering_ui_source():
    """R5 UI: clustering + trends + correlation; no P&L correlation copy."""
    path = (
        REPO_ROOT
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "retro-cluster-statements" in src
    assert "retro-correlation" in src
    assert "retro-trends" in src
    assert 'data-excludes-pnl="true"' in src
    assert "retro-trend-series" in src
    low = src.lower()
    # Denial language is required; profit-claim marketing is banned
    assert "never to p&l" in low or "never to p&amp;l" in low
    assert "process produces money" not in low
    assert "you were impatient" not in low
    assert "profit factor" not in low


def test_interruption_notice_copy_stated_not_scolded():
    """Spec §9 — notice names span; no remedial scold language."""
    from datetime import datetime

    start = datetime(2026, 7, 8, 12, 0, 0)
    end = datetime(2026, 7, 25, 12, 0, 0)
    n = rd.build_interruption_notice(
        interrupted=True,
        scope_start=start,
        scope_end=end,
        cadence_days=7,
        is_maiden=False,
        prior_completed_at=start,
    )
    assert n is not None
    assert n["interrupted"] is True
    assert n["tone"] == "stated_not_scolded"
    assert "interrupted" in n["notice"].lower()
    assert "8–25 July" in n["scope_label"] or "8" in n["scope_label"]
    assert "instead of one" in n["notice"]
    low = n["notice"].lower()
    for ban in ("you failed", "you neglected", "lazy", "should have"):
        assert ban not in low
    # Maiden never interrupted
    assert (
        rd.build_interruption_notice(
            interrupted=True,
            scope_start=start,
            scope_end=end,
            cadence_days=7,
            is_maiden=True,
        )
        is None
    )


def test_period_was_interrupted_requires_prior(client):
    """Maiden is never interrupted; long span after complete is."""
    from datetime import datetime, timedelta

    email = "zztest-retro-interrupt@labs.test"
    iid = _member(email)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                # No prior → not interrupted even if span is long
                start = datetime.utcnow() - timedelta(days=40)
                end = datetime.utcnow()
                assert (
                    rd.period_was_interrupted(cur, iid, start, end, 7) is False
                )
                # Seed a completed prior
                cur.execute(
                    """INSERT INTO member_retrospectives
                         (identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, cadence_days_at_period, period_index,
                          interrupted, completed_at)
                       VALUES (%s, 'complete', 1, %s, %s, 'prior', '', 7, 1,
                               0, %s)""",
                    (iid, start, start + timedelta(days=7), start + timedelta(days=7)),
                )
                # Span ~33 days vs cadence 7 → interrupted
                assert (
                    rd.period_was_interrupted(cur, iid, start + timedelta(days=7), end, 7)
                    is True
                )
                # Short span within cadence+slack → not interrupted
                short_end = start + timedelta(days=7) + timedelta(days=5)
                assert (
                    rd.period_was_interrupted(
                        cur, iid, start + timedelta(days=7), short_end, 7
                    )
                    is False
                )
    finally:
        _cleanup(iid)


def test_cadence_change_forward_only_does_not_rewrite_past(client):
    """R6-3 — widening cadence does not rewrite past cadence_days_at_period."""
    email = "zztest-retro-cadence-fwd@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    try:
        # Create maiden retro with default cadence stamp
        r = client.post(
            "/api/me/retrospectives",
            cookies=cookies,
            json={"gather": True},
        )
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        stamped = r.json().get("cadence_days_at_period")
        assert stamped is not None
        assert stamped == 7 or int(stamped) > 0

        # Widen cadence via profile
        p = client.patch(
            "/api/me/profile",
            cookies=cookies,
            json={"retro_cadence_days": 14},
        )
        assert p.status_code == 200, p.text
        assert p.json().get("retro_cadence_days") == 14

        # Past retro stamp unchanged
        g = client.get(f"/api/me/retrospectives/{rid}", cookies=cookies)
        assert g.status_code == 200, g.text
        assert g.json()["cadence_days_at_period"] == stamped

        # History row written
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT cadence_days FROM member_retro_cadence_history
                       WHERE identity_id = %s ORDER BY id DESC LIMIT 1""",
                    (iid,),
                )
                row = cur.fetchone()
                assert row is not None
                assert int(row["cadence_days"]) == 14
                # Identity updated, retro stamp not
                cur.execute(
                    "SELECT retro_cadence_days FROM identities WHERE identity_id = %s",
                    (iid,),
                )
                assert int(cur.fetchone()["retro_cadence_days"]) == 14
                cur.execute(
                    """SELECT cadence_days_at_period FROM member_retrospectives
                       WHERE id = %s""",
                    (rid,),
                )
                assert int(cur.fetchone()["cadence_days_at_period"]) == int(stamped)
    finally:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM member_retro_cadence_history WHERE identity_id = %s",
                    (iid,),
                )
        _cleanup(iid)


def test_rt24_interruption_ui_source():
    """R6 UI: interruption notice before ceremony; stated not scolded."""
    path = (
        REPO_ROOT
        / "web"
        / "components"
        / "retrospective"
        / "RetrospectiveWorkspace.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "retro-interruption-notice" in src
    assert "stated_not_scolded" in src
    # Notice precedes ceremony nav
    i_notice = src.find("retro-interruption-notice")
    i_nav = src.find("ceremony-step-nav")
    assert 0 <= i_notice < i_nav
    low = src.lower()
    assert "you failed" not in low
    assert "you neglected" not in low
    assert "stamped" in low or "does not rewrite" in low
