# IKI Labs — GEX Toolset Foundation Spec v0.1

**Status:** **DRAFT** — not build authority. Requires Coach GO at phase **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md`
**Type:** Foundation spec — the shared law the six tool specs reference and **do not restate**
**Short name:** **GEX Foundation** / **GXF**

**Content hash (v0.1):** recompute at Coach GO:
`shasum -a 1 Specs/IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md` → record in DL.

**Why this document exists.** Six tools compute one quantity. The sign convention, the units, the
frame join, the hygiene rules, the session calendar, the flip definition and the copy law are
**shared**. Six documents each restating them is six places for them to drift, and the failure that
produces is named in Heatmap Templates v0.2: *a second implementation of the same quantity is how
two surfaces start disagreeing about the same market.* This document owns that law once. A tool
spec that restates it instead of referencing it is a defect in the tool spec.

**Companion documents:**

| Doc | Role |
|---|---|
| `IKI-Labs-GEX-Profile-Spec-v0_1.md` … ×6 | Per-tool contracts. Reference this document; never override it |
| [`IKI-Labs-GEX-Toolset-Known-Anomalies-Register-v0_1.md`](./IKI-Labs-GEX-Toolset-Known-Anomalies-Register-v0_1.md) | **Normative.** The coverage contract in §12 is that register's L1 |
| [`IKI-Labs-GEX-Toolset-Spec-Review-v0_1.md`](./IKI-Labs-GEX-Toolset-Spec-Review-v0_1.md) | Review of Coach's product specification; G1–G16 dispositions folded here |
| [`IKI-Labs-GEX-Tool-Family-Source-Note-v0_1.md`](./IKI-Labs-GEX-Tool-Family-Source-Note-v0_1.md) | Coach's framing, held verbatim |

---

## 0. What IKI Labs is (Coach lock, 2026-09-01)

> **IKI Labs is a FatTail Labs surface — specifically a pipeline that creates tools, ultimately
> meant to become components that can be subscribed to and run in a user's subscription. The tools
> run in the Runner (formerly Options Lab Heatmap), and resulting positions are displayed in the
> Analyzer.**

Four consequences, all load-bearing, and none of them optional:

| Consequence | Because |
|---|---|
| **This is P1 platform work, not a new product** | It makes the platform host and gate something correctly. `INSTRUCTIONS` §4 routing test |
| **The Heatmap Templates law binds in full** | The Runner **is** the Options Lab Heatmap under a new name. HM1–HM23 apply as written. A GEX tool is a Runner template |
| **A tool is a subscribable component, not just a view** | It needs identity, an entitlement gate, a registry entry and a lifecycle — §2 |
| **Structures leaving a tool land in the Analyzer** | There is a handoff contract, and it is one-directional — §15 |

**GXF1 — no parallel Runner.** The tools are templates in the existing registry, reading the
existing shared chain model over the existing push stream. IKI Labs does not stand up a second
chain client, a second Massive subscription, a second store of truth, or a second template
framework. *(HM1, HM2, HM3; `INSTRUCTIONS` §8 "build on what exists".)*

**GXF2 — "IKI Labs" is the pipeline; "the Runner" is where tools execute.** Keep the two words
apart in code, config and copy. IKI Labs produces and governs components. The Runner hosts and runs
them. A member subscribes to a component; they do not subscribe to IKI Labs.

**Naming note recorded, not resolved.** "Options Lab Heatmap" appears throughout
`Architecture/29-options-lab-heatmap-templates.md`, the Heatmap Templates specs, and the registry
path `web/lib/options-lab/templates/`. The rename to **Runner** is a decision-log entry and a
documentation-parity sweep, not a quiet find-and-replace. **OD-GXF1.**

---

## 1. Parents and precedence

Lower number wins a conflict.

| # | Document | Authority here |
|---|---|---|
| 1 | `Architecture/00-decision-log.md` | Binding decisions and reversals |
| 2 | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` + **v0.3** | **Parent law.** HM1–HM23, template contract, `gex_v1`, colour, the auxiliary plane |
| 3 | `Specs/FatTail-Labs-Session-Option-Volume-Profile-Spec-v0_3.md` | Measurement law for session volume; SV62–SV67; the artifact these tools read |
| 4 | `Architecture/30-options-pricing-foundation.md` | L0–L4 stack; generation store; model pack runtime |
| 5 | `Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` | One WS per tab; generation store; live priority |
| 6 | **This document** | Shared law for the six GEX tools |
| 7 | The six tool specs | Per-tool contracts |

