# FatTail Labs — Member Campaign Concept Spec v1.0

**Status:** **Product authority (v1.0 body)** — Coach 2026-08-08; B1–B3 + A1–A3; umpire; §4.5 lifecycle.  
**Model inversion (vNext):** **[`FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.2.md`](./FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.2.md)** supersedes optional/unstamped/unbound framing and interim §4.7a continuous signed-default where they conflict (Seven Laws · ledger doctrine · bounds · **Two Roles** · **Campaign Journey** radar + time scrub). Source narrative: [`docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`](../docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md). Bench: [`docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.2.md`](../docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.2.md). Fold into Concept Spec **v2.0** per that Spec’s surgery map.  
**Type:** Product concept + architecture (Practice + Strategy Lab)  
**Authority:** DL-258 · DL-259 · DL-260 · DL-261 · DL-262 · permanence doctrine **OD-PB-7** (platform-wide; third application = account retire)  
**Source of life-cycle language:** Strategy Life Cycle PDF (`LifeCycle.pdf`) — Development → Curation → **Live Campaign**  
**Positioning thesis:** Practice suite is built around the **daily Scientific Trading Protocol**; a campaign is a **charter** wrapping that day (§1 / §4.0 / §4.3c). Under Structured Practice Spec: practice is **born structured** (ledger per account; every trade stamps; charters optional and deliberate). Infrastructure is **umpire-like**: order without theater. Signature freezes terms; amendments record mid-season changes; renewal **cycles** re-run a closed contract with lineage (§4.5 — charters).  
**Not this document:** Marketing acquisition campaigns — see [Campaign Workflow Spec v1.0](./FatTail-Labs-Campaign-Workflow-Spec-v1.0.md). ActiveCampaign CRM sync is a different product word.

**Supersedes (locks):** Decision Addendum **OD-1.3** single-active campaign — via **DL-259** (not silent rewrite of the addendum). Phase 1 Own Spine v1.1 campaign MVP single-active language is **stale** until v1.2 / amendment (see §11 alignment checklist).

---

## 1. Positioning

**A campaign is a project bound by a contract.**

Professionals do not simply "trade" — they run campaigns under a mandate: capital allocated, term defined, approved methods named, reporting required, review mandatory. The contract has a counterparty in one of two forms:

- **Another party** — a prop firm's risk limits, a fund mandate, a funded-account evaluation's rules, a coach who helped set the terms and sits in the review.
- **Your professional self** — the retail member writes themselves the same quality of contract a firm would write them, then serves as both parties: the trader who performs the terms and the risk manager who enforces them.

The structure is identical in both cases — which is why "professional concept, retail simple" is a fact, not a slogan. Most retail traders fail not because they lack the trader half, but because nobody ever hired their risk-manager half. The campaign is where that second self gets a desk.

The contract terms map directly onto the campaign object (LifeCycle.pdf elements shown for Lab; Practice equivalents in parentheses):

| Contract clause | Campaign element |
|-----------------|------------------|
| Consideration — what's at stake | Capital allocation (`starting_capital`) |
| Term | Start date · end date |
| Statement of work — approved methods | Strategies (playbooks) |
| Reporting obligation | Log (journal) |
| Amendment clause | Prune |
| Review clause | Retrospective |
| Fulfilled | `completed` |
| Terminated early | `abandoned` |

Because the enforceable counterparty is ultimately yourself, **every clause is necessarily a process clause** — you cannot contract yourself to an outcome the market delivers. The contract frame structurally forces process-over-outcome: an outcome clause is void on its face.

**The contract form is purpose-agnostic.** Capital campaigns are one species. The same form — term, initial conditions, process clauses, goals, review — wraps any deliberate purpose:

| Species (examples — labels, not a closed product enum) | Character |
|--------------------------------------------------------|-----------|
| **Learning** | Six weeks on one playbook, tiny size, in Sim; goal is competence demonstrated, not capital grown |
| **Remediation** | Four weeks contracted against a specific defect the retrospective surfaced |
| **Transition** | Sim→Live, new broker, return from layoff; initial conditions are the point |
| **Proving** | Funded-account evaluation, or its self-imposed twin (“30 days inside these limits earns the size increase”) |
| **Capital** | A bounded capital mandate (size, term, review) — *not* the same thing as day-to-day trade mechanics |
| **Capital / market-operation** | A bounded mandate that may host (or *be*) a large-scale strategic operation — thesis, multi-vehicle book, multi-phase accumulation/management/distribution — **§4.3d** |

All are the **same object** with different clauses. **Non-capital campaigns are first-class;** null `starting_capital` is not a degenerate case. This makes the campaign **the unit of deliberate practice** platform-wide: a specific goal, designed conditions, bounded period, review at the end — with a signature on it. Courses teach; campaigns are where a member deliberately installs what was taught.

### Campaign Charter Architecture (normative construct — Coach)

The right construct is not “campaign = daily rules” or “campaign = five market stages alone.” It is a **charter** (personal contract) with **cadence** underneath:

```text
[ THE NORTH STAR CONTRACT ]          ← Practice campaign row (optional wrapper)
  ├── Strategy & Capital Allocation Scope
  └── Timeframe & Desired Outcomes (process outcomes)
        │
        ├──► [ DAILY PROTOCOL ]  ──► Scientific Trading Protocol  (§4.3c)  ★ Practice suite core
        ├──► [ WEEKLY RETRO ]    ──► Systemic Adaptation          (§4.3f)
        └──► [ MONTHLY/Q CHECK]  ──► Macro Rebalancing            (§4.3g)
```

**Practice suite law:** Every tool in the **Practice suite** is designed around the **daily Scientific Trading Protocol** (Hypothesis → Experiment → Reflection). Campaign, weekly retro, and monthly/Q checks **wrap and elevate** that daily lab — they do not replace it. Members may run the daily protocol with **no** campaign (umpire).

When the charter is a **strategic capital operation**, the **Universal Trading Campaign Blueprint** stages 1–5 (§4.3d) live inside the charter’s scope (how capital is built and dismantled). They do not replace the charter or the daily protocol.

| Piece | Role | Product home |
|-------|------|--------------|
| **North Star Contract** | Optional season wrapper — removes in-the-moment emotion when used | Practice → Campaign |
| **Daily Scientific Protocol (Pulse)** | **Core loop of Practice** — hypothesis, execute, variance | Trade Log · Journal · Playbook · Reports (aggregates) |
| **Weekly retro (Pivot)** | Structural integrity — variance series, cost basis, thesis | Retrospective |
| **Monthly/Q check (Horizon)** | Business-level — drag, rebalance, close or renew | Campaign complete · account health · §4.9 |
| **5-stage market blueprint** | Optional capital *operation* mechanics under a strategic charter | Playbook pack / frame |

**Doctrine:** The **day is the atom**. Sign a charter when a season needs a North Star; cadence serves the charter. The suite always serves the day. Silent book and learning seasons may use a **minimal charter** — umpire: never force full institutional shape.

This is also why campaigns are **never enforced by the platform** (§4.3): an unsigned contract binds no one. Auto-creating a campaign would be signing the member's name for them — and a contract you didn't enter carries zero psychological force, which is the only force it has. The platform offers the terms; only the member signs. The platform does not become your risk manager; it gives your professional self the paperwork to be one.

**The frame scales up.** Campaigns give trades their season; closed campaigns give accounts a clean retirement (§4.9) — the professional's book of settled mandates rather than the retail scroll that never ends. The endless scroll is not only ungradeable; it is *unretirable* — you cannot finish what was never structured into finishable units. That is the second dysfunction the campaign fixes.

*Formation arc:* the self-contract is practice for external contracts. A member who has honestly run seasons against their own clauses is contract-ready — able to live inside a prop mandate or funded-account evaluation, because they have already been both trader and enforcer. That is what Practice produces.

**Retail simple (how we ship the contract concept):**

| Professional core (kept) | Retail simple (how we ship) |
|--------------------------|-----------------------------|
| Work happens *in a campaign* | **Default Campaign** on the **default account** is the quiet primary home (§4.7a); extra campaigns optional |
| Capital / goals / multi-book | Capital optional but feeds Reports when set; goals free text **until boundaries land** (§4.7a.6); multi-campaign available |
| Deploy strategies *into* campaigns (Lab) | Suite process step labeled **Deploy** (verb); campaigns are the container |
| Multi-campaign per account | Available — Default Campaign is first; others are deliberate extra seasons |
| Import into a campaign | Defaults to the account’s **Default Campaign** unless the member picks another or none |
| Broker files have no campaign column | FatTail owns the concept; unstamped still valid when member opts out |
| Purpose / kind hints | Optional frames & later open vocabulary — never required to create or stamp |

**Seamless order (umpire doctrine — Coach edict):** Campaign infrastructure **adds value and provides order** without theater. Like a good umpire: **rarely noticed, indispensable to a fair game**. Practically:

- The **default account** always has a **Default Campaign** as continuous standing book (§4.7a) — quiet structure, not a create wizard.  
- Never nag; never block Trade Log for lack of *extra* campaigns. Unstamped trades remain valid when the member clears the stamp.  
- Prefill and Default Campaign are **quiet conveniences**, not ceremonies.  
- Starting frames and future kind/tags are **optional scaffolds** — skip, ignore, or free-type always works.  
- Type-branched product UI, mandatory classification, and closed enums that demand a choice before trading are **out of doctrine**.  
- When the member engages charter depth, structure is complete: permanence, prefill, term gate, Reports capital, retirement soft gates — order without theater.

**UX rule:** Never look like a wiki or a prop-firm ops console. Defaults are quiet; power is structural when the member grows into it. If campaign chrome is loud, it has failed the umpire test.

**Member-facing word (Tango):** This section is **concept authority**. Whether UI chrome ever says the word *"contract"* (vs carrying the meaning — e.g. "What are you committing to this campaign?") is a **copy-review call**, not an engineering default. Do not bake "contract" into chrome until Tango seeds/copy review land; seed intent in Practice Campaign copy when written.

---

## 2. Two products, one concept

**Practice** and **Strategy Lab** are separate entities. They share **no** apps, tables, nav chrome, or data planes.

The **concept of Campaign** exists in **both** — same idea (context of live work), different **mode**:

| | Practice (human) | Strategy Lab (automated) |
|--|------------------|---------------------------|
| Mode | Manual fills, process suite | Bots / strategy cards |
| Path | **`/app/practice/campaign`** | Campaign **entities** under Lab; board step **Deploy** |
| Wrong path | `/app/campaigns` (top-level cross-product app) | — |
| What you do | Trade and journal *in* a campaign context | **Deploy** curated strategies *into* campaigns |
| Tables | `member_practice_campaigns` (Family B) | Lab campaign / deployment domain (own schema; not Practice FKs) |

