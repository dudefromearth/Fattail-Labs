# FatTail Labs — Capital and Position Sizing Spec v0.2

**Status:** **SUPERSEDED** by [Capital Spec v0.3](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md) (advisor review fold).  
**Date:** 2026-08-09  
**Supersedes:** [Capital and Position Sizing Spec v0.1](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.1.md)  
**Source proposals:**  
- [`docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_2.md`](../docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_2.md)  
- Companion doctrine: [Campaign Amendment — Top Level Is the Account](./FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md)  
- Cash movements: [Funding and Defunding Spec v0.1](./FatTail-Labs-Funding-and-Defunding-Spec-v0.1.md)  
- Declared-number honesty: [Staleness Awareness Spec v0.1](./FatTail-Labs-Staleness-Awareness-Spec-v0.1.md)  

**Type:** Product / architecture authority — identity-level capital hierarchy, Accounts & Capital, fungible account sources, allocation composition, position-size solving, Practice ↔ Strategy Lab independence  

**Sits beside (does not replace):**

| Spec | Relationship |
|------|----------------|
| [Member Campaign Spec v1.3](./FatTail-Labs-Member-Campaign-Spec-v1_3.md) + [Top-Level Account Amendment](./FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md) | Campaigns are deliberate only; **no ledger furniture**. This Spec supplies capital hierarchy and **funding composition** (wrap / proportion). Direction (stamp) is independent of funding. |
| [Funding and Defunding Spec v0.1](./FatTail-Labs-Funding-and-Defunding-Spec-v0.1.md) | **Normative for Ring 1 arithmetic and master-DD curve split** (balance vs trading). Cash movements live there. |
| [Staleness Awareness Spec v0.1](./FatTail-Labs-Staleness-Awareness-Spec-v0.1.md) | As-of / two-clock display for declared capital numbers; no enforcement. |
| [Trade Log Spec v1.1](./FatTail-Labs-Trade-Log-Spec-v1.1.md) | Fills stamp immutable `account_id`. Undirected trades may have **null** campaign stamp (amendment). Account **management** on Accounts & Capital only. |
| [Identity / Access Spec](./FatTail-Labs-Identity-Access-Spec-v1.0.md) | Accounts & Capital on identity / users menu. |
| Strategy Lab specs | Same identity-level capital; neither product owns the write path. |

**Doctrine inheritance:** Umpire · no second store · Sacred #8 · Family B · config fail-loud · no MSC shared code.

---

## 0. Mission

Position size is not picked; it is **solved**. The trader declares how much they refuse to lose; size falls out of holding that drawdown against the right capital denominator.

**Three rings:**

1. **Total net capital** — derived from accounts; real; campaign-blind  
2. **Campaign allocation** — declared intent, **composed** from fungible account sources  
3. **Position size** — solved output  

**Fungibility (Coach, 2026-08-09):** accounts are **fungible sources** until the trader organizes them for a purpose. The platform imposes **nothing** on them by default — no default campaign, no standing direction. The resting state is genuinely unstructured. Deliberate campaigns and capital wraps are optional organization, never adoption tax.

Above campaigns: **master drawdown** (soft, campaign-blind) and **buying power** (hard when source is live). Net-capital path is **witnessed, never enforced**.

**Product independence:** Practice and Strategy Lab sell independently or bundled. Shared money lives at **identity** — Accounts & Capital; both consume, neither owns.

---

## 1. Laws

| ID | Law |
|----|-----|
| **C1 — Two ceilings** | Net-capital (intent) soft forever. Buying power hard only as inherited from source posture (§5). |
| **C2 — Platform never invents a block** | No platform-authority stop on fills. May refuse to lie about money that does not exist. |
| **C3 — Three rings** | Total net capital ⊃ campaign allocation ⊃ solved size; each is the denominator for the ring inside. |
| **C4 — No second store** | Total net capital and master DD **derived** at read time from starting balances + trade history. |
| **C5 — Campaign-blind master** | Master DD on aggregate multi-account equity; **never** join campaign stamps to compute it. |
| **C6 — Fungible sources** | Accounts are fungible capital sources until organized. Wrapping/proportioning is **funding only**, never membership. |
| **C7 — Funding ≠ direction** | A trade from a fully-wrapped account is **undirected until stamped**. Direction remains exclusive deliberate stamp (Campaign amendment). |
| **C8 — Size is solved** | Capital denominator + tolerated DD (+ Hotel formula) → size. Informs; never auto-fills or enforces. |
| **C9 — Identity owns accounts** | Sole account write path: Accounts & Capital. Practice/Lab leftover write paths = blocking defects. |
| **C10 — Fills stay factual** | `account_id` immutable on trade. Campaign stamp optional (null = undirected). |
| **C11 — Quiet witness** | Overcommit (total and per-source), master DD, sizing variance — umpire register; no 4xx on log path. |

