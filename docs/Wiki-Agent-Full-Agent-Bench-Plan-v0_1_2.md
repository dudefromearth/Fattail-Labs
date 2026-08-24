# Wiki Agent — Full Agent Bench Plan v0.1.2

**Program:** Wiki Agent (contract portal, git-funneled drafts, D1–D7).  
**Spec of record:** [`Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_3.md`](../Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_3.md) (v0.1.2 SUPERSEDED).  
**Supersedes:** [`docs/Wiki-Agent-Full-Agent-Bench-Plan-v1.0.md`](./Wiki-Agent-Full-Agent-Bench-Plan-v1.0.md) (written against spec v0.1).  
**Directive / audit:** [`Wiki-Agent-Directive-and-Compliance-Audit-Charge-v0_1.md`](./Wiki-Agent-Directive-and-Compliance-Audit-Charge-v0_1.md) · [`Wiki-Agent-Directive-Compliance-Audit-2026-08-23.md`](./Wiki-Agent-Directive-Compliance-Audit-2026-08-23.md)  
**Parents:** Member Wiki v0.1 · Wiki Interface v0.1 · Arch **11** · **DL-545/546/547/548/549/550/551/552/553**  
**Board:** continue [`agents/p-wiki/`](../agents/p-wiki/). Do not restart the member-wiki spine. Do not run Member Wiki S1–S6 unless Coach stamps those separately.

Juliet. **GO WA-1…WA-3 stamped.** **GO WA-4 granted** 2026-08-23 (riders below).
**WA-5** not granted — Coach must first **direct creation** of the IKI Template
Help Package spec and **name file + version**; no one self-assigns it.
**WA-6 defined, not stamped;** Coach stamps timing. Access rule already directed
(DL-551); WA-6 reviews cover implementation, not whether.

**WA-2-3 (record now, seed at GO WA-2):** Kilo induces one mid-discharge failure
proving ledger `failed` + `failed-partial` board card (spec §3.0). Not this packet.

**Isolation (Coach 2026-08-23):** Wiki development only. Factory, Runner, Options Lab, Market Bus, Trade Log — **not touched** unless Coach names them and, for frozen trees, records **three successive OKs (DL-539)**.

---

## What changed from plan v1.0 (spec v0.1.2 deltas)

| Spec v0.1.2 | Plan consequence |
|-------------|------------------|
| **§3.1 session lifecycle (settled).** Validates on **open** (context + admin). Transcript **accretes** while live. **Seals immutable at close.** Follow-on = new session contract referencing the sealed id. “WA-4 seed inherits this as settled.” | Not an OD. WA-1 schema includes open/accrete/seal fields. WA-4 implements the session API + UI. Kilo proves seal immutability. |
| **§5 build status.** Stage ⑤ / `wiki_refs` / `corpus_items` **do not exist**. This program **builds** v1 linkage in the wiki tree (WA-3) and the **pointer registry** in WA-2 (India). | Plan v1.0 B5 is **absorbed**. WA-2 ships the pointer registry (not optional). WA-3 ships linkage from scratch — no “wire existing engine.” |

**2026-08-23 plan amendment (Coach rulings + GO WA-4):**

| Ruling | Plan consequence |
|--------|------------------|
| **DL-551** wiki contents **wide open by default**; D-3 dissolved | No public-read code in WA-4. Slice **WA-6** defined below, unstamped (Coach stamps timing). W5 = unauthenticated 404 on drafts when WA-6 ships. Reviews = implementation, not whether. |
| **DL-552** access doctrine | Specs do not default public *or* gated. Coach directs; else OPEN to Coach. Wiki directed rule: wide open by default; restrictions only when Coach names them. |
| **DL-553** session semantics | Affordance = admin-only in-place-admin. “Anywhere” = context-into-entry. v0.1.3 cut in the WA-4 packet. |
| **GO WA-4** + riders | Session API + wiki-layout panel + queue drain. **Rider 1 mount:** `web/app/app/wiki/layout.tsx` + `web/components/wiki/WikiAgentPanel.tsx` via `useIsAdmin()`. **Does not touch `web/components/AppChrome.tsx`.** Not a DL-539 three-OK. |

