"""Core identity & access operations — Labs-native, provider-agnostic.

Providers (WordPress SSO, WooCommerce webhooks) call into this module; nothing in
here knows any provider's vocabulary. Spec: FatTail-Labs-Identity-Access-Spec-v1.0.
"""

import hashlib
import hmac
import secrets

from auth import ROLE_ORDER, role_at_least

SCRYPT_N, SCRYPT_R, SCRYPT_P = 16384, 8, 1
ACTIVE_STATUSES = ("active", "grace")
ALUMNI_PLAN_SLUG = "courses-alumni"
ALUMNI_MIN_TENURE_DAYS = 28
# Paid Observer membership plan (Membership Tiers + DL-126/128).
# During the term, feature access is identical to Navigator.
OBSERVER_TRIAL_SLUG = "observer-trial"


class IdentityError(Exception):
    pass


# --- passwords (stdlib scrypt, no external crypto dependency) -----------------

def hash_password(password: str) -> str:
    if len(password) < 10:
        raise IdentityError("Password must be at least 10 characters")
    salt = secrets.token_bytes(32)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=32
    )
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt_hex, hash_hex = stored.split("$")
        if scheme != "scrypt":
            return False
        digest = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex),
            n=int(n), r=int(r), p=int(p), dklen=32,
        )
        return hmac.compare_digest(digest.hex(), hash_hex)
    except (ValueError, TypeError):
        return False


# --- identity resolution ------------------------------------------------------

def get_or_create_identity(cur, email: str, display_name: str = "") -> int:
    """Resolve identity by email; create on first mint (SSO join / register).

    On **first create only**, provision FatTail house starter bots in Curate
    (armed sim instances). Existing members are unchanged.
    """
    email = email.strip().lower()
    if not email or "@" not in email:
        raise IdentityError(f"Invalid email: {email!r}")
    cur.execute("SELECT identity_id FROM identities WHERE email = %s", (email,))
    row = cur.fetchone()
    if row:
        return row["identity_id"]
    cur.execute(
        "INSERT INTO identities (email, display_name) VALUES (%s, %s)",
        (email, display_name),
    )
    identity_id = int(cur.lastrowid)
    # First-time mint: Curate-ready house bots (sim), promote path later.
    # Best-effort — identity always lands even if Strategy Lab tables lag.
    try:
        from strategy_lab_designs import try_provision_starter_curate_bots

        try_provision_starter_curate_bots(cur, identity_id)
    except Exception:
        import logging

        logging.getLogger(__name__).exception(
            "mint provision hook failed identity_id=%s", identity_id
        )
    return identity_id


def resolve_by_link(cur, provider: str, external_id: str) -> int | None:
    cur.execute(
        "SELECT identity_id FROM identity_links WHERE provider = %s AND external_id = %s",
        (provider, str(external_id)),
    )
    row = cur.fetchone()
    return row["identity_id"] if row else None


def resolve_stripe_customer(cur, identity_id: int) -> str | None:
    cur.execute(
        "SELECT external_id FROM identity_links WHERE identity_id = %s AND provider = 'stripe'",
        (identity_id,),
    )
    row = cur.fetchone()
    return row["external_id"] if row else None


def ensure_link(cur, identity_id: int, provider: str, external_id: str) -> None:
    cur.execute(
        "INSERT IGNORE INTO identity_links (identity_id, provider, external_id) "
        "VALUES (%s, %s, %s)",
        (identity_id, provider, str(external_id)),
    )


