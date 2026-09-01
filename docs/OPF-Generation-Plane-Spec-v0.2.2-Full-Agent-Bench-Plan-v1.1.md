# OPF Generation Plane Spec v0.2.2 — Full Agent Bench Plan v1.1

**Date:** 2026-09-01
**Plan revision:** **v1.1 + errata E1–E3** (hyphenated law path). Stamp **v1.1 + errata**, the way India signed spec v0.2 + v0.2.1. **GP21 erratum:** plane interest is **wings-only**.
**Supersedes:** v1.0 (Juliet). v1.1 (ten review findings). Errata: [`docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md`](./OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md) (origin: `docs/Bench Plan v1.1 — Errata (for the W0-0 stamp).md`)
**Canonical filename:** `docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md`
**Origin landing:** `docs/OPF Generation Plane Spec v0.2.2 — Full Agent Bench Plan v1.1.md` (`6a2a19d`) — same v1.1 body; **this file applies the errata inline.**
**Owner (orchestration):** Juliet
**Authority:** Coach (GO SPEC / ship)
**W0 artifact:** `agents/go/GP-W0.md` — **not stamped**
**Board:** `agents/p-opf-generation-plane/`
**Governance:** `agents/bench/doctrine.md` · `AGENTS.md` · spec-create-review-workflow

---

## Changes from v1.0 — for the validator

| # | Change | Why |
|---|---|---|
| **1** | **P1 splits into P1a (Foxtrot, infra) and P1b (Alpha, `plane_interest.py`)** | P1-1 asked Foxtrot to ship Python, **and P1-G's "no member watching" exit was circularly dependent on that code** |
| **2** | **`keys.py` moves P4-1 → P2-0**, gated on AT-GP22 alone, before the hydrator | P2-G required AT-GP22 while the seed sat in P4. Also stops the hydrator ignoring `…:listed:dual` |
| **3** | **W0-1 gains a substitution line** for the missing OPF Reference | Spec §0 line 1 sends six W0 reviewers to a path that does not resolve |
| **4** | **AT-GP19 added to P2-G** | Built in P2-2, gated nowhere |
| **5** | **`store_read.py` assigned to P2-1**, exit AT-GP2 | Declared in §8, created by no seed, while AT-GP2 gated P2 |
| **6** | **`_env` unset-vs-empty helper named on the P2-2 seed** | In locked law, nowhere a builder reads while working |
| **7** | **P1-2 restated as observable facts** | It asserted a hypothetical about a route that does not exist at P1 |
| **8** | **O6 (do not change `LABS_MB_CHAIN_TTL_S`) promoted to §10 fail-closed** | Raising the TTL defeats GP14 while passing every test |
| **9** | **W-G wording adopted at §0**; capability ≠ lift stated once | Mission and W-G carried the same fact in two tones |
| **10** | **GP18a wording corrected in §1** with a spec-erratum flag | *"the one existing OPF module this spec modifies"* is false — five are modified |
| **E1** | **`plane_interest.py` is wings-only** — does not read `LISTED_PAIRS`, does not construct a listed topic | Spec **GP21(a)** is a defect: interest is the *feed's* input; the feed produces **wings**; listed writer pulls itself (**GP18**) |
| **E2** | **P1b-G precondition:** at least one wings topic configured; empty heartbeat is `BLOCKED`, not `FAIL` | Default `PLANE_WINGS_TOPICS` empty → nothing to observe; that is a config gap |
| **E3** | **Fail-closed:** new code does not construct a ladder topic outside `keys.py` | `chain_feed.py:tick` already uses an inline `w{wings}` f-string; recorded, not fixed |

**Not changed:** DAG shape after P2 · isolation §4 · seating §12 · B4's report-don't-invent default · AT-GP14 withdrawn. **GP21(a) is the one locked-law correction** (spec erratum, not a new law).

---

**Law Delta reads:**

