-- 160_billing_discounts.sql
-- Native Billing v2.0 §16 — Labs can CREATE discounts, not merely honour imported ones.
--
-- THE PRINCIPLE: a discount sets a price ONCE, at checkout. It is never re-applied at
-- renewal. The resulting amount lands in billing_subscriptions.amount_minor with
-- amount_locked=1, so expiring or deleting a discount can never re-price anyone already
-- on it. That is the fragility this fixes -- see spec 11.3 for founders0126, the coupon
-- that explains why 38 members pay 67 dollars and which no longer exists.
--
-- Percentages are BASIS POINTS (4000 = 40 percent). Integer maths only, no float percents.
--
-- Requires 159_native_billing_v2.sql.

CREATE TABLE IF NOT EXISTS billing_discounts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code              VARCHAR(64) NOT NULL,            -- what the member types
  status            VARCHAR(16) NOT NULL DEFAULT 'active', -- active | disabled
  kind              VARCHAR(16) NOT NULL,
    -- fixed_off   take N minor units off the plan price
    -- percent_off take N percent off
    -- override    charge exactly this amount (use for comps and bespoke deals)
  value_minor       INT UNSIGNED NULL,               -- fixed_off / override
  percent_bp        SMALLINT UNSIGNED NULL,          -- percent_off, BASIS POINTS: 4000 = 40%
                                                     -- integer maths only, no float percents
  duration          VARCHAR(16) NOT NULL DEFAULT 'forever',
                                                     -- forever | periods | first_period
  duration_periods  SMALLINT UNSIGNED NULL,          -- required when duration='periods'
  plan_ids_json     JSON NULL,                       -- NULL = any plan
  max_redemptions   INT UNSIGNED NULL,               -- NULL = unlimited
  redemptions_used  INT UNSIGNED NOT NULL DEFAULT 0,
  max_per_identity  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  starts_at         DATETIME NULL,
  expires_at        DATETIME NULL,
  note              VARCHAR(255) NOT NULL DEFAULT '',-- why this exists, for whoever finds it
                                                     -- in two years (see founders0126)
  created_by        VARCHAR(255) NOT NULL DEFAULT '',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_disc_code (code),
  KEY ix_disc_status (status, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS billing_discount_redemptions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  discount_id     BIGINT UNSIGNED NOT NULL,
  identity_id     BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NULL,
  amount_before   INT UNSIGNED NOT NULL,             -- the plan price it was applied to
  amount_after    INT UNSIGNED NOT NULL,             -- what the member actually pays
  redeemed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_redeem_once (discount_id, identity_id),   -- enforces max_per_identity=1
  KEY ix_redeem_sub (subscription_id),
  CONSTRAINT fk_redeem_disc FOREIGN KEY (discount_id)
    REFERENCES billing_discounts (id) ON DELETE RESTRICT,
  CONSTRAINT fk_redeem_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Time-limited discounts (spec 16.4): the only case where a price changes
-- later, and never without the member having been notified 7 days ahead.
ALTER TABLE billing_subscriptions
  ADD COLUMN standard_amount_minor   INT UNSIGNED NULL,  -- what they pay after the discount
  ADD COLUMN discount_periods_left   SMALLINT UNSIGNED NULL,
  ADD COLUMN amount_change_notified_at DATETIME NULL;
