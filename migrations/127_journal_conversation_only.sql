-- 127 — Journal session is a conversation (Coach j.png · DL-339).
-- Product model: date + messages + attachments + prompt_version.
-- Session tag is no longer required. Structured / campaign columns stay
-- unused (NULL) so older rows and export packs remain readable.

ALTER TABLE member_journal_sessions
  MODIFY tag VARCHAR(32) NULL;
