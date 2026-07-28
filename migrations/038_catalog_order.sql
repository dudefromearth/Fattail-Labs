-- 038 — Catalog manual order + display sections (Catalog-Order Spec v1.0).
-- sort_order: editorial position (asc). catalog_section: display heading ('' = none).
-- Seed preserves the current default catalog order (published_at DESC) with x10 spacing.

ALTER TABLE courses
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN catalog_section VARCHAR(255) NOT NULL DEFAULT '';

UPDATE courses c
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC, id) AS rn
  FROM courses
) t ON t.id = c.id
SET c.sort_order = t.rn * 10;

ALTER TABLE courses ADD KEY ix_courses_sort (sort_order);
