# Options Pricing Foundation — Design Architecture

**Status:** **DESIGN** (2026-08-11) — foundation-first; **not** bound to current Options Lab apps  
**Type:** Design architecture — shared **data plane + model packs** for accurate real-time and research P&amp;L  
**Product law:** [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_1.md)  
**Parents:** [Arch/28 Market Bus](./28-massive-market-bus.md) · [Market Bus Spec v1.0.1](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) · [Chain Picker Spec v1.0.2](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md)  

**Not:** MSC as standard · per-app Massive clients · SSE as market transport · “pretty curves” without marks/IV truth  

---

## 0. Mission

Build a **Labs-owned Options Pricing Foundation** so that:

1. **One data plane** supplies multi-expiration, dual-side option chain generations, underlier marks, session, and quality metadata.  
2. **One pricing plane** turns structure intents into per-leg marks, per-leg IV, package quotes, and lockable cost basis.  
3. **Model packs** (default + alternate per use case) consume that plane only — never invent ad-hoc Massive or IV logic.  
4. **All current and future tools** (Heatmap, Analyzer, GEX, bots, backtest) wire in later by **declaring a use case** and optionally a pack id.  
5. **North star:** the most accurate, honest real-time multi-leg (incl. multi-exp) P&amp;L curves and marks that options professionals would defend — **not** MSC feature parity.

**What this is not:** a UI Spec for Heatmap/Analyzer chrome; a brokerage order router; a guarantee of fill at mid.

---

## 1. Intent law (non-negotiable)

| Law | Meaning |
|-----|---------|
| **MSC is not the standard** | Optional reference for UI/engine ideas only. Accuracy and professional practice bind. |
| **Data plane ≠ model** | Snapshot/stream facts vs pricing engines are separate layers. |
| **Use-case packs** | Day trade · Outlook · Backtest each have **one default** and **one alternate** pack. |
| **Tools declare use case** | No silent BS/IV paths inside feature modules. |
| **Fail loud** | Incomplete legs, truncated chains, missing IV for “exact” tier — no silent ATM/VIX theater labeled as mark. |
| **No MSC code/runtime** | Labs-owned types and Redis keys; no MarketSwarm schemas. |
| **Apps are consumers** | Foundation ships without rewiring existing apps; wiring is a later program. |

---

## 2. Use cases and model packs

| Use case ID | Question | **Default pack** | **Alternate pack** |
|-------------|----------|------------------|--------------------|
| `day_trade` | If I execute **right now**? | `day_trade.mark_hybrid` — package **mark** + T+0 **BS/American + per-leg chain IV** (+ sticky smile on spot slide) + separate expiration curve | `day_trade.surface` — same marks/lock; T+0 from **interpolated multi-exp IV surface** |
| `outlook` | 1–10 DTE planning + vol change? | `outlook.scenario_surface` — multi-exp surface + **time roll** + **explicit vol scenarios** | `outlook.dynamics` — same scenarios; smile morph via **SABR** (or light Heston) |
| `backtest` | Did / will the process work? | `backtest.chain_replay` — **archived generations** + fill model + costs | `backtest.surface_reconstruct` — spot path + parametric surface (weaker; labeled) |

Packs are **versioned** (`pack_id@semver`). Tools pin or accept registry default.

---

## 3. Layered system (foundation stack)

```text
L0  MARKET FACTS TRANSPORT
    Massive options chain SNAPSHOT → feeds → Redis mb:* → WS push / HTTP hydrate
    + sym/session marks stream
         │
L1  CONTRACT GENERATION STORE
    Multi-exp dual-side generations · interest · content_hash · quality
         │
L2  PRICING DATA PLANE
    LegPricer · PackagePricer · LockController · StrategyBook (intents)
         │
L3  MODEL PACK RUNTIME
    Registry (use case → default|alternate) · engines (mark, BS, surface, scenario, replay)
         │
L4  TOOL API (stable contract)
    resolve(useCase, pack?, book, market) → Marks + Curves + Meta
         │
L5  APPLICATIONS (later)
    Heatmap · Analyzer · GEX · bots · research — wire only after L0–L4 exit
```

**L0–L1** extend and harden Market Bus.  
**L2–L4** are **new** foundation modules (server and/or client; server authority preferred for multi-worker).  
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
                    │  Redis  mb:ladder:…:dual · mb:sym:*      │
                    │         mb:session:* · mb:interest:*     │
                    │         mb:genarch:* (optional archive)  │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │  labs-api                                  │
                    │  · WS /api/me/market/stream (push)         │
                    │  · HTTP generation hydrate                 │
                    │  · Pricing plane services (L2–L4)          │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │  Shared client (L1–L4 bindings)            │
                    │  ContractStore · InterestManager ·          │
                    │  resolvePricing() — apps plug in later      │
                    └────────────────────────────────────────────┘
