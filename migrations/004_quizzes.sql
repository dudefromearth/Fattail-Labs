-- 004 — Quizzes (Specs/FatTail-Labs-Quizzes-Spec-v1.0.md)
-- A quiz is a lesson kind ('quiz'); questions attach to the lesson.

CREATE TABLE IF NOT EXISTS quiz_questions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lesson_id      BIGINT UNSIGNED NOT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  kind           VARCHAR(32) NOT NULL,        -- multiple_choice|binary|short_answer
  prompt_md      MEDIUMTEXT NOT NULL,
  options_json   JSON NULL,                   -- multiple_choice: ["opt", ...]
  correct_json   JSON NOT NULL,               -- mc: index · binary: bool · short: ["answer", ...]
  explanation_md MEDIUMTEXT NULL,
  PRIMARY KEY (id),
  KEY ix_qq_lesson (lesson_id, sort_order),
  CONSTRAINT fk_qq_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id  BIGINT UNSIGNED NOT NULL,
  lesson_id    BIGINT UNSIGNED NOT NULL,
  score        INT NOT NULL,
  total        INT NOT NULL,
  answers_json JSON NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_qa_identity (identity_id, submitted_at),
  KEY ix_qa_lesson (lesson_id),
  CONSTRAINT fk_qa_identity FOREIGN KEY (identity_id) REFERENCES identities (identity_id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
