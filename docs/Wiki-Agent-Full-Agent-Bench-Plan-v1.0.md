# Wiki Agent — Full Agent Bench Plan v1.0

**Program:** Wiki Agent (contract portal, git-funneled drafts, D1–D7).  
**Spec of record (DRAFT):** [`Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1.md`](../Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1.md)  
**Directive / audit:** [`docs/Wiki-Agent-Directive-and-Compliance-Audit-Charge-v0_1.md`](./Wiki-Agent-Directive-and-Compliance-Audit-Charge-v0_1.md) · [`docs/Wiki-Agent-Directive-Compliance-Audit-2026-08-23.md`](./Wiki-Agent-Directive-Compliance-Audit-2026-08-23.md)  
**Parents:** Member Wiki v0.1 · Wiki Interface v0.1 · Arch **11** · **DL-545/546/547**  
**Board:** continue [`agents/p-wiki/`](../agents/p-wiki/). Do not restart the member-wiki spine. Do not run Member Wiki S1–S6 unless Coach stamps those separately.

Juliet. **No GO.** Spec is DRAFT. This plan has **no build authority** until Coach approves the spec, logs ODs, and stamps a phase.

**Isolation (Coach 2026-08-23, restated):** Wiki development only. Factory, Runner, Options Lab, Market Bus, Trade Log — **not touched** unless Coach names them and, for frozen trees, records **three successive OKs (DL-539)**.

---

## Juliet review (labeled)

Coach’s spec text is intact in `Specs/`. Nothing below deletes it.

### Blocking for *sequencing* (not for spec content)

| # | Item |
|---|------|
| B1 | File header is **DRAFT**. Workflow: spec review gates → Coach approval → DL → **then** GO WA-1. |
| B2 | **OD-1…OD-6** are proposals. Plan below assumes Coach stamps them **as proposed**. A different ruling re-sequences (especially OD-1a, OD-2 exception, OD-5 no). |
| B3 | **WA-4** “every `/app/*` surface” is **AppChrome**. That is a frozen tree. **WA-4 does not start** without three successive Coach OKs, or a Coach narrowing (e.g. `/app/wiki` + `/admin` only for v0.1). |
| B4 | **WA-5** needs the **IKI Template Help Package Spec** in-tree (Wiki Spec v1.2: not yet) **and** a registration emit. Emit is IKI-tree, DL-539. Wiki-side can accept `registration` contracts in WA-5 without editing Runner. |
| B5 | Member Wiki ⑤ / `wiki_refs` / `corpus_items` **do not exist**. WA-3 cannot “wire existing related-engine machinery.” Wiki-side must **build** the v1 FULLTEXT linkage pass (in-program). |

### Opinion (Coach may discard)

| # | Item |
|---|------|
| O1 | Ledger stores `payload` JSON including session `transcript`. Spec also says “content never lives here.” Prefer: transcript in git or board `intent_md`; ledger holds pointers. India. |
| O2 | “One agent cycle” needs a named SLA at seed time (proposal: one poller tick; else `failed` with reason). |
| O3 | Do **not** revive `CompileLauncher` / compile-inbox UI. New portal is `/api/wiki-agent/*`. Idle v1.2 compile APIs stay idle until OD-3 says they become ledger views. |
| O4 | Hotel **before** the first agent-drafted page that can be approved (Member Wiki W6). That is WA-2-0, not WA-5. |
| O5 | WI9 in-place save remains Member Wiki **S1**, not this program, if OD-1 = (b). |

---

## Intent (spec §0–§1)

The Wiki is a standalone function fronted by one agent. Nothing enters except a **contract at a portal**. The agent validates fail-loud, discharges the covenant, linkage-passes, commits through git, and never publishes (W5). Sources deliver contracts (or wiki-side pollers synthesize them under OD-5). Admins deliver **session** contracts from Labs surfaces (D5/D7).

Success = **WA1–WA13**. Phases = spec §8 **WA-1…WA-5**.

---

## Store law (unchanged — Member Wiki + this spec §2)

