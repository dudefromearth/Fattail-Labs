# Strategy Lab — Strategy Pack Architecture Spec v1.0  
### Development Phase + Modular Packs · Butterfly Pack (Phase 1)

**Status:** **SPEC AUTHORITY** — contracts, philosophy, and Butterfly Pack Phase 1  
**Date:** 2026-08-04  
**Product:** FatTail Strategy Lab (`/app/strategy-lab`)  
**Pack scope (Phase 1):** Butterfly Family only  
**Execution scope (until mid-September 2026):** **Analysis + Curation only** — no live brokerage execution  
**Planned later:** Verticals pack · Tradier live execution (target mid-September 2026)

**Parents / siblings**

| Document | Role |
|----------|------|
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) | Product spine: life cycle, bins, versionable strategies |
| [`Strategy-Lab-Life-Cycle-Architecture-v1.1.md`](./Strategy-Lab-Life-Cycle-Architecture-v1.1.md) | Foundation → attributes → processes build order |
| [`Strategy-Lab-Portability-Spec-v1.0.md`](./Strategy-Lab-Portability-Spec-v1.0.md) | Whole-lab import/export; attribute bags on cards |
| This document | **Strategy Packs** as the modular L2 surface for Development depth |

**Doctrine (unchanged):** Capital preservation · process over profit claims · defined risk only · no fantasy fills · fail loud · stop-the-bleeding first  

**Amendments:** new version. No silent drift from locked Labs architecture (standalone repo, identity-scoped Family B, no MSC shared imports).

---

## 0. Terminology map (Labs ↔ this pack language)

| This / coach language | FatTail Labs life-cycle term | Notes |
|-----------------------|------------------------------|--------|
| **Design Phase** | **Development** phase | Phase key `development`. UI label: Development. **No separate Design Phase doc** — see [`Strategy-Lab-Development-Phase-Spec-v1.0.md`](./Strategy-Lab-Development-Phase-Spec-v1.0.md). |
| Strategy product / config | Strategy card | Versioned; owns `phase`, `phase_state`, `attributes` |
| Strategy Pack (plugin) | L2 **attribute + process** pack | Pack-agnostic foundation; packs never invent new phases |
| Curation | **Curation** phase | After back test + forward walk; paper / live prep |
| Campaign / live book | **Deployment** phase | Out of Phase 1 execution scope for Tradier |
| Archive / kill | **Bin** (`retired` \| `trashed`) | Off-board Archive page |

Where coach materials say “Design,” implementations and UI use **Development**. Validation before Curation is owned by the Development Phase Spec, not this pack doc alone.

---

## 1. Overview and philosophy

### 1.1 What Development is for

The **Development** phase is where strategies are **specified, versioned, and qualified**.

It is **not**:

- A high-win-rate bot builder  
- A signal-spam scanner optimized for trade count  
- Live order management (until Tradier integration ships)

It **is**:

- Explicit parameters under defined risk  
- Convexity- and risk-adjusted evaluation of candidate structures  
- Versioned strategy products that can later enter Curation and Deployment  
- A home for **Strategy Packs** that teach and encode FatTail method families (Butterflies first)

### 1.2 Core governing principle

Every parameter and ranking choice must maximize **profit opportunity relative to**:

1. **Risk taken** — defined maximum loss  
2. **Volatility of profits over time**  
3. **Drawdown** — average and maximum  

Primary optimization metrics are **risk-adjusted** (Sharpe, Sortino, Calmar, Return / average drawdown).  
**Win rate is never the primary goal.**

### 1.3 Product contrast (positioning)

| FatTail Strategy Lab | Typical retail platforms (e.g. Option Alpha style) |
|----------------------|-----------------------------------------------------|
| Asymmetric, convexity-driven | High win rate, law of large numbers |
| Low market correlation preferred | Higher market correlation common |
| Risk-adjusted returns primary | Win rate / trade count primary |
| Edge from **mispriced convexity** (debit-to-payoff, debit-to-width) | Edge framed as frequency / hit rate |

### 1.4 Hard constraints (normative)

| ID | Constraint |
|----|------------|
| **HC-1** | **Defined risk only** — no undefined-risk structures in any pack |
| **HC-2** | **Primary optimization metric** ∈ {`sharpe`, `sortino`, `calmar`, `return_avg_dd`} |
| **HC-3** | Win rate MUST NOT be the primary ranking metric |
| **HC-4** | Edge framing: hunt **mispriced convexity** (debit-to-payoff / debit-to-width relationships) |
| **HC-5** | Packs MUST NOT invent top-level life-cycle phases |
| **HC-6** | Strategy card ownership remains Family B (`identity_id`); packs are code + schemas, not cross-tenant data |
| **HC-7** | Fail loud: invalid configs, missing risk-adjusted primary metric, undefined risk → hard errors |

### 1.5 Phase 1 product scope

| In scope (Phase 1) | Out of scope (until later) |
|--------------------|----------------------------|
| Strategy Pack interface contract | Live Tradier (or any broker) execution |
| Butterfly Pack schema, defaults, validation | Verticals pack and later families |
| Development UI driven by pack schema | Full multi-pack marketplace UI |
| Structure construction + metrics + rank (analysis) | OMS / fill simulation as production SoR |
| Promote-to-Curation gates (pack hooks) | Campaign capital automation |
| Attribute persistence on strategy cards | Undefined-risk or short-premium-first packs |

