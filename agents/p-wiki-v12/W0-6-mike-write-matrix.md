# W0-6 — Write matrix (W0 slice)

**Date:** 2026-08-22  
**Agent:** Mike  
**Depends:** W0-1  
**Feeds:** W0-G

W0 writers only. Full Wiki Spec §8 remains law; this page names what W0 may actually execute.

| Writer | May write (W0) | May not (W0) |
|--------|----------------|--------------|
| Deploy watcher stub (code) | `wiki_compile_watcher_state.last_sha` + `recorded_at` | `wiki_compile_candidates` rows; disposition; corpus; help; pages; Family B; any model call |
| Oscar — proposer / compiler / filer | nothing (not seated to run in W0) | identity, disposition, drafts, `content_items`, `corpus_items` |
| Administrator (inbox) | nothing (region is read-only) | Compile / Dismiss / chooser (W1) |
| Board | nothing this slice | candidate table |

**Named error:** if the stub's first SHA would leave `COUNT(*)` on `wiki_compile_candidates` ≠ 0, raise `WikiCompileWatcherError`: `first SHA is a snapshot: must not write candidate rows (AT-WK5)`. Transaction rolls back so last SHA is not recorded either.

No compile/dismiss API in W0. No new roles. AT-WA3 capture is W1.