Unchanged: W5; git SoR; wiki-only isolation. WA-5 waits on Coach directing the Help Package spec (A5).

---

## Juliet review (labeled)

Coach’s spec text stays in `Specs/`. Nothing below deletes it.

### Blocking for *sequencing* (not for spec content)

| # | Item |
|---|------|
| B1 | File header is **DRAFT**. Review gates → Coach approval → DL → **then** GO WA-1. |
| B2 | **OD-1…OD-6** are proposals. Plan assumes Coach stamps them **as proposed**. A different ruling re-sequences. |
| B3 | **CLOSED for WA-4 (Rider 1).** Coach granted the affordance on **wiki-owned layout** / in-place-admin machinery. Juliet determination: mount `WikiAgentPanel` from `web/app/app/wiki/layout.tsx`. **AppChrome is not touched.** A later “every `/app/*`” chrome still needs DL-539 three-OK. |
| B4 | **WA-5** waits until Coach **directs creation** of the IKI Template Help Package spec and **names file + version** (A5). No self-assign. A registration emit still lives in the IKI tree (DL-539). Wiki-side can accept `registration` contracts without editing Runner. |

### Opinion (Coach may discard)

| # | Item |
|---|------|
| O1 | Sealed session transcript is **contract evidence** (spec §3.1), not a wiki page. Live accretion lives on the ledger row until `sealed_at`. Pages remain git-only. That is how we read “content never lives here” next to the session exception. |
| O2 | “One agent cycle” = one poller tick at seed time; else ledger `failed` with reason. |
| O3 | Do **not** revive `CompileLauncher`. Portal is `/api/wiki-agent/*`. |
| O4 | Hotel **before** first agent-drafted page (Member Wiki W6) = WA-2-0. |
| O5 | WI9 stays Member Wiki **S1** if OD-1 = (b). |
| O6 | Close with no draft: status stays `validated`, `sealed_at` set, WA13 still queryable. Spec does not name “abandoned.” |

---

## Intent (spec §0–§1)

The Wiki is a standalone function fronted by one agent. Nothing enters except a **contract at a portal**. The agent validates fail-loud, discharges the covenant, linkage-passes, commits through git, never publishes (W5). Sources deliver contracts (or wiki-side pollers under OD-5). Admins deliver **session** contracts (open → accrete → seal).

Success = **WA1–WA13**. Phases = spec §8 **WA-1…WA-5**.

---

## Store law (unchanged)

Git is the only writer of wiki **page bytes**. MySQL = derived index (`wiki_pages_idx` / `wiki_links_idx`) **plus** contracts ledger (state; sealed session transcript as **evidence**, not a page).

1. Agent commits land on the **remote**; other hosts **D-12 pull + reindex**.  
2. Reindex remains the only writer of index rows.  
3. Tests must not leave a fixture vault on the member DB.  
4. **No** second authoring table named `wiki_pages`. Ledger = `wiki_contracts` + source registry + **pointer registry** (WA-2).  
5. Git credentials never go to `ai.complete()`. The **server** commits.  
6. `kind=session`: mutable transcript only while unsealed; after `sealed_at`, payload is immutable (new contract to continue).

---

## Locked only after Coach stamp

Until then these are **spec proposals**, not house law:

| ID | Spec proposal | Blocks |
|----|---------------|--------|
| **OD-1** | (b) agent owns pipeline | WA-1 git author is the agent principal, not sole repo committer |
| **OD-2** | W5 for every class | No auto-publish |
| **OD-3** | This spec **supersedes** Proactive Compilation v0.2 | Idle compile APIs: no product UI |
| **OD-4** | Template page = **consequence** of registration | WA-5 does not block IKI `register()` |
| **OD-5** | Wiki-side pollers until source hooks | WA-2 is wiki-only |
| **OD-6** | Floating host chrome → multi-turn chat | WA-4 UI + B3 |

