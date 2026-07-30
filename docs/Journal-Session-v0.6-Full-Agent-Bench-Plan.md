# Journal Session Spec v0.6 — Full Agent Bench Plan

**Date:** 2026-07-30  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-journal-session-v06/`](../agents/p-journal-session-v06/)  
**Spec:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md) (**DRAFT** until Coach GO)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`first-principles-doctrine.md`](../agents/bench/first-principles-doctrine.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

This is the **program plan for the full FatTail Labs Agent Bench**: every callsign, every phase,
every seed, every gate, verification evidence, and honest **as-built vs remaining** status after the
v0.6 surface spike.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates are **PASS / FAIL / BLOCKED** with evidence — never waived.

---

## 0. Mission

Ship **Journal Session v0.6** as the process-integrity journal for Practice:

| Law | Spec |
|-----|------|
| Chatbot **is** the journal | §1 |
| **One conversation per date** · `UNIQUE (identity_id, journal_date)` | §3 |
| **No** entry list / New entry / Refresh / Open button | §1.1 · §1.3 · §1.7 |
| Fixed-height **scrollable session**; page does not grow | §1.4 |
| Timestamps always visible; agent name ≠ “Interviewer” | §1.4 · §1.3 |
| Session header: tags + **image thumbnails** (drop / click / paste / lightbox caption) | §1.4 · §10 |
| Trades strip: **width · R:R · entry/exit** (no win-rate / expectancy / aggregate P&L) | §1.5 |
| Week **activity map**: member-message dots; band → day + scroll | §1.6 |
| Calendar **cell is the control** (Year→Month, Month→Day) | §1.7 |
| Tag Manager assign-only; labels = agent context only | §5 |
| Interview on request → bar | §1.2 |
| Retro action (not a tag); one seal = retro complete, scope-true | §6 · §7 |
| Agent: member-first, RTH quiet, code guardrails, model-down still captures | §8 · §9 |
| Family B; export/purge tags + media | §10 · §12 |

**Out of program:** Tag Manager CRUD (already shipped); course catalog SEO; MSC code import; profit claims.

---

## 1. Full bench roster (this program)

### 1.1 Authority & orchestration

| Callsign | Role on v0.6 | Authority |
|----------|--------------|-----------|
| **Coach** | Product frame, §17 locks, GO, ship/no-ship, arbiter on gates | Final |
| **Juliet** | Spec decomposition, board, seeds, phase order, status honesty | Plans only — **never executes packets** |
| **India** | Domain model, UNIQUE/merge, Tag Manager boundary, Trade Log contract, closure scope | Architecture **veto** |

### 1.2 Platform execution

| Callsign | Role on v0.6 |
|----------|--------------|
| **Alpha** | FastAPI, migrations, get-or-create, week-activity, media APIs, agent domain, export/purge |
| **Charlie** | Next.js Journal calendar, day surface, week map, trades strip, tags/interview UI |
| **Echo** | Layout criteria: fixed thread, header hierarchy, cell hit targets, no chrome wall |
| **Mike** | Family B media, closed-date refuse, caption as assertion, prompt authority, secrets |
| **Foxtrot** | Env/calendar config on MiniTwo/DudeTwo only if deploy path changes; launchd honesty |
| **Sierra** | No journal leakage into SEO/AEO/marketing; tags ≠ course taxonomy |

### 1.3 Quality, member, trading

| Callsign | Role on v0.6 |
|----------|--------------|
| **Delta** | Formal gates with evidence; ternary verdicts |
| **Kilo** | Characterization tests, greps, layout/scroll evidence, suite green |
| **Lima** | Decision log, Spec status BUILD/as-built, docs parity |
| **Tango** | Copy ban list, capacity, honest retro warnings, no surface-explaining paragraphs |
| **Hotel** | Band rules, phase honesty, R2R correctness for defined-risk, guardrail content |

### 1.4 Lineage channels (review only — no packets unless Coach pulls them)

| Callsign | When |
|----------|------|
| **Victor** | Optional: antifragility / via negativa on “one seal / absence once-only” |
| **Whiskey** | Optional: capital-preservation framing on trades strip (no P&L theater) |
| **Yankee** | Optional: fat-tail honesty — no Gaussian expectancy framing |

### 1.5 Not seated on this board

| Callsign | Why |
|----------|-----|
| **Golf** | Ask Vexy — P3 |
| **Quebec / Bravo / November / Romeo / Papa** | Content studio — not Journal runtime |

---

## 2. Sacred invariants (all seeds)

1. **Standalone repo** — no MarketSwarm-Canonical imports.  
2. **Config fail-loud** — market calendar missing fails; no silent bad phase.  
3. **Family B** — sessions, messages, attachments, tag assignments per owner.  
4. **Tag Manager SoR** — assign-only; agent gets **labels as description**, never scripts.  
5. **One conversation per date** — no multi-entry product chrome.  
6. **Member-only quotes** for downstream intent / expected-vs-actual.  
7. **No profit claims** — process outcomes only; no win-rate / expectancy on Journal UI.  
8. **Evidence over assertion** — “it should work” is banned.  
9. **Change control** — declare exact files before touch.  
10. **No waived Delta gates.**  
11. **Documentation parity** — Spec + DL + architecture updates same body of work as ship.

---

## 3. As-built status (honest — 2026-07-30)

### 3.1 Landed (substrate / spike — not program-complete)

| Spec item | Status | Evidence path |
|-----------|--------|---------------|
| One conversation / date (API get-or-create) | **LANDED** | `journal_session_domain.create_session` |
| No multi-entry UI chrome | **LANDED** | `JournalCalendar` DayView |
| Fixed-height thread + pinned composer | **LANDED** | `SessionInterviewChat` |
| Visible timestamps + agent name “Journal” | **LANDED** | `formatMessageTimestamp` |
| Header media thumbs / drop / click / lightbox caption | **LANDED** | `SessionMediaHeader` + caption PATCH |
| Trades width / R:R / entry-exit (client structural) | **LANDED** | `DayTradesPanel` |
| Week dots + band → scroll | **LANDED** | `week-activity` API + WeekView |
| Month→Day, Year→Month, no Open panel | **LANDED** | `JournalCalendar` |
| Tags compact list window | **LANDED** | `JournalTagsControl` |
| Closed session tag 409 | **LANDED** | `routes/tags.py` |
| Interview collapse bar | **LANDED** | day view bar |
| Agent TM labels in LLM context | **PARTIAL** | `_llm_turn` |
| Member-first / model-down capture | **PARTIAL** | chat UI |
| Tag Manager program | **COMPLETE** | TM7-G · DL-159 |

### 3.2 Not done (program remaining)

| Item | Gap |
|------|-----|
| **J0 GO** | Spec still **DRAFT**; no formal BUILD AUTHORITY / DL for v0.6 |
| **UNIQUE index + merge migration** | Get-or-create only; multi-row legacy dates may still exist in DB |
| Market calendar fail-loud completeness | Interim band rules; Hotel lock §17-12 |
| Admin **prompt_version_id** store + stamp | J3 |
| Full guardrail corpus + RTH tests | J2-G |
| Trade Log **SoR R2R** field (§17-4b) | Client heuristic only |
| Retro complete warning polish | J7 |
| Scope-true closure audit | J8 |
| Export Spec bump + purge completeness | J9 |
| Formal Delta gates + greps CI | All G gates |
| Spec hygiene | §18 still says v0.5; duplicate §1.4 paragraph; history row |

**Doctrine note:** Surface spike ran ahead of formal GO. **Coach must either (a) GO v0.6 and ratify spike as J1/J1b/J1c/W1/J6/T1 partial, or (b) order freeze until J0.** Recommended: **ratify + complete formal gates.**

---

## 4. Phase graph

```
Tag Manager COMPLETE (TM7-G)
         │
         ▼
        J0   Spec hygiene · full-bench review · Coach GO · DL
         │
         ▼
        J1   UNIQUE + merge migration · harden get-or-create · band/calendar config
         │
    ┌────┼────┬────────┬────────┐
    ▼    ▼    ▼        ▼        ▼
  J1b  J1c   J6*     T1*      J4*
  nav  day   media   trades   tags
  §1.7 §1.1  §1.4    §1.5     §5
    │    │
    └─┬──┘
      ▼
     W1*  Week map formal gate §1.6
      │
      ▼
     J2   Agent integrity (guardrails · RTH · once-only · labels-only fixture)
      ├── J3  Admin prompt versions
      ├── J5  Interview bar formal
      ▼
     J7   Retro action + warnings
      ▼
     J8   Scope-true closure
      ▼
     J9   Portability · suite · Delta program PASS · Lima DL

