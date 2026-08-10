# Campaign Phase Model v0.2

**Status:** Product draft — cumulative fold  
**Date:** 2026-08-09  
**Supersedes:** [Campaign Phase Model v0.1](./Campaign-Phase-Model-v0_1.md)  
**Sources folded:**

| Input | Role |
|-------|------|
| Coach mindmap — Campaign Phase (7 spokes) | Phase structure |
| Coach phase prose (execution → conclusion) | Intent of each spoke |
| [Resolution — Campaign Charter Tiering](./Resolution-Campaign-Charter-Tiering.md) | Required core vs advanced form |
| Correlation Doctrine v0.2 (incoming / companion) | Same-bet answers · OD-CR-2 · north-star correlation |

**Companions:** Campaign Spec v1.3 · Capital v0.3 · Funding v0.2 · Positions View · Strategy Lab life cycle · Retrospective Spec  

---

## 0. Mission

A **campaign is a phase** of deliberate practice — not a bank account, not Strategy Lab Deploy, not the Trade Log.

| Kind | Role |
|------|------|
| **Definition** | Member declares the phase (tiered form — §2) |
| **Report** | Aggregates at read time — free cash, free margin, realized DD, strategy mix, performance (no second store) |
| **Act** | Lifecycle: activate, pause, prune, conclude, attach retro, renew |
| **Shape** | Six controls + radar = discipline mirror for the phase |

**Doctrine:** Account top level · funding ≠ direction · umpire on log path · undirected trades lawful · size inform only · process over profit theater.

**Optional attributes bind (Tiering Ruling §2.1, 2026-08-09):** *An optional attribute is dormant until adopted; adoption makes it law.*

| State | Meaning |
|-------|---------|
| **Unadopted** | Zero effect. No ghost defaults, no silent behavior. Absence is honest — the term does not exist on the charter. |
| **Adopted** | A signed charter term: witnessed in reports, changed only by amendment, visible in the change log. |
| **Un-adopted later** | An **amendment** with change-log entry — never a quiet clear. |

Applies to Tier 2 (Same-bet) and Tier 3 (end date, goals, strategy allow-list, retro link, etc.). Big Three are always required at sign — not optional attributes.

---

## 1. Seven phase spokes (combined with Coach prose)

| # | Phase | Coach intent | FatTail home | Definition / Report / Act |
|---|--------|--------------|--------------|---------------------------|
| **1** | **Strategy execution** | Deploy strategies that **passed curation**; ongoing psychological evaluation for discipline | Lab Curate → Deploy handoff. Practice: stamps + Journal / process. Panel + radar. | Act + report (adherence). Optional allow-list = advanced definition. |
| **2** | **Capital allocation** | Allocate by performance & risk; **dynamic reallocation** while monitoring | Capital modes (fixed / wrap / proportion / dynamic). Movements on Accounts & Capital. | **Required definition:** mode + amount. **Report:** free cash, free margin, assigned vs available. |
| **3** | **Execution timeline** | Start (and end) of the campaign window | Charter dates; window law L4 | **Required:** start. **Optional to start:** end (Tier 3). **End required to complete/archive.** |
| **4** | **Logging & documentation** | Trades, adjustments, outcomes; automate honestly | Trade Log SoR · amendments change log · import/automated · Reports | Report + act (stamp, amend). |
| **5** | **Pruning & refinement** | Cut underperformers; refine/scale winners | Lifecycle + strategy-mix report; solved size inform only | Act + report. |
| **6** | **Retrospective analysis** | Post-campaign lessons → future cycles | Attach Retrospective workspace | Act (attach) · advanced definition (link). |
| **7** | **Campaign conclusion** | Decisive end by performance / conditions | Terminal status · end date on close · renew | Act; end date required at archive. |

---

## 2. Charter tiering (Resolution 2026-08-09)

### 2.1 Big Three — required (Tier 1)

Rendered **large, always visible**. Charter **cannot sign / first-activate** without them.

