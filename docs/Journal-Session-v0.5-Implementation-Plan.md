# Journal Session v0.5 — Full Implementation Plan

**Date:** 2026-07-30  
**For:** Coach review  
**Spec:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md) (DRAFT — Tag Manager compliant)  
**Board:** [`agents/p-journal-session-v05/`](../agents/p-journal-session-v05/)  
**Prerequisite:** Tag Manager Spec **v0.3** as-built (DL-159 · TM7-G PASS · mig 053)

**Stance:** Greenfield product UI and agent behavior. Prior session code is **substrate**, not the design target.

---

## 0. Product summary

| Element | v0.5 law |
|---------|----------|
| Primary surface | AI chatbot — composer + thread |
| Interview | On request only; collapses to bar |
| Tags | **System tags only** via Tag Manager; assign/unassign; never create; **compact control → list window** (not a chip wall) |
| Seal | Retrospective complete only (scope-true) |
| Agent | Member-first; code guardrails; once-only absences; RTH silent unless asked |
| Process integrity | Phase on messages; member-only quotes for intent |

---

## 1. Tag Manager compliance (implementation contract)

| Requirement | Implementation |
|-------------|----------------|
| No vocabulary SoR on session | Do not write new sessions relying on `tag` column as SoR; migrate off |
| Assignments | `object_type=journal_session`, `identity_id=owner` |
| UI | Compact "Tags" control → **popover/modal list** multi-select; may adapt `TagPicker` as window body only — **not** always-on full vocabulary |
| APIs | `GET /api/tags`, `PUT /api/tags/assignments` (shipped) |
| Agent | Inject **labels** of assigned tags into context string only |
| Export/purge | Already partially wired; complete in J9 |
| Forbidden | Free-text tags, member tag CRUD, tag-opens-interview, tag-as-retro-nav |

**Retrospective control** = dedicated UI action (§6 Spec), **not** a Tag Manager chip named retrospective.

---

## 2. Sequencing vs Tag Manager

```
Tag Manager  COMPLETE (done)
      │
      ▼
J0  Spec GO (this Spec after Coach review)
      │
      ▼
J1  Chat surface + schema  ──┬──► J4 TagPicker wire
      │                      ├──► J6 media
      ▼                      ├──► J7 retro action
J2  Agent                    └──► J9 portability
      │
      ├──► J3 admin prompt
      └──► J5 interview bar
      │
      ▼
J8  Closure (critical path with J1–J2–J7)
```

**Critical path:** J0 → J1 → J2 → J7 → J8  
**Parallel after J1:** J4 (tags), J6 (media)  
**After J2:** J3 (prompt), J5 (interview)

---

## 3. Definition of Done (program)

1. Empty day = composer only (no start button); first send creates open session.  
2. Thread + composer; optional system tag chips; interview on request → bar.  
3. Agent: member-first, guardrails, RTH, once-only, tag labels as context only.  
4. Admin prompt versions stamped on sessions.  
5. Retro action leaves session open; complete warning names dates + open count.  
6. Scope-true closure; 409 on closed dates; tags immutable when closed.  
7. Family B media paste path.  
8. Export/purge include tags + media; suite green; DL + Spec BUILD after GO.  
9. Grep CI: no internal vocab in member HTML.

---

## 4. Phase detail (full bench)

### J0 — Spec GO + freeze

| Seed | Agent | Reviewers | Work |
|------|-------|-----------|------|
| J0-1 | India | Coach | Spec integrity; keep/kill substrate; migration map |
| J0-2 | Mike | India | Family B, media, prompt authority, principals interim |
| J0-3 | Hotel | Tango | Guardrails, phase, non-vision |
| J0-4 | Tango | Echo | Copy; migration reopen honesty |
| J0-5 | Echo | Tango | Composer-first + interview bar + tag chips layout |
| J0-6 | Sierra | — | No marketing leakage |
| J0-TM | India · Alpha | — | Confirm Tag Manager compliance §5 |
| J0-G | Delta | — | Spec-lock evidence |
| J0-0 | Coach | — | **GO** + §17 locks |

**Exit:** BUILD AUTHORITY · board unfrozen for J1.

---

### J1 — Schema + chatbot surface

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J1-1 | Alpha | India | Migration: status open\|closed; prompt_version_id; deprecate session.tag SoR; dual-read legacy |
| J1-2 | Alpha | India | Market calendar config fail-loud (wire phase) |
| J1-3 | Charlie · Echo | Tango | **Rewrite** day view: calendar, date, composer, thread, trades — no start button |
| J1-4 | Alpha | India | First send creates session (or empty open then first message) per Spec |
| J1-5 | Kilo | Alpha · Mike | Multi-entry, phase, isolation, closed 409 |

**Substrate:** May reuse message tables / calendar shell; **must not** ship form-primary layout.

**Exit:** Empty day = composer; send creates record; J1-G.

---

### J2 — Agent (process integrity)

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J2-1 | Alpha · Mike | Hotel · Tango | Context: trade log + journey profile + **assigned tag labels** |
| J2-2 | Alpha | Mike · Hotel | Code guardrails pre-render; once-only absence keys |
| J2-3 | Alpha | Hotel | RTH: no unprompted Q; answer if asked; member always first |
| J2-4 | Charlie | Tango · Echo | Model down: composer captures; UI unchanged |
| J2-5 | Kilo | Alpha · Hotel | Guardrail corpus + RTH + once-only |

**Exit:** J2-G.

---

### J3 — Admin prompt versions

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J3-1 | Alpha | Mike · Tango | Versioned prompt store; session stamp |
| J3-2 | Charlie | Echo | Admin UI; audit |
| J3-3 | Kilo | Alpha | Historical sessions keep prior version id |

