# FatTail Labs — Options Lab Analyzer Spec v0.2

**Status:** **DRAFT · review-folded** (2026-08-11 · external advisor Claude)  
**Type:** Product Spec — Options Lab **Analyzer** surface  
**Major buckets:** **Alerts · Positions · Viewport(s) · Time machine · Models · Controls**  
**Analyzer viewports (in-session):** **Risk graph (2D)** · **Surface (3D)**  
**Attached / suite viewports:** **Volume Profile** · **GEX** · **Probability**  
**Short name:** **Analyzer** · **AZ**  
**Filename:** `FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` (content **v0.2.1**)
**Surface route (primary):** `/app/options-lab/analyzer` — **Surface is a viewport mode here, not a suite app**  
**Chrome:** Options Lab suite workspace under Options Lab nav (Volume Profile · Heatmap · Analyzer)

**Process:** Advisor fold (§15) · **Coach OD-AZ1–8 Accept (DL-304)** · residual implementation plan → **BUILD GO** still separate.  
**Review:** External advisor Claude 2026-08-11 (B1–B5, A1–A8, P1–P2).  
**Content integrity:** Landing content hash (sha1 of body excluding this line): `35c53589c918c4a636e31b17cb3c8e7c9ce281a8` (v0.2.1 · OD-AZ1–8 Accept · path reconcile DL-306).

---

## 0. Mission

Options Lab **Analyzer** is the member **day-trader risk surface**. Product is organized as **six major buckets** (Coach):

| # | Bucket | One-line job |
|---|--------|----------------|
| 1 | **Alerts** | Threshold price rules: create, list, evaluate, draw on the **Analyzer** graph |
| 2 | **Positions** | Definition book (cards) + Builder (full edit) + package/lock |
| 3 | **Viewport(s)** | In Analyzer: **Risk graph (2D)** · **Surface (3D)**. Suite/attached: **Volume Profile** · **GEX** · **Probability** (see §0.3) |
| 4 | **Time machine** | What-if / scenario knobs (time · vol · spot %) over OPF resolve (Analyzer viewport) |
| 5 | **Models** | OPF pack / use-case selection (day_trade · outlook · backtest) |
| 6 | **Controls** | Session chrome: posture, symbol, spot/VIX, ToS handoff, actions |

Supporting: Market Bus dual-side generations + underlier marks + volume/OHLC data plane as needed by viewports.  
**Never** MSC as pricing SoR (DL-293).

**Coach litmus (shared with Position Builder Spec):**  
*When looking at a position in the Builder or the position card, if it is unlocked, the correct pricing is displayed and the rendered position in the viewport is correct — as guaranteed for the active use case and session state.*

**Capital-risk doctrine (normative parent):**  
[OPF Truth & Elegant Failure Doctrine v1.1](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) · **DL-309** · **DL-396** — OPF-held chain is sole instrument truth for create/edit/cards; two clocks (τ vs midnight-ET EXPIRED); package cell shows defendable mark **or** named state (never silent lie); atomic pointer resolve. Session/Print Spec v0.1 remains **DRAFT**.

**What this is not:** brokerage OMS; MSC regimes/Heston/MC; silent dual package math; profit claims; invented strikes.

**Coach 2026-08-16 (DL-394):** Show/Hide is a **checkbox**. Two or more **shown** positions draw as **one additive continuous** book curve. The prior “no multi-definition stacked P&amp;L / one focused definition” line is **superseded** for viewport drive (focus remains highlight-only).

**Coach 2026-08-17 (DL-417 · DL-418 · DL-419):** Viewport **keep-warm** is **BUILD AUTHORITY** (content **v0.1.2**). Live book sheet is **local** on the held generation — Working and Away. [Keep-Warm Spec](./FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md).

---

## 0.1 Relationship to other Specs (normative parents)

| Doc | Analyzer owns / inherits |
|-----|---------------------------|
| [Position Builder & Book Spec v0.3](./FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md) | **Positions** definition/lock/package · **Viewport** viz law · PB-VIEW-* · PB-MODE-* · Builder templates · **PB-VIEW-7** · B5 package laws |
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
| **Viewport(s)** | See §0.3 — Analyzer risk graph · VP · GEX canvases | Pricing SoR (OPF owns package/curves for Analyzer) |
| **Time machine** | What-if time / vol / spot % into **Analyzer** resolve; sim spot indicator | Changing card legs unless Save; not required on VP/GEX |
| **Models** | Pack id + use case (day_trade · outlook · backtest); epoch re-anchor | Drawing curves (Analyzer viewport consumes packs) |
| **Controls** | Posture badge, symbol, OPF model, GEX, Range, What-if, Refresh/Auto-fit/Builder. Spot/VIX sit upper-right above the risk canvas. Suite nav for Heatmap / other apps | Replacing any other bucket’s SoR |

### 0.2.1 Cross-bucket laws

