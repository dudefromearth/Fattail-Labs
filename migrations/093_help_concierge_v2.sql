-- 093_help_concierge_v2.sql
-- Help concierge v1.1 — member feedback on assistant answers + why a thread closed.
-- (FatTail-Labs-Help-Concierge-Spec-v1.1.) Additive columns; VARCHAR statuses/roles
-- mean no enum changes needed.

-- 'up' | 'down' — member's thumb on an assistant answer (NULL = no rating). Feeds the
-- self-improving loop (which answers helped / which to fix).
ALTER TABLE help_messages
  ADD COLUMN rating VARCHAR(8) NULL AFTER visibility;

-- Why a question left the bot flow: inactivity | member | resolved | escalated (NULL
-- while open). Powers the admin questions view + auto-close analytics.
ALTER TABLE help_questions
  ADD COLUMN closed_reason VARCHAR(32) NULL AFTER status;
