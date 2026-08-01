-- 061 — Strategy Lab short blurb: expanded scope (Build, Test, Run bots, live and paper).
-- Avoid semicolon and double-hyphen inside string literals (naive SQL splitter).

UPDATE apps
SET title = 'Strategy Lab',
    blurb = 'Build, Test, Run bots, live and paper on Tradier. Validate edges before capital. Most ideas die. Survivors get a campaign.'
WHERE slug = 'strategy-lab'
;
