# Seed J0-1 — India Spec & Architecture (v0.6)

**Project:** p-journal-session-v06  
**Agent:** India  
**Depends on:** Spec v0.6 DRAFT  
**Spec:** `Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md`  
**Eval:** `docs/Journal-Session-v0.6-Evaluation-and-Implementation-Plan.md`

---

## Intent

Architecture approval for **one conversation per date**, merge migration, Tag Manager boundary,
and Trade Log dependency honesty for trades strip (§1.5).

---

## Read first

1. Spec v0.6 §§1–7, §13 schema, §15, §17  
2. Eval plan §§1–4  
3. FULL-AGENT-PLAN §3 keep/kill  
4. Tag Manager Spec v0.3 (as-built) — do not redefine vocabulary  

---

## Deliverable

Written **APPROVED** or **RETURNED** covering:

1. `UNIQUE (identity_id, journal_date)` — yes/no and dual-read during migration  
2. **Merge algorithm** (canonical session, re-point messages/attachments/tags, structured collision handling — **no silent content drop**)  
3. Get-or-create vs 409-on-second-create (recommend get-or-create for first-send UX)  
4. Tag Manager compliance still holds  
5. Trade Log width/R2R dependency — Journal must not invent R2R  
6. Market calendar fail-loud for phase + bands  

---

## Out of scope

Code, UI, deploy.

## Completion

- [ ] Review note filed (board path or Coach channel via Juliet)  
- [ ] Merge steps enumerated  
- [ ] APPROVED or RETURNED with required Spec edits  

## Gate

Feeds **JS6-R1** → JS6-0-G.