| ID | Law |
|----|-----|
| **AZ-X-1** | **Positions → Analyzer Viewport:** every **shown** (`visible`) definition on the session underlier drives structure as **one additive book**. Hidden cards do not contribute. Card click may highlight (focus) but **must not** un-show a sibling. *(Supersedes 2026-08-11 “focused visible only” · DL-394.)* |
| **AZ-X-2** | **Models + Time machine → Analyzer Viewport:** pack and what-if re-resolve the **same** definition (PB-VIEW-2/3). |
| **AZ-X-3** | **Alerts ↔ Analyzer Viewport:** create from risk graph; evaluate on underlier mark; draw lines on **Analyzer** graph (not a substitute for VP/GEX). |
| **AZ-X-4** | **Controls → all:** **symbol** (and posture where relevant) is **shared suite context** for Positions, all viewports, and Alerts. |
| **AZ-X-5** | **Positions package SoR** remains OPF PackageQuote (PB17); **Analyzer** curves remain OPF resolve — never MSC. |
| **AZ-X-6** | **Attached viewports** (VP, GEX) share **Controls.symbol** (and underlier marks) with Analyzer; they do **not** each invent a private product symbol or Massive client. |

### 0.2.2 Inventory map (where detail lives)

| Bucket | Spec sections (detail) |
|--------|------------------------|
| **Controls** | §1.1–1.3, §1.5–1.6, §1.12, actions in §1.9–1.13 |
| **Models** | §1.4, §6 modes |
| **Viewport(s)** | §0.3 · §1.9–1.10 · §1.16 · §3 focus · §6 |
| **Time machine** | §1.11 |
| **Positions** | §1.7–1.8, §1.13 Builder, §4–5 |
| **Alerts** | §1.14, §7 |

---

## 0.3 Viewports (Analyzer host + attached suite)

The **Viewport** bucket is a **family**. **As-built (Coach 2026-08-20):** Analyzer viewport is the **2D risk graph only**. **Surface** is the suite page `/app/options-lab/surface` (T Ortho lives there). The in-Analyzer Surface tab / `SurfaceViewport` embed is **removed**.  
**Prior law AZ-VP-S1** (Surface as in-Analyzer mode, not a suite app) is **superseded** by that Coach instruction.  
**Keep-warm / last paint / poll rates:** [Analyzer Viewport Keep-Warm Spec v0.1.2](./FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md) · **DL-418** · **DL-419**. Live sheet is local (AZ-KW-6 · AZ-KW-10). Layout residual (vertical stack) is **not** this spec.

### 0.3.0 Analyzer-hosted viewports (same session)

These share **one** Analyzer session: same **Positions**, **Alerts**, **Models**, **Time machine**, **Controls**, and **OPF data plane**. Member switches canvas only.

| Viewport id | Label | Role | Presentation |
|-------------|-------|------|----------------|
| **risk** | Risk graph | OPF dual curves for the **shown book** (additive) | 2D `HostPnLChart` (as-built · DL-458) |
| **surface** | Surface | **Same shown book + same OPF samples** — P&amp;L over e.g. spot × DTE | 3D mesh (MSC RiskGraph3DView heritage; **OPF SoR only**) |

| ID | Law |
|----|-----|
| **AZ-VP-S1** | **SUPERSEDED (Coach 2026-08-20).** Analyzer viewport is 2D Risk graph only. Surface is the suite page `/app/options-lab/surface`. |
| **AZ-VP-S2** | Switching **Risk graph ↔ Surface** must **not** clear focus, positions, alerts, pack, or what-if. |
| **AZ-VP-S3** | Surface uses the **exact same data plane and pricing SoR as Risk graph** (OPF + dual-side generations). Presentation only differs (mesh vs lines). |
| **AZ-VP-S4** | **MSC port boundary (DL-302 / B1):** MSC **presentation / scene / interaction** code may be ported when **re-typed** to Labs domain types, with a heritage comment (not an MSC import path). MSC **pricing, theo engines, schemas, Redis keys, and runtime remain forbidden** (DL-293). Labs namespace: `risk-graph/` (not `msc-risk/`). |
| **AZ-VP-S5** | Dense mesh sampling may need more OPF queries / a surface sample API — still OPF, never a second engine. |
| **AZ-VP-S6** | Alerts evaluate on underlier mark; draw on Risk graph first; Surface may show spot/price reference planes (OD optional). |

```text
  ANALYZER SESSION
  Positions · Alerts · Models · Time machine · Controls
              │
              ▼
     ┌────────┴────────┐
     │  RISK GRAPH 2D  │  ← Analyzer viewport (HostPnLChart)
     └────────┬────────┘
              │
              ▼  suite nav (separate page)
         Surface 3D
         /app/options-lab/surface
```

### 0.3.1 Suite / attached viewports (complementary)

Same **product symbol**; **not** second Positions books. May live as suite tabs or later embeds.

| Viewport id | Role | Primary data plane | Pricing / value law |
|-------------|------|--------------------|---------------------|
| **volume-profile** | **Volume profile bins only** — **not** candles | Volume feed → **bins** · live mid | Bins-only (AZ-VP-9) |
| **gex** | **Gamma exposure** by strike | Dual-side chain (Γ · OI · S) | Estimate / template — not OPF package SoR |
| **probability** | **Probability** / 1σ framing | Underlier + vol ref · optional OPF meta | Honest geometry only (AZ-VP-8) |

```text
  CONTROLS · symbol S
       │
       ├─► ANALYZER (host) ── 2D Risk graph  + Positions + Alerts
       ├─► Surface (suite page)
       ├─► Volume Profile (bins)
       ├─► GEX (template / attach)
       └─► Probability (TARGET)
```

### 0.3.2 Attachment law (suite companions)

