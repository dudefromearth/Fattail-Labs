-- 067 — Feature gate landing video URL (home countdown / waitlist surface)
-- Admin-editable YouTube (or other https embed) link for the public gate page.

ALTER TABLE feature_gates
  ADD COLUMN video_url VARCHAR(1024) NULL
    COMMENT 'Optional intro video: YouTube URL/id or https embed URL'
  AFTER body_md;
