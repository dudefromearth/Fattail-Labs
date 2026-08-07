-- 089 — Member design copies (rebuilds of house strategies).
-- House strategies themselves are code-catalog only (admin-versioned).
-- Members may save personal copies; they cannot edit/delete house rows.

CREATE TABLE IF NOT EXISTS strategy_lab_member_designs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id       VARCHAR(16) NOT NULL,
  identity_id     BIGINT UNSIGNED NOT NULL,
  pack_id         VARCHAR(64) NOT NULL DEFAULT 'butterfly',
  name            VARCHAR(255) NOT NULL,
  description     VARCHAR(512) NOT NULL DEFAULT '',
  -- Provenance when forked from a house design
  house_key       VARCHAR(64) NULL,
  house_version   VARCHAR(32) NULL,
  config_json     JSON NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slmd_owner_public (identity_id, public_id),
  KEY ix_slmd_owner (identity_id),
  KEY ix_slmd_house (house_key, house_version),
  CONSTRAINT fk_slmd_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
