-- 133 — Apply endings: Coach / Lakesia / trial
-- No Typeform score sheet was imported. Admin map is empty until tagged.
-- Existing Cole questions stay on the default path. Existing slots = Coach.

CREATE TABLE apply_hosts (
  slug VARCHAR(32) NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  organizer_name VARCHAR(128) NOT NULL,
  organizer_email VARCHAR(320) NOT NULL DEFAULT ''
    COMMENT 'Empty = ICS fail loud for that host; do not invent an address',
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO apply_hosts (slug, display_name, organizer_name, organizer_email, sort_order)
VALUES
  ('coach', 'Coach (Ernie)', 'Ernie', 'coach@fattail.ai', 10),
  ('lakesia', 'Lakesia', 'Lakesia', '', 20);

CREATE TABLE apply_score_settings (
  id TINYINT UNSIGNED NOT NULL,
  tie_ending VARCHAR(16) NOT NULL DEFAULT 'trial',
  trial_url VARCHAR(255) NOT NULL,
  trial_price VARCHAR(64) NOT NULL,
  trial_term VARCHAR(64) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO apply_score_settings
  (id, tie_ending, trial_url, trial_price, trial_term)
VALUES
  (1, 'trial', 'https://fattail.ai/try', '$17/wk', 'six weeks');

ALTER TABLE apply_slots
  ADD COLUMN host VARCHAR(32) NOT NULL DEFAULT 'coach'
    COMMENT 'coach | lakesia — applicant sees only the ending they earned';

ALTER TABLE apply_questions
  ADD COLUMN on_path TINYINT(1) NOT NULL DEFAULT 1
    COMMENT '1 = default walk; 0 = only if an answer reveals it';

ALTER TABLE apply_submissions
  ADD COLUMN ending VARCHAR(16) NULL;
