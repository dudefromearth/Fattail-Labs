-- 091 — Discord identity profile for Community second window (C1b ingest)
-- Discord snowflake + display name from fattail.ai WP connector via SSO claims.
-- Never stores Discord OAuth access/refresh tokens (DL-240 · Mike C0-3).

CREATE TABLE IF NOT EXISTS identity_discord_profiles (
  identity_id       BIGINT UNSIGNED NOT NULL,
  discord_user_id   VARCHAR(32) NOT NULL,
  username          VARCHAR(255) NOT NULL DEFAULT '',
  avatar_hash       VARCHAR(128) NULL,
  source            VARCHAR(32) NOT NULL DEFAULT 'sso',
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id),
  UNIQUE KEY uq_idp_discord_user (discord_user_id),
  CONSTRAINT fk_idp_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
