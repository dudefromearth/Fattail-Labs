# FatTail Labs — Volume Profile Histogram Spec v0.3

**Status:** **SUPERSEDED** by [v0.4](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md) (2026-08-12) — full-estate Big Kahuna  
**Date:** 2026-08-12  
**Current revision:** **v0.3.1** (historical; last fold before v0.4)  
**Supersedes:** [v0.2](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_2.md) (dual Pod store · Strategy Lab raw consumer · TV conditioner research track)  
**Canonical filename:** `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_3.md`  
**Type:** Product + data-plane Spec — **raw market archive** + **measured volume-by-price histograms**  
**Board (when seated):** `agents/p-volume-profile-histogram/`  
**Plan:** [`docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md`](../docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md)

**Short name:** **VP** / **VP Histogram** / **Market Data Dual Store**

> **Use [v0.4](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md) for all new work.**

**Content hash (v0.3.1):** historical only.

**Process note (Coach):** v0.1/v0.2 and the as-built Options Lab chart landed **without** a full review → plan → GO for the multi-year data plane. **v0.3 restores that process.** No multi-year production pull until Coach GO on Spec + Plan. **Pilot (SPY 1y raw + P2)** may GO while open ODs remain; multi-year production pull requires OD-VP6/7 (proxy price map, raw retention) closed or waived by DL.

**External reviews folded:**

| Review | Disposition |
|--------|-------------|
| Claude advisor 2026-08-10 (R1–R9) | Trades-first · geometry freeze · honesty metadata |
| **Spec review 2026-08-12** (dual-store critique) | **v0.3.1 fold:** VIX/VIXY proxy invalid; proxy **price-space** law; ES/futures honesty; quotes budget scope; AT-R2 tolerance process; raw retention OD; API `algo_version`/range; P2 bin-count evidence |

---

## 0. Mission

Build and maintain a **two-leg data plane** for volume-bearing symbols:

```text
Massive (entitled)
    │
    ├─► RAW archive (Pod 1)  ──► Strategy Lab backtest / research
    │
    └─► BIN tool (measurement) ──► BINNED artifacts (Pod 1 + catalog)
                                      │
                                      ├─► VP chart (consumer)
                                      └─► Agents / analysis
```

1. **RAW** — highest-granularity entitled history (**trades** primary; **quotes** optional companion; **1s aggs** optional derivative), **5 calendar years**, on durable network storage.  
2. **BINNED** — **tick-resolution volume-by-price histogram** built as a **measurement** from trades (`bin_index(price) += size`), versioned by `algo_version`.  
3. **Honesty** — every day/shard records source; no silent estimate labeled as measurement.  
4. **Dual consumers** — Strategy Lab reads **raw**; VP/agents read **binned** (same geometry for agents and chart when chart is unblocked).

**What this is not:** Market Profile/TPO; MSC Dealer Gravity Redis port; copying MSC code; live multi-year rebuild in the request path; treating the interim OHLC client bins chart as SoR; adopting MSC **TV microbin** conditioning as measurement SoR without Coach research outcome.

---

## 0.1 As-built honesty (2026-08-12)

| Item | As-built | Spec law |
|------|----------|----------|
| Member chart | `/app/options-lab/volume-profile` — client bins from **OHLC** (~56 bins) | Interim UX only; **not** VP measurement SoR |
| Durable Labs OHLC | `market_ohlc_*` — mostly **1d** bars, ~**3y**, OHLCV | Not the raw tape; not 5y trades |
| VP tables / jobs / API | **Missing** | Required by this Spec after GO |
| MSC VP tools | Minute bars + `raw`/`tv` bin modes (reference only) | **No MSC import** (VP12) |

---

## 0.2 Surface naming

| Name | Meaning |
|------|---------|
| **Volume Profile app** | Member chart at as-built `/app/options-lab/volume-profile` |
| **“Options Lab”** | Working route string only until OD-nav catalog DL |
| **RAW store** | Pod 1 raw partitions (trades / optional quotes / optional 1s) |
| **BINNED store** | Pod 1 + MySQL catalog of measured histograms |
| **TV conditioner** | Research track (§12) — **not** default SoR |

---

## 1. Parents / companions

