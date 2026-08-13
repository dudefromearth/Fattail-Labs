-- 125 — Apps hub card highlight (Catalog-Order Spec v1.1.2 · DL-321)
-- Admin toggle on /app cards. When on, the card is powder-blue with a thick
-- darker-blue outline. Members see the treatment; only administrators write.

ALTER TABLE apps
  ADD COLUMN highlighted TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order
;
