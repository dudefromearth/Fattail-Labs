# FatTail Labs — Options Lab Analyzer Spec v0.1

**Status:** **DRAFT · product law + as-built inventory** (2026-08-11)  
**Type:** Product Spec — Options Lab **Analyzer** surface  
**Major buckets:** **Alerts · Positions · Viewport · Time machine · Models · Controls**  
**Short name:** **Analyzer** · **AZ**  
**Filename:** `FatTail-Labs-Options-Lab-Analyzer-Spec-v0_1.md`  
**Surface route:** `/app/options-lab/analyzer`  
**Chrome:** Options Lab suite workspace (`OptionsLabChrome` · `workspace`) under Options Lab nav (Volume Profile · Heatmap · Analyzer)

**Process:** Spec review → OD Accept/Override → implementation plan for residual TARGET laws → code/ATs.  
**Content integrity:** Landing content hash (sha1 of body excluding this line):  
`e3168ab552b37fb8c33a5eb2335091eb2fd06eeb` (v0.1.2 · six-bucket architecture).

---

## 0. Mission

Options Lab **Analyzer** is the member **day-trader risk surface**. Product is organized as **six major buckets** (Coach):

| # | Bucket | One-line job |
|---|--------|----------------|
| 1 | **Alerts** | Threshold price rules: create, list, evaluate, draw on the graph |
| 2 | **Positions** | Definition book (cards) + Builder (full edit) + package/lock |
| 3 | **Viewport** | Single focused OPF risk graph (visualization only) |
| 4 | **Time machine** | What-if / scenario knobs (time · vol · spot %) over OPF resolve |
| 5 | **Models** | OPF pack / use-case selection (day_trade · outlook · backtest) |
| 6 | **Controls** | Session chrome: posture, symbol, spot/VIX, ToS handoff, actions |

Supporting: Market Bus dual-side generations + underlier marks; suite Options Lab chrome.  
**Never** MSC as pricing SoR (DL-293).

**Coach litmus (shared with Position Builder Spec):**  
*When looking at a position in the Builder or the position card, if it is unlocked, the correct pricing is displayed and the rendered position in the viewport is correct — as guaranteed for the active use case and session state.*

**What this is not:** brokerage OMS; multi-definition stacked P&amp;L; MSC regimes/Heston/MC; silent dual package math; profit claims.

---

## 0.1 Relationship to other Specs (normative parents)

