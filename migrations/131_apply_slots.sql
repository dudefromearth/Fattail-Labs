-- 131 — Native apply conversation slots (server-owned; no Calendly)
-- Applicant sees only live rows (starts_et set). Count is not frozen.
-- Four placeholder America/New_York times; admin changes them in place.

CREATE TABLE apply_slots (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  starts_et VARCHAR(16) NOT NULL DEFAULT ''
    COMMENT 'Wall clock America/New_York YYYY-MM-DDTHH:MM; empty = hidden',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_apply_slots_sort (sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO apply_slots (starts_et, sort_order) VALUES
  ('2026-08-25T11:00', 10),
  ('2026-08-26T14:00', 20),
  ('2026-08-27T11:00', 30),
  ('2026-08-28T16:00', 40);
