# Member Wiki Design — FatTail Labs

**Status:** As-built (2026-08-23, p-wiki W1 + S0 + Wiki Agent WA-1…WA-4)
**Spec of record:** [`Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md`](../Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md)
(**APPROVED** · **DL-555**). Historical: Member Wiki v0.1 · Interface v0.1 ·
Wiki Agent v0.1.3 (SUPERSEDED banners; citations still resolve).
**Program:** `agents/p-wiki/` (plan
[`docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md`](../docs/Wiki-Spec-v0_2_1-Full-Agent-Bench-Plan-v1.0.md))
**DLs:** WIK-D1 · **DL-545** (git-only writer) · **DL-546** (S0 pins) · **DL-548…554**
(Wiki Agent WA-1…4) · **DL-551** (wide open by default) · **DL-552** (access doctrine) ·
**DL-553** (session semantics) · **DL-555** (unified spec seated) ·
**DL-557** (WU-1 ruling B — superseded as a narrowing by **DL-573**) ·
**DL-573** (plane-wide AppChrome mount; original standing-presence intent) ·
**DL-560** (Source Contract; Help Package gone) ·
**DL-562** (SC-0 diffs; S7 finished-only) · **DL-564** (OD-3 skill-delivered; no stub)

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
| Auth | **Published** pages readable without a session (**WU-2** · **DL-558**). **Drafts 404** for anyone who is not an administrator (W5 / unauthenticated 404). Reindex = human admin OR agent key with `wiki:reindex`. |
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

## 6. Wiki Agent portal (WA-1 · DL-548)

Standalone function inbound: `POST/GET /api/wiki-agent/contracts`. Ledger
`wiki_contracts` + `wiki_agent_sources` (migration **134**) is **audit state**, not
page bytes. `kind=session` opens with `sealed_at` NULL (accretion is WA-4). Source
kinds authenticate with agent scope `contracts:deliver` matching the registry
callsign. Session kinds use the admin cookie only. Idle `/api/wiki/compile-*` APIs
are not this portal (**OD-3**). Fixture git commits use
`LABS_WIKI_AGENT_GIT_NAME` / `LABS_WIKI_AGENT_GIT_EMAIL` at commit time (fail loud
in the helper, not at API boot).

**WA-2:** `wiki_pointers` (migration **135**) holds canonical hashes. Pollers GET
course/help catalogs only (`wiki_agent_http.GetOnlyClient`). Oscar discharge
(`wiki_agent_discharge.py`) loads `agents/p-wiki/hotel-agent-draft-guidelines.md`,
writes `status: draft` via git, board `awaiting_approval`. Retired annotates; no
silent delete.

**WA-3:** `wiki_refs` + `wiki_linkage_queue` (migration **136**). Linkage is **built**
here (`wiki_agent_linkage.py`): FULLTEXT + title boost; insert vs suggest via
`LABS_WIKI_LINK_INSERT_THRESHOLD`; reverse pass via
`LABS_WIKI_REVERSE_PASS_THRESHOLD` with one rollup board card and overflow queued
(`LABS_WIKI_REVERSE_PASS_INLINE_CAP`). No embeddings. Member related rail still empty.

**WA-4 (DL-553/554 / GO WA-4):** Session lifecycle on `/api/wiki-agent/contracts`:
open (admin cookie, reject `ftl_ag_`) → accrete while `sealed_at` IS NULL → seal
immutable; follow-on is a new contract referencing the sealed id. First agent
turn cites `{surface, route, entity}`. Session drafts carry `session_contract_id`
+ calling context in frontmatter (context-into-entry). Affordance (WA-4 as shipped):
`WikiAgentPanel` via `useIsAdmin()`. Linkage-queue drain:
`POST /api/wiki-agent/linkage-queue/drain` pulls next `LABS_WIKI_LINKAGE_DRAIN_N`
(fail-loud) queued reverse-pass items into board cards; nothing auto-publishes.
Public read is **WU-2**, not this slice.

**WU-1 (DL-573; original intent; ruling B superseded as a narrowing):**
`WikiAgentPanel` mounted from **AppChrome** lower-right dock, immediately
**left of Help**. One orb. Wiki layout does not mount a second FAB. Not
Help’s emerald control. Admin-only. Entire FatTail app plane — absence on
an admin surface is a defect. Context providers: env
`LABS_WIKI_CONTEXT_PROVIDERS` (fail-loud); first provider `hub=/app` exact.
Unregistered routes are route-context sessions. Accrete is
propose-and-dispose (no git draft until explicit Draft to board).
GET `/api/wiki-agent/context`. DL-539 three-OK keeps developers focused on
the active packet; it does not constrain Coach from naming this mount.

**WU-2 (DL-558):** Published pages readable without a session. Drafts 404
except for administrators. `GET /api/wiki/sitemap` is published slugs only
(Next `web/app/sitemap.ts` consumes it). Article pages emit `Article` +
`BreadcrumbList` JSON-LD (not Course/Offer). “In your practice” is omitted
from the public article rail.

**WU-3 / Source Contract (DL-560 · SC-0 · DL-562):** There is no Help Package.
One envelope, seven `source_kind`s. Factory IF-4 exposes a **publication signal
at Deploy** only (`GET /api/iki-factory/publication-signal` · **DL-577**) — no
envelope, no hook, no wiki page bytes. Wiki **SC-3b** polls that path when
stamped; hashes (L10), composes Wiki-side, or L12-declines. Admin push (S7) is a delivery point
for finished publishable material; no draft/queue/unfinished store. Transcript
pages arrive **skill-delivered** (OD-3 · **DL-564**): Coach's skill emits a
complete envelope; no stub.

**SC-1 (DL-568):** One portal `POST /api/wiki-agent/contracts`. `source_kind`
present → Source Contract schema. Ledger kind `source_contract`. Disposition
`accepted` | `failed-partial` | `rejected`. Watermark table
`wiki_source_watermarks` (no body column). Session without `source_kind`
unchanged. No compose in this slice.

**SC-2 (DL-570):** S7 handoff on `WikiAgentPanel` — artifact + intent,
`POST /api/wiki-agent/push`. No schema form. Thin body L12-declines
(`failed-partial`, no retry, no page). Landed items hash watermark + git
draft `status: draft` → board `awaiting_approval`. Admin-only (`useIsAdmin`).

**SC-3 (DL-571):** P2 poll S1+S2 GET-only (`poll_courses_source` /
`poll_help_source`). Hash vs `wiki_source_watermarks`; L10 hash wins over
signal. Tick `server/wiki_source_poll_tick.py` every 15m local. MiniTwo not
required. S3 Factory signal waits SC-3b.
