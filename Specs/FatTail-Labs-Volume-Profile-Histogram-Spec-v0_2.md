# FatTail Labs — Volume Profile Histogram Spec v0.2

**Status:** **SUPERSEDED** by [v0.3](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_3.md) (2026-08-12)  
**Date:** 2026-08-10  
**Current revision:** **v0.2** (historical)  
**Supersedes:** [v0.1](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0.1.md) (1m typical-price allocation replaced by **trades-first measurement**)  
**Canonical filename:** `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_2.md`  
**Type:** Product + data-plane Spec — **precomputed raw volume-by-price histograms** for agentic analysis and (staged) chart overlay  

> **Use v0.3 for all new work.** v0.3 adds dual Pod store, Strategy Lab raw consumer, entitlement matrix, as-built honesty, and TV research track.  

**Short name:** **Volume Profile (VP)** / **VP Histogram**

**Content hash (v0.2):** recompute at Coach GO / amend:  
`shasum -a 1 Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_2.md` → record in DL (self-hash of file including this line is unstable; gate report owns the cited digest).

**External review folded:** Claude advisor review 2026-08-10 (R1–R9). Disposition: all **[BLOCKING]** items incorporated as law; **[ADVISORY]** incorporated where they strengthen evidence/hygiene.

---

## 0. Mission

Provide a **versioned, daily-maintained volume-by-price histogram** for each **volume-bearing** universe symbol:

1. Built from the **smallest interval the data path serves** — **trades (prints) are the source of record** when entitled; degrade only when trades are unserved (see §2).  
2. Binned at **maximum resolution**: **one bin ↔ one smallest tick** for that symbol — and, under the trades path, **informationally** true (each print’s exact price contributes size to that tick).  
3. Stored as **raw** volumes (no POC, value area, HVN/LVN, or other derived structure levels).  
4. Ideal **numerical form for agentic analysis** (geometry + `volumes[]` + **method / source honesty**).  
5. Same artifact may be drawn on the Volume Profile chart when bar period is **Day · 4h · 1h · 30m**, with member controls for **color · opacity · width scale (25–100%)** — **§8 staged** pending chart-host surface Spec (R6).

**What this is not:** Market Profile / TPO; POC-VA furniture; MSC heatmaps; live recompute of multi-year history on every chart load; an **estimate** silently labeled as measurement.

**Cost (recorded; not reopened without Coach):** Artifact size is dominated by tick span (~tens of thousands of bins for liquid ETFs), not by trade count. One-time backfill acquisition is the cost (paginated REST tens of minutes/symbol; flat files preferred when entitled — §11). Daily increment = one session of prints. Accepted.

---

## 0.1 Surface naming (as-built vs catalog)

| Name in this Spec | Meaning |
|-------------------|---------|
| **Volume Profile app / chart** | Member chart surface that may overlay the histogram |
| **Route family** | As-built `/app/options-lab/*` — **working string only** |
| **“Options Lab”** | **As-built card/route string**, not catalog ratification, until Coach + Echo settle **OD-nav** with an explicit DL entry (same posture as Market Bus Spec §0.2). This Spec **must not** silently ratify the suite name. |

---

## 1. Parents / companions

