# FatTail Labs — Funding and Defunding Spec v0.1

**Status:** **SUPERSEDED** by [Funding Spec v0.2](./FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md) (advisor review fold — curve + master-DD arithmetic).  
**Date:** 2026-08-09  
**Source proposal:** [`docs/FatTail-Labs-Funding-and-Defunding-Proposal-v0_1.md`](../docs/FatTail-Labs-Funding-and-Defunding-Proposal-v0_1.md)  
**Parent / companion:** [Capital Spec v0.3](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md)  
**Also companion:** [Staleness Awareness Spec v0.1](./FatTail-Labs-Staleness-Awareness-Spec-v0.1.md) · [Campaign Amendment — Top Level Is the Account](./FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md)  

**Type:** Product / architecture authority — cash movements on accounts, balance vs trading curves, campaign funding/defunding effects  

**Purpose:** Close the **balance-chain hole**. Without deposits and withdrawals, Ring 1 (total net capital) drifts from reality and master drawdown is **distorted** (a withdrawal reads as trading drawdown that never happened).

---

## 0. Mission

**A cash movement is a fact about the account, not a trading outcome.** Deposits and withdrawals change what the trader *has*; they say nothing about how the trader *traded*.

The model records movements as first-class facts (balances stay true) while keeping them **out of the performance / trading curve** (drawdown stays true). One fact, two ledgers of meaning — never blurred.

---

## 1. Laws

| ID | Law |
|----|-----|
| **F1 — Movement is not P&L** | Cash movements never enter the trading curve used for master drawdown. |
| **F2 — Balance includes movements** | Current balance = starting balance + Σ fill P&L + Σ cash movements. |
| **F3 — Member-recorded** | Platform never infers bank/broker movements (v1). Member states them. |
| **F4 — Append-only** | Corrections via **reversal entries**, not in-place edit of amount/history. |
| **F5 — Backdating lawful** | `occurred_at` may be past; lag is a staleness fact (Staleness Spec). |
| **F6 — No cascade** | Account fund/defund never auto-shrinks allocations, pauses campaigns, or blocks trades. |
| **F7 — Sole write path** | Movements entered only on **Accounts & Capital** (account fact surface). |
| **F8 — Neutral register** | A withdrawal is life, not variance. No judgment chrome. |
| **F9 — No second store** | Both curves derive at read time from starting + fills + movements. |

---

## 2. Cash-movement entry

### 2.1 Schema (indicative — India)

| Field | Meaning |
|-------|---------|
| `id` | Stable identity |
| `identity_id` | Family B |
| `account_id` | Which book |
| `amount` | Signed: **+** deposit / funding; **−** withdrawal / defunding |
| `occurred_at` | When the movement happened (member-stated; backdatable) |
| `recorded_at` | When entered (system clock) |
| `note` | Optional member text ("rolled IRA", "paid tuition") |
| `export_key` | Pack / Family B |
| Reversal link | Optional `reverses_movement_id` for counter-entries |

### 2.2 Discipline

- **Append-only + reversal** (decision-log style): mistaken +5000 is fixed by a −5000 reversing entry, not UPDATE of the original amount.  
- No approval workflow, no modal, no platform characterization of purpose.  
- Zero amount rejected (422).  

### 2.3 Surface

Accounts & Capital only — account detail or dedicated movements list under that surface. **Not** Trade Log blotter as a trade. **Not** a campaign amendment by itself (see §4 for allocation changes).

---

## 3. Corrected arithmetic

### 3.1 Current balance (Ring 1)

```
current_balance(account) =
    starting_balance
  + Σ realized_pnl(fills on account)
  + Σ cash_movements(account)
```

```
total_net_capital = Σ current_balance(accounts)
```

Capital Spec Ring 1 **must** use this formula after this Spec ratifies.

### 3.2 Two curves (critical)

| Curve | Formula | Used for |
|-------|---------|----------|
| **Balance curve** | starting + fills P&L + **movements** | What the trader *has*: Ring 1, overcommit denominators, capital context |
| **Trading curve** | starting + fills P&L only (**movements excluded**) | How the trader *traded*: **campaign-blind master drawdown** |

| Kilo characterization | |
|------------------------|--|
| Withdrawal ≠ drawdown | Balance drops; trading-curve peak/trough unchanged by the movement |
| Deposit ≠ recovery | Balance rises; trading-curve drawdown not healed by cash in |

Master drawdown (Capital Spec §4.1) is computed **only** on the **trading curve**.

### 3.3 Tolerated master drawdown

Tolerance is declared against total net capital (balance-side), which **breathes** with movements.

