# FatTail Labs — Capital and Position Sizing Spec v0.3

**Status:** DRAFT — for Coach ratification and bench review (not as-built)  
**Date:** 2026-08-09  
**Supersedes:** [v0.2](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.2.md) (and v0.1)  
**Source proposals:** [`docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_2.md`](../docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_2.md)  
**Review:** Advisor review 2026-08-09 (C-1…C-8) folded  

**Companions (normative where noted):**

| Spec | Role |
|------|------|
| [Funding Spec v0.2](./FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md) | **Owns** balance vs trading curves and **master-DD comparison arithmetic** |
| [Staleness Spec v0.1](./FatTail-Labs-Staleness-Awareness-Spec-v0.1.md) | Declared-number as-of / two clocks |
| [Top-Level Account Amendment](./FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md) | No ledger; undirected stamps |
| Trade Log / Identity / Strategy Lab | Consumers of accounts; not capital owners |

**Doctrine:** Umpire · no second store · Sacred #8 · Family B · config fail-loud · no MSC.

---

## 0. Mission

Position size is **solved** from capital + tolerated drawdown. Three rings: total net capital → campaign allocation (composed) → size. Fungible accounts until organized. Identity-level **Accounts & Capital**. Practice and Strategy Lab consume; neither owns.

---

## 1. Laws

| ID | Law |
|----|-----|
| **C1 — Two ceilings** | Net-capital soft; buying power hard only as source posture allows. |
| **C2 — No invented blocks** | Platform does not stop fills on own authority. |
| **C3 — Three rings** | Total net capital ⊃ allocation ⊃ solved size. |
| **C4 — No second store** | Total net capital and master DD **derived at read** from starting balances + fill history + **cash movements** (balance side) and fill history alone (trading side) — per Funding Spec. |
| **C5 — Campaign-blind master** | Master DD never joins campaign stamps. Arithmetic: **Funding Spec §3**. |
| **C6 — Fungible sources** | Accounts fungible until organized; wrap/proportion = funding only. |
| **C7 — Funding ≠ direction** | Wrap does not stamp. |
| **C8 — Size is solved** | Informs; never auto-fills. |
| **C9 — Identity owns accounts** | Sole account write path: Accounts & Capital. |
| **C10 — Fills factual** | Immutable `account_id`; campaign stamp optional. |
| **C11 — Quiet witness** | Overcommit, master DD, sizing — umpire register. |

---

## 2. Two ceilings

| Ceiling | Behavior |
|---------|----------|
| Net-capital (intent) | Soft, witnessed |
| Buying power (reality) | Hard when live; self-declared + staleness when self-report |

---

## 3. Three rings

### 3.1 Ring 1 — Total net capital

Per [Funding Spec v0.2](./FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md) §3.1:

```
current_balance = starting_balance + Σ fill P&L + Σ cash movements
total_net_capital = Σ current_balance
```

| Curve | Definition | Use |
|-------|------------|-----|
| **Balance** | start + fills + movements | Ring 1, overcommit, tolerance budget base |
| **Trading** | **Σ fill P&L only** (starts at 0) | Realized master DD dollars |

Account is top level (no furniture campaign).

### 3.2 Ring 2 — Campaign allocation + composition

| Mode | Semantics (crisp — Advisor C-6) |
|------|--------------------------------|
| **Wrap one** | Campaign capital claim = **100% of that account’s balance** (live or snapshot per OD-5) — **no partial share** |
| **Wrap many** | Claim = sum of whole balances of named accounts |
| **Proportion** | Claim = **stated portions** ($ and/or %) from one or more accounts |

Partial share of one account is **proportion**, not wrap-one.

**Wrapping = capital-sourcing only.** Membership = stamp only.

### 3.3 Ring 3 — Solved size

Denominator = composed allocation. Hotel formula TBD. Inform only.

---

## 4. Drawdown

### 4.1 Master drawdown — **points to Funding Spec §3.4**

Do **not** re-derive percentage-of-peak vs percentage-of-capital here.

- **Realized DD dollars** on trading curve (fill P&L only).  
- **Tolerance budget dollars** from declared tolerance × (or =) total net capital.  
- Witness when realized $ > budget $.  

