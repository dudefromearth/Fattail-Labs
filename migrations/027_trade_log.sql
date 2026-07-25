-- 027 — Trade Log MVP (Application Framework Family B · T-D5 process-first)
-- Isolation: identity_id. P&L optional/neutral — never the product headline.

CREATE TABLE IF NOT EXISTS member_trade_log_entries (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id       BIGINT UNSIGNED NOT NULL,
  traded_on         DATE NULL,
  setup_md          TEXT NOT NULL,
  plan_md           TEXT NOT NULL,
  rules_md          TEXT NOT NULL,
  adherence         VARCHAR(32) NOT NULL DEFAULT 'unknown',
  deviation_md      TEXT NOT NULL,
  lesson_md         TEXT NOT NULL,
  pnl_amount        DECIMAL(18, 4) NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_mtle_owner (identity_id, traded_on, id),
  CONSTRAINT fk_mtle_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