| Open disposition | Proposal |
|------------------|----------|
| Default form | **Percentage** of total net capital (scales with balance) |
| Optional | Absolute dollars for traders who think that way |
| Coach | Confirm default % vs $ vs member choice |

---

## 4. Effects by layer

### 4.1 Account

- Balance always reconstructible **if** movements are recorded; gap to bank reality is **staleness** (companion Spec).  
- **Retirement:** residual balance closed by a final **defunding** movement to zero (story closes; history retained). Soft gate on open **charters** unchanged (Campaign Spec).  

### 4.2 Campaign — funding and defunding seasons

Same vocabulary extends to allocations with provenance (Capital Spec: wrap / proportion):

| Event | Behavior |
|-------|----------|
| Member raises/lowers allocation mid-season | Lawful. Signed charter → **amendment** (as-of). Witnesses re-evaluate as-of. |
| Source account withdrawn below claimed portion | **Witnessed, never blocked** — per-source overcommit quiet line |
| Source account retired mid-campaign | Claim remains historical fact; witness shows source gone; member may amend funding or leave variance |

**Nothing cascades automatically.** Defunding an account never auto-edits allocations, never pauses campaigns, never 4xx on trade create.

### 4.3 Trade / sizing / buying power

- Solved size uses **declared** allocation numbers (deterministic); source-drift is the honesty mechanism (witness + staleness), not silent recompute of intent.  
- If money is truly gone, **broker buying power** remains the hard wall. Movements explain *why* balances moved; they are not a second enforcement layer.

---

## 5. Overcommit (sharpened)

| Witness | Test |
|---------|------|
| **Total** | Σ campaign claims vs total net capital (balance curve, as-of) |
| **Per-source** | Campaign claim on account A vs A's current balance (after movements) |

Both: quiet register; as-of evaluation (balance breathes).

---

## 6. Data model & APIs (indicative)

```
member_account_cash_movements
  id, identity_id, account_id
  amount, occurred_at, recorded_at
  note, reverses_movement_id, export_key
```

| API | Role |
|-----|------|
| `GET/POST /api/me/accounts/{id}/movements` | List / append (Accounts & Capital) |
| `POST .../movements/{id}/reverse` | Counter-entry helper (optional) |
| Capital overview | Recomputes both curves |

No bank/broker import of movements in v1 (future inherits live-sync OD + Mike gate).

---

## 7. Phasing

| Phase | Scope |
|-------|--------|
| **F0** | Ratify; DL balance-chain correction |
| **F1** | Movement table + Accounts & Capital UI entry |
| **F2** | Balance + trading curve split in capital overview / master DD |
| **F3** | Per-source overcommit after movements; retirement final defund |
| **F4** | Pack/export of movements (Family B) |

Depends on: Accounts & Capital surface (Capital Spec P1); starting balances.

---

## 8. Non-goals

- Bank/broker auto-import of cash movements (v1)  
- Spending judgment or categorization taxonomy as platform moral frame  
- Auto-cascade movements → allocations / campaign status / trade blocks  
- Storing precomputed equity series as SoR  
- Treating movements as Trade Log “trades” or campaign stamps  

---

## 9. Open dispositions (Coach)

1. Tolerance default: **%** vs **$** vs member choice (§3.3).  
2. Unsigned campaign allocation change: silent edit vs always as-of dated (**proposal: always as-of**).  
3. Accounts & Capital: show **both curves** distinctly vs witnesses only (Echo after Coach instinct).  
4. Reversal UX: explicit reverse button vs freeform counter-entry only.  

---

## 10. Acceptance (post-ratification)

1. Deposit + fills: balance = start + pnl + deposit; master DD **ignores** deposit.  
2. Withdrawal: balance drops; master DD **unchanged** by the movement alone.  
3. Reversal undoes balance effect; history retains both rows.  
4. Backdated movement recomputes as-of history correctly (Kilo).  
5. Per-source overcommit fires when withdrawal leaves claim > balance.  
6. No auto allocation shrink on withdrawal.  
7. No movement entry path outside Accounts & Capital.  
8. Copy never frames withdrawal as process variance.  

---

## 11. Review gates

| Holder | Question |
|--------|----------|
| **India** | Schema; append-only; both curves derivable |
| **Hotel** | Trading-curve DD; withdrawal≠DD; deposit≠recovery |
| **Tango** | Neutral movement copy; quiet overcommit |
| **Echo** | Movement entry UI; curve presentation |
| **Kilo** | §§10 characterization |
| **Lima** | Balance-chain DL entry on ratification |

---

## 12. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.1** | 2026-08-09 | Formal Spec from funding/defunding proposal: cash movements, balance vs trading curves, no cascade, campaign source-drift. |

---

*Money in and out is life. P&L is trading. Never confuse the two on the master curve.*
