-- 010 — course card editor (Course Card Editor spec v1.0): banner color/image
-- and quick-info blurb override.

ALTER TABLE courses ADD COLUMN card_color VARCHAR(16) NULL;
ALTER TABLE courses ADD COLUMN card_image_url VARCHAR(1024) NULL;
ALTER TABLE courses ADD COLUMN card_blurb_md TEXT NULL;
