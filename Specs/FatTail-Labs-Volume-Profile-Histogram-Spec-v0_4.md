# FatTail Labs — Volume Profile Histogram Spec v0.4

**Status:** **APPROVED for program W0** (Coach GO 2026-08-12 · DL-316) — production **bin** write still awaits §5 freeze (P2-3) + C-0; RAW campaign authorized  
**Date:** 2026-08-12  
**Current revision:** **v0.4**  
**Supersedes:** [v0.3](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_3.md) (dual Pod store · pilot-first acquisition ladder · single-root storage · 50 GB budget)  
**Canonical filename:** `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md`  
**Type:** Product + data-plane Spec — **raw market archive** + **measured volume-by-price histograms**  
**Board (when seated):** `agents/p-volume-profile-histogram/`  
**Plan:** [`docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md`](../docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md) — filename stable; **plan revision field is authority** (currently **v1.1.1**)

**Short name:** **VP** / **VP Histogram** / **Market Data Dual Store**

**Content hash (v0.4):** recompute at Coach GO:  
`shasum -a 1 Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md` → record in DL.

**Collection posture (Coach DL 2026-08-12) — THE BIG KAHUNA:** We collect **everything the entitlement covers, at full depth**: trades **and** quotes **and** 1s aggs, all eligible symbols, full available history. Massive is paid monthly for this data; we take delivery of all of it. The pilot-first acquisition ladder of v0.3 is **retired** — SPY full-history trades are already collected, successfully. Acquisition is no longer the risk surface. The remaining gate before production artifacts is **measurement correctness** (condition filter + geometry freeze), not collection.

**External review (carried from v0.2/v0.3):** Claude advisor 2026-08-10 (R1–R9) remains law for trades-first measurement, geometry freeze, and honesty metadata. Advisor review 2026-08-12 folded: proxy price-mapping law (§5.5), VIX/VIX1D proxy quarantine (§7.2), AT-R2 tolerance recording, raw retention DL (OD-VP6). **v0.4 trumps v0.3.1 fold details where they conflict** (full-estate collection; multi-mount; budget→telemetry; pilot ladder retired).

---

## 0. Mission

Build and maintain a **two-leg data plane** for volume-bearing symbols:

```text
Massive (entitled)
    │
    ├─► RAW archive (multi-mount, §4)  ──► Strategy Lab backtest / research
    │
    └─► BIN tool (measurement) ──► BINNED artifacts (store + catalog)
                                      │
                                      ├─► VP chart (consumer)
                                      └─► Agents / analysis
```

1. **RAW — full estate.** Trades (primary), quotes (NBBO), and 1s aggs — **all collected in v1**, full entitled depth, all eligible symbols, on durable network storage. Not phased. Not sampled. Everything.  
2. **BINNED** — **tick-resolution volume-by-price histogram** built as a **measurement** from trades (`bin_index(price) += size`), versioned by `algo_version`.  
3. **Honesty** — every day/shard records source; no silent estimate labeled as measurement.  
4. **Dual consumers** — Strategy Lab reads **raw**; VP/agents read **binned** (same geometry for agents and chart when chart is unblocked).

**What this is not:** Market Profile/TPO; MSC Dealer Gravity Redis port; copying MSC code; live multi-year rebuild in the request path; treating the interim OHLC client bins chart as SoR; adopting MSC **TV microbin** conditioning as measurement SoR without Coach research outcome.

---

## 0.1 As-built honesty (2026-08-12)

| Item | As-built | Spec law |
|------|----------|----------|
| **SPY raw trades** | **Full available history collected — complete, on Pod** (Coach) | Acquisition proven at production scale; pilot ladder retired. **Evidence at GO:** path, GB-on-disk, per-year print counts (close P2-1/2/4/5 as retired-by-as-built). |
| Member chart | `/app/options-lab/volume-profile` — client bins from **OHLC** (~56 bins) | Interim UX only; **not** VP measurement SoR |
| Durable Labs OHLC | `market_ohlc_*` — mostly **1d** bars, ~**3y**, OHLCV | Not the raw tape; superseded by raw archive for VP purposes |
| VP tables / jobs / API | **Missing** | Required by this Spec after GO |
| MSC VP tools | Minute bars + `raw`/`tv` bin modes (reference only) | **No MSC import** (VP12) |
| Storage fleet | Pod 1 (~4 TB) mounted; +4 TB drive staged; +8 TB drive on network | Multi-mount law §4.1 / VP17 |