| Doc | Path | Status |
|-----|------|--------|
| **Generation Plane Spec v0.2.2** | `Specs/FatTail-Labs-OPF-Generation-Plane-Spec-v0_2_2.md` | **INDIA-SIGNED.** Consolidation of v0.2.1 (E1–E3 inline). **No new law.** **Not BUILD AUTHORITY until Coach stamps GP-W0.** |
| Origin landing (same bytes) | `Specs/FatTail Labs — OPF Generation Plane Spec v0.2.2.md` | `d216da4` 2026-09-01. Tools-hostile filename. Hyphenated copy is the law path. |
| Evidence | `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md` · `docs/IKI-Labs-OPF-Readiness-Audit.md` | F8 / Q0–Q15. Do not rediscover. |
| Parent Arch 30 | `Architecture/30-options-pricing-foundation.md` | Materially inaccurate (spec §10). Honesty is **P0**. |
| Parent Arch 28 | `Architecture/28-massive-market-bus.md` | Transport. One WS. Sole Massive writers. |
| OPF Spec v0.2.1 | `Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md` | Foundation law. This program **extends L1**, does not reopen L2–L4 packs. |
| Consumer L4-A | Tree has `Specs/IKI Labs — Chain Analytics Read Spec v0.1 (L4-A).md` only. Spec cites **v0.4**. | **P0 names the gap. Do not invent v0.4.** |
| **OPF Reference** | Spec cites `docs/OPF-REFERENCE-v1_1.md` — **not in the tree** (2026-09-01) | **P0 names the gap. Do not author it.** **W0 substitution: `W0-1` §7.** |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.
**No product code until Coach stamps this plan on `GP-W0.md` as BUILD AUTHORITY and W0-G PASS.**
India-signed is not BUILD.

Coach Content Law (doctrine §11 · DL-176): nothing of Coach's spec is dropped. Objections sit beside
the text, labeled. Blocks below are **sequencing**, not edits to GP1–GP24.

---

## 0. Mission

Make L1 real: the server obtains a generation it **owns**, and can say which **book** it is (`wings`
or `listed`). This program does **not** compute exposure.

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

**Capability is not the lift.** This board delivers the **capability** to compute on a named book.
**The lift is a Coach act on the L4-A spec**, not a consequence of this board closing.

| Capability exists | When | Enables (elsewhere) |
|---|---|---|
| **Compute on `wings`** | **P2 + P3** green on a host where `bus ≠ not_configured` | Honest window Surface, labelled `book: "wings"` — **not this board** |
| **Compute on `listed`** | **P4** green | Listed GEX — **not this board** |

```text
W0     Coach GO SPEC · India · Mike · Hotel · Foxtrot · Tango · Lima → W0-G
P0     Land remaining docs · Arch 30 honesty
P1a    Plane bring-up — Foxtrot: Redis, LABS_MARKET_BUS, chain_feed  (INFRA ONLY)
P1b    Plane-owned interest — Alpha: plane_interest.py               (PRODUCT CODE)
P2-0   keys.py — book token + parser                                 (GATED ALONE)
P2     Hydrator in-process + source + book + namespace
P3     Visibility GET + clock separation
P4     Listed writer
P6     Auth — read on product: key
P7     Config (absorbed into P2/P4; parked GexPolicy stays parked)
W-G    Delta — AT-GP1…23 minus withdrawn 14; 20 OPF ATs still green
```

**One-line law (spec §16, unchanged):**
The feed and the listed writer each publish to their own key, one in-process hydrator subscribes and
writes the owned namespace, what-if bodies land somewhere else entirely — and the plane holds its
own interest, because a feed nobody is watching does not run.

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
| **GP18a** | `parse_ladder_topic` / `bus_ladder_key(book=…)`. ⚠ **Spec erratum:** the spec reads *"the one existing OPF module this spec modifies"* — **false; §8 modifies five.** Read as: **`keys.py` is the only existing OPF module modified *for the listed-book token*.** The full allowlist is spec §15 / §8 here. **`generation.py` is in scope and is all of P2-1.** |
| **GP21** | ⚠ **Spec erratum (W0-0 errata §2).** Plane holds standing interest **for wings topics only** (`LABS_OPF_PLANE_WINGS_TOPICS`). **Listed pairs are not registered as interest.** Listed writer pulls on its own cadence (GP16–GP20 · OD-GP4) and writes its own key. Heartbeat < 45 s. Same `mb:interest:{topic}` key. No decorated topic. |
| **GP22a/b** | `GET /api/me/market/generation`. Owned-only. `book` is a parameter. Health counts `owned`. |
| **GP23** | `--workers` must be 1 while store is process-local. Boot fails loud otherwise. |
| **GP24** | Per-subsystem config. Wings-only plane is complete. Empty ≠ missing. API always boots. |
| **OD-GP1** | Archive = **(B) StudioOne**. **`archive_put` is not built.** |
| **OD-GP2** | `LABS_OPF_STORE_MAX_STALE_MS` starting **20000**. **No code default.** |
| **OD-GP3** | Host named **in the same GO as P1a**. MiniTwo without Redis is `bus: "not_configured"` by law. |
| **OD-GP4** | Listed cadence: on-demand + slow scheduled pass. |
| **OD-GP5** | Hydrator in-process until store is shared. |
| **OD-GP6** | `supplied` eviction **60 s**. |
| **OD-GP7** | Identity in the `supplied` key. **Yes.** |

