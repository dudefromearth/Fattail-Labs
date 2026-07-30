# Charter — p-journal-session-v06

**Mission:** Ship Journal Session **v0.6** — the Journal is an AI chatbot; **one conversation per
date**; calendar cells and Week bands are the navigation; fixed-height thread; header media;
Tag Manager assign-only; one seal on retrospective complete (scope-true).

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Plan:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)  
**Full agent plan (board mirror):** [`FULL-AGENT-PLAN.md`](./FULL-AGENT-PLAN.md)  
**Canonical full agent bench plan:**  
[`docs/Journal-Session-v0.6-Full-Agent-Bench-Plan.md`](../../docs/Journal-Session-v0.6-Full-Agent-Bench-Plan.md)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Parent Spec:**  
[`Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md)  
**(DRAFT until Coach GO)**

**Evaluation + technical plan:**  
[`docs/Journal-Session-v0.6-Evaluation-and-Implementation-Plan.md`](../../docs/Journal-Session-v0.6-Evaluation-and-Implementation-Plan.md)

**Prerequisite:** Tag Manager Spec **v0.3** as-built (DL-159 · TM7-G PASS · mig 053) — **COMPLETE**.

**Supersedes product frame:**  
Session Spec **v0.5** multi-entry-per-date · boards `p-journal-session-v05` / v04 / v02  
(v05 code is **substrate**, not design authority).

**Parents:** Retrospective v0.6/v0.5 · Journey v1.0 · Trade Log v1.1 · Practice Export v1.1 ·  
Tag Manager v0.3 · Member Data Privacy v0.1

**Doctrine:** capacity over dependency · process outcomes only · Family B · evidence over assertion ·  
no waived gates · declare before touch · config fail-loud.

---

## Product north stars

| Goal | Meaning |
|------|---------|
| **Chatbot = Journal** | Thread + composer; no second write path |
| **One conversation / date** | `UNIQUE (identity_id, journal_date)`; no entry-list chrome |
| **Calendar is the control** | Cells navigate; Week bands deep-link; no Open button |
| **Scrollable session** | Fixed-height thread; page does not grow |
| **Process integrity** | Phase honesty; member-only quotes for intent; visible timestamps |
| **Tags frame only** | Tag Manager assign-only; never gate/script agent |
| **One seal** | Retro complete, scope-true, permanent for members |

---

## Greenfield / substrate rule

Design from Spec **v0.6**. Prior session code (including v0.5 partial land) is **substrate** after
India keep/kill — prefer delete of multi-entry chrome and Open-button navigation over camouflage.

---

## Collaboration

All coordination through **Coach** or **Juliet**. Reviewers + Delta evidence required. No agent-to-agent
side channels.
