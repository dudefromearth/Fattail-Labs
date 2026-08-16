# 32 — Strategy Lab Guiding Doctrine (architecture & design)

**Status:** **AS-BUILT MAP + DESIGN DIRECTION** (2026-08-16)  
**Normative law:** [`Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md`](../Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md) (**SL-GD** · **DL-382–391**)  
**Position paper:** [`docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md`](../docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md)  
**Type:** How the guiding light sits on the life-cycle kernel, Design tabs, Options Lab surfaces, and what is not yet wired.

This file does **not** replace Arch **16** (OA-class service, opposite direction), Arch **17/26** (member timeline), Arch **19** (as-built routes), Arch **28–31** (bus / heatmap / OPF / SSR). It **binds them** to SL-GD.

---

## 1. Purpose of this map

Coach locked the **why** of Strategy Lab (2026-08-16 conversation → Spec v1.0). This document answers **where that why lives in the system** and **what implementers must reuse**.

```
SL-GD (doctrine)
    │
    ├─► Design tabs (builder)     web/components/strategy-lab/*
    ├─► Pack schema / validation  server/strategy_packs/packs/butterfly/
    ├─► Life cycle kernel         phase = development | curation | deployment | bin
    ├─► Evidence                  validation@1 · MC · forward walk
    ├─► Resolver (one selector)   regime → window → surface → tile → scope → attempt
    └─► Lenses (do not fork)
            Options Lab Advanced Flies (sym-fly)
            Options Lab Volume Profile
            Options Lab GEX template
            OPF + Market Bus (Arch 28–30)
            Analyzer per-leg vol surface (modeler)
```

---

## 2. Life-cycle kernel (unchanged keys)

| Coach / UI | API / DB `phase` | Doctrine job (SL-GD8) |
|------------|------------------|------------------------|
| **Design** | `development` | Okay seat: species, strikes, schedule, 2–6% band, exits. Prove **distribution shape**. |
| **Curate** | `curation` | Does it **cluster** (non-correlated) with the book? Multi-member Curate **absolute**. |
| **Deploy** | `deployment` | Run the **combination**. Members get Deploy UX except real-broker real-money (**DL-252**). |
| **Archive** | `bin` | Retire; keep learning. |

**Ossification (forbidden at this layer):** promote because **one** walk won; deploy a **hero**; stop curating once something is live.

**Maintenance curate:** new okay seats may exist to **support / hedge / replace** deployed ones so the **book shape** holds — not only to add clones.

---

## 3. Design work area (as-built → doctrine)

Route: `/app/strategy-lab` · `StrategyLabApp` · `StrategyDesigner`.

| Tab id | UI title | As-built | SL-GD next |
|--------|----------|----------|------------|
| `identity` | Position Builder | Fly book dropdown + Other; Long/Short debit/credit icon; widths in **strikes**; definition + **ShapeRiskGraph** | Keep compact. No R2R input. |
| `structure` | Expiration Schedule | 0DTE / 1DTE / Next; Mon–Fri vs MWF from `options_cadence` | Horizon **changes lead lens** (0–1 vol, 3–5+ HVN/LVN). |
| `risk` | Risk & Capital | `max_capital_at_risk`, unit, `primary_metric` | **Lock 2–6%** as designed max DD band. |
| `edge` | Convexity & Debit | RoC band + **shared P&L surface** (`surfaceModel.ts`) + debit-to-width | **One surface model** across Strategy Lab, Analyzer Surface viewport, and the future day-replay harness. Per-leg IV. Design preview may be `sticky_cli` (labeled). |
| `timing` | Timing & Entry | Warrant chips + VP trigger + **pseudo-code** | OTM flies: **VP + price action**. GEX / order flow optional. Wide remainder = pseudo-code. |
| `exits` | Exit Rules | **Dynamic trailing stop** + drivers (decay, time) + **pseudo-code** | Trail required. Dynamic part = time + premium decay (+ pseudo-code). |
| `review` | Review | Back test / forward walk cards; MC bars + wireframe | **Shape** of MC only. No hero-path chrome. |

**Fly catalog (code):** `web/lib/options-lab/strategyCatalog.ts` (`FLY_TYPES`, `OTHER_STRATEGIES`).  
**Relative shape (strikes):** `web/lib/options-lab/designRelativeShape.ts` (`asStrikes`, `STRIKE_PT`).  
**Pack:** `server/strategy_packs/packs/butterfly/{schema,ui,validation}.py`.

**Widths:** strike counts (3 = three strikes). Legacy point values ≥10 convert via `asStrikes` (÷5). Pack `width_points_*` may remain points for scan; Design UI speaks strikes.

---

## 4. Lenses — reuse, do not fork

