# Journal Session v0.6 — Residual Program Full Agent Bench Plan

**Date:** 2026-07-30  
**Board:** [`agents/p-journal-session-v06/`](../agents/p-journal-session-v06/)  
**Parent plan:** [`Journal-Session-v0.6-Full-Agent-Bench-Plan.md`](./Journal-Session-v0.6-Full-Agent-Bench-Plan.md)  
**Spec:** v0.6 **BUILD AUTHORITY** (DL-161 · mig 054)  
**Status:** Residual program after J0 GO + J1 PASS + surface spike

This plan covers **only what remains open**. Seated agents, gates, seeds, and verification for
closing the program to **JS6-9-G PASS**.

---

## 0. Mission (residual)

Close Journal Session v0.6 with formal evidence:

| Open | Intent |
|------|--------|
| **J2** | Agent integrity: guardrail corpus, RTH, member-first, tags-as-context-only fixtures |
| **J3** | Admin prompt version list / activate / create; sessions keep stamped id |
| **J1b–T1 residual gates** | Formal Delta PASS on already-landed surface (nav, day, week, media, tags, trades) |
| **J5** | Interview bar formal gate (landed) |
| **J7** | Retro complete warning uses dates + open session count (API exists; prove UI + tests) |
| **J8** | Scope-true closure characterization suite |
| **J9** | Export Spec honesty (journal_session one/date + tags + attachments); purge; program PASS |

**Already closed:** Tag Manager · J0 GO · J1 UNIQUE/merge · day/week/media/nav surface · export 1.1 attachments in code.

---

## 1. Full bench roster (residual)

| Callsign | Residual duty |
|----------|---------------|
| **Coach** | Residual ship bar; waive only with logged reason (none preferred) |
| **Juliet** | This board, seed order, status honesty |
| **India** | Export Spec bump; closure scope; Tag Manager boundary still holds |
| **Alpha** | Agent tests, prompt admin API, export/purge, closure tests |
| **Charlie** | Admin prompt UI; retro warning surface if missing; greps |
| **Echo** | Residual visual review if prompt admin UI added |
| **Mike** | Prompt authority (admin only); purge Family B |
| **Hotel** | Guardrail corpus content; RTH; R2R residual note |
| **Tango** | Copy on prompt admin + retro warnings |
| **Kilo** | All residual tests + greps |
| **Delta** | JS6-2-G … JS6-9-G |
| **Lima** | DL residual close; Spec as-built notes |
| **Sierra** | Confirm still no journal leakage |
| **Foxtrot** | Only if deploy needed after prompt admin |

Optional lineage: **Victor / Whiskey / Yankee** — not required for residual close.

---

## 2. Phase graph (residual only)

```
[J0 PASS · J1 PASS · surface LANDED]
        │
        ├──► R-G  residual surface gates (J1b, J1c, W1, J4, J5, J6, T1)  ── formal evidence
        │
        ├──► J2   agent corpus + fixtures ──► JS6-2-G
        │         │
        │         └──► J3 admin prompt UI ──► JS6-3-G
        │
        ├──► J7   retro warning evidence ──► JS6-7-G
        ├──► J8   closure suite ──► JS6-8-G
        │
        └──► J9   export Spec + purge + suite ──► JS6-9-G PASS · Lima
```

**Critical path residual:** `J2 → J8 → J9`  
**Parallel:** R-G surface gates · J3 · J7

---

## 3. Seed catalog (residual)

### R-G — Formal surface gates (landed code)

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| R-G-1b | Kilo · Echo | Calendar nav §1.7 greps + matrix | JS6-1b-G |
| R-G-1c | Kilo · Echo · Tango | Fixed thread, timestamps, ban-list greps | JS6-1c-G |
| R-G-W1 | Kilo | Week dots member-only; band scroll | JS6-W1-G |
| R-G-4 | Kilo · Mike | Tags list window; closed 409 | JS6-4-G |
| R-G-5 | Kilo | Interview bar default collapsed | JS6-5-G |
| R-G-6 | Kilo · Mike | Media header; no public URL; caption | JS6-6-G |
| R-G-T1 | Kilo · Hotel | Trades width/R:R/times; no expectancy | JS6-T1-G |

### J2 — Agent

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| J2-1 | Alpha · Hotel | Fixture: TM labels in context string only; no probe script change | JS6-2-G |
| J2-2 | Alpha · Kilo | Guardrail corpus cases (motive, advice, P&L, multi-Q, chart, brevity) | JS6-2-G |
| J2-3 | Alpha · Hotel | RTH silent without member text; member-first | JS6-2-G |
| J2-4 | Charlie | Model-down: plain message path | JS6-2-G |
| J2-5 | Kilo | Suite green | **JS6-2-G** |

### J3 — Prompt versions

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| J3-1 | Alpha · Mike | Admin API: list / create / activate versions | JS6-3-G |
| J3-2 | Charlie · Echo | Admin UI page under `/admin` | JS6-3-G |
| J3-3 | Kilo | New session stamps active; historical keep old id | **JS6-3-G** |

### J7 — Retro action

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| J7-1 | Kilo · Tango | closure-preview: dates + open_session_count in warning | JS6-7-G |
| J7-2 | Charlie | UI shows warning before complete if not already | JS6-7-G |
| J7-3 | Kilo | leave session open mid-retro | **JS6-7-G** |

### J8 — Closure

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| J8-1 | Alpha · Kilo | Complete closes prior dates; sessions closed; 409 new session | JS6-8-G |
| J8-2 | Kilo | Tags/messages refuse on closed | JS6-8-G |
| J8-3 | Delta | Evidence pack | **JS6-8-G** |

### J9 — Portability + program close

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| J9-1 | India · Lima | Export Spec **v1.2** (or v1.1 amendment): journal_session one/date, tags, attachments | JS6-9-G |
| J9-2 | Alpha · Mike | Purge includes sessions + assignments + media | JS6-9-G |
| J9-3 | Kilo | Full journal+tags+export suite + surface greps | JS6-9-G |
| J9-G | **Delta** | Program PASS | **JS6-9-G** |
| J9-L | **Lima** | DL close residual | close |

---

## 4. Verification commands

```bash
# Backend
cd server && .venv/bin/python -m pytest tests/test_journal_sessions.py tests/test_tags.py tests/test_retrospectives.py tests/test_member_export.py -q

# Surface greps (must stay clean)
rg -n "journal-new-entry|Entries this day|Interviewer|DayPanel" web/components/journal || true

# Build
cd web && npm run build
```

---

## 5. Definition of Done (residual → program)

1. All residual Delta gates **PASS** (or explicit Coach-logged residual with date).  
2. Admin can list/activate journal prompt versions; new sessions stamp active id.  
3. Guardrail corpus tests green; tags-as-context fixture green.  
4. Closure-preview warning names dates + open count; complete closes sessions.  
5. Export Spec documents journal_session v0.6 shape; purge complete.  
6. Suite green; board ORCHESTRATOR shows **PROGRAM COMPLETE**.

---

## 6. Immediate execution order

1. Write residual gate evidence for surface (R-G)  
2. J2 tests + JS6-2-G  
3. J3 admin API + UI + JS6-3-G  
4. J7–J8 tests + gates  
5. J9 Export Spec v1.2 + JS6-9-G + Lima  

---

## 7. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Residual plan after J0/J1 + surface land |