**Calendar note:** Live execution target **mid-September 2026** is product intent, not a hard engineering SLA in this document. Specs for Tradier will be a separate amendment.

---

## 2. Architecture — modular Strategy Pack system

### 2.1 Layer placement

Strategy Packs sit in **L2** of the existing Strategy Lab stack. The **L1 foundation** (phase bins, phase_state, version, lifecycle_log, portability) remains pack-agnostic.

```text
┌──────────────────────────────────────────────────────────────────┐
│  L3  PRESENTATION (Next.js /app/strategy-lab)                    │
│      Suite chrome · phase bins · Development work area           │
│      Dynamic form from pack.getSchema() + getUIDefinition()      │
│      Live preview (payoff + convexity ratios)                    │
├──────────────────────────────────────────────────────────────────┤
│  L2  STRATEGY PACKS (this spec)                                  │
│      Registry · Butterfly pack · (future Verticals, …)           │
│      Attribute bags + process ops via pack interface             │
├──────────────────────────────────────────────────────────────────┤
│  L1  FOUNDATION (Life Cycle Kernel) — already shipping           │
│      Strategy card · phase · phase_state · version · log · I/O   │
├──────────────────────────────────────────────────────────────────┤
│  L0  PERSISTENCE                                                 │
│      MySQL strategy_lab_strategies · attributes_json · export    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Core ↔ pack boundary

```text
Core Platform  ←→  Strategy Pack Interface  ←→  Individual Packs
     (L1+shell)         (this contract)           (butterfly, …)
```

| Layer | May | Must not |
|-------|-----|----------|
| **Core / foundation** | List packs; store opaque attribute bags; enforce phase machine; export/import | Hardcode Butterfly field names; rank structures with pack-private math |
| **Pack** | Schema, UI definition, defaults, validate, search query, construct, metrics, rank | Define new phases; write another identity’s cards; live-trade without future execution pack |
| **UI** | Render schema dynamically; call pack ops via Labs API | Embed pack business rules outside the pack module |

**Rule:** Core remains pack-agnostic. Each pack is self-contained. New packs ship without rewriting foundation phases.

### 2.3 Relationship to attribute plugins (v1.1)

Life Cycle Architecture v1.1 splits L2 into **attribute** plugins and **process** plugins. A **Strategy Pack** is the product-facing **bundle** of both for one strategy family:

| Pack responsibility | Attribute bag (examples) | Process ops |
|---------------------|--------------------------|-------------|
| Butterfly | `butterfly_config@1`, eventually `options_spec@1` | constructStructures, calculateMetrics, rankStructures |
| Future Verticals | `vertical_config@1` | same interface surface |

Portable cards store pack outputs under `attributes` (see Portability Spec). Unknown keys pass through.

### 2.4 Runtime host (Labs stack — normative for production)

Production Strategy Lab is **Python FastAPI** (`server/`) + **Next.js** (`web/`), not a standalone TypeScript monorepo under `src/`.

| Concern | Host |
|---------|------|
| Pack registry, validation, construct/metrics/rank (server-authoritative) | `server/` domain modules |
| Dynamic Development UI, payoff preview | `web/components/strategy-lab/` (+ optional risk-graph assets) |
| Card SoR | `strategy_lab_strategies` + Foundation API |

The **TypeScript interface shapes in §3 are the contract language** (implementable as typed TS for UI + mirrored Python for domain). Folder layout in §7 is **logical module layout**, mapped onto Labs paths in §7.2.

---

## 3. Strategy Pack interface (contract)

Normative interface. Method names are stable; host languages may adapt naming (`snake_case` in Python).

### 3.1 `StrategyPack`

```ts
interface StrategyPack {
  id: string;                 // stable, e.g. "butterfly"
  name: string;               // human label
  version: string;            // pack semver, e.g. "1.0.0"
  description: string;
  isEnabled: boolean;
  minPlatformVersion?: string; // optional Labs foundation compatibility

  getSchema(): ParameterSchema;
  getUIDefinition(): UIDefinition;
  getDefaultConfigs(): StrategyConfig[];

  validate(config: StrategyConfig): ValidationResult;
  buildSearchQuery(config: StrategyConfig): SearchQuery;
  constructStructures(config: StrategyConfig, chain: OptionChain): Structure[];

  calculateMetrics(structure: Structure, config: StrategyConfig): StructureMetrics;
  rankStructures(structures: Structure[], config: StrategyConfig): RankedStructure[];

