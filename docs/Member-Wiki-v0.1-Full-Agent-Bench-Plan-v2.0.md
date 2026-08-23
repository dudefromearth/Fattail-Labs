# Member Wiki v0.1 — Full Agent Bench Plan v2.0

**Program:** finish the Member Wiki as specified in v0.1.  
**Spec of record:** [`Specs/FatTail-Labs-Member-Wiki-Spec-v0_1.md`](../Specs/FatTail-Labs-Member-Wiki-Spec-v0_1.md)  
**UI contract:** [`Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md`](../Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md)  
**As-built spine:** [`Architecture/11-wiki-design.md`](../Architecture/11-wiki-design.md)  
**Gap map:** [`docs/Member-Wiki-Spec-v0.1-vs-Implementation.md`](./Member-Wiki-Spec-v0.1-vs-Implementation.md)  
**Board:** continue [`agents/p-wiki/`](../agents/p-wiki/). Do not restart the spine.

**Supersedes:** completion plan v1.0 and v1.1 in this folder. Same Coach AMENDs, one document.

Juliet. **GO S0 is stamped** (2026-08-23). S1–S6 wait on later stamps.

**S0 seed isolation (Juliet, not doctrine):** do not run overlay seeds; do not put a compile inbox on `/app/wiki` in S0.

---

## Intent (spec §0–§1)

The wiki is a compiled knowledge layer at `/app/wiki`: search and related links over the FatTail corpus (courses, daily live streams, historical videos, resources). Agents compile pages; humans approve; the map improves as new material lands. Members jump from a page into the lesson, replay, or video that teaches it. The wiki never forks canonical content.

Success = spec **W1–W11** and interface **WI1–WI11**. Pipeline = **① registrar → ② transcriber → ③ compiler → ④ board → ⑤ related engine**.

---

## Store law (Coach, 2026-08-23) — non-negotiable

Git is the **only writer** of wiki page bytes. Every `LABS_WIKI_ROOT` checkout has the **same bytes**.

1. Admin save (S1) and compiler drafts (S5) **commit and land on the remote**. Other checkouts **pull**.  
2. **D-12 pull + reindex is load-bearing.** That is how a host’s MySQL cache tracks git. Without it the cache is a silent fork.  
3. **Pins live in frontmatter** (`pin: true`, integer `pin_order`). Reindex derives Start here. **No pin table in v1.**  
4. **MySQL is a cache of that checkout, never a fork.** `wiki_pages_idx` / `wiki_links_idx` change only via `wiki_store.reindex(conn, wiki_root())` on **that** checkout. No page-row upsert except through reindex.  
5. **Tests must not reindex a fixture vault onto the member DB.** Isolated store or restore real `LABS_WIKI_ROOT` afterward.

Keep as-built table names `wiki_pages_idx` / `wiki_links_idx`. Do not add a second authoring table named `wiki_pages`.

---

## Locked from the spec

| ID | Decision | Source |
|----|----------|--------|
| Content SoR | `lab-wiki` git. Markdown + frontmatter + `[[wikilinks]]`. | §3.0 · store law |
| Derived index | Search, wikilink graph, related scores, corpus **registry** — not page bytes. | §3.0 |
| Member gate | `status: published`. Drafts 404 for members. | §3.0 · WIK-D2 |
| No agent-direct publish | Only compiler **drafts** go through D-11. Admin in-place save is not D-11. | W5 |
| Hotel | Before first agent-compiled page. | W6 |
| No profit claims | Including agent output. | W7 |
| Canonical refs | Wiki never copies lesson/replay bodies. | W9 |
| Family B | Never in compile, transcripts, or shared pages. | W10, W11 |
| Search v1 | MySQL FULLTEXT. Embeddings = D-4 / v2. | §3.5 |

---

## Already built — do not rebuild

- Fail-loud `LABS_WIKI_ROOT` at API boot; `wiki_store` parse + full reindex  
- Migration 035; `/api/wiki/index|pages|search|graph` and `POST /api/admin/wiki/reindex`  
- `/app/wiki`, `/app/wiki/[slug]`, `/app/wiki/search`, `/app/wiki/graph`, ⌘K  
- Wikilinks (unresolved muted), backlinks, New this week hides when empty  
- `infra/labwiki-sync.plist` (pull `--ff-only` + reindex, 5 min)  
- Tests `server/tests/test_wiki_api.py`, `test_wiki_store.py`

**Not built yet (this plan):** frontmatter Start here pins; article two-column rail shell; provenance from frontmatter; in-place git save; hover preview; `corpus_items`; transcriber; related engine; compiler §4 ③ into git; practice rail.

---

## Open decisions

