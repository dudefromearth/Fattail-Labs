# FatTail Labs — OPF Generation Plane Spec v0.2.2

**Status:** **INDIA-SIGNED** — v0.2 with the v0.2.1 errata applied inline. **No new law.**
**Date:** 2026-09-01
**Canonical filename:** `Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md`
**Short name:** **Generation Plane** / **GP**
**Signature:** India signed **v0.2.1** (v0.2 + E1–E3 errata). This document is that content
consolidated into one file for handover. **Nothing has been added, removed or reversed.**

**Read first:** `docs/OPF-REFERENCE-v1_1.md` — the as-built description of what runs. This spec
describes what changes.

**Parent:** `Architecture/30-options-pricing-foundation.md` (materially inaccurate — §10) ·
`Architecture/28-massive-market-bus.md`
**Consumer:** `Specs/IKI-Labs-Chain-Analytics-Read-Spec-v0_4.md` — **frozen** until this ships
**Evidence:** `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md`

---

## 0. Mission

```text
BEFORE                                   AFTER
──────────────────────────────────       ─────────────────────────────────────────────────
browser ─POST─► _store  (the SoR)        chain_feed ──► mb:ladder:…:w{N}:dual ──┐
                                         listed writer ► mb:ladder:…:listed:dual ┤
                                                                    │ mb:pub     │
                                                       in-process hydrator ◄──────┘
                                                                    │
                                                    ContractStore[namespace=owned]
                                                                    │
                                       what-if POST ► ContractStore[namespace=supplied]
```

**Two conditions lift the GEX freeze**, and both are demonstrable:

1. **The server obtains a generation it owns** — not one a browser posted
2. **The server can say what book it is** — `wings` or `listed`, stamped and persisted

**Staged lift:**

| Lifts | When | Enables |
|---|---|---|
| **Compute on `wings`** | **P2 + P3** green on a host where `bus ≠ not_configured` | An honest window Surface, labelled `book: "wings"` |
| **Compute on `listed`** | **P4** green | Listed GEX |

`book: "wings"` **is** a book. Blocking an honest, labelled window surface on a writer nobody needs
yet is a cost with no safety benefit.

---

## 1. Ownership, provenance, namespace

**GP1 — a generation the server computes on is one the server obtained.** Client-supplied
generations are never a source for analytics or Intelligence.

**GP1a — the pricing what-if path is not broken.** `resolve`, `package-quote` and `lock` keep
accepting posted generations; Analyzer depends on it (`opfPricingApi.ts:160–165, 216–218`).

**GP2 — every generation carries `source`, set at ingestion, never rewritten.**

```text
source ∈ { "bus" | "listed_writer" | "http_fill" | "client_body" }
```

**GP2a — `http_fill` is real and not analytics-facing.** `chain_ladder`'s single-flight miss fill
produces genuine generations, but they are request-triggered and wing-clamped. Lawful for the
ladder; **excluded from analytics** alongside `client_body`.

### 1.1 Namespace

**Stamping `source` without a key rule is theatre.** `_hydrate` and the hydrator would address the
same `bus_key(ul, exp, wings)` — last write wins, and `health.generations_cached` means nothing.

**GP2b — `ContractStore` is namespaced. A namespace is part of the key, not a filter.**

```text
namespace ∈ { "owned", "supplied" }

owned    ← source ∈ { bus, listed_writer }        key = (chain_underlier, expiration, book, wings|None)
supplied ← source ∈ { client_body, http_fill }    key = (identity_id, chain_underlier, expiration, wings)
```

| Rule | |
|---|---|
| `put` / `get` / `get_by_expiration` **take a namespace.** There is no unnamespaced accessor |
| **Every reader declares the namespaces it accepts.** Pricing accepts `supplied` then `owned` — today's precedence, preserved. **Analytics accepts `owned` only** |
| Cross-namespace overwrite is **impossible by construction**, not prevented by a rule. A refuse-rule's failure mode is a race, and a race is what a two-writer key produces |
| `health.generations_cached` counts **`owned`** |
| **`supplied` carries identity in its key.** Two members posting different what-if generations for one expiration must not collide, and no member prices against another's book |
| **`supplied` entries expire at `put_at + 60 s`**, swept lazily on read and on the reconcile tick. **`owned` never expires from the store** — its age is `stale_ms`, a different thing |

