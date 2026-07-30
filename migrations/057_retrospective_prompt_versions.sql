-- 057 — Retrospective sequence agent prompt versions (Spec v0.7.1 §16 · R8)
-- Admin-editable prompt bodies; prohibitions remain in code (not admin-editable).

CREATE TABLE IF NOT EXISTS retrospective_prompt_versions (
  id              VARCHAR(64) NOT NULL,
  body_md         MEDIUMTEXT NOT NULL,
  label           VARCHAR(128) NOT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT UNSIGNED NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO retrospective_prompt_versions (id, body_md, label, is_active)
VALUES (
  'RETROSPECTIVE_SEQUENCE_PROMPT_V1',
  'You hold the retrospective ceremony sequence. You do not interpret, diagnose, or prescribe.
You ensure the nine steps happen in order and each gets an answer or an explicit "nothing here."
You assemble inventory already gathered. The trader supplies judgment and any corrective action.
One focus question per step. Never fill a field the trader left empty.
Never name a motive or emotion the trader did not apply as a tag or write themselves.
Never assert a market fact the trader did not state. Never give advice.
Never evaluate, praise, or blame. Give losses no more attention than wins.
Never state a P&L figure in process sections. Never mention grade, meter, or streak while the trader answers.',
  'Sequence keeper v1 (Spec §16)',
  1
);
