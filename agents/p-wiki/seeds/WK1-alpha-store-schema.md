# Seed WK1 — Alpha: Wiki store (checkout reader) + derived-index schema

**Project:** p-wiki · **Agent:** Alpha (+ Kilo tests) · **Prerequisite:** WK0

## Files in scope

- `migrations/035_wiki_index.sql` (new; next free number — verify)
- `server/wiki_store.py` (new)
- `server/config.py` (add `LABS_WIKI_ROOT` — required, fail-loud)
- `server/tests/test_wiki_store.py` (new)
- `Architecture/04-domain-data-model.md` (migration row)

## Out of scope

- HTTP routes (WK2) · frontend · transcripts/corpus tables (parent W2)

## Work

1. **Schema (derived index only — WIK-D1):**
   - `wiki_pages_idx`: slug (uniq), title, kind, status, body_md (LONGTEXT),
     tags_json, sources_json, updated_at, indexed_at; FULLTEXT(title, body_md)
   - `wiki_links_idx`: from_slug, to_slug, relation ('wikilink'), resolved (bool)
2. **`wiki_store.py`:**
   - `load_pages(root)` — walk `wiki/{topics,concepts,recaps,glossary,sources}/*.md`;
     parse frontmatter (title, kind, status, tags, sources, updated); tolerate
     missing fields with loud per-file warnings, never crash the batch
   - `parse_wikilinks(body)` — `[[slug]]` and `[[slug|label]]` → targets
   - `reindex(conn, root)` — idempotent full rebuild in a transaction; returns
     `{pages, links, unresolved, skipped}`
   - Config: root must exist and contain `wiki/index.md`, else raise (WIK-D4)
3. **Tests (Kilo style):** fixture mini-vault in test tmpdir — frontmatter variants,
   draft vs published, unresolved wikilink, pipe-labeled link, re-run idempotency.

## Completion

- [ ] `migrate.py` applies 035 (dry-run output pasted)
- [ ] `pytest server/tests/test_wiki_store.py -q` green (output pasted)
- [ ] Reindex against the real `/Users/ernie/lab-wiki` returns counts matching
      `find … -name '*.md' | wc -l` (both pasted)
- [ ] Boot with unset `LABS_WIKI_ROOT` aborts loudly (output pasted)
