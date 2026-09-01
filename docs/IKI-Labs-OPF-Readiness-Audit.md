# GXA0 — OPF Readiness Audit

**Status:** FINDINGS — read-only audit. No product code was written or modified.
**Date:** 2026-09-01
**Author:** Grok Build
**Gate:** India → Coach
**Brief:** `agents/p-iki-gex/seeds/GXA0-opf-readiness-audit.md` (v1.0, 2026-09-01)
**Object:** What OPF actually is, and what it requires, before L4-A (`IKI-Labs-Chain-Analytics-Read-Spec-v0_3.md`) can be built on it.

**Spec gap (stated up front):** `IKI-Labs-Chain-Analytics-Read-Spec-v0_3.md` is **not in this repo** (search of `Specs/`, `docs/`, `agents/`, `/Users/ernie/knowledge`, `/tmp`; 2026-09-01). L4-A-internal IDs (D2, CA1, CA2, GXA1, GXA4, GXA5, OD-CA3, P-GX1, P-GX3) are taken from the audit brief. OPF as-built is taken from the tree, Arch 30, MiniTwo, Redis, StudioOne, and one live Massive pull.

**Doctrine read:** `agents/bench/doctrine.md`, `agents/bench/first-principles-doctrine.md`. Arch 30. OPF modules under `server/opf/`. No implementation. No Surface. No plan.

---

## 1. Verification table (F1–F5, F7, F8)

| # | Brief finding | Verdict | Evidence |
|---|---|---|---|
| **F1** | `gex_v1` is shipped and **client-side only** | **Confirmed** | `web/lib/options-lab/templates/pricing.ts:437–456` (`gexSide`); template id `gex` in `web/lib/options-lab/templates/registry.ts:8,30` via `gex.ts:184–201`; display divisor `GEX_DISPLAY_DIV = 1e9` at `gex.ts:145`. Heatmap Spec v0_2 §5.5 freezes the same per-share formula. Server tests only *mirror* it (`server/tests/test_heatmap_at_fixtures.py:69–78`); they are not a server compute path. |
| **F2** | **The server cannot compute exposure at all.** No Python path from a generation to a per-strike value | **Confirmed** | `rg 'gex_|gamma \*' server --glob '*.py'` — the only `Γ·OI·S²` arithmetic is the Heatmap AT fixture above. `server/market_data/chain_ladder.py:439,526` *carries* `gamma` and `open_interest` on rows. No function consumes them into exposure. Strategy-pack `"gex"` is a VP criterion *name* (`server/strategy_packs/types.py:8`), not a computation. |
| **F3** | Pagination and multi-expiry range pulls exist | **Confirmed** | `server/market_data/massive_client.py:89–169` — `expiration_date` / `expiration_date_gte/lte`, `strike_price_gte/lte`, `allow_truncate`, `max_pages`. `fetch_option_chain_until` at `:171–189` for expiry discovery. |
| **F4** | OPF L1 holds multi-exp generations; `build_epoch()` measures skew; `archive.py` day-shards with `ArchiveGap` | **Partially confirmed** | Classes exist: `ContractStore` / `build_epoch` in `server/opf/generation.py:53–80, 159–207`; `archive_put` / `archive_get` / `ArchiveGap` in `server/opf/archive.py:16–122`. Multi-exp is a dict keyed by `bus_key()` (`generation.py:59–60`). **What does not exist:** a running store populated from the bus (see F8); a running `archive_put` writer (Q3); any file under `server/data/opf_archive/` except `.gitkeep` (StudioTwo and MiniTwo, `find … -type f \| wc -l` → 1). |
| **F5** | `gexSide` omits the contract multiplier entirely | **Confirmed** | `pricing.ts:454–455`: `const raw = g * oi * s * s;` then sign. Heatmap Spec v0_2 §5.5 **freezes that omission** (“Not multiplied by 100 in the stored `value` (per share…)”). F5 is true of both code and the shipped spec. A `gex_v2` that adds ×100 is a new formula, not a bug fix of `gex_v1`. |
| **F7** | IEEE 754: shipped order vs written `gex_v2` disagree on ~47 % of inputs; regrouping alone ~35 %; 200 000 samples (L4-A v0.3 §5) | **Confirmed in magnitude; L4-A formula not independently readable** | L4-A v0.3 is not in the tree, so the *written* `gex_v2` expression cannot be cited. Independent measurement, 2026-09-01, `random.Random(20260901)`, N=200 000, ranges γ∈[1e-8,0.25], OI∈[0,250000], S∈[3500,7000] (typical SPX): **shipped `g*oi*s*s` vs `(g*oi)*(s*s)`: 70 100 / 200 000 = 35.05 %**; **shipped vs `g*(oi*(s*s))`: 92 870 / 200 000 = 46.44 %**. Those two percentages match the brief’s ~35 % / ~47 %. A future `gex_v2` that freezes association must name the grouping; the shipped left-to-right product is not associative in IEEE 754 at SPX scale. |
| **F8** | `ContractStore` is a process-local dict populated only from request bodies. Nothing populates it from the bus | **Confirmed. Headline stands.** | See §1.1. |

### 1.1 F8 — bound

```27:32:server/routes/pricing.py
# Process-local generation store for foundation (in-memory; hydrate from body or bus)
_store = ContractStore()


def get_opf_store() -> ContractStore:
    return _store
```