**Sacred invariants that bite hardest here** (`INSTRUCTIONS` §2): **2** config-driven and fail loud
(§7) · **4** evidence over assertion (§12, and every magnitude in §13) · **6** documentation parity
· **8** process outcomes only, **never profit claims** (§13) · **10** test suite green.

---

## 2. The component model

A GEX tool is a **subscribable component**. That is a product object, not a UI concept.

### 2.1 Component identity

```ts
type ToolComponent = {
  id: string;                  // "gex-profile" — stable, never renamed
  version: string;             // semver; pinned per subscription
  label: string;               // member-facing; Echo owns (OD-GXF2)
  runner_template_id: string;  // registry id inside the Runner
  entitlement_key: string;     // → plans via provider_plan_map (data, not env)
  data_plane?: string;         // HM21 declaration; absent for pure chain tools
  analyzer_handoff: boolean;   // may emit a structure to the Analyzer (§15)
  status: "draft" | "beta" | "live" | "retired";
};
```

**GXF3 — component id is permanent.** The member-facing label may change; the id may not. A
subscription references the id.

**GXF4 — entitlement is data, not code.** Component access maps through `provider_plan_map` the way
every other Labs entitlement does. No component hardcodes a plan name, a role string or a symbol
list. *(Identity pillar; invariant 2.)*

**GXF5 — a component is born draft and invisible.** It becomes member-visible only when a human
promotes it. This is invariant 7 (draft → publish, the gate is human, always), and it applies to a
tool component exactly as it applies to a lesson.

**GXF6 — version pinning.** A subscription pins a component version. A published version's
**observable contract** — output schema, units, sign convention, algo version — is immutable.
Changing any of them is a new version, never an edit in place. A member whose alert fired on
`flip_px` yesterday must not find the field meaning something else today.

### 2.2 What a component may not do

| Forbidden | Because |
|---|---|
| Own a fetch | HM21b — the template declares a plane, **the host resolves it** |
| Poll on a steady-state interval | HM3 — push, not poll |
| Write, enqueue, rebuild or backfill through any plane | HM21c — read-only |
| Hold state that is not derivable from its inputs | HM6 — `computeCell` is pure |
| Declare more than one auxiliary plane | HM21e — two planes is two components, or a plane that has not been designed |
| Invent a charge, a plan, or a checkout | Commerce pillar — providers own checkout; the app never invents charges |

---

## 3. The quantity — one formula, one owner

### 3.1 The freeze

```text
gex = gamma × oi × multiplier × spot² × 0.01 × sign
sign       = +1 if call, −1 if put        (dealer-short-the-public convention)
multiplier = 100                           (equity-style; per-product config — §7)
```

**GXF7 — this is `gex_v1`, unchanged.** The `×100` and the `×0.01` cancel, so the value equals
`Γ·OI·S²` — the frozen Heatmap quantity (Heatmap v0.2 §5.5) to the digit. **Nothing recomputes and
no existing surface changes.**

**GXF8 — the units freeze is `gex_v2`, and the Heatmap owns it.** Writing the two factors out is
the derivation:

```text
Γ                              = ∂Δ/∂S, per share
1 contract                     = multiplier shares
1 % move                       ⇒ ΔS = 0.01·S

shares to re-hedge $1 move     = Γ · OI · multiplier
shares to re-hedge a 1 % move  = Γ · OI · multiplier · 0.01 · S
notional $ for that 1 % move   = Γ · OI · multiplier · 0.01 · S²
```

So the number is **USD notional of underlying that must trade to re-hedge a 1 % move**, under the
stated dealer convention. Per SVP **SV60**, that units label and its display divisor are owned by
the **Heatmap GEX surface** and consumed here. **This document does not define `gex_v2`; it uses
it.** Until the Heatmap lands the freeze, IKI renders under `gex_v1`'s own labelling.

**GXF9 — scale is a display control, never a second quantity.** *Per 1 %* (default) and *per $1*
(omit `×0.01` and one `spot`) are two renderings of one stored value. The stored value never
changes with the toggle, and the active scale is stated on the surface.

### 3.2 The sign convention

**GXF10 — the dealer sign is an assumption, and it is stated wherever a signed value renders.**
Long calls / short puts is a modelling choice Labs cannot verify from a chain (Heatmap SV41 parity,
`AN-A1`). Not once in a legend — wherever the value appears, including payload field descriptions
and the agent export.

### 3.3 The Volume lens is a different quantity

**GXF11 — `gex_vol` is unsigned, and it is not exposure.**

```text
gex_vol = gamma × delta_volume × multiplier × spot² × 0.01      # NO sign factor
```

