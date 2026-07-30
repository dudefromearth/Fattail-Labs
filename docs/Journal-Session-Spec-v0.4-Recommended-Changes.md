# Journal Session Spec v0.4 — Recommended Doc Changes

**Date:** 2026-07-30  
**Audience:** Coach · Claude (spec revision) · India · Juliet  
**Source Spec (original):** [`Specs/FatTail-Labs-Journal-Session-Spec-v0.4.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0.4.md)  
**Successor Spec:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0.4a.md`](../Specs/FatTail-Labs-Journal-Session-Spec-v0.4a.md) — **accepted for plan authority**  
**Board:** [`agents/p-journal-session-v04/`](../agents/p-journal-session-v04/)  
**Supersedes for product intent:** v0.2 BUILD AUTHORITY (as-built program complete under wrong product frame)  
**Status of this note:** Advisory. Largely **absorbed into v0.4a**. Not build authority.

---

## 0. How to use this document

1. **Claude / India:** Fold the accepted edits into a revised Spec (likely still v0.4 if still draft, or v0.5 if GO-era).  
2. **Coach:** Resolve §3 open decisions before labeling BUILD AUTHORITY.  
3. **Juliet:** After GO, reseed a **new** board (`p-journal-session-v04` or similar). Do not reopen the closed v0.2 program as continuous.

**Product thesis of v0.4 is approved in evaluation** — recommended changes are hygiene, honesty, under-specification, and cross-doc consistency. They are not a reversion to form-primary.

---

## 1. Executive verdict

| Dimension | Verdict |
|-----------|---------|
| Product direction | **Correct.** Chat primary; structured pass optional; phase is the gate; one seal = retrospective complete. |
| Spec quality | **Strong draft.** Needs honesty about as-built, agent runtime, entitlement edge, and §20 item 9 before GO. |
| Feasibility | **High** for model + UI; **medium** for real interlocutor agent (LLM). Reuse substrate; rewrite product shape. |
| Relationship to v0.2 program | **Complete and superseded.** Treat as scaffolding + characterization patterns, not product truth. |

---

## 2. Recommended edits inside Spec v0.4

Apply these to `Specs/FatTail-Labs-Journal-Session-Spec-v0.4.md` (or the next version that absorbs them).

### 2.1 Header / status block

| Change | Why |
|--------|-----|
| Keep **DRAFT** until Coach GO + named gates. Do not re-label BUILD AUTHORITY without gates. | Doctrine: waived gates are a violation. |
| On GO, status line should name: Spec version, GO date, board path, residual open items (if any remaining). | Readers need one place of truth. |
| Fix supersession line if a Session **v0.3** file never landed in repo: either add a one-line “v0.3 lived as interim draft only” or supersede **v0.2 only** with an explanation of v0.3 themes absorbed. | Avoid ghost-version confusion. |

### 2.2 §3 As-built (critical honesty fix)

**Current problem:** Table still reads “No agent chat” / early dual-read posture. That is **false** on `main` after the v0.2 program (sessions, local agent, form UI, media, export, date closures).

**Replace §3 with a truthful as-built table**, for example:

| Today on `main` (post v0.2 program) | v0.4 target |
|-------------------------------------|-------------|
| Calendar + Trade Log day-book | Unchanged shell; sessions attach to calendar date |
| `member_journal_sessions` + messages + phase (hard-coded RTH) | Same substrate; phase from **market calendar config** (fail loud) |
| Single primary **tag** required; tag drives scripts/UI chips | Tags multi, optional, context-only; no logic reads tags |
| Status `open \| partial \| sealed`; member seal path | Status `open \| closed` only; seal **only** on retrospective complete |
| Structured form default / always-on surface | Structured pass **member-invoked only** |
| Local checklist agent + **depth caps** + form_fallback framing | Dialog agent; no depth budget; once-only absences; degrade to **plain text** |
| Intraday “silent” = weak/unavailable UX | Always reachable; **no unprompted** questions during RTH; answers if member writes |
| Private media + export `journal_session` + date closures (retro complete) | Align closure set to §12 decision; keep private media rules |
| Dual-read `member_tool_notes` | Dual-read until Lima cutover |

