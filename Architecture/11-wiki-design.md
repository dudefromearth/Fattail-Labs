# Member Wiki Design — FatTail Labs

**Status:** As-built (2026-08-23, p-wiki W1 + S0)
**Specs:** `Specs/FatTail-Labs-Member-Wiki-Spec-v0_1.md` (system) ·
`Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md` (surfaces + §8.1 runbook)
**Program:** `agents/p-wiki/` (charter, plan v2.0 GO S0, seeds, gate reports)
**DLs:** WIK-D1 · **DL-545** (git-only writer) · **DL-546** (S0 pins + rail shell)

---

## 1. The two-store split (deliberate, WIK-D1)

```
git repo: dudefromearth/lab-wiki          MySQL `labs`
┌─────────────────────────────┐           ┌──────────────────────────────┐
│ SYSTEM OF RECORD (content)  │  reindex  │ DERIVED INDEX (rebuildable)  │
│ wiki/{topics,concepts,      │ ────────► │ wiki_pages_idx  (FULLTEXT +  │
│   recaps,glossary,sources}/ │           │   pin / provenance cache)    │
│ *.md — frontmatter +        │           │ wiki_links_idx  (wikilinks)  │
│ [[wikilinks]] + pin:        │           │ migrations 035, 133          │
│ authored by humans (Obsidian)                        │
│ + lab-wiki bench agents     │                        ▼
└─────────────────────────────┘           FastAPI /api/wiki/* → Next /app/wiki
```

*Content* lives in git (like `Specs/` itself); *state/derived data* in MySQL.
`LABS_WIKI_ROOT` points at the checkout; the API **aborts boot** without a valid
one (`wiki_store.wiki_root()`, called in `create_app`).

**Store law (Coach 2026-08-23):** git is the only writer of page bytes. Every
`LABS_WIKI_ROOT` checkout has the same bytes. Admin save (S1) and compiler drafts
(S5) commit and land on the remote; other hosts **pull**. **D-12 pull + reindex
is load-bearing** — that is how a host’s MySQL cache tracks git. Pins live in
frontmatter (`pin: true`, integer `pin_order`); reindex derives Start here.
**No pin table.** MySQL is a cache of that checkout, never a fork:
`wiki_pages_idx` / `wiki_links_idx` change only via
`wiki_store.reindex(conn, wiki_root())` on **that** checkout. Tests must restore
the real `LABS_WIKI_ROOT` after any fixture reindex.

## 2. Backend

| Piece | File | Notes |
|---|---|---|
| Reader/parser | `server/wiki_store.py` | Frontmatter (flat keys incl. `pin` / `pin_order` / `compiled_by` / `approved_by`), `[[slug]]`/`[[slug\|label]]`, tolerant per-file (bad file = warning, never batch failure) |
| Reindex | `wiki_store.reindex(conn, root)` | Idempotent full rebuild, one transaction; returns counts |
| Routes | `server/routes/wiki.py` | index · pages/{slug} · search?q= · graph · admin/reindex |
| Auth | member session for reads; **drafts 404 for members, visible to admin** (WIK-D2); reindex = human admin OR agent key with `wiki:reindex` |
| Search | MySQL FULLTEXT (title, body_md), title-hit boost, recency tiebreak, ~30-word server-side snippets |
| Start here | `GET /api/wiki/index` `start_here` | Published rows with `pin=1`, ordered by `pin_order`, cap 8. Empty if the checkout has no pins — do not invent pins in MySQL |
| Tests | `server/tests/test_wiki_store.py`, `test_wiki_api.py`, `test_wiki_pins.py` | Fixture vaults; restores real index at teardown |

## 3. Frontend (`web/app/app/wiki/`)

| Surface | Route | Data |
|---|---|---|
| Entry | `/app/wiki` | `/api/wiki/index` — Start here (**git pins**, cap 8; honest copy if none), New this week (recent ≤6, hides when empty) |
| Article | `/app/wiki/[slug]` | `/api/wiki/pages/{slug}` — WikiMarkdown (wikilinks → links; unresolved → muted spans), kind + title, Compiled from, provenance from frontmatter when present; rail shell: In your practice / Related (hide empty) / Linked from / See also. Desktop two-column; mobile collapsed accordions |
| Search | `/app/wiki/search?q=` | grouped results + snippets; honest empty state |
| Graph | `/app/wiki/graph` | dependency-free SVG (polar clusters by kind, cap 150 nodes) + alphabetical list fallback |
| Switcher | all wiki routes (`layout.tsx`) | ⌘K/Ctrl-K palette over `/api/wiki/search` |
| Suite chrome | all wiki routes (`layout.tsx`) | `IkiSuiteChrome` — Wiki · Factory · Runner. Compile inbox **off**. Factory/Runner pages are not this tree (**DL-547**) |

Components: `web/components/wiki/{WikiMarkdown,WikiSwitcher,WikiGraph,WikiArticleRail}.tsx` —
registered per Application Framework D2 (Interface spec §6). No compile inbox on
these routes (**DL-545**). Suite nav stays (**DL-547**). Apps-card title waits on **D-1**.

## 4. Content flow (publish path)

```
author/agent writes md (status: draft) → Coach flips status: published
  → git push (lab-wiki) → MiniTwo tick: pull --ff-only + POST reindex
  → members see it at labs.fattail.ai/app/wiki
```

Sync tick: `infra/labwiki-sync.plist` (5-min), documented in `infra/deploy.md`.
Stale-beats-broken: failed pull/reindex logs loudly; previous index keeps serving.

## 5. Deferred (parent-spec phases / later S-slices)

Admin in-place save → git + remote (S1, WI9) · wikilink hover preview (S1, WI3) ·
`corpus_items` + registrar (S2) · transcriber (S3, D-5) · related engine (S4) ·
compiler drafts in git (S5, D-11) · In your practice fill (S6, Mike). Ask mode
(D-i1) · public/SEO surface · embeddings (D-4). Hover and save are **not** S0.
