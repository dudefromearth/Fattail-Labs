# Member Wiki Spec v0.1 vs current implementation

**Date:** 2026-08-22  
**Spec compared:** [`Specs/FatTail-Labs-Member-Wiki-Spec-v0_1.md`](../Specs/FatTail-Labs-Member-Wiki-Spec-v0_1.md)  
(byte-identical to `Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md` — the original July draft.)  
**UI companion:** [`Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md`](../Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md) (this spec says the interface spec wins for UI).  
**Code:** as-built after **DL-545** (`f1a96a3`) — Member Wiki restored; git is the only writer of pages.  
**As-built design note:** [`Architecture/11-wiki-design.md`](../Architecture/11-wiki-design.md) (2026-07-27 spine).

This is a comparison report, not a fix.

---

## Verdict in one paragraph

The **W1 spine** in the spec is largely what members use today: lab-wiki git is the content store, MySQL is a derived FULLTEXT index, `/app/wiki` is search-first with Start here / New this week, articles render markdown + `[[wikilinks]]` + backlinks, search and graph and ⌘K exist, drafts 404 for members, `LABS_WIKI_ROOT` fails loud at boot, reindex rebuilds the index from the checkout. The **rest of the spec is not implemented**: no `corpus_items` / transcripts / related-content engine, no compiler writing pages into git, no Hotel-gated board→published wiki loop, no “In your practice” rail, no in-place page editing, no hover previews. IKI compile tables/APIs still exist in the server but **do not write the wiki** and **are not on `/app/wiki`**.

---

## 1. Content store (spec §3.0) — **faithful**

| Spec | Implementation |
|------|----------------|
| SoR = `dudefromearth/lab-wiki` git repo | Checkout at `LABS_WIKI_ROOT` (`/Users/ernie/lab-wiki`). Pages under `wiki/{topics,concepts,recaps,glossary,sources}/`. |
| MySQL is derived, never authoritative for page bytes | `wiki_pages_idx` + `wiki_links_idx` (migration **035**). Oscar publish **does not** upsert the index (**DL-545**). |
| `LABS_WIKI_ROOT` fail-loud | `wiki_store.wiki_root()` in `create_app()`. |
| Sync tick: pull + reindex | `infra/labwiki-sync.plist` (5 min) + `POST /api/admin/wiki/reindex`. |
| Only `status: published` member-visible | API `status_clause`; drafts 404 for non-admin. |

**Naming drift (not a second store):** the spec’s MySQL tables are named `wiki_pages` and `wiki_links`. As-built names are `wiki_pages_idx` and `wiki_links_idx` to mark them as indexes. Same job.

---

## 2. Domain tables (spec §3.1–3.5)

| Spec table | In MySQL today |
|------------|----------------|
| `corpus_items` | **Missing** |
| `corpus_transcripts` | **Missing** |
| `wiki_pages` | **Not present** — replaced by derived `wiki_pages_idx` (no `authored_by_*`, no `review` status; statuses are `draft` \| `published`) |
| `wiki_refs` | **Missing** — article “Compiled from” uses page frontmatter `sources` strings, not corpus FKs |
| `wiki_links` | **Not present** — derived `wiki_links_idx` (`from_slug`, `to_slug`, `relation=wikilink`, `resolved`) |

Idle IKI overlay (not in this spec’s model): `wiki_compile_candidates`, `wiki_compile_watcher_state` (migration **132**). Not part of the member read path.

---

## 3. Perpetual loop (spec §4)

| Stage | Spec | Code |
|-------|------|------|
| ① Registrar | Nightly sync of lessons / live / resources / YouTube into `corpus_items` | **Not built** |
| ② Transcriber | Captions / Whisper → `corpus_transcripts` | **Not built** |
| ③ Compiler | Oscar drafts pages from transcripts → board | Oscar **charter** exists (`agents/bench/oscar.md`). Compile APIs can mint a **content board** card (`product_line=wiki`). They **do not** write lab-wiki or `wiki_pages_idx`. |
| ④ Human approve | Board `awaiting_approval` → published **flips git page status** (D-11) | Board flow exists for other content. Wiki pages go live by **git frontmatter `published` + reindex**, not by flipping MySQL. |
| ⑤ Related engine | Rescore `wiki_refs` | **Not built** |

MiniTwo wiki **sync** (pull + reindex) is built. MiniTwo **registrar / transcriber / compiler** ticks are not.

---

## 4. Member surfaces

### 4.1 Apps card (interface §1.1)

| Spec | Code |
|------|------|
| Slug `wiki`, `/app/wiki` | Yes |
| Title “Wiki” (D-1) | **Apps card title is `IKI Lab`** (`web/lib/appsCatalog.ts`) |
| Badge `live` after W1 | Fallback status still `soon` (DB row may override) |
| Blurb about compiled map of teaching | Close; IKI-flavored copy |

### 4.2 Entry `/app/wiki` (spec §5.1 · interface §2)