**Migration rule stays:** never synthesize invalidation/level/size the member did not write.

**Add one sentence:** “v0.2 program (`agents/p-journal-session/`) is **complete under a superseded product frame**. Reuse infrastructure; do not ship v0.4 as a small patch on v0.2 UX.”

### 2.3 §7 / §9 / §10 — Agent runtime (under-specified)

§10 is a real interlocutor prompt. As-built is a **local checklist**. Spec must state the runtime contract.

**Add a new subsection (suggested §7.0 or §9.0):**

```markdown
### Agent runtime (config, fail loud)

LABS_JOURNAL_AGENT_MODE = local | llm | off

- **local** — deterministic, no external model: may only raise absence
  probes once per absence key, never runs a tag script, never depth-caps.
  Suitable for tests and offline. Cannot fully satisfy “member leads.”
- **llm** — external model with §10 system constant; trade-log context
  injected by code; validator runs before render.
- **off** — agent turns 503 fail-loud; **member plain-text chat remains
  fully available** (primacy rule). Never degrade the primary surface.

Default for product: **llm** when credentials present; **local** only as
explicit interim or test. Missing/invalid config fails loud at agent turn
time; never silent no-op.

Provider binding is operational (see agent model interface / SpaceXAI
skill); Spec owns mode enum and fail-loud behavior, not vendor lock-in.
```

**Also edit:**

| Location | Change |
|----------|--------|
| §7.1 | Keep “always reachable.” Clarify: unreachable agent ≠ unavailable journal (plain text). |
| §7.2 | State **once-only absence keys** are code-enforced (set of raised field keys per session), not prompt hope. |
| §9.2 | Rename degradation target: **plain-text capture**, not “form fallback.” Form is unrelated to validator failure. |
| §10 | Keep constant name; note `V1` amends only via Tango+Hotel + Spec bump. If local mode ships, say local **does not** invent free dialogue that pretends to be LLM. |

### 2.4 Entitlement (header vs free no-plan)

**Current:** “Entitlement: none… no plan check anywhere.”

**Problem:** Identity model still has free authenticated users with no plan. Practice create elsewhere uses activator+ / observer trial.

**Recommended wording:**

```markdown
**Entitlement:** Journal access is identical for Observer trial, Activator,
and Navigator (D6 parity — term differs, features do not). There is **no
Journal-specific tier gate** among those three.

**Authenticated free (no plan):** no Journal **create** (same as other
Practice create surfaces). Read of empty state / membership CTA only.
(Confirm or override at Coach GO — do not leave implicit.)
```

### 2.5 Parent citations (pin heads)

| Bad pattern in draft | Fix |
|----------------------|-----|
| Mix of Retrospective **v0.4 §6.5**, **v0.5 §4.1**, **v0.6** | Pin: **as-built head = Retrospective v0.6**; product locks for gather/scope from **v0.5** where still authoritative; §6.5 expected-vs-actual semantics as cited in v0.6 / v0.5 as applicable. One table of “cite this version for that topic.” |
| Journey §4.1 / §4.1a / §4.4 | Keep; mark §6.5 routine amendment as **cross-spec decision-log** against Journey v1.0. |

Suggested parent table (near header):

| Doc | Use for |
|-----|---------|
| Retrospective **v0.6** | As-built lifecycle, report honesty |
| Retrospective **v0.5** | Gather Option C, scope_end, complete hooks |
| Journey Experience **v1.0** | Cadence meter, profiles; routine keying amendment if adopted |
| Practice Export **v1.1** | Portability parent; version bump required for multi-tag / status |
| Trade Log **v1.1** | Day-book context for agent |
| Member Data Privacy **v0.1** | Family B |
| Agent Model Interface / AI stack (as-built) | LLM provider binding |

### 2.6 §12 Date closure + §20 item 9 (blocking)

**Do not leave item 9 open at BUILD AUTHORITY.**

