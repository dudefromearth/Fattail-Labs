-- 129 — Campaign badge color (unique per identity; member-picked)
-- Identity chrome, not conduct/variance. Trade Log hosts the chip only.

SET @db := DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'member_practice_campaigns'
    AND COLUMN_NAME = 'badge_color'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE member_practice_campaigns ADD COLUMN badge_color CHAR(7) NULL AFTER title',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Distinct starter palette via row number per identity (24 hues). Extra
-- campaigns get a hex derived from id so backfill does not collide inside
-- one identity for typical books.
UPDATE member_practice_campaigns c
JOIN (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY identity_id ORDER BY id) AS rn
  FROM member_practice_campaigns
  WHERE badge_color IS NULL OR badge_color = ''
) x ON x.id = c.id
SET c.badge_color = CASE
  WHEN x.rn = 1 THEN '#1D4ED8'
  WHEN x.rn = 2 THEN '#0F766E'
  WHEN x.rn = 3 THEN '#B45309'
  WHEN x.rn = 4 THEN '#BE123C'
  WHEN x.rn = 5 THEN '#7C3AED'
  WHEN x.rn = 6 THEN '#0369A1'
  WHEN x.rn = 7 THEN '#15803D'
  WHEN x.rn = 8 THEN '#C2410C'
  WHEN x.rn = 9 THEN '#A21CAF'
  WHEN x.rn = 10 THEN '#0E7490'
  WHEN x.rn = 11 THEN '#4338CA'
  WHEN x.rn = 12 THEN '#B91C1C'
  WHEN x.rn = 13 THEN '#047857'
  WHEN x.rn = 14 THEN '#CA8A04'
  WHEN x.rn = 15 THEN '#6D28D9'
  WHEN x.rn = 16 THEN '#1E3A5F'
  WHEN x.rn = 17 THEN '#9A3412'
  WHEN x.rn = 18 THEN '#115E59'
  WHEN x.rn = 19 THEN '#9D174D'
  WHEN x.rn = 20 THEN '#3F6212'
  WHEN x.rn = 21 THEN '#1D4E89'
  WHEN x.rn = 22 THEN '#854D0E'
  WHEN x.rn = 23 THEN '#4C1D95'
  WHEN x.rn = 24 THEN '#134E4A'
  ELSE CONCAT('#', LPAD(UPPER(HEX((c.id * 2654435761) % 16777216)), 6, '0'))
END;