Volume has no side and no open/close flag: a snapshot reports how many contracts traded, not who
initiated or whether a position opened or closed. Applying the dealer sign asserts *who holds*, which
volume cannot support. *(SVP SV28; AT-SV18; review G5.)*

| Rule | |
|---|---|
| Name | **Gamma-weighted flow**, never "volume GEX", never "today's gamma" |
| Version | Its own `algo_version` (`gxflow_v1`), its own units label, its own baseline |
| Never | Summed, ratio'd, stacked or scored into one number with `gex_oi`; never on the same axis or the same colour scale |
| **No derived signed objects** | Because it is unsigned there is **no flip, no wall, no regime and no cumulative zero cross** under this lens. Tools disable those controls rather than computing them from an unsigned series (**AT-GXF7**) |
| Framing | It answers *where is today's flow landing relative to where gamma sits* — the honest and genuinely valuable question. It does not answer *what do dealers hold* |

**Why this is worth having:** OI shows where positions **were** as of last night; flow shows where
the market **is trading** today. Neither alone is the picture. Side by side on one strike axis is
the thing the category's tools do not show — and it only works if the staleness (`AN-A2`) and the
absence of side (`AN-A3`) are both on the surface.

---

## 4. Shared inputs

### 4.1 OPF frame

| Field | Required | Notes |
|---|---|---|
| `ts` | yes | capture or exchange time, epoch ms. **Frame-level; rows carry no timestamp** (`AN-V6`) |
| `underlying` | yes | universe-gated symbol |
| `expiry`, `dte` | yes | `dte` per §8.3 |
| `strike`, `right` | yes | `C` / `P` |
| `bid`, `ask`, `mid` | yes | hygiene inputs |
| `iv` | yes | mark/mid IV |
| `delta`, `gamma`, `vega`, `theta` | yes | `gamma` null ⇒ invalid cell, never zero (`AN-V5`) |
| `oi` | yes | **stale by construction** — carries `oi_asof` (`AN-A2`) |
| `volume` | yes | **session-to-date cumulative**, vendor-reported (SVP SV1) |
| `quote_age_ms`, `bid_ask_width` | yes | hygiene inputs |

### 4.2 Underlying stream

`ts` · `symbol` · `last`/`mid` · optional proxy basis.

### 4.3 Frame join

**GXF12 — bind each OPF frame to the underlying's last tick with `ts ≤ frame.ts`.** Never the spot
implied by the latest option quote. When a proxy vehicle stands in for the index, persist
`basis = index − proxy` at join and surface it whenever the proxy is in use (`AN-M6`).

**GXF13 — one clock basis, no interpolation across a gap.** Non-monotonic `asOf` is rejected or
seamed, never smoothed. *(Advanced Fly AF17 parity — the rule already in the codebase.)*

---

## 5. Hygiene — and its hard separation from volume accounting

### 5.1 Quote hygiene

A row's **prices and Greeks** are unusable when any of:

| Condition | Default |
|---|---|
| Crossed market (`bid > ask`) | always drop |
| `bid_ask_width` > `max_width_pct` | 15 % of mid; **0DTE 25 %** |
| `quote_age_ms` > `max_quote_age` | 15 000 ms; **0DTE 5 000 ms** |
| `gamma ≤ 0` or `iv ≤ 0` | always drop **and invalidate the GEX cell** |
| `oi < 0` or `volume < 0` | always drop |

All thresholds are `GexPolicy` config (§7). None are literals in code.

### 5.2 Volume accounting is not subject to quote hygiene

**GXF14 — carry `last_good_volume` and `last_good_ts` per contract across quote-hygiene drops.**

A row dropped for a **quote** reason has not stopped trading. Computing `delta_volume` only on
surviving rows makes the next difference span the gap and deposit the whole interval into the
bucket where the contract reappeared.

| Property | |
|---|---|
| Magnitude | **Correct either way** — volume is cumulative, so totals self-heal and `Σ Δ = V_end` holds |
| Error | **Time attribution only**, bounded by the gap length |
| Invisible when | The gap does not cross a bucket boundary — a drop lasting a few frames distorts nothing |
| Why it still matters | The error correlates with what the tools watch: quotes go wide across a swathe of strikes during a fast move, which is exactly when those strikes are trading |
| Exposed | **Node Tape** event detection and **Session Path** debounce — the two per-bucket threshold consumers. Profile, Surface and Card read current-frame state and are unaffected |

**Required:** mark any bucket whose delta spanned a gap. Event detectors **decline to fire** on a
marked bucket rather than treating a deferred deposit as an arrival (`AN-N3`, **AT-GXF9**).

---

## 6. Derived fields

Computed once per row per frame, after the join, and shared by all six tools.

