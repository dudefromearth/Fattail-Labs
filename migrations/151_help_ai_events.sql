-- Escalation-driven knowledge base + concierge analytics.
-- One row per AI concierge interaction (answer / follow-up) and per manual
-- escalation, so we can measure deflection, cost, and — via reference_hit —
-- which member questions the AI had NO reference doc to answer from (doc gaps).
CREATE TABLE IF NOT EXISTS help_ai_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT NULL,
  event_type VARCHAR(20) NOT NULL,
  topic VARCHAR(60) NULL,
  category VARCHAR(60) NULL,
  page_context VARCHAR(255) NULL,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  reference_hit TINYINT(1) NULL,
  model VARCHAR(60) NULL,
  input_tokens INT NULL,
  output_tokens INT NULL,
  cost_usd DECIMAL(12,6) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_help_ai_events_created (created_at),
  INDEX idx_help_ai_events_topic (topic),
  INDEX idx_help_ai_events_page (page_context),
  INDEX idx_help_ai_events_question (question_id)
);
