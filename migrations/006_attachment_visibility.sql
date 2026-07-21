-- 006 — resource visibility (Resource Library spec v1.1)
-- free_preview mirrors lessons: 1 = any signed-in account, 0 = alumni+ (members).

ALTER TABLE attachments ADD COLUMN free_preview TINYINT(1) NOT NULL DEFAULT 0;
