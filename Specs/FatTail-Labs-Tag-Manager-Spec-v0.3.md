# FatTail Labs — Tag Manager Spec v0.3

**Status:** **BUILD AUTHORITY / as-built** — Coach product locks + implementation 2026-07-30  
(DL-159 · `agents/p-tag-manager/` TM7-G PASS)  
**Supersedes:** v0.2 (personal vocabulary tier withdrawn), v0.1  
**Level:** Platform  

---

## 1. Governing idea

> **Admin defines the lexicon. Members label objects from that list. The system never invents labels.**

Tags are a **system-wide resource** controlled by admin CRUD. Members **assign and unassign**  
existing tags only. Tags are **context, never gates** — no access control, no scripts, no agent  
instructions, no required tags, no P&L correlation.

---

## 2. Surfaces

| Surface | Role |
|---------|------|
| `/admin/tags` | Full Tag Manager: create, edit, retire, delete (zero use), merge, usage counts |
| `/resource` hub | **Library** \| **Lexicon** — lexicon is read-only browse/learn |
| Practice / catalog | Shared picker: select existing tags only |
| `/me` | **No** tag manager |

---

## 3. Family boundary

| Layer | Family |
|-------|--------|
| Tag definitions | Platform data |
| Assignment on public object (course, resource, lesson) | Public |
| Assignment on member-owned object (journal_session, trade, …) | **Family B** |

Purge removes member assignments; vocabulary remains. Export includes assignments on member objects.

---

## 4. Schema (as-built)

```
tag_categories  — id, system_key, label, sort_order
tags            — id, slug, label, description, category_id, color, status, merged_into_tag_id
tag_assignments — id, tag_id, object_type, object_id, identity_id, export_key
```

Case-insensitive unique labels. No `member_tags` table.

**object_type (v1):** `course`, `resource`, `lesson`, `journal_session`, `trade`,  
`retrospective`, `playbook_entry`.

---

## 5. APIs (as-built)

| Method | Path | Who |
|--------|------|-----|
| GET | `/api/tags` | Session — active vocabulary |
| GET | `/api/tags/assignments` | Session — by object (Family B scoped) |
| PUT/POST/DELETE | `/api/tags/assignments` | Object write ACL |
| * | `/api/admin/tags` … | Administrator — full CRUD, merge, usage |

---

## 6. Seed vocabulary

Four categories (behavior, context, process, insight) and Spec v0.2 §5 term list seeded in  
migration **053**. Admin may edit thereafter.

---

## 7. Explicitly not in v1

Personal tag ownership · `/me` tags · free-text auto-create · public `/tag/*` SEO pages ·  
P&L/win-rate on tags · gamification · MSC shared code (design ancestry only).

---

## 8. Verification

See `server/tests/test_tags.py` and plan verification list. Non-admin cannot create tags;  
assign rejects retired tags; merge re-points; delete blocked when assignments exist;  
Family B isolation on journal_session assignments.

---

## 9. Decision log

DL-159 — Tag Manager v1 land (admin lexicon).