**GP2c — `get_by_expiration` takes `book`.** It currently returns the first match
(`generation.py:70–76`); with two books for one expiration that is a coin flip. **Every lookup that
can resolve to more than one book declares which.**

---

## 2. Book law

| # | Law |
|---|---|
| **GP3** | **The live ladder path stays `wings`.** HM17/HM18 unchanged |
| **GP4** | **A separate `listed` writer serves analytics and archive** — §5 |
| **GP5** | **`book` is persisted on the envelope**, set at write, not derived at hydrate. `book ∈ {"wings","listed"}` |
| **GP6** | **Never inferred from row count.** Absent `book` ⇒ unusable for analytics, not defaulted to wings |
| **GP7** | **No wing-window value is labelled chain GEX** — payload, chrome, tooltip, export, print template |

**Measured:** a 0DTE SPX generation at `wings=15` is **62 rows**; the full listed chain for the same
expiration is **496 contracts across 248 strikes**.

---

## 3. The three clocks

**GP8 — name them, never conflate them.**

| Clock | Value | Governs |
|---|---|---|
| **Feed clock** | Redis `mb:interest:*`, **45 s** | whether the feed pulls |
| **Store clock** | the hydrated generation and its age | **what a reader may read** |
| **Process refcount** | `InterestManager`, never expires | admission budget only |

**GP9 — the refcount is a budget, never warmth.** No path may read `held_count()` or topic presence
as evidence a generation exists.

**GP10 — divergence is reported, not reconciled silently.**

---

## 4. The hydrator (P2)

**GP11 — the hydrator runs IN-PROCESS**, as a FastAPI lifespan-managed asyncio task inside the API
process.

`ContractStore` is a module-level dict (`routes/pricing.py:28`). **A separate process cannot write
to it** — an out-of-process hydrator would go green while the API stayed empty. GP11's requirement
was only ever *"not inside a member request"*, which an in-process background task satisfies. An own
service becomes correct after the store moves to a shared plane — out of scope, guarded by **GP22**.

**GP12 — it reads Redis and writes `ContractStore`. It never calls Massive.**

### 4.1 Subscribe, do not poll

**GP13 — subscribe to `mb:pub`.** `store.py:45–54` publishes `{topic, hash, ts}` on every
`set_json`. A **6-second** TTL makes polling structurally unsound: any interval ≥ 6 s misses
generations, anything shorter is a busy loop.

| | |
|---|---|
| **Primary** | `mb:pub` message with `topic` matching `mb:ladder:*` → `get_json(topic)` → `from_ladder_payload` → `put(namespace="owned")` |
| **Backstop** | Publish is **best-effort** (`store.py:52` swallows errors). Reconcile scan over `mb:ladder:*` every `LABS_OPF_RECONCILE_INTERVAL_S` (default 30) |
| **Idempotent** | Unchanged `content_hash` ⇒ no write |
| **Ordered** | An older `as_of` never replaces a newer held generation |

### 4.2 Holding past TTL

**GP14 — the store may hold a generation past its Redis TTL, marked stale with its age.** Without
it, a 6-second TTL means the store is empty most of the time.

`as_of` (unmodified) · `hydrated_at` · `stale_ms = now − as_of` ·
`stale = stale_ms > LABS_OPF_STORE_MAX_STALE_MS`.

**Served and marked. Never silently refreshed, never discarded without report.**

**GP15 — hydration failure is loud and local.** **Empty**, **stale** and **broken** are three
distinguishable states. A Redis outage must not look like a quiet market.

---

## 5. The listed writer (P4)

**GP16 — no wings clamp; `allow_truncate=False`; page until complete or fail loud.**

**GP17 — `max_pages=3` is not reused.** It fits weeklies at 2 and a monthly Friday at 3 by
coincidence of this universe, not by derivation. The bound derives from the expiration's listed
count, or it fails loud.

