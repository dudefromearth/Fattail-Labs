# P-Journal-Session Orchestrator

> **SUPERSEDED FOR PRODUCT AUTHORITY (2026-07-30).**  
> This board is **PROGRAM COMPLETE under Spec v0.2**. Do **not** reopen seeds here for  
> chat-primary work. Successor board:  
> [`agents/p-journal-session-v04/`](../p-journal-session-v04/) · Spec **v0.4a**.  
> Substrate on `main` is reused; product frame is not.

**Juliet** maintains the board. **Coach** drives. Specialists execute **only** via seeds.  
**Collaboration is mandatory** — CHARTER collaboration law.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Seeds | [`seeds/`](./seeds/) |
| Gates | [`gate-reports/`](./gate-reports/) |
| Spec | [`Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md) (historical) |
| Successor | [`../p-journal-session-v04/ORCHESTRATOR.md`](../p-journal-session-v04/ORCHESTRATOR.md) |

---

## Status board

**Program status:** **PROGRAM COMPLETE** — J0–J9 **PASS** (2026-07-30) · **product authority superseded by Spec v0.4a**  
**J0 frozen.** Spec v0.2 was BUILD AUTHORITY for this program only.

| Phase | Intent | Status |
|-------|--------|--------|
| **J0** | Spec lock + D3–D5 owner gates + Coach GO | **COMPLETE** |
| **J1** | Schema + member text sessions + dual-read | **COMPLETE** — JS1-G **PASS** |
| **J2** | Structured form (no LLM) | **COMPLETE** — JS2-G **PASS** |
| **J3** | Agent interview + validator + form fallback | **COMPLETE** — JS3-G **PASS** |
| **J4** | Date closure on retro complete | **COMPLETE** — JS4-G **PASS** |
| **J5** | Private media | **COMPLETE** — JS5-G **PASS** |
| **J6** | Portability `journal_session` | **COMPLETE** — JS6-G **PASS** |
| **J7** | Retrospective tag routing | **COMPLETE** — JS7-G **PASS** |
| **J8** | Demo fixtures / seed pack | **COMPLETE** — JS8-G **PASS** |
| **J9** | As-built + program close | **COMPLETE** — JS9-G **PASS** |

### Coach locks (do not re-open without Coach)

| ID | Lock |
|----|------|
| **Program GO / DL-137** | Spec v0.2 **BUILD AUTHORITY** · J1+ open |
| **JS3-0 / DL-148** | Journal Session **agent path GO** — product-wide mode; default **off**; fail loud |
| **D6 / DL-128** | Observer = Navigator Practice features; **only** difference = **6-week term** |
| **DL-127** | Retrospective agent: Observer parity when mode on |
| **D9** | Import additive; never overwrite sealed transcript (**LOCKED JS0-0**) |

### Owner gates (J0 — frozen)

| ID | Owner | Topic |
|----|-------|--------|
| **D1–D9 · §20** | various | **All LOCKED** at GO (see Spec §3) |

**Carry residuals:** Journey routine wording (JS1/J9) · Export Spec `journal_session` (JS6-1).

---

### Seed checklist

| Seed | Primary | Reviewers | Status |
|------|---------|-----------|--------|
| JS0-1 | India | Coach | **done** — D1·D2 LOCKED; schema SoR; dual-read §2.1; India APPROVED |
| JS0-2 | Tango | Hotel | **done** — D3 LOCKED; Appendix B APPROVED; capacity §16; Hotel co-sign |
| JS0-3 | Mike | India | **done** — D4·D7 LOCKED; §11.2–11.3; attack notes; India co-sign |
| JS0-4 | India · Mike | Coach | **done** — D5 LOCKED; §13; JS8-1 migration named |
| JS0-5 | Hotel | Tango | **done** — D8 LOCKED; §5.1 invalidation; §8.4 scripts; Tango co-sign |
| JS0-6 | Sierra | Tango | **done** — §20 marketing/SEO/demo-proof ban; Tango co-sign |
| JS0-G | Delta | — | **PASS** — `gate-reports/JS0-G-spec-lock.md` |
| JS0-0 | Coach | — | **GO** 2026-07-30 — BUILD AUTHORITY · DL-137 |
| JS1-1 | Alpha | Mike · India | **done** — `049_journal_sessions.sql` applied; Mike·India APPROVED |
| JS1-2 | Alpha | India | **done** — domain+API; 10 tests PASS; India APPROVED |
| JS1-3 | Alpha | India | **done** — dual-read gather/routine; 46 tests PASS; India APPROVED |
| JS1-4 | Charlie | Echo | **done** — day tag start + list/seal; day-book unchanged; Echo APPROVED |
| JS1-5 | Kilo | Alpha · Mike | **done** — 21 tests ×2 PASS; retro 33 PASS; Alpha·Mike APPROVED |
| JS1-G | Delta | — | **PASS** — `gate-reports/JS1-G-phase.md` · 54 tests |
| JS2-1 | Alpha · India | Hotel | **done** — schemas/checklist/prefill; 26 tests; Hotel APPROVED |
| JS2-2 | Charlie | Tango · Echo | **done** — form UI + seal confirm; Tango·Echo APPROVED |
| JS2-3 | Kilo | Alpha | **done** — 33 tests ×2 PASS; Alpha APPROVED |
| JS2-G | Delta | — | **PASS** — `gate-reports/JS2-G-phase.md` · 33 tests |
| JS3-0 | Coach | — | **GO** 2026-07-30 — agent path authorized · DL-148 |
| JS3-1 | Alpha · Mike | India · Tango · Hotel | **done** — local agent API + Appendix A; 38 tests; reviewers APPROVED |
| JS3-2 | Alpha | Mike | **done** — §8.2 validator + double-fail form; 42 tests; Mike APPROVED |
| JS3-3 | Charlie | Tango | **done** — interview chat + form fallback UX; Tango APPROVED |
| JS3-4 | Kilo | Alpha · Mike | **done** — 49 tests ×2 PASS; Alpha·Mike APPROVED |
| JS3-G | Delta | — | **PASS** — `gate-reports/JS3-G-phase.md` · 51 tests (re-verified) |
| JS4-1 | Alpha | India · Mike | **done** — closures on retro complete |
| JS4-2 | Alpha | Tango | **done** — 409 + preview + closures API |
| JS4-3 | Charlie | Tango | **done** — closed day UI + complete confirm |
| JS4-4 | Kilo | Alpha | **done** — closure tests; 51 suite |
| JS4-G | Delta | — | **PASS** — `gate-reports/JS4-G-phase.md` |
| JS5-1…G | Mike · Foxtrot · Alpha · Charlie · Kilo · Delta | — | **PASS** (media store/API; mig 050) |
| JS6-1…G | Alpha · Charlie · Kilo · Delta | — | **PASS** (export dual-read + purge sessions) |
| JS7-1…G | Alpha · Charlie · Kilo · Delta | — | **PASS** (retrospective navigate-only) |
| JS8-1…G | Alpha · Mike · Delta | — | **PASS** (is_demo mig 051) |
| JS9-1 | Lima · India | Coach | **done** — as-built honesty |
| JS9-G | Delta | — | **PASS** — `gate-reports/JS9-G-program-close.md` |

---

## Operating loop (every seed)

```
1. Juliet opens seed (status → in_progress)
2. Activate PRIMARY with seed + CHARTER + doctrine + Spec v0.2
3. PRIMARY produces work + evidence pack
4. REVIEWERS: APPROVED | RETURNED (max 2 loops → Coach)
5. Juliet marks seed done only when reviewers APPROVED
6. Phase end → Delta formal gate (PASS / FAIL / BLOCKED)
7. Lima logs decisions same day in Architecture/00-decision-log.md
```

**Never skip review.** A waived Delta gate is a doctrine violation.

---

## Agent roster

| Callsign | Role on p-journal-session |
|----------|---------------------------|
| **Coach** | GO/NO-GO; D6 term (locked); J3 agent GO/DEFER; ship |
| **Juliet** | Sequencing, board, parallelism |
| **India** | Spec SoR, schema, D1/D2/D5, gather dual-read |
| **Alpha** | Migrations, domain, APIs, agent boundary, closure, export |
| **Charlie** | Calendar, form, chat UI, routing UX |
| **Echo** | Visual density, session chrome |
| **Mike** | Isolation, D4 media, D7 attribution, purge |
| **Hotel** | Script trading accuracy; invalidation; clean_day |
| **Tango** | Copy, D3, capacity, no shame |
| **Sierra** | No public journal SEO/marketing |
| **Foxtrot** | Media storage/ops for J5 |
| **Kilo** | Characterization + edge cases |
| **Delta** | Phase/program gates with evidence |
| **Lima** | DL, Spec honesty, Arch docs |

---

## Recommended activation order

1. ~~**JS0-1** India → parallel **JS0-2…JS0-6**~~ **DONE**  
2. ~~**JS0-G** Delta → **JS0-0** Coach GO~~ **DONE** (GO 2026-07-30)  
3. ~~**JS1-*** → **JS1-G**~~ **DONE** (PASS 2026-07-30)  
4. ~~**JS2-*** then **JS2-G**~~ **DONE** (PASS 2026-07-30 — form without LLM)  
5. ~~**JS3-0** Coach~~ **GO** 2026-07-30 → **JS3-1…JS3-G**  ← **current**  
6. **JS4** after J1 (can follow J2) — parallel OK with J3  
7. **J5 / J6 / J7** per plan graph  

---

## Invariants (every seed)

1. Family B · `identity_id` only · no MSC code  
2. Config fail loud · no silent defaults for agent mode  
3. Observer ≠ free; Observer Practice = Navigator for 6-week term  
4. Additive import · purge membership-preserving  
5. Evidence over assertion  
6. Declare files before touch (change control)
