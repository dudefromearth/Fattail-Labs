-- 032 — Module slugs for public URLs: /course/{course}/{module}/{lesson}
-- Lesson uniqueness remains (module_id, slug); module uniqueness (course_id, slug).

ALTER TABLE modules
  ADD COLUMN slug VARCHAR(255) NULL AFTER title;

-- Backfill unique slugs per course from title
UPDATE modules m
JOIN (
  SELECT id,
         LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(title), '[^a-zA-Z0-9]+', '-'), '^-+|-+$', '')) AS base
  FROM modules
) t ON t.id = m.id
SET m.slug = CASE
  WHEN t.base IS NULL OR t.base = '' THEN CONCAT('module-', m.id)
  ELSE t.base
END
WHERE m.slug IS NULL;

-- Disambiguate collisions within a course (title-based dups)
-- Pass 1: suffix by id when duplicate (course_id, slug)
UPDATE modules m
JOIN (
  SELECT course_id, slug, MIN(id) AS keep_id
  FROM modules
  WHERE slug IS NOT NULL
  GROUP BY course_id, slug
  HAVING COUNT(*) > 1
) d ON d.course_id = m.course_id AND d.slug = m.slug AND m.id <> d.keep_id
SET m.slug = CONCAT(m.slug, '-', m.id);

ALTER TABLE modules
  MODIFY COLUMN slug VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY uq_module_course_slug (course_id, slug);
