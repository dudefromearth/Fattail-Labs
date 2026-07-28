# Member Wiki Design — FatTail Labs

**Status:** As-built (2026-07-27, p-wiki W1)
**Specs:** `Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md` (system) ·
`Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md` (surfaces + §8.1 runbook)
**Program:** `agents/p-wiki/` (charter, plan, seeds, gate reports)

---

## 1. The two-store split (deliberate, WIK-D1)

```
git repo: dudefromearth/lab-wiki          MySQL `labs`
┌─────────────────────────────┐           ┌──────────────────────────────┐
│ SYSTEM OF RECORD (content)  │  reindex  │ DERIVED INDEX (rebuildable)  │
│ wiki/{topics,concepts,      │ ────────► │ wiki_pages_idx  (FULLTEXT)   │
│   recaps,glossary,sources}/ │           │ wiki_links_idx  (wikilinks)  │
│ *.md — frontmatter +        │           │ migration 035                │
│ [[wikilinks]]               │           └──────────────────────────────┘
│ authored by humans (Obsidian)                        │
│ + lab-wiki bench agents     │                        ▼
└─────────────────────────────┘           FastAPI /api/wiki/* → Next /app/wiki
```

*Content* lives in git (like `Specs/` itself); *state/derived data* in MySQL.
`LABS_WIKI_ROOT` points at the checkout; the API **aborts boot** without a valid
one (`wiki_store.wiki_root()`, called in `create_app`).

## 2. Backend

| Piece | File | Notes |
|---|---|---|
| Reader/parser | `server/wiki_store.py` | Frontmatter (flat keys), `[[slug]]`/`[[slug\|label]]`, tolerant per-file (bad file = warning, never batch failure) |
| Reindex | `wiki_store.reindex(conn, root)` | Idempotent full rebuild, one transaction; returns counts |
| Routes | `server/routes/wiki.py` | index · pages/{slug} · search?q= · graph · admin/reindex |
| Auth | member session for reads; **drafts 404 for members, visible to admin** (WIK-D2); reindex = human admin OR agent key with `wiki:reindex` |
| Search | MySQL FULLTEXT (title, body_md), title-hit boost, recency tiebreak, ~30-word server-side snippets |
| Tests | `server/tests/test_wiki_store.py`, `test_wiki_api.py` | Fixture vaults; restores real index at teardown |

## 3. Frontend (`web/app/app/wiki/`)

| Surface | Route | Data |
|---|---|---|
| Entry | `/app/wiki` | `/api/wiki/index` — Start here (topics ≤8), New this week (recent ≤6, hides when empty) |
| Article | `/app/wiki/[slug]` | `/api/wiki/pages/{slug}` — WikiMarkdown (wikilinks → links; unresolved → muted spans), Compiled from, Linked from (backlinks), See also, provenance |
| Search | `/app/wiki/search?q=` | grouped results + snippets; honest empty state |
| Graph | `/app/wiki/graph` | dependency-free SVG (polar clusters by kind, cap 150 nodes) + alphabetical list fallback |
| Switcher | all wiki routes (`layout.tsx`) | ⌘K/Ctrl-K palette over `/api/wiki/search` |

Components: `web/components/wiki/{WikiMarkdown,WikiSwitcher,WikiGraph}.tsx` —
registered per Application Framework D2 (Interface spec §6).

## 4. Content flow (publish path)

```
author/agent writes md (status: draft) → Coach flips status: published
  → git push (lab-wiki) → MiniTwo tick: pull --ff-only + POST reindex
  → members see it at labs.fattail.ai/app/wiki
```

Sync tick: `infra/labwiki-sync.plist` (5-min), documented in `infra/deploy.md`.
Stale-beats-broken: failed pull/reindex logs loudly; previous index keeps serving.

## 5. Deferred (parent-spec phases)

Transcript corpus + timestamp search (W2) · compiler agent via board (W3) ·
personal "In your practice" rail (W4, Mike gate) · Ask mode (D-i1) · public/SEO
surface · embeddings (D-4).
