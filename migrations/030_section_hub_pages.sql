-- 030 — Section hubs: Labs, Resources, Live (site_pages CMS + SEO)
-- Reuses site_pages from 015. Avoid bare ';' inside string literals (migrate.py splits on ;).

INSERT INTO site_pages (
  slug, title, description_md, intro_video_id, intro_video_title,
  faq_title, faq_description_md
) VALUES (
  'labs',
  'Labs',
  'Member **practice tools** for capacity-building: Journey, Trade Log, and more on the way (Journal, Playbook, Statistics, Vexy).

Labs is where process lives between courses and live sessions — **adherence and structure first**, never profit theater. Tools ship incrementally. The pathway still starts with capital preservation in the course library.',
  NULL,
  NULL,
  'Labs FAQ',
  NULL
) ON DUPLICATE KEY UPDATE slug = slug;

INSERT INTO site_pages (
  slug, title, description_md, intro_video_id, intro_video_title,
  faq_title, faq_description_md
) VALUES (
  'resources',
  'Resources',
  'The **Trade Lab library**: worksheets, templates, process cards, and tools you can open from courses or browse here.

Resources are versioned materials — trade logs, checklists, and process graphics that evolve over time. Published items appear for members on this hub. Course pages always show the version pinned to that course.',
  NULL,
  NULL,
  'Resources FAQ',
  NULL
) ON DUPLICATE KEY UPDATE slug = slug;

INSERT INTO site_pages (
  slug, title, description_md, intro_video_id, intro_video_title,
  faq_title, faq_description_md
) VALUES (
  'live',
  'Live Sessions',
  'The FatTail Labs **live schedule**: the public 0DTE Live Show, member livestreams, coach calls, and the Sunday retrospective.

Trade and review alongside the team. Replays land back in the [course library](/courses) when published. Public sessions are listed for discovery — member sessions stay behind access rules.',
  NULL,
  NULL,
  'Live FAQ',
  NULL
) ON DUPLICATE KEY UPDATE slug = slug;
