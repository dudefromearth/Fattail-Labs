# FatTail Labs — Wiki Spec v0.2.1 (Unified)

**Scope statement.** Active program: **Wiki**. Files/trees touched by this document:
NONE (specification only). Touches outside program at build time: source-side contract
delivery (courseware, help, IKI Lab) and per-app context providers — each built in its
own tree, declared, three-OK where frozen. Touches outside program by this document
itself: NONE.

**Status:** APPROVED (Coach 2026-08-23 · **DL-555**). Spec of record for the Wiki
program. Content version **v0.2.1** (filename `…-v0_2_1.md`; hunks 2–4 confirmed
as the bump — I.1 DL-539 mount law · registration new-vs-update / Factory emit /
wiki-side poller · IV.5.1 discovery seed). **H1 corrected 2026-08-24 (DL-561)**
from “Wiki Spec v0.2 (Unified)” to **v0.2.1** so title matches filename and
content version. Parent of Wiki Source Contract v0.1.4 (**B-3 closed**).
Build: WU-0…WU-2 shipped; WU-3 is Source Contract poll/compose (Help Package
superseded · **DL-560** · §6.1 diffs **SC-0 · DL-562**). S7 finished-only.
OD-3 skill-delivered (**DL-564** — no stub; envelope arrives complete).
**Standing presence (Coach 2026-08-24 · DL-573):** original intent restored —
the floating Wiki agent is present across the **entire FatTail app plane**,
not IKI/wiki routes only. WU-1 chrome ruling B was a developer-focus
narrowing, not a change of this law. Mount: AppChrome, lower-right, left of
Help.

**Supersedes (on approval; sources marked SUPERSEDED with pointer, never deleted,
never edited further):**
- `FatTail-Labs-Member-Wiki-Spec-v0.1.md`
- `FatTail-Labs-Wiki-Interface-Spec-v0.1.md`
- `FatTail-Labs-Wiki-Agent-Spec-v0_1_3.md` (and its v0.1–v0.1.2 lineage)
- Wiki Proactive Compilation Spec v0.2 (already superseded per OD-3, absorbed here)

**Why unified (Coach, 2026-08-23):** the agent spec is really part of the wiki spec.
The wiki is one thing — content in git, an agent fronting all writes, an interface
where Coach and the public meet it. Four documents described one organism; the seams
between them are where drift happened. This document is the organism, whole.

**Doctrine:** config fail-loud · no parallel store of truth · process outcomes only ·
no profit claims · evidence over assertion · documentation parity · human publish
gates · capacity over dependency · no MSC imports.

**Contents:** Part I — The Wiki (I.1 standing presence · I.2 store law · I.3 access ·
I.4 content model · I.5 preserved future phases) · Part II — The Agent (II.1
contracts · II.2 covenant · II.3 portals · II.4 linkage · II.5 invariants) ·
Part III — The Interface (III.1 read surface · III.2 public read · III.3 floating
agent · III.4 session mechanics) · Part IV — Governance (IV.1 rulings · IV.2 build
state · IV.3 citation map · IV.4 supersession · IV.5 remaining slices · IV.6
reconciliation).

**Reviewers (PENDING until Coach schedules; India + Mike first per precedent):**

| Gate | Reviewer | Concern |
|---|---|---|
| Architecture / boundary | India | Unification introduces no new stores or boundaries; citation map correct; §7-carve delta honored |
| Auth / exposure | Mike | Public read surface (Part III.2); floating launcher admin-only both layers; principal model unchanged |
| SEO / AEO | Sierra | Public wiki pages (Part III.2) — first Sierra gate for this program |
| Design + psychology | Echo + Tango | Floating launcher prominence without member-facing noise; message window |
| Trading accuracy | Hotel | Unchanged obligations carry forward; guidelines artifact remains law |
| Evidence | Delta | Phase gates for new slices |
| Approver | Coach | Everything |

---

## 0. One-paragraph standard

