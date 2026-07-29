-- 043 — Journey gamification: live session check-ins (attendance streak)
-- Spec: Specs/FatTail-Labs-Journey-Gamification-Spec-v1.0.md
-- session_key supports one-off ids ("42") and recurring ("r3-2026-07-29").
-- Scores derive on read from enrollments, progress, discussion, reviews, check-ins.

CREATE TABLE IF NOT EXISTS live_session_checkins (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id   BIGINT UNSIGNED NOT NULL,
  session_key   VARCHAR(96)  NOT NULL,
  starts_at     DATETIME NOT NULL,
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_checkin_identity_key (identity_id, session_key),
  KEY ix_checkin_identity_time (identity_id, checked_in_at),
  CONSTRAINT fk_checkin_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journey app blurb: process-peer community board (replaces "no leaderboards")
UPDATE apps
SET blurb = 'Your path, process scores, and an opt-in community board — contribution and growth, never P and L theater.'
WHERE slug = 'journey';