| ID | Blocks | Notes |
|----|--------|--------|
| **D-1** | S0 **card copy only** | Coach names the app. Slug `wiki` is stable. Rest of S0 does not wait. |
| **D-3** | — | All authenticated members, including Observer. **As-built. No stamp.** |
| **D-5** | **S3 only** | Whisper local vs hosted. **Not this GO.** |
| **D-6** | S5 YouTube | Last 12 months first. |
| **D-7** | **S5 only** | Seat the compiler as spec **§4 ③**, product-local: new/updated transcripts → draft pages **in git** → board. Nothing else. If a charter file on disk lists other jobs, **S5 does not use those jobs** and does not “reuse, do not re-derive.” |
| **D-8** | S5 proposals | Aggregate member signals only via Privacy §4.1; default off until S6. |
| **D-11** | **S5 only** | **One** path: GitHub PR, **or** board card that sets `status: published` **in git**. Not both. **Does not block S1.** |
| **D-12** | **Load-bearing for every git write** | Pull + reindex on each host. Cadence already 5 min. Foxtrot owns MiniTwo. |

D-2: published topics already exist in the checkout. D-4 embeddings, D-9 member pins: v2. D-10: graph corpus toggle off.

### Git writes

| Slice | Write | OD |
|-------|--------|-----|
| **S1** | Admin save → file + **commit + remote** + reindex **this** checkout | Foxtrot git author. Other hosts: **D-12**. **Not D-11.** |
| **S5** | Compiler draft, then approve → `published` in git (**commit + remote**) | **D-11** + D-12 |

**Compiler (S5):** `ai.complete()` returns page text. The **server** writes `.md`, commits, lands on the remote. Git credentials never go to the model.

---

## Slices

| Slice | Spec | Ships | Proof | Stamp |
|-------|------|--------|--------|--------|
| **S0** | W1 remainder | Start here from **git pins**; article chrome + rail **shell** (empty hidden); provenance if frontmatter has it; card **if D-1 filled**; graph list fallback | WI1, WI4, WI7, WI8, WI10, WI11 — **not WI3 hover** | **GO S0** |
| **S1** | W1 remainder | Admin in-place save → git + remote + reindex; hover preview; `[[` autocomplete | WI9, WI3 hover | optional **GO S0+S1** |
| **S2** | W2 start | `corpus_items`. Registrar: **lessons, live_sessions, resources**. YouTube = **S5**. | Internal-kind count reconcile | later |
| **S3** | W2 | Transcriber. Search group **In the archive** + `t=` | W2, W3 (pages+transcripts), WI2 | later · D-5 |
| **S4** | W2 | `wiki_refs`. Related rail. Graph corpus toggle off | W4 | later |
| **S5** | W3 | Hotel guidelines. §4 ③ drafts in git + board. Approve → published in git. YouTube + D-6 | W5–W7; criterion W1 including videos | later · D-11 · Hotel |
| **S6** | W4 | In your practice + reverse chips | W10, W11, WI5, WI6 | later · Mike |

S2–S4-G “W1 SQL reconcile” = **internal kinds only** until S5.

---

## Critical path

```
GO S0 (this page)
  S0-1  Alpha     parse pin / pin_order; start_here from pins (5–8)
  S0-2  Charlie   article chrome, provenance, rail shell; card iff D-1
  S0-3  Echo + Tango   empty copy, density, no gamification
  S0-4  Kilo      WI1/4/7/8/10/11; no fixture reindex on member DB
  S0-5  Lima      Arch 11 stays truthful
       → S0-G Delta

optional GO S0+S1
  S1    Alpha + Charlie + Foxtrot   save → git + remote; hover
       → S1-G

later stamps
  S2 Alpha → S3 Alpha+Foxtrot [D-5] → S4 Alpha+Charlie+Echo
       → S2–S4-G
  S5 Hotel then §4 ③ + Alpha [D-11] [D-7]
       → S5-G
  S6 Mike then Charlie
       → S6-G
```

Hotel: not S0–S4; **on S5**. Mike: **on S6**. India: not on S0 (pins are git). Foxtrot: S1 git author; D-12 MiniTwo; S3/S5 ticks.

---

## S0 — done when (GO S0)

1. `wiki_store` reads `pin` (truthy) and `pin_order` (integer) from frontmatter.  
2. `GET /api/wiki/index` `start_here` = published pinned pages, ordered by `pin_order`, cap 5–8. **Not** “first 8 topics by title.” If no pins, Start here is the spec empty state (nothing / honest copy) — do not invent pins in MySQL.  
3. Article: kind + title remain; **provenance** from frontmatter when present (`updated`, compiled-by / approved-by keys if already in files; do not invent a MySQL provenance store).  
4. Article **rail shell**: two-column desktop, accordions mobile; **Linked from** and **See also** stay; Related and In your practice **slots exist and hide when empty**.  
5. Graph: published pages + list fallback (WI7).  
6. Apps card: change **title/blurb/status only if D-1 is filled**. Slug stays `wiki`.  
7. WI1, WI4, WI7, WI8, WI10, WI11. **WI3 hover is S1.**  
8. Diff does not add a compile inbox or a pin table. Tests do not reindex a fixture onto the member DB.