| Field | Required means | Why (Capital model) |
|-------|----------------|---------------------|
| **Capital allocation** | Mode + amount (or wrap/proportion per Capital Spec) | Ring 2 — claim from the pool |
| **Max drawdown %** | Tolerated max DD for **this campaign** as **% of allocation only** (Coach L-DD) | Ring 3 input — with allocation, **solved size is always computable** |
| **Start date** | Window opens | L4 stamp eligibility begins |

**Umpire:** Completeness for **signing a charter** only. Undirected trading needs no campaign. No 4xx on trade log for missing charter fields.

**End date (Coach lock 2026-08-09):** **Not required to start/sign.** Field remains on the form (Tier 3 / More options or timeline chrome). **Required to complete and archive** — conclusion act sets or confirms end date so the season closes cleanly. Open-ended seasons are lawful while active.

### 2.2 Same-bet answers — visible optional (Tier 2)

**Correlation north star** (Correlation Doctrine CR-10 family). Four quick questions (~30s), **on the form, never behind disclosure**, **skippable**.

Indicative prompts (exact copy from Correlation Spec when landed):

- What are you trading?  
- Leaning?  
- Calm or wild?  
- What kills it?  

**Coach lock 2026-08-09:** Tier 2 is **optional** (not charter-required) but **actionable when adopted** — Same-bet feeds correlation witnesses and phase report honesty only after the member chooses to answer. Unadopted = “not answered” (CR-7); no nag on trade path; **no ghost same-bet defaults**.

**OD-CR-2 closed:** declaration **optional** (Tier 2).  

**Why not Tier 3:** Hiding Same-bet starves account-level correlation / stamping prompts (CR-11/12). Required core stays three fields; north star stays in the light for those who use it.

### 2.3 Advanced — brought forward (Tier 3)

Collapsed under **“More options”** until opened (each **dormant until adopted** — §0):

| Attribute | Unadopted | Adopted |
|-----------|-----------|---------|
| **End date** | Window open until conclusion act | Window-close behavior binds; **still required to complete/archive** |
| **Goals** | No goal chrome | Goals on page; retro may reference |
| **Strategy allow-list** | No list rule (stamping ungoverned by a list — the rule does not exist) | “Stamped outside list” witness activates |
| **Retrospective link** | No attach | Retro attached; appears in phase chrome |
| **Dynamic allocation nuance** | Mode stays Big-Three simple | Extra allocation note/behavior binds |
| **Title beyond default** | House default title OK | Custom title is charter term |
| **Version** | Always shown in header once campaign exists | Bumps on charter amend after sign |

Tier moves are one-word Coach overrides.

### 2.4 Wireframe (start a campaign)

```
┌─────────────────────────────────────────────────────┐
│  START A CAMPAIGN                                   │
│                                                     │
│  ██ Capital        ██ Max drawdown %  ██ Starts     │
│  ██ allocation     ██ (of allocation) ██            │
│     (big, unmissable — that's the required set)     │
│                                                     │
│  Same-bet answers (≤30s, skippable — correlation)   │
│   What are you trading? · Leaning? · Calm or wild?  │
│   · What kills it?                                  │
│                                                     │
│  ▸ More options                                     │
│    (end · goals · strategies · retro · allocation   │
│     nuance · version detail)                        │
└─────────────────────────────────────────────────────┘
```

---

## 3. Definition vs report vs act (refined)

| Kind | Examples |
|------|----------|
| **Definition — required** | Capital allocation (mode + amount) · max DD **%** of allocation · start date |
| **Definition — Tier 2** | Same-bet answers (correlation) |
| **Definition — Tier 3** | End, goals, strategy list, retro link, dynamic nuance |
| **Report (aggregates)** | Free cash · free margin (**defined max loss** of opens, not broker MM) · realized max DD · strategy mix · sample n — **no** P&L prune-rank · **no** campaign correlation strip |
| **Act** | Activate (sign) · pause · complete · end early · renew · attach retro · redirect stamp |

