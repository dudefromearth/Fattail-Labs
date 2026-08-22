# W0-1 — Candidate table + watcher-state sibling (OD-WK4)

**Project:** Wiki Spec v1.2 · plan v1.1  
**Agent:** India  
**Depends:** Coach GO W0 + OD-WK4  
**Feeds:** W0-2 Alpha · W0-6 Mike · W0-8 Lima

## In scope

Name **two** siblings:

1. `wiki_compile_candidates` — columns from spec §4.2.  
2. Watcher-state sibling for last SHA, e.g. `wiki_compile_watcher_state(last_sha, recorded_at)`. **Not** a candidate row. Storing last SHA in `wiki_compile_candidates` **fails AT-WK5 by construction**.

## Out of scope

Code. Inbox. Course tables. OD-WK1 hook.

## Completion

Written contract Alpha can migrate: both tables, PK, identity uniqueness while `open|compiling`, null SHA for `admin_pointed`, watcher-state has exactly the last SHA.
