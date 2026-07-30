# Journal Session v0.5 + Tag Manager v0.1 — Evaluation & Full Agent Bench Plan

**Date:** 2026-07-30  
**Audience:** Coach · Juliet · full bench  
**Specs:**  
- [`Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md)  
- [`Specs/FatTail-Labs-Tag-Manager-Spec-v0.1.md`](../Specs/FatTail-Labs-Tag-Manager-Spec-v0.1.md)  

**Status of this note:** Advisory plan. Neither Spec is BUILD AUTHORITY until Coach GO + named gates.  
**Stance:** **Greenfield product architecture.** Prior Session programs (v0.2, v0.4a) are historical substrate only — not the product target.

---

## 0. Understanding (locked for this plan)

| Point | Meaning |
|-------|---------|
| **Totally revamped Journal** | v0.5 rewrites the product: chatbot is the Journal; conversation is the record; no alternative write path |
| **Tag Manager is new + system-wide** | Platform vocabulary; Journal is one consumer among Practice + catalog |
| **Process integrity is central** | Falsifiable intent, honest phase, permanent audit closure, capacity over dependency |
| **Start fresh** | Design and board for v0.5 / Tag Manager as **new programs**, not patches on p-journal-session or v04 |

---

## 1. Executive verdict

| Spec | Product direction | Draft quality | Feasibility | Ready for GO? |
|------|-------------------|---------------|-------------|---------------|
| **Journal Session v0.5** | **Correct** — matches “chatbot is the journal” | High; clean rewrite | High for surface + model; medium for editable prompt + voice | **After** open decisions + gates |
| **Tag Manager v0.1** | **Correct** — platform lexicon, context-only | High; clear family split | High | **After** authorship + taxonomy locks |

**Together:** Tag Manager must land **definition + assignment API before** Journal J4 (tag chips). Journal must not own vocabulary tables. Integration is by contract: polymorphic assignments + Journal never reads tags as gates.

---

## 2. Evaluation — Journal Session Spec v0.5

### 2.1 Strengths

1. **Honest rewrite** — Explicitly kills tag-scripts, depth budgets, required fields, partial, day-seal, dual write paths, on-screen apologetics.  
2. **Process integrity is first-class** — Phase on every message; retro quotes member only; once-only absences; code guardrails vs prompt.  
3. **UI is product law** — Composer-first; interview only on request, collapses to bar; no start button; no internal vocab in copy.  
4. **Single seal** — Scope-true closure on retro complete; permanent; demo immutability.  
5. **Agent design is right-sized** — Trade log + Journey profile as context; never unprompted open; silent unprompted in RTH; admin-editable prompt with **version stamp**.  
6. **Build order** — Agent (J2) before interview (J5); tags depend on Tag Manager (J4).  
7. **Review gates named per section** — Bench-ready.

### 2.2 Gaps / risks (must close before or at GO)

| # | Issue | Severity | Owner |
|---|--------|----------|-------|
| 1 | **§17 open decisions** still open (cadence, voice, persona, prompt edit scope, agent principals, migration) | Blocking for full ship | Coach + owners |
| 2 | **Migration ethics** — sealed → open again; legacy agent turns stay (append-only) — needs Tango copy + India map | High | India + Tango |
| 3 | **“Composer always captures if agent down”** vs no plain-text *mode* — same thing, but product language must not reintroduce a second surface | Medium | Echo + Tango |
| 4 | **Admin prompt editable** while guardrails in code — need Mike/Tango review of who can edit and audit trail | High | Coach + Mike + Tango |
| 5 | **Voice input** in §1.1 — open decision §17.4; don’t block J1 without decision | Medium | Mike |
| 6 | **Entitlement “none”** vs Identity “no role → no access” — keep aligned with Identity Spec | Medium | Mike |
| 7 | **As-built table missing** — unlike v0.4a, v0.5 doesn’t inventory `main` substrate; risk of re-found or wrong kill | Medium | India (add § at GO) |
| 8 | Coupling **v0.4** for Tag Manager while Tag Manager points at Session — pin **v0.5 + Tag Manager v0.1** cross-refs | Low | Lima |

### 2.3 Process-integrity invariants (non-negotiable)

1. Transcript append-only while open; member content only for §6.5 expected-vs-actual (`pre_open`).  
2. Agent never invents fields, motives, P&L, grades; once-only absences.  
3. One seal: retrospective complete; scope-true; permanent for members.  
4. Tags never gate, never script, never open interview.  
5. Family B isolation on sessions, messages, media, member tag assignments.  
6. No member-facing shame/lateness/overdue copy.  
7. Capacity: agent calibrates on Journey profile; never recites meters.

### 2.4 Relationship to prior programs

| Prior | Status for v0.5 |
|-------|-----------------|
| `agents/p-journal-session/` (v0.2) | Historical complete — **do not reopen** |
| `agents/p-journal-session-v04/` (v0.4a) | Superseded product frame — **do not continue as target** |
| Substrate (tables, media, dual-read, export hooks) | **India keep/kill audit only after GO** — may reuse storage, not UX/product law |

---

## 3. Evaluation — Tag Manager Spec v0.1

### 3.1 Strengths

1. **Platform level** — One lexicon; doctrine-aligned (no second store of truth).  
2. **Definition vs assignment family split** — Platform definition; assignment inherits object family. **This is the architectural win.**  
3. **Context only for agents** — Explicit ban on tag-as-instruction (closes the v0.1–v0.2 failure mode).  
4. **Lifecycle** — Rename keeps id; merge re-points; retire not delete with assignments.  
5. **Taxonomy boundary** — Course categories and live audience contracts stay structural; tags not a rival.  
6. **No public tag index v1** — Right SEO default.  
7. **Verification is sharp** — Family B, purge, export, agent non-directive.

### 3.2 Gaps / risks

| # | Issue | Severity | Owner |
|---|--------|----------|-------|
| 1 | **Authorship model open** (curated / member-private / propose) — shapes schema and UI | **Blocking GO** | Coach + Tango |
| 2 | **Tags vs course categories** — additive vs merge | **Blocking GO** | India + Sierra |
| 3 | Seed vocabulary undefined | High for useful ship | Coach + Hotel |
| 4 | Admin per-member usage vs aggregate only | Medium (privacy) | Mike |
| 5 | Wiki surface unconfirmed | Low for v1 | Coach |
| 6 | Migration of Session v0.2/v0.4 inline tags / join tables | High | India |
| 7 | `object_type` enum and write ACL per type not fully listed | Medium | India + Alpha + Mike |
| 8 | Cross-spec: Session v0.5 §5 depends on this Spec — version pin | Low | Lima |

### 3.3 Platform invariants

1. One `tags` + one `tag_assignments` (polymorphic) — no per-app tables.  
2. Assignments on member objects are Family B; definitions are not.  
3. Never gate create/save/complete.  
4. Agent receives tags as description only.  
5. Merge/rename/retire audited.  
6. Purge removes assignments only.

---

## 4. Integration contract (Journal × Tag Manager)

```
                    ┌─────────────────────────┐
                    │  tags (platform def)    │
                    │  admin lifecycle        │
                    └───────────┬─────────────┘
                                │ tag_id
                    ┌───────────▼─────────────┐
                    │  tag_assignments        │
                    │  object_type+id         │
                    │  identity_id (if B)     │
                    └───────────┬─────────────┘
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
         Course (public)  Journal (B)      Trade Log (B) …
```

| Rule | Owner |
|------|--------|
| Journal session rows **do not** store tag strings as SoR | India |
| Journal UI chips call Tag Manager list + assign APIs | Charlie + Alpha |
| Agent context assembly: load assignments → “member tagged X” only | Alpha + Hotel |
| Export: assignments ride with session objects | Alpha + India |
| `retrospective` **behavior** is navigation, not a Tag Manager side effect — either a reserved platform tag with documented side effect in Session Spec only, or a separate nav control. **Recommend:** keep retrospective as Session routing control (chip or action), not a Tag Manager “smart tag.” | India + Coach |

**Recommended decision:** Tag Manager tags are **descriptive only**. “Go to retrospective” is a **Session-owned action** (may share visual language with chips but must not invent tag-driven workflows in Tag Manager).

---

## 5. Full agent bench — review ensemble (before BUILD)

Follow `agents/bench/spec-create-review-workflow.md`. **Two Spec tracks, coordinated.**

### Phase 0 — Coach intention (confirm)

| Output | Content |
|--------|---------|
| Success criteria | Process-integrity record; chatbot = journal; platform lexicon; no script tags |
| Non-goals | Form-primary, depth budgets, public tag SEO index, tag-as-permission |
| Greenfield | Prior boards not product authority |

### Phase 1 — Spec lock gates (parallel tracks)

#### Track A — Journal Session v0.5

| Gate ID | Agent | Reviews | Exit |
|---------|-------|---------|------|
| **JS5-R1** | **India** | Model, dates, closure scope-true, schema, Tag Manager boundary, migration map | APPROVED / RETURNED |
| **JS5-R2** | **Mike** | Family B, media, prompt-edit authority, demo immutability, voice, agent principals interim | APPROVED / RETURNED |
| **JS5-R3** | **Hotel** | Phase accuracy, guardrails, image non-interpretation, falsifiability | APPROVED / RETURNED |
| **JS5-R4** | **Tango** | All member copy, warnings, trial experience, migration reopen messaging | APPROVED / RETURNED |
| **JS5-R5** | **Echo** | Layout: composer-first, interview bar, calendar shell, HIG | APPROVED / RETURNED |
| **JS5-R6** | **Sierra** | No journal content on marketing/SEO surfaces | APPROVED / RETURNED |
| **JS5-R7** | **Delta** | Spec-lock evidence plan | PASS / FAIL |
| **JS5-R0** | **Coach** | GO / NO-GO + open decision locks | GO |

#### Track B — Tag Manager v0.1

| Gate ID | Agent | Reviews | Exit |
|---------|-------|---------|------|
| **TM-R1** | **India** | Platform model, polymorphic assignments, taxonomy vs categories/live | APPROVED / RETURNED |
| **TM-R2** | **Sierra** | Categories vs tags; no public tag index v1; catalog impact | APPROVED / RETURNED |
| **TM-R3** | **Mike** | Family B assignment isolation; admin aggregate vs per-member; audit | APPROVED / RETURNED |
| **TM-R4** | **Tango** | Authorship UX (missing word); no required tags | APPROVED / RETURNED |
| **TM-R5** | **Hotel** | Seed vocabulary quality (if GO includes seed) | APPROVED / RETURNED |
| **TM-R6** | **Delta** | Spec-lock evidence | PASS / FAIL |
| **TM-R0** | **Coach** | GO + authorship + seed | GO |

#### Cross-gate

| Gate | Agents | Content |
|------|--------|---------|
| **X-R1** | India · Juliet | Interface contract: object_types, no smart tags, retrospective action ownership |
| **X-R2** | Lima | DL entries; Spec headers BUILD AUTHORITY; supersession banners on v0.2–v0.4a |

**Rule:** Implementation seeds **forbidden** until JS5-R0 **and** TM-R0 (or explicit Coach waiver that Journal ships chips later with stub — **not recommended**).

---

## 6. Recommended GO locks (defaults for Coach agenda)

### Tag Manager

| Decision | Recommended default |
|----------|---------------------|
| Authorship | **Curated only** v1 (teach lexicon); member propose later residual |
| Categories | **Additive** — tags never replace course categories or live audience contracts |
| Public tag index | **No** in v1 |
| Admin usage view | **Aggregate only** (no per-member tag usage in admin) |
| Wiki | **Out of v1** |
| Seed vocabulary | Coach+Hotel list of 15–40 practice words (pre_market, invalidation, butterfly, …) before ship |
| Journal migration | Map legacy session tags → assignments; drop session-owned vocabulary SoR |

### Journal Session

| Decision | Recommended default |
|----------|---------------------|
| Closure | Scope-true (already in Spec) |
| Agent principals | **Interim** member session + `agent_service` + DL exception (same as prior) |
| Prompt edit | Admin only; versioned; guardrails code-only; audit every publish |
| Voice | **Provider later residual** — ship without voice in J1 if blocks |
| Migration | sealed/partial → open unless date closed; never rewrite transcripts |
| Persona name | Residual; no “Vexy” required for ship |
| Cadence UI | Residual on Journey/Retro boards if not blocking Journal core |

---

## 7. Program structure (new boards — greenfield)

```
agents/
├── p-tag-manager/              ← platform lexicon (ships first for API)
│   ├── CHARTER.md
│   ├── IMPLEMENTATION-PLAN.md
│   ├── ORCHESTRATOR.md
│   ├── seeds/
│   └── gate-reports/
└── p-journal-session-v05/      ← chatbot journal (depends on Tag Manager for J4)
    ├── CHARTER.md
    ├── IMPLEMENTATION-PLAN.md
    ├── ORCHESTRATOR.md
    ├── seeds/
    └── gate-reports/
```

**Do not reopen:** `p-journal-session`, `p-journal-session-v04`.

---

## 8. Implementation plan — Tag Manager (`p-tag-manager`)

**Authority after:** TM-R0 GO  

| Slice | Deliverable | Primary | Reviewers | Depends |
|-------|-------------|---------|-----------|---------|
| **TM0** | GO locks, DL, board freeze | Coach · Juliet | India | — |
| **TM1** | Schema `tags` + `tag_assignments`; seed empty or seed vocab | Alpha | India · Mike | TM0 |
| **TM2** | Public/member list active vocabulary; assign/unassign; read by object | Alpha | Mike · India | TM1 |
| **TM3** | Admin: create, rename, merge, retire; usage aggregates; audit | Alpha · Charlie | Mike · Sierra | TM1 |
| **TM4** | Wire first consumer: courses **or** journal (prefer journal after JS J1) | Alpha · Charlie | Sierra / India | TM2 |
| **TM5** | Export/purge assignments on Family B objects | Alpha | India · Mike | TM2 |
| **TM6** | Characterization + Delta program gate | Kilo · Delta | — | TM2–5 |

**Critical path:** TM0 → TM1 → TM2 → (Journal J4)  

**Parallel after TM2:** TM3 admin UI vs TM5 export.

**Non-goals in v1:** public tag pages, member-private tags (if curated-only GO), auto-tagging, wiki.

---

## 9. Implementation plan — Journal Session v0.5 (`p-journal-session-v05`)

**Authority after:** JS5-R0 GO  
**Hard dependency:** Tag Manager **TM2** before **J4**

| Slice | Deliverable | Primary | Reviewers | Depends |
|-------|-------------|---------|-----------|---------|
| **J0** | GO, open decisions, DL, new board, as-built keep/kill | Coach · Juliet · India | Delta | Spec review |
| **J1** | Greenfield chat surface: calendar + date + **composer** + thread; schema migration for open\|closed + prompt_version_id; market calendar | Charlie · Echo · Alpha | Tango · India | J0 |
| **J2** | Agent: context (trade log + journey profile), code guardrails, once-only, RTH rules, member-first, fail → capture only | Alpha · Mike | Hotel · Tango · Delta | J1 |
| **J3** | Admin prompt editing + versioning + session stamp | Alpha · Charlie | Mike · Tango · Hotel | J2 |
| **J4** | Tag chips via Tag Manager APIs only | Charlie | India · Tango · Echo | J1 + **TM2** |
| **J5** | Interview on request, collapse bar, structured_json | Charlie · Echo | Tango · Hotel | J2 |
| **J6** | Paste uploads, private media, captions | Alpha · Mike · Charlie | Mike · Hotel | J1 |
| **J7** | Retrospective routing + gather/complete warnings | Alpha · Charlie | Tango · India | J1 + retro API |
| **J8** | Closure on complete, 409, open-session count in warning | Alpha | India · Mike · Delta | J7 |
| **J9** | Portability + export Spec bump | Alpha · India | Mike · Delta | J1+J6 |

```
TM0 ──► TM1 ──► TM2 ──────────────────────────────► J4
                 │
J0 ──► J1 ──► J2 ──► J3
         │      │
         │      └──► J5
         ├──► J6
         ├──► J7 ──► J8
         └──► J9
```

**Critical path (process integrity):** J0 → J1 → J2 → J8  
**Member-visible core:** J1 (chatbot) → J2 (agent)  
**Interview and tags are secondary:** J4, J5  

### 9.1 Keep vs kill (India audit at J0 — provisional)

| Likely **keep** (substrate) | Likely **kill / replace** (product) |
|-----------------------------|--------------------------------------|
| Message table + identity isolation | Form-default layout, tag scripts |
| Private media store pattern | Depth budgets, member seal product |
| Date closures + retro complete hook | Dual write paths, “manual” entry |
| Phase derivation core | Session-owned tag SoR columns |
| Export surface hooks | Local checklist presented as interlocutor |

**J1 UI is a rewrite**, not a CSS pass on JournalCalendar’s form stack.

---

## 10. Full bench roles (operating roster)

| Agent | Tag Manager | Journal Session v0.5 |
|-------|-------------|----------------------|
| **Coach** | Authorship, seed, GO | Process integrity bar, GO, persona, principals |
| **Juliet** | Board TM | Board J05; cross sequencing |
| **India** | Model, taxonomy, migration | Model, closure, phase, schema |
| **Mike** | Family B assignments, audit | Media, prompt authority, voice, principals |
| **Hotel** | Seed vocabulary | Guardrails, market, non-vision |
| **Tango** | Missing-word UX, no required tags | Copy, warnings, trial, migration reopen |
| **Echo** | Admin tag UI polish | Chatbot surface, interview bar |
| **Charlie** | Admin + pickers | Composer, thread, chips, interview |
| **Alpha** | Schema, APIs | Agent, calendar, portability, closure |
| **Sierra** | Categories vs tags, SEO | No journal leakage |
| **Kilo** | Characterization | Full suite |
| **Delta** | TM gates | J gates |
| **Lima** | DL + Spec parity | DL + Spec parity |
| **Foxtrot** | — | Only if deploy/config for calendar secrets |

---

## 11. Verification strategy (Delta / Kilo)

### Tag Manager

- Single vocabulary table; isolation on Family B assignments  
- Rename/merge/retire properties  
- No required tag on any create path  
- Agent context non-directive (prompt fixture tests)  
- Purge/export  

### Journal

- Empty day = composer only (no start button)  
- Interview absent until request  
- Member-first agent; RTH unprompted silence  
- Guardrail corpus blocked pre-render  
- Closure scope-true + warning names dates + open session count  
- Grep CI: no phase/status/§ in member HTML  
- Transcript-only entry valid  

---

## 12. Risks (ordered)

1. **Building Journal chips before Tag Manager** → reintroduces local vocabulary.  
2. **Treating v0.4a code as v0.5** → product frame rot.  
3. **Authorship undecided** → schema thrash.  
4. **Editable prompt without code guardrails** → process integrity failure.  
5. **Category/tag merge confusion** → SEO and hub damage.  
6. **Migration reopening sealed sessions** without member-facing honesty → trust break.  

---

## 13. Immediate next steps (recommended order)

1. **Coach** Phase 0: confirm greenfield + success criteria (process integrity).  
2. **Juliet** open both boards; schedule parallel review gates (this doc).  
3. **India** as-built keep/kill + migration map for Session; taxonomy decision with Sierra for tags.  
4. **Coach + Tango** authorship lock for Tag Manager.  
5. **Hotel** draft seed vocabulary.  
6. **Coach GO** TM then JS (or same day if both gates green).  
7. **Execute** TM1–TM2 then J1–J2 critical path.  

**No implementation coding until dual GO** unless Coach explicitly waives (not recommended).

---

## 14. Decision-log drafts (on dual GO)

> **Tag Manager v0.1 — platform lexicon.** One definition table, one polymorphic assignment table; assignments inherit object family; tags are context never gates; …  

> **Journal Session v0.5 — chatbot is the journal.** Conversation is the record; interview on request only; tags via Tag Manager; single seal on retro complete; … Supersedes v0.1–v0.4 and v0.2/v0.4a product frames.

---

## 15. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Initial evaluation + full bench plan for v0.5 + Tag Manager v0.1 |
