-- 117 — Campaign Same-bet (Tier 2 optional; dormant until set)
-- Spec: Campaign Phase & Charter Tiering v1.0.1 · P6 · P7

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'same_bet_json'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN same_bet_json JSON NULL AFTER retrospective_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
