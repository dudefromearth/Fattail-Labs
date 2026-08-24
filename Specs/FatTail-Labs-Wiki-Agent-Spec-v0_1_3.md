# FatTail Labs — Wiki Agent Spec v0.1.3

> **SUPERSEDED (DL-555).** Spec of record is
> [`FatTail-Labs-Wiki-Spec-v0_2_1.md`](./FatTail-Labs-Wiki-Spec-v0_2_1.md)
> (Wiki Spec v0.2.1 APPROVED). This file remains so WA-1…WA-4 gate citations
> resolve. Do not implement from this document. Banner-only.

**Revision history**

- **v0.1.3** — Coach rulings 2026-08-23: wiki content is **wide open by default**
  (**DL-551**); access doctrine is Coach-directed with no defaulted posture
  (**DL-552**); session semantics sharpened (**DL-553**): admin-only in-place-admin
  affordance; `{surface, route, entity}` is **input to the entry**; India’s
  §7-vs-session-payload carve is law. Public read surface is **WA-6** (defined,
  not stamped; Coach stamps timing). WA-5 waits on Coach directing the Help
  Package spec and naming file + version.
- **v0.1.2** — §5 build-status correction: stage-⑤ linkage machinery, `wiki_refs`, `corpus_items` do not exist as built; this program builds them (WA-2 pointer registry, WA-3 linkage).
- **v0.1.2** — §3.1 session-contract lifecycle: validates on open, transcript accretes while live, seals immutable at close; follow-on = new contract referencing the sealed id.

**Scope statement.** Active program: **Wiki**. Files/trees touched by this document:
NONE (specification only). Touches outside program at build time: **course system, help
system, IKI Lab template registration** — each must deliver a contract at its portal
(§4). Those delivery hooks are built inside their own trees under their own programs,
subject to DL-539 (three-OK). This spec defines the contract and the Wiki-side portal;
it does not authorize edits in any source tree.

**Status:** SUPERSEDED by Wiki Spec v0.2.1 (**DL-555**). Historical: APPROVED as
Wiki Agent spec of record for **GO WA-1…WA-4** (**DL-548/549/550** + GO WA-4). **WA-5**
waits until Coach directs creation of the IKI Template Help Package spec and
**names the file and version**; no one self-assigns it. **WA-6** (public read) is
defined, not stamped; Coach stamps timing. The access rule is already directed
(DL-551) — WA-6 reviews cover implementation, not whether.
**Directive traced:** Coach directive 2026-08-23, D1–D7, per the Compliance Audit
Charge v0.1. Traceability table in §9.
**Relation to existing law:** Builds on Member Wiki Spec v0.1 (WIK-D1 git store, W5
publish gate, perpetual loop). **OD-3:** this spec supersedes Proactive Compilation
v0.2. Wiki contents are **wide open by default** (**DL-551**); D-3 dissolved.
Access not directed by Coach stays an **OPEN question on the spec**, never a
defaulted posture (**DL-552**). Wiki-specific directed rule: wide open by
default; restrictions only when Coach names them.
**Doctrine:** config fail-loud · no parallel store of truth · process outcomes only ·
no profit claims · evidence over assertion · documentation parity.

**Reviewers (PENDING until Coach schedules):**

| Gate | Reviewer | Concern |
|---|---|---|
| Architecture / boundary | **India** | Contract model; no second store of truth; standalone-function boundary |
| Auth | **Mike** | Agent principal authority; portal authentication; admin session identity. **Specific question:** existing agent API key model (per WIK-D7, scoped keys e.g. `wiki:reindex`) — does it already support a contract-delivery scope set (`contracts:deliver`, per-source principals), or what is the minimal gap? |
| Design + psychology | **Echo + Tango** | Admin session surface; every public string |
| Trading accuracy | **Hotel** | Compiled page content, template pages |
| Evidence | **Delta** | Phase gates |
| Approver | **Coach** | Ship / scope / open decisions |

