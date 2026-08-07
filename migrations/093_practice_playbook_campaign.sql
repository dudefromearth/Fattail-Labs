-- 093 — Trader Development Phase 1: Playbook + Practice Campaign (Family B)
-- Spec: FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1_1.md · DL-254

CREATE TABLE IF NOT EXISTS member_playbook_entries (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body_md         MEDIUMTEXT NOT NULL,
  structured_json JSON NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'active',
  export_key      VARCHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpe_export (identity_id, export_key),
  KEY ix_mpe_owner_status (identity_id, status),
  CONSTRAINT fk_mpe_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT chk_mpe_status CHECK (status IN ('active', 'archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_practice_campaigns (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  title           VARCHAR(255) NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'planned',
  starts_at       DATETIME NULL,
  ends_at         DATETIME NULL,
  export_key      VARCHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpc_export (identity_id, export_key),
  KEY ix_mpc_owner_status (identity_id, status),
  CONSTRAINT fk_mpc_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT chk_mpc_status CHECK (status IN ('planned', 'active', 'completed', 'abandoned'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS member_practice_campaign_playbooks (
  campaign_id        BIGINT UNSIGNED NOT NULL,
  playbook_entry_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (campaign_id, playbook_entry_id),
  KEY ix_mpcp_playbook (playbook_entry_id),
  CONSTRAINT fk_mpcp_campaign
    FOREIGN KEY (campaign_id) REFERENCES member_practice_campaigns (id) ON DELETE CASCADE,
  CONSTRAINT fk_mpcp_playbook
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE member_trade_log_trades
  ADD COLUMN playbook_entry_id BIGINT UNSIGNED NULL AFTER entry_source,
  ADD COLUMN practice_campaign_id BIGINT UNSIGNED NULL AFTER playbook_entry_id,
  ADD KEY ix_mtlt_playbook (identity_id, playbook_entry_id),
  ADD KEY ix_mtlt_campaign (identity_id, practice_campaign_id);

ALTER TABLE member_trade_log_trades
  ADD CONSTRAINT fk_mtlt_playbook
    FOREIGN KEY (playbook_entry_id) REFERENCES member_playbook_entries (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_mtlt_campaign
    FOREIGN KEY (practice_campaign_id) REFERENCES member_practice_campaigns (id) ON DELETE SET NULL;

ALTER TABLE member_journal_sessions
  ADD COLUMN practice_campaign_id BIGINT UNSIGNED NULL AFTER export_key,
  ADD KEY ix_mjs_campaign (identity_id, practice_campaign_id);

ALTER TABLE member_journal_sessions
  ADD CONSTRAINT fk_mjs_campaign
    FOREIGN KEY (practice_campaign_id) REFERENCES member_practice_campaigns (id) ON DELETE SET NULL;
