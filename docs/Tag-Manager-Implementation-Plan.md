# Tag Manager — Full Implementation Plan

**Date:** 2026-07-30  
**Program:** `agents/p-tag-manager/`  
**Spec:** [`Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md`](../Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md) (DRAFT)  
**Product locks:** [`docs/Tag-Manager-Spec-v0.2-Evaluation.md`](./Tag-Manager-Spec-v0.2-Evaluation.md) §0  

**Sequencing law:** **Tag Manager ships and gates complete before Journal Session v0.5 implementation begins.**  
Journal becomes a *consumer* of a finished vocabulary + assignment API + picker — not a co-designed experiment.

---

## 0. Product model (locked)

| Layer | Who | What |
|-------|-----|------|
| **Vocabulary (definitions)** | **Admin only** | Create, rename, merge, retire, delete (zero use), seed, categorize, describe |
| **Assignment** | Members (on objects they own) + admins (on public objects) | Assign / unassign existing tags only |
| **Browse** | Members | Resources hub **Lexicon** (read-only teaching list) |
| **Not in product** | — | `/me` tag CRUD · personal tag ownership · free-text auto-create of new tags · P&L on tags |

**Governing idea (amended):** *Admin defines the lexicon. The trader labels objects from that lexicon. The system never invents labels for them.*

**Why before Journal:** Journal chips, agent context, and export of “what was tagged” all need a stable `tag_id` and picker. Building Journal first forces a throwaway string-tag SoR and a second migration.

---

## 1. Outcomes / Definition of Done

1. Admin can fully manage the system tag vocabulary under **`/admin/tags`** (or equivalent).  
2. Members can **browse** the lexicon under **Resources hub** (Library \| Lexicon).  
3. Shared **picker** assigns/unassigns tags on supported `object_type`s without creating tags.  
4. Family B: assignments on member-owned objects isolated; lexicon is platform data.  
5. Export/purge of member data includes/removes **assignments**, not vocabulary.  
6. No public SEO tag index pages. No required tags. No agent instruction from tags.  
7. **TM program gate PASS** before `p-journal-session-v05` opens J1 implementation seeds.  
8. Characterization suite green; DL + Spec amend (admin-only model) logged.

---

## 2. Spec work before code (TM0)

Spec v0.2 still describes a personal vocabulary tier. **Coach locks override.** Before BUILD AUTHORITY:

| Task | Owner | Deliverable |
|------|-------|-------------|
| Amend Spec → **v0.2.1 or v0.3** | Juliet / India / Claude under Coach | Single admin lexicon; assign-only members; surfaces § below |
| Seed list + descriptions | Hotel · Tango | Behavior / context / process / insight terms |
| Categories vs course taxonomy | India · Sierra | Tags additive only |
| MSC HTTP vs Labs-native | Coach · India | Default: **Labs-native** |
| Aggregates min-N | Mike | Optional admin concept counts |

### Surfaces (for Spec amend)

| Route | Role |
|-------|------|
| `/admin/tags` | Tag Manager CRUD + merge + seed |
| `/resource` | Hub: **Library** (existing) + **Lexicon** (browse active tags RO) |
| Practice apps | Shared `<TagPicker />` only |
| `/me` | **No** tag manager |

### Schema target (simplified under locks)

```
tag_categories          -- optional teaching categories (behavior|context|process|insight + custom admin)
  id, system_key NULL UNIQUE, label, sort_order, created_at, updated_at

tags
  id, slug UNIQUE, label, description NULL, category_id NULL,
  color NULL, status (active|retired),
  merged_into_tag_id NULL,
  created_at, updated_at
  -- case-insensitive unique on label (collation)

tag_assignments
  id, tag_id, object_type, object_id,
  identity_id NULL,          -- set when object is member-owned (Family B)
  export_key NULL,
  created_at
  UNIQUE (tag_id, object_type, object_id)
  INDEX (object_type, object_id)
  INDEX (identity_id)
```

**Not built:** `member_tags`, `member_tag_categories`, personal `lexicon_key` copies, auto-create.

---

## 3. Program sequencing vs Journal

```
                    ┌─────────────────────────────┐
                    │  p-tag-manager              │
                    │  TM0 → … → TM7 PASS         │
                    └─────────────┬───────────────┘
                                  │ APIs + picker + seed
                                  ▼
                    ┌─────────────────────────────┐
                    │  p-journal-session-v05      │
                    │  J0 GO only after TM ready  │
                    │  J1+ uses TagPicker + IDs   │
                    └─────────────────────────────┘
```

| Rule | Practice |
|------|----------|
| Journal **J1+ implementation seeds** | Blocked until **TM7-G PASS** (or Coach-waived minimum: TM1–TM3 + TM4 admin seed) |
| Recommended minimum before Journal UI | **TM3 PASS** (assign API + picker) + **TM2** seed; **TM4** admin usable |
| Ideal | Full Tag Manager program closed, then Journal greenfield |

**Juliet:** Do not open Journal implementation packets until the board says TM ready.

