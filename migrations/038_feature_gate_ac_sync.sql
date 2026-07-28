-- 038_feature_gate_ac_sync.sql
-- ActiveCampaign lead-sync status for waitlist captures.
--
-- Free waitlist signups are pushed to ActiveCampaign as contacts tagged
-- "Labs Lead" (FatTail-Labs-ActiveCampaign-Lead-Sync-Spec-v1.0). These columns
-- record the outcome of that best-effort push for observability:
--   NULL      => not yet attempted (or AC integration disabled at insert time)
--   synced    => contact upserted and tagged in AC
--   skipped   => AC integration disabled (no config)
--   failed    => config or API error (see ac_error)
-- The push NEVER blocks or fails the waitlist write.

ALTER TABLE feature_gate_emails
  ADD COLUMN ac_status    VARCHAR(16)  NULL AFTER source,
  ADD COLUMN ac_error     VARCHAR(512) NULL AFTER ac_status,
  ADD COLUMN ac_synced_at TIMESTAMP    NULL AFTER ac_error;
