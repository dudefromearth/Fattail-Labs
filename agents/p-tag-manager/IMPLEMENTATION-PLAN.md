# Implementation Plan — p-tag-manager

**Canonical long form:**  
[`docs/Tag-Manager-Implementation-Plan.md`](../../docs/Tag-Manager-Implementation-Plan.md)

**Authority:** Tag Manager Spec v0.2 + Coach locks (admin-only CRUD; members assign only)  
**Sequencing:** **This program completes before Journal Session v0.5 implementation (J1+).**

---

## Product locks

| Lock | Decision |
|------|----------|
| Vocabulary CRUD | **Admin only** |
| Members | **Assign/unassign** existing tags only |
| `/me` tags | **No** |
| Auto-create labels | **No** |
| Resources | Hub **Library \| Lexicon** (lexicon read-only) |
| Journal | Consumer after TM ready |

---

## Dependency graph

```
TM0  Spec amend + GO + seed content
 │
 ▼
TM1  Schema: categories + tags + tag_assignments
 │
 ▼
TM2  List active + admin vocabulary write APIs + seed
 │
 ▼
TM3  Assign/unassign + TagPicker  ← earliest Journal unblock (prefer full TM7)
 │
 ├──────────────┬──────────────┐
 ▼              ▼              ▼
TM4 Admin UI    TM5 Resources  TM6 Export/purge
    /admin/tags     hub Lexicon    assignments
 │
 ▼
TM7 Program gate PASS  →  unlock p-journal-session-v05 J1
```

---

## Phases (seed table)

| Phase | Primary | Reviewers | Exit |
|-------|---------|-----------|------|
| **TM0** | Coach · India · Juliet | Sierra, Mike, Hotel, Tango, Echo, Delta, Lima | BUILD AUTHORITY |
| **TM1** | Alpha | India · Mike | Migrations + domain |
| **TM2** | Alpha | Mike · Hotel | Vocab APIs + seed |
| **TM3** | Alpha · Charlie | Mike · India · Echo · Tango | Assign API + picker |
| **TM4** | Charlie | Echo · Mike · Sierra | Admin Tag Manager |
| **TM5** | Charlie · Echo | Sierra · Tango | Resources hub Lexicon |
| **TM6** | Alpha | India · Mike | Export/purge |
| **TM7** | Kilo · Delta | Lima | **Program COMPLETE** |

Full seed IDs, API sketch, object_type matrix, verification: see docs plan.

---

## Journal handoff

| When | Journal may |
|------|-------------|
| Before TM3 | Spec review only (J0); **no** J1 code |
| After TM3-G | Optional early J1 if Coach waives (not recommended) |
| After TM7-G | **Normal path:** open Journal J1 with TagPicker + tag_id assignments |

**Do not** store free-text tags on journal sessions as SoR.

---

## Non-goals

Member tag CRUD · personal vocab · free-text birth · P&L on tags · public tag SEO pages ·  
Journal UI implementation inside this board.
