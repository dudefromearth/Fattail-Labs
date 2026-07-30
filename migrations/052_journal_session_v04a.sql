-- 052 — Journal Session Spec v0.4a (J1)
-- Status open|closed; multi-tag join; absence keys; session close denorm.
-- Grandfather: never reopen existing date_closures.
-- Migration map: partial→open; sealed→closed only if date has a closure row.

-- Session close denorm + once-only absence keys
ALTER TABLE member_journal_sessions
  ADD COLUMN closed_by_retrospective_id BIGINT UNSIGNED NULL
    AFTER status,
  ADD COLUMN closed_at DATETIME(6) NULL
    AFTER closed_by_retrospective_id,
  ADD COLUMN absence_keys_raised_json JSON NULL
    AFTER structured_json;

-- Tag becomes optional context (nullable); primary tag column kept for back-compat
-- and dual-read; multi-tags live in join table.
ALTER TABLE member_journal_sessions
  MODIFY COLUMN tag VARCHAR(32) NULL;

CREATE TABLE IF NOT EXISTS member_journal_session_tags (
  session_id  BIGINT UNSIGNED NOT NULL,
  tag         VARCHAR(32) NOT NULL,
  PRIMARY KEY (session_id, tag),
  KEY ix_mjst_tag (tag),
  CONSTRAINT fk_mjst_session FOREIGN KEY (session_id)
    REFERENCES member_journal_sessions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill tags join from legacy single tag
INSERT IGNORE INTO member_journal_session_tags (session_id, tag)
SELECT id, tag FROM member_journal_sessions
 WHERE tag IS NOT NULL AND tag <> '';

-- Status map: partial → open always
UPDATE member_journal_sessions SET status = 'open' WHERE status = 'partial';

-- sealed → closed only if a date_closure exists for (identity, journal_date); else open
UPDATE member_journal_sessions s
  INNER JOIN member_journal_date_closures c
    ON c.identity_id = s.identity_id AND c.journal_date = s.journal_date
   SET s.status = 'closed',
       s.closed_by_retrospective_id = c.closed_by_retrospective_id,
       s.closed_at = c.closed_at
 WHERE s.status = 'sealed';

UPDATE member_journal_sessions SET status = 'open' WHERE status = 'sealed';

-- Market calendar config (fail loud if empty in production paths — seed defaults)
CREATE TABLE IF NOT EXISTS market_calendar_config (
  id              TINYINT UNSIGNED NOT NULL DEFAULT 1,
  venue           VARCHAR(32) NOT NULL DEFAULT 'US_EQUITIES',
  rth_open_local  TIME NOT NULL DEFAULT '09:30:00',
  rth_close_local TIME NOT NULL DEFAULT '16:00:00',
  tz_name         VARCHAR(64) NOT NULL DEFAULT 'America/New_York',
  holidays_json   JSON NULL,
  half_days_json  JSON NULL,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO market_calendar_config (id, venue, rth_open_local, rth_close_local, tz_name)
VALUES (1, 'US_EQUITIES', '09:30:00', '16:00:00', 'America/New_York');