> The Wiki is FatTail Labs' compiled, living map — and its standing memory. Content
> lives in git as the single source of truth; a single agent fronts every write
> through two-sided contracts; humans gate every publication; and the whole corpus is
> **wide open to the public by default**, because the Wiki exists for discovery.
> During development and maintenance the Wiki keeps a **prominent, always-present
> interface**: a floating agent reachable from anywhere the admin works **across
> the entire FatTail app plane**, opening a message window where direction is
> given, proposals are made, and every exchange becomes sealed contract evidence.
> Coach's framing: *like the court stenographer, but way more* — ever-present and
> recording everything, but also composing, linking, and contextualizing what it
> records into the map. The agent composes; it does not assert. Nothing enters
> except through a contract; nothing publishes except through a human; nothing is
> invented beyond evidence.

---

# PART I — THE WIKI

## I.1 Standing presence (new principle, Coach 2026-08-23)

The Wiki is important enough to hold a prominent interface **at all times during
development and maintenance** — not a destination the admin visits, but a presence
that rides alongside the work. Three consequences bind design:

1. **Always reachable — entire FatTail app plane.** The floating launcher
   (Part III.3) is present wherever the admin is: every member app, the admin
   app, courses, and the rest of the Labs surface AppChrome wraps. Absence of
   the launcher on an admin surface is a defect, not a default. This was the
   original intent (Coach 2026-08-23: *anywhere the admin works*). **Coach
   2026-08-24 (DL-573):** WU-1 chrome ruling B (wiki-owned layouts only) was an
   implementation narrowing to keep **developers** from drifting into other
   trees during a focused packet. DL-539 three-OK is that same developer-focus
   rule — it does not constrain Coach, and it does not shrink this principle.
   Coach named the plane-wide mount: **AppChrome**, lower-right of each page,
   immediately **left of Help**. One orb. Members never see it.
2. **Everything becomes record.** Direction given in the message window is session
   transcript; source changes arrive as contracts; all of it lands in the ledger and,
   through drafts, in git. The stenographer function is structural: the record
   accumulates as a side-effect of working, never as a separate chore.
3. **More than a stenographer.** The agent does not merely transcribe — it composes
   drafts from what it records, runs the linkage pass, and proposes connections. The
   record is a *map*, not a log.

## I.2 Store law (unchanged, WIK-D1 lineage)

| Element | Home |
|---|---|
| Wiki page bytes (markdown + frontmatter + `[[wikilinks]]`) | `dudefromearth/lab-wiki` git checkout — `LABS_WIKI_ROOT`, boot fail-loud |
| Derived index (`wiki_pages_idx`, `wiki_links_idx`, `wiki_refs`) | MySQL `labs` — rebuildable, written only by reindex |
| Contracts ledger (`wiki_contracts` + source registry + pointer registry + `wiki_linkage_queue`) | MySQL — **state and contract evidence, never page bytes** (India ruling R0-1: sealed session transcript is contract evidence on the ledger row; pages remain git-only) |
| Transcripts / corpus artifacts (future, W2 lineage) | Repo `raw/transcripts/` per Member Wiki v0.1 §3.0 — preserved as specified, not yet built |

Git is the only writer of page bytes. Agent commits land on the remote; hosts pull +
reindex (D-12). Git credentials never reach `ai.complete()`; the server commits. No
second authoring table for pages, ever.

## I.3 Access (Coach rulings, 2026-08-23, DL-logged)

**Wiki contents are wide open by default — public, readable outside membership.**
Restriction is the deliberate act; access rules come only from Coach's explicit
direction; where Coach has not directed access, specs carry it as an OPEN question
put to Coach — never a defaulted posture in either direction (correction on record:
the prior member-gated posture and open decision D-3 were advisor assumption, not
Coach direction; both dissolved).

What protects the public is what protected members: the **publish gate**. Drafts are
invisible to everyone but admins (`status: published` frontmatter is the visibility
law; unauthenticated and member requests both 404 on drafts). The Factory board,
agent sessions, ledger, and all admin surfaces remain admin-only — the openness is
of *published wiki content*, nothing else.

## I.4 Content model (absorbed from Member Wiki v0.1 + Interface v0.1)

