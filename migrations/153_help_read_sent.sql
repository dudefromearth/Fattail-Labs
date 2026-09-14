-- 153_help_read_sent.sql
-- Read/Sent tracking for the help desk.
--   help_messages.email_status / emailed_at = delivery result of the reply email
--   help_questions.member_last_viewed_at     = when the member last opened the ticket
ALTER TABLE help_messages ADD COLUMN email_status VARCHAR(16) NULL, ADD COLUMN emailed_at DATETIME NULL;
ALTER TABLE help_questions ADD COLUMN member_last_viewed_at DATETIME NULL;
