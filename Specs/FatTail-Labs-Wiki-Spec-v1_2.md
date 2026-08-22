# FatTail Labs — Wiki Spec v1.2

**Scope statement (doctrine, 2026-08-22)**
- **Active program:** IKI Lab — Wiki.
- **Touches:** this spec (**amends and seats** — Member Wiki v0.1 remains spec of record for storage, course corpus, ①②⑤, and W1–W11; this spec adds IKI's intent: also map what *ships*); agent charter `agents/bench/oscar.md` (new, companion); parent amendments **named** in §9 (Help Arch, Content Board, Template Runner), not made.
- **Touches outside program:** **NONE.** The admin interface, including any mount outside IKI/Wiki routes, is the **Wiki Admin Interface Spec v0.1.2** (companion) and carries its own scope statement.

**Status:** DRAFT v1.2 — **seated for W0 only** (Coach GO 2026-08-22, plan v1.1). No BUILD AUTHORITY for W1+. Grok rounds 3–4 folded; **[v1.2]** marks the ③ path split. **First seed is §14 W0.**
**Date:** 2026-08-22
**Canonical filename:** `Specs/FatTail-Labs-Wiki-Spec-v1_2.md`
**Companions:** `Specs/FatTail-Labs-Wiki-Admin-Interface-Spec-v0_1_2.md` (v0.1.2) · `agents/bench/oscar.md` (v0.3) · `Specs/oscar_2.md` (charter source)
**Carries forward:** Wiki Proactive Compilation Spec v0.1–v0.4 (files: `FatTail-Labs-Wiki-Proactive-Compilation-Spec-v0_{1,2,3,4}.md`, advisor outputs 2026-08-21/22 — Juliet may diff them) and Grok review rounds 1–3 — every law, OD, and AT below that originated there is marked **(WP)**. That lineage is retired by this spec; nothing in it is lost.

**Parents:**

| Doc | Role |
|---|---|
| Member Wiki Spec v0.1 | **Spec of record** for storage (§3.0), tables §3.1–3.4, course-corpus pipeline ①②⑤, laws W1–W11. **Not superseded.** This spec adds a parallel watcher and seats Oscar at ③. |
| IKI Lab Executive Summary (Coach, 2026-08-22) | §7 Wiki *waits, does not invent*; §9 public door; §10 Intelligence use-mode per product; §12 `audience` includes `public` |
| IKI Template Help Package Spec v0.1 | Help package as a required TR7 field — **not yet in-tree**; cited by SHA when landed |
| Help System Architecture v0.1 | `help_articles` §5, H1 `surface_key` registry (phase), governance §6, parity rule |
| Content Board Spec v1.0 | `content_items` — the only approval machinery |
| Identity-Access v1.0 | `administrator` is the only operator role; no change |
| CLAUDE.md · AGENTS.md · DL-539 · DL-176 | Invariants; frozen trees; Coach Content Law |

---

## 0. Coach's intent (verbatim in intent, 2026-08-21/22)

> The way I designed the Wiki was to be agent-curated, always looking for new developments in the repo and adding them to the wiki. … The spec is as intended. I just want to make sure that the intent works when we create new stuff. Currently it only works if in the course of committing content to the repo we tell it to add it to the help or wiki.

> The wiki agent must be proactive, and flag any new content coming into the repo that has been deployed to production as a potential wiki and help system entry. If there are explicit directives … it continues as designed, but if there are not, it should keep a compiled list of things that were not explicitly asked to go into the wiki and ask for approval.

> My view of this spec is to reposition how the wiki works and the scope of the agent associated with the wiki. And to provide an admin interface to the wiki.

> [Exec Summary §7] Wiki: already exists. Agent-curated compiled map. Waits for what we actually create and ship, then files and links it. Does not invent the product.

## 1. What the wiki is (repositioned)

The wiki is the **compiled map of everything FatTail Labs ships.** Not only lessons and replays — templates, features, help, and (when the staff partition exists) specs and decisions. It is agent-curated under a standing brief and human-approved before anything is member-visible. It waits for what ships; it never proposes what to build.

Four parties, four jobs:

| Party | Job | Never |
|---|---|---|
| **Deploy watcher** (code — tick or hook; India/Foxtrot) **[v1.1]** | Diff deployed SHA over §3 deploy kinds; upsert candidate identities. Deterministic. | Infer kinds from prose. Call a model. |
| **Oscar** (agent principal, charter `agents/bench/oscar.md` v0.3) | Propose target/audience on each candidate. Compile path-dependent (§7): course = transcript prose; deploy/admin-point = stubs on disposition (OD-WK2). File and link on publish (WK15, path-dependent). Compile the directed path (③) for both corpora. | Invent product. Publish. Widen audience. Touch page data or Family B. Poll YouTube. Transcribe. Invoke ⑤. |
| **Administrator** (via Admin Interface Spec) | Dispose candidates: compile or dismiss. Point at a surface. | Approve pages in the inbox (that's the board). |
| **Content board** (W5) | Approve or reject compiled pages and help drafts. | Retarget. Re-enter candidates. |

## 2. Laws (WK1–WK15)

| # | Law | Source |
|---|---|---|
| **WK1 — Corpus is what ships** **[v1.1 restated]** | After bootstrap (WK7), a candidate exists for each **new or versioned** undirected §3 deploy kind on a production deploy (WK2a), and for each admin-point (WK2b). Not "everything live." Course corpus (`lesson\|live_session\|youtube_video\|resource`) continues to enter via Member Wiki ①, not via this law. | Coach · (WP1) · Grok r3 #5 |
| **WK2 — Two inputs, two registrars, one compiler** **[v1.1]** | (a) Deploy event `{sha, ts, env=production}` → **deploy watcher** (code) diffs §3 deploy kinds. (b) Admin-point → candidate directly; never SHA-diffed, never the directive shortcut. Member Wiki ① (course tick) and ② (transcriber) are **untouched and parallel**. Oscar is ③ for both paths. | (WP1, WP6) · Grok r3 #1, #3 |
| **WK3 — Directive path unchanged, and ③ is path-dependent** **[v1.2]** | **Course corpus** (new/updated transcript, or directive) flows ①→②→③ exactly as Member Wiki v0.1: ③ drafts **prose pages from transcript**, Hotel-gated (W6). OD-WK2 does **not** apply. **Deploy kinds** with a directive flow ①'→③ (no ②): stubs, no candidate. Directed reject has no inbox recovery; re-enter via admin-point or a later version. | Coach · Grok r4 |
| **WK4 — Undirected path** | No directive → candidate list (append-only) + Oscar's proposal (§6). Waits for **compile disposition**. Nothing compiled without it. | Coach · (WP3) |
| **WK5 — Approval stays on the board** | Candidate dispositions: `compile \| dismiss`. `compiled` = handed to the board. Board outcomes live on `content_items`; the candidate never carries approval state. | (WP4, r2#3) |
| **WK6 — Target at compile** | `wiki \| help \| both` is set at compile. Board never retargets. Both-target mints two `content_items`, each W5-approved independently. | (WP5, §5.2) |
| **WK7 — Identity and bootstrap** | One identity key per kind (§3). First registered SHA is a snapshot: index, zero candidates. Duplicate identity while `open\|compiling` is idempotent. | (WP10, r2#2) |
| **WK8 — Nothing lost** | Append-only. `dismiss` marks. Dismissed identity re-surfaces on a new version. | PDS §9 · (WP9) |
| **WK9 — Audience** | `audience: public \| member \| staff` on every candidate. `public` = IKI views under the Exec §9 license. `member` → help and/or member wiki. `staff` → staff wiki only, never help, never member/public-visible. **Never widened** at compile; narrowing allowed. Staff compile refused until a staff sink exists (OD-WK3). | (WP11) · Exec §12 |
| **WK10 — No self-candidate** | Pages or help articles compiled by Oscar do not re-enter. Human-authored help with no wiki link may (wave 2). | (WP12) |
| **WK11 — The wiki waits** | Oscar proposes only what shipped or was pointed at. The candidate list is not a product backlog. | Exec §7 · (WP13) |
| **WK12 — Link, never copy** | A template's help package is its corpus body; compile writes it to `help_articles` (its home, TH2) and the wiki page **links** it. No verbatim copy into wiki prose (W9). | Coach · (WP8) |
| **WK13 — Intelligence use-mode is filed, not granted** | For an Intelligence-class template the help article and wiki page state the use-mode (Knowledge license or contract). Unset mode → compile refused. The wiki never grants a contract. | Exec §10 |
| **WK14 — Member Wiki laws W1–W11 stand** | Carried forward unchanged. **W1 is the as-built course registrar ①; the deploy watcher does not replace it.** W11 restated as a hard boundary on Oscar. | Member Wiki v0.1 · Grok r3 #1 |
| **WK15 — File at publish, path-dependent** **[v1.2]** | Compile mints drafts + `content_items` only. On the board's publish event (OD-WK9): **deploy kinds** → `corpus_items` row + page→help ref + `compiled_from`; **course kinds** → `wiki_refs` (`relation=source`) only — their `corpus_items` already exist from ①; never a second row. A rejected compile leaves nothing. ⑤ stays a tick. | Grok r3 #4, r4 |

## 3. Corpus kinds, identity, waves

Origin (`agent_found \| admin_pointed`) is a column on every candidate, not a kind.

| kind | Canonical source | Identity key | Default audience | Wave |
|---|---|---|---|---|
| `template` | Runner registry, on deployed SHA | `id@version` | from the template's license metadata (`public` if public-licensed; else `member`) | **1** |
| `feature` | Help Arch **H1** `surface_key` registry (as-built prerequisite, §9) | `surface_key` [+ declared `state_key` when discriminating] — same key for both origins; `app`/`route` are columns | `member` (no public IKI route exists yet; `public` is never inferred from a route — Grok r3 #8) | **1** |
| `spec` | `Specs/*.md` on deployed SHA | path + version | `staff` | deferred — OD-WK3 |
| `decision` | `Architecture/00-decision-log.md` | `DL-N` | `staff` | deferred — OD-WK3 |
| *(carried)* `lesson \| live_session \| youtube_video \| resource` | Member Wiki §3.1 | as today | `member` | as-built |

`help_article` is **output**, not a kind (WK10). Removals and behavior changes on existing routes via registrar: wave 2 (AT-WK19); admin-point is the wave-1 path.

## 4. Pipeline (Member Wiki §4 — parallel watcher added, nothing removed) **[v1.1]**

```
 COURSE CORPUS (as-built, untouched)          DEPLOY KINDS (new, this spec)
 ① registrar tick — lesson | live_session     ⓪ DEPLOY EVENT {sha, ts, env=production} (OD-WK1)
     | youtube_video | resource → corpus_items       ▼
        ▼                                      ①' DEPLOY WATCHER (code) — diff SHA over §3 deploy kinds;
 ② transcriber — captions / Whisper               first SHA = snapshot (WK7); upsert identities
        ▼                                            ▼
        │                                      directive? (§5) ── yes ──┐
        │                                            │ no               │
        │                                            ▼                  │
        │                                      ①'' CANDIDATE LIST + OSCAR PROPOSAL (§6)  ◄── ⓪' ADMIN POINT (Admin Interface)
        │                                            ▼
        │                                      ⓐ DISPOSITION (administrator): compile [wiki|help|both] · dismiss
        │                                            │ compile
        ▼                                            ▼
 ③ COMPILER — OSCAR (path-dependent §7): course = transcript prose; deploy/admin-point = stubs (OD-WK2) — mints 0–2 content_items ◄───────────────┘
        ▼
 ④ BOARD — awaiting_approval → published | rejected      (publish event → OD-WK9)
        ▼ on publish
 OSCAR FILE & LINK (WK15, path-dependent): deploy → corpus_items + page→help ref + compiled_from; course → wiki_refs source only
        ▼
 ⑤ RELATED ENGINE — tick, unchanged; Oscar does not call it
```

ⓐ writes disposition only. ③ mints. No arrow from `published` back to ①' (WK10). The course path ①→②→③ is exactly Member Wiki v0.1.

### 4.1 Disposition states
`open → compiling → compiled` · `open → dismissed`. Board outcomes displayed derived from `compiled_content_ids`, read-only.

### 4.2 Candidate table (OD-WK4 → sibling, not `corpus_items`)
```
wiki_compile_candidates
  id, identity_key, kind, origin, title, source_ref,
  deployed_sha, deployed_at,                 -- null for admin_pointed
  surface_key, state_key, route,             -- feature only; state_key from H1 registry
  audience, suggested_target, suggested_title, rationale, suggested_parent,
  note, disposition, compiled_content_ids,
  created_at, disposed_at, disposed_by
```
Append-only. `corpus_items.kind` gains `template \| feature` — row written **at publish** (WK15, §9).

## 5. Directive (OD-WK5 recommendation)
One machine-detectable marker, two places: commit trailer `Wiki: <path|none>` / `Help: <surface_key|none>`; spec frontmatter `wiki:` / `help:`. Absence = undirected. The help package is corpus, never a directive flag.

## 6. Oscar's proposal (the agent's responsibility)

Attached to every candidate before display: `suggested_target` (wiki/help/both) · `audience` (§3 default) · `suggested_title` · `rationale` (one line, cites the missing link — e.g. "no help article bound to `surface_key=iki.runner`") · `suggested_parent`.

Rule of thumb (fixed, in the charter): member surface → help, wiki links · template → help (package is body), wiki links · spec/DL → staff wiki · admin-pointed → help default, wiki optional — **until OD-WK6 closes, suggest `wiki`** so the proposal matches what the chooser allows (W1). **Never an unbuilt thing (WK11).**

## 7. Compile — ③ is not one behavior **[v1.2]**

| Path | Trigger | ③ does | Governance |
|---|---|---|---|
| **Course** (①→②→③) | new/updated transcript, as today | **Existing compiler:** draft prose pages from transcript. Unchanged. | Hotel W6 guidelines — unchanged |
| **Deploy / admin-point** (①' or ⓪' → ⓐ → ③) | `disposition=compile`, or deploy-kind directive | **Stubs:** structured fields from source, no generated prose (**OD-WK2 — scoped to this path only**). For `template`, the fields are the help package, already gated at authoring (TH / Tango / Hotel). Board approval is "this goes live on this surface." | No new Hotel load iff stubs |

OD-WK2 asks about the second row only. The course row is not in the question.

## 8. Write matrix (Mike)

| Writer | May write | May not |
|---|---|---|
| Deploy watcher (code) | candidate rows on deploy diff; last-registered SHA | disposition, corpus, help, page data; any model call |
| Oscar — proposer | proposal fields on a candidate | identity, disposition |
| Oscar — compiler (deploy path) | wiki/help stub drafts + `content_items` **after** `disposition=compile` or deploy-kind directive | publish; candidate identity; `corpus_items`; Family B |
| Oscar — compiler (course path) | prose draft pages from transcript, as Member Wiki ③ today | anything this spec adds |
| Oscar — filer (on publish event) | deploy kinds: `corpus_items` row + page→help ref + `compiled_from`; course kinds: `wiki_refs` source only | anything before publish; a second corpus row; ⑤ |
| Administrator (Admin Interface Spec) | disposition, note, target, audience narrowing | identity, SHA, source ref, audience widening |
| Board | `content_items` transitions | candidate table |

## 9. Parent amendments (the India packet — none seeded until landed or declined)

| Parent | Change | Why |
|---|---|---|
| Template Runner / IKI Template Help Package **in-tree** | Help package as named TR7 field (TH1–TH3) | WK12; `kind=template` has no body without it |
| Member Wiki §3.1 | `corpus_items.kind` += `template \| feature`, written at **publish** (WK15) | W9 |
| Content Board | **publish event** consumable by Oscar (OD-WK9) | WK15 needs a trigger; Oscar has no board authority |
| Member Wiki §3.3 | `wiki_pages.kind` for tool/template pages (`concept`, or a new kind) | not `topic\|concept\|recap\|glossary` by default |
| Member Wiki §3.4 | page → `help_articles` relation | "wiki links help" has no row |
| Help Arch §5 | `help_articles.compiled_from_candidate_id`, `audience` | WK10, WK9 |
| Help Arch §5–§6 | Compiler-originated drafts; board as publish gate **or** explicit "W5 does not apply to help" | OD-WK6 |
| Content Board §3.2 | `product_line` += `wiki \| help` iff OD-WK6 = board | cards cannot carry these today |
| Help Arch H1 | `surface_key` (+ `state_key`) registry **as-built** | `kind=feature` SoR; H1 is a phase today |
| Identity-Access | **none** | administrator only |
| AGENTS.md roster | seat **Oscar** | charter companion |

## 10. Acceptance (registrar / compile; interface ATs live in the Admin Interface Spec) — **tagged by §14 slice** **[v1.2]**

**W0:** AT-WK5 (+ Admin AT-WA1, WA6, WA11). **W1:** AT-WK11, AT-WK12, AT-WK13 wiki-only (+ Admin AT-WA2–5, WA7–8, WA10). **W2:** AT-WK6, AT-WK7. **W3:** AT-WK3, AT-WK9, AT-WK10. **W4:** AT-WK1, AT-WK2, AT-WK4, AT-WK8. Delta does not fail a slice on a later slice's AT.


| AT | Evidence |
|---|---|
| AT-WK1 | Second deploy adds a `feature` with no directive → one candidate, `agent_found`, correct SHA, proposal attached. |
| AT-WK2 | Deploy with directive → no candidate; compiler runs; board card. |
| AT-WK3 | Template on deployed SHA → `kind=template`; compile → `help_articles` draft body = package; wiki page cites it; wiki body lacks the package verbatim (diff). |
| AT-WK4 | Dismiss → marked; redeploy new version → re-surfaces. |
| AT-WK5 | First SHA → zero candidates; watcher records last-registered SHA. **W0 AT.** |
| AT-WK13 **[v1.2]** | **Deploy-kind** compile: publish event → `corpus_items` row + page→help ref; board reject → no corpus row. **Course-kind** compile: publish → `wiki_refs` source row; `corpus_items` count unchanged. |
| AT-WK6 | Both-target → two `content_items`; reject help, approve wiki → mixed outcome displayed; candidate stays `compiled`. |
| AT-WK7 | `audience=staff` → compile refused; widening refused; narrowing recorded. |
| AT-WK8 | Oscar-compiled help article does not re-enter. |
| AT-WK9 **[v1.1]** | Template `public`-licensed → candidate and help draft carry `audience=public`; article stays draft / member-invisible. **Flag only; no public render** until OD-WK7. |
| AT-WK10 | Intelligence-class template, mode unset → compile refused; mode set → page names it. |
| AT-WK11 | Admin-point on a surface with an `open` agent_found row → same row, origin noted; no second identity. |
| AT-WK12 | Admin-point on a surface whose deploy carried a directive → candidate still created. |
| AT-WK19 | Removals / behavior change on existing routes: wave 2; named, not forgotten. |

## 11. Boundaries
No agent-direct publish (W5). No second approval state. **[v1.1]** No replacement of Member Wiki ①②⑤. No model call in the watcher. No `corpus_items` before publish. No `public` inferred from a route. No audience widening. No page data or Family B in any capture or compile context (W11). No compiler prose on the **deploy/admin-point** path (iff OD-WK2). Course path ③ remains transcript prose (Member Wiki v0.1). No staff or public sink until ruled. No product proposal (WK11). Admin interface and mounts: companion spec.

## 12. Ideas inventory (nothing omitted)
Coach: items 1–9 (WP v0.1 §10) · "reposition the wiki, scope the agent, admin interface" · "charter sounds good, it encapsulates agent scope" · Exec Summary §§7, 9, 10, 12. Grok r1 #1–15, r2 #1–12: all folded, lineage marked (WP). Withdrawn advisor inventions (for the record): operator/staff allow-list; `apps`/route registry; `member_facing`; `compiled_rejected`; "later" disposition.

**[advisor] held as opinion:** stubs (OD-WK2); sibling table (OD-WK4); trailer/frontmatter syntax (OD-WK5); Foxtrot hook (OD-WK1); wave split.

## 13. Open decisions

| ID | Question | Owner |
|---|---|---|
| OD-WK1 | Deploy event source (Foxtrot hook vs poll) | Foxtrot / India |
| OD-WK2 | Compile = stubs (recommended) or prose — **deploy/admin-point path only**. Course path is not in the question. | **Coach** |
| OD-WK3 | Staff wiki sink; when `spec`/`decision` enter | Coach / India |
| OD-WK4 | Candidate home: sibling table (recommended) | India |
| OD-WK5 | Directive marker syntax | Lima / India |
| OD-WK6 | Help on the board, or W5 does not apply to help | **Coach** / India |
| OD-WK7 | Public wiki sink for `audience=public` (ties to OD-PDS10) | Coach / India |
| OD-WK8 | Snooze disposition — only with explicit wake; not v1.x | Coach |
| OD-WK9 **[v1.1]** | Publish event Oscar consumes for WK15: board transition hook, or a tick over `content_items` | India |

## 14. Seed slices **[v1.1; v1.2 W1 surface_key]** — the §3 wave table is product intent; this is the packet order

| Slice | Ships | Needs | Does not need |
|---|---|---|---|
| **W0** | `wiki_compile_candidates` (India) · watcher stub recording last SHA, writing nothing (AT-WK5) · inbox region on `/app/wiki` (administrator DOM gate, stay-put, empty state) | OD-WK4 table | H1 · Help Package · OD-WK1/2/5/6 |
| **W1** | Launcher on IKI + Wiki routes · **declared IKI/Wiki-local `surface_key` list for mounted routes** (e.g. `iki.wiki.entry`, `iki.wiki.article`, `iki.runner`; `state_key` optional/null until a token is declared) · admin-point · compile **wiki-only** stubs · board card · file-on-publish for wiki pages | OD-WK2 = stubs (deploy path) · OD-WK9 publish event | Help target (inbox and launcher show help/both disabled) · H1 |
| **W2** | Target `help` | **OD-WK6** closed + §9 Help Arch / Content Board amendments | — |
| **W3** | `kind=template` from watcher | Help Package **in-tree**; a server-side template registry SoR (Runner registry today is client code on a frozen tree) | — |
| **W4** | `kind=feature` from watcher | Watcher diffs H1 as-built, **or** the W1 local list (never an invented Application Framework `apps` table) | — |

**W0 + W1 is "the wiki in place, doing the right thing":** point, dispose, file — with the course loop untouched. Deploy-watch fills in W3–W4 as parents land.

## 15. Review chain
Juliet → India (W0 table; §9 parents are **named**, not landed, for W0/W1) → Hotel (W6 guidelines unchanged iff OD-WK2) → Mike (W11, §8) → Tango (any string Oscar emits) → Foxtrot (OD-WK1) → Coach → Lima → Juliet seeds → Delta. Design chain reviews the **Admin Interface Spec**, not this one.
