# Advisor Review — Strategy Lab Backtest & Forward-Walk Method v0.2.2

**Date:** 2026-08-15  
**Artifact:** [`Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md`](../Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md)  
**Prior file:** [`Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2.md`](../Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2.md)  
**Status of artifact:** DESIGN (header still says “v0.2”). **Not BUILD AUTHORITY.**  
**Reviewers:** **India** (spec / architecture / build readiness) · **Hotel** (trading-domain)  
**Coach Content Law:** nothing of Coach’s is removed. Objections sit beside the text, labeled as the reviewer’s.

Related: DL-364 · PB-MODE-0 (Position Builder Spec v0.3 §0.2) · OPF14 · SSR thesis (DL-318) · FI-026 · FI-027  
Bench copy: [`agents/bench/reviews/2026-08-15-backtest-forward-walk-v0_2_2-india.md`](../agents/bench/reviews/2026-08-15-backtest-forward-walk-v0_2_2-india.md)

---

## Verdict

| Gate | Verdict |
|------|---------|
| **India — build readiness** | **RETURNED.** Still DESIGN. The method is not vetoed. The document is not lock-ready. |
| **Hotel — trading claims** | **APPROVED as method teaching.** Atomic flies, per-leg vol/skew, Monte Carlo as a distribution, split frictions. No reckless “would have made” number. |

Do not implement from this file.

---

## What v0.2.2 adds (keep)

§2 now names the engine as the **existing Options Lab Analyzer per-leg-vol surface modeler**, running in backtest / forward-walk against the captured tape. It cites **PB-MODE-0**: one surface, mode selects pack family, no side-door engine.

That is the right join. Not a second pricer.

## What v0.2.2 dropped (restore beside the new paragraph)

Current `v0_2.md` (after Coach 2026-08-15 + **DL-364**) has Coach sentences that v0.2.2 does not:

- The surface used for **determining fills** is the Options Lab surface.
- It is **per-leg volatility** driven, so it **correctly builds skew**.
- No second surface. No flatten-vol / single-IV / VIX-as-all-legs sheet for fills.
- §5.1: fill debit is **on that surface**.

v0.2.2 looks forked from **pre-DL-364** v0.2, then a new §2 paragraph was added. **Fold both.** Do not replace Coach’s words with the PB-MODE-0 arrangement.

---

## Findings

### R1 — Versioning (required)

Filename is `v0_2_2`. Title is still “v0.2 (DESIGN)”. Two files share the same H1. New version = new versioned identity.

**Required fold:** H1 says **v0.2.2 DESIGN**. `Supersedes` names `v0_2.md`. Document history.

### R2 — PB-MODE-0 is real; the stretch is labeled **opinion**

PB-MODE-0 lives in Position Builder Spec v0.3 §0.2: Analyzer is one surface; outlook and backtest/forward-walk are **modes of that surface**; mode selects pack family; no silent borrow of another mode’s model.

**Opinion (India):** applying that as **engine law** for the Strategy Lab runner is correct. It is not the same as “the backtester **is** the Analyzer UI.” Strategy Lab Development is the consumer. Analyzer remains the day-trader surface. Same modeler, different host.

### R3 — Pack-family tension (required to name before lock)

| Source | Says |
|--------|------|
| PB-MODE-0 / OPF13 | Backtest mode uses the **backtest** pack family. No silent borrow of `day_trade` guarantees. |
| Coach / DL-364 | Fill surface = Options Lab **per-leg vol** sheet (`day_trade.mark_hybrid` model_t0). |
| OPF as-built | `backtest.chain_replay` (default) · `backtest.surface_reconstruct` (flat / weak — **not** Coach’s sheet). |

These do not contradict if the build **registers a backtest pack** that applies the **same per-leg modeler** to gold snapshots. They **do** contradict if code runs `day_trade.mark_hybrid` in backtest mode, or if it uses `surface_reconstruct` for fills.

**Not a block of Coach’s method.** A named pack + one sentence in §2 / §9. Flag **FI-026**.

### R4 — “Historical as-of deferred to Strategy Lab (2026-08-11)”

Searched Analyzer Spec v0.2.1, Position Builder v0.3, OPF v0.2.1, and DL-289–308. **No sentence** “historical as-of path deliberately deferred to Strategy Lab.” Closest: OPF L5 / NX out of foundation (DL-290); PB-MODE-0 names backtest as a mode that is not as-built.

**India:** cite the OD/DL or drop the date-claim. Coach may confirm from memory; the bench cannot treat an uncited date as law.

### R5 — SSR v0.1 / Arch 31 / stub (opinion + flag)

v0.2 already “supersedes v0.1 explainer where they differ.” SSR Spec + Arch 31 are still THESIS (DL-318). Development still ships `_stub_backtest_metrics`. v0.2.2 does not say this method **is** the measurement and stub is not.

**Opinion:** one sentence. Gold/silver + Options Lab surface **is** the method. SSR thesis either folds in or is marked superseded for Strategy Lab measurement. Two live method docs is parallel-implementation risk. Flag **FI-027**.

### R6 — Scoring §6 (Hotel + Tango-shaped, not a block)

Coach: the bot is a member; same compass; Journey as marketplace resume. **Keep.** Retro Reporting Standards v0.1 is still DRAFT. When wired, Journey stays **process standing**, not a P&L scoreboard. “Un-fakeable provenance” is Coach’s; display must not become a profit claim.

---

## Hotel — claim check

| Claim | Hotel |
|-------|--------|
| Butterflies atomic / never one-leg | **Correct.** The complex order is the unit. |
| Per-leg vol → skew is real | **Correct.** Flat vol lies about the wings. |
| Tape fixed, fills stochastic, MC distribution | **Correct.** A single path is not a backtest. |
| Operator friction ≠ market fill friction | **Correct.** Coach’s book calibrates operator only. |
| Silver labeled not the standard | **Correct.** Honest placeholder. |
| Fill = package debit | **Correct** if the debit is on the per-leg sheet. |

No Hotel block.

---

## Not blocked (Coach’s method stands)

Gold vs silver · 3D surface updated by ticks · MC hundreds–thousands · two frictions · atomic fly · retry / scope abandon / exits · bot-as-member · seeded runs · brokerage then adapter · open items in §9.

---

## Required to become lock-ready

Juliet folds; Coach rules. Hotel re-check is unnecessary unless scoring copy grows profit language.

1. Header **v0.2.2 DESIGN**. Supersedes `v0_2.md`. Document history.
2. Restore Coach / DL-364 sentences in §2 and §5.1 **beside** the new Analyzer / PB-MODE-0 paragraph.
3. Name the backtest pack: same per-leg modeler, archive tape, not `surface_reconstruct`, not silent `day_trade` use-case.
4. Cite or drop the 2026-08-11 as-of sentence.
5. One sentence: Development stub is not this method.

---

## Bench delta

Next invocation knows: v0.2.2’s Analyzer / PB-MODE-0 join is the right engine law; it must be **merged with** DL-364, not swapped for it; pack-family must be named; the 2026-08-11 as-of cite is unfound.

## Flagged ideas

| ID | Idea | Status |
|----|------|--------|
| [FI-026](../Architecture/flagged-ideas.md) | Named OPF **backtest** pack = Options Lab per-leg modeler on gold archive (no silent day_trade borrow; not flat reconstruct) | `OPEN` |
| [FI-027](../Architecture/flagged-ideas.md) | One measurement method — fold or supersede SSR thesis for Strategy Lab; stub remains named theater | `OPEN` |