Measured (GXA0, do not re-measure to start): 0DTE SPX `wings=15` = **62 rows**; full listed = **496
contracts / 248 strikes**. Listed budget: **18 pages / 3.87 s / 3.4 MB** for 8 front SPX expiries
(n=1, 2026-09-01). MiniTwo continuous chain load ≈ 0. **StudioTwo Redis: `PONG`, `SCAN
mb:ladder:*` → 0 keys. MiniTwo: `redis-cli` not installed.**

---

## 2. As-built honesty (GXA0 — keep)

| Fact | Consequence for this board |
|------|----------------------------|
| `_store` is process-local, body-hydrated (F8) | P2 is the SoR change. D2 was unfounded. |
| MiniTwo: no Redis, no `chain_feed`, no `LABS_MARKET_BUS` | P1a is Foxtrot, not an import. Until P1a, `bus: "not_configured"` is lawful. |
| **StudioTwo Redis is already up** | P1a there is configuration, not an install (OD-GP3). |
| Redis generation TTL **6 s**; interest **45 s**; process refcount never expires | GP8–GP14. **Do not "fix" TTL to hours in this GO — §10.** |
| Feed writes Heatmap windows, not listed books | GP3 vs GP4. Hydrating `mb:ladder:*` unchanged is **wings**. |
| `archive_put` has no writer | OD-GP1 = B. Not this GO. |
| `from_ladder_payload` shape-compatible with feed | P2 consumes it; stamps `source`/`book` at write. |
| 20 ATs in `test_opf_foundation.py` | AT-GP20. Stay green. |
| Pricing already posts generations (option c) | GP1a. Preserve. |
| `_require_tool_member()` defaults Trade Log **write** | P6. Do not copy. |
| `opf.config._env` collapses empty → default | GP §9.2. **Helper named on the P2-2 seed** — §7. |
| `--symbol` unused; feed idles without interest | GP21 **wings-only** — **and why P1b exists**. Listed pairs do not go through the feed. |
| `chain_feed.py:59–62` builds dual keys with an inline `w{wings}` f-string, not `bus_ladder_key()` | **Recorded, not fixed** (errata §4). Correct for wings. Unreachable for listed once GP21 is wings-only. Not on the §8 allowlist. |

---

## 3. Juliet review (labeled)

Coach's spec text stays in `Specs/`. Nothing below deletes GP1–GP24 or OD-GP1–7.

### Blocking for *sequencing* (not for spec content)

| # | Item |
|---|------|
| **B1** | Spec header is **INDIA-SIGNED**, not BUILD AUTHORITY. Sequential W0 reviews → Coach **GO SPEC** on `GP-W0.md` → W0-G → then P0. This plan is not a spec stamp. |
| **B2** | **DL-539.** Implementation packets editing the §8 allowlist need **three successive Coach OKs** on `GP-W0.md` before the first edit. One OK is not three. A break resets the count. Spec §15 is a declaration, not the three OKs. **P2-0 edits `keys.py` and is therefore also gated on the third OK.** |
| **B3** | **OD-GP3.** P1a does not start until Coach names the host on the GO token. MiniTwo without Redis is `not_configured` by law — that is not a failed P1a. |
| **B4** | `docs/OPF-REFERENCE-v1_1.md` and L4-A **v0.4** are cited by the spec and **are not in the tree**. P0 reports the gap. **Do not author them in this board** unless Coach names that as P0 scope. **The Reference content exists outside the tree — W0 substitutes rather than authors (`W0-1`, §7).** |
| **B5** | Freeze lift is **capability**, not a GEX packet. A seed that writes `gex_v2`, `analytics.py`, golden vectors, Surface, Profile, or Card **fails**. |
| **B6** | **NEW.** **P1's exit depends on P1b's code.** *"`mb:pub` with no member watching"* is only observable once the plane holds its own interest (**GP21**). Foxtrot does not ship Python. **P1a = infra, P1b = `plane_interest.py` (Alpha), P1-G after both.** |

### Coach dispositions (tick on `GP-W0.md`)

**OD-GP3 — Which host runs the plane (same GO as P1a)**

