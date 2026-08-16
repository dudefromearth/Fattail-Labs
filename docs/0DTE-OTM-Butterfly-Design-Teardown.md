# 0DTE OTM Butterfly — design teardown (as-built today)

**Date:** 2026-08-15  
**Coach:** **0DTE OTM Butterfly** is the later, harder design (DL-368).
First test is **Batman** (DL-369). This teardown stays — we pick the OTM
fly apart after Batman is locked.  
**This note:** what the product actually contains today, then what is not yet a law.  
Coach Content Law: house text is quoted. Reviewer findings are labeled.

**Sources**

- House card: `server/strategy_packs/packs/butterfly/house_designs.py`  
  key `0dte_otm_classic_butterfly` v1.0.0 · name **0DTE OTM Classic Butterfly**
- Constructor: `construct.py` (`family == "single"`)
- Pack schema: `schema.py`
- Method: Backtest & Forward-Walk v0.2.2 §1a · §5 (atomic fly)

---

## 1. The house card (what is written)

| Field | Today |
|-------|--------|
| Family | `single` (not Batman) |
| Direction | `call` |
| DTE | `0dte` |
| Underlying in pack default | **SPX** |
| Regime tag | `mid_vix` |
| Width style | `variable` |
| Debit / width | **0.04–0.10** |
| Timing | `morning` |
| Max capital at risk | **$500** (dollars) |
| Primary metric | inherited `sortino` |
| Entry style | `otm_classic` |
| Session | `rth_morning` |
| Structure map | `volume_profile` |
| Width from | `morning_iv` |
| Direction from | `structure_bias` |
| Exit | premium-decay trail **on** (mode `rate`, no number) · take-profit **on** (notes only) · time stop **off** · “Do not chase; re-enter only on process signal” |
| Courses | Classic OTM Butterfly · OTM Fly Direction and Width · Profit Management Framework · Classic OTM Butterfly Trade |

House summary: *“Entry: morning IV + structure levels; manage with premium-decay trail.”*

That is a **process pointer**, not a placement algorithm.

---

## 2. What the constructor actually builds

When Design/search runs `construct_structures` for `family=single`:

1. Body centers = **ATM ± 0, 1, 2 strike steps** (`_body_centers`). Not OTM.
2. Widths for `variable` = **4, 6, 8, 10 × strike step** (SPY $1 → 4–10 wide; SPX $5 → 20–50 wide).
3. It emits **many** flies (widths × 5 bodies × call). Ranker picks later.
4. Missing mids fall back toward **1.0** in `_mid` — invents a price (fails OPF / DL-309).
5. Stub chain invents debit from the 4–10% band. Theater.

**India:** `width_from=morning_iv`, `structure_map=volume_profile`, `direction_from=structure_bias`, and `style=otm_classic` are **not read** by the constructor. They are labels.

**Hotel:** A fly whose body is ATM is not an OTM butterfly. The card and the builder disagree.

---

## 3. Pick-apart — not yet rock solid

Labeled **gap** = must become a law before this strategy can be tested honestly on Friday gold.  
Labeled **opinion** = preference, not a block.

### A. Instrument

| # | Today | Gap |
|---|--------|-----|
| A1 | Pack default **SPX** | Friday gold is **SPY 0DTE**. Which underlier is the test? |
| A2 | 0 DTE | Which expiration clock — cash 0DTE that day, AM/PM settle? SPY is PM. |
| A3 | Listed strikes (method) | Constructor does not snap to **listed** chain rows from the gold snap; it arithmetics bodies from spot. |

### B. Placement (the missing “OTM”)

| # | Today | Gap |
|---|--------|-----|
| B1 | Name says OTM | Builder places **ATM**. Define: body how far from spot / from expected move? |
| B2 | `width_from=morning_iv` | No formula. IV of what? ATM? Body? How IV → width in points? |
| B3 | `structure_map=volume_profile` | VP bins are a **different** plane. Which level (VAH/VAL/HVN)? What if no VP for that morning? |
| B4 | `direction_from=structure_bias` | House row is **call**. When does it flip to put? What is “structure bias”? |
| B5 | Debit/width 4–10% | Accept band after placement, or search until inside? What if nothing listed is inside? |

### C. Time

| # | Today | Gap |
|---|--------|-----|
| C1 | `rth_morning` | Window in ET? (e.g. 09:35–11:00?) First gold snap after open? |
| C2 | One entry / day? | Re-entry: house says only on process signal — **what signal**? |

### D. Fills (method already has law)

| # | Today | Gap |
|---|--------|-----|
| D1 | Atomic fly | **Locked** (method §5). Keep. |
| D2 | Debit on per-leg surface | **Locked** (DL-364). Keep. |
| D3 | Retry / abandon | Strategy **scope** for this fly is not written (debit band + time window + still OTM?). |

### E. Management / exit

| # | Today | Gap |
|---|--------|-----|
| E1 | Trail on “premium decay **rate**” | No threshold, no lookback, no “trail to what.” Not executable. |
| E2 | Take profit “when edge is realized” | Not a number. 50% of debit? 80% of max? |
| E3 | Time stop off | Hold to expiry if trail never fires? |
| E4 | “Do not chase” | For the bot: after abandon, **flat for the day**? |

### F. Size

| # | Today | Gap |
|---|--------|-----|
| F1 | $500 max capital at risk | Packages = floor($500 / debit)? What if debit > $500? |

### G. Honesty vs stub

Constructor + Development stub can emit ATM flies and fake debits. **Not this test.** Gold snaps + listed strikes + named failure (NOT TRADED / no fly in scope).

---

## 4. Design process (how we make it rock solid)

Work **one law at a time**. Coach rules. Juliet writes the sentence into §1a (or a child spec). We do not invent numbers.

Suggested order (same as how you trade it):

1. **Underlier + expiration** — SPY vs SPX for the gold week.  
2. **When** — morning window.  
3. **Direction** — always call, or the bias rule in one sentence.  
4. **Where** — how the body is OTM (expected move? VP? fixed points?).  
5. **Width** — morning IV → listed width.  
6. **Accept / reject** — debit/width band; abandon if none.  
7. **Size** — $500 rule as packages.  
8. **Exit** — trail, TP, expiry — each as a checkable sentence.  
9. **Re-entry** — none, or named signal.

Until those nine are sentences, the house card is a **course pointer**, not a testable strategy.

---

## 5. First question for Coach

**A1 — Underlier for this test:** Friday gold and the coming week are **SPY 0DTE** on FatTail2TB. The house card says **SPX**.

Which one is the **0DTE OTM Butterfly** we test first?