---

## 0. One-paragraph standard

> The Wiki is a **standalone function** fronted by a single agent. Nothing enters the
> Wiki except as a **contract delivered at a portal**. Source systems — courseware, the
> help system, IKI Lab templates, and any future source — deliver a versioned contract
> envelope when their content changes or comes into being; admin operators deliver a
> **session contract** when they call the agent from any Labs surface. Every contract
> is **two-sided**: it governs the communication — what the delivering party must
> provide — and it governs **how the agent uses that communication to update the
> Wiki** — what the agent is bound to do with it, by when, and how the disposition is
> reported back. The agent validates every contract fail-loud, discharges its bound
> obligations, searches for linkages into the existing map, and commits **all**
> resulting writes through git —
> the single source of truth. Member-visible publication passes the human gate (W5).
> The agent never reaches into source trees, never crawls, and never forks canonical
> content: contracts carry references that point home.

---

## 1. Intent & success criteria

### 1.1 Intent (Coach, 2026-08-23)

The Wiki is agent-fronted with all writes funneled through git (D1). The agent keeps
the Wiki current with courseware (D2) and help system (D3) changes, builds linkages on
every update (D4), is callable by an admin from anywhere with calling-surface context
(D5), gives every new IKI template a page about the template and how it fits into
FatTail Labs (D6), and supports a directed admin session in which pages are created
from specifications the admin articulates (D7). Integration is **contractual**: a
contract delivered at each portal.

### 1.2 Success criteria

| # | Criterion |
|---|---|
| WA1 | Every write to the `lab-wiki` checkout attributable to the Wiki function lands as a git commit made by the agent principal, with the originating contract ID in the commit message. |
| WA2 | An invalid contract is rejected loudly at the portal (schema validation, actionable error, ledger row `rejected` with reason) — never silently dropped, never partially ingested. |
| WA3 | A courseware change contract produces a drafted wiki update within one agent cycle, traceable contract → draft → board card. |
| WA4 | A help-system change contract does the same. |
| WA5 | An IKI template registration contract produces a drafted template page containing what the template is **and how it fits into FatTail Labs**, sourced from the Template Help Package fields. |
| WA6 | Every ingest triggers the linkage pass: wikilinks proposed, `wiki_refs` rescored, backlinks correct after publish. |
| WA7 | Direct Wiki Agent communication is **admin-only** (in-place-admin pattern; invisible to everyone else). Opening a session delivers `{surface, route, entity}` as **input to the entry** (frontmatter + framing + candidate linkages + provenance), not merely conversational awareness. The agent's opening move cites that context. “Callable from anywhere” is this content directive — it is not a license to mount chrome on every `/app/*` host file. |
| WA8 | A page requested in a directed session lands as a draft through the same git + gate path as every other contract — no side door. |
| WA9 | No member-visible publication without human approval (W5 preserved), unless Coach rules otherwise under OD-2. |
| WA10 | The contracts ledger accounts for every contract ever received: `received → validated → drafted → awaiting_approval → published | rejected`, with timestamps. No contract disappears. |
| WA11 | Zero imports from source trees; the Wiki function consumes contracts and canonical read APIs only. |
| WA12 | No profit-claim copy in any agent-drafted content (inherited invariant, applies verbatim). |
| WA13 | Every contract's disposition is queryable by its deliverer via `contract_id` — state, commits, board cards, and reject/failure reason — proving the agent's side of the contract was discharged or visibly failed. |

---

## 2. Position in the platform

