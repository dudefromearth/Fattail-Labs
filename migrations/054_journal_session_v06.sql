-- 054 — Journal Session Spec v0.6
-- One conversation per date: merge duplicates, UNIQUE (identity_id, journal_date).
-- prompt_version_id for admin-versioned agent prompts (J3).
-- Collision log for dual structured_json (never silent drop of member content).

-- Collision audit when two structured records exist for the same date
CREATE TABLE IF NOT EXISTS member_journal_session_merge_collisions (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id           BIGINT UNSIGNED NOT NULL,
  journal_date          DATE NOT NULL,
  kept_session_id       BIGINT UNSIGNED NOT NULL,
  dropped_session_id    BIGINT UNSIGNED NOT NULL,
  dropped_structured_json JSON NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mjsmc_owner_date (identity_id, journal_date),
  CONSTRAINT fk_mjsmc_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log structured collisions before merge (kept = MIN(id); dropped has non-null structured)
INSERT INTO member_journal_session_merge_collisions
  (identity_id, journal_date, kept_session_id, dropped_session_id, dropped_structured_json)
SELECT
  s.identity_id,
  s.journal_date,
  k.keep_id,
  s.id,
  s.structured_json
FROM member_journal_sessions s
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON k.identity_id = s.identity_id AND k.journal_date = s.journal_date
INNER JOIN member_journal_sessions kept ON kept.id = k.keep_id
WHERE s.id <> k.keep_id
  AND s.structured_json IS NOT NULL
  AND JSON_TYPE(s.structured_json) <> 'NULL'
  AND (
    kept.structured_json IS NOT NULL
    AND JSON_TYPE(kept.structured_json) <> 'NULL'
  );

-- If kept has empty structured and dropped has content, copy dropped → kept
UPDATE member_journal_sessions kept
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON kept.id = k.keep_id
INNER JOIN member_journal_sessions dropp
  ON dropp.identity_id = k.identity_id
 AND dropp.journal_date = k.journal_date
 AND dropp.id <> k.keep_id
 AND dropp.structured_json IS NOT NULL
 AND JSON_TYPE(dropp.structured_json) <> 'NULL'
SET kept.structured_json = dropp.structured_json
WHERE kept.structured_json IS NULL
   OR JSON_TYPE(kept.structured_json) = 'NULL'
   OR kept.structured_json = CAST('null' AS JSON);

-- Re-point messages to keep_id
UPDATE member_journal_messages m
INNER JOIN member_journal_sessions s ON s.id = m.session_id
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON k.identity_id = s.identity_id AND k.journal_date = s.journal_date
SET m.session_id = k.keep_id
WHERE m.session_id <> k.keep_id;

-- Re-point attachments
UPDATE member_journal_attachments a
INNER JOIN member_journal_sessions s ON s.id = a.session_id
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON k.identity_id = s.identity_id AND k.journal_date = s.journal_date
SET a.session_id = k.keep_id
WHERE a.session_id <> k.keep_id;

-- Re-point Tag Manager assignments (dedupe via unique key later)
UPDATE tag_assignments a
INNER JOIN member_journal_sessions s
  ON s.id = a.object_id AND a.object_type = 'journal_session'
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON k.identity_id = s.identity_id AND k.journal_date = s.journal_date
SET a.object_id = k.keep_id
WHERE a.object_id <> k.keep_id;

-- Drop duplicate tag assignments that now collide on (tag_id, object_type, object_id)
DELETE a1 FROM tag_assignments a1
INNER JOIN tag_assignments a2
  ON a1.tag_id = a2.tag_id
 AND a1.object_type = a2.object_type
 AND a1.object_id = a2.object_id
 AND a1.id > a2.id
WHERE a1.object_type = 'journal_session';

-- Legacy multi-tag join rows → keep session
INSERT IGNORE INTO member_journal_session_tags (session_id, tag)
SELECT k.keep_id, t.tag
FROM member_journal_session_tags t
INNER JOIN member_journal_sessions s ON s.id = t.session_id
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON k.identity_id = s.identity_id AND k.journal_date = s.journal_date
WHERE t.session_id <> k.keep_id;

DELETE t FROM member_journal_session_tags t
INNER JOIN member_journal_sessions s ON s.id = t.session_id
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON k.identity_id = s.identity_id AND k.journal_date = s.journal_date
WHERE t.session_id <> k.keep_id;

-- Prefer open status / earliest started_at already on keep_id; promote closed if any sibling closed
UPDATE member_journal_sessions kept
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON kept.id = k.keep_id
INNER JOIN member_journal_sessions sib
  ON sib.identity_id = k.identity_id
 AND sib.journal_date = k.journal_date
 AND sib.id <> k.keep_id
 AND sib.status IN ('closed', 'sealed')
SET kept.status = 'closed',
    kept.closed_by_retrospective_id = COALESCE(
      kept.closed_by_retrospective_id, sib.closed_by_retrospective_id
    ),
    kept.closed_at = COALESCE(kept.closed_at, sib.closed_at);

-- Delete duplicate session rows
DELETE s FROM member_journal_sessions s
INNER JOIN (
  SELECT identity_id, journal_date, MIN(id) AS keep_id
  FROM member_journal_sessions
  GROUP BY identity_id, journal_date
  HAVING COUNT(*) > 1
) k ON k.identity_id = s.identity_id AND k.journal_date = s.journal_date
WHERE s.id <> k.keep_id;

-- One conversation per date (Spec v0.6 §3) — replace non-unique date index
ALTER TABLE member_journal_sessions
  DROP INDEX ix_mjs_owner_date,
  ADD UNIQUE KEY uq_mjs_owner_date (identity_id, journal_date);

-- Admin prompt version stamp (J3)
ALTER TABLE member_journal_sessions
  ADD COLUMN prompt_version_id VARCHAR(64) NULL
    AFTER absence_keys_raised_json;

CREATE TABLE IF NOT EXISTS journal_session_prompt_versions (
  id              VARCHAR(64) NOT NULL,
  body_md         MEDIUMTEXT NOT NULL,
  label           VARCHAR(128) NOT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT UNSIGNED NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO journal_session_prompt_versions (id, body_md, label, is_active)
VALUES (
  'JOURNAL_SESSION_SYSTEM_PROMPT_V1',
  'See server/journal_session_agent.py JOURNAL_SESSION_SYSTEM_PROMPT_V1 — seed row for stamp identity.',
  'System prompt v1 (code constant)',
  1
);