def link_discord_from_sso(
    cur,
    identity_id: int,
    discord_user_id: str,
    *,
    username: str = "",
    avatar_hash: str = "",
    source: str = "sso",
) -> None:
    """Attach Discord snowflake from WP SSO claims (DL-240 / Mike C0-3).

    Never stores OAuth access/refresh tokens. Collision on snowflake → refuse.
    """
    snow = (discord_user_id or "").strip()
    if not snow:
        return
    if not snow.isdigit() or len(snow) < 5:
        raise IdentityError(f"Invalid discord_user_id: {snow!r}")

    other = resolve_by_link(cur, "discord", snow)
    if other is not None and int(other) != int(identity_id):
        raise IdentityError(
            "This Discord account is already linked to a different Labs identity"
        )

    # Identity already linked to a different Discord user — replace link
    existing = _link_external_for_identity(cur, identity_id, "discord")
    if existing is not None and existing != snow:
        cur.execute(
            """DELETE FROM identity_links
               WHERE identity_id = %s AND provider = 'discord'""",
            (identity_id,),
        )
        cur.execute(
            "DELETE FROM identity_discord_profiles WHERE identity_id = %s",
            (identity_id,),
        )

    ensure_link(cur, identity_id, "discord", snow)
    cur.execute(
        """INSERT INTO identity_discord_profiles
           (identity_id, discord_user_id, username, avatar_hash, source)
           VALUES (%s, %s, %s, %s, %s)
           ON DUPLICATE KEY UPDATE
             discord_user_id = VALUES(discord_user_id),
             username = VALUES(username),
             avatar_hash = VALUES(avatar_hash),
             source = VALUES(source),
             updated_at = CURRENT_TIMESTAMP""",
        (
            identity_id,
            snow,
            (username or "")[:255],
            (avatar_hash or None),
            (source or "sso")[:32],
        ),
    )


def get_discord_profile(cur, identity_id: int) -> dict | None:
    cur.execute(
        """SELECT discord_user_id, username, avatar_hash, source, updated_at
           FROM identity_discord_profiles WHERE identity_id = %s""",
        (identity_id,),
    )
    row = cur.fetchone()
    if not row:
        # Fallback: link only
        ext = _link_external_for_identity(cur, identity_id, "discord")
        if not ext:
            return None
        return {
            "discord_user_id": ext,
            "username": "",
            "avatar_hash": None,
            "source": "link",
            "updated_at": None,
        }
    return {
        "discord_user_id": row["discord_user_id"],
        "username": row["username"] or "",
        "avatar_hash": row["avatar_hash"],
        "source": row["source"],
        "updated_at": row["updated_at"].isoformat()
        if hasattr(row["updated_at"], "isoformat")
        else row["updated_at"],
    }


def _identity_id_for_email(cur, email: str) -> int | None:
    email = (email or "").strip().lower()
    if not email or "@" not in email:
        return None
    cur.execute("SELECT identity_id FROM identities WHERE email = %s", (email,))
    row = cur.fetchone()
    return int(row["identity_id"]) if row else None


def _link_external_for_identity(
    cur, identity_id: int, provider: str
) -> str | None:
    """Return external_id if this identity already has a link for provider."""
    cur.execute(
        """SELECT external_id FROM identity_links
           WHERE identity_id = %s AND provider = %s""",
        (identity_id, provider),
    )
    row = cur.fetchone()
    return str(row["external_id"]) if row else None