| Spec | Code |
|------|------|
| Search dominant, autofocus, placeholder names corpus | Yes |
| Start here 5–8 **admin-pinned** topics | **No pin table.** Start here = first **8 topics by title** from `wiki_pages_idx` |
| New this week ≤6, hide when empty | Yes (`recent` by `updated_date`) |
| Explore the map → graph | Yes |
| In-place pin / header from `site_pages` | **No** |
| Compile inbox / IKI suite chrome | **Removed** (DL-545) |

Anonymous users get a sign-in card **on the page** (`/login?next=`). Interface spec says unauthenticated hits **redirect** to login. Shared `/app/*` pattern (no hard redirect) — **DL-540** for IKI; wiki matches Options Lab.

### 4.3 Article `/app/wiki/[slug]` (spec §5.2 · interface §3)

| Spec | Code |
|------|------|
| Kind + title + markdown body | Yes (`WikiMarkdown`) |
| `[[wikilinks]]` → links; unresolved muted | Yes |
| Hover preview (~40 words) | **No** |
| Two-column + rail (practice / related / backlinks / local graph) | **Single column.** Backlinks + See also (outbound wikilinks) + sources list if frontmatter has `sources`. No related corpus rail, no local graph, no “In your practice” |
| Provenance “compiled by / approved by” | **No** (updated date lives on the page payload; not rendered as that line) |
| In-place admin edit + `[[` autocomplete | **No** |
| Family B rail | **No** |

### 4.4 Search `/app/wiki/search?q=` (interface §4)

| Spec | Code |
|------|------|
| Pages + **transcripts**, grouped | **Pages only.** No archive/transcript group |
| Title boost, snippet | Yes (~30-word server snippet) |
| Honest empty state | Yes |

### 4.5 Graph `/app/wiki/graph` (spec §5.4)

| Spec | Code |
|------|------|
| Page nodes + wikilink edges | Yes (`WikiGraph`, cap 150) |
| Toggle corpus items (lessons/replays) | **No** |
| Mini graph on article | **No** |

### 4.6 Quick switcher (interface §1.2 · WI8)

⌘K on wiki routes, `/api/wiki/search`, keyboard navigate — **yes**. Corpus items in the palette — **no** (pages only).

---

## 5. Success criteria W1–W11

| # | Spec | As-built |
|---|------|----------|
| **W1** | Every lesson/live/video/resource has `corpus_items` | **No** — table missing |
| **W2** | Transcripts with visible failure | **No** |
| **W3** | Search pages **and** transcripts; deep-link `t=` | **Pages only** |
| **W4** | Related rail updates as corpus lands | **No** |
| **W5** | Agent pages only via board → published | **Not for wiki pages.** Git `status: published` is the member gate. Board cards from idle compile APIs do not publish wiki. |
| **W6** | Hotel guidelines artifact before first agent page | **No** (no agent-compiled git pages) |
| **W7** | No profit-claim copy | Process-outcome framing in UI copy; no compiler output to gate |
| **W8** | Stay-put on admin curation writes | N/A — no in-place wiki writes |
| **W9** | No parallel store of truth; refs to canonical entities | **Git SoR restored (DL-545).** No `wiki_refs` to lessons yet |
| **W10** | Personal layer isolation | **Not built** |
| **W11** | No Family B in compile context | Holds vacuously (compiler does not ingest Family B or write pages) |

---

## 6. Phasing (spec §7) vs shipped

| Phase | Spec ships | Today |
|-------|------------|--------|
| **W1 Spine** | Migrations, apps row, browse + page, admin-authored pages, wikilinks, FULLTEXT, switcher | **Mostly.** Admin authors in **Obsidian/git**, not in-app in-place edit. Derived idx instead of `wiki_pages`. Search/graph/switcher live. |
| **W2 Corpus** | Registrar, transcriber, transcript search, related rail, graph corpus toggle | **Not shipped** |
| **W3 Perpetual** | YouTube poll, compiler + board, Hotel guidelines, daily tick | **Not shipped** as specified. Sync tick ≠ compiler tick. |
| **W4 Personal** | In your practice + reverse links | **Not shipped** |

---

## 7. IKI overlay (not in this spec)

These exist in the tree and are **idle relative to the member wiki**:

- `wiki_compile_candidates` / `wiki_compile_watcher_state`
- `POST /api/wiki/compile-candidates` (+ compile / dismiss)
- Oscar charter + board `product_line=wiki` cards
- IKI Factory / Runner routes (`/app/iki/*`) — separate from `/app/wiki`

They do not render on `/app/wiki` and do not author `wiki_pages_idx`.

---

## 8. What “faithful” means here

If the question is **“is the July Member Wiki spine in the product?”** — **yes**, after DL-545: one git corpus, derived index, search-first `/app/wiki`, articles with wikilinks and backlinks, graph, switcher.

If the question is **“does the implementation satisfy Member Wiki Spec v0.1 as written?”** — **no**. That document is a four-phase system (corpus registry, transcription, compiler, related engine, personal rail). Only the **spine (phase W1)** is as-built, and even that spine uses idx table names, has no in-place editor, and does not pin Start here.

---

*Report only. No code changes in this file.*
