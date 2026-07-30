"""R7 — retrospective material notifications (Spec v0.7.1 §14)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import db
import identity as identity_mod
import member_notify as mn
import retrospective_notify as rn
from tests.conftest import cookie_for


def _member(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(cur, email, "Notify Tester")
            cur.execute(
                "UPDATE identities SET role_override = %s WHERE identity_id = %s",
                ("activator", iid),
            )
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute(
                "DELETE FROM member_notifications WHERE identity_id = %s", (iid,)
            )
            cur.execute(
                "DELETE FROM member_retrospectives WHERE identity_id = %s", (iid,)
            )
    return iid


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_notifications WHERE identity_id = %s", (iid,)
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
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def _seed_trade(iid: int, *, exec_at: datetime | None = None) -> None:
    at = exec_at or datetime.now(timezone.utc).replace(tzinfo=None)
    if at.tzinfo is not None:
        at = at.astimezone(timezone.utc).replace(tzinfo=None)
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
                       VALUES (%s, 'N', 'unset', 'active', 0)""",
                    (iid,),
                )
                aid = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO member_trade_log_trades
                     (identity_id, account_id, exec_at, strategy,
                      setup_md, plan_md, rules_md, adherence,
                      deviation_md, lesson_md, pnl_amount)
                   VALUES (%s, %s, %s, 'probe', '', '', '', 'broke',
                           '', '', -1)""",
                (iid, aid, at),
            )


def test_channel_policy_in_app_first():
    p = mn.channel_policy()
    assert p["primary"] == "in_app"
    assert p["email_for_family_b_material"] is False


def test_rth_weekday_window():
    # Monday 15:00 UTC ≈ 10:00 or 11:00 ET depending on DST — pick explicit NY
    from zoneinfo import ZoneInfo

    ny = ZoneInfo("America/New_York")
    # Wednesday 11:00 ET → RTH
    mid = datetime(2026, 7, 15, 11, 0, tzinfo=ny)
    assert mn.is_regular_trading_hours(mid) is True
    # Wednesday 18:00 ET → not RTH
    eve = datetime(2026, 7, 15, 18, 0, tzinfo=ny)
    assert mn.is_regular_trading_hours(eve) is False
    # Saturday → not RTH
    sat = datetime(2026, 7, 18, 12, 0, tzinfo=ny)
    assert mn.is_regular_trading_hours(sat) is False


def test_once_per_period_no_second_ping(client):
    email = "zztest-retro-notify-once@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    try:
        # Outside RTH; trade inside evaluate window
        now = datetime(2026, 7, 15, 20, 0, tzinfo=timezone.utc)
        _seed_trade(iid, exec_at=now - timedelta(days=1))
        with db.transaction() as conn:
            with conn.cursor() as cur:
                r1 = rn.evaluate_and_maybe_notify(
                    cur, iid, role="activator", now=now, force_ignore_rth=True
                )
        assert r1["status"] == "created", r1
        assert r1.get("notification") is not None
        assert r1["notification"]["channel"] == "in_app"
        assert r1["notification"]["email_status"] == "skipped"
        body = r1["notification"]["body"].lower()
        assert "due" not in body

        # Second evaluate — must not create another
        with db.transaction() as conn:
            with conn.cursor() as cur:
                r2 = rn.evaluate_and_maybe_notify(
                    cur, iid, role="activator", now=now, force_ignore_rth=True
                )
        assert r2["status"] == "already_sent"
        assert r2["reason"] == "once_per_period"

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT COUNT(*) AS n FROM member_notifications
                       WHERE identity_id = %s AND kind = %s""",
                    (iid, mn.KIND_RETRO_MATERIAL),
                )
                assert int(cur.fetchone()["n"]) <= 1

        # API list
        g = client.get(
            "/api/me/notifications?kind=retrospective.material_ready",
            cookies=cookies,
        )
        assert g.status_code == 200, g.text
        assert "channel_policy" in g.json()
        assert g.json()["channel_policy"]["primary"] == "in_app"
    finally:
        _cleanup(iid)


def test_rth_suppresses_without_position_leak():
    email = "zztest-retro-notify-rth@labs.test"
    iid = _member(email)
    try:
        from zoneinfo import ZoneInfo

        now = datetime(2026, 7, 15, 15, 0, tzinfo=ZoneInfo("America/New_York"))
        _seed_trade(iid, exec_at=now - timedelta(hours=2))
        with db.transaction() as conn:
            with conn.cursor() as cur:
                r = rn.evaluate_and_maybe_notify(
                    cur, iid, role="activator", now=now
                )
        assert r["status"] == "suppressed"
        assert r["reason"] == "rth"
        blob = str(r).lower()
        assert "position_id" not in blob
        assert "qty" not in blob
        assert "symbol" not in blob
    finally:
        _cleanup(iid)


def test_open_position_check_soft_fail_no_leak():
    """Unavailable open-position check proceeds; never leaks detail."""
    email = "zztest-retro-notify-pos@labs.test"
    iid = _member(email)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                status = rn.check_open_positions(cur, iid)
        assert status in ("clear", "open", "unavailable")
        # Schema has no open flag → unavailable
        assert status == "unavailable"
    finally:
        _cleanup(iid)


def test_material_copy_not_chore():
    title, body = rn._material_copy(
        {
            "trade_count": 14,
            "deviation_count": 3,
            "behavior_tags": [{"label": "impatience", "count": 2}],
            "journal_days": 4,
        },
        cadence_days=7,
    )
    assert "ready" in title.lower() or "ready" in body.lower()
    assert "due" not in body.lower()
    assert "14 trade" in body
    assert "impatience" in body
    low = body.lower()
    assert "your retrospective is due" not in low


def test_notify_eval_api(client):
    email = "zztest-retro-notify-api@labs.test"
    iid = _member(email)
    cookies = cookie_for("activator", iid)
    try:
        _seed_trade(iid)
        r = client.post(
            "/api/me/retrospectives/notify-eval",
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "status" in data
        assert "channel_policy" in data
        assert data["channel_policy"]["email_for_family_b_material"] is False
        # No position leak in any path
        blob = r.text.lower()
        assert "open_position_ids" not in blob
        assert "position detail" not in blob
    finally:
        _cleanup(iid)


def test_ui_material_notice_source():
    from pathlib import Path

    path = (
        Path(__file__).resolve().parents[2]
        / "web"
        / "components"
        / "RetroMaterialNotice.tsx"
    )
    src = path.read_text(encoding="utf-8")
    assert "retro-material-notice" in src
    assert "In-app only" in src
    assert "never a chore" in src.lower() or "material preview" in src.lower()
    # Must not use chore framing as member-facing string
    assert 'Your retrospective is due' not in src