```text
spot           = joined underlying (GXF12)
dte_bucket     = 0DTE | 1DTE | 2-3 | WEEK | MONTH | LEAP
gex_oi         = gamma × oi × multiplier × spot² × 0.01 × sign
gex_vol        = gamma × delta_volume × multiplier × spot² × 0.01        # unsigned — GXF11
dex_oi         = delta × oi × multiplier × spot × sign_dex               # optional; own sign rule
```

### 6.1 `delta_volume` — the day roll is a session boundary, not a revision

**GXF15 — roll detection runs BEFORE any clamp.** This is the ordering that matters, and getting it
backwards is the toolset's one blocking defect.

Measured (`P-SV5-day-roll.md`, five weekdays, folded as SVP **SV62**): the vendor's cumulative
volume **does not reset at the open**. Until roughly **09:31 ET** every contract carries its
**previous session's** total. The roll then drops each contract to today's small count — 59 of 62
inside one 11-second pair on 08-28; **~7 seconds across two groups on 08-20**. Post-roll values are
small positives, **1 to 451, never 0**.

A naive `delta_volume = max(0, v_t − v_t-1)` computes `max(0, 1886 − 4433) = 0` and reports that
nothing traded through the open.

| Rule | |
|---|---|
| **1. Detect first** | Per contract, by the **monotonic break** — not by the clock. Tolerate a spread of at least **15 s**; contracts in one session roll seconds apart |
| **2. Clock is a bound, not a trigger** | ~09:31 is what five days showed, not a contract. A roll outside the expected window is **recorded, not ignored** |
| **3. Discard pre-roll reads** | Prior-session data. Never accumulated, never a baseline |
| **4. First post-roll value is unattributed** | It is already a positive count of volume that traded between the open and the roll and can never be placed in a bucket. It goes to `unattributed` under a **pre-roll reason code**, distinct from a collection gap |
| **5. Then clamp** | `Δ = max(0, v_t − v_{t-1})` for genuine post-roll non-monotonicity; increment `revision_count`. **Never a negative bar** |
| **6. Identity** | `Σ Δ(t) + unattributed = V_end` per contract, **exactly** (**AT-GXF8**) |

**Recorded as an inference, not a proof:** that the pre-roll value *is* the prior session's total is
the best-supported reading. The archive is 0DTE-only (SV65), so no contract exists on two
consecutive days to test it. **`P-GX2`** is open against a dated expiration.

---

## 7. `GexPolicy` — one config object, fail loud

**GXF16 — every tool resolves these from one object. A tool that reads any of them from anywhere
else is defective.** Changing one in one tool and not the others makes the Flip disagree with the
Card, which is the failure the whole document exists to prevent.

```ts
type GexPolicy = {
  sign_convention: string;          // versioned string, e.g. "dealer_short_public_v1"
  multiplier: Record<Symbol, number>;
  scale: "per_1pct" | "per_1usd";   // display only (GXF9)
  algo_version: { oi: string; flow: string };   // "gex_v1" | "gex_v2" · "gxflow_v1"
  session: Record<Symbol, SessionWindows>;      // §8 — per book, not per symbol
  calendar_id: string;                          // trading calendar incl. half days
  hygiene: { max_width_pct, max_width_pct_0dte,
             max_quote_age_ms, max_quote_age_ms_0dte };
  roll: { min_spread_seconds, expected_window };  // §6.1
  near_zero_threshold: Record<Symbol, number>;    // NO defaults in code
  dte_definition: string;                         // §8.3, versioned
  bucket_seconds: number;                         // default 60
};
```

**GXF17 — missing or invalid config aborts boot.** No silent defaults, no fallback config loading,
no hardcoded ports, symbols, thresholds, dates or hosts. *(Invariant 2.)* This explicitly includes
`near_zero_threshold`: `$50M SPY / $500M SPX` are **starting values for config**, not constants
(review G11).

**GXF18 — display parameters are config, never `algo_version`.** Bucket size for rendering, colour
ramps, debounce counts and animation constants are camera preferences. Putting one into an algo
version forces a re-bin for a preference change. *(SVP §14.2 precedent.)*

---

## 8. Session clock and calendar

### 8.1 The window is a property of (instrument, expiring-or-not)

**GXF19.** Verified against Cboe contract specifications:

| Book | Window |
|---|---|
| **Expiring PM-settled** (SPXW on its expiration date) | **09:30 – 16:00 ET**; **13:00 ET** on a half day |
| **Non-expiring** SPX / SPXW | 09:30 – **16:15 ET** |
| **AM-settled SPX** | Ceases **17:00 ET the preceding business day** (usually Thursday) |

