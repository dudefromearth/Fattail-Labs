# Wiki Agent Directive & Compliance Audit Charge v0.1

**Scope statement.** Active program: Wiki. Files/trees touched: **NONE — this is a
read-only audit charge.** Touches outside program: **NONE** for the audit itself. The
remediation plan this charge produces may *propose* hooks in the course system, help
system, and IKI Lab template registration path — those are cross-tree and fall under
DL-539 (three-OK) before any edit; the plan proposes, it does not authorize.

**Status:** Charge executed 2026-08-23 (D7 addendum included). Report:
[`Wiki-Agent-Directive-Compliance-Audit-2026-08-23.md`](./Wiki-Agent-Directive-Compliance-Audit-2026-08-23.md).
**Authority:** This document restates Coach's directive of 2026-08-23. It creates no
build authority. Output is a report and a proposal. **A Specification and an
implementation plan are required before any product change.**

---

## 1. The directive (Coach, 2026-08-23)

The Wiki is fronted by an agent. That agent is the gateway for the Wiki's content
lifecycle, and all writing funnels through git so the Wiki maintains a single source
of truth. Broken into auditable requirements:

| ID | Requirement |
|---|---|
| **D1** | The Wiki is fronted by an agent. The agent controls all writing to the Wiki by funneling it through git. The Wiki maintains a single source of truth. |
| **D2** | The agent monitors **course changes**. When a course changes, the Wiki is updated, and it is the agent's job to do so. |
| **D3** | The agent monitors **help system changes**. Same obligation: change occurs → Wiki updated by the agent. |
| **D4** | On every update, the agent **searches for linkages** between the update and existing content, and builds those connections. |
| **D5** | The agent is **callable by an admin at any time** to take direction on new Wiki pages. When called, it **gathers context from the calling surface** — called from Strategy Lab, it knows the context is Strategy Lab; called from Practice, it knows that context. |
| **D6** | The agent monitors **IKI Lab template creation**. Every new template gets a Wiki page about the template and **how it fits into the rest of FatTail Labs**. |
| **D7** | **Admin session UI (Coach 2026-08-23 addendum).** An admin interface callable **from anywhere in FatTail Labs**, contextually aware, that **ties directly to the wiki agent**, and lets the admin **request a wiki page be created based on specifications they articulate in that agent session**. This is a directed session with the wiki agent, not a one-shot compile button. |

---

## 2. Audit charge

For each requirement D1–D7, Grok reports one of four verdicts, with evidence:

| Verdict | Meaning |
|---|---|
| **COMPLIANT** | Behavior exists as built, proven by evidence |
| **PARTIAL** | Some of the behavior exists; state exactly what is present and what is missing |
| **ABSENT** | Nothing implements this today |
| **CONFLICTED** | Something implemented today *contradicts* the directive (not merely missing — actively at odds) |

**Evidence over assertion.** Every verdict cites: file paths, endpoints, migration
numbers, decision-log IDs, spec sections, or command output. "It should work" is
banned per repo doctrine (INSTRUCTIONS.md §2.4). Where a claim can be exercised
(curl an endpoint, run the reindex, inspect the checkout), exercise it and capture
the output.

### Per-requirement audit questions

**D1 — Agent-fronted, git-funneled writes**
- What write paths into the `lab-wiki` checkout exist today? Enumerate all of them
  (compiler agent, admin in-place edit per WI9, direct Obsidian/human authorship,
  sync tick, reindex, anything else).
- For each path: does it pass through an agent, or bypass one?
- Is MySQL provably a derived index only (WIK-D1), or has any content crept into it
  as a second store of truth?

**D2 — Course-change monitoring**
- Does anything today watch course/lesson changes and trigger Wiki work? (Registrar
  syncs `corpus_items` from lessons — does it detect *changes* to already-registered
  items, or only new ones?)
- Does the Wiki Proactive Compilation deploy-watcher (v0.2) cover course content
  changes, or only production deploys?
- Trace one concrete case: edit a published lesson today — what, if anything,
  happens on the Wiki side, and on what timeline?

**D3 — Help-system-change monitoring**
- Same questions as D2 against the help system (Help Concierge KB, help articles,
  curated FAQ). Is any help content registered in the corpus at all?

**D4 — Linkage search on update**
- The related engine (Member Wiki v0.1 stage ⑤) rescoreS `wiki_refs` on tick. Does
  it run today? Is it wired to *updates* or only to new corpus?
- Do wikilinks/backlinks (`wiki_links_idx`) get refreshed on every write path from
  D1, or only some?

**D5 — Admin-callable, context-aware**
- Does the "Compile this into Wiki" operator affordance (Proactive Compilation v0.2)
  exist as built? On which surfaces?
- Does any invocation today carry calling-surface context (suite + entity on
  screen), or is invocation context-blind?
