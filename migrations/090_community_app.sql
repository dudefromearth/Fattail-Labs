-- 090 — Community app (C1a): channels map, bot shares, Apps hub card
-- Spec: Specs/FatTail-Labs-Community-App-Spec-v1.0.md v1.0.2 · DL-237–240
-- Messages table deferred to C1c (Discord mirror).

CREATE TABLE IF NOT EXISTS community_channels (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id           VARCHAR(16) NOT NULL,
  slug                VARCHAR(64) NOT NULL,
  title               VARCHAR(255) NOT NULL,
  description         VARCHAR(1024) NOT NULL DEFAULT '',
  kind                VARCHAR(32) NOT NULL,
  app_key             VARCHAR(64) NULL,
  discord_guild_id    VARCHAR(64) NULL,
  discord_channel_id  VARCHAR(64) NULL,
  sort_order          INT NOT NULL DEFAULT 0,
  archived_at         TIMESTAMP NULL DEFAULT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_community_channel_slug (slug),
  UNIQUE KEY uq_community_channel_public (public_id),
  KEY ix_community_channel_app (app_key),
  KEY ix_community_channel_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_bot_shares (
  id                         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id                  VARCHAR(16) NOT NULL,
  identity_id                BIGINT UNSIGNED NOT NULL,
  visibility                 VARCHAR(32) NOT NULL DEFAULT 'community',
  strategy_public_id         VARCHAR(16) NULL,
  bot_name                   VARCHAR(255) NOT NULL DEFAULT '',
  bot_version                VARCHAR(64) NOT NULL DEFAULT '',
  pack_id                    VARCHAR(64) NOT NULL DEFAULT '',
  pack_config_snapshot_json  JSON NULL,
  house_design_key           VARCHAR(128) NULL,
  house_design_version       VARCHAR(32) NULL,
  phase_at_share             VARCHAR(64) NOT NULL DEFAULT '',
  summary_md                 TEXT NULL,
  status                     VARCHAR(32) NOT NULL DEFAULT 'published',
  published_at               TIMESTAMP NULL DEFAULT NULL,
  created_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cbs_public (public_id),
  KEY ix_cbs_identity (identity_id),
  KEY ix_cbs_status_vis (status, visibility),
  CONSTRAINT fk_cbs_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Apps hub card
INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT
  'community',
  'Community',
  'Process peers and FatTail bots — same conversation as Discord, plus shared designs. No P&L theater.',
  'live',
  30
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'community')
;

-- Seed channels (Spec §5.2) — no journey / wiki
INSERT INTO community_channels
  (public_id, slug, title, description, kind, app_key, sort_order)
SELECT 'cchgen0001', 'general', 'General', 'Open general discussion', 'topic', NULL, 10
WHERE NOT EXISTS (SELECT 1 FROM community_channels WHERE slug = 'general');

INSERT INTO community_channels
  (public_id, slug, title, description, kind, app_key, sort_order)
SELECT 'cchprac001', 'practice', 'Practice', 'Practice process discussion', 'app_home', 'practice', 20
WHERE NOT EXISTS (SELECT 1 FROM community_channels WHERE slug = 'practice');

INSERT INTO community_channels
  (public_id, slug, title, description, kind, app_key, sort_order)
SELECT 'cchslab001', 'strategy-lab', 'Strategy Lab', 'Design / Curate / Deploy process', 'app_home', 'strategy-lab', 30
WHERE NOT EXISTS (SELECT 1 FROM community_channels WHERE slug = 'strategy-lab');

INSERT INTO community_channels
  (public_id, slug, title, description, kind, app_key, sort_order)
SELECT 'cchtough01', 'toughness', 'Toughness', 'Mental toughness process', 'app_home', 'toughness', 40
WHERE NOT EXISTS (SELECT 1 FROM community_channels WHERE slug = 'toughness');