**Do not merge.** Homonyms are allowed. Coupling is not. Future “Lab campaign stamps a Practice campaign” requires a **separate OD**.

---

## 3. LifeCycle.pdf alignment (Strategy Lab)

### 3.1 Big picture

Development → Curation → **Live Campaign**.

### 3.2 Campaign Phase (container)

PDF Campaign Phase elements:

1. Strategies  
2. Capital allocation  
3. Start date  
4. Log  
5. Prune  
6. Retrospective  
7. End date  

That is the **campaign as container** — capital book, window, and group of work.

### 3.3 Deploy as process step (UI label)

Strategy Lab **renames the board process step** for that live stage to **Deploy** so most people hear a clear **verb** (put work into action).

| Term | Meaning |
|------|---------|
| **Deploy** (suite process step) | Board phase UI label for the live/campaign stage of the life cycle. API/DB phase key may remain `deployment`. **One product meaning of “Deploy” on the suite board.** |
| **Campaign** (entity) | Capital/context container strategies are **deployed into** (one or many). |
| **Deploy to Sim** | Inside **Development** only — simulation deployment, not Live Campaign board. Prefer phrase **“Deploy to Sim”** fully, never bare “Deploy.” |
| **Curation final review** | PDF Curation step 5. Prefer UI label **Approve** (or **Release**) when as-built allows — avoid a third bare “Deploy.” Until renamed, treat as *curation final-review gate*, not the suite Deploy phase. |

**Rule:** You **deploy into** campaigns. The suite nav process step is **Deploy**, not “Campaign.” Confusing the step with the container is a product error.

### 3.4 Suite nav (Strategy Lab)

**Design · Curate · Deploy · Archive**  
(Symbols hang under Design only.)

Canonical Deploy board URL: `/app/strategy-lab?phase=deployment`.  
`/app/strategy-lab/campaign` may host campaign **entity** management; it must not replace the Deploy process step.

---

## 4. Practice Campaign (human mode)

### 4.1 What it is

A **Practice Campaign** is optional structure for human trading — a **self-contract** for a bounded period of deliberate practice (§1):

- Context of work for a period of practice (any purpose species — capital, learning, remediation, transition, proving)  
- Optional capital and goals (null capital is valid; not a second-class campaign)  
- Optional binding to a Trade Log **account**  
- Optional links from trades and journal sessions (`practice_campaign_id`)  
- Optional playbook associations (season of practicing an identity — see Phase 1 Own Spine)

It is **not** a performance report, not P&L theater, not a required gate to use Trade Log or Reports, and **not** a closed typed taxonomy of campaign kinds (no product `campaign_type` enum — §4.3b / §7). Species are expressible without classification.

### 4.2 Flexibility (member stories)

All of the following are first-class:

1. **Default Campaign only** — entire book under the primary continuous campaign for the **default account** (rename optional); trades stamp there until the member chooses otherwise (§4.7a).  
2. **Import from another platform** into an account, defaulting onto that account’s Default Campaign unless the member picks another campaign or **none**. Broker CSV/ToS has no campaign field — FatTail stamps when default path or explicit choice applies.  
3. **Several campaigns on one account** — e.g. Default Campaign + two deliberate seasons on “IRA”.  
4. **Different campaigns on different accounts** — e.g. each account’s own Default Campaign plus extras.  
5. **Unbound campaigns** (`account_id` NULL) — not limited to one account (see §4.6); secondary form, not the primary path.  
6. **Unstamped trades** — `practice_campaign_id` NULL remains valid forever when the member opts out of stamping (not the default path).  
7. **Non-capital / purpose seasons** — learning, remediation, transition, proving with null or zero capital (§1 purpose-agnostic).  
8. **Default Campaign (`is_default`)** — one primary continuous charter per account (§4.7a); additional campaigns are extra contracts, not aliases.  
9. **Skip scaffolds on extra campaigns** — no frame, no kind, no tag required; optional seasons may still start light. **Default Campaign** always exists with continuous term (§4.7a) — that is structure, not a scaffold chip.

### 4.3 Optional / never enforced (DL-261) — refined by §4.7a

| Do | Don’t |
|----|--------|
| Offer create / list / activate / complete / **End campaign** | Require *extra* campaigns to open Trade Log |
| Ensure **Default Campaign** on the **default account** (and each account’s primary continuous charter) per §4.7a | Force a create-wizard ceremony or silent GET-list side-effect (§4.5.5b still holds for *browsing*) |
| Stamp / prefill via §4.7 (Default Campaign first) | Identity-wide “only one active” hard block (multi-active still allowed) |
| Offer import *into* Default Campaign / existing / new / none | Force every ToS/CSV import onto a campaign when member chooses **none** |
| Allow multiple `active` campaigns | Block *all* trading because an *extra* season is missing |
| Leave trades unstamped when member opts out | Block trading solely because `goals_md` is empty (goals do not control the book **yet** — §4.7a.6) |
| Offer starting **frames** that pre-draft `goals_md` scaffolding (template copy — pure suggestion) | Ship a **closed** `campaign_type` enum or type-branched product UI |
| Leave frames/kind/tags unused forever | Require the member to classify a campaign before trading |
| **Gate new stamps** onto a campaign whose **end date has passed** until the member amends `ends_at` (§4.7a.4) | Silently accept stamps into a term-expired campaign |

### 4.3b Purpose labels without force (frames → open vocabulary)

**Problem to avoid:** “We have two (or more) types” → hard enum → hybrid seasons break → three create wizards → member must pick a type before they can work. That fails the umpire doctrine (§1).

**One campaign object always.** Kind is decoration and scaffold, never a second machine.

| Stage | Mechanism | Member experience | Extensibility |
|-------|-----------|-------------------|---------------|
| **v1 (now)** | No kind column. **Starting frames** (copy chips) pre-draft `goals_md` only | Optional; skip = blank goals | New purposes = new copy frames, zero schema |
| **Later (OD)** | Optional **open vocabulary**: multi-select **tags** and/or optional `kind` string against a **versioned config vocabulary** (known hints + freeform) | Optional; ignore always works; hybrids = multiple tags | New species = config/copy, not a migration per type |
| **Only if forced by product** | True closed enum + divergent columns/gates per type | Type-specific UI | **New OD** — only when a kind needs different schema or hard gates (e.g. prop template) |

**Rules:**

1. Never block create, stamp, or import on missing kind/tags.  
2. Never branch the product into type-specific primary chrome in v1.  
3. Hybrids are first-class (tags multi-select when tags exist).  
4. Closed `campaign_type` enum remains a **non-goal** until an OD proves divergent schema is required (§7).  
5. Optional open vocabulary may land by OD without contradicting purpose-agnostic form — **add value, never force**.  
6. Never present **daily routine** as “what a campaign is” — the campaign is the **charter**; daily is the **pulse under it** (§4.0 / §4.3c).

### 4.0 Campaign Charter Architecture (normative)

**Authority construct for Practice Campaign.** Full tree in §1. Before risk (or before a learning season “counts”), the member authors a **North Star Contract** — a binding operational agreement with themselves that removes in-the-moment emotional decision-making. Cadence then keeps the contract alive: daily pulse · weekly pivot · monthly/quarterly horizon.

#### The Wrapper — North Star Contract (the “Why” and the rules)

| Charter section | Meaning | Maps to fields / surfaces |
|-----------------|---------|---------------------------|
| **North Star** | Psychological anchor — structural **process** goal (e.g. “capture exposure to theme X while risking ≤1.5% of portfolio if thesis dies”). Prevents drift into unrelated impulsive trades. | `goals_md` · title |
| **Scope of strategy** | Exact boundary of what is allowed: asset classes, instruments, setups that fit the thesis. Outside scope is **explicitly banned** for this campaign. | Playbooks M2M · `goals_md` · tags later |
| **Capital allocation mandate** | Immutable risk rules: max campaign size, tranche plan, catastrophic **invalidation level** (contract auto-terminates if broken). Null capital OK for non-capital seasons. | `starting_capital` · goals · §4.3d stages 1–2 when capital |
| **Timeframe boundary** | Explicit shelf-life (e.g. 45 trading days or until a named event). Contract expires — then close or renew. | `starts_at` / `ends_at` · status complete/abandon |

**Default path vs full charter.** Every **default account** carries a **Default Campaign** (§4.7a) with continuous term and account binding — that is the standing primary charter, not an empty “title-only active” shell. Full charter depth (North Star text, capital, explicit end date, playbooks) is **member-authored** on that row or on additional seasons. Platform offers the form; only the member deepens or ends it. **Explicit enforceable boundaries** beyond free-text goals are **open** (§4.7a.6) — Coach to decide.

#### Cadence under the charter

| Cadence | Name | Job | Product home |
|---------|------|-----|--------------|
| **Daily** | The Pulse | **Scientific Trading Protocol** — Hypothesis → Experiment → Reflection | **Entire Practice suite core** · §4.3c |
| **Weekly** | The Pivot | Variance series · cost basis · thesis still true? | Retrospective · §4.3f |
| **Monthly / Q** | The Horizon | Drag, rebalance to mandate, post-mortem / renew or archive | Campaign · account · §4.3g · §4.9 |

#### Strategic capital operations (optional under the charter)

When the charter is a **market campaign**, the **Universal Trading Campaign Blueprint** (stages 1–5, §4.3d) is the operational SOW for building and dismantling the multi-part position. Learning charters skip it. Daily protocol still runs every session.

### 4.3c The Pulse — Scientific Trading Protocol (Practice suite core)

**Law:** The Practice suite is built around this **daily** loop. Campaign is an optional season wrapper; it is not the center of the suite.

Framing the day as a **scientific experiment** strips the destructive loop of “winning and losing” as self-worth. The trader tracks **data and variance** — goal shifts from *trying to be right* to **testing the validity of a hypothesis**.

```text
[ 1. HYPOTHESIS ]  ──► Pre-Market Analysis & If/Then Models
        │
        ▼
[ 2. EXPERIMENT ]  ──► Systemic Execution (Entry / Mgmt / Exit)
        │
        ▼
[ 3. REFLECTION ]  ──► Post-Market Journal & Variance Log
```

| | North Star Contract (optional) | Daily Scientific Protocol |
|--|--------------------------------|---------------------------|
| Question | *What am I committed to this season?* | *What hypothesis am I testing today, and did I run the trial cleanly?* |
| Time box | Weeks–months | One session |
| Success metric | Charter adherence over the season | **Execution quality / variance** vs plan — not PnL as self-worth |
| Ends | `completed` / `abandoned` / retire book | Reflection closed; no charter rewrite mid-day |
| Without the other | Valid forever | Protocol still runs; suite still works |

