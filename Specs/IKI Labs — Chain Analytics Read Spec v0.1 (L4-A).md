# IKI Labs — Chain Analytics Read Spec v0.1 (L4-A)

**Status:** **DRAFT** — not build authority. Change declaration in §8 awaits Coach approval
(invariant 5).
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-Chain-Analytics-Read-Spec-v0_1.md`
**Short name:** **L4-A** / **Analytics Read**
**Type:** Foundation API — a **read contract over OPF L1**, sibling to L4 pricing

**Why this exists.** Coach chose to build the component with the greatest data requirements first,
so the API upgrade streamlines everything after it. Reading the as-built code changes what that
upgrade is. It is **not** a new capture — most of the capture already exists. It is the read
contract that does not.

**Evidence base.** Direct read of `~/Fattail-Labs` on 2026-09-01: `server/opf/*`,
`server/market_data/massive_client.py`, `server/routes/pricing.py`,
`web/lib/options-lab/templates/{gex,pricing,registry}.ts`.

---

## 1. As-built findings — five corrections to documents already written

Recorded first because three of them contradict specs landed earlier today. Where this section and
an earlier IKI spec disagree, **this section is the evidence and the earlier spec is the bug.**

### F1 — `gex_v1` is shipped, and it lives in the browser

`web/lib/options-lab/templates/pricing.ts:440`:

```ts
const raw = g * oi * s * s;
return side === "call" ? raw : -raw;
```

Registered as template `gex` — *"Chain GEX (estimate)"* — with modes `gex_all / gex_net / gex_abs`
and display divisor `GEX_DISPLAY_DIV = 1e9`. It is in `HEATMAP_TEMPLATES` today.

**Consequence:** `gex-profile` is not a new tool. It is an **extension of a shipped template**, and
the IKI Profile spec understated that. More importantly —

### F2 — the server cannot compute GEX at all · **this is the actual gap**

The computation exists **only** in TypeScript, only in the browser, only against a client
`ChainContext`. There is no Python path from a generation to a per-strike exposure value.

That is the architectural problem the whole toolset walks into:

| Consequence | |
|---|---|
| **Node Card cannot exist as specified** | Its contract is a JSON/SSE payload feeding "UI, bot, and journal" (**NC1**, **NC10**). A server cannot publish a number it cannot compute |
| **Agent parity is unachievable** | Foundation §17 requires agents read the same payload. Today an agent would have to run a browser |
| **The agreement tests cannot pass by construction** | **AT-GP12 / AT-NC13 / AT-SP1** demand byte-identical values across tools. Five client re-implementations agree by discipline, which is the arrangement **SV38** exists to forbid |
| **The `gex_v2` units freeze would land in a component** | Rather than in one owned place |

### F3 — pagination and multi-expiry range pulls already exist

`massive_client.fetch_option_chain` takes `expiration_date_gte` / `expiration_date_lte`,
`strike_price_gte` / `strike_price_lte`, `max_pages`, and `allow_truncate` — following `next_url`
and raising when truncation would be silent.

**Correction to `IKI-Labs-GEX-Surface-Spec-v0_1.md` GS1:** the Surface does not need a batch
producer *built*; it needs one *called*. Arch 30 **§6.1** already legislated the split I re-derived:

> **Heatmap UI generation** may keep one-page dual-side law (≤250 / HM17). **OPF foundation
> generation** may **paginate** under integrity law: complete required strikes or fail loud.

Two callers, two laws — already decided, already implemented.

### F4 — OPF L1 already holds multi-expiry generations, and already measures their skew

`ContractStore` keys generations by `(chain_underlier, expiration, wings)` and offers
`get_by_expiration`. `build_epoch()` computes `max_skew_ms` and `epoch_quality` across N
generations. `archive.py` day-shards them with `archive_get(key, as_of, max_stale_ms)` and raises
`ArchiveGap` rather than silently serving stale.

**Correction to GS2:** a strike × expiry grid is **assembleable from the store today**. Back-select
has a substrate. What is missing is a writer that runs for N expirations and a reader shaped like a
grid — not a new storage tree.

**Correction to Foundation GXF25/GXF26:** the bucket plane for the three time-axis tools is
`svp_v1`, unchanged. But the **multi-expiry** plane is **OPF L1 + its archive**, not a new capture.

### F5 — a latent defect in the shipped formula · **worth fixing in the same change**

`gexSide` computes `Γ·OI·S²` with **no contract multiplier term at all**.

Arithmetically this matches Coach's `Γ × OI × 100 × S² × 0.01` — the ×100 and ×0.01 cancel
(**GXF7**), so the shipped number is correct **for a 100-multiplier product**. Every product in
the current universe is one, so nothing is wrong today.

But the multiplier is **absent rather than set to 100**. A product with a different multiplier
would be silently wrong by that factor, with no failure and no label. Under invariant 2 that is a
hardcoded assumption wearing an omission. The server implementation takes `multiplier` from
`GexPolicy` per product (**GXF16**), and the TS path reads it from the same source.

---

## 2. What to build, and why it is the right first component

**Build the GEX Surface.** It is the only component that exercises **multi-expiry assembly +
pagination + interest budget + archive replay + grid read** simultaneously. Every other tool's data
requirement is a subset:

| Component | Data requirement | Subset of Surface? |
|---|---|---|
| **GEX Surface** | N expirations, paged, live + archived, gridded | — |
| GEX Profile | 1 expiration, live | ✔ |
| Node Card | derives from Profile | ✔ |
| Pressure Field / Node Tape / Session Path | 1 expiration, **time depth** (`svp_v1`) | orthogonal — needs duration, not breadth |

The three time-axis tools need the capture to **run for longer**, which no API upgrade accelerates.
The Surface needs the API to be **wider**, which is exactly the thing that generalises.

**The upgrade is L4-A: a server-side analytics read over OPF L1.** L4's `resolve_pricing` answers
*what is this structure worth* — `StrategyIntent → marks, curves, lock`. It cannot answer *what is
the per-strike exposure across these expirations*, and it should not be bent to; that is a
different question over the same store.

**What every later component inherits from building it once:**

1. One server computation of `gex_v1`, so the agreement tests pass **by construction** rather than by discipline
2. A Node Card that can exist — a server-publishable payload
3. Agent parity for free
4. The `gex_v2` units freeze landing in one owned place
5. Any future per-strike analytic (DEX, VEX, charm, flow) becoming a **new `metric` on an existing contract**, not a new stack
6. Coverage on an analytics payload, once

---

## 3. The contract

```text
POST /api/me/market/chain-analytics
```

**Request**

```json
{
  "product": "SPX",
  "expirations": ["2026-09-01", "2026-09-04", "2026-09-19"],
  "metric": "gex",
  "lens": "oi",
  "grain": "strike_expiry",
  "strike_window": { "mode": "spot_pct", "value": 0.04 },
  "as_of": null,
  "algo_version": "gex_v1"
}
```

**Response**

```json
{
  "product": "SPX",
  "spot": 0,
  "metric": "gex", "lens": "oi", "algo_version": "gex_v1",
  "sign_convention": "dealer_short_public_v1",
  "units": "usd_notional_per_1pct",
  "cells": [
    { "strike": 0, "expiration": "2026-09-01",
      "net": 0, "call": 0, "put": 0,
      "oi_call": 0, "oi_put": 0,
      "valid": true, "invalid_reason": null,
      "held_to_clock": false }
  ],
  "epoch": { "max_skew_ms": 0, "epoch_quality": "ok", "generations": {} },
  "coverage": { }
}
```

### 3.1 Law

| # | Law |
|---|---|
| **CA1** | **One computation, server-side, SoR.** `gex_v1` is implemented once in Python over `ChainGeneration.rows`. The TypeScript path becomes a **renderer of server values** or, where a client compute is retained for responsiveness, is bound by **golden vectors in CI** — the OPF **OD-PF6** rule, unchanged. Drift is a test failure, not a production surprise |
| **CA2** | **Read-only.** The endpoint never triggers a Massive pull, a backfill, or a rebuild. It reads `ContractStore` for live and `archive` for `as_of`. 404 when never built; explicit *outside horizon* past the archive (**SV16** parity) |
| **CA3** | **Grain is declared, not inferred.** `strike` (rolled across the requested expirations) or `strike_expiry` (the grid). A roll-up is computed at read and **never** stored as a second artifact |
| **CA4** | **Epoch travels.** Every response carries `max_skew_ms` and `epoch_quality` from `build_epoch()`. A grid assembled from generations seconds apart is honest only if it says so. **Skew is disclosed, never failed** here — this is analytics, not a day-trade mark (**OPF OD-PF8** applies to pricing, not to this contract) |
| **CA5** | **Invalid is not zero.** Null Γ or null OI on a side ⇒ that side invalid; `net` invalid unless both resolve. **No cell is ever zero to mean absent** (**GXF33**, AT-HM8 parity) |
| **CA6** | **Coverage always.** Scope, expirations requested vs resolved, `oi_asof`, page counts where a batch fed it, `held_to_clock` per cell, completeness. A 200 without coverage is **malformed** (**GXF30**) |
| **CA7** | **Metric is an enum with owned units.** `gex` ships first. `dex`, `vex`, `charm` are added only with their derivation written out and their own `algo_version` (**GS8**) — never as a switch with undocumented units |
| **CA8** | **Interest budget binds.** Requesting N expirations claims N generation keys through the existing `InterestManager`. At cap it **refuses loudly** (**OPF §9**, `LABS_OPF_MAX_GENERATION_INTERESTS`) — a grid request must not silently starve a member's live surface |
| **CA9** | **No policy in the endpoint.** Multiplier, sign convention, scale, near-zero thresholds and session windows come from `GexPolicy` (**GXF16**), and missing config **aborts boot** (**GXF17**) |
| **CA10** | **Access.** `require_session` + tool-member read + universe gate, matching `routes/pricing.py`. No new unauthenticated surface |

---

## 4. Why the endpoint is not `resolve`

Recorded so a reviewer does not propose it, and so a future reader knows it was considered.

`resolve_pricing(use_case, intent, store, …)` takes a **StrategyIntent** — legs with quantities —
and returns marks, curves and a lock. A GEX grid has no legs, no quantities, no lock, and no
package. Passing a synthetic intent to obtain a per-strike aggregate would put analytics inside the
pricing pack registry, where every future pack would have to know about it.

They share the **store**, which is the correct sharing. They do not share the **question**.

---

## 5. Phasing

| Phase | Deliverable | Exit |
|---|---|---|
| **GXA1** | `server/opf/analytics.py` — `gex_v1` over `ChainGeneration`; per-strike and per-(strike, expiry) aggregation; invalid propagation. **No route, no UI** | Golden vectors match `pricing.ts` **byte for byte** on a fixture chain |
| **GXA2** | Multi-expiry assembly — N keys through `InterestManager`, `build_epoch`, budget refusal at cap | Cap fixture refuses loudly; epoch fields populated |
| **GXA3** | `POST /api/me/market/chain-analytics` + coverage object | CA1–CA10 acceptance; curl transcript |
| **GXA4** | Archive read path for `as_of` — multi-expiration replay, `ArchiveGap` surfaced as a named state | Back-select fixture returns explicit no-data outside horizon |
| **GXA5** | Batch writer for enumerated `(product, expiration)` pairs using the existing paged client | `next_url` followed and `pages` recorded, while the live path still hard-errors on the same fixture |
| **GXA6** | `gex-surface` template consuming L4-A | Surface spec AT set |

**GXA1 is the whole point.** Once one server function computes `gex_v1` and proves parity with the
shipped client, every other component in the family becomes a consumer rather than a
re-implementation.

---

## 6. Corrections to land in the same body of work

| Doc | Correction |
|---|---|
| `IKI-Labs-GEX-Surface-Spec-v0_1.md` | **GS1–GS4 revised** — the plane is OPF L1 + archive, not a new capture; pagination exists; Arch 30 §6.1 already legislates the caller split |
| `IKI-Labs-GEX-Toolset-Foundation-Spec` | **GXF25/GXF26 amended** — plane assignment splits: `svp_v1` for the three time-axis tools, **OPF L1** for the Surface |
| `IKI-Labs-GEX-Profile-Spec-v0_1.md` | Stated as an **extension of the shipped `gex` template**, not a new one |
| `IKI-Labs-GEX-Toolset-Execution-Plan-v1_0.md` | **GX1-P replaced by GXA1–GXA5.** The Surface is no longer last-because-its-capture-does-not-exist; it is **first, because its API upgrade is the foundation everything else reads** |
| `Architecture/29` + `30` | Documentation parity: L5 GEX wiring is no longer "later" — it is this program (invariant 6) |

**Execution-plan consequence, stated plainly:** Coach's instinct inverts my ordering and the
evidence supports Coach. I sequenced the Surface last because I believed its data did not exist.
It does. Building it first lands the server computation that four other components need, so
**GEX Profile becomes cheaper after the Surface, not before it.**

---

## 7. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-CA1** | Does the client keep computing `gex_v1` for responsiveness, or render server values only? | **Keep the client path, bind it with golden vectors** (OPF OD-PF6). Ripping it out costs live responsiveness; leaving it unbound costs agreement |
| **OD-CA2** | `POST` or `GET` | **POST** — the expiration list and strike window exceed comfortable query length, and it matches `routes/pricing.py` |
| **OD-CA3** | Enumerated `(product, expiration)` pairs for the GXA5 writer | Coach enumerates. Cost is linear in pairs (**CA8**, `SV20` parity) |
| **OD-CA4** | Does `gex_v2` land in GXA1 or after? | **In GXA1.** It is a units label and divisor, and landing it with the first server implementation avoids relabelling five consumers later (**OD-GXF4**) |
| **OD-CA5** | Fix **F5**'s absent multiplier in this change, or separately? | **This change.** It is three lines and one config read, and it is in the file being touched anyway |

---

## 8. Change declaration — approval required before any implementation

Per `INSTRUCTIONS` §5 and invariant 5. **Nothing below has been touched.**

**New files**

| Path | Purpose |
|---|---|
| `server/opf/analytics.py` | `gex_v1` server implementation; per-strike and grid aggregation |
| `server/routes/chain_analytics.py` | `POST /api/me/market/chain-analytics` |
| `server/tests/test_chain_analytics.py` | CA1–CA10 |
| `server/tests/fixtures/iki-gex/` | Golden vectors + the fixture pack (Acceptance Suite §1) |
| `Specs/IKI-Labs-Chain-Analytics-Read-Spec-v0_1.md` | This document |

**Modified files**

| Path | Change |
|---|---|
| `server/opf/config.py` | `GexPolicy` block — multiplier per product, sign convention, scale, thresholds; **boot abort when unset** |
| `server/main.py` | Register the new router |
| `web/lib/options-lab/templates/pricing.ts` | **F5** — take `multiplier` from policy instead of omitting it |
| `Architecture/00-decision-log.md` | DL entry, same day |
| `Architecture/29-*.md`, `30-*.md` | Parity: L5 GEX wiring is this program |

**Explicitly not touched**

`server/opf/{generation,interest,keys,archive,resolve,leg,package,lock}.py` · the pricing pack
registry · the live chain generation path and its `next_url` hard error · every existing template ·
anything past the staging line (**GXF50**).

**Gate.** India (is L4-A the right boundary, or is this L4 with a second use case?) → Delta
(golden-vector parity evidence) → Coach GO.

---

## 9. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. As-built findings F1–F5 from direct code read, correcting GS1–GS4, GXF25/26 and the Profile spec's framing. **F2 is the finding that matters: the server cannot compute GEX at all.** L4-A contract CA1–CA10. Phasing GXA1–GXA6. Change declaration §8 pending approval |

**One-line law:**
**One server-side computation of the exposure, read as a grid over the generations OPF already
holds — so that five later components consume a number instead of re-deriving it, and the agreement
tests pass by construction rather than by discipline.**