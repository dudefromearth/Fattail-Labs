# Wiki index empty vs checkout — finding

**Date:** 2026-08-22  
**Status:** evidence only. Not a fix.  
**Board:** `agents/p-wiki-v12/` (Wiki Spec v1.2 W0/W1)  
**Pre-W0 SHA:** `9b7a1ed` · **HEAD at capture:** `3d82ce3`

**Verdict:** Content is on disk. It is not in the derived index the UI reads. The API is telling the truth about an almost-empty index. This is not a CSS/hide bug.

---

## 1. Checkout vs MySQL

**lab-wiki** (`LABS_WIKI_ROOT=/Users/ernie/lab-wiki`)

```
git -C /Users/ernie/lab-wiki log --oneline -5
9468600 Publish starter wiki set for member visibility
6fdfd58 fix(scripts): commit before pull --rebase in wiki-sync
0bf9939 compile: position sizing guide (PDF) -> topic + source + glossary
437f364 compile: first bulk compile — 43 docs -> 78 map pages (drafts)
fbeef13 chore(wiki): daily-compile 2026-07-27
```

Checkout listing (top level): `.git`, `AGENTS.md`, `HOW-IT-WORKS.md`, `README.md`, `agents/`, `docs/`, `inbox/`, `raw/`, `scripts/`, `wiki/`.

`wiki/` contains `concepts/`, `glossary/`, `index.md`, `log.md`, `recaps/`, `sources/`, `topics/`.

Checkout has **88** `wiki/**/*.md` files:

| dir | md count |
|-----|----------:|
| topics | 12 |
| glossary | 38 |
| sources | 33 |
| concepts | 3 |
| wiki (index.md, log.md) | 2 |

Concepts on disk: `convexity-and-asymmetry.md`, `distribution-of-returns.md`, `iki.md`.

### MySQL (exact queries asked)

```
SELECT COUNT(*) FROM wiki_pages;
ERROR 1146 (42S02): Table 'labs.wiki_pages' doesn't exist

SELECT COUNT(*) FROM corpus_items;
ERROR 1146 (42S02): Table 'labs.corpus_items' doesn't exist
```

Those tables were never as-built. The read path uses `wiki_pages_idx`.

### As-built index at capture

| table | count |
|-------|------:|
| `wiki_pages_idx` | **1** |
| `wiki_links_idx` | **0** |

The only row:

| slug | title | kind | status | path |
|------|-------|------|--------|------|
| `compiled-iki-runner` | IKI Runner | concept | published | `wiki/concepts/compiled-iki-runner.md` |

That path is the **W1 test stub**, not a lab-wiki page. It is **not** in the checkout concepts listing above.

---

## 2. W0/W1 touch on the wiki read path

```
git diff --stat 9b7a1ed HEAD -- web/app/app/wiki/ server/ migrations/
 migrations/132_wiki_compile_candidates.sql |  62 ++++++
 server/board.py                            |  69 +++++--
 server/routes/wiki.py                      | 125 +++++++++++-
 server/tests/test_wiki_compile_w1.py       | 210 ++++++++++++++++++++
 server/tests/test_wiki_compile_watcher.py  | 220 +++++++++++++++++++++
 server/wiki_compile_oscar.py               | 158 +++++++++++++++
 server/wiki_compile_store.py               | 298 +++++++++++++++++++++++++++++
 server/wiki_compile_surfaces.py            |  91 +++++++++
 server/wiki_compile_watcher.py             | 119 ++++++++++++
 web/app/app/wiki/layout.tsx                |   7 +-
 web/app/app/wiki/page.tsx                  | 117 +++++++++++
```

### Read-path files that changed

| File | Role | What changed |
|------|------|----------------|
| `web/app/app/wiki/page.tsx` | entry / search / Start here / recent | **Additive:** compile inbox. Search form and Start here / recent still bind `/api/wiki/index`. |
| `web/app/app/wiki/layout.tsx` | wrap every wiki route | Children still render; wrapper is now `IkiSuiteChrome`. |
| `server/routes/wiki.py` | index, page, search, graph | **Index handler was edited:** Start here prefers slug `iki`, then topics. **Search / page / graph handlers were not rewritten.** Compile APIs appended. |
| `web/app/app/wiki/[slug]/page.tsx` | article render | **Unchanged** in `9b7a1ed..HEAD`. |

Unchanged (not in that diff): `server/wiki_store.py` (reindex / parse).

The index-handler tweak cannot hide 88 pages by itself. With **one** indexed row (`compiled-iki-runner`, kind `concept`, not `topic`, not slug `iki`), Start here is empty and recent shows that one stub. That matches the API.

**Likely wipe (not a UI hide):** `wiki_store.reindex` does `DELETE FROM wiki_pages_idx` then rebuilds from the checkout it is given. W1 `test_at_wk13_publish_files_stub` monkeypatches `LABS_WIKI_ROOT` to a temp vault and `on_board_published` calls `reindex` on the **dev DB**. That would replace the real index with the stub-only fixture.

---

## 3. Migrations vs existing wiki tables

Exact glob:

```
grep -n -i "wiki_pages\|corpus_items\|wiki_refs\|DROP\|ALTER" migrations/*wiki*.sql
```

```
migrations/035_wiki_index.sql:5:CREATE TABLE IF NOT EXISTS wiki_pages_idx (
migrations/035_wiki_index.sql:20:  FULLTEXT KEY ft_wiki_pages (title, body_md)
migrations/035_wiki_index.sql:28:  ... wiki_pages_idx
```

Wiki-named migration files: `034_wiki_replaces_vexy_app.sql`, `035_wiki_index.sql`, `132_wiki_compile_candidates.sql`.

`migrations/132_wiki_compile_candidates.sql` (W0): **no** `DROP`/`ALTER` of `wiki_pages`, `wiki_pages_idx`, `corpus_items`, or `wiki_refs`. It only **creates** `wiki_compile_candidates` and `wiki_compile_watcher_state`.

No W0/W1 migration dropped or altered an existing wiki table.

---

## 4. API (as-built, 2026-08-22)

Unauthenticated:

```
GET /api/wiki/index  status=401  bytes=29
{"detail":"Sign in required"}
```

Administrator session (`identity_id=0` internal):

```
GET /api/wiki/index     status=200  bytes=199
  kinds: {concept: 1}
  start_here: []
  recent: [{slug: compiled-iki-runner, title: IKI Runner, ...}]
  admin: true

GET /api/wiki/search?q=capital  status=200  bytes=32
  results: []

GET /api/wiki/graph  status=200  bytes=91
  nodes: 1 (compiled-iki-runner)  edges: 0
```

The API is returning pages. It is returning the **index as it is now**: one W1 stub, not the 88 checkout files.

---

## Verdict

Not a CSS/hide bug. Checkout still has the corpus. `wiki_pages` / `corpus_items` do not exist (never did). `wiki_pages_idx` holds one published stub from W1 publish/reindex. The member wiki is empty because the derived index no longer matches the checkout.