Recommend Coach + India pick one and write it as LOCKED language in §12:

| Option | Meaning | Trade-off |
|--------|---------|-----------|
| **A. Scope-true (recommended)** | Close only dates **actually in the retrospective’s reviewed scope** | Matches audit rationale; gap dates may stay open indefinitely |
| **B. Gather-simple** | Close whole NY dates **strictly before gather date** | Simpler; may seal days nobody reviewed |

**Also specify in §12:**

- Session rows: set `status=closed`, `closed_by_retrospective_id`, `closed_at`.  
- Date-level refusal table may remain (`member_journal_date_closures`) if useful for 409 without scanning sessions — say whether both exist and which is SoR.  
- Gather date stays open (keep).  
- Permanent; no admin reopen for non-demo (keep).  

**Completion warning (§13)** must use the **same set** as §12 (named dates + open session count).

### 2.7 §6.3 / status vocabulary

| Change | Why |
|--------|-----|
| Explicit migration: `sealed` → `closed`; `partial` → `open` (or closed if policy says “left incomplete after seal” — pick one). | Implementers need a single map. |
| State: **no member-facing seal control** in v0.4 product. If API retains a deprecated seal for one release, mark deprecated and non-DoD. | Avoid two seal mechanisms. |
| Completeness is not a status (keep). Remove any residual “incomplete boolean” language if still present elsewhere. | |

### 2.8 §5 Tags / §11 retrospective tag

| Change | Why |
|--------|-----|
| API sketch: `tags: string[]` optional on create/patch; empty allowed. | |
| `retrospective` is the **only** tag with side effects (navigation). List those side effects as the exhaustive set. | Prevent “smart tags” creep. |
| UI: day entry is **“Start conversation”**, not a row of script chips that imply tag-required create. Suggested vocabulary may appear as **optional** filters/labels. | Product primacy. |

### 2.9 §8 Market calendar

| Change | Why |
|--------|-----|
| Require config table (or config file with fail-loud boot) for RTH hours, holidays, half-days. | Spec already says this; as-built hard-codes 09:30–16:00. |
| Define interim: **forbidden** at BUILD AUTHORITY unless Coach explicitly accepts interim hard-code with sunset. Prefer calendar in J1. | Fail-loud doctrine. |
| `off_session` rules already good — keep. | |

### 2.10 §16 Schema sketch

| Change | Why |
|--------|-----|
| Drop single-column `tag` from sessions row (already join table) — ensure no ambiguity. | |
| Add optional `closed_by_retrospective_id`, `closed_at` on session (if not only on date_closures). | Matches §12. |
| Note: export_key, dual-read notes unchanged. | |
| Mention absence-raised tracking: either column `absence_raised_json` or derived from agent message metadata — **code must enforce once-only**. | §7.2 |

### 2.11 §17 Implementation slices

| Change | Why |
|--------|-----|
| Keep inverted order (agent before structured). | Correct. |
| Split **J2** into **J2a** (contract: mode, validator, plain-text degrade, no-unprompted RTH, once-only) and **J2b** (LLM path). | Spec honesty; shipability. |
| Add **J0** explicitly: Coach GO + §20 locks + as-built honesty + new board. | |
| Note: v0.2 board COMPLETE — new board for v0.4. | |

Suggested slice table:

| Slice | Deliverable |
|-------|-------------|
| **J0** | Spec GO, §20 locks, decision log, new board |
| **J1** | Schema migration + chat capture + calendar config + dual-read |
| **J2a** | Agent contract (mode, validator, degrade-to-text, RTH rules, once-only) |
| **J2b** | LLM agent + trade-log context |
| **J3** | Multi-tag + quick-confirm |
| **J4** | Optional structured pass |
| **J5** | Media polish (paste primary); closed-date refuse |
| **J6** | Retrospective tag routing; leave open; no auto-gather |
| **J7** | Single seal on retro complete; complete warning; 409 paths |
| **J8** | Export/import/purge + export Spec bump |
| **J9** | Journey routine keying + as-built Spec honesty + program close |

