-- 097 — Practice Campaign: activated_at for deterministic prefill
-- Additive / nullable. Existing active rows backfilled from updated_at.
-- Does NOT touch trades or journal sessions.
-- Member Campaign Concept Spec §4.7 · DL-263

SET @db := DATABASE();
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'activated_at'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN activated_at DATETIME NULL AFTER status',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND INDEX_NAME = 'ix_mpc_activated'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD KEY ix_mpc_activated (identity_id, status, activated_at)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill only actives still missing a clock (idempotent)
UPDATE member_practice_campaigns
   SET activated_at = COALESCE(updated_at, created_at)
   WHERE status = 'active' AND activated_at IS NULL;
