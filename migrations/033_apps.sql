-- 033 — First-class Apps: id + title + unique slug for /app/{slug}
-- Same identity model as course / module / lesson / resource.

CREATE TABLE IF NOT EXISTS apps (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(255) NOT NULL,
  title       VARCHAR(512) NOT NULL,
  blurb       VARCHAR(1024) NOT NULL DEFAULT '',
  status      VARCHAR(32) NOT NULL DEFAULT 'soon',  -- soon|live|external
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_slug (slug),
  KEY ix_app_status (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO apps (slug, title, blurb, status, sort_order) VALUES
(
  'journey',
  'Journey',
  'Your enrollments and lesson progress in one place — process over pace, no leaderboards.',
  'live',
  0
),
(
  'trade-log',
  'Trade Log',
  'Record fills and structure outcomes — process first, not P&L theater.',
  'live',
  1
),
(
  'journal',
  'Journal',
  'Daily notes tied to the routine: preparation, selection, and review.',
  'soon',
  2
),
(
  'playbook',
  'Playbook',
  'Your defined-risk setups and rules — the book you actually trade from.',
  'soon',
  3
),
(
  'statistics',
  'Statistics',
  'Adherence and process metrics — streaks and discipline, never profit claims.',
  'soon',
  4
),
(
  'vexy',
  'Vexy',
  'Cognitive partner for structure and doctrine — when the practice stack is wired.',
  'soon',
  5
)
ON DUPLICATE KEY UPDATE title = VALUES(title);
