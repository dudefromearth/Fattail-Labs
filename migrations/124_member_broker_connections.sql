-- 124_member_broker_connections.sql
-- Broker OAuth connections (Tradier first — FatTail-Labs-Tradier-Integration-Spec-v0.1 §6).
--
-- One row per member per broker. Access/refresh tokens are stored ENCRYPTED at rest
-- (Fernet ciphertext in *_enc columns, never plaintext). The whole feature is
-- fail-closed: nothing reads or writes this table until TRADIER_* + LABS_TOKEN_ENC_KEY
-- are configured in the API env (§8). Imported trades reuse member_trade_log_imports
-- batches — this table only holds the connection + tokens, no trade data.

CREATE TABLE IF NOT EXISTS member_broker_connections (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id         BIGINT UNSIGNED NOT NULL,
  provider            VARCHAR(32)  NOT NULL DEFAULT 'tradier',
  broker_account_id   VARCHAR(64)  NULL,            -- selected Tradier account to sync
  access_token_enc    TEXT         NULL,            -- Fernet ciphertext (never plaintext)
  refresh_token_enc   TEXT         NULL,            -- Fernet ciphertext (null until partner-enabled)
  token_expires_at    TIMESTAMP    NULL,            -- access token expiry (~24h)
  scope               VARCHAR(120) NULL,            -- granted scope (expect 'read')
  status              VARCHAR(16)  NOT NULL DEFAULT 'connected',  -- connected|revoked|error
  last_error          VARCHAR(255) NULL,
  connected_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at      TIMESTAMP    NULL,
  last_sync_count     INT          NOT NULL DEFAULT 0,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mbc_identity_provider (identity_id, provider),
  CONSTRAINT fk_mbc_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
