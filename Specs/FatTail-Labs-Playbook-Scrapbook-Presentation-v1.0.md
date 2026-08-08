# FatTail Labs — Playbook as Scrapbook  
## Presentation · Chapters · Archive · Evidence

**Status:** SUPERSEDED by [v1.1](./FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1.md)  
**Note:** Historical draft. Claude review (2026-08-07) folded into v1.1. Do not implement from this file.  
**Type:** Product addition + architectural change (member Practice object depth)  
**Parent:** [Trader Development Phase 1 Own Spine v1.1](./FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1_1.md) · DL-254  
**Path:** `Specs/FatTail-Labs-Playbook-Scrapbook-Presentation-v1.0.md`

---

## 0. Metaphor (product north star)

Professional traders often describe their real playbooks as **glorious scrapbooks**:

- **Indexed** — sticky notes, tabs, a table of contents you can flip by thumb  
- **Stapled full of evidence** — charts, broker prints, journal pages, course printouts, margin scribbles  
- **Personal and imperfect** — not a sterile PDF deck; lived-in, annotated, reordered  
- **Presentable when needed** — you can open it flat on the desk, walk a peer through a chapter, or photograph a spread for a review  

FatTail Playbook should feel like **that object digitized**, not like a CMS page or a pure Keynote clone.

| Scrapbook physical | Labs digital |
|--------------------|--------------|
| Cover / title page | Book cover page (16:9) |
| Chapters / sections | Ordered chapters; each may span multiple pages |
| Sticky notes | Annotations / callouts on a page (v1 light; v1.1 richer) |
| Stapled inserts | **Archive** (images, PDFs, docs) + **Evidence rail** (journal sessions; later trades) |
| Index / tabs | Chapter list + optional tag lexicon on the book |
| Hand the book to a peer | **Export pack** v1; share links deferred |

**Tension to hold deliberately:**

- **16:9 presentation surface** — screenshot-friendly, present mode, optional later “slide” export  
- **Scrapbook soul** — multi-artifact, evidence-heavy, not empty motivational slides  

Neither wins alone. The **page** is a 16:9 *spread*; the **book** is a scrapbook of spreads + stapled inserts.

---

## 1. Problem (as-built gap)

| Today | Gap |
|-------|-----|
| Single `body_md` blob per entry | No chapters, no title page, no multi-spread story |
| Plain textarea; list shows raw markdown | No GFM render, no 16:9 canvas, weak for screenshots |
| No playbook media | Cannot staple charts / PDFs into the book |
| Tags on `playbook_entry` only | No intentional “this journal is evidence for this book” |
| Export is single playbook document (entries) | No chapter/media/evidence round-trip as a *book* |
| Three strategy books already exist as flat entries | Need migration path → books with pages without losing copy |

---

## 2. Coach locks (session 2026-08-07)

| ID | Decision |
|----|----------|
| **OD-PB-1** | **Book model:** each strategy = one Playbook **book** with chapters/pages (not one global binder) |
| **OD-PB-2** | **Share v1:** **export-only** (portable pack; optional print/PNG later). No public URL |
| **OD-PB-3** | **Evidence:** **explicit** playbook ↔ journal_session links + optional shared tags for discovery |
| **OD-PB-4** | **Metaphor:** scrapbook (indexed, stapled, sticky) × 16:9 presentation spread |
| **OD-PB-5** | **Family B** absolute on book, pages, archive, evidence |
| **OD-PB-6** | Playbook remains **character under risk / process**, not P&L theater (Roadmap Own spine) |

**Open for Claude / Grok (not locked):**

- Sticky-note UX depth in v1 vs v1.1  
- Whether trades join evidence rail in same MVP as journals  
- PDF export vs PNG page export vs HTML pack first  
- Whether “present mode” is fullscreen only or also dual-pane scrapbook (pages + evidence)  
- Archive MIME allowlist and max bytes  

---

## 3. Product description

### 3.1 Objects

```
Playbook Book (member_playbook_entries evolved or new parent)
  ├── Cover / title page (required)
  ├── Chapters[] (ordered)
  │     └── Pages[] (ordered 16:9 spreads; markdown + inline image refs)
  ├── Archive[] (stapled documents — Family B media)
  ├── Evidence[] (explicit links → journal_session [+ trade later])
  ├── Sticky notes / annotations (optional layer on page)
  └── Tags (existing object_type=playbook_entry on book)
```

**Naming (member-facing):**

