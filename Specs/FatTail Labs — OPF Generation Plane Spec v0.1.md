# FatTail Labs — OPF Generation Plane Spec v0.1

**Status:** **DRAFT** — not build authority. For review, then build and test.
**Date:** 2026-09-01
**Canonical filename:** `Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_1.md`
**Short name:** **Generation Plane** / **GP**
**Type:** Foundation spec — makes OPF **L1** a real server data plane
**Parent:** `Architecture/30-options-pricing-foundation.md` (L0–L1) · `Architecture/28-massive-market-bus.md`
**Consumer:** `Specs/IKI-Labs-Chain-Analytics-Read-Spec-v0_4.md` (**frozen** until this ships)
**Evidence:** `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md` (2026-09-01)

**Why this exists.** Coach, 2026-09-01: *"Freeze GEX product work. OPF is not ready to be a SoR."*
This spec is the work order that makes it ready. It implements **P0–P7** and lifts the freeze when
its exit criteria hold.

**What it does not do.** No exposure computation, no analytics route, no tool. Those are L4-A's and
they stay frozen (**§13**).

---

## 0. Mission

```text
BEFORE                                    AFTER
─────────────────────────────────────     ─────────────────────────────────────
browser ──POST generations──► _store      chain_feed ──► Redis ──pub──► hydrator ──► ContractStore
                               │                                                        │
                          (that is the SoR)                       listed writer ────────┘
                                                                                        │
                                                              server owns it · book is stamped
```

**Two conditions lift the freeze**, and both are demonstrable:

1. **The server obtains a generation it owns** — not one a browser posted
2. **The server can say what book it is** — `wings` or `listed`, stamped and persisted

---

## 1. Parents and precedence