#### Practice suite map (each tool serves the day)

| Suite tool | Primary beat | Role in the protocol |
|------------|--------------|----------------------|
| **Playbook** | Hypothesis (standing rules) | Who you are under risk — rules that constrain IF/THEN models; control variables |
| **Journal** | Hypothesis + Reflection | Pre-market IF/THEN & state; post-market variance & bias check |
| **Trade Log** | Experiment | Frictionless execution of the pre-registered plan; fills, structure, stops, stamps |
| **Reports** | Reflection (aggregate) | Book-level path/drawdown from experiments — **objective aggregates**, not process scorecards (DL-257) |
| **Retrospective** | Weekly Pivot (from daily series) | Variance audit across days; systemic adaptation — not mid-session rewrite |
| **Campaign** | Charter wrapper | Optional North Star / capital / term; may stamp trials; never required to open the suite |

**Umpire:** Member can live entirely in Journal + Trade Log + Playbook for the daily protocol. Campaign, weekly retro, and monthly checks add order when chosen.

#### 1. Hypothesis (pre-market)

| Element | Meaning |
|---------|---------|
| **IF/THEN blueprint** | Rigid conditionals from structure/data (e.g. IF break above $150 on high relative volume, THEN Tranche 2, stop $147) |
| **Control variables** | Conditions that must stay true for the trial (e.g. index vol below threshold) |
| **Pre-register the trial** | Exact plan **before** open; unregistered moves **forbidden** that day |
| **Drift / state log** | Sleep, stress, bias — before charts (contamination check) |

#### 2. Experiment (execution & observation)

| Element | Meaning |
|---------|---------|
| **Frictionless entry** | Execute as pre-registered; missed planned entry = failed trial (data gap) |
| **Active monitoring** | Price vs levels/market — observe; change parameters only if the hypothesis allowed it |
| **Objective exit** | Stop/target without negotiation; stop = hypothesis incorrect **today** — valuable data |

#### 3. Reflection (journal & variance)

| Element | Meaning |
|---------|---------|
| **Variance log** | Distance between pre-market plan and actual execution |
| **Zero variance** | Plan followed = **successful experiment** regardless of PnL |
| **High variance** | Hesitation, chase, moved stop, rogue size = **contaminated experiment** |
| **Cognitive bias check** | FOMO, revenge, fatigue — did bias rewrite parameters mid-run? |
| **Feed weekly pivot** | Archive day metrics into journal/campaign context for weekend thesis/charter review |

