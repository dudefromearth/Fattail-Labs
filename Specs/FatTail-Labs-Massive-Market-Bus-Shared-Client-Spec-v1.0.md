# FatTail Labs — Massive Market Bus & Shared Client Spec v1.0

**Status:** **DRAFT** — specialist gates incomplete; **Coach GO blocked** until §18 gate table PASS  
**Date:** 2026-08-10  
**Current revision:** **v1.0.1**  
**Type:** Architecture authority — **shared market data plane** (transport + generation store). **Not** a member surface Spec for header chrome or app naming.  

**Short name:** **Market Bus** (MB)

**Version scheme:** Labs Spec style **`v1.0.1`** (same family as Options Chain Picker). Avoid a third dialect (`v1.0.0` semver-only).

**Content hash (v1.0.1 review-fold body):**  
`b0778ad4ce0d7bb220ca0e21a2630c891dd002c5` — `shasum -a 1` of this file at fold (re-hash at Coach GO if further amends).

---

## 0. Mission

Provide **one Labs market data plane** so that:

1. **Massive** is consumed by **few dedicated feed processes** (not by N browsers and not by N request handlers).
2. Live values and option-chain **generations** live in a **shared server-side cache with pub/sub** (**Redis** — see §1.1 posture reversal).
3. Every member browser tab uses **at most one WebSocket** to Labs for market data while any mounted market consumer needs it.
4. **All FatTail Labs apps** that need live market data share **one client module** that owns that socket (chain ladder surface, charts, capital, Strategy Lab, …).
5. Headcount scales **sockets and fan-out**, not **Massive call volume**. Hot topics scale with **universe + interest**, not concurrent members.

**What this is not:** a second MarketSwarm; a per-widget socket farm; browsers talking to Redis or Massive; silent proxy SPX/VIX math (OC2 / Arch/18 still bind); **legislation of a live member header product** (see §0.1).

### 0.1 Header live marks — *possible* consumer only (not product law)

This Spec **may** describe topics and interest patterns that a **future** main-header surface could use (`session:market_status`, flagship `sym:*`, shell-lifetime socket).

| This Spec does | This Spec does **not** |
|----------------|------------------------|
| Allow the bus to serve session status and symbols | Ratify “always-on ticking prices in every `/app` chrome” as a member surface |
| Keep header as an **optional** eager/base-interest *capability* | Bypass Tango / Echo product review of calm / process-over-P&L chrome |

**Product law for a live header** requires a **small surface Spec** (Tango · Echo · Coach) — orientation vs dopamine furniture is an explicit argument, not a transport side-door. Until that Spec is ratified, **no phase exit criteria** may require a live header UI; feed topics for status/symbols remain lawful for **any** entitled consumer that opts in.

### 0.2 Surface naming (no silent “Options Lab” ratification)

| Name in this Spec | Meaning |
|-------------------|---------|
| **Chain ladder surface** | The member options chain product governed by [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) |
| **Market / analyzer parent** | Nav parent area; path family `/app/market/*` and as-built `/app/options-lab` — **OD-nav open** in the picker bench plan until Coach ratifies label |
| **“Options Lab”** | **As-built card/route string only** — not product-catalog ratification. Catalog “Lab” weight (Practice Lab, Strategy Lab) means **Coach + Echo settle OD-nav once**; this transport Spec must not invent a third settled name |

---

## 1. Parents / companions (normative where noted)

| Spec / doc | Role |
|------------|------|
| [Architecture/18 — Shared live marks stream](../Architecture/18-shared-live-marks-stream.md) | Marks SoR · proxy doctrine · single poller idea · VIX1D · **MySQL marks posture** |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Ladder UI · **OC15** · universe SoR · diff protocol · proxy-safe spot · **OC6 / OC6a** · as-built routes |
| [Options Chain Picker Full Agent Bench Plan v1.0](../docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md) | **H1-2** OC15 in-process · ordering vs MB-P1 (§1.2) |
| [Massive Market Bus Full Agent Bench Plan v1.0](../docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md) (**v1.0.1**) | **Implementation program** · full agent seating · W0…Z · AT matrix |
| Admin **market_symbol_universe** | **Sole product-symbol SoR** for which names may be streamed |
| Claude.md / deploy playbook | MiniTwo · launchd · no MSC · config fail-loud |
| Human Interface Spec v1.0 | Binds **any** future chrome that consumes the bus (not a grant to build header) |

