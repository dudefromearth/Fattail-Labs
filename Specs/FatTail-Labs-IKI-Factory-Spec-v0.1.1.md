# FatTail Labs — IKI Factory Spec v0.1.1

**Status:** DRAFT — for Coach review. No authority until approved and logged.  
**Date:** 2026-08-23  
**Program:** IKI Lab (suite) · IKI Factory (inner app)  
**Parents:** IKI Lab and Factory Spec v0.1 · Member Wiki Spec v0.1 · Wiki Agent Spec v0.1.2 · North Star v1.2 (Invariant #8) · Public Data Service Spec v0.1 Part I  
**Doctrine:** config fail-loud · no parallel store of truth · process outcomes only · no profit claims · evidence over assertion · documentation parity · human gates only  

**Scope statement.** This document defines the IKI Factory as an admin-only Kanban pipeline that turns Ideas into deployed Knowledge/Intelligence templates (with store presence). It does not authorize edits outside the Factory surface or the template registration path. Cross-tree effects (Wiki Agent `registration` contract, WooCommerce product creation) are specified as obligations; the delivering code lives in those trees under their own programs and DL-539 where required.

**Reviewers (PENDING until Coach schedules):**

| Gate | Reviewer | Concern |
|------|----------|---------|
| Architecture / boundary | India | No second store; template registration path; relation to Wiki Agent |
| Auth | Mike | Admin-only surface; card ownership |
| Design + psychology | Echo + Tango | Board language, empty states, priority labels, notifications, drag-and-drop affordances |
| Trading / content accuracy | Hotel | Template specs and Live output (no invention, no profit claims) |
| Evidence | Delta | Phase gates / runbooks |
| Approver | Coach | Ship / scope |

---

## 0. One-paragraph standard

> The IKI Factory is an admin-only Kanban pipeline fronted by a Factory Agent. Admin deposits Ideas; the agent runs a versioned, extensible research skill set for up to 24 hours, ranks findings, and materializes the top results (or fewer if that is all that was found) as cards. Admin alone decides which proposals advance, using drag-and-drop or click-to-advance/detract. The agent then drafts a Template Specification; Admin attaches a repo-resident implementation plan and signals Build. After Admin tests and signals Deploy (with product type/tier/free-vs-paid specified), the agent deploys the template, creates the corresponding WooCommerce subscription product, and makes it visible in the store. Every card carries priority (Low / Medium / High) and full lineage. The agent fails loudly; nothing is allowed to calcify. Only Live templates are member-visible. The Factory never invents content beyond evidence + Admin direction and never creates a parallel knowledge store.

---

## 1. Intent & success criteria

### 1.1 Intent

Turn raw Admin ideas into deployed, store-visible Knowledge/Intelligence templates through a visible, agent-facilitated Kanban pipeline that preserves human selection at every gate, supports direct manipulation (drag-and-drop + click), and never lets work stall silently.

### 1.2 Success criteria

| # | Criterion |
|---|-----------|
| IF1 | Admin can create an Idea card; within the research window the agent produces a ranked list of findings with reasons and sources. |
| IF2 | Top findings (up to 10, or fewer if that is all found) are materialized as individual Research cards carrying rank + reason; remainder stay attached to the parent Idea. |
| IF3 | Only Admin can move a Research card forward to Spec (via drag or click-to-advance). Archive / Trash are Admin actions. |
| IF4 | On arrival in Spec, agent drafts a Template Specification from the proposal + notes and notifies the card owner; card shows Spec-ready state. |
| IF5 | Admin attaches a repo plan reference and explicitly signals Build (or drags to Build after plan is attached); agent implements only against that plan + approved Spec. |
| IF6 | After Admin tests and signals Deploy (product type/tier/free-vs-paid required), agent deploys the template, creates the WooCommerce subscription product, and places it in the store. |
| IF7 | Every card carries Priority (Low / Medium / High) and full lineage (Idea → Research → Spec → Build → Live). |
| IF8 | Any failure, timeout, or un-processable state is visible on the card with reason; the agent never leaves work calcified. |
| IF9 | Rework destination is chosen by Admin (drop target or explicit choice); agent does not select the return lane. |
| IF10 | Research skills are used only from a simple versioned registry. |
| IF11 | Factory board and all non-Live cards are admin-only. Only Live templates are member-visible. |
| IF12 | No profit-claim copy in any agent-drafted content (Invariant #8). |
| IF13 | Deployed templates are eligible for the Wiki Agent `registration` contract path (Help Package fields supplied or flagged). |
| IF14 | Admin can move cards by drag-and-drop between allowed lanes/statuses and by click-to-advance / click-to-detract controls. Invalid moves are rejected with a visible reason on the card. |

---

## 2. Position in the platform

| Aspect | Decision |
|--------|----------|
| Suite | Lives inside **IKI Lab**. Nav sibling of Wiki. |
| Surface | Admin-only Kanban board with drag-and-drop and click-to-advance/detract. Member-facing suite pill remains named soon/empty until Coach opens it. |
| Store of truth for templates | Deployed templates register through the existing / future template registration path (eventually emitting Wiki Agent `registration` contract). No parallel corpus. |
| Store of truth for Factory state | Factory board state (cards, lanes, priorities, lineage, agent actions) is the operational SoR for in-progress work. |
| Agent | Factory Agent (bench archetype, product-local). Uses registered versioned skills only. |
| Human gates | Absolute. Agent proposes and executes; Admin selects and authorizes every advancement past Research via drag or click. |

---

## 3. Kanban model

### 3.1 Lanes (ordered)

| Lane | Purpose | Primary actor | Exit |
|------|---------|---------------|------|
| **Ideas** | Admin deposits raw idea + optional notes/links | Admin creates | Agent picks up for research |
| **Research** | Agent runs skills (≤24 h), ranks findings, materializes top cards | Agent produces; Admin selects | Admin: Forward (drag or click) / Archive / Trash |
| **Spec** | Agent drafts Template Specification | Agent drafts; Admin reviews | Admin attaches repo plan + signals Build (or drags after plan attached) |
| **Build** | Agent implements; Admin tests | Agent builds; Admin tests | Admin: Archive / Rework (Admin chooses destination) / Deploy |
| **Live** | Template deployed + WooCommerce subscription product + store visibility | Agent executes Deploy side-effects | Terminal (future Retire path optional) |

### 3.2 Card-level fields (not lanes)

- **Priority:** Low | Medium | High (Admin authoritative; agent may suggest)
- **Status filters:** Archived | Trashed | Rework
- **Owner:** Admin user who owns the card (receives notifications)
- **Lineage:** Immutable references back to parent Idea / Research / Spec cards
- **Product spec (required before Deploy):** type / tier / free-vs-paid

### 3.3 Interaction model (drag-and-drop + click)

- **Drag-and-drop:** Admin may drag any card to another allowed lane or to a status (Archive / Trash / Rework).
- **Click-to-advance / click-to-detract:** Every card exposes explicit controls to move one step forward along the happy path or one step backward / into a status.
- **Agent movement limits:** The agent may only:
  - Place newly created Research cards into the Research lane,
  - Update card state and content *inside* a lane (Spec-ready, Built-ready, failed, etc.),
  - Execute Deploy side-effects after Admin has moved the card to Live or issued an explicit Deploy signal.
- **Validation on drop or click:**
  - Forward moves that still lack required Admin input (repo plan reference, product spec, etc.) are rejected; the card stays put and shows a visible reason.
  - Backward moves and moves to Archive / Trash / Rework are always permitted for Admin.
  - On Rework, Admin chooses the destination (drop target or explicit selector); agent does not choose.
- Priority and ownership may be edited at any time and do not block movement.
- Lineage is preserved regardless of movement method.

### 3.4 Agent obligations (covenant)

- Pick up new Idea cards and run only registered, versioned research skills.
- Respect the 24-hour research window; then report actual findings (ranked, with reasons and sources). Materialize top results as cards (≤10 or fewer). Attach any remainder to the parent Idea.
- Never auto-advance a card across a human gate. Never approve its own Spec. Never Deploy without explicit Admin action.
- On Spec ready or Build complete: update the card and notify the owning Admin.
- On any error, timeout, or inability to discharge an obligation: move card to a visible failed/escalated state with reason. Raise attention so the owner sees it. Calcification is a failure.
- On Rework: accept Admin-chosen return destination; do not choose it.
- On Deploy: execute template deployment + WooCommerce subscription product creation (using the product spec on the card) + store visibility. Supply or flag Help Package fields for downstream Wiki Agent registration.

---

## 4. Research pipeline

- Skills live in a **simple versioned registry**. Agent may use only registered skills at their declared versions.
- New skills are added by registration (build or explicit borrow) + version.
- Window: up to 24 hours from pickup.
- Output: ranked list of candidate Knowledge/Intelligence template proposals, each with rank, reason for rank, and source evidence.
- Top results (target 10, or fewer if that is all of usable quality) become individual cards in Research.
- If fewer than 10 usable proposals are found, agent reports exactly what was found. No padding, no invention.
- Remainder of the ranked list stays attached to the parent Idea card as additional findings.

---

## 5. Specification & Build

- **Spec lane:** Agent produces a Template Specification from the forwarded proposal, its sources, and all Admin notes. Card is marked Spec-ready; owner is notified.
- **Build signal:** Admin attaches a reference to an existing implementation plan in the repo (path or doc ID) and explicitly signals Build (or drags the card to Build after the plan is attached). Agent implements only against that plan + the approved Spec. Agent does not invent plans.
- **Build lane:** Agent performs the implementation. On completion, card is marked Built-ready; owner is notified. Admin tests.
- **Rework:** Admin marks Rework and chooses the return destination (Spec, Research, Ideas, or holding). Agent complies.

---

## 6. Deploy & Live

Before signalling Deploy (or completing a drag into Live), Admin must supply:

- Product type / tier
- Free vs paid (subscription)

On Deploy the agent:

1. Deploys the template into the live system (registration path that feeds or will feed the Wiki Agent `registration` contract).
2. Creates the corresponding WooCommerce subscription product using the supplied product spec.
3. Makes the product visible in the store.

Only cards in **Live** are member-visible. All prior lanes and non-Live statuses remain admin-only.

---

## 7. Non-goals & invariants

- **No invention.** Agent composes from evidence (sources, proposal, Admin notes, referenced repo plan). It does not assert unevidenced relations or content.
- **No calcification.** Stuck or failed work is always visible with reason.
- **No parallel knowledge store.** Deployed templates join the existing template → Wiki registration path.
- **No member access to the board.** Factory board is admin-only.
- **No profit claims.** Invariant #8 applies to every agent-drafted string and every Live artifact.
- **No auto-advancement past human gates.** Movement across gates is Admin-only (drag or click).

---

## 8. Notifications

- Primary: state and messages appear on the card itself.
- Secondary: notify the Admin who owns the card when Spec is ready, Build is complete, or a failure/escalation occurs.

---

## 9. Relation to Wiki Agent & store

- Successful Deploy makes the template eligible for the Wiki Agent `registration` contract (Help Package fields required or explicitly flagged as missing).
- Factory does not write Wiki pages directly; it produces the template and the registration-triggering event.
- WooCommerce product creation is a mandatory side-effect of Deploy for v0.1.

---

## 10. Phasing (proposal)

| Phase | Ships | Proves |
|-------|-------|--------|
| **IF-1 Board + Ideas** | Kanban surface with drag-and-drop + click-to-advance/detract, Idea cards, Priority, ownership, basic agent pickup | IF7, IF11, IF14 |
| **IF-2 Research** | Versioned skill registry, 24 h window, ranked findings, top-card materialization, fail-loud | IF1, IF2, IF8, IF10 |
| **IF-3 Spec + Build** | Spec drafting, repo plan reference, Build signal / drag validation, Rework with Admin-chosen destination | IF4, IF5, IF9 |
| **IF-4 Deploy + Live** | Deploy side-effects (template registration path + WooCommerce subscription product + store), product spec required on move to Live | IF6, IF13 |
| **IF-5 Hardening** | Full lineage queries, notification reliability, failure injection, invalid-move rejection tests | IF3, IF8, IF12, IF14 |

Each phase requires Coach stamp, DL entry, and Delta evidence gate.

---

## 11. Closed decisions

| ID | Decision | Ruling |
|----|----------|--------|
| OD-F1 | Lane names | Ideas → Research → Spec → Build → Live |
| OD-F2 | Priority | Low / Medium / High |
| OD-F3 | Skills | Extensible via simple versioned registry |
| OD-F4 | Research output | Ranked list after ≤24 h; top results (≤10 or fewer) become cards with rank + reason |
| OD-F5 | Implementation plans | Repo-resident; Admin attaches reference |
| OD-F6 | Deploy | Always creates WooCommerce subscription product; type/tier/free-vs-paid specified by Admin |
| OD-F7 | Visibility | Board admin-only; only Live templates member-visible |
| Interaction | Movement | Drag-and-drop + click-to-advance/detract; agent cannot cross human gates |

---

## 12. Acceptance criteria (when BUILD)

| AT | Criterion |
|----|-----------|
| AT-IF-1 | Admin can create Idea cards; agent picks them up. |
| AT-IF-2 | Research produces ranked findings with reasons/sources; top results become cards (or fewer if that is all found). |
| AT-IF-3 | Only Admin can move a card from Research to Spec (drag or click). |
| AT-IF-4 | Spec-ready state + owner notification occur after agent drafts Spec. |
| AT-IF-5 | Build occurs only after Admin attaches repo plan ref and signals/drags to Build. |
| AT-IF-6 | Deploy requires product type/tier/free-vs-paid; produces Live template + WooCommerce subscription product + store visibility. |
| AT-IF-7 | Priority Low/Medium/High present and Admin-authoritative. |
| AT-IF-8 | Failures and timeouts are visible on the card with reason; no silent stalls. |
| AT-IF-9 | Rework lets Admin choose destination. |
| AT-IF-10 | Only registered versioned skills are used. |
| AT-IF-11 | Board is admin-only; only Live items are member-visible. |
| AT-IF-12 | No profit-claim copy in agent output. |
| AT-IF-13 | Deployed templates are positioned for Wiki Agent registration. |
| AT-IF-14 | Drag-and-drop and click-to-advance/detract work; invalid moves are rejected with visible reason. |

---

## 13. Changelog

| Ver | Date | Notes |
|-----|------|-------|
| **v0.1.1** | 2026-08-23 | Added drag-and-drop + click-to-advance/detract interaction model. Agent movement limited to intra-lane updates and post-authorization Deploy side-effects. Invalid moves rejected with visible reason. IF14 and AT-IF-14 added. |
| **v0.1** | 2026-08-23 | Initial Spec. Lanes: Ideas → Research → Spec → Build → Live. Priority Low/Medium/High. 24 h research window, ranked top findings, extensible versioned skills, repo-referenced plans, mandatory WooCommerce subscription product on Deploy, admin-only board, fail-loud, human gates only. |

---

**End of IKI Factory Spec v0.1.1 (DRAFT)**
