-- 012 — editable resource library items (Resource Library spec v1.2):
-- per-resource description and a representative emoji.

ALTER TABLE attachments ADD COLUMN description_md TEXT NULL;
ALTER TABLE attachments ADD COLUMN emoji VARCHAR(16) NULL;