Pages are markdown with frontmatter; `[[slug]]` / `[[slug|label]]` wikilinks resolve
to `/app/wiki/[slug]`; unresolved links render visibly distinct and surface to admins
as page candidates; backlinks are a query over the links index. The Obsidian
character is the behavioral contract (Echo owns visual translation to Labs HIG):
wikilinks, backlinks, graph view (`/app/wiki/graph` + mini local graph per page),
quick switcher (⌘K), hover preview, admin in-place editing with wikilink
autocomplete. Search is FULLTEXT over pages (transcripts join when the corpus phase
ships); embeddings remain a deferred decision (D-4 lineage). Session-drafted pages
carry `session_contract_id` + calling context in frontmatter — provenance is part of
the content model (context-into-entry, A3b ruling).

## I.5 Preserved future phases (nothing dropped)

These Member Wiki v0.1 elements are specified, unbuilt, and **carried forward
intact** — they are Coach's ideas and remain on the board until Coach rules
otherwise:

- **Corpus registry + transcription pipeline** (W1/W2 criteria; registrar,
  captions/Whisper, timestamp deep links, related rail fed by corpus)
- **YouTube poll + historical backfill** (D-6 lineage)
- **Personal layer — "In your practice"** (W4/W10/W11; Family B firewall absolute:
  no raw member content in agent context or shared pages; member-isolated,
  server-side at request time; **never renders on public pages** — Mike gate
  mandatory when built)
- **Ask mode** (D-i1, v2 candidate)
- Member-facing name (D-1) — slug `wiki` stable regardless

---

# PART II — THE AGENT

## II.1 The contract model (two-sided)

A Wiki Communication Contract governs **both directions**: what the communicating
party delivers at the portal, and how the agent uses that communication to update
the Wiki. One envelope, three kinds. Everything the agent does begins with a
contract, and everything the agent does is an obligation *of* a contract.

**Envelope (all kinds):** `contract_id` (ULID at portal) · `contract_version` ·
`kind` (`source_change` | `registration` | `session`) · `source` (registered slug or
`admin-session`) · `delivered_at` · `principal` (service principal via
`contracts:deliver` scope, or admin user via session cookie — sessions require a
human; agent bearers are rejected) · `refs[]` (canonical references, never copies) ·
`payload` (kind-specific).

Validation is schema-strict and fail-loud. A validated contract is immutable;
corrections arrive as a new contract referencing the old id. **Session lifecycle
(settled):** validates on open (context + admin), transcript accretes while live,
**seals immutable at close**; follow-on direction = new session contract referencing
the sealed id. Family B references are rejected at the envelope.

**Kinds:**

- **`source_change`** (courseware, help, future sources): `created` | `updated` |
  `retired`, canonical entity ref, source-authored summary, `content_pointer` (read
  API — never inline content). Agent reads the pointer, drafts updates/new pages,
  linkage-passes, commits, raises board cards. `retired` → annotating draft, never
  silent deletion; orphaned refs flagged visibly.
- **`registration` / S3 (`iki_factory_template`):** Help Package payload and Factory
  emit are **SUPERSEDED** (Source Contract v0.1.4 · **DL-560** · **DL-562**). One
  envelope; Factory Deploy exposes a **publication signal only** — no envelope, no
  hook, no wiki page bytes. The Factory does not know the Wiki agent exists. Wiki
  polls the signal, confirms change by `content_hash` against the Wiki-side
  watermark (L10), fetches the artifact, composes the envelope **Wiki-side**, and
  either drafts the template's page — what it is, and **how it fits into the rest of
  FatTail Labs**, from envelope fields + linkage evidence — **or** L12-declines
  (thin material → `failed-partial` with reason, no page, no retry). Insufficient
  substance is Wiki judgment, not a Factory belt-stop. **New-vs-update declaration
  (Coach, 2026-08-23; still Wiki-side):** the agent determines from template
  identity + version against the ledger and existing pages whether this is a new
  template or an update, and **the drafted page declares which**. Page is a
  **consequence** of a composed envelope, never a Factory precondition. Until the
  Factory signal exists, Wiki accepts it on arrival (SC-3b). Version bumps = new
  envelope → revision draft.
- **`session`** (admin direction): `context.{surface, route, entity}` + admin
  principal + accreting transcript. Context is an **input to the entry** — framing,
  linkages, provenance — not merely conversational awareness (A3b). No privileged
  path to publication: session drafts ride the same git + board path as everything
  else.

## II.2 The covenant (agent side)