The comment says “or bus”. The code never does the bus half.

| Claim | Evidence |
|---|---|
| `_hydrate` only from `ResolveIn.generations` | `pricing.py:95–115` — `ChainGeneration(...)` from body fields, `_store.put(gen)`. Called from `pricing_resolve:149`, `pricing_package_quote:184`, `pricing_lock:272,286`. |
| `from_ladder_payload` never on a route / feed / stream | Callers: `generation.py:80` (definition), `chain_provenance.py:55` (WS/HTTP provenance, **new empty `ContractStore()`**, discarded), `test_market_bus_chain_provenance.py:59`. `rg from_ladder_payload --glob '*.py'` — those three. |
| `InterestManager.touch` does not fetch or populate | `interest.py:55–83` — refcount++ and cap. Docstring `:32–36`: “Complements Redis `mb:interest:*` TTL”. `pricing_interest:220–238` then *separately* `store.touch_interest(topic)` on Redis. Two writes, no generation. |
| Process singletons | `_store` `pricing.py:28`; `_manager` `interest.py:102–113`; `_controller` `lock.py:147–154`. |

**Three consequences, re-verified:**

1. **D2 (“read what is warm”) is unfounded as written.** `POST /api/me/pricing/interest` increments a counter (`pricing.py:231`) and optionally a Redis TTL key (`:238`). It does not warm `_store`.
2. **A read on a fresh process finds an empty store.** `GET /api/me/pricing/health` returns `generations_cached: len(_store.list_keys())` (`pricing.py:313`). After boot that is 0 until a client posts `generations`. CA2 as specified (read-only, no body) would return empty, not partial.
3. **Process-local vs Arch 30 §11.** Arch 30:93 and §11: “Server L2–L4 is **SoR** for multi-worker.” A module-level dict is per-worker. **Today MiniTwo runs one uvicorn worker** (Q5), so the affinity bug is **latent**, not live. The architecture claim is still false.

Client as-built already posts generations: `web/lib/options-lab/opfPricingApi.ts:160–165` (`resolve`) and `:216–218` (`package-quote`). That is option (c) in production for L4, today.

---

## 2. Q0 — generation source (ranked, not chosen)

**Question:** What is the correct generation source for a server-side analytics read, and what must be built to make it exist?

| Rank | Option | Why this rank | Cost (files / ops) | Risk carried |
|---|---|---|---|---|
| **1** | **(a) Bus → store hydration** | Only path that makes Arch 30 L1 real and gives every later L5 tool one server data plane. Matches topology Arch 30 §4 (feed writes Redis; API reads). | **Code:** hydrator on `ContractStore` from `BusStore.get_json` (`server/opf/generation.py`, `server/routes/pricing.py` or a new analytics route, tests). **Ops (blocking):** MiniTwo has **no Redis, no `chain_feed` launchd, no `LABS_MARKET_BUS` in the API plist** (Q5). Standing that up is Foxtrot, not a Python import. **Data shape:** feed writes the Heatmap wing window, not a full listed book (new finding N1). | If hydration reads today’s `mb:ladder:*` unchanged, analytics GEX is **window GEX**, not chain GEX. 6 s Redis TTL (Q2) means “warm” only while a feed is ticking that key. |
| **2** | **(b) Analytics reads Redis directly** | Fewer OPF types touched. Faster to a first CA2 if Redis existed. | New read route + `BusStore.get_json`. `ContractStore` stays request-scoped. | **L1 remains a fiction**; the next tool re-solves F8. Same MiniTwo substrate gap as (a). Same wing-window payload. Same 6 s TTL. Arch 30 §11 stays a comment. |
| **3 (ruled out)** | **(c) Client posts generations** | Defeats CA1 (server SoR) and agent parity. Listed because it is **the as-built of `/api/me/pricing/*` today** (`pricing.py:95–115`, `opfPricingApi.ts:164,218`). Extending `_hydrate` to analytics would ship a green test suite against a lying SoR. | Small. | Capital-adjacent compute with a client-supplied book. ST10 (IKI Store DRAFT) wants paid Intelligence server-computed. |

**Coach chooses.** The rank is architectural fitness, not lines of code. Neither (a) nor (b) is a “just write the hydrator” task: the production bus named in Arch 28/30 is **not running on MiniTwo today**.

A third substrate exists and is easy to confuse with OPF archive: **StudioOne** already stores day-sharded ladder generations (Q3 / N2). That is Time Machine’s A2 path. It is not `opf/archive.py`.

---

## 3. Q1–Q15

### 3.1 Generation supply — Q1–Q4

#### Q1 — Does the chain feed write Redis `mb:ladder:{ul}:{exp}:w{N}:dual` in a shape `from_ladder_payload()` can consume unchanged?

**Yes, shape-compatible. No live Redis document on MiniTwo or StudioTwo at audit time.**