| ID | Law |
|----|-----|
| **AZ-VP-1** | Analyzer host visualizes the **shown book** (all `visible` cards) as **one additive continuous** OPF curve, whether Risk or Surface mode. Show/Hide is a **checkbox**, not a radio. *(Supersedes 2026-08-11 “one focused definition” / PB-VIEW-4 · DL-394.)* |
| **AZ-VP-2** | **Volume Profile**, **GEX**, and **Probability** are **attached** analytics: same symbol; not second position books. |
| **AZ-VP-3** | Attached viewports **must not** open private Massive sockets or hardcode symbol lists. |
| **AZ-VP-4** | Leaving Analyzer for VP/Heatmap **must not** destroy Positions/Alerts (sessionStorage). Switching Risk↔Surface must not either. |
| **AZ-VP-5** | **Heatmap** is chain templates; GEX may be template and/or attach. |
| **AZ-VP-6** | Time machine + OPF **Models** drive **Risk** and **Surface**. VP/GEX/Probability must not silently re-price packages. |
| **AZ-VP-7** | Alerts: evaluate suite underlier mark; draw on **Risk** first. |
| **AZ-VP-8** | **Probability** must be epistemically honest — no win-rate / profit theater. |
| **AZ-VP-9** | **Volume Profile = bins only** — no candlesticks on the VP surface. |

### 0.3.3 As-built vs TARGET

| Viewport | As-built | TARGET |
|----------|----------|--------|
| **risk** | 2D OPF graph in Analyzer | Primary default mode |
| **surface** | **Suite page** `/app/options-lab/surface` (not in Analyzer viewport) | 3D tent / T Ortho on that page |
| **volume-profile** | Suite app; candles+bins residual | Bins only (AZ-VP-9) |
| **gex** | Heatmap template | **OD-AZ7 Accept:** keep as Heatmap template (as-built); suite promotion deferred |
| **probability** | Partial (`oneSigmaBandWidth`) | **OD-AZ8 Accept:** suite-attached panel · labeled IV/VIX basis · structure-relative band when card focused · vol basis own as_of/session |

### 0.3.4 Shared context matrix

| Context | Risk (2D) | Surface (3D) | Volume Profile | GEX | Probability |
|---------|-----------|--------------|----------------|-----|-------------|
| Host | Analyzer | Analyzer | Suite | Heatmap/suite | TARGET |
| Product symbol | Suite | Suite | Suite | Suite / Heatmap | Suite |
| Dual-side chain | Yes | Yes | No | Yes | Optional |
| Member canvas | OPF curves | OPF **mesh** | **Bins only** | GEX bars | Prob / 1σ |
| OPF resolve / samples | **Yes** | **Yes (same SoR)** | No | No | Optional meta |
| Positions book | **Yes** | **Yes (same)** | No | No | Optional read |
| Alerts book | **Yes** | **Yes (same)** | Optional | Optional | Optional |
| Time machine | **Yes** | **Yes (same)** | No | No | Optional |
| Models (OPF packs) | **Yes** | **Yes (same)** | No | No | Label only |

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
| Main split | **Left sidebar** (~21rem) + **right viewport** (`lg:flex-row`) | **Vertical stack:** viewport **above**, position list **below**, with **divider**. Book default **230px** (~1.25 three-leg cards after −20% pad/lock, **type size unchanged**); saved height goes to the canvas. |
| Sidebar contents | **HIG inspector:** **Alerts** (header **+** create, empty holder, **scroll**, default height **~3–4 cards**) · GEX · Probability · What-if. **No Instrument / OPF-model / Graph panel.** Dark strip **above** the canvas: **upper-left** Symbol + Spot + VIX (**50px** gaps); **center** Auto-fit (**≥44pt**). Position list under the viewport. Alerts list: info + Active/Idle only. MSC canvas/position apply on the graph. | **OD-AZ1 Accept:** top compact control strip; **list under viewport** |
| Viewport | Full remaining height · dark canvas · chart panel | Same — **one** focused graph panel |
| MSC heritage | MSC had list **left** of viewport | Labs: list **under** viewport |

### 1.3 Session posture · **Controls** (B2 fold)

| Feature | Law / as-built |
|---------|----------------|
| States | `Live` · `Held` · `Closed` · `Error` |
| **Target SoR (DRAFT · DL-395)** | OPF session/print envelope — [`OPF Session and Print Authority Spec v0.1`](./FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md). **Not BUILD** until that spec is GO. |
| **As-built (B2, still running)** | `GET /api/me/market/session-status` + labeled clock fallback. Coach named this as the **wrong client SoR** — keep until OPF envelope ships. |
| Product close | Prefer symbol-profile / product session bounds when available (index options often **16:15 ET** — not equities 16:00). Hardcoded 16:00 alone is residual |
| Refresh | Interval ~30s re-fetch plane status |
| UI | Badge on chrome; Held labels on theo legend and alert lines when held |
| RECON chip | Held → `n/a held`; **override-active (B4)** → `override` (never pass/fail vs live mark); Live + no override → pass/fail |

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
| Outlook epoch | Selecting outlook pack **pins** epoch; **Re-anchor epoch** button clears pin, refreshes, re-pins; **epoch stale** when generation epoch advances while pinned (**PB-VIEW-7** ratified · OD-PB16 Accept · B3) |
| Time reference label | Live/Held gen · Scenario epoch · Replay no live claim |

### 1.5 Definition sources & focus law · **Positions** + **Controls** (paste)

