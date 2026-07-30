# FatTail Labs — Member Practice Portability Spec v1.2

**Status:** **SUPERSEDED for retrospective v0.7.1 portability by v1.3**  
**Supersedes for journal_session shape:** v1.1 silence on Session v0.6  
**See:** [`FatTail-Labs-Member-Practice-Export-Spec-v1.3.md`](./FatTail-Labs-Member-Practice-Export-Spec-v1.3.md)  
**Parents:** Practice Export v1.1 · Journal Session Spec **v0.6** · Tag Manager v0.3 · Privacy v0.1  

---

## 0. What changed from v1.1

| Item | v1.1 | v1.2 |
|------|------|------|
| `journal_session` document | Dual-read sessions; multi-entry per date allowed | **One conversation per date** (Spec v0.6); model_version **1.1** |
| Tags | Optional | **Tag Manager** assignments: `{slug, label}[]` per session |
| Attachments | Not specified | **Captions + metadata** in export; binaries Family B (paths/keys, not public URLs) |
| Purge | Sessions + media + tag assignments | Confirmed: messages, attachments, media files, sessions, date_closures, tag_assignments |

All other v1.1 contracts (additive import only, pack formats, journey rules) **unchanged**.

---

## 1. `fattail.labs.journal_session` document

```json
{
  "format": "fattail.labs.journal_session",
  "model_version": "1.1",
  "entries": [
    {
      "id": "js-…",
      "journal_date": "YYYY-MM-DD",
      "session_started_at": "…",
      "status": "open|closed",
      "tag": null,
      "tags": [{ "slug": "…", "label": "…" }],
      "structured": {},
      "messages": [
        { "author": "member|agent", "phase": "…", "body_md": "…", "at": "…" }
      ],
      "attachments": [
        {
          "id": "jsa-…",
          "content_type": "image/png",
          "byte_size": 1234,
          "caption_md": "…",
          "created_at": "…"
        }
      ]
    }
  ]
}
```

### 1.1 Cardinality

At most **one entry per `journal_date`** per identity after Session v0.6 (mig 054 UNIQUE).  
Import additive: skip if `export_key` / portable id exists; never invent a second session for the same date.

### 1.2 Attribution

Downstream readers quote **member** `body_md` only for member intent. Agent turns export for fidelity, never as member words.

### 1.3 Tags

Vocabulary is **not** exported as admin CRUD. Assignments only. Import maps slug → active system tag when present; unknown slugs skip (no free-text birth).

### 1.4 Media

Captions export in JSON. Binary restore is best-effort Family B (implementation may include zip paths). **No public CDN URLs.**

---

## 2. Purge (unchanged ownership, explicit inventory)

Practice purge for an identity removes:

- `member_journal_messages`  
- `member_journal_attachments` + private media files  
- `member_journal_sessions`  
- `member_journal_date_closures`  
- `tag_assignments` for that `identity_id`  

Does **not** remove Tag Manager vocabulary (`tags` / `tag_categories`).

---

## 3. Gate

*India · Mike · Alpha · Kilo — export suite + purge isolation.*

---

## 4. Document history

| Date | Note |
|------|------|
| 2026-07-30 | v1.2 — Journal Session v0.6 portability honesty |
