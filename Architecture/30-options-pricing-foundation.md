# Options Pricing Foundation — Design Architecture

**Status:** **DESIGN** (2026-08-11) — foundation-first; **not** bound to current Options Lab apps  
**Type:** Design architecture — shared **data plane + model packs** for accurate real-time and research P&amp;L  
**Product law:** [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_1.md)  
**Parents:** [Arch/28 Market Bus](./28-massive-market-bus.md) · [Market Bus Spec](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (content **v1.0.1**) · [Chain Picker Spec v1.0.2](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md)  

**Not:** MSC as standard · per-app Massive clients · SSE as market transport · “pretty curves” without marks/IV truth  

**Review fold (2026-08-11):** external design review H1–H8 metabolized below and in Spec v0.1 (rates/divs, epoch skew visibility, surface geometry, generation budget vs HM17, golden vectors, cold archive, OC5a on VIX tier, interest cap).

---

## 0. Mission

Build a **Labs-owned Options Pricing Foundation** so that:

1. **One data plane** supplies multi-expiration, dual-side option chain generations, underlier marks, **rates/dividends**, session, and quality metadata.  
2. **One pricing plane** turns structure intents into per-leg marks, per-leg IV, package quotes, and lockable cost basis.  
3. **Model packs** (default + alternate per use case) consume that plane only — never invent ad-hoc Massive or IV logic.  
4. **All current and future tools** (Heatmap, Analyzer, GEX, bots, backtest) wire in later by **declaring a use case** and optionally a pack id.  
5. **North star:** the most accurate, honest real-time multi-leg (incl. multi-exp) P&amp;L curves and marks that options professionals would defend — **not** MSC feature parity.

**What this is not:** a UI Spec for Heatmap/Analyzer chrome; a brokerage order router; a guarantee of fill at mid.

**Scope note:** The foundation **extends the Market Bus server domain** (interest, dual keys, multi-exp, optional archive writers). It is in scope of a clean server market-domain build; it does **not** require rewriting Heatmap/Analyzer in the same program.

---

## 1. Intent law (non-negotiable)

| Law | Meaning |
|-----|---------|
| **MSC is not the standard** | Optional reference for UI/engine ideas only. Accuracy and professional practice bind. |
| **Data plane ≠ model** | Snapshot/stream facts vs pricing engines are separate layers. |
| **Use-case packs** | Day trade · Outlook · Backtest each have **one default** and **one alternate** pack. |
| **Tools declare use case** | No silent BS/IV paths inside feature modules. |
| **Fail loud** | Incomplete legs, truncated chains, missing IV for “exact” tier, surface fit fail — no silent ATM/VIX theater labeled as mark. |
| **No MSC code/runtime** | Labs-owned types and Redis keys; no MarketSwarm schemas. |
| **Apps are consumers** | Foundation ships without rewiring existing apps; wiring is a later program. |
| **r/q are first-class** | Model T+0 must use explicit risk-free and dividend/borrow inputs so engine marks can be reconciled at \(t=0\). |
| **Incoherence is visible** | Multi-exp generation skew is measured and labeled (or fail-loud for day-trade marks). |
| **Surface geometry is frozen** | Interpolation / arb guards named in Spec — not left to implementers. |

---

## 2. Use cases and model packs

| Use case ID | Question | **Default pack** | **Alternate pack** |
|-------------|----------|------------------|--------------------|
| `day_trade` | If I execute **right now**? | `day_trade.mark_hybrid` — package **mark** + T+0 **named engine** (European BS index / **CRR binomial** American equity with discrete divs) + **per-leg chain IV** (+ sticky on spot slide) + separate expiration curve | `day_trade.surface` — same marks/lock; T+0 from **frozen surface geometry** (Spec § surface law) |
| `outlook` | 1–10 DTE planning + vol change? | `outlook.scenario_surface` — multi-exp surface + **time roll** + **explicit vol scenarios** | `outlook.dynamics` — same scenarios; **SABR** smile morph with fit-quality gate |
| `backtest` | Did / will the process work? | `backtest.chain_replay` — **cold day-sharded archive** + fill model + costs | `backtest.surface_reconstruct` — spot path + parametric surface (weaker; labeled) |

Packs are **versioned** (`pack_id@semver`). Tools pin or accept registry default.

---

## 3. Layered system (foundation stack)

```text
L0  MARKET FACTS TRANSPORT
    Massive options chain SNAPSHOT → feeds → Redis mb:* → WS push / HTTP hydrate
    + sym/session marks stream
    + rates / dividend schedule facts (config → later feed)
         │
L1  CONTRACT GENERATION STORE
    Multi-exp dual-side generations · interest · content_hash · quality
    · interest budget · generation assembly budget (≠ Heatmap one-page UI law)
         │
L2  PRICING DATA PLANE
    LegPricer · PackagePricer · LockController · StrategyBook (intents)
    · epoch skew measurement
         │
L3  MODEL PACK RUNTIME
    Registry · engines (mark, BS/CRR, surface, scenario, SABR, replay)
    · golden vectors for any dual implementation
         │
L4  TOOL API (stable contract)
    resolve(useCase, pack?, book, market) → Marks + Curves + Meta
         │
L5  APPLICATIONS (later)
    Heatmap · Analyzer · GEX · bots · research — wire only after L0–L4 exit
```

**L0–L1** extend and harden Market Bus.  
**L2–L4** are **new** foundation modules — **server is SoR** for multi-worker.  
**L5** is explicitly out of foundation MVP exit.

---

## 4. Topology (target)

```text
                    ┌─ Massive REST ─────────────────────────┐
                    │  GET /v3/snapshot/options/{ul}           │
                    │  (per expiration · dual-side · wing band)│
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │  labs-chain-feed  (sole options writer)   │
                    │  labs-sym-feed    (spot / session writer) │
                    └──────────────────┬──────────────────────┘
                                       │ SET + interest TTL
                    ┌──────────────────▼──────────────────────┐
                    │  Redis (HOT / live window only)           │
                    │    mb:ladder:…:dual · mb:sym:*           │
                    │    mb:session:* · mb:interest:* · mb:pub │
                    │  Cold archive (disk / object / parquet)   │
                    │    day-sharded generations for backtest   │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │  labs-api                                  │
                    │  · WS /api/me/market/stream (push)         │
                    │  · HTTP generation hydrate                 │
                    │  · Pricing plane services (L2–L4) SoR      │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │  Shared client bindings (L4 consumer)      │
                    │  interest + resolvePricing() — apps later  │
                    │  Optional offline what-if only if golden   │
                    │  vectors pass parity CI (OD-PF6)           │
                    └────────────────────────────────────────────┘
```

**Transport law:** one WebSocket per tab for market facts (Market Bus Spec).  
**Not SSE** for chain generations.  
**Redis** = live window only. **Backtest archive** = cold day-sharded storage (not months of Redis keys).

---

## 5. Domain model (foundation-owned)

### 5.1 GenerationKey

```text
GenerationKey = {
  product: string,           // Admin universe symbol, e.g. SPX
  chain_underlier: string,   // Massive path, e.g. I:SPX
  expiration: YYYY-MM-DD,
  wings: int,                // dual-side wing count (clamped per foundation budget)
}
```

Redis topic (normative dual form):

```text
mb:ladder:{chain_underlier}:{expiration}:w{wings}:dual
```

No `side` in key. Side is a view filter only.

### 5.2 ChainGeneration

Full dual-side contract map for one key: mid/bid/ask, iv, greeks, OI, content_hash, as_of, spot, strike_step, **excluded_adjusted_count**, dual_side=true.

### 5.3 MarketStaticFacts (rates / dividends) — **required for model T+0**

Vendor chain IV embeds the vendor’s \(r,q\) assumptions. Labs engines that reprice T+0 **must** use explicit Labs \(r,q\) so reconciliation at \(t=0\) is possible.

```text
MarketStaticFacts = {
  as_of: ISO-8601,
  risk_free_rate: number,          // continuous or simple — frozen in Spec
  rate_source: "config_sofr_proxy" | "feed" | ...,
  underlier_dividends: {           // per product
    [product]: {
      yield_continuous?: number,   // simple q for European index if used
      discrete: { ex_date, amount }[]   // equities; empty for SPX-style
    }
  },
  borrow?: number                  // optional stock loan
}
```

**Bootstrap:** config SOFR (or policy rate) proxy + empty discrete divs for pure indices is lawful for v0.1 **if labeled**. Equity underliers **require** a discrete dividend schedule (even if initially config-seeded) before day_trade model curves are labeled production-grade for those names.

### 5.4 Named model engines (no hand-wave)

| Underlier class | T+0 engine (normative names) |
|-----------------|------------------------------|
| European index (SPX/SPXW-style) | **Black–Scholes–Merton** with Labs \(r,q\) |
| American equity / early exercise | **CRR binomial** (preferred) or **BAW** — pick one at implement and freeze; discrete dividends per §5.3 |

“BS/American” in pack tables means **these named engines**, not an undefined switch.

### 5.5 LegIntent / StrategyIntent

Structure definition independent of live prices.  
**Each leg carries its own `expiration`** (calendars / diagonals).

### 5.6 LegMark / PackageQuote

Resolved marks + IV source tier + quality.  
Package natural debit \(D_{\mathrm{nat}} = \sum q_i m_i\).  
`complete` iff all legs marked.

**Multi-exp skew (normative visibility):**

```text
PackageQuote += {
  legs[].as_of,                    // generation as_of used for that leg
  max_skew_ms: number,             // max|as_of_i − as_of_j| across legs
  epoch_quality: "ok" | "skewed" | "incomplete"
}
```

- Defer **strict** multi-exp simultaneity if needed.  
- **Do not** defer **visibility**: day_trade **marks** may **fail loud** or **degrade labeled** when `max_skew_ms > threshold` (config; Spec freezes default).  
- Model curves always carry skew meta in result.

### 5.7 LockState

- **Unlocked:** \(D_{\mathrm{basis}} = D_{\mathrm{nat}}\) (when complete and epoch ok for day_trade policy).  
- **Locked:** \(D_{\mathrm{basis}} = D^*\) (natural at lock, user limit, or ToS @).  
Default lock freezes **package debit only**; IV stays live unless `freeze_iv`.

### 5.8 PricingRequest / PricingResult

Stable L4 DTO: use case, pack, book, what-if/scenario, outputs (marks, curves, greeks meta, labels, epoch skew, rate source).

---

## 6. Multi-expiration

- Strategy may require **N** `GenerationKey`s.  
- Interest manager refcounts keys across the foundation.  
- **Pricing epoch:** combine latest hash per required exp; emit `max_skew_ms` (H2).  
- **Wings / band:** shared wings + strike-union safety — see **§6.1 budget law**.  
- **Expiration curve policy (OD-PF2):** default **front-exp slice** (front intrinsic, back residual) — labeled.

### 6.1 Generation assembly budget ≠ Heatmap one-page UI law

| Surface | Budget |
|---------|--------|
| **Heatmap UI generation** | May keep **one-page** dual-side law (≤250 contracts / HM17 heritage) for display/stream simplicity |
| **OPF foundation generation** | May **paginate** Massive snapshot assembly under integrity law: **complete required strikes or fail loud** — never a silent partial book that drops a strategy leg |

Strike-union safety means: if a condor/hedge leg is outside a one-page Heatmap band, **OPF still assembles a complete generation** (wider wings and/or multi-page with `allow_truncate=false` semantics). Heatmap may continue to show a narrower view for UX; **pricing SoR is OPF completeness**, not the Heatmap viewport.

---

## 7. IV resolution (professional cascade)

Per leg, within that leg’s generation first:

1. Exact chain IV  
2. Nearest strike same side/exp  
3. Closest DTE same side/strike among **subscribed** gens  
4. Stored snapshot IV on strategy  
5. ATM window average for that exp  
6. **VIX / VIX1D-derived** — **OC5a:** only from **native index marks** (VIX/VIX1D product with non-proxy source). **Never** ETP prices (e.g. VIXY) read as vol percent.

Always emit `iv_source`. Day-trade “model T+0” must not claim mark if tier ≥ 5 without label.

---

## 8. Surface geometry law (frozen for surface packs)

Applies to `day_trade.surface` and `outlook.scenario_surface` (and any surface builder used by outlook scenarios).

| Topic | Law |
|-------|-----|
| **Strike dimension** | Interpolate in **total variance** \(w = \sigma^2 T\) vs **log-moneyness** \(k=\ln(K/F)\) (or equivalent documented \(k\)); butterfly-arbitrage guards on discrete \(k\) (non-negative butterfly densities / convexity of call prices). |
| **Expiry dimension** | Interpolate total variance **linear in \(T\)** at fixed \(k\) (calendar-arb resistant construction). |
| **Fit failure** | **Fail loud** → do not emit surface pack output; resolve may fall back to **default pack** only if caller allows fallback; never a silently bad surface labeled production. |
| **SABR (`outlook.dynamics`)** | Calibration cadence frozen (e.g. per generation or per N seconds); **RMSE / fit-quality gate** → labeled fallback to `outlook.scenario_surface` if gate fails. |

Sticky rules for day_trade hybrid (spot slide without full surface rebuild): OD-PF3.

---

## 9. Interest and Massive budget

InterestManager refcounts generations, **and**:

| Control | Law |
|---------|-----|
| **Global generation-interest budget** | Config cap on concurrent live generation keys per process / per credential class |
| **At cap** | **Refuse loudly** or **queue** (config); never silent drop of a leg’s exp |
| **Isolation** | Sibling to VP rate isolation: chain generation budget does not starve (or get starved by) unrelated jobs without explicit priority config |

Members with many multi-exp strategies can request many keys — the foundation must **bound** total Massive snapshot load.

---

## 10. Generation archive (backtest)

| Store | Role |
|-------|------|
| **Redis** | **Hot / live window only** (hours-scale TTL) |
| **Cold archive** | Day-sharded **disk / object / parquet** (append-only, resumable) — VP artifact pattern |

`backtest.chain_replay` reads **cold archive**, not Redis months of `mb:genarch:*`.  
OD-PF5: retention **and medium** are config; missing archive → fail loud for default backtest pack.

---

## 11. Engine SoR and parity (OD-PF6)

| Role | Authority |
|------|-----------|
| **Server L2–L4** | **SoR** for multi-worker and any tool API resolve |
| **Client mirror** | Optional for offline what-if **only if** dual implementation exists |

If a TypeScript mirror of engine math ships:

- **Golden vectors** required: shared fixtures `(EngineInput → EngineOutput)`  
- Both Python and TS **must pass the same vectors in CI**  
- Drift is a **test failure**, not a production surprise  

Prefer single-language engine (server) + thin client if parity cost is high.

---

## 12. Relationship to Market Bus (Arch 28)

| Market Bus | Pricing Foundation |
|------------|--------------------|
| Massive sole writers in feeds | Consumes generations only |
| Redis `mb:ladder:*` | L1 hot store / interest |
| WS push full\|diff\|unchanged | L1 input |
| `mb:sym` / session | Spot + held |
| Does **not** define package/lock/packs/r/q | **Does** define L2–L4 + static facts + archive policy |

Foundation **extends** dual-key hygiene, multi-interest, budgets; it does **not** fork a second Massive client.

---

## 13. Phased implementation (foundation only)

| Phase | Exit |
|-------|------|
| **F0** | Dual-key + feed + interest alignment; single-exp dual generation proven on bus |
| **F1** | Multi-exp ContractStore + InterestManager + **interest budget** + **epoch skew fields** |
| **F2** | LegPricer + PackagePricer + Lock + **MarketStaticFacts (r/q)** |
| **F3** | Pack registry + `day_trade.mark_hybrid` with **named CRR/BSM** + per-leg IV; alternate surface with **frozen geometry** |
| **F4** | `outlook.scenario_surface` + alternate SABR with **fit gate** |
| **F5** | **Cold archive** + `backtest.chain_replay` (+ reconstruct alternate) |
| **F6** | L4 public API + AT green + **golden vectors** if dual engine |

**App wiring (Heatmap, Analyzer, …) is a separate program after F6.**

---

## 14. Non-goals (foundation)

- Rewriting Heatmap/Analyzer UI in this program  
- Broker submit / fill guarantee  
- Full OPRA option tick stream (snapshot generations are primary options fact source)  
- 3D risk graph  
- True dealer GEX  

---

## 15. Open decisions (OD)

| ID | Topic | Recommendation |
|----|--------|----------------|
| OD-PF1 | Primary exp for multi-exp curve | Earliest leg expiration |
| OD-PF2 | Default expiration curve | Front-exp residual policy |
| OD-PF3 | Sticky rule day-trade | Sticky delta for index 0–2 DTE; sticky strike configurable |
| OD-PF4 | Package bid/ask | Phase after mid natural (optional day-trade) |
| OD-PF5 | Archive | **Cold day-shard medium** + retention days; fail-loud if backtest default without archive |
| OD-PF6 | Server vs client engine | **Server SoR**; client mirror only with **golden-vector CI** |
| OD-PF7 | American engine | **CRR binomial** default; BAW only if OD documents swap |
| OD-PF8 | Day-trade mark on epoch skew | Fail loud if `max_skew_ms > LABS_OPF_MAX_SKEW_MS` (default 3000) |
| OD-PF9 | Rates bootstrap | Config SOFR proxy until rates feed exists |
| OD-PF10 | Global interest cap | Config; refuse loud at cap |

---

## 16. Document map

| Doc | Role |
|-----|------|
| **This architecture** | System design, layers, topology, phasing, review fold |
| **Spec v0.1** | Normative types, pack law, surface geometry, AT, fail-loud |
| Arch 28 / MB Spec | Transport parent (filename `…Spec-v1.0.md`, content rev **v1.0.1**) |
| Chain Picker Spec **v1.0.2** | Universe, **OC2/OC5a** proxy spot, wing/diff heritage — file present at `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` |

---

## 17. Success criterion

Foundation is complete when:

1. Headless multi-exp dual generation interest works on Market Bus (within interest budget).  
2. Multi-leg PackageQuote with per-leg `iv_source`, `as_of`, and `max_skew_ms`.  
3. Day_trade default resolve returns mark + model_t0 + expiration with **Labs r/q** and **named engine**.  
4. Lock/unlock basis behavior as specified.  
5. Alternate pack selectable via registry.  
6. Surface fit failure fails loud (no silent bad surface).  
7. Backtest default uses **cold archive** or fails loud.  
8. Golden vectors pass if any dual-language engine exists.

Only then: wire apps.

---

## 18. Review fold log (2026-08-11)

| ID | Finding | Disposition |
|----|---------|-------------|
| H1 | No rates/dividends; American unnamed | §5.3–5.4; Spec L0 static facts + named CRR/BSM |
| H2 | Multi-exp epoch skew invisible | §5.6 `max_skew_ms`; OD-PF8 |
| H3 | Surface geometry unfrozen | §8 total-variance / log-moneyness + arb + fit fail |
| H4 | HM17 vs strike-union | §6.1 separate Heatmap vs OPF budgets |
| H5 | Client mirror parity trap | §11 golden vectors; OD-PF6 |
| H6 | Redis archive wrong for months | §10 cold day-shard |
| H7 | VIX tier vs OC5a | §7 tier 6 native index only |
| H8 | Unbounded interest | §9 global generation-interest budget |
