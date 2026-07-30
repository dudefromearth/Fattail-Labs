# Implementation Plan — p-journal-session-v05

**Authority:** Journal Session Spec **v0.5** — DRAFT until JS5-R0 Coach GO  
**Evaluation:** `docs/Journal-Session-v0.5-and-Tag-Manager-v0.1-Evaluation-and-Plan.md`  
**Depends on:** Tag Manager program **first** (`docs/Tag-Manager-Implementation-Plan.md`).  
**J1+ blocked until TM7-G** (or Coach waiver after TM3-G).

---

## Dependency graph

```
p-tag-manager TM0…TM7 PASS ────────────────────────┐
                                                   ▼
J0 (Spec review may parallel TM) ──► J1 ──► J2 ──► J3
                                      │      │
                                      │      └──► J5 interview
                                      ├──► J4 TagPicker (uses finished TM APIs)
                                      ├──► J6 uploads
                                      ├──► J7 ──► J8 closure
                                      └──► J9 portability
```

**Critical path:** Tag Manager complete → J0 GO → J1 → J2 → J8  
**Member value:** J1 chatbot → J2 agent  

---

## Phase J0 — Spec GO + greenfield freeze

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J0-1 | India | Coach | Spec integrity; keep/kill of substrate; migration map |
| J0-2 | Mike | India | Family B, media, prompt authority, principals interim |
| J0-3 | Hotel | Tango | Guardrails, phase, non-vision |
| J0-4 | Tango | Echo | Copy bar; no internal vocab; migration reopen honesty |
| J0-5 | Echo | Tango | Composer-first layout; interview bar |
| J0-6 | Sierra | — | No marketing leakage |
| J0-X | India · Juliet | — | Cross-contract with Tag Manager (no smart tags) |
| J0-G | Delta | — | Spec lock evidence |
| J0-0 | Coach | — | **GO** + §17 locks |

---

## Phase J1 — Chat surface + schema

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J1-1 | Alpha | India | Schema: open\|closed, prompt_version_id; kill product seal; drop tag SoR |
| J1-2 | Alpha | India | Market calendar config fail-loud |
| J1-3 | Charlie · Echo | Tango | **Rewrite** day UI: calendar, date, composer, thread, trades — no start button |
| J1-4 | Alpha | India | Create session on first send (or empty open) per Spec verification |
| J1-5 | Kilo | Alpha · Mike | Surface + multi-entry + phase tests |

**Exit:** Empty day = composer only; message creates record.

---

## Phase J2 — Agent (process integrity core)

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J2-1 | Alpha · Mike | Hotel · Tango | Context: trade log + Journey profile; never recite meters |
| J2-2 | Alpha | Mike | Code guardrails pre-render; once-only absences; member-first |
| J2-3 | Alpha | Hotel | RTH: no unprompted questions; answer if asked |
| J2-4 | Charlie | Tango · Echo | Unreachable agent: composer unchanged, captures still |
| J2-5 | Kilo | Alpha · Hotel | Guardrail corpus + once-only + RTH |

---

## Phase J3 — Admin prompt

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J3-1 | Alpha | Mike · Tango | Versioned prompt store; session stamp |
| J3-2 | Charlie | Echo | Admin edit UI; audit |
| J3-3 | Kilo | Alpha | Version immutability of past sessions |

---

## Phase J4 — Tags (Tag Manager)

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J4-1 | Charlie | India · Tango · Echo | Chips from Tag Manager vocabulary |
| J4-2 | Alpha | Mike | Agent context: tags as description only |
| J4-3 | Kilo | Alpha | Tag never opens interview / never required |

**Blocked until TM2 PASS.**

---

## Phase J5 — Interview on request

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J5-1 | Charlie · Echo | Tango · Hotel | Invoke → panel; collapse bar; confirmed fields persist |
| J5-2 | Alpha | India | structured_json only on confirm; absent otherwise |
| J5-3 | Kilo | Alpha | Never open on load; abandon free |

---

## Phase J6 — Uploads

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J6-1 | Mike · Alpha | India | Private media; paste primary |
| J6-2 | Charlie | Hotel · Tango | In-chat attach + caption; no vision |
| J6-3 | Kilo | Mike | Isolation, purge, export |

---

## Phase J7 — Retrospective routing

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J7-1 | Alpha · Charlie | India · Tango | Route; leave open; dual link; no auto-gather |
| J7-2 | Charlie | Tango | Gather + complete warning copy (dates + open count) |

---

## Phase J8 — Closure

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J8-1 | Alpha | India · Mike | Scope-true close; sessions closed; 409 + link |
| J8-2 | Kilo | Alpha · Delta | Permanent; is_demo; gather date open |

---

## Phase J9 — Portability

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| J9-1 | Alpha · India | Mike | Export Spec bump; additive import; purge |
| J9-G | Delta | — | Program gate |
| J9-L | Lima | — | DL + as-built Spec honesty |

---

## Residuals (non-blocking unless GO says otherwise)

Voice · persona name · Journey cadence meter amendment · full P2 agent principals.