**Settled in spec v0.1.2 (not OD):** session open / accrete / seal.  
**Already house law:** WIK-D1 · W5 · W9 no fiction · W7/WA12 · Family B · DL-539 · DL-547 · D-12.

---

## Already built — do not rebuild

- Member wiki read path (S0 pins, rail shell, suite nav)  
- Board + Oscar W1 stub (**no git write**)  
- Idle `wiki_compile_*` APIs — **not** the new portal  
- `labwiki-sync.plist` pull + reindex  
- Agent keys + `wiki:reindex`  
- Quebec poller as **tick precedent** only  

**Not built:** portal, ledger, session lifecycle API, agent git commits, pollers, pointer registry, `wiki_refs`, linkage pass, session chrome, template pages, IKI help-package spec.

---

## Relationship to Member Wiki S1–S6

| Slice | This program |
|-------|----------------|
| **S0** | Shipped. Do not regress. |
| **S1** WI9 + hover | **Out** unless OD-1(a) or a separate S1 GO. |
| **S2** `corpus_items` | **WA-2 pointer registry** (spec: India’s WA-2 ruling). Wiki tree. |
| **S3** transcriber | **Not** this spec. |
| **S4** `wiki_refs` + related rail | **WA-3 builds `wiki_refs` + engine.** Member Related rail fill can wait; rescore must exist. |
| **S5** compiler into git | **Superseded** by this agent for automated writes. |
| **S6** practice rail | **Out.** Family B. |

---

## Slices

| Slice | Spec | Ships (wiki tree only) | Proof | Stamp |
|-------|------|------------------------|-------|-------|
| **R0** | — | India, Mike, Echo+Tango, Hotel. Lima DL after Coach approve | Notes filed; Coach stamp | **GO SPEC** |
| **WA-1** | §3–4, §3.1 session fields, WA1/2/10/11/13 | `wiki_contracts` + source registry; envelope v1; `POST/GET /api/wiki-agent/contracts`; fail-loud validation; **session columns** (`sealed_at` / open flag) even if accretion API is WA-4; agent git commit of a **fixture** draft (no model); board id on ledger | WA1, WA2, WA10, WA11, WA13 | **GO WA-1** |
| **WA-2** | §3.2, §5 pointer registry, WA3/4/9 | Hotel guidelines; **pointer registry**; wiki-pollers → `source_change`; Oscar draft → git `status: draft` + board `awaiting_approval`; `retired` annotates, never silent delete | WA3, WA4, WA9, WA12 | **GO WA-2** · Hotel first |
| **WA-3** | §5, WA6 | **Build** linkage: FULLTEXT candidates, threshold `[[wikilinks]]`, `wiki_refs` rescore, reverse-pass as board-gated revision drafts. No “existing engine.” | WA6 | **GO WA-3** |
| **WA-4** | §3.1 lifecycle + §3.4, WA7/8 · v0.1.3 | Session **open** → **accrete** → **seal**; follow-on new contract; opening turn cites `{surface, route, entity}`; **context-into-entry** frontmatter; admin-only wiki-layout panel; **queue drain** (N env, fail-loud) | WA7, WA8 + riders | **GO WA-4** (2026-08-23) |
| **WA-5** | §3.3, WA5 | `registration` kind; draft from Help Package + linkage evidence; no invention | WA5 | **not stamped.** Coach directs Help Package spec creation and names file + version first (A5). No self-assign. |
| **WA-6** | DL-551 | Unauthenticated wiki **read** path. Sierra SEO/AEO + Mike exposure-mechanics review (unauthenticated 404 on drafts; no member-personal data; no “In your practice” / Family B on public pages). Access rule already directed — reviews cover implementation, not whether. | Published pages readable unauthenticated; drafts 404 | **Defined, not stamped.** Coach stamps timing. |

