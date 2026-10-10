-- Links Phase 3b (LK Attribution/Affiliates v0.2 — see
-- Specs/Links-Attribution-Affiliates-Spec-v0_2.md). Store-credit model,
-- no cash, no commission ledger (AF-L14).

-- Non-member referrer intake (AF-L4, AF-L12). Never self-serve — every
-- row starts pending; only an admin action approves it. identity_id is
-- NULL until approved, at which point it points at an identities row
-- that may or may not have any memberships row (an identity without a
-- membership is already a supported shape in this schema).
CREATE TABLE IF NOT EXISTS affiliates (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  status        VARCHAR(16) NOT NULL DEFAULT 'pending',
  identity_id   BIGINT UNSIGNED NULL,
  approved_at   DATETIME(6) NULL,
  approved_by   VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_affiliates_email (email),
  KEY ix_affiliates_identity (identity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Which Stripe PRICE earns referral credit, and how much (AF-L9).
-- Keyed by price, not plan/role: the real role ladder is
-- Observer/Navigator only (no "Annual"/"Lifetime" role) — Annual vs
-- Lifetime is a billing-term distinction that can only exist at the
-- price level (two different Stripe prices both granting the
-- Navigator role). Admin data, not hardcoded law. Starts empty: awards
-- nothing until Coach maps real Stripe price_ids here — none exist
-- yet (provider_plan_map has zero provider='stripe' rows today).
CREATE TABLE IF NOT EXISTS credit_tier_rules (
  price_id      VARCHAR(255) NOT NULL,
  credits       INT UNSIGNED NOT NULL,
  label         VARCHAR(64) NOT NULL,
  PRIMARY KEY (price_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per credit-earning or credit-spending event (AF-L9, AF-L10).
-- Balance is always derived by summing delta — no second balance field
-- to drift out of sync (same "derive on read" philosophy as
-- journey_scores.py). self_referral is flagged, never silently
-- blocked (Q6 — still open; flag-not-block until Coach rules).
--
-- Idempotency is (identity_id, reason, external_ref), not a link to
-- link_attributions.id: checkout.session.completed (attribution) and
-- customer.subscription.created (credit award — needs the price_id,
-- only reliably available on the subscription event) are two separate
-- webhook deliveries Stripe does not guarantee an order for. Keying
-- off the Stripe object id each event actually carries avoids an
-- ordering dependency between them. attribution_id is kept as an
-- informational, nullable join, not the uniqueness guard.
CREATE TABLE IF NOT EXISTS credit_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id    BIGINT UNSIGNED NOT NULL,
  delta          INT NOT NULL,
  reason         VARCHAR(32) NOT NULL,
  attribution_id BIGINT UNSIGNED NULL,
  external_ref   VARCHAR(255) NOT NULL,
  self_referral  TINYINT(1) NOT NULL DEFAULT 0,
  occurred_at    DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_credit_events_idempotency (identity_id, reason, external_ref),
  KEY ix_credit_events_identity (identity_id),
  KEY ix_credit_events_attribution (attribution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