| Priority | Source | Drives viewport when |
|----------|--------|----------------------|
| 1 | **Shown book** → `visibleBookTrade(positions)` (additive merge of every `visible` drawable card) | One or more cards shown |
| 2 | Empty CTA | No shown drawable card |

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
| `status` | **ANALYSIS** for v0.2 book (OD-PB6 disposition until lifecycle OD); OMS tokens reserved not product scope (B5) |
| `livePackagePerShare` | Magnitude for display |
| `lastNatSigned` | Signed OPF natural D_nat |
| **Package invariant (B5)** | When `lastNatSigned` is set: `livePackagePerShare ≡ |lastNatSigned|` always |
| `priceSide` | `debit` \| `credit` \| null |
| `visible` | Hidden cards do not drive viewport; package not live |
| `lock` | Unlocked or locked D* (source natural_mid \| user_limit \| tos_limit; freeze flags; hashes at lock) |
| `liveState` | **Six-state (B5):** `live` \| `held` \| `not_live` \| `budget_refused` \| `incomplete` \| `skewed` |
| `displayAsOf` | Generation as_of |
| `contentHashes` | Per-exp content_hash map |
| `maxSkewMs` / `epochQuality` | Multi-exp skew metadata |
| `createdAt` / `updatedAt` | Bookkeeping |

#### 1.7.2 Card UI (read-only limited view of definition)

| Element | Behavior |
|---------|----------|
| Click / Enter / Space | **Highlight** card (edit / alerts). Does **not** hide siblings. |
| Focus ring | Tint border + fill when highlighted |
| Show checkbox | Independent `visible` toggle — **checkbox, not radio**. Hidden opacity + liveState not_live |
| **Edit** | Opens Position Builder in **edit** mode with that definition |
| **Lock mkt** | `lockNatural` — freezes D* from last complete natural |
| **Lock lim** | Unlock → debit/credit field is **editable**. Tab, Enter, or click-away saves the per-position magnitude and **locks** (`lockLimit`). DEBIT/CREDIT side stays. No prompt. |
| **Unlock** | Clears lock; debit/credit field becomes the editor |
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

**Keep-warm:** [Analyzer Viewport Keep-Warm Spec v0.1.2](./FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md) · **DL-418** · **DL-419** — last paint · Working 2.5s / Away 5s / Idle = posture only · live sheet **local** · AZ-DATA-5a stale until first Working tick.

| Feature | As-built |
|---------|----------|
| Hook | `useOpfRiskGraph` |
| Data plane | Dual-side chain ladder poll (wings 50) per unique leg expiration — subscribe for the generation |
| Pricing | **Local** `resolveLocalBookCurves` (client BSM on held listed IVs). `/resolve` is not on this clock. |
| Curves | **Expiration** (emerald) + **theoretical/scenario** (fuchsia / pack legend) |
| Basis shift | If ToS/limit present, shifts curves so basis = limit vs natural mid |
| Breakevens | Both curves |
| Strikes markers | Leg strikes |
| Spot line | Smoothed live underlier mid (`useSmoothNumber`) |
| Sim spot indicator | Separate indicator when what-if spot % ≠ 0 |
| Module cache | Keep-warm across Heatmap ↔ Analyzer route switches (30 min TTL); soft refresh |
| Manual Refresh | Forces re-resolve |
| Auto-fit | `HostPnLChart` handle `autoFit()` |
| Max/Min P/L | Header summary dollars |
| Incomplete | Loud empty — **no fabricated curve** |
| Error | Loud amber status |
| Empty | Prompt Builder or paste; right-click for alerts |
| RECON | Live + no override → pass/fail; Held → n/a held; **override-active → `override` (B4)** — never RECON fail against live while what-if inputs active |
| Mark pkg chip | resolve package_debit or focused card live package |
| Wings (A3) | From symbol profile when available; residual hardcode until wired |

### 1.10 Chart interaction (`HostPnLChart` presentation) · **Viewport** (+ **Alerts** create/draw)

