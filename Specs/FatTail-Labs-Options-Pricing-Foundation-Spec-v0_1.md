# FatTail Labs — Options Pricing Foundation Spec v0.1

**Status:** **DRAFT** (2026-08-11)  
**Type:** Foundation product + architecture law — **data plane + model packs**  
**Short name:** **OPF** (Options Pricing Foundation)  
**Architecture:** [`Architecture/30-options-pricing-foundation.md`](../Architecture/30-options-pricing-foundation.md)  

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Market Bus Spec v1.0.1](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Transport · Redis · one WS/tab · feeds |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · OC2 proxy spot · OC6a strikes · dual-side heritage |
| Arch/28 | As-built bus topology |
| Claude.md | No MSC · config fail-loud · verify |

**Scope:** Layers **L0–L4** only. Application wiring (L5) is **out of scope** for OPF v0.1 exit.

---

## 0. Mission

Provide a **single foundation** so Labs can:

1. Ingest **options chain snapshots** into dual-side, multi-expiration **generations**.  
2. Combine them with **live underlier/session** facts.  
3. Price **single- and multi-leg** structures (including **calendars/diagonals**).  
4. Support **lock/unlock** package cost basis for limit settlement.  
5. Run **use-case model packs** (day trade · outlook · backtest) with **one default and one alternate** each.  
6. Expose a **stable resolve API** so future tools never invent private Massive/IV paths.

**North star:** accurate, honest real-time (and research) multi-leg P&amp;L marks and curves — professional standard, **not** MSC as authority.

---

## 1. Layer map (normative)

| Layer | Name | Responsibility |
|-------|------|----------------|
| **L0** | Market facts transport | Snapshot fill, feeds, Redis, WS push/hydrate, sym/session |
| **L1** | Contract generation store | Multi-exp dual generations, interest, hash, quality |
| **L2** | Pricing data plane | Leg marks, package quote, IV cascade, lock, strategy intents |
| **L3** | Model pack runtime | Registry, engines, scenarios, replay |
| **L4** | Tool API | `resolve` / subscribe contracts for apps |
| **L5** | Applications | **Out of OPF v0.1** — wire after foundation exit |

---

## 2. Global laws (OPF1–OPF20)

| ID | Law |
|----|-----|
| **OPF1** | Apps and packs **must not** call Massive directly. Only L0 feeds (or single-flight fill on miss per Market Bus). |
| **OPF2** | Options fact source for live packs is **chain snapshot generations**, not underlier-only synthetic options. |
| **OPF3** | Live transport is **WebSocket** push (+ HTTP hydrate). SSE is not the market generation channel. |
| **OPF4** | Generation keys are **dual-side**; `side` is never part of the cache key. |
| **OPF5** | Each strategy leg **must** carry its own `expiration` (multi-exp first-class). |
| **OPF6** | Package natural debit \(D_{\mathrm{nat}} = \sum_i q_i m_i\) (per share); dollars = ×100 × packages. |
| **OPF7** | Incomplete legs → `complete=false`; no silent mid/IV invention for required legs. |
| **OPF8** | IV cascade always records `iv_source` (exact \| nearest \| closest_dte \| stored \| atm_exp \| vix). |
| **OPF9** | Lock freezes **package cost basis** \(D^*\); default does **not** freeze IV unless `freeze_iv`. |
| **OPF10** | Unlocked \(D_{\mathrm{basis}} = D_{\mathrm{nat}}\) when complete; else basis undefined for mark P&amp;L. |
| **OPF11** | Every PricingResult **must** label outputs: `mark` \| `model_t0` \| `expiration` \| `scenario` \| `historical`. |
| **OPF12** | Tools **must** declare `use_case`; pack defaults from registry unless override allowed. |
| **OPF13** | Each use case has exactly **one default** and **one alternate** pack id (this Spec §6). |
| **OPF14** | Day-trade mark path uses **live mids**; model curve uses **per-leg IV** (default pack) or surface (alternate). |
| **OPF15** | Outlook must not present scenario P&amp;L as a live mark. |
| **OPF16** | Backtest default requires **generation archive** (or hist API); else fail loud. |
| **OPF17** | Truncated snapshot (`next_url` past budget) → hard fail for that generation (HM18 heritage). |
| **OPF18** | Standard 100-share contracts only in generations (HM19 heritage); count exclusions. |
| **OPF19** | No MSC Redis schemas or MSC runtime imports. |
| **OPF20** | Config missing for bus/archive when required → fail loud at resolve time. |

---

## 3. Layer L0 — Market facts transport

### 3.1 Inputs

| Source | Role |
|--------|------|
| Massive `GET /v3/snapshot/options/{underlying}` | Options generation fill |
| Massive / marks path for underliers | Spot (proxy-safe per OC2) |
| Massive marketstatus (or bus session doc) | Session open/held |

### 3.2 Writers

| Process | Writes |
|---------|--------|
| `chain_feed` | `mb:ladder:*:dual` generations for interest topics |
| `sym_feed` | `mb:sym:*`, `mb:session:market_status` |
| API single-flight on miss | Same ladder keys when feed cold |

### 3.3 Redis keys (normative dual form)

```text
mb:ladder:{chain_underlier}:{expiration}:w{wings}:dual
mb:sym:{PRODUCT}
mb:session:market_status
mb:interest:{topic}
mb:pub
```

**OPF-L0-1:** `chain_feed` and interest **must** parse dual keys (no required `side` segment).  
**OPF-L0-2:** Legacy single-side keys are deprecated; dual is SoR.

### 3.4 Fan-out

| Channel | Role |
|---------|------|
| WS `/api/me/market/stream` | Push generation full \| diff \| unchanged; session; sym |
| HTTP chain-ladder / future generation GET | Hydrate / poll fallback |

### 3.5 L0 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L0-1** | Dual key written and read with `dual_side` rows (call+put). |
| **AT-L0-2** | Diff upsert includes `iv` field changes. |
| **AT-L0-3** | Feed warms dual interest topics without idle misparse. |
| **AT-L0-4** | Held session stops chain churn; last generation retained. |

---

## 4. Layer L1 — Contract generation store

### 4.1 GenerationKey

```text
{
  "product": "SPX",
  "chain_underlier": "I:SPX",
  "expiration": "2026-08-11",
  "wings": 25
}
```

### 4.2 ChainGeneration (minimum fields)

```text
{
  "generation_key": GenerationKey,
  "content_hash": string,
  "as_of": ISO-8601,
  "spot": number | null,
  "strike_step": number | null,
  "dual_side": true,
  "excluded_adjusted_count": number,
  "contracts": {
    "call:7750": {
      "side": "call", "strike": 7750, "expiration": "...",
      "bid", "ask", "mid", "last",
      "iv", "delta", "gamma", "theta", "vega",
      "open_interest", "volume", "ticker"
    },
    ...
  }
}
```

### 4.3 InterestManager

- Refcount `GenerationKey` by foundation consumers (not by app name).  
- Multi-exp strategy → N interests.  
- GC when refcount 0 after grace (Market Bus interest TTL).

### 4.4 Wings policy

- Default: **shared wings** for all exps in a book.  
- Ensure strike-union of all legs ⊆ each exp’s loaded band; else incomplete + reason `strike_out_of_band`.  
- Dual-side page budget: clamp wings per OPF parent (e.g. max dual wings 50).

### 4.5 Pricing epoch

```text
PricingEpoch = {
  spot: number,
  generations: { expiration → { content_hash, as_of } },
  coherent: boolean   // best-effort true; strict Δt optional later
}
```

### 4.6 L1 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L1-1** | Two exps subscribed; both ready independently. |
| **AT-L1-2** | Diff on exp B does not drop exp A. |
| **AT-L1-3** | Unsubscribe GC when last consumer releases. |

---

## 5. Layer L2 — Pricing data plane

### 5.1 LegIntent

```text
{
  "leg_id": string,
  "side": "call" | "put",
  "strike": number,
  "expiration": "YYYY-MM-DD",
  "qty": number          // signed: +long −short
}
```

### 5.2 StrategyIntent

```text
{
  "strategy_id": string,
  "product": string,
  "structure": "single" | "vertical" | "butterfly" | "calendar" | "diagonal" | "custom",
  "legs": LegIntent[],
  "packages": number,     // default 1
  "lock": LockState,
  "meta": { "source"?: string, "tos"?: string, "label"?: string }
}
```

### 5.3 LockState

```text
// Unlocked
{ "mode": "unlocked" }

// Locked
{
  "mode": "locked",
  "locked_at": ISO-8601,
  "package_debit_per_share": number,  // signed: +debit paid, −credit received
  "lock_source": "natural_mid" | "user_limit" | "tos_limit",
  "generation_hashes_at_lock": { "YYYY-MM-DD": "hash" },
  "freeze_iv": boolean,
  "leg_iv_snapshot"?: { [leg_id]: number },
  "freeze_marks": boolean,
  "leg_mark_snapshot"?: LegMark[]
}
```

### 5.4 LegMark

```text
{
  "leg_id": string,
  "side", "strike", "expiration",
  "bid", "ask", "mid": number | null,
  "iv": number | null,
  "iv_source": "exact" | "nearest" | "closest_dte" | "stored" | "atm_exp" | "vix" | "locked",
  "mark_source": "mid" | "bid_ask_mid" | "last" | "locked" | "missing",
  "quality": "ok" | "wide" | "one_sided" | "stale" | "missing",
  "generation_hash": string | null
}
```

### 5.5 PackageQuote

```text
{
  "strategy_id": string,
  "as_of": ISO-8601,
  "complete": boolean,
  "incomplete_reason"?: string,
  "natural_debit_per_share": number | null,
  "basis_debit_per_share": number | null,   // after lock policy
  "basis_mode": "unlocked_natural" | "locked",
  "legs": LegMark[],
  "generations_used": { "YYYY-MM-DD": "content_hash" }
}
```

**Natural debit:** \(D_{\mathrm{nat}} = \sum_i q_i \cdot m_i\) using each leg’s mid from its generation.

### 5.6 IV cascade (normative order)

1. `exact` — contract IV at side:strike:exp  
2. `nearest` — nearest strike same side/exp in generation  
3. `closest_dte` — same side/strike, nearest subscribed exp  
4. `stored` — strategy snapshot  
5. `atm_exp` — ATM window modal average IV that exp  
6. `vix` — VIX/VIX1D-derived annualized  

Band filter: reject IV ≤ 0.01 or ≥ 5.0 unless config overrides.

### 5.7 Lock rules

| Action | Rule |
|--------|------|
| Lock natural | Requires `complete`; \(D^* = D_{\mathrm{nat}}\) |
| Lock limit | Always allowed; \(D^* =\) user/ToS limit (signed) |
| Unlock | Clear \(D^*\); resume natural when complete |
| Edit limit while locked | Updates \(D^*\) only |

### 5.8 L2 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L2-1** | Fly natural matches \(\sum q_i m_i\) fixture. |
| **AT-L2-2** | Calendar uses mids from two generations. |
| **AT-L2-3** | Missing body mid → incomplete. |
| **AT-L2-4** | Lock natural then move mid → basis fixed, natural moves. |
| **AT-L2-5** | Per-leg `iv_source=exact` when present. |
| **AT-L2-6** | Cross-exp IV never labeled `exact`. |

---

## 6. Layer L3 — Model packs

### 6.1 Registry

```text
UseCase = "day_trade" | "outlook" | "backtest"

PackBinding = {
  use_case: UseCase,
  default_pack_id: string,
  alternate_pack_id: string,
  packs: { [pack_id]: PackDescriptor }
}

PackDescriptor = {
  pack_id: string,
  version: string,           // semver
  use_case: UseCase,
  engine: string,            // implementation id
  labels: string[],          // required output labels
  requires_archive: boolean,
  requires_live_chain: boolean
}
```

### 6.2 Normative pack ids (v0.1)

| Use case | Default | Alternate |
|----------|---------|-----------|
| `day_trade` | `day_trade.mark_hybrid` | `day_trade.surface` |
| `outlook` | `outlook.scenario_surface` | `outlook.dynamics` |
| `backtest` | `backtest.chain_replay` | `backtest.surface_reconstruct` |

### 6.3 Pack semantics

#### `day_trade.mark_hybrid` (default)

| Output | Method |
|--------|--------|
| Mark now | Package natural mid (L2) |
| Model T+0 curve | European BS (index) / American engine (equity) with **per-leg IV** from L2; sticky rule on spot axis |
| Expiration curve | Horizon policy (OD-PF2 / OPF front-exp residual) |
| Basis | L2 lock policy |

#### `day_trade.surface` (alternate)

Same marks/lock; T+0 IV from **interpolated multi-exp surface** built from L1 generations.

#### `outlook.scenario_surface` (default)

| Output | Method |
|--------|--------|
| Baseline | Multi-exp IV surface from L1 |
| Scenarios | Time roll 1–10 DTE + vol parallel / skew / front–back twists |
| Labels | Must include `scenario` |

#### `outlook.dynamics` (alternate)

Same scenario controls; smile morph via SABR (or light Heston) — still labeled `scenario`.

#### `backtest.chain_replay` (default)

| Output | Method |
|--------|--------|
| Path | Archived ChainGeneration by timestamp |
| Fills | Configurable: mid \| mid±½spread \| delay |
| Requires | `requires_archive=true` → fail if no archive |

#### `backtest.surface_reconstruct` (alternate)

Spot path + parametric surface; **must** label `historical` + quality `reconstructed`.

### 6.4 Engine interface (normative)

```text
PricingEngine.evaluate(input: EngineInput) → EngineOutput

EngineInput = {
  strategy: StrategyIntent,
  package_quote: PackageQuote,     // L2
  epoch: PricingEpoch,             // L1
  what_if?: WhatIf,
  scenario?: OutlookScenario,
  pack: PackDescriptor
}

EngineOutput = {
  marks: { natural, basis, complete },
  curves: {
    mark_spot?: number,            // point P&L now
    model_t0?: { x: number, y: number }[],
    expiration?: { x: number, y: number }[],
    scenario?: { x: number, y: number }[]
  },
  greeks?: { delta, gamma, theta, vega },
  meta: { labels: string[], pack_id, pack_version, iv_sources: ... }
}
```

### 6.5 L3 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L3-1** | Registry resolves default pack per use case. |
| **AT-L3-2** | Alternate selectable without code change to caller. |
| **AT-L3-3** | Day-trade model_t0 changes when only wing IV changes in fixture. |
| **AT-L3-4** | Outlook outputs include label `scenario`. |
| **AT-L3-5** | Backtest default fails loud without archive. |

---

## 7. Layer L4 — Tool API

### 7.1 Resolve (sync snapshot)

```text
POST /api/me/market/pricing/resolve   // or shared client function
{
  "use_case": "day_trade",
  "pack_id": null,                    // null → default
  "strategy": StrategyIntent,
  "what_if": { "time_offset_hours": 0, "vol_offset_pts": 0, "spot_pct": 0 },
  "scenario": null
}
→ PricingResult (EngineOutput + package_quote + epoch)
```

### 7.2 Interest (async)

```text
// Client or server session
interest.acquire(GenerationKey[])
interest.release(GenerationKey[])
```

### 7.3 Lock

```text
lock.natural(strategy_id)
lock.limit(strategy_id, debit_per_share)
unlock(strategy_id)
```

### 7.4 Stream (optional foundation)

Push `pricing_epoch` or `package_quote` updates when underlying generations change — **or** tools re-resolve on chain bus messages. Spec allows either; must document chosen path at implement.

### 7.5 L4 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L4-1** | Headless resolve day_trade without any Options Lab route mounted. |
| **AT-L4-2** | Missing use_case → 422 fail loud. |
| **AT-L4-3** | Unknown pack_id → 422 fail loud. |

---

## 8. Generation archive (backtest dependency)

### 8.1 Optional write path

On each successful generation write (feed or fill):

```text
mb:genarch:{underlier}:{expiration}:w{wings}:{content_hash}
  or durable store: object/DB with (key, as_of, hash, payload)
```

Retention: config `LABS_OPF_ARCHIVE_RETENTION_DAYS` (fail loud if backtest default requested and archive empty).

### 8.2 Read path

`archive.get(key, as_of)` → nearest generation ≤ as_of.

---

## 9. What-if and scenario DTOs

```text
WhatIf = {
  "time_offset_hours": number,
  "vol_offset_pts": number,
  "spot_pct": number
}

OutlookScenario = {
  "horizon_days": number,           // 1..10
  "vol_parallel_pts"?: number,
  "vol_front_pts"?: number,
  "vol_back_pts"?: number,
  "skew_tilt"?: number,
  "label": string
}
```

---

## 10. Explicit non-goals (v0.1)

- Wiring Heatmap / Analyzer / GEX UI  
- Broker order routing  
- Full option trade/quote tick stream  
- 3D risk surface  
- Dealer GEX as pricing input  

---

## 11. Implementation phases (bind to Arch 30 §9)

| Phase | Layers | Exit |
|-------|--------|------|
| F0 | L0 | Dual-key + feed alignment |
| F1 | L1 | Multi-exp store + interest |
| F2 | L2 | Leg/package/lock |
| F3 | L3 partial | day_trade packs |
| F4 | L3 | outlook packs |
| F5 | L3 + archive | backtest packs |
| F6 | L4 | Public resolve + AT green |

---

## 12. Versioning

- Spec: `v0.1` DRAFT → `v1.0` at foundation exit + Coach GO.  
- Packs: semver independent of Spec minor.  
- Breaking L4 DTO → Spec major.

---

## 13. Success criterion (foundation complete)

1. Headless multi-exp dual generation interest works on Market Bus.  
2. Multi-leg PackageQuote with per-leg `iv_source`.  
3. `day_trade` default resolve returns mark + model_t0 + expiration labels.  
4. Lock/unlock changes basis only as specified.  
5. Alternate pack selectable via `pack_id`.  
6. Backtest default fail-loud without archive; pass with archive fixture.  
7. No L5 app required for the above.

**Then** wire applications.
