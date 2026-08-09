# FatTail Labs — Capital and Position Sizing Model

**Formal Spec (review):** [`Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md`](../Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md)  
**Companion amendment:** [`Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md`](../Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md)  
**Also:** [Funding Spec v0.2](../Specs/FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md) · [Staleness Spec v0.1](../Specs/FatTail-Labs-Staleness-Awareness-Spec-v0.1.md)  
**Status:** DRAFT v0.1.2 — for bench review and Coach ratification  
**Date:** 2026-08-09  
**Author:** Advisor layer (Claude), from Coach's dictated model of 2026-08-09  
**Relationship to other specs:** Standalone doctrine document. Sits *beside* — not inside — `FatTail-Labs-Member-Campaign-Spec-v1_3.md`. Most of this model lives **above** the campaign layer, at the account and total-capital level. Fungibility + funding composition (wrap / proportion) + top-level account (no ledger) are normative in the formal Specs above.

---

## 0. One-paragraph summary

Position size is not picked; it is **solved**. The trader declares how much they refuse to lose — a desired maximum drawdown — and size falls out of holding that drawdown against capital. Capital itself is organized as three nested rings: total net capital (derived, real), campaign allocations (declared intent), and position size (solved output). Above the campaign layer sits one sovereign constraint — the **campaign-blind master drawdown**, measured on the one real netted equity curve as if campaigns never existed — and one hard gate — **buying power**, the single wall in the entire system that is not the umpire's, because it belongs to the broker and the platform merely refuses to lie about it. Everything else is witnessed, never enforced.

---

## 1. The two ceilings

The model rests on the recognition that a trader lives under two ceilings of categorically different kinds.

| Ceiling | Kind of truth | Behavior |
|---|---|---|
| **Net-capital ceiling** | The trader's relationship to their own intent | Soft all the way down. Declared, witnessed, never enforced. The doctrine ceiling. |
| **Buying-power ceiling** | The trader's relationship to reality | Hard. Not because the platform decided, but because the broker did. The reality ceiling. |

**Doctrinal statement.** The platform never blocks the trader on its own authority — ever. The only hard stop in the system is imposed from outside, by the broker, and the platform is merely honest about it. This *protects* the umpire model rather than violating it: the platform never substitutes its judgment for the trader's; it just will not pretend money exists that doesn't.

---

## 2. The three rings

Capital is a containment hierarchy. Each ring bounds the ring inside it, and each ring is the **denominator** for the ring below.

### Ring 1 — Total net capital (derived, not declared)

- Every account carries a **starting balance**. Every fill moves it. Each account therefore has a **current net balance** derived from starting-balance-plus-trade-history.
- **Total net capital = the accumulation of every account's current net balance.**
- The trader does not set this number. It *is* what it is. It moves with every fill, deposit, withdrawal, and mark — the true ceiling **breathes** with the actual money.
- Nothing is invented and nothing is stored twice: total net capital is derivable from pure trade history plus starting balances — the same trade history everything else already reads. **It cannot become a second store of truth.**

### Ring 2 — Campaign allocation (declared intent, composed from fungible sources)

- **The fungibility principle (Coach, 2026-08-09):** accounts are **fungible sources** until the trader chooses to organize them for specific purposes. Until then, the platform imposes **nothing** on them — no default campaign, no standing direction rules, no implied structure. The resting state of the system is genuinely unstructured.
- Each campaign declares the slice of total net capital it intends to run. Pure intent. Nothing stops the declaration.
- **Funding composition.** An allocation is not merely a number — it has *provenance*, assembled from account-level commitments in any of three shapes:
  1. **Wrap one account** — the campaign's capital is that account's balance;
  2. **Wrap multiple accounts** — the campaign's capital is their combined balances;
  3. **Proportion capital** — the campaign draws stated portions from different accounts.
- **Wrapping is a capital-sourcing statement only.** It says where the campaign's money comes from — never where trades belong. Direction remains the stamp, always deliberate, always the member's act. A trade fired from a fully-wrapped account is **undirected until directed**. Funding and membership are fully independent; account freedom (window model) is unchanged.
- Composition sharpens the overcommit witness: it can show not only that allocations sum past the total, but *which accounts* are committed past their balances.
- Allocations make campaigns **compete for capital honestly**. When claimed capital exceeds what exists — in total or per source — that is a visible, structural fact — witnessed, not blocked (see §4.1).

### Ring 3 — Position size (solved, not picked)

