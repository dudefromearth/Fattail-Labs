# FatTail Labs — Volume Profile Histogram Spec v0.1

**Status:** **SUPERSEDED** by [v0.2](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_2.md) (trades-first measurement)  
**Date:** 2026-08-10  
**Current revision:** **v0.1** (historical)  
**Canonical filename:** `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0.1.md`  
**Type:** Product + data-plane Spec — **precomputed raw volume-by-price histograms** for agentic analysis and Options Lab chart overlay  

**Short name:** **Volume Profile (VP)** / **VP Histogram**

**As-built surface (chart consumer, when landed):**

| Layer | Path (target) |
|-------|----------------|
| UI | Options Lab → **Volume Profile** app (`/app/options-lab/volume-profile` family) |
| Client | OHLC chart host + VP overlay + appearance prefs |
| API | `GET /api/me/market/volume-profile` (member) · admin rebuild/status |
| Domain | `server/market_data/` VP builder, day shards, artifact store |
| Jobs | Offline backfill + daily increment (launchd on MiniTwo; not request path) |

**Parents / companions (normative where noted):**

| Spec / doc | Role |
|------------|------|
| Admin **`market_symbol_universe`** | Sole product-symbol SoR for eligibility |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe resolution patterns · fail-loud · no MSC |
| [Massive Market Bus Spec v1.0](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Massive discipline · no N-browser Massive; VP **batch** uses Labs Massive client, not Market Bus live path |
| Claude.md / deploy playbook | MiniTwo · launchd · config fail-loud · no MSC |
| Human Interface Spec v1.0 | Member chrome for overlay controls |

**Doctrine:** Standalone repo · **no MSC** · config fail-loud · display never invents demand · evidence over assertion · **raw bins are the analysis SoR** · chart is a consumer of the same artifact.

**Industry note (non-normative):** Professional VP platforms primarily control histogram grain via **ticks-per-level** and bar→price allocation; post-bin kernel smoothing is uncommon in native cores. FatTail **v0.1 stores raw tick bins only**. A future Labs-owned smoother may add a **secondary** series without replacing raw SoR.

---

## 0. Mission

Provide a **versioned, daily-maintained volume-by-price histogram** for each **volume-bearing** universe symbol:

1. Built from **high-granularity** history (target **1-minute** Massive aggs; fallback documented).  
2. Binned at **maximum resolution**: **one bin ↔ one smallest tick** for that symbol.  
3. Stored as **raw** volumes (no POC, value area, HVN/LVN, or other derived structure levels).  
4. Ideal **numerical form for agentic analysis** (geometry + `volumes[]`).  
5. Same artifact **optionally drawn** on Options Lab Volume Profile candles when bar period is **Day · 4h · 1h · 30m**, with member controls for **color · opacity · width scale (25–100%)**.

**What this is not:** Market Profile / TPO; POC-VA trading furniture; MSC heatmaps; live recompute of multi-year minutes on every chart load; a substitute for OHLC candles.

---

## 1. Laws

| ID | Law |
|----|-----|
| **VP1 — Raw SoR** | The system of record for analysis is the **raw** tick-resolution volume histogram. Smoothing, if added later, **must not** overwrite or omit raw volumes in the stored artifact agents read. |
| **VP2 — One bin per tick** | `bin_step ≡ tick_size` (symbol’s **smallest** lawful price increment). **Forbidden:** multi-tick aggregation in the SoR artifact to “save space” or “look smoother.” |
| **VP3 — No structure furniture** | Artifacts, APIs, and v1 chart chrome **must not** compute, store, or require **POC, value area (VAH/VAL), HVN, LVN, or named volume nodes**. Agents may invent structure **downstream** of raw bins; the platform does not materialize it. |
| **VP4 — Universe SoR** | Eligible product symbols are a subset of **enabled** `market_symbol_universe` rows that pass **volume eligibility** (VP5). No parallel hard-coded symbol list. |
| **VP5 — Volume eligibility** | Only symbols with **usable traded volume** on the Massive path used for binning. Indexes without real volume **must not** silently use a proxy ETF’s volume as if it were the index (fail loud or explicit Admin policy — see §3). |
| **VP6 — Offline build** | Multi-year minute history is processed only by **batch jobs**. Member request handlers and the browser **must not** pull full study windows of 1m bars to build VP on demand. |
| **VP7 — Daily maintain** | After each completed market session (watermark), eligible artifacts are **incremented** for that session and, for rolling studies, **roll off** expired session contribution. Watermark advances only on successful complete-session apply. |
| **VP8 — Fixed geometry** | For a given `(symbol, algo_version)`, tick size, price origin, and index formula are **stable**. Tick-size or formula change ⇒ **new `algo_version` + full rebuild**. |
| **VP9 — Chart TF gate** | Member chart overlay is shown **only** when OHLC bar period ∈ {`1d`, `4h`, `1h`, `30m`}. **Not** on `10m` or `5m`. |
| **VP10 — Display prefs only** | Member-facing VP chrome controls are exactly: **color**, **opacity**, **width scale (25%–100% of plot width)**. No analysis toggles in v1. |
| **VP11 — Same artifact for agents** | Agentic tools and the chart **read the same** cached histogram (geometry + volumes + metadata). Agents **must not** be forced to re-fetch multi-year minutes. |
| **VP12 — No MSC** | No MarketSwarm-Canonical imports, heatmap builders, or MSC Redis VP schemas. |
| **VP13 — Fail loud** | Missing Massive entitlement, missing tick size, empty eligibility, or failed build → explicit job/API error state — not a silent empty profile presented as healthy. |
| **VP14 — Config fail-loud** | Job schedules, Massive credentials, DB, and lookback years come from config/env — no silent defaults for secrets or production hosts. |

---

## 2. Study definition

| Parameter | v0.1 law | Notes |
|-----------|----------|--------|
| **Study window** | **Rolling 5 calendar years** ending at last completed session in the artifact | `study_start` / `study_end` recorded on artifact |
| **Source grain** | Prefer Massive **1-minute** aggregates with volume | If 1m unavailable/sparse for a symbol, **5m** is lawful degrade; `source_tf` must record actual grain |
| **Session filter** | **RTH (regular trading hours)** only for equities/ETFs unless Admin later extends | Extended-hours policy is a future OD; v0.1 = RTH |
| **Volume field** | Aggregate bar **volume** (`v`); skip bars with null/zero volume | Trade-count-only mode out of v0.1 |
| **Price for bin assignment** | **Typical price** `p = (high + low + close) / 3` | Single freeze; not close-only; not range-spread allocation in v0.1 |
| **Allocation** | Entire bar volume assigned to the **single tick bin** containing `p` | No proportional spread across H–L in v0.1 (document as future option) |

---

## 3. Symbol eligibility

### 3.1 Include (default)

Enabled universe rows where **all** hold:

1. `enabled = 1`  
2. `kind` ∈ {`equity`, `etf`} **or** Admin-flagged futures with real volume (v0.1 pilot may limit to equity/etf)  
3. Massive returns **positive volume** on recent 1m (or 5m) samples for the **feed** ticker used for OHLC/VP  
4. A resolvable **`tick_size`** (see §4)

### 3.2 Exclude / special cases

| Case | Law |
|------|-----|
| Pure index product with **no** real volume (e.g. `I:SPX` tape) | **Not** auto-eligible. Do **not** silently substitute SPY volume as “SPX VP.” Optional later: Admin `vp_mode = proxy_feed` with explicit `vp_feed_symbol` and UI/agent label that volume is from the proxy feed. |
| `enabled = 0` | Out |
| Zero volume systematically | Job marks `skipped_no_volume`; no fake artifact |

### 3.3 Pilot list (implementation order)

Jobs **must** support prioritization. **v0.1 pilot:** `SPY`, `QQQ`, then remaining eligible universe by Admin `sort_order`.

Optional Admin column (recommended migration): `vp_enabled TINYINT` default 1 for equity/etf pilot — allows staging without disabling the symbol for chains.

---

## 4. Tick size and bin geometry

### 4.1 Tick size resolution (strict order)

1. Admin / universe field **`tick_size`** when set and valid (`> 0`).  
2. Vendor reference (Massive ticker details) when available and consistent.  
3. Else **fail loud** for that symbol’s VP job — **do not** invent a coarser step.

US equity/ETF default when Admin explicitly sets policy for “standard listed” names: **`0.01`** is lawful **only** when recorded as Admin/default policy, not silent code guess without artifact metadata.

### 4.2 Index formula (frozen)

```
tick_size  = symbol tick
price_origin = 0   # v0.1 default; must be stored on artifact
bin_index(p) = round(p / tick_size)    # half-away-from-zero or bankers — implementer freezes one + golden tests
price(i)     = i * tick_size           # when origin = 0
```

If `price_origin ≠ 0`:

```
bin_index(p) = round((p - price_origin) / tick_size)
price(i)     = price_origin + i * tick_size
```

**Law:** Same formula for backfill and daily increment.

### 4.3 Storage shape

Prefer **dense** array over the **traded range** for the study:

| Field | Meaning |
|-------|---------|
| `min_price` | `price(min_index)` of first bin in array |
| `tick_size` | step |
| `volumes[i]` | raw volume at `min_price + i * tick_size` |
| `n_bins` | `len(volumes)` |

Zeros inside the min–max traded span are kept (stable indexing for agents).  
**Do not** allocate from $0 to infinity.

Sparse map `index → volume` is an allowed **internal** day-shard format; the **member/agent API** v0.1 serves dense `min_price + volumes[]` for simplicity.

### 4.4 Algo version

| Field | Example | When to bump |
|-------|---------|--------------|
| `algo_version` | `vp_bins_v1` | Index formula, typical-price rule, session filter, study years policy, allocation rule |

---

## 5. Artifact model

### 5.1 Analysis / API payload (normative)

```json
{
  "ok": true,
  "symbol": "SPY",
  "series_ticker": "SPY",
  "algo_version": "vp_bins_v1",
  "source_tf": "1m",
  "tick_size": 0.01,
  "price_origin": 0,
  "min_price": 350.12,
  "n_bins": 18240,
  "volumes": [0, 1204.0, 980.0],
  "total_volume": 1.23e12,
  "study_start": "2021-08-11",
  "study_end": "2026-08-08",
  "as_of_session": "2026-08-08",
  "session_filter": "rth",
  "built_at": "2026-08-10T02:15:00Z",
  "complete": true
}
```

**Forbidden keys in v0.1 API:** `poc`, `vah`, `val`, `hvn`, `lvn`, `nodes`, `value_area`, `smoothed_volumes` (unless a later Spec adds optional smooth as **additive** fields).

### 5.2 Persistence (MySQL SoR)

| Table | Purpose |
|-------|---------|
| **`volume_profile_artifact`** | Latest good composite per `(symbol, algo_version)` — JSON/BLOB volumes + scalar metadata |
| **`volume_profile_day_shard`** | Per `(symbol, algo_version, session_date)` day histogram (sparse or compressed) for incremental maintain |
| **`volume_profile_job`** | Queue/state: `pending` · `running` · `ok` · `fail` · `skipped_*`; last error; timestamps; priority |

**Day shards are required** for honest rolling 5y maintenance without full re-download every day.

### 5.3 Optional hot cache

In-process TTL and/or Redis key  
`vp:artifact:{symbol}:{algo_version}`  
invalidated when job writes a new `as_of_session`. **Not** a substitute for MySQL SoR.

---

## 6. Build pipeline

### 6.1 Backfill (symbol first enable / rebuild)

1. Claim job for symbol.  
2. Resolve feed ticker (`feed_symbol` if equity/etf path uses it; else product symbol).  
3. Resolve `tick_size` (VP fail if missing).  
4. Pull study window of **1m** (or degrade **5m**) RTH bars via Labs `MassiveClient` with pagination; rate-limit globally.  
5. For each session day: bin → write **day shard**.  
6. Sum shards in window → composite → write **artifact**.  
7. Mark job `ok` with `as_of_session` = last complete session included.  
8. On failure: `fail` + error text; leave prior good artifact intact if any.

**Resume:** Day shards allow restart mid-symbol without discarding completed days.

### 6.2 Daily increment

Trigger: schedule after US equity session is complete (config; e.g. post-close ET window on MiniTwo launchd).

For each eligible symbol where `artifact.as_of_session < last_complete_session`:

1. Fetch **only** missing complete session day(s) of 1m (5m) RTH data.  
2. Build/upsert day shard(s).  
3. Drop/ignore shards older than rolling window start.  
4. Re-sum remaining shards → write artifact.  
5. Advance `as_of_session`.  
6. Invalidate hot cache.

**Partial day / holiday:** do not advance watermark for that symbol.

### 6.3 Concurrency

- Global cap on concurrent Massive-heavy VP jobs (config; start at 1–2).  
- Priority: pilot symbols first.

### 6.4 Request path ban

`GET /api/me/market/volume-profile` **reads** artifact only.  
**404** if never built; **409/503** with status if desired for “building” — never starts a 5y pull inline.

---

## 7. APIs

### 7.1 Member read

```
GET /api/me/market/volume-profile?symbol=SPY
```

| Status | Meaning |
|--------|---------|
| **200** | Artifact payload (§5.1) |
| **401/403** | Same tool-member gate as other market tools |
| **404** | Not eligible, never built, or disabled |
| **422** | Unknown / disabled universe symbol |
| **503** | SoR unavailable |

Access: `require_session` + `_require_tool_member(capability="read")` (same matrix as OHLC / chain ladder).

### 7.2 Admin (v0.1 minimum)

```
GET  /api/admin/market/volume-profile/status
POST /api/admin/market/volume-profile/rebuild?symbol=SPY
```

Administrator role only. Rebuild enqueues job; does not block on completion.

### 7.3 Agent / internal tools

Agents consume **the same 200 payload** via member API or an internal server tool that reads MySQL artifact.  
Tool description must state: **raw tick bins only; no platform POC/VA.**

---

## 8. Chart integration (Options Lab Volume Profile)

### 8.1 When to load overlay

| OHLC bar period (`tf`) | VP overlay |
|------------------------|------------|
| `1d`, `4h`, `1h`, `30m` | **Load** artifact and draw |
| `10m`, `5m` | **Do not** request / draw VP |

### 8.2 Drawing

- Horizontal bars at each bin’s price (or decimated **for paint only** if pixel density requires — see VP10/VP1).  
- Bar length:  
  `width_i = (volumes[i] / max(volumes)) * width_scale * plot_width`  
  with `width_scale ∈ [0.25, 1.0]`.  
- Fill: member **color** × **opacity**.  
- **Paint decimation** (merge adjacent bins only for drawing) is allowed if and only if it does **not** change the artifact used by agents or the values shown as SoR.

### 8.3 Member controls (v1 complete set)

| Control | Range / type | Persistence |
|---------|----------------|-------------|
| **Color** | Color picker | Session or local prefs (with chart appearance) |
| **Opacity** | 0–100% (or 0–1) | same |
| **Width scale** | **25% – 100%** of plot width for the peak bin | same |

No other VP analysis controls in v0.1.

### 8.4 Missing artifact UX

Honest empty/disabled state: “Volume profile not ready for this symbol” — not a blank fake histogram.

---

## 9. Smoothing (future — non-normative for v0.1 build)

| v0.1 | Future |
|------|--------|
| **Raw only** | Optional Labs-owned smoother may emit `volumes_smooth` **alongside** raw |
| Agents use raw | Agents may opt into smooth via explicit field / version |
| No kernel required to ship | Spec amendment + golden tests before any smooth becomes default for UI |

---

## 10. Out of scope (v0.1)

- POC, value area, HVN/LVN, TPO/Market Profile  
- Bid/ask delta profiles, footprint  
- Live developing session profile as the multi-year SoR  
- Forex tick-volume fiction  
- MSC / MarketSwarm code  
- Request-time multi-year Massive pulls  
- Overlay on 5m/10m charts  

---

## 11. Implementation phases

| Phase | Deliverable | Exit criteria |
|-------|-------------|----------------|
| **P0** | This Spec DRAFT review | Geometry + eligibility + API shape agreed |
| **P1** | Migrations: artifact, day_shard, job (+ optional `tick_size` / `vp_enabled` on universe) | Migrate clean on Labs DB |
| **P2** | Offline builder: SPY 5y → shards → artifact | Artifact loadable; bar count / total volume sanity; timing recorded |
| **P3** | Daily incrementer + launchd | One session advances `as_of_session` without full rebuild |
| **P4** | Universe roll-out (eligible symbols) | Queue + status admin; rate limits |
| **P5** | Member GET + chart overlay + color/opacity/width | Visible on Day/4h/1h/30m only; prefs persist |
| **P6** | Agent tool wiring (if not using GET alone) | Same payload; documented |

---

## 12. Acceptance tests (normative sketches)

| ID | Test |
|----|------|
| **AT-VP1** | SPY artifact `tick_size` matches resolved tick; `price(i+1) - price(i) == tick_size` for dense indices |
| **AT-VP2** | No POC/VA/nodes keys in 200 JSON |
| **AT-VP3** | GET does not call Massive for full study (instrument or mock: zero aggs on read path) |
| **AT-VP4** | After daily job, `as_of_session` advances; total_volume increases only by new session contribution (within tolerance) |
| **AT-VP5** | Rolling window: day older than 5y no longer in composite sum |
| **AT-VP6** | Chart: VP fetch only for `1d|4h|1h|30m`; not for `5m|10m` |
| **AT-VP7** | Width scale 25% vs 100% changes peak bar pixel width; volumes unchanged |
| **AT-VP8** | Index with no volume: no silent SPY-as-SPX artifact without explicit policy |
| **AT-VP9** | `algo_version` bump requires rebuild; old version readable until purged |

---

## 13. Ops

| Item | Law |
|------|-----|
| Host | MiniTwo (prod Labs) / local for dev |
| Supervision | launchd units for daily VP job (not MSC Node Admin) |
| Logs | Job id, symbol, session, bars in, duration, error |
| Massive | Shared client credentials; fail loud if missing |
| Monitoring | Artifact age vs last session; fail count; queue depth |

---

## 14. Open decisions (resolve before P2 if possible)

| # | Topic | Default if silent |
|---|--------|-------------------|
| OD1 | RTH calendar source (exchange calendar vs session times config) | Config session times matching OHLC RTH |
| OD2 | Admin `tick_size` column vs vendor-only | Prefer Admin column |
| OD3 | Index proxy VP policy | **Off** until explicit Admin mode |
| OD4 | Study years 5 vs config | Config default 5, max 5 for v0.1 |
| OD5 | Agent auth path (member GET vs internal tool) | Member GET sufficient for v0.1 |

---

## 15. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1** | 2026-08-10 | Initial DRAFT: raw tick bins, 5y study, day shards, daily maintain, chart controls color/opacity/width 25–100%, no structure furniture, agent SoR = raw histogram |

**Ratification:** Coach / product owner marks Status **RATIFIED** and records content hash when P0 closes.

---

## 16. One-line law

**Raw, tick-resolution, multi-year volume-by-price bins — cached and session-maintained — for agents and for Day/4h/1h/30m chart paint with color, opacity, and width scale only.**
