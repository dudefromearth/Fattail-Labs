-- 062 — Strategy Lab blurb names Tradier as execution target (DL-185).

UPDATE apps
SET title = 'Strategy Lab',
    blurb = 'Build, Test, Run bots, live and paper on Tradier. Validate edges before capital. Most ideas die. Survivors get a campaign.'
WHERE slug = 'strategy-lab'
;
