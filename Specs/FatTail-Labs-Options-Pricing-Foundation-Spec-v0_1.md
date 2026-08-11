# FatTail Labs — Options Pricing Foundation Spec v0.1

**Status:** **SUPERSEDED** by [`FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md)  
**Do not implement against this file.** Retained for fold history only.

**Type:** Foundation product + architecture law — **data plane + model packs**  
**Short name:** **OPF** (Options Pricing Foundation)  
**Architecture:** [`Architecture/30-options-pricing-foundation.md`](../Architecture/30-options-pricing-foundation.md)  

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Market Bus Spec](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (filename `v1.0`; **content rev v1.0.1**) | Transport · Redis hot store · one WS/tab · feeds |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · **OC2 / OC5a** proxy-safe spot & vol · OC6a strikes · dual-side heritage |
| Arch/28 | As-built bus topology |
| Claude.md | No MSC · config fail-loud · verify |

**Scope:** Layers **L0–L4** only. Application wiring (L5) is **out of scope** for OPF v0.1 exit.

**Citation hygiene:** Prefer path + content revision. Picker Spec **v1.0.2 file exists** in-repo; do not treat as missing seed.

---

## 0. Mission

Provide a **single foundation** so Labs can:

1. Ingest **options chain snapshots** into dual-side, multi-expiration **generations**.  
2. Combine them with **live underlier/session** facts and **rates/dividend facts**.  
3. Price **single- and multi-leg** structures (including **calendars/diagonals**).  
4. Support **lock/unlock** package cost basis for limit settlement.  
5. Run **use-case model packs** (day trade · outlook · backtest) with **one default and one alternate** each.  
6. Expose a **stable resolve API** so future tools never invent private Massive/IV paths.

**North star:** accurate, honest real-time (and research) multi-leg P&amp;L marks and curves — professional standard, **not** MSC as authority.

---

## 1. Layer map (normative)

| Layer | Name | Responsibility |
|-------|------|----------------|
| **L0** | Market facts transport | Snapshot fill, feeds, Redis **hot** store, WS, sym/session, **r/q facts** |
| **L1** | Contract generation store | Multi-exp dual generations, interest **+ budget**, hash, quality, **assembly budget** |
| **L2** | Pricing data plane | Leg marks, package quote, IV cascade, lock, **epoch skew**, strategy intents |
| **L3** | Model pack runtime | Registry, **named engines**, surface geometry, scenarios, replay, **golden vectors** |
| **L4** | Tool API | `resolve` / interest / lock for apps |
| **L5** | Applications | **Out of OPF v0.1** — wire after foundation exit |

---

## 2. Global laws (OPF1–OPF28)

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
| **OPF16** | Backtest default requires **cold generation archive** (or hist API); else fail loud. |
| **OPF17** | Truncated snapshot (`next_url` past budget) → hard fail for that generation (HM18 heritage). |
| **OPF18** | Standard 100-share contracts only in generations (HM19 heritage); count exclusions. |
| **OPF19** | No MSC Redis schemas or MSC runtime imports. |
| **OPF20** | Config missing for bus/archive/rates when required → fail loud at resolve time. |
| **OPF21** | Model T+0 **must** use Labs **MarketStaticFacts** \(r,q\) — not silent zero rates. |
| **OPF22** | American underlyings use a **named** engine: **CRR binomial** (default) or **BAW** only if OD documents the swap. |
| **OPF23** | Multi-exp PackageQuote **must** expose `max_skew_ms` and per-leg `as_of`; day_trade marks **fail loud** or **degrade labeled** when skew exceeds config threshold. |
| **OPF24** | Surface packs use frozen geometry (§6.6); fit failure **fails loud** (optional fallback to default pack only if caller allows). |
| **OPF25** | OPF generation assembly may **paginate** for completeness; Heatmap one-page UI law does **not** cap OPF pricing completeness. |
| **OPF26** | VIX/VIX1D tier inherits **OC5a**: native index marks only — never ETP price-as-vol. |
| **OPF27** | Global **generation-interest budget**; at cap **refuse loud** or queue (config) — never silent drop. |
| **OPF28** | Cold archive for backtest is **day-sharded durable storage**, not months of Redis keys. Dual-language engines require **golden-vector CI**. |

---

## 3. Layer L0 — Market facts transport

### 3.1 Inputs

| Source | Role |
|--------|------|
| Massive `GET /v3/snapshot/options/{underlying}` | Options generation fill |
| Massive / marks path for underliers | Spot (**OC2** proxy-safe) |
| Massive marketstatus (or bus session doc) | Session open/held |
| **MarketStaticFacts** | Risk-free rate; continuous \(q\) and/or **discrete dividends** per product |

### 3.2 MarketStaticFacts (normative)

```text
{
  "as_of": ISO-8601,
  "risk_free_rate": number,              // Labs convention frozen at implement (e.g. continuous)
  "rate_source": "config_sofr_proxy" | "feed",
  "products": {
    "SPX": { "dividend_mode": "none" | "continuous" | "discrete",
             "yield_continuous": number | null,
             "discrete": [ { "ex_date": "YYYY-MM-DD", "amount": number } ] },
    "AAPL": { ... }
  }
}
```

**OPF-L0-R1:** Day-trade **model_t0** requires MarketStaticFacts present.  
**OPF-L0-R2:** Bootstrap: config SOFR proxy + `dividend_mode=none` for pure European index is lawful if labeled.  
**OPF-L0-R3:** Equity early-exercise underlyings require discrete schedule (config-seeded OK for v0.1) before production-grade label.

### 3.3 Writers

| Process | Writes |
|---------|--------|
| `chain_feed` | `mb:ladder:*:dual` generations for interest topics |
| `sym_feed` | `mb:sym:*`, `mb:session:market_status` |
| API single-flight on miss | Same ladder keys when feed cold |
| (config / future rates feed) | MarketStaticFacts |

### 3.4 Redis keys (hot / live window only)

```text
mb:ladder:{chain_underlier}:{expiration}:w{wings}:dual
mb:sym:{PRODUCT}
mb:session:market_status
mb:interest:{topic}
mb:pub
```

**OPF-L0-1:** `chain_feed` and interest **must** parse dual keys (no required `side` segment).  
**OPF-L0-2:** Legacy single-side keys are deprecated; dual is SoR.  
**OPF-L0-3:** Redis **must not** be the multi-month backtest archive medium (see §8).

### 3.5 Fan-out

| Channel | Role |
|---------|------|
| WS `/api/me/market/stream` | Push generation full \| diff \| unchanged; session; sym |
| HTTP generation hydrate | Fallback / cold start |

### 3.6 L0 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L0-1** | Dual key written/read with call+put rows. |
| **AT-L0-2** | Diff upsert includes `iv` changes. |
| **AT-L0-3** | Feed warms dual interest topics. |
| **AT-L0-4** | Held session retains last generation. |
| **AT-L0-5** | MarketStaticFacts readable at resolve; missing → fail loud for model_t0. |

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
  "contracts": { "call:7750": { side, strike, expiration, bid, ask, mid, last, iv, delta, gamma, theta, vega, open_interest, volume, ticker }, ... }
}
```

### 4.3 InterestManager + budget

- Refcount `GenerationKey` by foundation consumers.  
- Multi-exp strategy → N interests.  
- GC when refcount 0 after grace.  
- **Global generation-interest budget** `LABS_OPF_MAX_GENERATION_INTERESTS` (config).  
- **At cap:** refuse new acquire **loud** or queue (config); **never** silent drop of a required exp.

### 4.4 Wings policy and assembly budget

| Context | Law |
|---------|-----|
| **Heatmap UI** | May retain one-page dual-side display budget (HM17 heritage ≤250 contracts). |
| **OPF generation** | **Complete required strikes or fail loud.** May paginate Massive with `allow_truncate=false` semantics across pages. |
| **Strike-union** | Every strategy leg strike must be present in its exp’s OPF generation; else `incomplete_reason=strike_out_of_band`. |

Shared wings default; expand for union safety within Massive practical limits; if impossible under budget → incomplete + loud.

### 4.5 Pricing epoch

```text
{
  "spot": number,
  "generations": { "YYYY-MM-DD": { "content_hash": string, "as_of": ISO-8601 } },
  "max_skew_ms": number,
  "epoch_quality": "ok" | "skewed" | "incomplete"
}
```

`max_skew_ms = max|as_of_i − as_of_j|` over generations used in a package.  
Strict simultaneity may wait; **visibility is mandatory**.

**Day-trade marks:** if `max_skew_ms > LABS_OPF_MAX_SKEW_MS` (default **3000**), either:

- **fail loud** (`complete=false`, reason `epoch_skew`), or  
- **degrade labeled** (`epoch_quality=skewed`, mark labeled degraded)  

Default for production day_trade: **fail loud** (OD-PF8).

### 4.6 L1 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L1-1** | Two exps subscribed; both ready independently. |
| **AT-L1-2** | Diff on exp B does not drop exp A. |
| **AT-L1-3** | Unsubscribe GC works. |
| **AT-L1-4** | Interest at cap refuses loud. |
| **AT-L1-5** | Wide multi-leg: OPF assembles complete band or incomplete — never silent clamp of a leg. |
| **AT-L1-6** | Package epoch reports max_skew_ms correctly in fixture. |

---

## 5. Layer L2 — Pricing data plane

### 5.1–5.3 LegIntent, StrategyIntent, LockState

As Arch 30 §5.5–5.7 (leg-level expiration; lock modes natural_mid | user_limit | tos_limit; freeze_iv optional).

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
  "generation_hash": string | null,
  "as_of": ISO-8601 | null
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
  "basis_debit_per_share": number | null,
  "basis_mode": "unlocked_natural" | "locked",
  "legs": LegMark[],
  "generations_used": { "YYYY-MM-DD": "content_hash" },
  "max_skew_ms": number,
  "epoch_quality": "ok" | "skewed" | "incomplete"
}
```

### 5.6 IV cascade (normative order)

1. `exact`  
2. `nearest` (same exp)  
3. `closest_dte` (subscribed gens only)  
4. `stored`  
5. `atm_exp`  
6. `vix` — **OC5a:** only VIX/VIX1D **native index** mids (non-proxy source). **Forbidden:** ETP (VIXY etc.) price-as-vol.

Band: reject IV ≤ 0.01 or ≥ 5.0 unless config overrides.

### 5.7 Lock rules

| Action | Rule |
|--------|------|
| Lock natural | Requires complete + epoch ok for day_trade policy; \(D^*=D_{\mathrm{nat}}\) |
| Lock limit | Always allowed |
| Unlock | Resume natural when complete |
| Edit limit while locked | Updates \(D^*\) only |

### 5.8 L2 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L2-1** | Fly natural = \(\sum q_i m_i\). |
| **AT-L2-2** | Calendar mids from two generations. |
| **AT-L2-3** | Missing mid → incomplete. |
| **AT-L2-4** | Lock then mid move → basis fixed. |
| **AT-L2-5** | exact IV when present. |
| **AT-L2-6** | Cross-exp IV not labeled exact. |
| **AT-L2-7** | VIXY-as-vol rejected for tier vix. |
| **AT-L2-8** | Skew above threshold → day_trade mark fail or labeled degrade per config. |

---

## 6. Layer L3 — Model packs

### 6.1 Registry

UseCase = `day_trade` | `outlook` | `backtest`  
Each: `default_pack_id`, `alternate_pack_id`, versioned `PackDescriptor`.

### 6.2 Normative pack ids

| Use case | Default | Alternate |
|----------|---------|-----------|
| `day_trade` | `day_trade.mark_hybrid` | `day_trade.surface` |
| `outlook` | `outlook.scenario_surface` | `outlook.dynamics` |
| `backtest` | `backtest.chain_replay` | `backtest.surface_reconstruct` |

### 6.3 Named engines

| Engine id | Use |
|-----------|-----|
| `bsm_european` | European index vanillas |
| `crr_american` | American equity with discrete dividends (default American) |
| `baw_american` | Only if OD replaces CRR |
| `surface_tv_logk` | Total-variance / log-moneyness surface (§6.6) |
| `sabr_slice` | Outlook dynamics alternate |
| `mark_sum` | Package natural mid only |
| `replay_archive` | Backtest chain replay |
| `surface_reconstruct` | Backtest weak tier |

### 6.4 Pack semantics (summary)

#### `day_trade.mark_hybrid`

- Mark: L2 package natural  
- Model T+0: `bsm_european` or `crr_american` per product class + **per-leg IV** + Labs \(r,q\)  
- Sticky on spot axis: OD-PF3  
- Expiration: front-exp residual (OD-PF2)  
- Labels: `mark`, `model_t0`, `expiration`

#### `day_trade.surface`

- Same mark/lock; T+0 from **§6.6 surface** → BS/CRR per leg  
- Fit fail → fail loud (or fallback to mark_hybrid if `allow_pack_fallback`)

#### `outlook.scenario_surface`

- Surface baseline + time roll + vol scenarios  
- Labels **must** include `scenario`

#### `outlook.dynamics`

- SABR (or light Heston) morph; **calibration cadence** config; **RMSE gate** → fallback to scenario_surface labeled

#### `backtest.chain_replay`

- Cold archive + fill model; `requires_archive=true`

#### `backtest.surface_reconstruct`

- Labeled `historical` + quality `reconstructed`

### 6.5 Surface geometry law (normative — H3)

For any surface builder used by surface packs:

1. **Strike:** interpolate **total variance** \(w=\sigma^2 T\) in **log-moneyness** \(k=\ln(K/F)\) (forward \(F\) from Labs \(r,q\) and spot).  
2. **Butterfly arb:** enforce discrete non-arbitrage constraints on call-price convexity / density; if violated after smoothing, **fail fit**.  
3. **Expiry:** interpolate \(w\) **linear in calendar time \(T\)** at fixed \(k\).  
4. **Fit failure:** no output surface; resolve error or allowed fallback to default pack — **never** silent bad surface.  
5. **SABR:** per-slice fit; if RMSE > `LABS_OPF_SABR_RMSE_MAX`, gate fails → labeled fallback.

### 6.6 Golden vectors (OPF28)

If client and server both implement engine math:

- Repository holds golden fixtures `(EngineInput → EngineOutput)`.  
- CI runs both implementations.  
- Drift = **CI fail**.

Prefer single server engine when dual cost is high.

### 6.7 L3 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L3-1** | Registry default per use case. |
| **AT-L3-2** | Alternate selectable. |
| **AT-L3-3** | model_t0 moves when wing IV moves (fixture). |
| **AT-L3-4** | Outlook labeled scenario. |
| **AT-L3-5** | Backtest default fail without cold archive. |
| **AT-L3-6** | Surface fit fail does not emit model_t0. |
| **AT-L3-7** | CRR/BSM uses MarketStaticFacts r/q in fixture (not implicit 0). |
| **AT-L3-8** | Golden vectors pass if dual engine present. |

---

## 7. Layer L4 — Tool API

### 7.1 Resolve

```text
POST /api/me/market/pricing/resolve
{
  "use_case": "day_trade",
  "pack_id": null,
  "allow_pack_fallback": false,
  "strategy": StrategyIntent,
  "what_if": { "time_offset_hours": 0, "vol_offset_pts": 0, "spot_pct": 0 },
  "scenario": null
}
→ PricingResult
```

PricingResult includes PackageQuote, epoch, curves, greeks, labels, `rate_source`, `engine_id`, `max_skew_ms`.

### 7.2 Interest / lock

As Arch 30: acquire/release GenerationKeys; lock.natural / lock.limit / unlock.

### 7.3 L4 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L4-1** | Headless resolve without Options Lab UI. |
| **AT-L4-2** | Missing use_case → 422. |
| **AT-L4-3** | Unknown pack_id → 422. |

---

## 8. Generation archive (backtest)

| Store | Role |
|-------|------|
| Redis | **Hot live window only** |
| **Cold archive** | Day-sharded **disk / object / parquet**, append-only, resumable (VP artifact pattern) |

Config: `LABS_OPF_ARCHIVE_RETENTION_DAYS`, `LABS_OPF_ARCHIVE_URI` (or path).  
`backtest.chain_replay` reads cold archive via `archive.get(key, as_of)`.

---

## 9. What-if / scenario DTOs

Unchanged in spirit: WhatIf offsets; OutlookScenario horizon_days + vol_parallel/front/back/skew + label.

---

## 10. Non-goals (v0.1)

- Wiring Heatmap / Analyzer / GEX UI  
- Broker routing  
- Full option tick stream  
- 3D risk  
- Dealer GEX as pricing input  

---

## 11. Implementation phases

| Phase | Layers | Exit |
|-------|--------|------|
| F0 | L0 | Dual-key + feed alignment |
| F1 | L1 | Multi-exp + interest budget + epoch skew |
| F2 | L2 | Leg/package/lock + MarketStaticFacts |
| F3 | L3 | day_trade packs + named engines + surface law |
| F4 | L3 | outlook packs + SABR gate |
| F5 | L3 + §8 | cold archive + backtest packs |
| F6 | L4 | resolve API + AT + golden vectors if needed |

---

## 12. Versioning

- Spec `v0.1` DRAFT → `v1.0` at foundation exit + Coach GO.  
- Packs: independent semver.  
- Breaking L4 → Spec major.

---

## 13. Success criterion (foundation complete)

1. Headless multi-exp dual interest within budget.  
2. PackageQuote with iv_source, as_of, max_skew_ms.  
3. day_trade resolve: mark + model_t0 + expiration; Labs r/q; named engine.  
4. Lock/unlock basis law.  
5. Alternate pack via pack_id.  
6. Surface fit fail loud.  
7. Backtest cold archive or fail loud.  
8. Golden vectors if dual engine.  
9. **No L5 app required.**

---

## 14. Review fold (2026-08-11 H1–H8)

| ID | Finding | Spec location |
|----|---------|----------------|
| H1 | Rates/divs + named American | OPF21–22 · §3.2 · §6.3 |
| H2 | Epoch skew visibility | OPF23 · §4.5 · §5.5 · AT-L1-6 / L2-8 |
| H3 | Surface geometry frozen | OPF24 · §6.5 |
| H4 | HM17 vs strike-union | OPF25 · §4.4 |
| H5 | Client mirror parity | OPF28 · §6.6 |
| H6 | Cold archive not Redis months | OPF28 · §8 |
| H7 | OC5a on VIX tier | OPF26 · §5.6 tier 6 |
| H8 | Interest budget | OPF27 · §4.3 · AT-L1-4 |
