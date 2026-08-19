-- 132 — Native apply questions (server-owned; admin in-place)
-- Seed = today's intro + email + Cole seven so the walk is not empty.
-- qtype: continue | free_text | binary | radio | calendar
-- ac_field_id 3–9 only when mapped. New questions stay NULL (do not invent ids).

CREATE TABLE apply_questions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(64) NOT NULL,
  ask TEXT NOT NULL,
  hint TEXT NOT NULL,
  qtype VARCHAR(32) NOT NULL,
  options_json JSON NULL,
  ac_key VARCHAR(64) NULL,
  ac_field_id VARCHAR(8) NULL,
  is_email TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_apply_questions_slug (slug),
  KEY idx_apply_questions_sort (sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE apply_submissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(320) NOT NULL,
  ac_contact_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_apply_submissions_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE apply_submission_answers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  slug VARCHAR(64) NOT NULL,
  value MEDIUMTEXT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_apply_sub_answers_sub (submission_id),
  CONSTRAINT fk_apply_sub_answers_sub
    FOREIGN KEY (submission_id) REFERENCES apply_submissions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO apply_questions
  (slug, ask, hint, qtype, options_json, ac_key, ac_field_id, is_email, sort_order)
VALUES
  (
    'intro',
    'This is the FatTail application.',
    'A few questions, one at a time, so we know if this is a fit. Not a dump of fields.',
    'continue',
    NULL, NULL, NULL, 0, 10
  ),
  (
    'email',
    'Enter your email (we will never share it).',
    '',
    'free_text',
    NULL, NULL, NULL, 1, 20
  ),
  (
    'HEAVEN',
    'What do you consider your heaven island?',
    'The life and trading state you want. For example: a defined-risk book you can compound. Calm in the chair. Not hunting win rate.',
    'free_text',
    NULL, 'HEAVEN', '4', 0, 30
  ),
  (
    'HELL',
    'What is your hell island?',
    'The pain. For example: violent equity. Blow-ups. Solving for win rate.',
    'free_text',
    NULL, 'HELL', '3', 0, 40
  ),
  (
    'MONEY_TIMING',
    'Can you invest the time and money now?',
    'An honest yes, a not-yet, or what has to move first.',
    'free_text',
    NULL, 'MONEY_TIMING', '5', 0, 50
  ),
  (
    'COACHING_SKU',
    'Which door do you think you want?',
    'Say it in your words. Observer, Activator, or Navigator are examples — not a menu.',
    'free_text',
    NULL, 'COACHING_SKU', '6', 0, 60
  ),
  (
    'ELEVEN_AM_ET',
    'Pick a time for a live FatTail conversation. A calendar invite will be sent to the email you entered.',
    'America/New_York. Thirty minutes. We''ll send the link. Pick one listed time.',
    'calendar',
    NULL, 'ELEVEN_AM_ET', '7', 0, 70
  ),
  (
    'TRIED',
    'What have you already tried?',
    'Courses, rooms, a firm, going it alone — whatever is true.',
    'free_text',
    NULL, 'TRIED', '8', 0, 80
  ),
  (
    'PARTNER_SUPPORT',
    'Is home on board?',
    'Partner, family — whether they support you doing this.',
    'free_text',
    NULL, 'PARTNER_SUPPORT', '9', 0, 90
  );