| Piece | Evidence |
|---|---|
| Writer | `server/market_data/chain_feed.py:59–83` — `write_key = f"mb:ladder:{parsed.chain_underlier}:{exp}:w{wings}:dual"` then `store.set_json(write_key, payload)` where `payload = cl._fetch_ladder_uncached(...)` + `apply_chain_provenance`. |
| Key builder | `server/opf/keys.py:40–42` (same form). Route helper `server/routes/chain_ladder.py:69–70` ignores `side` and writes the dual key. |
| Payload constructor | `server/market_data/chain_ladder.py:537–562` then `routes/chain_ladder.py:370–386` adds `product`, `wings_effective`, `content_hash`. |
| Consumer | `from_ladder_payload` (`generation.py:80–130`) reads `product`/`underlier`, `expiration`, `wings_effective`\|`wings`, `rows` (flat with `side`, or nested call/put), `spot`, `as_of`\|`fetched_at`, `content_hash`. Live rows are **flat with `side`** — the nested branch is unused on the feed path. |

**One real payload** (not Redis — Redis empty; StudioOne overnight snap, 2026-09-01, `GET http://studioone.local:5055/api/fetch?day=2026-09-01&symbol=SPX&level=0&from=…T00:00:00-04:00&to=…T00:00:20-04:00`, HTTP 200):

- Envelope `generation` keys: `as_of, atm_strike, band, bus, content_hash, dte, dual_side, excluded_adjusted_count, expiration, fetched_at_unix, fields, kind, listed_in_window, massive_page_limit, max_strikes_per_dte, product, row_count, rows, side, spot, spot_source, spot_strike, strike_hi, strike_lo, strike_step, underlier, vix, vol_source, wings, wings_effective, wings_requested`.
- `underlier=I:SPX`, `product=SPX`, `expiration=2026-09-01`, `dual_side=True`, `wings=wings_effective=15`, `row_count=62`, `rows[0].side=call`, `rows[0]` has `gamma`, `open_interest`, `strike`, `mid`, `iv`, greeks.
- Implied Redis key: `mb:ladder:I:SPX:2026-09-01:w15:dual`.

That document is ingestible by `from_ladder_payload` **unchanged**. Provenance unit test uses a reduced form of the same shape (`test_market_bus_chain_provenance.py:18–36,55–59`).

**Caveat (N1):** `row_count=62` at `wings=15` is a **Heatmap window**, not the full listed book. Live Massive full listed for the same expiry today is **496 contracts / 248 strikes** (Q8). Compatibility of *schema* is not compatibility of *universe*.

StudioTwo Redis 2026-09-01 10:41 ET: `redis-cli ping` → `PONG`; `SCAN mb:ladder:*` → **0 keys**. MiniTwo: `redis-cli` not installed; no Redis process.

#### Q2 — Redis live-window TTL, and who sets it?

**Default 6 seconds on the generation key. 45 seconds on interest. Not hours.**

| Knob | Default | Setter | Effective Redis `EX` |
|---|---|---|---|
| `LABS_MB_CHAIN_TTL_S` | `"2.0"` | `server/market_data/market_bus/config.py:22–26` | `store.set_json` (`store.py:40–44`): `ex = max(2, int(ttl * 3))` → **6 s** |
| `LABS_MB_INTEREST_GRACE_S` | `"45"` | `config.py:29–33` | `touch_interest` (`store.py:56–58`): **45 s** |

Arch 30 §10:299: Redis is “Hot / live window only **(hours-scale TTL)**”. **As-built is seconds-scale.** Market Bus Spec / `infra/deploy.md:348` document the 2.0 / 45 defaults. In-process ladder cache is even shorter: `_CACHE_TTL_S = 1.5` (`routes/chain_ladder.py:61`).

Neither MiniTwo `.env` nor the API plist sets `LABS_MB_*`. If the bus were enabled without overrides, TTL would be 6 s.

#### Q3 — Is any running writer calling `archive_put()`?

**No.**

| Caller | Role |
|---|---|
| `server/opf/archive.py:38` | definition |
| `server/opf/packs/backtest.py:164–171` `seed_archive_from_store` | helper; **no route, feed, or launchd calls it** (`rg seed_archive_from_store` → definition only) |
| `server/tests/test_opf_foundation.py:324` | test, `tmp_path` |

`server/data/opf_archive/` on StudioTwo and MiniTwo: `.gitkeep` only (`find … -type f` → 1).

**GXA4 `as_of` against OPF archive returns nothing on every session today.**

Historical chain snaps **do** exist on StudioOne (Q10): 23 830 files for SPX 2026-08-28; 16 496+ for 2026-09-01 by ~10:40 ET. That is SO-AR / Time Machine, not `opf.archive`.

#### Q4 — When is a generation produced? Demand-driven or continuous?

**Demand-driven. “Warm” without a member (or a tap) watching is not a thing.**

| Path | Behavior |
|---|---|
| `chain_feed.tick` | `store.list_interest_topics("mb:ladder:")` (`chain_feed.py:45–48`). **If empty: print `no interest keys; idle` and return.** Does not use `--symbol` (argparse `:23–27` defines it; **no `args.symbol` read**). |
| HTTP `_fetch_ladder` | On miss, single-flight Massive fill (`routes/chain_ladder.py:407–458`). Writes Redis only if `get_store()` is not None (`:454–458`). Else process cache 1.5 s. |
| SSR / StudioOne tap | Separate process; keeps interest alive by `touch_interest` (Lima W0-6, 2026-08-18: live SCAN count **20**). That plane is **not** the MiniTwo API. |
| MiniTwo production 2026-09-01 | **No `chain_feed` plist, no Redis, no `LABS_MARKET_BUS`.** Generations for Options Lab are produced when a member hits the API, into the **one** uvicorn process’s 1.5 s cache. |