### 2.12 §18 Capacity / profile

Keep. Clarify:

- Agent **reads** `process.profile` from journey scores; never **writes** meters.  
- Density taper is prompt/config guidance, not a second score table.  
- Member-facing ratio: never.

### 2.13 §19 Verification

Add explicit cases:

- Agent off → member text still works.  
- Validator double-fail → plain text, session remains open.  
- No depth budget: agent may not refuse turns solely for “8 questions used.”  
- RTH: no unprompted agent question without prior member message that turn.  
- Closure set matches G0 choice; complete warning lists same dates.  
- Transcript-only entry is valid.  
- Multi-tag entry gathers without depending on tags.

### 2.14 §20 Open items

| # | Recommendation |
|---|----------------|
| 1 Routine meter | Keep owner India+Tango; promote to LOCKED or “ship with DL against Journey v1.0” before J9. |
| 2 Image P&L collapse | Tango; can residual after J5 if not blocking chat. |
| 3 Private media | Largely as-built; Mike confirms store design remains. |
| 4 is_demo | Largely as-built (mig 051); lock immutability enforcement tests. |
| 5 Export bump | Required with multi-tag + status; India+Alpha. |
| 6 Agent principals interim | Mike+Coach: **recommend ship interim** (`agent_service` + member session ACL) with DL exception until P2. |
| 7 free_observer | Keep closed. |
| 8 Retro v0.6 | Keep closed; fix cites. |
| **9 Closure keying** | **Must LOCK before GO** — recommended **Option A (scope-true)**. |

### 2.15 §23 Decision-log entry (template fix)

| Change | Why |
|--------|-----|
| Title: **Journal Session v0.4**, not v0.3. | Copy error. |
| Name single seal, chat primary, optional structured, phase gate, agent runtime modes, closure keying choice, interim agent attribution. | On GO paste. |
| Reference this supersession of v0.2 program. | Institutional memory. |

### 2.16 §22 Non-goals

Add explicitly:

- Tag-driven interview scripts  
- Interview depth budgets  
- Member seal as product lifecycle  
- Form as default or required path  
- Vision-model chart reading (already)  
- Reopening closed dates for members (already)

---

## 3. Related docs to update (same body of work as Spec bump)

| Doc | Recommended change |
|-----|-------------------|
| `Architecture/00-decision-log.md` | On GO: DL entry from §23 (corrected). On start of implementation: note v0.2 program superseded for product authority. |
| `agents/p-journal-session/ORCHESTRATOR.md` | Banner: **PROGRAM COMPLETE under Spec v0.2 — product authority superseded by Session Spec v0.4+.** No new seeds against v0.2. |
| `agents/p-journal-session/CHARTER.md` | Same supersession note; point to new board when created. |
| **New** `agents/p-journal-session-v04/` (after GO) | CHARTER · IMPLEMENTATION-PLAN · seeds from revised Spec slices J0–J9. |
| `Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md` | Header: **SUPERSEDED for product by v0.4** (or later). Keep as historical as-built of the first program. |
| Journey Experience v1.0 | If §6.5 routine keying ships: amendment note / DL; characterization tests. |
| Member Practice Export Spec | Version bump when multi-tag + `open\|closed` export. |
| Retrospective complete UI / Spec cites | Complete warning (§13) may need a small retro Spec note or DL so complete UX is not “Journal-only tribal knowledge.” |

Do **not** silently edit Retro v0.6 product locks without India.

---

## 4. As-built → v0.4 gap (for Spec appendix or board plan)

Optional short appendix in the Spec (recommended) so implementers do not rediscover:

| Keep (substrate) | Kill / rewrite (product) |
|------------------|---------------------------|
| Sessions + messages + attribution | Tag-as-script create UI |
| Phase derivation core | Depth caps |
| Private media ACL | Member seal / partial status product |
| Date closure hook on retro complete | Form-default layout |
| Export surface hooks | form_fallback as primary degradation story |
| Dual-read notes | Local checklist pretending to be §10 interlocutor |
| Validator block classes | Intraday “agent unavailable” UX |

