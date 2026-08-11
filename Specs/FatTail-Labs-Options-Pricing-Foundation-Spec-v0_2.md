# FatTail Labs — Options Pricing Foundation Spec v0.2

**Status:** **DRAFT · ratification-ready** (2026-08-11) · **current revision v0.2.1**  
**Type:** Foundation product + architecture law — **data plane + model packs**  
**Short name:** **OPF** (Options Pricing Foundation)  
**Filename:** `FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md` (underscore convention)  
**Architecture:** [`Architecture/30-options-pricing-foundation.md`](../Architecture/30-options-pricing-foundation.md)  
**Supersedes:** [`FatTail-Labs-Options-Pricing-Foundation-Spec-v0_1.md`](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_1.md) (v0.1 retained as historical; **do not implement against v0.1**)  
**DL:** DL-289  

**Revisions:**  
- **v0.2** — OPF21–33, τ, RECON, calendar arb, archive stale, advisories  
- **v0.2.1** — AM/PM settlement for τ; **1-minute** τ floor + clamp disclosure  

**Content integrity:** Landing content hash (sha1 of body excluding this line): `3b70e4f4253df1dfa9fcaa60b381df67e0ea14e1`.

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Market Bus Spec](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (filename `…v1.0.md`; **content rev v1.0.1**) | Transport · Redis hot store · one WS/tab · feeds |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · **OC2 / OC5a** · OC6a · dual-side heritage — **file present in-repo** |
| [Heatmap Templates Spec v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | **HM18** truncation fail-loud · **HM19** standard contracts · dual-side HM15–17 |
| Arch/28 · Arch/30 | Bus topology · OPF design |
| Claude.md | No MSC · config fail-loud · verify · **0DTE tenor honesty** |

**Scope:** Layers **L0–L4** only. Application wiring (L5) out of OPF exit.

---

## 0. Mission

Provide a **single foundation** so Labs can:

1. Ingest **options chain snapshots** into dual-side, multi-expiration **generations**.  
2. Combine them with **live underlier/session** facts and **rates/dividend facts**.  
3. Price **single- and multi-leg** structures (including **calendars/diagonals**).  
4. Support **lock/unlock** package cost basis for limit settlement.  
5. Run **use-case model packs** with **one default and one alternate** each.  
6. Expose a **stable resolve API** so tools never invent private Massive/IV paths.

**North star:** accurate, honest multi-leg P&amp;L marks and curves — professional standard, **not** MSC as authority.

---

## 1. Layer map (normative)

| Layer | Name | Responsibility |
|-------|------|----------------|
| **L0** | Market facts transport | Snapshot, feeds, Redis **hot**, WS, sym/session, **r (continuous)**, dividends, **τ inputs (clock)** |
| **L1** | Contract generation store | Multi-exp dual gens, interest **+ budget**, assembly budget, epoch skew |
| **L2** | Pricing data plane | Leg/package marks, IV cascade, lock (**incl. freeze_iv / freeze_marks**), strategy intents |
| **L3** | Model pack runtime | Registry, named engines, surface geometry (**incl. calendar arb**), scenarios, replay, golden vectors |
| **L4** | Tool API | `resolve` / interest / lock |
| **L5** | Applications | **Out of OPF exit** |

---

## 2. Global laws (OPF1–OPF33)

| ID | Law |
|----|-----|
| **OPF1** | Apps/packs **must not** call Massive; only L0 feeds or single-flight miss fill. |
| **OPF2** | Live options facts = **chain snapshot generations**, not underlier-only synthetic options. |
| **OPF3** | Live transport = **WebSocket** (+ HTTP hydrate). Not SSE for generations. |
| **OPF4** | Generation keys **dual-side**; no `side` in cache key. |
| **OPF5** | Each leg **must** carry its own `expiration`. |
| **OPF6** | \(D_{\mathrm{nat}} = \sum_i q_i m_i\) per share; dollars = ×100 × packages. |
| **OPF7** | Incomplete legs → `complete=false`; no silent mid/IV invention. |
| **OPF8** | IV cascade records `iv_source` including **`locked`** when freeze_iv snapshot applies. |
| **OPF9** | Lock freezes **package cost basis** \(D^*\); `freeze_iv` / `freeze_marks` governed in §5.7. |
| **OPF10** | Unlocked \(D_{\mathrm{basis}}=D_{\mathrm{nat}}\) when complete; else mark basis undefined. |
| **OPF11** | PricingResult labels: `mark` \| `model_t0` \| `expiration` \| `scenario` \| `historical`. |
| **OPF12** | Tools declare `use_case`; pack from registry. |
| **OPF13** | Exactly one default + one alternate pack per use case (§6). |
| **OPF14** | Day-trade mark = live mids; model_t0 = per-leg IV (default) or surface (alternate). |
| **OPF15** | Outlook never presents scenario as live mark. |
| **OPF16** | Backtest default requires **cold archive** or hist API; else fail loud. |
| **OPF17** | Truncation → hard fail (**HM18** heritage; Heatmap Spec v0_2). |
| **OPF18** | Standard 100-share only (**HM19** heritage; Heatmap Spec v0_2); `excluded_adjusted_count`. |
| **OPF19** | No MSC Redis schemas or runtime imports. |
| **OPF20** | Missing required config (bus/archive/rates/τ policy) → fail loud. |
| **OPF21** | Model T+0 uses Labs **MarketStaticFacts**; **risk_free_rate is continuous**. |
| **OPF22** | American: **CRR binomial** default; BAW only via documented OD. |
| **OPF23** | PackageQuote exposes `max_skew_ms` + per-leg `as_of`; day_trade marks fail loud/degrade on skew. |
| **OPF24** | Surface packs: frozen geometry + butterfly **and calendar** arb; fit fail loud. |
| **OPF25** | OPF may paginate for completeness; Heatmap one-page UI law does not cap OPF completeness. |
| **OPF26** | Tier `vix`: **OC5a** native VIX/VIX1D only — never ETP-as-vol. |
| **OPF27** | Global generation-interest budget; at cap refuse/queue loud. |
| **OPF28** | Cold day-shard archive for backtest; golden vectors if dual engine. |
| **OPF29** | **Time-to-expiry τ** follows §3.7 (calendar year-fraction, 0DTE intraday, VIX1D mapping). |
| **OPF30** | Curve points are **dollars per package-set**, **basis-referenced** P&amp;L (OPF6 multiplier). |
| **OPF31** | `vol_offset_pts` = **absolute implied-vol percentage points** (e.g. +5 → 0.18→0.23). |
| **OPF32** | Contract map keys use **canonical strike strings** (§4.7). |
| **OPF33** | Archive replay: max staleness per step; beyond → **labeled gap**, never silent stale fill. |

---

## 3. Layer L0 — Market facts transport

### 3.1 Inputs

| Source | Role |
|--------|------|
| Massive options snapshot | Generation fill |
| Marks / chain underlying | Spot (**OC2**) |
| Session status | Open/held |
| **MarketStaticFacts** | Continuous \(r\); \(q\) / discrete divs |
| **Clock** | τ computation (§3.7) |

### 3.2 MarketStaticFacts

```text
{
  "as_of": ISO-8601,
  "risk_free_rate": number,        // CONTINUOUS annualized (not "frozen at implement")
  "rate_source": "config_sofr_proxy" | "feed",
  "products": {
    "SPX": {
      "dividend_mode": "none" | "continuous" | "discrete",
      "yield_continuous": number | null,
      "discrete": [ { "ex_date": "YYYY-MM-DD", "amount": number } ]
    }
  }
}
```

**OPF-L0-R1:** model_t0 requires MarketStaticFacts.  
**OPF-L0-R2:** Config SOFR proxy + `dividend_mode=none` for European index OK if labeled.  
**OPF-L0-R3:** American equities require discrete schedule before production-grade label.

### 3.7 Time-to-expiry τ (normative — doctrine for 0DTE)

All model engines use a **single Labs τ function** `τ(expiration, as_of_clock, product_class)`:

| Rule | Law |
|------|-----|
| **Year basis** | **Actual/365.25 calendar** year-fraction (continuous time). Not trading-day count for BS/CRR default. |
| **Expiry instant — PM (default)** | **16:00 America/New_York** on `expiration` date (EDT/EST as calendar dictates). Applies to **PM-settled** products (SPXW weeklies / 0DTE and most Labs day-trade flow). |
| **Expiry instant — AM** | Product table may set `settlement: "am"` → expiry instant is the **opening auction / SOQ** on `expiration` (traditionally ~09:30 ET for classic SPX AM monthlies). **Must not** use 16:00 for AM-settled contracts. |
| **Product table fields** | Per product (or contract class): `settlement: "am" \| "pm"` (default **`pm`**). Equity may override further (OD). |
| **Minimum τ** | `τ ≥ 1/365.25/24/60` (**1 minute**). CRR/BS remain stable well below 1 hour. **Forbidden default:** 1-hour floor that flatlines the final hour of 0DTE. |
| **If a higher floor is ever configured** | Model output **must** set meta `final_hour_clamped: true` (or equivalent) when wall-clock τ would be below the configured floor so the freeze is disclosed — not discovered by members. |
| **0DTE / sub-day** | τ = max(min_τ, seconds_to_expiry_instant / (365.25×86400)). **Intraday 0DTE is first-class** — afternoon fly T+0 is dominated by τ; packs **must not** use “whole day = 1/365”. |
| **VIX1D vs VIX** | When resolving tier `vix` or vol regime: **0–1 calendar DTE** (and 0DTE) prefer **VIX1D** native mid if available and non-proxy; else **VIX**. Mapping is **tenor-aware**, not a single vol for all horizons. |
| **What-if time** | `as_of_clock' = as_of_clock + time_offset`; recompute all leg τ from the same shifted clock. |
| **Multi-exp** | Each leg has **own** \(τ_ℓ = τ(\mathrm{exp}_ℓ, \mathrm{clock}, \mathrm{settlement}_ℓ)\). |

**AT-L0-τ1:** Fixture 0DTE at 15:00 ET → τ in (0, 2/365) and **not** equal to 1/365.  
**AT-L0-τ2:** VIX1D selected for 0DTE fallback path when both VIX and VIX1D present.  
**AT-L0-τ3:** AM-settled product at 10:00 ET on expiry day → τ uses open/SOQ instant, not 16:00.  
**AT-L0-τ4:** 0DTE at 15:30 ET → τ still decreases vs 15:00 (not clamped to a 1-hour floor).

### 3.3–3.5 Writers, Redis hot keys, fan-out

Unchanged dual form (`…:w{N}:dual`); Redis = **hot live window only**.

### 3.6 L0 acceptance

| AT | Criterion |
|----|-----------|
| **AT-L0-1…4** | Dual key, IV in diff, feed dual interest, held retain |
| **AT-L0-5** | MarketStaticFacts required for model_t0 |
| **AT-L0-τ1** | 0DTE intraday τ |
| **AT-L0-τ2** | VIX1D tenor mapping |
| **AT-L0-τ3** | AM settlement SOQ not 16:00 |
| **AT-L0-τ4** | Final hour 0DTE τ still moves (1-min floor) |

---

## 4. Layer L1 — Contract generation store

### 4.1–4.2 GenerationKey / ChainGeneration

As v0.1 plus dual_side, excluded_adjusted_count, as_of, content_hash.

### 4.3 InterestManager + budget

Refcount + **LABS_OPF_MAX_GENERATION_INTERESTS**; at cap **refuse loud** or queue.

### 4.4 Wings / assembly budget

| Context | Law |
|---------|-----|
| Heatmap UI | May keep one-page dual display (HM17 heritage) |
| **OPF generation** | Complete required strikes or fail loud; **paginate** OK with HM18-style no-silent-truncate |

### 4.5 Pricing epoch

```text
{
  "spot": number,
  "generations": { "YYYY-MM-DD": { "content_hash", "as_of" } },
  "max_skew_ms": number,
  "epoch_quality": "ok" | "skewed" | "incomplete"
}
```

Day-trade marks: if `max_skew_ms > LABS_OPF_MAX_SKEW_MS` (**default 3000**), **fail loud** (default) or labeled degrade (config).

### 4.7 Canonical strike strings (OPF32)

For map keys, hashes, and wire:

- Format: **no scientific notation**; trim trailing zeros after decimal but keep significant fractional strikes (`302.5` not `302.50` unless needed for exact binary; implement **decimal normalization**: round-trip via decimal text of strike with max 4 dp, strip trailing zeros, strip trailing `.`).  
- Key: `{side}:{canonical_strike}` e.g. `call:302.5`, `put:7750`.  
- Same string in content_hash core and client maps.  
- **AT-L1-STRIKE:** 302.50 and 302.5 normalize to one key.

### 4.8 L1 acceptance

AT-L1-1…6 as v0.1 fold + **AT-L1-STRIKE**.

---

## 5. Layer L2 — Pricing data plane

### 5.1–5.2 LegIntent / StrategyIntent

Leg-level expiration; structures include calendar | diagonal | custom.

### 5.3 LockState

```text
{ "mode": "unlocked" }

{
  "mode": "locked",
  "locked_at": ISO-8601,
  "package_debit_per_share": number,
  "lock_source": "natural_mid" | "user_limit" | "tos_limit",
  "generation_hashes_at_lock": { "YYYY-MM-DD": "hash" },
  "freeze_iv": boolean,
  "leg_iv_snapshot"?: { [leg_id]: number },
  "freeze_marks": boolean,
  "leg_mark_snapshot"?: LegMark[]
}
```

### 5.4 LegMark

`iv_source` enum **includes `locked`** (when freeze_iv and snapshot used).  
`as_of`, generation_hash, quality as before.

### 5.5 PackageQuote

Includes `max_skew_ms`, `epoch_quality`, `generations_used`, basis fields.

### 5.6 IV cascade

1 exact · 2 nearest · 3 closest_dte · 4 stored · 5 atm_exp · 6 vix (**OC5a**).  
If `lock.freeze_iv` and snapshot present → force `iv_source=locked` from snapshot (does not re-cascade).

### 5.7 Lock rules (complete)

| Action | Rule |
|--------|------|
| Lock natural | complete + epoch ok; \(D^*=D_{\mathrm{nat}}\); optionally snapshot marks/IV if flags set at lock API |
| Lock limit | Always; \(D^*=\) limit |
| Unlock | Clear \(D^*\), clear freeze snapshots unless retained for audit |
| Edit limit while locked | Updates \(D^*\) only |
| **`freeze_iv=true` at lock** | Copy current resolved IVs into `leg_iv_snapshot`; subsequent LegPricer uses snapshot + `iv_source=locked` until unlock |
| **`freeze_marks=true` at lock** | Copy LegMarks into `leg_mark_snapshot`; natural mid path uses snapshot for display “locked marks”; live mids still available as secondary “mkt” if computed |
| Default lock API | `freeze_iv=false`, `freeze_marks=false` (basis-only) |

### 5.8 L2 acceptance

Prior ATs + freeze_iv/freeze_marks behavior ATs.

---

## 6. Layer L3 — Model packs

### 6.1–6.2 Registry and pack ids

Unchanged defaults/alternates (day_trade / outlook / backtest).

### 6.3 Named engines

`bsm_european` · `crr_american` · `baw_american` · `surface_tv_logk` · `sabr_slice` · `mark_sum` · `replay_archive` · `surface_reconstruct`

All model engines take **τ from §3.7** and **r continuous, q/divs from MarketStaticFacts**.

### 6.4 Pack semantics

As v0.1 fold; day_trade hybrid uses named engines + per-leg IV + τ law.

### 6.5 Surface geometry law (normative)

1. Strike: total variance \(w=\sigma^2 T\) vs log-moneyness \(k=\ln(K/F)\).  
2. **Butterfly arb:** discrete convexity / density guards; fail fit if violated after repair attempts.  
3. Expiry: interpolate \(w\) **linear in calendar \(T\)** at fixed \(k\).  
4. **Calendar arb:** at fixed \(k\), **\(w(k,T)\) must be non-decreasing in \(T\)** on the fitted surface; if input slices violate, **fail fit** (do not bake decreasing total variance).  
5. Fit failure: no surface output; fail loud or allowed pack fallback — never silent bad surface.  
6. SABR: RMSE gate → labeled fallback to scenario_surface.

### 6.6 Curve units (OPF30)

```text
curves.*.points[] = { "x": underlier_price, "y": pnl_dollars_per_package_set }
```

- \(y\) = basis-referenced P&amp;L in **USD for `packages` sets** (default 1), multiplier 100.  
- \(y = (V(S) - D_{\mathrm{basis}}) \times 100 \times packages\) for model/expiration as defined per pack.  
- Never raw per-share or unbasis’d value without label.

### 6.7 What-if / scenario units (OPF31)

```text
WhatIf.vol_offset_pts: number   // absolute IV points; +5 means +0.05 absolute vol
WhatIf.time_offset_hours: number
WhatIf.spot_pct: number         // percent of spot, +1 = +1%
OutlookScenario.vol_*_pts: same absolute IV point units
```

### 6.8 Golden vectors

If dual language: CI golden fixtures. Prefer single server engine.

### 6.9 t=0 reconciliation AT (highest value)

| AT | Criterion |
|----|-----------|
| **AT-L3-RECON** | Given complete package, tier-1 (`exact`) IVs on all legs, MarketStaticFacts, τ(§3.7): **model_t0 at current spot** reconciles to **natural mark dollars** within **`LABS_OPF_T0_RECON_TOL_ABS`** (default **$1.00** per package) **or** **`LABS_OPF_T0_RECON_TOL_REL`** (default **1%** of \|mark\|), whichever is larger. Fail = investigate r, q, engine, τ, IV units. |

This AT catches the full stack of professional “does theo match the mid at ATM?” checks.

### 6.10 L3 acceptance

AT-L3-1…8 from prior fold + **AT-L3-RECON** + calendar-arb fail-fit fixture + vol_offset_pts unit fixture.

---

## 7. Layer L4 — Tool API

Resolve / interest / lock as before; PricingResult includes `tau_by_leg`, `rate_source`, `engine_id`, `max_skew_ms`, curve unit meta `pnl_unit: "usd_per_package_set"`.

---

## 8. Generation archive (backtest)

| Store | Role |
|-------|------|
| Redis | Hot live window only |
| **Cold archive** | Day-sharded disk/object/parquet |

```text
archive.get(key, as_of) → generation | null
```

**OPF33 — staleness:**  
`LABS_OPF_ARCHIVE_MAX_STALE_MS` (config; e.g. session or 15 minutes for intraday replay).  
If nearest generation `as_of` is older than `as_of_query − max_stale` → return **labeled gap** (`gap: true`, no silent fill). EOD research modes may set a larger bound explicitly.

---

## 9. Non-goals (v0.2)

L5 app wiring · broker routing · full option tick stream · 3D · dealer GEX as pricing input.

---

## 10. Implementation phases

F0 L0 dual-key · F1 L1 multi-exp+budget+skew · F2 L2+MarketStaticFacts+τ · F3 day_trade packs+RECON · F4 outlook+surface calendar-arb · F5 cold archive+stale bound · F6 L4+AT green.

---

## 11. Versioning

- **This document is v0.2.** Material law changes require **v0.3+** and new underscore filename if major.  
- Do not leave “v0.1” in the header after material folds.  
- Packs: independent semver.

---

## 12. Success criterion (foundation complete)

1. Headless multi-exp dual interest within budget.  
2. PackageQuote with iv_source (incl. locked), as_of, max_skew_ms.  
3. day_trade resolve: mark + model_t0 + expiration; continuous r; τ law; **AT-L3-RECON** green.  
4. Lock/unlock + freeze_iv/freeze_marks as §5.7.  
5. Alternate pack via pack_id.  
6. Surface fit fails on butterfly **or** calendar arb.  
7. Backtest cold archive + **stale gap** behavior.  
8. Golden vectors if dual engine.  
9. No L5 required.

---

## 13. Review fold log

### 13.1 Design-doc chat findings H1–H8 (prior)

Mapped in v0.1 fold → OPF21–28; retained and refined in v0.2.

### 13.2 Crossed-artifact remainder (this revision)

| ID | Finding | Landing |
|----|---------|---------|
| R1 | τ missing; rate “at implement” | OPF29 · §3.7 · continuous r in §3.2 |
| R2 | t=0 recon AT | **AT-L3-RECON** · §6.9 |
| R3 | Archive unbounded lookback | OPF33 · §8 max-stale |
| R4 | Calendar arb on w(k,T) | §6.5 item 4 |
| R5a | iv_source missing locked in OPF8 | OPF8 + §5.4/5.6 |
| R5b | freeze_iv/marks lock table | §5.7 |
| R5c | Curve units | OPF30 · §6.6 |
| R5d | vol_offset_pts units | OPF31 · §6.7 |
| R5e | Strike string format | OPF32 · §4.7 |
| R6 | Version bump | **This file v0.2** |
| R7 | HM18/HM19 heritage | Parent Heatmap Spec v0_2; OPF17–18 cite it |
| R8 | AM settlement τ | §3.7 `settlement: am\|pm` (v0.2.1) |
| R9 | 1h τ floor kills last hour | §3.7 **1-minute** floor + clamp disclosure (v0.2.1) |

---

## 14. Parent evidence (verified in-repo 2026-08-11)

| Claim | Evidence |
|-------|----------|
| Picker v1.0.2 exists | `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` — **RATIFIED** header; filename uses **dots** (`v1.0.2`); OPF prefers underscores for new files |
| **OC6a** | Picker Spec v1.0.2 line ~87: *Strike cells show the **listed** contract strike **cent-exact** (e.g. AAPL **302.50**). … rounds half-strikes … **forbidden**.* |
| **HM18 / HM19** | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` — HM18 next_url hard error; HM19 standard contracts only + `excluded_adjusted_count` |