### 1.1 Redis — posture reversal (must appear in DL at GO)

**Prior posture (honest):**

- Chain Picker Spec mission: not an “always-on multi-worker Redis pipeline.”
- Arch/18 shape: **MySQL + single poller** to avoid standing market infra beyond the DB.

**This Spec reverses that for the *live multi-worker / multi-process* path** — defensibly, because concurrent chain/symbol consumers make process-local generation insufficient.

| | Arch/18 marks path | Market Bus path |
|--|--------------------|-----------------|
| Store | MySQL `market_live_marks` | **Redis** last-value + pub/sub (+ optional dual-write marks) |
| Writer | `live_stream` poller | `labs-*-feed` (one writer per class) |
| Readers | Many HTTP handlers | API workers + WS fan-out |
| Infra | MySQL only | **First Labs stateful service beyond MySQL** for market live |

**At Coach GO, DL must:**

1. Name this as a **posture reversal**, not an incremental add-on.  
2. State reasoning (scale: headcount vs Massive; multi-worker correctness).  
3. Name ops ownership (Foxtrot): launchd unit, localhost bind, fail-loud if Redis down (MB10/MB12).  
4. Affirm **MB11** (no MSC Redis schemas).

Process-local TTL cache remains lawful as **OC15 minimal** for single-worker / pre-Redis (see §1.2) — not as production multi-member scale.

### 1.2 OC15 program ordering (Juliet) — no double implementation theater

| Workstream | What it is | Evidence owner |
|------------|------------|----------------|
| **Picker H1-2** | OC15 **minimal**: in-process generation key + single-flight + N readers share **within one API process** | Kilo @ H1-G — **does not** claim multi-worker Redis |
| **MB-P1** | OC15 **production scale**: Redis generation store + single-flight + multi-worker; ladder read path prefers store | Delta @ MB-P1-G — **successor** to H1-2 |

**Law:**

1. H1-2 is **redefined** as “OC15 minimal (in-process, single-worker honest)” if not already closed.  
2. MB-P1 is the **named successor**; H1-G must **cite** this Spec §1.2 so Delta does **not** pass OC15 twice on unrelated evidence.  
3. **Forbidden:** two independent “OC15 done” claims (in-process and Redis) without an explicit successor link in the gate report.

If H1-2 is not yet implemented when MB-P0 GOs, Juliet may **fold H1-2 into MB-P1** and mark H1-2 **superseded-by-MB-P1** on the picker board — still one evidence trail.

### 1.3 Supersession / extension

| Topic | Law |
|-------|-----|
| **OC15** | Remains chain law; this Spec **implements** the multi-process scale form. |
| **Arch/18 marks** | Remain lawful for Curate / non-WS readers until cutover (§15 O2 **exit**). |
| **Chain ladder poll** | **Transitional.** After MB-P5, happy path is shared **WebSocket** client; poll only degraded fallback with fail-loud UI. |

---

## 2. Laws

| ID | Law |
|----|-----|
| **MB1 — Sole upstream owner** | Only **feed processes** (or an explicitly named single-writer task) open Massive for **live** market bus topics. Member request handlers and Next.js **must not** call Massive for steady-state quotes, chains, or market status. |
| **MB2 — Shared generation store** | Live last-values and chain generations are written to a **shared store with pub/sub** (default: **Redis** on the Labs host). Multi-worker API and separate feed processes **must** use this store — process-local-only caches are **not** sufficient for production multi-worker scale. |
| **MB3 — One WebSocket per tab** | While the member market client is active, the browser maintains **at most one** market WebSocket to Labs for that tab. Widgets and apps **must not** open additional market sockets. |
| **MB4 — Shared client module** | All Labs apps obtain market data through **one** web module (provider + hooks). The chain ladder surface is a **consumer**, not the owner of the transport. |
| **MB5 — Interest, not ambient OPRA** | The feed warms topics in **`eager_set ∪ demand_set`**. Demand is derived from **active WS interest** (and any **opt-in** shell base interest from a *ratified* surface Spec). The bus does **not** stream the entire US options tape. |
| **MB6 — Universe SoR** | Subscribable product symbols ⊆ **enabled** `market_symbol_universe`. Unknown / disabled symbols → reject `sub` with clear error. |
| **MB7 — Snapshot then delta** | On subscribe **or reconnect**, server sends **current snapshot** for each topic, then **updates** (full replace, tick, or chain diff). Clients must not assume they only see “next tick.” |
| **MB8 — Proxy honesty** | Arch/18 / OC2: proxy marks remain **labeled** end-to-end on the bus. Index strike math and σ/vol inputs **must not** use proxy mids. Chain generations **must not** be centered on proxy spot. UI `~` allowed where proxy is the only mark. |
| **MB9 — Auth on the gate** | WS and any REST snapshot routes require **session** + tool-member gate family. Redis is **never** exposed to the public internet. |
| **MB10 — Fail loud** | Missing Massive key, feed dead, Redis down, or stale beyond policy → explicit client `err` / UI state — not a silent empty “healthy” board. |
| **MB11 — No MSC** | No MarketSwarm-Canonical code, protocols, or shared Redis schemas from MSC. |
| **MB12 — Config fail-loud** | Redis URL, feed intervals, and Massive credentials come from env/config; missing required config **raises** at process start. |

