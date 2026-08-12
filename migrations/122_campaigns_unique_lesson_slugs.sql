-- 122_campaigns_unique_lesson_slugs.sql
-- Fix: the Progress system identifies a lesson by (course_slug, lesson_slug) and keys
-- GET /api/me/progress by lesson_slug, so lesson slugs must be UNIQUE WITHIN A COURSE.
-- The 'campaigns' course had 4 lessons slugged 'campaign-overview' (one per campaign
-- module) and 2 slugged '1-000-run-monte-carlo-report', so completion 422'd
-- ("module_slug required when lesson slug is not unique in course") and the ✓ ticks
-- would collide. Rename the duplicates to unique, module-themed slugs — matching this
-- course's own convention (it already uses gamma-door-overview, 0dte-tactical-overview).
--
-- Idempotent: each UPDATE only matches while the old duplicate slug is still present.
-- lesson_progress is keyed by lesson_id, so existing member completion is preserved.

UPDATE lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id
  SET l.slug = 'convex-stack-campaign-overview'
  WHERE c.slug = 'campaigns' AND m.slug = 'convex-stack-3-5-dte' AND l.slug = 'campaign-overview';

UPDATE lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id
  SET l.slug = 'sigma-drift-campaign-overview'
  WHERE c.slug = 'campaigns' AND m.slug = 'sigma-drift-5-10-dte' AND l.slug = 'campaign-overview';

UPDATE lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id
  SET l.slug = 'vsv-campaign-overview'
  WHERE c.slug = 'campaigns' AND m.slug = 'volatility-seed-vault-10-30-dte' AND l.slug = 'campaign-overview';

UPDATE lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id
  SET l.slug = 'mec-campaign-overview'
  WHERE c.slug = 'campaigns' AND m.slug = 'macro-echo-chamber-30-90-dte' AND l.slug = 'campaign-overview';

UPDATE lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id
  SET l.slug = 'vsv-1-000-run-monte-carlo-report'
  WHERE c.slug = 'campaigns' AND m.slug = 'volatility-seed-vault-10-30-dte' AND l.slug = '1-000-run-monte-carlo-report';

UPDATE lessons l JOIN modules m ON l.module_id = m.id JOIN courses c ON m.course_id = c.id
  SET l.slug = 'mec-1-000-run-monte-carlo-report'
  WHERE c.slug = 'campaigns' AND m.slug = 'macro-echo-chamber-30-90-dte' AND l.slug = '1-000-run-monte-carlo-report';