| Spec / doc | Role |
|------------|------|
| Admin **`market_symbol_universe`** | Sole product-symbol SoR for eligibility |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe resolution · fail-loud · no MSC (**dependency:** Picker v1.0.2 / OC6a must land as cited; track in program board) |
| [Massive Market Bus Spec v1.0](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Live path priority; VP batch **must not** starve bus feeds (VP15) |
| **Chart-host surface Spec** | **Required before §8 is implementation-mandatory** — until landed, §8 is **staged-pending-chart-spec** (R6) |
| Claude.md / deploy playbook | MiniTwo · launchd · config fail-loud · no MSC |
| Human Interface Spec v1.0 | Member chrome for overlay controls (when §8 unblocked) |

**Doctrine:** Standalone repo · **no MSC** · config fail-loud · evidence over assertion · **raw measured bins are the analysis SoR** · chart is a consumer of the same artifact.

---

## 2. Laws

| ID | Law |
|----|-----|
| **VP1 — Raw SoR** | Analysis SoR is the **raw** tick-resolution volume histogram. Future smoothing **must not** overwrite or omit raw volumes agents read. |
| **VP2 — One bin per tick (geometry + information)** | `bin_step ≡ tick_size`. **Forbidden:** multi-tick aggregation in the SoR artifact. Under **trades** source, each print maps to the tick of its **exact trade price** — geometry and information content align. |
| **VP2a — Trades-first measurement** | **Trades (prints) are the source of record.** Histogram construction is a **measurement**: `bin_index(trade.price) += trade.size`. No typical-price or single-bin bar allocation on the trades path. |
| **VP2b — Degrade ladder (documented, never silent)** | When trade history is **genuinely unserved** for a symbol or date range, degrade in order: **1-second aggregates → 1-minute aggregates**. At **any bar grain**, volume **must** use **proportional H–L range spread** across ticks in `[low, high]`. **Single-bin typical-price (or close-only) allocation is forbidden at every rung.** |
| **VP2c — Source honesty** | Every **day shard** records `source ∈ {"trades","1s","1m"}`. The **composite artifact** exposes source mix (counts of sessions or days per source). API/agent payload includes `method` (`per_trade` when all shards trades; else `mixed` / `per_bar_spread`). Consumers must not guess measurement vs estimate. |
| **VP3 — No structure furniture** | No POC, value area (VAH/VAL), HVN, LVN, or named nodes in artifact, API, or v1 chart chrome. Agents derive structure **downstream** of raw bins. |
| **VP4 — Universe SoR** | Eligible symbols ⊂ enabled `market_symbol_universe` passing VP5. No parallel hard-coded list. |
| **VP5 — Volume eligibility** | Usable traded volume on the Massive path used for binning. Indexes without real volume **must not** silently use proxy ETF volume as the index. |
| **VP6 — Offline build** | Multi-year history is processed only by **batch jobs**. Request handlers and browsers **must not** pull full study windows to build VP on demand. |
| **VP7 — Daily maintain** | After each **complete** session (watermark, including early-close days — §5), increment; rolling window rolls off expired shards. Watermark advances only on successful apply. |
| **VP8 — Fixed geometry** | For `(symbol, algo_version)`, tick size, origin, index formula, trade-condition filter, and session rules are stable. Any change ⇒ **new `algo_version` + full rebuild**. |
| **VP9 — Chart TF gate** | Overlay only when OHLC `tf` ∈ {`1d`,`4h`,`1h`,`30m`}. Not on `10m`/`5m`. (**§8 staged** — law holds when chart lands.) |
| **VP10 — Display prefs only** | Chrome: **color**, **opacity**, **width scale 25–100%**. No analysis toggles. |
| **VP11 — Same artifact for agents** | Agents and chart read the same cached histogram + method/source metadata. |
| **VP12 — No MSC** | No MarketSwarm-Canonical VP/heatmap code or MSC Redis schemas. |
| **VP13 — Fail loud** | Missing entitlement, tick size, eligibility, `max_n_bins` breach, or failed build → explicit job/API state — not a silent healthy-looking empty profile. |
| **VP14 — Config fail-loud** | Schedules, credentials, DB, lookback, `max_n_bins`, rate caps from config — no silent secrets/hosts. |
| **VP15 — Rate isolation from live** | VP backfill/daily jobs use a **dedicated global concurrency/rate cap** and **defer to live Market Bus / chain / sym feed priority**. Multi-symbol rebuild **must not** starve live paths. Holds even when flat files make contention rare. |
| **VP16 — max_n_bins guard** | Config `max_n_bins`. If `(max_traded_tick_index - min_traded_tick_index + 1) > max_n_bins` for the study range, job ends **`skipped_bins_exceeded`** — **no artifact written**. |

---

## 3. Study definition

| Parameter | v0.2 law |
|-----------|----------|
| **Study window** | Rolling **5 calendar years** ending at last complete session in the artifact |
| **Source of record** | **Trades (prints)** — per-print binning |
| **Degrade (only if trades unserved)** | `1s` aggs → `1m` aggs; **H–L proportional spread only**; never single-bin typical price |
| **Session filter** | **RTH** for equities/ETFs per §5 calendar (v0.2); extended hours future OD |
| **Volume** | Trade size / bar volume as applicable; zero/null skipped |
| **Trades path price** | **Exact trade price** (print price) |
| **Bar-grain path allocation** | Spread bar volume across ticks overlapping `[low, high]` proportional to overlap (or uniform per tick in range if tick-aligned); **AT-R6** enforces non-single-bin when range spans >1 tick |

### 3.1 Per-print algorithm (SoR)

```
for each included trade in session:
    i = bin_index(trade.price)   # §4, half-away-from-zero
    volumes[i] += trade.size
```

No allocation heuristic. Measurement.

### 3.2 Bar-grain degrade algorithm (estimate)

For each RTH bar with volume `v > 0` and `high >= low`:

1. Enumerate tick indices from `bin_index(low)` through `bin_index(high)` (inclusive, after freeze rules for edges).  
2. If only one tick: assign all `v` to that tick.  
3. If multiple ticks: distribute `v` **proportionally** across those ticks (equal weight per tick in v0.2 unless Massive bar provides finer path — equal-per-tick is the freeze; document in `algo_version`).  
4. **Forbidden:** assign all `v` to `(H+L+C)/3` or close alone when the bar spans multiple ticks.

### 3.3 Degrade logging

If any day in the study used degrade, composite `method` is not pure `per_trade`. Prefer maximizing trade days; do not silently fill gaps with 1m without shard `source` metadata.

---

## 4. Geometry (fully frozen before first pull)

**Law:** Geometry below is frozen for `algo_version = vp_bins_v2` (trades-first). Changing any item requires a new version and full re-download.

### 4.1 Tick size resolution (order)

1. Admin / universe **`tick_size`** when set and `> 0`.  
2. Vendor reference when available and consistent.  
3. Else **fail loud** — no silent coarse step.

### 4.2 Price origin

`price_origin = 0` for v0.2 unless Admin sets a non-zero origin (stored on artifact).

### 4.3 Rounding rule (**frozen**)

**Half-away-from-zero** on the scaled integer:

```
# tick_size > 0
scaled = price / tick_size
# half-away-from-zero: floor(|x| + 0.5) * sign(x)
bin_index = sign(scaled) * floor(abs(scaled) + 0.5)
price(i)  = price_origin + i * tick_size   # origin 0 ⇒ i * tick_size
```

**Golden tests (normative):** exact-half boundaries (e.g. values that land on `*.5` in scaled space) bin identically in backfill and daily increment (AT-R5). Cover tick 0.01 and any subpenny tick used in universe.

### 4.4 Dense range + max_n_bins

- Dense array from min traded tick index through max traded tick index in the study (zeros inside span kept).  
- `n_bins = max_index - min_index + 1`.  
- If `n_bins > max_n_bins` (config) → **`skipped_bins_exceeded`**, no artifact.

Recommended config starting point (not a silent code default for production without config file): `max_n_bins = 500000` — Coach may set lower; must be present in config for prod jobs.

### 4.5 Trade-condition filter (**frozen under algo_version**)

Trades carry condition codes (regular, odd lot, out-of-sequence, correction, cancel, etc.).

| Rule | Law |
|------|-----|
| **Inclusion set** | Follow the **same inclusion set Massive uses for its own aggregate daily volume** for that symbol, so session VP totals can reconcile to Massive daily bar volume within stated tolerance (AT-R2). |
| **Implementation** | Document the concrete condition allow/deny list in code + Spec appendix when Massive docs/API are confirmed at P2 probe; freeze list text in `algo_version` changelog. |
| **Cancels / corrections** | As Massive aggregate policy; if ambiguous, prefer **exclude** cancels and apply corrections per vendor semantics — record choice at probe. |

Until the P2 probe files the exact list, implementers **must not** invent an ad-hoc filter that systematically diverges from Massive daily volume.

### 4.6 Algo version

| Field | v0.2 value |
|-------|------------|
| `algo_version` | **`vp_bins_v2`** (trades-first; half-away-from-zero; H–L spread degrade; condition filter per Massive aggregates) |

v0.1 `vp_bins_v1` (1m typical-price) is **superseded** and must not be the production write path.

---

## 5. Session calendar (OD1 resolved for v0.2)

| Rule | Law |
|------|-----|
| **Complete session** | A US equity/ETF **RTH session that has ended**, including **early-close half days** (e.g. 1:00 pm ET close), counts as a **complete session** for watermark purposes — **not** partial. |
| **Calendar source** | Config-driven exchange calendar (or equivalent session table) covering **regular closes, early closes, full holidays, and DST transitions**. |
| **Watermark** | `as_of_session` = last session date successfully applied. Do not advance on incomplete downloads. |
| **Holiday** | No shard; no watermark advance. |

---

## 6. Symbol eligibility

Unchanged in spirit from v0.1:

- Enabled universe · volume-bearing · resolvable tick_size.  
- Equity/ETF pilot; indexes without real volume excluded unless explicit Admin proxy-VP mode (labeled; not silent).  
- Pilot order: **SPY, QQQ**, then `sort_order`.  
- Optional `vp_enabled` column for staging.

---

## 7. Artifact model

### 7.1 Member / agent payload (normative)

```json
{
  "ok": true,
  "symbol": "SPY",
  "series_ticker": "SPY",
  "algo_version": "vp_bins_v2",
  "method": "per_trade",
  "sources": { "trades": 1258, "1s": 0, "1m": 2 },
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

| Field | Law |
|-------|-----|
| `method` | `per_trade` if all contributing days `source=trades`; `mixed` if any degrade; `per_bar_spread` if no trade days |
| `sources` | Counts of **session days** (or shards) per source grain |
| Forbidden | `poc`, `vah`, `val`, `hvn`, `lvn`, `nodes`, `value_area` |

Agent tool description **must** state method and that bins are raw tick volumes (measured or spread-estimated per `sources`).

### 7.2 Day shard

| Field | Required |
|-------|----------|
| `symbol`, `algo_version`, `session_date` | yes |
| `source` | `trades` \| `1s` \| `1m` |
| `tick_size`, geometry fingerprint | yes |
| Binned volumes for that day (sparse OK) | yes |
| `total_volume` | yes |
| `trade_count` / `bar_count` | recommended |

**Shards-as-bins** is normative (R7): under trades-first, shards store **bins**, not raw tape, for incremental composite re-sum. Re-binning requires re-pull only if geometry/`algo_version` changes.

### 7.3 Tables

| Table | Purpose |
|-------|---------|
| `volume_profile_artifact` | Latest composite per `(symbol, algo_version)` |
| `volume_profile_day_shard` | Per session day bins + `source` |
| `volume_profile_job` | Queue/state including `skipped_bins_exceeded`, `skipped_no_volume`, `fail`, … |

### 7.4 Hot cache

Optional Redis/in-process; invalidate on new `as_of_session`. MySQL remains SoR.

---

## 8. Chart integration — **STAGED (pending chart-host Spec)**

**Status:** §8 is **not implementation-mandatory** until a (minimal) **chart-host surface Spec** exists or Coach explicitly unblocks VP overlay against as-built Volume Profile OHLC without a separate Spec (DL entry).

When unblocked, law:

| Item | Law |
|------|-----|
| TF gate | `1d`, `4h`, `1h`, `30m` only |
| Controls | Color, opacity, width scale **25–100%** of plot width for peak bin |
| Paint | `width_i = (v_i / max_v) * width_scale * plot_width` |
| Decimation | Paint-only merge allowed; **must not** alter agent SoR artifact |
| Missing | Honest “not ready” — no fake histogram |

This Spec **does not** create the chart product by side-door (R6).

---

## 9. Build pipeline

### 9.1 Backfill

1. **P2 probes first** (§11) — file transcripts before production-scale pull.  
2. Prefer **flat-file / bulk historical trades** when entitled; else paginated REST trades.  
3. Per session day: fetch → filter conditions → bin → write shard with `source`.  
4. Resume from completed shards; **do not re-fetch** completed days (AT-R3).  
5. Sum window → artifact with `sources` mix + `method`.  
6. Enforce `max_n_bins` before write.

### 9.2 Daily increment

1. Determine last complete session (early closes = complete).  
2. For each eligible symbol behind watermark: one session of **trades** (or degrade with honesty).  
3. Upsert shard; drop shards outside rolling 5y; re-sum; write artifact.  
4. Rate-limit under VP15.

### 9.3 Request path

GET reads artifact only — never starts multi-year acquisition.

---

## 10. APIs

### 10.1 Member

```
GET /api/me/market/volume-profile?symbol=SPY
```

200 → §7.1 payload · 404 never built · 422 unknown symbol · same tool-member gate as OHLC.

### 10.2 Admin

```
GET  /api/admin/market/volume-profile/status
POST /api/admin/market/volume-profile/rebuild?symbol=SPY
```

Enqueue only; administrator role.

---

## 11. P2 probes (blocking evidence — R3)

Before production multi-year backfill is declared done, file **transcripts** (not assertions):

| Probe | Evidence |
|-------|----------|
| **Trade-history depth** | Transcript proving Massive serves **trades** back to `study_start` (~5y) for pilot symbol(s) on the entitled plan |
| **Flat-file access** | Transcript whether bulk/flat-file historical trades are included; if yes, **backfill prefers flat files**; REST remains lawful fallback |

Store under `docs/evidence/` or agents board path as program dictates; gate report cites paths.

---

## 12. Rate isolation (VP15 detail)

| Control | Law |
|---------|-----|
| `vp_job_max_concurrent` | Config; start low (1–2) |
| `vp_job_max_requests_per_minute` | Config; separate from live feed budget |
| Priority | Live chain/sym/bus feeds **win** under contention |
| Flat files | Preferred for backfill; law still applies to any REST fallover |

---

## 13. Smoothing (future)

v0.2: **raw only**. Future Labs smoother = additive series + Spec amend; never replaces measured raw SoR.

---

## 14. Out of scope (v0.2)

- POC / VA / HVN / LVN / TPO  
- Bid-ask delta profiles, footprint as VP SoR  
- Silent proxy volume for indexes  
- Request-time multi-year pulls  
- Implementing §8 before chart-host Spec / Coach unblock  
- Single-bin typical-price allocation at any source grain  

---

## 15. Implementation phases

| Phase | Deliverable | Exit criteria |
|-------|-------------|----------------|
| **P0** | Spec v0.2 DRAFT review | Trades-first + geometry freeze accepted |
| **P1** | Migrations (artifact, day_shard with `source`, job, optional tick_size / vp_enabled, config keys) | Migrate clean |
| **P2** | Probes (§11) + offline SPY builder trades→shards→artifact | Transcripts filed; SPY artifact `method=per_trade` (or honest mix); AT-R1–R5 sample |
| **P3** | Daily incrementer + launchd | Early-close day advances watermark; AT-R3 resume |
| **P4** | Eligible universe roll-out under VP15 caps | Queue + admin status |
| **P5** | Member GET (+ agent tool if needed) | Payload honesty fields present |
| **P6** | Chart overlay | **Only after** chart-host Spec or Coach DL unblock of §8 |

---

## 16. Acceptance tests

### 16.1 Carried from v0.1 (adjusted)

| ID | Test |
|----|------|
| **AT-VP1** | `tick_size` consistent; adjacent dense prices differ by `tick_size` |
| **AT-VP2** | No POC/VA/nodes keys in 200 JSON |
| **AT-VP3** | GET does not acquire multi-year trades/aggs |
| **AT-VP4** | Daily job advances `as_of_session` on complete sessions including early close |
| **AT-VP5** | Rolling window drops shards older than 5y from composite |
| **AT-VP6** | (When §8 live) VP only for `1d|4h|1h|30m` |
| **AT-VP7** | (When §8 live) Width scale changes paint only |
| **AT-VP8** | Index without volume: no silent proxy artifact |
| **AT-VP9** | `algo_version` bump requires rebuild |

### 16.2 Review additions (R8)

| ID | Test |
|----|------|
| **AT-R1** | Trade-built shard has `source: "trades"`; degrade shard records actual grain; composite exposes `sources` mix |
| **AT-R2** | Session shard `total_volume` ≈ Massive daily bar volume for that session within **stated tolerance** (trade-condition filter validation) |
| **AT-R3** | Backfill interrupted mid-symbol resumes from completed shards; completed days not re-fetched |
| **AT-R4** | Symbol exceeding `max_n_bins` → `skipped_bins_exceeded`; no artifact written |
| **AT-R5** | Rounding golden tests: exact-half prices bin per half-away-from-zero; identical in backfill and increment |
| **AT-R6** | Bar-grain degrade only: multi-tick range distributes volume; single-bin output for multi-tick bar is **failure** |

---

## 17. Ops

| Item | Law |
|------|-----|
| Host | MiniTwo prod / local dev |
| Jobs | launchd; separate from MSC |
| Logs | job id, symbol, session, source, trade/bar counts, duration, error, n_bins |
| Monitoring | Artifact age, fail/`skipped_*` counts, queue depth, Massive error rate, live-path deferral events |

---

## 18. Open decisions — explicit Accept / Override

Ratification requires **explicit Accept or Override per row** (not “default if silent”). Coach records choice in DL.

| # | Topic | Recommendation (not automatic) | Accept / Override |
|---|--------|--------------------------------|-------------------|
| OD1 | Session calendar implementation source | Config exchange calendar with early closes + DST | _pending_ |
| OD2 | Admin `tick_size` column | Prefer Admin column + vendor fallback | _pending_ |
| OD3 | Index proxy VP | **Off** until labeled Admin mode | _pending_ |
| OD4 | Study years | Config default 5 | _pending_ |
| OD5 | Agent path | Member GET sufficient for v0.2 | _pending_ |
| OD6 | OD-nav “Options Lab” | One-line DL ratification or keep as-built disclaimer | _pending_ |
| OD7 | Chart-host Spec vs DL unblock of §8 | Spec preferred before P6 | _pending_ |
| OD8 | `max_n_bins` production value | e.g. 500000 until measured | _pending_ |
| OD9 | Bar-grain multi-tick weights | Equal per tick in range (v0.2 freeze) | _pending_ |
| OD10 | AT-R2 reconciliation tolerance | e.g. 1% or absolute share floor — set at P2 | _pending_ |

---

## 19. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1** | 2026-08-10 | Initial DRAFT: 1m typical-price (superseded for production SoR) |
| **v0.2** | 2026-08-10 | **Trades-first** measurement; degrade ladder + H–L spread only; source/`method` honesty; geometry freeze (half-away-from-zero, conditions, calendar); P2 probes; VP15 rate isolation; `max_n_bins`; §8 staged; AT-R1–R6; OD explicit Accept/Override; filename `v0_2` |

**v0.1 → v0.2 delta (review map):**

| Finding | Fold |
|---------|------|
| R1 BLOCKING | VP2a/b/c · §3 rewrite · payload `method`/`sources` |
| R2 BLOCKING | §4 full freeze · §5 calendar · conditions |
| R3 BLOCKING | §11 P2 probes |
| R4 BLOCKING | VP15 · §12 |
| R5 BLOCKING | VP16 · AT-R4 |
| R6 BLOCKING | §0.1 · §8 staged · chart-host parent |
| R7 ADVISORY | Shards-as-bins normative §7.2 |
| R8 ADVISORY | AT-R1–R6 |
| R9 ADVISORY | OD table · filename · Picker dependency note · hash procedure |

---

## 20. One-line law

**Measure volume at each print onto a one-tick grid when trades are available; degrade only with honest metadata and H–L spread; cache and session-maintain raw bins for agents; paint later with color, opacity, and width scale — never invent structure levels or starve live market feeds.**