| Feature | As-built (wired) |
|---------|------------------|
| Path | `web/components/options-lab/risk-graph/HostPnLChart.tsx` + `chartHostBind.ts` (**DL-458**; legacy `PnLChart.tsx` removed) |
| Dollar grid | P&L **Y** and underlier **X** independently: **1–2–5 × 10ⁿ**, floor **$10**, target **≥10** lines when the span allows, cap **~20** so labels stay readable. If even $10 cannot produce 10 lines, stay at $10 (do not invent $1/$2/$5). GEX scales are not dollars and do not use this law. **DL-460**. |
| Dual series render | Expiration + theoretical |
| Spot / sim spot lines | Yes |
| Alert lines | Enabled Canvas and Position alerts draw as vertical lines on the plot (solid when Active, dashed when Idle). |
| Context menu alerts | **Right-click blank plot** → **Canvas** price alert (rises above / falls below / touches) at that underlier price. Same MSC grammar. |
| Position-specific alert | **Right-click the tent** (~8px) → **Position** alert: pick a Shown card by strike label (`6700C/6720C/6740C`), then the same three conditions. |
| Legend labels | Pack theo legend + Held suffix |
| GEX backdrop | Same heatmap GEX template + dual-side ladder; bars at listed strikes; GEX axis = plot mid-height; **Call/Put = two right scales** (sky call up, red put down), each scaled to that side’s longest bar; Net/Abs = one right scale colored to the bars; units ÷1e9 as heatmap; pan/zoom with the view (DL-459). **Chain-attached (AZ-VP-2 / DL-461):** GEX paints from the listed expiration even when **no positions are shown** (empty book or all hidden). Horizon = shown-card exp if any, else Range listed date, else first listed. Not a second position book. |
| Range band | Gray column **behind GEX**, clipped to the **plot** (not the black gutters above/below). Member % is two-sided normal mass **XX.XX%** (1σ = **68.27%**, 2σ = **95.45%**). Geometry is ±z·σ·√τ on a **listed** expiration (ATM IV). Inspector **Probability**: Show/Hide · expiration · Width 68.27% · optional second 95.45%. Pan/zoom with the view. |
| Heritage | MSC Risk Graph UX only — no MSC pricing import (DL-302 / AZ-VP-S4) |
| Crosshair | Pointer in the plot: dashed V/H hair; **X-scale chip** (blue) = underlier/strike at the cursor (listed-exact, OC6a); **Y-scale chip** (gray) = P&L at the cursor (same `+12` / `-8` grammar as axis ticks). MSC presentation — chips sit on the scales, not a tooltip. Hidden while pan or strike-drag. Painted from a pointer ref (not React state per move). Host `data-crosshair-price` / `data-crosshair-pnl`. **DL-469**. |
| Strike handles | Yellow ticks on the $0 line at each **visible** position’s listed strikes. **MSC handle grammar (Labs-typed):** hover thickens + grab cursor; press grabbing; **Single handle** (no Shift): only that tick highlights and only that strike moves. **Shift-click/drag:** all handles of the position highlight and move in unison. **Proximity size:** thick only while the pointer is in that handle’s hit box (or during the live drag). Leaving proximity — including after drop — restores idle tick size; Shift-group thicken is not sticky. Handles **detent only to listed strikes** for that position’s expiration (no free slide). Live snap, redefine the card, redraw tent; drop commits (unlock + atomic rebind). No invented strikes (DL-309). Do not Autofit on drop. |

### 1.11 What-if (OPF scenario knobs) · A6 Enable

Member chrome is **What-if** (not Time machine). The suite map may still say Time machine as the historical bucket (AZ-X-2). Law: What-if T/σ spec v0.1 · DL-451 · DL-452.

| Knob | Range | Law |
|------|-------|-----|
| Enable | switch | **Gates all three** time / implied vol / spot% (A6) |
| Time | `[0, remaining_last_trade]` | Last trade: index **16:15 ET** · equity **16:00 ET**. Readout clock ET · hours left. τ stays OPF29 **16:00** (1-minute floor). Outlook + epoch pin ignores the time knob. **Supersedes** 0…72 h as the member domain. |
| Implied vol | `[0.5 σ_m, 2.0 σ_m]` clamp 1–200% | Absolute %; detent = listed ATM IV on the soonest shown expiration. Wire `vol_offset_pts = σ_s − σ_m` (OPF31 additive). **IV NO** / **WAITING** when unmeasured. **Supersedes** −30…+30 pts as the member domain. |
| Spot % | −5%…+5% | Applied when Enable; sim spot indicator |
| Active banner | — | Labeled what-if / override state (B4). Enable + non-zero knobs → RECON `override`. |
| Reset | button | Clears elapsed / vol offset / spot% + disable |

### 1.12 Spot & VIX overrides · **Controls → Time machine class (B4)**

| Control | Law |
|---------|-----|
| Spot / VIX text | Member overrides are **what-if inputs**, not silent live marks |
| Active override | Viewport enters labeled **override / what-if** state |
| RECON | Chip shows **`override`** — never pass/fail vs live package while override or what-if active |
| R1a gate | AT-PB-R1a / AT-AZ RECON litmus **excludes** override-active states |
| Auto-fill empty spot | From plane mark only when field empty |

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

**Normative Builder + canvas apply + Manager hook:**
[`FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md`](./FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md) · **DL-463**.

Analyzer is a work-surface **client** of the future Labs-wide **Alerts Manager + API**. Session-local alerts are a **stub adapter** until that manager GO’s.

As-built holder: left inspector (info + Idle/Live/Touched, header **+**). Canvas right-click: Canvas vs Position (MSC 8px). Position: hover highlights that card’s **at-expiration**; menu is for **that card only** (no picker). **+** / canvas apply open **Alert Builder** (floatable: no scrim, drag header, graph stays live).

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
| **Left-click / drag** | **Pan** the plot, including on the tent. **Not** a menu. (As-built left-click-on-curve menu was a deviation — closed DL-457.) |
| **Wheel** | Zoom strike (X) about the pointer; Shift+wheel = Y. Native non-passive listener. |
| **Autofit** | First paint · structure change only if the member has **not** taken the view · **Auto-fit** control. **Not** live tick, BE jitter, smoothed spot, or What-if rebuild. Same law as Surface AT-AF-7 (**DL-457**). |

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

#### 1.14.5 List UI (left inspector holder)

**Normative:** AZ-ALB §5. Ack / dismiss / delete chrome is **superseded** (delete unshipped v1).