Cross-tree delivery hooks are **not** seeds here. OD-5 pollers are the v0.1 bridge.

---

## Session contract (settled — WA-1 schema, WA-4 behavior)

```
open   POST  kind=session, payload.context + admin
       → contract_id, status=validated, sealed_at=NULL
accrete  (WA-4) append turns to payload.transcript while sealed_at IS NULL
seal   close session → sealed_at set; payload immutable
after  POST new session contract referencing sealed contract_id
```

Draft pages (if any) still go git + board (WA8). Authoring direction ≠ publish gate.

---

## Critical path

```
GO SPEC after R0
  Lima DL (OD-1…6 as stamped)

GO WA-1
  WA-1-0  India     envelope + registry + session columns + no-second-store
  WA-1-1  Mike      portal auth; contracts:deliver vs admin cookie; Family B out of envelope
  WA-1-2  Alpha     migration + POST/GET + validation (session open ≠ sealed)
  WA-1-3  Foxtrot   agent git author (local first; MiniTwo only if Coach asks)
  WA-1-4  Kilo      reject/validate/query; restore LABS_WIKI_ROOT
  WA-1-5  Lima      Arch 11
       → WA-1-G Delta  (WA1, WA2, WA10, WA11, WA13)

GO WA-2
  WA-2-0  Hotel     guidelines (blocking)
  WA-2-1  Alpha     pointer registry; pollers via existing read APIs
  WA-2-2  Alpha     Oscar: pointer → draft.md → git commit → board
  WA-2-3  Kilo      created/updated/retired; bad pointer → failed; member 404 on draft
       → WA-2-G Delta  (WA3, WA4, WA9, WA12)

GO WA-3
  WA-3-1  Alpha     wiki_refs + FULLTEXT linkage + reverse-pass drafts (build, do not reuse)
  WA-3-2  Charlie   board card below-threshold suggestions (admin board only)
  WA-3-3  Kilo      WA6
       → WA-3-G Delta

GO WA-4   [granted 2026-08-23; Rider 1 = wiki layout]
  WA-4-0  Echo+Tango  panel copy (R0-3; members never see it)
  WA-4-1  Charlie     WikiAgentPanel on wiki layout via useIsAdmin
  WA-4-2  Alpha       open / accrete / seal; context-into-entry; queue drain
  WA-4-3  Mike        admin-only both layers; Family B out of context.entity
  WA-4-4  Kilo        seal immutability; follow-on; drain decrement; Rider 3
       → WA-4-G Delta  (WA7, WA8 + riders)

WA-6      defined, unstamped — Sierra + Mike before any stamp request

GO WA-5   [Help Package spec]
  WA-5-1  Alpha     registration kind + page from package
  WA-5-2  Hotel     template page
       → WA-5-G Delta  (WA5)
```

**Never in these packets:** Options Lab / Runner internals, Factory job, compile-inbox UI, MiniTwo unless asked, apps-card title (D-1).

---

## File allowlists (when stamped)

### WA-1

| Area | Touch |
|------|--------|
| `migrations/` | `NNN_wiki_contracts.sql` + source registry + session `sealed_at` |
| `server/wiki_agent_*.py` (new) | envelope, portal, ledger, git commit helper |
| `server/routes/wiki_agent.py` (new) | `POST/GET /api/wiki-agent/contracts` |
| `server/agent_auth.py` | new scope if Mike says so |
| `server/tests/test_wiki_agent_*.py` | characterization |
| `agents/p-wiki/` | seeds + gate |
| `Architecture/11-wiki-design.md` | one section |

**WA-1 never:** member `/app/wiki` read UI · compile-inbox revival · course/help/IKI trees · `web/lib/runner/**` · session chrome (WA-4).