- The causal arrow: **capital and tolerated drawdown are the inputs; position size is the output.** The trader does not set size and discover their risk; they set the risk they refuse to exceed, and size is derived to honor it.
- Size at the campaign level is solved from **that campaign's allocation** and **that campaign's drawdown latitude** (§3.2). Ring 2 is Ring 3's denominator: a two-percent risk is two percent of what *this season* committed, not of everything the trader has.
- This keeps sizing honest inside each ring even when the outer ring is strained: an overcommit at Ring 2 is visible at Ring 2; it does not corrupt Ring 3's arithmetic.
- This is the doctrine expressed as arithmetic: capital preservation first, the best loser wins, size falls out of how much you refuse to lose.

---

## 3. Drawdown — the driver

### 3.1 The master drawdown is sovereign and campaign-blind

- The drawdown that matters most is drawdown against **total net capital**.
- **It is measured as if campaigns never existed.** The master drawdown is computed on the one real aggregate equity curve — every account, every fill, netted together into one book. Campaign A up and campaign B down **net** on that curve, because at the level of real money there are no campaigns; there is just the trader's capital and what happened to it.
- Rationale: campaigns are an *interpretive layer* — witnessing, not accounting. Real money does not know what campaign a fill belonged to. The sovereign number is honest precisely because it ignores the story the trader told about the trades.
- Mechanically: the master drawdown needs no campaign data to compute. It is derivable from trade history alone. (Second-store-of-truth guard, same as Ring 1.)

### 3.2 Per-campaign drawdown is flexible, scaled by slice

- Each campaign's drawdown latitude is **a function of its allocation size**:
  - **Small allocation → wide latitude.** A campaign running a small slice can afford loose drawdown and aggressive sizing, because its worst case is a small bite of the whole.
  - **Large allocation → tight latitude.** A large slice's worst case is a large bite; it must be tighter.
  - Small allocation buys freedom; large allocation spends it.
- **Local flexibility, global accountability.** A campaign is free to run hot in isolation, but its heat is not free at the top: every campaign's realized drawdown **mixes into** the campaign-blind master via the one real equity curve. One small hot campaign barely moves the total; three at once, and the sovereign witness shows it.

### 3.3 The two-layer structure

| Layer | Contents | Character |
|---|---|---|
| **Campaign-blind layer** | Total net capital, master drawdown on the netted curve | The real ceiling. Sovereign. Computed as if no campaign was ever declared. |
| **Campaign layer** | Allocations, per-season drawdown latitude, solved position sizing | The interpretive practice layer. Flexible, local, chosen. |

They meet at exactly one point: sizing decisions are made in the campaign layer but are ultimately answerable to the campaign-blind master drawdown — the layer where the money is real.

---

## 4. The three witnesses (campaign-side, all soft)

All three follow the umpire register: intent declared, effect shown, nothing blocked, no modal, no red, no 4xx. Same quiet register as a bounds breach.

### 4.1 Capital overcommit

- **Test:** sum of all declared campaign allocations vs. total net capital.
- **Fires as:** a quiet line — e.g. *"Your declared allocations sum to 120% of total net capital."*
- Because Ring 1 breathes, this witness is evaluated **as-of**: a set of allocations comfortably inside the ceiling can breach it tomorrow because an account drew down, without the trader touching a single allocation. That is correct and valuable — a drawdown in one corner honestly tightens the whole picture. Same as-of discipline as the Campaign Journey.
- **Surface:** this is an *across-campaigns* fact. It belongs to no single campaign, so it cannot live on a charter page or a ledger. It requires a **capital overview surface** that sits above the campaign layer (see §7, Open Dispositions).

### 4.2 Master drawdown

- **Test:** realized drawdown on the campaign-blind netted equity curve vs. the trader's declared tolerated drawdown on total net capital.
- The sovereign witness. Portfolio-wide. Campaign-blind by construction (§3.1).
- **Surface:** the same above-campaign capital overview surface as §4.1.

### 4.3 Per-campaign sizing basis

- **Test:** each fill's size vs. the size solved from the campaign's allocation and its declared drawdown latitude; witnessed against the campaign's own position-size band (existing §7 process clause in the campaign spec, including the fear-sizing floor).
- **Surface:** the campaign's own surfaces, per the campaign spec. This witness is the existing sizing clause, now given its denominator (the allocation) and its driver (the drawdown latitude) by this document.

---

## 5. The one hard gate — buying power

### 5.1 What it is

Buying power is the gap between what the trader **has** and what the broker lets them **put to work**. Margin accounts grant buying power above net capital; defined-risk options tie up buying power as max loss regardless of notional; cash accounts chain it to settled funds. It is a second, parallel ceiling — and the one that actually stops an order at the moment of the trade.

### 5.2 Where it sits in the pipeline

Buying power is **not** an input to the sizing formula. It is a **feasibility check that sits after it** — reality's veto on the solved size:

