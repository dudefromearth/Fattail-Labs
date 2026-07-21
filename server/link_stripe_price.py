"""Operator CLI — map a Stripe Price to a Labs plan (Native Billing spec §2).

Usage: python link_stripe_price.py price_XXXX labs-membership
"""

import argparse

import db


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("price_id")
    ap.add_argument("plan_slug")
    args = ap.parse_args()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM plans WHERE slug = %s", (args.plan_slug,))
            row = cur.fetchone()
            if row is None:
                raise SystemExit(f"Unknown plan slug: {args.plan_slug}")
            cur.execute(
                """INSERT INTO provider_plan_map (provider, external_key, plan_id)
                   VALUES ('stripe', %s, %s)
                   ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id)""",
                (args.price_id, row["id"]),
            )
    print(f"mapped stripe:{args.price_id} -> {args.plan_slug}")


if __name__ == "__main__":
    main()