Validate fail-loud on receipt · ledger before any other action · discharge
kind-specific obligations within one agent cycle (one poller tick; else `failed`
with reason) · linkage pass on every draft · commit every write through git with
the contract id in the commit message · raise board cards · never publish · report
disposition. An undischargeable obligation moves the contract to a visible failed
state; a failure leaving a **partial draft** additionally raises a `failed-partial`
board card so incomplete work sits in front of a human. Ledger states:
`received → validated → drafted → awaiting_approval → published | rejected | failed`
— `rejected` = delivery side broke its terms; `failed` = agent could not discharge;
both visible, neither silent. Disposition is queryable by `contract_id` at any time
(state, commits, board cards, reasons): a communication governed by contract is
answered by contract.

## II.3 Portals

One authenticated endpoint (`POST/GET /api/wiki-agent/contracts`), source resolved
from the principal against a **source registry** (unregistered principal with valid
schema → loud failure, distinct from schema rejection — both proven at gate).
Source-side delivery code lives in the source trees under their programs; until a
source ships its hook, **wiki-side change-detection pollers** synthesize
`source_change` contracts from existing read APIs (GET only, proven at gate) —
same envelope, same ledger, `principal` marked as the poller; removed per-source
as real hooks land, each removal logged (OD-5 as ruled).

## II.4 Linkage pass (built; WA-3 lineage)

On every ingest that drafts or revises: FULLTEXT candidate search (+ title boost;
deterministic, explainable — no embeddings in v1) · above-threshold `[[wikilinks]]`
inserted; below-threshold listed on the board card as suggestions, never silently
added · `wiki_refs` rescore; backlinks correct on publish · **reverse pass**
generates board-gated revision drafts for existing pages that should link to the
new content · volume discipline: rollup card with inline cap, overflow to
`wiki_linkage_queue` — nothing dropped, everything queryable · **drain**: admin
board affordance pulls next N queued revisions into cards (N config, fail-loud) ·
rescore is idempotent — re-run on unchanged corpus mints no duplicates. Thresholds
are config, fail-loud — no magic numbers.

## II.5 Invariants

- **No invention.** The agent composes; it does not assert. Every claim traces to
  the contract payload, canonical content via a contract pointer, or a published
  page surfaced by linkage. An unevidenced relation ships as a board suggestion for
  a human to confirm — never as fact. *(India R0-1 advisory honored: this invariant
  governs published content; the sealed session transcript is contract evidence on
  the ledger, not content subject to this clause.)*
- **No agent publish.** W5 for every contract class, no exceptions (OD-2 as ruled).
  Hotel's guidelines artifact is referenced by the discharge prompt — a
  precondition to any approvable draft, permanently.
- **Write authority:** agent owns every automated write (OD-1 = (b) as ruled);
  human paths (in-place admin edit, direct authorship) continue; revisiting sole
  committer is a Coach decision for later, on evidence.
- **No profit claims** in any agent-drafted string. **No crawling** beyond
  registered read APIs named in contracts. **No content in MySQL** beyond contract
  evidence.

---

# PART III — THE INTERFACE

## III.1 Member/admin read surface (shipped, S0 lineage — do not regress)

Entry at `/app/wiki`: search-first (dominant search box), admin-pinned "Start here"
row, auto-fed "New this week" strip. Article surface carries the Obsidian character
(I.4) plus provenance display (compiled from → approved by). Graph is a secondary
destination. Admin in-place editing per the platform's stay-put law. *(Interface
v0.1's member-gating language and login-redirect deep-link behavior are superseded
by the public ruling — see III.2; the surface composition stands.)*

## III.2 Public read surface (defined; Coach stamps timing — "WA-6" lineage)

Unauthenticated read path over published pages, per I.3. Reviews before build:
**Sierra** (SEO/AEO for public wiki pages — sitemap, JSON-LD, meta, extractable
answers per platform SEO law) and **Mike** (exposure mechanics: unauthenticated 404
on drafts; no member-personal data reachable; the "In your practice" rail and
anything Family B-adjacent never renders publicly). Also in this slice: sweep the
feature-gate seeding and all inherited member-gating assumptions out of the read
path — the contamination check, done in-tree where the truth lives.

## III.3 Admin interface — the floating agent (Coach direction, 2026-08-23)

