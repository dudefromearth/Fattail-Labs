# Options Lab — Heatmap Template Architecture

**Status:** **AS-BUILT (partial)** (2026-08-12) — dual-side generation + template registry + **Advanced Fly** (id `sym-fly`) + gex_v1 + ladder; vertical/bw-fly deferred  
**Surface:** Options Lab → **Heatmap** (`/app/options-lab/heatmap`)  
**Type:** Design + as-built map — live chain **views** (templates) over one shared option-chain model  
**Product law:** [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) · **Advanced Fly** [`Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) (v0.2.1) · **DL-311**  
**Not:** MSC convexity heatmap · MarketSwarm code · per-template Massive polling  

**Parents / companions:**

| Doc | Role |
|-----|------|
| [28 — Massive Market Bus](./28-massive-market-bus.md) | Massive → feeds → Redis → one WS/tab → shared client |
| [18 — Shared live marks](./18-shared-live-marks-stream.md) | Universe / marks posture (do not confuse with `mb:*`) |
| Spec [Heatmap Templates v0.2](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | **Product law** — dual-side, Width, modal step, next_url fail-loud, standard contracts |
| Spec [Options Chain Picker v1.0.2](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe SoR · OC2 proxy-safe spot · OC6/OC6a fields · **no MSC** (OC13) |
| Spec [Market Bus v1.0](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Transport law · one socket per tab |
| Spec [Human Interface v1.0](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | Member chrome · tokens · ≥44pt |
| Spec [Volume Profile Histogram v0.4](../Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md) | Sibling underlier VP + dual multi-mount store — **separate** SoR |

**As-built code (W0 dual-side + templates land):**

| Piece | Path |
|-------|------|
| Heatmap route | `web/app/app/options-lab/heatmap/page.tsx` |
| Workspace chrome | `web/components/options-lab/OptionsLabChrome.tsx` (`workspace`) |
| Chain panel + template switcher | `web/components/options-lab/HeatmapChainPanel.tsx` |
| Templates (ladder · Advanced Fly/`sym-fly` · gex · history) | `web/lib/options-lab/templates/*` · `flySurfaceHistory.ts` |
| Dual-side push client | `web/lib/market/useOptionChainBus.ts` · `MarketSocket.ts` · `chainLadderApi.ts` |
| Dual-side ladder + HM18/19/20 | `server/routes/chain_ladder.py` · `server/market_data/chain_ladder.py` · `massive_client.py` |
| Stream push (key without side) | `server/routes/market_stream.py` |
| AT fixtures | `server/tests/test_heatmap_at_fixtures.py` · `test_chain_ladder.py` |
| Suite nav | `web/lib/optionsLabSuite.ts` |

**Landed vs deferred:**

| Item | Status |
|------|--------|
| Dual-side omit `contract_type`; wings clamp ≤50 dual | Landed |
| `next_url` fail-loud (`allow_truncate=False`) | Landed |
| Standard contracts only + excluded count | Landed |
| Modal strike step | Landed |
| Diff keys `side:strike` | Landed |
| Template registry + switcher | Landed |
| Advanced Fly (id `sym-fly`): Long/Debit +1/−2/+1 · Short/Credit −1/+2/−1 · columns 10…50×5 · RoC −/+ slider / tick % / R:R / Δ / Δ² / vel / accel / slope / curvature / C/P + history | Landed (DL-311 · **DL-434** · **DL-435**) |
| **Width Fit** (template id `width-fit`) | Landed **DL-525** / **DL-526** / **DL-529** — Template switcher sibling of Advanced flies · member criteria weights (equal \(1/7\)) · stability **penalty** outside weights (OD-W6) · footer median + \(n\) · observation-only · member guide [`docs/Options-Lab-Heatmap-Width-Fit-User-Guide.md`](../docs/Options-Lab-Heatmap-Width-Fit-User-Guide.md) · help `server/help_reference/options-lab-heatmap-width-fit.md` (**DL-530**) |
| Client flySurfaceHistory + AF10/AF17 | Landed |
| sym-fly debit/credit/pct_change/r2r + RoC sticky color | Superseded as surface by Advanced Fly modes |
| gex_v1 call/put/net | Landed |
| vertical · bw-fly templates | **Verticals** Long/Debit · Short/Credit (DL-443) · bw-fly landed |
| Full e2e AT-HM1…16 in Playwright | Partial (unit AT pack) |

---

## 0. Mission

Give members a **switchable set of analytical views** over the **same live options chain**, so that:

1. **One** chain snapshot pipeline (Massive → Labs generation → stream) feeds **all** views.  
2. Each view is a **template**: pure UI + pure client logic that rearranges quotes/greeks into a panel (grid, matrix, profile).  
3. Templates update in **near real time** — as fast as the next chain generation (~few seconds while RTH open).  
4. Data transfer stays efficient: **diff the chain once**; templates recompute **locally**.  
5. After the market closes, the UI **holds the last prices** (and hydrates once if empty).  

**What this is not:** a second Massive client per template; browser→Redis; MSC heatmap builders; profit-claim marketing chrome; inventing structure furniture on underlier volume profile (that is Arch/Spec VP).

---

## 1. Product framing

### 1.1 Options Lab suite

| App | Role |
|-----|------|
| **Volume Profile** | Underlier OHLC + (future) tick VP bins — **equity volume**, not options |
| **Heatmap** | **This document** — chain-based structure templates |
| **Analyzer** | Risk graph / payoff (future; may later consume structures from Heatmap) |

Shared: Admin **`market_symbol_universe`** symbol, suite nav, Market Bus client.

### 1.2 Reference view (first template)

**Symmetric butterfly debit heatmap** (member reference image `hm.png`):

| Axis | Meaning |
|------|---------|
| **Rows** | Center strike \(K\) of a symmetric butterfly |
| **Columns** | Half-width \(w\) (center strike → each long leg), in price points or \(N ×\) strike step |
| **Cell number** | Structure **debit** (default value mode) |
| **Cell color** | Diverging scale **light blue → dark blue → dark red → light red** driven by **rate of change** of debit across neighboring tiles (not raw debit level alone) |
| **Chrome** | Dark surface, gold figures, ATM/spot emphasis |

\[
D(K,w) = m(K-w) + m(K+w) - 2\,m(K)
\]

(mids by default; bid/ask fill models are a later value-mode / quality flag.)

### 1.3 Template catalog (planned)

| ID | Label | Structure | Primary columns |
|----|-------|-----------|-----------------|
| `ladder` | Strike ladder | Raw chain (as-built default) | Mid, bid, ask, vol, OI, Δ, IV (+ γ in model) |
| `sym-fly` | Symmetric flies | Long 1 / short 2 / long 1 | Half-widths \(w\) |
| `bw-fly` | Broken-wing flies | Asymmetric long distances | Short-wing / long-wing params |
| `vertical` | Verticals | Long–short same expiry | Width \(w\) |
| `gex` | Chain GEX (estimate) | Per-strike exposure from γ × OI | Net / call / put |

**Value modes** (where valid for a template): `debit` · `credit` · `r2r` · `pct_change` · structure `delta` · (GEX) `net` / `call` / `put`.

---

## 2. Architectural split: data plane vs view plane

```text
┌─────────────────────────────────────────────────────────────────┐
│  DATA PLANE (one per underlier×expiry×wings — BOTH sides)       │
│                                                                 │
│  Massive chain snapshot (no contract_type; calls+puts)          │
│  strike window: (strikes × 2) ≤ 250  ──► Labs generation        │
│                              │                                  │
│                              ▼                                  │
│              WS /api/me/market/stream  (server PUSH)            │
│              full | diff | unchanged                            │
│                              │                                  │
│                              ▼                                  │
│              MarketSocket (1 / tab)                             │
│                              │                                  │
│                              ▼                                  │
│     Dual-side model: calls Map + puts Map + spot + meta         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │  same model reference
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  VIEW PLANE (N templates, zero extra Massive)                     │
│                                                                 │
│  Template registry ──► active template.compute(grid)            │
│  Side control = view filter only (not a re-fetch)               │
│         │                                                       │
│         ├── ladder renderer (table)                             │
│         ├── matrix renderer (tiles: flies / verticals)          │
│         └── profile renderer (e.g. GEX bars)                    │
│                                                                 │
│  Left rail: template + value mode + chain geometry controls     │
│  Right pane: active view, full height                           │
└─────────────────────────────────────────────────────────────────┘
```

**Law VT1 — Single dual-side chain model:** Templates **must not** open their own Massive or HTTP poll loops for steady-state updates. Geometry is `(symbol, expiration, wings)`; **calls and puts always loaded** (Spec HM15–HM17). Side is UI filter only.

**Law VT2 — Diff once, paint many:** Network efficiency is defined at the **chain generation** boundary. Adding templates **must not** multiply snapshot traffic.

**Law VT3 — Pure compute:** `computeCell` / `computeGrid` are pure functions of `(ChainContext, template params, valueMode)`. Side effects forbidden (no fetch, no bus writes).

**Law VT4 — Fail loud cells:** Missing legs, null mids, null γ/OI for GEX → invalid cell (“—”), not silent zero that looks like a real market.

**Law VT5 — No MSC:** No MarketSwarm-Canonical heatmap pipelines, Redis key schemas, or copied MSC UI.

**Law VT6 — Session hold:** When US equities session is **not open**, continuous push stops; last model (and last computed grids) **hold**. Empty UI → **one-shot hydrate** of last ladder (not continuous poll).

---

## 3. Data plane (chain model)

### 3.1 Dual-side generation (Spec v0.1.1)

| Rule | Law |
|------|-----|
| Massive pull | **Omit** `contract_type` — both books in one snapshot |
| Band | Wing window such that **strikes × 2 ≤ 250** (one page) |
| Model | `calls` + `puts` by strike; diffs keyed `(side, strike)` |
| UI Side | View/structure filter only — **not** a second fetch |

*As-built note:* current ladder code may still pass `contract_type=side`; **implementation must flip to Spec HM15–HM20** (dual-side, no `next_url` partials, standard contracts only, modal step) before GEX/net and matrix templates are production-true.

**Reference look (H7):** Matrix visual may match Coach’s own prior heatmap aesthetic; MSC ban is **code/schema**, not a ban on that look.

### 3.2 Row schema (as-built fields)

Each **contract** row includes at least (OC6 family):

| Field | Use |
|-------|-----|
| `strike`, `side` | Identity; fly body / vertical; book membership |
| `mid`, `bid`, `ask` | Debit/credit pricing |
| `volume`, `open_interest` | Size; **GEX** uses OI |
| `delta`, `gamma`, `theta`, `vega`, `iv` | Greeks; **GEX** uses γ |
| `is_spot` | ATM emphasis / center |

Provenance: Massive options **chain snapshot** → Labs ladder builder. Gamma and OI are **already mapped** in `chain_ladder` row construction when the vendor supplies them.

### 3.3 Update cadence (near real time)

| Event | Cadence |
|-------|---------|
| Server chain push loop (RTH open) | ~**2s** (`market_stream` push interval) |
| Client apply | Immediate on message |
| Template recompute | Immediate after model apply |
| Market closed | No continuous push; **hold** last print |

Member-facing promise: templates update **as fast as the next chain snapshot**, not on a separate “GEX timer.”

### 3.4 Efficiency: full / diff / unchanged

| Mode | Wire | Client model | Templates |
|------|------|--------------|-----------|
| `full` | Entire ladder | Replace map | Full recompute |
| `diff` | Upserts + removes by strike | Patch only touched strikes | Full recompute of grid (cheap) *or* incremental if template opts in later |
| `unchanged` | Hash / as_of only | No row work | Skip recompute if hash unchanged |

**Redis role:** shared generation store + interest for feeds (Arch 28). Browser **never** reads Redis. Client efficiency is **WS payload shape** (`diff` preferred after first full). Template count does not multiply Redis or Massive calls.

**Ideal evolution:** feed writes generation → WS only fans out stored generation/diff (single-flight fill on miss). Product law VT2 holds either way.

### 3.5 Geometry controls (chain band)

Wings (strikes above/below ATM) bound **both** sides and which \(K±w\) exist. Templates that need wide flies **must** document minimum wings vs max column width; invalid wings → invalid cells (VT4).  
**Wings=100** may exceed 250 dual-side contracts — clamp or fail-loud per Spec HM17 (not a reason to split call/put Massive pulls).

---

## 4. View plane — template framework

### 4.1 Registry

```text
web/lib/options-lab/templates/
  types.ts           # HeatmapTemplate, ChainContext, GridModel, ValueMode
  registry.ts        # id → template
  color.ts           # diverging blue–red scales, normalize
  pricing.ts         # fly debit, vertical debit, R2R helpers
  symFly.ts          # first matrix template
  vertical.ts        # planned
  bwFly.ts           # planned
  gex.ts             # planned
  ladder.ts          # as-built table as template
```

### 4.2 Core types (design)

```ts
type ValueModeId =
  | "debit" | "credit" | "r2r" | "pct_change"
  | "net_delta" | "gex_net" | "gex_call" | "gex_put";

type ChainContext = {
  symbol: string;
  viewSide: "call" | "put";  // UI filter only
  spot: number | null;
  strikeStep: number | null;
  calls: Map<number, LadderRow>;
  puts: Map<number, LadderRow>;
  asOf: string | null;
  contentHash: string | null;
};

type GridCell = {
  display: string | null;
  value: number | null;       // numeric for color / compare
  colorT: number | null;      // normalized [-1,1] or [0,1] after grid pass
  valid: boolean;
  tooltip?: string;
};

type HeatmapTemplate = {
  id: string;
  label: string;
  description: string;
  layout: "table" | "matrix" | "profile";
  valueModes: { id: ValueModeId; label: string }[];
  defaultValueMode: ValueModeId;
  resolveColumns(ctx: ChainContext, params: TemplateParams): ColDef[];
  resolveRows(ctx: ChainContext, params: TemplateParams): RowDef[];
  computeCell(
    ctx: ChainContext,
    row: RowDef,
    col: ColDef,
    valueMode: ValueModeId,
    params: TemplateParams,
  ): Omit<GridCell, "colorT">;
  /** After full grid of values, assign colorT (neighbors available). */
  assignColors(grid: GridCell[][], valueMode: ValueModeId): void;
};
```

### 4.3 Renderer responsibilities

| Renderer | Input | Output |
|----------|--------|--------|
| **Matrix** | rows × cols cells | Tiles (fly/vertical heatmaps) |
| **Table** | ladder rows | Classic chain (current UI) |
| **Profile** | strike → scalar | Horizontal GEX-style bars (optional layout) |

Shared: sticky strike column, scroll to spot, reduced-motion (no flash spam), token colors, gold-on-dark for matrix numbers (product look matching reference).

### 4.4 Template parameters (member + defaults)

| Param | Scope | Example |
|-------|--------|---------|
| `widthMode` | matrix | `step_multiples` \| `fixed_points` |
| `widths` | matrix | `[5,10,15,…]` steps or `[20,25,…,50]` points |
| `valueMode` | all | debit / r2r / … |
| `bwShort` / `bwLong` | bw-fly | asymmetric distances |
| `gexConvention` | gex | sign convention version string |

Params live in UI state + session prefs; not in Redis.

---

## 5. Template specifications (design freezes)

### 5.1 `sym-fly` — symmetric butterfly matrix (priority 1)

**Legs (on viewSide book from dual-side model):** +1 @ \(K-w\), −2 @ \(K\), +1 @ \(K+w\).

**Debit (mid):** \(D = m_{K-w} + m_{K+w} - 2 m_K\).

**Columns:** Course **Width** = center-to-wing. Default \(w = n · \texttt{strikeStep}\) with **modal** step in band (Spec HM20); optional fixed points. **No snap** if \(K±w\) unlisted (HM8).

**Color field (v1 freeze):** horizontal rate of change  
\(s_{i,j} = D_{i,j} - D_{i,j-1}\) (j=0 → 0 or first difference).  
Normalize with **session sticky hysteresis** (Spec §5.2.2) → \(t ∈ [-1,1]\).  
Map through diverging stops: light blue → dark blue → dark red → light red.

**Value modes:** debit (default); later r2r, pct_change (vs prior column).

### 5.2 `bw-fly` — broken wing (priority 3)

Asymmetric longs: \(K-w_s\), \(K\), \(K+w_l\) with \(w_s ≠ w_l\).  
Debit / R2R require explicit max-loss definition (Spec freeze).  
Same matrix or param-grid UI.

### 5.3 `vertical` — vertical spread (priority 2)

Long \(K\), short \(K±w\) (direction by call/put and debit/credit).  
Columns = width. Value modes: debit, credit, r2r.

### 5.4 `gex` — chain gamma exposure estimate (priority 2)

**Inputs:** call and put `gamma` + `open_interest` at each strike, spot \(S\) (dual-side model).

**Sketch (versioned `gex_v1`):**  
\(\mathrm{GEX}_{call}(K)=+\Gamma^{c}_K·\mathrm{OI}^{c}_K·S^2\),  
\(\mathrm{GEX}_{put}(K)=-\Gamma^{p}_K·\mathrm{OI}^{p}_K·S^2\),  
\(\mathrm{GEX}_{net}=\mathrm{GEX}_{call}+\mathrm{GEX}_{put}\).

**Honesty:** Label **“Chain GEX (estimate)”** — not exchange true dealer GEX. Null γ or OI on a side → that side invalid.

**Layout:** matrix (net / call / put columns) or profile bars by strike.

**Updates:** same push cadence as chain; recompute when γ or OI diffs land on either book.

### 5.5 `ladder` — raw chain (as-built)

Default until matrix templates ship. Columns: mid, bid, ask, vol, OI, delta, IV (γ available in model for future column).

---

## 6. UI architecture

### 6.1 Workspace layout (as-built direction)

```text
┌──────────────────────────────────────────────────────────┐
│  Breadcrumb · Options Lab suite nav (compact)            │
├──────────────┬───────────────────────────────────────────┤
│  LEFT ~1/5   │  RIGHT ~4/5                               │
│  Controls    │  Active template view                     │
│  · Symbol    │  · matrix tiles  OR  ladder table         │
│  · Expiry    │  · full remaining height, scroll inside   │
│  · Side      │                                           │
│  · RoC −/+   │                                           │
│  · Template  │  ← switcher                               │
│  · Value mode│                                           │
│  · Widths    │                                           │
│  · Spot      │                                           │
│  · Stream    │                                           │
│    status    │                                           │
└──────────────┴───────────────────────────────────────────┘
```

Viewport: `h-[calc(100dvh-4.5rem)]`; columns stretch top→bottom under chrome.

### 6.2 Stream status (member-facing)

| State | Meaning |
|-------|---------|
| Live stream | Receiving pushes; model updating |
| Held · market closed | No continuous push; last prices shown |
| Connecting / error | Transient; hydrate if empty |

### 6.3 HIG

Token-only colors; surface vs canvas; ≥44pt controls; segmented template/value switchers; focus rings; reduced-motion for row/tile flash.

---

## 7. Client module responsibilities

| Module | Responsibility |
|--------|----------------|
| `MarketSocket` | One WS; chain interest; emit messages |
| `useOptionChainBus` | Sub → apply full/diff; **no interval poll**; **hydrate-if-empty** once |
| `useChainTemplateGrid` (planned) | Chain model + active template + valueMode → `GridModel` |
| Template modules | Pure pricing + color |
| `HeatmapChainPanel` | Layout; host switchers; pick renderer |

**Hydrate (special, not poll):** if UI empty and model can load (bootstrap, after hours, stream error), **one** HTTP full ladder; inject; then hold or resume stream. Continuous `setInterval` poll is **forbidden** for steady state.

---

## 8. Server responsibilities

| Component | Role for this feature |
|-----------|------------------------|
| `chain_ladder` | Build generation; mids/greeks/OI; content_hash; diff |
| `market_stream` | Sub snapshot + **push loop** full/diff/unchanged while session open |
| Session open gate | RTH (Massive status / clock); closed → stop push, client holds |
| Redis `mb:*` | Generation cache + interest for feeds (scale) |
| Feeds | Sole Massive writers for bus topics |

**No** server-side fly/GEX matrix storage in v1 — matrices are **derived client-side** so templates stay flexible and agents can recompute from the same chain DTO.

**Optional later:** server precompute heavy grids for agents only — out of v1 Heatmap UI path.

---

## 9. Agent / analysis consumers

Templates produce **grids of numbers** suitable for agent tools:

- Export active grid: strikes × columns × valueMode + colorT + as_of + content_hash.  
- Or agents consume **raw chain rows** (γ, OI, mids) and run the same pure functions.  

Same honesty: GEX labeled estimate; structure prices labeled mid vs fill model.

---

## 10. Security & access

Same as chain ladder: session + `_require_tool_member(read)`.  
No new public unauthenticated stream.  
Universe gate on symbol (OC1).

---

## 11. Non-goals (v1 framework)

- MSC heatmap parity or MSC imports  
- True multi-expiry surface in first matrix (single expiry from chain control)  
- Tick-level options tape for flies (snapshot mids sufficient for v1)  
- “True” dealer GEX from order book  
- Storing multi-year options history for heatmaps (that is not this feature)  
- Profit claims in chrome  

---

## 12. Implementation phases

| Phase | Deliverable | Exit |
|-------|-------------|------|
| **H0** | Arch 29 + Spec v0.2 + [full-agent bench plan](../docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md) | Coach accept · board `p-options-lab-heatmap` |
| **H1** | Template types + registry + matrix renderer shell | Switcher shows placeholder |
| **H2** | Dual-side gen + `sym-fly` debit + RoC + modal step + no-snap | Spec AT-HM12; look may match Coach reference (§0.2 MSC code ban only) |
| **H3** | Value modes debit / r2r / pct_change on sym-fly | Modes switch without new fetch |
| **H4** | `gex` estimate from γ×OI | Live update on greeks/OI diffs |
| **H5** | `vertical` template | — |
| **H6** | `bw-fly` template | — |
| **H7** | Agent export of active grid | — |

Foundation already landed: workspace layout, push stream, hydrate-if-empty, ladder as default view, γ/OI on model.

---

## 13. Acceptance sketches

| ID | Criterion |
|----|-----------|
| **AT-HM1** | Steady state: no `setInterval` HTTP chain poll in Heatmap client |
| **AT-HM2** | After chain `diff`, only model patches; template recomputes; no second Massive path |
| **AT-HM3** | Two templates sequential use produce **zero** extra snapshot traffic vs one |
| **AT-HM4** | Market closed: last ladder + last matrix remain; empty page hydrates once |
| **AT-HM5** | `sym-fly` cell equals mid formula for valid \(K,w\); missing leg → invalid |
| **AT-HM6** | GEX cell null when γ or OI null |
| **AT-HM7** | Color uses assigned `colorT`, not raw debit alone for sym-fly v1 |
| **AT-HM8** | OC6a: strikes display cent-exact; fly centers use listed strikes |

---

## 14. Open freezes (explicit Accept / Override before H2)

| # | Topic | Recommendation |
|---|--------|----------------|
| F1 | Width columns | Default \(n ×\) strike_step; optional fixed points |
| F2 | Color slope | Horizontal ΔD only for v1 |
| F3 | Fill model | Mid for v1; bid/ask later |
| F4 | GEX sign convention | Version string on template; document call+/put− sketch |
| F5 | R2R definition for flies | Max profit / max loss under mid mark-to-model |
| F6 | Push interval | Keep ~2s aligned with stream |
| F7 | Surface Spec filename | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_1.md` when product law hardens |

---

## 15. Document control

| Version | Date | Notes |
|---------|------|--------|
| **1.0** | 2026-08-10 | Initial design architecture |
| **1.1** | 2026-08-10 | Spec v0.1.1 dual-side |
| **1.2** | 2026-08-10 | Spec **v0.2** review fold: Width vocabulary; modal step; next_url fail-loud; standard contracts only; color hysteresis; gex units; parent citation table |

**One-line law:**  
**One dual-side, standard-contract, non-truncated chain under a wing band; pushed and diffed once; pure templates recompute every snapshot — Width is center-to-wing; GEX is a labeled estimate — last print held when closed.**