### 5.1 Address

**GP18 — the listed writer writes Redis, on its own key, through the same path.**

```text
mb:ladder:{chain_underlier}:{expiration}:listed:dual
```

| Rule | |
|---|---|
| **One path** | Listed writer → `set_json` → `mb:pub` → hydrator → `ContractStore[owned]`. Not a private side-channel |
| **Never overwrites the wings key.** Two books, two keys, both live |
| **`book` and `source` set at write**, by the writer, not inferred at hydrate |
| **`w0` is banned** as a listed marker — a magic number where a token belongs |

**GP18a — `parse_ladder_topic` is extended.** `_WINGS_RE` requires `w(\d+)` at position −2 for a
dual key (`keys.py:63–70`); `listed` would fail to parse and the hydrator would ignore its own
writer's key.

```python
LadderTopic += book: "wings" | "listed"
              wings: int | None      # None when book == "listed"
```

Parsing stays **end-anchored** — `chain_underlier` may contain a colon (`I:SPX`).
`bus_ladder_key()` gains a `book` argument. **This is the one existing OPF module this spec
modifies.**

**GP19 — enabled `(product, expiration)` pairs are enumerated config.** Cost is linear in pairs.

**GP20 — the listed writer is a batch citizen, by schedule.** It runs on its **own cadence**, never
on a member request path, and its pair list is **bounded config**, so its ceiling is known before it
runs. Measured budget: **18 pages / 3.87 s / 3.4 MB** for 8 front SPX expirations, against MiniTwo's
current continuous chain load of ≈ 0.

*(A dynamic-deference law was withdrawn: there is no shared limiter or pause flag today, so it would
have been an assertion with nothing to test. It returns if a limiter lands.)*

---

## 6. Plane-owned interest (P1)

**GP21 — the plane holds standing interest for the topics it claims.**

`chain_feed.tick` reads `list_interest_topics("mb:ladder:")` and, **on empty, prints `no interest
keys; idle` and returns** (`chain_feed.py:45–48`); `--symbol` is defined and never read. Without
this law, P1's *"key observable"* is a manual touch in a test and the host stays dark.

| Rule | |
|---|---|
| The plane **touches interest on a heartbeat shorter than the 45 s grace** (default 15 s) for **(a)** each enumerated listed pair and **(b)** each `LABS_OPF_PLANE_WINGS_TOPICS` entry |
| **Member-driven Heatmap interest is unchanged** — the plane adds its own, it does not replace theirs |
| **Attribution is metadata, never a key prefix.** The plane writes the **same** `mb:interest:{topic}` key the member path writes; `source: "plane"` lives in a sidecar (`mb:interest_src:{topic}`) or in the visibility payload's `held_by`. **A decorated topic is invisible to `list_interest_topics` and the feed idles** |
| The heartbeat stops when the plane is disabled — no orphaned interest keeping a feed pulling for nobody |

---

## 7. Visibility — `GET /api/me/market/generation` (P3)

**GP22a — a client must see emptiness, not infer it.**

```json
{
  "product": "SPX", "expiration": "2026-09-01", "book": "wings",
  "state": "present | stale | cold | broken",
  "namespace": "owned",
  "source": "bus | listed_writer | null",
  "as_of": "…", "hydrated_at": "…", "stale_ms": 0, "stale": false,
  "row_count": 62, "wings": 15, "strike_lo": 0, "strike_hi": 0,
  "feed_clock":  { "interest_present": true, "ttl_s": 45, "held_by": ["member","plane"] },
  "store_clock": { "held": true, "age_ms": 0 },
  "bus": "up | down | not_configured"
}
```

**Owned-only.** Query is `product + expiration + book`; **`book` is a parameter, never a guess**
(**GP2c**). Feed clock and store clock are separate objects and may disagree.

**Auth (P6): a read capability on a `product:` target key.** **Do not copy
`_require_tool_member()`** — it defaults to `capability="write"` on `app:trade-log`, so a read-only
grid would require Trade Log write. The `product:` grammar exists (`access_control/keys.py:9,
37–44`).