---

## 4. Dependency graph (phases)

```
TM0  Spec amend + Coach GO + seed content
 │
 ▼
TM1  Migrations + domain model
 │
 ▼
TM2  Public/member list-active + admin write APIs (vocabulary)
 │
 ▼
TM3  Assignment APIs + shared TagPicker (no create-from-text)
 │
 ├──────────────────┬──────────────────┐
 ▼                  ▼                  ▼
TM4 Admin UI        TM5 Resources      TM6 Portability
    /admin/tags         hub Lexicon        export/purge
 │                  (browse RO)            assignments
 ▼
TM7 Characterization + Delta program gate  →  unlock Journal
```

**Critical path:** TM0 → TM1 → TM2 → TM3 → TM7  
**Parallel after TM3:** TM4 admin UI · TM5 hub · TM6 export  

---

## 5. Phase detail

### TM0 — Spec lock & GO

| Seed | Agent | Reviewers | Work |
|------|-------|-----------|------|
| TM0-1 | India | Coach | Spec v0.2.1/v0.3: admin-only model; schema; object_type enum draft |
| TM0-2 | Sierra · Echo | Coach | Resources hub IA; no public tag pages |
| TM0-3 | Mike | India | Family B assignment ACL matrix by object_type |
| TM0-4 | Hotel · Tango | Coach | Seed vocabulary + descriptions |
| TM0-5 | Lima | — | Supersession note; DL draft |
| TM0-G | Delta | — | Spec-lock evidence |
| TM0-0 | Coach | — | **BUILD AUTHORITY GO** |

**Exit:** Spec BUILD AUTHORITY · seed content approved · MSC decision logged.

---

### TM1 — Schema & domain

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| TM1-1 | Alpha | India · Mike | Migration: categories, tags, tag_assignments |
| TM1-2 | Alpha | India | Domain module: CRUD admin, list active, assign rules |
| TM1-3 | Alpha | India | Migrate legacy journal session tags (if any) → system tags + assignments |
| TM1-4 | Kilo | Alpha · Mike | Unit tests: uniqueness, retire≠delete-with-use, isolation |

**Config (fail loud):** max label length, charset, max tags, default category — env or config table, no silent hardcode of policy.

**Exit:** Migrations apply clean; domain tests pass.

---

### TM2 — Vocabulary APIs

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| TM2-1 | Alpha | Mike | `GET /api/tags` (active; member + admin) |
| TM2-2 | Alpha | Mike | Admin: `POST/PATCH` tags, retire, merge, categories |
| TM2-3 | Alpha | Hotel | Seed endpoint or migrate seed rows from approved list |
| TM2-4 | Kilo | Alpha | AuthZ: non-admin cannot mutate definitions |

**Exit:** Seeded vocabulary listable; admin can mutate; members cannot invent tags via API.

---

### TM3 — Assignments + picker (Journal unlock gate)

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| TM3-1 | Alpha | Mike · India | `PUT/DELETE` assignments by object_type + object_id |
| TM3-2 | Alpha | Mike | `GET` assignments for object (family-scoped) |
| TM3-3 | India · Alpha | Mike | object_type ACL matrix: journal_session, trade, course, resource, … |
| TM3-4 | Charlie | Echo · Tango | `<TagPicker />` — multi-select from active tags only |
| TM3-5 | Kilo | Alpha · Mike | Isolation: member A cannot read B’s Family B assignment sets; cannot assign to foreign objects |

**Exit:** **TM3-G** — picker works on at least one Practice object type (stub page or trade-log optional) + full API for Journal to consume.

**This is the earliest point Journal J1 may start *if* Coach waives full TM7** — still prefer full program.

---

### TM4 — Admin Tag Manager UI

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| TM4-1 | Charlie | Echo | `/admin/tags` in admin nav |
| TM4-2 | Charlie | Tango · Hotel | List, create, edit description, category, color, retire |
| TM4-3 | Charlie · Alpha | Mike | Merge flow (re-point assignments); audit log |
| TM4-4 | Kilo | Alpha | UI + API e2e smoke |

**Exit:** You can curate the lexicon without SQL.

---

### TM5 — Resources hub

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| TM5-1 | Charlie · Echo | Sierra | `/resource` as hub: **Library** \| **Lexicon** |
| TM5-2 | Charlie | Tango | Lexicon: category groups, descriptions (read-only) |
| TM5-3 | Sierra | India | No `/tag/[slug]` public index; hub not a second course taxonomy |
| TM5-4 | Echo | Coach | Visual hierarchy vs existing resource library |

**Exit:** Main menu **Resources** teaches the lexicon; CRUD stays admin.

---

### TM6 — Portability

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| TM6-1 | Alpha | India · Mike | Export includes assignments on member-owned objects |
| TM6-2 | Alpha | Mike | Purge removes those assignments; vocabulary untouched |
| TM6-3 | India | Alpha | Practice Export Spec version note / bump |
| TM6-4 | Kilo | Alpha | Isolation + purge characterization |