Coach content in lab-wiki: operators may add `pin: true` / `pin_order:` on topic files so Start here is not empty. That is git content, not this slice’s MySQL.

---

## S0 file allowlist

| Area | Touch |
|------|--------|
| `server/wiki_store.py` | Parse `pin`, `pin_order`; carry onto index rows or a derived field used only at index-build |
| `migrations/` | **None** (no pin table) |
| `server/routes/wiki.py` | `start_here` from pins; page payload may pass through provenance keys already in frontmatter if indexed |
| `web/app/app/wiki/**` | Entry Start here bound to new `start_here`; article chrome + rail shell |
| `web/components/wiki/**` | Layout pieces for rail; no new editor (S1) |
| `web/lib/appsCatalog.ts` | **Only if D-1 filled** |
| `agents/p-wiki/` | S0 seeds + S0-G |
| `Architecture/11-wiki-design.md` | Lima: Start here = pins; store law one paragraph |

**S0 never:** `corpus_items`, in-place save, hover, related engine, compiler, practice rail, MiniTwo unless Coach asks, a second page table.

---

## Later slices (not this GO)

**S1.** Admin EditableMarkdown on article. Save writes the `.md` under `LABS_WIKI_ROOT`, commits, **lands on remote**, reindexes **this** checkout. Stay-put (WI9). Hover preview ~40 words (WI3). Foxtrot: git author. Other hosts: D-12.

**S2.** Migration `corpus_items` as §3.1. Registrar from `lessons`, `live_sessions`, `resources`. **Not YouTube.** Unique (`kind`, `ref_id`, `external_id`). Orphan when canonical gone.

**S3.** Captions else Whisper (D-5). Status visible; missing keys abort the stage. Transcripts in `lab-wiki/raw/transcripts/` plus derived FULLTEXT (India at seed). Search: pages, then **In the archive**, `t=` deep link.

**S4.** `wiki_refs`. Related ≤6. Graph corpus toggle off.

**S5.** Hotel guidelines first. Compiler = §4 ③ only. Server writes draft `.md` + commit + remote + board card. D-11 approve → `published` in git + reindex. YouTube after internal kinds.

**S6.** Request-time practice rail; hide when empty; **no P&L**. Reverse chips are read-only UI on Journey / Trade Log / Journal / Playbook. Do not open market or options-lab trees. If a tool file cannot be touched, wiki-side rail still ships; chips wait. That is W11 + change control.

---

## Seeds (S0 now; rest when stamped)

| Seed | Agent | Depends | Feeds |
|------|--------|---------|--------|
| S0-1 Alpha — pin parse + `start_here` | Alpha | GO S0 | Charlie, Kilo |
| S0-2 Charlie — article chrome + rail shell | Charlie | S0-1 | Echo/Tango, Kilo |
| S0-3 Echo + Tango | Echo, Tango | S0-2 | S0-G |
| S0-4 Kilo — WI1/4/7/8/10/11 | Kilo | S0-2 | S0-G |
| S0-5 Lima — Arch 11 | Lima | S0-1 | S0-G |
| S0-G Delta | Delta | S0-3, S0-4, S0-5 | — |
| S1-* | — | **GO S0+S1** | — |
| S2–S6 | — | later stamps | — |

Juliet writes pasteable S0 seeds under `agents/p-wiki/seeds/` in the same body of work as GO, then Alpha/Charlie execute.

---

## Gates

| Gate | Evidence |
|------|----------|
| **S0-G** | WI1 search-first; Start here from pins (or honest empty); WI4 backlinks; WI7 graph + list; WI8 ⌘K; WI10 draft 404 member; WI11 card → `/app/wiki`. Browser + curl. **Not hover.** `pytest` on wiki tests. Member `wiki_pages_idx` count not destroyed by tests. |
| **S1-G** | WI9: save in `git log` **and on the remote**; reindex this checkout. WI3 hover. |
| **S2–S4-G** | Internal-kind corpus count; WI2; related scores; transcriber fail visible |
| **S5-G** | Hotel artifact; draft in git; board; approve → published in git → search; videos in corpus |
| **S6-G** | WI5 two-member payloads; WI6 no P&L |

Interface §8.1 = member proof. Spec §7.1 = pipeline proof.

---

## Coach stamp

- [ ] **D-1** Wiki apps-card title: ________  
- [x] **GO S0** — pinned Start here (git), article chrome, provenance, card per D-1, WI1/4/7/8/10/11  
- [ ] **GO S0+S1** (optional) — WI9 + WI3 hover; **not** D-11  
- [ ] **Amend**  
- [ ] **Stop**

D-11, D-5, D-6, D-7 (§4 ③ only), D-8: **not this GO.**

**Signed:** Coach (AMEND 2026-08-23; store law 2026-08-23; **GO S0**)  
**Date:** 2026-08-23
