-- 128 — Admin AI instructions carry a reasoning level (Coach · DL-340).
-- low | medium | high. Default medium.

ALTER TABLE journal_session_prompt_versions
  ADD COLUMN reasoning_level VARCHAR(16) NOT NULL DEFAULT 'medium'
    AFTER body_md;
