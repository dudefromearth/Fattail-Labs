-- 146 — Apps grid: Wiki card title → IKI Lab. Blurb and status unchanged.
-- Coach 2026-08-25: rename only; copy replacement is Coach's.

UPDATE apps
   SET title = 'IKI Lab'
 WHERE slug = 'wiki'
   AND title = 'Wiki';