A single global RTH constant is wrong in both directions. `GexPolicy.session` carries a window per
book, and the active window is stated in coverage and on the surface.

### 8.2 The 16:00–16:15 state is real and must be rendered, not averaged

**GXF20.** For fifteen minutes the **0DTE book is settled and frozen while the rollup still
moves**. Session Path's `net_all` line and the Surface's non-0DTE columns are live; `net_0dte` is
final. Render that divergence honestly — it is a true and readable state, and collapsing it into
one window destroys information in both directions (`AN-M1`).

### 8.3 DTE definition, and the AM-settled trap

**GXF21 — an AM-settled contract leaves the tradable book at the prior close.** On settlement
morning it has open interest, a settlement value being computed from the opening prints, and **no
trading session at all**. Left in a `dte = 0` bucket it contributes a full day of frozen,
un-hedgeable gamma to the Profile, the Surface's 0DTE column and the Card's anchor (`AN-M3`,
review G15).

`dte_definition` is a versioned string in `GexPolicy`, and it distinguishes *expires today* from
*tradable today*.

### 8.4 Post-close accrual is a data-quality signal, not a session

**GXF22.** Cumulative volume can rise after the expiring book has closed — late or out-of-sequence
prints, corrections, EOD reconciliation. Measured: **+32** after 15:59:50 on a 0DTE SPXW that had
already ceased trading.

It goes to an **`after_close_revision`** counter surfaced in coverage. It is **never** folded into
`V_end` as trading, and it is **never** used to justify a longer window (`AN-V2`).

---

## 9. The pipeline — one worker, six views

```text
OPF frames (~2.4 s median)  +  underlying ticks
                │
                ▼
        hygiene · join spot (GXF12)          ── volume accounting bypasses hygiene (GXF14)
                │
                ▼
        roll detect → delta_volume (GXF15)
                │
                ▼
        row gex_oi (signed) · gex_vol (unsigned)
                │
                ├─► Profile  (current frame) ──► Node Card
                ├─► Surface  (current frame)
                └─► bucket store (1 m)
                         ├─► Pressure Field
                         ├─► Node Tape
                         └─► Session GEX Path
```

**GXF23 — one computation, six readers.** Profile and Card share one Profile computation; Path
consumes Profile summaries rather than recomputing; Field and Tape read the same bucket store. Two
tools that disagree about the same strike at the same instant is a defect, not a view
(**AT-GXF3**).

**GXF24 — template / lens / side / mode switching costs zero fetches.** Switching produces **zero**
chain HTTP and **zero** plane re-reads while the stream is healthy. *(HM2, HM3, HM21f;
**AT-GXF4**.)*

---

## 10. Planes — which tool reads what

Under **HM21**, a template may declare **one** server-owned auxiliary read plane. It still owns no
fetch: **the host resolves it** and delivers it as an input.

| Tool | Plane | Rationale |
|---|---|---|
| **GEX Profile** | none — live chain model | Current frame; extends the existing `gex` template |
| **Node Card** | none — derives from Profile | Scalar readout over the same computation |
| **GEX Surface** | `chain_multi_expiry` | **Multi-expiry is a non-goal of the current chain model** and blows the 250-contract single-page clamp. Needs a batch producer, on the SVP poller precedent |
| **Pressure Field** | `gex_session_bucket` | `(strike, time)` requires Γ per bucket, OI per session, spot track |
| **Node Tape** | `gex_session_bucket` | Same plane |
| **Session GEX Path** | `gex_session_bucket` | Same plane, aggregated |

**GXF25 — the bucket plane is `svp_v1`, not a new archive.** SVP already stores Γ per bucket, OI
once per session, and a per-bucket spot track — and stores them **for exactly this reason**
(SV61: carried from day one so history is replayable when the gamma surface opens). Standing up a
second capture of the same measurement is the failure `INSTRUCTIONS` §8 names.

**GXF26 — the plane's real shape, stated so no tool assumes otherwise:**

| Assumed | Actually holds (P-SV4 / P-SV5) |
|---|---|
| frames every ~2 s | median **~2.4 s** live; artifact clock **1 minute**; max named RTH gap **54.7 s** |
| full chain | **band(15 or 25 wings)**, changing *inside one morning* |
| an expiry axis | **0DTE only** — every archived snap is same-day expiry for its session date |
| clean sessions | **12 trading days**; **08-21 has 7,862 s of gaps** and is not `complete` |

**Therefore:** the three bucket-plane tools are real on the **live tail** and 1-minute-bucketed over
a **moving band** on back-select. **GEX Surface cannot be built on the existing archive at all** —
there is no expiry axis in it, so its plane requires a forward capture. That capture is this
toolset's `SVP2`-class problem: the client has no pagination and a full chain will page.