- [ ] **StudioTwo** *(recommended — Redis already answers `PONG` there; P1a is configuration, not an install)*. MiniTwo stays `not_configured` until a later Foxtrot packet.
- [ ] **MiniTwo** — Redis + `LABS_MARKET_BUS` + `chain_feed` launchd on production in P1a.
- [ ] **Both** — StudioTwo first (P1a), MiniTwo (P1c) before wings-compute capability is claimed on the member host.

**DL-539 — three successive OKs for §8 allowlist**

- [ ] OK 1 date/initials
- [ ] OK 2 date/initials
- [ ] OK 3 date/initials

Until three boxes, **P2-0 and P2 do not start.** P0 (docs), W0 (reviews) and P1a (infra) do not edit
those files.

**B4 — missing cited docs**

- [ ] P0 **reports only** (plan default) — W0 substitutes per `W0-1`.
- [ ] Coach names OPF Reference and/or L4-A v0.4 as in-scope authoring for P0.

**AT-GP22 ownership — one sentence on the stamp**

- [ ] **`keys.py` lands in P2 as `P2-0`, gated on AT-GP22 alone; P4 keeps AT-GP22 as a regression check.** *(plan default)*
- [ ] Keys stay in P4 — **then AT-GP22 is removed from P2-G** and the hydrator must document how it handles an unknown `…:listed:dual` topic in the interim.

### Opinions (Coach may discard)

| # | Item |
|---|------|
| **O1** | Board is **`agents/p-opf-generation-plane/`**, not `p-iki-gex` (GXA0 stays the audit) and not `p-options-pricing-foundation`. |
| **O2** | **P7 absorbed** into P2 (hydrator config + `_env` helper + GP23 workers assert) and P4 (`LISTED_PAIRS`). Parked `GexPolicy` is a Lima one-liner in P0, not a packet. |
| **O3** | **P6 may run parallel to P3** once Mike's design is on the token (W0). Visibility ships 401/403 honestly; it does not ship with Trade Log write. |
| **O4** | **Echo not seated.** No member chrome. Tango reviews visibility **state names** and GP7 copy if any string is member-facing. |
| **O5** | AT-GP1 live Redis proof is the **P1a host**. P2 unit tests may use a fake `mb:pub` / fixture Redis. **Delta does not PASS P2-G on fixtures for AT-GP1.** |
| **O7** | Hyphenated spec path is law. Spaces/em-dash file on origin is the same bytes; Lima may leave it or replace with a stub pointer in P0. |

*(O6 promoted out of Opinions — it is now §10 fail-closed.)*

---

## 4. Isolation (DL-539)

**In program (after three OKs):** files in spec §15 and §8 below.

**Out unless Coach names + three OKs:** Options Lab UI, Heatmap templates, Runner,
`web/lib/runner/**`, Analyzer chrome, Time Machine, StudioOne dash,
`opf/{interest,leg,package,lock,resolve,archive}.py` behaviour, live ladder path / HM17/HM18, any
template, GEX compute, L4-A route.

**Never:** client Massive, second WS, MSC schemas, `--workers` > 1, `archive_put`, decorated
`mb:interest` keys.

---