> drawdown-and-capital **solve** the honest size → allocation **scopes** which capital that is a fraction of → the campaign-blind master drawdown **governs** the sovereign limit → buying power **gates** whether the solved size can actually be deployed.

Either the buying power is there or it isn't. The platform does not choose to block; it reports a fact that is already true. The constraint is not the platform's to enforce or relax — it belongs to the broker.

### 5.3 The three source postures

The trader **chooses the source of truth** for buying power. The choice reflects how they actually conduct business — capacity over dependency; the platform imposes no rigor the trader didn't ask for.

| Posture | Who it serves | Behavior | Ships? |
|---|---|---|---|
| **Arbitrary** | The deep-capital trader allocating a slice to FatTail, nowhere near their ceiling | Sets a working number, or doesn't track it. The gate exists but the fence is never approached. | **Yes — no dependency.** |
| **Periodic self-report** | The close-to-the-vest margin trader without (or not wanting) a live broker link | States current buying power and refreshes it periodically. A declared number *about reality* — it goes stale, and the model is honest about that: every figure carries an **as-of**, and staleness is surfaced so a decision is not made against a number from three weeks and forty trades ago. | **Yes — no dependency.** |
| **Live sync** | The trader who needs true real-time buying power | Broker sync. The gold standard; the only posture where the gate is genuinely hard in real time. | **Specced, QUEUED** on a sanctioned broker data path (§6). |

### 5.4 Hardness is inherited from the source

The "one hard gate" holds, but its hardness is a property of the source posture:

- **Live sync:** a true wall — real-time reality.
- **Arbitrary / self-report:** a wall the trader built themselves and is trusted to maintain. Functionally it is a **witness against a self-declared reality**, and the model's honesty obligation shifts to **staleness** — showing the age of the figure.

This is cleaner than treating buying power as monolithically hard, because it tells the truth about *where the truth came from*. The gate is always real; how far it can be trusted is a property of its source, and the model surfaces that.

---

## 5a. The surface — Accounts & Capital

**Placement (Coach-ratified 2026-08-09):** a single identity-level surface named **Accounts & Capital**, under the **users menu** — alongside profile and billing, not among the Practice apps. This is the trader's actual money: it belongs behind their own name.

**Consolidation rule:** account management moves here **from** the Practice apps and is **removed** there. Practice was never the right owner — fills reference accounts, but creating, naming, funding, and retiring an account is identity-level housekeeping about the trader's real-world money structure.

**Contents — the entire campaign-blind layer in one place:**

