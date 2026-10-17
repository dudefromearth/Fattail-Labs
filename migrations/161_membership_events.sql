-- 161_membership_events.sql
-- Native Billing v2.0 spec 18.6 — the membership audit trail.
--
-- WHY. Today the answer to "why does this person have this tag / this role /
-- this access?" lives in WooCommerce ORDER NOTES. Those do not migrate, and
-- they are the only record of several decisions. Three separate systems on this
-- estate have already drifted silently for months because nothing recorded what
-- they did: the Castaway Discord role, the vendor plugin's role grants, and ten
-- missed orders in Feb-Mar that were never remediated.
--
-- Every actor that changes membership state writes here: the billing worker,
-- webhooks, an admin action, and the reconciler. The reconciler in particular
-- should record what it CHANGED, so a drift report is readable after the fact
-- rather than only at the moment it runs.
--
-- Append-only by convention. Nothing in the application deletes from it.

CREATE TABLE IF NOT EXISTS membership_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id BIGINT UNSIGNED NOT NULL,
  event       VARCHAR(48) NOT NULL,
    -- granted | revoked | tier_changed | tag_added | tag_removed
    -- | role_granted | role_revoked | charge_succeeded | charge_failed
    -- | subscription_created | subscription_cancelled | drift_corrected
  detail      VARCHAR(255) NOT NULL DEFAULT '',
  actor       VARCHAR(64) NOT NULL DEFAULT '',
    -- worker | webhook | admin:<email> | reconciler | checkout | import
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_me_identity (identity_id, created_at),
  KEY ix_me_event (event, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