## 5. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-0** | Coach stamps **spec v0.2.2 BUILD AUTHORITY** (with **GP21 erratum**) and **plan v1.1 + errata E1–E3**. OD-GP3 ticked. **AT-GP22 ownership stated.** | W0-1 |
| **W0-2 India** | GP1–GP24 vs tree; namespace is a key; listed key + parser; three clocks; no analytics on `supplied`; Arch 30 honesty list; L4-A frozen | W0-G |
| **W0-3 Mike** | Visibility/P6: `product:` read capability; not `_require_tool_member`; session still required | W0-G |
| **W0-4 Hotel** | GP7: no wing-window labelled chain GEX; listed writer completeness; `w0` banned; truncation writes nothing | W0-G |
| **W0-5 Foxtrot** | P1a shape: Redis bind localhost; `chain_feed` launchd; env names; OD-GP3 host; GP23 workers=1 assert. **No Python in P1a** | W0-G |
| **W0-6 Tango** | `present/stale/cold/broken` are honest; empty is not an outage; no "chain GEX" on a window | W0-G |
| **W0-G** | Token stamped; reviews in; **three DL-539 OKs** if P2-0/P2 are to start; **no product code** | P0 |
| **P0-G** | Arch 30 §10/11/4/6.1/12/17b honesty landed. Missing Reference / L4-A v0.4 **named**, not invented (unless B4 ticked). Hyphenated spec is the law path. DL. | P1a |
| **P1a-G** | Named host: Redis reachable · `chain_feed` running · `LABS_MARKET_BUS` set · `mb:ladder:*` key observable **under a manual interest touch**. **Infra only — no product code in this packet** | P1b |
| **P1b-G** | `plane_interest.py` heartbeating **wings topics only**. **Precondition:** at least one wings topic configured on the named host. Then: **`mb:ladder:*` key AND an `mb:pub` message with NO member watching.** Topic string **unmodified** under `list_interest_topics("mb:ladder:")`. `bus ≠ not_configured`. **With `PLANE_WINGS_TOPICS` empty the heartbeat is a correct no-op — Delta records `BLOCKED`, not `FAIL` (errata E2).** | P2 live AT-GP1 |
| **P2-0-G** | **AT-GP22 alone.** `…:listed:dual` → `book:"listed"`, `wings:None`; `…:w15:dual` with `I:SPX` intact; legacy single-side unchanged; non-ladder → `None`. **Gated before any hydrator work** | P2 |
| **P2-G** | **AT-GP1–11, 15a–c, 17, 19, 20, 21.** Hydrator in-process. Zero Massive in hydrator. Namespace. `store_read.py` rejects `supplied` (AT-GP2). 20 OPF ATs green. **AT-GP1 live on the P1a host, not a fixture** | P3 · P4 · P6 |
| **P3-G** | AT-GP16, 18. Visibility takes `book`. Clocks separate. Auth is P6 or a named interim Mike allows | wings-compute **capability** — the lift is Coach's, on L4-A |
| **P4-G** | AT-GP12, 13, 23 (listed pairs); AT-GP22 as regression. No wings clamp. Truncation fail-loud writes nothing. Own key. Hydrator consumes listed | listed-compute **capability** |
| **P6-G** | Read capability on `product:` key. Visibility 403 without it. Pricing what-if path unchanged | member-facing visibility |
| **W-G** | Fail-closed list §10. All AT-GP except withdrawn 14 | ship plane. **Capability exists; L4-A stays frozen until Coach opens that spec** |

P3, P4 and P6 may proceed in parallel after P2-G. **P2-0 is strictly before P2.**

---

## 6. DAG

```text
W0-0 Coach GO SPEC + plan v1.1 + errata E1–E3 + GP21 erratum + OD-GP3 + AT-GP22 ownership + DL-539 OKs
  → W0-1 Lima sha1 + DL draft + Reference substitution note
  → W0-2 India ∥ W0-3 Mike ∥ W0-4 Hotel ∥ W0-5 Foxtrot ∥ W0-6 Tango
  → W0-G
       → P0 Lima Arch 30 honesty + filename + gap report → P0-G
            → P1a Foxtrot infra (named host)            → P1a-G
                 → P1b Alpha plane_interest.py          → P1b-G
                      → P2-0 Alpha keys.py (alone)      → P2-0-G
                           → P2 Alpha hydrator + namespace + source/book + config helper
                                → P2-G
                                     ├─► P3 visibility  → P3-G ─┐
                                     ├─► P4 listed writer → P4-G ┤
                                     └─► P6 Mike auth    → P6-G ─┴► W-G
```

P2 unit tests may start after P2-0-G **on fixtures**; **AT-GP1 live** waits on P1b-G.

---

## 7. Packets

Seeds under `agents/p-opf-generation-plane/seeds/`.

### W0 — review (no product code)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W0-0-coach-go.md` | Coach | `GP-W0.md` W0-0 STAMP: spec v0.2.2 BUILD AUTHORITY **with GP21 erratum**, plan **v1.1 + errata E1–E3** Accept, OD-GP3 ticked, **AT-GP22 ownership stated**, DL-539 OKs started. **Env discipline (belt-and-braces):** P1b ships with `LABS_OPF_LISTED_PAIRS` unset |
| `W0-1-lima-hash.md` | Lima | sha1 of spec v0.2.2 + this plan; DL draft; hyphenated vs spaces filename note. **Confirm which cited documents exist. Where `docs/OPF-REFERENCE-v1_1.md` is absent, record on the token that W0 reviewers substitute `agents/p-iki-gex/gate-reports/GXA0-opf-readiness-audit.md` + spec §2 and §10, which carry the same facts. Do not author the Reference.** |
| `W0-2-india.md` | India | GP1–GP24 vs tree; F8 closed by design; listed key; namespace; three clocks; L4-A frozen; Arch 30 list |
| `W0-3-mike.md` | Mike | P6 design: `product:` read; not Trade Log write; session required; fail closed |
| `W0-4-hotel.md` | Hotel | GP7; listed completeness; no `w0`; truncation writes nothing; window ≠ chain |
| `W0-5-foxtrot.md` | Foxtrot | **P1a** runbook for the named host; Redis localhost; launchd; workers=1; env names (no secret values). **Explicitly excludes `plane_interest.py` — that is P1b** |
| `W0-6-tango.md` | Tango | Visibility states; no chain-GEX on a window; empty ≠ broken |
| `W0-G-delta.md` | Delta | Token + reviews; no product code; ternary |

