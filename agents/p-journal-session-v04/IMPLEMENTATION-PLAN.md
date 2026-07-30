# Implementation Plan — p-journal-session-v04

**Authority:** Spec **v0.4a** — DRAFT until J0 Coach GO  
**Parents:** Journal Session Spec **v0.4a** · Retrospective **v0.6** / **v0.5** · Journey v1.0 ·  
Practice Export **v1.1** · Dual-Goal strategy  

**Relation to v0.2 program:** Substrate reuse only. Product order is **inverted**  
(chat + agent contract before structured pass).

---

## Dependency graph

```
J0  Spec GO + §20 locks (closure scope-true · agent mode · entitlement · migration)
 │   New board freeze · DL §23 · supersede v0.2 product authority
 ▼
J1  Status/tag migration · chat-primary shell · market calendar config · dual-read
 │
 ├────────────────┬────────────────┐
 ▼                ▼                ▼
J2a Agent contract   J3 Tags +        J6 Retro tag routing
    (mode, validator,   quick-confirm,    (leave open, no
     plain-text, RTH,   Start conversation) auto-gather)
     once-only)
 │                │
 ▼                │
J2b LLM path      │
 │                │
 ├────────────────┤
 ▼                ▼
J4 Optional structured pass (member-invoked)
 │
 ▼
J5 Media paste polish (parallel after J1 media contract confirmed)
 │
 ▼
J7 Single seal (scope-true) + complete warning + 409
 │
 ├────────────┐
 ▼            ▼
J8 Portability   J9 Journey routine + as-built honesty + program close
```

**Critical path:** J0 → J1 → J2a → J7.  
**Member-visible value:** J1 chat shell → J2b LLM.  
**Ship constraint:** J2a is testable without a model; J2b needs credentials. Do not ship  
`local` as product default (§7.0).

**Parallelism (Juliet only):**

| After | Parallel | Notes |
|-------|----------|--------|
| J1 | J2a vs J3 vs J6 | Coordinate session API shape; no tag scripts |
| J2a | J4 vs J2b | J4 needs invoke API; J2b needs provider |
| J1 | J5 media polish | If store already PASS from v0.2 |
| J7 | J8 export | Status/tags stable |

---

## Phase J0 — Spec GO + locks

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS0-1 | India | Coach | Spec v0.4a integrity; parent cites verified; §3 as-built honesty; schema SoR |
| JS0-2 | India · Coach | — | **§20.9 LOCK** scope-true closure (§12.1) — or explicit alternate |
| JS0-3 | Coach | Mike | **§20.11** agent default (`llm` product; `local` test-only); interim OK |
| JS0-4 | Coach · Mike | India | **§20.10** planless/lapsed access (Identity owns; Journal no tier check) |
| JS0-5 | India · Tango | Coach | **§3.1 / §6.3** migration map; partial→open announcement (Tango) |
| JS0-6 | India | Coach | Existing date_closures: grandfather (never reopen closed dates) |
| JS0-7 | Mike | Coach | **§20.6** agent_service + member session ACL interim exception DL |
| JS0-8 | Tango · Hotel | Coach | §10 prompt constant + §13 warning tone |
| JS0-9 | Lima | — | Pre-GO: banner on v0.2 board; this board live |
| JS0-G | Delta | — | Spec lock evidence; residuals named |
| JS0-0 | Coach | — | **GO / NO-GO** · DL from Spec §23 (title **v0.4a**) |

**Exit:** Coach **GO** · Spec BUILD AUTHORITY (or residual list with owners) · board freeze.

**Recommended locks (evaluation defaults):**

| Item | Lock |
|------|------|
| Closure | Scope-true (§12.1) |
| Agent product mode | `llm` when configured; fail loud otherwise |
| `local` | Tests / offline only — not product default |
| Free/planless create | No Journal create (Practice parity) unless Identity says no such state |
| Migration | partial→open; sealed→closed iff retro covers date else open |
| Closures | Never recompute open a previously closed date |

---

## Phase J1 — Model + chat shell

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS1-1 | Alpha | India · Mike | Migration: status open\|closed; drop product seal; tags join table; absence_keys_raised_json; closed_* denorm; backfill map §6.3 |
| JS1-2 | Alpha | India | Domain/API: create without required tag; append member message while open; deprecate member seal |
| JS1-3 | Alpha | India | Market calendar **config** fail-loud; wire `derive_phase` |
| JS1-4 | Charlie | Echo · Tango | Day UI: **Start conversation**; chat transcript primary; tags optional labels |
| JS1-5 | Alpha | India | Dual-read notes unchanged until Lima cutover |
| JS1-6 | Kilo | Alpha · Mike | Multi-entry, later reopen, phase, isolation, closed 409 ×2 |
| JS1-G | Delta | — | Phase gate — Spec §19 J1 |

**Indicative files:** `migrations/05x_*.sql`, `server/journal_session_domain.py`,  
`server/routes/journal_sessions.py`, `web/components/journal/*`, calendar config module.

