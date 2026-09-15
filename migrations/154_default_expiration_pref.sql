-- 154_default_expiration_pref.sql
-- Per-member Options Lab "Contract" (front expiration) preference.
-- auto = current behavior (unchanged for everyone); zero = prefer today's 0DTE; next = prefer next listed.
ALTER TABLE identities ADD COLUMN default_expiration_pref VARCHAR(8) NULL;