  onConfigCreated?(config: StrategyConfig): void;
  onConfigUpdated?(config: StrategyConfig): void;
  beforePromoteToCuration?(config: StrategyConfig): boolean | Promise<boolean>;
}
```

| Method | Normative behavior |
|--------|-------------------|
| `getSchema` | Declares all fields for dynamic forms and validation |
| `getUIDefinition` | Layout, sections, live-preview flag |
| `getDefaultConfigs` | Coach/seed templates (Butterfly §5.4) |
| `validate` | Hard errors vs warnings; enforces HC-* and pack rules |
| `buildSearchQuery` | Maps config → chain/scan query (underlying, DTE, rights, …) |
| `constructStructures` | From config + chain → candidate multi-leg structures (defined risk only) |
| `calculateMetrics` | Debit/credit, max profit/loss, ratios, convexity score, optional expected risk-adjusted metrics |
| `rankStructures` | Order by **primary_metric** (risk-adjusted); never by win rate alone |
| `beforePromoteToCuration` | Optional pack gate before foundation promote (Development → Curation) |

### 3.2 Supporting types

```ts
interface ParameterSchema {
  common: FieldDefinition[];
  variants: { [variantKey: string]: FieldDefinition[] };
  validationRules: string[];   // human-readable rule catalog (also enforced in code)
}

interface FieldDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "enum" | "range" | "json";
  label: string;
  required: boolean;
  options?: (string | number)[];
  min?: number;
  max?: number;
  default?: unknown;
  dependsOn?: string[];        // e.g. "dte_type=custom", "symmetric_regime=mid_vix"
  description?: string;
}

interface UIDefinition {
  layout: "stepper" | "tabs" | "sections";
  livePreview: boolean;
  sections: { id: string; title: string }[];
}

/** Member-editable strategy configuration (stored on the card). */
interface StrategyConfig {
  // Pack-specific fields + identity fields the host requires
  [key: string]: unknown;
  name?: string;
  pack_id?: string;            // host should stamp pack id
  pack_version?: string;       // host should stamp pack version at save
}

interface Structure {
  // Multi-leg defined-risk structure; exact shape pack-owned, host-opaque except metrics
  id?: string;
  legs: StructureLeg[];
  [key: string]: unknown;
}

interface StructureLeg {
  right: "call" | "put";
  side: "buy" | "sell";
  strike: number;
  qty: number;                 // contracts; ratio wings allowed for BWB
  dte?: number;
  [key: string]: unknown;
}

interface StructureMetrics {
  debitOrCredit: number;       // signed; debit > 0, credit < 0
  maxProfit: number;
  maxLoss: number;             // must be finite (defined risk)
  /** Net premium magnitude used in ratios: abs(debitOrCredit). Never signed. */
  netPremiumAbs: number;
  /**
   * abs(net premium) / maxProfit (or peak payoff). Undefined/null when maxProfit ≤ 0
   * or structure is excluded from ratio ranking (see §4.6).
   */
  debitToPayoffRatio: number | null;
  /**
   * abs(net premium) / wing width (points×multiplier). Null when width ≤ 0
   * or structure excluded from ratio ranking.
   */
  debitToWidthRatio?: number | null;
  convexityScore: number;
  /** true when convexityScore uses the Phase-1 heuristic, not calibrated research */
  convexityProvisional: boolean;
  expectedSharpe?: number | null;
  expectedSortino?: number | null;
  expectedCalmar?: number | null;
  expectedReturnAvgDd?: number | null;
}

/**
 * How this structure was ordered. MUST be displayed in UI (HC-7 / honesty doctrine).
 * When primary_metric is uncomputable, ranked_by names the proxy sort — never silent.
 */
type RankedBy =
  | "sharpe"
  | "sortino"
  | "calmar"
  | "return_avg_dd"
  | "convexity_ratio_proxy";  // Phase-1 fallback when expected_* absent

interface RankedStructure {
  structure: Structure;
  metrics: StructureMetrics;
  rank: number;                // 1 = best under ranked_by
  score: number;               // numeric sort key for ranked_by
  /** Required: actual sort key used (may differ from config.primary_metric). */
  ranked_by: RankedBy;
  /** true when ranked_by ≠ config.primary_metric (proxy ranking). UI MUST surface. */
  primary_metric_substituted: boolean;
  /** Chain / series provenance for this rank result. */
  data_provenance: DataProvenance;
  reasons?: string[];          // optional explainability
}

/** Honesty: label data proxies (Architecture §8.4). */
type DataProvenance =
  | { source: "live_chain"; provider: string; asof: string }
  | { source: "historical_chain"; provider: string; asof: string }
  | { source: "stub"; label: string; asof?: string }
  | { source: "backtest_distribution"; run_id: string; asof: string };

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface SearchQuery {
  // Pack-defined; typical fields:
  underlying?: string;
  dte_min?: number;
  dte_max?: number;
  rights?: ("call" | "put")[];
  [key: string]: unknown;
}