**GXF27 — auxiliary rows are never merged into the live chain model.** Delivered alongside
`ChainContext`, never into `calls` / `puts`. A member and an agent must always be able to tell a
live quote from an archive row. *(HM21d.)*

**GXF28 — plane failure is loud and local.** A plane that fails to resolve renders an explicit
error state for that tool. It never falls back to the live chain and calls the result the same
thing, and it never takes down the workspace. *(HM21g.)*

**GXF29 — a strike's first observation is a first sighting, not a burst of trading.** The band
varies intraday, so every strike carries `first_seen_at`. Session totals survive this because the
field is cumulative; **time-sliced modes are invalid for that strike before `first_seen_at`** and
render invalid rather than zero (`AN-V7`, SV66).

---

## 11. Storage

Inherits the SVP / VP storage law. **Nothing new is invented here.**

| Item | Law |
|---|---|
| Bulk SoR | The existing archive and its read API. **Do not build a parallel tree or a parallel reader** (SV67) |
| Mount | Under `LABS_MARKET_DATA_MOUNTS`, on an **existing role**. **Do not invent a mount role** (SV10) |
| Missing mount | Job and plane boot **fail loud per mount** |
| Retention | Raw frames **today only**; 1-minute aggregates **30 sessions**; daily recap JSON kept. Sizes measured, not assumed — **`P-GX1`** |
| Reader discipline | The capture volume can stall on metadata operations — measured **20–25 s**. Never on a live write or an interactive HTTP path (`AN-N5`) |
| Catalog | MySQL holds the catalog and job state, **not** bulk rows |

---

## 12. Coverage contract — the anomalies register is normative

**GXF30 — no naked value.** Every API 200, every artifact, and every rendered tool carries its
coverage object. A payload without one is **malformed, not degraded**.

```text
coverage = {
  session_date, symbol, expiration(s), scope,
  algo_version, sign_convention, scale, session_window,
  first_frame_at, last_frame_at,
  expected_buckets, observed_buckets, gap_count, max_gap_seconds,
  revision_count,
  roll_detected_at, roll_spread_seconds, unattributed_pre_roll,
  gap_spanned_buckets,              // GXF14
  after_close_revision,             // GXF22
  strike_scope, wings_seen[], strike_first_seen{},
  oi_asof,                          // AN-A2 — always
  live_tail_scope, last_poller_at, wing_clock_seconds,
  complete: bool
}
```

**GXF31 — declaration is layered, and the guide is the weakest layer.**

```text
L1  PAYLOAD   coverage on every response and artifact.  Malformed without it.
L2  SURFACE   persistent chrome strip. Always visible. Never a hover,
              never collapsed by default. This is the layer that works.
L3  GUIDE     the written explanation — Oscar's, per §16.
```

**GXF32 — deterministic facts are stated permanently; stochastic anomalies are counted per
session.** Roughly two-thirds of the register is deterministic — the day roll, OI staleness, the
two closing times, AM settlement, multiple sign crossings. Those are always true, so they are
always on the surface and need no counter. Gaps, revisions, hygiene drops and scope changes vary,
so they need a per-session count and would be taught into invisibility by a permanent label. Get it
backwards either way and the declaration stops working.

**GXF33 — absence of data is never zero.** Any gap, dropped row, null greek or out-of-band strike
renders an **invalid marker** — never a zero-length bar, never a zero-valued cell. This is the
single most important rendering rule in the toolset (`AN-N6`).

**GXF34 — disabled modes state their reason on the strip.** A silently greyed control teaches
nothing. *(SV57.)*

---

## 13. Copy law

**GXF35 — banned strings**, in copy, chrome, tooltips, legends, **payload field labels** and agent
tool descriptions: `pin` · `magnet` · `wall` · `support` · `resistance` · `gravitate` · `dealer
gamma` (unqualified) · *the* gamma flip · `zero gamma` (for an observed crossing).

**GXF36 — the banned step is mechanism → outcome.** This is not a vocabulary rule and cannot be
satisfied by synonyms. A tool may state what hedging **requires** under the stated convention. It
may **not** claim what price **does** as a result — no "positive GEX near spot means the move gets
faded", no "below the flip volatility expands", no "expansion risk, not pin". Those are contested
empirical claims about dealer behaviour Labs has not measured, and a member who sizes a position on
one because our chart implied it has been failed by us. *(SV48, SV52.)*

**GXF37 — no profit claims, ever.** Invariant 8. Process outcomes only.