---

## 3. Architecture

```text
                    ┌──────────────────────────────────────┐
   Browsers         │  Labs web (Next.js)                  │
   (N tabs)         │  MarketClient — ONE WebSocket / tab  │
                    │    chain ladder · charts · …         │
                    │    (+ future header if surface Spec) │
                    └──────────────────┬───────────────────┘
                                       │  wss://…/api/me/market/stream
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  labs-api  (FastAPI)                 │
                    │  · auth · interest registry          │
                    │  · snapshot from store               │
                    │  · fan-out pub/sub → sockets         │
                    │  · optional L1 cache (ms)            │
                    └──────────────────┬───────────────────┘
                                       │
                    ┌──────────────────▼───────────────────┐
                    │  Redis (Labs host, 127.0.0.1)        │
                    │  · last-value keys · pub/sub         │
                    └──────────────────▲───────────────────┘
                                       │ SET + PUBLISH
              ┌────────────────────────┴───────────────────────┐
              │                                                │
   ┌──────────▼──────────┐                      ┌─────────────▼────────────┐
   │ labs-sym-feed       │                      │ labs-chain-feed          │
   │ · universe quotes   │                      │ · option chain snapshots │
   │ · market status     │                      │ · listed-strike windows  │
   └──────────┬──────────┘                      └─────────────┬────────────┘
              │                                                │
              └────────────────────┬───────────────────────────┘
                                   ▼
                              Massive API
```

**Deployment (MiniTwo / launchd) — Foxtrot:**

| Unit | Cardinality | Role |
|------|-------------|------|
| `redis` | 1 | Shared store + pub/sub; **localhost only** |
| `labs-market-feed` **or** split sym/chain | **1 writer per upstream class** | Sole Massive consumers for the bus |
| `labs-api` | 1+ workers OK | WS gateway + REST; **read** store |
| `web` | Next built output | Shared client only |

**Hard rule:** never two chain-feed (or two sym-feed) writers without leader election.

---

## 4. Topic model

Clients subscribe by **intent**; gateway maps to topics.

### 4.1 Session / ops (global)

| Topic | Source (Massive) | Cadence | Who may consume |
|-------|------------------|---------|-----------------|
| `session:market_status` | `GET /v1/marketstatus/now` (+ optional upcoming) | Slow (30–60s or on change) | Any entitled app; **header only if surface Spec exists** |

### 4.2 Symbol last-value

| Topic | Source | Cadence |
|-------|--------|---------|
| `sym:{PRODUCT}` | Snapshot and/or Massive WS **if entitled** (§8.3 probe) | Near real-time |

### 4.3 Optional bars

| Topic | Notes |
|-------|--------|
| `bar:{PRODUCT}:{tf}` | Live follow only; **history hydrate stays REST** |

### 4.4 Option chain generations

| Topic | Source | Consumers |
|-------|--------|-----------|
| `chain:{feed}:{expiration}:{side}` | Massive `/v3/snapshot/options/{ul}` ≤250/page | Chain ladder surface |

Wings: prefer one wide listed window; slice 10/25/50/100 in process. Fractional listed strikes required (OC6a). Modes: `full` · `diff` · `unchanged`.

### 4.5 Eager vs demand

| Set | Policy |
|-----|--------|
| **Eager** | Configured warm set for ops (e.g. status topic if any consumer needs it; optional flagship symbols). **Not** automatic “header always on” without surface Spec. |
| **Demand** | Topics with active WS interest (grace 30–120s after last unsub) |