### P0 — docs (Lima · India)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P0-1-lima-arch30.md` | Lima | Arch 30 honesty (spec §10 list). DL. Canonical hyphenated spec. **Do not invent** OPF Reference or L4-A v0.4 unless B4 ticked. Report missing cites. **Record the GP18a erratum** (§1), **the GP21 erratum** (interest is wings-only), and **`chain_feed.py`'s inline key builder** (errata §4) |
| `P0-2-india.md` | India | Docs match the tree. P0-G |

### P1a — plane bring-up, **infra only** (Foxtrot)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P1a-1-foxtrot-bus.md` | Foxtrot | Named host: Redis up and bound localhost, `LABS_MARKET_BUS` set, `chain_feed` launchd running, env names recorded. Evidence: `redis-cli ping`, SCAN `mb:ladder:*` **under a manual `touch_interest`**, launchd state. **Ships no Python** |
| `P1a-2-india.md` | India | Host matches OD-GP3 tick. Env present. Feed process alive |
| `P1a-G` | Delta | Infra observable. **A key produced only by a manual touch is the expected P1a state, not a pass of AT-GP23** |

### P1b — plane-owned interest, **product code** (Alpha)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P1b-1-alpha-interest.md` | Alpha | `server/opf/plane_interest.py`. Heartbeat `< 45 s` grace (default 15 s) for **`LABS_OPF_PLANE_WINGS_TOPICS` only**. **Does not read `LABS_OPF_LISTED_PAIRS` and does not construct a listed topic (errata E1).** **Same `mb:interest:{topic}` key** — attribution in a sidecar or `held_by`, **never a decorated topic**. Stops when the plane is disabled. New topic strings via `bus_ladder_key()` only (E3) |
| `P1b-2-kilo.md` | Kilo | **AT-GP23**: with the plane on and **no member watching**, the topic is returned **unmodified** by `list_interest_topics("mb:ladder:")` and `chain_feed.tick` does not idle |
| `P1b-G` | Delta | `mb:ladder:*` **and** an `mb:pub` message with **no member watching**. `bus ≠ not_configured`. **Live, not a fixture** |

### P2-0 — `keys.py`, gated alone (Alpha)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P2-0-alpha-keys.md` | Alpha | `LadderTopic.book`, `wings: int \| None`, `bus_ladder_key(book=…)`. **End-anchored parsing preserved.** `w0` rejected as a listed marker. Legacy single-side unchanged |
| `P2-0-kilo.md` | Kilo | **AT-GP22 full matrix**: `…:listed:dual` · `…:w15:dual` with `I:SPX` intact · legacy single-side · non-ladder → `None` |
| `P2-0-G` | Delta | **AT-GP22 alone. Nothing else lands until this is green** — a regression here breaks the feed, the hydrator and the Heatmap at once, and it fails silently (`parse_ladder_topic` returns `None`, it does not raise) |

### P2 — hydrator (Alpha · Kilo)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P2-1-alpha-store.md` | Alpha | `generation.py`: namespace, `source`, `book`, staleness, **book-aware `get_by_expiration`**, `_hydrate` → `supplied` + identity + 60 s TTL, health counts `owned`. **Plus `server/opf/store_read.py` — the analytics-class read helper that rejects `namespace="supplied"` and `source ∈ {client_body, http_fill}`. Exit: AT-GP2** |
| `P2-2-alpha-hydrator.md` | Alpha | `server/opf/hydrator.py` in-process lifespan task. `mb:pub` subscribe + reconcile backstop. **No Massive.** Idempotent on `content_hash`. Older `as_of` refused. GP23 workers assert (**AT-GP19**). **Config helper distinguishing UNSET from SET-TO-EMPTY — `opf.config._env` collapses `""` to the default, so `LABS_OPF_PLANE_WINGS_TOPICS=""` silently becomes the default without it (Reference §5.1, spec §9.2)** |
| `P2-3-kilo.md` | Kilo | AT-GP1–11, 15a–c, 17, **19**, 20, 21. **AT-GP1 live on the P1a host** |
| `P2-G` | Delta | Evidence pack. **FAIL if** the hydrator is a separate process · AT-GP1 is fixture-only · any unnamespaced `put`/`get` remains |

