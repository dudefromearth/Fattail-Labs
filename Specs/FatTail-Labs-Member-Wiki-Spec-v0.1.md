# FatTail Labs — Member Wiki (Knowledge Base) Spec v0.1

> **SUPERSEDED (DL-555).** Spec of record is
> [`FatTail-Labs-Wiki-Spec-v0_2_1.md`](./FatTail-Labs-Wiki-Spec-v0_2_1.md)
> (Wiki Spec v0.2.1 APPROVED). This file is frozen so historical gates and DL
> citations still resolve. Do not implement from this document. Banner-only.

**Status:** SUPERSEDED — see banner. Historical DRAFT body below is frozen.
**Product:** FatTail Labs (`labs.fattail.ai`)
**Purpose:** Member-facing knowledge base app at `/app/wiki` — a compiled, perpetually
maintained map of the entire FatTail content corpus (courses, daily live streams,
historical videos, resources), with search and always-fresh related-content links.  
**Door rename (DRAFT):** member-facing Apps card **IKI Lab** — [`FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md`](./FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md) · **DL-527**. This file remains the Lab engine.
**Framework home:** Application Framework v1.0 (this is a new L4 template + new L0 domain,
constructed per Part D1).
**Domain authority:** this spec (wiki + corpus data model). Canonical content entities
(courses, lessons, live_sessions, resources) keep their existing domain specs.
**Doctrine:** `agents/bench/doctrine.md` — config fail-loud, no parallel store of truth,
process outcomes only, documentation parity.

**Reviewers (PENDING until Coach schedules):**

| Gate | Reviewer | Concern |
|---|---|---|
| Architecture / boundary | **India** | New domain tables; refs point at canonical entities; no second store of truth |
| Auth / entitlements | **Mike** | Member gating; agent write authority; YouTube/transcription secrets |
| SEO / AEO | **Sierra** | v1 is member-gated (no SEO surface); public teaser subset is a v2 decision |
| Design + member psychology | **Echo + Tango** | Browse/search/related UX; capacity-over-dependency framing |
| Trading-education accuracy | **Hotel** | **Mandatory** — agent-compiled pages summarize trading content; blocks false/reckless claims |
| Evidence | **Delta** | Phase-end gates |
| Approver | **Coach** | Ship / scope / naming |

---

## 0. One-paragraph standard

> The Member Wiki is a **compiled knowledge layer** over the FatTail content corpus. A
> corpus registry tracks every knowledge source — lessons, live-stream replays, historical
> YouTube videos, resources — and a transcription pipeline turns media into searchable
> text. Bench agents **compile** wiki pages from that corpus (Karpathy LLM-wiki pattern:
> persistent compiled map, not re-retrieval), and a **perpetual related-content loop**
> re-links pages to new material as it lands — every daily live stream makes the wiki
> smarter. Members browse, search, and jump from any wiki page straight into the lesson,
> replay, or video that teaches it. Agent-compiled pages reach members **only through
> human approval** (content board), and Hotel gates trading accuracy. The wiki stores
> compiled pages and derived transcripts; it never forks canonical content — links point
> home.

---

## 1. Intent & success criteria

### 1.1 Goals (Coach, 2026-07-27)

1. A wiki for the FatTail membership, hosted on the Labs **apps surface** (`/app`).
2. Connected to **all content**: daily live streams, historical content, videos, courses.
3. In **perpetual search** for related content and ideas — the map keeps improving
   without manual effort.
4. Connected to the content and data members create with their apps — Journey, Trade
   Log, Journal, Playbook — **as a private, per-member layer** (see §5.3; governed by
   Member-Data-Privacy v0.1).

### 1.2 Success criteria

| # | Criterion |
|---|---|
| W1 | Every published lesson, live session, registered video, and resource has a `corpus_items` row; nightly registrar keeps parity. |
| W2 | Media corpus items gain transcripts (captions or Whisper) with per-item status; failures are visible, never silent. |
| W3 | Members can full-text search wiki pages **and** transcripts; results deep-link to source (lesson URL, replay timestamp). |
| W4 | Each wiki page shows a related-content rail (lessons, replays, videos, resources, sibling pages) that updates as new corpus lands. |
| W5 | Agent-compiled pages flow through the content board: `awaiting_approval` → human approve → published. No agent-direct publish. |
| W6 | Hotel-gate evidence exists for the compilation prompt/guidelines before the first agent-compiled page ships. |
| W7 | Wiki pages carry no profit-claim copy (process outcomes only), including agent-compiled summaries. |
| W8 | Stay-put invariant holds for all admin curation writes (Application Framework Part A4). |
| W9 | No parallel store of truth: wiki refs resolve to canonical entities; deleting canonical content orphans the ref visibly (lint), it never copies content. |
| W10 | Personal layer (§5.3) is member-isolated: two distinct members proven unable to see each other's matches (Privacy §11 evidence style). |
| W11 | **No raw Family B content ever enters agent compilation context, transcripts, or shared wiki pages.** Shared surfaces may use only de-identified aggregates per Member-Data-Privacy §4.1 (cohort floors). |

