-- 116 — Journal Day Net Calendar exposure-map toggle (Spec v0.2 · JED-1b)
-- Default ON (day_net_map_enabled = 1): chosen exposure as practice.

CREATE TABLE IF NOT EXISTS member_journal_prefs (
  identity_id BIGINT UNSIGNED NOT NULL,
  day_net_map_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (identity_id),
  CONSTRAINT fk_mjp_identity FOREIGN KEY (identity_id)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