interface OptionChain {
  // Host-provided chain snapshot; provider-agnostic
  underlying: string;
  asof: string;                // ISO-8601
  /** Required for honesty: stub vs live/historical provider. */
  provenance: DataProvenance;
  expirations: unknown[];
  [key: string]: unknown;
}
```

### 3.3 Persistence mapping (normative)

On strategy cards (Foundation + Portability):

| Concept | Storage |
|---------|---------|
| Pack selection | `attributes["strategy_pack@1"]` → `{ "pack_id", "pack_version" }` |
| Pack config | `attributes["butterfly_config@1"]` (or `{pack_id}_config@1`) → `StrategyConfig` fields |
| Constructed candidates (optional cache) | `attributes["structure_candidates@1"]` or evidence entries |
| Evidence of analysis runs | `evidence[]` / `attributes["__evidence@1"]` until first-class evidence store |

**Versioning on save:** Foundation already versions the **strategy product** (`version` major.minor.patch). Pack config saves MUST either:

- bump strategy version (host policy: default **minor** on material config change), and/or  
- stamp `pack_version` + `config_revision` inside the attribute bag  

Silent overwrite of config without log event is **forbidden**. Lifecycle log SHOULD record `pack_config_save` with from/to summary.

### 3.4 Registry

```ts
interface StrategyPackRegistry {
  list(): StrategyPackMeta[];
  get(packId: string): StrategyPack | null;
  register(pack: StrategyPack): void;  // boot-time / plugin load only
}

