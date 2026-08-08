-- 095 — Playbook scrapbook schema sync (Spec v1.1a · DL-255)
-- Completes 094: cover attachment FK; practice-suite purge safety notes.
-- Prerequisite: 094_playbook_scrapbook_cover_columns.sql must run first (adds
-- cover_attachment_id + subtitle). Without it this FK fails on clean DBs.
-- Not idempotent for the FK: if it already exists, re-apply will error — migrate
-- records success only after all statements complete.

-- Cover image: book → attachment (SET NULL on attachment remove)
-- Requires member_playbook_attachments from 094 + cover_attachment_id column.
ALTER TABLE member_playbook_entries
  ADD CONSTRAINT fk_mpe_cover_attachment
    FOREIGN KEY (cover_attachment_id)
    REFERENCES member_playbook_attachments (id)
    ON DELETE SET NULL;

-- Helpful indexes for practice suite filters (trade/journal already have campaign/playbook keys from 093)
-- Ensure evidence lookup by object
ALTER TABLE member_playbook_evidence
  ADD KEY ix_mpbev_object (identity_id, object_type, object_id);