| Aspect | Decision |
|---|---|
| Boundary | The Wiki is a **standalone function**. Its only inbound surfaces are its portals (§4) and its wiki read-write UI (existing `/app/wiki`; public read is WA-6). Direct agent communication is admin-only (§3.4). |
| Store of truth | Unchanged — WIK-D1: `lab-wiki` git checkout (`LABS_WIKI_ROOT`, fail-loud). MySQL holds derived index + the contracts ledger (state, never content). |
| Write authority | The **Wiki Agent** is the write gateway for all Wiki-function writes (OD-1 governs the two human paths — see §6). |
| Agent seating | Bench archetype per Member Wiki v0.1 D-7 proposal (Oscar, product-local), via existing agent API keys + `ai.complete()` gateway. |
| Publish gate | W5 stands as drafted: agent output → content board → human approve → published. OD-2 is the only door to any exception. |
| Runtime | Existing poller pattern (Quebec precedent) for the agent cycle; launchd on MiniTwo. |

---

## 3. The contract model

A Wiki Communication Contract governs **both directions** of the exchange: what the
communicating party delivers at the portal, and how the agent uses that communication
to update the Wiki. One envelope, three kinds. Everything the agent does begins with a
contract, and everything the agent does is an obligation *of* a contract — the agent
takes no wiki action that no contract binds it to.

### 3.0 The two sides

| Side | Bound party | Obligations |
|---|---|---|
| **Delivery side** | Source system or admin | Deliver a schema-valid envelope from a registered principal; carry references, never copies; provide the kind-specific payload in full (§3.2–3.4); accept loud rejection as final for that delivery (corrections = new contract) |
| **Agent side (the covenant)** | Wiki Agent | Validate fail-loud on receipt · account the contract in the ledger before any other action · discharge the kind-specific update obligations (§3.2–3.4) within one agent cycle · run the linkage pass (§5) on every draft produced · commit every resulting write through git with the `contract_id` in the commit message · raise the board card(s) · never publish directly (W5) · report disposition (§3.5) |