| # | Document | Authority |
|---|---|---|
| 1 | `Architecture/00-decision-log.md` | Binding decisions |
| 2 | `Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` | Transport; one WS/tab; Redis keys |
| 3 | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` | **HM17/HM18** — the wings budget, unchanged by this spec |
| 4 | **This spec** | The generation plane |
| 5 | `Architecture/30-options-pricing-foundation.md` | Parent — **and materially inaccurate today**; §11 corrects it |

**Invariants that bite:** **2** config-driven fail-loud · **4** evidence over assertion ·
**5** change control · **6** documentation parity · **10** suite green.

---

## 2. The measured problem

Every row is from the GXA0 audit with a file, line, or command behind it. None is inference.

| # | Fact | Source |
|---|---|---|
| **M1** | `ContractStore` is a **module-level process-local dict**, populated **only** from request bodies | `routes/pricing.py:28, 95–115` |
| **M2** | `from_ladder_payload` is **never called by a route, feed, or stream** | callers: definition, `chain_provenance.py:55`, one test |
| **M3** | `InterestManager.touch()` **increments a refcount**. No fetch, no store write | `interest.py:55–83` |
| **M4** | **No Redis, no `chain_feed` plist, no `LABS_MARKET_BUS` on MiniTwo** | plist + env + `which redis-cli` |
| **M5** | Redis generation TTL is **6 s** (`ttl*3` on default 2.0), not "hours-scale" | `market_bus/store.py:40–44`, `config.py:22–26` |
| **M6** | **No `archive_put` caller.** `server/data/opf_archive/` holds `.gitkeep` | `rg archive_put`; `find … -type f` → 1 |
| **M7** | **One uvicorn worker**, no `--workers`. F8's affinity bug is **latent, not live** | plist `ProgramArguments` |
| **M8** | Interest has **two clocks** — Redis 45 s vs an immortal process refcount, written independently, Redis errors swallowed | `pricing.py:231–238` |
| **M9** | As-built generations are a **wing window**: `_MAX_DUAL_WINGS=50`; 0DTE snap **62 rows at wings=15**; live full listed **496 contracts / 248 strikes** | `routes/chain_ladder.py:74, 253–309`; StudioOne; live pull |
| **M10** | Listed book, 8 front SPX expirations: **18 pages / 3.87 s / 3 856 contracts / 3.4 MB** | measured live, n=1 |
| **M11** | `set_json` **publishes `{topic, hash, ts}` to `mb:pub`** on every write — best-effort | `store.py:45–54` |
| **M12** | `opf/config.py` **defaults on missing**, fails only on invalid | `config.py:9–14` |

**M11 is the one that shapes the design.** A 6-second TTL and a polling reader interact badly; a
publish-on-write channel already exists.

---

## 3. Ownership and provenance

**GP1 — a generation the server computes on is one the server obtained.** Client-supplied
generations are **never** a source for analytics or Intelligence.

**GP1a — what is not being broken.** Client-posted generations remain lawful for the **existing
pricing what-if path** (`resolve`, `package-quote`, `lock`). Analyzer depends on it and this spec
does not touch it. The prohibition is scoped to **analytics and any server-computed Intelligence**.

**GP2 — every generation carries `source`.** Without provenance, GP1 is aspiration rather than law —
once a generation is in the store you cannot tell where it came from.

```text
source ∈ { "bus" | "listed_writer" | "http_fill" | "client_body" }
```

| Rule | |
|---|---|
| Set at ingestion, **never** rewritten downstream |
| Persisted on the envelope and in the archive, if one is written |
| **`client_body` generations are rejected by any analytics read** (**AT-GP2**) |
| Surfaced by the visibility endpoint (§8) and by health |

*(Precedent: `apply_chain_provenance` already stamps provenance on the feed path.)*

---

## 4. Book law

**Window GEX is not chain GEX.** Exposure over ±15 to ±50 strikes, rendered as exposure over a
chain, is the failure the honesty apparatus exists to prevent — and today's default path produces
it by construction, unlabeled.

| # | Law |
|---|---|
| **GP3** | **The live ladder path stays `wings`.** It is the Heatmap's budget and correct for the Heatmap. HM17/HM18 unchanged |
| **GP4** | **A separate `listed` writer serves analytics and archive** — §7 |
| **GP5** | **`book` is persisted on the generation envelope**, not derived at read. `book ∈ {"wings","listed"}`, beside the existing `wings`, `strike_lo`, `strike_hi`, `row_count` |
| **GP6** | **A consumer never infers the book from a row count.** Absent `book` ⇒ the generation is **unusable for analytics**, not assumed wings (**AT-GP5**) |
| **GP7** | **No wing-window value is labelled chain GEX** — payload, chrome, tooltip, export or print template |

---

## 5. The three clocks

**GP8 — name them, never conflate them.**

| Clock | Value | Governs | Authority for |
|---|---|---|---|
| **Feed clock** | Redis `mb:interest:*`, **45 s** | whether the feed pulls | feed behaviour |
| **Store clock** | the hydrated generation and its age | **what a reader may read** | **analytics** |
| **Process refcount** | `InterestManager`, never expires | admission budget | cap enforcement only |

**GP9 — the refcount is a budget, never warmth.** No code path may read `held_count()` or a topic's
presence in `InterestManager` as evidence that a generation exists. They are unrelated facts
(**M8**: SSR can hold Redis warm without OPF admitting the key; OPF can hold a slot after Redis
expired).

**GP10 — divergence is reported, not reconciled silently.** The visibility endpoint surfaces feed
clock and store clock separately. Where they disagree, both are shown.

---

## 6. The hydrator (P2)

**GP11 — the hydrator is a server-side process, not a request path.** It never runs inside a member
request, and a member request never triggers a fetch.

**GP12 — it reads Redis and writes `ContractStore`. It never calls Massive.** The feed is the sole
Massive writer for bus topics (Arch 28, unchanged).

### 6.1 Subscribe, do not poll

**GP13 — the hydrator subscribes to `mb:pub`** (**M11**) and hydrates on notification.

A 6-second TTL (**M5**) makes polling structurally unsound: any interval ≥ 6 s can miss generations
entirely, and an interval < 6 s is a busy loop against Redis for data that changes every ~2 s.

| Rule | |
|---|---|
| **Primary** | Subscribe `mb:pub`; on a message whose `topic` matches `mb:ladder:*`, `get_json(topic)` → `from_ladder_payload` → `ContractStore.put` |
| **Backstop** | `mb:pub` is **best-effort** — `store.py:52` swallows publish errors. A periodic reconcile scan (interval config, default 30 s) over `mb:ladder:*` catches missed notifications |
| **Idempotent** | Re-hydrating an unchanged `content_hash` is a no-op, not a rewrite |
| **Ordered** | A generation with an **older** `as_of` than the one held **never replaces** it (**AT-GP8**) |

### 6.2 Holding past TTL

**GP14 — the store may hold a generation past its Redis TTL, marked stale with its age.**

Without this, a 6-second TTL means the store is empty most of the time and every read is a miss.
Holding is honest **only if** the age is carried and the reader can act on it:

| Field | |
|---|---|
| `as_of` | The generation's own timestamp, unmodified |
| `hydrated_at` | When the hydrator wrote it |
| `stale_ms` | `now − as_of`, computed at read |
| `stale` | `stale_ms > LABS_OPF_STORE_MAX_STALE_MS` (config, no default — **GP21**) |

**A stale generation is served and marked. It is never silently refreshed, and never discarded
without being reported** (**AT-GP9**). The reader decides; the plane discloses.

### 6.3 Failure

**GP15 — hydration failure is loud and local.** A Redis outage, a malformed payload, or a schema
mismatch produces a **reported state** — not an empty store that looks like a quiet market. Health
and the visibility endpoint both distinguish **empty**, **stale**, and **broken**.

---

## 7. The listed writer (P4)

**GP16 — no wings clamp, `allow_truncate=False`, page until complete or fail loud.**

**GP17 — `max_pages=3` is not reused.** It is the Heatmap's bound and it fits weeklies at 2 and a
monthly Friday at 3 **by coincidence of this universe** (M10), not by derivation. The listed writer's
bound is derived from the expiration's listed contract count, or it fails loud.

| Rule | |
|---|---|
| **GP18** | Writes `book: "listed"`, `source: "listed_writer"` |
| **GP19** | **Enabled `(product, expiration)` pairs are enumerated config.** Cost is linear in pairs. *"The front expirations"* is a description, not a config value |
| **GP20** | **Rate-isolated.** Defers to the live Market Bus and chain generation budget; never starves a member surface. It is a batch citizen |
| **Budget, measured** | 18 pages / 3.87 s / 3.4 MB for 8 front SPX expirations, against MiniTwo's current continuous chain load of ≈ 0 (**M10**) |

---

## 8. Visibility — `GET /api/me/market/generation`

**GP21a — a client must be able to see emptiness, not infer it.**

```json
{
  "product": "SPX", "expiration": "2026-09-01",
  "state": "present | stale | cold | broken",
  "book": "wings | listed | null",
  "source": "bus | listed_writer | http_fill | client_body | null",
  "as_of": "…", "hydrated_at": "…", "stale_ms": 0,
  "row_count": 62, "wings": 15, "strike_lo": 0, "strike_hi": 0,
  "feed_clock": { "interest_present": true, "ttl_s": 45 },
  "store_clock": { "held": true, "age_ms": 0 },
  "bus": "up | down | not_configured"
}
```

| Rule | |
|---|---|
| `state` is explicit — **never** an empty object meaning "cold" |
| `book: null` ⇒ unusable for analytics (**GP6**) |
| Feed clock and store clock are **separate objects** (**GP10**) |
| `bus: "not_configured"` is a first-class state — it is MiniTwo's state today (**M4**) |

**GP21b — health tells the truth.** `GET /api/me/pricing/health`'s `generations_cached` must
reflect **hydrated** generations, not a posted body. Today it counts whatever the last request
pushed in.

---

## 9. Concurrency guard

**GP22 — while the store is process-local, `--workers` must be 1, and the process asserts it.**

M7 says the affinity bug is latent. This spec must not let it go live silently: **boot fails loud**
if a multi-worker configuration is detected while `ContractStore` is process-local. When the store
later moves to a shared plane, the assertion is removed in the same change that moves it.

This is the cheapest possible guard against the failure Arch 30 §11 already mis-describes.

---

## 10. Config (P7)

**GP23 — this plane's config fails loud on missing**, deviating deliberately from OPF's
default-on-missing pattern (**M12**).

| Key | |
|---|---|
| `LABS_MARKET_BUS` / `REDIS_URL` | Required when the plane is enabled |
| `LABS_OPF_HYDRATOR_ENABLED` | Explicit |
| `LABS_OPF_STORE_MAX_STALE_MS` | **No default** — the staleness threshold is a product decision |
| `LABS_OPF_LISTED_PAIRS` | Enumerated (**GP19**) |
| `LABS_OPF_RECONCILE_INTERVAL_S` | Backstop scan, default 30 |
| `GexPolicy` — multiplier per product, sign convention, scale | **Landed here, unused until compute unfreezes** |

**Why stricter than OPF:** a silently defaulted sign convention or multiplier produces a wrong
number with no failure. That is the class of value where a default is worse than a boot abort
(invariant 2). The deviation is declared, not accidental.

---

## 11. Arch 30 honesty (P0)

**GP24 — a truth change, not a code change.** Lima, same body of work:

| Arch 30 claim | Correction |
|---|---|
| §10 Redis "hours-scale TTL" | **6 s** (`ttl*3` on default 2.0) |
| §11 / §3 "Server L2–L4 is SoR for multi-worker" | Process-local `_store`, `_manager`, `_controller`. **N=1 today; the claim is false regardless** |
| §4 topology: feed → Redis → API | **Not running on MiniTwo.** The API fills Massive itself on miss |
| §6.1 OPF generation "may paginate for complete strikes" | **Law without a caller** until GP16 |
| §12 "Redis `mb:ladder:*` **is** L1 hot store" | L1 is a second, empty-until-POST dict. They do not meet |
| §17b archive | **Empty. No writer** |
| §17b "19 ATs" | 20 collected |
| §14 "L5 apps not wired" | Analyzer calls `/api/me/pricing/*` with posted generations |
| `pricing.py:27` "hydrate from body **or bus**" | Body only |
| `chain_feed --symbol` "default warm" | Unused; the feed idles on empty interest |

---

## 12. Acceptance tests

| ID | Test |
|---|---|
| **AT-GP1** | With Redis up and a `mb:ladder:*` key written, the hydrator populates `ContractStore` **with no HTTP request** — call-count assertion on the Massive client is **zero** |
| **AT-GP2** | A `source: "client_body"` generation is **rejected** by any analytics-facing read; the pricing what-if path still accepts it (**GP1a**) |
| **AT-GP3** | Every ingested generation carries `source`; a generation without one is rejected at `put` |
| **AT-GP4** | Feed-written generations carry `book: "wings"`; listed-writer generations carry `book: "listed"` |
| **AT-GP5** | A generation **without** `book` is unusable for analytics — not defaulted to wings |
| **AT-GP6** | Publish on `mb:pub` triggers hydration within one interval; **the backstop scan alone** also hydrates when publish is suppressed (proves both paths) |
| **AT-GP7** | Re-hydrating an unchanged `content_hash` performs no write |
| **AT-GP8** | A generation with an older `as_of` never replaces a newer held one |
| **AT-GP9** | Past `LABS_OPF_STORE_MAX_STALE_MS`, the generation is **served with `stale: true` and `stale_ms`** — not dropped, not silently refreshed |
| **AT-GP10** | Redis down → `state: "broken"`, `bus: "down"`. **Empty, stale and broken are three distinguishable states** |
| **AT-GP11** | `LABS_MARKET_BUS` unset → `bus: "not_configured"`, and the hydrator does not start |
| **AT-GP12** | Listed writer: no wings clamp; pages until complete; a truncation condition **fails loud** and writes nothing |
| **AT-GP13** | Listed writer does **not** use `max_pages=3`; its bound derives from the listed count (**GP17**) |
| **AT-GP14** | Listed writer defers under live budget pressure; a fixture proves it yields rather than starves |
| **AT-GP15** | `LABS_OPF_LISTED_PAIRS` unset → boot abort. Same for `LABS_OPF_STORE_MAX_STALE_MS` |
| **AT-GP16** | `GET /api/me/market/generation` returns each of `present / stale / cold / broken` on the matching fixture |
| **AT-GP17** | `health.generations_cached` counts **hydrated** generations; posting a body does not change it |
| **AT-GP18** | Feed clock and store clock are reported separately and may disagree without either being wrong (**M8**) |
| **AT-GP19** | Multi-worker configuration with a process-local store → **boot fails loud** (**GP22**) |
| **AT-GP20** | The existing 20 `test_opf_foundation.py` tests stay green throughout |

---

## 13. Non-goals

- **Exposure computation of any kind.** `analytics.py`, `gex_v2`, golden vectors — all frozen
- The analytics route, the Surface, the Profile, the Card, SVP tools
- **Golden vectors against a fixture-only store called "done"**
- A second archive beside StudioOne (**P5** decides; §14)
- Rewriting the pricing what-if path (**GP1a**)
- Moving `ContractStore` to a shared plane — guarded (**GP22**), not solved, in v0.1

---

## 14. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-GP1** | **P5 archive — pick one, never both.** (A) `archive_put` from the listed writer, OPF owns `as_of`. (B) StudioOne remains history; OPF archive stays unused; **GXA4 out of scope** | **Coach.** (B) unless the Surface needs listed history — StudioOne's snaps are wing-windowed and cannot serve a listed back-select |
| **OD-GP2** | `LABS_OPF_STORE_MAX_STALE_MS` starting value | Not a desk number. A live sitting — but it is **config with no default**, so a value must be chosen before boot |
| **OD-GP3** | Which host runs the plane — MiniTwo, or admit StudioTwo/SSR is the only live bus (**M4**) | **Foxtrot + Coach.** This is P1 and it gates everything |
| **OD-GP4** | Listed writer cadence | Derives from the Surface's freshness need, which is frozen. **Start with on-demand + a slow scheduled pass**; tighten when the consumer exists |
| **OD-GP5** | Does the hydrator run in-process with the API, or as its own launchd service? | **Own service.** In-process ties the plane's lifecycle to a web worker and re-creates GP22's problem in a new place |

---

## 15. Phases

| Phase | Deliverable | Exit | Gate |
|---|---|---|---|
| **P0** | Land this spec + L4-A v0.4 in `Specs/`; Arch 30 honesty (§11) | Docs match the tree | Lima · India |
| **P1** | **Plane bring-up** — Redis, `LABS_MARKET_BUS`, `chain_feed` launchd on the named host | `mb:ladder:*` key observable; `mb:pub` message observed | **Foxtrot** · India |
| **P2** | **Hydrator** (§6) + `source` (§3) + `book` (§4) | AT-GP1–11, AT-GP17, AT-GP20 | India · Delta |
| **P3** | **Visibility endpoint** (§8) + clock separation | AT-GP16, AT-GP18 | India · Mike |
| **P4** | **Listed writer** (§7) | AT-GP12–14 | India · Hotel |
| **P6** | **Auth** — read gate on the new endpoint, `product:` key, **not** `_require_tool_member`'s write default | Mike sign-off | Mike |
| **P7** | **Config** (§10) incl. `GexPolicy`, unused | AT-GP15, AT-GP19 | India |

**GXF-FREEZE lifts when P2 and P4 pass their gates** — the server obtains a generation it owns, and
says what book it is.

---

## 16. Change declaration

**Nothing has been touched.** Per packet, declared at its own gate.

**New:** `server/opf/hydrator.py` · `server/opf/listed_writer.py` ·
`server/routes/market_generation.py` · `server/tests/test_opf_generation_plane.py` ·
`Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_1.md`

**Modified:** `server/opf/generation.py` (`source`, `book`, staleness fields) ·
`server/opf/config.py` (§10) · `server/routes/pricing.py` (health counts hydrated) ·
`server/main.py` (router + hydrator lifecycle) · `Architecture/30-*.md` (§11) ·
`Architecture/00-decision-log.md` · `infra/deploy.md` (P1)

**Not touched:** the pricing what-if path (**GP1a**) · `opf/{keys,interest,leg,package,lock,resolve}.py` ·
the live ladder path and HM17/HM18 · every existing template · anything past the staging line

---

## 17. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. Implements Coach's P0–P7. **GP13 subscribe-not-poll** — `mb:pub` exists (M11) and a 6 s TTL makes polling structurally unsound. **GP14 hold-past-TTL, marked** — without it the store is empty most of the time. **GP2 `source` provenance** — makes GP1 enforceable rather than aspirational. **GP22 worker guard** — boot fails loud on multi-worker with a process-local store. Book law GP3–GP7. Three clocks GP8–GP10. Listed writer GP16–GP20. AT-GP1–20. P5 archive held as OD-GP1 |

**One-line law:**
**The feed writes, the hydrator subscribes, the store holds and says how old it is, the listed
writer pages until complete or fails — and every generation carries where it came from and which
book it is, because a plane that cannot answer those two questions is not a system of record.**