---

### J4 — System tags (Tag Manager)

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J4-1 | Charlie · Echo | Tango | Compact tags control + **list window** (searchable multi-select); optional; no create; composer stays primary |
| J4-2 | Charlie | Echo | Closed: tags control read-only or hidden; no full vocab dump in main column |
| J4-3 | Alpha | India | Closed session refuses assignment API changes |
| J4-4 | Alpha | Hotel · Tango | Agent context: labels only; fixture proves no behavior gate |
| J4-5 | Kilo | Alpha · Mike · Echo | Isolation; retired not assignable; layout: tags control does not dominate (viewport / snapshot check) |

**Uses shipped APIs:** `/api/tags*`. Adapt `TagPicker` as list-window content if useful.

---

### J5 — Interview on request

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J5-1 | Charlie · Echo | Tango · Hotel | Request → panel; collapse bar; confirmed fields persist |
| J5-2 | Alpha | India | structured_json only on confirm |
| J5-3 | Kilo | Alpha | Never open on load; tag selection does not open interview |

---

### J6 — Uploads

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J6-1 | Mike · Alpha | India | Private media store; paste primary |
| J6-2 | Charlie | Hotel · Tango | In-chat attach + caption |
| J6-3 | Kilo | Mike | No public URL; purge/export |

---

### J7 — Retrospective action

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J7-1 | Alpha · Charlie | India · Tango | Dedicated control (not a system tag chip) |
| J7-2 | Charlie | Tango | Gather + complete warning copy |
| J7-3 | Kilo | Alpha | No auto-gather; leave open; dual link |

---

### J8 — Closure

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J8-1 | Alpha | India · Mike | Scope-true close; sessions closed; tag changes blocked |
| J8-2 | Charlie | Tango | Complete warning: dates + open session count |
| J8-3 | Kilo | Alpha · Delta | 409 + link; permanent; is_demo |

---

### J9 — Portability + close

| Seed | Agent | Reviewers | Deliverable |
|------|-------|-----------|-------------|
| J9-1 | Alpha · India | Mike | Export Spec bump; tags + sessions + media |
| J9-2 | Alpha | Mike | Purge sessions + assignments + media |
| J9-3 | Kilo | Alpha | Full suite |
| J9-G | Delta | — | Program PASS |
| J9-L | Lima | — | DL; Spec BUILD/as-built honesty |

---

## 5. Keep / kill (substrate audit at J0)

| Keep (likely) | Kill / replace |
|---------------|----------------|
| Message + session tables (migrate) | Form-primary JournalCalendar layout |
| Private media pattern | Member seal as product lifecycle |
| Date closures + retro complete hook | Depth budgets / tag scripts |
| Tag Manager assignments | Session.tag string SoR |
| Phase derivation core | Dual write path / "start conversation" chip-as-script |

---

## 6. API / domain sketch (Journal-owned)

| Capability | Notes |
|------------|--------|
| Create/list/get sessions | By journal_date; open\|closed |
| Append member message | Creates phase; may create session on first send |
| Agent turn | Context assembly includes tag labels |
| Interview confirm | structured_json |
| Retro navigate | Not a tag |
| Closure | On retro complete (existing hook + session status) |
| Tags | **Delegate entirely to Tag Manager** |

---

## 7. Verification map (Spec §15)

| Area | Owner | Evidence |
|------|-------|----------|
| Surface composer-first | Kilo · Echo | Browser + tests |
| Tags list window (not chip wall) | Kilo · Echo | Compact control; window for select |
| Tag Manager compliance | Kilo · Mike | API + no create + closed refuse |
| Agent guardrails | Kilo · Hotel | Corpus |
| Closure scope-true | Kilo · India | Retro complete + 409 |
| Copy CI grep | Kilo | Phase/status/§ banned in member HTML |
| Export/purge | Kilo · Alpha | Isolation |

---

## 8. Full bench roster

| Agent | Role |
|-------|------|
| Coach | GO, §17 locks |
| Juliet | Board, seed order |
| India | Schema, closure, Tag Manager boundary |
| Mike | Family B, media, prompt, principals |
| Hotel | Guardrails, phase, trading accuracy |
| Tango | Copy, capacity, tags as framing |
| Echo | Layout, interview bar, chips |
| Charlie | Chat UI, TagPicker wire, admin prompt UI |
| Alpha | Domain, agent, calendar, portability |
| Sierra | No leakage; tags ≠ categories |
| Kilo / Delta | Tests / gates |
| Lima | DL + Spec honesty |

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Shipping old form UI as "chat" | J1 rewrite gate; Echo review |
| Reintroducing free-text tags | Spec §5.3 + tests |
| Tag chip opens interview | Explicit forbid + J5-3 |
| Retro chip as system tag | §6 action control only |
| Premature J1 before GO | Board J0 required |

---

## 10. Open decisions (Spec §17) — block only if they touch critical path

| # | Blocks |
|---|--------|
| 1–3 Cadence/routine | Not J1–J2; residual OK |
| 4 Voice | Ship without voice if undecided |
| 5 Persona | Residual |
| 6 Prompt scope | Blocks J3 polish only |
| 7 Principals | Interim OK for J2 |
| 8 Migration honesty | Blocks J1 data migration |

---

## 11. Immediate next (after Coach Spec review)

1. Coach: Spec v0.5 approval or RETURNED comments  
2. J0 gates (India first on Tag Manager §5)  
3. Coach GO → J1 rewrite  
4. Do **not** re-open Tag Manager board for vocabulary work unless Spec requires it  

---

## 12. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Full plan; Tag Manager compliance; Tag Manager already shipped |
| 2026-07-30 | Tags UI: compact control + list window (Coach) |