Git is the only writer of wiki **page bytes**. MySQL = derived index (`wiki_pages_idx` / `wiki_links_idx`) **plus** contracts ledger (**state**, not pages).

1. Agent commits land on the **remote**; other hosts **D-12 pull + reindex**.  
2. Reindex remains the only writer of index rows.  
3. Tests must not leave a fixture vault on the member DB.  
4. **No** second authoring table named `wiki_pages`. Ledger table is `wiki_contracts` + source registry.  
5. Git credentials never go to `ai.complete()`. The **server** commits.

---

## Locked only after Coach stamp

Until then these are **spec proposals**, not house law:

| ID | Spec proposal | Blocks |
|----|---------------|--------|
| **OD-1** | (b) agent owns pipeline; humans still commit (Obsidian; WI9 if/when S1) | WA-1 git author is Oscar/agent, not “sole repo committer” |
| **OD-2** | W5 for every class | No auto-publish in any phase |
| **OD-3** | This spec **supersedes** Proactive Compilation v0.2 | Idle compile APIs: no product UI; optional later “ledger view” |
| **OD-4** | Template wiki page is a **consequence** of registration | WA-5 does not block IKI `register()` |
| **OD-5** | Wiki-side pollers allowed until source hooks land | WA-2 is wiki-only |
| **OD-6** | Floating host chrome → multi-turn chat, free text, context-seeded | WA-4 + B3 |

**Already house law (do not reopen):** WIK-D1 · W5 · W9 no fiction · W7/WA12 no profit claims · Family B out of shared pages · DL-539 · DL-547 suite nav stays · D-12.

---

## Already built — do not rebuild

- Member wiki read path: `wiki_store`, reindex, `/api/wiki/*`, `/app/wiki` (S0 pins, rail shell, suite nav)  
- Board `content_items` + transitions; Oscar W1 **stub** that mints board cards and **does not write git**  
- Idle compile tables/APIs (`wiki_compile_*`, `/api/wiki/compile-*`) — not the new portal  
- `infra/labwiki-sync.plist` pull + reindex  
- Agent keys + `wiki:reindex` (Mike’s WA-1 question: add `contracts:deliver` or equivalent)  
- Quebec poller as **tick precedent** only (`server/quebec_poller.py`)

**Not built:** portal, ledger, agent git commits, pollers, linkage/`wiki_refs`, session chrome, template pages, IKI help-package spec.

---

## Relationship to Member Wiki S1–S6

| Slice | This program |
|-------|----------------|
| **S0** | Shipped. Do not regress. |
| **S1** WI9 + hover | **Out of this plan** unless OD-1(a) or a separate S1 GO. |
| **S2** `corpus_items` | **Pulled into WA-2** as wiki-side registry so pollers have refs (still wiki tree). |
| **S3** transcriber | **Not** this spec. Do not seed. |
| **S4** `wiki_refs` + related rail | **Pulled into WA-3** (engine + refs). Member rail fill can wait; rescore must exist. |
| **S5** compiler into git | **Superseded by this agent** for automated writes. |
| **S6** practice rail | **Out.** Family B. |

---

## Slices