---

## 2. Position in the platform

| Aspect | Decision |
|---|---|
| Surface | `/app/wiki` — new `apps` row (slug `wiki`, status `soon` → `live`) |
| Family | **A-variant**: shared content, admin + **agent** authored, member-consumed. Not Family B (nothing member-private). |
| Actor (write) | `administrator` (in-place curation) + agent principals via existing agent API keys (compilation, board-gated) |
| Actor (read) | **Wide open by default** (Coach 2026-08-23 · **DL-551**). D-3 dissolved. As-built `/app/wiki` still member-session until **WA-6** (public read surface; defined, not stamped; Coach stamps timing). Drafts 404 for anyone who is not an administrator (W5). |
| Visibility | Published wiki contents are wide open by default (**DL-551**). No public read UI in v0.1 as-built (WA-6; Coach stamps timing). Drafts never public. |
| AI runtime | Existing `ai.complete()` gateway (Agent-Model-Interface v1.0) |
| Scheduling | Existing poller pattern (Quebec precedent) — a `wiki-registrar` tick; launchd on MiniTwo |

---

## 3. Domain data model (L0)

### 3.0 Content store — the `lab-wiki` repo (Coach amendment, 2026-07-27)

**System of record for wiki content is a git repo, not MySQL:**
[`dudefromearth/lab-wiki`](https://github.com/dudefromearth/lab-wiki) (private).

| Element | Home |
|---|---|
| Wiki pages (markdown + frontmatter + `[[wikilinks]]`) | `lab-wiki` repo — `wiki/{topics,concepts,recaps,glossary,sources}/` |
| Transcripts (derived text) | `lab-wiki` repo — `raw/transcripts/` |
| Corpus registry state, search index, wikilink graph, related scores | MySQL `labs` — **derived index**, rebuilt from the checkout + canonical entities; never authoritative for page content |

Flow: authors (Obsidian on any machine) and the compiler agent write to the repo →
GitHub → **MiniTwo checkout is the production client** — the Labs server reads it
(`LABS_WIKI_ROOT` env, fail-loud if missing/invalid) and serves `/app/wiki`. A sync
tick pulls and reindexes; only `status: published` frontmatter is member-visible.

India note: this is a deliberate two-store split with a hard boundary — *content* in
git (like `Specs/` itself), *state/derived data* in MySQL. The tables below are
therefore **indexes over the checkout**, except `corpus_items` registry state which
remains MySQL-native.

### 3.1+ Derived tables (MySQL `labs` via `migrations/NNN_*.sql`)

Nothing here duplicates canonical content; transcripts are **derived artifacts** of
canonical media (stored as repo files, indexed here), and wiki pages are **new original
content** (compiled prose) whose bytes live in the repo.

### 3.1 `corpus_items` — the knowledge-source registry

| Column | Notes |
|---|---|
| `id` | PK |
| `kind` | `lesson` \| `live_session` \| `youtube_video` \| `resource` |
| `ref_id` | FK-style id into the canonical table for internal kinds; NULL for external |
| `external_id` | YouTube video id for `youtube_video`; NULL otherwise |
| `title`, `published_at` | Denormalized for listing/scoring only (registrar refreshes; source wins) |
| `transcript_status` | `none` \| `pending` \| `ready` \| `failed` \| `n/a` |
| `status` | `active` \| `orphaned` (canonical ref gone — lint surfaces, humans resolve) |
| `created_at`, `updated_at` | — |

Unique key on (`kind`, `ref_id`, `external_id`).

### 3.2 `corpus_transcripts`

| Column | Notes |
|---|---|
| `corpus_item_id` | PK/FK |
| `source` | `captions` \| `whisper` \| `manual` |
| `text` | LONGTEXT — FULLTEXT indexed |
| `segments_json` | Optional `[{start_s, end_s, text}]` for timestamp deep links |
| `created_at`, `updated_at` | — |

### 3.3 `wiki_pages`

| Column | Notes |
|---|---|
| `id`, `slug` (unique) | — |
| `kind` | `topic` \| `concept` \| `recap` \| `glossary` |
| `title`, `body_md` | Compiled prose; markdown renderer shared with rest of Labs |
| `status` | `draft` \| `review` \| `published` |
| `authored_by_kind` | `admin` \| `agent` |
| `authored_by_id` | identity id or agent principal id |
| `created_at`, `updated_at` | — |

FULLTEXT on (`title`, `body_md`).

### 3.4 `wiki_refs` — page → corpus links (the related-content engine's output)

| Column | Notes |
|---|---|
| `page_id`, `corpus_item_id` | Composite unique |
| `relation` | `source` (page compiled from it) \| `related` (engine-scored) \| `pinned` (admin) |
| `score` | Relevance 0–100 (engine-maintained for `related`; NULL for pinned) |
| `anchor_s` | Optional start-timestamp into media |
| `note` | Optional one-line "why this is related" |

### 3.5 `wiki_links` — page ↔ page

`from_page_id`, `to_page_id`, `relation` (`see-also` | `parent` | `supersedes` | `wikilink`).

**Wikilinks:** `body_md` supports Obsidian-style `[[slug]]` / `[[slug|label]]` syntax.
On save, the server parses body links and syncs `relation='wikilink'` rows (derived,
never hand-edited); the renderer resolves them to `/app/wiki/[slug]`. Unresolved
wikilinks render visibly distinct (the Obsidian "not yet created" affordance) and are
surfaced to admins as page candidates. Backlinks are a query over this table — no extra
storage.

**Search v1:** MySQL FULLTEXT (pages + transcripts), merged and ranked in the API.
**Open decision D-4:** embeddings/vector search is v2; requires infra choice — not in v1.

---

## 4. The perpetual loop (pipeline)

```
        ┌────────────── nightly / on-publish ───────────────┐
        ▼                                                    │
  ①  REGISTRAR  — sync corpus_items from lessons,            │
      live_sessions, resources; poll YouTube channel         │
      (new uploads + historical backfill queue)              │
        ▼                                                    │
  ②  TRANSCRIBER — captions fetch, else Whisper;             │
      corpus_transcripts + status                            │
        ▼                                                    │
  ③  COMPILER (agent) — new/updated transcripts →            │
      draft wiki pages + source refs → content board card    │
      → awaiting_approval                                    │
        ▼                                                    │
  ④  HUMAN APPROVE (board) — Hotel guidelines applied →      │
      page → published                                       │
        ▼                                                    │
  ⑤  RELATED ENGINE — rescore wiki_refs for all published    │
      pages against new corpus; refresh see-also links ──────┘
```

| Stage | Runs as | Notes |
|---|---|---|
| ① Registrar | Scheduled tick (launchd, MiniTwo) | Fail-loud on missing YouTube config; internal sync needs no external config |
| ② Transcriber | Same tick, budget-capped batch | **Open decision D-5:** Whisper local on MiniTwo vs hosted API (cost/quality/load) |
| ③ Compiler | Bench agent via agent API key + `ai.complete()` | **Proposal:** seat the Knowledge Bench archetype **Oscar** (cartographer) in the Labs bench for this app — same compile-the-map charter, product-local scope |
| ④ Approval | Existing content board flow | Reuses `content_items` transitions; no new approval machinery |
| ⑤ Related engine | Same tick | v1 scoring: FULLTEXT relevance + shared-category boosts; deterministic, explainable |

**Daily rhythm:** morning live stream happens → replay registered → transcribed →
recap/topic pages drafted → operator approves from the board (one-click) → every related
wiki page's rail now offers yesterday's stream at the right timestamp.

---

## 5. Member surface (L4 templates)

**Interface authority:**
[`FatTail-Labs-Wiki-Interface-Spec-v0.1.md`](./FatTail-Labs-Wiki-Interface-Spec-v0.1.md)
— entry card (replaces the Vexy slot on `/app`), search-first entry surface, article +
rail layout, search behavior, graph view, component registrations, acceptance tests.
The subsections below remain the summary; where they diverge, the interface spec wins
for UI and this spec wins for data/pipeline.

### 5.1 Wiki Browse — `/app/wiki`

| Slot | Components | Data |
|---|---|---|
| Header | Title, intro (Display text; admin-editable) | site_pages pattern |
| Search | Search box + results list (deep links incl. `t=` timestamps) | search API |
| Topic index | Page cards grouped by kind/category | wiki_pages |
| Fresh | "New this week" rail (recent pages + newly linked corpus) | wiki_refs |

### 5.2 Wiki Page — `/app/wiki/[slug]`

| Slot | Components | Data |
|---|---|---|
| Article | Title + body (markdown; admin in-place editable, Family A path) | wiki_pages |
| Sources | "Compiled from" list (relation=`source`) | wiki_refs |
| Related rail | Lessons / replays / videos / resources (relation=`related`\|`pinned`, score-ordered) | wiki_refs + canonical joins |
| See also | Sibling wiki pages | wiki_links |
| Provenance | "Last updated · compiled by · approved by" line | page + board metadata |
| Backlinks | "Linked from" list (Obsidian-style) | wiki_links (reverse query) |

HIG per Echo; no JSON-LD in v1 (member-gated). Stay-put on all admin edits.

### 5.3 Personal layer — "In your practice" (Family B bridge)

Connects the wiki to what members create in **Journey, Trade Log, Journal, Playbook** —
without ever crossing the privacy boundary.

| Element | Behavior |
|---|---|
| Rail | On a wiki page, an "In your practice" rail shows **the viewing member's own** matching entries: trade-log rows, journal entries, playbook items, journey milestones relevant to the page topic |
| Matching | Computed **server-side at request time under the member's session** — FULLTEXT/keyword match of the member's own rows against the page's terms; nothing precomputed into shared tables |
| Direction (reverse) | Inside Trade Log / Journal / Playbook, entries can surface "Wiki pages about this" links (same matcher, reversed) |
| Isolation | Member sees only their own matches (W10); admin surfaces never include this rail's data |
| Compilation firewall | Stage ③ (compiler) and all shared pages **never** receive raw Family B content (W11); optional aggregate signals for the discovery agent use Member-Data-Privacy §4.1 only (D-8) |
| Framing | Tango-reviewed: the rail reinforces process reflection ("your journal entry on this setup"), never P&L display |

### 5.4 Obsidian-grade interface (Coach requirement)

The wiki looks and behaves like an Obsidian vault, delivered as registered Labs
components:

| Feature | Component (register per Framework Part D2) | Notes |
|---|---|---|
| `[[Wikilinks]]` | Wikilink renderer (extends shared markdown renderer) | §3.5; unresolved links visibly distinct |
| Backlinks | Backlinks list | On every page; reverse `wiki_links` query |
| **Graph view** | Interactive graph component at `/app/wiki/graph` (+ mini local graph per page) | Nodes = wiki pages; edges = wiki_links; toggle to include corpus items (lessons/replays/videos) via wiki_refs. Member-gated; client-rendered |
| Quick switcher | ⌘K / ctrl-K palette | Fuzzy page + corpus search; keyboard-first |
| Hover preview | Link preview card | First lines of target page on hover over any wikilink |
| Admin editing | Existing Family A in-place path | Long text = EditableMarkdown with wikilink autocomplete (`[[` triggers page suggestions) |

Echo owns the visual translation (Labs HIG tokens, not Obsidian's theme); the *behaviors*
above are the contract. No graph-editing (drag-to-link) in v1 — the graph is a reading
instrument.

---

## 6. Doctrine & safety notes

1. **Hotel gate is structural, not optional** — the compiler summarizes trading
   education; compilation guidelines (claims discipline, no certainty language, no
   profit-outcome framing) are a Hotel-signed artifact before stage ③ runs.
2. **No fiction** — pages cite their sources (`wiki_refs` relation=`source`); a claim
   without a source in the corpus doesn't ship.
3. **Process outcomes only** — inherited; applies to agent output verbatim.
4. **Config fail-loud** — `LABS_YOUTUBE_*`, transcription keys: missing = loud abort of
   that stage, never silent skip.
5. **No MSC imports** — YouTube/Whisper integrations live in `server/`, HTTP/API only.
6. **Members are readers** — no member-generated wiki content in v1 (a "suggest an
   improvement" affordance is a v2 candidate, Tango-reviewed).

---

## 7. Phasing (proposal)

| Phase | Ships | Proves |
|---|---|---|
| **W1 — Spine** | Migrations (§3) · apps row · Wiki Browse + Page templates · admin-authored pages with in-place editing · wikilinks + backlinks · FULLTEXT search over pages · quick switcher | W3 (pages), W8, W9 |
| **W2 — Corpus** | Registrar (internal kinds) · transcriber for live replays + lesson videos · transcript search with timestamp deep links · related rail (engine v1) · graph view | W1, W2, W3 (full), W4 |
| **W3 — Perpetual** | YouTube poll + historical backfill · compiler agent + board flow · Hotel guidelines artifact · daily tick on MiniTwo | W5, W6, W7 |
| **W4 — Personal layer** | "In your practice" rail + reverse links in the four member tools (§5.3) — **Mike gate mandatory**; two-member isolation evidence | W10, W11 |

Each phase: spec-parity docs + decision-log entry + Delta gate, same body of work.

---

## 7.1 Per-phase verification (definition of "it worked")

Each phase ends with an executed runbook, outputs captured (repo doctrine: curl it,
read it back, check the UI). The Interface spec §8.1 holds the surface-level runbook;
this table holds the pipeline-level proofs.

| Phase | Proof required before calling it done |
|---|---|
| **W1 — Spine** | `migrate.py --dry-run` clean; API boots with `LABS_WIKI_ROOT` set and **aborts loudly when unset/invalid** (prove both); reindex endpoint returns counts matching `find $LABS_WIKI_ROOT/wiki -name '*.md' \| wc -l` (published only); Interface §8.1 checks WI1/WI3/WI4/WI10/WI11 pass |
| **W2 — Corpus** | `corpus_items` count reconciles with lessons+live_sessions+resources counts (SQL join shown); a transcript lands with `transcript_status: ready` and its text is findable via search with timestamp (WI2); related rail shows engine-scored refs with scores; failure path proven: kill transcription key → status `failed`, visible, not silent |
| **W3 — Perpetual** | Registrar tick runs from launchd (log evidence); a new YouTube upload appears as corpus item within one tick; compiler drafts a page → board card → approve → page `published` and searchable (full loop traced with artifacts); Hotel guidelines doc exists and is referenced by the compiler prompt |
| **W4 — Personal layer** | WI5/WI6 two-member isolation evidence captured (both payloads archived); Mike sign-off recorded in decision log |

A phase without its captured runbook outputs is not shipped, regardless of demo.

## 8. Open decisions (Coach)

| ID | Decision | Proposal |
|---|---|---|
| **D-1** | Member-facing name ("Wiki"? "Knowledge Base"? branded name?) | Coach names; slug `wiki` is stable regardless |
| **D-2** | v1 page seed — start empty, or seed from course descriptions + existing docs? | Seed ~10 topic pages manually in W1 so search/related have substance |
| **D-3** | Entitlement: which plans read the wiki | **DISSOLVED (DL-551).** Advisor assumption, never Coach direction (**DL-552**). Wiki contents wide open by default; restrictions only when Coach names them. Public read surface = WA-6 (unstamped; Coach stamps timing). |
| **D-4** | Vector/embedding search | Defer to v2; FULLTEXT is honest and cheap for v1 corpus size |
| **D-5** | Transcription engine | Whisper local on MiniTwo if load allows; else hosted API with budget cap |
| **D-6** | Historical YouTube backfill scope | Start with last 12 months, then extend; full-channel backfill is a queue, not a blocker |
| **D-7** | Compiler agent seating | Reuse Knowledge Bench archetype **Oscar**, seated product-local in the Labs bench |
| **D-8** | May the discovery agent use **aggregate** Family B signals (e.g. "many members journal about X") to propose new pages? | Yes, but only via Member-Data-Privacy §4.1 endpoints (de-identified, cohort floors); raw content never (W11) |
| **D-9** | Member pinning / private notes on wiki pages | Defer to v2 (would be new Family B data → needs its own data-model addendum per T-A1) |
| **D-10** | Graph view scope | Pages-only by default; corpus toggle; performance-cap nodes at v1 corpus size |
| **D-11** | Approval mechanics for agent-compiled pages | Either GitHub PR review or board card that flips `status: draft → published` on approve; pick one, not both |
| **D-12** | MiniTwo sync cadence | Pull + reindex tick (launchd) every few minutes, plus manual `wiki sync`; webhook push-trigger optional later |

---

## Version history

| Ver | Change |
|---|---|
| **v0.1** | Initial draft — corpus registry, transcription, compiled wiki, perpetual related-content loop, member surface, Obsidian-grade interface (wikilinks/backlinks/graph/switcher), personal Family B layer ("In your practice"), phasing |

---

*DRAFT v0.1 — drafted from Coach intent (2026-07-27). Where this conflicts with the
Application Framework, a domain spec, or the decision log, the source wins and this
draft is the bug.*