**Delivery model:** a floating launcher on the **Help Concierge precedent** — one
launcher, present wherever the admin is **across the entire FatTail app plane**,
opening the **message window**. This supersedes per-app panel adoption (never
built).

**Mount (Coach 2026-08-24 · DL-573; original intent):** `AppChrome` lower-right
dock. Wiki agent sits **immediately left of Help**. Help stays rightmost
(emerald, members). Wiki agent is zinc, sentence-case “Wiki agent”, admin-only.
The WA-4 wiki-layout orb is **retired** — two orbs is a defect. On `/admin/*`
Help is hidden; Wiki agent remains, still lower-right. Unauthenticated visitors
and members: Wiki agent **DOM absent**.

- **Help bot (as-built, discovery closed):** `web/components/HelpLauncher.tsx`,
  mounted from `web/components/AppChrome.tsx`. Member-facing. Wiki does not
  edit Help behavior; it shares the dock as a sibling. Coach named this
  placement; DL-539 three-OK does not apply to Coach naming the plane.
- **Admin-only, both layers, proven:** the launcher never renders for members or
  unauthenticated visitors (DOM absent) AND the session API rejects them (403/404);
  agent bearers rejected (`session_requires_human`). The Help bot is member-facing;
  the wiki launcher is not — the visibility rule is the difference and it is proven,
  not assumed.
- **The message window is the channel** (Coach ruling): direction, agent proposals,
  estimates, and lists all flow through the window; everything in-window is
  transcript under the session contract. The agent's proposals in-window execute
  nothing until Coach acts — propose-and-dispose is the window's law.
- **Context:** launcher always supplies `{surface, route}` from location. Apps
  enrich sessions via a **context provider registry** (config-driven, fail-loud):
  a small per-app registration handing over the on-screen entity. First provider:
  the `/app` hub (Coach: "app surface first"). Adoption order beyond that: the
  agent proposes a best-estimate order **in the message window**; Coach accepts or
  redirects; Coach names specifics only when different. Each provider is a declared
  touch in its own app's tree (developer-focus / DL-539 still applies to
  *unrelated* trees a packet did not name). Sessions from unregistered surfaces
  are route-context sessions — valid, less rich.
- **Prominence (I.1):** the launcher is the standing-presence principle made
  visible. It is not buried in a menu, and it is not confined to IKI Lab or
  `/app/wiki`.

## III.4 Session mechanics in the window

Open (context validated, admin principal) → multi-turn accretion → seal at close;
mutate-after-seal rejected; follow-on opens a new contract referencing the sealed
one. Opening agent turn demonstrates context awareness. Drafts produced under a
session carry the session's contract id and context into frontmatter and framing
(context-into-entry), commit through git, and land on the board as
`awaiting_approval` — the admin who directed the draft approves it on the board
like any other (authoring direction ≠ publish gate).

---

# PART IV — GOVERNANCE, HISTORY, CITATIONS

## IV.1 Rulings absorbed (DL-logged; this section restates, the DL governs)

OD-1(b) pipeline write authority · OD-2 no publish exceptions · OD-3 standalone
supersession of Proactive Compilation · OD-4 registration-consequence · OD-5
bridge pollers · OD-6 floating chrome + multi-turn chat (delivery model refined to
the Help-bot pattern; **plane-wide AppChrome mount is the original intent —
WU-1 ruling B was developer-focus, superseded as a narrowing by DL-573**) ·
public-by-default access + the access-doctrine correction ·
session semantics sharpened (admin-only direct communication; context-into-entry) ·
WooCommerce as platform-wide commerce entry point (ruled via Factory OD-F6,
generalized) · India R0-1 transcript-as-evidence · Mike R0-2 `contracts:deliver`
scope · seam ratification + pre-declared-seams standing rule.

## IV.2 Build state at unification