---

## 5. Shared store (Redis)

### 5.1 Normative default

Multi-process / multi-worker **requires** Redis (or equivalent shared bus). Pure process memory is **only** for single-worker prototypes and H1-2 minimal OC15.

### 5.2 Key layout (v1) — India reviews

| Key / channel | Content |
|---------------|---------|
| `mb:sym:{PRODUCT}` | Last symbol document |
| `mb:session:market_status` | Market status document |
| `mb:chain:{feed}:{exp}:{side}` | Ladder generation + hash |
| `mb:bar:…` | Optional short ring |
| `mb:pub` (or family channels) | Notify API of updates |

### 5.3 Single-flight

Feed **must** single-flight Massive fetches per topic key.

---

## 6. Member transport — one WebSocket

### 6.1 Endpoint

```text
WS  /api/me/market/stream
```

**WebSocket is product law** for multiplexed sub/unsub (one socket per tab; aged-browser safe). SSE is **not** the primary multi-topic transport (optional diagnostics only).

### 6.2 Client → server

| `op` | Purpose |
|------|---------|
| `hello` | Protocol version |
| `sub` / `unsub` | `symbols[]`, `chains[]`, `session?`, `bars?` |
| `ping` | Heartbeat |

### 6.3 Server → client

| `t` | Purpose |
|-----|---------|
| `hello` | server_time, heartbeat_s, v |
| `session` | Market status |
| `sym` / `sym_bar` | Symbol / bar |
| `chain` | full \| diff \| unchanged |
| `err` / `pong` | Errors / heartbeat |

**MB7:** after `sub` or reconnect, **snapshot first**, then deltas.

### 6.4 Caps (Mike)

Max symbols ≤ universe size; max chains e.g. 4; max bar series e.g. 40 — exact numbers in implementer config, fail loud if exceeded.

---

## 7. Shared web client

### 7.1 Module home (target)

```text
web/lib/market/          # protocol, types, reconnect
web/components/market/   # MarketSocketProvider
hooks: useMarketSession, useSymbolQuote, useOptionChain, useSymbolBar
```

### 7.2 Lifecycle

| Mount | Behavior |
|-------|----------|
| **App page** | Connect when a market-using page mounts; unsub page topics on leave; close WS when no interest remains |
| **Shell** | **Only if** a ratified surface Spec requires base interest (e.g. future header). Until then, **page-scoped** lifecycle is default |
| **Public / login** | No market WS |

Multiple widgets on one page: **one** provider / socket (ref-count). Multiple tabs: one WS each.

### 7.3 Consumers (illustrative — not product grants)

| Consumer | Topics (typical) | Status |
|----------|------------------|--------|
| Chain ladder surface | `chain:…`, product `sym` | **In scope** (Picker Spec) |
| Multi-chart / trade chart | `sym`, optional `bar` | Future app work on this bus |
| Capital / Curate | `sym` / dual-read marks | Until O2 exit |
| Main header | session + flagships | **Speculative** — needs surface Spec |

### 7.4 Display laws for chain consumers

**Strike formatting and field set are Options Chain Picker laws (OC6 / OC6a).** This Spec does not re-own them; chain payloads on the bus **must** carry exact listed strikes so consumers can obey OC6a. Transport AT-MB5 verifies e2e; product law lives on the Picker Spec.

---

## 8. Feed processes

### 8.1 Symbol + session feed

1. Enabled universe load.  
2. Arch/18 entitlement / proxy labeling.  
3. Refresh `eager ∪ demand` symbols.  
4. Slow poll market status; publish on change.  
5. Optional 1s bars for subscribed symbols.  
6. Dual-write marks **only** under O2 with **named exit**.

### 8.2 Chain feed

1. Hot set from interest (+ optional configured warm chains).  
2. Snapshot ≤250/page; listed-strike windows; fractional OK.  
3. Write generation + hash; publish.  
4. OC2/OC5a when band geometry is server-side.  
5. Prefer preformed calendar (OC11).

### 8.3 Massive usage doctrine + entitlement probe

| Prefer | Avoid |
|--------|--------|
| REST chain snapshot @ 1–2s | Full OPRA options WS for all names (v1) |
| Universe underlyings: **WS if entitled, else tight REST poll** | Per-member Massive |
| Status REST slow poll | Status on every quote tick |

