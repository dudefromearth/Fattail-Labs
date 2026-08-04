# Strategy Lab — First Pass  
## Design → Curation → Deployment · Basic & Pro modes

**Status:** Product first pass (three-step life cycle + dual mode locked)  
**Date:** 2026-08-03  
**Primary spine (member-facing):** **Design · Curation · Deployment**  
**Modes (member-facing):** **Basic** · **Pro**  
**Source process:** `LifeCycle.pdf` (Development → Curation → Live Campaign)

---

## Precept #1 — No absolute false results

**Never include features, defaults, or toggles that produce absolute false results.**

This is the highest product law for Strategy Lab. It outranks convenience, “wow” demos, and mode simplicity.

| Allowed (simple) | Forbidden (lying) |
|------------------|-------------------|
| Hide friction **editors** in Basic | Run with **zero** slippage / commission / fees |
| Progressive disclosure of Pro knobs | “Costs off” research mode that looks like a real test |
| Label proxies clearly (e.g. daily open ≠ 14:30) | Claim minute entry times we do not simulate |
| Approximate models **named** as approximate | Silent fantasy fills that look institutional |
| Refuse to save/run dishonest Specs | Soft defaults that invent free edge |

**Simple ≠ optional honesty.** Basic may hide knobs; it may not omit costs or invent precision.

**Implications**

1. Friction (slippage, commission, fees) is **always on** in every backtest.  
2. Pro may **edit** friction to match a broker — not disable it.  
3. Engine scope must be labeled when it is a proxy (daily bars vs minute clock).  
4. If we cannot model something truthfully yet, we **do not claim it** in the Spec summary or metrics.  
5. Any future “what-if” tool that removes reality must be isolated, labeled fantasy, and never feed Curation/Deployment gates.

---

## 0. Two modes (Basic & Pro)

Same life cycle for everyone. **Mode controls how much power and surface area** you see — not a second product.

| | **Basic** | **Pro** |
|---|-----------|---------|
| **Who** | New to process, validating one edge, wants guardrails | Advanced trader, coaching track, multi-strategy book |
| **Promise** | Finish Design → one curated slot → one campaign without drowning | Full experiment lab, deeper tests, multi-book tools |
| **Default** | **On for new users** | Opt-in toggle (persisted per member) |
| **Spec** | Templates + few fields | Full recipes, advanced filters, custom exits |
| **Test** | One-button run, 5 metrics, plain verdict | IS/OOS labels, variations, slip stress, later WF/MC |
| **Curation** | Single strategy focus, simple health | Book limit, grouping, correlation notes, size policies |
| **Deployment** | Guided paper-first campaign | Multi-strategy campaign, bots later, prune tools |
| **Language** | No jargon by default | Optional quant labels (IS/OOS, PF, etc.) |

### Mode rules (non-negotiable)

0. **Precept #1.** No absolute false results — modes never disable honesty.  
1. **Same gates.** Basic cannot skip Design honesty or Risk Shell. Pro cannot skip them either.  
2. **Same Spec IR underneath.** Basic is a simpler form on the same object; switching to Pro never loses data.  
3. **Pro is progressive disclosure**, not a different database.  
4. **Basic stays simpler than Option Alpha.** Pro may approach OA power later without becoming the default UI.  
5. **Mode is a preference**, not an entitlement wall (unless you later gate Pro to navigator+). Recommend free toggle for entitled Strategy Lab users.

### Where the toggle lives

- Global: Strategy Lab header — `Basic | Pro`  
- Remembers last choice (`localStorage` / member prefs)  
- On a strategy card: “Opened in Basic” badge if Spec used only basic fields; “Uses Pro fields” if advanced keys set (so you don’t hide complexity by accident)

### Per-step mode matrix

#### Design

| Capability | Basic | Pro |
|------------|-------|-----|
| New from template | Yes | Yes |
| Blank Spec | Soft-discouraged | Yes |
| Structure types | IC, put credit, call credit | + more structures over time |
| Strike model | Width $ or short delta presets | Full leg recipes (exact/closest, offsets) |
| Entry time | Single clock time | Window, multi-day rules |
| Filters | FOMC skip; optional open% or RSI (one) | Stack filters, groups, custom |
| Exits | Hold to expiry **or** 50% PT | Consecutive hits, time stops, stacks |
| Friction | Always “realistic fills” preset | Custom open/close slip, stress grid |
| Test | One run · auto holdout · 5 metrics | Compare A/B, try one change, metric pack |
| Walk-forward / Monte Carlo | Hidden | Later Pro tools |
| Plain-English Spec sentence | Always | Always |

