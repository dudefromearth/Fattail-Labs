# Playbook Scrapbook — Deploy env + migrations (for Claude / operators)

**Spec:** `Specs/FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1a.md`  
**DL:** DL-255  
**Also listed in:** `.env.example` (repo root)

---

## Problem

`server/migrate.py` and API boot both call `get_config()` **eagerly**.  
If any required `LABS_PLAYBOOK_*` var is missing, you get `ConfigError` **before** the DB connects — so migrations cannot run and the service cannot start.

The migration runner applies **all pending** migrations in **filename order**. There is **no** flag to run only 094–095. Pending files are applied as a sequence (e.g. 093 then 094 then 095 if all three are pending).

---

## Required env (paste into host `.env`)

Use these defaults unless Coach overrides. Tune later; missing keys still fail loud.

```bash
# ── Playbook scrapbook (Spec v1.1a · DL-255) ───────────────────────────────
# Required for config load, migrate.py, and API boot.
LABS_PLAYBOOK_ARCHIVE_MIME_ALLOWLIST=image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf
LABS_PLAYBOOK_ARCHIVE_MAX_FILES=40
# 5 MiB per file
LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_FILE=5242880
# 50 MiB total archive per book
LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_BOOK=52428800
# 100 MiB export zip ceiling
LABS_PLAYBOOK_EXPORT_MAX_ZIP_BYTES=104857600
# Version retention (must be >= 1)
LABS_PLAYBOOK_VERSION_RETENTION_COUNT=50
# Optional: empty → server/var/playbook_media under the server package
# LABS_PLAYBOOK_MEDIA_DIR=
```

| Variable | Default meaning |
|----------|-----------------|
| `LABS_PLAYBOOK_ARCHIVE_MIME_ALLOWLIST` | Comma-separated MIME types (images + PDF) |
| `LABS_PLAYBOOK_ARCHIVE_MAX_FILES` | Max attachments per book (40) |
| `LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_FILE` | 5 MiB |
| `LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_BOOK` | 50 MiB |
| `LABS_PLAYBOOK_EXPORT_MAX_ZIP_BYTES` | 100 MiB export ceiling |
| `LABS_PLAYBOOK_VERSION_RETENTION_COUNT` | Keep last 50 versions; **≥1 required** |

---

## Operator steps (staging / MiniTwo / prod)

1. **Pull** `main` (includes migrations 094–095 and `.env.example` block).
2. **Append** the six vars above to the host env (`.env` and/or launchd plist — same places other `LABS_*` live).
3. **Validate config** (from `server/` with env loaded):

   ```bash
   cd server
   set -a && source /path/to/.env && set +a
   .venv/bin/python -c "from config import get_config; get_config(); print('config OK')"
   ```

4. **Preview then apply migrations** (all pending, filename order):

   ```bash
   .venv/bin/python migrate.py --dry-run
   .venv/bin/python migrate.py
   ```

5. **Restart** API (and web if deploying UI) per `infra/deploy.md`.

### About 093 vs 094–095

| File | Role |
|------|------|
| `093_practice_playbook_campaign.sql` | Book root + campaigns + trade/journal FKs |
| `094_playbook_scrapbook.sql` | Chapters, pages, stickies, archive, evidence, versions |
| `095_playbook_scrapbook_schema_sync.sql` | Cover FK + evidence object index |

- If **093 is already applied**, dry-run will only show 094/095 (or nothing if all applied).
- If **093 is pending**, it **must** run first — do not try to skip it. Scrapbook tables assume the book/campaign tables exist.
- The runner **cannot** start at 094 only.

---

## Quick unblock checklist for Claude

```text
[ ] Pull main
[ ] Paste LABS_PLAYBOOK_* block into host .env (and launchd if used)
[ ] python -c "from config import get_config; get_config()" → config OK
[ ] migrate.py --dry-run → note pending list
[ ] migrate.py → apply
[ ] Restart API / web
[ ] Hit /api/health and /app/playbook
```

---

## Local dev (reference)

On the primary dev machine these are already in `.env` and migrations **093–095 are applied** (`No pending migrations` on dry-run). Staging/prod still need the env paste + migrate if not yet done.