| Slice | Spec | Ships (wiki tree only) | Proof | Stamp |
|-------|------|------------------------|-------|-------|
| **R0** | — | Spec review: India, Mike, Echo+Tango, Hotel. Lima DL after Coach approve | Review notes filed; Coach stamp | **GO SPEC** |
| **WA-1** | §3–4, WA1/2/10/11/13 | Migration `wiki_contracts` + source registry; `POST/GET /api/wiki-agent/contracts`; schema fail-loud; agent principal git commit of a **fixture** draft (no model required for the first commit proof); board card link in ledger | WA1, WA2, WA10, WA11, WA13 | **GO WA-1** |
| **WA-2** | §3.2, WA3/4/9 | Hotel guidelines artifact; `corpus_items` internal kinds **or** contract refs sufficient to point at lessons/help via read APIs; wiki-poller → `source_change`; Oscar `ai.complete()` draft → git **draft** + board `awaiting_approval`; `retired` → annotated draft, no silent delete | WA3, WA4, WA9, WA12 | **GO WA-2** · Hotel first |
| **WA-3** | §5, WA6 | Linkage pass on every ingest: FULLTEXT candidates, threshold `[[wikilinks]]`, `wiki_refs` rescore, reverse-pass as **board-gated revision drafts** | WA6 | **GO WA-3** |
| **WA-4** | §3.4, WA7/8 | Session contract from admin session cookie; affordance **only where Coach three-OK’d chrome**; multi-turn; opening move uses `{surface, route, entity}`; same git+board path | WA7, WA8 | **GO WA-4** · **DL-539** if `/app/*` host chrome |
| **WA-5** | §3.3, WA5 | Accept `registration` at portal; draft template page from Help Package + linkage evidence; no invention | WA5 | **GO WA-5** · Help Package spec in-tree · IKI emit is **not** this packet |

Cross-tree **source delivery hooks** (course save, help publish, IKI `register()` POST) are **not** seeds in this plan. They are specified as the portal contract. Built later under their programs + three-OK. OD-5 pollers are the v0.1 bridge.

---

## Critical path

```
GO SPEC (Coach) after R0 reviews
  Lima DL (OD-1…6 as stamped)

GO WA-1
  WA-1-0  India     envelope schema + registry + no-second-store check
  WA-1-1  Mike      portal auth; contracts:deliver vs session cookie; no Family B in envelope
  WA-1-2  Alpha     migration + POST/GET + validation + ledger
  WA-1-3  Foxtrot   agent git author (local first; MiniTwo only if Coach asks)
  WA-1-4  Kilo      reject/validate/query tests; restore LABS_WIKI_ROOT
  WA-1-5  Lima      Arch 11 paragraph
       → WA-1-G Delta  (WA1, WA2, WA10, WA11, WA13)

GO WA-2
  WA-2-0  Hotel     guidelines for agent-drafted pages (blocking)
  WA-2-1  Alpha     pollers courseware + help via existing read APIs; corpus_items if needed
  WA-2-2  Alpha     Oscar discharge: read pointer → draft.md → git commit → board
  WA-2-3  Kilo      created/updated/retired; invalid pointer → failed; W5 member 404 on draft
       → WA-2-G Delta  (WA3, WA4, WA9, WA12)

GO WA-3
  WA-3-1  Alpha     wiki_refs + FULLTEXT linkage + reverse-pass drafts
  WA-3-2  Charlie   board card lists below-threshold suggestions (admin board UI only)
  WA-3-3  Kilo      WA6
       → WA-3-G Delta

GO WA-4   [needs chrome ruling]
  WA-4-0  Echo+Tango  session panel copy + no gamification
  WA-4-1  Charlie     affordance on allowed routes only
  WA-4-2  Alpha       session contract + transcript handling
  WA-4-3  Mike        admin-only; context.entity Family B rules
       → WA-4-G Delta  (WA7, WA8)

GO WA-5   [needs Help Package spec]
  WA-5-1  Alpha     registration kind + page draft from package
  WA-5-2  Hotel     template page review
       → WA-5-G Delta  (WA5)
```

**Never in these packets:** Options Lab heatmap/Runner internals, Factory job, compile-inbox UI, MiniTwo unless asked, apps-card title (D-1).

---

## File allowlists (when stamped)

### WA-1

| Area | Touch |
|------|--------|
| `migrations/` | `NNN_wiki_contracts.sql` + source registry |
| `server/wiki_agent_*.py` (new) | envelope, portal, ledger, git commit helper |
| `server/routes/wiki_agent.py` (new) | `POST/GET /api/wiki-agent/contracts` |
| `server/agent_auth.py` | new scope if Mike says so |
| `server/tests/test_wiki_agent_*.py` | characterization |
| `agents/p-wiki/` | seeds + gate |
| `Architecture/11-wiki-design.md` | one section |

