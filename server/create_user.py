"""Operator CLI — create/update a native user.

Usage:
  python create_user.py user@example.com --name "Full Name" [--admin] [--plan slug]
Password is read from stdin (prompt) or LABS_NEW_USER_PASSWORD env (for scripting).
"""

import argparse
import getpass
import os

import db
import identity


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("email")
    ap.add_argument("--name", default="")
    ap.add_argument("--admin", action="store_true", help="set role_override=administrator")
    ap.add_argument("--plan", help="grant a native membership on this plan slug")
    args = ap.parse_args()

    password = os.environ.get("LABS_NEW_USER_PASSWORD") or getpass.getpass("Password: ")
    password_hash = identity.hash_password(password)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            identity_id = identity.get_or_create_identity(cur, args.email, args.name)
            cur.execute(
                """INSERT INTO credentials (identity_id, password_hash) VALUES (%s, %s)
                   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)""",
                (identity_id, password_hash),
            )
            if args.admin:
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' WHERE identity_id = %s",
                    (identity_id,),
                )
            if args.plan:
                cur.execute("SELECT id FROM plans WHERE slug = %s", (args.plan,))
                row = cur.fetchone()
                if row is None:
                    raise SystemExit(f"Unknown plan slug: {args.plan}")
                identity.upsert_membership(cur, identity_id, row["id"], "active", "native")
            role = identity.derive_role(cur, identity_id)
    print(f"identity_id={identity_id} email={args.email} role={role}")


if __name__ == "__main__":
    main()
