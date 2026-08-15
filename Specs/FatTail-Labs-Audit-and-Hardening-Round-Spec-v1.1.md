# FatTail Labs — Audit & Hardening Round Spec v1.1

**Status:** **BUILD AUTHORITY** (Coach 2026-08-14 · **DL-336** · **DL-337**).  
**Supersedes:** v1.0 of this lineage (same name). **One spec, four phases, one lineage.**  
**Parents:** doctrine §12 · §13 · §14 · Spec v0.7.1 §6.3 when that surface is in play.

A **round** follows an implementation. That sequence is **expected process**, not an
exception or a second product program. It is not a license to redesign the product.

Doctrine: [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) **§13** · **§14**.

---

## 1. Purpose

The rounds are the sanctioned home of optimization. Builds deliver the vision exactly.
Rounds ask whether the same accepted result can ship simpler, cleaner, and no slower.

**Coach merge (verbatim):** one round spec, four phases, one lineage.

The **Simplify** phase is written below (Coach 2026-08-14). The other three phase
titles are **not invented here** — they wait for Coach names (doctrine §14).

---

## 2. Simplify phase (Coach 2026-08-14)

**Binding on every seat.** Coach text is verbatim.

> The rounds are the sanctioned home of optimization. During a build,
> agents deliver the vision exactly — no streamlining on the fly. In the
> round, we look back at what we built and ask: can it be simpler? Is
> there duplication? Can the same result ship with less code, fewer
> paths, faster execution?
>
> Two things are never compromised by a round: the INTERFACE as Coach
> accepted it (the side-by-side still passes after the refactor — pixel
> intent intact) and PERFORMANCE (equal or better, measured, never
> assumed). A refactor that changes what the member sees or slows what
> they feel is not a refactor — it's a regression wearing a haircut, and
> it fails the round.
>
> Characterization tests prove equivalence; Echo re-gates any touched
> surface against the references; the suite stays green and warning-free
> throughout.

### 2.1 What Simplify may do

- Remove duplication, dead paths, and unused helpers.  
- Collapse two implementations that already produce the same accepted result.  
- Speed execution **when measured** equal or better.

### 2.2 What Simplify may not do

- Streamline **during** a build (doctrine §12: name the cost, do not trim).  
- Change the accepted interface (side-by-side vs Coach references must still pass).  
- Slow what the member feels (unmeasured “faster” is not evidence).  
- Skip Echo re-gate on a touched surface.  
- Leave the suite red or warning-noisy.

### 2.3 Gates (Simplify)

| Seat | Proof |
|------|--------|
| **Kilo** | Characterization proves equivalence; `pytest tests -q` green, **0 warnings**. |
| **Echo** | Any touched member surface re-gated against the references; pixel intent intact. |
| **Delta** | FAIL if interface moved or performance is assumed, not measured. |

---

## 3. Four phases (lineage)

| # | Phase | Status |
|---|--------|--------|
| — | *(Coach names)* | not invented |
| — | **Simplify** | **law** · this document §2 |
| — | *(Coach names)* | not invented |
| — | *(Coach names)* | not invented |

v1.0 §3 (“further phases may be added… inventory, security harden, etc.”) is
**withdrawn**. That note invented scope. v1.1 does not replace it with invented
phase titles.

---

## 4. Document history

| Date | Note |
|------|------|
| 2026-08-14 | v1.0 — Simplify phase law · DL-336 · doctrine §13 |
| 2026-08-14 | **v1.1** — withdraw v1.0 §3; rounds expected after implementation; one lineage, four phases (three titles wait for Coach) · DL-337 |
