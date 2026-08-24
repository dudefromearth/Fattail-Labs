-- 136 — wiki_refs + reverse-pass overflow queue (Wiki Agent Spec v0.1.2 WA-3).
-- Scores are derived; page bytes stay in git.

CREATE TABLE wiki_refs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  from_slug VARCHAR(255) NOT NULL,
  to_kind VARCHAR(32) NOT NULL,
  to_id VARCHAR(255) NOT NULL,
  relation VARCHAR(32) NOT NULL,
  score DOUBLE NOT NULL,
  explain_json JSON NOT NULL,
  contract_id CHAR(26) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_wiki_refs (from_slug, to_kind, to_id, relation),
  KEY ix_wiki_refs_to (to_kind, to_id),
  KEY ix_wiki_refs_contract (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wiki_linkage_queue (
  id BIGINT NOT NULL AUTO_INCREMENT,
  contract_id CHAR(26) NOT NULL,
  from_slug VARCHAR(255) NOT NULL,
  to_slug VARCHAR(255) NOT NULL,
  score DOUBLE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'queued',
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wiki_linkage_queue (contract_id, from_slug, to_slug),
  KEY ix_wiki_linkage_queue_contract (contract_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