---

## 2. The two ceilings

| Ceiling | Kind | Behavior |
|---------|------|----------|
| **Net-capital** | Intent | Soft: declared / derived, witnessed, never enforced |
| **Buying power** | Broker / self-declared reality | Hard when live; self-declared walls carry **as-of** and staleness |

The platform does not substitute judgment for the trader’s. The only hard stop is outside platform invention (broker or self-declared capacity).

---

## 3. The three rings

### 3.1 Ring 1 — Total net capital (derived)

| Rule | Detail |
|------|--------|
| Per account | **current balance = starting balance + Σ fill P&L + Σ cash movements** ([Funding Spec](./FatTail-Labs-Funding-and-Defunding-Spec-v0.1.md)) |
| Total | Sum of current net balances across identity’s accounts |
| Not declared | Trader does not set the total; it *is* what it is |
| Breath | Moves with fills, deposits, withdrawals, marks |
| SoR | Recompute only — no shadow total table |

**Two curves (Funding Spec — critical):**

| Curve | Includes cash movements? | Used for |
|-------|--------------------------|----------|
| **Balance curve** | Yes | Ring 1, overcommit, “what I have” |
| **Trading curve** | **No** | Master drawdown only — “how I traded” |

Withdrawal ≠ drawdown; deposit ≠ recovery. See Funding Spec §3.

**Account is the top level of the money story** (Campaign amendment): no furniture campaign required for a book to exist or accept fills.

### 3.2 Ring 2 — Campaign allocation (declared intent + composition)

| Rule | Detail |
|------|--------|
| **Fungibility** | Until organized, accounts carry no implied structure |
| Declaration | Each deliberate campaign may declare capital intent |
| **Composition (provenance)** | Allocation is assembled from account-level commitments in one of three shapes: |

| Shape | Meaning |
|-------|---------|
| **Wrap one account** | Campaign capital = that account’s balance (or stated share of it) |
| **Wrap multiple accounts** | Campaign capital = combined balances of named accounts |
| **Proportion capital** | Campaign draws stated portions from different accounts |

| Rule | Detail |
|------|--------|
| **Wrapping is capital-sourcing only** | States *where money is claimed from* — **never** where trades belong |
| Independence | Funding composition and campaign **membership** (stamp) are fully independent |
| Overcommit | Visible when claims exceed total **or** exceed a **source account’s** balance (§4.1) |
| No ledger allocation | There is no ledger campaign object; undirected capital simply remains in accounts |

### 3.3 Ring 3 — Position size (solved)

| Rule | Detail |
|------|--------|
| Causal arrow | Tolerated drawdown + capital denominator → size |
| Denominator | Campaign’s **composed allocation** (Ring 2) |
| Isolation | Ring-2 overcommit does not corrupt Ring-3 arithmetic |
| Presentation | Informs only (Echo); never auto-fills ticket |
| Formula | Hotel proposes; Coach ratifies (§9) |

---

## 4. Drawdown

### 4.1 Master drawdown (sovereign, campaign-blind)

- Computed on the **trading curve** (starting + fill P&L **only**), netted across **all accounts**, chronological.  
- **Ignores** cash movements (Funding Spec) and **ignores** `practice_campaign_id` (including null undirected fills — fills still affect trading curve; cash does not).  
- Peak-to-trough:  
  `running = start + cum fill P&L` · `peak = max running` · `dd = (running − peak) / peak`.  
- **Declared** tolerated master DD is compared against this realized trading-curve DD; total net capital (balance curve) remains the denominator context for % tolerance — see Funding Spec §3.3.

### 4.2 Per-campaign drawdown latitude

- Function of allocation size: small slice → wider latitude; large slice → tighter.  
- Local heat free in isolation; still mixes into master.  
- Free-form vs prescribed suggestion bands — **open** (§9.3).

### 4.3 Two-layer map

| Layer | Contents |
|-------|----------|
| **Campaign-blind** | Accounts, total net capital, master DD, buying power, portfolio witnesses |
| **Campaign** | Composed allocations, latitude, solved size, process bounds |

---

## 5. Witnesses and buying power

### 5.1 Soft witnesses

| ID | Test | Surface |
|----|------|---------|
| **W-Overcommit-total** | Σ campaign claims vs total net capital (as-of; ceiling breathes) | Accounts & Capital |
| **W-Overcommit-source** | Claimed composition vs each source account’s balance | Accounts & Capital |
| **W-Master-DD** | Realized master DD vs declared tolerated master DD | Accounts & Capital |
| **W-Campaign-size** | Fill size vs solved size / campaign position-size band | Campaign surfaces |

### 5.2 Buying power (post-size feasibility)

```
drawdown + capital → solve size
        → allocation scopes denominator
        → master DD soft sovereign
        → buying power gates deployability
```

