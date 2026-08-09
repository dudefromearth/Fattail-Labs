# FatTail Labs — Capital and Position Sizing Spec v0.1

**Status:** **SUPERSEDED** by [Capital and Position Sizing Spec v0.2](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.2.md) (fungibility + funding composition + top-level account companion).  
**Date:** 2026-08-09  
**Source proposal:** [`docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_1.md`](../docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_1.md) (Coach-dictated model 2026-08-09; Advisor draft)  
**Type:** Product / architecture authority — identity-level capital hierarchy, Accounts & Capital surface, position-size solving, Practice ↔ Strategy Lab product independence  

**Sits beside (does not replace):**

| Spec | Relationship |
|------|----------------|
| [Member Campaign Spec v1.3](./FatTail-Labs-Member-Campaign-Spec-v1_3.md) | Campaigns stay account-free; this Spec supplies the capital hierarchy campaign process clauses size against. Campaign allocations and per-campaign drawdown latitude live here (campaign-blind layer + Ring 2/3). |
| [Trade Log Spec v1.1](./FatTail-Labs-Trade-Log-Spec-v1.1.md) | Fills still stamp immutable `account_id`. Account **management** moves off Practice chrome to identity-level Accounts & Capital (§6). Trade Log **consumes** accounts; does not own them. |
| [Identity / Access Spec](./FatTail-Labs-Identity-Access-Spec-v1.0.md) | Accounts & Capital attaches to the Labs **identity** (users menu), not to a product entitlement. |
| Strategy Lab specs | Lab reads the same identity-level accounts/capital; neither Practice nor Lab owns the write path. |

**Doctrine inheritance:** Umpire (witness, never force) · no second store of truth · Sacred #8 (no profit theater) · Family B · config fail-loud · no MSC shared code.

---

## 0. Mission

Position size is not picked; it is **solved**. The trader declares how much they refuse to lose (tolerated drawdown). Size falls out of holding that drawdown against the right capital denominator.

Capital is three nested rings:

1. **Total net capital** — derived, real, campaign-blind  
2. **Campaign allocation** — declared intent (slice of the whole pool)  
3. **Position size** — solved output  

Above campaigns sits one sovereign soft constraint — **master drawdown** on the one real netted equity curve — and one hard gate — **buying power** (broker reality, not platform judgment). Everything under the net-capital ceiling is **witnessed, never enforced**.

**Product independence:** Practice and Strategy Lab are to be independent products (sold separately or bundled). Anything both need lives at **identity level**. Accounts & Capital is that surface: both products consume it; **neither owns it**.

---

## 1. Laws

| ID | Law |
|----|-----|
| **C1 — Two ceilings** | Net-capital (intent) is soft forever. Buying power (broker reality) is the only hard gate — hardness inherited from the trader’s chosen source posture (§5). |
| **C2 — Platform never invents a block** | The platform does not stop a fill on its own authority. It may refuse to **lie** about money that does not exist (buying power honesty). |
| **C3 — Three rings** | Total net capital ⊃ campaign allocation ⊃ solved position size. Each ring is the denominator for the ring inside it. |
| **C4 — No second store** | Total net capital and master drawdown are **derived** from account starting balances + trade history at read time. No parallel stored equity series as system of record. |
| **C5 — Campaign-blind master** | Master drawdown is measured on the **aggregate equity curve of all accounts**, as if campaigns never existed. Joining campaign stamp tables to compute it is a defect. |
| **C6 — Account freedom preserved** | Campaign allocations slice **total** net capital, not a single account’s book. Aligns with Campaign Spec L5 (charters account-free). |
| **C7 — Size is solved** | Inputs = capital denominator + tolerated drawdown (and Hotel-ratified formula). Output = recommended size. Informs; never auto-fills or enforces. |
| **C8 — Identity owns accounts** | Account create / name / starting balance / retire lives only on **Accounts & Capital**. Practice and Strategy Lab consume accounts; leftover practice-side write paths are **blocking** parallel-path defects. |
| **C9 — Fills stay factual** | Every trade keeps immutable `account_id`. Redirect moves campaign stamps only (Campaign Spec L6); accounts never move. |
| **C10 — Quiet witness register** | Capital overcommit, master drawdown, and sizing variance use the same quiet umpire register as campaign bounds — no modal, no shame chrome, no 4xx on the log path. |

---

## 2. The two ceilings