Most of free cash / free margin / realized DD / strategy mix stay **report form** — not charter fields to re-type.

---

## 4. Layout law (campaign detail — phase page)

```
Header: title · version · status · signature

Definition (tiered)
  Big Three (large)
  Same-bet answers (inline optional)
  ▸ More options (Tier 3)

Phase report strip (aggregates)
  Free cash · Free margin (defined max loss) · Realized max DD · Strategy mix · n
  (No per-campaign correlation chrome — account witness + stamp prompt only)

Six attributes + radar (process shape at present)

Log (4)
  Change log (amendments) · Trade Log filtered to campaign

Prune / refine (5)
  Lifecycle + later strategy allow-list edits

Retrospective (6)
  Attach / open

Conclusion (7)
  End date honesty · terminal · Renew
```

---

## 5. Correlation join (north star) — scoped v0.2.3

| Layer | Role |
|-------|------|
| **Charter Same-bet (Tier 2)** | Cheap declaration; dormant until adopted |
| **Account / stamp witnesses** | Correlation Doctrine CR-3 / CR-11/12 — **account-level**, not a campaign report widget |
| **Lab Pearson calculator** | **Out of this model** — any Lab tool is Correlation Doctrine territory (CR-4); not campaign charter law |
| **Campaign report strip correlation** | **Out of v1** (advisor fold: strike quiet phase-level correlation context) |

Formal Spec: [`Specs/FatTail-Labs-Campaign-Phase-and-Charter-Tiering-Spec-v1.0.md`](../Specs/FatTail-Labs-Campaign-Phase-and-Charter-Tiering-Spec-v1.0.md).

---

## 6. Version

Every campaign has a **charter version** (integer ≥ 1). Bumps when signed terms change. Display `v{n}` in header. Renew → new campaign object, predecessor link; default successor starts at **v1**.

---

## 7. Implementation order (when GO)

1. Tiered definition UI (Big Three large · Same-bet Tier 2 · More options).  
2. Sign/activate gate: Big Three present (422 on charter, not on trades).  
3. Phase report strip (free cash / free margin / realized DD / strategy mix).  
4. Change log chrome + Trade Log deep link.  
5. Retro attach.  
6. Same-bet storage + Correlation Spec join when that Spec lands.  
7. Lab “passed curation” strategy handoff list — after Deploy reports ready.

---

## 8. Locked Coach decisions (2026-08-09)

| ID | Decision |
|----|----------|
| **L-End** | End date **optional** to start/sign; field **remains**; **required to complete/archive** (close the season). Unadopted end date ≠ silent “forever” rule — open until conclusion act. |
| **L-T2** | Tier 2 (Same-bet) **optional**; **dormant until adopted**; **actionable** when adopted — not buried in Tier 3. |
| **L-DD** | Max DD is always **percent** of campaign allocation (not dollars, not dual form). |
| **L-Adopt** | Optional attributes **dormant until adopted**; adoption = charter law; un-adoption = **amendment** (Tiering_2 §2.1). No ghost defaults. |

Residual promote/demote of other Tier-3 items remains one-word Coach override.

---

## 9. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.2.3** | 2026-08-09 | Advisor fold: strip campaign correlation report; Lab Pearson out of model; free margin = defined max loss; formal Spec v1.0. |
| **v0.2.2** | 2026-08-09 | Fold Tiering_2 §2.1 adopted-attributes bind; activation table for Tier 2/3. |
| **v0.2.1** | 2026-08-09 | Coach locks: end optional-but-needed-to-close; Tier 2 optional/actionable; max DD always %. |
| **v0.2** | 2026-08-09 | Fold Charter Tiering Resolution; seven-phase prose; Same-bet Tier 2; max DD required; Correlation join; report vs definition refined. |
| **v0.1** | 2026-08-09 | Mindmap + phase prose initial. |

---

*Three fields make a charter that can size. Four optional taps keep the north star honest. Everything else is a season of execution, log, prune, retro, and a decisive end — mostly told as reports, not as furniture.*
