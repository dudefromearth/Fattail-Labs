# Implementation Plan — p-journal-session

**Authority:** Spec **v0.2 BUILD AUTHORITY** — Coach **GO** 2026-07-30 · JS0-G PASS  
**Parents:** Journal Session Spec **v0.2** · Retrospective **v0.6** · Journey v1.0 ·  
Practice Export **v1.1** · Dual-Goal strategy (Observer 6-week term · full Navigator access)

---

## Dependency graph

```
J0  Spec GO + owner gates (Tango D3 · Mike/India D4 · India/Mike D5)
 │   Journey routine keying (D2) · Export Spec bump pointer
 ▼
J1  Schema + session/message CRUD (member text) · dual-read notes · calendar attach
 │
 ├──────────────────┐
 ▼                  ▼
J2  Structured form (no LLM)     J7  Retrospective tag routing (needs J1 API)
 │                  │
 ▼                  │
J3  Agent interview + validator + form fallback (optional Coach DEFER)
 │
 ▼
J4  Date closure on retro complete (hooks J1 + retro complete)
 │
 ├────────────┬────────────┐
 ▼            ▼            ▼
J5  Private   J6  Portability   J8  Demo is_demo / seed pack
    media         journal_session
 │
 ▼
J9  Lima as-built · Delta program close
```

**Ship constraint:** **J1–J2 deliver falsifiable value without LLM.** J3 does not block form journaling.

**Parallelism (Juliet only):**

| After | Parallel | Notes |
|-------|----------|--------|
| J1 | J2 (Charlie form) vs Alpha gather dual-read | Coordinate structured_json shape |
| J1 | J7 routing vs J2 form | Low if routes stable |
| J4 | J5 media vs J6 export | Low if storage contract exists |
| J3 | May DEFER to residual if P2/agent cost | Coach |

---

## Phase J0 — Spec lock + owner gates

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS0-1 | India | Coach | Spec v0.2 integrity; D1 tags; D2 routine keying; schema SoR; dual-read plan |
| JS0-2 | Tango | Hotel | **D3** image P&L collapse; Appendix B copy; no shame/lateness |
| JS0-3 | Mike | India | **D4** private media contract sketch; D7 agent service attribution; isolation |
| JS0-4 | India · Mike | Coach | **D5** `is_demo` placement + immutability |
| JS0-5 | Hotel | Tango | Tag scripts accuracy (pre_market invalidation; clean_day); depth D8=8 + prefill |
| JS0-6 | Sierra | Tango | No public journal/session SEO; demo excluded from marketing |
| JS0-G | Delta | — | Spec lock evidence; open residuals named |
| JS0-0 | Coach | — | **GO / NO-GO** on program; free no-plan already closed (no create) |

**Exit:** Coach **GO** · DL entry · board freeze · D3–D5 APPROVED or named DEFER residual.

**D6 already LOCKED:** Observer = Navigator features; term = 6 weeks only.

---

## Phase J1 — Schema + member text sessions

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS1-1 | Alpha | Mike · India | Migration: `member_journal_sessions`, `messages`, `date_closures` (media later); `export_key` |
| JS1-2 | Alpha | India | Domain + API: create/list/get/patch/seal/partial; multi entry/date; no reopen |
| JS1-3 | Alpha | India | Dual-read: gather + calendar still see `member_tool_notes`; map pre_market |
| JS1-4 | Charlie | Echo | Calendar: start session by tag; list entries for day; attach to day-book |
| JS1-5 | Kilo | Alpha · Mike | Isolation, multi-entry, seal 409 reopen, dual-read tests ×2 |
| JS1-G | Delta | — | Phase gate |

**Files (indicative):** `migrations/049_*.sql`, `server/journal_session_domain.py`,  
`server/routes/journal_sessions.py`, `web/components/journal/*`, gather path in  
`retrospective_domain.py`.

---

## Phase J2 — Structured form (no LLM)

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS2-1 | Alpha · India | Hotel | `structured_json` schema per tag; required checklist in code |
| JS2-2 | Charlie | Tango · Echo | Confirmation UI; prefill from trade log / prior plan; seal gate |
| JS2-3 | Kilo | Alpha | Required fields absent when skipped; confirm writes only; ×2 |
| JS2-G | Delta | — | Phase gate |

**Exit:** Member can produce falsifiable `pre_market` **without** agent.

---

