-- 095 — Playbook scrapbook schema sync (Spec v1.1a · DL-255)
-- Completes 094: cover attachment FK; practice-suite purge safety notes.
-- Idempotent: skips if constraint already exists (MySQL lacks IF NOT EXISTS for FKs —
-- re-run only once via migrate.py).

-- Cover image: book → attachment (SET NULL on attachment remove)
-- Requires member_playbook_attachments from 094.
ALTER TABLE member_playbook_entries
  ADD CONSTRAINT fk_mpe_cover_attachment
    FOREIGN KEY (cover_attachment_id)
    REFERENCES member_playbook_attachments (id)
    ON DELETE SET NULL;

-- Helpful indexes for practice suite filters (trade/journal already have campaign/playbook keys from 093)
-- Ensure evidence lookup by object
ALTER TABLE member_playbook_evidence
  ADD KEY ix_mpbev_object (identity_id, object_type, object_id);