| Block | Holds |
|---|---|
| **Accounts** | Create, name, set/correct starting balance, archive-not-delete retirement with its soft gate on open contracts. Every account write path lives here and only here. |
| **Balances** | Per-account current balance (starting + fills, derived), accumulating into **total net capital** (Ring 1). |
| **Buying power** | Source posture (arbitrary / periodic self-report / live sync), current figure with as-of, staleness display for self-reporters, and — when the broker path exists — sync configuration (Mike's gate). |
| **Tolerated master drawdown** | Declared here, against total net capital. Campaign-blind, so it belongs at identity level, never on a charter. |
| **Portfolio witnesses** | §4.1 overcommit and §4.2 master drawdown render here — the only surface standing above all campaigns. |

**Boundary:** *The Practice apps consume accounts; they never manage them.* The Trade Log still stamps every fill with its account (immutable fact, unchanged). Ledger campaigns remain per-account. Campaign allocations slice the total this surface computes. But every write path *about* an account — birth, balance, retirement — has exactly one home. This is the no-parallel-write-paths law expressed as navigation. No campaign chrome, no journey material, no per-campaign detail beyond the allocation sum the overcommit witness needs.

**Anticipatory design — product independence (DL-248–250):** the identity-level placement is deliberate. Practice and Strategy Lab are to be **independent products** — each whole on its own, sellable separately or as a bundle. Independence requires that anything both need lives with the **identity**, not with either purchase: a Labs-only buyer must be able to see their accounts and capital without owning Practice, and vice versa. Accounts & Capital therefore attaches to the member — both products **consume** it, **neither owns it** — which is what makes "sold independently or bundled" structurally true rather than a pricing arrangement over entangled code. The future subdomain split then severs no account write path.

**Migration flag (for the bench plan, prominently):** wherever account creation/retirement currently renders on the practice side, those controls **move — they do not duplicate**. A leftover "add account" affordance on a practice surface after this lands is parallel-path drift and a blocking finding, not a cosmetic one.

---

## 6. Dependencies and phasing

- **Live broker sync is an external dependency.** Repo law applies: HTTP API only, config-driven, server-side, never browser-fetched — the same wall the convexity gauge's vol feed hit. The live-sync posture therefore **cannot ship until a sanctioned broker data path exists**, and is marked **QUEUED**, exactly the way the convexity gauge is queued on the vol-data-source OD.
- **The arbitrary and periodic-self-report postures have no external dependency** — pure trader-declared numbers the platform can hold today. They ship first and are not held hostage by the posture that needs plumbing.
- **Account starting balances** are the one data prerequisite for Ring 1. Current balances derive from starting balance + fills. If any account lacks a starting balance today, that is a small implementing seed, not a design question — flagged for the bench plan.

---

## 7. Open dispositions (for Coach — nothing here is decided)

Preserved per ideas-inventory discipline; none of these block ratification of the model itself.

1. **The capital overview surface.** ~~Open.~~ **RESOLVED (Coach, 2026-08-09):** the **Accounts & Capital** surface under the users menu — see §5a. Account management consolidates there and is removed from the Practice apps.
2. **Tolerated master drawdown — where declared?** ~~Open.~~ **RESOLVED (Coach, 2026-08-09):** declared on the Accounts & Capital surface, against total net capital — see §5a.
3. **The allocation→latitude relationship.** §3.2 states drawdown latitude scales with slice size. Whether the platform *suggests* latitude bands from allocation size (prescribed-panel style — printed, not typed) or leaves latitude fully free-form is open. The prescribed-panel precedent argues for printed suggestions.
4. **Solved-size presentation.** Where the trader sees the solved size — a calculator surface, a line on the campaign page, an entry-time aid — is a UX question for Echo. Doctrine constraint: it informs, it never auto-fills or enforces.
5. **Sizing formula specifics.** This document fixes the causal arrow (drawdown + capital in, size out) and the denominators. The concrete formula(s) — fixed-fractional, drawdown-derived Kelly-fraction variants, per-strategy variants — are Hotel's to propose against the doctrine and Coach's to ratify. The strategies-in-use dimension Coach named (sizing varies by strategy nature) lands here.

---

## 8. Explicit non-goals

- **No enforcement anywhere in the net-capital ceiling.** No blocked orders, no modals, no minimum-capital gates. Witness only.
- **No platform-invented buying-power math.** The platform holds the trader's chosen source; it does not compute margin itself.
- **No campaign-aware master drawdown.** The sovereign curve never consults campaign membership. Any implementation that joins campaign tables to compute it is a defect.
- **No second store of truth.** Total net capital and the master drawdown are derivable from starting balances + trade history at any time. No stored parallel equity series.
- **No profit claims** (Sacred #8). All surfaces speak in drawdown stopped, capital preserved, adherence — never returns.

---

## 9. Campaign Journey radar — disposition (Coach, 2026-08-09)

**Supersedes** interim full-deferral notes. Normative in [Campaign Amendment §2.1](../Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md) and Campaign Spec v1.3 §6:

- Radar **ships present-state only** on deliberate charters.  
- Lifetime time slider and as-of-T historical rendering are **cut (not deferred)**.  
- Band-alignment and n-floor rules unchanged.  
- Capital model does not depend on historical scrub.

---

## 10. Review gates

| Gate | Holder | Question |
|---|---|---|
| Architecture / domain model | **India** | Rings derivable, no second stores, campaign-blind master verified structurally, registry-style read-model discipline where surfaces consume capital data |
| Trading accuracy | **Hotel** | Drawdown-solved sizing arithmetic; latitude-by-slice framing; would a member be worse off believing a wrong version of any formula shown |
| Member psychology / copy | **Tango** | Overcommit and staleness lines in the quiet witness register; no shame mechanics; capacity-over-dependency in posture choice copy |
| Design | **Echo** | Capital overview surface; solved-size presentation; as-of/staleness display |
| Auth / financial boundary | **Mike** | Broker-sync posture (queued): credential handling, server-side only, config-driven |
| Tests | **Kilo** | Characterization: netted-curve master drawdown (up-campaign absorbs down-campaign), as-of overcommit, staleness surfacing |
| Decision log | **Lima** | Model ratification entry; radar present-only / scrub-cut entry (Coach 2026-08-09); live-sync OD entry |

---

## 11. Document history

| Version | Date | Change |
|---|---|---|
| v0.1 | 2026-08-09 | Initial draft from Coach's dictated model: two ceilings, three rings, campaign-blind master drawdown, three witnesses, buying-power gate with three source postures, live-sync queued, radar deferral note. Same-day addition: §5a **Accounts & Capital** surface (users menu, Coach-ratified) — account management consolidates there from the Practice apps; dispositions 1 and 2 resolved. |