| Feature | Law |
|---------|-----|
| Region | Left inspector **Alerts** section |
| Empty | **No copy** — named Coach deviation from HI `EmptyState` |
| Card | Title · Canvas vs Position · **Idle** / **Live** / **Touched** (chip toggles Idle↔Live; Touched resumes Live; rest of card opens Builder). **Unbound** is not a toggle. |
| **+** | 44pt kit `IconButton`; opens Alert Builder (Price, Spot) |
| Delete | Unshipped v1 |
| testids | `analyzer-alerts-panel` · `analyzer-alerts-holder` · `analyzer-alert-create` |

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

| Path | Role | Bucket |
|------|------|--------|
| `web/components/options-lab/OpfRiskAnalyzer.tsx` | Analyzer surface assembly | all |
| `AnalyzerPositionsList.tsx` | Book UI | Positions |
| `AnalyzerAlertsSection.tsx` | Alerts UI | Alerts |
| `PositionBuilder.tsx` · `StrikeSelect.tsx` | Full definition editor | Positions |
| `risk-graph/HostPnLChart.tsx` | Analyzer graph presentation (DL-458) | Viewport analyzer |
| `VolumeProfileChart.tsx` | VP suite app (as-built candles+bins; law = bins only) | Viewport volume-profile |
| `HeatmapChainPanel.tsx` + `templates/gex.ts` | Chain templates incl. GEX | Viewport gex / Heatmap |
| `lib/options-lab/useOpfRiskGraph.ts` | Resolve + curve cache | Viewport analyzer |
| `lib/options-lab/usePackageQuotes.ts` | Card package SoR | Positions |
| `lib/options-lab/useBuilderChain.ts` | Dual-side ladder for Builder | Positions |
| `lib/options-lab/analyzerBook.ts` | Book + lock + alerts model | Positions · Alerts |
| `lib/options-lab/analyzerTrade.ts` | ToS handoff storage | Controls |
| `lib/options-lab/opfModels.ts` | Pack catalog | Models |
| `lib/options-lab/opfPricingApi.ts` | HTTP resolve / package-quote / interest | Models · Positions |
| `lib/marketOhlc*.ts` · OHLC series store | Bar feed **input** to binning (not member VP canvas) | Viewport volume-profile |
| `lib/optionsLabSuite.ts` · `optionsLabContext.tsx` | Suite nav + shared symbol | Controls |

### 1.16 Attached viewports inventory · **Viewport(s)**

#### 1.16.1 Analyzer risk graph + Surface (primary host)

| Feature | Law / as-built |
|---------|----------------|
| Route | `/app/options-lab/analyzer` only |
| Modes | Viewport switcher: **Risk graph** · **Surface** |
| Shared | Positions, Alerts, Models, Time machine, Controls, OPF plane (AZ-VP-S1…S6) |
| Risk | See §1.9–1.10 — 2D OPF dual curves |
| Surface as-built | Mode shell in Analyzer; 3D mesh port from MSC `RiskGraph3DView` / `src/3d/*` with **OPF feed** (not MSC theo) |
| MSC reference | `strategy-lab-proto/msc-risk-graph-ui` — presentation heritage only |

#### 1.16.2 Volume Profile (attached) — **bins only**

| Feature | Law / as-built |
|---------|----------------|
| Route | `/app/options-lab/volume-profile` |
| **Product law (AZ-VP-9)** | Member-facing surface = **volume profile bins** (volume-by-price histogram). **No candlesticks** on the VP viewport. |
| As-built gap | `VolumeProfileChart` currently renders **candles + profile** — residual vs law; remediation = bins-only (or move candles to a separate non-VP tool if ever needed) |
| Data | Bar/OHLC history may feed **bin construction** off-screen; display bins + optional live mid / POC / value-area markers |
| Shared | Suite **symbol** from `OptionsLabProvider` |
| Not in surface | Positions book · Alerts list · OPF packs · Time machine · **candle chart UI** |

#### 1.16.3 GEX (attached / template)

| Feature | As-built |
|---------|----------|
| Primary ship | Heatmap **template** `gex` (`web/lib/options-lab/templates/gex.ts`) over dual-side chain |
| Modes | gex_net · gex_abs · side variants (template value modes) |
| Formula heritage | call +Γ·OI·S² · put −Γ·OI·S² · net / abs |
| Suite nav item | **Not yet** a top-level Options Lab tab (unlike VP · Heatmap · Analyzer) |
| Host overlay | `HostPnLChart` GEX backdrop (DL-459). **DL-461:** paints with no shown positions; listed horizon via `gexHorizonExpiration`. |

#### 1.16.4 Probability (attached · TARGET / partial as-built)

| Feature | As-built | TARGET |
|---------|----------|--------|
| Role | Probability framing for the underlier (and optional structure-relative bands) | Dedicated **Probability viewport** |
| MSC / chart heritage | Autofit still knows 1σ window. **As-built overlay:** gray ±% band behind GEX on `HostPnLChart`; **Probability** inspector Show/Hide · listed expiration · Width % (1σ default) · optional second (2σ default). Honest geometry only (AZ-VP-8). | Dedicated Probability viewport later (OD-AZ8) |
| Suite nav / route | **None** | **OD-AZ8 Accept:** suite-attached panel (e.g. `/app/options-lab/probability`) |
| Data | — | Live underlier mid · **labeled IV/VIX basis with own as_of/session** (A8); optional OPF meta; **not** package SoR |
| Focused card | — | Optional **structure-relative** 1σ / band when a position is focused |
| Ethos | — | No win-rate or profit claims (AZ-VP-8) |

