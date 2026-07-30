# Seed JS0-5 — Hotel: Tag scripts trading accuracy

**Project:** p-journal-session  
**Primary:** Hotel  
**Reviewers:** Tango  
**Phase:** J0  
**Prerequisite:** JS0-2 Appendix A tone (co-sign only); scripts owned here

## Goal

1. Approve `pre_market` required set + invalidation priority.  
2. Approve D8 ≤8 questions + trade-log prefill so invalidation not starved.  
3. clean_day / post_session / reflection accuracy for traders.

## Files in scope

- `Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md` (§3 D8, §5.1, §8.4, Appendix A review)  
- `Architecture/00-decision-log.md`  

## Out of scope

Implementation of scripts/validator (J2/J3); Appendix B copy (JS0-2 done); marketing (JS0-6).

## Invariants

- Risk named before opportunity · process outcomes only · no agent advice/stops.  
- Capacity: D8 ceiling not quota · no shame on clean_day “differed”.  
- Never invent invalidation.

## Completion criteria

- [x] Scripts APPROVED | RETURNED  
- [x] D8 APPROVED with Tango  

## Feeds

→ JS0-G · JS2-1 · JS3-1 · JS3-2  

---

## Evidence (2026-07-30 — Hotel JS0-5 · Tango co-sign)

### Verdict: **APPROVED**

### pre_market required set + invalidation: **APPROVED**

| Field | Hotel |
|-------|--------|
| instrument, thesis/direction, trigger/level, size/risk, watching | **PASS** — falsifiable plan ingredients |
| **invalidation** | **PASS · load-bearing** — proves plan wrong / stand-down; member-owned; never agent stop advice |
| Invented levels | **BLOCKED pattern** — “I don’t know” / uncertainty > false precision |
| Same checklist agent + J2 form | **PASS** — Spec §5.1 SoR for JS2-1 |

**Priority when budget tight:** invalidation → trigger/level → thesis → size/risk → watching → instrument (prefill first).

### D8 ≤8 + prefill: **LOCKED · Hotel · Tango APPROVED**

| Rule | Verdict |
|------|---------|
| ≤ 8 **absence** questions per interview phase | **LOCKED** |
| 8 is ceiling **not** quota (no padding) | **Tango PASS** |
| Prefill instrument/size from trade log / prior plan | **PASS** — frees slots for invalidation |
| ≥2 slots reserved for invalidation if still missing | **PASS** |
| Confirmation = one code-owned restatement **outside** the 8 absence budget | **PASS** — restatement must not starve invalidation |
| clean_day cap = 1; reflection cap = 2 | **PASS** |

### clean_day / post_session / reflection: **APPROVED**

| Tag | Hotel accuracy | Tango tone |
|-----|----------------|------------|
| `clean_day` | One process check; No → done; Yes → offer `post_session` new entry — not a mini-retro | No shame on “differed”; not a day grade |
| `post_session` | Member-named deviations; what-worked = member assertion only (≠ retro §) | No P&L hero story |
| `reflection` | Light; does **not** feed §6.5 as pre_market intent | Low load |

### Appendix A: **soft-review PASS** (no text change required)

Checked: absence questions, invalidation ask, no advice, no motive, no P&L, no image vision, “I don’t know” complete, market-hours silence, confirmation restatement. Aligns with §8.4 / D8 as clarified.

### Spec edits this seed

1. D8 → LOCKED  
2. §5.1 pre_market field meanings + invalidation hard rules  
3. §8.4 expanded (D8 table, priority order, trading-accuracy locks)  
4. §19: D1–D8 locked; D9 still proposed  

### Required follow-ons (not RETURN)

| Item | Owner seed |
|------|------------|
| structured_json schema per tag | JS2-1 Alpha · India (Hotel review) |
| Agent script + validator | JS3-1 · JS3-2 |
| Confirmation UI | JS2-2 Charlie · Tango |
| D9 import additive (if not locked elsewhere) | Mike · India (proposed) |
