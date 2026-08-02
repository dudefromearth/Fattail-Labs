-- 066 — Navigator pricing display: $267/mo · $2,997/yr (Coach product).
-- Avoid semicolon inside string literals (naive SQL splitter).

UPDATE plans
SET display_json = '{"prices":[{"label":"$267 / month","interval":"month"},{"label":"$2,997 / year","interval":"year","badge":"Save $207/year"}],"tagline":"The complete FatTail operating system","featured":true,"features":["Live trading room + coaching","Weekly workshops & livestreams","All courses & certifications","Full resource library","Private Discord","FatTail App access"]}'
WHERE slug = 'navigator'
;
