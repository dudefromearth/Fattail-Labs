"""Core identity & access operations — Labs-native, provider-agnostic.

Providers (WordPress SSO, WooCommerce webhooks) call into this module; nothing in
here knows any provider's vocabulary. Spec: FatTail-Labs-Identity-Access-Spec-v1.0.
"""

import hashlib
import hmac
import secrets

from auth import ROLE_ORDER

SCRYPT_N, SCRYPT_R, SCRYPT_P = 16384, 8, 1
ACTIVE_STATUSES = ("active", "grace")


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
    return cur.lastrowid


def resolve_by_link(cur, provider: str, external_id: str) -> int | None:
    cur.execute(
        "SELECT identity_id FROM identity_links WHERE provider = %s AND external_id = %s",
        (provider, str(external_id)),
    )
    row = cur.fetchone()
    return row["identity_id"] if row else None


def ensure_link(cur, identity_id: int, provider: str, external_id: str) -> None:
    cur.execute(
        "INSERT IGNORE INTO identity_links (identity_id, provider, external_id) "
        "VALUES (%s, %s, %s)",
        (identity_id, provider, str(external_id)),
    )


# --- memberships & roles ------------------------------------------------------

def plan_id_for_provider_key(cur, provider: str, external_key: str) -> int | None:
    cur.execute(
        "SELECT plan_id FROM provider_plan_map WHERE provider = %s AND external_key = %s",
        (provider, external_key),
    )
    row = cur.fetchone()
    return row["plan_id"] if row else None


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
    from that source; anything from this source not in the list expires."""
    granted_plan_ids = []
    for key in entitlement_keys:
        plan_id = plan_id_for_provider_key(cur, provider, key)
        if plan_id is not None:
            granted_plan_ids.append(plan_id)
            upsert_membership(cur, identity_id, plan_id, "active", provider)
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
    cur.execute(
        f"""SELECT p.grants_role FROM memberships m JOIN plans p ON m.plan_id = p.id
            WHERE m.identity_id = %s AND m.status IN ({placeholders})""",
        (identity_id, *ACTIVE_STATUSES),
    )
    roles = [r["grants_role"] for r in cur.fetchall() if r["grants_role"] in ROLE_ORDER]
    if not roles:
        return "observer"
    return max(roles, key=ROLE_ORDER.index)
