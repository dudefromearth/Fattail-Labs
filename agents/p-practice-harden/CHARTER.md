# Charter — p-practice-harden

**Mission:** Architecturally harden the Practice stack (Trade Log, Reports, Journal,
Retrospective shell, shared chrome) without changing member-visible behavior unless a
change is a clear usability win.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Tests:** [`TEST-STRATEGY.md`](./TEST-STRATEGY.md) — useful invariants only  
**Source audit:** Session architectural hardening report (2026-07-29)  
**Parents:**  
- Trade Log Spec v1.1 · Journal Retrospective Spec v0.1 (DRAFT)  
- Application Framework v1.0 (Family B) · Member-Data-Privacy v0.1 · HIG v1.0  
- Bench doctrine: `agents/bench/doctrine.md` · `first-principles-doctrine.md`

---

## Goals (non-negotiable)

1. **Robustness** — scale, isolation, fail-loud, no silent truncation/wrong identity.  
2. **Single source of truth** — structure matching, open-on-day, realized series/PnL.  
3. **Simpler modules** — thin routes/pages; domain logic extractable and testable.  
4. **Completeness** — every phase ends with multi-agent review + Delta evidence.  
5. **Behavior stability** — H0–H2 default = same UX and same metrics; intentional UX
   changes only when labeled and Coach-approved.

---

## Collaboration law (this project)

> No seed is “done” until its **paired reviewers** have left an explicit note
> (APPROVED / RETURNED) and **Delta** has evidence for the phase gate.

| Rule | Practice |
|------|----------|
| **No solo ship** | Implementer + at least one guardian (India / Mike / Echo / Tango / Kilo) per seed |
| **Pair before merge** | Reviewer reads implementer’s evidence; implementer addresses RETURNED items |
| **Juliet sequences** | Parallel only when file sets do not conflict |
| **Coach owns trade-offs** | Metric formula changes, UX changes, Spec status flips |
| **Lima same day** | Decision-log when architecture or public API changes |

---

## Success (Definition of Done for the whole project)

- [x] H0–H3 phase gates **PASS** (H4 optional / performance).  
- [x] Position/PnL/open-on-day logic has **one** authoritative implementation (server-tested).  
- [x] List trades is **O(trades)** queries, not N+1.  
- [x] Dev identity fallback **cannot** run outside `LABS_ENV=dev`.  
- [x] Client pages no longer own multi-hundred-line domain algorithms (or are documented exceptions).  
- [x] Specs/docs match as-built Practice stack for hardened areas.  
- [x] Lima decision-log entry for the hardening program close.

**Program status (2026-07-29):** H0–H3 complete. H4 not opened (Coach optional).

---

## Out of scope

- New product features (Retrospective week roll-up, agent co-author, Playbook content).  
- Chart library rewrite for aesthetics alone.  
- Live broker APIs.  
- Changing ToS blotter visual rules without Coach.  
- Production deploy (Foxtrot only if Coach adds a deploy phase).

---

## Doctrine

All agents load: `agents/bench/doctrine.md`, `first-principles-doctrine.md`, this charter,
and the active seed. India may **BLOCK** product-boundary or isolation regressions. Mike
may **BLOCK** privacy/auth regressions. Tango may **BLOCK** profit-claim / dependency
regressions. Delta may **FAIL** on missing evidence.