`--symbol` help text (“Default warm product if no interest keys”) is a lie. The feed idles.

---

### 3.2 Process and concurrency — Q5–Q7

#### Q5 — Is `labs-api` multi-worker in production?

**No. One uvicorn process, no `--workers`.**

MiniTwo, 2026-09-01 10:40 ET, `ssh minitwo`:

```
ProgramArguments = [
  …/server/.venv/bin/uvicorn,
  main:app,
  --host, 127.0.0.1,
  --port, 4000
]
```

`ps -o pid,ppid,command -p 70906`: one process, PPID 1, no children. `launchctl print …/ai.fattail.labs.api`: `state = running`.

Plist **EnvironmentVariables names** (values not recorded here): includes `LABS_POSITIONS_OPF`, `MASSIVE_API_KEY`. Does **not** include `LABS_MARKET_BUS`, `REDIS_URL`, `LABS_MB_*`, `LABS_OPF_*`. MiniTwo `~/Fattail-Labs/.env` same: `LABS_POSITIONS_OPF` present; `LABS_MARKET_BUS` / `REDIS_URL` / `LABS_OPF_*` **absent**. Running process environ: no `LABS_MARKET_BUS` / `REDIS_URL`.

`which redis-cli redis-server` on MiniTwo: empty. `brew services` / `launchctl list` grep redis: empty.

**No `ai.fattail.labs.chain-feed` plist.** LaunchAgents: `ai.fattail.labs.api`, `.web`, `.progress-refresh`, `.tunnel`, `com.fattail.labs.marks-stream` (`python -m market_data.live_stream --interval 5` — underlier marks, not chain generations).

**Worker-affinity (§2.3) is latent:** one worker, so `_store` is “global” on that host. Arch 30 §11 is still a false claim. Enabling `--workers N` without moving generations into Redis makes F8 live and non-deterministic.

Source of record for the invocation: `infra/deploy.md:185–186` documents the same argv (no `--workers`).

#### Q6 — Is `LABS_OPF_MAX_GENERATION_INTERESTS` per-worker or global?

**Per-process. Docstring says “global cap”; implementation is a module singleton.**

`interest.py:31–39, 102–113`. `max_generation_interests()` default `"32"` (`opf/config.py:16–24`). Under `N` workers the real cap is **`32 × N`** unless they share something they do not share.

Today N=1, so cap=32 in practice.

#### Q7 — Does anything reconcile process interest with Redis `mb:interest:*`?

**No. They can and will diverge. Different SoRs for different consumers.**

| Plane | Write | Expiry | Who reads it |
|---|---|---|---|
| `InterestManager` | `touch` / `release` (`interest.py:55–96`) | **Never** (refcount until `release`) | OPF budget (`pricing_interest` 429) |
| Redis `mb:interest:{topic}` | `BusStore.touch_interest` (`store.py:56–58`) | **45 s** | `chain_feed.list_interest_topics` |

`pricing_interest` writes **both**, independently (`pricing.py:231–238`), and swallows Redis errors (`except Exception: pass`).

Authoritative for **whether the feed pulls**: Redis. Authoritative for **whether OPF admits a new key**: the process refcount. A client that `touch`es once and walks away: Redis expires in 45 s (feed stops); process still holds the slot until `release` or process death. A feed tap that only `touch_interest`s Redis (SSR) never increments OPF’s cap.

---

### 3.3 Cost and capacity — Q8–Q10

#### Q8 — Cost of one multi-expiry pull (SPX, 8 expirations, full listed strikes)

**Measured. n=1 live pull, 2026-09-01 ~10:42 ET, `MassiveClient.fetch_option_chain` on `I:SPX`, no strike filter, `limit=250`, `allow_truncate=False`, `max_pages=40`, `page_pause_s=0.05`. Credential: local uvicorn `POLYGON_API_KEY` (name only). HTTP counted by wrapping `_get_json`.**

Expiry discovery (`fetch_option_chain_until` until 8 distinct dates, `expiration_date_gte=2026-09-01`): **14 HTTP, 3.612 s, 3 500 contracts seen.** Dates used: `2026-09-01 … 2026-09-04, 2026-09-08 … 2026-09-11`.

| Expiration | Pages (HTTP) | Contracts | Distinct strikes | Wall s | Raw JSON bytes |
|---|---:|---:|---:|---:|---:|
| 2026-09-01 (0DTE) | 2 | 496 | 248 | 0.473 | 444 348 |
| 2026-09-02 | 2 | 496 | 248 | 0.383 | 438 963 |
| 2026-09-03 | 2 | 486 | 243 | 0.424 | 426 199 |
| 2026-09-04 (Friday) | 3 | 598 | 299 | 0.637 | 544 883 |
| 2026-09-08 | 2 | 466 | 233 | 0.470 | 405 166 |
| 2026-09-09 | 2 | 400 | 200 | 0.422 | 347 732 |
| 2026-09-10 | 2 | 398 | 199 | 0.376 | 345 855 |
| 2026-09-11 | 3 | 516 | 258 | 0.581 | 459 461 |
| **8-exp total** | **18** | **3 856** | — | **3.870** | **3 412 607** |

