-- 071 — site_pages.daily_rules_md (Toughness hub checklist, admin-editable)
-- Markdown list of daily rules. Avoid bare ';' inside string literals.

ALTER TABLE site_pages
  ADD COLUMN daily_rules_md MEDIUMTEXT NULL
    COMMENT 'Member daily rules checklist (markdown), e.g. Toughness hub'
  AFTER description_md;

UPDATE site_pages
SET daily_rules_md = '- Movement / workout
- Reading (10 pages non-fiction)
- Diet integrity
- Water (body-weight scaled)
- Progress record
- No alcohol

Miss or fail any required activity → restart from day one.'
WHERE slug = 'toughness'
  AND (daily_rules_md IS NULL OR daily_rules_md = '');