| Posture | Ship |
|---------|------|
| Arbitrary | Yes |
| Periodic self-report (+ as-of / staleness) | Yes |
| Live broker sync | **QUEUED** — sanctioned server-side path |

---

## 6. Surface — Accounts & Capital

| Decision | Value |
|----------|--------|
| Name | **Accounts & Capital** |
| Nav | Users menu (profile / billing), **not** Practice apps |
| Owner | Identity |
| Consumers | Practice · Strategy Lab · future products |

**Blocks:** Accounts lifecycle · Balances / total net capital · Cash movements (Funding Spec) · Buying power · Tolerated master DD · Portfolio witnesses (total + per-source overcommit, master DD) · Staleness chrome (Staleness Spec).

**Boundary:** Practice/Lab **consume** accounts; **never** manage them after land. No campaign chrome here. Soft gate on retire for open **charters** (not ledgers — ledgers abolished).

**Migration flag:** move account write paths; do not duplicate. Leftover Practice “add account” = blocking defect.

**Independence (DL-248–250):** Labs-only and Practice-only members both see Accounts & Capital without owning the other product.

---

## 7. Data model (indicative — India)

```
Identity
  ├── capital_prefs
  │     tolerated_master_drawdown_pct
  │     buying_power_posture | value | as_of
  ├── Account[]                 # top-level money books; no default campaign
  │     starting_balance | …
  │     └── Trade[]             # account_id required; practice_campaign_id nullable
  └── Campaign[]                # deliberate only; no is_ledger furniture
        └── FundingComposition[]  # wrap / proportion lines → accounts
              account_id | mode | amount | pct?
```

**Derived only:** current balances, total net capital, master DD, overcommit ratios.

---

## 8. Phasing

| Phase | Scope |
|-------|--------|
| **P0** | Ratify Capital Spec v0.2 + Top-Level Account Amendment; DL supersession |
| **P1** | Accounts & Capital shell; move account CRUD; starting balances |
| **P2** | Ring 1 + master DD + overcommit-total |
| **P3** | Funding composition + overcommit-source |
| **P4** | Latitude + solved size (Hotel/Echo) |
| **P5** | Buying power arbitrary + self-report |
| **P6** | Live BP sync (queued) |

*Ledger abolition / unstamp path is owned by the Campaign Top-Level Account Amendment (parallel critical path with P0–P1).*

---

## 9. Open dispositions

1. Allocation→latitude: free-form vs prescribed bands  
2. Solved-size UX placement  
3. Concrete sizing formulas (Hotel)  
4. Composition storage: $ vs % vs hybrid  
5. Whether wrap “tracks live balance” or freezes a snapshot at wrap time (India — keep/kill; affects overcommit as-of)  
6. Import default when no campaign chosen: **null stamp** (amendment) vs any residual furniture  

---

## 10. Non-goals

- Enforcement under net-capital ceiling  
- Platform margin engines  
- Campaign-aware master DD  
- Second equity SoR  
- Profit theater  
- Auto-fill size  
- Account ownership tied to Practice or Lab entitlement  
- Default/ledger campaign as capital home  

---

## 11. Acceptance (post-ratification)

1. No Practice-side account write path.  
2. Total net capital = hand sum of account balances.  
3. Master DD equal with/without campaign stamp rewrites (incl. all-null stamps).  
4. Overcommit-total and overcommit-source both quiet-witness.  
5. Wrap does not force stamps on fills from wrapped accounts.  
6. Labs-only and Practice-only can open Accounts & Capital (when product split exists).  
7. Solved size never writes leg qty without member action.  
8. No profit-claim chrome.  

---

## 12. Review gates

| Holder | Question |
|--------|----------|
| **India** | Composition schema; wrap live vs snapshot; no dual truth; campaign-blind master |
| **Hotel** | Solved-size math; latitude-by-slice |
| **Tango** | Fungibility / undirected copy; quiet overcommit / staleness |
| **Echo** | Accounts & Capital; composition UI; solved-size surface |
| **Mike** | Live BP; Family B on capital overview |
| **Kilo** | §§11 characterization + composition overcommit |
| **Lima** | Ratification + fungibility + companion amendment DL |

---

## 13. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.2.1** | 2026-08-09 | Ring 1 + master DD aligned to Funding Spec (balance vs trading curves; cash movements). Accounts & Capital gains movements + staleness companions. Links to Funding Spec v0.1 and Staleness Spec v0.1. |
| **v0.2** | 2026-08-09 | Fungibility principle; funding composition (wrap one / many / proportion); funding ≠ direction; per-source overcommit; remove ledger-as-furniture from capital model; companion Top-Level Account Amendment. Source: model v0.1.2. |
| **v0.1** | 2026-08-09 | Initial Spec from model v0.1 / v0.1.1. |

---

*Accounts are money. Campaigns are optional stories about slices of it. Size falls out of what you refuse to lose — and never from a furniture object pretending not to be structure.*
