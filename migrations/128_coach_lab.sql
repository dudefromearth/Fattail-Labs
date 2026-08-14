-- 128 — Coach Conversation Lab (DL-327)
-- Admin-only harness. Per-admin conversations. No member / journal / retro FKs.

CREATE TABLE IF NOT EXISTS coach_lab_config (
  id                    TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  instruction_text      TEXT NOT NULL,
  instruction_version   INT NOT NULL DEFAULT 1,
  model                 VARCHAR(64) NOT NULL,
  effort                ENUM('low','medium','high','xhigh') NOT NULL DEFAULT 'low',
  voice_enabled         TINYINT(1) NOT NULL DEFAULT 0,
  coach_bubble_bg       VARCHAR(16) NOT NULL,
  coach_bubble_text     VARCHAR(16) NOT NULL,
  trader_bubble_bg      VARCHAR(16) NOT NULL,
  trader_bubble_text    VARCHAR(16) NOT NULL,
  updated_by            BIGINT UNSIGNED NULL,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clcfg_updated_by FOREIGN KEY (updated_by)
    REFERENCES identities (identity_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO coach_lab_config (
  id, instruction_text, instruction_version, model, effort, voice_enabled,
  coach_bubble_bg, coach_bubble_text, trader_bubble_bg, trader_bubble_text
) VALUES (
  1,
  'You are a friendly greeter testing a chat interface. Welcome the user by name like an old friend walking into your shop. Engage in light banter about trading and markets — the day, the mood, nothing serious. Keep messages short, like texting. You have the personality of Yogi Berra: folksy, warm, cheerfully confusing, and you like to end thoughts with his style of little quips. No analysis, no advice — you''re just here to say hello and chat.',
  1,
  'grok-4.20',
  'low',
  0,
  '#E9E9EB',
  '#000000',
  '#34C759',
  '#FFFFFF'
);

CREATE TABLE IF NOT EXISTS coach_lab_conversations (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  started_by            BIGINT UNSIGNED NOT NULL,
  started_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at              TIMESTAMP NULL,
  instruction_version   INT NOT NULL,
  model                 VARCHAR(64) NOT NULL,
  effort                ENUM('low','medium','high','xhigh') NOT NULL,
  PRIMARY KEY (id),
  KEY ix_clconv_admin_open (started_by, ended_at, started_at),
  CONSTRAINT fk_clconv_started_by FOREIGN KEY (started_by)
    REFERENCES identities (identity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coach_lab_messages (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id       BIGINT UNSIGNED NOT NULL,
  role                  ENUM('coach','trader') NOT NULL,
  body_md               TEXT NOT NULL,
  at                    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  model                 VARCHAR(64) NULL,
  effort                VARCHAR(16) NULL,
  PRIMARY KEY (id),
  KEY ix_clm_conv (conversation_id, at, id),
  CONSTRAINT fk_clm_conv FOREIGN KEY (conversation_id)
    REFERENCES coach_lab_conversations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
