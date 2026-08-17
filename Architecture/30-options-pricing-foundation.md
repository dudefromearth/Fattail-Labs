# Options Pricing Foundation — Design Architecture

**Status:** **AS-BUILT (foundation L0–L4)** (2026-08-11) — apps (L5) **not** wired  
**Type:** Design + as-built architecture — shared **data plane + model packs** for accurate real-time and research P&amp;L  
**Product law:** [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) (**v0.2.1** BUILD AUTHORITY · DL-290) · v0.1 historical only  
**Bench:** [`docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-options-pricing-foundation/`  
**Session/print (DRAFT):** [`docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`](../docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-ot-ef-session-print/` · Spec v0.1 **not BUILD** until W3-0  
**Parents:** [Arch/28 Market Bus](./28-massive-market-bus.md) · [Market Bus Spec](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (content **v1.0.1**) · [Chain Picker Spec v1.0.2](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) · [Heatmap Spec v0_2](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) (HM18/HM19)  

**Not:** MSC as standard · per-app Massive clients · SSE as market transport · “pretty curves” without marks/IV truth · **L5 app wiring (explicit non-claim)**  

**Review folds:**  
- Design-doc H1–H8 → Spec v0.1 laws OPF21–28  
- Crossed-artifact remainder R1–R7 → **Spec v0.2** (τ, RECON AT, archive stale, calendar arb, advisories, version bump, HM18/19 parent)

---

## 0. Mission

Build a **Labs-owned Options Pricing Foundation** so that:

1. **One data plane** supplies multi-expiration, dual-side option chain generations, underlier marks, **rates/dividends**, session, and quality metadata.  
   **DL-395 / OPF34–36:** OPF **owns** that session + print-quality feed to the client (open / extended pre-post / closed · live vs last known print). The client does not invent it.
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
| **r/q/τ are first-class** | Continuous \(r\), dividends, and **τ law** (incl. 0DTE intraday + VIX1D tenor) so T+0 can reconcile at spot. |
| **Incoherence is visible** | Multi-exp generation skew is measured and labeled (or fail-loud for day-trade marks). |
| **Surface geometry is frozen** | Total-variance / log-moneyness; butterfly **and calendar** arb; fit fail loud. |

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
  risk_free_rate: number,          // CONTINUOUS annualized (normative)
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
| **Strike dimension** | Interpolate in **total variance** \(w = \sigma^2 T\) vs **log-moneyness** \(k=\ln(K/F)\); butterfly-arbitrage guards on discrete \(k\). |
| **Expiry dimension** | Interpolate \(w\) **linear in calendar \(T\)** at fixed \(k\). |
| **Calendar arb** | At fixed \(k\), **\(w(k,T)\) non-decreasing in \(T\)**; violation → **fail fit** (do not interpolate through decreasing total variance). |
| **Fit failure** | **Fail loud** → no surface; optional fallback to default pack only if allowed; never silent bad surface. |
| **SABR (`outlook.dynamics`)** | Calibration cadence config; **RMSE gate** → labeled fallback to `outlook.scenario_surface`. |

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

`backtest.chain_replay` reads **cold archive**, not Redis months of keys.  
**Replay staleness:** `archive.get(key, as_of)` with **max-stale bound** per step; beyond → **labeled gap**, never silent stale fill.  
OD-PF5: retention + medium + max-stale are config; missing archive → fail loud for default backtest pack.

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
| **F2** | LegPricer + PackagePricer + Lock + **MarketStaticFacts (continuous r)** + **τ law** |
| **F3** | Pack registry + `day_trade.mark_hybrid` (CRR/BSM) + per-leg IV + **AT-L3-RECON**; surface alternate + **calendar arb** |
| **F4** | `outlook.scenario_surface` + SABR gate |
| **F5** | **Cold archive** + max-stale gaps + `backtest.chain_replay` |
| **F6** | L4 API + AT green + golden vectors if dual engine |

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
| OD-PF5 | Archive | **Cold day-shard** + retention + **max-stale** for replay steps |
| OD-PF6 | Server vs client engine | **Server SoR**; client mirror only with **golden-vector CI** |
| OD-PF7 | American engine | **CRR binomial** default; BAW only if OD documents swap |
| OD-PF8 | Day-trade mark on epoch skew | Fail loud if `max_skew_ms > LABS_OPF_MAX_SKEW_MS` (default 3000) |
| OD-PF9 | Rates bootstrap | Config SOFR proxy; **r continuous** |
| OD-PF10 | Global interest cap | Config; refuse loud at cap |
| OD-PF11 | t=0 recon tolerance | abs $1 or 1% of \|mark\| (Spec AT-L3-RECON) |

---

## 16. Document map

| Doc | Role |
|-----|------|
| **This architecture** | System design, layers, topology, phasing, review fold |
| **Spec v0.2.1** | Normative law (OPF1–33), τ, RECON AT, surface+calendar arb, archive stale |
| **Bench plan v1.0** | [`docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md) · board `agents/p-options-pricing-foundation/` |
| Arch 28 / MB Spec | Transport parent (`…Spec-v1.0.md`, content **v1.0.1**) |
| Chain Picker Spec **v1.0.2** | `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` (RATIFIED header; OC6a in body) |
| Heatmap Spec **v0_2** | HM18 / HM19 heritage targets for OPF17–18 |

---

## 17. Success criterion

Foundation is complete when:

1. Headless multi-exp dual generation interest works on Market Bus (within interest budget).  
2. Multi-leg PackageQuote with per-leg `iv_source`, `as_of`, and `max_skew_ms`.  
3. day_trade resolve: mark + model_t0 + expiration; continuous **r**; **τ law**; **AT-L3-RECON** green.  
4. Lock/unlock + freeze_iv/freeze_marks.  
5. Alternate pack via registry.  
6. Surface fit fails on butterfly **or** calendar arb.  
7. Backtest cold archive + **max-stale gaps**.  
8. Golden vectors if dual engine.

Only then: wire apps.

---

## 17b. As-built map (foundation exit 2026-08-11)

| Layer | Path |
|-------|------|
| Dual keys / feed | `server/opf/keys.py` · `server/market_data/chain_feed.py` |
| Config | `server/opf/config.py` |
| τ / static facts | `server/opf/tau.py` · `static_facts.py` |
| L1 store / interest | `server/opf/generation.py` · `interest.py` · `strike.py` |
| L2 | `server/opf/leg.py` · `package.py` · `lock.py` · `engines/*` |
| L3 packs | `server/opf/packs/{registry,day_trade,outlook,backtest}.py` · `engines/surface.py` |
| Archive | `server/opf/archive.py` · `server/data/opf_archive/` |
| L4 API | `server/opf/resolve.py` · `server/routes/pricing.py` |
| ATs | `server/tests/test_opf_foundation.py` (19) |

**Env (fail loud / config):** `LABS_OPF_MAX_GENERATION_INTERESTS` · `LABS_OPF_MAX_SKEW_MS` · `LABS_OPF_SKEW_MODE` · `LABS_OPF_T0_RECON_TOL_*` · `LABS_OPF_ARCHIVE_*` · `LABS_OPF_RISK_FREE_RATE`

**API (member session + tool gate):**  
`GET /api/me/pricing/packs` · `POST /api/me/pricing/resolve` · `POST /api/me/pricing/interest` · `POST /api/me/pricing/lock` · `GET /api/me/pricing/health`

---

## 18. Review fold log

### 18.1 Design-doc H1–H8 → Spec v0.1 / Arch body

| ID | Finding | Disposition |
|----|---------|-------------|
| H1 | r/q + American | MarketStaticFacts; CRR/BSM |
| H2 | Epoch skew | max_skew_ms; OD-PF8 |
| H3 | Surface geometry | §8 + Spec §6.5 |
| H4 | HM17 vs union | §6.1 dual budgets |
| H5 | Client mirror | golden vectors |
| H6 | Redis archive | cold day-shard |
| H7 | OC5a VIX | tier 6 |
| H8 | Interest cap | §9 |

### 18.2 Crossed-artifact remainder → Spec **v0.2**

| ID | Finding | Disposition |
|----|---------|-------------|
| R1 | τ + continuous r | Spec §3.7 OPF29; r continuous |
| R2 | t=0 recon AT | AT-L3-RECON |
| R3 | Archive max-stale | OPF33 |
| R4 | Calendar arb w↑T | Spec §6.5.4 |
| R5 | Advisories (locked, freeze_*, units, strikes) | OPF8/30–32, Spec §5.7, §4.7 |
| R6 | Version bump | **Spec-v0_2.md** |
| R7 | HM18/HM19 parent | Heatmap Spec v0_2 cited |
| R8 | AM settlement for τ | Spec §3.7 settlement am/pm (v0.2.1) |
| R9 | 1h τ floor | Spec §3.7 **1-minute** floor + clamp label (v0.2.1) |
