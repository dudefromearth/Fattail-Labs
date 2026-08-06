-- 088 — Curate instance run clock: wall time since last start/restart
-- Set on arm (and re-arm after pause/halt). Used for dashboard runtime stat.

ALTER TABLE strategy_lab_curate_instances
  ADD COLUMN run_started_at TIMESTAMP NULL DEFAULT NULL
    AFTER last_error;

-- Backfill active-ish runs from last arm decision or created_at
UPDATE strategy_lab_curate_instances i
SET run_started_at = COALESCE(
  (
    SELECT MAX(d.created_at)
    FROM strategy_lab_decision_log d
    WHERE d.instance_id = i.id
      AND d.event_type = 'status_change'
      AND (
        d.message LIKE '%armed%'
        OR d.payload_json LIKE '%"status": "armed"%'
        OR d.payload_json LIKE '%"status":"armed"%'
      )
  ),
  i.created_at
)
WHERE i.status IN ('armed', 'running', 'paused', 'halted')
  AND i.run_started_at IS NULL;