Hotel signs Funding §3.4 before Kilo freezes.

### 4.2 Per-campaign latitude

Scales with allocation size (small → wider, large → tighter). Free-form vs prescribed bands: OD-1.

### 4.3 Layers

Campaign-blind (real money) vs campaign (interpretive practice).

---

## 5. Witnesses and buying power

| ID | Test |
|----|------|
| W-Overcommit-total | Σ claims vs total_net_capital |
| W-Overcommit-source | Claim vs source balance — **snapshot wraps only** if OD-5 is snapshot; live-tracking wraps: claim tracks balance, overcommit-source may not fire (OD-5 blast radius) |
| W-Master-DD | Per Funding §3.4 |
| W-Campaign-size | Fill vs solved size / position-size band |

Buying power: after size; postures arbitrary / self-report / live-queued. Staleness Spec for as-of.

---

## 6. Accounts & Capital

Users menu; identity-owned. Blocks: accounts, balances, movements, BP, tolerated master DD, portfolio witnesses, staleness chrome. Practice/Lab consume only.

---

## 7. Data model (indicative)

```
Identity
  ├── capital_prefs
  │     tolerated_master_drawdown   # value
  │     tolerated_master_drawdown_form  # 'percent' | 'dollars'  (OD; Advisor C-5)
  │     buying_power_posture | value | as_of
  ├── Account[]
  │     starting_balance | …
  │     └── Trade[]
  │     └── CashMovement[]          # Funding Spec
  └── Campaign[]
        └── FundingComposition[]
              mode: wrap_one | wrap_many | proportion
              account_id | amount? | pct?
              # OD-5: tracking 'live' | 'snapshot' (+ snapshot_at, snapshot_amount)
```

---

## 8. Phasing

| Phase | Scope |
|-------|--------|
| **P0** | Ratify **Funding v0.2 with or before** Capital v0.3; Amendment; DL |
| **P1** | Accounts & Capital shell; move CRUD |
| **P2** | Ring 1 + curves + master-DD $ witness |
| **P3** | Composition + overcommit (respect OD-5) |
| **P4** | Latitude + solved size |
| **P5** | BP arbitrary + self-report (**after** Staleness Spec) |
| **P6** | Live BP sync |

---

## 9. Open dispositions

1. Allocation→latitude bands  
2. Solved-size UX  
3. Hotel sizing formulas  
4. Composition $ / % hybrid  
5. **Wrap tracking: live vs snapshot** — blast radius: W-Overcommit-source, Staleness §4.2 claim-age (Advisor C-7). Decide with both in view.  
6. Import null stamp (Amendment)  
7. Funding F-5: starting balance as first movement  

---

## 10. Non-goals

Enforcement under net-capital · platform margin engines · campaign-aware master DD · second equity SoR · profit theater · auto-fill size · product-owned accounts · ledger capital home  

---

## 11. Acceptance

1. No Practice account write path.  
2. Total net capital = hand sum including movements.  
3. Master DD dollars unchanged by deposit/withdrawal alone; new-account start does not step trading curve.  
4. Overcommit total/source (snapshot) quiet.  
5. Wrap does not stamp.  
6. Product independence on Accounts & Capital.  
7. Solved size never writes qty alone.  
8. No profit-claim chrome.  

---

## 12. Review gates

| Holder | Focus |
|--------|--------|
| **Hotel** | Funding §3.4 + latitude/size formulas |
| **India** | Composition; OD-5; schema form flag |
| **Tango** | Fungibility / undirected / quiet |
| **Echo** | Accounts & Capital UI |
| **Mike** | Live BP; Family B |
| **Kilo** | §§11 + Funding §§10 |
| **Lima** | Ratification cluster DL |

---

## 13. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.3** | 2026-08-09 | Advisor C-1…C-8: DD $ meeting point via Funding; trading curve fill-only; C4+movements; wrap-one crisp; neutral tolerance field; OD-5 blast radius; version unified. |
| **v0.2 / v0.2.1** | 2026-08-09 | Fungibility, composition, Funding/Staleness links. |
| **v0.1** | 2026-08-09 | Initial. |

---

*Accounts are money. Campaigns are optional stories. Size falls out of what you refuse to lose — compared in dollars, not two mismatched percentages.*
