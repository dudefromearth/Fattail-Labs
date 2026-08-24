-- 139 — Wiki Source Contract watermarks (v0.1.4 SC-1 · DL-568).
-- Wiki-side only (L9). Change test is content_hash (L10). Not page bytes (L5).
-- No body / markdown column.

CREATE TABLE wiki_source_watermarks (
  source_kind VARCHAR(32) NOT NULL,
  source_id VARCHAR(191) NOT NULL,
  content_hash VARCHAR(128) NOT NULL,
  seen_at DATETIME(6) NOT NULL,
  contract_id CHAR(26) NOT NULL,
  PRIMARY KEY (source_kind, source_id),
  KEY ix_wiki_source_watermarks_seen (seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
