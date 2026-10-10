-- Links Phase 3a (LK Attribution — see Specs/Links-Attribution-Affiliates-Spec-v0_1.md).
-- Scoped to existing-member checkout via the native Stripe billing path
-- (server/routes/billing.py) only. No WooCommerce, no PayPal, no
-- new-customer-acquisition checkout yet — those are deferred.

-- One row per marker minted at the redirect (first-touch: only minted
-- when the visitor did not already carry one). Written whether or not
-- it ever redeems into an order.
CREATE TABLE IF NOT EXISTS link_markers (
  marker       CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  slug         CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  issued_at    DATETIME(6) NOT NULL,
  PRIMARY KEY (marker),
  KEY ix_link_markers_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per redeemed marker: an existing member's Stripe checkout
-- completed carrying a marker that link_markers recognizes. No
-- commission, no payout, no ledger here (D8) — this is the attribution
-- signal only.
CREATE TABLE IF NOT EXISTS link_attributions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  marker        CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  slug          CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  identity_id   BIGINT UNSIGNED NOT NULL,
  provider      VARCHAR(16) NOT NULL,
  external_ref  VARCHAR(255) NOT NULL,
  amount_cents  BIGINT NULL,
  currency      VARCHAR(8) NULL,
  occurred_at   DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_link_attributions_provider_ref (provider, external_ref),
  KEY ix_link_attributions_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