## Phase J3 — Agent interview (optional path)

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS3-0 | Coach | — | GO/DEFER agent path (product-wide mode, not Observer lockout) |
| JS3-1 | Alpha · Mike | India · Tango · Hotel | Interview endpoint; system prompt constant Appendix A; depth ≤8 |
| JS3-2 | Alpha | Mike | Turn validator; **double-fail → J2 form** (not dead partial) |
| JS3-3 | Charlie | Tango | Chat UI; intraday silent receive; clean_day one turn |
| JS3-4 | Kilo | Alpha · Mike | Validator corpus; phase silence; form fallback; isolation ×2 |
| JS3-G | Delta | — | Phase gate (or BLOCKED → residual if DEFER) |

**Config:** e.g. `LABS_JOURNAL_AGENT_MODE=local|off` — fail loud when used while off.  
**Entitlement:** same as session create (Observer = Navigator).

---

## Phase J4 — Date closure

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS4-1 | Alpha | India · Mike | On retro **complete**: write closures for whole days &lt; gather date (NY) |
| JS4-2 | Alpha | Tango | 409 + reason + link; complete warning names dates (Appendix B) |
| JS4-3 | Charlie | Tango | UI closed-date state; backdate-into-closure copy |
| JS4-4 | Kilo | Alpha | Closure tests; gather-day stays open; ×2 |
| JS4-G | Delta | — | Phase gate |

---

## Phase J5 — Private media

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS5-1 | Mike · Foxtrot | India | Storage layout, auth, no public URL (D4 APPROVED required) |
| JS5-2 | Alpha | Mike | Attach API; caption required for machine layer; cap 5 |
| JS5-3 | Charlie | Tango · Echo | Paste primary; collapse behavior (D3) |
| JS5-4 | Kilo | Mike | No unauth read; purge deletes binaries; ×2 |
| JS5-G | Delta | — | Phase gate |

**May DEFER** if D4 not approved — residual only, no silent public media.

---

## Phase J6 — Portability

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS6-1 | Alpha | India | Export `fattail.labs.journal_session` in pack; dual export notes |
| JS6-2 | Alpha | Mike | Import additive; purge includes sessions (+ media if J5) |
| JS6-3 | Charlie | Tango | Profile pack still works; no new shame copy |
| JS6-4 | Kilo | Alpha | Round-trip; no overwrite sealed; ×2 |
| JS6-G | Delta | — | Phase gate |

---

## Phase J7 — Retrospective tag routing

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS7-1 | Alpha | India | Clean vs in-flight seal; dual links; no auto-gather; empty scope |
| JS7-2 | Charlie | Tango | Appendix B leave/gather/complete confirms |
| JS7-3 | Kilo | Alpha | Routing matrix verification § Spec; ×2 |
| JS7-G | Delta | — | Phase gate |

**Depends:** J1 session API + existing retro create/list.

---

## Phase J8 — Demo fixtures (optional)

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS8-1 | Alpha · Mike | India | `is_demo` if D5 APPROVED; wholesale reset |
| JS8-2 | Alpha | — | Extend `seed_practice_demo_pack.py` with sessions |
| JS8-G | Delta | — | Optional gate or fold into J9 |

---

## Phase J9 — Close

| ID | Primary | Reviewers | Deliverable |
|----|---------|-----------|-------------|
| JS9-1 | Lima · India | Coach | Spec as-built honesty; Arch docs; Export Spec version |
| JS9-G | Delta | — | Program PASS |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| P2 agent identity unratified | J1–J2 first; D7 service attribution; J3 Coach GO/DEFER |
| Validator destroys pre_market | Double-fail → J2 form (Spec §8.2) |
| Dual taxonomy drift | D1 tags only; dual-read notes until cutover |
| Routine meter gaming | D2 session_started_at |
| Observer treated as free | DL-128 · create + agent parity already code-fixed for retro agent |
| Private media leak | J5 blocked until D4 APPROVED |
| Scope creep (vision, reopen) | Non-goals in CHARTER |

---

## Test strategy (Kilo)

1. Isolation (A cannot read B sessions)  
2. Entitlement Observer/Navigator create; free no-plan 403  
3. Multi entry per date; no second session in sealed entry  
4. Structured confirm; absent fields not inferred  
5. Phase derivation; §6.5 pre_open-only (gather contract)  
6. Validator blocks + form fallback  
7. Closure 409; gather day open  
8. Export/import additive; purge  
9. Routing no auto-gather  

Every `server/` commit: suite green. New tests in same change as feature.

---

## Definition of Done (program)

See CHARTER. Exit only on **JS9-G PASS** + Spec describes as-built.
