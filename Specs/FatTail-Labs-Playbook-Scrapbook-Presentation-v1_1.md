# FatTail Labs — Playbook as Scrapbook  
## Presentation · Chapters · Archive · Evidence

**Status:** SUPERSEDED by [v1.1a](./FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1a.md)  
**Version:** 1.1 (historical; Claude F1–F3 final pass applied in v1.1a)  
**Type:** Product addition + architectural change (member Practice object depth)  
**Horizon:** Phase PB0→PB3 (TD1 residual / TD1.5); not a Phase 2 Match dependency  
**Parent:** [Trader Development Phase 1 Own Spine v1.1](./FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1_1.md) · DL-254  
**Related:** Tag Manager v0.3 · Member Practice Export · Journal Session · Practice Context · Config doctrine  
**Path:** `Specs/FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1.md`  
**House strategy seeds (as-built):** Classic OTM · 0DTE Batman · 1–2 DTE Time Warp  
**Claude review date:** 2026-08-07 (advisor layer; B1–B2 resolved with Coach as OD-PB-7)

---

## 0. Metaphor (product north star)

Professional traders often describe their real playbooks as **glorious scrapbooks**:

- **Indexed** — sticky notes, tabs, a table of contents you can flip by thumb  
- **Stapled full of evidence** — charts, broker prints, journal pages, course printouts, margin scribbles  
- **Personal and imperfect** — not a sterile PDF deck; lived-in, annotated, reordered  
- **Presentable when needed** — open flat on the desk, walk a peer through a chapter, photograph a spread  

FatTail Playbook should feel like **that object digitized**, not like a CMS page or a pure Keynote clone.

| Scrapbook physical | Labs digital |
|--------------------|--------------|
| Cover | Book-level cover properties (title, subtitle, optional cover image) rendered as page zero — not a fake chapter |
| Chapters / sections | Ordered chapters; each may span multiple pages |
| Sticky notes | **v1:** ordered margin rail per page (`anchor_json` null). **v1.1+:** free-position pins optional |
| Stapled inserts | **Archive** (images, PDFs) + **Evidence rail** (journal sessions; trades later) |
| Index / tabs | Chapter list + optional **Tags** on the book (not “lexicon” in member UI) |
| Hand the book to a peer | **Export pack** v1; share links deferred |
| Box of archived pages | **Archive permanence** + book **versions** (OD-PB-7) — nothing hard-deleted once saved |

**Tension to hold deliberately:**

- **16:9 presentation surface** — screenshot-friendly present mode, export frame  
- **Scrapbook soul** — multi-artifact, evidence-heavy, not empty motivational slides  

Neither wins alone. The **page** is a 16:9 *spread* (on desktop / present); the **book** is a scrapbook of spreads + stapled inserts.