**WA-1 never:** `web/app/app/wiki/**` member read UI · compile-inbox revival · course/help/IKI trees · `web/lib/runner/**`.

### WA-2

Wiki-side poller module; Oscar discharge (replace stub’s “no git write”); `corpus_items` **if** India says the pointer registry belongs here; Hotel artifact under `agents/p-wiki/` or `Specs/` addendum. Canonical **read** via existing lesson/help HTTP APIs — no writes to those trees.

### WA-3

`wiki_refs` migration; linkage module; tests. Charlie only if board card needs a suggestion list (admin board, not `/app/wiki` member rail unless already empty-hide).

### WA-4

Only after chrome ruling. If three-OK for AppChrome: the **one** host file Coach names. Else: wiki layout + `/admin` only.

### WA-5

Portal `kind=registration` + drafter. **Not** `web/lib/runner/registry.ts` in this packet.

---

## Seeds (written when the matching GO is stamped)

| Seed | Agent | Depends | Feeds |
|------|--------|---------|-------|
| R0-1 India | India | GO SPEC pending | Coach |
| R0-2 Mike | Mike | GO SPEC pending | Coach |
| R0-3 Echo+Tango | Echo, Tango | GO SPEC pending | Coach (WA-4 notes; may defer UI) |
| R0-4 Hotel | Hotel | GO SPEC pending | Coach (guidelines owed at WA-2) |
| WA-1-* | Alpha, Mike, Foxtrot, Kilo, Lima | **GO WA-1** | WA-1-G |
| WA-2-* | Hotel, Alpha, Kilo | **GO WA-2** | WA-2-G |
| WA-3-* | Alpha, Charlie, Kilo | **GO WA-3** | WA-3-G |
| WA-4-* | Echo, Charlie, Alpha, Mike | **GO WA-4** + chrome OKs | WA-4-G |
| WA-5-* | Alpha, Hotel | **GO WA-5** + Help Package spec | WA-5-G |

Juliet writes pasteable seeds **in the same body of work as each GO**, not before.

---

## Gates

| Gate | Evidence |
|------|----------|
| **R0** | Review notes on disk; Coach stamp on spec + ODs; Lima DL |
| **WA-1-G** | Invalid contract → 4xx + ledger `rejected`; valid → `contract_id`; GET disposition; git log shows agent commit + contract ID; `wiki_pages_idx` still only from reindex; member DB not on a fixture; **no** source-tree imports |
| **WA-2-G** | Synthetic courseware + help contracts (poller or POST) → draft files in checkout `status: draft` → board cards → member 404; profit-claim grep clean; retired → annotating draft, page not deleted |
| **WA-3-G** | After ingest, `wiki_refs` rows exist; above-threshold `[[wikilinks]]` in draft; below-threshold listed on board; reverse-pass created a second draft card |
| **WA-4-G** | Admin on an allowed surface opens session; first agent turn cites surface/route; draft path = WA-2 path; non-admin 404 |
| **WA-5-G** | Registration contract with Help Package → draft page with purpose/fit sourced from package + linkage; missing package fields → `failed` or `rejected`, not invented fit |

---

## Coach stamp

- [ ] **Spec v0.1** approved (or AMEND)  
- [ ] **OD-1** (a) sole committer / **(b)** pipeline only — proposal **(b)**  
- [ ] **OD-2** no skip-board — proposal **none**  
- [ ] **OD-3** standalone supersedes v0.2 — proposal **standalone**  
- [ ] **OD-4** consequence — proposal **consequence**  
- [ ] **OD-5** pollers — proposal **yes**  
- [ ] **OD-6** chrome+chat — proposal **floating chrome / multi-turn**; if yes, **three OKs for AppChrome** or narrow routes: ________  
- [ ] **GO WA-1**  
- [ ] **GO WA-2** … **GO WA-5** as later stamps  
- [ ] **Amend**  
- [ ] **Stop**

**Signed:** Juliet (plan v1.0 — no build authority)  
**Date:** 2026-08-23
