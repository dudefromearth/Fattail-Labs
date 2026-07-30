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
                "DELETE FROM member_habit_plans WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
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
    """Charlie workspace: Spec §6 section order via data-testid markers."""
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
        'testId="retro-integrity"',
        'testId="retro-deviations"',
        'testId="retro-what-worked"',
        'data-testid="retro-book"',
        'testId="retro-reflection"',
        'testId="retro-agent"',
    ]
    positions = []
    for m in markers:
        i = src.find(m)
        assert i >= 0, f"missing marker {m}"
        positions.append((i, m))
    # Strict increasing order in source ≈ render order
    for a, b in zip(positions, positions[1:]):
        assert a[0] < b[0], f"order violation: {a[1]} after {b[1]}"
    assert "Show book sample" in src
    assert "Hide book sample" in src
    assert "bookExpanded" in src
    # Default collapsed — initial useState false
    assert "useState(false)" in src or "useState(false);" in src
    # RT3-2 comparison UI
    assert "retro-comparison" in src
    assert "Not comparable" in src
    assert "This window" in src or "comparison.label" in src
    # RT4-2 carry-forward self-assessment (Tango labels)
    assert "Kept" in src and "Partial" in src and "Lapsed" in src
    assert "patchHabitPlan" in src or "setPlanAssessment" in src
    assert "You succeeded" not in src and "You failed" not in src
    # RT5-2 agent panel
    assert "retro-agent-run" in src
    assert "Accept" in src and "Reject" in src
    assert "never profit" in src.lower() or "profit claims" in src.lower()
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