### P3 — visibility (Alpha · Mike)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P3-1-alpha-route.md` | Alpha | `GET /api/me/market/generation`. Envelope spec §7. **`book` required.** Owned only |
| `P3-2-mike.md` | Mike | Gate wired, or explicit "waits on P6" with 401/403 fail-closed — **not** `_require_tool_member` |
| `P3-3-kilo.md` | Kilo | AT-GP16, 18 |
| `P3-G` | Delta | |

### P4 — listed writer (Alpha · Hotel)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P4-1-alpha-writer.md` | Alpha | `listed_writer.py`. GP16–GP20. `set_json` same path. `book: listed`, `source: listed_writer`. Cadence OD-GP4. **Calls `bus_ladder_key(book="listed")` — parser already proven at P2-0.** **Registers no interest (errata E1).** `LISTED_PAIRS` is this packet's config, not P1b's |
| `P4-2-hotel.md` | Hotel | Completeness; no clamp; truncation writes nothing; not labelled chain GEX |
| `P4-3-kilo.md` | Kilo | AT-GP12, 13, 23 with listed pairs; **AT-GP22 as regression** |
| `P4-G` | Delta | |

### P6 — auth (Mike)

| Seed | Agent | Done when |
|------|-------|-----------|
| `P6-1-mike.md` | Mike | Read capability on `product:` target. Policy row. Visibility consults it. Pricing what-if unchanged |
| `P6-2-kilo.md` | Kilo | 403 without entitlement; 200 with. AT-GP16 still green |
| `P6-G` | Delta | |

### W-G — close

| Seed | Agent | Done when |
|------|-------|-----------|
| `WG-1-kilo.md` | Kilo | Full AT-GP matrix minus 14. AT-GP20 |
| `WG-2-lima.md` | Lima | DL close. Arch 30 as-built for the plane. Deploy notes |
| `WG-delta.md` | Delta | Fail-closed §10. **Explicit non-claim: GEX compute not shipped; capability exists; L4-A still frozen until Coach opens that spec** |

---

## 8. Change declaration (from spec §15 — declare again on each seed)

**New:** `server/opf/hydrator.py` (P2) · `server/opf/listed_writer.py` (P4) ·
`server/opf/plane_interest.py` (**P1b**) · `server/opf/store_read.py` (**P2-1**) ·
`server/routes/market_generation.py` (P3) · `server/tests/test_opf_generation_plane.py` · this plan
· board

**Modified (DL-539 allowlist — three OKs before first edit):**
`server/opf/keys.py` (**P2-0**) · `server/opf/generation.py` (P2-1) · `server/opf/config.py` (P2-2) ·
`server/routes/pricing.py` (P2-1) · `server/main.py` (P2-2) ·
`Architecture/30-options-pricing-foundation.md` (P0) · `Architecture/00-decision-log.md` (P0) ·
`infra/deploy.md` (P1a)

**P1a ops (named host):** Redis, `LABS_MARKET_BUS`, `chain_feed` launchd, env names. May add
`infra/launchd/ai.fattail.labs.chain-feed.plist` from the existing example.

**Not touched:** pricing what-if **behaviour** (GP1a) ·
`opf/{interest,leg,package,lock,resolve,archive}.py` · live ladder / HM17/HM18 · templates · GEX
compute · L4-A route · StudioOne · Time Machine

---

## 9. AT map