**MB-P3 gate evidence (required):** one **connect/curl transcript** proving whether the current Massive plan entitles a **stocks/index WebSocket** (or not). Design of sym-feed **must** follow that evidence — no silent “prefer WS” without probe.

---

## 9. Security & tenancy (Mike)

| Rule | Detail |
|------|--------|
| Redis | Localhost (or private); no public bind |
| WS | Session + tool member; no anonymous stream |
| Data | Public market tape only; no PII on the bus |
| Rate | Per-connection caps; disconnect abuse |

---

## 10. Observability (minimum)

Massive calls/min · generation age · active WS · hot topics · Redis errors · single-flight waits · feed heartbeat.

---

## 11. Phased delivery

| Phase | Deliverable | Exit criteria |
|-------|-------------|----------------|
| **MB-P0** | Spec gates PASS + Coach GO + DL posture reversal | §18 complete |
| **MB-P1** | Redis + chain generations; ladder prefers store; single-flight; **successor to H1-2** | Multi-worker OC15; no double Massive under concurrent readers |
| **MB-P2** | `labs-chain-feed` owns Massive chains | Request-path Massive = 0 for hot chains |
| **MB-P3** | Symbol + session topics; **WS entitlement probe evidence** | Topics available to any entitled consumer (header UI **not** required) |
| **MB-P4** | WS `/api/me/market/stream` + shared MarketClient | One socket; MB7 snapshot-then-delta |
| **MB-P5** | Chain ladder on shared client | Poll happy-path deprecated |
| **MB-P6** | Multi-chart live follow (optional) | No per-chart sockets |

**P1–P2 before multi-member marketing of live boards.**

**First post-build smoke (Coach / Delta):** (1) single client chain snapshot + updates; (2) N clients same chain topic — Massive rate stays O(generation), not O(N).

---

## 12. Relationship to transitional chain ladder

| Concern | Pre-bus | Post MB-P5 |
|---------|---------|------------|
| Transport | `fetch` poll ~2s | WebSocket shared client |
| Upstream | May hit Massive from API | Feed only |
| OC15 | H1-2 in-process minimal | Redis multi-worker (MB-P1+) |

---

## 13. Non-goals (v1)

- Browser → Redis or Massive  
- One WS per chart  
- Ratifying live header product without surface Spec  
- Ratifying catalog name “Options Lab” via this document  
- Kafka / multi-region  
- Full OPRA default  
- Profit theater on the bus  

---

## 14. Acceptance tests

| ID | Law / concern | Test |
|----|---------------|------|
| **AT-MB1** | MB2 · single-flight | Two API workers, same chain key under load → **one** Massive generation per TTL (instrumented) |
| **AT-MB2** | MB3 · MB4 | One tab: ladder + ≥2 chart widgets ⇒ **one** WS (devtools) |
| **AT-MB3** | MB5 | Unsub symbol → after grace, demand refresh stops (eager-only remains) |
| **AT-MB4** | Session topic | `session:market_status` snapshot available to a bare consumer (no header UI required) |
| **AT-MB5** | OC6a e2e | AAPL (or equity with halves) listed strike e.g. **302.50** appears **exactly** — not integer-rounded |
| **AT-MB6** | MB10 | Kill feed / Redis → fail-loud stale/err within policy |
| **AT-MB7** | MB9 | Unauthenticated WS rejected |
| **AT-MB8** | **MB7** | Disconnect + reconnect → **snapshot** before any delta for each subbed topic |
| **AT-MB9** | **MB8** | Proxy-labeled mark on bus retains `source`/proxy flag e2e; chain generation for index **not** centered on proxy mid (503 or native path) |
| **AT-MB10** | **MB6** | `sub` unknown / disabled symbol → error; no store pollution |

---

## 15. Open points — **GO requires explicit accept or override per row**

**No “default if silent GO.”** Coach (or named owner) records **Accept** or **Override: …** for each row at GO; missing row ⇒ GO incomplete.

