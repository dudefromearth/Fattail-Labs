# Tag Manager v0.2 two-tier land (partial program PASS)

**Date:** 2026-07-30  
**Spec:** `Specs/FatTail-Labs-Tag-Manager-Spec-v0.2_1.md` (DRAFT dropped)  
**As-built prior:** Spec v0.3 / DL-159 (admin lexicon only)

## Evaluation (summary)

| Topic | Finding |
|-------|---------|
| Product direction | Two-tier (lexicon + personal vocab) is coherent and better for trader language + Family B |
| Conflict | **Reverses** DL-159 / v0.3 Coach locks (no personal tags, no auto-create, no `/me` tags) |
| Doctrine | No MSC code; no P&L on tags — preserved |
| §9a | Resources **Tags** browse + own usage — shipped this land |
| Still open | §13 items (MSC HTTP?, state categories, course↔tag teaching) |

## Implemented this land

| Item | Detail |
|------|--------|
| mig **058** | `tags.lexicon_key`; `member_tag_categories`; `member_tags`; `tag_assignments.member_tag_id` |
| Seed | Personal vocab seeded from platform lexicon on first `/api/me/tags` |
| Resolve-or-create | `POST /api/me/tags/resolve` + near-dup hints (non-blocking) |
| Adopt | `POST /api/me/tags/adopt` by `lexicon_key` |
| Assign | Family B prefers `member_tag_ids` on PUT `/api/tags/assignments` |
| Journal UI | Free-text add + personal picker |
| Resources | Pill **Tags** (was Lexicon); category chips; sort; own usage counts |
| Purge | Removes member tags + categories; lexicon untouched |

## Tests

```
pytest tests/test_tags.py tests/test_tag_personal_vocab.py -q  # 13 passed
```

## Not yet (follow-on)

- Full `/me` vocabulary CRUD (rename/merge/retire UI)
- Member category create
- Full assignment migration of all legacy platform-tag journal rows to member_tag_id
- Spec rename v0.2_1 → official BUILD + DL superseding DL-159