---

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
│   VIEWPORT PANEL — OPF risk graph             │  shown book (additive)
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
| **AZ-LAYOUT-1** | Position list lives **under** the viewport (not left of it). **OD-AZ1 Accept.** |
| **AZ-LAYOUT-2** | A **visible divider** separates viewport and list (single panel with split, or two stacked panels). **OD-AZ1 Accept.** |
| **AZ-LAYOUT-3** | Viewport is a **single** visualization panel (Risk graph or Surface) of the **shown book**. |
| **AZ-LAYOUT-4** | List may hold **multiple** positions; each Show checkbox independently includes that card in the additive book. Highlight (focus) does not deselect siblings. |
| **AZ-LAYOUT-5** | **Alerts** sit **under the position list** (default). Dedicated, discoverable Analyzer region — never removed without Coach disposition (AZ-AL-0). **OD-AZ2 Accept.** |
| **AZ-LAYOUT-6** | Alert **lines** always render on the Risk graph viewport when alerts exist; list placement must not remove graph affordances (right-click create). **OD-AZ5 Accept:** VP/GEX alert draw optional later; Analyzer graph first. |
| **AZ-LAYOUT-7** | **Controls** after layout residual: **top compact strip** (pack · posture · symbol · ToS · actions · what-if). **OD-AZ1 Accept.** |

**As-built gap:** Layout is still **sidebar-left** (AZ-LAYOUT-1..2 residual until residual build).

---

## 3. Focus & definition law

| ID | Law |
|----|-----|
| **AZ-FOCUS-1** | At most **one** highlighted (focused) card at a time — highlight only. |
| **AZ-FOCUS-2** | **Every shown** (`visible`) card drives the viewport as an additive book. Focus is not required. *(Supersedes “focused and visible only” · DL-394.)* |
| **AZ-FOCUS-3** | If no shown drawable card, viewport is **scales + grid + GEX** (when GEX is on) — **no center instruction card**. GEX is chain-attached — it does not require a shown position (DL-461). When a drawable book **appears** on an empty canvas (Show, Create, paste, or any other path), **Autofit must run** even if the member had panned/zoomed the empty GEX view (**DL-462**). Show/Hide among an already-shown book still does not steal the view (VP-A1). |
| **AZ-FOCUS-4** | Hiding a card drops **that card only** from the book (PB13). Siblings stay. |
| **AZ-FOCUS-5** | Removing a card removes it from the book; highlight fallback is independent. |
| **AZ-FOCUS-6** | Incomplete/skewed **shown** unlocked cards do not fabricate a curve (PB-VIEW-6); they do not blank a drawable sibling. |

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
| **AZ-DEF-4** | Butterfly (and width-based flies/condors) open at **minimum listed wing** from **symbol profile** (`fly_widths[0]` / profile minimum / step-multiple min) — never invent unlisted arithmetic width. *(Illustrative: SPX-class profiles often start near 20 pts — not a hardcoded law constant · A2.)* |
| **AZ-DEF-5** | All strikes shown and written are **listed-only** (OC6a / PB6). |
| **AZ-DEF-6** | Default direction **Buy**; default right **Call** where template has side. |
| **AZ-DEF-9** | Empty Builder create default template = **butterfly**. **OD-AZ3 Accept.** |
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
| **AZ-AL-4** | **Evaluate** on the **raw underlier mark**; **draw** alert lines on the smoothed display series (A1). |
| **AZ-AL-5** | Evaluation rules: above ≥ · below ≤ · touch within product tick (default 0.5 residual; prefer profile tick · A1). |
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
| **AZ-DATA-5** | Analyzer may keep a **client module cache** of last risk graph for route switches without inventing prices — soft refresh after paint. |
| **AZ-DATA-5a** | Cached paint is **labeled stale** until soft-refresh resolve completes (A4 / PB-VIEW-5). |

---

## 9. Forbidden

- MSC as pricing SoR or listed “models.”  
- Fabricated curves for incomplete packages.  
- Unlisted strikes in Builder selects.  
- Empty Builder open with no default geometry when market data is available.  
- Radio-style Show/Hide (selecting one card un-shows another).  
- Fabricating a book curve from non-representable legs.  
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
| **AT-AZ-4** | Show card A and B → resolve structure is the **additive book** (both). Highlight B does not drop A. |
| **AT-AZ-5** | Hide A while B is shown → viewport stays on B (checkbox, not radio) |
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

## 12. Open decisions — **Coach Accept OD-AZ1–8** (DL-304)

All ODs below are **Accepted** as written. Recommendations become **normative law**.

| ID | Topic | Accept (law) |
|----|-------|----------------|
| **OD-AZ1** | Layout after residual build | **Top compact control strip** + **position list under viewport** + divider |
| **OD-AZ2** | Alerts placement | **Under the position list** (dedicated region; never remove without Coach · AZ-AL-0) |
| **OD-AZ3** | Empty Builder default template | **Butterfly** |
| **OD-AZ4** | Multi-tab book sync | **Out of v0.2** — sessionStorage only; multi-device later OD |
| **OD-AZ5** | Alerts on VP/GEX | **Optional later** — Analyzer Risk graph first |
| **OD-AZ6** | VP embed vs suite tab | **Suite tab sufficient** for v0.2; embed later optional |
| **OD-AZ7** | GEX surface shape | **Heatmap template** as-built; suite promotion deferred |
| **OD-AZ8** | Probability viewport | **Suite-attached panel**; labeled **IV/VIX** basis with **own as_of/session**; structure-relative band when a card is focused |