| Doc | Analyzer owns / inherits |
|-----|---------------------------|
| [Position Builder & Book Spec v0.2](./FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md) | **Positions** definition/lock/package · **Viewport** viz law · PB-VIEW-* · PB-MODE-* · Builder templates |
| [Options Pricing Foundation Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | **Models** packs · resolve · PackageQuote · RECON · interest · epoch |
| [Market Bus Spec](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Dual-side ladder · stream posture (**Controls** posture) |
| [Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · OC2 · OC5a · OC6a |
| [Heatmap Templates Spec v0_2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | ToS handoff · fly width profiles · Live/Held/Closed heritage |
| [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Dialog · panels · fail-loud |

**This Spec** assembles the **six buckets** into one surface: layout, cross-bucket laws, as-built inventory, TARGET residuals.  
Where PB Spec already defines book/package/lock/viewport economics, Analyzer **must not contradict** PB.

---

## 0.2 Six major buckets (architecture)

```text
                         ┌─────────────────────────┐
                         │     CONTROLS            │
                         │  posture · symbol · ToS  │
                         │  spot/VIX · actions     │
                         └───────────┬─────────────┘
                                     │ session context
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     MODELS      │──────▶│    VIEWPORT     │◀──────│  TIME MACHINE   │
│  OPF pack pick  │ resolve│  OPF risk graph │ what-if│  t · σ · S%     │
│  day/outlk/bt   │       │  one focus      │       │                 │
└─────────────────┘       └────────▲────────┘       └─────────────────┘
                                   │ focus definition
                                   │ package quotes (visible cards)
                          ┌────────┴────────┐
                          │   POSITIONS     │
                          │  list · cards   │
                          │  Builder edit   │
                          │  lock · package │
                          └─────────────────┘
                                   │
                          ┌────────┴────────┐
                          │     ALERTS      │
                          │  create · list  │
                          │  evaluate·draw  │─── price lines on VIEWPORT
                          └─────────────────┘
```

| Bucket | Owns | Does not own |
|--------|------|--------------|
| **Alerts** | Threshold rules, list UI, evaluation vs underlier mark, chart lines | Structure legs, OPF curves, pack choice |
| **Positions** | Definition SoR (cards), Builder, focus, lock, package display path | Curve pixels, alert evaluation |
| **Viewport** | OPF resolve visualization, dual curves, spot line, incomplete/empty states | Writing definition structure (PB-VIEW-1) |
| **Time machine** | What-if time / vol / spot % into resolve; sim spot indicator | Changing card legs unless Save |
| **Models** | Pack id + use case (day_trade · outlook · backtest); epoch re-anchor | Drawing curves (Viewport consumes packs) |
| **Controls** | Posture badge, symbol, ToS paste/Load/Clear, Heatmap link, spot/VIX fields, Refresh/Auto-fit/Builder buttons | Replacing any other bucket’s SoR |

### 0.2.1 Cross-bucket laws

| ID | Law |
|----|-----|
| **AZ-X-1** | **Positions → Viewport:** only the **focused visible** definition (or unlocked-live ToS when none) drives structure. |
| **AZ-X-2** | **Models + Time machine → Viewport:** pack and what-if re-resolve the **same** definition (PB-VIEW-2/3). |
| **AZ-X-3** | **Alerts ↔ Viewport:** create from graph; evaluate on viewport underlier mark; draw lines on graph. |
| **AZ-X-4** | **Controls → all:** symbol, posture, and spot/VIX overrides are session context for Positions quotes, Viewport, and Alerts. |
| **AZ-X-5** | **Positions package SoR** remains OPF PackageQuote (PB17); Viewport curves remain OPF resolve — never MSC. |

### 0.2.2 Inventory map (where detail lives)

| Bucket | Spec sections (detail) |
|--------|------------------------|
| **Controls** | §1.1–1.3, §1.5–1.6, §1.12, actions in §1.9–1.13 |
| **Models** | §1.4, §6 modes |
| **Viewport** | §1.9–1.10, §3 focus, §6 |
| **Time machine** | §1.11 |
| **Positions** | §1.7–1.8, §1.13 Builder, §4–5 |
| **Alerts** | §1.14, §7 |

---

## 1. As-built inventory (complete feature catalog)

This section is **normative for “what exists today.”** TARGET laws in later sections may supersede layout/default behavior after Coach GO.  
Read with §0.2 buckets: each subsection below tags its bucket.

### 1.1 Route, shell, shared suite context · **Controls** (host)

| Feature | As-built |
|---------|----------|
| Route | `/app/options-lab/analyzer` |
| Page | `web/app/app/options-lab/analyzer/page.tsx` |
| Chrome | `OptionsLabChrome` · `active="analyzer"` · **`workspace`** (compact top bar; child fills remaining viewport height) |
| Suite nav | Volume Profile · Heatmap · Analyzer (`OptionsLabNav`) |
| Shared symbol | `OptionsLabProvider` — `market_symbol_universe`, sessionStorage key `options-lab-symbol`, optional `?symbol=` |
| Symbol profile | Resolved profile on universe row (wings, fly_widths, ohlc TF defaults) for suite apps |
| Primary component | `OpfRiskAnalyzer` (`data-testid="options-lab-opf-risk-analyzer"`) |
| Pricing authority | **OPF only** (DL-293). `MscRiskAnalyzer` / `RiskAnalyzerPanel` re-export OPF if present |

### 1.2 Layout (as-built vs TARGET) · **Controls** shell

| Region | **As-built** | **TARGET (Coach)** |
|--------|--------------|---------------------|
| Main split | **Left sidebar** (~21rem) + **right viewport** (`lg:flex-row`) | **Vertical stack:** viewport **above**, position list **below**, with **divider**; single panel with divider *or* two stacked panels |
| Sidebar contents | **Positions list · Alerts list** · OPF pack · Symbol · ToS · actions · Spot/VIX · What-if · mark/RECON chips | Controls may remain in a chrome strip; **book moves under viewport**; **alerts remain a first-class Analyzer region** (strip, under list, or collapsible panel — OD-AZ2) |
| Viewport | Full remaining height · dark canvas · chart panel | Same — **one** focused graph panel |
| MSC heritage | MSC had list **left** of viewport | Labs: list **under** viewport |

### 1.3 Session posture · **Controls**

| Feature | As-built |
|---------|----------|
| States | `Live` · `Held` · `Closed` · `Error` |
| Clock | America/New_York · Mon–Fri 09:30–16:00 → Live; weekend → Closed; else Held |
| Refresh | Interval 30s recompute |
| UI | Badge on chrome; Held labels on theo legend and alert lines when held |
| RECON chip | Hidden as `n/a held` when Held/Closed; pass/fail when Live |

### 1.4 OPF model / mode catalog (UI) · **Models**

Selectable packs (`OPF_ANALYZER_MODELS` — only OPF packs, no MSC):

| Pack id | Use case | Label | Curves |
|---------|----------|-------|--------|
| `day_trade.mark_hybrid@1.0.0` | day_trade | Day trade · mark hybrid | Dual: expiration + T+0 (default) |
| `day_trade.surface@1.0.0` | day_trade | Day trade · surface | Dual |
| `outlook.scenario_surface@1.0.0` | outlook | Outlook · scenario | Dual scenario |
| `outlook.dynamics@1.0.0` | outlook | Outlook · dynamics | Dual (SABR gate → scenario fallback server-side) |
| `backtest.chain_replay@1.0.0` | backtest | Backtest · chain replay | Historical (may fail loud without archive) |
| `backtest.surface_reconstruct@1.0.0` | backtest | Backtest · surface reconstruct | Historical reconstruct |

| Feature | As-built |
|---------|----------|
| Default | `day_trade.mark_hybrid@1.0.0` |
| Mode switch | Changing pack re-resolves **same** definition (PB-VIEW-2) |
| Outlook epoch | Selecting outlook pack **pins** epoch; **Re-anchor epoch** button clears pin, refreshes, re-pins; **epoch stale** when generation epoch advances while pinned (PB-VIEW-7 partial) |
| Time reference label | Live/Held gen · Scenario epoch · Replay no live claim |

### 1.5 Definition sources & focus law · **Positions** + **Controls** (paste)

| Priority | Source | Drives viewport when |
|----------|--------|----------------------|
| 1 | **Focused visible card** → `positionToParsedTrade(card.position)` | `focusedId` set and `visible` |
| 2 | **Parsed ToS paste / handoff** (`raw`) | No focused visible card |

| Feature | As-built |
|---------|----------|
| Unfocus paste | Editing ToS textarea clears `focusedId` |
| Parse error | Loud when raw non-empty and parse fails (unless focused card) |
| Symbol sync | If trade symbol ∈ universe and ≠ suite symbol → set suite symbol |
| Incomplete focus | If focused card `liveState` is `incomplete` or `skewed` → **no curve** (PB-VIEW-6); loud incomplete message |

### 1.6 ToS / Heatmap handoff · **Controls** (entry)

| Feature | As-built |
|---------|----------|
| Storage | `sessionStorage` key `ft_options_lab_analyzer_trade_v1` |
| Event | `ft-analyzer-trade` CustomEvent for cross-route hydrate |
| Sources | `heatmap` · `paste` · `manual` · `builder` |
| Heatmap | Option-click / open Analyzer writes ToS via `saveAnalyzerTrade(script, "heatmap")` |
| UI | Banner “From Heatmap Option-click” when source=heatmap |
| Load button | Validates parse → save paste → clear focus → refresh resolve |
| Clear | Removes stored trade, raw, focus, resets what-if |
| Parse | `parseTosScript` — butterfly · vertical · single · custom; limit @x LMT; debit/credit |

### 1.7 Position book (cards) · **Positions**

**Persistence:** `sessionStorage` `ft_options_lab_analyzer_positions_v2` (migrates v1).  
**List component:** `AnalyzerPositionsList` · `data-testid="analyzer-positions-list"`.

#### 1.7.1 Card fields (`AnalyzerPosition`)

| Field | Meaning |
|-------|---------|
| `id` | Stable session id |
| `label` | Human label from structure |
| `notation` | Compact leg notation |
| `position` | `PositionInput` (underlying, expiration, contracts, legs, direction, net_debit_override) |
| `status` | `ANALYSIS` \| `PENDING` \| `OPEN` \| `PARTIAL_OPEN` \| `CLOSED` \| `CANCELLED` \| `REJECTED` (default ANALYSIS) |
| `livePackagePerShare` | Magnitude of package for display |
| `lastNatSigned` | Last OPF natural signed D_nat |
| `priceSide` | `debit` \| `credit` \| null |
| `visible` | Hidden cards do not drive viewport; package not live |
| `lock` | Unlocked or locked D* (source natural_mid \| user_limit \| tos_limit; freeze flags; hashes at lock) |
| `liveState` | `live` \| `held` \| `not_live` \| `budget_refused` \| `incomplete` \| `skewed` |
| `displayAsOf` | Generation as_of |
| `contentHashes` | Per-exp content_hash map |
| `maxSkewMs` / `epochQuality` | Multi-exp skew metadata |
| `createdAt` / `updatedAt` | Bookkeeping |

#### 1.7.2 Card UI (read-only limited view of definition)

| Element | Behavior |
|---------|----------|
| Click / Enter / Space | **Focus** card → viewport rebinds |
| Focus ring | Tint border + fill when focused |
| Hide/Show | Toggle `visible`; hidden opacity + liveState not_live |
| **Edit** | Opens Position Builder in **edit** mode with that definition |
| **Lock mkt** | `lockNatural` — freezes D* from last complete natural |
| **Lock lim** | Prompt magnitude + confirm credit vs debit → `lockLimit` |
| **Unlock** | Clears lock |
| **Remove** | Deletes card; clears focus if was focused |
| **+ Create** | Opens Builder in **create** mode |
| Package display | Magnitude + DEBIT/CREDIT; locked shows “basis” + optional mkt natural |
| Status chip | ANALYSIS / … color coded |
| Live chip | live · held · not live · not live (budget) · incomplete · skewed |
| DTE | Days to first leg expiration |
| Legs | Mono +qty/−qty strike C/P |
| Debit/credit rail | Left border sky (debit) / emerald (credit) |
| as_of | Tooltip when present |

**Law (TARGET restatement):** Card is a **read-only limited view** of the Builder definition — no freeform leg edit on the card itself (only focus, visibility, lock, remove, open Builder).

### 1.8 Package quotes on cards (PB17 path) · **Positions**

| Feature | As-built |
|---------|----------|
| Hook | `usePackageQuotes` |
| Visible cards | Hydrate dual-side ladders per leg exp → `touchOpfInterest` → `quoteOpfPackage` |
| Apply | `applyPackageQuote` → liveState, signed package, hashes, as_of |
| Hidden | `not_live` without inventing package |
| Interest budget fail | `budget_refused` / “not live (budget)” |
| Incomplete / skew | `incomplete` / `skewed` → package “—” |
| Locked | Display basis D*; still tracks `lastNatSigned` for mkt compare |
| Trigger | Positions change + `generationEpoch` from risk graph |

### 1.9 Viewport — OPF risk graph · **Viewport**

| Feature | As-built |
|---------|----------|
| Hook | `useOpfRiskGraph` |
| Data plane | Dual-side chain ladder poll (wings 50) per unique leg expiration |
| Pricing | `resolveOpfPricing` with pack, strategy, generations, spot, vix, what_if |
| Curves | **Expiration** (emerald) + **theoretical/scenario** (fuchsia / pack legend) |
| Basis shift | If ToS/limit present, shifts curves so basis = limit vs natural mid |
| Breakevens | Both curves |
| Strikes markers | Leg strikes |
| Spot line | Smoothed live underlier mid (`useSmoothNumber`) |
| Sim spot indicator | Separate indicator when what-if spot % ≠ 0 |
| Module cache | Keep-warm across Heatmap ↔ Analyzer route switches (30 min TTL); soft refresh |
| Manual Refresh | Forces re-resolve |
| Auto-fit | `PnLChart` handle `autoFit()` |
| Max/Min P/L | Header summary dollars |
| Incomplete | Loud empty — **no fabricated curve** |
| Error | Loud amber status |
| Empty | Prompt Builder or paste; right-click for alerts |
| RECON | Pass/fail from resolve meta when Live |
| Mark pkg chip | resolve package_debit or focused card live package |

### 1.10 Chart interaction (`PnLChart` presentation) · **Viewport** (+ **Alerts** create/draw)

| Feature | As-built (wired) |
|---------|------------------|
| Dual series render | Expiration + theoretical |
| Spot / sim spot lines | Yes |
| Alert lines | From threshold alerts |
| Context menu alerts | price_above · price_below · price_touch |
| Position-specific alert | Context near curve → pick position notation |
| Legend labels | Pack theo legend + Held suffix |
| **Not required for v0.1 law** but present in component | hi-res secondary series, GEX/VP autofit props, strike drag, curve context, PnL zones — available for future wiring |

### 1.11 What-if (OPF scenario knobs) · **Time machine**

| Knob | Range | As-built |
|------|-------|----------|
| Enable | checkbox | Gates time offset application (day_trade); vol/spot always pass to resolve when set |
| Time offset | 0…72 h | Applied when enabled (outlook respects epoch pin) |
| Vol offset | −30…+30 pts | Always available |
| Spot % | −5%…+5% | Always available; also drives sim spot indicator |
| Reset | button | Clears all three + disable |

### 1.12 Spot & VIX overrides · **Controls**

| Control | As-built |
|---------|----------|
| Spot text field | Override chain/OPF spot when finite &gt; 0; auto-fill from risk/chain when empty |
| VIX text field | Optional vol reference into resolve |

### 1.13 Position Builder (shell from Analyzer) · **Positions**

| Feature | As-built |
|---------|----------|
| Open create | Builder button or list **+** / **Create** |
| Open edit | Card **Edit** |
| Mode | `create` \| `edit` |
| Props | symbol, spotPrice (display/chain), chain accessors, initial PositionInput |
| Save | Create → prepend card + focus; Edit → preserve id/createdAt/lock; write ToS handoff source=builder; close; refresh resolve |
| Cancel | Close without write |

Builder internals (also PB Spec + recent land): listed strikes only, ATM center, live package DEBIT/CREDIT + per-leg contrib, templates, ToS script copy, limit override, packages count — **see §4 and PB Spec §7**.

### 1.14 Threshold alerts · **Alerts**

Alerts are a **core Analyzer feature**, co-equal with the position book and the viewport for day-trader workflow. Implementation: `AnalyzerAlertsSection` + `analyzerBook` alert model + `PnLChart` context menu / `alertLines`.

#### 1.14.1 Persistence & identity

| Feature | As-built |
|---------|----------|
| Store | `sessionStorage` key `ft_options_lab_analyzer_alerts_v1` |
| Scope | **Session / tab** (not server multi-device in v0.1) |
| Load/save | On Analyzer mount / on every alerts state change |
| Id | Client uid `al_…` |

#### 1.14.2 Alert model (`AnalyzerThresholdAlert`)

| Field | Meaning |
|-------|---------|
| `id` | Stable session id |
| `type` | `price_above` · `price_below` · `price_touch` |
| `symbol` | Underlier product key (uppercase) |
| `targetPrice` | Level on underlier axis |
| `positionId?` | Optional link to a book card (position-scoped alert) |
| `title` | Short member text (e.g. `SPX rises above 5500`) — **no profit claims** |
| `severity` | `info` · `low` · `medium` · `high` · `critical` (create defaults `medium`) |
| `status` | `new` · `acknowledged` · `dismissed` · `triggered` |
| `enabled` | When false, not evaluated |
| `createdAt` | ISO timestamp |
| `triggeredAt?` | Set when first triggered |
| `color` | Chart line color (above green / below red / touch blue by default) |

#### 1.14.3 Create paths

| Path | As-built |
|------|----------|
| **Viewport context menu** | Right-click chart → **Price Alert at {price}** → above / below / touch → `createPriceAlert` · `onOpenAlertDialog` |
| **Position-scoped** | Context near curve with `positionLabels` → pick position notation → alert with `positionId` + price (`onPositionAlertSelect`) |
| **Focused card default** | Global chart create may attach `focusedId` when present |

#### 1.14.4 Evaluate (runtime)

| Rule | As-built |
|------|----------|
| Mark | **Same underlier mark as viewport** (smoothed `displaySpot`) |
| Symbol filter | Alert `symbol` must match Analyzer suite symbol (or empty) |
| Skip | `enabled=false` · `dismissed` · already `triggered` |
| `price_above` | trigger when `spot >= targetPrice` |
| `price_below` | trigger when `spot <= targetPrice` |
| `price_touch` | trigger when `abs(spot − target) ≤ 0.5` (points) |
| Effect | Status → `triggered` · set `triggeredAt` · re-render list + chart style |
| Cadence | On every spot update effect (not a separate server stream) |

#### 1.14.5 List UI (`AnalyzerAlertsSection`)

| Feature | As-built |
|---------|----------|
| Region | Analyzer chrome (as-built: left sidebar under Positions) |
| Empty copy | “No threshold alerts — right-click the risk graph…” |
| Filter | Drop `dismissed`; filter by current symbol; sort newest first; **cap 20** shown |
| Card | Title · relative time · severity left rail color · status chip when triggered |
| Actions | **Ack** / **× dismiss** when `new`; **× delete** when acknowledged or triggered |
| testids | `analyzer-alerts-section` · `analyzer-alert-{id}` |

#### 1.14.6 Chart draw

| Feature | As-built |
|---------|----------|
| Source | Enabled, non-dismissed alerts for current symbol |
| Line style | `dashed` until triggered → `active` when triggered |
| Label | Type fragment + **“ · held”** when session Held/Closed |
| Preview | Temporary line while context menu open at cursor price |

#### 1.14.7 What alerts are not (v0.1)

- Not a multi-device Alert Center / SSE bus  
- Not OPF package-level P&amp;L alerts (underlier **price** thresholds only)  
- Not broker order triggers  
- Not profit/payout promises

### 1.15 Client modules (code map)

| Path | Role |
|------|------|
| `web/components/options-lab/OpfRiskAnalyzer.tsx` | Surface assembly |
| `AnalyzerPositionsList.tsx` | Book UI |
| `AnalyzerAlertsSection.tsx` | Alerts UI |
| `PositionBuilder.tsx` | Full definition editor |
| `StrikeSelect.tsx` | Listed strike dropdown |
| `msc-risk/PnLChart.tsx` | Presentation chart (not pricing SoR) |
| `lib/options-lab/useOpfRiskGraph.ts` | Resolve + curve cache |
| `lib/options-lab/usePackageQuotes.ts` | Card package SoR |
| `lib/options-lab/useBuilderChain.ts` | Dual-side ladder for Builder |
| `lib/options-lab/analyzerBook.ts` | Book + lock + alerts model |
| `lib/options-lab/analyzerTrade.ts` | ToS handoff storage |
| `lib/options-lab/opfModels.ts` | Pack catalog |
| `lib/options-lab/opfPricingApi.ts` | HTTP resolve / package-quote / interest |
| `lib/options-lab/tosParser.ts` · `tosGenerator.ts` | ToS I/O |
| `lib/options-lab/position*.ts` | Templates · types · labels · economics |
| `lib/options-lab/listedStrikes.ts` · `packageEconomics.ts` | Listed grid + debit/credit |

---

## 2. Surface layout law (TARGET)

### 2.1 Vertical stack (Labs)

```text
┌─────────────────────────────────────────────┐
│  Options Lab chrome (breadcrumb · suite nav) │
├─────────────────────────────────────────────┤
│  Analyzer control strip (pack · posture ·    │  optional compact
│  symbol · ToS · what-if · actions)            │
├─────────────────────────────────────────────┤
│                                               │
│   VIEWPORT PANEL — OPF risk graph             │  single focused
│   (+ alert price lines drawn on graph)        │
│                                               │
├─────────────── divider ─────────────────────┤
│                                               │
│   POSITION LIST PANEL — 0..N cards            │  multi definition
│   (read-only limited Builder views)           │
│                                               │
├─────────────── (optional) ──────────────────┤
│   ALERTS PANEL — threshold alert book         │  first-class
│   (list · ack · dismiss · delete)             │  not optional product
│                                               │
└─────────────────────────────────────────────┘
```

| ID | Law |
|----|-----|
| **AZ-LAYOUT-1** | Position list lives **under** the viewport (not left of it). |
| **AZ-LAYOUT-2** | A **visible divider** separates viewport and list (single panel with split, or two stacked panels). |
| **AZ-LAYOUT-3** | Viewport is a **single** visualization panel (one focused definition). |
| **AZ-LAYOUT-4** | List may hold **multiple** positions; focus selects which definition the viewport shows. |
| **AZ-LAYOUT-5** | **Alerts are part of Analyzer.** Placement may be under the position list, a collapsible panel beside the list, or a control-strip section (**OD-AZ2**) — but alerts must remain a **dedicated, discoverable Analyzer region**, not dropped from the surface. |
| **AZ-LAYOUT-6** | Alert **lines** always render on the viewport when alerts exist for the active symbol; list placement must not remove graph affordances (right-click create). |

**As-built gap:** Layout is still **sidebar-left** (AZ-LAYOUT-1..2 residual).

---

## 3. Focus & definition law

| ID | Law |
|----|-----|
| **AZ-FOCUS-1** | At most **one** focused card at a time. |
| **AZ-FOCUS-2** | Focused **and** visible definition drives viewport structure. |
| **AZ-FOCUS-3** | If no focused visible card, viewport may show unlocked-live ToS/handoff trade. |
| **AZ-FOCUS-4** | Hiding the focused card drops viewport drive for that card (PB13). |
| **AZ-FOCUS-5** | Removing focused card clears focus; fallback to paste/handoff if any (PB12). |
| **AZ-FOCUS-6** | Incomplete/skewed focused unlocked → no fabricated curve (PB-VIEW-6). |

---

## 4. Position Builder defaults & handoff (TARGET + as-built)

### 4.1 Open modes

| Mode | Trigger | Initial state |
|------|---------|---------------|
| **Create (empty)** | Builder / + with no handoff | §4.2 market defaults |
| **Create (handoff)** | Strategy + strikes (+ optional debit/credit) passed in | Use passed fields; fill only missing with defaults |
| **Edit** | Card Edit | Full card `PositionInput` + preserve id/lock |

### 4.2 Market defaults when no strategy/strikes provided

| ID | Law |
|----|-----|
| **AZ-DEF-1** | Builder **must never** open with empty legs and no geometry when chain/universe is available. |
| **AZ-DEF-2** | Center = **ATM listed strike** from dual-side ladder: prefer `spot_strike`, else snap live **spot** (or **closing/last mark** when session Held/Closed) to listed grid. |
| **AZ-DEF-3** | Every supported template has a **canonical default geometry** (see §4.3). |
| **AZ-DEF-4** | Butterfly (and width-based flies/condors) open at **minimum listed wing** consistent with **symbol profile / heatmap fly widths** — for index MSC-style profile, minimum listed width is **20** (first of `fly_widths` / profile minimum), never an unlisted arithmetic width. |
| **AZ-DEF-5** | All strikes shown and written are **listed-only** (OC6a / PB6). |
| **AZ-DEF-6** | Default direction **Buy**; default right **Call** where template has side. |
| **AZ-DEF-7** | Front expiration = first listed available expiration for product; time spreads pick next listed back (PB22). |
| **AZ-DEF-8** | Package DEBIT/CREDIT display uses live chain mids (Builder) / OPF package path (cards); incomplete → “—”. |

### 4.3 Canonical default geometries (TARGET table)

All centers = ATM listed (`C`). Width `W` = minimum lawful listed wing for product (§4.2 AZ-DEF-4). Side = Call unless noted. Direction = Buy.

| Template | Default legs (long +, short −) |
|----------|--------------------------------|
| **single** | +1 C Call |
| **vertical** | +1 C Call · −1 C+W Call |
| **butterfly** | +1 C−W · −2 C · +1 C+W Call |
| **bwb** | +1 C−W · −2 C · +1 C+2W Call |
| **condor** | per template (listed wings about C) |
| **straddle** | +1 C Call · +1 C Put |
| **strangle** | +1 C−W Put · +1 C+W Call |
| **iron_fly** | +1 C−W Put · −1 C Put · −1 C Call · +1 C+W Call |
| **iron_condor** | wings at C±W, C±2W listed |
| **calendar** | −1 C front · +1 C back (same strike, next listed exp) |
| **diagonal** | −1 C front · +1 C+W back (listed diagonal width) |

Sell flips long/short.

### 4.4 Passed-in strategy wins

| ID | Law |
|----|-----|
| **AZ-HAND-1** | If opener supplies **template + listed strikes** (and optional debit/credit / limit), Builder **uses them**. |
| **AZ-HAND-2** | Heatmap ToS handoff populates unlocked-live paste; Analyze/Builder Analyze creates card. |
| **AZ-HAND-3** | Paste does **not** auto-create a card (OD-PB8). |

---

## 5. Card ↔ Builder relationship

| ID | Law |
|----|-----|
| **AZ-CARD-1** | Position card = **read-only limited view** of the same definition the Builder edits. |
| **AZ-CARD-2** | Card may show: label, notation/legs, package DEBIT|CREDIT or —, liveState, lock, status, DTE, as_of. |
| **AZ-CARD-3** | Structural edits require **Builder** (Edit) or explicit lock limit prompts — not inline leg editors on the card. |
| **AZ-CARD-4** | Builder Analyze/Update writes the card and focuses it; viewport re-resolves. |

---

## 6. Modes, package SoR, lock (inherit PB; surface summary)

| Topic | Law reference |
|-------|----------------|
| One surface three modes | PB-MODE-0…3 |
| Card live package SoR | PB17 / OPF PackageQuote |
| Viewport re-resolve | PB-VIEW-5 (day_trade live) |
| Outlook epoch | PB-VIEW-7 / AZ outlook re-anchor |
| Coherence matrix | PB §6.5 |
| Lock natural / limit / unlock | PB + as-built §1.7–1.8 |

Analyzer **must** show session posture and must not claim Live when Held/Closed (PB-MODE-3).

---

## 7. Alerts (surface law — first-class)

Threshold **price** alerts are an Analyzer subsystem: **create · list · evaluate · draw · acknowledge**.

| ID | Law |
|----|-----|
| **AZ-AL-0** | Alerts are **in scope of Analyzer** (with book + viewport). Removing the Alerts UI without Coach disposition is a Spec violation. |
| **AZ-AL-1** | Persistence is **session-local** in v0.1 (`sessionStorage`); multi-device Alert Center is out of scope unless a later OD. |
| **AZ-AL-2** | **Create** from the viewport: right-click (or equivalent) → price above / below / touch at that underlier price. |
| **AZ-AL-3** | Optional **position-scoped** create: associate `positionId` with a book card (context near curve / position menu). |
| **AZ-AL-4** | **Evaluate** against the **same underlier mark** the viewport uses for spot (smoothed display spot / live underlier pattern). |
| **AZ-AL-5** | Evaluation rules: above ≥ · below ≤ · touch within **0.5** points (or product-appropriate tick later via OD). |
| **AZ-AL-6** | Triggered alerts stay visible until dismissed/deleted; chart line style changes to **active**. |
| **AZ-AL-7** | When session posture is **Held/Closed**, alert labels and list copy carry **Held** honesty — no “live fire” claim off-session. |
| **AZ-AL-8** | List supports **ack · dismiss · delete**; dismissed alerts are hidden from the active list. |
| **AZ-AL-9** | Chart **draws** enabled, non-dismissed alerts for the active symbol as horizontal price lines. |
| **AZ-AL-10** | No profit, P&amp;L, or payout claims in alert titles or copy (ethos). Underlier **price** thresholds only in v0.1. |
| **AZ-AL-11** | Alerts do **not** invent package mids or rewrite card definitions. |

---

## 8. Data plane & interest

| ID | Law |
|----|-----|
| **AZ-DATA-1** | Structure pricing and curves from **OPF** only. |
| **AZ-DATA-2** | Chain hydrate is dual-side Market Bus ladder generations. |
| **AZ-DATA-3** | Underlier mid for spot line uses site-wide live underlier pattern when available. |
| **AZ-DATA-4** | Suite interest: focused definition keys + visible card keys (PB17b). |
| **AZ-DATA-5** | Analyzer may keep a **client module cache** of last risk graph for route switches (Heatmap ↔ Analyzer) without inventing prices — soft refresh after paint. |

---

## 9. Forbidden

- MSC as pricing SoR or listed “models.”  
- Fabricated curves for incomplete packages.  
- Unlisted strikes in Builder selects.  
- Empty Builder open with no default geometry when market data is available.  
- Multi-card stacked P&amp;L in one viewport.  
- Silent dual package math (card vs resolve disagree unlabeled).  
- Live claim when session Held/Closed.  
- Profit theater.

---

## 10. Acceptance tests

### 10.1 As-built regression (must keep green)

| AT | Criterion |
|----|-----------|
| **AT-AZ-1** | Open Analyzer → posture badge present |
| **AT-AZ-2** | Paste valid butterfly ToS → Load → dual curves without card |
| **AT-AZ-3** | Builder create default → Analyze → card appears + focus + curves |
| **AT-AZ-4** | Focus card A then B → resolve structure is B only |
| **AT-AZ-5** | Hide focused → incomplete/empty fallback per focus law |
| **AT-AZ-6** | Lock mkt freezes basis; unlock restores natural path |
| **AT-AZ-7** | Heatmap ToS handoff appears in paste with heatmap source flag |
| **AT-AZ-8** | Right-click chart → create price_above/below/touch → alert appears in **Alerts list** and as chart line |
| **AT-AZ-8b** | Spot crosses target → status `triggered` · line style active · Held label when session held |
| **AT-AZ-8c** | Ack / dismiss / delete behaviors match §1.14.5 |
| **AT-AZ-8d** | Position-scoped create attaches `positionId` when chosen from curve menu |
| **AT-AZ-9** | Switch pack day_trade → outlook → Re-anchor works; scenario labeled |
| **AT-AZ-10** | Route Heatmap → Analyzer → last graph paints from cache then soft-refreshes |
| **AT-AZ-11** | Incomplete package → no fabricated curve |
| **AT-AZ-12** | Builder listed strikes only; center ATM when ladder ready |

### 10.2 TARGET residual

| AT | Criterion |
|----|-----------|
| **AT-AZ-L1** | List is **below** viewport with visible divider |
| **AT-AZ-L2** | Builder open empty → each template has standard geometry from §4.3 |
| **AT-AZ-L3** | Butterfly default width = profile/heatmap **minimum** listed wing |
| **AT-AZ-L4** | Held/Closed session: default center uses closing/last mark, not blank |
| **AT-AZ-L5** | Handoff with full strategy+strikes+debit/credit not overwritten by defaults |
| **AT-AZ-L6** | Card has no inline leg editors; Edit opens Builder |

---

## 11. Gap map (as-built vs this Spec)

| Law | As-built | Residual |
|-----|----------|----------|
| OPF-only pricing | Yes | — |
| Card book + lock + package quotes | Yes | Parity ATs continuous |
| Dual-curve viewport + what-if | Yes | PB-VIEW-5 pure generation-driven (reduce independent poll) |
| Heatmap/ToS handoff | Yes | — |
| **Threshold alerts (create · list · evaluate · draw)** | **Yes** (session) | Server multi-device / package-P&amp;L alerts out of v0.1; placement OD-AZ2 after list-under-viewport |
| Listed Builder strikes + live DEBIT/CREDIT | Yes (recent) | Per-template §4.3 matrix completeness |
| **List under viewport + divider** | **No** (left rail) | **TARGET** |
| **Full default geometry matrix** | Partial (butterfly-first init) | **TARGET** |
| **Heatmap min width for default fly** | Partial (hardcoded defaults) | Wire to symbol profile `fly_widths[0]` |
| **Closed-session center = close** | Partial (last chain spot) | Explicit Held mark path |

---

## 12. Open decisions (Coach)

| ID | Topic | Recommendation |
|----|-------|----------------|
| **OD-AZ1** | Control strip: keep left slim rail vs top compact bar after list moves under graph | Top compact + list under |
| **OD-AZ2** | Alerts **panel** placement after list moves under viewport | **Under position list** (default) or collapsible third band; never remove alerts from Analyzer |
| **OD-AZ3** | Default template on empty Builder open | Butterfly (day-trader default) |
| **OD-AZ4** | Multi-tab book sync | Out of v0.1 (sessionStorage only) |

---

## 13. Decision log / boards

| Artifact | Role |
|----------|------|
| **DL-293** | Analyzer OPF-only |
| **DL-294** | Builder + cards + alerts land |
| **DL-296…299** | PB Spec / program |
| **DL-301** | This Analyzer Spec v0.1 filed |
| Board (future) | `agents/p-options-lab-analyzer/` when implementation residual opens |

---

## 14. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-11 | Full as-built inventory + TARGET layout/defaults from Coach; DRAFT |
| **v0.1.1** | 2026-08-11 | **Alerts elevated** to first-class Analyzer subsystem: mission, cardinal objects, full §1.14 model, AZ-AL-0…11, layout, ATs |
| **v0.1.2** | 2026-08-11 | **Six major buckets** architecture: Alerts · Positions · Viewport · Time machine · Models · Controls (§0.2) |

**Reference UX (non-authority):** MSC Risk Graph — workflow only (incl. alerts UX heritage). **MSC is not the standard.**