**P-GX3 size of a batch writer, this universe:** 18 snapshot pages + 14 discovery pages if the calendar is not already known ≈ **32 HTTP**, **~7.5 s** wall including discovery, **~3.4 MB** raw JSON. Per-expiry median **2 pages**. `_probe_spot` is extra if the as-built ladder path is used (Lima W0-6: uncached ladder = 2 HTTP). Full listed **does not** need `max_pages=3`; weeklies fit in 2, the Friday in 3.

**This is not what the feed writes.** As-built `_fetch_ladder_uncached` uses `strike_window_from_wings`, `_MAX_DUAL_WINGS=50`, `max_pages=3`, `allow_truncate=False` (`routes/chain_ladder.py:74, 253–309`). StudioOne overnight snap for 0DTE: **62 rows at wings=15**. Full listed 0DTE: **496 contracts**.

n=1. Not a 20-run median. Per-expiry times clustered 0.38–0.64 s; a 20-run median is not required to size the writer to “tens of HTTP, single-digit seconds” for 8 front SPX expiries.

#### Q9 — Massive rate limit / credential budget / headroom

**No plan dollar cap or RPM number is on file in this repo.** Lima W0-6 (`agents/p-ssr-collector-hardening/gate-reports/W0-6-lima-cadence-math.md:132`): “No Massive plan dollar cap is on file in this repo. This report sizes **calls**, not invoices.”

Live 8-exp pull completed with **no HTTP 429**. Headroom vs **current MiniTwo live use**:

- `chain_feed` is **not running**.
- API Massive for chains is **on-demand** from the single worker (`_fetch_ladder` miss).
- `marks-stream` is `live_stream --interval 5` (universe underliers; options probe is `max_pages=1`, `allow_truncate=True`, `limit=10` — `live_stream.py:45–50`).

If the 2026-08-18 SSR plane were running (20 interest topics, 2 s chain_feed): Lima table **468 000 HTTP / RTH 6.5 h**. That is the historical high-water mark in-repo, not today’s MiniTwo.

A GXA5 batch of 32 HTTP / 8-exp snapshot is negligible next to that historical 2 s × 20-topic load, and **larger than today’s MiniTwo chain load (≈0 continuous)**.

#### Q10 — Bytes per archived generation; per session for 8 expirations

| Object | Bytes | Method |
|---|---|---|
| OPF `archive_put` file on disk | **none** | `find server/data/opf_archive -type f` → 1 (`.gitkeep`) on StudioTwo and MiniTwo |
| As-built **wing-window** generation (StudioOne SPX 0DTE) | **min 19 125 / median 19 756 / max 32 696** (n=16 496 snaps, 2026-09-01); **min 19 132 / median 20 051 / max 32 709** (n=23 830, 2026-08-28) | `GET /api/index?day=&symbol=SPX` `snaps[].bytes` |
| Full listed raw Massive JSON, one expiry | **347 732–544 883** | Q8 `json.dumps(rows, separators=(",", ":"))` |
| Full listed raw, 8 expiries | **3 412 607** | sum of Q8 |

**P-GX1 retention, as-built window at StudioOne cadence:** 16 496 snaps × ~20 KB ≈ **330 MB** for **one symbol, one expiry, partial day to 10:40 ET**. That is the SSR tap, not OPF. An OPF cold archive of **8 full listed books, once**, is ~3.4 MB raw / likely well under 1 MB after ladder-normalize (62-row overnight snap is 20 KB; 496/62 × 20 KB ≈ 160 KB per full 0DTE as a proportional estimate — labeled estimate, not a written `archive_put` file).

---

### 3.4 Config and surface — Q11–Q13

#### Q11 — `opf/config.py` pattern; where would `GexPolicy` live?

**Invalid values fail loud. Missing values do not — they default.** That is the opposite of Claude.md “no silent defaults” for boot config, and it is the **existing OPF pattern**.

`server/opf/config.py:9–14` `_env(name, default=…)`. Every function supplies a default (`MAX_GENERATION_INTERESTS=32`, `MAX_SKEW_MS=3000`, `SKEW_MODE=fail_loud`, `T0_RECON_TOL_*`, `ARCHIVE_MAX_STALE_MS=900000`, `RISK_FREE_RATE=0.05`). `archive_root()` defaults to `server/data/opf_archive` if `LABS_OPF_ARCHIVE_ROOT` is unset (`:76–81`).

`GexPolicy` would naturally be more functions in `server/opf/config.py` (same `_env` + range check). Inventing a second config module would violate first-principles law 1. Whether L4-A should **fail loud on missing** `LABS_OPF_GEX_*` (stricter than OPF today) is a spec choice, not an as-built one.

#### Q12 — What do `require_session` + `_require_tool_member` gate? Is `entitlement_key` new?

**They gate “signed-in practice-suite member,” defaulting to Trade Log *write*. They are not an IKI per-app entitlement.**

