-- 101 — Campaign lifecycle: signature, amendments, renewal predecessor
-- Spec: Member Campaign Concept Spec §4.5
-- Family B. Append-only amendments. Cycle number derived (never stored).
-- Idempotent ADD COLUMN guards (098 style — single-line SQL for migrate.py).

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'signed_at'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN signed_at DATETIME(6) NULL AFTER is_default',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'signed_terms'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN signed_terms JSON NULL AFTER signed_at',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'signed_terms_backfilled'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN signed_terms_backfilled TINYINT(1) NOT NULL DEFAULT 0 AFTER signed_terms',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'predecessor_campaign_id'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN predecessor_campaign_id BIGINT UNSIGNED NULL AFTER signed_terms_backfilled',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND INDEX_NAME = 'ix_mpc_predecessor'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD KEY ix_mpc_predecessor (identity_id, predecessor_campaign_id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND CONSTRAINT_NAME = 'fk_mpc_predecessor'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD CONSTRAINT fk_mpc_predecessor FOREIGN KEY (predecessor_campaign_id) REFERENCES member_practice_campaigns (id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE member_practice_campaigns
   SET
     signed_at = COALESCE(activated_at, created_at),
     signed_terms = JSON_OBJECT(
       'title', IFNULL(title, ''),
       'goals_md', IFNULL(goals_md, ''),
       'starting_capital', starting_capital,
       'account_id', account_id,
       'starts_at', DATE_FORMAT(starts_at, '%Y-%m-%d %H:%i:%s'),
       'ends_at', DATE_FORMAT(ends_at, '%Y-%m-%d %H:%i:%s')
     ),
     signed_terms_backfilled = 1
 WHERE signed_at IS NULL
   AND status IN ('active', 'completed', 'abandoned');

CREATE TABLE IF NOT EXISTS member_practice_campaign_amendments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id     BIGINT UNSIGNED NOT NULL,
  campaign_id     BIGINT UNSIGNED NOT NULL,
  amended_at      DATETIME(6) NOT NULL,
  field           VARCHAR(64) NOT NULL,
  old_value       MEDIUMTEXT NULL,
  new_value       MEDIUMTEXT NULL,
  note_md         TEXT NULL,
  export_key      VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mpca_export (export_key),
  KEY ix_mpca_campaign (identity_id, campaign_id, amended_at),
  CONSTRAINT fk_mpca_identity
    FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_mpca_campaign
    FOREIGN KEY (campaign_id) REFERENCES member_practice_campaigns (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
