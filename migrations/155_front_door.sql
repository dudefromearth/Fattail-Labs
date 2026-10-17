-- 155 — Front door evidence and checkout analytics.
-- New tables only. Retention floor is two years (retain_until).

CREATE TABLE IF NOT EXISTS front_door_evidence (
  id            BIGINT NOT NULL AUTO_INCREMENT,
  order_key     VARCHAR(64) NOT NULL,
  woo_order_id  VARCHAR(64) NULL,
  moment        VARCHAR(32) NOT NULL,
  payload_json  JSON NOT NULL,
  retain_until  DATE NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY front_door_evidence_order (order_key),
  KEY front_door_evidence_woo (woo_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS front_door_analytics (
  id            BIGINT NOT NULL AUTO_INCREMENT,
  visitor_key   VARCHAR(64) NOT NULL,
  event         VARCHAR(64) NOT NULL,
  entry_point   VARCHAR(32) NULL,
  product_id    VARCHAR(64) NULL,
  step          VARCHAR(64) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY front_door_analytics_event (event, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;