| Ceiling | Kind of truth | Behavior |
|---------|---------------|----------|
| **Net-capital ceiling** | Trader’s relationship to their own intent | Soft all the way down. Declared, witnessed, never enforced. |
| **Buying-power ceiling** | Trader’s relationship to broker reality | Hard when the source is live; self-declared sources are walls the trader maintains (staleness witnessed). |

**Doctrinal statement.** The platform never substitutes its judgment for the trader’s. The only hard stop is outside the platform (broker / self-declared capacity). The platform will not pretend money exists that does not.

---

## 3. The three rings

### 3.1 Ring 1 — Total net capital (derived)

| Rule | Detail |
|------|--------|
| Per account | Starting balance (declared once / corrected on Accounts & Capital) + fills → **current net balance** |
| Identity total | **Total net capital** = sum of current net balances across the member’s accounts |
| Declaration | Trader does **not** set total net capital; it *is* what it is |
| Breath | Moves with fills, deposits, withdrawals, marks — the ceiling **breathes** |
| Derivation | Must recompute from starting balances + trade history; no shadow total table as SoR |

### 3.2 Ring 2 — Campaign allocation (declared intent)

| Rule | Detail |
|------|--------|
| Declaration | Each charter may declare an allocation: slice of **total net capital** (absolute $ and/or % — India keep/kill on representation) |
| No account bind | Allocation is of the **whole pool**, not “this account only” |
| Competition | Allocations make seasons compete for capital **honestly** |
| Overcommit | Sum of allocations may exceed total net capital — **visible**, not blocked (§4.1) |
| Ledger | Ledger campaigns do **not** require allocations (furniture); optional future disposition |

### 3.3 Ring 3 — Position size (solved)

| Rule | Detail |
|------|--------|
| Causal arrow | **Tolerated drawdown + capital denominator → size** |
| Denominator | Campaign’s **allocation** (Ring 2), not total net capital by default |
| Integrity | Overcommit at Ring 2 stays at Ring 2; it does not corrupt Ring 3 arithmetic |
| Presentation | Informs (calculator / campaign line / entry aid — Echo); **never** auto-fills the ticket |
| Formula | Concrete formulas are **Hotel** to propose, Coach to ratify (§9.5). This Spec locks denominators and the causal arrow only. |

---

## 4. Drawdown

### 4.1 Master drawdown (sovereign, campaign-blind)

- Measured against **total net capital** on the **one netted equity curve**: every account, every fill with realized P&L, chronological, **ignoring** `practice_campaign_id`.
- Campaign A up and campaign B down **net** on that curve — real money has no campaigns.
- Same peak-to-trough law as Trade Log reports:  
  `running = start + cum P&L` · `peak = max running` · `dd = (running − peak) / peak`.
- Needs **no** campaign tables.

### 4.2 Per-campaign drawdown latitude

- Each campaign’s **drawdown latitude** (tolerated local DD) is a function of **allocation size**:
  - **Small allocation → wider latitude** (worst case is a small bite of the whole).
  - **Large allocation → tighter latitude** (worst case is a large bite).
- Local heat is free in isolation; it still **mixes into** the master curve globally.
- Whether latitude is free-form or **prescribed suggestion bands** from allocation (prescribed-panel style) is **open** (§9.3).

### 4.3 Two-layer map

| Layer | Contents | Character |
|-------|----------|-----------|
| **Campaign-blind** | Accounts, total net capital, master DD, buying power, portfolio witnesses | Real money. Sovereign. |
| **Campaign** | Allocations, per-season DD latitude, solved size, existing process bounds | Interpretive practice. Soft. |

They meet when sizing is chosen in the campaign layer but answerable to the master DD where money is real.

---

## 5. Witnesses (soft) and the hard gate

### 5.1 Soft witnesses (campaign-side capital)

| ID | Test | Surface |
|----|------|---------|
| **W-Overcommit** | Σ campaign allocations vs total net capital (as-of; ceiling **breathes**) | Accounts & Capital only |
| **W-Master-DD** | Realized master DD vs declared **tolerated master drawdown** | Accounts & Capital only |
| **W-Campaign-size** | Fill size vs solved size / campaign position-size band (incl. fear-sizing floor — Campaign Spec §7) | Campaign surfaces |

All: quiet line, no 4xx on log path, no shame register.

### 5.2 Buying power (the one hard gate)

**Pipeline:**

```
drawdown + capital  →  solve honest size
        ↓
allocation scopes the denominator
        ↓
master DD is the sovereign soft limit
        ↓
buying power  →  feasibility check (reality’s veto)
```

Buying power is **not** an input to the sizing formula; it sits **after** it.

