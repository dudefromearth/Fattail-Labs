"""The alumni rule (Membership Tiers spec): >= 28 days paid tenure on churn
earns a 1-year course-access grant; derive_role honors expiry dates."""

import db
import identity


def _cleanup(iid: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM memberships WHERE identity_id = %s", (iid,))
            cur.execute("DELETE FROM identities WHERE identity_id = %s", (iid,))


def _identity(email: str) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity.get_or_create_identity(cur, email, "ZZ Alumni Probe")


def _plan_id(cur, slug: str) -> int:
    cur.execute("SELECT id FROM plans WHERE slug = %s", (slug,))
    return cur.fetchone()["id"]


def test_short_tenure_earns_nothing():
    iid = _identity("zztest-alumni-short@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT DATE_SUB(NOW(), INTERVAL 5 DAY) AS d")
                started = cur.fetchone()["d"]
                assert identity.maybe_grant_alumni(cur, iid, started) is False
                assert identity.derive_role(cur, iid) == "observer"
    finally:
        _cleanup(iid)


def test_full_tenure_earns_alumni_year():
    iid = _identity("zztest-alumni-full@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT DATE_SUB(NOW(), INTERVAL 35 DAY) AS d")
                started = cur.fetchone()["d"]
                assert identity.maybe_grant_alumni(cur, iid, started) is True
                assert identity.derive_role(cur, iid) == "alumni"
                cur.execute(
                    """SELECT m.current_period_end FROM memberships m
                       JOIN plans p ON m.plan_id = p.id
                       WHERE m.identity_id = %s AND p.slug = 'courses-alumni'""",
                    (iid,),
                )
                end = cur.fetchone()["current_period_end"]
                cur.execute("SELECT DATEDIFF(%s, NOW()) AS days", (end,))
                assert 360 <= cur.fetchone()["days"] <= 366
    finally:
        _cleanup(iid)


def test_active_plan_beats_alumni_and_expiry_is_honored():
    iid = _identity("zztest-alumni-role@labs.test")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                nav = _plan_id(cur, "navigator")
                identity.upsert_membership(cur, iid, nav, "active", "zztest")
                assert identity.derive_role(cur, iid) == "navigator"
                # expired membership must stop granting the role
                cur.execute(
                    "UPDATE memberships SET status = 'expired' WHERE identity_id = %s",
                    (iid,),
                )
                assert identity.derive_role(cur, iid) == "observer"
    finally:
        _cleanup(iid)