- **Book** — e.g. “Classic OTM 0DTE Butterfly”  
- **Chapter** — e.g. “Regime & width”, “Entry checklist”  
- **Page / spread** — one 16:9 surface  
- **Archive** — stapled files  
- **Evidence** — journal (and later trade) receipts, not marketing testimonials  
- **Sticky** — short annotation pinned to a page (not a full page)

### 3.2 Page surface (16:9)

- **Aspect ratio:** 16:9 locked for **view**, **present**, and **export frame**  
- **Authoring:** markdown (GFM) via existing `web/components/Markdown.tsx` (+ image URLs from archive)  
- **Modes:**  
  - **Edit** — markdown source + live preview in 16:9 frame  
  - **Read** — scrapbook browse (chapter tabs + page flip)  
  - **Present** — fullscreen 16:9, keyboard next/prev, hide chrome  
- **Screenshot doctrine:** present mode must be clean enough to capture into Keynote/Slides without UI chrome  

### 3.3 Chapters

- Ordered list; drag reorder  
- Chapter has title + optional short blurb  
- At least one page per chapter (empty page allowed)  
- **Title/cover page** is either:  
  - **Option A (recommended):** chapter 0 / special page type `cover` on the book, or  
  - **Option B:** first chapter is always “Cover”  
- Multi-page chapters for long checklists / regime maps  

### 3.4 Archive (stapled inserts)

- Playbook-**scoped** media store (mirror journal media pattern: Family B, identity in path, `export_key`)  
- Types v1: images (png/jpeg/webp/gif), PDF optional if product allows  
- Insert into page markdown as authenticated image URL, e.g.  
  `![](/api/me/playbook/books/{id}/archive/{att_id}/bytes)`  
- Archive browser UI: grid of stapled items; attach to page or keep as reference only  
- Cap: max files + max bytes per book (fail loud)  

### 3.5 Evidence rail (journal)

**Intentional staple, not accidental tag coincidence.**

| Action | Behavior |
|--------|----------|
| **Select journal as evidence** | From Playbook: picker of member’s journal sessions (date, tag, snippet) → creates evidence row |
| **From Journal** | “Add to playbook…” → multi-select books |
| **List** | Evidence rail on book: date, session tag, deep link to journal day |
| **Remove** | Unstaple; does not delete journal |
| **Tags** | Optional: same lexicon tag on book + session for discovery; **not** sufficient alone for evidence |

**Non-goals v1:** auto-infer evidence from tags; AI summary of evidence as truth; P&L on evidence chips.

### 3.6 Export (v1 share substitute)

- Extend Practice pack:  
  - `fattail.labs.playbook` v2 — book + chapters + pages + archive metadata + evidence by export_key  
- Optional single-book download: JSON or ZIP (pages.md + media/)  
- **Later:** PNG per page, PDF binder, private signed link (OD-PB-2 re-open)

### 3.7 Presentation tool?

**v1 stance:** Playbook is a **scrapbook that can present**, not a full replacement for Keynote.

- Present mode + 16:9 + clean chrome = “presentation tool enough” for coaching / self-review  
- Full presenter notes / laser / multi-device sync = Phase later if Coach wants  

---

## 4. Information architecture (UI sketch)

```
/app/playbook                     → library of books (cover tiles)
/app/playbook/[bookId]            → scrapbook: chapter tabs | 16:9 stage | evidence + archive drawers
/app/playbook/[bookId]/present    → fullscreen present (optional query ?page=)
```

**Layout (read/edit):**

```
┌─────────────────────────────────────────────────────────────┐
│ Book title · status · Present · Export                      │
├──────────┬──────────────────────────────┬───────────────────┤
│ Chapters │     16:9 STAGE               │ Evidence (staple) │
│  · Cover │   [markdown spread]          │  · 2026-08-05 JS  │
│  · Ch 1  │   sticky overlays            │  · …              │
│  · Ch 2  │                              │ Archive (staple)  │
│          │   ◀ page ▶                   │  · chart.png      │
└──────────┴──────────────────────────────┴───────────────────┘
```

**Mobile:** stage full width; drawers as bottom sheets. Scrapbook metaphor survives; dual-rail collapses.

---

## 5. Data model (proposed)

### 5.1 Evolution strategy

**Recommended:** keep `member_playbook_entries` as the **Book** root (preserves IDs, tags, trade/campaign FKs, export_keys, three seeded strategy books).

Add:

```sql
-- pages / chapters
member_playbook_chapters (
  id, playbook_entry_id, identity_id,
  title, sort_order, page_type ENUM('cover','chapter') DEFAULT 'chapter',
  export_key, created_at, updated_at
)

member_playbook_pages (
  id, chapter_id, playbook_entry_id, identity_id,
  title NULL, body_md MEDIUMTEXT,
  sort_order, export_key, created_at, updated_at
)

-- stapled archive
member_playbook_attachments (
  id, playbook_entry_id, identity_id,
  content_type, byte_size, original_name, caption_md,
  storage_key, export_key, created_at
)

-- sticky notes (v1 minimal or v1.1)
member_playbook_stickies (
  id, page_id, playbook_entry_id, identity_id,
  body_md VARCHAR(500),  -- short
  anchor_json NULL,      -- optional position on 16:9 {x,y} 0..1
  sort_order, export_key, created_at, updated_at
)

-- evidence (journal first)
member_playbook_evidence (
  id, playbook_entry_id, identity_id,
  object_type ENUM('journal_session','trade') ,  -- trade nullable until wired
  object_id BIGINT,
  note_md NULL,           -- why stapled
  export_key, created_at,
  UNIQUE (playbook_entry_id, object_type, object_id)
)
```

**Migration of existing books:**

1. For each existing `member_playbook_entries` row with non-empty `body_md`:  
   - Create chapter “Main” (or “Notes”)  
   - Create one page with current `body_md`  
   - Create empty **Cover** chapter/page with title = book title  
2. Keep `body_md` column as **deprecated denormalized summary** or concatenate for list cards until UI fully page-driven  
3. `structured_json` remains book-level (house_design_key, course links, VIX tables metadata)

### 5.2 Identity / Family B

- Every child row carries `identity_id`  
- All writes: book owned by session identity; evidence/archive targets must be same identity  
- Cross-identity link → 404/403 fail loud  

---

## 6. API sketch

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/me/playbook/entries` | Books list/create (existing) |
| GET/PATCH | `/api/me/playbook/entries/{id}` | Book meta + nested tree optional `?full=1` |
| CRUD | `/api/me/playbook/entries/{id}/chapters` | Chapters |
| CRUD | `/api/me/playbook/chapters/{id}/pages` | Pages |
| GET/POST | `/api/me/playbook/entries/{id}/archive` | List/upload staples |
| GET/DELETE | `/api/me/playbook/entries/{id}/archive/{att_id}` | Meta / delete |
| GET | `.../archive/{att_id}/bytes` | Binary (auth) |
| GET/POST/DELETE | `/api/me/playbook/entries/{id}/evidence` | Evidence rail |
| GET | `/api/me/playbook/entries/{id}/export` | Single-book ZIP/JSON |

Tags remain Tag Manager APIs on `object_type=playbook_entry`.

---

## 7. Export Spec bump (candidate v1.4 / playbook model 2.0)

```yaml
format: fattail.labs.playbook
model_version: "2.0"
entries:  # books
  - id: export_key
    title: ...
    status: active|archived
    structured: {}
    chapters:
      - id: ...
        title: ...
        page_type: cover|chapter
        pages:
          - id: ...
            title: ...
            body_md: ...
    archive:
      - id: ...
        content_type: ...
        # binary in zip path archive/{id}.bin
    evidence:
      - object_type: journal_session
        object_export_key: ...
        note_md: ...
    stickies: []
