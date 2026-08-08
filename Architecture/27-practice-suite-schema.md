# Practice Suite Schema Inventory

**Purpose:** Keep Trade Log, Journal, Retrospective, Playbook (scrapbook), Campaign,
Reports, Journey, and Toughness **schema-synced** as product objects evolve.  
**Authority:** Specs + migrations are source of truth; this is an index, not a second store.  
**Last sync:** 2026-08-08 · migrations **093–095** · DL-254 / DL-255 · **PB3 export v2.0 started**  
**UI:** scrapbook library + book stage + present; cover upload; page add/delete; single-book Export; page confirm (§3.3.1 Spec v1.1a)

---

## Family B floor

Every member practice table below is scoped by `identity_id` (or FK chain to an
identity-owned parent). Cross-identity reads/writes fail loud.

---

## Object map

| Product surface | Primary tables | Link columns / children |
|-----------------|----------------|-------------------------|
| **Trade Log** | `member_trade_log_accounts`, `member_trade_log_trades`, `member_trade_log_legs` | `playbook_entry_id`, `practice_campaign_id` (093) · `entry_source` |
| **Journal** | `member_journal_sessions`, `member_journal_messages`, `member_journal_attachments`, tags | `practice_campaign_id` (093) |
| **Retrospective** | `member_retrospectives`, habit plans, cadence history | export keys; ceremony columns |
| **Playbook (book)** | `member_playbook_entries` | root book; `subtitle`, `cover_attachment_id`, `status`, `body_md` (snippet), `structured_json`, `export_key` |
| **Playbook scrapbook** | `member_playbook_chapters`, `member_playbook_pages`, `member_playbook_stickies` | pages.playbook_entry_id must match chapter (enforced in domain) |
| **Playbook archive** | `member_playbook_attachments` | storage `pbmedia:{iid}/…`; soft `purged_at` |
| **Playbook evidence** | `member_playbook_evidence` | `object_type` ∈ journal_session\|trade + `object_id` (no hard FK — permanence) |
| **Playbook versions** | `member_playbook_versions` | append-only snapshots; retention ≥1 floor |
| **Campaign (practice season)** | `member_practice_campaigns`, `member_practice_campaign_playbooks` | max one `active` per identity (domain) |
| **Tags** | `tags`, `tag_assignments`, personal vocab | `object_type` includes `playbook_entry`, `journal_session`, `trade` |
| **Reports / Journey** | derived from above + journey scores | no P&L-by-playbook store |

---

## Migration series (practice-relevant)

| N | File | Notes |
|---|------|--------|
| 027–040 | Trade Log v1 / v1.1 | blotter |
| 041 | Practice suite / reports | |
| 049–054 | Journal sessions + media | |
| 053–058 | Tag manager | `playbook_entry` object type |
| 046–057 | Retrospectives | |
| **093** | `practice_playbook_campaign.sql` | Books + campaigns + trade/journal FKs |
| **094** | `playbook_scrapbook.sql` | Chapters/pages/stickies/attachments/evidence/versions + book subtitle/cover |
| **095** | `playbook_scrapbook_schema_sync.sql` | Cover FK; evidence object index |

---

## Config (boot fail-loud — scrapbook)

| Env | Role |
|-----|------|
| `LABS_PLAYBOOK_ARCHIVE_MIME_ALLOWLIST` | MIME allowlist |
| `LABS_PLAYBOOK_ARCHIVE_MAX_FILES` | Cap files per book |
| `LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_FILE` | Cap file size |
| `LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_BOOK` | Cap archive bytes |
| `LABS_PLAYBOOK_EXPORT_MAX_ZIP_BYTES` | Export ceiling |
| `LABS_PLAYBOOK_VERSION_RETENTION_COUNT` | ≥1 required |
| `LABS_PLAYBOOK_MEDIA_DIR` | Optional override for archive files |

---

## Purge order (Practice wipe)

See `import_domain.purge_practice_data`:

1. Tags / notifications / retro history  
2. Journal media + sessions  
3. Habit / retro  
4. Trade log  
5. **Playbook media files** → null cover → versions → evidence → stickies → pages → chapters → attachments → campaigns → playbook entries  
6. Tool notes / live check-ins  

Never hard-delete journal/trade rows when only unstapling **evidence**.

---

## Domain modules

| Module | Owns |
|--------|------|
| `practice_spine_domain.py` | Campaign lifecycle; legacy book serialize helpers |
| `playbook_scrapbook_domain.py` | Tree, Save/discard/restore, archive, evidence, migration seed |
| `routes/practice_spine.py` | HTTP for books + campaigns |
| `export_domain` / `import_domain` | Pack surfaces — **playbook model 2.0** (chapters/pages/stickies/evidence/archive refs); single-book ZIP `GET …/playbook/entries/{id}/export` |

---

## Sync checklist (when changing practice schema)

1. Add `migrations/NNN_*.sql` — filename-ordered; no silent defaults.  
2. Update this inventory.  
3. Update `purge_practice_data` + test `_cleanup` helpers (`test_practice_spine`, `test_member_export`).  
4. Export/import if new portable objects.  
5. Domain isolation tests.  
6. Staging/production: run `migrate.py` on host before deploy.

---

## Status of contentful books (dev)

On first `ensure_book_pages_migrated` / list-or-get: contentful books get Main chapter + page + **version 1** seed (not discardable drafts).