#### Source postures

| Posture | Serves | Behavior | Ship |
|---------|--------|----------|------|
| **Arbitrary** | Deep capital; fence never approached | Working number or untracked | **Yes** — no broker dep |
| **Periodic self-report** | Margin trader without live link | Declared BP + **as-of**; staleness always shown | **Yes** — no broker dep |
| **Live sync** | True real-time BP | Broker via server-side HTTP only | **QUEUED** — needs sanctioned broker path (same wall as vol OD) |

Hardness is **inherited from the source**. Live = true wall. Self-declared = trader-maintained wall; honesty obligation is **staleness**.

**Non-goal:** platform-invented margin math. Platform holds the chosen source; does not recompute broker margin.

---

## 6. Surface — Accounts & Capital

### 6.1 Placement (Coach-ratified 2026-08-09)

| Decision | Value |
|----------|--------|
| Name | **Accounts & Capital** |
| Navigation | **Users menu** (alongside profile / billing) — **not** under Practice apps |
| Owner | **Identity** |
| Consumers | Practice (Trade Log, Campaigns, Reports, …) · Strategy Lab · future products |

### 6.2 Contents (campaign-blind layer only)

| Block | Holds |
|-------|--------|
| **Accounts** | Create, rename, starting balance set/correct, retire = archive (soft gate on open **charters** — Campaign Spec retirement law). **Sole** write path for account lifecycle. |
| **Balances** | Per-account current balance (derived); total net capital |
| **Buying power** | Posture, figure, as-of, staleness; live-sync config when unblocked |
| **Tolerated master drawdown** | Declared against total net capital |
| **Portfolio witnesses** | Overcommit + master DD |

### 6.3 Explicit boundary

| May | Must not |
|-----|----------|
| List accounts for pickers (Trade Log, Lab) | Create/edit/retire accounts from Practice or Lab chrome after land |
| Stamp fills with `account_id` | Campaign chrome on Accounts & Capital |
| Show allocation **sum** for overcommit | Per-campaign journey / panel / radar here |
| Derive capital for Reports | Second capital SoR |

**Consolidation rule:** move account management **from** Practice; do **not** duplicate. A leftover “add account” on a practice surface after ship is a **blocking** gate finding.

### 6.4 Product independence (DL-248–250)

Practice and Strategy Lab may sell independently or as a bundle. Shared infrastructure (accounts, capital, identity) must not require owning the other product. Accounts & Capital is the structural proof of independence — not a pricing footnote.

---

## 7. Data model (indicative — India refines)

### 7.1 As-built today (delta target)

| Today | Target |
|-------|--------|
| `member_trade_log_accounts` under Trade Log / Practice chrome | Same table (or renamed) — **managed** only via Accounts & Capital APIs/UI |
| Starting capital often implicit / Reports default $50k | Explicit **starting balance** per account (required for honest Ring 1) |
| Campaign `starting_capital` / goals on charter | **Allocation** + **drawdown latitude** on charter (Ring 2/3); do not dual-truth with Ring 1 |
| No identity capital prefs | Tolerated master DD + buying-power posture at identity |

### 7.2 Proposed entities (draft)

```
Identity
  ├── capital_prefs
  │     tolerated_master_drawdown_pct | buying_power_posture
  │     buying_power_value | buying_power_as_of
  ├── Account[]                    # identity-level SoR for books
  │     starting_balance | label | venue | status …
  │     └── Trade[]                # unchanged; account_id immutable
  └── Campaign[]                   # interpretive; account_id NULL for charters
        allocation_amount | allocation_pct?
        drawdown_latitude_pct?
```

**Derived only (never authoritative storage of series):**

- `current_balance(account) = starting_balance + Σ realized P&L`
- `total_net_capital = Σ current_balance`
- `master_drawdown_pct` from netted multi-account equity path
- `overcommit_ratio = Σ allocations / total_net_capital`

### 7.3 APIs (indicative)

| Concern | Consumer |
|---------|----------|
| `GET/PATCH /api/me/capital` | Accounts & Capital, witnesses |
| `GET/POST/PATCH /api/me/accounts` | Accounts & Capital (write); Practice/Lab read via same or read-only alias |
| `GET /api/me/capital/overview` | Overcommit, master DD, totals |
| Campaign allocation fields on campaign CRUD | Practice Campaign only |

---

## 8. Phasing