#### Curation

| Capability | Basic | Pro |
|------------|-------|-----|
| Book size | **1** strategy (focus) | Up to book limit (e.g. 3) |
| Health labels | Active / sick | New / in-process / mature / sick |
| Grouping / correlation | Hidden | Manual tags + notes |
| Size policy | 1 contract or fixed $ | Fixed risk, % capital, per-strategy |
| Monitor | Simple “needs attention” | Richer signals later |

#### Deployment

| Capability | Basic | Pro |
|------------|-------|-----|
| Campaign | One strategy, paper-first wizard | Multi-strategy book campaign |
| Dates | Start + end required | + rebalance notes |
| Log | Link Practice Log | Same + campaign dashboard |
| Automation / bots | Not in Basic v1 | Pro later (frozen Spec → bot) |
| Prune / retro | Guided checklist | Full tools |

### Switching Basic → Pro mid-strategy

- Allowed anytime.  
- Advanced fields appear empty/default until set.  
- If user switches **Pro → Basic** and Spec has Pro-only fields: show warning *“This strategy uses Pro rules. Stay in Pro to edit them, or simplify to Basic defaults.”* — do not silently strip.

### Default path (Basic user story)

1. New idea from **Afternoon iron condor** template.  
2. Tweak time / width if needed.  
3. Run test → read verdict.  
4. Kill or **Send to Curation** (only slot).  
5. Start **paper** Deployment campaign with end date.  
6. Retro → next Design.

Pro user story adds: multi-variation testing, multi-slot book, denser metrics, later bots.

---

## 1. The three steps (only three)

```
DESIGN ──────────► CURATION ──────────► DEPLOYMENT
idea · model · test     book · health · size     campaign · log · retro
     │                      │                         │
  many die               few booked              time-boxed run
     │                      │                         │
  kill / trash            sick / RIP               prune · end · lesson
```

| Step | Member name | PDF name | Job |
|------|-------------|----------|-----|
| **1** | **Design** | Development | Invent, specify, test, optional sim — most ideas die here |
| **2** | **Curation** | Curation | Choose a small book: health, group, size, monitor |
| **3** | **Deployment** | Live Campaign | Time-boxed capital (paper or live), log, prune, retrospective |

**Tagline:** *Most ideas die in Design. Survivors earn a book slot. Campaigns end on purpose.*

No four-stage Build/Prove/Paper/Run as the primary UI. Those words may appear **inside** Design or Deployment as sub-labels only if needed.

---

## 2. Product promise

> **One life cycle. Three steps. A small book. Honest kills.**

Simpler than Option Alpha: guided Spec + simple test in **Design**, book discipline in **Curation**, campaigns in **Deployment** — not a filter warehouse or bot graph as the home screen.

---

## 3. What’s inside each step

### 3.1 Design (builder + backtester live here)

Maps PDF Development cycle:

| Sub-step | UI | First pass |
|----------|-----|------------|
| Idea / hypothesis | 1–2 sentences + style fit | Full |
| Model | Spec: market, structure, entry, exit, risk shell | Full (simple form) |
| IS test | Backtest train window | Full |
| OOS test | Auto holdout (plain language: “years it never saw”) | Full |
| Deploy to sim | Optional paper-on-live-data before Curation | Shell |

**Board column:** Design  
**Primary CTAs:** Save Spec · Run test · Kill · **Send to Curation** (only if test gate passes)

**Design gate (must pass to leave):**

- Spec complete + Risk Shell  
- Costs-on test with holdout not “broken”  
- Version frozen  
- Written keep reason  

### 3.2 Curation (the book)

Maps PDF Curation cycle:

| Sub-step | UI | First pass |
|----------|-----|------------|
| Categorize | Health: new / in-process / mature / sick | Full labels |
| Group | Book slots + optional tags (low correlation) | Simple slots |
| Position size | Policy on the book card | Fixed $ / 1 ct / % capital |
| Monitor | Quiet vs needs attention | Shell |
| Deploy | **Start campaign** → Deployment | Full action |