| Doctrine job | Surface | Path |
|--------------|---------|------|
| Tile / R:R / fly-surface convexity | **Advanced Flies** | `web/lib/options-lab/templates/symFly.ts` · `HeatmapChainPanel.tsx` · `/app/options-lab/heatmap` |
| Structure (placement) | **Volume Profile** HVN/LVN | `/app/options-lab/volume-profile` · VP Spec v0.4 |
| Management map | **GEX** | `templates/gex.ts` (same heatmap host) |
| Instrument truth | **OPF + Market Bus** | Arch **28–30** · DL-309 |

**AF-DP1–2 apply inside Strategy Lab:** tile compute is **pure** on the **shared** dual-side generation. **Zero** new Massive, **zero** extra WebSocket, **zero** package-quote soR for the grid.

**Tile bind (design):** click on Convexity matrix writes pack fields; does not invent strikes (HM8 / AF4 / DL-309). Invalid cell → named state.

**R2R:** stored `otm_r2r` (schema). **Not** a Position Builder control. **Not** a raw Risk number box as the member’s way to “set R2R.” Chosen by **tile**.

---

## 5. Evidence plane

| Artifact | Doctrine |
|----------|----------|
| Back test | Ensemble / **MC distribution** — left-tail depth, right-tail length, skew |
| Forward walk | Other **orders** of the same process — not a second hero |
| `validation@1` | Gate to Curate: **shape** acceptable, not “this path won” |
| Curate runtime | Process evidence (fills, decisions) — still **okay seat**, not star |
| Deploy | Book-level shape while live |

SSR (Arch **31**) is the **thesis** replay plane for structure surfaces — compatible with SL-GD17 when it ships. Do not wait on SSR to refuse one-path ossification in Review UI.

---

## 6. Capital

| Law | Encoding |
|-----|----------|
| 2–6% designed max DD | `max_capital_at_risk` + `percent_of_capital` — **band not yet a hard default** |
| Crash cannot exceed the band | Defined debit · long tent · no undefined risk (pack HC-1) |
| Dim vol → cut exposure | Timing / size / frequency — **not yet a named control** |

`primary_metric` ∈ {`distribution_shape`, Sharpe, Sortino, Calmar, return÷avg DD} — never raw return or win rate. **Return distribution shape** is the doctrine-aligned primary (SL-GD17 / SL-GD35). Ratios remain allowed. Shape score is uncomputable until MC — honest proxy, never a silent fake.

---

## 6a. Engine rulings (DL-383)

| Ruling | As-built | Must become |
|--------|----------|-------------|
| **R2R = potential at design/entry**, never result | Trade Log `entry_r2r`; Advanced Flies tile R:R from mids | Design `otm_r2r` stays potential-only. No result-R2R in Review or buckets. |
| **ExitPolicy potential-denominated**, structure-agnostic | v1.1 `take_profit_frac_of_max_profit`, `stop_multiple_of_premium_risked` | Add **frac-of-debit** and **tent-relative**. No credit-only universal names. |
| **One atomic position** | Pack treats Batman as a package; Curate envelope is a position | Trade log, BT events, exits, **50/37.5/10/2.5** buckets = **position**, never a leg. |
| **Idempotency keys the position** | O-1…O-5 client_order_tag | **O-6:** one key per **position fill** attempt, one per **position exit** attempt; retry same key; **log both**. |

---

## 6b. Config resolution (DL-384)

Folded from [`docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md`](../docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md). Normative: SL-GD **§16**.

**Principle:** a strategy is a **rule**. The **surface** (3D per-leg vol, 3–5s gold) supplies strikes, debit, marks. **No absolute in the config that the surface will move.**

**One selector, two callers**

```
Convexity zone × width (strikes) × debit range × R2R-at-potential floor × curvature × RoC band
        │
        ├─► Heatmap preview (human)     same function
        └─► Bot resolve (machine)       same function
```

Designer is **done** only when every tab is **machine-grade** (two-truth). A heatmap-only sketch is not a strategy.

**Resolve loop (every candidate moment)**

1. Regime (premarket vol) — else no attempts today  
2. Window (morning / afternoon / T−N)  
3. Surface read (this tick’s chain + per-leg vol + spot)  
4. Selector on **listed** chain — rank by the **same** convexity score the heatmap shows  
5. Scope test — else **no trade this moment** (event)  
6. Attempt atomic position — retry **3–5 on the next surface**, same idempotency key; abandon out-of-scope  
7. Hold/manage on the **moving** surface; exits vs **potential**; GEX manage-time  
8. Record one atomic event + **provenance** (config hash, surface tier gold/silver, tick, score, geometry, R2R at potential, per-leg vol, friction model, operator-friction, MC seed)

**Same config, different day, different fly, same seat.**

**MC:** tape, config, selector, listed strikes **fixed**. Fills, retry geometry, operator friction, which eligible tile wins **vary**. Shape out.

**Two-curve inside resolve:** engine picks opportunistic vs last-day by **surface curve shape**, not clock alone.

**As-built today:** relative strike widths + fly types + risk graph (human preview of *a* shape). **Not yet:** shared selector module, heatmap-as-preview of *that* selector, provenance blob, resolve loop in BT/FW/sim/live.

---

