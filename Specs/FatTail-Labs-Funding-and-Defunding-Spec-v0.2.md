# FatTail Labs — Funding and Defunding Spec v0.2

**Status:** DRAFT — for Coach ratification and bench review (not as-built)  
**Date:** 2026-08-09  
**Supersedes:** [Funding Spec v0.1](./FatTail-Labs-Funding-and-Defunding-Spec-v0.1.md)  
**Source proposal:** [`docs/FatTail-Labs-Funding-and-Defunding-Proposal-v0_1.md`](../docs/FatTail-Labs-Funding-and-Defunding-Proposal-v0_1.md)  
**Review:** Advisor review 2026-08-09 (F-1…F-6) folded  
**Parent / companion:** [Capital Spec v0.3](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md)  
**Also companion:** [Staleness Spec v0.1](./FatTail-Labs-Staleness-Awareness-Spec-v0.1.md) · [Top-Level Account Amendment](./FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md)  

**Type:** Product / architecture authority — cash movements; **owns the balance vs trading curve definitions and master-DD comparison arithmetic** (Capital §4.1 points here)

**Purpose:** Close the balance-chain hole. Deposits/withdrawals keep balances true without corrupting drawdown.

---

## 0. Mission

**A cash movement is a fact about the account, not a trading outcome.** Recorded as first-class facts; **excluded** from the trading curve so drawdown stays honest.

---

## 1. Laws

| ID | Law |
|----|-----|
| **F1 — Movement is not P&L** | Cash movements never enter the **trading curve**. |
| **F2 — Balance includes start + fills + movements** | Current balance = starting balance + Σ fill P&L + Σ cash movements. |
| **F3 — Trading curve is fill P&L only** | Trading curve (all accounts, netted) = **Σ realized fill P&L**, chronological. Starts at **zero**. Starting balances and cash movements are **balance-curve only** (Advisor C-2/F-2). |
| **F4 — Master-DD comparison (dollars at the meeting point)** | Realized DD **dollars** (trading curve) vs tolerance budget **dollars** (from balance-side capital) — see §3.4. One definition for Capital + Funding. |
| **F5 — Member-recorded** | Platform never infers bank/broker movements (v1). |
| **F6 — Append-only** | Corrections via **reversal entries**, not amount UPDATEs. |
| **F7 — Backdating lawful** | Lag is staleness (Staleness Spec). |
| **F8 — No cascade** | Fund/defund never auto-edits allocations, pauses campaigns, or blocks trades. |
| **F9 — Sole write path** | Movements only on Accounts & Capital. |
| **F10 — Neutral register** | Withdrawal is life, not variance. |
| **F11 — No second store** | Both curves derived at read time. |
| **F12 — Witnesses are display-only** | Capital-layer witnesses (overcommit, master DD line) are **derived at read** — not append-only witness event logs that backdating would rewrite (Advisor F-4). |
| **F13 — Retired fills remain** | Retired account fills stay on the trading curve forever (Advisor F-3). |

---

## 2. Cash-movement entry

### 2.1 Schema (indicative — India)

| Field | Meaning |
|-------|---------|
| `id` | Stable identity |
| `identity_id` | Family B |
| `account_id` | Which book |
| `amount` | Signed: **+** deposit; **−** withdrawal |
| `occurred_at` | When it happened (member; backdatable) |
| `recorded_at` | When entered (system) |
| `note` | Optional member text |
| `export_key` | Pack / Family B |
| `reverses_movement_id` | Optional counter-entry link |

### 2.2 Discipline

- Append-only + reversal (decision-log style).  
- **Zero amount → 422** is **input validation**, not variance enforcement and not a trade-path umpire breach (Advisor F-6).  
- No approval, no modal, no purpose judgment.  

### 2.3 Surface

Accounts & Capital only.

---

## 3. Arithmetic (authoritative for Capital Spec)

### 3.1 Current balance (Ring 1 / balance curve)

```
current_balance(account) =
    starting_balance
  + Σ realized_pnl(fills on account)
  + Σ cash_movements(account)

total_net_capital = Σ current_balance(accounts)   # includes retired? see §4.1
```

Active books dominate the live total; India: whether archived accounts remain in Σ until zeroed by final defund — **proposal: include until zeroed, then optional exclude from live total but fills stay on trading curve**.

### 3.2 Two curves

| Curve | Formula | Used for |
|-------|---------|----------|
| **Balance curve** | start + fill P&L + **movements** (per account → sum) | What the trader *has*: Ring 1, overcommit, capital context, **tolerance budget denominator** |
| **Trading curve** | **Σ fill P&L only** (all accounts netted by time; **no** starting balances; **no** movements) | How the trader *traded*: **realized master DD dollars** |

| Kilo | Must hold |
|------|-----------|
| Withdrawal ≠ drawdown | Balance drops; trading curve unchanged by movement |
| Deposit ≠ recovery | Balance rises; trading DD not healed |
| New account mid-history ≠ recovery | Adding account starting balance must **not** step the trading curve (F3) |
| Retired fills remain | Archive does not erase trading-curve history |

### 3.3 Why trading curve excludes starting balances (Advisor C-2/F-2)

A mid-history **new account** with starting balance S would otherwise inject +S into a “start + fills” curve — false recovery. Starting balances are capital **facts** (like cash already held), not trading outcomes. They belong on the **balance curve only**.

**Optional unification (India OD — Advisor F-5):** model starting balance as the account’s **first funding movement**. Then F3 falls out: trading curve never sees starts. Cost: migrate existing `starting_balance` fields. Keep/kill for India.

