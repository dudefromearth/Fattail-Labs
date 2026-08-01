# Review — Process Integrity Scoring & Guidance (v0.1 historical + v0.2 draft)

**Date:** 2026-07-31  
**Sources:** Coach-uploaded v0.1 · external review (Claude) · prior bench rewrite v0.2  
**Review posture:** India/Tango/Mike-shaped synthesis for the bench (doctrine principle 10)  
**Build disposition:** **RETURNED** for full-system build · **P0 scoring-only** may proceed only after Coach GO on v0.3  
**Artifact reviewed as-uploaded:** v0.1 (header already SUPERSEDED) — external review correctly noted wrong file / historical status

---

## Bench delta (what the next invocation gains)

1. External review captured as **repo truth**, not chat prose.  
2. Blocking items Claude raised that v0.2 under-weighted are now **FI-008…FI-016** and folded into **Spec v0.3**.  
3. Three-track split is mandatory: **scoring** · **analyst/chat** · **Hard** (separate).  
4. Hard rule: **no conversion-tuned weights**; **floor-support** when scores crash; **no agent profile mutation** without scoped credentials.  
5. SSOT cannot be self-declared by a draft — Journey + decision log hierarchy restated.

---

## Flagged ideas (from this review)

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| FI-008 | Split PI into 3 tracks (score / agent / Hard) | Phase routing; P2 draft; health/legal | Coach + Juliet |
| FI-009 | Scoped agent credentials before any agent writes member data | Mike; open item on admin cookies | Mike + Coach |
| FI-010 | FatTail Hard / True 75 out of scoring SOT; counsel + DPIA | Photos, health data, trademark, disordered-eating risk | Coach + Mike + counsel |
| FI-011 | Floor-support + human escalation on sharp score drop | Tango; inverted “max hardship when fragile” | Tango + Coach |
| FI-012 | Graduation path — when member needs score less | Capacity over dependency | Tango + Coach |
| FI-013 | Firewall: never tune PI weights on conversion | Sales instrument risk | Coach + Sierra |
| FI-014 | Rename scoring config vs entitlement (meter_profile only) | Parallel store of truth | India + Alpha |
| FI-015 | Paraphrase-only research grounding; add FatTail lineage | Copyright + Victor/Whiskey/Yankee | Hotel + lineage |
| FI-016 | Define “floors” or remove; gradeable algorithms + tests | Delta-ready evidence | India + Kilo |

---

## Evaluation of external review (Claude) vs v0.2

| Claude # | Claim | Already fixed in v0.2? | v0.3 action |
|----------|--------|------------------------|-------------|
| Artifact / SSOT self-claim | Correct — v0.1 claimed SSOT | v0.2 softened but still “design SOT” | **No self-SSOT**; hierarchy explicit |
| B1 Phase routing | Strong — agent/Hard not P1 | Phased P0–P3 but agent still in same doc as core | **Three tracks**; agent/Hard non-binding until track GO |
| B2 Agent mutates profile | Strong — Mike block | v0.2 still “staff or agent” optional | **Agents never write scoring/entitlement profile** until scoped identity |
| B3 FatTail Hard business change | Strong — health/photo/trademark | Softened (opt-in) but still in same scoring doc | **Hard out of scoring track**; no composite by default |
| S4 MT gate inverted | Correct for v0.1 | **Fixed** empty-until-enrolled | Keep; restate explainability |
| S5 Max hardship when fragile | Correct for v0.1 §8 | Weak in v0.2 | **Floor-support rule** mandatory |
| S6 Capacity / graduation | Correct | I7 only | **Graduation §** |
| S7 Conversion correlation | Correct | Weak “not P&L” | **Hard firewall** |
| S8 Peer comparison | Partially — contribution board exists | Separation §5 | PI never peer-ranked; contribution stays opt-in board |
| S9 Profile vs role | Correct | Derived from membership | Lock name **`meter_profile`**; not agent-writable |
| S10 Copyright + lineage | Correct | Steenbarger-heavy | Paraphrase-only; FatTail lineage optional frame |
| Fix list (floors, algorithms, tests, owner, Monday) | Correct | Incomplete | v0.3 § algorithms + P0 tests + no Monday full system |

**External review quality:** High. Stronger on Mike/privacy/Hard/legal and Tango floor-support than the first generalist rewrite. Accept nearly all blocks; do not re-litigate MT inversion (already reshaped).

---

## Build disposition

| Track | Disposition |
|-------|-------------|
| **A — Process Integrity scoring** (deterministic meters, weights, tenure) | Eligible for **P0 build GO** after Coach ratifies v0.3 § scoring only |
| **B — Analyst agent + chat** | **BLOCKED** until: phase routing (P2 vs P3/Golf) + scoped agent credentials + Family B tool policy |
| **C — FatTail Hard / True 75 / MT composite** | **PARKED / separate track** — counsel + DPIA before any scoring feed; default **does not** enter PI composite |

---

## Required changes for any build-authority version (satisfied in v0.3)

1. No “single source of truth” self-declaration.  
2. Three-track split with independent GO.  
3. No agent mutation of member entitlement or meter_profile.  
4. Hard out of scoring SOT; no photo/health scoring in PI.  
5. Floor-support + human path on sharp decline.  
6. Conversion firewall on weight tuning.  
7. Gradeable formulas + characterization tests called out for P0.  
8. Capacity / graduation explicit.

---

**End of review.** Spec authority for next draft: `Specs/FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.3.md`.