### WA-2

Pointer registry migration; wiki-side poller; Oscar discharge (git write); Hotel artifact. **Read** lesson/help HTTP APIs only — no writes to those trees.

### WA-3

`wiki_refs` migration; linkage module; tests. Charlie only for board suggestion list.

### WA-4

Session accrete/seal/draft routes; linkage-queue drain. Chrome: **wiki-owned**
`web/app/app/wiki/layout.tsx` + new `web/components/wiki/WikiAgentPanel.tsx`.
**Never** `web/components/AppChrome.tsx`. Tests. Spec v0.1.3 + Arch 11 + DLs.

### WA-6 (defined, not an allowlist yet)

Unauthenticated wiki read. Not this packet.

### WA-5

Portal `kind=registration` + drafter. **Not** `web/lib/runner/registry.ts`.

---

## Seeds (written when the matching GO is stamped)

| Seed | Agent | Depends | Feeds |
|------|--------|---------|-------|
| R0-1…4 | India, Mike, Echo+Tango, Hotel | GO SPEC pending | Coach |
| WA-1-* | Alpha, Mike, Foxtrot, Kilo, Lima | **GO WA-1** | WA-1-G |
| WA-2-* | Hotel, Alpha, Kilo | **GO WA-2** | WA-2-G |
| WA-3-* | Alpha, Charlie, Kilo | **GO WA-3** | WA-3-G |
| WA-4-* | Echo, Charlie, Alpha, Mike, Kilo | **GO WA-4** + chrome OKs | WA-4-G |
| WA-5-* | Alpha, Hotel | **GO WA-5** + Help Package spec | WA-5-G |

Juliet writes pasteable seeds **in the same body of work as each GO**, not before. WA-4 seed **must** encode open → accrete → seal as settled spec, not as an OD.

---

## Gates

| Gate | Evidence |
|------|----------|
| **R0** | Review notes; Coach stamp on spec v0.1.2 + ODs; Lima DL |
| **WA-1-G** | Invalid contract → 4xx + `rejected`; valid → `contract_id`; GET disposition; git log agent commit + contract ID; index only via reindex; member DB not on a fixture; no source-tree imports; session open accepted **without** sealed transcript |
| **WA-2-G** | Courseware + help contracts → draft files `status: draft` → board → member 404; profit-claim grep clean; retired → annotating draft; pointer registry rows exist |
| **WA-3-G** | After ingest: `wiki_refs` rows; above-threshold `[[wikilinks]]` in draft; below-threshold on board; reverse-pass second draft card |
| **WA-4-G** | Open with `{surface, route, entity}`; first agent turn cites them; accrete then seal; mutate after seal **rejected**; follow-on new `contract_id`; context-into-entry draft file; draft path = WA-2 path; Rider 2 drain proof; Rider 3 both-layers; house box tolerated 8 only |
| **WA-5-G** | Help Package → draft with purpose/fit from package + linkage; missing fields → `failed`/`rejected`, not invented fit |

---

## Coach stamp

- [ ] **Spec v0.1.2** approved (or AMEND)  
- [ ] **OD-1** (a) / **(b)** — proposal **(b)**  
- [ ] **OD-2** no skip-board — proposal **none**  
- [ ] **OD-3** standalone supersedes v0.2 — proposal **standalone**  
- [ ] **OD-4** consequence — proposal **consequence**  
- [ ] **OD-5** pollers — proposal **yes**  
- [ ] **OD-6** chrome+chat — proposal **floating chrome / multi-turn**; if yes, **three OKs for AppChrome** or narrow routes: ________  
- [ ] **GO WA-1**  
- [ ] **GO WA-2** … **GO WA-5** as later stamps  
- [ ] **Amend**  
- [ ] **Stop**

**Signed:** Juliet (plan v0.1.2 — no build authority)  
**Date:** 2026-08-23
