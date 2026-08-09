-- 107 — Campaign Panel v1: display domain on bounds (total range for CMP strips)
-- docs/Campaign-Panel-v1-The-Six-Controls.md

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaign_bounds'
    AND COLUMN_NAME = 'display_low'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaign_bounds
     ADD COLUMN display_low DECIMAL(20, 8) NULL AFTER range_high,
     ADD COLUMN display_high DECIMAL(20, 8) NULL AFTER display_low',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