## 6c. VP trigger grammar (DL-385) + market memory (DL-386)

Folded from Coach PDF *VP Structural Analysis — Reference for the Timing & Entry Trigger Grammar* (updated 2026-08-16 with **§7** peer-reviewed long-memory grounding). Spec **§17**. Searchable: [`docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md`](../docs/VP-Structural-Analysis-Timing-Entry-Trigger-Grammar.md). Full Coach text: [`docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md`](../docs/VP-Structural-Analysis-Trigger-Grammar-Reference_1.md).

**The cyan arrows are the strategy.** Timing & Entry writes:

```
TRIGGER = level_class × interaction × session_window  →  travel_target?
```

| Piece | Values |
|-------|--------|
| level_class | hvn_top (red) · hvn_bottom (green) · lvn (yellow) · intranode (blue) · retracement |
| interaction | test · hold · break · retest · reject |
| session_window | overnight · premarket · open · mid-morning · midday · early-afternoon · late-afternoon · close · T−N to close |
| travel_target | next class · N ticks · tent vs next level (feeds Convexity selector + opportunistic exit) |

**Resolve:** after window check, surface read includes **today’s classified VP**. Selector runs **only when the trigger has fired**.

**Pack:** `entry_trigger` JSON on butterfly common schema. **UI not built.**

**Classifier** is versioned on every resolved trade. Coach morning analysis (ES1! Aug 12–14 2026) is the **reference implementation**. **SPY tape now; ES when wired.** Never store a price in the config.

**Acceptance:** every arrow expressible without a hard price; gold-day replay fires at Coach’s arrows; heatmap preview on fire; no bare clock, no price in the tab.

### Market memory (Yankee lane · SL-GD30–34)

Structural analysis does **not** require daily updating. Nodes remember weeks–decades. Mature region refresh ~**3–4 weeks** (minor edge / shelf / LVN). Frequent updates only where history is thin (ATH / untraded) — structure still **forming**.

Long memory is a **documented statistical property** (Mandelbrot lineage + peer-reviewed long-range dependence in magnitudes / volatility). **Not a slogan.** **Yankee** gates the frame. Academic and practitioner names stay **bench-only** until a real citation pass (Spec §17.7).

| Law | Encoding |
|-----|----------|
| Full-tape composite, not a 30-day window | 2004–2026 SPY tape is the foundation. Recency is one weight among mass, confirmations, age. |
| VP is a **slow layer** | `profile_version` on every trade. Never recompute classified levels at 3–5s beside greeks. One classifier output serves a month of backtests. |
| Cadence = function of memory | Surface carries `structure_maturity` (`mature` / `forming`). Strategy may accept one and refuse the other. |
| Node age + confirmation count | Continuous attributes on the firing level; trigger grammar may filter. |
| VP-AI = **change-detection** | First job: has memory changed enough to warrant a new `profile_version`? Not daily generation. |

**As-built today:** Options Lab VP histogram + eligibility. **Not yet:** cumulative composite SoR, `profile_version`, `structure_maturity`, age/confirmations on the trigger, VP-AI change detector.

*The structure the arrows point at remembers.*

---

## 7. Copy and notifications

Notifications rail is the member communicator (existing Design law). It must not lecture, and must not use Coach mark examples as **targets**.

Member-facing one-liners (Spec §0) may appear in help / Review empty states **only** as **process**. Forbidden: “12.5% huge gains,” crash-profit guarantees.

---

## 8. Future host seam

Today: one host; entitled members have Design+Curate.  
Future: `practice.fattail.ai` vs `labs.fattail.ai` (Arch **25**, DL-248–250). **Do not** strip Navigator Strategy Lab access now. New work uses **entitlement keys** and Spec “home” tags.

Guiding doctrine is **Labs / bot-book** identity. Practice may **teach** the same sentences; it does not need the live cluster runtime.

---

## 9. Implementation sequence (when Coach opens a wave)

1. **Convexity & Debit** hosts Advanced Flies (reuse template + `useOptionChainBus`). Tile → `otm_r2r` + listed geometry.  
2. **Risk & Capital** locks **2–6%** house band (fail-loud outside, or warn + Coach-confirm).  
3. **Timing** encodes afternoon + T−N + premarket vs EU-open; trigger grammar + **slow-layer** VP (`profile_version`, `structure_maturity`, age + confirmations).  
4. **Exits** name opportunistic vs last-day; GEX as manage-time lens.  
5. **Curate** cluster / correlation / “maintenance seat” flags.  
6. **Review** MC shape acceptance criteria (SL-GD17).

No wave may add a second live-chain path.

---

## 10. Related as-built

| Doc | Role |
|-----|------|
| Arch **16** | Opposite of OA: process, not signal theater |
| Arch **19** | Routes / files |
| Arch **26** | Member timeline NOW |
| Arch **28–30** | Bus · heatmap templates · OPF |
| Pack Butterfly | Schema / UI tabs / validation |

---

**End of Arch 32.**