**GXF38 — no side-of-trade fabrication.** Volume is never labelled long, short, bought, sold,
opening or closing — including in a payload field name (`AN-A3`, AT-SV18).

**GXF39 — every magnitude carries its fixture count.** "+0.52 % on one contract on one day", never
"+0.52 %". A single fixture stated as a bound is the error this whole discipline exists to prevent
(invariant 4).

**GXF40 — other companies' product names are not ours to ship.** Copying a transform is
unremarkable; shipping *Control Node*, *King / Queen*, *Defense Lines*, *GEX1–GEX5* or *TRACE* is a
different question, and it sits next to live FAT TAIL trademark work. Member-facing names are
Echo's, before any surface or Discord print. **OD-GXF2.**

---

## 14. Runner integration

Each tool is a registry template under the **existing** contract (Heatmap v0.3 §2.8), extended only
where the layout set requires it.

| Tool | Layout | Renderer |
|---|---|---|
| GEX Profile | `profile` | existing |
| GEX Surface | `matrix` | existing — expiry columns |
| Pressure Field | `matrix` | existing — **time** columns |
| Node Tape | `scatter` | **new** |
| Session GEX Path | `series` | **new** |
| Node Card | `card` | **new** — and see below |

**GXF41 — Node Card is an endpoint before it is a view.** It is a scalar object published as
JSON/SSE feeding "UI, bot, and journal". Its contract is the payload; the card is one renderer of
it. **OD-GXF3** settles whether it is a Runner template at all or a component that renders in the
Runner chrome without a grid.

**GXF42 — the shared row grid holds.** Any tool sharing a workspace row axis with another aligns to
one row height and one strike ordering. Independent scrolling of aligned regions is forbidden.
*(SV24 parity.)*

**GXF43 — density modes.** A tool sharing a workspace with a sibling template runs **Compact** —
row height equal to the sibling's, decoration surrendered first. **Comfort** when it is the primary
view. The active mode is **named on the surface**; nothing is dropped silently. *(SV56.)*

---

## 15. Analyzer handoff