| Spec / doc | Role |
|------------|------|
| Admin **`market_symbol_universe`** | Symbol eligibility SoR |
| [Options Chain Picker Spec v1.0.2+](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe resolution · fail-loud |
| [Massive Market Bus Spec v1.0](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Live priority; VP batch must not starve bus (VP15) |
| Strategy Lab Development / Curate-Deploy Specs | Future **raw** consumer for backtest |
| Human Interface Spec v1.0 | Chart chrome when §9 unblocked |
| Claude.md / deploy | Fail-loud config · no MSC · MiniTwo when productionized |

**Doctrine:** Standalone repo · **no MSC code** · config fail-loud · evidence over assertion · raw tape and measured bins are dual SoRs with different consumers.

**MSC reference (read-only):** MSC `vp_build_profile` / `vp_quick_load` illustrate **raw vs tv bar allocation** and dual publish. Labs may re-implement ideas; **must not** vendor MSC modules.

---

## 2. Laws

| ID | Law |
|----|-----|
| **VP1 — Dual SoR** | **RAW** tape (trades…) and **BINNED** measured histogram are both first-class. Binned **must not** replace or delete raw. |
| **VP2 — One bin per tick** | Measurement SoR: `bin_step ≡ tick_size`. No multi-tick aggregation in measured artifact. |
| **VP2a — Trades-first measurement** | `volumes[i] += trade.size` at exact print price. No typical-price / close-only on trades path. |
| **VP2b — Degrade ladder** | If trades unserved: **1s → 1m** aggs; at any bar grain **H–L proportional tick spread only**. Single-bin typical-price **forbidden**. |
| **VP2c — Source honesty** | Day shard `source ∈ {trades,1s,1m}`; composite `method` ∈ {`per_trade`,`mixed`,`per_bar_spread`}. |
| **VP3 — No structure furniture on measurement** | No POC / VA / HVN / LVN / nodes in measured artifact or v1 chart chrome. Downstream-only. |
| **VP4 — Universe SoR** | Eligible ⊂ enabled `market_symbol_universe` + VP5. |
| **VP5 — Volume eligibility + proxy honesty** | Indexes without trade tape **must not** claim native volume. A **price-structure proxy** (e.g. SPY→SPX) is allowed only when (a) **labeled** (`series_ticker`, `proxy_of`, source), and (b) a **frozen price map** (§5.5) is part of `algo_version` geometry. A proxy that does **not** preserve meaningful price co-location **must not** be served as that index’s volume profile. |
| **VP5a — Invalid vol-proxy ban (VIX family)** | **VIXY (or any short-term VIX futures ETF) must not** be used as a volume-profile proxy for **VIX** or **VIX1D**. Roll yield, futures basis, and reverse splits destroy price-level meaning; labeled metadata cannot fix misleading substance. VIX/VIX1D are **out of VP eligibility** unless Coach opens **OD-VP8** with a valid measurement path. |
| **VP6 — Offline build** | Multi-year acquisition and re-bin only in **batch jobs**. |
| **VP7 — Daily maintain** | After complete RTH session (incl. early close), increment raw + bins; watermark only on success. |
| **VP8 — Fixed geometry** | Change tick/origin/round/conditions/session/**proxy price map** ⇒ new `algo_version` + full re-bin (re-pull raw only if raw missing). |
| **VP9 — Chart TF gate** | Overlay only `1d`/`4h`/`1h`/`30m` when chart consumes measured artifact (§9 staged). |
| **VP10 — Display prefs only** | Color, opacity, width scale 25–100%. |
| **VP11 — Same bins for agents + chart** | Chart and agents read the same measured artifact. |
| **VP12 — No MSC** | No MSC VP/heatmap code or MSC Redis schemas in Labs. |
| **VP13 — Fail loud** | Missing mount, entitlement, tick, eligibility, `max_n_bins` → explicit job/API failure. |
| **VP14 — Config fail-loud** | `LABS_MARKET_DATA_ROOT`, lookback, caps, keys — required when plane enabled. |
| **VP15 — Rate isolation** | Batch defers to live Market Bus / chain / sym. |
| **VP16 — max_n_bins** | Exceed ⇒ `skipped_bins_exceeded`, no artifact. |
| **VP17 — Storage root** | Durable bulk data lives under **config `LABS_MARKET_DATA_ROOT`** (Coach: **Pod 1** on Blackmagic Pod). Unmounted root ⇒ fail loud. MySQL holds **catalog / watermarks / job state**, not multi-TB tape. |
| **VP18 — Capacity budget (trades-scoped)** | Design **≤ 50 GB / symbol** headroom for **trades** (and optional 1s materializations), not expected size. Jobs **must** expose measured size; alert if a symbol approaches budget. **Quotes (NBBO) are out of this budget** — if OD-VP1 ever admits quotes, Coach must set a **separate** quotes budget (quotes can be 10–100× denser than trades; SPY quotes would break 50 GB immediately if the trades budget were reused). |
| **VP19 — Strategy Lab raw consumer** | Raw archive is a **first-class** input for Strategy Lab backtest/research. Schema stability required. **Retention** of raw past the rolling 5y **binned study window** is **OD-VP7** (default if silent: **keep forever** on Pod until Coach sets purge policy — VP1 forbids bin jobs from deleting raw). |
| **VP20 — TV not measurement SoR** | MSC-style **TV microbin** (H–L bar spread) is **research / optional derived mode only** until Coach closes §12. Default production bins = **trades measurement**. |
| **VP21 — Futures honesty** | **ES/NQ (and other futures) are not entitled on the current Massive stocks plan** (probe: stocks trades/quotes path only). Absence from the eligibility matrix is **entitlement + scope**, not a silent product rejection of ES as the coaching room’s structure instrument. If futures become entitled, a **new OD + algo path** is required (overnight session rules differ — §6.1). |

---

## 3. Study definition

| Parameter | v0.3 law |
|-----------|----------|
| **Study window** | Rolling **5 calendar years** to last complete session |
| **RAW primary** | **Trades (prints)** full field set entitled by Massive |
| **RAW optional** | Quotes (NBBO); 1s aggs (if entitled) as companion or rebuild materialization |
| **BIN primary** | From trades when available |
| **Session filter** | **RTH** equities/ETFs (§6); early close = complete. See §6.1 for overnight / ES coaching-room divergence. |
| **Trades algorithm** | See §3.1 |
| **Binned study window** | Rolling **5y** composite for measurement SoR |
| **Raw retention** | **OD-VP7** — independent of rolling binned window (default: keep raw forever on Pod) |

### 3.1 Per-print algorithm (measurement SoR)

```
for each included trade in session:
    i = bin_index(trade.price)   # §5
    volumes[i] += trade.size
```

### 3.2 Bar-grain degrade (estimate only)

Same as v0.2: multi-tick H–L proportional spread; forbid single-bin typical price when span > 1 tick.

---

## 4. Dual store layout (Pod 1)

### 4.1 Root

| Config | Law |
|--------|-----|
| `LABS_MARKET_DATA_ROOT` | Absolute path; Coach intent **`/Volumes/Pod 1`** (Blackmagic Pod SMB share **Pod 1**, ~4 TB class). |
| Mount missing | Jobs and boot of market-data plane **fail loud** — no silent laptop fallback. |

### 4.2 Directory layout (normative shape)

```text
$LABS_MARKET_DATA_ROOT/fattail-market-data/
  raw/
    {series_ticker}/
      trades/year=YYYY/month=MM/day=DD/part-*.parquet
      quotes/year=YYYY/month=MM/day=DD/part-*.parquet   # optional
      aggs_1s/year=YYYY/month=MM/day=DD/…               # optional
      _manifest.json
  binned/
    {algo_version}/
      {symbol}/
        day=YYYY-MM-DD.parquet    # day shard bins
        composite.parquet         # or latest composite pointer
        _meta.json
  jobs/
    logs/…
```

- Prefer **Parquet + compression** (or equivalent columnar).  
- Partition by **session day**.  
- **One physical SPY raw** serves SPY product and **SPX/XSP price-structure proxy** use; do not triple-store identical tape under three product names.  
- **Do not** store VIXY for the purpose of serving a “VIX volume profile” (VP5a).

### 4.3 MySQL catalog (not bulk SoR)

| Table | Purpose |
|-------|---------|
| `market_raw_series` | series_ticker, kinds (trades/quotes/1s), first/last session, bytes, complete |
| `volume_profile_artifact` | Latest composite meta + pointer to Pod object |
| `volume_profile_day_shard` | Per day meta + source + pointer |
| `volume_profile_job` | Queue/state |

Hot cache (Redis/in-process) optional; **Pod + catalog** remain durable SoR.

---

## 5. Geometry (frozen before first production bin)

`algo_version` for first production measurement write: **`vp_bins_v3`**  
(carries v0.2 trades-first rules; dual-store pointers; **§5.5 proxy price map**).

### 5.1 Tick size order

1. Universe / Admin tick when set  
2. Vendor reference if consistent  
3. Else fail loud  

For **proxy-served products**, tick size is the **served price-space** tick (e.g. SPX dollars after map), frozen with the map.

### 5.2 Origin + rounding

- `price_origin = 0` unless Admin override  
- **Half-away-from-zero** on `price / tick_size` (AT-R5 golden tests)

### 5.3 Trade-condition filter

Align with **Massive aggregate inclusion** for volume reconciliation (AT-R2). Freeze allow/deny list after **P2-3** into `algo_version` changelog.

### 5.4 max_n_bins

Config required for prod jobs. **500000** is a **discussion default only** (generous; SPY 5y at $0.01 is ~tens of thousands of bins, not hundreds of thousands). **P2-8** must record **actual `n_bins`** on pilot composites so production config lands on a meaningful guard, not a non-binding ceiling.

### 5.5 Proxy price map (**frozen under algo_version** — review fold)

Labeling alone is not enough. When product symbol ≠ `series_ticker`, bins are **always served in product price space** unless OD changes this.

| Field | Law for `vp_bins_v3` (SPY→SPX / SPY→XSP) |
|-------|------------------------------------------|
| **Raw accumulate** | Bin SPY trades in **SPY tick space** on day shards keyed by `series_ticker=SPY` |
| **Serve as SPX** | Apply frozen map **SPX_price = SPY_price × 10** (static multiplier), then re-index bins onto SPX tick grid **or** store composite already mapped — either way, **member/agent SPX payload prices are SPX-denominated** |
| **Serve as XSP** | Same SPY raw; map **XSP_price = SPY_price** (1:1 cash mini — freeze at P2 if XSP product is served; if only SPX is served via SPY, document XSP deferred) |
| **Map kind** | **`static_mult`** for v3 (not per-day ratio). Per-day ratio (close_SPX/close_SPY) is a **new algo_version** if Coach wants it later |
| **Fingerprint** | `proxy_map: { kind, mult, from_ticker, to_product }` is part of geometry; change ⇒ new `algo_version` |
| **Forbidden** | Serving SPY dollar levels labeled as SPX without map; serving VIXY levels as VIX (VP5a) |

**AT-R11:** Request `symbol=SPX` → payload `min_price`/`volumes` geometry is **SPX-scale** (e.g. ~6000s not ~600s) and meta includes `proxy_map`.

---

## 6. Session calendar

Complete RTH incl. early close; config calendar; watermark only on success; holidays no advance.

### 6.1 Overnight / ES coaching-room divergence (honesty)

Coaching structural markup often uses **ES**, including **overnight / Globex** structure. This Spec’s default measured VP is **RTH equity/ETF** (SPY/SPX proxy RTH). Therefore:

- Labs **RTH SPY→SPX** VP **will disagree at the edges** with overnight ES structure drawings — that is **expected**, not a bug.  
- Member/agent copy **must not** claim “same as ES overnight profile.”  
- Extended-hours equity session or **ES futures tape** is **out of v0.3.1 scope** (OD-VP9 if ever desired). **ES absence is explicit** (VP21): not entitled on current stocks plan; not silently rejected as worthless.

---

## 7. Symbol eligibility + entitlement matrix (probe 2026-08-12; **v0.3.1**)

Eligibility ⊂ enabled universe + volume path + **VP5 / VP5a / VP21**.

### 7.1 Native trades + quotes + 1s @ ~5y (probe YES) — **VP-eligible**

**SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG, AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT**

### 7.2 Cash index — native tape not entitled; **price-structure proxy OK**

| Product | Native / feed | Trades/quotes | VP path |
|---------|---------------|---------------|---------|
| **SPX** | `I:SPX` | **403** | **SPY raw + §5.5 map** (labeled; SPX price space) |
| **XSP** | `I:XSP` | **403** | **SPY raw + §5.5 map** if product served; else deferred |

### 7.3 **Quarantined — not VP-eligible (VP5a)**

| Product | Why |
|---------|-----|
| **VIX** | No entitled tape; **VIXY is not a valid price-structure proxy** (futures roll, basis, reverse splits). Method uses VIX as **regime level**, not a structure to trade into. |
| **VIX1D** | Same as VIX. |

Reopen only via **OD-VP8** with a measurement path that preserves price meaning (burden of proof on proponent).

### 7.4 Futures (ES / NQ / …) — **not on this plan**

| Instrument | Status |
|------------|--------|
| **ES, NQ, …** | **Not entitled** via current Massive **stocks** trades/quotes path (VP21). Not listed as rejected-for-product-reasons. Futures entitlement = future OD + session rules (Globex). |

### 7.5 Pilot order

1. **SPY** raw **1y** pilot (size measure) — **may GO without multi-year**  
2. SPY 5y  
3. QQQ + liquid ETFs  
4. Equities  
5. **SPX** (and XSP if in scope) via SPY + §5.5 — only after map golden tests  
6. **Never** VIX/VIX1D via VIXY under this Spec  

Probe days (entitlement): recent **2026-08-11**, ~5y **2021-08-13**. Re-probe before production if plan changes.

---

## 8. Artifact model (binned)

### 8.1 Member / agent payload

| Field | Law |
|-------|-----|
| `symbol` | Product symbol requested |
| `series_ticker` | Massive ticker used for raw (may be proxy) |
| `proxy_of` | Product if series is proxy path, else null |
| `proxy_map` | Present when product ≠ series; §5.5 fingerprint (`kind`, `mult`, `from_ticker`, `to_product`) |
| `price_space` | Units of bin edges (e.g. `"SPX"`, `"SPY"`) — **must** match served levels |
| `algo_version` | e.g. `vp_bins_v3` |
| `method` / `sources` | As v0.2 honesty |
| `tick_size`, `min_price`, `n_bins`, `volumes[]`, study window, `as_of_session` | As v0.2 |
| `raw_pointer` | URI/path under Pod for raw used (or catalog id) |

**Forbidden on measurement payload:** `poc`, `vah`, `val`, `hvn`, `lvn`, `nodes`, `value_area`.

### 8.2 Day shard

Per day bins + `source` + geometry fingerprint (incl. proxy map when applicable). Shards-as-bins for re-sum; tape remains on Pod under **raw/**.

---

## 9. Chart integration — STAGED

| Status | Law |
|--------|-----|
| **Interim chart** | May keep OHLC client bins with **honest labeling** (“from OHLC window — not measured tick VP”) until cutover |
| **Production chart** | Consumes **measured** artifact only; TF gate `1d/4h/1h/30m`; display prefs only |
| **Unblock** | Coach DL or chart-host Spec |

---

## 10. Build pipeline

### 10.1 RAW backfill

1. P2 probes (§11).  
2. Prefer **flat files** when entitled; else paginated REST trades.  
3. Write Pod partitions; update `market_raw_series`.  
4. Resume completed days; no re-fetch of good days.  
5. Optional: quotes / 1s companions.

### 10.2 BIN build

1. For each session day with raw trades (or degrade): filter conditions → bin → day shard on Pod + catalog row.  
2. Composite re-sum rolling 5y → artifact.  
3. Enforce max_n_bins.

### 10.3 Daily

1. Complete session watermark.  
2. Append raw day.  
3. Bin day; roll composite.  
4. VP15 rate isolation.

### 10.4 APIs (after GO)

```
GET  /api/me/market/volume-profile?symbol=&algo_version=&as_of=&study_start=&study_end=
GET  /api/admin/market/raw/status?series_ticker=
GET  /api/admin/market/volume-profile/status?symbol=&algo_version=
POST /api/admin/market/raw/backfill
POST /api/admin/market/volume-profile/rebuild
```

| Param | Law |
|-------|-----|
| `symbol` | Product symbol (required) |
| `algo_version` | Optional; default = current production measurement version. Required for **diff** when multiple versions exist. |
| `as_of` | Optional session date watermark |
| `study_start` / `study_end` | Optional window **within** available shards (cannot invent data) |

Request path **reads** only — never starts multi-year pull.

---

## 11. P2 probes (blocking evidence before production-scale)

| ID | Probe | Evidence |
|----|-------|----------|
| **P2-1** | Trades depth 5y pilot (SPY) | Transcript first/last pages |
| **P2-2** | Flat-file entitlement | Present / absent |
| **P2-3** | Condition inclusion vs Massive daily volume | Reconcile; **record absolute and relative error**; freeze **AT-R2 tolerance** into `algo_version` changelog (starting discussion tolerance **±2%** session volume or better — P2 may tighten) |
| **P2-4** | Pod 1 mount + write smoke | Write/read 1 file under root |
| **P2-5** | SPY 1y raw size | GB on Pod (calibrate 50 GB **trades** budget) |
| **P2-6** | Index 403 still holds | SPX/VIX native |
| **P2-7** | Rate limits under concurrent symbols | VP15 |
| **P2-8** | Actual `n_bins` on SPY pilot composite | Inform production `max_n_bins` |
| **P2-9** | SPY→SPX map golden sample | AT-R11 vectors (known SPY prints → SPX bin indices) |

Store under `docs/evidence/volume-profile/` or board gate paths.

---

## 12. TV conditioner — **research track (not implementation default)**

### 12.1 What MSC “TV” is

MSC `accumulate_tv` / `tv_microbins_30`: given a **1-minute bar**, split **[low, high]** into **30** steps and assign **volume/30** to each — TradingView-style **estimate from OHLC bars**, not print measurement.

### 12.2 Coach posture (v0.3)

| Item | Law |
|------|-----|
| **Default production bins** | Trades measurement only |
| **TV / bar-allocation modes** | **Research only** until Coach decision |
| **If later accepted** | Separate `algo_version` (e.g. `vp_tv_microbins_30_v1`), labeled **estimate**, never overwrite measurement SoR |
| **Research questions** | Compare TV vs measured on same days; structure stability; member confusion risk; Strategy Lab needs |

**Out of implementation plan critical path** until research memo + Coach accept/reject DL.

---

## 13. Acceptance tests (summary)

| ID | Test |
|----|------|
| **AT-R1** | Trades day → bins sum = included trade size sum |
| **AT-R2** | Session included-trade volume vs Massive daily within **frozen tolerance** (from P2-3; discussion start **±2%** until P2 freezes) under frozen conditions |
| **AT-R3** | Resume does not re-download good days |
| **AT-R4** | Proxy labels present for SPX→SPY; **VIX never served via VIXY** |
| **AT-R5** | Half-away-from-zero golden vectors |
| **AT-R6** | Multi-tick bar degrade ≠ single-bin typical |
| **AT-R7** | Pod root missing → job fail loud |
| **AT-R8** | Strategy Lab can open raw day partition (read contract) |
| **AT-R9** | Measurement payload has no POC furniture |
| **AT-R10** | TV mode (if any) cannot be selected as default measurement without DL |
| **AT-R11** | SPX request serves **SPX price space** under frozen §5.5 map (not raw SPY dollars) |
| **AT-R12** | API supports `algo_version` selection when ≥2 versions exist |

---

## 14. Open decisions (Coach)

| ID | Question | Default if silent |
|----|----------|-------------------|
| **OD-VP1** | Quotes in raw archive? | **Trades-only first**; quotes phase 2 + **separate capacity budget** (VP18) |
| **OD-VP2** | Materialize 1s on Pod vs rebuild from trades? | **Optional**; trades SoR |
| **OD-VP3** | Production chart cutover date from OHLC bins | After first symbols measured |
| **OD-VP4** | TV research owner / deadline | Deferred |
| **OD-VP5** | MiniTwo job host vs coach workstation for first backfill | Workstation + Pod OK for pilot; production launchd later |
| **OD-VP6** | Proxy price map: confirm **static ×10** SPY→SPX (or choose per-day ratio) | **static ×10** as written in §5.5 until DL changes |
| **OD-VP7** | Raw retention past rolling 5y binned window | **Keep forever** on Pod until purge policy DL |
| **OD-VP8** | Re-admit VIX/VIX1D VP with a valid measurement path? | **No** — quarantined (VP5a); burden of proof on proponent |
| **OD-VP9** | Extended-hours equity or ES futures VP? | **Out of scope** for v0.3.1 |

**Pilot GO vs multi-year GO:** Reviewer and Spec agree — **SPY 1y raw + P2 evidence** may proceed without resolving all ODs. **Multi-year production pull** should have **OD-VP6** and **OD-VP7** closed or explicitly waived by DL; **VIX rows must stay quarantined**.

---

## 15. Revision history

| Ver | Date | Change |
|-----|------|--------|
| v0.1 | 2026-08-10 | 1m typical-price draft |
| v0.2 | 2026-08-10 | Trades-first; geometry freeze; external review fold |
| v0.3 | 2026-08-12 | Dual Pod store; Strategy Lab raw consumer; entitlement matrix; as-built honesty; TV research track; process restore |
| **v0.3.1** | **2026-08-12** | Review fold: VP5a VIX quarantine; §5.5 proxy price map; VP21 ES honesty; §6.1 overnight divergence; VP18 trades-scoped budget; AT-R2 process; OD-VP6–9; API algo_version/range; P2-8/9 |

---

## 16. Implementation authority

- **Spec:** this document (**v0.3.1 DRAFT** until Coach GO)  
- **Plan:** `docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md`  
- **Board:** `agents/p-volume-profile-histogram/`  
- **No production multi-year pull** without GO + P2 evidence.  
- **Pilot path unblocked** in principle: SPY 1y raw after W0 + P2 for pilot scope.