**GP22b — health counts `owned`.** `generations_cached` must not move when a body is posted.

---

## 8. Concurrency guard

**GP23 — while `ContractStore` is process-local, `--workers` must be 1, and the process asserts
it.** Boot fails loud on a multi-worker configuration. The assertion is removed in the same change
that moves the store to a shared plane.

---

## 9. Config

**GP24 — each subsystem validates only its own config, and only when enabled.** A **wings-only
plane is a complete configuration** — hydrator on, listed writer off, `LISTED_PAIRS` absent, no
abort and no warning about a subsystem nobody asked for.

| Subsystem | Required when enabled | Missing ⇒ |
|---|---|---|
| **Hydrator** | `LABS_OPF_HYDRATOR_ENABLED` · `LABS_MARKET_BUS`/`REDIS_URL` · `LABS_OPF_STORE_MAX_STALE_MS` *(recommended **20000**)* | **the hydrator** does not start |
| **Listed writer** | `LABS_OPF_LISTED_PAIRS` | **the listed writer** does not start. Hydrator unaffected |
| **Plane interest** | `LABS_OPF_INTEREST_HEARTBEAT_S` *(15)* · `LABS_OPF_PLANE_WINGS_TOPICS` *(default **empty**)* | the heartbeat does not start |
| **Parked** | `GexPolicy` — multiplier per product, sign convention, scale | **unused. P7 may not grow into compute** |

`LABS_OPF_RECONCILE_INTERVAL_S` default 30.

### 9.1 `LABS_OPF_PLANE_WINGS_TOPICS`

| Value | Meaning |
|---|---|
| **empty** *(default)* | **Plane interest covers listed pairs only.** Wings topics are warm exactly when a Heatmap member touches them — today's behaviour |
| enumerated | The plane also heartbeats those wings topics, so they stay warm with nobody watching |

**Consequence, recorded rather than buried:** with the default empty, **wings compute after P2+P3
reads generations that exist only while a member is watching.** Acceptable for a member-facing read;
unacceptable for server-side publishing — which is frozen anyway.

### 9.2 ⚠ `opf.config._env` cannot express "set to empty"

```python
def _env(name, default=None):
    raw = os.environ.get(name)
    if raw is None or str(raw).strip() == "":
        return default          # ← empty string collapses to the default
    return str(raw).strip()
```

**`LABS_OPF_PLANE_WINGS_TOPICS=""` would silently become the default.** Any config where *empty* is
meaningful **must not use `_env` as written** — it needs a helper distinguishing **unset** from
**set-to-empty**, or a sentinel.

**Empty is not missing. Abort only when a key is required-and-unset for a subsystem that is
enabled.**

### 9.3 Three states, and the API always boots

The plane is optional. Taking member-facing routes down for it is a blast radius nobody asked for.

| Condition | State | Hydrator | API |
|---|---|---|---|
| `HYDRATOR_ENABLED=false` | **`not_configured`** | does not start | **boots** |
| Enabled, required config **missing** | **`misconfigured`** | does not start; error logged and surfaced | **boots** |
| Enabled, configured, Redis **unreachable** | **`down`** | starts, retries with backoff | **boots** |

*Deliberately off*, *wrongly configured* and *configured but unreachable* are three different
operator problems and must never collapse into one string. **Fail-loud is satisfied by the subsystem
refusing to start and saying so — not by killing the API.**

---

## 10. Arch 30 honesty (P0)

A truth change, not a code change. Lima: §10 TTL is seconds not hours · §11/§3 multi-worker SoR is
false · §4 topology not running on the API host · §6.1 pagination has no caller until GP16 · §12
Redis is not L1 · §17b archive empty and 19→20 ATs · `pricing.py:27` "or bus" · `chain_feed
--symbol` unused · §14 L5 already wired via Analyzer · §9 interest budget is per-process.

---

## 11. Acceptance tests

