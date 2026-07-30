# Charter — p-tag-manager

**Mission:** Ship a **system-wide, admin-controlled Tag Manager** — one platform vocabulary  
Coach curates for the whole Labs product. Members **select and assign** tags; they do **not**  
create or own a private tag lexicon. Tags are context, never gates. Integral to consistent  
process language across Practice and catalog.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Plan:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Parent Spec:**  
[`Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md`](../../Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md)  
**(DRAFT)** — **product locks in evaluation supersede personal-tier CRUD in Spec text.**

**Evaluation (authoritative for Coach locks):**  
[`docs/Tag-Manager-Spec-v0.2-Evaluation.md`](../../docs/Tag-Manager-Spec-v0.2-Evaluation.md) §0

**Doctrine:** standalone repo · Family B on **assignments** to private objects · no P&L on tags ·  
no waived gates.

---

## Coach locks (mandatory)

1. **CRUD is admin only** — create, rename, merge, retire, delete, seed, categories.  
2. **No `/me` tags surface** — no member vocabulary manager.  
3. **Members only assign/unassign** from the system list (optional, multi-valued).  
4. **No auto-create** of new tags from free text.  
5. **Resources hub** may expose lexicon **browse/learn** (read-only); Library remains primary.  
6. Spec v0.2 **personal vocabulary tier** (`member_tags` ownership, auto-create, member merge)  
   is **out of scope for v1** under these locks.

---

## Goals

1. One platform tag definition store + polymorphic assignments.  
2. Admin Tag Manager UI under `/admin`.  
3. Shared picker for Journal, Trade Log, courses, etc.  
4. Assignments on Family B objects stay Family B; lexicon definitions are platform data.  
5. Tags never gate, never script agents, never require completion.  
6. No public SEO tag index in v1; no P&L/win-rate correlation.

---

## Non-goals (v1)

Member-created tags · personal rename/merge · free-text tag birth · gamification ·  
replacing course categories · MSC code import.

---

## Collaboration

Reviewers + Delta. Coordination via Coach or Juliet.  

**Journal Session starts after this program** (TM7-G preferred). Assign API + picker  
(TM3) is the technical floor; full Tag Manager before Journal is Coach policy.
