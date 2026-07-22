-- 008 — membership-based content categories replace role gating on live content
-- (Live Sessions spec v1.3). public = no gate; members = all memberships;
-- coaching = Observer & Navigator only.

ALTER TABLE live_sessions ADD COLUMN category VARCHAR(32) NOT NULL DEFAULT 'members';
UPDATE live_sessions SET category = CASE min_role
  WHEN 'navigator' THEN 'coaching'
  WHEN 'public' THEN 'public'
  ELSE 'members' END;
ALTER TABLE live_sessions DROP COLUMN min_role;

ALTER TABLE live_recurrences ADD COLUMN category VARCHAR(32) NOT NULL DEFAULT 'members';
UPDATE live_recurrences SET category = CASE min_role
  WHEN 'navigator' THEN 'coaching'
  WHEN 'public' THEN 'public'
  ELSE 'members' END;
ALTER TABLE live_recurrences DROP COLUMN min_role;
