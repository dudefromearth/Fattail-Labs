-- 142 — IKI Factory Published (DL-577 Coach rulings)
-- Live write first. State is Published. Woo is a named stub; never pull back to Build.

ALTER TABLE iki_factory_cards
  ADD COLUMN published TINYINT(1) NOT NULL DEFAULT 0 AFTER store_visible,
  ADD COLUMN obtainable TINYINT(1) NOT NULL DEFAULT 0 AFTER published,
  ADD COLUMN woo_reason TEXT NULL AFTER obtainable;

UPDATE iki_factory_cards
   SET published = 1
 WHERE lane = 'live' AND published = 0;
