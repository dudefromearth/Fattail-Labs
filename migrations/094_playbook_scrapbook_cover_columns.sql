-- 094 cover columns — Playbook scrapbook book-level cover fields (Spec v1.1a · DL-255)
--
-- Root cause fix: 093 creates member_playbook_entries without subtitle / cover_attachment_id.
-- 094_playbook_scrapbook.sql only creates child tables and comments that those columns
-- "may already exist" — it never ADD COLUMNs. 095 then fails adding FK on cover_attachment_id
-- on any clean host (prod/staging). Dev only worked after a partial/manual ALTER.
--
-- Filename sorts after 094_playbook_scrapbook.sql and before 095_* so pending migrate on
-- a DB stuck at 094 applies: columns → then 095 FK + indexes.
--
-- Idempotent: safe when columns already exist (dev / partial runs). migrate.py splits on
-- ';' and runs each statement on the same connection (user vars persist).

-- subtitle (code: strip to 500 chars; empty stored as NULL)
SET @__mpe_sub := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'member_playbook_entries'
    AND COLUMN_NAME = 'subtitle'
);
SET @__mpe_sql := IF(
  @__mpe_sub = 0,
  'ALTER TABLE member_playbook_entries ADD COLUMN subtitle VARCHAR(500) NULL AFTER title',
  'SELECT 1'
);
PREPARE __mpe_stmt FROM @__mpe_sql;
EXECUTE __mpe_stmt;
DEALLOCATE PREPARE __mpe_stmt;

-- cover_attachment_id (nullable FK target; 095 adds CONSTRAINT fk_mpe_cover_attachment)
SET @__mpe_cov := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'member_playbook_entries'
    AND COLUMN_NAME = 'cover_attachment_id'
);
SET @__mpe_sql := IF(
  @__mpe_cov = 0,
  'ALTER TABLE member_playbook_entries ADD COLUMN cover_attachment_id BIGINT UNSIGNED NULL AFTER structured_json',
  'SELECT 1'
);
PREPARE __mpe_stmt FROM @__mpe_sql;
EXECUTE __mpe_stmt;
DEALLOCATE PREPARE __mpe_stmt;
