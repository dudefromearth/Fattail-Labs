# Spec Creation & Review Workflow
**FatTail Labs — Pre-Implementation Process**

Governs how every significant feature moves from idea to approved specification
**before** any implementation planning or coding begins.

### Purpose
Build the **right thing** correctly the first time — aligned with the approved Spec
lineage, the design system, member needs, and system integrity — before committing
resources to execution.

---

### The Full Workflow (Sequential)

**Phase 0: Intention Capture (Coach)**
Coach states the goal, problem, or desired outcome — as raw as needed. No solutions
yet; just intent and success criteria.

**Phase 1: Spec Drafting (Juliet)**
Juliet produces the first complete Specification Document:
- Problem statement · success metrics / acceptance criteria
- Member experience impact · scope boundaries (in/out)
- Known constraints and risks · high-level flows or wireframes if applicable

**Phase 2: Spec & Architecture Review (India)**
Alignment with approved specs and the decision log; domain-model impact; invariant
compliance; product-boundary check; maintainability.
→ APPROVED or RETURNED with required changes.

**Phase 3: Design & Experience Review (Echo + Tango)**
Echo: visual system, hierarchy, token impact, polish bar.
Tango: member psychology, cognitive load, capacity-over-dependency, copy honesty.
→ Each APPROVED or RETURNED with specifics.

**Phase 4: Domain Review (as applicable)**
Sierra for catalog/SEO/AEO-touching specs; Mike for auth/entitlement/media-security
specs; Foxtrot for infra-touching specs; Hotel for trading-content accuracy; November
for instructional-design / lesson-plan / educational-guidelines specs; Bravo / Romeo /
Papa for research, script, and video-production pipeline specs; Victor / Whiskey /
Yankee for Taleb / Spitznagel / Mandelbrot lineage philosophy and strategy.

**Phase 5: Final Approval (Coach)**
Coach approves the spec version. It lands in `Specs/` as
`<Name>-Spec-vX.Y.md` and becomes immutable. Lima logs the decision.

**Phase 6: Execution Planning (Juliet)**
Only now: decomposition into packets, seeds, and gates in `agents/<project>/`.

---

### Rules

- Skipping phases requires Coach's explicit, logged waiver — never assumed.
- A RETURNED spec goes back to Juliet; reviewers never redraft it themselves.
- Amendments to approved specs are new versions through this same workflow.