**GXF44 — one direction, structures only.** A tool may emit a **structure** (legs, strikes, sides,
quantities) to the Analyzer for risk-graph and payoff display. The Analyzer never writes back into a
tool, and a tool never reads Analyzer state. *(Arch 29 §1.1 — Analyzer "may later consume structures
from Heatmap".)*

**GXF45 — a handoff is not an order.** Providers own checkout; the app never invents charges or
touches payments. A structure sent to the Analyzer is a candidate for inspection, and no copy may
frame it as a recommendation to trade.

**GXF46 — provenance travels with the structure.** Source tool id and version, `as_of`,
`algo_version`, `sign_convention` and the coverage object. A structure that arrives in the Analyzer
without the terms it was derived under is malformed.

---

## 16. Documentation ownership

**GXF47 — L3 belongs to Oscar.** Member user guides and wiki pages are the Knowledge Bench's
(**Oscar**), not the tool specs'. This document and the six tool specs own L1 and L2 — the payload
contract and the on-surface strip. Oscar owns the written explanation.

**What each tool spec must hand Oscar** (the seed contract, §5 of the seed packets):

1. What the number is — formula, units, sign convention **named as an assumption**
2. What it is not — the non-goals verbatim
3. Every coverage field in plain language, **with its measured magnitude and the date measured**
4. When to distrust the picture — the stochastic entries and what each looks like
5. What is always true — the deterministic entries

Guide copy is bound by **§13 in full**. A guide is not a place where the mechanism→outcome step
becomes acceptable because it has room to explain itself.

---

## 17. Security and access

| | |
|---|---|
| Session | `require_session` + tool-member read, as the chain ladder already does |
| Component gate | `entitlement_key` → plans via `provider_plan_map` (GXF4) |
| Universe gate | Enabled `market_symbol_universe` symbols only |
| New surfaces | **No new public unauthenticated stream.** The Node Card's SSE topic is authenticated and entitlement-gated like every other member stream |
| Agent parity | Agents read the same payload **including coverage** — an agent reading archive rows without scope and as-of is the same defect as a member doing it |

---

## 18. Non-goals

- Market-maker inventory (Periscope-class), participant split (MM / customer / firm), realized
  hedge flow (HIRO-class), or live official OI — **declined by name**, with the honest label stated
  instead: *OI-implied dealer GEX under standard sign assumption*
- Buy vs sell, opening vs closing, or dealer-side classification of volume
- A second chain client, a second Massive subscription, or a second template framework
- A second archive of a measurement the platform already captures
- MSC code or schemas
- Payment invention, order routing, or execution
- Any claim about what price will do

---

## 19. Open decisions — Coach Accept / Override at GX0

| # | Question | Recommendation |
|---|---|---|
| **OD-GXF1** | The **Options Lab Heatmap → Runner** rename: decision-log entry + documentation sweep across Arch 29, the Heatmap specs and `web/lib/options-lab/` | **Do it as its own change**, before the tool specs land, so seven documents are not written against two names |
| **OD-GXF2** | Member-facing component names (**GXF40**) | **Echo + Tango**, before any member surface. Ids are permanent (GXF3); labels are theirs |
| **OD-GXF3** | Is Node Card a Runner template, or a component that publishes without a grid? | **Endpoint first, card second** — its contract is the payload |
| **OD-GXF4** | `gex_v2` units freeze — the Heatmap owns it (SV60). **When does it land?** | Land it **before** GX2, or every tool ships under `gex_v1` labelling and relabels later |
| **OD-GXF5** | Which lens is the default? | **OI**, with the flow lens deliberate — flow is the more valuable and more dangerous idea |
| **OD-GXF6** | Is the flow lens in the first ship at all? | **Stage it.** It needs GXF15 correct and GXF11 accepted first |
| **OD-GXF7** | GEX Surface's forward capture — enabled `(symbol, expiration)` pairs | **Enumerate them.** Poller cost is linear in pairs; "the front expirations" is not a config value |
| **OD-GXF8** | Does a tool refuse to render on a not-complete session, or render marked? | **Render marked** — hiding a bad day teaches less than showing why it is bad |
| **OD-GXF9** | Component versioning: does a subscription auto-follow minor versions? | **No auto-follow on contract changes** (GXF6). Pin, and migrate deliberately |
| **OD-GXF10** | Near-zero thresholds per symbol | Config with boot abort; starting values `$50M` SPY / `$500M` SPX (**GXF17**) |

---

## 20. Probes — evidence before GO (invariant 4)

| ID | Probe | Blocks |
|---|---|---|
| **P-GX1** | Measured bytes per session for the bucket plane and raw frame retention | Retention decision in §11 |
| **P-GX2** | Confirm the day roll on a **dated** (non-0DTE) expiration once a wider capture exists | Turns GXF15's "pre-roll is yesterday" from inference into fact |
| **P-GX3** | Full-chain multi-expiry page count, latency and rate cost for the widest live case | Sizes the GEX Surface plane; proves the forward capture is affordable |
| **P-GX4** | Widen the vendor-daily reconcile to **≥5 contracts × ≥3 days**, reporting each delta **with its sign** | Any tolerance claim in `AN-V3`. If the sign inverts, the convention is not understood |
| **P-GX5** | Measured rate of quote-hygiene drops that span a bucket boundary | Bounds `AN-N3` from a mechanism to a number |

---

## 21. Review gates before GO

| Gate | Question this document must survive |
|---|---|
| **India** | Is "component in the Runner" the right boundary, or is this a product wearing a template's clothes? Is `svp_v1` genuinely the right plane for three of six? |
| **Echo + Tango** | Does a bleeding trader read these and learn something true, or does the set teach *heavy GEX ⇒ price pins here* whatever the copy says? |
| **Hotel** | **Would a member be made worse by believing a wrong version of this?** OI is not positioning; volume is not inventory; one expiration is not the market; a band wing is not zero. Each is a way to be wrong |
| **Mike** | Component entitlement, universe gate, the Node Card SSE topic — no new unauthenticated surface |
| **Foxtrot** | Forward-capture scheduling and rate isolation on the production host; the archive read never on an interactive path |
| **Delta** | Evidence pack: P-GX1–5, AT transcripts, browser walk on every tool |
| **Lima** | DL entry same day; Arch 29 companion updated; the rename (OD-GXF1) landed as its own decision |

---

## 22. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial foundation. Coach lock on what IKI Labs is (§0). Component model (§2). `gex_v1` reaffirmed, `gex_v2` consumed not defined (§3). Flow lens unsigned and renamed gamma-weighted flow (GXF11). Volume accounting separated from quote hygiene (GXF14). Roll detection before clamp (GXF15). `GexPolicy` (§7). Per-book session windows verified against Cboe (§8). Plane assignment under HM21 (§10). Coverage contract binding the anomalies register (§12). Copy law (§13). Analyzer handoff (§15). Oscar owns L3 (§16). OD-GXF1–10 · P-GX1–5 |

**One-line law:**
**Six subscribable components compute one quantity from one config object under one sign
convention, read planes the host resolves for them, never claim what price will do, and never
render a value without the terms it was derived under.**