### 3.4 Master drawdown — comparison basis (Advisor C-1/F-1) **LOCKED pending Hotel sign-off**

**Problem avoided:** comparing % of trading-peak to % of balance-total (mismatched denominators after cash moves).

**Normative comparison (dollar meeting point):**

1. **Realized drawdown dollars** (trading curve only):  
   - `cum(t) = Σ fill P&L through t` (all accounts)  
   - `peak(t) = max cum so far`  
   - `dd_dollars(t) = peak(t) − cum(t)` (≥ 0)  
   - `realized_dd_dollars = max_t dd_dollars(t)`  

2. **Tolerance budget dollars** (balance curve, as-of now):  
   - If tolerance form is **percent**:  
     `tolerance_budget_dollars = (tolerated_master_drawdown_value / 100) × total_net_capital`  
   - If form is **absolute dollars**:  
     `tolerance_budget_dollars = tolerated_master_drawdown_value`  

3. **Witness W-Master-DD:**  
   - Quiet line when `realized_dd_dollars > tolerance_budget_dollars`  
   - Optional display of both sides: *“Trading drawdown $X vs budget $Y (Z% of capital)”*  
   - **Not** `realized_dd_dollars / trading_peak` compared to `Z%` without converting to dollars first.

**Hotel** must sign this definition before Kilo characterization freezes. Capital Spec §4.1 **points here** and does not redefine.

### 3.5 Tolerated master drawdown form (open)

| Disposition | Proposal |
|-------------|----------|
| Default | **Percentage** of total net capital (balance) |
| Optional | Absolute dollars |
| Schema | Neutral field + form flag — see Capital Spec (not `_pct` only) |

---

## 4. Effects by layer

### 4.1 Account

- Balance true **if** movements recorded; bank gap = staleness.  
- **Retirement:** final defunding to zero; **fills remain on trading curve forever** (F13). Soft gate on open charters.  

### 4.2 Campaign

| Event | Behavior |
|-------|----------|
| Member changes allocation mid-season | Lawful; signed → amendment (as-of). **Proposal:** unsigned also as-of dated (OD). |
| Source withdrawn below claim | Per-source overcommit, quiet; no block |
| Source retired | Claim historical; witness; no auto-edit |

No cascade to campaign status or trade 4xx.

### 4.3 Trade / sizing / BP

- Solved size uses **declared** allocation; source-drift = witness + staleness.  
- Broker BP remains hard wall when money is gone.  

---

## 5. Overcommit

| Witness | Test | Note |
|---------|------|------|
| **Total** | Σ claims vs total_net_capital | Balance curve |
| **Per-source** | Claim on A vs A’s current balance | **Snapshot wraps only** for “claim ≠ live balance”; live-tracking wraps (Capital OD-5) make claim track balance — per-source overcommit may not fire by construction (see Capital OD-5 blast radius) |

Witnesses: **derived-at-read display only** (F12).

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
| `GET/POST /api/me/accounts/{id}/movements` | List / append |
| `POST .../movements/{id}/reverse` | Counter-entry helper (optional) |
| Capital overview | Both curves; master-DD dollars vs budget |

---

## 7. Phasing

| Phase | Scope |
|-------|--------|
| **F0** | Ratify **with or before** Capital (Funding owns curve + DD math) |
| **F1** | Movement table + UI |
| **F2** | Curves + master-DD dollar comparison in overview |
| **F3** | Per-source overcommit; retirement final defund |
| **F4** | Pack/export movements |

---

## 8. Non-goals

- Bank auto-import (v1)  
- Spending judgment  
- Auto-cascade  
- Stored equity SoR  
- Movements as trades/stamps  
- Stored capital-witness event ledger (unless India explicitly reopens F12)  

---

## 9. Open dispositions

1. Tolerance default % vs $ vs choice (§3.5) — Coach  
2. Unsigned allocation change always as-of? (**proposal: yes**)  
3. Both curves shown vs witnesses only — Echo  
4. Reversal UX  
5. **Starting balance as first movement** — India F-5  
6. Live total_net_capital: include archived zeroed accounts?  

---

## 10. Acceptance

1. Deposit: balance up; `realized_dd_dollars` unchanged by deposit alone.  
2. Withdrawal: balance down; `realized_dd_dollars` unchanged by withdrawal alone.  
3. New account with start S + no fills: trading curve flat; balance +S.  
4. Reversal restores balance path; both rows kept.  
5. Backdated movement: recompute balances as-of; **no** rewinding of stored witness events (none).  
6. Per-source overcommit after withdraw under snapshot claim.  
7. Retired account: fills still affect trading-curve peak/trough.  
8. Zero-amount POST → 422 validation only.  
9. No auto allocation shrink.  
10. No movement write outside Accounts & Capital.  

---

## 11. Review gates

| Holder | Question |
|--------|----------|
| **Hotel** | **Sign §3.4 dollar meeting point**; fill-P&L-only trading curve |
| **India** | Schema; F-5 unification; F12; retired inclusion |
| **Tango** | Neutral copy |
| **Echo** | Curves / movements UI |
| **Kilo** | §§10 + new-account / retire cases |
| **Lima** | Balance-chain + arithmetic lock DL |

---

## 12. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.2** | 2026-08-09 | Advisor review: trading curve = fill P&L only; master-DD **dollar comparison**; retired fills permanent; witnesses display-only; 422 = validation; F-5 note. |
| **v0.1** | 2026-08-09 | Initial Spec from proposal. |

---

*Money in and out is life. P&L is trading. Master drawdown meets tolerance in dollars — never two percentages on two worlds.*