| # | Question | Owner | Recommendation (not automatic) |
|---|----------|-------|--------------------------------|
| **O1** | Single `labs-market-feed` vs split sym/chain units | Foxtrot · Alpha | Split OK; **one writer per class** |
| **O2** | Dual-write MySQL marks during migration | India · Alpha | **Temporary yes** with **exit:** Curate (or named reader) reads bus/`sym` for **N=20 green sessions** (or 14 calendar days production without marks-only dependency) → dual-write **removed** in a **dedicated DL entry**. No open-ended dual truth. |
| **O3** | Whether any symbols are eager without demand | Product · Coach | Default **empty eager symbol set** until a surface Spec needs flagships |
| **O4** | Grace period after unsub / page unmount | Alpha | 30–60s |
| **O5** | Soft stale thresholds | Hotel · Alpha | e.g. 3s chain · 5s sym · 120s status |
| **O6** | OD-nav product name for chain surface | Coach · Echo | Settle in picker OD-nav; bus Spec follows |

---

## 16. Glossary

| Term | Meaning |
|------|---------|
| **Market Bus** | Feeds + Redis + API + shared client |
| **Generation** | Topic snapshot with `content_hash` (esp. chain) |
| **Interest** | Connection’s subscribed topics |
| **Chain ladder surface** | Member options chain product (Picker Spec) |
| **H1-2 minimal OC15** | In-process shared generation (picker program) |
| **MB-P1 OC15** | Redis multi-worker shared generation (this Spec) |

---

## 17. Document control

| Ver | Date | Notes |
|-----|------|-------|
| **1.0** | 2026-08-10 | Initial DRAFT (author) |
| **1.0.1** | 2026-08-10 | Claude architecture review fold: gate table; header speculative; naming; H1-2/MB-P1; Redis reversal; O2 exit; AT-MB6–10; no silent GO; WS probe; version/hash hygiene |
| **1.0.1b** | 2026-08-10 | Bench-plan review fold: Coach gate **overrule≠waive**; Picker parent path **v1.0.2** |

**Content hash (v1.0.1 review-fold):** `b0778ad4ce0d7bb220ca0e21a2630c891dd002c5`  

```bash
shasum -a 1 Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md
```

Re-hash and paste into DL / gate report at Coach GO if the file changed after this fold (self-referential hash lines do not need recursive perfection — GO uses final commit blob).

---

## 18. Review gates (specialists) — **required before Coach GO**

INSTRUCTIONS-class review: architecture blast radius (first Redis, new daemons, WS gateway, shared client). **Author → Coach only is insufficient.**

| Gate | Agent | Scope | Status |
|------|-------|--------|--------|
| **MB-G-India** | India | Redis key schema · dual-write O2 exit · no dual-truth permanence · generation identity | **Pending** |
| **MB-G-Mike** | Mike | WS auth · Redis not public · sub caps · session upgrade | **Pending** |
| **MB-G-Foxtrot** | Foxtrot | launchd units · MiniTwo Redis · fail-loud ops · one-writer rule | **Pending** |
| **MB-G-Alpha** | Alpha | Feed/API contracts · single-flight · phase feasibility | **Pending** |
| **MB-G-Echo** | Echo | Shared client / HIG touchpoints; **no silent header product**; OD-nav naming deference | **Pending** |
| **MB-G-Tango** | Tango | Doctrine: process-over-P&L vs live chrome *if* header later; bus itself is orientation-capable without dopamine law | **Pending** |
| **MB-G-Hotel** | Hotel | OC2/OC5a/MB8 survival on bus; stale thresholds O5 | **Pending** |
| **MB-G-Delta** | Delta | AT matrix; H1-2 vs MB-P1 evidence uniqueness; first multi-client smoke plan | **Pending** |
| **MB-G-Juliet** | Juliet | Program order H1-2 → MB-P1; no parallel OC15 theater | **Pending** |
| **MB-G-Lima** | Lima | DL posture reversal text; parent links; hash | **Pending** |
| **MB-G-Coach** | Coach | GO / amend / reject after specialist **PASS**. May **overrule a specific specialist finding** only via **DL entry with reasoning** (arbiter authority) — **not** a gate waive; Delta still ternary on remaining gates | **Blocked on gates** |

Gate reports: `agents/p-market-bus/gate-reports/` (board may be scaffolded at MB-P0).

---

## 19. Approval

| Role | Action | Status |
|------|--------|--------|
| Spec author | v1.0.1 review fold | 2026-08-10 |
| Specialists | §18 gates | **Pending** |
| Coach | GO only after §18 + O1–O6 explicit | **Blocked** |

**After Coach GO:** MB-P1+ build authority; DL posture-reversal entry; Options Chain Picker parent table lists this Spec as **scale/transport parent**; H1-G cites §1.2.