interface StrategyPackMeta {
  id: string;
  name: string;
  version: string;
  description: string;
  isEnabled: boolean;
}
```

Phase 1: only `butterfly` is registered and enabled. Disabled packs MUST NOT appear in create/template flows for members.

---

## 4. Butterfly Pack — Phase 1 definition

### 4.1 Identity

| Field | Value |
|-------|--------|
| `id` | `butterfly` |
| `name` | Butterfly Family |
| `version` | `1.0.0` |
| `description` | Symmetric (Batman) and Broken Wing Butterflies focused on mispriced convexity, extreme risk-to-reward, and risk-adjusted returns. Core strategies used in FatTail coaching. |
| `isEnabled` | `true` (Phase 1 sole family) |

### 4.2 Family variants

| Variant key | Label | Intent |
|-------------|-------|--------|
| `batman` | **Batman** | **Package of two wing-symmetric flies: call fly + put fly.** Usually matched widths; optional independent `call_width_points` / `put_width_points` when `match_side_widths=false`. Debit-to-width uses package debit / (call_width + put_width). |
| `single` | Single fly | One call *or* put fly only (not a Batman) |
| `broken_wing` | Broken Wing Butterfly (BWB) | Asymmetric single-side BWB; debit-to-payoff + convexity quality |

**Product language (Coach lock):** A **Batman** is not a single symmetric fly. It is **both** a call butterfly and a put butterfly together. Alias: `symmetric` → `batman` for older configs.

Config field `butterfly_family` ∈ {`batman`, `single`, `broken_wing`} selects `variants` schema branch.

### 4.3 Parameter schema

#### 4.3.1 Common fields

| name | type | label | required | options / bounds | dependsOn |
|------|------|-------|----------|------------------|-----------|
| `direction` | enum | Direction | yes | `call`, `put`, `balanced` | — |
| `dte_type` | enum | DTE Type | yes | `0dte`, `1dte`, `2_5_dte`, `custom` | — |
| `dte_min` | number | Min DTE | no | 0–10 | `dte_type=custom` |
| `dte_max` | number | Max DTE | no | 0–10 | `dte_type=custom` |
| `max_capital_at_risk` | number | Max Capital at Risk | yes | min 0.01 | — |
| `max_capital_unit` | enum | Capital Unit | yes | `dollars`, `percent_of_capital` (default `dollars`) | — |
| `primary_metric` | enum | Primary Optimization Metric | yes | `sharpe`, `sortino`, `calmar`, `return_avg_dd` | — |
| `entry_conditions` | json | Entry Conditions | no | pack-defined JSON | — |
| `exit_rules` | json | Exit Rules | yes | MUST include dynamic trailing on premium decay rate | — |

**DTE type resolution (normative):**

| `dte_type` | Effective DTE window |
|------------|----------------------|
| `0dte` | min=0, max=0 |
| `1dte` | min=1, max=1 |
| `2_5_dte` | min=2, max=5 |
| `custom` | `dte_min`…`dte_max` as provided (both required when custom) |

#### 4.3.2 Variant: `symmetric`

| name | type | label | required | options / bounds | dependsOn |
|------|------|-------|----------|------------------|-----------|
| `symmetric_regime` | enum | Regime | yes | `high_vix`, `mid_vix`, `low_vix`, `campaign` | — |
| `width_style` | enum | Width Style | yes | `wide`, `variable`, `narrow`, `fixed_30_50` | — |
| `width_points_min` | number | Min Width (points) | no | 10–100 | — |
| `width_points_max` | number | Max Width (points) | no | 10–100 | — |
| `debit_to_width_min` | number | Min Debit-to-Width | yes | 0.01–0.15 | — |
| `debit_to_width_max` | number | Max Debit-to-Width | yes | 0.01–0.15 | — |
| `directional_bias` | enum | Directional Bias | no | `none`, `with_trend` | `symmetric_regime=mid_vix` |
| `timing` | enum | Timing | no | `morning`, `before_close`, `any` | — |
| `frequency_per_week` | number | Target Frequency per Week | no | 1–5 | `symmetric_regime=campaign` |
| `vix_1d_mode` | enum | 1-Day VIX Adjustment | no | `auto`, `manual` (default `auto`) | — |

#### 4.3.3 Variant: `broken_wing`

| name | type | label | required | options / bounds | dependsOn |
|------|------|-------|----------|------------------|-----------|
| `bwb_style` | enum | BWB Style | yes | `A_efficiency`, `A_plus_scalp`, `B_steep`, `B_plus_gamma` | — |
| `broken_wing_side` | enum | Broken Wing Side | yes | `upper`, `lower` | — |
| `target_debit_to_payoff_min` | number | Min Debit-to-Payoff | yes | pack validation range | — |
| `target_debit_to_payoff_max` | number | Max Debit-to-Payoff | yes | pack validation range | — |
| `min_convexity_quality` | enum | Minimum Convexity Quality | **no** (optional until Q1 calibration lock) | `medium`, `high`, `extreme` | — |
| `positioning_notes` | string | Positioning Notes | no | free text | — |

**Note on `min_convexity_quality`:** Until convexity calibration closes (Q1), this filter is **optional**. When set, it filters against a **provisional** score (`convexityProvisional: true`); the UI MUST label the filter and scores as provisional (fail-loud honesty). After Q1, the field MAY become required via pack minor version bump.

#### 4.3.4 Validation rules catalog (human + machine)

1. `max_capital_at_risk` must be > 0  
2. `primary_metric` must be risk-adjusted (HC-2)  
3. `exit_rules` must include dynamic premium-decay trailing  
4. No undefined-risk structures allowed (HC-1)  
5. Symmetric regimes must respect debit-to-width min/max (min ≤ max)  
6. Broken Wing requires `bwb_style` and `broken_wing_side`  
7. When `dte_type=custom`, both `dte_min` and `dte_max` required and `dte_min ≤ dte_max`  
8. `debit_to_width_min ≤ debit_to_width_max` (symmetric)  
9. `target_debit_to_payoff_min ≤ target_debit_to_payoff_max` (BWB)  

`validate()` returns `valid: false` with concrete `errors[]` for any violation; soft advice goes to `warnings[]`.

### 4.4 UI definition

```ts
{
  layout: "stepper",
  livePreview: true,
  sections: [
    { id: "identity",  title: "Strategy Identity & Direction" },
    { id: "structure", title: "Structure & Style" },
    { id: "risk",      title: "Risk & Capital" },
    { id: "edge",      title: "Convexity & Debit Rules" },
    { id: "timing",    title: "Timing, Regime & Entry" },
    { id: "exits",     title: "Exit Rules" },
    { id: "review",    title: "Review & Create Version" }
  ]
}
```

**UI requirements (normative for Phase 1 Development work area when pack attached):**

| ID | Requirement |
|----|-------------|
| **UI-1** | Fields rendered from `getSchema()` + `dependsOn` (dynamic form) |
| **UI-2** | Sections follow `getUIDefinition().sections` (stepper) |
| **UI-3** | Live payoff diagram for selected / top-ranked structure |
| **UI-4** | Live display of debit-to-width and/or debit-to-payoff (variant-appropriate); ratios use **abs premium** |
| **UI-5** | Primary metric selector restricted to risk-adjusted enums |
| **UI-6** | Save creates/updates versioned strategy card (foundation versioning) |
| **UI-7** | Rank results always show `ranked_by` and, when `primary_metric_substituted`, an explicit banner that the chosen primary metric was not computable |
| **UI-8** | Chain/rank provenance visible when `data_provenance.source === "stub"` (or any proxy) |
| **UI-9** | When `convexityProvisional`, convexity scores and `min_convexity_quality` filters labeled provisional |

### 4.5 Default configs (seed templates)

These are **named templates** returned by `getDefaultConfigs()`. Host may offer “Create from template” in Development.

1. **High VIX Wide 0DTE Batman** — symmetric · `high_vix` · balanced · 0DTE · debit-to-width 0.02–0.05 · primary `sortino`  
2. **Mid VIX Trend Morning Butterfly** — symmetric · `mid_vix` · call · with_trend · morning · 0DTE · debit-to-width 0.05–0.10  
3. **Low VIX 1DTE Overnight Batman** — symmetric · `low_vix` · balanced · 1DTE · before_close · debit-to-width 0.02–0.05  
4. **Short-Term Campaign 2-5 DTE** — symmetric · `campaign` · balanced · 2–5 DTE · width `fixed_30_50` · debit-to-width 0.02–0.05 · frequency 2/week  
5. **BWB Style A+ Near-Zero Scalp** — broken_wing · `A_plus_scalp` · put · lower wing · (optional min convexity omitted until calibration)  
6. **BWB Style B+ High Gamma Scalp** — broken_wing · `B_plus_gamma` · call · upper wing · (optional min convexity omitted until calibration)  

Templates MUST pass `validate()` once host fills required capital/exit defaults (if template omits required fields, host applies pack defaults then validates).

### 4.6 Metrics definitions (Butterfly)

| Metric | Definition (Phase 1) |
|--------|----------------------|
| `debitOrCredit` | Net premium: **debit positive**, **credit negative**. Defined-risk only (HC-1). |
| `netPremiumAbs` | `abs(debitOrCredit)` — the only quantity used in ratio numerators |
| `maxProfit` | Peak payoff on the payoff curve within model assumptions |
| `maxLoss` | Finite max loss; infinite → invalid structure |
| `debitToWidthRatio` | `netPremiumAbs / wingWidth` (points×multiplier as pack defines). **Null** if width ≤ 0 |
| `debitToPayoffRatio` | `netPremiumAbs / maxProfit` (or peak payoff). **Null** if maxProfit ≤ 0 |
| `convexityScore` | Pack-defined score from wing geometry + premium relationship (§4.6.1) |
| `convexityProvisional` | **Required boolean** — `true` until Q1 calibration lock |
| Expected Sharpe/Sortino/Calmar/ReturnAvgDd | Null until a backtest (or other) process plugin supplies a distribution |

#### 4.6.1 Credit vs debit (normative — fixes sign inversion)

Convexity ratios (HC-4) are defined on **premium magnitude**, not the signed debit/credit:

| Case | Ratio eligibility | Notes |
|------|-------------------|--------|
| Debit (`debitOrCredit > 0`) | Ratios computed with `netPremiumAbs` | Default templates |
| Credit (`debitOrCredit < 0`) with **finite** maxLoss | Ratios computed with `netPremiumAbs` the same way | Allowed only under HC-1; no automatic rank advantage from sign |
| Credit with non-finite maxLoss | **Invalid** — discard | Undefined risk |

**Forbidden:** Using signed `debitOrCredit` as the ratio numerator (credit would produce negative ratios and dominate “lower is better” sorts).

**Tie-break / filter sense:** “Lower ratio is more premium-efficient” always means lower `netPremiumAbs / payoff` (or width), for debit and credit alike.

#### 4.6.2 Convexity score (initial normative sketch)

Until a calibrated model ships, Phase 1 MAY use a **transparent heuristic** documented in code:

- Favor lower `debitToPayoffRatio` when non-null (more payoff per premium dollar)  
- Favor structures inside configured ratio bands  
- Penalize near-zero maxProfit or capital_at_risk breaches  
- When `min_convexity_quality` is set, map score to `medium` / `high` / `extreme` thresholds **documented as provisional**

Exact formula is an implementation detail **but MUST be deterministic and versioned** with pack version.  
`StructureMetrics.convexityProvisional` MUST be `true` while this heuristic is in force.

### 4.7 Ranking

#### 4.7.1 Metric resolution (no silent substitution)

| Condition | Behavior |
|-----------|----------|
| `primary_metric` selected and **computable** (expected_* present for that metric) | Sort by that metric descending; `ranked_by = primary_metric`; `primary_metric_substituted = false` |
| `primary_metric` selected but **not computable** (Phase 1: no backtest distribution) | Sort by **convexity + ratio proxy** (§4.7.2); `ranked_by = "convexity_ratio_proxy"`; `primary_metric_substituted = true` |
| UI / API response | **MUST** expose `ranked_by` and `primary_metric_substituted` on every `RankedStructure` (and rank summary). UI **MUST** display them (UI-7). Silent substitution is **forbidden** (HC-7, Architecture §8.4). |

Optional strict mode (config or host flag): `rankStructures` **fails loud** (422 / ValidationResult error) when primary is uncomputable instead of proxy-ranking. Default Phase 1 = **proxy with visible `ranked_by`**.

#### 4.7.2 Algorithm

1. Discard structures failing `validate` constraints or ratio bands (null ratios do not pass a min/max band filter).  
2. Discard undefined or non-finite maxLoss.  
3. Discard capital_at_risk > configured max (after unit resolution).  
4. Resolve sort key per §4.7.1.  
5. If proxy sort (`convexity_ratio_proxy`):  
   - Primary key: higher `convexityScore`  
   - Tie-break: lower non-null `debitToPayoffRatio` (using `netPremiumAbs`); structures with null ratio sort after those with ratios  
   - Further tie-break: lower non-null `debitToWidthRatio`  
6. Stamp every result with `data_provenance` from the chain (or stub) used.  
7. **Never** sort primarily by win rate (HC-3).

### 4.8 Exit rules (minimum content)

`exit_rules` is JSON. Required conceptual keys (names stable):

```json
{
  "dynamic_premium_decay_trailing": {
    "enabled": true,
    "mode": "rate",
    "notes": "Trail based on premium decay rate — required"
  },
  "take_profit": { "enabled": false },
  "time_stop": { "enabled": false },
  "discretionary_notes": ""
}
```

`validate` fails if `dynamic_premium_decay_trailing.enabled !== true` (or equivalent pack path).

### 4.9 Promote to Curation

**Canonical decision** (shared with Architecture Design — do not fork):

| Path | Rule |
|------|------|
| Formal **Promote** (Development → Curation) | Foundation requires Development `phase_state === deployed` |
| Pack `beforePromoteToCuration` | Config must `validate()`; pack may add evidence requirements later |
| Phase 1 evidence | **Soft:** analysis evidence recommended, not hard-required until process plugins ship |
| Direct hop / move without Promote | Host may allow for demo; **Promote** remains the gated path |

`beforePromoteToCuration`:

- Returns `false` (or throws mapped 422) if config invalid  
- MUST NOT invent a second soft/hard policy that contradicts the table above  

Foundation still owns the phase move; pack only **gates**.

---

## 5. Core engines (host responsibilities)

These are **core** modules packs call into or that enforce cross-pack rules. Packs do not reimplement them differently per family without registry hooks.

| Engine | Responsibility |
|--------|----------------|
| **StrategyPackRegistry** | Discover enabled packs |
| **VersionEngine** | Strategy product version bumps on save; pack_version stamps |
| **CommonValidationEngine** | HC-* cross-pack (defined risk, primary_metric enum) |
| **RiskAdjustedMetrics** | Shared Sharpe/Sortino/Calmar/Return-AvgDD helpers when series exist |
| **PremiumDecayTrailing** | Shared exit semantics helpers / validators |
| **CapitalAtRiskEngine** | Dollars vs % of capital resolution against member context |
| **StrategyStateMachine** | Foundation phase/phase_state (already exists) |

Phase 1 may implement engines as thin modules; presence of the **contract** is required even if some expected_* metrics return null until backtest evidence exists.

---

## 6. API surface (Labs — proposed contract)

Session-scoped; Family B. Paths are normative intent for implementation.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/me/strategy-lab/packs` | List enabled packs (meta) |
| GET | `/api/me/strategy-lab/packs/{pack_id}` | Schema + UI definition + defaults |
| POST | `/api/me/strategy-lab/packs/{pack_id}/validate` | Body: config → ValidationResult |
| POST | `/api/me/strategy-lab/packs/{pack_id}/rank` | Body: config + optional chain ref → ranked structures |
| PATCH | `/api/me/strategy-lab/strategies/{id}` | Existing; persists `attributes` including pack config |