**Board column:** Curation  
**Chrome:** `Book 2/3` hard limit  

**Curation gate (to start Deployment):**

- At least one strategy in book, not sick  
- Size policy set  
- Campaign dates proposed  

### 3.3 Deployment (campaigns)

Maps PDF Campaign:

| Sub-step | UI | First pass |
|----------|-----|------------|
| Strategies | Frozen Specs only | Full |
| Capital allocation | Across book | Simple |
| Start / end date | Required end date | Full |
| Log | Session / trade links → Practice Log | Link-first |
| Prune | Remove sick mid-campaign | Full |
| Retrospective | One lesson → feeds Design | Full |
| End | Close campaign deliberately | Full |

**Board column:** Deployment  
**No mid-campaign rule rewrite** — change rules = new Design version, re-curate.

---

## 4. Board UI (home)

```
┌──────────────────────────────────────────────────────────────┐
│  Strategy Lab              Book 1/3              + New idea  │
├────────────────┬────────────────┬────────────────────────────┤
│    DESIGN      │   CURATION     │       DEPLOYMENT           │
│  (candidates)  │  (the book)    │     (active campaigns)     │
└────────────────┴────────────────┴────────────────────────────┘
│  Killed / retired (collapsed)                                │
└──────────────────────────────────────────────────────────────┘
```

**Card fields:** name · market · one-line hypothesis · health · last test verdict (Design) or campaign days left (Deployment).

---

## 5. Design workspace (strategy builder + backtester)

Still **simpler than OA**:

### Spec (four cards)

A. **Idea** — hypothesis  
B. **Structure** — underlying, structure type, wings/delta, time, size  
C. **Rules** — FOMC skip, optional open%/RSI, exit (hold vs 50% PT), realistic fills on  
D. **Risk shell** — max loss trade/day  

Plain-English Spec sentence always visible.

### Test

One button: *costs on · auto holdout*  
Five metrics + one sentence verdict  
**Try one change** (single-factor variation)  
Actions: Keep designing · **Send to Curation** · Kill  

---

## 6. Domain model (stage enum)

```text
strategies.stage ∈ { design, curation, deployment, killed }
strategies.health ∈ { new, in_process, mature, sick }   -- mainly curation

strategy_versions   -- frozen on send-to-curation and on campaign start
backtest_runs       -- design only
book_memberships    -- curation slots
campaigns           -- deployment
campaign_logs / links to practice log
```

Promotion:

```
design  --(gate)-->  curation  --(start campaign)-->  deployment
   │                    │                  │
   └── kill ◄───────────┴── sick/prune ────┴── end + retro → new design work
```

---

## 7. Sub-process detail (PDF fidelity without extra top-level steps)

Members see **three** columns. Coaches/docs can expand:

**Design includes:** hypothesis, model, IS, OOS, optional sim  
**Curation includes:** categorize, group, size, monitor  
**Deployment includes:** allocate, date box, log, prune, retrospective, end  

Walk-forward / Monte Carlo = advanced Design tools later, not new top steps.

---

## 8. First-pass build slices

| Slice | Deliverable |
|-------|-------------|
| **0** | Hub + board UI: three columns; fake cards |
| **1** | Design Spec + fake/fixture backtest + kill/send-to-curation |
| **2** | Curation book limit + health + size policy |
| **3** | Deployment campaign dates + retro form |
| **4** | Massive historical for real Design tests |
| **5** | Paper/live rails (Tradier) under Deployment |

---

## 9. Copy principles

- Always say **Design, Curation, Deployment** in nav and board.  
- Avoid “bot factory” framing; automation is a Deployment capacity tool later.  
- Kill early in Design is success of the filter.  
- Process metrics only — no profit-promise chrome.

---

## 10. Alignment notes

| Older language | Now |
|----------------|-----|
| Build / Prove / Paper / Run | Folded into Design (build+prove+sim) · Curation · Deployment |
| Development / Campaign (PDF) | Design / Deployment (member words) |
| OA Create Bot | Optional later under Deployment — not the climax of Design |

---

*Life-cycle native Strategy Lab. Process over profit claims.*
