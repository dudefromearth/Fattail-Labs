-- 072 — Toughness: separate daily rules for True 75 Hard and FatTail Hard
-- Avoid bare ';' inside string literals (migrate.py splits on ;).

ALTER TABLE site_pages
  ADD COLUMN daily_rules_true75_md MEDIUMTEXT NULL
    COMMENT 'True 75 Hard daily rules (markdown)'
  AFTER daily_rules_md;

ALTER TABLE site_pages
  ADD COLUMN daily_rules_fattail_md MEDIUMTEXT NULL
    COMMENT 'FatTail Hard daily rules (markdown)'
  AFTER daily_rules_true75_md;

-- Move legacy single list into FatTail column when present
UPDATE site_pages
SET daily_rules_fattail_md = daily_rules_md
WHERE slug = 'toughness'
  AND daily_rules_md IS NOT NULL
  AND daily_rules_md != ''
  AND (daily_rules_fattail_md IS NULL OR daily_rules_fattail_md = '');

UPDATE site_pages
SET daily_rules_true75_md = '- Workout 1 (45 min)
- Workout 2 (45 min)
- Diet (no cheat meals)
- Water goal
- 10 pages non-fiction
- Progress photo/record
- No alcohol

Miss or fail any required activity → restart from day one.'
WHERE slug = 'toughness'
  AND (daily_rules_true75_md IS NULL OR daily_rules_true75_md = '');

UPDATE site_pages
SET daily_rules_fattail_md = '- Movement / workout
- Reading (10 pages non-fiction)
- Diet integrity
- Water (body-weight scaled)
- Progress record
- No alcohol

Miss or fail any required activity → restart from day one.'
WHERE slug = 'toughness'
  AND (daily_rules_fattail_md IS NULL OR daily_rules_fattail_md = '');
