-- 068 — Toughness hub CMS (site_pages) for in-place admin edit
-- Same pattern as labs / resources / live section hubs.

INSERT INTO site_pages (
  slug, title, description_md, intro_video_id, intro_video_title,
  faq_title, faq_description_md
) VALUES (
  'toughness',
  'Toughness',
  'Voluntary capacity training for persistence under load — part of Process Integrity''s Mental Toughness story. Never a membership requirement. Never P and L theater.',
  NULL,
  'How Toughness programs work',
  'Toughness FAQ',
  NULL
) ON DUPLICATE KEY UPDATE slug = slug;
