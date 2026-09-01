# OPF Generation Plane Spec v0.2.2 — Full Agent Bench Plan v1.0

**Date:** 2026-09-01  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO SPEC / ship)  
**W0 artifact:** [`agents/go/GP-W0.md`](../agents/go/GP-W0.md) — **not stamped**  
**Board:** [`agents/p-opf-generation-plane/`](../agents/p-opf-generation-plane/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · spec-create-review-workflow  

**Law Delta reads:**

| Doc | Path | Status |
|-----|------|--------|
| **Generation Plane Spec v0.2.2** | [`Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md`](../Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md) | **INDIA-SIGNED.** Consolidation of v0.2.1 (E1–E3 inline). **No new law.** **Not BUILD AUTHORITY until Coach stamps GP-W0.** |
| Origin landing (same bytes) | `Specs/FatTail Labs — OPF Generation Plane Spec v0.2.2.md` | `d216da4` 2026-09-01. Tools-hostile filename. Hyphenated copy is the law path. |
| Evidence | [`agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md`](../agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md) · [`docs/IKI-Labs-OPF-Readiness-Audit.md`](./IKI-Labs-OPF-Readiness-Audit.md) | F8 / Q0–Q15. Do not rediscover. |
| Parent Arch 30 | [`Architecture/30-options-pricing-foundation.md`](../Architecture/30-options-pricing-foundation.md) | Materially inaccurate §10 (spec §10). Honesty is **P0**. |
| Parent Arch 28 | [`Architecture/28-massive-market-bus.md`](../Architecture/28-massive-market-bus.md) | Transport. One WS. Sole Massive writers. |
| OPF Spec v0.2.1 | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Foundation law. This program **extends L1**, does not reopen L2–L4 packs. |
| Consumer L4-A | Frozen until this ships. Tree has `Specs/IKI Labs — Chain Analytics Read Spec v0.1 (L4-A).md` only. Spec cites **v0.4**. | **P0 names the gap. Do not invent v0.4.** |
| OPF Reference v1.1 | Spec says `docs/OPF-REFERENCE-v1_1.md` — **not in the tree** (2026-09-01). | **P0 names the gap. Do not invent the Reference.** |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
**No product code until Coach stamps this plan v1.0 on `GP-W0.md` as BUILD AUTHORITY and W0-G PASS.** India-signed is not BUILD.

Coach Content Law (doctrine §11 · DL-176): nothing of Coach’s spec is dropped. Objections sit beside the text, labeled. Blocks below are **sequencing**, not edits to GP1–GP24.

---

## 0. Mission

Make L1 real: the server obtains a generation it **owns**, and can say which **book** it is (`wings` or `listed`). That is the staged lift of the GEX freeze. This program does **not** compute exposure.

```text
BEFORE                                   AFTER
browser ─POST─► _store  (the SoR)        chain_feed ──► mb:ladder:…:w{N}:dual ──┐
                                         listed writer ► mb:ladder:…:listed:dual ┤
                                                                    │ mb:pub     │
                                                       in-process hydrator ◄──────┘
                                                                    │
                                                    ContractStore[namespace=owned]
                                                                    │
                                       what-if POST ► ContractStore[namespace=supplied]
```

| Lifts | When | Enables |
|-------|------|---------|
| **Compute on `wings`** | **P2 + P3** green on a host where `bus ≠ not_configured` | Honest **window** Surface, labelled `book: "wings"` — **not this board** |
| **Compute on `listed`** | **P4** green | Listed GEX — **not this board** |

```text
W0     Coach GO SPEC · India · Mike · Hotel · Foxtrot · Tango · Lima → W0-G
P0     Land remaining docs · Arch 30 honesty
P1     Plane bring-up (Redis, bus, chain_feed, plane-owned interest)
P2     Hydrator in-process + source + book + namespace
P3     Visibility GET + clock separation
P4     Listed writer + listed key + parser
P6     Auth — read on product: key
P7     Config (absorbed into P2/P4; parked GexPolicy stays parked)
W-G    Delta — AT-GP1…23 minus withdrawn 14; 20 OPF ATs still green
```

**One-line law (spec §16, unchanged):**  
The feed and the listed writer each publish to their own key, one in-process hydrator subscribes and writes the owned namespace, what-if bodies land somewhere else entirely — and the plane holds its own interest, because a feed nobody is watching does not run.

---

## 1. Locked (spec — not forks)

| ID | Law |
|----|-----|
| **GP1** | Analytics/Intelligence compute only on a generation the server obtained. |
| **GP1a** | `resolve` / `package-quote` / `lock` keep accepting posted generations. |
| **GP2** | `source ∈ {bus, listed_writer, http_fill, client_body}` set at ingestion, never rewritten. |
| **GP2a** | `http_fill` is real, ladder-lawful, **excluded from analytics**. |
| **GP2b** | `ContractStore` namespaced `owned` \| `supplied`. Namespace is part of the key. No unnamespaced accessor. Analytics accepts **owned only**. |
| **GP2c** | `get_by_expiration` takes `book`. |
| **GP3** | Live ladder stays `wings`. HM17/HM18 unchanged. |
| **GP4–GP7** | Separate listed writer. `book` persisted at write. Never inferred from row count. **No wing-window value labelled chain GEX.** |
| **GP8–GP10** | Three clocks named. Refcount is budget, never warmth. Divergence reported. |
| **GP11–GP15** | Hydrator **in-process** lifespan task. Reads Redis, **never Massive**. Subscribe `mb:pub` + reconcile scan. Hold past TTL, marked stale. Empty / stale / broken distinguishable. |
| **GP16–GP20** | Listed writer: no wings clamp; page until complete or fail loud; **not** `max_pages=3`; key `…:listed:dual`; `w0` banned; enumerated pairs; own cadence. |
| **GP18a** | `parse_ladder_topic` / `bus_ladder_key(book=…)` — **the one existing OPF module this spec modifies** for the listed token. |
| **GP21** | Plane-owned interest heartbeat < 45 s. Same `mb:interest:{topic}` key. No decorated topic. |
| **GP22a/b** | `GET /api/me/market/generation`. Owned-only. `book` is a parameter. Health counts `owned`. |
| **GP23** | `--workers` must be 1 while store is process-local. Boot fails loud otherwise. |
| **GP24** | Per-subsystem config. Wings-only plane is complete. Empty ≠ missing. API always boots. |
| **OD-GP1** | Archive = **(B) StudioOne**. **`archive_put` is not built.** |
| **OD-GP2** | `LABS_OPF_STORE_MAX_STALE_MS` starting **20000**. **No code default.** |
| **OD-GP3** | Host named **in the same GO as P1**. MiniTwo without Redis is `bus: "not_configured"` by law. |
| **OD-GP4** | Listed cadence: on-demand + slow scheduled pass. |
| **OD-GP5** | Hydrator in-process until store is shared. |
| **OD-GP6** | `supplied` eviction **60 s**. |
| **OD-GP7** | Identity in the `supplied` key. **Yes.** |

Measured (GXA0, do not re-measure to start): 0DTE SPX `wings=15` = **62 rows**; full listed = **496 contracts / 248 strikes**. Listed budget: **18 pages / 3.87 s / 3.4 MB** for 8 front SPX expiries (n=1, 2026-09-01). MiniTwo continuous chain load ≈ 0.

---

## 2. As-built honesty (GXA0 — keep)

| Fact | Consequence for this board |
|------|----------------------------|
| `_store` is process-local, body-hydrated (F8) | P2 is the SoR change. D2 was unfounded. |
| MiniTwo: no Redis, no `chain_feed`, no `LABS_MARKET_BUS` | P1 is Foxtrot, not an import. Until P1, `bus: "not_configured"` is lawful. |
| Redis generation TTL **6 s**; interest **45 s**; process refcount never expires | GP8–GP14. Do not “fix” TTL to hours in this GO. |
| Feed writes Heatmap windows, not listed books | GP3 vs GP4. Hydrating `mb:ladder:*` unchanged is **wings**. |
| `archive_put` has no writer | OD-GP1 = B. Not this GO. |
| `from_ladder_payload` shape-compatible with feed | P2 consumes it; stamps `source`/`book` at write. |
| 20 ATs in `test_opf_foundation.py` | AT-GP20. Stay green. |
| Pricing already posts generations (option c) | GP1a. Preserve. |
| `_require_tool_member()` defaults Trade Log **write** | P6. Do not copy. |
| `opf.config._env` collapses empty → default | GP §9.2. P2/P7 helper must distinguish unset vs set-to-empty. |
| `--symbol` unused; feed idles without interest | GP21. |

---

## 3. Juliet review (labeled)

Coach’s spec text stays in `Specs/`. Nothing below deletes GP1–GP24 or OD-GP1–7.

### Blocking for *sequencing* (not for spec content)

| # | Item |
|---|------|
| **B1** | Spec header is **INDIA-SIGNED**, not BUILD AUTHORITY. Sequential W0 reviews → Coach **GO SPEC** on `GP-W0.md` → W0-G → then P0. This plan is not a spec stamp. |
| **B2** | **DL-539.** Existing work. Implementation packets that edit the allowlist in §8 need **three successive Coach OKs** on `GP-W0.md` before the first edit. One OK is not three. A break resets the count. Spec §15 is a declaration, not the three OKs. |
| **B3** | **OD-GP3.** P1 does not start until Coach names the host on the GO token. MiniTwo without Redis is `not_configured` by law — that is not a failed P1. |
| **B4** | `docs/OPF-REFERENCE-v1_1.md` and L4-A **v0.4** are cited by the spec and **are not in the tree**. P0 reports the gap. **Do not author those documents in this board** unless Coach names that as P0 scope. |
| **B5** | Freeze lift is **capability**, not a GEX packet. A seed that writes `gex_v2`, `analytics.py`, golden vectors, Surface, Profile, or Card **fails**. |

### Coach dispositions (tick on `GP-W0.md`)

**OD-GP3 — Which host runs the plane (same GO as P1)**

- [ ] **StudioTwo** — prove P1–P3 here. MiniTwo stays `not_configured` until a later Foxtrot packet.  
- [ ] **MiniTwo** — Redis + `LABS_MARKET_BUS` + `chain_feed` launchd on production in P1.  
- [ ] **Both** — StudioTwo first (P1a), MiniTwo (P1b) before wings-compute freeze lift is claimed on the member host.

**DL-539 — three successive OKs for §8 allowlist**

- [ ] OK 1 date/initials  
- [ ] OK 2 date/initials  
- [ ] OK 3 date/initials  

Until three boxes, **P2 does not start.** P0 (docs) and W0 (reviews) do not edit those files.

**B4 — missing cited docs**

- [ ] P0 **reports only** (plan default).  
- [ ] Coach names OPF Reference v1.1 and/or L4-A v0.4 as in-scope authoring for P0.

### Opinions (Coach may discard)

| # | Item |
|---|------|
| **O1** | Board is **`agents/p-opf-generation-plane/`**, not `p-iki-gex` (GXA0 stays the audit) and not `p-options-pricing-foundation` (that GO closed L0–L4 headless). |
| **O2** | **P7 absorbed** into P2 (hydrator config + `_env` helper + GP23 workers assert) and P4 (`LISTED_PAIRS`). Parked `GexPolicy` is a Lima one-liner in P0, not a packet. |
| **O3** | **P6 may run parallel to P3** once Mike’s design is on the token (W0). Visibility ships 401/403 honestly; it does not ship with Trade Log write. |
| **O4** | **Echo not seated.** No member chrome. Tango reviews visibility **state names** (`present/stale/cold/broken`) and GP7 copy if any string is member-facing. |
| **O5** | AT-GP1 live Redis proof is **P1 host**. P2 unit tests may use a fake `mb:pub` / fixture Redis. Delta does not PASS P2-G on fixtures for AT-GP1. |
| **O6** | Do not change `LABS_MB_CHAIN_TTL_S` in this GO. Hold-past-TTL is the store’s job (GP14). |
| **O7** | Hyphenated spec path is law. Spaces/em-dash file on origin is the same bytes; Lima may leave it or replace with a stub pointer in P0. |

---

## 4. Isolation (DL-539)

**In program (after three OKs):** files in spec §15 and §8 below.

**Out unless Coach names + three OKs:** Options Lab UI, Heatmap templates, Runner, `web/lib/runner/**`, Analyzer chrome, Time Machine, StudioOne dash, `opf/{interest,leg,package,lock,resolve,archive}.py` behaviour, live ladder path / HM17/HM18, any template, GEX compute, L4-A route.

**Never:** client Massive, second WS, MSC schemas, `--workers` > 1, `archive_put`, decorated `mb:interest` keys.

---

## 5. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-0** | Coach stamps **spec v0.2.2 BUILD AUTHORITY** and **this plan v1.0**. OD-GP3 ticked. | W0-1 |
| **W0-2 India** | GP1–GP24 vs tree; namespace is a key; listed key + parser; three clocks; no analytics on `supplied`; Arch 30 honesty list; L4-A frozen | W0-G |
| **W0-3 Mike** | Visibility/P6: `product:` read capability; not `_require_tool_member`; session still required | W0-G |
| **W0-4 Hotel** | GP7: no wing-window labelled chain GEX; listed writer completeness; `w0` banned; truncation writes nothing | W0-G |
| **W0-5 Foxtrot** | P1 shape: Redis bind localhost; `chain_feed` launchd; env names; OD-GP3 host; GP23 workers=1 assert | W0-G |
| **W0-6 Tango** | `present/stale/cold/broken` are honest; empty is not an outage; no “chain GEX” on a window | W0-G |
| **W0-G** | Token stamped; reviews in; **three DL-539 OKs** if P2 is to start; **no product code** | P0 |
| **P0-G** | Arch 30 §10/11/4/6.1/12/17b honesty landed. Missing Reference / L4-A v0.4 **named**, not invented (unless B4 ticked). Hyphenated spec is the law path. DL. | P1 |
| **P1-G** | Named host: `mb:ladder:*` key **and** `mb:pub` message **with no member watching** (AT-GP23 substrate). `bus ≠ not_configured` on that host. | P2 live AT-GP1 |
| **P2-G** | AT-GP1–11, 15a–c, 17, 20, 21, 22. Hydrator in-process. Zero Massive in hydrator. Namespace. 20 OPF ATs green. AT-GP1 is live on P1 host, not a fixture. | P3 · P4 parser already in 22 |
| **P3-G** | AT-GP16, 18. Visibility takes `book`. Clocks separate. Auth is P6 or a named interim Mike allows. | wings-compute *capability* (not this board) |
| **P4-G** | AT-GP12, 13, 22 (listed parse). No wings clamp. Truncation fail-loud writes nothing. Own key. Hydrator consumes listed. | listed-compute *capability* (not this board) |
| **P6-G** | Read capability on `product:` key. Visibility 403 without it. Pricing what-if path unchanged. | member-facing visibility |
| **W-G** | Fail-closed list §10. All AT-GP except withdrawn 14. | ship plane; GEX freeze **not** lifted by this board — L4-A stays frozen until Coach opens that spec |

P3 and P4 may proceed in parallel after P2-G. P6 may proceed in parallel with P3 after W0-G + Mike W0-3.

---

## 6. DAG

```text
W0-0 Coach GO SPEC + plan v1.0 + OD-GP3 + DL-539 OKs
  → W0-1 Lima sha1 + DL draft
  → W0-2 India ∥ W0-3 Mike ∥ W0-4 Hotel ∥ W0-5 Foxtrot ∥ W0-6 Tango
  → W0-G
       → P0 Lima Arch 30 honesty + filename + gap report → P0-G
            → P1 Foxtrot plane bring-up (named host) → P1-G
                 → P2 Alpha hydrator + namespace + source/book + config helper
                      → P2-G
                           ├─► P3 visibility → P3-G ─┐
                           ├─► P4 listed writer → P4-G ┤
                           └─► P6 Mike auth → P6-G ───┴► W-G
```

P2 unit tests may start after W0-G **on fixtures**; **AT-GP1 live** waits on P1-G.

---

## 7. Packets

Seeds under `agents/p-opf-generation-plane/seeds/`.

### W0 — review (no product code)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W0-0-coach-go.md` | Coach | `GP-W0.md` W0-0 STAMP: spec v0.2.2 BUILD AUTHORITY, plan v1.0 Accept, OD-GP3 ticked, DL-539 OKs started/completed |
| `W0-1-lima-hash.md` | Lima | sha1 of spec v0.2.2 + this plan; DL draft; hyphenated vs spaces filename note |
| `W0-2-india.md` | India | GP1–GP24 vs tree; F8 closed by design; listed key; namespace; three clocks; L4-A frozen; Arch 30 list |
| `W0-3-mike.md` | Mike | P6 design: `product:` read; not Trade Log write; session required; fail closed |
| `W0-4-hotel.md` | Hotel | GP7; listed completeness; no `w0`; truncation writes nothing; window ≠ chain |
| `W0-5-foxtrot.md` | Foxtrot | P1 runbook for the named host; Redis localhost; launchd; workers=1; env names (no secret values in the seed) |
| `W0-6-tango.md` | Tango | Visibility states; no chain-GEX on a window; empty ≠ broken |
| `W0-G-delta.md` | Delta | Token + reviews; no product code; ternary |

### P0 — docs (Lima · India)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P0-1-lima-arch30.md` | Lima | Arch 30 honesty (spec §10 list). DL. Canonical hyphenated spec. **Do not invent** OPF Reference v1.1 or L4-A v0.4 unless B4 ticked. Report missing cites. |
| `P0-2-india.md` | India | Docs match the tree. P0-G. |

### P1 — plane bring-up (Foxtrot)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P1-1-foxtrot-bus.md` | Foxtrot | Named host: Redis up, `LABS_MARKET_BUS=1`, `chain_feed` running, plane interest heartbeat. Evidence: SCAN `mb:ladder:*` **and** a `mb:pub` message **with no member watching**. |
| `P1-2-india.md` | India | AT-GP23 substrate. `bus` on visibility (once P3 exists) would not be `not_configured` on that host. |
| `P1-G` | Delta | Live keys, not a fixture. |

### P2 — hydrator (Alpha · Kilo)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P2-1-alpha-store.md` | Alpha | Namespace, `source`, `book`, staleness, book-aware get, `_hydrate` → `supplied` + identity + 60 s, health counts `owned`. Files: spec §15. |
| `P2-2-alpha-hydrator.md` | Alpha | `server/opf/hydrator.py` in-process lifespan. `mb:pub` + reconcile. No Massive. Idempotent hash. Older `as_of` refused. Config helper: unset vs empty. GP23 workers assert. |
| `P2-3-kilo.md` | Kilo | AT-GP1–11, 15a–c, 17, 20, 21. AT-GP1 **live** on P1 host. 20 foundation ATs green. |
| `P2-G` | Delta | Evidence pack. Fail if hydrator is a separate process. Fail if AT-GP1 is fixture-only. |

### P3 — visibility (Alpha · Mike)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P3-1-alpha-route.md` | Alpha | `GET /api/me/market/generation`. Envelope spec §7. `book` required. Owned only. |
| `P3-2-mike.md` | Mike | Gate wired or explicit “waits on P6” with 401/403 fail-closed — **not** `_require_tool_member`. |
| `P3-3-kilo.md` | Kilo | AT-GP16, 18. |
| `P3-G` | Delta | |

### P4 — listed writer (Alpha · Hotel)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P4-1-alpha-keys.md` | Alpha | `keys.py`: `LadderTopic.book`, `wings: int \| None`, `bus_ladder_key(book=…)`. End-anchored. Legacy single-side unchanged. AT-GP22. |
| `P4-2-alpha-writer.md` | Alpha | `listed_writer.py`. GP16–GP20. `set_json` same path. `book: listed`, `source: listed_writer`. Cadence OD-GP4. |
| `P4-3-hotel.md` | Hotel | Completeness; no clamp; truncation writes nothing; not labelled chain GEX. |
| `P4-4-kilo.md` | Kilo | AT-GP12, 13, 22, 23 with listed pairs. |
| `P4-G` | Delta | |

### P6 — auth (Mike)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P6-1-mike.md` | Mike | Read capability on `product:` target. Policy row. Visibility consults it. Pricing what-if unchanged. |
| `P6-2-kilo.md` | Kilo | 403 without entitlement; 200 with. AT-GP16 still green. |
| `P6-G` | Delta | |

### W-G — close

| Seed | Agent | Done when |
|------|-------|-----------|
| `WG-1-kilo.md` | Kilo | Full AT-GP matrix minus 14. AT-GP20. |
| `WG-2-lima.md` | Lima | DL close. Arch 30 as-built for the plane (not “L2–L4 multi-worker SoR”). Deploy notes. |
| `WG-delta.md` | Delta | Fail-closed §10. **Explicit non-claim:** GEX compute not shipped; L4-A still frozen. |

---

## 8. Change declaration (from spec §15 — declare again on each seed)

**New:** `server/opf/hydrator.py` · `server/opf/listed_writer.py` (P4) · `server/opf/plane_interest.py` · `server/opf/store_read.py` · `server/routes/market_generation.py` · `server/tests/test_opf_generation_plane.py` · this plan · board

**Modified (DL-539 allowlist — three OKs before first edit):**  
`server/opf/generation.py` · `server/opf/keys.py` · `server/opf/config.py` · `server/routes/pricing.py` · `server/main.py` · `Architecture/30-options-pricing-foundation.md` · `Architecture/00-decision-log.md` · `infra/deploy.md` (P1)

**P1 ops (named host, not a silent MiniTwo):** Redis, `LABS_MARKET_BUS`, `chain_feed` launchd, env names. May add `infra/launchd/ai.fattail.labs.chain-feed.plist` from the existing example.

**Not touched:** pricing what-if **behaviour** (GP1a) · `opf/{interest,leg,package,lock,resolve,archive}.py` · live ladder / HM17/HM18 · templates · GEX compute · L4-A route · StudioOne · Time Machine

---

## 9. AT map

| AT | Phase | Note |
|----|-------|------|
| AT-GP1 | P2 (live on P1 host) | Hydrator, zero Massive |
| AT-GP2 | P2 | Helper, not a URL |
| AT-GP3 | P2 | `source` required |
| AT-GP4 | P2 / P4 | `book` at write |
| AT-GP5 | P2 | No default book |
| AT-GP6 | P2 | `mb:pub` + backstop alone |
| AT-GP7 | P2 | hash idempotent |
| AT-GP8 | P2 | as_of order |
| AT-GP9 | P2 | stale served |
| AT-GP10 | P2 | Redis down → broken |
| AT-GP11 | P2 | three bus states; API serves |
| AT-GP12 | P4 | listed completeness |
| AT-GP13 | P4 | page bound from listed count |
| AT-GP14 | — | **Withdrawn** |
| AT-GP15a–c | P2 | per-subsystem config |
| AT-GP16 | P3 | visibility states + `book` param |
| AT-GP17 | P2 | health `owned` only |
| AT-GP18 | P3 | two clocks |
| AT-GP19 | P2 | multi-worker fail loud |
| AT-GP20 | every Delta | 20 foundation ATs |
| AT-GP21 | P2 | three entries coexist |
| AT-GP22 | P4 (keys in P2 if needed early) | listed parse + `I:SPX` |
| AT-GP23 | P1 substrate / P4 full | plane interest; feed does not idle |

---

## 10. Fail-closed (W-G FAIL)

- Analytics-class read of `namespace="supplied"` or `source ∈ {client_body, http_fill}`
- `health.generations_cached` moving when a body is posted
- Wing-window value labelled **chain GEX** (payload, chrome, tooltip, export, print)
- `archive_put` / second archive beside StudioOne
- `gex_v2` / `analytics.py` / golden vectors / Surface / Profile / Card
- Hydrator calls Massive
- Hydrator is a separate process while store is process-local
- `--workers` > 1 with process-local store (boot must fail)
- API abort because the plane is off/misconfigured
- Decorated interest topic the feed cannot see
- `_require_tool_member()` on the visibility route
- `_env` treating `PLANE_WINGS_TOPICS=""` as default
- `w0` as listed marker
- Listed writer using `max_pages=3` as the bound
- Truncation that writes a partial listed generation
- Reusing `get_by_expiration` without `book`
- Unnamespaced `put`/`get`
- Claiming MiniTwo plane-up while Redis/`chain_feed`/`LABS_MARKET_BUS` are absent (`not_configured` is the honest state)
- Editing §8 files without three successive OKs on `GP-W0.md`
- Stamping this plan as a substitute for spec BUILD AUTHORITY

---

## 11. Non-goals (spec §14 — restated)

- Exposure computation of any kind  
- Analytics route, Surface, Profile, Card, SVP tools  
- Golden vectors against a fixture-only store called “done”  
- A second archive beside StudioOne  
- Rewriting the pricing what-if path  
- Moving `ContractStore` to a shared plane (guarded by GP23, not solved)

---

## 12. Seating

| Agent | Role here |
|-------|-----------|
| **Coach** | GO SPEC, OD-GP3, DL-539 OKs |
| **Juliet** | This plan, board, seeds |
| **India** | Spec/architecture; P0; every implementation gate |
| **Alpha** | P2–P4 server |
| **Foxtrot** | P1 host |
| **Mike** | P6 + visibility auth |
| **Hotel** | Listed book honesty; GP7 |
| **Tango** | Visibility copy; no chain-GEX on a window |
| **Kilo** | AT-GP matrix |
| **Lima** | P0 honesty, hashes, DL |
| **Delta** | Every phase end |
| **Echo** | **Not seated** (no chrome) |
| **Gemba / Charlie / Sierra / …** | Not this board |

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-09-01 | Juliet. Against Generation Plane Spec **v0.2.2** (India-signed). GXA0 evidence. No product code until GP-W0 BUILD + W0-G. |

**Next for Coach:** read this plan; tick OD-GP3 and DL-539 OKs on [`agents/go/GP-W0.md`](../agents/go/GP-W0.md); stamp W0-0 or return.