| AT | Phase | Gated at | Note |
|----|-------|----------|------|
| AT-GP1 | P2 | P2-G | Hydrator, zero Massive. **Live on P1a host** |
| AT-GP2 | P2 | P2-G | `store_read.py` helper, not a URL |
| AT-GP3 | P2 | P2-G | `source` required |
| AT-GP4 | P2 / P4 | P2-G / P4-G | `book` at write |
| AT-GP5 | P2 | P2-G | No default book |
| AT-GP6 | P2 | P2-G | `mb:pub` + backstop alone |
| AT-GP7 | P2 | P2-G | hash idempotent |
| AT-GP8 | P2 | P2-G | as_of order |
| AT-GP9 | P2 | P2-G | stale served |
| AT-GP10 | P2 | P2-G | Redis down → broken |
| AT-GP11 | P2 | P2-G | three bus states; API serves |
| AT-GP12 | P4 | P4-G | listed completeness |
| AT-GP13 | P4 | P4-G | page bound from listed count |
| AT-GP14 | — | — | **Withdrawn** |
| AT-GP15a–c | P2 | P2-G | per-subsystem config |
| AT-GP16 | P3 | P3-G | visibility states + `book` param |
| AT-GP17 | P2 | P2-G | health `owned` only |
| AT-GP18 | P3 | P3-G | two clocks |
| **AT-GP19** | P2 | **P2-G** | multi-worker fail loud — **was ungated in v1.0** |
| AT-GP20 | every Delta | all | 20 foundation ATs |
| AT-GP21 | P2 | P2-G | three entries coexist |
| **AT-GP22** | **P2-0** | **P2-0-G** | listed parse + `I:SPX`. **Regression check at P4-G** |
| AT-GP23 | **P1b** (wings topics) / P4 (listed writer does **not** register interest) | **P1b-G** | plane interest **wings-only**; feed does not idle when a wings topic is configured. Listed pairs are not an interest test |

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
- **Changing `LABS_MB_CHAIN_TTL_S` to avoid implementing hold-past-TTL** *(promoted from O6 — raising the TTL defeats GP14 while passing every test)*
- **Foxtrot shipping product code in P1a**, or **P1a claiming AT-GP23 on a manual interest touch**
- `w0` as listed marker
- Listed writer using `max_pages=3` as the bound
- Truncation that writes a partial listed generation
- Reusing `get_by_expiration` without `book`
- Unnamespaced `put`/`get`
- Claiming plane-up on a host while Redis/`chain_feed`/`LABS_MARKET_BUS` are absent
- Editing §8 files without three successive OKs on `GP-W0.md`
- Stamping this plan as a substitute for spec BUILD AUTHORITY
- **Constructing a ladder topic string outside `keys.py` (new code).** `chain_feed.py:tick` already does this (`f"mb:ladder:{ul}:{exp}:w{wings}:dual"`). **New code uses `bus_ladder_key()`.** The existing inline f-string is recorded, out of scope, and is why a listed topic must never reach the feed (errata E3)
- **Registering listed pairs as `mb:interest:*` (GP21 erratum).** That asks the feed for a wings book under a key it cannot spell (`wNone` after P2-0)

---

## 11. Non-goals (spec §14 — restated)

- Exposure computation of any kind
- Analytics route, Surface, Profile, Card, SVP tools
- Golden vectors against a fixture-only store called "done"
- A second archive beside StudioOne
- Rewriting the pricing what-if path
- Moving `ContractStore` to a shared plane (guarded by GP23, not solved)

---

## 12. Seating

| Agent | Role here |
|-------|-----------|
| **Coach** | GO SPEC, OD-GP3, AT-GP22 ownership, DL-539 OKs |
| **Juliet** | This plan, board, seeds |
| **India** | Spec/architecture; P0; every implementation gate |
| **Alpha** | **P1b**, P2-0, P2–P4 server |
| **Foxtrot** | **P1a host — infra only, no Python** |
| **Mike** | P6 + visibility auth |
| **Hotel** | Listed book honesty; GP7 |
| **Tango** | Visibility copy; no chain-GEX on a window |
| **Kilo** | AT-GP matrix |
| **Lima** | P0 honesty, hashes, DL, GP18a erratum |
| **Delta** | Every phase end |
| **Echo** | **Not seated** (no chrome) |

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| v1.0 | 2026-09-01 | Juliet. Against Generation Plane Spec v0.2.2 (India-signed). GXA0 evidence |
| **v1.1** | 2026-09-01 | **Merged review applied — ten changes, no new law.** Landed as `docs/OPF Generation Plane Spec v0.2.2 — Full Agent Bench Plan v1.1.md` |
| **v1.1 + E1–E3** | 2026-09-01 | **This file.** Errata applied inline. **GP21 erratum:** interest is wings-only. **E1** `plane_interest.py` does not read `LISTED_PAIRS`. **E2** P1b-G empty config is `BLOCKED` not `FAIL`. **E3** new code uses `bus_ladder_key()`. `chain_feed.py` inline f-string recorded, not fixed |

**Next for Coach:** stamp **v1.1 + errata** on `agents/go/GP-W0.md` (OD-GP3, AT-GP22 ownership, DL-539 OKs, GP21 erratum). W0-0 or return.