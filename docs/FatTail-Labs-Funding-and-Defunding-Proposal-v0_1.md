# FatTail Labs — Funding and Defunding Proposal

**Formal Spec (review):** [`Specs/FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md`](../Specs/FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md)  
**Status:** DRAFT v0.1 — advisor proposal for bench review and Coach ratification  
**Date:** 2026-08-09  
**Parent:** Capital model / [Capital Spec v0.2](../Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.2.md)  
**Companion:** [Staleness Awareness Spec v0.1](../Specs/FatTail-Labs-Staleness-Awareness-Spec-v0.1.md)  
**Purpose:** Close the balance-chain hole. Current balance is defined as starting balance + fills, but real accounts also receive **deposits** and suffer **withdrawals** — external cash movements that are not fills. Without them, Ring 1 drifts from reality and the master drawdown is distorted (a withdrawal reads as a drawdown that never happened). This document proposes the cash-movement model, its arithmetic, and its effects at every layer.

---

## 1. The principle

**A cash movement is a fact about the account, not a trading outcome.** Deposits and withdrawals change what the trader *has*; they say nothing about how the trader *traded*. The model must therefore record them as first-class facts (so balances stay true) while keeping them **out of the performance curve** (so drawdown stays true). One fact, two ledgers of meaning — and the model must never let them blur.

---

## 2. The cash-movement entry

A new entry type on the **Accounts & Capital** surface (the sole write path for account facts, per the capital model §5a):

| Field | Meaning |
|---|---|
| `account_id` | Which account |
| `amount` | Signed: positive = deposit / funding; negative = withdrawal / defunding |
| `occurred_at` | When the movement happened (member-stated; may be backdated) |
| `recorded_at` | When it was entered (system) |
| `note` | Optional, member-authored ("rolled IRA in", "paid tuition") |

- **Member-recorded, umpire-witnessed.** The platform never infers movements; the member states them. No approval, no modal, no judgment — a withdrawal is life, not variance.
- **Append-only with reversal entries**, not edits — same discipline as the decision log. A mistaken entry is corrected by a counter-entry, preserving the honest history.
- **Backdating is lawful** (people record late) and is exactly the staleness surface the companion document covers.

## 3. The corrected arithmetic

### 3.1 Current balance (Ring 1, corrected)

> **current balance = starting balance + Σ fills P&L + Σ cash movements**

Total net capital remains the accumulation across accounts — now true even when money enters or leaves.

### 3.2 The master drawdown computes on the trading curve, not the balance curve

Two distinct curves per the principle in §1:

| Curve | Formula | Used for |
|---|---|---|
| **Balance curve** | starting + fills + movements | What the trader *has*: Ring 1, overcommit denominator, buying-power context |
| **Trading curve** | starting + fills only (movements excluded) | How the trader *traded*: the campaign-blind **master drawdown** |

A $20k withdrawal drops the balance curve and correctly tightens the overcommit witness — but it does **not** register as drawdown, because no trading lost that money. Conversely a deposit must never *mask* a real drawdown by refilling the balance curve. The master drawdown lives on the trading curve, which cash cannot touch. (Kilo characterization: withdrawal ≠ drawdown; deposit ≠ recovery.)

### 3.3 Interaction with tolerated master drawdown

The trader's tolerance is declared against total net capital, which now breathes with movements. Proposal: tolerance is a **percentage** by default (so it scales with the balance automatically), with an absolute-dollar option for traders who think that way. Open disposition for Coach.

## 4. Effects at each layer

### 4.1 Account level

- Balance is now always reconstructible and always true — *if* movements are recorded. The gap between reality and record is a staleness fact, handled by the companion document.
- **Account retirement** (archive-not-delete) with a residual balance is naturally expressed as a final defunding movement — the account's story closes at zero without deleting history.

### 4.2 Campaign level — funding and defunding *campaigns*

The same vocabulary extends upward: since allocations have provenance (wrap one / wrap many / proportion), a campaign is **funded** by its sources and can be **defunded** — deliberately by the member (reducing an allocation mid-season) or *effectively* by reality (a source account is drawn down or defunded beneath the campaign's claim).

| Event | Model behavior |
|---|---|
| Member reduces/increases an allocation mid-season | Lawful. On a signed charter this is an **amendment** (existing amendment law); as-of dated; the Journey and witnesses evaluate as-of |
| Source account withdrawn below the campaign's claimed portion | **Witnessed, never blocked**: the campaign's claim now exceeds its source — a per-source overcommit line in the quiet register ("Campaign X claims $30k from Account A; Account A holds $22k") |
| Source account retired mid-campaign | The claim survives as a historical fact; the witness shows the source gone; member resolves by amending funding — or doesn't, and the variance line simply persists |

**Nothing cascades automatically.** Defunding an account never auto-shrinks an allocation, never pauses a campaign, never blocks a trade. Effects are shown; resolution is the member's. (Umpire, throughout.)

### 4.3 Trade level

- Solved size reads the campaign's allocation, which may now be stale against its defunded sources — the witness at 4.2 is the honesty mechanism; the size math itself stays deterministic on the declared numbers.
- Buying power already handles the hard edge: if defunding means the money truly isn't there, the broker's wall is the wall. The platform's movements ledger explains *why*; it never becomes a second enforcement layer.

## 5. Explicit non-goals

- **No bank/broker integration for movements** in this proposal — member-recorded only. (A future broker sync could import movements; that inherits the live-sync OD and Mike's gate.)
- **No spending judgment.** The platform never characterizes a withdrawal. `note` is member-authored or absent.
- **No automatic cascades** from movements to allocations, campaigns, or trades.
- **No second store**: both curves derive from starting balances + fills + movements at any time.

## 6. Open dispositions (Coach)

1. Tolerance as percentage (default) vs. absolute dollars vs. member choice (§3.3).
2. Whether a mid-season allocation change on an *unsigned* campaign is a silent edit or also as-of dated (proposal: always as-of dated; cheap and honest).
3. Whether the Accounts & Capital surface shows the two curves distinctly (balance vs. trading) or only their witnesses. Echo question after Coach's instinct.

## 7. Gates

| Gate | Holder | Question |
|---|---|---|
| Architecture | India | Entry type schema; append-only + reversal discipline; derivability of both curves |
| Trading accuracy | Hotel | Trading-curve drawdown definition; withdrawal≠drawdown, deposit≠recovery |
| Member psychology | Tango | Movement entry copy is neutral (a withdrawal is life, not variance); per-source overcommit lines in quiet register |
| Tests | Kilo | Both-curves characterization; backdated movement recompute; retirement-as-final-defunding |
| Decision log | Lima | Balance-chain correction entry, same day as ratification |
