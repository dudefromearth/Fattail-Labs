-- 078 — Strategy Lab: member-owned strategies (Family B isolation via identity_id)
-- Foundation F1: phase bins + phase_state machine. Plugins fill attributes_json later.

CREATE TABLE IF NOT EXISTS strategy_lab_strategies (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id       BIGINT UNSIGNED NOT NULL,
  public_id         VARCHAR(16) NOT NULL,
  product_key       VARCHAR(16) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  description       VARCHAR(512) NOT NULL DEFAULT '',
  version           VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  version_major     INT UNSIGNED NOT NULL DEFAULT 1,
  version_minor     INT UNSIGNED NOT NULL DEFAULT 0,
  version_patch     INT UNSIGNED NOT NULL DEFAULT 0,
  phase             VARCHAR(32) NOT NULL DEFAULT 'development',
  phase_state       VARCHAR(64) NOT NULL DEFAULT 'hypothesis',
  disposition       VARCHAR(16) NOT NULL DEFAULT 'active',
  attributes_json   JSON NULL,
  spec_json         JSON NULL,
  lifecycle_log     JSON NULL,
  bin_reason        VARCHAR(512) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sls_owner_public (identity_id, public_id),
  KEY ix_sls_owner_phase (identity_id, phase),
  KEY ix_sls_owner_updated (identity_id, updated_at),
  KEY ix_sls_product_key (identity_id, product_key),
  CONSTRAINT fk_sls_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalog: Strategy Lab is a live member app
UPDATE apps
SET
  status = 'live',
  blurb = 'Design → Curate → Deploy. Versionable strategies on your account. Process over profit claims.',
  title = 'Strategy Lab'
WHERE slug = 'strategy-lab'
;
