# Seed JS1-1-alpha-schema — Alpha: Migrations

**Project:** p-journal-session  
**Primary:** Alpha  
**Reviewers:** Mike · India  
**Phase:** J1  
**Prerequisite:** JS0-0 GO  

## Goal

Migration for sessions, messages, date_closures (+ export_key). No media table unless J5 merged.

## Files in scope

- `migrations/049_journal_sessions.sql`  
- `Architecture/00-decision-log.md`  

## Out of scope

Domain/API (JS1-2); dual-read (JS1-3); attachments (J5); UI.

## Invariants

- Spec §14 SoR · Family B · identity_id FK CASCADE · no MSC  
- Attachments **not** in this migration (D4 J5)  
- Messages append-only (no updated_at on messages)  

## Completion criteria

- [x] migrate.py applies; fail loud; India SoR match  
- [x] Reviewers APPROVED  

## Feeds

→ JS1-2  

---

## Evidence (2026-07-30 — Alpha JS1-1 · Mike · India co-sign)

### Verdict: **APPROVED**

### Migration

| Item | Result |
|------|--------|
| File | `migrations/049_journal_sessions.sql` |
| Tables | `member_journal_sessions`, `member_journal_messages`, `member_journal_date_closures` |
| Attachments | **Omitted** (J5 · D4) — Spec-allowed |
| Dry-run | `would apply: 049_journal_sessions.sql` |
| Apply | `applied: 049_journal_sessions.sql` |
| Second dry-run | `No pending migrations.` |

### Spec §14 SoR match

| Spec | Implemented |
|------|-------------|
| sessions: identity_id, tag, journal_date, session_started_at DATETIME(6), status, structured_json, export_key, spawned_retrospective_id | **Yes** |
| UNIQUE (identity_id, export_key) | `uq_mjs_export` |
| KEY owner+date / started / status | **Yes** |
| messages: session_id, identity_id, author, agent_service, body_md, phase, created_at DATETIME(6) | **Yes** · no updated_at (append-only) |
| KEY (session_id, created_at), (identity_id, created_at) | **Yes** |
| date_closures PK (identity_id, journal_date) | **Yes** |
| closed_by_retrospective_id FK | **ON DELETE SET NULL** — date stays closed if retro removed (Alpha pick per Spec) |
| FKs identity CASCADE | **Yes** |

### India co-sign

Schema matches §14 JS1-1 SoR. No attachments table. No domain drift. Product boundary OK.

### Mike co-sign

Isolation key `identity_id` on all three tables; CASCADE delete with identity. `agent_service` column present for D7. No public media path. export_key unique per owner for D9 additive import.

### Command evidence

```
$ cd server && source ../.env && .venv/bin/python migrate.py --dry-run
would apply: 049_journal_sessions.sql

$ .venv/bin/python migrate.py
applied: 049_journal_sessions.sql

$ .venv/bin/python migrate.py --dry-run
No pending migrations.
```

SHOW CREATE TABLE confirmed all three tables live on dev DB (2026-07-30).