---

## 5. Open decisions for Coach GO (checklist)

Print-ready agenda. Spec should not become BUILD AUTHORITY until these are marked LOCKED (or explicitly residual with owner).

| ID | Decision | Recommended default |
|----|----------|---------------------|
| **G0-1** | Product thesis v0.4 GO | **GO** |
| **G0-2** | Closure keying §20.9 | **Scope-true (Option A)** |
| **G0-3** | Agent modes `local\|llm\|off` | Ship enum; product default **llm** when configured else fail-loud / local interim |
| **G0-4** | Free no-plan create | **No create** (Practice parity) |
| **G0-5** | Agent principals interim | **Ship** with `agent_service` + member ACL + DL |
| **G0-6** | Migration map partial/sealed | `sealed→closed`, `partial→open` |
| **G0-7** | Market calendar | Config table in J1; no silent hard-code at GO |
| **G0-8** | New board | **Yes** — do not extend closed v0.2 board |

---

## 6. Implementation plan (for Juliet after GO)

Summary only; full evaluation lived in session review. Do not start before G0.

```
J0  Spec GO + locks + DL + new board
J1  Schema/status/tags migration + chat shell UI + calendar config
J2a Agent contract (mode, validator, plain-text degrade, RTH, once-only)
J2b LLM path + trade-log context
J3  Multi-tag + quick-confirm + retro route (leave open)
J4  Optional structured pass (member-invoked)
J5  Media paste polish
J6  Retro navigation polish + no auto-gather
J7  Single seal + complete warning aligned to G0-2
J8  Portability + export Spec bump
J9  Journey routine + program close + Spec as-built honesty
```

**Critical path:** G0-2 → J1 → J2a → J7.  
**Member-visible value path:** J1 + chat UI + J2.

**Team sketch:** Alpha (domain/API/agent), Charlie+Echo (chat-primary UI), Mike (auth/media/agent interim), India (schema/closure/migration), Tango+Hotel (§10 + warnings), Kilo/Delta (tests/gates), Lima (DL/docs).

---

## 7. Explicit non-recommendations

Do **not** change v0.4 back toward:

- Form or interview as primary  
- Required tag before write  
- Depth budgets  
- Day-seal + retro-seal dual mechanism  
- Silent agent off with “use the form” as the only path  
- Agent as coach / P&L narrator / vision reader  

Do **not** mark Spec BUILD AUTHORITY by converting §20 into “Coach defaults” without named owner sign-off (v0.2 failure mode the draft already criticizes).

---

## 8. Suggested commit message for Spec revision (when Claude applies)

```
docs(spec): Journal Session v0.4 honesty + agent runtime + GO locks prep

- Truthful as-built vs v0.2 program
- Agent mode enum; degrade to plain text
- Entitlement free no-plan clarity
- Pin retrospective parent cites
- Closure keying decision language (or keep open only pre-GO)
- Slice table J0/J2a/J2b; fix §23 version string
```

---

## 9. Document history

| Date | Author | Note |
|------|--------|------|
| 2026-07-30 | Grok (Coach-facing evaluation) | Initial recommendations for Claude Spec pass |
| 2026-07-30 | Grok | **v0.4a absorbed** most items; multi-agent plan filed under `agents/p-journal-session-v04/` |

### Absorbed into Spec v0.4a

As-built honesty §3 · agent runtime §7.0 · plain-text degrade · migration map ·  
scope-true §12.1 · slices J0/J2a/J2b · non-goals · parent cite table · primacy language ·  
once-only code · Start conversation copy · absence_keys schema.

### Residual hygiene (v0.4a still DRAFT)

- Dual heading `### 12.1` (closure set + demo accounts)  
- §19 J7 wording still says “before gather” in one place — SoR is §12.1 scope-true  
- §23 title says “v0.4” not “v0.4a”  
- A few “Retrospective v0.4 §6.x” cites remain; use parent table  
- §20 items 1–6, 9–12 still need GO locks (item 9 recommended LOCK, not formal until Coach)
