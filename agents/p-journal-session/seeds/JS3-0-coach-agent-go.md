# Seed JS3-0 — Coach: Agent path GO / DEFER

**Project:** p-journal-session  
**Primary:** Coach  
**Prerequisite:** JS2-G PASS  

## Decision

- [x] **GO** — ship J3 agent interview (product-wide mode; Observer = Navigator)  
- [ ] **DEFER** — residual; form path remains DoD  

**Date:** 2026-07-30  
**Prerequisite met:** JS2-G **PASS** (falsifiable form without LLM already proven)

## GO terms (normative for JS3-1+)

1. **Product-wide agent mode** — not Observer-only and not free no-plan.  
   Config example: `LABS_JOURNAL_AGENT_MODE=local|off` (mirror retro `LABS_RETRO_AGENT_MODE`).  
   **Default off.** When off, agent endpoints **fail loud** (no silent mock).  
   When on, **Observer trial = Navigator** for agent (D6 / DL-128 / DL-127 spirit).

2. **Form remains DoD.** J2 structured form stays the always-available path.  
   Validator double-fail → **J2 form**, never dead partial (Spec §8.2).  
   J3 does **not** block form journaling or J4+.

3. **Attribution D7** — `author=agent`, `agent_service=labs-journal-session`; member owns ACL.  
   Client cannot self-assert agent author.

4. **Depth D8** — ≤8 absence questions; prefill so invalidation not starved; confirmation outside budget.

5. **Appendix A** ships as versioned constant; Hotel/Tango already locked scripts/copy.

6. **No vision model** chart reading; no P&L/motive/advice in agent turns (validator).

7. **Gates still mandatory** — JS3-1…JS3-4 + **JS3-G** with evidence. GO is build authority for J3, not a waived Delta gate.

## Rationale

- Spec v0.2 agent design is locked (Appendix A, D7, D8, §8.2).  
- Form path already delivers falsifiable pre_market (JS2-G) — agent is additive capacity, not a cliff.  
- Stopgap service attribution (D7) is enough to implement without waiting full P2 principals.  
- Default **off** keeps production safe until ops deliberately enable.

## Feeds

→ **JS3-1** Alpha · Mike (interview endpoint + Appendix A constant)