| Phase | Scope | Blockers |
|-------|--------|----------|
| **P0** | Spec ratification; as-built audit of account write paths | — |
| **P1** | Accounts & Capital shell; move account CRUD off Practice; starting balance | — |
| **P2** | Ring 1 derivation + master DD + tolerated master DD + overcommit witness | Starting balances |
| **P3** | Campaign allocation + latitude; W-Campaign-size wired to allocation denominator | Campaign Spec process surface |
| **P4** | Solved-size presentation (Echo) + Hotel formula v1 | P3 |
| **P5** | Buying power arbitrary + self-report + staleness | — |
| **P6** | Live broker BP sync | Sanctioned broker data path (QUEUED) |

---

## 9. Open dispositions (Coach)

1. ~~Capital overview surface~~ — **RESOLVED:** Accounts & Capital under users menu (§6).  
2. ~~Where master DD is declared~~ — **RESOLVED:** Accounts & Capital (§6.2).  
3. **Allocation → latitude:** free-form vs prescribed suggestion bands (prescribed-panel precedent).  
4. **Solved-size UX:** calculator vs campaign line vs entry-time aid (Echo); inform-only constraint locked.  
5. **Sizing formula(s):** fixed-fractional, DD-derived Kelly variants, strategy-nature variants (Hotel propose / Coach ratify).  
6. **Allocation representation:** $ only vs % of total vs either (India).  
7. **Ledger + allocation:** ledgers never allocate vs optional “rest of pool” furniture (Tango / India).  
8. **Migration of existing account UIs:** exhaustive inventory of Practice “add account” / retire affordances (Mike + Charlie).  

---

## 10. Non-goals

- Enforcement under the net-capital ceiling (blocks, modals, min-capital gates)  
- Platform-invented margin / buying-power engines  
- Campaign-aware master drawdown  
- Second equity SoR (stored parallel series as authority)  
- Profit / return hero chrome (Sacred #8)  
- Auto-filling position size into tickets  
- Coupling account ownership to Practice or Strategy Lab entitlement  
- Per-leg capital accounting  

---

## 11. Acceptance (Delta-checkable, post-ratification)

1. Accounts create/retire exist **only** under Accounts & Capital; Practice surfaces have no account write path (grep + UI).  
2. Total net capital matches hand computation: sum of (starting_balance + Σ P&L) per account.  
3. Master drawdown with two campaigns (A win, B loss) equals single-book netted path; **unchanged** if campaign stamps are rewritten.  
4. Overcommit fires quietly when Σ allocations > total; no 4xx on trade create.  
5. Labs-only identity can open Accounts & Capital without Practice entitlement (when product split exists); Practice-only same.  
6. Self-report buying power shows **as-of** and staleness; arbitrary posture never requires broker config.  
7. Solved size never writes a leg quantity without explicit member action.  
8. No profit-claim strings on Accounts & Capital.  

---

## 12. Review gates

| Gate | Holder | Question |
|------|--------|----------|
| Architecture / domain | **India** | Rings derivable; no dual truth; campaign-blind master structurally true; account write path uniqueness |
| Trading accuracy | **Hotel** | Solved-size formulas; latitude-by-slice; member not worse off trusting displayed math |
| Psychology / copy | **Tango** | Quiet overcommit / staleness lines; capacity-over-dependency in BP postures |
| Design | **Echo** | Accounts & Capital layout; solved-size presentation; as-of chrome |
| Auth / financial boundary | **Mike** | Live BP sync: server-side only, config-driven, credentials |
| Isolation / Family B | **Mike** | Capital overview never leaks across identities |
| Tests | **Kilo** | §§11.1–11.7 characterization |
| Decision log | **Lima** | Ratification, product-independence, live-sync OD, any radar notes (out of this Spec’s body) |

---

## 13. Explicit out-of-scope notes

- **Campaign Journey radar** — Coach 2026-08-09: present-state only; scrub/as-of-T **cut** (not deferred). Capital Spec does not depend on historical scrub.  
- **D6 convexity / vol gauge** — remains queued on vol OD; not part of this Spec.  

---

## 14. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.1** | 2026-08-09 | Spec form of the Capital and Position Sizing Model proposal: laws C1–C10; two ceilings; three rings; campaign-blind master DD; soft witnesses; buying-power postures; Accounts & Capital (identity, users menu); Practice/Lab independence; phasing; acceptance; open dispositions. Source: `docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_1.md`. |

---

*Position size falls out of what you refuse to lose. Real capital is one book; campaigns are the story you tell about slices of it. Practice and Strategy Lab share the owner’s money surface — neither owns the keys.*