Chain data source for Phase 1 analysis is **host-provided** (Massive or stub); must not require Tradier.  
Every rank/construct response MUST carry `data_provenance`. Stub-derived rankings are **data proxies** and MUST be labeled in API + UI (Architecture §8.4).

---

## 7. Logical module layout

### 7.1 Conceptual tree (from product design)

```text
strategy-packs/   # logical name
├── core/
│   ├── registry/
│   ├── versioning/
│   ├── validation/
│   ├── metrics/
│   ├── exits/
│   ├── capital/
│   ├── lifecycle/          # facade over foundation state machine
│   └── types/
├── packs/
│   ├── butterfly/
│   │   ├── index
│   │   ├── schema
│   │   ├── ui
│   │   ├── defaults
│   │   ├── validation
│   │   ├── search
│   │   ├── metrics
│   │   └── types
│   ├── vertical/           # future
│   └── _template/
├── shared/types/
└── ui/design/              # Next work-area components
    ├── StrategyDesigner
    ├── DynamicForm
    ├── PayoffPreview
    └── VersionPanel
```

### 7.2 Mapping onto FatTail Labs repo (normative host paths)

| Logical | Labs location (intent) |
|---------|------------------------|
| Pack domain (Python) | `server/strategy_packs/` (or `server/strategy_lab_packs/`) |
| Registry + engines | same package |
| HTTP routes | `server/routes/strategy_lab.py` (extend) or `server/routes/strategy_packs.py` |
| Types for UI | `web/lib/strategyPacks/` |
| Development designer UI | `web/components/strategy-lab/design/` or `…/packs/butterfly/` |
| Risk / payoff preview | Reuse / adapt `strategy-lab-proto` risk engine patterns via HTTP or ported modules — **no MSC shared imports** |
| Persistence | Existing `strategy_lab_strategies.attributes_json` |