**Doctrine symmetry (OD-PB-7):** Book lifecycle mirrors platform draft→publish (Sacred Invariant #7) one layer down — content is mutable until the member deliberately **Saves** (creates a version). Learning the Playbook rehearses commit discipline: *persistence is automatic; permanence is intentional.*

---

## 1. Problem (as-built gap)

| Today | Gap |
|-------|-----|
| Single `body_md` blob per entry | No chapters, no multi-spread story, dual-write risk if pages land without retiring the blob |
| Plain textarea; list shows raw markdown | No GFM render, no 16:9 canvas, weak for screenshots |
| No playbook media | Cannot staple charts / PDFs into the book |
| Tags on `playbook_entry` only | No intentional “this journal is evidence for this book” |
| Export is flat playbook entries | No chapter/media/evidence round-trip as a *book* |
| Hard-delete mental model | Dangling evidence / lost history if journal or book is “deleted” |
| Three strategy books already exist as flat entries | Need migration → books with pages without losing copy |

---

## 2. Coach locks

| ID | Decision | Status |
|----|----------|--------|
| **OD-PB-1** | **Book model:** each strategy = one Playbook **book** with chapters/pages (not one global binder) | LOCKED |
| **OD-PB-2** | **Share v1:** **export-only**. No public URL | LOCKED |
| **OD-PB-3** | **Evidence:** **explicit** playbook ↔ journal_session links + optional shared tags for discovery (tags alone ≠ evidence) | LOCKED |
| **OD-PB-4** | **Metaphor:** scrapbook (indexed, stapled, sticky) × 16:9 presentation spread | LOCKED |
| **OD-PB-5** | **Family B** absolute on book, pages, archive, evidence, versions | LOCKED |
| **OD-PB-6** | Playbook remains **character under risk / process**, not P&L theater | LOCKED |
| **OD-PB-7** | **Permanence, versioning, drafts** — see §4. Never hard-delete a once-saved book; no hard-delete path that dangles evidence | **PROPOSED → ratify in DL** |
| **OD-PB-8** | **Export gate (OD-1.5 interaction):** TD2 entry gate continues to mean **pre-scrapbook pack green** (playbook v1.0 + campaigns + trade links). Playbook pack **v2.0** (chapters/archive/evidence) is **PB3**; may trail TD2 without moving the locked OD-1.5 gate. Document residual if PB3 unfinished at TD2-G. | LOCKED (this review) |

**Claude §2 OD-PB-1…6:** no reopening recommended.

---

## 3. Product description

### 3.1 Objects

```
Playbook Book (member_playbook_entries — root preserved)
  ├── Cover properties (title, subtitle?, cover_attachment_id?)  → rendered page zero
  ├── Chapters[] (ordered; chapter_type = chapter only in v1)
  │     └── Pages[] (ordered; markdown + archive image refs)
  ├── Working copy = live rows (autosaved)
  ├── Versions[] (append-only full-book snapshots on explicit Save)
  ├── Archive[] (stapled docs; bytes append-only while any version refs them)
  ├── Evidence[] (current-state staples → journal_session; outside snapshots)
  ├── Stickies[] (v1: margin rail per page)
  └── Tags (object_type=playbook_entry on book)
```

**Member-facing words:**

| Product | Inside UI (plain) | Avoid in UI |
|---------|-------------------|-------------|
| **Playbook** (suite name) | Book, Chapter, Page | “Spread”, “Scrapbook”, “Lexicon” |

### 3.2 Page surface (16:9)

| Context | Behavior |
|---------|----------|
| **Desktop read/edit** | 16:9 stage preferred |
| **Present mode** | Fullscreen 16:9; keyboard next/prev; **no product chrome**; **no identity chrome** (name, email, avatar) — screenshot-to-Discord leak is self-identity, not Family B cross-read |
| **Phone read** | **Do not** fake 16:9 in portrait. Full-width page, natural vertical scroll, chapter sheet. Scrapbook survives as *content* |
| **Phone present** | Prompt landscape; lock 16:9 there |

**Authoring:** GFM markdown via `web/components/Markdown.tsx` + authenticated archive image URLs.  
**Modes:** Edit (source + preview) · Read (chapter tabs + page flip) · Present (hard route `/present`).

### 3.3 Chapters & cover

- Ordered chapters; drag reorder; ≥0 chapters allowed on empty permanent book  
- **Cover is book-level** (Claude S2): `title` (existing), optional `subtitle`, optional `cover_attachment_id` from archive — rendered as **page zero**, not a cover chapter row  
- Multi-page chapters for long checklists  
- **Exactly zero or one cover image**; no `chapter_type=cover` required if cover is book-level (preferred). If a cover *chapter* is ever reintroduced, enforce singleton  

### 3.4 Archive (stapled inserts)

- Playbook-scoped media (journal media pattern: Family B, identity in path, `export_key`)  
- **Config-driven (OD fail-loud):** MIME allowlist, max files per book, max bytes per file, max bytes per book, export total-size ceiling, version retention/cap — all in config; **missing/invalid config aborts boot**; no silent hardcoded defaults in product code  
- Insert into markdown as authenticated URL  
- **Append-only bytes:** removing from *current* surface does not destroy bytes while any version snapshot still references them  
- Export ZIP: **embed binaries by default** (parity with journal media); over export size ceiling → fail loud (optional metadata-only flag later) — never silent downgrade  

### 3.5 Evidence rail (journal)

**Intentional staple, not tag coincidence.**

| Action | Behavior |
|--------|----------|
| Select journal as evidence | Picker → evidence row |
| From Journal | “Add to playbook…” → multi-select books |
| List | Date, session tag, deep link; **archived indicator** if journal session is archived |
| Remove | Unstaple; does not archive/delete journal |
| Tags | Discovery only; not sufficient for evidence |

**v1:** book-level evidence only (no page-pin). Later: sticky referencing evidence row, not a second link type.

**Lifecycle (OD-PB-7):** Archiving a journal never removes evidence rows. Rail renders archived state. Export carries `status: active|archived` on evidence targets.

**Non-goals v1:** auto-infer from tags; AI as truth; P&L on chips; historied evidence rail (current-state only).

### 3.6 Export (v1 share)

- Pack format `fattail.labs.playbook` **model_version 2.0** — book + chapters + pages + archive + evidence keys + statuses  
- Default export = **current working copy state** only (not full version history)  
- Single-book ZIP optional  
- Import: additive by export_key; unresolved evidence → **pending** rows + explicit report (count + keys); auto-resolve when journal arrives; **silent drop prohibited**  

### 3.7 Presentation tool stance

Scrapbook that **can present**, not Keynote replacement. Present mode + 16:9 + chrome-free = enough for coaching/self-review.

### 3.8 House-design scaffold (S10)

Explicit member action only: **“Start this book from [Classic OTM / Batman / Time Warp] house design”** → creates **draft** chapters the member owns. Never automatic on identity create or book open.

---

## 4. OD-PB-7 — Permanence, versioning, drafts (full)

### 4.1 Book lifecycle

1. **Never-saved book = draft, discardable.** Zero rows in `member_playbook_versions` → hard-delete allowed. Fact: `COUNT(versions)=0`, not a drift-prone flag.  
2. **First explicit Save = permanence.** Thereafter book may only be **archived** (reversible), never hard-deleted.  
3. **Sections are mutable via supersession.** Replace/delete/reorder chapters and pages inside a permanent book; each explicit Save snapshots the whole tree. Section “delete” is history, not oblivion.

### 4.2 Version unit — book-level snapshots

On every explicit **Save**, serialize whole tree (chapters, pages, order, stickies, cover fields) into one append-only `member_playbook_versions` row.

- Restore = re-materialize snapshot N into working copy  
- **Version on explicit Save only — never on autosave**  
- Config-driven retention/cap per book (fail-loud config block with B4 inventory)  
- Rejected: per-page COW + tombstones (fragments history)

### 4.3 Working copy & drafts

| Concept | Behavior |
|---------|----------|
| **Working copy** | Mutable current state in real tables; autosave continuously; survives logout/device/crash (server rows, not localStorage) |
| **Versions** | Snapshots on explicit Save only |
| **Never-saved book** | Persists across sessions as draft; discardable until first Save |
| **Concurrency v1** | Last-write-wins on working copy (one member, occasionally two devices) — **specified**, not a surprise |

### 4.4 Discard (one control, two behaviors)

| State | Discard | Confirm |
|-------|---------|---------|
| Permanent book (has versions) | Revert working copy → latest snapshot | Required |
| Never-saved book | Hard-delete book + children | Required |

### 4.5 UI honesty

- Cards: **unsaved changes** when working copy ≠ latest snapshot  
- Never-saved: label **Draft**  
- Cross-device: phone shows working copy + unsaved badge  

### 4.6 Consequences

| Object | Rule |
|--------|------|
| **Attachments** | Append-only bytes while any version references them |
| **Evidence** | Outside snapshots; unstaple is not versioned |
| **Export default** | Current state only |
| **Journal archive** | Evidence row survives; UI shows archived |

---

## 5. Data model

### 5.1 Book root (preserved)

`member_playbook_entries` remains the Book:

- Keeps id, identity_id, title, structured_json, status, export_key, trade/campaign FKs, tags  
- Add: `subtitle` NULL, `cover_attachment_id` NULL, `archived_at` NULL (if not covered by status),  
  **`body_md` post-migration: derived read-only snippet only** (regenerated from cover/first page on save) — **never a parallel write path** (B3). Old textarea removed **in the same change** as page editor. Or null `body_md` and list cards read first page — either way, no dual truth.

### 5.2 New tables

```sql
member_playbook_chapters (
  id, playbook_entry_id, identity_id,
  title, sort_order,
  chapter_type VARCHAR(16) NOT NULL DEFAULT 'chapter',  -- was page_type; rename
  export_key, created_at, updated_at
)

member_playbook_pages (
  id, chapter_id, playbook_entry_id, identity_id,
  title NULL, body_md MEDIUMTEXT NOT NULL,
  sort_order, export_key, created_at, updated_at
  -- invariant: playbook_entry_id MUST equal chapter.playbook_entry_id (enforce on write)
)

member_playbook_attachments (
  id, playbook_entry_id, identity_id,
  content_type, byte_size, original_name, caption_md,
  storage_key, export_key,
  created_at, updated_at,   -- updated_at required if captions editable
  purged_at NULL            -- soft-remove from current surface; bytes retained if version-ref
)

member_playbook_stickies (
  id, page_id, playbook_entry_id, identity_id,
  body_md VARCHAR(500) NOT NULL,
  anchor_json NULL,         -- v1 always NULL (margin rail order via sort_order)
  sort_order, export_key, created_at, updated_at
)

member_playbook_evidence (
  id, playbook_entry_id, identity_id,
  object_type VARCHAR(32) NOT NULL,  -- 'journal_session' | later 'trade'
  object_id BIGINT NOT NULL,
  note_md NULL,
  export_key, created_at,
  UNIQUE (playbook_entry_id, object_type, object_id)
  -- no FK to journal: permanence doctrine; resolve status at read time
)

member_playbook_versions (
  id, playbook_entry_id, identity_id,
  version_n INT NOT NULL,           -- monotonic per book
  snapshot_json JSON NOT NULL,      -- full tree
  created_at,
  UNIQUE (playbook_entry_id, version_n)
  -- append-only; never update/delete except retention purge of oldest (config)
)
```

**Schema invariants (on write):**

1. Page.`playbook_entry_id` == chapter.`playbook_entry_id`  
2. All children carry matching `identity_id` to book  
3. Evidence target same identity (R-PB-3)  
4. Version only via explicit Save API  

### 5.3 Migration of existing books

1. For each `member_playbook_entries` with body content:  
   - Create chapter “Main” (or split later by member)  
   - One page with current `body_md`  
   - Cover = book title + empty subtitle (no cover chapter row)  
2. Set `body_md` = derived snippet (first ~N chars of first page) or null  
3. **Zero version rows** → books remain **Draft** until member’s first Save (even if content migrated) — **or** migration performs one system Save so seeded strategy books are permanent. **Recommendation:** migration creates **version 1** snapshot so the three strategy books are not accidentally discardable. Spec lock: **seeded/migrated books with content get version 1**.  

### 5.4 Config inventory (B4 + versions)

All required at boot (names illustrative; exact env keys in implementer’s config PR):

| Config | Purpose |
|--------|---------|
| MIME allowlist | Archive upload |
| Max files / max bytes per file / per book | Archive caps |
| Export max ZIP bytes | Fail-loud export ceiling |
| Version retention count or days | Cap history growth |
| Autosave interval (optional) | UX only; never creates version |

---

## 6. API sketch

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/me/playbook/entries` | Books (existing path — continuity) |
| GET/PATCH | `/api/me/playbook/entries/{id}?full=1` | Meta + tree |
| CRUD | `.../chapters`, `.../pages` | Structure |
| POST | `.../save` | Explicit Save → new version snapshot |
| GET | `.../versions` | List snapshots |
| POST | `.../versions/{n}/restore` | Re-materialize |
| POST | `.../discard` | Revert working copy or delete draft |
| Archive / evidence / export | as v1.0 sketch | + archive bytes GET |

Autosave = ordinary PATCH page/chapter (no version).

---

## 7. Export Spec (playbook model 2.0)

```yaml
format: fattail.labs.playbook
model_version: "2.0"
entries:
  - id: export_key
    title: ...
    subtitle: ...
    status: active|archived
    structured: {}
    chapters: [{ id, title, sort_order, pages: [{ id, title, body_md, sort_order }] }]
    archive: [{ id, content_type, ... }]  # binaries in zip archive/
    evidence:
      - object_type: journal_session
        object_export_key: ...
        target_status: active|archived|pending
        note_md: ...
```

**Import:** unresolved evidence → `pending` + result report; never silent drop.

**OD-1.5 / OD-PB-8:** Phase 2 exit still requires **pre-v2** Practice pack green (incl. playbook 1.0 entries + campaigns). Playbook 2.0 is PB3; residual filed if unfinished — gate does not silently move.

---

## 8. Reliability invariants

| ID | Invariant |
|----|-----------|
| R-PB-1 | Family B on book, chapter, page, archive, sticky, evidence, versions |
| R-PB-2 | **Archiving** a book archives/hides its working surface; children not destroyed; un-archive restores. Archiving a journal never removes evidence rows; rail shows archived state |
| R-PB-3 | Evidence object must **belong to the** same identity |
| R-PB-4 | Archive path includes identity_id; no cross-read by URL guessing |
| R-PB-5 | Present mode: no other members’ data; no self identity chrome in frame |
| R-PB-6 | Export round-trip additive; unresolved evidence pending + reported |
| R-PB-7 | No P&L on evidence rail or cover |
| R-PB-8 | Cover properties always valid; empty chapter list allowed |
| R-PB-9 | `body_md` is never a second write path after pages land |
| R-PB-10 | Explicit Save creates version; autosave does not |
| R-PB-11 | Page.playbook_entry_id matches parent chapter |
| R-PB-12 | Hard-delete only if `COUNT(versions)=0` |

---

## 9. Phasing

### PB0 — Spec + OD freeze
- Land v1.1 · Coach ratifies OD-PB-7/8 · DL · amend Phase 1 / Export pointers · config keys listed  

### PB1 — Canvas + chapters + OD-PB-7 core
- Schema + migrate three strategy books → Main chapter + page + version 1  
- 16:9 read/edit · chapter nav · Markdown · present route (identity chrome off)  
- Save / discard / draft labels · autosave working copy  
- `body_md` derived or null; textarea path removed same PR  
- Tests: isolation, reorder, migrate, discard draft vs permanent  

### PB2 — Staples
- Archive upload/serve (config caps) · inline images  
- Evidence rail · journal picker · archived indicator  
- Optional “Add to playbook” from Journal  

### PB3 — Export + polish
- Playbook v2 pack · single-book ZIP · import pending evidence  
- Stickies margin rail if not in PB1  
- Echo/Tango density · house-design “Start from…” action  
- Stretch: PNG page export  

### PB4 — optional new OD
- Private signed share · trade evidence · multiplayer present · free-position stickies  

---

## 10. Acceptance criteria (Delta-checkable)

1. Open strategy book → cover (book-level) + Main page in 16:9 (desktop).  
2. Add chapter/page, reorder; persist after reload (working copy).  
3. Explicit Save creates version; autosave does not.  
4. Discard: permanent → restore latest snapshot; draft → delete book.  
5. Markdown GFM renders; present mode chrome-free and identity-free.  
6. Phone read is full-width scroll, not letterboxed 16:9.  
7. Archive image embed works; config missing → boot fail.  
8. Staple journal evidence; unstaple keeps journal; archived journal shows state.  
9. Tag alone does not create evidence.  
10. Export pack includes structure + archive + evidence; import reports pending.  
11. Cross-identity evidence/archive fails loud.  
12. Trade `playbook_entry_id` still resolves to book id.  
13. No profit claims on cover/evidence.  
14. No parallel writes to `body_md`.  

---

## 11. As-built anchors (reuse)

| Area | Reuse |
|------|--------|
| Book CRUD / tags / trade FK | `member_playbook_entries`, practice_spine, TagPicker |
| Markdown | `web/components/Markdown.tsx` |
| Media pattern | `journal_session_media.py` |
| Export | `export_domain` → playbook 2.0 |
| Course copy | Classic / Batman / Time Warp → Main page |
| House keys | `structured.house_design_key` at book level |
| Config fail-loud | `server/config.py` pattern |

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Junk-drawer scrapbook | Intentional staple actions; empty-state copy; chapter discipline |
| 16:9 vs long lists | Multi-page chapters; phone drops aspect lock in read mode |
| History holes in archive | Append-only bytes while version-referenced |
| Dual truth body_md | B3 — derived or null; textarea gone same change |
| OD-1.5 gate creep | OD-PB-8 — v2 pack is PB3 residual, not silent gate move |
| Unbounded versions | Config retention/cap |

---

## 13. Claude §13 disposition (locked as recommendations unless Coach overrides)

| # | Disposition |
|---|-------------|
| 1 Stickies | v1 margin rail; free x/y later |
| 2 Cover | Book-level properties, not cover chapter |
| 3 Evidence | Book-level only v1 |
| 4 Present | Hard `/present` route; hide identity chrome |
| 5 Archive export | Embed binaries; fail loud on size |
| 6 body_md | Derived read-only / drop; never dual-write |
| 7 Naming | Product “Playbook”; Book/Chapter/Page inside; no “lexicon” in UI |
| 8 Performance | Full tree on open; archive bytes lazy |
| 9 Mobile | Full-width read; landscape 16:9 present only |
| 10 House scaffold | Explicit member action → draft chapters |

---

## 14. Copy / Tango seeds (not pre-approved — formal Tango pass at review)

- Empty: “This is your scrapbook for how you trade under risk — not a performance report.”  
- Evidence: “Staple journal sessions that show you practiced this book.” (*show* vs *prove* — Tango)  
- Archive: “Charts, prints, PDFs — whatever you’d staple into a paper playbook.”  
- Present: “Present mode — clean frame for review. Screenshots welcome.”  
- Draft badge: “Draft — not yet versioned. Save to keep history.”  
- Discard permanent: “Discard uncommitted changes and restore last Save?”  

---

## 15. Out of scope

- Public marketing pages for a member playbook  
- Auto P&L attribution  
- Live rule engine / order blocking  
- Replacing Strategy Lab packs  
- Full collaborative multiplayer editing  
- Full version-history export in v1  
- Free-position stickies in v1  

---

## 16. Decision log draft (Lima)

> **Playbook Scrapbook Presentation v1.1:** Member Playbooks are chaptered scrapbooks with 16:9 present mode, playbook-scoped archive, and explicit journal evidence. **OD-PB-7:** never hard-delete a once-saved book; book-level snapshots on explicit Save; autosave = working copy only; draft discardable until first Save. **OD-PB-8:** Playbook pack 2.0 is PB3 and does not silently move OD-1.5 TD2 gate. Export-only sharing. Family B. Config-driven archive/version caps. Migrate flat body_md into pages; body_md not a second write path. Metaphor: glorious trader scrapbook, presentation-capable.

---

## 17. Implementation summary (on BUILD AUTHORITY)

1. Config keys + migration + version/evidence/archive tables  
2. Domain: tree CRUD, Save/discard, page↔chapter invariant  
3. UI: library · book stage · present · draft/unsaved honesty  
4. Archive + evidence rails  
5. Export 2.0 + import pending  
6. Tests + rebuild + visual check  

---

## 18. v1.0 → v1.1 changelog (Claude review)

| Item | Disposition |
|------|-------------|
| B1 dangling evidence | Resolved via OD-PB-7 permanence |
| B2 import unresolved | Pending + fail-loud report |
| B3 body_md dual path | Derived/null; textarea removed same change |
| B4 caps/MIME | Config inventory; boot fail-loud |
| Schema: page book id match, chapter_type rename, attachment updated_at, versions table | Adopted |
| Cover as book-level | Adopted (S2) |
| Stickies margin rail v1 | Adopted (S1) |
| Present identity chrome | Adopted (S4) |
| Mobile aspect | Adopted (S9) |
| House scaffold explicit | Adopted (S10) |
| OD-1.5 interaction | OD-PB-8 |
| §13 questions | Answered as recommendations |

*Nothing from v1.0 product intent de-scoped. Open residual: Coach ratify OD-PB-7 wording; Tango formal copy; Grok architecture pass.*

---

*End Spec v1.1.*