| Layer | What it is |
|---|---|
| `require_session` | Session cookie → identity. Used on every `/api/me/pricing/*` (`pricing.py:140+`). |
| `_require_tool_member` | `server/routes/trade_log/common.py:26–78`. Default `capability="write"`. Practice floor: admin \| activator+ \| observer-trial (`can_create_or_gather`). Then Access Control policy `app:trade-log`. **Pricing routes call it with no `capability=` argument** → write. |
| IKI Store DRAFT ST7/ST10 | Fail-closed per Knowledge app; paid Intelligence server-computed (`Specs/FatTail-Labs-IKI-Store-and-Entitlement-Spec-v0.1.md`). **DRAFT, not BUILD.** Woo step is a stub (`iki_factory_woo.py`). |
| `product:{slug}` grammar | **Exists** in as-built `server/access_control/keys.py:9, 37–44` (example `product:heatmap-gex`). IKI Store spec §4.3 (2026-08-26) still says there is no `product:` kind — **that paragraph is stale vs keys.py**. |

A string field `entitlement_key` on an analytics route would be **new**. The AC target-key grammar to *put behind it* is not new. Reusing `_require_tool_member()` on a read-only CA2 endpoint would incorrectly require Trade Log **write**.

#### Q13 — What do the ATs in `test_opf_foundation.py` cover? What would a bus→store path put at risk?

**20 tests collected** (`pytest tests/test_opf_foundation.py --collect-only` → `20 tests collected in 0.02s`). Arch 30 §17b and Z-G (2026-08-11) say **19**. The extra as-built tests are `test_vol_offset_pts_units` and/or `test_static_facts_required` relative to the 19-AT close.

| Test | Layer |
|---|---|
| `test_at_l0_dual_key_parse` | Dual Redis key parse |
| `test_at_l1_strike_canonical` | Strike canonical / map key |
| `test_at_l0_tau1_0dte_intraday` | τ 0DTE not 1/365 |
| `test_at_l0_tau3_am_settlement` | AM vs PM instant |
| `test_at_l0_tau4_final_hour_moves` | Final hour still moves |
| `test_at_l0_tau2_vix1d_mapping_in_cascade` | VIX1D in IV cascade |
| `test_at_l1_interest_budget_refuse_loud` | Process cap |
| `test_at_l2_package_natural_and_lock` | Package + lock IV |
| `test_at_l2_incomplete_loud` | Missing leg |
| `test_at_l1_multi_exp_calendar_package` | Two generations in one store |
| `test_at_l3_recon_day_trade` | AT-L3-RECON |
| `test_at_l3_calendar_arb_fail_fit` | Surface calendar arb |
| `test_at_l3_butterfly_fail_fit` | Butterfly arb |
| `test_at_l3_archive_and_stale_gap` | `archive_put` / `ArchiveGap` on `tmp_path` |
| `test_backtest_fails_without_archive` | OPF16 fail loud |
| `test_outlook_scenario_label` | Outlook pack label |
| `test_epoch_skew` | `build_epoch` max_skew_ms |
| `test_dual_curves_dense_expiration_and_model` | Curve density |
| `test_vol_offset_pts_units` | OPF31 vol units |
| `test_static_facts_required` | Fail loud without facts |

**Bus→store risk to these ATs: low.** Every test constructs a local `ContractStore` with fixtures. None read Redis. `test_at_l3_archive_*` uses `tmp_path`, not the empty production root. HTTP tests live in other files (`test_opf_package_quote_api.py`, `test_opf_session_envelope.py`) and post `generations` in the body — `_hydrate` still wins if it runs first.

**What a bus path *would* put at risk:** any new CA2 test that assumes a warm `_store` without a body; health `generations_cached`; worker-affinity if `--workers` is enabled without Redis. Existing 20 ATs stay green while F8 stays true. That is the failure mode the brief named.

---

### 3.5 Contradiction sweep — Q14–Q15

#### Q14 — Where else does as-built diverge from Arch 30?

F8 is one. These are the others found in this pass (not claimed complete of all of Arch 30).

| Arch 30 claim | As-built | Severity for L4-A |
|---|---|---|
| §11 / §3: “Server L2–L4 is SoR for **multi-worker**” | Process-local `_store`, `_manager`, `_controller`. MiniTwo **N=1**, so latent. | High if workers ever >1; high for the *claim* today |
| §10: Redis “hours-scale TTL” | `EX=6` s (`ttl*3` on default 2.0) | High for D2 “warm” |
| §4 topology: `labs-chain-feed` sole options writer → Redis → API | MiniTwo: **no Redis, no chain_feed**. API fills Massive itself on miss (`_fetch_ladder`). Arch 28 “as-built” draws the same missing plane. | High — (a)/(b) have no production socket |
| §6.1: OPF generation **may paginate** for complete required strikes (`allow_truncate=false`) | Feed/API ladder path is the **Heatmap** budget: wings clamp 50, `max_pages=3`, windowed strikes (`routes/chain_ladder.py:74,253–309`). Pagination exists in the client; OPF does not use it for completeness. | High for any GEX that needs the listed book |
| §12: Redis `mb:ladder:*` **is** L1 hot store | L1 `ContractStore` is a **second**, empty-until-POST dict. Redis (when up) is the Market Bus store. They do not meet. | F8 |
| §9 / OPF27: InterestManager **global** budget | Per-process cap; Redis interest is a different 45 s TTL | Q6/Q7 |
| §17b: Archive `server/data/opf_archive/` | Empty. No writer. | GXA4 |
| §17b: 19 ATs | 20 tests in `test_opf_foundation.py` | Doc drift |
| §14 / §17b: “L5 apps not wired” / “no L5 claim” (Z-G D10) | Analyzer **does** call `/api/me/pricing/package-quote` and `resolve` with posted generations (`opfPricingApi.ts`). Headless L4 is wired to a card SoR. | Honesty, not a blocker for IKI |
| `pricing.py:27` comment “hydrate from body **or bus**” | Body only | F8 |
| `chain_feed --symbol` “default warm” | Unused; idle on empty interest | Q4 |
| `opf/config.py` vs fail-loud doctrine | Defaults on missing | Q11 |
| IKI Store §4.3 “no `product:` kind” | `access_control/keys.py` has `product:` | Q12 doc drift |

