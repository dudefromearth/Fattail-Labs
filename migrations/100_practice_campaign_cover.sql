-- 100 — Practice Campaign cover image (library card / banner, like Playbook)
-- File bytes on disk; pointer columns on campaign row. Family B via identity_id.

SET @db := DATABASE();

SET @__has := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'cover_storage_key'
);
SET @__sql := IF(
  @__has = 0,
  'ALTER TABLE member_practice_campaigns
     ADD COLUMN cover_storage_key VARCHAR(512) NULL
       COMMENT ''Relative media key for campaign cover image''
       AFTER is_default,
     ADD COLUMN cover_content_type VARCHAR(128) NULL AFTER cover_storage_key,
     ADD COLUMN cover_byte_size INT UNSIGNED NULL AFTER cover_content_type',
  'SELECT 1'
);
PREPARE __stmt FROM @__sql;
EXECUTE __stmt;
DEALLOCATE PREPARE __stmt;