The kind-specific "agent obligations" in §3.2–3.4 are **contract terms, not
implementation notes**. An obligation the agent cannot discharge (source API down,
draft failure, linkage error) moves the contract to a visible failed state in the
ledger with the reason — never a silent stall (WA2 discipline applies to the agent's
side as much as the deliverer's). A failure that leaves a **partial draft** behind
additionally raises a board card flagged `failed-partial`, so incomplete work sits in
front of a human, never in limbo.

### 3.1 Envelope (all kinds)

| Field | Meaning |
|---|---|
| `contract_id` | ULID, assigned at the portal on receipt |
| `contract_version` | Schema version of this envelope (`1`) — unknown version = reject loudly |
| `kind` | `source_change` \| `registration` \| `session` |
| `source` | Registered source slug (`courseware`, `help`, `iki-templates`, …) or `admin-session` |
| `delivered_at` | Timestamp at the portal |
| `principal` | Delivering identity: source-system service principal or admin user ID |
| `refs[]` | Canonical entity references (kind + id + canonical URL). **References, never copies.** |
| `payload` | Kind-specific body (§3.2–3.4) |

Validation is schema-strict and fail-loud (WA2). A contract that validates is
immutable; corrections arrive as a new contract referencing the old `contract_id`.
**Session-kind exception (lifecycle):** a `session` contract validates on open
(context + admin principal), its transcript accretes while the session is live, and
it **seals immutable at close**. Sealed transcript = **contract evidence on the
ledger** (India R0-1 · **DL-553**); wiki **page bytes** remain git-only (WIK-D1).
Post-seal corrections or follow-on direction arrive as a new session contract
referencing the sealed one. Mutate-after-seal is rejected.

### 3.2 `source_change` — courseware, help system, future sources

Delivered when canonical content is created, updated, or retired.

| Field | Meaning |
|---|---|
| `change` | `created` \| `updated` \| `retired` |
| `entity` | Canonical ref (course, lesson, help article, FAQ entry, …) |
| `summary` | Source-authored one-paragraph statement of what changed (may be machine-generated by the source) |
| `content_pointer` | How the agent reads the current canonical content: existing read API endpoint. Never inline full content in the contract. |

Agent obligation: read the canonical content via the pointer, determine affected wiki
pages (existing refs + linkage search), draft updates or new pages, run the linkage
pass (§5), commit drafts, raise board cards.

`retired` obligation: orphaned `wiki_refs` flagged visibly (W9 lint inherited);
affected pages get a draft revision removing or annotating the dead reference — never
a silent deletion.

### 3.3 `registration` — IKI Lab templates

Delivered when a template registers. **The payload is the Template Help Package**
(IKI Template Help Package Spec v0.1): purpose, information-in, knowledge-out, why,
how, scenarios, non-claim, data-fields — plus template identity and version.

Agent obligation: draft the template's wiki page from the package — what it is, what
information it consumes, what knowledge it produces, and **how it fits into the rest
of FatTail Labs** (linkage pass against suites, courses, and sibling templates is
mandatory content for this page kind, not decoration). The "how it fits" material
comes from the package fields plus linkage-pass evidence against suites, courses,
and sibling templates. **If the Help Package fields prove insufficient to satisfy
"how it fits" without invention, extending the package is a source-side contract
obligation on IKI Lab — the agent never fills the gap by asserting unevidenced
relations (§7 no-invention).** Template version bumps arrive
as a new registration contract → page revision draft.

Coupling of registration to page existence (consequence vs precondition) is **OD-4**.

### 3.4 `session` — directed admin sessions (D5 + D7)

Delivered when an **administrator** invokes the agent. The affordance is
**admin-only**, in-place-admin pattern: it may render on a production wiki page
for `administrator` and is invisible to everyone else (**DL-553**). Agent bearer
keys cannot open or accrete a session (`session_requires_human`).

“Callable from anywhere” (D5) is a **content** directive: the calling-surface
context is input to the page the session drafts, not a requirement to mount
chrome in AppChrome or every `/app/*` host file.

| Field | Meaning |
|---|---|
| `context.surface` | Suite/app slug (strategy-lab, practice, options-lab, iki-lab, courses, help, wiki, …) |
| `context.route` | Route at invocation |
| `context.entity` | Entity on screen at invocation, if any (kind + id + canonical URL) |
| `admin` | Admin user ID (session-authenticated — this is a human principal, not an agent key). Server-assigned; never trusted from the JSON body. |
| `transcript` | The directed session itself: the admin articulates specifications; the agent asks, proposes, drafts. Accretes while `sealed_at` IS NULL; immutable after seal. |

Agent obligation: open with demonstrated context awareness (WA7) — the first agent
turn cites `{surface, route, entity}`; take direction; produce draft page(s) whose
**frontmatter records `session_contract_id` plus the calling context** and whose
**body and candidate linkages are seeded from the context entity** (context-into-entry);
commit through git; raise board cards. **A directed session has no privileged path
to publication** (WA8) — the admin who directed the draft approves it on the board
like any other, preserving the separation between *authoring direction* and the
*publish gate*.

### 3.5 Portal mechanics

A **portal** is the delivery point: one authenticated endpoint per source under the
Wiki function (`POST /api/wiki-agent/contracts`, source resolved from the principal),
plus the session affordance for `kind=session`. Portals are registered in a
**source registry** table (slug, principal, schema kind, enabled). Delivering a
contract from an unregistered source fails loudly.

**Disposition reporting (the agent's return obligation).** The portal returns the
`contract_id` on receipt; the deliverer may query
`GET /api/wiki-agent/contracts/{contract_id}` at any time for the contract's current
state, resulting commit SHAs, board card IDs, and reject/failure reason. A
communication governed by contract is answered by contract: the deliverer is never
left guessing what the agent did with what it delivered.

**Source-side delivery** (the code in courseware / help / IKI Lab that composes and
POSTs the contract) belongs to those trees: specified here as an interface, built
there under three-OK. **Interim bridge (proposal, OD-5):** until a source tree ships
its delivery hook, the Wiki function may run a *change-detection poller* against that
source's canonical read API (updated-at / content-hash cursors) that synthesizes
`source_change` contracts on the Wiki side — same envelope, same ledger, `principal`
marked `wiki-poller`. This keeps the Wiki standalone and useful from day one with
zero cross-tree edits, and is removed per-source as real delivery hooks land.

---

## 4. Contracts ledger (MySQL, derived-state only)

`wiki_contracts` — one row per contract: envelope fields, raw payload (JSON), status
(`received → validated → drafted → awaiting_approval → published | rejected | failed`),
`reject_reason` / `failure_reason`, resulting commit SHAs, resulting board card IDs,
timestamps per transition. `rejected` = the delivery side broke its terms; `failed` =
the agent could not discharge its side (§3.0) — both visible, neither silent. Content never lives here — the pages live in git; the ledger is the
audit trail (WA10). Migration `NNN_wiki_contracts.sql` + source registry table.

---

## 5. Linkage pass (D4)

Runs on **every** ingest that produces or revises a draft:

1. Candidate search — FULLTEXT over pages + corpus against the contract's refs and
   drafted text.
2. Wikilink proposals — `[[slug]]` insertions in the draft where candidates clear a
   score threshold; below-threshold candidates listed in the board card as
   suggestions, not silently added.
3. Rescore — `wiki_refs` refreshed for affected pages; backlinks correct on publish.
4. Reverse pass — existing published pages that should now link *to* the new content
   generate revision drafts (board-gated like everything else).

**Build status (corrected 2026-08-23 per bench-plan review B5):** the stage-⑤
related engine, `wiki_refs`, and `corpus_items` were *specified* in Member Wiki v0.1
but deferred at W1 ship and **do not exist as built**. This program **builds** the
v1 linkage machinery in the wiki tree (plan slice WA-3; pointer registry per India's
WA-2 ruling); it does not wire pre-existing machinery. Earlier wording implying
otherwise was a spec defect.

Deterministic and explainable v1 (FULLTEXT + boosts). Embeddings
remain a v2 decision (Member Wiki D-4, unchanged).

---

## 6. Write paths and the D1 boundary

As built today, three paths write to the checkout: the agent pipeline, admin in-place
edits (WI9, direct commit), and direct Obsidian authorship. The directive says the
agent controls all writing. **OD-1** decides the disposition of the two human paths:

- **(a) Sole committer:** WI9 saves and Obsidian-authored changes route through the
  agent portal as contracts (`kind=session`, degenerate single-turn); the agent is
  the only committer. Strongest single-source-of-truth guarantee; largest change.
- **(b) Agent owns its pipeline:** human paths keep committing directly; the agent
  owns every *automated* write. Smallest change; "controls all writing" is then
  scoped to the agent's function, not the repo.

This spec is written to work under either ruling; §3–5 do not change. What changes is
whether WI9 is refactored (three-OK: it lives in the platform tree).

---

## 7. Non-goals & invariants

- **No invention.** The agent composes; it does not assert. Every claim in
  agent-drafted content traces to one of: the contract payload, canonical content
  read via a contract's pointer, or an existing published page surfaced by the
  linkage pass. A relation the linkage pass cannot evidence does not ship as fact —
  it may ship as a board-card suggestion for a human to confirm. (First-class
  restatement of Member Wiki v0.1 §6.2 "no fiction"; India + Hotel review anchor.)
- Not a crawler: the agent never scans source trees or databases beyond registered
  canonical read APIs named in contracts (WA11).
- Not a second store: no wiki **page bytes** in MySQL. `source_change` and
  `registration` contracts carry pointers and source-authored summaries, never
  copies. **`kind=session` carve (India R0-1 · DL-553):** the live then sealed
  transcript is **contract evidence** on the ledger row, not a wiki page and not a
  fork of `lab-wiki`. Pages still land only as git commits.
- Not an auto-publisher: no path from contract to a published page that skips the
  board, absent an explicit OD-2 ruling logged in the DL. W5 stands. Once WA-6
  ships, W5 is **unauthenticated 404 on drafts** (DL-551).
- Not a member-visible session: the agent panel never renders for non-administrators.
  `/app/wiki` member reading experience is untouched by WA-1…WA-4. Public read is
  **WA-6**, not this spec version’s implementation authority.

---

## 8. Phasing (proposal)

| Phase | Ships | Proves |
|---|---|---|
| **WA-1 Portal + ledger** | Contract envelope + validation · portal endpoint + source registry · contracts ledger migration · agent commits with contract IDs | WA1, WA2, WA10, WA11 |
| **WA-2 Sources** | Wiki-side change-detection pollers for courseware + help (OD-5 bridge) synthesizing `source_change` contracts · draft + board flow · retirement handling | WA3, WA4, WA9 |
| **WA-3 Linkage** | Full linkage pass on every ingest incl. reverse pass | WA6 |
| **WA-4 Session** | Admin-only in-place-admin affordance on wiki-owned layout (not AppChrome) · session open/accrete/seal · context-into-entry drafts · linkage-queue drain | WA7, WA8 |
| **WA-5 IKI portal** | `registration` contract kind live · template page drafting from Help Package · first real template paged | WA5 |
| **WA-6 Public read** | Unauthenticated wiki read path · Sierra SEO/AEO · Mike exposure review · public 404 on drafts · no Family B / “In your practice” on public pages | DL-551. **Defined, not stamped.** |

Each phase: spec parity, DL entry, Delta gate with executed runbook — commands and
captured output, per house verification style. Detailed per-phase runbooks are
drafted at execution-plan time by Juliet, not here.

---

## 9. Directive traceability

| Directive | Spec home |
|---|---|
| D1 agent-fronted, git-funneled, single source of truth | §2, §3.5, §6, WA1 |
| D2 courseware monitoring | §3.2, WA3 |
| D3 help-system monitoring | §3.2, WA4 |
| D4 linkage on every update | §5, WA6 |
| D5 admin-callable with calling-surface context | §3.4, WA7 — **content** directive: context is input to the entry (**DL-553**), not AppChrome |
| D6 IKI template pages incl. fit into FatTail Labs | §3.3, WA5 |
| D7 directed admin session from anywhere | §3.4, WA7–WA8 |

---

## 10. Open decisions (Coach)

| ID | Decision | Proposal |
|---|---|---|
| **OD-1** | Write authority: agent as sole committer vs agent owns its pipeline (§6) | (b) for v0.1 ship; revisit (a) once the session path is proven — smallest blast radius first |
| **OD-2** | Publish gate: any contract class that publishes without board approval? | None. W5 stands for every class, including mechanical syncs. Cheap to relax later; impossible to un-publish trust. |
| **OD-3** | Spec vehicle: this standalone spec supersedes Proactive Compilation v0.2, or folds in as v0.3? | Standalone supersedes; v0.2's deploy-watcher and inbox become contract sources and ledger views under this model |
| **OD-4** | Template coupling: wiki page as consequence of registration, or precondition? | Consequence. The Help Package gate already guarantees the source material exists; blocking registration on a board-gated draft couples IKI ship cadence to wiki approval latency. |
| **OD-5** | Interim bridge pollers permitted until source trees deliver? | Yes, per-source, removed as hooks land; each removal logged |
| **OD-6** | D7 surface form: host chrome vs extension of existing admin AI vs wiki panel; chat vs form+text | **Narrowed (GO WA-4 · Rider 1):** wiki-owned layout + in-place-admin panel. Not AppChrome. Not a DL-539 three-OK. “Anywhere” = context-into-entry, not host chrome. |

### 11. Access (Coach-directed)

Access is not inferred. **DL-552:** where Coach has not directed, this spec would
carry access as an OPEN question. Coach **has** directed wiki contents: **wide
open by default** (**DL-551**); specific restrictions only when Coach names them.
Drafts stay unpublished (W5). The public read surface is WA-6, not WA-4 — reviews
cover implementation, not whether. Direct agent communication is
**administrator-only** (**DL-553**).