---

### TM7 — Program gate

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| TM7-1 | Kilo | Alpha · Mike | Full Spec §14 suite (adapted to admin-only model) |
| TM7-G | Delta | — | **PASS** with evidence |
| TM7-L | Lima | — | DL entry; Spec as-built honesty; banner on Journal board: **unblocked** |

**Exit:** Tag Manager **COMPLETE**. Juliet may open Journal Session v0.5 **J1** seeds.

---

## 6. API sketch (contracts for India/Alpha)

Capabilities (not final paths — India freezes names):

| Capability | Auth | Notes |
|------------|------|--------|
| List active tags (+ categories) | Session (any entitled member) | Picker + hub |
| Admin create/update/retire/merge tag | Admin | Fail loud validation |
| Admin manage categories | Admin | system_key immutable if set |
| Assign tag to object | Object write ACL | tag_id must exist & active |
| Unassign | Object write ACL | |
| List assignments for object | Object read ACL | |
| Admin aggregate counts by tag | Admin | Optional; min-N if Mike requires |

**Forbidden:** create-tag-on-assign; member PATCH on tag definition.

---

## 7. object_type matrix (draft for India)

| object_type | Family | Who assigns | identity_id on row |
|-------------|--------|-------------|--------------------|
| `course` | Public | Admin | null |
| `resource` | Public | Admin | null |
| `lesson` | Public | Admin | null |
| `journal_session` | B | Owner | owner identity_id |
| `trade` / `trade_log_trade` | B | Owner | owner |
| `retrospective` | B | Owner | owner |
| `playbook_entry` | B | Owner | owner |

Journal Session v0.5 uses `journal_session` only after TM3.

---

## 8. Full agent bench map

| Phase | Primary | Reviewers | Gate |
|-------|---------|-----------|------|
| TM0 | Coach · India · Juliet | Sierra, Mike, Hotel, Tango, Echo, Delta, Lima | TM0-G · GO |
| TM1–2 | Alpha | India, Mike, Hotel | TM1/2 tests |
| TM3 | Alpha · Charlie | Mike, India, Echo, Tango | **TM3-G** (API ready) |
| TM4 | Charlie | Echo, Mike, Sierra | Admin usable |
| TM5 | Charlie · Echo | Sierra, Tango, India | Hub live |
| TM6 | Alpha | India, Mike | Export/purge |
| TM7 | Kilo · Delta | Lima | **TM7-G program PASS** |

---

## 9. Verification (adapted from Spec §14)

1. One definition store; no per-app or per-member definition tables.  
2. Non-admin cannot create/rename/merge tags (API 403).  
3. Assign rejects unknown or retired tags.  
4. Rename keeps `id`; assignments unbroken.  
5. Merge re-points assignments; count preserved.  
6. Tag with assignments cannot hard-delete.  
7. Family B assignment isolation.  
8. Purge removes member assignments; lexicon intact.  
9. Export includes assignments.  
10. No surface requires a tag.  
11. Agent context (when Journal ships): description only — fixture ready in TM suite as contract test.  
12. No P&L/win-rate UI or API field on tags.  
13. No public `/tag/*` index routes.  
14. Case-insensitive label uniqueness.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Spec still says personal tier | TM0 amend before code |
| Journal starts early with string tags | Board hard-block on J1 until TM3/TM7 |
| Resources hub confuses categories | Sierra gate; tags additive only |
| Empty lexicon at launch | Hotel seed mandatory in TM0/TM2 |
| Admin-only feels rigid | Adopt “propose later” residual; not v1 |

---

## 11. Residuals (explicitly not this program)

- Member-proposed tags queue  
- MSC HTTP federation  
- Course “you use this concept, try this course” (§13.5)  
- Wiki tagging  
- Auto-create from chat free text  
- Journal Session UI (separate board after TM7)

---

## 12. Decision-log entry (draft on GO)

> **Tag Manager — admin-curated system lexicon; members assign only.** One platform vocabulary  
> controlled by admin CRUD; members browse on Resources hub and assign existing tags on Practice  
> and catalog objects. No personal tag ownership, no `/me` tag manager, no free-text tag creation.  
> Assignments inherit object family (Family B when member-owned). Tags never gate, never instruct  
> agents, never correlate with P&L. Tag Manager program completes before Journal Session v0.5  
> implementation. Spec v0.2 personal-tier text superseded by this lock / Spec v0.3 amend.

---

## 13. Immediate next actions

1. **Coach:** Confirm this plan (especially TM7 before Journal J1).  
2. **India + Claude:** Spec amend to admin-only model (v0.2.1/v0.3).  
3. **Hotel + Tango:** Finalize seed list.  
4. **Juliet:** Freeze Journal implementation until TM3 minimum / TM7 ideal.  
5. **Delta:** TM0-G when Spec + locks documented.  
6. **Alpha:** TM1 after GO only.

---

## 14. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Full plan: admin-only tags; Tag Manager before Journal Session |