* = substantial UI already spiked; phase = harden + Delta gate + residual fixes
```

**Critical path:** `J0 → J1 → J2 → J8 → J9`  
**Calendar path:** `J0 → J1 → J1b → W1`  
**Surface path:** `J0 → J1c · J6 · T1` (gates after ratify)

---

## 5. Definition of Done (program)

1. Spec **BUILD AUTHORITY**; DL entry for v0.6; board GO.  
2. DB `UNIQUE (identity_id, journal_date)` after safe merge; zero content drop.  
3. Grep/DOM: no entries list, New entry, Refresh, Open day button, “Interviewer”, ban-list explainers.  
4. Fixed thread: page height stable 1 vs 40 messages; composer pinned; scroll stick-up.  
5. Timestamps always rendered; agent display name locked.  
6. Header media: thumbs, drop, click, paste, lightbox caption; closed read-only; no public URL.  
7. Trades: width, R:R (Trade Log or approved heuristic), entry/exit; no expectancy.  
8. Week: member-only dots; band deep-link; half-day CL from calendar.  
9. Calendar nav matrix §1.7 keyboard + empty cells.  
10. Tags TM-only; closed 409; agent labels context-only fixture.  
11. Interview never on load; tags never open interview.  
12. Agent: member-first, RTH, once-only, code guardrails green.  
13. Prompt versions stamped.  
14. Retro action; complete warning names dates + open count.  
15. Closure scope-true; 409 + link.  
16. Export/purge tags+media; suite green; JS6-9-G PASS.

---

## 6. Seed catalog (full bench)

Every seed is cold-start capable: project · agent · depends · intent · files · invariants · completion · gate.

---

### PHASE J0 — Spec GO + freeze (full bench review)

| Seed | Agent | Intent | Completion | Gate |
|------|-------|--------|------------|------|
| **J0-H** | Juliet | Spec hygiene PR: status, §18 v0.6 DL draft, history, dedupe §1.4, restore compact-tags sentence | Spec file clean | pre-R0 |
| **J0-1** | **India** | UNIQUE model, merge algorithm (no content drop), Tag Manager boundary, Trade Log R2R dependency honesty | APPROVED/RETURNED written | JS6-R1 |
| **J0-2** | **Mike** | Family B header media, caption assertion, closed refuse, no public thumbs, prompt authority | APPROVED/RETURNED | JS6-R2 |
| **J0-3** | **Hotel** | §17-12 band interim, R2R correctness criteria, phase for retro E-vs-A, guardrail list | Recommendations for Coach | JS6-R3 |
| **J0-4** | **Tango** | Copy ban list; agent name; capacity of one-conversation; retro warning honesty | Ban list + APPROVED | JS6-R4 |
| **J0-5** | **Echo** | Layout acceptance: fixed thread, header, cells, tags compact, no Open | Measurable checklist | JS6-R5 |
| **J0-6** | **Sierra** | No SEO/marketing leakage; tags ≠ course taxonomy | APPROVED | JS6-R6 |
| **J0-7** | **Victor** *(opt)* | Via negativa: one seal / once-only absences | Note or skip | — |
| **J0-8** | **Whiskey** *(opt)* | Trades strip is process not P&L theater | Note or skip | — |
| **J0-9** | Juliet | Board freeze; mark v05 substrate; seed index complete | ORCHESTRATOR accurate | pre-G |
| **J0-G** | **Delta** | Spec-lock evidence for GO | `JS6-0-G` PASS | **JS6-0-G** |
| **J0-0** | **Coach** | **BUILD AUTHORITY**; lock §17-11/12/4b/5; ratify surface spike | Spec BUILD · DL · board GO | **JS6-R0** |
| **J0-L** | **Lima** | DL-xxx v0.6 GO entry | Decision log | same day |

**Recommended Coach locks at GO**

| §17 | Lock |
|-----|------|
| **11** | Remove DayPanel / Open — **already spiked; ratify** |
| **12** | Midpoint AM/PM; later_day → CL; non-session days interim quarters (as in domain) |
| **4b** | Client structural R:R until Trade Log exposes; never invent expectancy |
| **5** | Agent display name **"Journal"** until persona GO |

**J0 exit:** BUILD AUTHORITY · DL · J1+ unblocked.

---

### PHASE J1 — Schema UNIQUE + merge + calendar bands

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **J1-1** | Alpha | India | Merge multi-session dates; re-point messages/attachments/tags; collision report; `UNIQUE` | `migrations/054_*.sql`, domain | JS6-1-G |
| **J1-2** | Alpha | India | Harden get-or-create; closed 409; list ≤1 | domain, routes, tests | JS6-1-G |
| **J1-3** | Alpha | Hotel | Market calendar + `session_band` fail-loud; half-day CL | domain calendar | JS6-1-G |
| **J1-4** | Kilo | Alpha | Isolation, unique, merge fidelity, closed 409 | tests | **JS6-1-G** |

---

### PHASE J1b — Calendar navigation §1.7

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J1b-1** | Charlie | Echo | Year→Month, Month→Day, Week header→Day; full hit target; keyboard | JS6-1b-G |
| **J1b-2** | Charlie | Echo | Confirm DayPanel/Open gone; empty cells navigate | JS6-1b-G |
| **J1b-3** | Kilo | Echo | Grep/DOM + keyboard smoke | **JS6-1b-G** |

*Spike status: largely done — gate = residual + evidence.*

---

### PHASE J1c — Day surface §1.1–1.4

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J1c-1** | Charlie | Echo | One session auto-load; no list/New/Refresh | JS6-1c-G |
| **J1c-2** | Charlie | Echo | Fixed session viewport; scroll rules §1.4 | JS6-1c-G |
| **J1c-3** | Charlie | Tango | Timestamps; agent name; `data-message-id` | JS6-1c-G |
| **J1c-4** | Charlie | Tango | Ban-list greps clean | JS6-1c-G |
| **J1c-5** | Kilo | Echo | 1 vs 40 height; stick-up; reopen latest | **JS6-1c-G** |

---

### PHASE W1 — Week activity map §1.6

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **W1-1** | Alpha | Hotel | week-activity API member-only; half-day | JS6-W1-G |
| **W1-2** | Charlie | Echo | Dots UI; band → scrollToMessage | JS6-W1-G |
| **W1-3** | Kilo | — | Agent turns no dots; empty band → day top | **JS6-W1-G** |

---

### PHASE J2 — Agent §8–9

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J2-1** | Alpha | Mike · Hotel | Context: trade log + journey calibrate + **TM labels only** | JS6-2-G |
| **J2-2** | Alpha | Hotel | Code guardrails pre-render; once-only absences | JS6-2-G |
| **J2-3** | Alpha | Hotel | RTH silent unless asked; member always first | JS6-2-G |
| **J2-4** | Charlie | Tango | Model down: composer unchanged; no mode label | JS6-2-G |
| **J2-5** | Kilo | Hotel | Guardrail corpus + RTH + once-only suite | **JS6-2-G** |

---

### PHASE J3 — Admin prompt versions

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J3-1** | Alpha | Mike · Tango | Version store; `prompt_version_id` stamp | JS6-3-G |
| **J3-2** | Charlie | Echo | Admin UI + audit trail | JS6-3-G |
| **J3-3** | Kilo | Alpha | Historical sessions keep prior version | **JS6-3-G** |

---

### PHASE J4 — Tags (Tag Manager consumer) §5

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J4-1** | Charlie | Echo · Tango | Compact control + list window (no chip wall) | JS6-4-G |
| **J4-2** | Charlie | Echo | Closed: read-only summary | JS6-4-G |
| **J4-3** | Alpha | India | Closed refuse 409 (regression) | JS6-4-G |
| **J4-4** | Alpha | Hotel | Agent labels-only fixture (no behavior gate) | JS6-4-G |
| **J4-5** | Kilo | Mike · Echo | Isolation; retired not assignable; layout | **JS6-4-G** |

---

### PHASE J5 — Interview bar §1.2

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J5-1** | Charlie | Echo · Tango | Default collapsed; expand on request | JS6-5-G |
| **J5-2** | Alpha | India | structured_json only on confirm | JS6-5-G |
| **J5-3** | Kilo | Alpha | Never on load; tags don’t open interview | **JS6-5-G** |

---

### PHASE J6 — Header media §1.4 · §10

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J6-1** | Mike · Alpha | India | Private store; cap; no public URL; closed write refuse | JS6-6-G |
| **J6-2** | Charlie | Echo | Header strip: thumbs, drop, click, paste | JS6-6-G |
| **J6-3** | Charlie | Echo · Hotel | Lightbox nav + caption (agent never interprets image) | JS6-6-G |
| **J6-4** | Kilo | Mike | Whole multi-drop refuse with count; export/purge hooks | **JS6-6-G** |

---

### PHASE T1 — Trades strip §1.5

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **T1-1** | Alpha · India | Hotel | Trade Log expose width + R2R when ready; document interim | JS6-T1-G |
| **T1-2** | Charlie | Echo | Display width, R:R, entry/exit; no P&L aggregates | JS6-T1-G |
| **T1-3** | Hotel | — | R2R correctness for defined-risk spreads | JS6-T1-G |
| **T1-4** | Kilo | Hotel | Grep: no win rate / expectancy on strip | **JS6-T1-G** |

---

### PHASE J7 — Retrospective action §6

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J7-1** | Alpha · Charlie | India · Tango | Dedicated control; leave open; dual link | JS6-7-G |
| **J7-2** | Charlie | Tango | Gather + complete: dates named + open session count | JS6-7-G |
| **J7-3** | Kilo | Alpha | No auto-gather; leave open | **JS6-7-G** |

---

### PHASE J8 — Closure §7

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J8-1** | Alpha | India · Mike | Scope-true close; refuse msgs/tags/media/structure | JS6-8-G |
| **J8-2** | Charlie | Tango | Complete warning honesty | JS6-8-G |
| **J8-3** | Kilo | Delta | 409 + link; permanent; is_demo | **JS6-8-G** |

---

### PHASE J9 — Portability + program close §12

| Seed | Agent | Reviewer | Intent | Gate |
|------|-------|----------|--------|------|
| **J9-1** | Alpha · India | Mike | Export Spec bump: one session/date, tags, media | JS6-9-G |
| **J9-2** | Alpha | Mike | Purge sessions + assignments + media | JS6-9-G |
| **J9-3** | Kilo | Alpha | Full suite + surface greps | JS6-9-G |
| **J9-G** | **Delta** | — | **Program PASS** evidence pack | **JS6-9-G** |
| **J9-L** | **Lima** | — | DL final; Spec as-built honesty | close |
| **J9-F** | Foxtrot | — | Prod/stage deploy only if config/host changes | as needed |

---

## 7. Gate schedule (Delta)

| Gate | After | Evidence focus |
|------|-------|----------------|
| **JS6-0-G** | J0 reviews | Spec ready / BUILD after Coach |
| **JS6-1-G** | J1 | UNIQUE, merge, get-or-create, bands |
| **JS6-1b-G** | J1b | Nav matrix; no Open |
| **JS6-1c-G** | J1c | Fixed thread; one session; copy |
| **JS6-W1-G** | W1 | Dots + scroll |
| **JS6-2-G** | J2 | Guardrails, RTH, member-first |
| **JS6-3-G** | J3 | Version stamp |
| **JS6-4-G** | J4 | TM compliance UI |
| **JS6-5-G** | J5 | Interview bar |
| **JS6-6-G** | J6 | Media Family B |
| **JS6-T1-G** | T1 | Trades strip honesty |
| **JS6-7-G** | J7 | Retro action |
| **JS6-8-G** | J8 | Closure |
| **JS6-9-G** | J9 | **Program PASS** |

Reports: `agents/p-journal-session-v06/gate-reports/JS6-*-*.md`

---

## 8. Verification matrix (Kilo + Delta)

| Area | Commands / proof |
|------|------------------|
| Unique session | pytest create twice same date → same id |
| No chrome | `rg "journal-new-entry|Entries this day|Refresh" web/components/journal` empty product paths |
| No Open | `rg "DayPanel|>Open<" web/components/journal` |
| No Interviewer | `rg Interviewer web/components/journal` |
| Ban list | Tango list grepped in member journal components |
| Thread height | Playwright or manual: 1 vs 40 msgs; composer in view |
| Timestamps | DOM `[data-testid=journal-message-timestamp]` |
| Media | Upload/drop/lightbox caption; closed 409; bytes private |
| Week | API week-activity; dots; band scroll |
| Calendar | Year→Month→Day matrix |
| Tags | Assign closed 409; non-admin no create |
| Agent | Guardrail corpus; RTH; labels fixture |
| Closure | Retro complete closes prior dates; 409 |
| Export/purge | Isolation tests |
| Suite | `cd server && .venv/bin/python -m pytest tests -q` green for touched modules |
| Build | `cd web && npm run build` |

---

## 9. Handoff contracts

| From → To | Artifact |
|-----------|----------|
| Coach J0-0 → Juliet | GO + §17 locks |
| India J1-1 → Alpha | Merge algorithm APPROVED |
| Alpha J1 → Charlie J1c | get-or-create stable |
| Charlie J1c → W1 | `data-message-id` + scrollToMessageId |
| Alpha J1-3 → W1 | `session_band` shared with phase |
| Mike J6 → Charlie | Attachment + caption APIs |
| Hotel T1-3 → Charlie | R2R display rules |
| J8 → J9 | Closure frozen for export |
| Delta JS6-9-G → Lima | Program PASS for DL |

---

## 10. Operating rhythm

1. **Vision** — Coach (GO, locks, ship)  
2. **Orchestration** — Juliet (this plan, board status)  
3. **Execution** — one seed per session; declare files first  
4. **Verification** — Delta gate with evidence  
5. **Documentation** — Lima same day  
6. **Reflection** — residuals into next seed  

Forbidden: agent-to-agent side channels; waived gates; silent multi-entry regressions.

---

## 11. Risks & mitigations

| Risk | Mitigation | Owner |
|------|------------|-------|
| Spike ahead of GO | Coach ratify or freeze | Coach |
| Merge drops content | India algorithm; collision report; never silent discard structured | India · Alpha |
| Chip-wall regression | Echo + J4 list window only | Echo |
| Fake R2R | Hotel criteria; omit over invent | Hotel · Alpha |
| Band rule thrash | Lock §17-12 at GO | Coach · Hotel |
| Guardrail “prompt hope” | Code validator J2 | Alpha · Hotel |
| Surface-explaining copy returns | Tango ban list CI grep | Tango · Kilo |

---

## 12. Immediate sequence (next 72 hours)

| Order | Action | Agent |
|------:|--------|-------|
| 1 | Spec hygiene J0-H | Juliet / India |
| 2 | Parallel reviews J0-1…J0-6 | India Mike Hotel Tango Echo Sierra |
| 3 | JS6-0-G | Delta |
| 4 | **Coach GO** J0-0 + Lima DL | Coach · Lima |
| 5 | J1-1 merge UNIQUE (blocking) | Alpha · India |
| 6 | Formal gates J1b / J1c / W1 / J6 / T1 on spike | Kilo · Delta |
| 7 | J2 agent corpus | Alpha · Hotel · Kilo |
| 8 | J3 · J7 · J8 · J9 | per critical path |

---

## 13. Suggested Coach GO statement

> **Journal Session v0.6 — BUILD AUTHORITY.**  
> One conversation per member date. The Journal is a chatbot with a fixed scrollable session,
> visible timestamps, header media, and calendar-as-control (no Open button; Week bands map
> member writing). Tag Manager v0.3 remains vocabulary SoR. Retrospective action remains the only
> seal path (scope-true). Surface spike on main is ratified as partial J1/J1b/J1c/W1/J6/T1 and must
> complete formal Delta gates. Supersedes Session Spec v0.5 multi-entry frame. Family B and no
> profit claims unchanged.

---

## 14. Document map

| Doc | Role |
|-----|------|
| **This file** | Canonical full agent bench plan |
| `agents/p-journal-session-v06/FULL-AGENT-PLAN.md` | Board-local mirror (kept in sync) |
| `agents/p-journal-session-v06/ORCHESTRATOR.md` | Status board (Coach control panel) |
| `agents/p-journal-session-v06/seeds/` | Pasteable packets |
| `agents/p-journal-session-v06/gate-reports/` | Delta verdicts |
| `docs/Journal-Session-v0.6-Evaluation-and-Implementation-Plan.md` | Technical eval / gaps |
| Spec v0.6 | Product law |

---

## 15. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Full agent bench plan; includes as-built surface spike honesty |