#### Q15 — Does any code path actually exercise OPF pagination (`allow_truncate=False` as completeness), or is it only Heatmap?

**`allow_truncate=False` is the Heatmap HM18 path, not an OPF completeness assembler.**

| Call site | Flags |
|---|---|
| `routes/chain_ladder.py:299–309` `_pull` (used by feed **and** HTTP ladder) | `max_pages=3`, `allow_truncate=False`, **strike window from wings** |
| `live_stream.py:45–50` | `max_pages=1`, `allow_truncate=True`, `limit=10` (spot probe) |
| `massive_client.fetch_option_chain` default | `allow_truncate=True`, `max_pages=500` |
| `tests/test_chain_ladder.py:533–563` | Live HM18: 0DTE one page; monthly Friday truncates at 1 page, succeeds at `max_pages=3` **inside a ±250 strike band** — still not “all listed strikes on the earth” |

No OPF module calls `fetch_option_chain`. OPF consumes whatever generation it is given. §6.1’s “paginate until complete required strikes” is **law without a caller**.

This audit’s Q8 pull (`allow_truncate=False`, no strike filter, `max_pages=40`) is the first measured exercise of “full listed SPX expiry” in this session; it is not in production code.

---

## 4. New findings (not asked; would change L4-A)

These are expected to be non-empty.

| ID | Finding | Why it changes L4-A |
|---|---|---|
| **N1** | **As-built generations are a wing window, not the listed book.** Feed/API clamp `_MAX_DUAL_WINGS=50` (~202 contracts). StudioOne 0DTE overnight snap: 62 rows at `wings=15`. Live full listed 0DTE: 496 contracts / 248 strikes. `gex_v1` on a ±15/±50 window is **not** chain GEX. Hydrating `_store` from `mb:ladder:*` unchanged inherits that window. | D2/CA2 “read the chain” vs “read the Heatmap band”. Must be named in v0.4 or GEX is a cropped estimate with no label. |
| **N2** | **Historical substrate is StudioOne, not OPF archive.** OPF `archive_put` has no writer and no files. StudioOne holds tens of thousands of ladder snaps/day/symbol (~20 KB, wing-windowed). Time Machine already consumes that plane (SO-AR A2). GXA4 against `opf.archive` is empty; GXA4 against StudioOne is a different contract (and a second reader, not a second writer). | Do not commission an OPF archive writer “so as_of works” without deciding whether SO-AR is the as_of SoR. First-principles law 1. |
| **N3** | **Production Market Bus is not running on MiniTwo.** No Redis binary, no `LABS_MARKET_BUS`, no `chain_feed`. Arch 28/30 “as-built” topology is **StudioTwo/SSR-era**, not today’s production API host. Options Lab on MiniTwo is the process-cache miss path. | (a) and (b) are blocked on Foxtrot + env, not only on a hydrator. A CA2 against Redis on MiniTwo is an empty grid for the same reason as CA2 against `_store`. |
| **N4** | **L4-A v0.3 is not in the tree.** India cannot gate a spec that is not a file. | Land v0.3 (or v0.4 after this audit) in `Specs/` before GXA1. |
| **N5** | **Pricing auth is Trade Log write.** `_require_tool_member()` default `capability="write"` on `app:trade-log`. A read-only analytics route that copies this helper is the wrong gate. `product:` keys exist; IKI Store is DRAFT; Woo entitlement is stubbed. | CA9 cannot assume IKI per-component entitlement is wired. |
| **N6** | **LockController is the same process-local pattern as F8** (`lock.py:147–154`). Not analytics, but it is the same SoR hole if L4 lock is ever multi-worker. | Do not cite “server SoR” for lock either. |
| **N7** | **`gex_v1` multiplier omission is spec-frozen, not an accident.** Heatmap §5.5. L4-A `gex_v2` that adds ×100 is a new named formula (IEEE grouping still required — F7). | Do not “fix” `gex_v1` in place. |
| **N8** | **Interest two-SoR (Q7) means SSR can keep Redis warm without OPF admitting the key, and OPF can hold a slot after Redis expired.** D2 “warm” has two clocks. | Spec must name which clock CA2 reads. |
| **N9** | **Client already implements (c) for package-quote/resolve.** Shipping analytics as (c) would be consistent with L4-as-built and inconsistent with CA1/ST10. | Rank (c) last; do not pretend it is hypothetical. |
| **N10** | **IEEE regrouping at SPX scale is real at the brief’s percentages** (35.05 % / 46.44 %, N=200 000, command in §1 F7). Server Python and client JS will disagree on a non-empty set unless they freeze the same association and preferably the same decimal type. | L4-A v0.4 must freeze order of operations (and language) before GXA1 writes a server `gex_v2`. |

