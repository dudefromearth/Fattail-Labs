-- 092 — Community message mirror (Discord second window · C1c)
-- Spec §4.2 · dual SoR: Discord chat content; Labs mirror + labs-origin rows

CREATE TABLE IF NOT EXISTS community_messages (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id             VARCHAR(16) NOT NULL,
  channel_id            BIGINT UNSIGNED NOT NULL,
  identity_id           BIGINT UNSIGNED NULL,
  discord_message_id    VARCHAR(32) NULL,
  discord_author_id     VARCHAR(32) NULL,
  author_display_name   VARCHAR(255) NOT NULL DEFAULT '',
  author_avatar_url     VARCHAR(512) NULL,
  body_text             TEXT NOT NULL,
  body_md               TEXT NULL,
  status                VARCHAR(32) NOT NULL DEFAULT 'visible',
  parent_id             BIGINT UNSIGNED NULL,
  discord_parent_id     VARCHAR(32) NULL,
  source                VARCHAR(16) NOT NULL,
  attachment_json       JSON NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at             TIMESTAMP NULL DEFAULT NULL,
  synced_at             TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cm_public (public_id),
  UNIQUE KEY uq_cm_discord_msg (discord_message_id),
  KEY ix_cm_channel_created (channel_id, created_at),
  KEY ix_cm_channel_status (channel_id, status),
  KEY ix_cm_identity (identity_id),
  CONSTRAINT fk_cm_channel FOREIGN KEY (channel_id) REFERENCES community_channels (id),
  CONSTRAINT fk_cm_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
