# TD0 progress (not Delta gate)

**Date:** 2026-08-07  
**Status:** Implementation landed for Phase 0 core; formal **TD0-G** pending full acceptance walk  

## Landed

| Item | Evidence |
|------|----------|
| BUILD AUTHORITY | DL-254 · Spec headers |
| Story strip progressive | `PracticeStoryStrip` on Practice suite chrome + Journey |
| Trade sheet tags | `TagPicker` on process block (edit mode) |
| Journal lexicon link | `JournalTagsControl` empty/help copy |
| Process tag usage API | `GET /api/me/tags/usage` · `tag_domain.process_tag_usage` |
| Reports process labels | `ProcessTagUsage` on Reports dashboard |
| Playbook stub copy | Character framing |
| Tests | `test_process_tag_usage_counts_and_isolation` + export pack smoke |

## Still for TD0-G formal

- [ ] UI walk: assign/unassign trade tag without leaving sheet  
- [ ] UI walk: Reports empty state for zero tags  
- [ ] Blotter tag chips (optional stretch — Spec wants density; sheet is primary)  
- [ ] Full export suite if desired beyond pack smoke  

## Unlock

When Delta files **TD0-G PASS**, board NEXT = TD1 (Playbook + Campaign).