Streamlit `strategy-lab-proto/` remains a **prototype lab**, not the production SoR.

---

## 8. Security, privacy, and isolation

| Rule | Source |
|------|--------|
| All strategy configs and analysis artifacts are Family B | Application Framework + Privacy |
| Pack code is platform; member configs are private | This spec |
| No pack may log raw chains with PII beyond member-owned context | Privacy |
| Export includes pack attribute bags opaquely | Portability Spec |
| Admin access to member cards requires consent workflow | Privacy individual-access |

---

## 9. Observability

| Event / metric | Notes |
|----------------|-------|
| `pack.validate` outcomes | error codes counts |
| `pack.rank` latency, candidate counts | fail loud on chain missing |
| `pack_config_save` in lifecycle_log | audit |
| primary_metric distribution | product analytics (aggregate only) |

No profit claims in user-visible analytics copy.

---

## 10. Non-goals (this version)

- Live order routing, Tradier account linking, or broker fills as SoR  
- Short / undefined-risk iron structures as first-class pack outputs  
- Win-rate leaderboards  
- Multi-member shared pack configs  
- Automatic phase invention (e.g. “Scanner” phase)  
- Replacing foundation life cycle with a pack-local state machine  

---

## 11. Acceptance criteria (spec completeness for Phase 1 build readiness)

A build is **spec-conformant** for Butterfly Phase 1 when:

1. Only enabled pack is `butterfly` (or others disabled).  
2. Schema, UI definition, and six defaults match §4.  
3. `validate` enforces HC-1–HC-4 and §4.3.4.  
4. `rankStructures` never primarily sorts by win rate; every result includes `ranked_by` and `primary_metric_substituted`; when primary is uncomputable, UI shows the proxy (or strict mode fails loud).  
5. Ratio numerators use `netPremiumAbs` (credit structures do not win on sign).  
6. Dynamic UI renders schema fields with `dependsOn`.  
7. Live preview shows payoff + relevant ratios; stub provenance labeled.  
8. Configs persist on strategy cards under versioned attribute keys.  
9. Save emits version/log events (no silent overwrite).  
10. No live execution path is required for Development analysis.  
11. Portability export/import preserves pack attribute bags.  
12. `convexityProvisional` stamped while heuristic is active; `min_convexity_quality` optional until Q1.

---

## 12. Future packs and execution (informative)

| Horizon | Item |
|---------|------|
| Next pack | **Verticals** (`vertical`) — same interface |
| Mid-September 2026 (intent) | Tradier integration for live execution — separate execution pack / process plugin |
| Later | Condors, calendars, multi-leg books as packs |

Execution MUST remain a **process** capability attached to Deployment, not a rewrite of Development schema.

---

## 13. Key decisions (locked in this spec)

| ID | Decision | Rationale |
|----|----------|-----------|
| **KD-1** | Strategy families ship as **Strategy Packs** behind a stable interface | Core stays pack-agnostic; Verticals later without phase rewrite |
| **KD-2** | “Design Phase” in coach language = **Development** in Labs | Aligns shipped UI and foundation phase keys |
| **KD-3** | Phase 1 pack = **Butterfly only**; analysis + curation depth only | Matches coaching priority and pre-Tradier timeline |
| **KD-4** | Primary metric must be **risk-adjusted** | FatTail thesis vs retail win-rate products |
| **KD-5** | Defined risk only | Capital preservation / stop-the-bleeding |
| **KD-6** | Pack config lives in **attributes** on identity-scoped cards | Fits foundation + portability already shipping |
| **KD-7** | Server-authoritative validate/rank; UI dynamic from schema | Fail loud; no divergent client business rules |
| **KD-8** | TypeScript shapes are the **contract language**; production host is Labs Python + Next | Avoids greenfield TS monorepo that forks Labs architecture |
| **KD-9** | Uncomputable `primary_metric` → proxy rank with required `ranked_by` (not silent) | HC-7 + honesty doctrine; Phase 1 usable without backtest |
| **KD-10** | Ratio numerators = `netPremiumAbs` | Prevents credit sign inversion in “lower ratio” sorts |
| **KD-11** | `min_convexity_quality` optional while convexity provisional | Fail-loud: no required filter on uncalibrated score |

---

## 14. Open questions (spec-level; not an implementation plan)

| # | Question | Default if unresolved |
|---|----------|------------------------|
| Q1 | Exact `convexityScore` calibration vs coaching research; when to make `min_convexity_quality` required | Deterministic provisional heuristic §4.6.2; field stays **optional** until lock |
| Q2 | Chain provider for Phase 1 analysis (Massive vs other) | Host stub + Massive when configured; **stub always labeled** |
| Q3 | *(Resolved — see §4.9 / Architecture open Q1)* Promote soft vs hard | Formal Promote requires Deployed; evidence soft in Phase 1 |
| Q4 | Multiplier / point value conventions for index underlyings | Document per-underlying table in pack metrics |
| Q5 | *(Resolved — see §4.6.1)* Credit BWBs | Allowed if finite maxLoss; ratios on `netPremiumAbs` |
| Q6 | Default Phase 1: proxy rank with visible `ranked_by` vs strict fail when primary uncomputable | **Proxy + visible** (Claude review preference); strict mode optional |

---

## 15. References

- Coach input: *FatTail Strategy Lab – Technical Specification – Design Phase + Modular Strategy Pack Architecture v1.0 – Butterfly Pack (Phase 1)*  
- [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md)  
- [`Strategy-Lab-Life-Cycle-Architecture-v1.1.md`](./Strategy-Lab-Life-Cycle-Architecture-v1.1.md)  
- [`Strategy-Lab-Portability-Spec-v1.0.md`](./Strategy-Lab-Portability-Spec-v1.0.md)  
- Prototype IR: `strategy-lab-proto/engine/spec.py` (long_butterfly / defined-risk long structures)  
- Risk engine proto: `strategy-lab-proto/engine/risk_engine/`  

---

## 16. Document history

| Date | Note |
|------|------|
| 2026-08-04 | v1.0 — Formal Strategy Pack architecture + Butterfly Pack Phase 1; Design→Development map; Labs host mapping; no agent implementation plan in this document |
| 2026-08-04 | v1.0.1 — Claude review: `ranked_by` + substitution flag; `netPremiumAbs` ratios; provisional convexity; stub provenance; promote policy unified with Architecture |

---

## 17. Coach lock summary

> **Strategy Packs are the modular way FatTail encodes strategy families on top of the life-cycle foundation.**  
> Phase 1 ships the **Butterfly** pack only: symmetric Batman and Broken Wing, risk-adjusted ranking, defined risk, dynamic schema-driven Development UI, analysis and curation — **not** live brokerage.  
> Core stays pack-agnostic; Verticals and Tradier attach later through the same interface without rewriting the Strategy Lab spine.
