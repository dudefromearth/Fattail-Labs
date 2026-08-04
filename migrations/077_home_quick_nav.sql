-- 077 — Home page quick nav preference (member profile)
-- Default: journal only. Optional: wiki, strategy_lab, fattail_hard, courses.
-- Stored as JSON array of string keys on identities.

ALTER TABLE identities
  ADD COLUMN home_quick_nav_json JSON NULL
    COMMENT 'Ordered quick-nav keys for /home, null = default journal'
    AFTER retro_cadence_days;