| ID | Test |
|---|---|
| **AT-GP1** | Redis up + a `mb:ladder:*` key written → hydrator populates `ContractStore[owned]` with **zero** Massive calls |
| **AT-GP2** | A store helper rejects `namespace="supplied"` for an analytics-class read. **Bound to the helper, not a URL** — no analytics route exists |
| **AT-GP3** | Every ingested generation carries `source`; a `put` without one is rejected |
| **AT-GP4** | Feed writes carry `book: "wings"`; listed-writer writes carry `book: "listed"` |
| **AT-GP5** | A generation without `book` is unusable for analytics — not defaulted |
| **AT-GP6** | `mb:pub` triggers hydration; **with publish suppressed, the backstop scan alone still hydrates** |
| **AT-GP7** | Unchanged `content_hash` → no write |
| **AT-GP8** | Older `as_of` never replaces a newer held generation |
| **AT-GP9** | Past `LABS_OPF_STORE_MAX_STALE_MS` → served with `stale: true` and `stale_ms`; not dropped, not silently refreshed |
| **AT-GP10** | Redis down → `state: "broken"`, `bus: "down"`. Empty, stale and broken are three distinguishable states |
| **AT-GP11** | All three of `not_configured` / `misconfigured` / `down`, **and the API serves a request in each** |
| **AT-GP12** | Listed writer: no wings clamp; pages until complete; truncation **fails loud and writes nothing** |
| **AT-GP13** | Listed writer's page bound derives from the listed count, not `max_pages=3` |
| **AT-GP15a** | Hydrator enabled with `STORE_MAX_STALE_MS` unset → hydrator does not start. **`LISTED_PAIRS` is not consulted** |
| **AT-GP15b** | Hydrator enabled, listed writer **disabled**, `LISTED_PAIRS` **absent** → **plane runs; no abort, no warning** |
| **AT-GP15c** | Listed writer enabled with `LISTED_PAIRS` unset → listed writer does not start; **hydrator keeps running** |
| **AT-GP16** | Visibility returns each of `present / stale / cold / broken`, and takes `book` as a parameter |
| **AT-GP17** | `health.generations_cached` counts `owned` only; **posting a body does not change it** |
| **AT-GP18** | Feed clock and store clock reported separately; they may disagree without either being wrong |
| **AT-GP19** | Multi-worker config with a process-local store → **boot fails loud** |
| **AT-GP20** | The existing **20** `test_opf_foundation.py` tests stay green |
| **AT-GP21** | Member A posts a what-if for `(SPX, 2026-09-01, w25)`; member B posts a different one for the same tuple; the bus hydrates the same tuple. **Three entries coexist.** A's pricing sees A's, B's sees B's, an analytics-class read sees **only** `owned`. `generations_cached` counts **1** |
| **AT-GP22** | `mb:ladder:I:SPX:2026-09-01:listed:dual` → `book: "listed"`, `wings: None`. **`…:w15:dual` still parses with `I:SPX` intact.** Legacy single-side unchanged. A non-ladder topic → `None` |
| **AT-GP23** | Plane enabled, no member watching → `mb:interest:*` holds the enumerated pairs, the topic string is returned **unmodified** by `list_interest_topics("mb:ladder:")`, and `chain_feed.tick` does not idle |

