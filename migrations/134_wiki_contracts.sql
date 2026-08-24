-- 134 — Wiki Agent contracts ledger + source registry (Spec v0.1.2 WA-1 · DL-548).
-- State/audit only. Page bytes stay in lab-wiki git. Not a pin/compile-inbox table.

CREATE TABLE wiki_agent_sources (
  slug VARCHAR(64) NOT NULL,
  principal_callsign VARCHAR(64) NOT NULL,
  allowed_kind VARCHAR(32) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (slug),
  KEY ix_wiki_agent_sources_principal (principal_callsign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wiki_contracts (
  contract_id CHAR(26) NOT NULL,
  contract_version VARCHAR(8) NOT NULL,
  kind VARCHAR(32) NOT NULL,
  source VARCHAR(64) NOT NULL,
  delivered_at DATETIME(6) NOT NULL,
  principal VARCHAR(255) NOT NULL,
  refs_json JSON NOT NULL,
  payload_json JSON NOT NULL,
  status VARCHAR(32) NOT NULL,
  reject_reason VARCHAR(255) NOT NULL DEFAULT '',
  failure_reason VARCHAR(255) NOT NULL DEFAULT '',
  commit_shas_json JSON NOT NULL,
  board_card_ids_json JSON NOT NULL,
  sealed_at DATETIME(6) NULL,
  received_at DATETIME(6) NOT NULL,
  validated_at DATETIME(6) NULL,
  drafted_at DATETIME(6) NULL,
  awaiting_approval_at DATETIME(6) NULL,
  published_at DATETIME(6) NULL,
  rejected_at DATETIME(6) NULL,
  failed_at DATETIME(6) NULL,
  PRIMARY KEY (contract_id),
  KEY ix_wiki_contracts_status (status, delivered_at),
  KEY ix_wiki_contracts_source (source, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
