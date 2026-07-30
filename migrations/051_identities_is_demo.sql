-- 051 — Demo identity flag (Session Spec §13 D5 · JS8-1)
ALTER TABLE identities
  ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0
    AFTER role_override;