```

**Transport law:** one WebSocket per tab for market facts (Market Bus Spec).  
**Not SSE** for chain generations.

---

## 5. Domain model (foundation-owned)

### 5.1 GenerationKey

```text
GenerationKey = {
  product: string,           // Admin universe symbol, e.g. SPX
  chain_underlier: string,   // Massive path, e.g. I:SPX
  expiration: YYYY-MM-DD,
  wings: int,                // dual-side wing count (clamped)
}
```

Redis topic (normative dual form):

```text
mb:ladder:{chain_underlier}:{expiration}:w{wings}:dual
```

No `side` in key. Side is a view filter only.

### 5.2 ChainGeneration

Full dual-side contract map for one key: mid/bid/ask, iv, greeks, OI, content_hash, as_of, spot, strike_step, excluded_adjusted_count, dual_side=true.

### 5.3 LegIntent / StrategyIntent

Structure definition independent of live prices (builder, ToS parse, import).  
**Each leg carries its own `expiration`** (calendars / diagonals).

### 5.4 LegMark / PackageQuote

Resolved marks + IV source tier + quality.  
Package natural debit \(D_{\mathrm{nat}} = \sum q_i m_i\).  
`complete` iff all legs marked.

### 5.5 LockState

- **Unlocked:** \(D_{\mathrm{basis}} = D_{\mathrm{nat}}\) (when complete).  
- **Locked:** \(D_{\mathrm{basis}} = D^*\) (natural at lock, user limit, or ToS @).  
Default lock freezes **package debit only**; IV stays live unless `freeze_iv`.

### 5.6 PricingRequest / PricingResult

Stable L4 DTO: use case, pack, book, what-if/scenario, outputs (marks, curves, greeks meta, labels).

---

## 6. Multi-expiration

- Strategy may require **N** `GenerationKey`s.  
- Interest manager refcounts keys across the foundation client/server.  
- **Pricing epoch:** best-effort combine latest hash per required exp; optional strict \(\Delta t\) coherence later.  
- **Wings:** shared wings around product spot + strike-union safety so every leg strike is in band.  
- **Expiration curve policy (OD):** default **front-exp slice** (front intrinsic, back residual optionality) — labeled in outputs.

---

## 7. IV resolution (professional cascade)

Per leg, within that leg’s generation first:

1. Exact chain IV  
2. Nearest strike same side/exp  
3. Closest DTE same side/strike among **subscribed** gens  
4. Stored snapshot IV on strategy  
5. ATM window average for that exp  
6. VIX/VIX1D-derived (labeled fallback only)

Always emit `iv_source`. Day-trade “model T+0” must not claim mark if tier ≥ 5 without label.

---

## 8. Relationship to Market Bus (Arch 28)

| Market Bus | Pricing Foundation |
|------------|--------------------|
| Massive sole writers in feeds | Consumes generations only |
| Redis `mb:ladder:*` | L1 store / interest |
| WS push full\|diff\|unchanged | L1 input |
| `mb:sym` / session | Spot + held |
| Does **not** define package/lock/packs | **Does** define L2–L4 |

Foundation **extends** dual-key hygiene and multi-interest; it does **not** fork a second Massive client.

---

## 9. Phased implementation (foundation only)

| Phase | Exit |
|-------|------|
| **F0** | Dual-key + feed + interest alignment; single-exp dual generation proven on bus |
| **F1** | Multi-exp ContractStore + InterestManager (server and/or shared client) |
| **F2** | LegPricer + PackagePricer + LockController + StrategyIntent store |
| **F3** | Pack registry + `day_trade.mark_hybrid` (+ alternate surface stub or full) |
| **F4** | `outlook.scenario_surface` (+ alternate dynamics) |
| **F5** | Generation archive + `backtest.chain_replay` (+ reconstruct alternate) |
| **F6** | L4 public API + acceptance tests (no app wiring required) |

**App wiring (Heatmap, Analyzer, …) is a separate program after F6.**

---

## 10. Non-goals (foundation)

- Rewriting Heatmap/Analyzer UI in this program  
- Broker submit / fill guarantee  
- Full OPRA option tick stream (snapshot generations are primary options fact source)  
- 3D risk graph  
- True dealer GEX  

---

## 11. Open decisions (OD)

| ID | Topic | Recommendation |
|----|--------|----------------|
| OD-PF1 | Primary exp for multi-exp curve | Earliest leg expiration |
| OD-PF2 | Default expiration curve | Front-exp residual policy |
| OD-PF3 | Sticky rule day-trade | Sticky delta for index 0–2 DTE; sticky strike configurable |
| OD-PF4 | Package bid/ask | Phase after mid natural (optional day-trade) |
| OD-PF5 | Archive retention | Config days; fail-loud if backtest pack requested without archive |
| OD-PF6 | Server vs client L2 | Server authority for multi-worker; client may mirror for offline what-if |

---

## 12. Document map

| Doc | Role |
|-----|------|
| **This architecture** | System design, layers, topology, phasing |
| **Spec v0.1** | Normative types, pack law, AT, fail-loud |
| Arch 28 / MB Spec | Transport parent |
| Chain Picker Spec | Universe, proxy spot, wing/diff heritage |

---

## 13. Success criterion

Foundation is complete when:

1. A **headless** test (no Options Lab UI) can subscribe multi-exp dual generations from the bus.  
2. Build a multi-leg (incl. multi-exp) strategy intent, get **complete PackageQuote** with per-leg IV sources.  
3. Resolve **day_trade** default pack → mark + model curve with correct labels.  
4. Lock basis → re-resolve → basis fixed while marks/IV still update.  
5. Switch to **alternate** pack via registry without code forks.  
6. Backtest pack either runs on archive or **fails loud** if archive missing.

Only then: wire apps.
