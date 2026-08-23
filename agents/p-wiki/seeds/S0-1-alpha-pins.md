# S0-1 — Pin parse + start_here (Alpha)

**Plan:** Member Wiki v0.1 Full Agent Bench Plan v2.0 · **GO S0**  
**Isolation:** do not run overlay seeds; do not put a compile inbox on `/app/wiki`.

## In scope

Parse frontmatter `pin` (truthy) and `pin_order` (int). Cache on `wiki_pages_idx` at reindex (derived columns, not a pin table). `GET /api/wiki/index` `start_here` = published pinned pages ordered by `pin_order`, cap 8. Empty if none.

## Out of scope

In-place save, hover, corpus, compiler, practice rail.

## Completion

Fixture vault with pins → `start_here` order matches `pin_order`. Member DB not left on a fixture index.
