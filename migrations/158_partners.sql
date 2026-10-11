-- Links Phase 4b (LK Growth & Acquisition — see
-- Specs/Links-Growth-Acquisition-Spec-v0_1.md, ruled by v0_2.md §2).
-- Deliberately separate from affiliates/credit_tier_rules (PM-L1):
-- cash or comp'd membership, never store credit. AF-L10's "never cash"
-- rule applies to the member-referral store-credit path only; it does
-- not and should not govern partner terms, which is exactly why this
-- is its own table under its own PM-L law prefix.

-- Never self-serve (mirrors AF-L4/AF-L12) — every row starts pending;
-- only an admin action approves it. identity_id is NULL until
-- approved, at which point it points at a provisioned identities row
-- that has no corresponding memberships row unless/until a
-- comp_membership grant is made (PM-L4).
CREATE TABLE IF NOT EXISTS partners (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  company        VARCHAR(255) NULL,
  terms_type     VARCHAR(16) NOT NULL,              -- 'cash' | 'comp_membership'
  terms_cents    BIGINT UNSIGNED NULL,               -- flat fee per signup (Q9) — cash only
  terms_plan_id  BIGINT UNSIGNED NULL,               -- plan to grant (PM-L4) — comp_membership only
  status         VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending/approved/revoked
  identity_id    BIGINT UNSIGNED NULL,
  approved_at    DATETIME(6) NULL,
  approved_by    VARCHAR(255) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_partners_email (email),
  KEY ix_partners_identity (identity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
