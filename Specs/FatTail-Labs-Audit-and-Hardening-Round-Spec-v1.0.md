# FatTail Labs — Audit & Hardening Round Spec v1.0

**Status:** **SUPERSEDED** by [`FatTail-Labs-Audit-and-Hardening-Round-Spec-v1.1.md`](./FatTail-Labs-Audit-and-Hardening-Round-Spec-v1.1.md). Do not extend this file.  
**Parents:** doctrine §12 (vision vs craft) · doctrine §13 (rounds) · Spec v0.7.1 §6.3 when that surface is in play.

A **round** is a scheduled look-back after a build. It is not a second build program and not a
license to redesign the product.

---

## 1. Purpose

The rounds are the sanctioned home of optimization. Builds deliver the vision exactly.
Rounds ask whether the same accepted result can ship simpler.

Doctrine: [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) **§13**.

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

- Streamline **during** a build (that belongs to doctrine §12: name the cost, do not trim).  
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

## 3. Other phases

Further round phases (inventory, security harden, etc.) may be added as versioned
sections. They do not override §2.

---

## 4. Document history

| Date | Note |
|------|------|
| 2026-08-14 | v1.0 — Simplify phase law · DL-336 · doctrine §13 |