---

## 5. Blocking list

Interpretation: **GXA1** = first packet after this audit (spec honesty + generation source). **GXA5** = batch writer / capacity (P-GX3, OD-CA3). If Juliet named those packets differently, map by job, not by letters.

### 5.1 Must change in OPF / the contract **before GXA1 can start**

1. **Coach Q0.** Rank is (a) > (b) > (c). Do not start a read against `_store` as if D2 were true.
2. **Land L4-A in `Specs/`** (v0.3 as filed, or v0.4 after this audit). India cannot gate a missing file. **D2 must be rewritten** to name the real source (Redis `mb:ladder:*` after hydration, Redis direct, StudioOne, or “empty until a writer exists”).
3. **Name the book.** Wing window (as-built `mb:ladder`) vs full listed (Q8). Silent crop of OI outside ±wings is a GEX lie. This is product law, not a default of 50.
4. **Arch 30 honesty** (Lima, same body of work as the spec amend): §10 TTL, §11 multi-worker SoR, §6.1 pagination-without-caller, §17b 19 vs 20 ATs and empty archive, “or bus” comment. Not a code change; a truth change. Doctrine §9.
5. **Do not implement (c) for analytics.** As-built of L4 is not a license to extend it.
6. **Auth helper.** Do not copy `_require_tool_member()` write-default onto a read-only route (N5). Decide the AC target (`product:…` vs IKI DRAFT) in the spec; the grammar exists, the IKI Woo seam does not.

**Not required for GXA1:** MiniTwo Redis, `chain_feed` launchd, `archive_put` writer, `GexPolicy` env keys, IEEE golden vectors — those are GXA5 / later or spec-amend notes. GXA1 without Q0+D2 rewrite will plan a read of an empty dict.

### 5.2 Must change **before GXA5** (batch writer / capacity / as_of)

1. **A running generation writer for the book GXA5 claims to archive.** Today: none on MiniTwo; StudioOne writes the *windowed* book; `archive_put` writes nothing.
2. **TTL / interest clock.** 6 s generation TTL cannot be the live window for an 8-exp analytics read unless the feed is ticking those keys continuously. 45 s interest vs immortal process refcount (Q7) must be one story.
3. **P-GX3 is sized (Q8):** 18 pages / 3.87 s / 3 856 contracts / 3.4 MB raw for 8 front SPX full listed, n=1. Writer budget can use that. Add `_probe_spot` if the ladder path is reused. Do **not** reuse `max_pages=3` + wings clamp if the book is full listed.
4. **P-GX1:** windowed snap ~20 KB; full listed raw ~0.35–0.55 MB/exp; OPF archive directory empty. Retention math must say which object. StudioOne already holds windowed snaps at 2 s cadence (hundreds of MB/symbol/day) — do not duplicate that as OPF archive without a reason (N2).
5. **Massive headroom:** no dollar cap on file (Q9). MiniTwo current continuous chain load ≈ 0. A 32-HTTP/7.5 s 8-exp pull is cheap vs the 2026-08-18 20-topic × 2 s plane, expensive vs today’s production.
6. **Production bus (if GXA5 writes Redis or OPF L1):** Foxtrot — Redis, `LABS_MARKET_BUS`, `chain_feed` launchd, env. Not an Alpha packet inside `opf/`.
7. **IEEE / language freeze for `gex_v2`** before a server compute path (N10, F7). Golden vectors if TS ever mirrors it (Arch 30 OD-PF6).

---

## 6. Method appendix (commands)

Redis (StudioTwo): `redis-cli ping`; `redis-cli --scan --pattern 'mb:ladder:*' | wc -l` → 0.

MiniTwo: `ssh minitwo` + `plutil -extract ProgramArguments json -o - ~/Library/LaunchAgents/ai.fattail.labs.api.plist`; `ps -o pid,ppid,command -p 70906`; env *names* via `plutil -extract EnvironmentVariables` / `.env` grep of keys only (no values copied into this document).

StudioOne: `GET /api/index?day=2026-09-01&symbol=SPX` (median `snaps[].bytes`); `GET /api/fetch` 20 s window for payload keys. Token from env, not logged.

Massive Q8: local uvicorn `POLYGON_API_KEY` harvested from `ps eww -p 79091` into the child env (value not printed). `_get_json` wrapper for page counts.

IEEE F7: `random.Random(20260901)`, N=200000, Python 3 float.

AT count: `cd server && .venv/bin/python -m pytest tests/test_opf_foundation.py --collect-only -q` → 20.

`from_ladder_payload` callers: `rg from_ladder_payload --glob '*.py'`.

`archive_put` callers: `rg archive_put --glob '*.py'`.

---

## 7. One-line

**A server-side analytics read today gets a generation from the client that asked, or from nobody — ContractStore is empty, MiniTwo has no Redis and no chain feed, OPF archive is empty, and the documents the feed *would* write are Heatmap windows, not full listed books.**

**Next:** India gates this findings file. Coach disposes Q0 and the wing-window vs full-listed law. L4-A v0.4 (or v0.3 landed + amend) before GXA1.
