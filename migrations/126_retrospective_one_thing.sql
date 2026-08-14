-- 126 — Trader "one thing" (ceremony step 8), separate from cause (body_md).
ALTER TABLE member_retrospectives
  ADD COLUMN one_thing_md MEDIUMTEXT NULL
    AFTER body_md;