Shipped through gates WA-1…WA-4 (+DL-548/549/550 + WA-4 entries): portal + ledger +
source registry + fixture git authorship · pollers (courseware, help) + pointer
registry + Oscar discharge + Hotel guidelines + retired-path handling ·
linkage engine + `wiki_refs` + reverse pass + rollup/queue · session lifecycle API +
context-into-entry + queue drain. **WU-1 plane-wide launcher (DL-573):**
`WikiAgentPanel` in AppChrome, lower-right, left of Help; wiki-layout orb
retired. Context providers: hub `/app` first; further apps as named. Tolerated
house-box failures: the named 8 (OPF + curate), SSR recorded flaky, flips
non-chargeable. **Not built:** further context-provider adoption beyond hub ·
S3 / WU-3 live end-to-end (Source Contract poll + Wiki-side envelope; Factory
signal at Deploy — **SC-0 landed**, SC-3b waits on the signal existing) ·
everything in I.5. Public read (III.2 / WU-2) is shipped.

## IV.3 Citation map (old anchors → this document)

| Old citation | Lives here |
|---|---|
| Member Wiki W1–W4 (corpus/search/related) | I.4, I.5 |
| Member Wiki W5 (board gate) | II.5 |
| Member Wiki W6 (Hotel guidelines) | II.5 |
| Member Wiki W7 / Agent WA12 (no profit claims) | II.5 |
| Member Wiki W8 (stay-put) | III.1 |
| Member Wiki W9 (no parallel store / no fiction) | I.2, II.5 |
| Member Wiki W10–W11 (Family B) | I.5, II.1 |
| Member Wiki §3.0 two-store split, WIK-D1–D7 | I.2, I.4 |
| Member Wiki §4 perpetual loop | II.3–II.4 (contract-driven), I.5 (unbuilt stages) |
| Member Wiki D-1…D-8 | dissolved: D-3 (I.3), D-7 (agent seated); carried: D-1, D-2, D-4, D-5, D-6, D-8 (I.5, II.4) |
| Interface v0.1 §§1–7 surfaces, WI1–WI11 runbook | III.1 (composition), gating items superseded per III.2 |
| Agent spec §3 (envelope, kinds, lifecycle) | II.1 |
| Agent spec §3.0 covenant, §4 ledger | II.2 |
| Agent spec §3.5 portals/disposition | II.3 |
| Agent spec §5 linkage (+ WA-3 build) | II.4 |
| Agent spec §6 write paths / OD-1 | II.5 |
| Agent spec §7 invariants (+ India carve) | II.5 |
| Agent spec WA1–WA13 | II.1–II.4 (criteria remain valid as gate history; future gates cite this document) |
| Agent spec §8 phases WA-1…WA-5 | IV.2 (history), IV.5 (remaining) |

Gate reports and DL entries citing old anchors remain valid against the SUPERSEDED
documents, which persist untouched precisely so those citations resolve forever.

## IV.4 Supersession mechanics

On Coach approval: Lima DL entry for the unification · the four source documents
gain a SUPERSEDED banner pointing here (banner-only edits; content frozen) · this
document becomes the spec of record · all future gates, seeds, and DL entries cite
this document's anchors.

## IV.5 Remaining slices (each its own Coach stamp)

1. **Floating agent delivery** (III.3): **SHIPPED (DL-573).** Plane-wide
   AppChrome mount, left of Help; wiki-layout orb retired; `/app` hub provider
   already seated. Remaining: further per-app context providers as Coach names
   them — not a second launcher.
2. **Public read surface** (III.2): **SHIPPED (WU-2 / DL-558).**
3. **Registration / S3 live** (WU-3 / SC-3b): Source Contract poll + Wiki-side
   envelope. Factory IF-4 is the **publication signal at Deploy** (smaller — no
   envelope, no hook). Not blocked on a Help Package spec (**SUPERSEDED · DL-560**).
   L12: a thin template produces no page.
4. **Corpus phases** (I.5): when Coach calls them.

## IV.6 Reconciliation notes for Grok review (drift honesty)

This draft was composed from the advisor's copies plus the ruling record. Two
in-tree states were never seen by the drafter and must be reconciled in review:
(a) **Agent spec v0.1.3's exact wording** of the India §7 carve and the A3 session
deltas — Part II.5 and II.1 restate them from the instructions that created them;
correct any divergence to the in-tree text; (b) **the 9-line in-place edit to
Member Wiki v0.1** — its content is unknown to the drafter; reconcile against
I.3/IV.3 and disposition per the owed record check. Any other in-tree delta the
drafter's copies lack: flag, don't fold silently.
