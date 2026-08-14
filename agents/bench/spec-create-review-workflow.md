# Spec Creation & Review Workflow
**FatTail Labs — Pre-Implementation Process**

Governs how every significant feature moves from idea to approved specification
**before** any implementation planning or coding begins.

### Purpose
Build the **right thing** correctly the first time — aligned with the approved Spec
lineage, the design system, member needs, and system integrity — before committing
resources to execution.

### Twin duties (both mandatory)

| Duty | Meaning |
|------|---------|
| **Protect the system** | **Block** only when invariant, law, or system integrity breaks (doctrine §11.4). |
| **Strengthen the bench** | Every review/draft **leaves a durable delta** (doctrine principle 10). |

### Coach Content Law (doctrine §11 — non-negotiable)

1. **Nothing of Coach’s is removed** from specs/drafts/summaries. Objections sit
   **beside** the text, labeled as the reviewer’s, for Coach to accept or discard.  
2. If the agent **changed or dropped** Coach content, say so **up front** — not only in
   a changelog.  
3. **Research before questioning** — read sources; no priors as conclusions.  
4. **Blocking ≠ opinion.** Risk language may not promote a disagreement into a constraint.
   Opinions are labeled opinions.

Reviews may delay **implementation sequencing**. They may **not** erase Coach product
scope. See **§ Bench delta & idea flags** below.

---

### Two lanes (do not collapse them)

| Lane | Artifact | Bar | Full multi-agent gauntlet? |
|------|----------|-----|----------------------------|
| **Thesis / idea** | Raw Coach intent, product memo, DRAFT design | Capture value; flag risks | **No** — light pass (India/Tango *notes* only) |
| **Build authority** | Versioned Spec after Coach Phase 5 | Safe to implement | **Yes** — sequential gates |

A file in `Specs/` is not automatically build authority. Header **Status** must say
`THESIS`, `DRAFT`, or `BUILD AUTHORITY` / `Approved for build`.

---

### The Full Workflow (Sequential) — Build Authority path

**Phase 0: Intention Capture (Coach)**  
Coach states the goal, problem, or desired outcome — as raw as needed. No solutions
required yet; intent and success criteria. **All of this is preserved** even if later
phases change scope.

**Phase 1: Spec Drafting (Juliet)**  
Juliet produces the first complete Specification Document:
- Problem statement · success metrics / acceptance criteria
- Member experience impact · scope boundaries (in/out)
- Known constraints and risks · high-level flows or wireframes if applicable
- Explicit **Ideas inventory**: every non-trivial idea from Phase 0 (and prior memos)
  listed as `IN-SCOPE` · `FLAGGED` · `DEFERRED` — never omitted silently

**Phase 2: Spec & Architecture Review (India)**  
Alignment with approved specs and the decision log; domain-model impact; invariant
compliance; product-boundary check; maintainability.  
→ **APPROVED** or **RETURNED** for *build readiness* — plus required **§ Flagged ideas**  
  (see verdict shape below).

**Phase 3: Design & Experience Review (Echo + Tango)**  
Echo: Apple HIG for Labs web, tokens, control grammar, interactive design, hierarchy, polish bar (see `echo.md`).  
Tango: member psychology, cognitive load, capacity-over-dependency, copy honesty.  
→ Each **APPROVED** or **RETURNED** for build — plus **§ Flagged ideas** (never “kill this idea”).

**Phase 4: Domain Review (as applicable)**  
Sierra for catalog/SEO/AEO-touching specs; Mike for auth/entitlement/media-security
specs; Foxtrot for infra-touching specs; Hotel for trading-content accuracy; November
for instructional-design / lesson-plan / educational-guidelines specs; Bravo / Romeo /
Papa for research, script, and video-production pipeline specs; Victor / Whiskey /
Yankee for Taleb / Spitznagel / Mandelbrot lineage philosophy and strategy.  
→ Same rule: block **build** where needed; **flag** ideas for discussion.

**Phase 5: Final Approval (Coach)**  
Coach approves the **build-authority** spec version. It lands in `Specs/` as
`<Name>-Spec-vX.Y.md` and becomes immutable for that version. Lima logs the decision.  
Coach also disposes **open flags** (see Discussion protocol) or explicitly leaves them
OPEN for a later cycle.

**Phase 6: Execution Planning (Juliet)**  
Only now: decomposition into packets, seeds, and gates in `agents/<project>/`.  
Seeds may only implement **IN-SCOPE** build-authority items. Flagged/deferred ideas
are **not** deleted from the Ideas inventory or the flag register.  
Spec BUILD is not an implement/deploy GO. A packet starts only when
`agents/go/<ID>.md` exists and `scripts/require_go.py --id <ID>` exits 0
(doctrine §10c · DL-328).

---

## Bench delta & idea flags (constitutional)

### Rule (primary)
**Every substantive review or draft leaves the bench stronger** (doctrine principle 10).  
Minimum: one durable delta — decision note, charter/seed fix, test, gate learning, or
flagged idea. Pure chat is incomplete.

### Rule (ideas)
Ideas are never discarded as if they never existed. They are **flagged**, **discussed**,
and **ADOPTED / DEFERRED / PARKED / RESHAPED**. “Not this ship” ≠ “forget it.”

### Required section on every review verdict

```markdown
## Up front (required if true)
If this pass changed or dropped anything Coach wrote: list it here first.

## Bench delta
What the next invocation gains (1–5 bullets).

## Coach content intact?
Yes — all Coach text retained; objections (if any) are inline / labeled next to source.
OR: No — [list what was removed] ← **violation unless Coach ordered it**

## Blocks (invariant | law | system only)
…

## Opinions / recommendations (not blocks — Coach may discard)
…

## Flagged ideas (if any)
| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| FI-… | … | … | Coach + … |

## Build disposition
APPROVED | RETURNED (implementation readiness only — not product deletion)
```

If no new flags: `Flagged ideas: none — inventory intact.`  
Bench delta is still required (what did we learn?).

### Ideas inventory (in the draft/build spec)

Juliet lists non-trivial Phase 0 ideas as `IN-SCOPE` · `FLAGGED` · `DEFERRED` ·
`ADOPTED` · `PARKED` · `RESHAPED→…` — never `DISCARDED`.

### Flag register
[`Architecture/flagged-ideas.md`](../../Architecture/flagged-ideas.md) — index of open
and disposed flags. Lima/Juliet update on Coach disposition.

### Discussion
Flag → Coach + Juliet (+ guardian) discuss → Coach disposes → register/log updated.
Guardians do not unilaterally erase ideas.

### Thesis lane
`THESIS` memos: light notes + flags + bench delta; no build GO. Full gates when Coach
asks for build authority.

---

### Rules

- Skipping phases requires Coach's explicit, logged waiver — never assumed.  
- A RETURNED **build** goes back to Juliet; reviewers never redraft the full spec
  themselves — they **must** leave Bench delta (+ flags when relevant).  
- Amendments to approved specs are new versions through this same workflow.  
- **Bench growth overrides convenience.** A clean RETURN with no learning is a failure.  
- Delta judges **implementation evidence**. Deferred ideas are not FAIL if correctly
  out of seed scope — but the gate report should still name the learning if any.