**Doctrine (Sacred #8):** Chrome celebrates **clean trials** and honest variance — never dollar PnL as the score of the person.

**Optional later (not v1 gate):** one-page Daily Experiment Log; Execution Quality (Variance) score as first-class process metric.

### 4.3d Professional market campaign — Universal Trading Campaign Blueprint (optional content)

**Definition (operator language):** A trading campaign is a **large-scale, strategic operation**. It spans **weeks or months**, targets a **specific theme or major market mispricing** (often macro/fundamental, not a chart pattern alone), and manages a **multi-part position** built in **tranches** (size scaled to the book — institutional scale is not the retail default).

This is **what professionals mean** by a market campaign — consistent with Wyckoff (cause → accumulation → advance → distribution / conclude) and institutional practice. It is **not**:

- the daily entry/stop/scale checklist (§4.3c),  
- the silent Primary **book** default,  
- or every Practice campaign row (learning/remediation seasons remain first-class).

**Product home:** Optional **playbook / process pack** and optional **starting-frame** goals scaffolding. The Practice campaign **contract** may *contain* one of these operations (or several sequential ones). Retail runs a **process-faithful, size-honest** version when they choose.

#### Flow (concise)

```text
[ STAGE 1: THE ACCUMULATION MATRIX ]
                 │
                 ▼
[ STAGE 2: THE TRIGGERS & FIRST TRANCHE ]
                 │
                 ▼
[ STAGE 3: RUNNING THE CAMPAIGN CORE ]
                 │
                 ▼
[ STAGE 4: DEFENSIVE CONTINGENCIES ]
                 │
                 ▼
[ STAGE 5: THE ENGINE DISMANTLE ]
```

#### Five stages (scaffold — not schema fields)

**Stage 1 — The Accumulation Matrix**  
*Before risking capital: map the total scope of the operation.*

| Element | Meaning |
|---------|---------|
| **Campaign allocation** | Fixed max % of account equity for the **entire** campaign (e.g. 10% max exposure) |
| **Price zone** | Higher-timeframe structural range (weekly/daily) where the thesis lives (undervalued / consolidating / planned zone) |
| **Tranche architecture** | Split allocation into equal building blocks (e.g. 4 × 2.5%) so capital is never all at one price |

**Stage 2 — The Triggers & First Tranche**  
*A campaign does not start randomly; first capital needs a catalyst.*

| Element | Meaning |
|---------|---------|
| **Anchor trigger** | Deploy Tranche 1 only on plan: zone test, structural signal, or named macro data print |
| **Campaign invalidation level** | Hard catastrophic stop for the **whole** campaign below the macro structural zone — thesis dead if broken |
| **Maximum R** | If **all** tranches are on and invalidation hits, total realized loss ≤ strict portfolio fraction (e.g. 1–2% account risk) — process risk budget, not a profit claim |

**Stage 3 — Running the Campaign Core**  
*Manage permanent core vs short-term volatility; improve process cost basis.*

| Element | Meaning |
|---------|---------|
| **Pyramiding on confirmation** | Deploy Tranches 2–3 only as market confirms (higher structural lows, major resistance break, etc.) |
| **Satellite operations** | Fraction of deployed capital trades rips/dips around core to improve **average entry** (process metric — not hero PnL on Reports) |
| **Cost-basis benchmark** | Primary process success in this stage: average entry meaningfully better than mindless all-in; compare to plan, not “brag chart” |

**Stage 4 — Defensive Contingencies**  
*Protect the built book without panic-selling the core.*

| Element | Meaning |
|---------|---------|
| **Macro regime shift** | High volatility / regime break → pause further tranche adds; lock size |
| **Synthetic hedging** | Temporary insulation (index puts, micro-futures, etc.) when plan still holds but book needs cover |
| **Time invalidation** | Hard temporal deadline (e.g. 60 days of stagnation) → manually dismantle if no momentum per plan |

**Stage 5 — The Engine Dismantle**  
*Systematic exit: lock process outcome without emotional interference.*

| Element | Meaning |
|---------|---------|
| **Distribution scale** | Never require picking the absolute top; pre-program tranche profit targets (e.g. 30% / 30% / …) |
| **Trailing core** | Final remainder rides with trail behind major daily support (or plan equivalent) |
| **Post-campaign audit** | Log duration, cost basis, adherence friction, what was followed/broke — into journal/retro **before** the next campaign (process review, not profit theater) |

#### Alignment

| Framework | How it maps |
|-----------|-------------|
| **This blueprint** | Matrix → trigger/T1 → core → defense → dismantle |
| **Wyckoff** | Cause/zone → accumulation → markup/management → distribution / conclude |
| **Prior 4-phase narrative** | Thesis/prep ⊂ Stage 1–2 · Accumulate ⊂ 2–3 · Manage ⊂ 3–4 · Distribute ⊂ 5 |
| **LifeCycle.pdf Campaign Phase** | Strategies · capital · timeline · log · prune · retro · end |
| **Contract clauses (§1)** | Consideration (allocation + max R) · term (time invalidation) · SOW (zone, tranches, stages) · log · prune (defense, pause adds) · retro (audit) · completed/abandoned |
| **Daily routine (§4.3c)** | How *each* tranche add, satellite trade, hedge, or scale-out is executed on a given day |

#### Retail simple (umpire)

- **Optional.** Learning seasons and silent book need none of this.  
- **Scaled.** Same stage *shape*; smaller books, simpler hedges, honest liquidity — not institutional plumbing as a gate.  
- **No profit theater.** Platform copy: allocation, zone, tranches, invalidation, max R, audit — not “maximize profit” hero copy (Sacred #8). Member goals text is free.  
- **No forced type.** Not a closed enum. Frame chip *Strategic market campaign* + playbook only.  
- **Historic exemplars** (e.g. famous macro campaigns) and deep hedge playbooks are education content, not required Campaign DB fields.

### 4.3e Blueprint at a glance (member-facing card seed)

| Stage | Name | One-line job |
|------:|------|----------------|
| 1 | **Accumulation matrix** | Cap allocation · map zone · design tranches — **before** risk |
| 2 | **Triggers & first tranche** | Anchor trigger · campaign invalidation · max R budget |
| 3 | **Running the core** | Pyramid on confirmation · satellite around core · defend cost basis |
| 4 | **Defensive contingencies** | Pause adds · hedge · time invalidation |
| 5 | **Engine dismantle** | Scale out on plan · trail remainder · post-campaign audit |

Tango may ship this table as optional frame/playbook chrome; **never** as a required wizard before Trade Log. Lives **under** a capital North Star Contract (§4.0), not instead of it.

### 4.3f The Pivot — Weekly retrospective (under the charter)

Weekend (or fixed weekly slot): step back from screens and evaluate **structural integrity** of the campaign. **System adjustments** happen here — not in the EOD pulse.

| Check | Meaning |
|-------|---------|
| **Variance audit** | Contract + **week’s daily trials** (§4.3c): permitted vs executed; aggregate zero-variance days vs contaminated days; flag rogue trades |
| **Cost-basis calculation** | Update net average entry of the campaign book; is core still protected by structural levels per plan? |
| **Thesis validation** | Macro/fundamental landscape: is the catalyst still true, or has the environment shifted? (Daily reflections supply the data series — charter changes only here or at horizon, not mid-session) |

**Product home:** Retrospective / weekend process (OD-3.1 family — cadence retro with campaign context). Optional; never block trading. When a charter exists, weekly pivot is the natural place to prune or reaffirm scope — and to **update the macro hypothesis** from the week’s clean experiments.

### 4.3g The Horizon — Monthly & quarterly checks (under the charter)

Corporate-level reviews of the trading **business** under the contract — macro allocation and book health.

| Check | Meaning |
|-------|---------|
| **Drag analysis** | Capital consumed vs process value of the campaign — is this **dead capital** better freed? (Process framing: opportunity cost of attention and risk budget — not hero alpha marketing on Reports) |
| **Account-wide rebalancing** | If the campaign book has grown past mandate, **shave** to initial risk contract (or document an explicit charter amendment) |
| **Post-mortem / renewal** | On timeframe expiry: full process review → **archive** (`completed`/`abandoned`) or **Renew** (§4.5.4) a successor cycle with copied draft terms + predecessor lineage. Never silent infinite scroll. |

**Product home:** Campaign complete/abandon/renew · account rebalance · retirement soft path (§4.9). Ties formation arc: honest seasons produce contract-ready traders. Weekly pivot variance audit (§4.3f) gains ground truth from **signed terms + dated amendments** when those land.

### 4.4 Suite nav and path (Practice)

- **Path:** `/app/practice/campaign`  
- **Nav:** peer of Trade Log, Reports, Journal, Retrospective, Playbook  
- **Not:** `/app/campaigns` as a top-level cross-product app  

Chrome on other Practice apps (especially Reports) must not host campaign CTAs, story strips, or process scorecards. Reports is objective book aggregate only (DL-257).

**Copy seeds (Tango gate — not decided by implementer default):**

- Prefer commitment language over legal theater. Example intent: *"What are you committing to this campaign?"* for create/edit; avoid prop-console jargon.  
- Whether the literal word *"contract"* appears is **open until Tango copy review** (§1).  
- **Starting frames** (template copy, not schema — same pattern as Playbook house-design scaffold): chips such as *Learning a new playbook · Proving discipline · Capital season · Fresh start / transition · Strategic market campaign* (optional).  
  - **Charter frame:** may scaffold North Star · scope · capital mandate · timeframe (§4.0).  
  - **Strategic capital frame:** may add five-stage blueprint bullets (§4.3d–e) under that charter.  
  - **Do not** dump full Scientific Trading Protocol into campaign create — link “daily: Hypothesis → Experiment → Reflection”; pulse is cadence, not the charter form.  
  - Pure suggestion; skip always works. Echo/Tango surface.  
- Frames must feel **optional and skippable** (umpire: order available, not announced).

### 4.5 Lifecycle — signature, amendments, renewal cycles

The contract frame completes: **signature** freezes the terms, **amendments** record term changes honestly, **renewal** cycles the contract with lineage. Two mechanisms, deliberately distinct:

| Mechanism | Means |
|-----------|--------|
| **Amendment** | Terms changed mid-season (same campaign row) |
| **Cycle (renewal)** | The contract was run again (new campaign row + predecessor lineage) |

**Versioning is the wrong word for campaigns.** Cycles re-run a closed charter; they do not version a living document like Playbook Save.

```text
draft (planned) ──activate──► active ──complete──► completed   [read-only]
   │   free edits      ▲    (signature)  └─abandon──► abandoned  [read-only]
   └── hard-delete OK  │                              │
       (zero stamps)   │                              └── Renew ──► new planned (cycle)
                       └── every post-activation charter edit = amendment record
                       └── Pause: active → planned (clock event; same signature)
                       └── Resume: planned → active (no re-sign)
```

**Statuses (storage):** `planned` · `active` · `completed` · `abandoned`  

| State | Member-facing label (Tango may refine) | Edits | History owed |
|-------|----------------------------------------|-------|--------------|
| `planned` | **Not started** (never signed) or **Paused** (was active; see §4.5.3) | Free while never signed — no amendment rows. After signature, pause still allows charter edits **with** amendment records | Drafting free; pause timeline via status amendments |
| `active` | **Active** | Allowed — **never blocked** (umpire) | Every edit to a **charter field** appends an amendment record |
| `completed` / `abandoned` | **Completed** / **Ended early** | **Read-only.** No field edits, no amendments | Closed contracts do not get retroactive edits (permanence) |

**Storage status `abandoned`** means early termination (incomplete close). **Member-facing verb:** **End campaign** (not “Abandon”). Labels must stay distinct from **Complete** (finished) and **Pause** (resumable). Do not euphemize early exit as “archived quietly.”

Transitions remain domain-enforced; **multiple rows may be `active` simultaneously** (DL-259).  
**Normative transitions:**

| From | To | Meaning |
|------|-----|---------|
| `planned` | `active` | **Signature** (or resume after pause) |
| `active` | `planned` | **Pause** (clock event) |
| `active` | `completed` | Fulfilled |
| `active` | `abandoned` | Early termination |
| `planned` | `abandoned` | Draft discarded into honest early exit (if stamps exist) or hard-delete path if zero stamps |

#### 4.5.1 Signature (activation)

On transition **`planned → active` when the campaign has never been signed** (no `signed_at`):

1. Server stamps **`signed_at`** (datetime) and **`signed_terms`** (JSON snapshot of charter fields at that moment).  
2. **`signed_terms` is immutable forever** — written once, never updated, survives all amendments.  
3. **Default Campaign** provision (§4.7a) is active continuous from account start and signs the standing continuous terms at ensure-time (or first real activation if deferred). **Extra** campaigns may still be created as draft or active per create flow.  
4. **Resume** (`planned → active` when `signed_at` already set) does **not** re-sign and does **not** rewrite `signed_terms`.  
5. **Title-only empty actives** (no term, no account) are **not** the intended primary path after §4.7a — Default Campaign always has account + continuous start.

**Charter fields** (the signed / amendable set):

`title` · `goals_md` · `starting_capital` · `account_id` · `starts_at` · `ends_at`

**Not charter** (operational; no amendment row): e.g. `is_default` (**default campaign** flag for that account), cover image, UI-only prefs.

#### 4.5.2 Amendments

Append-only table **`member_practice_campaign_amendments`** (Family B):

| Column | Meaning |
|--------|---------|
| `id`, `identity_id`, `campaign_id` | Standard + FK |
| `amended_at` | Server timestamp |
| `field` | Which charter field, or `'status'` for pause/resume/complete/abandon timeline |
| `old_value`, `new_value` | TEXT (JSON-encoded for typed fields) |
| `note_md` | **Optional** member note — "why I amended" (never required; umpire) |
| `export_key` | Pack identity |

Behavior:

- One PATCH touching N charter fields on an **active** (or paused-with-signature) campaign → **N amendment rows**, same `amended_at`.  
- Amendments are **never editable or deletable** (append-only, same law as the decision log).  
- The platform **never judges** an amendment — no warning chrome, no "are you sure you want to move your goalposts," no count badges. The record exists; the reading of it belongs to the member (weekly pivot). **Mirror, never diagnosis.**  
- Terminal campaigns reject field edits (**API 4xx**, fail loud).

#### 4.5.3 Pause / Resume

Pause **ships** as a first-class clock event (not a euphemism for abandon):

- Storage: `active` → `planned` (pause); `planned` → `active` (resume).  
- **Same signature**, same `signed_terms` — no re-signing on resume.  
- Pause/resume (and complete/abandon) may be recorded as amendment rows with `field = 'status'` so the season timeline is complete in one place; **UI displays status timeline separately** from term amendments.  
- Pause does **not** auto-shift `ends_at` (member may amend dates; on the record).  
- Pausing an account **default** (`is_default`) clears the default flag (default home must be an active campaign — operational rule, not a charter amendment of capital/goals).

Member-facing: **Pause** / **Resume**. Do not call pause "abandon."

#### 4.5.4 Renewal cycles

**Renew** is available on any **terminal** campaign (`completed` or `abandoned`):

1. Creates a **new** campaign row in `planned` (draft).  
2. Sets **`predecessor_campaign_id`** = the terminal campaign’s id (nullable self-FK).  
3. **Charter fields copied in as draft** — free edits before signing (drafting is free; cycle boundaries are where terms should change).  
4. Predecessor stays terminal, read-only, untouched.

**Lineage and cycle number:**

- **Lineage** = chain walked backward through `predecessor_campaign_id`.  
- **Cycle number** = depth from root along that chain (**derived, never stored** — no counter column to drift). Root = Cycle 1.  
- A predecessor may have **multiple successors** (tree allowed). UI presents the simple chain plainly; the tree case just works.  
- Detail display: lineage chip — e.g. "Cycle 3 · renewed from *Q1 OTM Season*" — read-only navigation through predecessors.

**Where Renew is offered:** campaign **detail/editor** of a terminal campaign; optional future retrospective post-mortem. **Never** a nudge, notification, or email (pull only).

**Member word:** **Cycle** (not Playbook "version"; not a stored season counter). Tango may refine chrome strings; concept word is **Cycle**.

#### 4.5.5 Surfaces

| Surface | Behavior |
|---------|----------|
| **Library** `/app/practice/campaign` | Card grid (Playbook pattern). **Open / Archive** segmentation (status is sole authority — R-PB-13; no second "archived" flag): **Open** = `planned` + `active`; **Archive** = terminal `completed` + `abandoned` (honest labels kept distinct). Optional **Cycle N** chip on renewed campaigns. **Open** → dedicated editor. Empty **Open** view offers a **one-tap starter card** (§4.5.5b) — never a silent GET-side-effect create. |
| **Archive list** | Terminal campaigns' home. Shows title, term, status (`completed` vs `abandoned` visibly distinct), cycle chip when applicable. Affordances: **read** · **export** · **Renew** (Renew naturally lives here). **No** aggregate completion-rate chrome, **no** abandon-rate judgment, **no** P&L. A high abandon count can be honest discipline — the Lab does not imply otherwise. Retired accounts' campaigns remain visible under Practice Context account filter. |
| **Detail / editor** `/app/practice/campaign/{id}` | Full focus: charter fields, lifecycle, default, **Signed terms** (or **Terms as of** / **Never signed** — §4.5.7 / §4.5.9), **Amendments** list, **lineage chip**, **Renew** on terminal. Cover image is **library-only** (not the editor). |
| **Weekly pivot** (when campaign context lands) | Variance audit may read **signed terms + dated amendments** as ground truth for "what the contract permitted" |
| **Create / quick-create** | Member-initiated only (one tap counts). Renew lands in the same editor pre-filled as draft. |
| **Trade Log / Journal / Journey** | **No changes** to stamps, meters, prefill rules from this section. **No Journey coupling** to cycle count, amendment count, or signature state (DL-068; Goodhart) |

Copy rules: verb **Renew**; label **Signed** for a real activation snapshot; amendments as neutral history ("Changed capital: 5,000 → 7,500 · Mar 3") — zero judgment framing. Guide one-liner: *the Lab archives strategies; Practice archives seasons.*

##### 4.5.5b Empty library — offered create (not auto-sign)

Opening the campaign **list** is **browsing**, not signing (§1). **GET must not create campaign rows.**

When the member has **zero** campaigns, the empty **Open** library shows an **offered** quick-create card (e.g. "Start your default — one tap") that creates (and may activate/sign) only on **explicit tap**. Same convenience as import Account-default path (member chooses), materially stronger consent than provisioning on navigation. No side-effecting list GET; no prefetch hazard.

#### 4.5.6 Permanence (OD-PB-7 platform law)

| Situation | Allowed exit |
|-----------|----------------|
| **Hard-delete** | Allowed only when **all** of: (1) **zero stamps** (no trade, journal, or playbook link), **and** (2) **`signed_at` IS NULL** (never signed). Drafting is free; signature is permanence. |
| **Signed, zero stamps** (e.g. activated then paused without stamps) | **No hard-delete.** Exit only through **`abandoned`** (honest void for non-performance) or later complete if resumed. Real contracts do not un-exist. |
| Campaign has **any** stamp or playbook link | **No hard-delete.** Only lifecycle exits: `completed` or `abandoned` |
| Terminal campaign | Read-only terms; **Renew** creates a successor (does not mutate predecessor); lives in **Archive** list |
| Amendment rows | Immutable (no UPDATE/DELETE API) |

Campaign rows that hold member evidence or a real signature must not leave dangling FKs or un-exist contracts. Domain returns **409** if delete is attempted when stamps exist **or** `signed_at` is set.

**Third application (accounts):** Trade Log account retirement is archive-only — same permanence family. Concept §4.9; mechanic [Trade Log Spec A-2](./FatTail-Labs-Trade-Log-Spec-v1.1.md).

#### 4.5.7 Migration honesty (pre-signature actives)

Existing active campaigns predate signatures. Backfill:

- `signed_at` = `activated_at` where known, else `created_at`  
- `signed_terms` = **current** charter field values at migration time  
- Flag **`signed_terms_backfilled = true`**  
- Display as **"Terms as of [date]"**, never **"Signed"** — never fabricate a signature the member did not make

#### 4.5.8 Hard rules (do not implement around)

1. **No Journey coupling** — cycle count, amendment count, amendment-free seasons feed no meter, grade, or standing.  
2. **No blocking, no warning chrome** on amendments (umpire). The record is the feature.  
3. **Terminal = read-only** for charter fields; view / export / Renew only (§4.5.2, §4.5.6).  
4. **`signed_terms` immutable** after real signature.  
5. **Signature is permanence** — hard-delete requires zero stamps **and** `signed_at IS NULL` (§4.5.6).  
6. **GET list never creates** campaigns (§4.5.5b).  
7. **Migration honesty** (§4.5.7).  
8. **No caps** on amendments by default (member text; revisit only if abuse observed).  
9. **Archive list** has no P&L or completion-rate chrome (§4.5.5).  

#### 4.5.9 Signed-terms block display states

Detail/editor **Signed terms** region:

| Condition | Label / block |
|-----------|----------------|
| `signed_at` set and **not** backfilled | **"Signed"** · `signed_at` · immutable snapshot |
| `signed_at` set and `signed_terms_backfilled` | **"Terms as of [date]"** · never say "Signed" |
| Terminal or open, **`signed_at` NULL** (e.g. `planned`→`abandoned` with stamps but never activated; or never-signed draft that closed) | **"Never signed"** — no empty Signed chrome; no fabricated snapshot |
| Draft `planned`, never signed | No Signed block required (still drafting) |

### 4.6 Unbound campaign semantics (`account_id` NULL)

- `account_id` set → campaign is scoped to that Trade Log account.  
- `account_id` NULL → **unbound**: not limited to one account; it is a candidate for **every** account filter.  
- When listing or resolving actives with `?account_id=N`: include (1) campaigns bound to N, and (2) unbound campaigns.  
- Prefill rule (§4.7) ranks **book default**, then account-bound, then unbound, then most recently activated.

### 4.7 Prefill / `GET …/campaigns/active` selection rule (deterministic)

Multiple actives are first-class. Convenience “single active” is **not exclusive**.

**Selection rule (must be identical for API and stamp/prefill UX):**

1. Candidates: `status = active` **and not term-expired** for stamp acceptance (§4.7a.4).  
2. If request/context has `account_id = N`: candidates = bound to N **or** unbound.  
3. Prefer **`is_default` Default Campaign** for that account (primary continuous charter — §4.7a).  
4. Prefer **account-bound** over unbound.  
5. Then **most recently activated** (`activated_at DESC`, tie-break `id DESC`).  

UI when stamping a trade on an account with multiple actives: default picker to this selection; show remaining actives in the list. **As long as the member does not change campaign**, all new stamps for that account go to the Default Campaign.

**Column:** `activated_at` set when status transitions **into** `active` (bumps prefill order on resume); **kept** on pause (`active` → `planned`); cleared on terminal complete/abandon. Migration **097**.  
**Column:** `is_default` — at most one **active** **Default Campaign** per `(identity, account_id)`; requires `account_id`. Migration **098**.  

**Member words (locked):**

| Concept | Member-facing word | Avoid in chrome |
|---------|-------------------|-----------------|
| Account standing home | **default account** | “Primary account” if it confuses with campaign |
| Campaign standing home (`is_default`) | **Default Campaign** (default title; renamable) | “Book” as product chrome |
| Early terminal | **End campaign** / **Ended early** | Bare “Abandon” as button label |

### 4.7a Default Campaign — primary continuous charter (Coach 2026-08-08)

**Law:** By default there is **one primary campaign** per account — the **Default Campaign**. It is the standing continuous charter of that account’s book. Extra campaigns are deliberate seasons; they do not replace this doctrine.

#### 4.7a.1 Identity and naming

| Rule | Detail |
|------|--------|
| **Default title** | **`Default Campaign`** |
| **Rename** | Member may rename freely (charter field `title`; amendment after sign) |
| **Flag** | `is_default = 1` on that row; at most one per `(identity, account_id)` among active campaigns |
| **Association** | Initially bound to the **default account** (`account_id` = that account). Member word: **default account** |

#### 4.7a.2 Continuous term

| Field | Rule |
|-------|------|
| **`starts_at`** | **The day the account starts** (account open / provision date — Trade Log account authority). Continuous run from that day. |
| **`ends_at`** | **Null by default** = **runs continuously** (open-ended standing campaign). |
| **Optional end** | Member may set `ends_at`. When that calendar end **arrives**, the campaign **ceases accepting new trades** (stamps) under this campaign — see §4.7a.4. |
| **Amend to continue** | To accept trades again after the end date, the member **amends** the campaign and **changes (extends or clears) `ends_at`**. That is an honest charter amendment, not a silent reopen. |

Status remains `active` while continuous (or until pause / complete / end-early). Open-ended is a first-class term shape — not “undefined campaign.”

#### 4.7a.3 Starting capital → Reports

| Rule | Detail |
|------|--------|
| **Optional** | Member may set **`starting_capital`** on the Default Campaign (or any campaign). |
| **Reports** | That value feeds the Reports field **Starting Capital** (top of report). |
| **Attribution** | Report chrome shows the book is running under **Default Campaign** — or whatever **title** the member chose (rename). |
| **Null capital** | Still valid; Reports Starting Capital empty / N/A for that campaign context — not a second-class campaign. |

Authority for report layout remains Reports product; this section owns **campaign → capital + title attribution**.

#### 4.7a.4 Trade acceptance (term gate)

**While the Default Campaign (or any campaign) is the stamp target:**

1. **Default path:** New trades (and import stamps that use default) record under that campaign **unless the member selects another campaign or unstamped**.  
2. **End date passed** (`ends_at` is set and current day **>** `ends_at` in the member’s reporting day atom):  
   - Campaign **ceases accepting new trade stamps** into itself (create/import/stamp paths fail loud or force re-choice — implementation detail; **fail loud** preferred).  
   - Member must **amend `ends_at`** (extend/clear) **or** stamp under another open campaign **or** leave unstamped.  
3. **Does not delete history** — past stamps stay; report history remains.  
4. **Does not block the Trade Log wholesale** — only acceptance **into this campaign** after term expiry.  
5. **Journal stamps** follow the same campaign acceptance rules when stamping a campaign id.

This is **term enforcement**, not Journey scoring and not goals enforcement.

#### 4.7a.5 Provisioning and consent

| Rule | Detail |
|------|--------|
| **Ensure on default account** | When the **default account** exists (or is designated), platform **ensures** one Default Campaign: title `Default Campaign`, `is_default`, bound to that account, `starts_at` = account start day, `ends_at` null, `status` active (continuous). |
| **Per additional account** | Each Trade Log account may receive the same pattern (one Default Campaign per account) when that account is provisioned or first used — **same continuous primary shape**. |
| **Not a list-GET side-effect** | Browsing `/api/me/practice/campaigns` alone still **must not** invent campaigns for cold curiosity (§4.5.5b). Ensure is tied to **account existence / designation**, not to opening the library empty state. |
| **Signature** | Ensure path stamps signature for the continuous standing terms (or first trade path — implementer chooses one; must be deterministic and documented in as-built). |
| **Hard-delete** | Default Campaign after sign follows permanence: no hard-delete; end early / complete / renew lineage only. |

#### 4.7a.6 Goals today vs explicit boundaries (open)

**As of this amendment (Coach):**

- **`goals_md` is completely discretionary** — free member text.  
- Goals **have zero control** over the account or trade acceptance.  
- That is a **recognized shortcoming**: a campaign **should** have **explicit boundaries** (enforceable or at least machine-visible limits), not only prose.  

**Not locked in this pass** (Coach: *we will discuss these*):

- What counts as a boundary (max risk, instruments, size, playbook-only, daily loss, etc.).  
- Soft mirror vs hard block.  
- Relation to Playbook M2M, process packs, and Reports.  
- Whether Default Campaign must carry a minimum boundary set before “in motion” language applies beyond continuous term.

Until that discussion closes, **do not** invent goal-based trade blocks. Term gate (§4.7a.4) and default stamping **are** locked.

#### 4.7a.7 Relation to optional seasons

| Form | Role |
|------|------|
| **Default Campaign** | Primary continuous book of the account |
| **Additional campaigns** | Deliberate seasons (learning, remediation, capital bursts, etc.) — multi-active OK (DL-259) |
| **Renew** | Terminal seasons → successor cycles; Default Campaign typically **amended** rather than constantly renewed, but Renew remains available if ended/completed |

---

### 4.8 Schema (Practice) — as-built + lifecycle target

**Table:** `member_practice_campaigns` (Family B, `identity_id`)

| Column | Role | Status |
|--------|------|--------|
| `title` | Member-facing name (**charter**) | Landed |
| `status` | Lifecycle (`planned` · `active` · `completed` · `abandoned`) | Landed |
| `activated_at` | Clock for prefill rule when active | Landed |
| `starts_at` / `ends_at` | Term (**charter**). Default Campaign: `starts_at` = account start day; `ends_at` null = continuous (§4.7a.2) | Landed; **continuous + term gate target** |
| `account_id` | FK → trade accounts; NULL = unbound (**charter**). Default Campaign: **required**, bound to its account | Landed |
| `starting_capital` | Optional consideration (**charter**) → **Reports Starting Capital** when set (§4.7a.3) | Landed; Reports wiring **target** |
| `goals_md` | Optional free text (**charter**). **No control** over account/trades today; explicit boundaries **open** (§4.7a.6) | Landed |
| `is_default` | Marks **Default Campaign** for that account — import + prefill home (§4.7 / §4.7a). Not charter. At most one active per account. | Landed; ensure-on-account **target** |
| `export_key` | Pack identity | Landed |
| Cover image columns | Library card cover (not charter) | Landed |
| `signed_at` | Signature clock — immutable after first real sign | **Landed** (§4.5.1) |
| `signed_terms` | JSON charter snapshot at signature — immutable | **Landed** |
| `signed_terms_backfilled` | Honest migration flag (§4.5.7) | **Landed** |
| `predecessor_campaign_id` | Self-FK for renewal lineage (nullable) | **Landed** (§4.5.4) |

**Table:** `member_practice_campaign_amendments` — append-only; Family B; see §4.5.2 — **Landed**.

**Not in schema:** `campaign_type` closed enum; required kind; **stored cycle counter** (cycle number is **derived**). **Later by OD only:** optional tags / open `kind` vocabulary (§4.3b).

**Links:** `member_trade_log_trades.practice_campaign_id`, `member_journal_sessions.practice_campaign_id` (nullable).  
**Playbooks:** `member_practice_campaign_playbooks` (M2M).

**Migrations landed:** 093 · 096 · 097 · 098 · 100 (cover) · **101** (signature · amendments · predecessor · backfill).

### 4.9 Account retirement (concept — campaigns make clean end possible)

**Problem without campaigns:** an account is an endless scroll. There is no coherent moment at which it is *over*, so members either destroy history (delete) or pile dead accounts as clutter with loose ends.

**With campaigns:** an account becomes a **book of closed contracts**. Retirement gains a real definition:

> An account is **cleanly retirable** when it has **no open contracts** — nothing `planned`, nothing `active`. Every season it hosted was either fulfilled (`completed`) or honestly terminated (`abandoned`). Stamped trades fell under some contract that reached its review.

**Clean means settled, not empty.** Unstamped-forever remains first-class (§4.2 story 6); retirement does **not** demand retroactive stamping. Clean retirement is about **open contracts**, not total coverage.

**Real-world maps:**

| Case | Professional move |
|------|-------------------|
| Closing a brokerage account | Settle open mandates → retire the book |
| Leaving a funded-account program | Same |
| Graduating Sim → Live | Retire Sim as a *rite of passage*, not abandon a login |
| Switching brokers on import | Settle old book → new account / venue |

#### Product shape (minimal; consistent with §1 / §4.3 / permanence)

| Rule | Detail |
|------|--------|
| **Retire = archive, never delete** | Third application of permanence doctrine: Playbook (OD-PB-7) → Campaign (§4.5 / B1) → **Accounts**. Retired account: hidden from active chrome by default; fully readable in history and reports; exportable; **can be un-retired** (`archived` → `active`). Trades, campaigns, journal stamps **untouched**. |
| **Open contracts = soft gate** | Retiring with `active` / `planned` campaigns is **not hard-blocked** (hard blocks violate §4.3 spirit). Flow **surfaces** them: e.g. “This account has 2 open campaigns. Complete or abandon them first for a clean retirement, or retire anyway (campaigns remain open).” Offer clean, allow messy, **name the difference**. Same principle as campaigns: offer the contract, never force it — at account level. |
| **Unstamped trades ≠ gate** | Never require stamping to retire. |
| **Implementation authority** | Account row lives on Trade Log. Mechanic is a **Trade Log Spec** amendment (`status` already includes `archived`; optional `retired_at` when UI ships — **one authority**, R-PB-13). This Campaign section states the **concept** and acceptance; it does not own account CRUD. See Trade Log **A-2 / A-2a / A-2b / A-7**. |

**Member-facing word:** Prefer **Retire** (ceremony) over raw “archive” where copy is written — storage value may remain `archived` until Trade Log renames.

**Not in this section:** auto-retiring accounts, deleting history, platform forcing complete/abandon before retire.

### 4.10 APIs (Practice)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/me/practice/campaigns` | Full list (**read-only** — no side-effect create); optional filter by open vs terminal for Open/Archive UI; optional `account_id` for scoped `actives` + §4.7 `active` |
| GET | `/api/me/practice/campaigns/active` | Convenience **one** active by §4.7; also returns `actives` array |
| GET | `/api/me/practice/campaigns/{id}` | Single campaign for dedicated editor |
| POST | `/api/me/practice/campaigns` | Create; optional scope/capital/goals; `activate` (signs if activated); `is_default` (requires `account_id`) — Default Campaign preferably via **ensure**, not ad-hoc create |
| PATCH | `/api/me/practice/campaigns/{id}` | Status (pause/resume/complete/end-early), charter fields (amend if signed — incl. extend `ends_at`), `is_default`; **reject charter edits on terminal** |
| (domain) | stamp / import acceptance | Reject new stamps onto campaign when **term-expired** (§4.7a.4) until `ends_at` amended |
| POST | `/api/me/practice/campaigns/{id}/renew` | **Landed** — terminal only; creates draft successor + predecessor FK (§4.5.4) |
| GET | `/api/me/practice/campaigns/{id}/amendments` | **Landed** — append-only history (§4.5.2) |
| DELETE | `/api/me/practice/campaigns/{id}` | Only if **unreferenced and never signed** (`signed_at` NULL) (§4.5.6); else 409 |
| POST/DELETE/GET | `…/campaigns/{id}/cover[…]` | Library cover image (not charter) |

Domain helper: **ensure Default Campaign** for an account per §4.7a.5 (on **default account** designation / account provision — not on bare campaign list GET). Import “Account default” path also ensures if missing.

### 4.11 Import / export (first-class JSON schema — not an afterthought)

**Normative machine schema:**  
[`Specs/schemas/practice-campaign-v1.json`](./schemas/practice-campaign-v1.json)  
(`$id`: `https://fattail.labs/schemas/practice-campaign-v1.json`)

| | |
|--|--|
| **Format** | `fattail.labs.practice_campaign` |
| **model_version** | **1.1** (1.0 = Phase 1 MVP fields only; 1.1 = full first-class pack) |
| **Pack surface** | Required entry in `member_export.surfaces` when present; empty `entries: []` is valid |

Campaigns are a **peer surface** to playbook / trade_log / journal_session — not a footnote on trade rows. Stamps on trades and journal sessions are **foreign keys by export_key** into this surface.

#### Broker / ToS / CSV import (Trade Log import sheet)

Third-party broker imports stamp under campaign paths the member chooses (or the quiet default path):

| Path | Behavior |
|------|----------|
| **Default Campaign** (account default) | No-fuss — stamp into account’s `is_default` **Default Campaign**; **ensure** if missing (§4.7a) |
| **Existing campaign** | Stamp into chosen open (non-term-expired) campaign |
| **New campaign** | Create + stamp into it |
| **None** | Leave unstamped (`practice_campaign_id` NULL) — still valid |

Never fail import solely because no campaign row existed beforehand (ensure fills Default Campaign). **§4.7a** allows ensure on **default account** provision; list GET still never writes (§4.5.5b). Term-expired campaigns **reject** new import stamps until `ends_at` is amended (§4.7a.4).

#### Pack fields for signature / amendments / cycles (target model ≥ 1.2)

Per campaign entry, pack carries: `signed_at`, `signed_terms`, `signed_terms_backfilled`, `predecessor_campaign_export_key` (nullable), and the **amendment list** (each with `export_key`). Cycle numbers are **not** exported as stored values — re-derived after import from resolved lineage. Missing predecessor on import: lineage **pending** (reported, not silent drop).

#### Member pack import/export

**Document shape (normative; must validate against practice-campaign-v1.json):**

```json
{
  "format": "fattail.labs.practice_campaign",
  "model_version": "1.1",
  "exported_at": "…",
  "source": { "system": "fattail-labs" },
  "identity": { "export_subject": "self" },
  "entries": [
    {
      "id": "camp-…",
      "title": "…",
      "status": "planned|active|completed|abandoned",
      "starts_at": null,
      "ends_at": null,
      "activated_at": null,
      "account_export_key": "acct-12",
      "account_label": "Primary",
      "starting_capital": 50000,
      "goals_md": "…",
      "is_default": true,
      "playbook_export_keys": ["pb-…"],
      "created_at": "…",
      "updated_at": "…"
    }
  ]
}
```

**Cross-surface stamps (same pack):**

| Surface | Field | When |
|---------|--------|------|
| `trade_log` trade object | `practice_campaign_export_key` | Non-null iff trade linked to a campaign; value = `entries[].id` |
| `journal_session` entry | `practice_campaign_export_key` | Non-null iff session stamped (OD-1.4); value = `entries[].id` |

**Import order (pack):** playbook → **practice_campaign** → trade_log → journal_session.  
After trade_log, importer **rebinds** campaign `account_export_key` / `account_label` if accounts now exist (campaign may import before accounts).

**Round-trip must preserve:** full entry fields (096 + 097 + 098 + M2M), trade stamps, **and** journal session stamps. Missing journal campaign key when DB had a stamp is a pack defect.

**Gates:** “campaigns green” (e.g. OD-PB-8 / TD2) means: document validates against **practice-campaign-v1.json**, pack lists the surface, and round-trip preserves §4.11 fields — not “a campaign file exists.”

---

## 5. Strategy Lab Campaign (automated mode)

### 5.1 What it is

A **Strategy Lab Campaign** is the automated-mode counterpart: a capital/context group into which **Deploy** places curated strategies/bots. PDF: strategies, capital allocation, timeline, log, prune, retrospective, end.

### 5.2 Deploy vs Campaign

- **Deploy** = process step on the board (Design → Curate → **Deploy** → Archive).  
- **Campaign** = entity/container strategies are deployed **into**.  
- Multi-campaign Lab capital books may land after the Deploy board is solid; the **concept is normative now**.

### 5.3 Separation from Practice

No foreign keys between Lab campaign rows and `member_practice_campaigns`. Optional future product links require a **separate OD**.

---

## 6. Word disambiguation (Labs-wide)

| Word | Product | Spec |
|------|---------|------|
| **Member Campaign** (this doc) | Practice / Lab live capital context | **This spec** |
| **Marketing Campaign** | Acquisition workflow / landers | Campaign Workflow Spec v1.0 |
| **ActiveCampaign** | CRM lead sync | ActiveCampaign Lead Sync Spec |
| **Campaigns course** | Education product line | Course catalog |

---

## 7. Non-goals

- Blocking Trade Log entirely when no *extra* campaign exists (Default Campaign is standing structure — §4.7a; unstamped path still valid)  
- **Goal-text enforcement** of trades (interim) — `goals_md` does not control the book until **explicit boundaries** are designed (§4.7a.6)  
- P&L / win-rate as hero metrics of a campaign  
- Shared Practice ↔ Lab campaign store  
- Top-level `/app/campaigns` app  
- Auto-adherence or auto-playbook from campaign  
- Marketing campaign factory features on member Campaign surfaces  
- Hard-delete of referenced campaigns  
- **Counterparty structure** (fields for prop firm / fund / coach-as-party, prop-firm templates, coach visibility into member campaigns) — **conceptual only in v1**; any structural counterparty feature is a **new OD (Tango gate)**. The self-contract remains the only bound form until that OD.  
- **Closed `campaign_type` product enum** — forbidden while species remain expressible in existing columns (`goals_md`, dates, `account_id`, playbook M2M, optional capital). A closed enum would force classification of hybrids, invite type-branched UI, and violate umpire doctrine (§1).  
- **Optional open vocabulary** (tags / open `kind` string + versioned config hints) — **allowed later by OD** (§4.3b); still never required to create, stamp, or import. Not a non-goal — a deferred additive path.  
- **Type-branched primary UX** (separate create flows per kind, mandatory type step before trading) — non-goal.  
- Hard-delete of accounts that hold trades (retirement is archive only — §4.9 / Trade Log A-2)  

**Not a non-goal (locked intent):** **term gate** — refusing new stamps into a campaign after `ends_at` (§4.7a.4); **Default Campaign ensure** on the default account (§4.7a.5).

---

## 8. Acceptance criteria (Delta-checkable)

1. Member can leave trades **unstamped** forever (`practice_campaign_id` NULL) when they opt out.  
2. Member can create **additional** campaigns and stamp trades onto them.  
3. Member can create **multiple active** campaigns, including **more than one on the same account**.  
4. Member can scope campaigns to different accounts; unbound actives appear in every account’s candidate set.  
5. Import from ToS/CSV: **Default Campaign** stamps the account default (ensure if missing); **None** leaves unstamped; existing/new campaign paths work; never fail for missing prior campaign (§4.11 / §4.7a).  
6. Practice Campaign lives at **`/app/practice/campaign`**, not `/app/campaigns`.  
7. Strategy Lab suite shows **Deploy** as the process step; Deploy means into campaign context.  
8. Reports has **no** process scoreboards (DL-257); **does** surface **Starting Capital** from campaign when set, attributed under the campaign **title** (§4.7a.3).  
9. No shared DB FKs between Practice and Lab campaigns.  
10. **Permanence (B1):** Hard-delete only when **zero stamps** and **`signed_at` IS NULL**. Any stamp/playbook link → no hard-delete. Signed-but-unperformed → no hard-delete; exit via **End campaign** (`abandoned`) or complete if resumed. 409 otherwise. Same platform doctrine as OD-PB-7 (§4.5.6).  
11. **`GET …/campaigns/active` (B2):** deterministic under §4.7 for a fixed `(identity, account_id, DB state)` (prefers `is_default` Default Campaign, then account-bound, then most-recently-activated); excludes term-expired for stamp acceptance.  
12. **Pack (B3):** round-trip restores campaign 096–098 fields, playbook M2M, trade **and** journal `practice_campaign_export_key` (+ 1.2 lifecycle).  
13. **Account retirement (A3):** Member can retire an account; retirement is **archive, not delete**; open campaigns (`planned`/`active`) are **surfaced but not blocking**; unstamped trades are not a gate; retired accounts remain readable/exportable and **can be un-retired** (§4.9).  
14. **Purpose-agnostic (A1):** Member can create a campaign with null `starting_capital` and non-capital goals; product does not require capital mandate.  
15. **Umpire / list GET:** **list GET does not auto-create** campaigns (§4.5.5b). No required classification step. Default Campaign ensure is tied to **account** per §4.7a.5 — not to browsing the library.  
16. **Frames optional:** Starting frames (when shipped) pre-draft `goals_md` only and are skippable; skipping leaves a valid campaign.  
17. **No closed type enum in v1:** Schema and UI do not require `campaign_type`; open vocabulary only by future OD (§4.3b).  
18. **Charter construct:** Campaign = North Star Contract + optional cadence (daily/weekly/monthly); daily pulse is not the campaign definition (§4.0 / §4.3c).  
19. **Five-stage blueprint optional:** §4.3d–e under capital/strategic charters only — not default create, not closed type.  
20. **Cadence optional:** Weekly pivot and monthly/Q horizon (§4.3f–g) never block Trade Log; when used, they serve the charter (variance, rebalance, close/renew).  
21. **Scientific daily protocol:** Day = Hypothesis → Experiment → Reflection; success = low variance / clean trial, not PnL-as-worth (§4.3c); optional; feeds weekly pivot.  
22. **Practice suite core = day:** All Practice tools map to the daily protocol (and weekly elevation); **extra** campaigns never required to use Trade Log / Journal / Playbook / Reports.  
23. **Signature:** Activation (first `planned`→`active`, create-as-active, or Default Campaign ensure) stamps `signed_at` + immutable `signed_terms`; later charter edits never rewrite the snapshot (§4.5.1).  
24. **Amendments:** Each post-signature charter-field change appends an amendment row (multi-field PATCH → N rows); rows are immutable; no judgment chrome (§4.5.2). Extending `ends_at` after term expiry is a normal amendment.  
25. **Pause / Resume:** `active`↔`planned` after signature without re-signing; status timeline complete; not euphemism for End campaign (§4.5.3).  
26. **Terminal read-only:** `completed`/`abandoned` reject charter field edits (4xx); allow view, export, Renew only (§4.5.2, §4.5.6). Member labels: **Completed** / **Ended early**.  
27. **Renew / cycles:** Renew on terminal creates draft successor with predecessor FK; cycle number **derived**; multi-successor tree allowed; no Journey coupling (§4.5.4–§4.5.8).  
28. **Backfill honesty:** Pre-signature actives display "Terms as of," never "Signed" when `signed_terms_backfilled` (§4.5.7). Never-signed terminals display **"Never signed"** (§4.5.9).  
29. **Library vs editor:** Campaign list is a card library (Playbook pattern); full edit is a dedicated route — not an inline expand that reflows the grid.  
30. **Open / Archive library:** Open view lists non-terminal campaigns; Archive lists `completed` and `abandoned` (labels **Completed** / **Ended early**); Renew available from archive/detail; **no** completion-rate or P&L chrome on archive (§4.5.5).  
31. **Default Campaign (§4.7a):** Default account has one primary continuous campaign titled **Default Campaign** (renamable), `is_default`, bound to that account, `starts_at` = account start day, `ends_at` null by default.  
32. **Default stamp path:** While member does not change campaign, new trades stamp under the Default Campaign for that account.  
33. **Term gate:** When `ends_at` is set and the end day has passed, campaign **rejects new trade/import stamps** until member amends `ends_at` (or chooses another/unstamped path).  
34. **Starting capital → Reports:** Setting `starting_capital` on the campaign surfaces as Reports **Starting Capital**, attributed under the campaign’s current title.  
35. **Goals non-enforcing (interim):** `goals_md` does not block or auto-shape trades; explicit boundaries remain **open** (§4.7a.6) — no goal-based gates until Coach locks them.

---

## 8a. Upgrade safety (existing accounts & trades)

**Doctrine:** This upgrade is **additive and optional**. It must not break members who already have accounts, unstamped trades, stamped trades, or old campaign rows.

| Guarantee | How |
|-----------|-----|
| **Unstamped remains valid** | Trades/journal with `practice_campaign_id` NULL remain valid forever |
| **No rewrite of fills** | Migrations **do not** mass-UPDATE `member_trade_log_trades` or journal sessions onto Default Campaign without an explicit migration plan |
| **Existing campaign rows** | New columns are **NULL-able**; old rows keep title/status/dates/export_key |
| **Existing stamps** | FKs on trades/journals unchanged; cascade remains SET NULL / protected by permanence |
| **Multi-active** | Removes demotion of second actives on **new** imports only; existing DB rows untouched |
| **Export 1.0 consumers** | Still readable; 1.1/1.2 add fields (additionalProperties / omit nulls OK) |
| **Import 1.0 packs** | Still commit (title/status/dates/playbook keys); missing 1.1 fields → NULL |
| **Import 1.1+ on old hosts** | Requires migrate 096+097+098 (+101 lifecycle) first (fail loud if columns missing) |
| **Idempotent migrate** | 096/097/098/101 use information_schema guards — safe re-run |
| **Default Campaign ensure (§4.7a)** | **Target behavior:** ensure on **default account** (and per-account primary). Existing members: backfill one Default Campaign per account **without** rewriting historical unstamped trades; optional later backfill stamps only by OD |
| **GET list never writes** | Browsing campaign list alone does not create rows (§4.5.5b) |
| **Signature / amendments / renew** | Additive nullable columns + append-only amendments table; existing rows backfilled per §4.5.7 |
| **Signature permanence** | DELETE rejects when `signed_at` is set, even with zero stamps (§4.5.6) |
| **Term gate** | Additive enforcement on stamp/import paths when `ends_at` passed — does not rewrite history |
| **Account archive/retire** | Additive to existing `status=archived`; optional `retired_at` later — no forced retire |

**Operator order:** `python migrate.py` (apply 096, 097, 098) → deploy API/web. Do not deploy import 1.1 / `is_default` writers before migrations on that host.

**Smoke after upgrade (Delta):**

1. Member with trades and **no** campaign still lists Trade Log and Reports.  
2. Member with an existing campaign still loads `/app/practice/campaign`.  
3. Existing `practice_campaign_id` on a trade still resolves (no orphan FK).  
4. Export pack includes `practice_campaign` surface (may be empty `entries`).  
5. Re-import of a **pre-1.1** `practice_campaign` document does not error.

---

## 9. As-built map (2026-08-08)

| Artifact | Role |
|----------|------|
| `migrations/093_practice_playbook_campaign.sql` | Practice campaign + trade/journal FKs |
| `migrations/096_practice_campaign_account_scope.sql` | `account_id`, `starting_capital`, `goals_md` |
| `migrations/097_practice_campaign_activated_at.sql` | `activated_at` for §4.7 |
| `migrations/098_practice_campaign_is_default.sql` | Account default `is_default` |
| `migrations/100_practice_campaign_cover.sql` | Library cover image columns |
| `migrations/101_practice_campaign_lifecycle.sql` | Signature · amendments table · predecessor · backfill |
| `server/practice_spine_domain.py` | Multi-active; sign/amend/renew; permanence; prefill; pause/resume; cover |
| `DELETE /api/me/practice/campaigns/{id}` | Unreferenced **and never signed** hard-delete only |
| `GET/PATCH /api/me/practice/campaigns/{id}` | Single-campaign load + patch (+ lineage on GET) |
| `POST …/campaigns/{id}/renew` | Terminal → draft successor |
| `GET …/campaigns/{id}/amendments` | Append-only history |
| `web/app/app/practice/campaign/page.tsx` | **Library** Open/Archive · Cycle chip · Archive Renew |
| `web/app/app/practice/campaign/[campaignId]/page.tsx` | **Dedicated editor** — Signed / Amendments / Lineage / Renew |
| `web/components/trade-log/ImportSheet.tsx` | Account default / pick / new campaign import targets |
| `web/lib/practiceSuite.ts` | Suite nav → **Campaigns** |
| `web/lib/strategyLabSuite.ts` | Suite nav → **Deploy** |
| `Architecture/00-decision-log.md` | DL-257–263 |
| `Specs/schemas/practice-campaign-v1.json` | Machine schema **model 1.2** — signature · amendments · predecessor_export_key |
| `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.4.md` | Pack/export authority for campaign surface |
| `export_domain.build_practice_campaign_document` | Full field export incl. signed/lineage/amendments (1.2) |
| `import_domain.commit_practice_campaign` | Additive import + predecessor second pass + amendments |
| Trade Log Spec A-2 / A-2a / A-2b / A-7 | Account retire mechanic (concept §4.9); **default account** designation authority |
| **§4.5 signature · amendments · renew** | **Landed L0–L3 + X1 pack** |
| **§4.7a Default Campaign** | **Spec authority landed** — ensure continuous primary, term gate, Reports capital, goals/boundaries open; **implementation target** |

---

## 10. Related documents

| Doc | Relation |
|-----|----------|
| [Trader Development Phase 1 Own Spine v1.1](./FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1_1.md) | Playbook + campaign MVP; **single-active superseded** — bump v1.2 or § amendment (checklist §11) |
| [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) | OD-1.3 superseded by DL-259 — amend to v1.2 |
| [Playbook Scrapbook Presentation v1.1a](./FatTail-Labs-Playbook-Scrapbook-Presentation-v1_1a.md) | OD-PB-7 permanence pattern; campaign keeps trade FKs |
| [Trade Log Spec v1.1](./FatTail-Labs-Trade-Log-Spec-v1.1.md) | Accounts, import, `practice_campaign_id`; **account retire/archive mechanic** (A-2, A-2a, A-2b, A-7) — concept in this doc §4.9 |
| [Member Practice Export](./FatTail-Labs-Member-Practice-Export-Spec-v1.4.md) | Pack surfaces — campaign first-class (§4.11) |
| [Strategy Lab Life Cycle](./Strategy-Lab-Life-Cycle-Architecture-v1.1.md) | Develop / curate / campaign language |
| [Strategy Lab Architecture Design](./Strategy-Lab-Architecture-Design-v1.0.md) | Design · Curate · Deploy labels |
| [Campaign Workflow Spec v1.0](./FatTail-Labs-Campaign-Workflow-Spec-v1.0.md) | **Marketing** only |
| LifeCycle.pdf | Source diagram for Campaign Phase |

---

## 11. Documentation parity checklist (Invariant #6 — lands with this body of work)

| Item | Owner action | Status |
|------|--------------|--------|
| DL-258–262 in `Architecture/00-decision-log.md` | Confirm present | Landed |
| Decision Addendum **OD-1.3** → multi-active via DL-259; addendum **v1.2** or normative § pointing here | Alpha/docs | **Open** — must not stay “later” |
| Phase 1 Own Spine v1.1 §2.2 / campaign MVP “two actives blocked” → v1.2 or amendment note | Alpha/docs | **Open** |
| Practice Export Spec **v1.4** + `schemas/practice-campaign-v1.json` + export/import 1.1 | Alpha | **Landed** with this body of work |
| Playbook scrapbook pack “campaigns green” reads §4.11 as completeness | Gate writers | Reference this § |
| Trade Log Spec A-2 / A-2a / A-2b / A-7 (account retire) | Alpha — mechanic authority | **Landed** in Trade Log Spec v1.1 |
| DL for contract framing / permanence-as-platform-law / account retirement concept | Alpha — when logging | **Open** (this body of work) |
| Starting frames copy seeds (Tango/Echo) | Tango | **Open** — §4.4 |
| Open vocabulary tags/`kind` (if ever) | Future OD | **Deferred** — §4.3b ladder, not v1 |
| **§4.7a Default Campaign** implement (ensure, continuous term, term gate, Reports capital) | Alpha | **Open** — concept locked |
| **Explicit campaign boundaries** (goals → machine-visible limits) | Coach + Alpha | **Open** — discussion (§4.7a.6); do not invent gates yet |
| Member words: **default account**, **Default Campaign**, **End campaign** | Tango/Echo | **Locked** in concept; chrome pass open |

---

## 12. Claude review disposition (2026-08-08 advisor pass)

| Item | Disposition |
|------|-------------|
| **B1** Campaign deletion / permanence (OD-PB-7 platform-wide) | **Closed** — §4.5 + acceptance #10 |
| **B2** Active-selection rule | **Closed** — §4.7 (book default → account-bound → most-recently-activated) + #11 |
| **B3** Export yaml (journal stamps, 096–098, M2M) | **Closed** — §4.11 + schema + acceptance #12 |
| **S1** Three Deploys | **Adopted** — §3.3 prefers **Approve/Release** for Curation final-review |
| **S2** `goals_md` Sacred #8 split | **Adopted** — §4.8 |
| **S3** Unbound semantics | **Adopted** — §4.6 |
| **S4** Parity checklist | **Adopted** — §11 |
| **S5** §4.3 wording | **Adopted** — §4.3 rewrite |
| **A1** §1 contract frame + purpose-generality | **Folded** — §1 |
| **A2** Non-goals (counterparty + no closed `campaign_type`) | **Folded** — §7; open vocabulary path §4.3b |
| **A3** Account retirement | **Folded** — §4.9 + Trade Log A-2\* + acceptance #13 |
| **Umpire doctrine + kind ladder** | **Folded** — §1 seamless order; §4.3b frames → open vocab → enum only by OD; acceptance #15–17 |
| **Signature · amendments · renewal cycles** | **Folded** — §4.5 full lifecycle; acceptance #23–30; pause ships; member word **Cycle**; no Journey coupling |
| **D1 Archive list** | **Folded** — §4.5.5 Open/Archive; Renew in archive; no P&L chrome; acceptance #30 |
| **D2 Signature permanence** | **Locked (a)** — hard-delete needs zero stamps **and** `signed_at` NULL; signed-unperformed → abandon only (§4.5.6, #10) |
| **D3 Cold-start GET** | **Fixed** — offered one-tap create; GET list read-only (§4.5.5b, #15); no side-effecting list |
| **Minors** | #26 cites §4.5.2/§4.5.6; **Never signed** display §4.5.9 |
| **Default Campaign continuous primary** | **Folded** — §4.7a; acceptance #31–35; boundaries discussion open #35 / §4.7a.6 |

Nothing from prior v1.0 product scope removed. §4.5 runtime landed. **§4.7a Default Campaign** is concept authority — implementation target. Open: ensure/term-gate/Reports capital wiring; **explicit boundaries** discussion; doc parity (Phase 1 / Decision Addendum v1.2); Tango chrome polish.

---

## 13. Document history

| Date | Note |
|------|------|
| 2026-08-08 | **Structured Practice Spec v1.1** — Two Roles (boundary/goal) restored; pointer moved from v1.0. Bench plan: `docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.1.md`. |
| 2026-08-08 | **Structured Practice model** formalized: [`FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.0.md`](./FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.0.md) (now **superseded** by v1.1) from `docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`. Supersedes interim §4.7a continuous signed-default where conflicting; Concept Spec v2.0 fold pending. |
| 2026-08-08 | **§4.7a Default Campaign** (Coach evening): interim continuous charter framing — **partially superseded** by Structured Practice Spec ledger doctrine (see that Spec §4 supersessions). |
| 2026-08-08 | v1.0 — Coach product authority: professional concept, retail simple; dual mode; Deploy vs container; optional multi-campaign (DL-258–262) |
| 2026-08-08 | v1.0 review close — B1 permanence (OD-PB-7 platform-wide); B2 prefill rule + `activated_at`; B3 pack yaml (trades + journal + 096 + M2M); S1–S5 wording; §11 parity checklist |
| 2026-08-08 | §1 Positioning — **campaign = project bound by a contract** (self / external counterparty); clause map ↔ LifeCycle; process-only; never platform-signed; formation arc. Retail-simple table retained as delivery. §4.4 Tango copy flag; §4.5 `abandoned` honesty; §7 counterparty non-goal. |
| 2026-08-08 | §1 scales to accounts; **§4.9 Account retirement** (clean = no open contracts; retire=archive never delete; soft open-campaign gate; unstamped not a gate; Trade Log owns mechanic). APIs → §4.10; import/export → §4.11 (Book default path + pack `is_default`). Prefill prefers book. Schema 098. Acceptance §8 #5/#11–13. |
| 2026-08-08 | Claude advisor pass **A1–A3 folded:** purpose-agnostic deliberate-practice unit (§1); no `campaign_type` enum (§7); starting frames §4.4; disposition table §12; acceptance #14. B1–B3 confirmed closed in body. |
| 2026-08-08 | **Umpire doctrine** (§1 seamless order); **§4.3b** purpose ladder: frames now → open tags/`kind` by OD → closed enum only if schema diverges; market-operation as pack not type; acceptance #15–17; §7 splits closed enum vs deferred open vocab. |
| 2026-08-08 | **Campaign Charter Architecture** (Coach construct): North Star Contract + daily pulse + weekly pivot + monthly/Q horizon (§1 / §4.0 / §4.3c–g); 5-stage blueprint under capital charters; acceptance #18–20. |
| 2026-08-08 | **§4.3c Scientific Trading Protocol** + **Practice suite law:** all suite tools designed around daily Hypothesis → Experiment → Reflection; suite map; Campaign = optional wrapper; acceptance #21–22; practiceSuite blurbs aligned. |
| 2026-08-08 | **§4.5 Lifecycle amendment:** signature (`signed_at` / immutable `signed_terms`); append-only amendments; pause/resume as clock event; **Renew** + derived **Cycle** number via `predecessor_campaign_id`; no Journey coupling; backfill honesty; acceptance #23–29; library vs dedicated editor; member word **default** for `is_default`. |
| 2026-08-08 | **§4.5 close-out (D1–D3 + minors):** Open/Archive library (§4.5.5); signature = permanence (#10 / §4.5.6); empty library **offered** create, no GET-side-effect (§4.5.5b); Never signed (§4.5.9); #26 cite fix; acceptance #30; disposition ledger complete. |