---

## 13. Decision log / boards

| Artifact | Role |
|----------|------|
| **DL-293** | Analyzer OPF-only |
| **DL-294** | Builder + cards + alerts land |
| **DL-296…299** | PB Spec / program |
| **DL-301** | Analyzer Spec filed |
| **DL-302** | MSC presentation port boundary + `risk-graph/` rename (B1) |
| **DL-303** | Advisor Claude review fold → Analyzer v0.2 content |
| **DL-304** | **Coach Accept OD-AZ1–8** — layout, alerts, defaults, VP/GEX/Prob |
| **DL-305** | Residual full-agent bench plan v1.0 |
| **DL-306** | Path/hash reconcile · Analyzer-Spec-v0_2 · PB Spec v0.3 · plan v1.0.1 advisor fold |
| Residual board | `agents/p-options-lab-analyzer/` — **BUILD GO** still Coach W0-0 |

---

## 14. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-11 | Full as-built inventory + TARGET layout/defaults from Coach; DRAFT |
| **v0.1.1** | 2026-08-11 | **Alerts elevated** to first-class Analyzer subsystem |
| **v0.1.2** | 2026-08-11 | **Six major buckets** architecture |
| **v0.1.3–v0.1.5** | 2026-08-11 | Attached viewports · Probability · VP bins-only |
| **v0.1.6** | 2026-08-11 | Surface = Analyzer viewport mode |
| **v0.2** | 2026-08-11 | **Advisor fold** B1–B5 · A1–A8 · P1–P2 (§15) |
| **v0.2.1** | 2026-08-11 | **Coach Accept OD-AZ1–8** (DL-304) — law locked |
| **v0.2.1 path** | 2026-08-11 | Filename reconcile → `...Analyzer-Spec-v0_2.md` (P-B1 · DL-306); content still v0.2.1 |
| **v0.2.2** | 2026-08-16 | **DL-394** Show/Hide checkbox; additive continuous book viewport. Prior one-focus-viewport rows kept as superseded. |

**Reference UX (non-authority):** MSC Risk Graph (2D + 3D) — workflow / scene only. **MSC is not the pricing standard.**

---

## 15. Advisor review disposition (Claude 2026-08-11)

**Verdict accepted:** Strong assembly Spec; five blockers reconcilable; fold landed below.  
**OD-AZ1–8:** **Coach Accept** (DL-304). Residual **implementation plan + BUILD GO** still required before residual matrix ships.

| ID | Class | Disposition | Lands |
|----|-------|-------------|-------|
| **B1** | Blocking | **Accept** — DL-302 port boundary; rename `msc-risk/` → `risk-graph/`; AZ-VP-S4 tightened | DL-302 · §1.10/1.16 · tree |
| **B2** | Blocking | **Accept** — posture from `session-status` plane; clock fallback only; 16:15 index residual via profile | §1.3 · code |
| **B3** | Blocking | **Accept** — PB-VIEW-7 ratified (pin · re-anchor · stale); OD-PB16 closed as Accept | PB Spec · §1.4/§6 |
| **B4** | Blocking | **Accept** — overrides/what-if → RECON chip `override`; R1a excludes override-active | §1.9/1.11/1.12 · code |
| **B5** | Blocking | **Accept** — six-state liveState; package magnitude invariant; status ANALYSIS-only for v0.2 | PB §3.3 · §1.7.1 |
| **A1** | Advisory | **Adopt** — evaluate raw mark; draw smoothed | §1.14.4 · code |
| **A2** | Advisory | **Adopt** — AZ-DEF-4 profile-driven; 20 illustrative only | §4.2 |
| **A3** | Advisory | **Adopt** — wings from profile | §1.9 |
| **A4** | Advisory | **Adopt** — cached paint labeled stale until refresh | AZ-DATA-5 |
| **A5** | Advisory | **Adopt** — show all cards; badge off-symbol; focus syncs symbol | §1.5/1.7 |
| **A6** | Advisory | **Adopt** — Enable gates all what-if knobs + banner | §1.11 |
| **A7** | Advisory | **Adopt** — list shows “20 of N” | §1.14.5 |
| **A8** | Advisory | **Adopt intent** — Prob vol basis own as_of/session (OD-AZ8 detail) | §1.16.4 |
| **P1** | Process | **Fix** — recompute content hash at this fold | Header |
| **P2** | Process | **Fix** — DL-302/303 same-day | DL |

### 15.1 Law text adopted (summary)

- **AZ-POSTURE-1:** Market-plane session facts primary; clock fallback labeled secondary.  
- **AZ-OVERRIDE-1:** Spot/VIX/what-if active → labeled override; RECON = `override`.  
- **AZ-PKG-1:** `livePackagePerShare ≡ |lastNatSigned|` when signed present.  
- **AZ-AL-EVAL-1:** Alerts evaluate raw underlier mark; lines use display series.  
- **AZ-DATA-5a:** Module cache paint labeled **stale** until soft-refresh resolves.  
- **AZ-BOOK-SYM-1:** Positions list shows all symbols; off-symbol cards badged; focus syncs suite symbol.