- Enumerate the suites where the affordance is present vs. absent (Practice,
  Journey, Options Lab, Strategy Lab, IKI Lab, courses, help).

**D6 — IKI template pages**
- Does anything today fire on template registration?
- Is the Template Help Package (IKI Template Help Package Spec v0.1 — purpose,
  information-in, knowledge-out, why, how, scenarios, non-claim, data-fields)
  accessible to the Wiki pipeline as source material?
- Do any existing templates (Options Lab Heatmap templates) have Wiki pages?

**D7 — Admin-anywhere wiki-agent session**
- Is there an admin UI, callable from any Labs surface, that opens a session with
  the wiki agent (not a one-shot “compile this” button)?
- Can the admin articulate specifications in that session and request a page be
  created from them?
- Does the session receive calling-surface context (where the admin invoked from,
  and what was on screen)?
- Does that request funnel through git (D1) and the publish gate (W5 / Q2)?

---

## 3. Known baseline (what the audit checks against)

The audit measures **as-built** against the directive. The following is **as-specced
and as-logged**; Grok should confirm or correct each as part of the report:

- **WIK-D1:** Wiki system of record is the `dudefromearth/lab-wiki` git checkout
  (`LABS_WIKI_ROOT`, boot fail-loud); MySQL is a rebuildable derived index
  (migration 035). W1 spine shipped with gate evidence
  (`agents/p-wiki/gate-reports/W1-delta-gate.md`).
- **W5 (Member Wiki v0.1):** No agent-direct publish. Agent-compiled pages flow
  through the content board: `awaiting_approval` → human approve → published.
- **WI9:** Admin in-place edits commit to the checkout directly.
- **Perpetual loop (Member Wiki v0.1 §4):** registrar → transcriber → compiler →
  human approve → related engine. Phases W2 (corpus) and W3 (compiler + board) were
  deferred at W1 ship — confirm current phase status.
- **Wiki Proactive Compilation Spec v0.2:** agent watches production deploys,
  proposes undirected content, admin inbox as Wiki panel, floating "Compile this
  into Wiki" operator affordance. Confirm build status.
- **IKI Template Help Package Spec v0.1:** templates unregistrable without the help
  package fields. Confirm whether the registration gate is live.

---

## 4. Open questions — carried, not resolved

These were raised to Coach on 2026-08-23 and are **unresolved**. The audit must not
resolve them by picking an interpretation. Where the current implementation *forces*
an answer (e.g., admin edits bypass any agent today, which bears on Q1), the audit
flags the fact and the tension — verdict CONFLICTED or PARTIAL with the tension
named — and stops there.

1. **Write authority:** Is the agent the *sole committer* (admin and Obsidian
   authorship routed through it), or does it own only its own pipeline's writes?
2. **Publish gate:** Do auto-inclusion updates (course change, help change, template
   creation) still land as `awaiting_approval` under W5, or is there a class of
   mechanical sync that publishes untouched? (The latter supersedes W5 → DL entry.)
3. **Spec vehicle:** Amend Proactive Compilation v0.2 → v0.3, or a new standalone
   Wiki Agent spec superseding it?
4. **Template page coupling:** Wiki page as *consequence* of template registration,
   or *precondition* for it?
5. **Context gathering:** Is D5 context = suite + specific entity on screen,
   delivered via the floating affordance pattern on every suite surface?
6. **D7 vehicle:** Is the admin-anywhere interface a new host chrome (callable from
   every `/app/*` surface), an extension of Help / `/admin/ai`, or a wiki-agent
   panel? Does “specifications I articulate in that agent session” imply a
   multi-turn chat, or a structured form plus free text?

---

## 5. Deliverables

Grok produces, in order:

1. **Compliance report** — D1–D7 verdict table with evidence, per §2.
2. **Gap list** — every shortfall, ranked by distance from the directive; each gap
   states what exists, what the directive requires, and what stands between them
   (including any cross-tree emit points needed in courses, help, or IKI Lab
   registration).
3. **Draft remediation plan** — sequenced, referencing which open question (§4) each
   step depends on. **The plan is a proposal.** It carries no build authority, seeds
   nothing, and touches nothing until Coach approves it, the resolving decisions
   land in `Architecture/00-decision-log.md`, and the normal spec → review →
   approval chain runs.

## 6. Constraints on the audit itself

- **Read-only.** No file in any tree is created, edited, or deleted by this audit.
  Exercising endpoints for evidence is permitted; mutating state is not (no test
  writes into the production checkout).
- **No scope creep.** The audit answers D1–D7 and nothing else. Adjacent findings
  worth raising go in a separate "observed, out of scope" appendix — one line each,
  no analysis, no fixes.
- **BLOCKING vs. ADVISORY discipline** applies to the gap list: a gap that breaks
  an invariant or the directive is stated as such; a reviewer preference is labeled
  advisory.