```

Import: additive by export_key; evidence resolves if journal already imported or present.

---

## 8. Reliability invariants

| ID | Invariant |
|----|-----------|
| R-PB-1 | Family B on book, chapter, page, archive, sticky, evidence |
| R-PB-2 | Deleting book cascades children; **never** deletes journal or trade rows |
| R-PB-3 | Evidence object must same identity; invalid type/id → 422/404 |
| R-PB-4 | Archive storage path includes identity_id; no cross-read by URL guessing |
| R-PB-5 | Present mode does not load other members’ data |
| R-PB-6 | Export round-trip preserves chapter order and evidence keys (additive import) |
| R-PB-7 | No P&L aggregates on evidence rail or cover |
| R-PB-8 | Cover + ≥0 chapters always valid; empty book allowed |

---

## 9. Phasing (suggested implementation)

### Phase PB0 — Spec + OD freeze
- Land this Spec under `Specs/` after Claude pass  
- Amend Phase 1 Own Spine / Export Spec pointers  
- DL entry  

### Phase PB1 — Canvas + chapters (MVP)
- Schema + migrate existing three strategy books → cover + main page  
- 16:9 read/edit + chapter nav  
- Markdown render (`Markdown.tsx`)  
- Present mode (keyboard)  
- Tests: isolation, reorder, migrate  

### Phase PB2 — Staples
- Archive upload/serve  
- Inline images in markdown  
- Evidence rail journal select + list + remove  
- Optional: “Add to playbook” from Journal  

### Phase PB3 — Export + polish
- Playbook v2 pack export/import  
- Single-book ZIP  
- Stickies (if not in PB1)  
- Echo/Tango scrapbook density pass  
- Stretch: PNG page export  

### Phase PB4 — (optional, new OD)
- Private signed share links  
- Trade as evidence  
- True multiplayer present  

---

## 10. Acceptance criteria (Delta-checkable, post-build)

1. Open a strategy book → cover page + at least one chapter page in **16:9**.  
2. Add chapter, add page, reorder; persist after reload.  
3. Edit markdown; GFM tables/images render; present mode is chrome-light for screenshot.  
4. Upload archive image; embed in page; reload works.  
5. Staple a journal session as evidence; appears in rail; unlink does not delete journal.  
6. Shared tag alone does **not** create evidence without explicit staple.  
7. Export book pack includes chapters/pages/archive meta/evidence keys; re-import additive.  
8. Cross-identity evidence/archive attempt fails loud.  
9. Existing trade `playbook_entry_id` and campaign scope still resolve to book id.  
10. No profit claims on cover or evidence UI.  

---

## 11. As-built anchors (reuse)

| Area | Reuse |
|------|--------|
| Book CRUD / tags / trade FK | `member_playbook_entries`, `practice_spine_*`, TagPicker `playbook_entry` |
| Markdown | `web/components/Markdown.tsx` |
| Media pattern | `journal_session_media.py` + attachments table shape |
| Export | `export_domain.build_playbook_document` → v2 |
| Course copy already in books | Classic / Batman / Time Warp body_md → migrate into pages |
| House design keys | `structured.house_design_key` preserved at book level |

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Scrapbook becomes junk drawer | Evidence + archive are intentional actions; empty-state copy; chapter discipline |
| 16:9 fights long checklists | Multi-page chapters; scroll *inside* spread only if needed; prefer new page |
| Media disk growth | Caps per book; purge with practice data |
| Dual model confusion (body_md vs pages) | Migration one-way; UI page-first; deprecate blob in list |
| Share leak of journal evidence | OD-PB-2 export-only until private share OD |

---

## 13. Questions for Claude (and Grok) — solicit ideas

Please challenge or improve:

1. **Scrapbook UX:** How far should v1 go on stickies / free-position pins vs chapter-only structure?  
2. **Cover vs first chapter:** Prefer special `page_type=cover` or a mandatory Cover chapter?  
3. **Evidence graph:** Book-level evidence only, or also pin a journal to a specific page?  
4. **Present vs scrapbook dual-mode:** Single UI with drawers, or hard-split routes?  
5. **Archive binaries in export:** Always embed in ZIP, or metadata-only + optional media flag?  
6. **Deprecated `body_md`:** Drop after migrate, or keep as search/snippet field forever?  
7. **Naming:** Keep member word “Playbook” only, or surface “Book / Chapter / Spread” in UI?  
8. **Performance:** Lazy-load pages vs full tree on book open?  
9. **Mobile scrapbook:** Acceptable compromises for 16:9 on phone?  
10. **Alignment with Strategy Lab house designs:** Auto-scaffold chapters from house design + course_refs?  

---

## 14. Copy / Tango locks (seed)

- Empty book: “This is your scrapbook for how you trade under risk — not a performance report.”  
- Evidence empty: “Staple journal sessions that prove you practiced this book.”  
- Archive empty: “Charts, prints, PDFs — whatever you’d staple into a paper playbook.”  
- Present: “Present mode — clean frame for review. Screenshots welcome.”  

---

## 15. Out of scope (explicit)

- Public marketing pages for a member playbook  
- Auto P&L attribution to a book  
- Live rule engine / order blocking from playbook text  
- Replacing Strategy Lab design packs  
- Full collaborative multiplayer editing  

---

## 16. Decision log draft (for later DL)

> **Playbook Scrapbook Presentation:** Member Playbook books are chaptered 16:9 scrapbooks (cover + pages + archive + explicit journal evidence). Export-only sharing in v1. Family B. Migrate flat body_md into pages. Metaphor: glorious trader scrapbook, presentation-capable.

---

## 17. Implementation plan summary (when BUILD AUTHORITY)

1. Spec land + DL + Export/Phase-1 cross-links  
2. Migration 094+ schema + data migrate three strategy books  
3. Domain + APIs  
4. UI library + book stage + present  
5. Archive + evidence  
6. Export v2 + tests  
7. Rebuild + visual check  

---

*End of draft Spec. For Claude: treat §0 metaphor and §13 questions as the creative open surface; treat §2 locks as fixed unless you recommend reopening with rationale.*