*(AT-GP14 withdrawn with GP20's dynamic-deference clause.)*

---

## 12. Open decisions

| # | Question | Disposition |
|---|---|---|
| **OD-GP1** | Archive — (A) `archive_put` from the listed writer, or (B) StudioOne remains history | **(B)** until a listed consumer exists. StudioOne's snaps are wing-windowed and cannot back-select listed. **`archive_put` is not built in this work** |
| **OD-GP2** | `LABS_OPF_STORE_MAX_STALE_MS` | **20 000 ms** as the deployment's starting value — ~3× the 6 s Redis TTL, so a normal gap does not mark stale. **No code default**; the subsystem does not start if unset |
| **OD-GP3** | Which host runs the plane | **Named in the same GO as P1.** MiniTwo without Redis is `bus: "not_configured"` **by law**, not a failed hydrator |
| **OD-GP4** | Listed writer cadence | Derives from the Surface's freshness need, which is frozen. **On-demand plus a slow scheduled pass**; tighten when the consumer exists |
| **OD-GP5** | Hydrator process model | **In-process** until the store is shared |
| **OD-GP6** | `supplied` eviction | **60 s TTL.** Request-scoped plumbing through `resolve` is a second packet |
| **OD-GP7** | Identity in the `supplied` key | **Yes** — §1.1 |

---

## 13. Phases

| Phase | Deliverable | Exit | Gate |
|---|---|---|---|
| **P0** | Land this + OPF Reference v1.1 + L4-A v0.4 in `Specs/`; Arch 30 honesty | Docs match the tree | Lima · India |
| **P1** | **Plane bring-up** — Redis, `LABS_MARKET_BUS`, `chain_feed` launchd, plane-owned interest | `mb:ladder:*` key and an `mb:pub` message observed **with no member watching** | **Foxtrot** · India |
| **P2** | **Hydrator in-process** + `source` + `book` + namespace | AT-GP1–11, 15a–c, 17, 20, 21, 22 | India · Delta |
| **P3** | **Visibility endpoint** + clock separation | AT-GP16, 18, 23 | India · Mike |
| **P4** | **Listed writer** + key + parser extension | AT-GP12, 13 | India · Hotel |
| **P6** | **Auth** — read gate, `product:` key | Mike | Mike |
| **P7** | **Config** incl. parked `GexPolicy` | AT-GP15a–c, 19 | India |

**Freeze lift:** **wings compute after P2 + P3**; **listed compute after P4**.

---

## 14. Non-goals

- **Exposure computation of any kind.** `analytics.py`, `gex_v2`, golden vectors — all frozen
- The analytics route, the Surface, the Profile, the Card, SVP tools
- **Golden vectors against a fixture-only store called "done"**
- A second archive beside StudioOne (**OD-GP1 = B**)
- Rewriting the pricing what-if path (**GP1a**)
- Moving `ContractStore` to a shared plane — **guarded** (GP23), not solved

---

## 15. Change declaration

**Nothing touched.** Declared per packet at its gate.

**New:** `server/opf/hydrator.py` · `server/opf/listed_writer.py` *(P4)* ·
`server/opf/plane_interest.py` · `server/opf/store_read.py` *(analytics-class helper)* ·
`server/routes/market_generation.py` · `server/tests/test_opf_generation_plane.py` · this spec

**Modified:** `server/opf/generation.py` (namespace, `source`, `book`, staleness, book-aware
lookup) · **`server/opf/keys.py`** (`book` token, `LadderTopic.book`, `bus_ladder_key(book=…)`) ·
`server/opf/config.py` · `server/routes/pricing.py` (`_hydrate` → `namespace="supplied"`; health
counts `owned`) · `server/main.py` (router + hydrator lifespan) · `Architecture/30-*.md` ·
`Architecture/00-decision-log.md` · `infra/deploy.md` (P1)

**Not touched:** the pricing what-if **behaviour** (GP1a) ·
`opf/{interest,leg,package,lock,resolve,archive}.py` · the live ladder path and HM17/HM18 · every
existing template · anything past the staging line

---

## 16. Document control

| Version | Date | Notes |
|---|---|---|
| v0.1 | 2026-09-01 | Initial P0–P7 work order |
| v0.2 | 2026-09-01 | Review fold R1–R12 — hydrator in-process; namespaced store; listed key + parser; plane-owned interest; staged freeze lift |
| v0.2.1 | 2026-09-01 | Errata E1–E3 — per-subsystem config gates; OD-GP6/GP7 frozen; `PLANE_WINGS_TOPICS`. **India-signed** |
| **v0.2.2** | 2026-09-01 | **Consolidation of the India-signed content into one file.** v0.2.1's errata applied inline; §9.2 `_env` constraint added from OPF Reference §5.1 as an implementation note. **No new law, nothing reversed** |

**One-line law:**
**The feed and the listed writer each publish to their own key, one in-process hydrator subscribes
and writes the owned namespace, what-if bodies land somewhere else entirely — and the plane holds
its own interest, because a feed nobody is watching does not run.**