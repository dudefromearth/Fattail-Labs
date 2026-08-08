-- 106 — Campaign bounds Two Roles (Structured Practice Spec v1.1 / v1.2)
-- Spec: FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.2.md §5.2
-- Bench: B1-0 — role ENUM boundary|goal; legacy rows default boundary

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaign_bounds'
    AND COLUMN_NAME = 'role'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaign_bounds
     ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT ''boundary''
     AFTER campaign_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Safety: any null/blank → boundary
UPDATE member_practice_campaign_bounds
   SET role = 'boundary'
 WHERE role IS NULL OR role = '' OR role NOT IN ('boundary', 'goal');
