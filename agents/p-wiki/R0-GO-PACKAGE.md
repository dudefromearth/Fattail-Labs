# Wiki Agent — R0 → GO package (PRE-GO, do not execute)

**Plan:** `docs/Wiki-Agent-Full-Agent-Bench-Plan-v0_1_2.md`  
**Spec:** `Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_2.md` (header corrected this packet)  
**Date:** 2026-08-23  
**Status:** Ready for Coach stamp. **No WA-1.** Juliet does not write seeds until GO WA-1 is checked **and** Lima’s DL has landed.

Reviews (do not modify spec):

| Seed | File | Verdict |
|------|------|---------|
| R0-1 India | `reviews/R0-1-india.md` | RETURNED until stamp; architecture sound; sealed transcript = ledger **evidence**, pages git-only (**WIK-D1 satisfied**) |
| R0-2 Mike | `reviews/R0-2-mike.md` | `contracts:deliver` **not** in `VALID_SCOPES`; minimal gap = one scope + per-source principals; session = admin **cookie only** |
| R0-3 Echo+Tango | `reviews/R0-3-echo-tango.md` | No spec block; **WA-4 UI deferred** pending chrome ruling |
| R0-4 Hotel | `reviews/R0-4-hotel.md` | §7 approved; guidelines artifact **WA-2-0**, not now |

---

## Stamp sheet (from plan v0.1.2 — Coach fills)

Copy/check in place:

- [ ] **Spec v0.1.2** approved (or AMEND)  
- [ ] **OD-1** (a) sole committer / **(b)** pipeline only — proposal **(b)**  
      Coach ruling: ________  
- [ ] **OD-2** skip-board class? — proposal **none** (W5 stands)  
      Coach ruling: ________  
- [ ] **OD-3** standalone supersedes Proactive Compilation v0.2 — proposal **standalone**  
      Coach ruling: ________  
- [ ] **OD-4** template page consequence vs precondition — proposal **consequence**  
      Coach ruling: ________  
- [ ] **OD-5** wiki-side pollers until source hooks — proposal **yes**  
      Coach ruling: ________  
- [ ] **OD-6** floating host chrome, multi-turn chat, free text — proposal **as written**  
      Coach ruling: ________  
- [ ] **Chrome narrowing** (required if OD-6 keeps `/app/*` host chrome, else DL-539 three-OK)  
      Allowed routes for v0.1 session affordance: ________  
      (blank = Coach must fill; examples: `/app/wiki` + `/admin` **or** three OKs for AppChrome)  
- [ ] **GO WA-1**  
- [ ] **Amend**  
- [ ] **Stop**

**B2:** if any OD is ruled **other than as proposed**, return to Juliet for re-sequencing **before** any seed executes.

India’s sealed-transcript ruling (for Coach awareness, not a new OD): ledger evidence is **in-spec** for WIK-D1; optional git copy of sealed transcript is advisory.

---

## Juliet — seed-writing notes at GO time (not now)

Recorded per Task 3.2. Do not author WA-* seed files until GO WA-1.

**(a) WA-1-G — extra evidence line (Kilo)**  
Unregistered principal + **schema-valid** envelope → **loud failure**, proven **separately** from schema rejection (distinct status/detail, ledger `rejected` with reason ≠ schema). Cite Mike R0-2.

**(b) WA-2-3 — extra evidence line (Kilo)**  
One **induced mid-discharge failure** (e.g. `content_pointer` 5xx after validate): ledger status **`failed`**, board card flagged **`failed-partial`** if any draft bytes were written; no silent stall (spec §3.0).

Also inherit from reviews when seeds are written:

- WA-1: add `contracts:deliver` to `VALID_SCOPES`; session kind rejects agent bearer.  
- WA-1: do not store page `body_md` on `wiki_contracts` (India BLOCKING if coded).  
- WA-4 seed: open → accrete → seal **settled**; UI only on Coach’s allowed routes.  
- WA-2-0: Hotel guidelines artifact before first `ai.complete()` draft.

---

## Lima DL skeleton (DO NOT LAND)

Draft only: `agents/p-wiki/drafts/DL-wiki-agent-od-skeleton.md`  
Not copied into `Architecture/00-decision-log.md`.
