-- 135 — Wiki Agent pointer registry (Spec v0.1.2 WA-2 · India).
-- Canonical refs + hashes only. Not page bytes.

CREATE TABLE wiki_pointers (
  id BIGINT NOT NULL AUTO_INCREMENT,
  source VARCHAR(64) NOT NULL,
  ref_kind VARCHAR(32) NOT NULL,
  ref_id VARCHAR(128) NOT NULL,
  canonical_url VARCHAR(512) NOT NULL,
  content_hash CHAR(64) NOT NULL,
  last_seen_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wiki_pointers_ref (source, ref_kind, ref_id),
  KEY ix_wiki_pointers_source (source, last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
