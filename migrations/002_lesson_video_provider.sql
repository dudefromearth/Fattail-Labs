-- 002 — lesson video provider + per-lesson player parameters
-- video_provider: 'youtube' (only provider for now; CDN revisit logged in decision log)
-- video_params: JSON object of provider player parameters (validated against an
--               allowlist in the API — never rendered raw)

ALTER TABLE lessons
  ADD COLUMN video_provider VARCHAR(16) NOT NULL DEFAULT 'youtube' AFTER kind,
  ADD COLUMN video_params JSON NULL AFTER video_id;

ALTER TABLE courses
  ADD COLUMN trailer_provider VARCHAR(16) NOT NULL DEFAULT 'youtube' AFTER trailer_video_id;