---

## Phase J2a — Agent contract (no product LLM required)

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS2a-1 | Alpha · Mike | India | `LABS_JOURNAL_AGENT_MODE=llm\|local\|off`; fail loud; primacy preserved |
| JS2a-2 | Alpha | Mike | Validator before render; double-fail → **plain text** (session open) |
| JS2a-3 | Alpha | Hotel · Tango | Once-only absence keys code-enforced; no depth budget |
| JS2a-4 | Alpha | Tango | RTH: no unprompted agent turn without member message that exchange |
| JS2a-5 | Alpha | Mike | `local` = absence probes only — not fake interlocutor |
| JS2a-6 | Charlie | Tango · Echo | Chat always shows composer when open; agent off still allows text |
| JS2a-7 | Kilo | Alpha · Mike | §19 J2a corpus ×2 |
| JS2a-G | Delta | — | Phase gate |

---

## Phase J2b — LLM path

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS2b-1 | Alpha · Mike | Coach | Provider binding (operational); credentials fail loud |
| JS2b-2 | Alpha | Hotel · Tango | §10 constant `JOURNAL_SESSION_SYSTEM_PROMPT_V1`; trade-log + profile inject |
| JS2b-3 | Alpha | Mike | D7 attribution `agent_service`; no client author escalation |
| JS2b-4 | Charlie | Echo | Streaming optional later; v1 request/response OK |
| JS2b-5 | Kilo | Alpha | Happy path + validator reject + isolation |
| JS2b-G | Delta | — | Phase gate |

---

## Phase J3 — Tags + quick-confirm

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS3-1 | Alpha | India | Multi-tag API; empty tags valid |
| JS3-2 | Charlie | Echo · Tango | Optional tag UI; quick-confirm affordance (UI member assertion) |
| JS3-3 | Kilo | Alpha | No-tag gathers; tag change no phase effect |
| JS3-G | Delta | — | Phase gate |

---

## Phase J4 — Optional structured pass

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS4-1 | Alpha | India · Hotel | Invoke-only structured pass; confirm writes `structured_json` |
| JS4-2 | Charlie | Tango · Echo | Member-invoked UI; abandon free; no completeness gate |
| JS4-3 | Kilo | Alpha | NULL structured valid; no agent-filled fields |
| JS4-G | Delta | — | Phase gate |

---

## Phase J5 — Media polish

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS5-1 | Mike · Alpha | India | Confirm private store; closed-date refuse attach |
| JS5-2 | Charlie | Echo · Tango | Paste-primary; caption as assertion; collapse inheritance residual OK |
| JS5-3 | Kilo | Mike | Isolation, purge, no public URL |
| JS5-G | Delta | — | Phase gate |

---

## Phase J6 — Retrospective routing

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS6-1 | Alpha · Charlie | India · Tango | `retrospective` tag: route only / leave open / dual link / no body_md paste |
| JS6-2 | Alpha | India | No auto-gather; empty scope explain |
| JS6-3 | Kilo | Alpha | §19 J6 assertions |
| JS6-G | Delta | — | Phase gate |

---

## Phase J7 — Single seal + complete warning

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS7-1 | Alpha | India | On retro complete: write closures for **scope-true** set; close sessions same txn |
| JS7-2 | Charlie | Tango | Complete warning: named range, open-session count, unstructured note |
| JS7-3 | Alpha | Mike | 409 + reason + retro link; permanent; is_demo |
| JS7-4 | Kilo | Alpha · India | Scope-true vs gather-simple regression; never reopen closed |
| JS7-G | Delta | — | Phase gate |

**Note:** §19 J7 text still says “before gather date” in one line — implementation follows  
**§12.1 scope-true** as SoR after GO lock; fix Spec wording if residual.

---

## Phase J8 — Portability

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS8-1 | Alpha · India | — | Export Spec bump: multi-tag, open\|closed, messages |
| JS8-2 | Alpha | Mike | Additive import; purge sessions+media |
| JS8-3 | Kilo | Alpha | Isolation; sealed never rewritten |
| JS8-G | Delta | — | Phase gate |

---

## Phase J9 — Journey + close

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS9-1 | Alpha | India · Tango | Routine meter `session_started_at` NY day; DL vs Journey v1.0 |
| JS9-2 | Lima | India | Spec as-built honesty; DL complete; dual-read cutover plan |
| JS9-3 | Kilo | Alpha | Full suite green |
| JS9-G | Delta | — | **Program gate** |

---

## Residuals (explicit non-blockers unless GO says otherwise)

| Residual | Owner |
|----------|-------|
| Image P&L collapse in retro render (§20.2) | Tango |
| Cadence-period adherence Journey amendment (§20.12) | Coach · India · Tango |
| P2 agent principals (post interim) | Mike · Coach |
| Full session import rehydrate polish | Alpha |

---

## Change control

Seeds declare **exact files + changes** before touch. Implementer may not expand scope.  
Evidence: command output, curl, or browser walkthrough — “it should work” banned.  