def resolve_sso_identity(
    cur,
    provider: str,
    external_id: str,
    email: str,
    display_name: str = "",
) -> int:
    """Resolve Labs identity for SSO (auth hardening M2).

    Rules:
    1. Prefer stable ``(provider, external_id)`` link (WP user id).
    2. If link exists and JWT email differs:
       - If new email is free → update identity.email (WP is SoR for that user).
       - If new email belongs to a *different* identity → refuse (collision).
    3. If no link: attach to existing identity by email, or create.
       - Refuse if that email identity is already linked to a *different*
         external_id for the same provider (two WP users → one email).
    4. Always ensure the link row exists after resolve.
    """
    email_n = (email or "").strip().lower()
    if not email_n or "@" not in email_n:
        raise IdentityError(f"Invalid SSO email: {email!r}")
    ext = str(external_id).strip()
    if not ext:
        raise IdentityError("SSO external_id required")
    name = (display_name or "").strip()

    linked_id = resolve_by_link(cur, provider, ext)
    email_owner = _identity_id_for_email(cur, email_n)

    if linked_id is not None:
        cur.execute(
            "SELECT email, display_name FROM identities WHERE identity_id = %s",
            (linked_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise IdentityError(f"Broken identity_link for {provider}:{ext}")
        current_email = (row["email"] or "").strip().lower()
        if current_email != email_n:
            if email_owner is not None and email_owner != linked_id:
                raise IdentityError(
                    "SSO email belongs to a different Labs account than this "
                    f"provider link ({provider}:{ext}); contact support"
                )
            cur.execute(
                "UPDATE identities SET email = %s WHERE identity_id = %s",
                (email_n, linked_id),
            )
        if name and not (row.get("display_name") or "").strip():
            cur.execute(
                "UPDATE identities SET display_name = %s WHERE identity_id = %s",
                (name, linked_id),
            )
        ensure_link(cur, linked_id, provider, ext)
        return int(linked_id)

    # No link yet — resolve by email or create
    if email_owner is not None:
        other_ext = _link_external_for_identity(cur, email_owner, provider)
        if other_ext is not None and other_ext != ext:
            raise IdentityError(
                "Labs account for this email is already linked to a different "
                f"{provider} user id; contact support"
            )
        if name:
            cur.execute(
                """UPDATE identities SET display_name = %s
                   WHERE identity_id = %s
                     AND (display_name IS NULL OR display_name = '')""",
                (name, email_owner),
            )
        ensure_link(cur, email_owner, provider, ext)
        return int(email_owner)

    identity_id = get_or_create_identity(cur, email_n, name)
    ensure_link(cur, identity_id, provider, ext)
    return int(identity_id)


# --- memberships & roles ------------------------------------------------------

def _entitlement_key_candidates(external_key: str) -> list[str]:
    """Lookup forms for a Woo plan key from the SSO JWT.

    fotw-sso may send slug, name-ish strings, or mixed case. Try exact first,
    then normalized slug candidates so Observer / Activator / Navigator /
    Coaching resolve without a one-off map row for every spelling.
    """
    import re

    k = (external_key or "").strip()
    if not k:
        return []
    out: list[str] = []
    for cand in (
        k,
        k.lower(),
        k.lower().replace("_", "-").replace(" ", "-"),
        re.sub(r"[^a-z0-9-]+", "", k.lower().replace("_", "-").replace(" ", "-")),
    ):
        c = cand.strip("-")
        if c and c not in out:
            out.append(c)
    # Drop trailing -access / -membership for a secondary try
    extra: list[str] = []
    for c in out:
        for suf in ("-access", "-membership", "-plan", "-tier"):
            if c.endswith(suf):
                base = c[: -len(suf)]
                if base and base not in out and base not in extra:
                    extra.append(base)
    out.extend(extra)
    return out


def plan_id_for_provider_key(cur, provider: str, external_key: str) -> int | None:
    for key in _entitlement_key_candidates(external_key):
        cur.execute(
            "SELECT plan_id FROM provider_plan_map WHERE provider = %s AND external_key = %s",
            (provider, key),
        )
        row = cur.fetchone()
        if row:
            return int(row["plan_id"])
    return None


def upsert_membership(cur, identity_id: int, plan_id: int, status: str,
                      source: str, external_ref: str | None = None) -> None:
    if status not in ("active", "grace", "cancelled", "expired"):
        raise IdentityError(f"Invalid membership status: {status!r}")
    cur.execute(
        """INSERT INTO memberships (identity_id, plan_id, status, source, external_ref)
           VALUES (%s, %s, %s, %s, %s)
           ON DUPLICATE KEY UPDATE status = VALUES(status),
                                   external_ref = COALESCE(VALUES(external_ref), external_ref)""",
        (identity_id, plan_id, status, source, external_ref),
    )


def sync_provider_memberships(cur, identity_id: int, provider: str,
                              entitlement_keys: list[str]) -> None:
    """Replace-by-source: provider's current entitlements become the memberships
    from that source; anything from this source not in the list expires.

    Unknown external_key values are ignored (no membership) — they must exist in
    provider_plan_map. Unmapped keys are logged so ops can add the Woo plan slug.
    """
    import logging

    log = logging.getLogger("labs.identity")
    granted_plan_ids = []
    unmapped: list[str] = []
    for key in entitlement_keys:
        plan_id = plan_id_for_provider_key(cur, provider, key)
        if plan_id is not None:
            granted_plan_ids.append(plan_id)
            upsert_membership(cur, identity_id, plan_id, "active", provider)
        else:
            unmapped.append(key)
    if unmapped:
        log.warning(
            "SSO/webhook entitlement keys not in provider_plan_map "
            "(member stays free if none mapped): provider=%s identity_id=%s keys=%s",
            provider,
            identity_id,
            unmapped,
        )
    # Expiring rows first pass the alumni tenure check (Membership Tiers spec §3).
    if granted_plan_ids:
        placeholders = ",".join(["%s"] * len(granted_plan_ids))
        cur.execute(
            f"""SELECT started_at FROM memberships
                WHERE identity_id = %s AND source = %s AND status != 'expired'
                  AND plan_id NOT IN ({placeholders})""",
            (identity_id, provider, *granted_plan_ids),
        )
    else:
        cur.execute(
            """SELECT started_at FROM memberships
               WHERE identity_id = %s AND source = %s AND status != 'expired'""",
            (identity_id, provider),
        )
    for row in cur.fetchall():
        maybe_grant_alumni(cur, identity_id, row["started_at"])
    if granted_plan_ids:
        placeholders = ",".join(["%s"] * len(granted_plan_ids))
        cur.execute(
            f"""UPDATE memberships SET status = 'expired'
                WHERE identity_id = %s AND source = %s
                  AND plan_id NOT IN ({placeholders})""",
            (identity_id, provider, *granted_plan_ids),
        )
    else:
        cur.execute(
            "UPDATE memberships SET status = 'expired' WHERE identity_id = %s AND source = %s",
            (identity_id, provider),
        )


def derive_role(cur, identity_id: int) -> str:
    """The single role algorithm (spec §3): override, else best active plan, else observer."""
    cur.execute(
        "SELECT role_override FROM identities WHERE identity_id = %s", (identity_id,)
    )
    row = cur.fetchone()
    if row is None:
        raise IdentityError(f"Unknown identity: {identity_id}")
    if row["role_override"]:
        return row["role_override"]
    placeholders = ",".join(["%s"] * len(ACTIVE_STATUSES))
    # Date-expired memberships confer nothing (alumni year, lapsed periods).
    cur.execute(
        f"""SELECT p.grants_role FROM memberships m JOIN plans p ON m.plan_id = p.id
            WHERE m.identity_id = %s AND m.status IN ({placeholders})
              AND (m.current_period_end IS NULL OR m.current_period_end > NOW())""",
        (identity_id, *ACTIVE_STATUSES),
    )
    roles = [r["grants_role"] for r in cur.fetchall() if r["grants_role"] in ROLE_ORDER]
    if not roles:
        return "observer"
    return max(roles, key=ROLE_ORDER.index)


def has_active_plan_slug(cur, identity_id: int, slug: str) -> bool:
    """True if identity has an unexpired active/grace membership for plan slug."""
    placeholders = ",".join(["%s"] * len(ACTIVE_STATUSES))
    cur.execute(
        f"""SELECT 1
            FROM memberships m
            JOIN plans p ON p.id = m.plan_id
            WHERE m.identity_id = %s
              AND p.slug = %s
              AND m.status IN ({placeholders})
              AND (m.current_period_end IS NULL OR m.current_period_end > NOW())
            LIMIT 1""",
        (identity_id, slug, *ACTIVE_STATUSES),
    )
    return cur.fetchone() is not None


def feature_role(cur, identity_id: int, session_role: str) -> str:
    """Role used for **feature gates** (DL-126 / DL-128).

    Takes the **best** of:
    - session JWT role (snapshotted at login)
    - live ``derive_role`` from active memberships (Observer/Activator/Navigator/Coaching)

    Paid Observer (``observer-trial``) → navigator-tier access for the term.
    Free no-plan accounts stay ``observer`` (previews only).
    """
    role = session_role if session_role in ROLE_ORDER else "observer"
    if role == "administrator" or session_role == "administrator":
        return "administrator"
    try:
        live = derive_role(cur, identity_id)
    except IdentityError:
        live = "observer"
    if live not in ROLE_ORDER:
        live = "observer"
    if role not in ROLE_ORDER:
        role = "observer"
    # Explicit Observer plan elevation (same as grants_role=navigator on that plan)
    if has_active_plan_slug(cur, identity_id, OBSERVER_TRIAL_SLUG):
        if ROLE_ORDER.index(live) < ROLE_ORDER.index("navigator"):
            live = "navigator"
    return live if ROLE_ORDER.index(live) >= ROLE_ORDER.index(role) else role


def role_meets(cur, identity_id: int, session_role: str, minimum: str) -> bool:
    """True if feature_role(session) is at least *minimum* on the role ladder."""
    try:
        return role_at_least(feature_role(cur, identity_id, session_role), minimum)
    except Exception:
        # Unknown role comparison → deny (fail closed for gates)
        return False


def has_active_membership(cur, identity_id: int) -> bool:
    """Any unexpired active/grace membership (paid or alumni) — not free signup."""
    if not identity_id:
        return False
    placeholders = ",".join(["%s"] * len(ACTIVE_STATUSES))
    cur.execute(
        f"""SELECT 1 FROM memberships m
            WHERE m.identity_id = %s
              AND m.status IN ({placeholders})
              AND (m.current_period_end IS NULL OR m.current_period_end > NOW())
            LIMIT 1""",
        (identity_id, *ACTIVE_STATUSES),
    )
    return cur.fetchone() is not None


def can_access_member_content(
    cur, identity_id: int, session_role: str
) -> bool:
    """Courses / resources / gated lessons: alumni+ feature role OR any live membership.

    Covers paid Observer with a stale JWT still saying role=observer.
    """
    if role_meets(cur, identity_id, session_role, "alumni"):
        return True
    return has_active_membership(cur, identity_id)


# --- alumni rule (Membership Tiers spec §3) -----------------------------------

def grant_alumni(cur, identity_id: int) -> bool:
    """Grant 1-year course access. Returns False if the alumni plan is missing."""
    cur.execute("SELECT id FROM plans WHERE slug = %s", (ALUMNI_PLAN_SLUG,))
    row = cur.fetchone()
    if row is None:
        return False
    cur.execute(
        """INSERT INTO memberships
             (identity_id, plan_id, status, source, current_period_end)
           VALUES (%s, %s, 'active', 'system', DATE_ADD(NOW(), INTERVAL 1 YEAR))
           ON DUPLICATE KEY UPDATE
             status = 'active',
             current_period_end = GREATEST(
               COALESCE(current_period_end, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
               DATE_ADD(NOW(), INTERVAL 1 YEAR))""",
        (identity_id, row["id"]),
    )
    return True


def maybe_grant_alumni(cur, identity_id: int, membership_started_at) -> bool:
    """Tenure check on churn: >= 28 days on any paid tier earns the alumni year."""
    if membership_started_at is None:
        return False
    cur.execute(
        "SELECT DATEDIFF(NOW(), %s) AS days", (membership_started_at,)
    )
    days = cur.fetchone()["days"] or 0
    if days < ALUMNI_MIN_TENURE_DAYS:
        return False
    return grant_alumni(cur, identity_id)