**Record into evidence at GO:** actual SPY GB-on-disk, per-year print counts, pagination/flat-file behavior observed, any resume events. These close former probes P2-1, P2-2, P2-4, P2-5 as **retired by as-built**.

---

## 0.2 Surface naming

| Name | Meaning |
|------|---------|
| **Volume Profile app** | Member chart at as-built `/app/options-lab/volume-profile` |
| **"Options Lab"** | Working route string only until OD-nav catalog DL |
| **RAW store** | Multi-mount raw partitions (trades / quotes / 1s) |
| **BINNED store** | Durable store + MySQL catalog of measured histograms |
| **TV conditioner** | Research track (§12) — **not** default SoR |
| **Big Kahuna** | The full-estate collection posture: all entitled kinds, all eligible symbols, full depth |

---

## 1. Parents / companions

| Spec / doc | Role |
|------------|------|
| Admin **`market_symbol_universe`** | Symbol eligibility SoR |
| [Options Chain Picker Spec v1.0.2+](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe resolution · fail-loud |
| [Massive Market Bus Spec v1.0](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Live priority; VP batch must not starve bus (VP15) |
| Strategy Lab Development / Curate-Deploy Specs | **Raw** consumer for backtest — trades, quotes, 1s all in scope |
| Human Interface Spec v1.0 | Chart chrome when §9 unblocked |
| Claude.md / deploy | Fail-loud config · no MSC · MiniTwo when productionized |

**Doctrine:** Standalone repo · **no MSC code** · config fail-loud · evidence over assertion · raw tape and measured bins are dual SoRs with different consumers.

**MSC reference (read-only):** MSC `vp_build_profile` / `vp_quick_load` illustrate **raw vs tv bar allocation** and dual publish. Labs may re-implement ideas; **must not** vendor MSC modules.

---

## 2. Laws

| ID | Law |
|----|-----|
| **VP1 — Dual SoR** | **RAW** tape (trades, quotes, 1s) and **BINNED** measured histogram are both first-class. Binned **must not** replace or delete raw. |
| **VP2 — One bin per tick** | Measurement SoR: `bin_step ≡ tick_size`. No multi-tick aggregation in measured artifact. |
| **VP2a — Trades-first measurement** | `volumes[i] += trade.size` at exact print price. No typical-price / close-only on trades path. Quotes and 1s are archive companions and research inputs — **never** the bin source while trades exist for the day. |
| **VP2b — Degrade ladder** | If trades unserved: **1s → 1m** aggs; at any bar grain **H–L proportional tick spread only**. Single-bin typical-price **forbidden**. |
| **VP2c — Source honesty** | Day shard `source ∈ {trades,1s,1m}`; composite `method` ∈ {`per_trade`,`mixed`,`per_bar_spread`}. |
| **VP3 — No structure furniture on measurement** | No POC / VA / HVN / LVN / nodes in measured artifact or v1 chart chrome. Downstream-only. |
| **VP4 — Universe SoR** | Eligible ⊂ enabled `market_symbol_universe` + VP5. |
| **VP5 — Volume eligibility + proxy honesty** | Indexes without trade tape **must not** claim native volume. Proxy series allowed only when **labeled** (`series_ticker`, `proxy_of`, source) **and** served under the proxy price-mapping law (§5.5). VIX/VIX1D quarantined (§7.2). |
| **VP6 — Offline build** | Multi-year acquisition and re-bin only in **batch jobs**. |
| **VP7 — Daily maintain** | After complete RTH session (incl. early close), increment raw (all collected kinds) + bins; watermark only on success. |
| **VP8 — Fixed geometry** | Change tick/origin/round/conditions/session/proxy-mapping ⇒ new `algo_version` + full re-bin (re-pull raw only if raw missing). |
| **VP9 — Chart TF gate** | Overlay only `1d`/`4h`/`1h`/`30m` when chart consumes measured artifact (§9 staged). |
| **VP10 — Display prefs only** | Color, opacity, width scale 25–100%. |
| **VP11 — Same bins for agents + chart** | Chart and agents read the same measured artifact. |
| **VP12 — No MSC** | No MSC VP/heatmap code or MSC Redis schemas in Labs. |
| **VP13 — Fail loud** | Missing mount, entitlement, tick, eligibility, `max_n_bins` → explicit job/API failure. |
| **VP14 — Config fail-loud** | `LABS_MARKET_DATA_MOUNTS`, lookback, caps, keys — required when plane enabled. |
| **VP15 — Rate isolation** | Batch defers to live Market Bus / chain / sym. Applies to the full-estate campaign same as any job. |
| **VP16 — max_n_bins** | Exceed ⇒ `skipped_bins_exceeded`, no artifact. Record actual bin counts per symbol in evidence so the config value is calibrated, not decorative. |
| **VP17 — Multi-mount storage map** | Durable bulk data lives under **config `LABS_MARKET_DATA_MOUNTS`** — an explicit mount map (mount → role/shard assignment), Coach fleet: **Pod 1 (~4 TB) + 4 TB staged + 8 TB network**. Every mount referenced by the map must be present at job/boot or **fail loud per mount** — no silent write to whichever drive happens to be up, no laptop fallback. MySQL holds **catalog / watermarks / job state / mount assignments**, not multi-TB tape. |
| **VP18 — Capacity telemetry** | The v0.3 50 GB/symbol budget is **retired** (fleet ≈ 16 TB; size is not the constraint). Jobs **must** expose measured bytes per symbol × kind × mount; admin status surfaces per-mount free space. Visibility, not rationing. |
| **VP19 — Strategy Lab raw consumer** | Raw archive is a **first-class** input for Strategy Lab backtest/research — trades, quotes, and 1s. Schema stability and retention equal to VP raw needs. |
| **VP20 — TV not measurement SoR** | MSC-style **TV microbin** (H–L bar spread) is **research / optional derived mode only** until Coach closes §12. Default production bins = **trades measurement**. |
| **VP21 — Full-estate collection** | v1 acquisition scope is **all entitled kinds** (trades + quotes + 1s), **all eligible symbols**, **full available depth**. No sampling, no phasing by kind. A symbol/kind may be skipped only by entitlement 403 (recorded) — never by budget. |

---

## 3. Study definition

| Parameter | v0.4 law |
|-----------|----------|
| **Study window (bins)** | Rolling **5 calendar years** to last complete session |
| **Archive depth (raw)** | **Full entitled history** — deeper than the study window; see OD-VP6 |
| **RAW collected** | **Trades + quotes (NBBO) + 1s aggs** — all v1, per VP21 |
| **BIN primary** | From trades when available |
| **Session filter** | **RTH** equities/ETFs (§6); early close = complete |
| **Trades algorithm** | See §3.1 |

### 3.1 Per-print algorithm (measurement SoR)

```
for each included trade in session:
    i = bin_index(trade.price)   # §5
    volumes[i] += trade.size
```

### 3.2 Bar-grain degrade (estimate only)

Same as v0.2: multi-tick H–L proportional spread; forbid single-bin typical price when span > 1 tick.

---

## 4. Multi-mount store layout

### 4.1 Mount map

| Config | Law |
|--------|-----|
| `LABS_MARKET_DATA_MOUNTS` | Explicit map of mount point → role (e.g. `raw-primary`, `raw-shard-2`, `binned`). Coach fleet: **Pod 1** `/Volumes/Pod 1` (~4 TB, SMB) + 4 TB drive (staged) + 8 TB drive (network). Assignment recorded in MySQL `market_storage_mount`. |
| Any mapped mount missing | Jobs and boot of market-data plane **fail loud per mount** — no partial-fleet silent writes. |
| Shard scheme | By role and/or symbol group per the mount map; one day's partition for one symbol/kind never spans mounts. |

### 4.2 Directory layout (normative shape, per mount)

```text
{mount}/fattail-market-data/
  raw/
    {series_ticker}/
      trades/year=YYYY/month=MM/day=DD/part-*.parquet
      quotes/year=YYYY/month=MM/day=DD/part-*.parquet
      aggs_1s/year=YYYY/month=MM/day=DD/…
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
- **One physical SPY raw** serves SPY product and SPX/XSP **proxy** use; do not triple-store identical tape under three product names.

### 4.3 MySQL catalog (not bulk SoR)

| Table | Purpose |
|-------|---------|
| `market_storage_mount` | Mount map: path, role, shard assignment, last-seen, free bytes |
| `market_raw_series` | series_ticker, kinds (trades/quotes/1s), first/last session, bytes per kind, mount, complete |
| `volume_profile_artifact` | Latest composite meta + pointer to store object |
| `volume_profile_day_shard` | Per day meta + source + pointer |
| `volume_profile_job` | Queue/state |

Hot cache (Redis/in-process) optional; **mounts + catalog** remain durable SoR.

---

## 5. Geometry (frozen before first production bin)

`algo_version` for first production measurement write: **`vp_bins_v3`**  
(carries v0.2 trades-first rules; dual-store pointers; adds §5.5 proxy mapping).

**This section is the remaining gate.** Acquisition is done or in flight; nothing below may be finalized implicitly by code. Each item is frozen in the `algo_version` changelog before the first production bin is written.

### 5.1 Tick size order

1. Universe / Admin tick when set  
2. Vendor reference if consistent  
3. Else fail loud  

### 5.2 Origin + rounding

- `price_origin = 0` unless Admin override  
- **Half-away-from-zero** on `price / tick_size` (v0.2 AT-R5 golden tests)

### 5.3 Trade-condition filter — **the open measurement decision**

- Obtain Massive's **aggregate inclusion rules** (vendor request; their response quality is itself evidence).  
- Reconcile filtered tape sums vs Massive daily bars (AT-R2). **Record the achieved tolerance as evidence** — the tolerance is an output of P2-3, frozen into the changelog, not a hand-waved "within tolerance."  
- Coach then decides: match Massive's convention, or deliberately diverge (e.g. treatment of average-price crosses, derivatively-priced prints, odd lots) — a measurement-meaning decision the vendor cannot make for us.  
- Freeze the final condition list under `algo_version` changelog. Any later change ⇒ VP8 (re-bin only; raw is on disk).

### 5.4 max_n_bins

Config required for prod jobs (starting discussion value `500000` — **must** be config, not silent code default). Note: penny-tick equities over full history land near ~50k bins; record actuals per VP16 so the cap is calibrated.

### 5.5 Proxy price mapping

When `proxy_of` is set (e.g. SPY serving SPX/XSP):

- The artifact declares `price_space ∈ {series, product}` and, if `product`, the **mapping function** (e.g. static multiplier, per-day ratio) with its parameters recorded per shard.  
- Mapping choice is part of frozen geometry (VP8): changing it ⇒ new `algo_version`.  
- Default pending Coach DL (**OD-VP7**): serve in **series** price space with `proxy_of` labeling; product-space mapping only after explicit DL.

---

## 6. Session calendar

Unchanged from v0.2: complete RTH incl. early close; config calendar; watermark only on success; holidays no advance.

**Noted divergence (informative):** coaching-room structural markup is drawn on ES including overnight; this plane is RTH-equity/ETF tape. Members comparing the two will see edge differences. Extended-hours variant is out of scope unless a future OD opens it.

---

## 7. Symbol eligibility + entitlement matrix (probe 2026-08-12)

Eligibility ⊂ enabled universe + volume path. Under VP21, every row below is collected **in full** (all kinds, full depth) unless the entitlement itself refuses.

### 7.1 Native trades + quotes + 1s @ full depth (probe YES)

**SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG, AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT**

SPY trades: **already collected in full** (as-built §0.1). Remaining: SPY quotes + 1s; all other symbols all kinds.

### 7.2 Index products — native tape not entitled

| Product | Native / feed | Trades/quotes | Full-grain path |
|---------|---------------|---------------|-----------------|
| SPX | `I:SPX` | **403** | **Proxy SPY** (labeled, §5.5 mapping law) |
| XSP | `I:XSP` | **403** | **Proxy SPY** (labeled, §5.5 mapping law) |
| VIX | `I:VIX` | **403** | **QUARANTINED** — VIXY tracks short-term VIX futures with roll decay and reverse splits; no valid price mapping to spot VIX exists. No VIX profile ships unless a future OD demonstrates a defensible mapping and a use case. |
| VIX1D | `I:VIX1D` | **403** | **QUARANTINED** — same grounds. |

Probe days: recent **2026-08-11**, ~5y **2021-08-13**. Re-probe before campaign start if plan changes.

**ES note (informative):** ES futures are the doctrine's canonical structure instrument for SPX. Massive entitlement does not cover futures tape; SPY proxy is the considered fallback, not an oversight. Revisit only if a futures data source enters the stack.

### 7.3 Collection order (as-built + campaign)

The v0.3 pilot ladder is **retired** — SPY full-history trades are collected and proven at production scale. The campaign completes the estate:

1. **SPY** — quotes + 1s (trades ✅ as-built)  
2. **QQQ, IWM** + liquid ETFs — all kinds, full depth  
3. Equities — all kinds, full depth  
4. Index products **via labeled SPY proxy** (no separate tape; §4.2 single-store rule)

Order is a convenience for evidence capture, not a gate: nothing waits on anything else except VP15 rate isolation.

---

## 8. Artifact model (binned)

### 8.1 Member / agent payload

Same fields as v0.2 §7.1 plus:

| Field | Law |
|-------|-----|
| `series_ticker` | Massive ticker used for raw (may be proxy) |
| `proxy_of` | Product symbol if series is proxy, else null |
| `price_space` | `series` or `product` per §5.5 |
| `raw_pointer` | URI/path under mount for raw used (or catalog id) |
| `algo_version` | `vp_bins_v3` (first production) |

**Forbidden on measurement payload:** `poc`, `vah`, `val`, `hvn`, `lvn`, `nodes`, `value_area`.

### 8.2 Day shard

As v0.2: per day bins + `source` + geometry fingerprint (now incl. proxy mapping). Shards-as-bins for re-sum without retaining full tape in MySQL (tape remains on mounts under **raw/**).

---

## 9. Chart integration — STAGED

| Status | Law |
|--------|-----|
| **Interim chart** | May keep OHLC client bins with **honest labeling** ("from OHLC window — not measured tick VP") until cutover |
| **Production chart** | Consumes **measured** artifact only; TF gate `1d/4h/1h/30m`; display prefs only |
| **Unblock** | Coach DL or chart-host Spec |

---

## 10. Build pipeline

### 10.1 RAW campaign (full estate)

1. Remaining probes (§11).  
2. Prefer **flat files** when entitled; else paginated REST.  
3. All kinds per VP21: trades, quotes, 1s — full depth per symbol.  
4. Write mount partitions per map; update `market_raw_series` (bytes per kind per mount).  
5. Resume completed days; no re-fetch of good days (proven behavior — record as evidence).  
6. VP15 throttling throughout; the live room is never starved by the campaign.

### 10.2 BIN build

1. For each session day with raw trades (or degrade): filter conditions (§5.3 frozen) → bin → day shard + catalog row.  
2. Composite re-sum rolling 5y → artifact.  
3. Enforce max_n_bins; record actual counts.

### 10.3 Daily

1. Complete session watermark.  
2. Append raw day — **all collected kinds**.  
3. Bin day; roll composite.  
4. VP15 rate isolation.

### 10.4 APIs (after GO)

```
GET  /api/me/market/volume-profile?symbol=&algo_version=&from=&to=
GET  /api/admin/market/raw/status          # per symbol × kind × mount, bytes, watermarks
GET  /api/admin/market/storage/mounts      # mount map, presence, free bytes (VP18)
GET  /api/admin/market/volume-profile/status
POST /api/admin/market/raw/backfill
POST /api/admin/market/volume-profile/rebuild
```

Request path **reads** only — never starts a pull. `algo_version`/date params optional (default latest / full study window) — required for diffing re-bins.

---

## 11. Probes (remaining evidence)

| ID | Probe | Status |
|----|-------|--------|
| P2-1 | Trades depth (SPY) | **RETIRED — as-built.** Record transcript/summary into evidence. |
| P2-2 | Flat-file entitlement | **RETIRED — as-built.** Record what the SPY pull used. |
| **P2-3** | Condition inclusion vs Massive daily volume | **OPEN — the gate.** Output: achieved tolerance + frozen condition list (§5.3). |
| P2-4 | Mount write smoke | **Superseded:** re-run **per mount** as each joins the map (VP17). |
| P2-5 | SPY raw size | **RETIRED — as-built.** Record actual GB; VP18 telemetry replaces budget. |
| **P2-6** | Index 403 still holds | Re-confirm at campaign start. |
| **P2-7** | Rate limits under concurrent symbols × kinds | **OPEN** — quotes streams are denser; verify VP15 holds during full-estate campaign. |
| **P2-8** | Quotes/1s depth spot-check (SPY) | **NEW** — confirm entitled depth for non-trade kinds matches trades before assuming full history. |

Store under `docs/evidence/volume-profile/` or board gate paths.

---

## 12. TV conditioner — **research track (not implementation default)**

### 12.1 What MSC "TV" is

MSC `accumulate_tv` / `tv_microbins_30`: given a **1-minute bar**, split **[low, high]** into **30** steps and assign **volume/30** to each — TradingView-style **estimate from OHLC bars**, not print measurement.

### 12.2 Coach posture (v0.4, unchanged)

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
| **AT-R2** | Session volume vs Massive daily within the **recorded** P2-3 tolerance under frozen conditions |
| **AT-R3** | Resume does not re-download good days |
| **AT-R4** | Proxy labels + `price_space` present for SPX→SPY etc. |
| **AT-R5** | Half-away-from-zero golden vectors |
| **AT-R6** | Multi-tick bar degrade ≠ single-bin typical |
| **AT-R7** | Mapped mount missing → job fail loud (per mount) |
| **AT-R8** | Strategy Lab can open raw day partition — trades, quotes, and 1s (read contract) |
| **AT-R9** | Measurement payload has no POC furniture |
| **AT-R10** | TV mode (if any) cannot be selected as default measurement without DL |
| **AT-R11** | VIX/VIX1D cannot be requested as VP products (quarantine enforced, explicit error) |

---

## 14. Open decisions (Coach)

| ID | Question | Status / default |
|----|----------|------------------|
| **OD-VP1** | Quotes in v1 raw archive? | **CLOSED 2026-08-12 — YES, in full (VP21).** |
| **OD-VP2** | Materialize 1s on mounts vs rebuild from trades? | **CLOSED 2026-08-12 — collect natively, in full (VP21).** |
| **OD-VP3** | Production chart cutover date from OHLC bins | After first symbols measured |
| **OD-VP4** | TV research owner / deadline | Deferred |
| **OD-VP5** | Job host for campaign/daily | Workstation + mounts OK now; production launchd later |
| **OD-VP6** | Raw retention beyond 5y study window | **Default: keep forever** (fleet has room; Strategy Lab wants depth). Confirm at GO. |
| **OD-VP7** | Proxy `price_space` default for SPX/XSP | Default: `series` + labels; product-space mapping needs DL (§5.5) |

---

## 15. Revision history

| Ver | Date | Change |
|-----|------|--------|
| v0.1 | 2026-08-10 | 1m typical-price draft |
| v0.2 | 2026-08-10 | Trades-first; geometry freeze; external review fold |
| v0.3 | 2026-08-12 | Dual Pod store; Strategy Lab raw consumer; entitlement matrix; as-built honesty; TV research track; process restore |
| v0.3.1 | 2026-08-12 | Intermediate review fold (superseded by v0.4 where conflict) |
| **v0.4** | **2026-08-12** | **THE BIG KAHUNA:** full-estate collection (VP21 — all kinds, all symbols, full depth); pilot ladder retired (SPY trades as-built); multi-mount storage map (VP17); budget → telemetry (VP18); proxy price-mapping law (§5.5); VIX/VIX1D quarantine; AT-R2 tolerance recorded not assumed; ODs 1/2 closed, 6/7 opened |

---

## 16. Implementation authority

- **Spec:** this document (v0.4 DRAFT until Coach GO)  
- **Plan:** `docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md` (stable path; **revision field** e.g. v1.1.1 is content authority)  
- **Board:** `agents/p-volume-profile-histogram/`  
- **Gate:** the **RAW campaign** runs on Coach authority now and **must not be halted** solely for W0 paperwork (sha1 / formal GO text) if already in flight; **production bin writes** wait on §5 geometry freeze (condition filter P2-3) + Coach GO.
